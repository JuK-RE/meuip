import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).about;
  return pageMetadata({ lang, path: "/about", title: t.title, description: t.lead });
}

export default async function AboutPage() {
  const { locale, t } = await getDictionary();
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <h1 className="text-3xl font-light tracking-tight text-strong sm:text-4xl">{t.about.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink">{t.about.lead}</p>
      <div className="mt-12 space-y-10">
        {t.about.sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-3 text-xl font-light text-strong">{s.h}</h2>
            <div className="space-y-3 text-[15px] leading-relaxed">
              {s.p.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Link
        href={`/${locale}`}
        className="mt-12 inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
      >
        {t.common.allTools}
      </Link>
    </div>
  );
}
