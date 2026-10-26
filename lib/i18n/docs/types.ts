/** Blocos de conteúdo dos artigos da documentação. Iguais em todos os idiomas. */
export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "note"; text: string }
  | { t: "code"; code: string }
  | { t: "links"; items: { label: string; href: string }[] };

export type Article = { title: string; description: string; blocks: Block[] };

export const articleSlugs = ["introduction", "public-ip", "port-forwarding", "dns-records", "ssl-certificates", "devs", "streaming", "recipes", "limits-and-errors"] as const;
export type ArticleSlug = (typeof articleSlugs)[number];
