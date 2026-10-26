"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useT } from "./I18nProvider";
import { ThemeSwitch } from "./ThemeToggle";

export type MobileLink = { label: string; href: string; icon: ReactNode; external?: boolean };
export type MobileSection = { title: string; links: MobileLink[] };

const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/**
 * Menu do celular: botão no header e painel em tela cheia. O painel vai por portal
 * porque o header tem backdrop-filter, que prenderia um elemento fixed dentro dele.
 */
export function MobileMenu({ sections }: { sections: MobileSection[] }) {
  const t = useT().nav;
  const pathname = usePathname();
  // guarda a página em que abriu: ao navegar o menu deixa de valer e fecha sozinho
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMounted = useMounted();

  // Com o menu aberto: trava a rolagem da página, prende o foco dentro do painel e fecha no Esc.
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const { body } = document;
    Object.assign(body.style, { position: "fixed", top: `-${scrollY}px`, left: "0", right: "0", width: "100%" });
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenAt(null);
        triggerRef.current?.focus();
      }
      if (e.key === "Tab" && first && last) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      const locked = Math.abs(parseInt(body.style.top || "0", 10));
      Object.assign(body.style, { position: "", top: "", left: "", right: "", width: "", paddingRight: "" });
      window.scrollTo(0, locked);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t.closeMenu : t.menu}
        onClick={() => setOpenAt(open ? null : pathname)}
        className="grid size-9 cursor-pointer place-items-center rounded-full border border-pill text-strong transition-colors hover:bg-hover md:hidden"
      >
        {open ? <X className="size-5" strokeWidth={1.75} /> : <Menu className="size-5" strokeWidth={1.75} />}
      </button>

      {isMounted &&
        createPortal(
          <div
            ref={panelRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t.menuTitle}
            aria-hidden={!open}
            // clicar em qualquer link fecha o menu, mesmo que o link seja da página atual
            onClick={(e) => (e.target as HTMLElement).closest("a") && setOpenAt(null)}
            className={`fixed inset-x-0 top-16 bottom-0 z-[60] flex flex-col overflow-hidden bg-surface transition-opacity duration-200 md:hidden ${
              open ? "visible opacity-100" : "invisible opacity-0"
            }`}
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-8">
              <section>
                <h3 className="mb-3 px-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-dim uppercase">{t.themeTitle}</h3>
                <ThemeSwitch full />
              </section>

              {sections.map((section) => (
                <section key={section.title} className="mt-6">
                  <h3 className="mb-2 px-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-dim uppercase">{section.title}</h3>
                  <ul>
                    {section.links.map((link) => {
                      const active = !link.external && pathname === link.href;
                      const cls = `flex items-center gap-3 border-b border-hair px-1 py-3.5 text-base transition-colors last:border-b-0 ${
                        active ? "text-strong" : "text-muted hover:text-strong"
                      }`;
                      const body = (
                        <>
                          <span className={`grid size-6 place-items-center ${active ? "text-accent-ink" : "text-dim"}`}>{link.icon}</span>
                          <span className="flex-1">{link.label}</span>
                          {link.external && <ArrowUpRight className="size-4 text-dim" />}
                        </>
                      );
                      return (
                        <li key={link.href}>
                          {link.external ? (
                            <a href={link.href} target="_blank" rel="noreferrer noopener" className={cls}>
                              {body}
                            </a>
                          ) : (
                            <Link href={link.href} className={cls} aria-current={active ? "page" : undefined}>
                              {body}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
