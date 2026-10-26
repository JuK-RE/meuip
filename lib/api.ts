import type { NextRequest } from "next/server";
import { fmt, pickLocale, type Locale } from "./i18n/config";
import { getDict } from "./i18n/dictionaries";
import { ApiError } from "./net-guard";

/**
 * IP do visitante. Atrás de proxy/CDN (Cloudflare, nginx) vem nos headers; sem
 * proxy esses headers podem ser forjados, então configure o proxy pra sobrescrevê-los.
 */
export function clientIp(headers: Headers): string {
  const raw =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0] ??
    "";
  return raw.trim().replace(/^::ffff:/i, "") || "127.0.0.1";
}

/** Idioma de quem chamou: header x-lang (mandado pelo site) ou Accept-Language. */
export function requestLocale(headers: Headers): Locale {
  return pickLocale(headers.get("x-lang") ?? headers.get("accept-language"));
}

// Limite por IP, em memória: vale por processo (basta pra uma instância só;
// com várias réplicas troque por Redis ou similar).
const WINDOW_MS = 60_000;
const LIMIT = 30;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string): number {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return 0;
  }
  entry.count++;
  return entry.count > LIMIT ? Math.ceil((entry.reset - now) / 1000) : 0;
}

type Ctx = { ip: string; params: URLSearchParams; locale: Locale };
type Handler = (req: NextRequest, ctx: Ctx) => Promise<unknown>;

/**
 * Envolve um handler GET: rate limit, JSON sem cache e erros traduzidos.
 * Se o handler devolver uma Response (ex.: streaming do ping), ela passa direto.
 */
export function apiRoute(handler: Handler) {
  return async (req: NextRequest) => {
    const ip = clientIp(req.headers);
    const locale = requestLocale(req.headers);
    const errors = getDict(locale).errors;
    const retry = rateLimit(ip);
    if (retry) {
      return Response.json({ error: errors.tooManyRequests }, { status: 429, headers: { "Retry-After": String(retry) } });
    }
    try {
      const data = await handler(req, { ip, params: req.nextUrl.searchParams, locale });
      if (data instanceof Response) return data;
      return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      if (e instanceof ApiError) return Response.json({ error: fmt(errors[e.key], ...e.args) }, { status: e.status });
      console.error(e);
      return Response.json({ error: errors.internal }, { status: 500 });
    }
  };
}
