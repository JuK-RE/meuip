import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CopyPageButton } from "@/components/docs/CopyPageButton";
import { DocsToc } from "@/components/docs/DocsToc";
import { allDocSlugs, docNav, getDocPage, slugify, toMarkdown } from "@/lib/docs";
import { hasLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.flatMap((lang) => [{ lang, slug: [] as string[] }, ...allDocSlugs.map((s) => ({ lang, slug: s.split("/") }))]);
}

const toSlug = (parts?: string[]) => (parts?.length ? parts.join("/") : "introduction");

export async function generateMetadata({ params }: PageProps<"/[lang]/docs/[[...slug]]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const page = getDocPage(lang, toSlug(slug));
  if (!page) return {};
  return pageMetadata({ lang, path: slug?.length ? `/docs/${toSlug(slug)}` : "/docs", title: page.title, description: page.description });
}

// params é lido dentro do <Suspense>: a navegação entre artigos mostra o esqueleto na hora.
export default function DocPage(props: PageProps<"/[lang]/docs/[[...slug]]">) {
  return (
    <Suspense fallback={<div className="h-96 py-12" />}>
      <DocContent {...props} />
    </Suspense>
  );
}

async function DocContent({ params }: PageProps<"/[lang]/docs/[[...slug]]">) {
  const { slug } = await params;
  const { locale, t } = await getDictionary();
  const page = getDocPage(locale, toSlug(slug));
  if (!page) notFound();

  const flat = docNav(locale).flatMap((g) => g.items);
  const at = flat.findIndex((i) => i.slug === page.slug);
  const prev = flat[at - 1];
  const next = flat[at + 1];
  const toc = page.blocks.flatMap((b) => (b.t === "h2" ? [{ id: slugify(b.text), text: b.text }] : []));

  return (
    <div className="grid gap-12 py-8 lg:py-12 xl:grid-cols-[minmax(0,1fr)_210px]">
      <article className="min-w-0 max-w-3xl">
        <p className="text-sm text-muted">{t.docs.groups[page.group]}</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <h1 className="min-w-0 text-3xl font-medium tracking-tight text-strong sm:text-4xl">{page.title}</h1>
          <CopyPageButton markdown={toMarkdown(page)} />
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink">{page.description}</p>

        <div className="mt-8 space-y-5 text-[16px] leading-[1.75]">
          {page.blocks.map((b, i) => {
            switch (b.t) {
              case "h2":
                return (
                  <h2 key={i} id={slugify(b.text)} className="scroll-mt-40 pt-6 text-2xl font-medium tracking-tight text-strong">
                    {b.text}
                  </h2>
                );
              case "ul":
                return (
                  <ul key={i} className="list-disc space-y-2 pl-6 marker:text-accent-ink">
                    {b.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                );
              case "ol":
                return (
                  <ol key={i} className="list-decimal space-y-2 pl-6 marker:font-mono marker:text-accent-ink">
                    {b.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ol>
                );
              case "note":
                return (
                  <p key={i} className="rounded-xl border border-tint-line bg-tint px-4 py-3 text-[15px] leading-relaxed text-ink">
                    {b.text}
                  </p>
                );
              case "code":
                return (
                  <pre key={i} className="rounded-xl bg-[#0f1411] px-4 py-3 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap text-[#cdeed8]">
                    {b.code}
                  </pre>
                );
              case "links":
                return (
                  <div key={i} className="flex flex-wrap gap-3">
                    {b.items.map((l, n) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={
                          n === 0
                            ? "rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
                            : "rounded-full border border-pill px-5 py-2 text-sm text-ink transition-colors hover:bg-hover"
                        }
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                );
              default:
                return <p key={i}>{b.text}</p>;
            }
          })}
        </div>

        <nav className="mt-14 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prev ? (
            <Link href={`/${locale}/docs/${prev.slug}`} className="group rounded-xl border border-line p-4 transition-colors hover:bg-tint">
              <span className="flex items-center gap-1 text-xs text-dim">
                <ChevronLeft className="size-3.5" /> {t.docs.prev}
              </span>
              <span className="mt-1 block text-sm text-strong">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/${locale}/docs/${next.slug}`} className="rounded-xl border border-line p-4 text-right transition-colors hover:bg-tint">
              <span className="flex items-center justify-end gap-1 text-xs text-dim">
                {t.docs.next} <ChevronRight className="size-3.5" />
              </span>
              <span className="mt-1 block text-sm text-strong">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      <div className="hidden xl:block">
        <DocsToc items={toc} />
      </div>
    </div>
  );
}
