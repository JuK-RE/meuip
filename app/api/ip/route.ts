import { isIP } from "node:net";
import dns from "node:dns/promises";
import { apiRoute } from "@/lib/api";
import { isPrivateAddress } from "@/lib/net-guard";

export const GET = apiRoute(async (req, { ip, params }) => {
  // ?format=text devolve só o IP, bom para scripts: curl "https://meuip.juk.re/api/ip?format=text"
  if (params.get("format") === "text") {
    return new Response(ip + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
  let hostname: string | null = null;
  if (isIP(ip) && !isPrivateAddress(ip)) {
    hostname = await Promise.race([
      dns.reverse(ip).then((r) => r[0] ?? null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]).catch(() => null);
  }
  return {
    ip,
    version: isIP(ip) || null,
    hostname,
    userAgent: req.headers.get("user-agent"),
    language: req.headers.get("accept-language")?.split(",")[0] ?? null,
  };
});
