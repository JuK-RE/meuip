import type { Locale } from "./i18n/config";
import { getDict } from "./i18n/dictionaries";
import { en } from "./i18n/docs/en";
import { es } from "./i18n/docs/es";
import { fr } from "./i18n/docs/fr";
import { pt } from "./i18n/docs/pt";
import { articleSlugs, type Article, type ArticleSlug, type Block } from "./i18n/docs/types";
import { endpoints } from "./api-docs";
import { tools } from "./tools";

const articles: Record<Locale, Record<ArticleSlug, Article>> = { pt, en, es, fr };

export type DocGroupKey = "start" | "tools" | "guides" | "dev";
export type DocPage = { slug: string; group: DocGroupKey; title: string; description: string; blocks: Block[] };

/** Ordem do menu lateral: grupo e artigos de cada grupo. Os artigos de ferramenta vêm dos dicionários. */
const groupOrder: { key: DocGroupKey; slugs: string[] }[] = [
  { key: "start", slugs: ["introduction"] },
  { key: "tools", slugs: tools.map((t) => `tools/${t.slug}`) },
  { key: "guides", slugs: ["public-ip", "port-forwarding", "dns-records", "ssl-certificates"] },
  { key: "dev", slugs: ["devs", "api-reference", "streaming", "recipes", "limits-and-errors"] },
];

export const allDocSlugs = groupOrder.flatMap((g) => g.slugs);

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function getDocPage(locale: Locale, slug: string): DocPage | null {
  const group = groupOrder.find((g) => g.slugs.includes(slug))?.key;
  if (!group) return null;
  const t = getDict(locale);

  if (slug.startsWith("tools/")) {
    const toolSlug = slug.slice(6) as (typeof tools)[number]["slug"];
    const text = t.tools[toolSlug];
    return {
      slug,
      group,
      title: text.title,
      description: text.description,
      blocks: [
        ...text.about.map((p): Block => ({ t: "p", text: p })),
        {
          t: "links",
          items: [
            { label: t.docs.open, href: `/${locale}/tools/${toolSlug}` },
            { label: t.docs.useApi, href: `/${locale}/developers#${toolSlug}` },
          ],
        },
      ],
    };
  }
  if (slug === "api-reference") {
    const d = t.dev;
    const blocks: Block[] = [{ t: "p", text: d.quickText }];
    for (const e of endpoints) {
      blocks.push(
        { t: "h2", text: t.tools[e.tool].title },
        { t: "p", text: t.tools[e.tool].description },
        { t: "code", code: `GET ${e.path}\n${e.params.map((p) => `  ${p.name}${p.optional ? ` (${d.optional})` : ""}: ${p.example}${p.note ? `  [${p.note}]` : ""}`).join("\n")}`.trimEnd() },
        { t: "code", code: `curl${e.stream ? " -N" : ""} "https://meuip.juk.re${e.example}"` },
        { t: "code", code: e.response },
      );
    }
    blocks.push({ t: "links", items: [{ label: d.title, href: `/${locale}/developers` }] });
    return { slug, group, title: t.docs.apiReference, description: t.docs.apiReferenceDesc, blocks };
  }
  const article = articles[locale][slug as ArticleSlug];
  if (!article) return null;
  // links escritos como "/developers" ganham o prefixo do idioma
  const blocks = article.blocks.map((b): Block =>
    b.t === "links" ? { ...b, items: b.items.map((i) => ({ ...i, href: i.href.startsWith("/") ? `/${locale}${i.href}` : i.href })) } : b,
  );
  return { slug, group, ...article, blocks };
}

export function docNav(locale: Locale) {
  const t = getDict(locale).docs;
  return groupOrder.map((g) => ({
    key: g.key,
    title: t.groups[g.key],
    items: g.slugs.map((slug) => ({ slug, title: getDocPage(locale, slug)!.title })),
  }));
}

export function blockText(b: Block): string {
  switch (b.t) {
    case "ul":
    case "ol":
      return b.items.join(" ");
    case "links":
      return b.items.map((i) => i.label).join(" ");
    case "code":
      return b.code;
    default:
      return b.text;
  }
}

/** Índice da busca: título, grupo e texto de cada página. */
export function searchIndex(locale: Locale) {
  const nav = docNav(locale);
  return nav.flatMap((g) =>
    g.items.map((i) => {
      const page = getDocPage(locale, i.slug)!;
      return { slug: i.slug, title: i.title, group: g.title, text: `${page.description} ${page.blocks.map(blockText).join(" ")}` };
    }),
  );
}

/** Página em Markdown, para o botão "copiar página". */
export function toMarkdown(page: DocPage): string {
  const body = page.blocks.map((b) => {
    switch (b.t) {
      case "h2":
        return `## ${b.text}`;
      case "ul":
        return b.items.map((i) => `- ${i}`).join("\n");
      case "ol":
        return b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
      case "note":
        return `> ${b.text}`;
      case "code":
        return "```\n" + b.code + "\n```";
      case "links":
        return b.items.map((i) => `- [${i.label}](${i.href})`).join("\n");
      default:
        return b.text;
    }
  });
  return [`# ${page.title}`, page.description, ...body].join("\n\n");
}

export { articleSlugs };
