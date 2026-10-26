import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { ToolGrid } from "@/components/ToolGrid";
import { CopyButton } from "@/components/ui/kit";
import { clientIp } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { localizedPath, SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return pageMetadata({ lang, path: "", title: t.meta.title, description: t.meta.description, absolute: true });
}

// O IP vem dos headers da requisição, então fica atrás de um <Suspense> e o resto da página é estático.
async function YourIp() {
  const { locale, t } = await getDictionary();
  const ip = clientIp(await headers());
  return (
    <>
      <h1 className="mt-4 max-w-full font-mono text-4xl font-light tracking-tight break-all text-strong sm:text-6xl">{ip}</h1>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <CopyButton value={ip} label={t.ui.myIp.copyIp} />
        <Link
          href={`/${locale}/tools/my-ip`}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          {t.home.details} <ArrowRight className="size-4" />
        </Link>
      </div>
    </>
  );
}

export default async function Home() {
  const { locale, t } = await getDictionary();
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Meu IP",
            url: SITE_URL + localizedPath(locale, ""),
            description: t.meta.description,
            inLanguage: locale,
            publisher: { "@type": "Organization", name: "JUCA Soft", url: "https://www.jucasoft.com.br/" },
          },
        ]}
      />
      <section className="flex flex-col items-center px-5 pt-16 pb-14 text-center sm:pt-24">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-accent-ink uppercase">{t.home.eyebrow}</p>
        <Suspense fallback={<div className="mt-4 h-10 w-72 rounded-xl bg-hover sm:h-[72px]" />}>
          <YourIp />
        </Suspense>
        <p className="mt-8 max-w-lg text-[15px] leading-relaxed">{t.home.tagline}</p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <ToolGrid />
      </section>
    </>
  );
}
