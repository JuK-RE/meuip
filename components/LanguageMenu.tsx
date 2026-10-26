"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useRouteOpen } from "@/lib/use-route-open";
import { hasLocale, localeNames, locales, type Locale } from "@/lib/i18n/config";
import { setStored } from "@/lib/use-stored";
import { useI18n } from "./I18nProvider";

/** Troca o prefixo de idioma da URL e lembra a escolha (cookie para o servidor, localStorage para o aviso de idioma). */
export function useSwitchLocale() {
  const pathname = usePathname();
  const router = useRouter();
  return (next: Locale) => {
    const parts = pathname.split("/");
    if (hasLocale(parts[1])) parts[1] = next;
    else parts.splice(1, 0, next);
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    setStored("preferredLocale", next);
    router.push(parts.join("/") + window.location.search);
  };
}

/** Menu de idioma. No header abre para baixo; no rodapé, para cima. No celular mostra só o código (PT, EN...). */
export function LanguageMenu({ placement = "down", align = "right" }: { placement?: "down" | "up"; align?: "left" | "right" }) {
  const { locale, t } = useI18n();
  const switchLocale = useSwitchLocale();
  const [open, setOpen] = useRouteOpen();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={t.nav.language}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm text-muted transition-colors hover:bg-hover hover:text-strong aria-expanded:bg-hover aria-expanded:text-strong"
      >
        <Languages className="size-4" aria-hidden />
        <span className="hidden sm:inline">{localeNames[locale]}</span>
        <span className="font-mono text-xs sm:hidden">{locale.toUpperCase()}</span>
        <ChevronDown className="size-3.5" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-40 min-w-40 rounded-xl border border-line bg-surface p-1.5 shadow-card ${placement === "up" ? "bottom-full mb-2" : "top-full mt-2"} ${align === "right" ? "right-0" : "left-0"}`}
        >
          {locales.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === locale}
              onClick={() => {
                setOpen(false);
                if (option !== locale) switchLocale(option);
              }}
              className="flex h-9 w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-hover hover:text-strong aria-checked:bg-hover aria-checked:text-strong"
            >
              {localeNames[option]}
              {option === locale && <Check className="size-4 text-accent-ink" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
