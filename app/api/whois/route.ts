import net, { isIP } from "node:net";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost, resolvePublicTarget } from "@/lib/net-guard";

const MAX_BYTES = 200_000;
const MAX_HOPS = 3;

// Alguns registros (ex.: Registro.br) respondem em ISO-8859-1; se não for UTF-8 válido, caímos nele.
function decode(buf: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return buf.toString("latin1");
  }
}

async function ask(server: string, query: string): Promise<string> {
  const target = await resolvePublicTarget(parseHost(server));
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: target.address, port: 43 });
    const chunks: Buffer[] = [];
    let size = 0;
    socket.setTimeout(8000, () => socket.destroy(new ApiError("whoisTimeout", 504, server)));
    socket.once("connect", () => socket.write(`${query}\r\n`));
    socket.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BYTES) return socket.destroy();
      chunks.push(c);
    });
    socket.once("error", (e) => reject(e instanceof ApiError ? e : new ApiError("whoisFail", 502, server)));
    socket.once("close", () => resolve(decode(Buffer.concat(chunks))));
  });
}

/** Próximo servidor indicado na resposta (IANA "refer:", registrar WHOIS ou ARIN "ReferralServer"). */
function referral(text: string, current: string): string | null {
  const m =
    text.match(/^\s*refer:\s*(\S+)/im) ??
    text.match(/^\s*Registrar WHOIS Server:\s*(\S+)/im) ??
    text.match(/^\s*ReferralServer:\s*(?:r?whois:\/\/)?([^\s:/]+)/im);
  const next = m?.[1]?.toLowerCase().replace(/^whois:\/\//, "");
  return next && next !== current ? next : null;
}

export const GET = apiRoute(async (_req, { params }) => {
  const query = parseHost(params.get("q"));
  const isAddress = isIP(query) !== 0;
  if (isAddress) await resolvePublicTarget(query); // recusa IPs privados

  const steps: { server: string; text: string }[] = [];
  let server = "whois.iana.org";
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const text = await ask(server, query);
    steps.push({ server, text: text.trim() });
    const next = referral(text, server);
    if (!next) break;
    server = next;
  }
  const answer = steps.length > 1 ? steps[steps.length - 1] : steps[0];
  if (!answer.text) throw new ApiError("noWhois", 404);
  return { query, type: isAddress ? "ip" : "domain", server: answer.server, text: answer.text, chain: steps.map((s) => s.server) };
});
