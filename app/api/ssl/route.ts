import { X509Certificate } from "node:crypto";
import tls from "node:tls";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost, resolvePublicTarget } from "@/lib/net-guard";
import { isIP } from "node:net";

const TIMEOUT_MS = 6000;
const PROBE_TIMEOUT_MS = 2500; // servidores que ignoram protocolos legados só calam, então a sondagem tem prazo curto
const VERSIONS = ["TLSv1", "TLSv1.1", "TLSv1.2", "TLSv1.3"] as const;

function cn(dn: string): string {
  return dn.match(/CN=([^\n]+)/)?.[1] ?? dn.split("\n")[0] ?? "";
}

function describe(raw: Buffer) {
  const x = new X509Certificate(raw);
  return {
    subject: cn(x.subject),
    issuer: cn(x.issuer),
    validFrom: new Date(x.validFrom).toISOString(),
    validTo: new Date(x.validTo).toISOString(),
    serial: x.serialNumber,
    fingerprint256: x.fingerprint256,
    san: x.subjectAltName?.split(/,\s*/).map((s) => s.replace(/^DNS:/, "")) ?? [],
    keyType: x.publicKey.asymmetricKeyType ?? null,
    keyBits:
      x.publicKey.asymmetricKeyDetails?.modulusLength ??
      (x.publicKey.asymmetricKeyDetails?.namedCurve ?? null),
    isCa: x.ca,
  };
}

/** Handshake completo; devolve o socket já conectado. */
function connect(address: string, port: number, servername: string | undefined, opts: tls.ConnectionOptions = {}, timeoutMs = TIMEOUT_MS) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const socket = tls.connect({
      host: address,
      port,
      servername,
      rejectUnauthorized: false,
      ALPNProtocols: ["h2", "http/1.1"],
      ...opts,
    });
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      reject(new ApiError("tlsTimeout", 504));
    });
    socket.once("secureConnect", () => resolve(socket));
    socket.once("error", (e) => reject(e));
  });
}

async function supports(address: string, port: number, servername: string | undefined, version: string) {
  try {
    const s = await connect(address, port, servername, {
      minVersion: version as tls.SecureVersion,
      maxVersion: version as tls.SecureVersion,
      ciphers: "ALL:@SECLEVEL=0", // deixa o cliente falar protocolos legados só pra sondar
    }, PROBE_TIMEOUT_MS);
    s.destroy();
    return true;
  } catch {
    return false;
  }
}

export const GET = apiRoute(async (_req, { params }) => {
  const hostname = parseHost(params.get("host"));
  const port = Number(params.get("port") || 443);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ApiError("invalidPort");
  const target = await resolvePublicTarget(hostname);
  const servername = isIP(hostname) ? undefined : hostname;

  const started = performance.now();
  const socket = await connect(target.address, port, servername).catch((e: NodeJS.ErrnoException) => {
    if (e instanceof ApiError) throw e;
    throw e.code === "ECONNREFUSED"
      ? new ApiError("connRefused", 502, port)
      : new ApiError("tlsFail", 502, e.code ?? e.message);
  });
  const handshakeMs = Math.round(performance.now() - started);

  const leaf = socket.getPeerCertificate(true);
  const chain: ReturnType<typeof describe>[] = [];
  const seen = new Set<string>();
  for (let c = leaf; c?.raw && !seen.has(c.fingerprint256); c = c.issuerCertificate) {
    seen.add(c.fingerprint256);
    chain.push(describe(c.raw));
  }
  if (!chain.length) {
    socket.destroy();
    throw new ApiError("noCert", 502);
  }

  const x509 = new X509Certificate(leaf.raw);
  const matchesHost = servername ? x509.checkHost(servername) !== undefined : x509.checkIP(hostname) !== undefined;
  const cipher = socket.getCipher();
  const result = {
    host: hostname,
    port,
    address: target.address,
    handshakeMs,
    protocol: socket.getProtocol(),
    cipher: cipher.name,
    alpn: socket.alpnProtocol || null,
    trusted: socket.authorized,
    trustError: socket.authorized ? null : (socket.authorizationError?.toString() ?? "desconhecido"),
    matchesHost,
    daysLeft: Math.floor((new Date(x509.validTo).getTime() - Date.now()) / 86_400_000),
    certificate: chain[0],
    chain,
  };
  socket.destroy();

  const flags = await Promise.all(VERSIONS.map((v) => supports(target.address, port, servername, v)));
  return { ...result, protocols: VERSIONS.map((version, i) => ({ version, supported: flags[i] })) };
});
