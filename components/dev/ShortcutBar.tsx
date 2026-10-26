"use client";

import { useEffect } from "react";
import { VscTerminalCmd, VscTerminalPowershell } from "react-icons/vsc";
import { useT } from "@/components/I18nProvider";
import { applyTheme, useIsDark } from "@/components/ThemeToggle";

export type Shortcut = { key: string; label: string; id: string };

/**
 * Barra de atalhos da página Developers (só no desktop): "[P] Portas". Apertar a letra (fora de campos
 * de texto) rola até a seção. À direita, PowerShell e CMD: são o tema claro e o tema escuro do site,
 * então trocar aqui troca a página inteira, igual ao botão do header.
 */
export function ShortcutBar({ items }: { items: Shortcut[] }) {
  const t = useT().dev;
  const dark = useIsDark();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      const item = items.find((i) => i.key.toLowerCase() === e.key.toLowerCase());
      if (!item) return;
      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${item.id}`);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [items]);

  const option = (isDark: boolean, label: string, Icon: typeof VscTerminalCmd) => (
    <button
      type="button"
      aria-pressed={dark === isDark}
      onClick={() => applyTheme(isDark ? "dark" : "light")}
      className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded px-2.5 transition-colors ${
        dark === isDark ? "bg-white/15 text-term-fg" : "text-term-dim hover:text-term-fg"
      }`}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );

  return (
    <nav aria-label={t.nav} title={t.shortcuts} className="sticky top-16 z-20 hidden border-b border-term-line bg-term font-mono text-[13px] text-term-fg md:block">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-2.5">
        <ul className="flex flex-1 flex-wrap gap-x-5 gap-y-1">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="opacity-85 transition-opacity hover:opacity-100">
                <span className="text-term-dim">[{i.key}]</span> {i.label}
              </a>
            </li>
          ))}
        </ul>
        <div role="group" aria-label="Terminal" className="flex shrink-0 gap-1 rounded-md border border-term-line p-0.5">
          {option(false, "PowerShell", VscTerminalPowershell)}
          {option(true, "CMD", VscTerminalCmd)}
        </div>
      </div>
    </nav>
  );
}
