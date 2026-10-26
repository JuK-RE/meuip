import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { languageAlternates, localizedPath, SITE_URL, staticPaths } from "@/lib/site";
import { allDocSlugs } from "@/lib/docs";
import { tools } from "@/lib/tools";

const abs = (path: string) => `${SITE_URL}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...staticPaths, ...tools.map((t) => `/tools/${t.slug}`), ...allDocSlugs.map((s) => `/docs/${s}`)];
  const lastModified = new Date();
  return paths.flatMap((path) =>
    locales.map((lang) => ({
      url: abs(localizedPath(lang, path)),
      lastModified,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path.startsWith("/tools/") || path === "/developers" ? 0.8 : 0.5,
      alternates: {
        languages: Object.fromEntries(Object.entries(languageAlternates(path)).map(([k, v]) => [k, abs(v)])),
      },
    })),
  );
}
