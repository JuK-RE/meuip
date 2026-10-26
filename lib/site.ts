import { defaultLocale, locales, type Locale } from "./i18n/config";

/** Endereço público do site. Em outro domínio, defina NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://meuip.juk.re").replace(/\/$/, "");

export const OG_LOCALE: Record<Locale, string> = { pt: "pt_BR", en: "en_US", es: "es_ES", fr: "fr_FR" };

/** Caminhos do site sem o prefixo de idioma ("" é a home). */
export const staticPaths = ["", "/about", "/docs", "/developers"] as const;

export const localizedPath = (lang: Locale, path: string) => `/${lang}${path}`;

/** hreflang de uma página: um link por idioma, mais x-default apontando para o idioma padrão. */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [l, localizedPath(l, path)])),
    "x-default": localizedPath(defaultLocale, path),
  };
}
