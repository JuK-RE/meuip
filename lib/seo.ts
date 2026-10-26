import type { Metadata } from "next";
import type { Locale } from "./i18n/config";
import { locales } from "./i18n/config";
import { languageAlternates, localizedPath, OG_LOCALE } from "./site";

/**
 * Metadata completa de uma página: título, descrição, canonical, hreflang,
 * Open Graph e Twitter. A imagem de compartilhamento vem de app/[lang]/opengraph-image.tsx.
 */
export function pageMetadata({ lang, path, title, description, absolute = false }: { lang: Locale; path: string; title: string; description: string; absolute?: boolean }): Metadata {
  const url = localizedPath(lang, path);
  const full = absolute ? title : `${title} | Meu IP`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: "Meu IP",
      title: full,
      description,
      url,
      locale: OG_LOCALE[lang],
      alternateLocale: locales.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
    },
    twitter: { card: "summary_large_image", title: full, description },
  };
}
