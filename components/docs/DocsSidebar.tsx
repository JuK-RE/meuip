"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouteOpen } from "@/lib/use-route-open";
import { useI18n } from "@/components/I18nProvider";

type Group = { key: string; title: string; items: { slug: string; title: string }[] };

function Nav({ groups }: { groups: Group[] }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const current = pathname.replace(`/${locale}/docs`, "").replace(/^\//, "") || "introduction";
  return (
    <nav className="space-y-6">
      {groups.map((g) => (
        <div key={g.key}>
          <p className="mb-2 px-3 font-mono text-[11px] font-semibold tracking-[0.1em] text-dim uppercase">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.slug}>
                <Link
                  href={`/${locale}/docs/${i.slug}`}
                  aria-current={current === i.slug ? "page" : undefined}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    current === i.slug ? "bg-tint font-medium text-strong" : "text-muted hover:bg-hover hover:text-strong"
                  }`}
                >
                  {i.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Menu lateral fixo no desktop; no celular vira uma seção que abre e fecha no topo. */
export function DocsSidebar({ groups }: { groups: Group[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useRouteOpen();
  return (
    <>
      <aside className="sticky top-[calc(4rem+3.75rem)] hidden h-[calc(100vh-4rem-3.75rem)] overflow-y-auto overscroll-contain border-r border-line py-8 pr-4 lg:block">
        <Nav groups={groups} />
      </aside>
      <div className="border-b border-line lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between py-3 text-sm text-strong"
        >
          {t.docs.menu}
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="pb-4" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
            <Nav groups={groups} />
          </div>
        )}
      </div>
    </>
  );
}
