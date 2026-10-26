import dns from "node:dns/promises";
import { isIP } from "node:net";
import { domainToASCII } from "node:url";
import type { Dict } from "./i18n/dictionaries";

/**
 * Erro "esperado" das APIs. `key` é a chave em `errors` dos dicionários
 * (a tradução acontece em apiRoute, no idioma de quem chamou) e `args`
 * preenche os {0}, {1} do texto.
 */
export class ApiError extends Error {
  args: (string | number)[];
  constructor(
    public key: keyof Dict["errors"],
    public status = 400,
    ...args: (string | number)[]
  ) {
    super(key);
    this.args = args;
  }
}

export type Target = {
  /** Host como o usuário digitou (já normalizado, em ASCII). */
  hostname: string;
  /** IP público pra onde vamos realmente conectar. */
  address: string;
  family: 4 | 6;
};

function expandIPv6(ip: string): number[] | null {
  let addr = ip.split("%")[0];
  // sufixo IPv4 embutido (::ffff:1.2.3.4)
  const v4 = addr.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    addr = addr.slice(0, v4.index) + ((a << 8) | b).toString(16) + ":" + ((c << 8) | d).toString(16);
  }
  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  const nums = groups.map((g) => parseInt(g, 16));
  return nums.length === 8 && nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff) ? nums : null;
}

function isPrivateV4(ip: string): boolean {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 || // multicast, reservado e broadcast
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

/** true para loopback, rede local, CGNAT, documentação e demais faixas não roteáveis. */
export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateV4(ip);
  if (kind !== 6) return true;
  const g = expandIPv6(ip);
  if (!g) return true;
  const embedded = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  if (g.slice(0, 5).every((n) => n === 0) && g[5] === 0xffff) return isPrivateV4(embedded(g[6], g[7])); // ::ffff:a.b.c.d
  if (g.slice(0, 6).every((n) => n === 0)) return true; // ::, ::1 e IPv4-compatible
  if (g[0] === 0x64 && g[1] === 0xff9b) return isPrivateV4(embedded(g[6], g[7])); // NAT64
  if (g[0] === 0x2002) return isPrivateV4(embedded(g[1], g[2])); // 6to4
  return (
    (g[0] & 0xffc0) === 0xfe80 || // link-local
    (g[0] & 0xfe00) === 0xfc00 || // ULA
    (g[0] & 0xff00) === 0xff00 || // multicast
    (g[0] === 0x2001 && g[1] === 0x0db8) || // documentação
    (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) // discard
  );
}

const HOST_RE = /^(?=.{1,253}$)([a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Aceita "exemplo.com", "https://exemplo.com:8443/x", "[2001:db8::1]" ou um IP
 * e devolve só o host em ASCII. Lança ApiError se não for um host válido.
 */
export function parseHost(input: string | null | undefined): string {
  let raw = (input ?? "").trim();
  if (!raw) throw new ApiError("hostRequired");
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    try {
      raw = new URL(raw).hostname;
    } catch {
      throw new ApiError("invalidAddress");
    }
  }
  raw = raw.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (isIP(raw)) return raw.toLowerCase();
  // "host:porta" e "host/caminho" — descartamos o resto
  raw = raw.split("/")[0].replace(/:\d+$/, "");
  const ascii = domainToASCII(raw).toLowerCase();
  if (!ascii || !HOST_RE.test(ascii)) throw new ApiError("invalidDomain");
  return ascii;
}

/**
 * Resolve o host e devolve um IP *público*. Conectamos sempre nesse IP (e não
 * no nome), então um DNS que troca de resposta entre a checagem e a conexão
 * não consegue nos levar para a rede interna.
 */
export async function resolvePublicTarget(host: string): Promise<Target> {
  const kind = isIP(host);
  if (kind) {
    if (isPrivateAddress(host)) {
      throw new ApiError("privateAddr", 403);
    }
    return { hostname: host, address: host, family: kind as 4 | 6 };
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new ApiError("cannotResolve", 404, host);
  }
  const pub = addrs.find((a) => !isPrivateAddress(a.address));
  if (!pub) {
    throw new ApiError("privateDomain", 403);
  }
  return { hostname: host, address: pub.address, family: pub.family as 4 | 6 };
}
