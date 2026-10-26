import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock, CodeTabs } from "@/components/dev/CodeTabs";
import { CurlBox } from "@/components/dev/CurlBox";
import { HeroVisual } from "@/components/dev/HeroVisual";
import { LangIcon } from "@/components/dev/LangIcon";
import { Playground } from "@/components/dev/Playground";
import { ShortcutBar } from "@/components/dev/ShortcutBar";
import { Prompt, TerminalWindow } from "@/components/dev/Terminal";
import { endpoints } from "@/lib/api-docs";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { snippetLangs } from "@/lib/snippets";

export async function generateMetadata({ params }: PageProps<"/[lang]/developers">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang).dev;
  return pageMetadata({ lang, path: "/developers", title: `${t.title}: ${t.hero}`, description: t.sub });
}

const label = "mb-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-dim uppercase";

export default async function DevelopersPage() {
  const { locale, t } = await getDictionary();
  const d = t.dev;
  const shortcuts = endpoints.map((e) => ({ key: e.key, label: t.tools[e.tool].short, id: e.tool }));

  return (
    <div className="dev-page">
      <ShortcutBar items={shortcuts} />

      {/* topo: terminal inteiro (azul do PowerShell ou preto do CMD), título grande e um comando para copiar */}
      <section className="overflow-hidden bg-term pt-14 text-center text-term-fg sm:pt-20">
        <div className="mx-auto max-w-3xl px-5">
          <p className="font-mono text-sm text-term-dim">
            <Prompt path="C:\" /> dev --meuip
          </p>
          <h1 className="mt-4 text-6xl font-bold tracking-tight sm:text-8xl">/dev/meuip</h1>
          <p className="mt-6 text-xl sm:text-2xl">{d.hero}</p>
          <p className="mt-3 text-term-dim">{d.sub}</p>
          <div className="mt-8">
            <CurlBox command={`curl ${SITE_URL}/api/ip`} />
          </div>
          <p className="mt-6 text-sm text-term-dim">
            {d.startText}{" "}
            <Link href={`/${locale}/docs`} className="underline underline-offset-2 hover:text-term-fg">
              {d.readDocs}
            </Link>
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="font-mono text-[11px] tracking-[0.1em] text-term-dim uppercase">{d.works}</p>
            <ul className="flex flex-wrap justify-center gap-2.5">
              {snippetLangs.map((l) => (
                <li key={l.id} title={l.label}>
                  <LangIcon id={l.id} size={34} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <HeroVisual />
      </section>

      <div className="mx-auto max-w-7xl px-5">
        <section id="quickstart" className="scroll-mt-28 py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs text-accent-ink">
                <Prompt /> <span className="only-ps">Get-Help</span>
                <span className="only-cmd">help</span> quickstart
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight text-strong">{d.quickstart}</h2>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed">{d.quickText}</p>
              <p className="mt-5 text-sm">
                {d.base}: <code className="rounded-md bg-hover px-2 py-0.5 font-mono text-[13px] text-strong">{SITE_URL}</code>
              </p>
              <p className="mt-2 text-xs text-dim">{d.shortcuts}</p>
            </div>
            <TerminalWindow>
              <div className="font-mono text-[12.5px] leading-relaxed">
                <p>
                  <span className="text-term-dim">
                    <Prompt />
                  </span>{" "}
                  <span className="only-ps text-[var(--t-num)]">Invoke-RestMethod</span>
                  <span className="only-cmd text-[var(--t-num)]">curl</span>{" "}
                  <span className="tok-string">&quot;{SITE_URL}/api/ip?format=text&quot;</span>
                </p>
                <p>203.0.113.7</p>
                <p className="mt-3 text-term-dim">
                  <Prompt />
                  <span className="ml-1 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-term-fg" />
                </p>
              </div>
            </TerminalWindow>
          </div>
        </section>

        {endpoints.map((e) => {
          const url = `${SITE_URL}${e.example}`;
          const text = t.tools[e.tool];
          return (
            <section key={e.tool} id={e.tool} className="scroll-mt-28 border-t border-line py-14">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <div>
                  <p className="font-mono text-xs text-accent-ink">
                    <Prompt /> <span className="only-ps">Get-Help</span>
                    <span className="only-cmd">help</span> {e.tool}
                  </p>
                  <h2 className="mt-3 text-2xl font-medium tracking-tight text-strong">{text.title}</h2>
                  <p className="mt-3 text-[15px] leading-relaxed">{text.description}</p>
                  <p className="mt-5 flex items-center gap-2">
                    <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-medium text-accent-fg">GET</span>
                    <code className="font-mono text-sm text-strong">{e.path}</code>
                  </p>
                  <h3 className={`${label} mt-6`}>{d.params}</h3>
                  <dl className="divide-y divide-hair rounded-xl border border-line bg-surface">
                    {e.params.map((p) => (
                      <div key={p.name} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[100px_1fr]">
                        <dt className="font-mono text-[13px] text-strong">
                          {p.name}
                          {p.optional && <span className="ml-1.5 font-sans text-xs text-dim">{d.optional}</span>}
                        </dt>
                        <dd className="font-mono text-[13px]">
                          {p.example}
                          {p.note && <span className="ml-2 font-sans text-xs text-dim">{p.note}</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {e.stream && <p className="mt-3 text-xs text-dim">{d.streamNote}</p>}
                  <Link href={`/${locale}/tools/${e.tool}`} className="mt-6 inline-block text-sm text-accent-ink hover:underline">
                    {t.docs.open}
                  </Link>
                </div>

                <div className="min-w-0 space-y-5">
                  <div>
                    <h3 className={label}>{d.request}</h3>
                    <CodeTabs url={url} stream={e.stream} />
                  </div>
                  <div>
                    <h3 className={label}>{d.response}</h3>
                    <TerminalWindow flush>
                      <CodeBlock code={e.response} />
                    </TerminalWindow>
                  </div>
                  <div>
                    <h3 className={label}>{d.tryIt}</h3>
                    <Playground path={e.example} stream={e.stream} />
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <section id="limits" className="scroll-mt-28 border-t border-line py-14">
          <p className="font-mono text-xs text-accent-ink">
            <Prompt /> <span className="only-ps">Get-Help</span>
            <span className="only-cmd">help</span> limits
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-strong">{d.limits}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">{d.limitsText}</p>
          <Link href={`/${locale}/docs/limits-and-errors`} className="mt-5 inline-block text-sm text-accent-ink hover:underline">
            {d.moreDocs}
          </Link>
        </section>
      </div>
    </div>
  );
}
