"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouteOpen } from "@/lib/use-route-open";
import { useI18n } from "@/components/I18nProvider";

type Entry = { slug: string; title: string; group: string; text: string };

/** Busca da documentação: botão no topo e janela aberta com Ctrl+K (ou Cmd+K). */
export function DocsSearch({ index }: { index: Entry[] }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useRouteOpen();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index;
    return index
      .map((e) => ({ e, score: e.title.toLowerCase().includes(q) ? 2 : e.text.toLowerCase().includes(q) ? 1 : 0 }))
      .filter((r) => r.score)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.e);
  }, [index, query]);

  function go(entry?: Entry) {
    if (!entry) return;
    setOpen(false);
    setQuery("");
    router.push(`/${locale}/docs/${entry.slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-md cursor-pointer items-center gap-2 rounded-full border border-line bg-soft px-4 text-sm text-dim transition-colors hover:border-pill hover:text-muted"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">{t.docs.search}</span>
        <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] sm:inline">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-start bg-black/50 px-4 pt-[12vh]" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.docs.search}
            onMouseDown={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-dim" aria-hidden />
              <input
                ref={input}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter") go(results[active]);
                }}
                placeholder={t.docs.search}
                className="h-12 flex-1 bg-transparent text-[15px] text-strong placeholder:text-dim focus:outline-none"
              />
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-dim">{t.docs.noResults}</li>}
              {results.map((r, i) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={`flex w-full cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${i === active ? "bg-tint text-strong" : "text-muted"}`}
                  >
                    <span>{r.title}</span>
                    <span className="font-mono text-[11px] text-dim">{r.group}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
