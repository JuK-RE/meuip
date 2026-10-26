"use client";

import { BookOpen, ChevronDown, Code2, Home, Info } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tools } from "@/lib/tools";
import { Brand } from "./Brand";
import { GithubIcon } from "./GithubIcon";
import { useI18n } from "./I18nProvider";
import { LanguageMenu } from "./LanguageMenu";
import { MobileMenu, type MobileSection } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

export const GITHUB_URL = "https://github.com/JuK-RE/";

const linkClass = "inline-flex h-9 items-center rounded-full px-3 text-sm text-muted transition-colors hover:bg-hover hover:text-strong";
const iconBtn = "grid size-9 place-items-center rounded-full border border-pill text-muted transition-colors hover:bg-hover hover:text-strong";

export function SiteNav() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  // o menu guarda em qual página foi aberto: ao navegar, ele deixa de valer e fecha sozinho
  const [openAt, setOpenAt] = useState<string | null>(null);
  const toolsOpen = openAt === pathname;
  const root = useRef<HTMLDivElement>(null);
  const base = `/${locale}`;

  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpenAt(null);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [toolsOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const mobileSections: MobileSection[] = [
    {
      title: t.nav.tools,
      links: tools.map((tool) => ({
        label: t.tools[tool.slug].short,
        href: `${base}/tools/${tool.slug}`,
        icon: <tool.icon className="size-[18px]" strokeWidth={1.75} />,
      })),
    },
    {
      title: t.nav.menuTitle,
      links: [
        { label: t.nav.start, href: base, icon: <Home className="size-[18px]" strokeWidth={1.75} /> },
        { label: t.nav.docs, href: `${base}/docs`, icon: <BookOpen className="size-[18px]" strokeWidth={1.75} /> },
        { label: t.nav.api, href: `${base}/developers`, icon: <Code2 className="size-[18px]" strokeWidth={1.75} /> },
        { label: t.nav.about, href: `${base}/about`, icon: <Info className="size-[18px]" strokeWidth={1.75} /> },
        { label: "GitHub", href: GITHUB_URL, icon: <GithubIcon className="size-[18px]" />, external: true },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-line bg-surface/85 backdrop-blur-md backdrop-saturate-150">
      <nav className="mx-auto flex h-full max-w-6xl items-center gap-2 px-5">
        <Link href={base} aria-label={t.nav.home} className="mr-4 shrink-0">
          <Brand />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <div ref={root} className="relative">
            <button
              type="button"
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              onClick={() => setOpenAt(toolsOpen ? null : pathname)}
              className={`${linkClass} cursor-pointer gap-1 ${toolsOpen || isActive(`${base}/tools`) ? "bg-hover text-strong" : ""}`}
            >
              {t.nav.tools}
              <ChevronDown className={`size-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>
            {toolsOpen && (
              <div
                // clicar num link fecha o menu, inclusive quando o link leva para a página em que já estamos
                onClick={(e) => (e.target as HTMLElement).closest("a") && setOpenAt(null)}
                className="absolute top-full left-0 mt-2 w-[540px] rounded-2xl border border-line bg-surface p-2 shadow-card"
              >
                <ul className="grid grid-cols-2 gap-1">
                  {tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link href={`${base}/tools/${tool.slug}`} className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-tint">
                        <tool.icon className="mt-0.5 size-4 shrink-0 text-accent-ink" />
                        <span>
                          <span className="block text-sm text-strong">{t.tools[tool.slug].short}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-dim">{t.tools[tool.slug].description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Link href={`${base}/docs`} className={`${linkClass} ${isActive(`${base}/docs`) ? "bg-hover text-strong" : ""}`}>
            {t.nav.docs}
          </Link>
          <Link href={`${base}/developers`} className={`${linkClass} ${isActive(`${base}/developers`) ? "bg-hover text-strong" : ""}`}>
            {t.nav.api}
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LanguageMenu />
          <span className="hidden md:contents">
            <ThemeToggle />
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label={t.nav.github} className={iconBtn}>
              <GithubIcon className="size-4" />
            </a>
          </span>
          <MobileMenu sections={mobileSections} />
        </div>
      </nav>
    </header>
  );
}
