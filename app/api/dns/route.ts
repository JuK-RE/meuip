import { isIP } from "node:net";
import dns from "node:dns/promises";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost } from "@/lib/net-guard";

const RESOLVERS: Record<string, string[] | undefined> = {
  system: undefined,
  cloudflare: ["1.1.1.1", "1.0.0.1"],
  google: ["8.8.8.8", "8.8.4.4"],
  quad9: ["9.9.9.9"],
  opendns: ["208.67.222.222"],
};

const TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA", "SRV", "PTR"] as const;
type RecordType = (typeof TYPES)[number];

export type DnsRecord = { type: RecordType; value: string; ttl?: number; priority?: number };

async function query(resolver: dns.Resolver, name: string, type: RecordType): Promise<DnsRecord[]> {
  switch (type) {
    case "A":
    case "AAAA": {
      const rows = type === "A" ? await resolver.resolve4(name, { ttl: true }) : await resolver.resolve6(name, { ttl: true });
      return rows.map((r) => ({ type, value: r.address, ttl: r.ttl }));
    }
    case "MX":
      return (await resolver.resolveMx(name)).map((r) => ({ type, value: r.exchange, priority: r.priority }));
    case "TXT":
      return (await resolver.resolveTxt(name)).map((r) => ({ type, value: r.join("") }));
    case "NS":
      return (await resolver.resolveNs(name)).map((value) => ({ type, value }));
    case "CNAME":
      return (await resolver.resolveCname(name)).map((value) => ({ type, value }));
    case "PTR":
      return (await resolver.resolvePtr(name)).map((value) => ({ type, value }));
    case "SOA": {
      const s = await resolver.resolveSoa(name);
      return [{ type, value: `${s.nsname} ${s.hostmaster} ${s.serial} ${s.refresh} ${s.retry} ${s.expire} ${s.minttl}`, ttl: s.minttl }];
    }
    case "CAA":
      return (await resolver.resolveCaa(name)).map((r) => {
        const tag = (["issue", "issuewild", "iodef", "contactemail", "contactphone"] as const).find((t) => r[t] !== undefined);
        return { type, value: `${r.critical} ${tag ?? "?"} "${tag ? r[tag] : ""}"` };
      });
    case "SRV":
      return (await resolver.resolveSrv(name)).map((r) => ({
        type,
        value: `${r.name}:${r.port} (peso ${r.weight})`,
        priority: r.priority,
      }));
  }
}

export const GET = apiRoute(async (_req, { params }) => {
  const input = parseHost(params.get("name"));
  const requested = (params.get("type") ?? "ALL").toUpperCase();
  const wanted = requested.split(",").map((t) => t.trim()).filter(Boolean);
  const types: readonly RecordType[] =
    requested === "ALL" ? TYPES.filter((t) => t !== "PTR" && t !== "SRV") : TYPES.filter((t) => wanted.includes(t));
  if (!types.length) throw new ApiError("invalidType");

  const resolverKey = params.get("resolver") ?? "system";
  if (!(resolverKey in RESOLVERS)) throw new ApiError("invalidResolver");
  const resolver = new dns.Resolver({ timeout: 3000, tries: 2 });
  const servers = RESOLVERS[resolverKey];
  if (servers) resolver.setServers(servers);

  // IP digitado → consulta reversa (PTR) no domínio in-addr.arpa
  if (isIP(input)) {
    const ptr = await resolver.reverse(input).catch(() => [] as string[]);
    return { name: input, resolver: resolverKey, ms: 0, records: ptr.map((value) => ({ type: "PTR", value })) };
  }
  const started = performance.now();
  const results = await Promise.all(
    types.map((t) =>
      query(resolver, input, t).catch((e: NodeJS.ErrnoException) => {
        if (e.code === "ENODATA" || e.code === "ENOTFOUND" || e.code === "NOTFOUND") return [];
        if (e.code === "ESERVFAIL" || e.code === "ETIMEOUT" || e.code === "ECONNREFUSED") throw new ApiError("dnsTimeout", 502);
        return [];
      }),
    ),
  );
  return { name: input, resolver: resolverKey, ms: Math.round(performance.now() - started), records: results.flat() };
});
