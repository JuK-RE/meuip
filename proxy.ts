import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, pickLocale } from "@/lib/i18n/config";

// Sem prefixo de idioma na URL, redireciona para /pt, /en, /es ou /fr
// conforme o cookie do último idioma escolhido ou o Accept-Language.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (hasLocale(first)) return;

  const saved = request.cookies.get("lang")?.value;
  const locale = saved && hasLocale(saved) ? saved : pickLocale(request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // pula API, arquivos internos do Next e arquivos com extensão (favicon, imagens)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
