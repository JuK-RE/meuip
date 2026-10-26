"use client";

import Link from "next/link";
import { tools } from "@/lib/tools";
import { GITHUB_URL } from "./SiteNav";
import { useI18n } from "./I18nProvider";
import { JucasoftWordmark } from "./JucasoftWordmark";
import { LanguageMenu } from "./LanguageMenu";
import { ThemeSwitch } from "./ThemeToggle";

const col = "mb-3 font-mono text-[10.5px] font-medium tracking-[0.08em] text-dim uppercase";
const link = "text-sm text-muted transition-colors hover:text-strong";

export function SiteFooter() {
  const { locale, t } = useI18n();
  const base = `/${locale}`;

  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="mb-3 text-xs text-dim">{t.footer.madeBy}</p>
          <a href="https://www.jucasoft.com.br/" target="_blank" rel="noreferrer" className="inline-block text-strong" aria-label="JUCA Soft">
            <JucasoftWordmark height={22} />
          </a>
          <p className="mt-4 text-sm leading-relaxed">{t.footer.blurb}</p>
        </div>

        <div>
          <p className={col}>{t.nav.tools}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-1">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link href={`${base}/tools/${tool.slug}`} className={link}>{t.tools[tool.slug].short}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={col}>{t.footer.project}</p>
          <ul className="space-y-2">
            <li><Link href={`${base}/about`} className={link}>{t.nav.about}</Link></li>
            <li><Link href={`${base}/docs`} className={link}>{t.nav.docs}</Link></li>
            <li><Link href={`${base}/developers`} className={link}>{t.nav.api}</Link></li>
            <li><a href={GITHUB_URL} target="_blank" rel="noreferrer" className={link}>GitHub</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-hair px-5 py-5">
        <p className="text-xs text-dim">
          {t.footer.rights}, {t.footer.devBy}{" "}
          <a href="https://josuejuca.com" target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-strong hover:underline">
            Juca
          </a>
        </p>
        <div className="flex items-center gap-3">
          <LanguageMenu placement="up" />
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}
