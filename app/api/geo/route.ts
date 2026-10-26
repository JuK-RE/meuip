import { isIP } from "node:net";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost, resolvePublicTarget } from "@/lib/net-guard";

type IpWhoIs = {
  success: boolean;
  message?: string;
  ip: string;
  type: string;
  continent: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  postal: string;
  latitude: number;
  longitude: number;
  flag?: { emoji: string };
  connection: { asn: number; org: string; isp: string; domain: string };
  timezone: { id: string; utc: string };
};

// Dados de geolocalização vêm do ipwho.is (gratuito, HTTPS). Para trocar de
// provedor (ex.: MaxMind local), basta mudar este arquivo, o formato da
// resposta da nossa API fica o mesmo.
export const GET = apiRoute(async (_req, { ip, params, locale }) => {
  const query = params.get("q")?.trim();
  const target = await resolvePublicTarget(query ? parseHost(query) : ip);

  const res = await fetch(`https://ipwho.is/${encodeURIComponent(target.address)}?lang=${locale === "pt" ? "pt-BR" : locale}`, {
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(6000),
  }).catch(() => null);
  if (!res?.ok) throw new ApiError("geoDown", 502);
  const d = (await res.json()) as IpWhoIs;
  if (!d.success) throw new ApiError("geoNotFound", 404);

  return {
    query: query || null,
    ip: d.ip,
    version: isIP(d.ip),
    continent: d.continent,
    country: d.country,
    countryCode: d.country_code,
    flag: d.flag?.emoji ?? null,
    region: d.region,
    city: d.city,
    postal: d.postal,
    latitude: d.latitude,
    longitude: d.longitude,
    timezone: d.timezone?.id ?? null,
    utcOffset: d.timezone?.utc ?? null,
    asn: d.connection?.asn ?? null,
    org: d.connection?.org ?? null,
    isp: d.connection?.isp ?? null,
    domain: d.connection?.domain ?? null,
  };
});
