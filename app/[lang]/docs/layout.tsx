import Link from "next/link";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { docNav, searchIndex } from "@/lib/docs";
import { getDictionary } from "@/lib/i18n/server";

export default async function DocsLayout({ children }: LayoutProps<"/[lang]/docs">) {
  const { locale, t } = await getDictionary();
  return (
    <>
      {/* barra do topo da documentação: busca e abas */}
      <div className="sticky top-16 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-[3.75rem] max-w-7xl items-center gap-6 px-5">
          <DocsSearch index={searchIndex(locale)} />
          <nav className="ml-auto hidden gap-5 text-sm sm:flex">
            <span className="border-b-2 border-accent-ink py-4 font-medium text-strong">{t.docs.tabGuides}</span>
            <Link href={`/${locale}/developers`} className="py-4 text-muted transition-colors hover:text-strong">
              {t.nav.api}
            </Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl px-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <DocsSidebar groups={docNav(locale)} />
        <div className="min-w-0 lg:pl-10">{children}</div>
      </div>
    </>
  );
}
