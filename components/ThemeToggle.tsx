"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { setStored, useStored } from "@/lib/use-stored";
import { useT } from "./I18nProvider";

export type Theme = "light" | "dark" | "system";

/** Grava a escolha e aplica na hora. "system" remove o atributo e deixa o CSS seguir o sistema. */
export function applyTheme(next: Theme) {
  setStored("theme", next === "system" ? null : next);
  if (next === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
}

export function useTheme(): Theme {
  const stored = useStored("theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

/** O tema que está valendo agora (claro ou escuro), resolvendo "sistema" pelo que o aparelho usa. */
export function useIsDark(): boolean {
  const theme = useTheme();
  const system = useSyncExternalStore(
    (notify) => {
      const query = matchMedia("(prefers-color-scheme: dark)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  return theme === "dark" || (theme === "system" && system);
}

/** Botão do header: alterna claro e escuro (o ícone certo é escolhido por CSS, sem mismatch de hidratação). */
export function ThemeToggle() {
  const t = useT();
  function toggle() {
    const root = document.documentElement;
    const dark =
      root.dataset.theme === "dark" || (root.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(dark ? "light" : "dark");
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.nav.theme}
      className="grid size-9 cursor-pointer place-items-center rounded-full border border-pill text-muted transition-colors hover:bg-hover hover:text-strong"
    >
      <Sun className="theme-sun size-4" />
      <Moon className="theme-moon size-4" />
    </button>
  );
}

/** Seletor com as três opções (claro, sistema, escuro), usado no rodapé e no menu mobile. */
export function ThemeSwitch({ full = false }: { full?: boolean }) {
  const t = useT().nav;
  const current = useTheme();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t.themeLight, icon: Sun },
    { value: "system", label: t.themeSystem, icon: Monitor },
    { value: "dark", label: t.themeDark, icon: Moon },
  ];
  return (
    <div role="group" aria-label={t.themeTitle} className={`${full ? "grid grid-cols-3" : "inline-flex"} gap-1 rounded-full border border-line bg-soft p-1`}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value}
          aria-label={label}
          onClick={() => applyTheme(value)}
          className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-sm transition-colors ${
            current === value ? "bg-surface text-strong ring-1 ring-line" : "text-dim hover:text-strong"
          }`}
        >
          <Icon className="size-3.5" />
          {full && <span>{label}</span>}
        </button>
      ))}
    </div>
  );
}
