import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost, resolvePublicTarget } from "@/lib/net-guard";

const MAX_REDIRECTS = 5;
const MAX_BODY = 64 * 1024;
const TIMEOUT_MS = 10_000;
const USER_AGENT = "meuip.juk.re/2.0 (+https://meuip.juk.re)";

type Hop = {
  url: string;
  address: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timing: { dns: number; connect: number; tls: number | null; ttfb: number; total: number };
};

function request(url: URL, method: string, address: string, dnsMs: number, extra: Record<string, string>) {
  return new Promise<{ hop: Hop; body: Buffer; truncated: boolean }>((resolve, reject) => {
    const secure = url.protocol === "https:";
    const t0 = performance.now();
    let tConnect = 0;
    let tTls: number | null = null;
    const lib = secure ? https : http;
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const req = lib.request(
      {
        host: address, // IP já validado: ignora um novo lookup de DNS
        port: url.port || (secure ? 443 : 80),
        path: url.pathname + url.search,
        method,
        servername: secure && !isIP(host) ? host : undefined,
        headers: { "User-Agent": USER_AGENT, Accept: "*/*", ...extra, Host: url.host, "Accept-Encoding": "identity" },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const ttfb = performance.now() - t0;
        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        const finish = () =>
          resolve({
            body: Buffer.concat(chunks),
            truncated,
            hop: {
              url: url.href,
              address,
              status: res.statusCode ?? 0,
              statusText: res.statusMessage ?? "",
              headers: Object.fromEntries(
                Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : (v ?? "")]),
              ),
              timing: {
                dns: Math.round(dnsMs),
                connect: Math.round(tConnect),
                tls: tTls === null ? null : Math.round(tTls),
                ttfb: Math.round(ttfb),
                total: Math.round(performance.now() - t0),
              },
            },
          });
        res.on("data", (c: Buffer) => {
          if (truncated) return;
          size += c.length;
          chunks.push(c);
          if (size > MAX_BODY) {
            truncated = true;
            res.destroy();
            finish();
          }
        });
        res.once("end", () => !truncated && finish());
        res.once("error", (e) => !truncated && reject(e));
      },
    );
    req.once("socket", (socket) => {
      socket.once("connect", () => (tConnect = performance.now() - t0));
      socket.once("secureConnect", () => (tTls = performance.now() - t0 - tConnect));
    });
    req.once("timeout", () => req.destroy(new ApiError("reqTimeout", 504)));
    req.once("error", (e: NodeJS.ErrnoException) =>
      reject(e instanceof ApiError ? e : new ApiError("reqFail", 502, e.code ?? e.message)),
    );
    req.end();
  });
}

function isText(type: string) {
  return /^text\/|json|xml|javascript|svg|x-www-form-urlencoded/i.test(type);
}

const FORBIDDEN_HEADERS = new Set(["host", "content-length", "transfer-encoding", "connection", "upgrade", "te", "trailer", "proxy-authorization"]);

/** Cabeçalhos extras vêm como `h=Nome: valor` (repetido) e cookies como `cookie=nome=valor`. */
function extraHeaders(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = params.getAll("h");
  const cookies = params.getAll("cookie");
  if (lines.length + cookies.length > 20) throw new ApiError("tooManyHeaders");
  for (const line of lines) {
    const i = line.indexOf(":");
    const name = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (i < 1 || !/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) throw new ApiError("invalidHeader", 400, line.slice(0, 40));
    if (FORBIDDEN_HEADERS.has(name)) throw new ApiError("forbiddenHeader", 400, name);
    if (/[\r\n\0]/.test(value) || value.length > 4096) throw new ApiError("invalidHeaderValue", 400, name);
    out[name] = value;
  }
  if (cookies.length) {
    if (cookies.some((c) => /[\r\n\0]/.test(c))) throw new ApiError("invalidCookie");
    out.cookie = cookies.join("; ");
  }
  return out;
}

export const GET = apiRoute(async (_req, { params }) => {
  const extra = extraHeaders(params);
  const rawUrl = (params.get("url") ?? "").trim();
  const method = (params.get("method") ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") throw new ApiError("methodUnsupported");

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new ApiError("invalidUrl");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ApiError("onlyHttp");
  if (url.username || url.password) throw new ApiError("noCreds");

  const hops: Hop[] = [];
  for (let i = 0; ; i++) {
    const tDns = performance.now();
    const target = await resolvePublicTarget(parseHost(url.hostname));
    const { hop, body, truncated } = await request(url, method, target.address, performance.now() - tDns, i === 0 ? extra : {});
    hops.push(hop);

    const location = hop.headers.location;
    if (hop.status >= 300 && hop.status < 400 && location) {
      if (i >= MAX_REDIRECTS) throw new ApiError("redirectLimit", 508, MAX_REDIRECTS);
      try {
        url = new URL(location, url);
      } catch {
        throw new ApiError("redirectInvalid", 502);
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new ApiError("redirectProto", 502);
      continue;
    }

    const type = hop.headers["content-type"] ?? "";
    const text = method === "GET" && body.length && isText(type) ? body.toString("utf8") : null;
    return { hops, final: hop, body: text, bodyBytes: body.length, truncated, binary: method === "GET" && body.length > 0 && text === null };
  }
});
