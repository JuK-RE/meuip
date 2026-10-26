import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DnsTool } from "@/components/tools/DnsTool";
import { FetchTool } from "@/components/tools/FetchTool";
import { LocationTool } from "@/components/tools/LocationTool";
import { MyIpTool } from "@/components/tools/MyIpTool";
import { PingTool } from "@/components/tools/PingTool";
import { PortTool } from "@/components/tools/PortTool";
import { SslTool } from "@/components/tools/SslTool";
import { WhoisTool } from "@/components/tools/WhoisTool";
import { hasLocale, locales } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { localizedPath, SITE_URL } from "@/lib/site";
import { toolBySlug, tools, type ToolSlug } from "@/lib/tools";

export function generateStaticParams() {
  return locales.flatMap((lang) => tools.map((t) => ({ lang, slug: t.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/tools/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !toolBySlug(slug)) return {};
  const text = getDict(lang).tools[slug as ToolSlug];
  return pageMetadata({ lang, path: `/tools/${slug}`, title: text.title, description: text.description });
}

type Query = Record<string, string | undefined>;

// searchParams é dado de requisição: lido dentro do <Suspense>, então a casca da página continua estática.
async function ToolBody({ slug, searchParams }: { slug: ToolSlug; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Só o primeiro valor de cada parâmetro interessa; vira o estado inicial da ferramenta.
  const query: Query = Object.fromEntries(
    Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const content: Record<ToolSlug, React.ReactNode> = {
    "my-ip": <MyIpTool />,
    "port-checker": <PortTool initial={query} />,
    "dns-lookup": <DnsTool initial={query} />,
    "ssl-checker": <SslTool initial={query} />,
    whois: <WhoisTool initial={query} />,
    fetch: <FetchTool initial={query} />,
    "ip-location": <LocationTool initial={query} />,
    ping: <PingTool initial={query} />,
  };
  return content[slug];
}

// params e searchParams são lidos dentro do <Suspense>: a navegação mostra o esqueleto na hora.
async function ToolShell({ params, searchParams }: PageProps<"/[lang]/tools/[slug]">) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();
  const { locale, t } = await getDictionary();
  const text = t.tools[tool.slug];
  const url = SITE_URL + localizedPath(locale, `/tools/${tool.slug}`);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: text.title,
            description: text.description,
            url,
            inLanguage: locale,
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "Any",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            provider: { "@type": "Organization", name: "JUCA Soft", url: "https://www.jucasoft.com.br/" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Meu IP", item: SITE_URL + localizedPath(locale, "") },
              { "@type": "ListItem", position: 2, name: text.title, item: url },
            ],
          },
        ]}
      />
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-strong sm:text-4xl">{text.title}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed">{text.description}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-tint-line bg-tint text-accent-ink">
          <tool.icon className="size-5" />
        </span>
      </header>
      <ToolBody slug={tool.slug} searchParams={searchParams} />
      <section className="mt-14 max-w-2xl border-t border-line pt-8">
        <h2 className="mb-3 text-lg font-light text-strong">{t.common.about}</h2>
        <div className="space-y-3 text-[14px] leading-relaxed">
          {text.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>
    </>
  );
}

export default async function ToolPage(props: PageProps<"/[lang]/tools/[slug]">) {
  const { locale, t } = await getDictionary();
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link href={`/${locale}`} className="mb-8 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-strong">
        <ChevronLeft className="size-4" /> {t.common.allTools}
      </Link>
      <Suspense fallback={<div className="h-64 rounded-2xl bg-hover" />}>
        <ToolShell {...props} />
      </Suspense>
    </div>
  );
}
