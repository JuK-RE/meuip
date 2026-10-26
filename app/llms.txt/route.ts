import { getDict } from "@/lib/i18n/dictionaries";
import { locales, localeNames } from "@/lib/i18n/config";
import { allDocSlugs, getDocPage } from "@/lib/docs";
import { endpoints } from "@/lib/api-docs";
import { localizedPath, SITE_URL } from "@/lib/site";
import { tools } from "@/lib/tools";

// Arquivo para assistentes de IA (llmstxt.org), gerado a partir dos dicionários.
// Sem dados de requisição, o Next gera o arquivo no build.

export function GET() {
  const en = getDict("en");
  const url = (path: string) => `${SITE_URL}${localizedPath("en", path)}`;

  const lines = [
    "# Meu IP",
    "",
    `> ${en.meta.description}`,
    "",
    "Meu IP (meuip.juk.re) is a free set of network tools by JUCA Soft, part of the JUK.re ecosystem. No account needed. Lookups run from our server, addresses you search are not stored, and requests to private or reserved addresses are blocked. The site is available in Portuguese, English, Spanish and French.",
    "",
    "## Tools",
    "",
    ...tools.map((t) => `- [${en.tools[t.slug].title}](${url(`/tools/${t.slug}`)}): ${en.tools[t.slug].description}`),
    "",
    "## Docs",
    "",
    `- [${en.docs.title}](${url("/docs")}): ${en.docs.lead}`,
    ...allDocSlugs.filter((s) => !s.startsWith("tools/")).map((s) => `- [${getDocPage("en", s)!.title}](${url(`/docs/${s}`)}): ${getDocPage("en", s)!.description}`),
    `- [${en.dev.title}](${url("/developers")}): ${en.dev.sub} Code samples in cURL, JavaScript, Python, PHP, Go, Ruby, C# and PowerShell.`,
    `- [${en.about.title}](${url("/about")}): ${en.about.lead}`,
    "",
    "## HTTP API",
    "",
    `Base URL: ${SITE_URL}. All endpoints are GET and return JSON, except /api/ping, which streams plain text. Limit: 30 requests per minute per IP.`,
    "",
    ...endpoints.map((e) => `- \`GET ${e.path}\`: ${en.tools[e.tool].title}. Example: \`${SITE_URL}${e.example}\``),
    "",
    "## Optional",
    "",
    ...locales.filter((l) => l !== "en").map((l) => `- [${localeNames[l]}](${SITE_URL}${localizedPath(l, "")}): home page in ${localeNames[l]}`),
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
