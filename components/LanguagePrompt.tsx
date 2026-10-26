"use client";

import { ArrowDown, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { fmt, hasLocale, localeNames, type Locale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { setStored, useStored } from "@/lib/use-stored";
import { useI18n } from "./I18nProvider";
import { useSwitchLocale } from "./LanguageMenu";

/** Idiomas do navegador (ex.: "en-US,en"). Só existe no cliente, então no servidor vira null. */
function useBrowserLanguages(): string | null {
  return useSyncExternalStore(
    () => () => {},
    () => (navigator.languages?.length ? navigator.languages.join(",") : navigator.language),
    () => null,
  );
}

/**
 * Aviso no canto da tela quando o idioma preferido (escolha anterior ou idioma do navegador)
 * é diferente do idioma da página. Fica dispensado por par de idiomas.
 */
export function LanguagePrompt() {
  const { locale } = useI18n();
  const switchLocale = useSwitchLocale();
  const browser = useBrowserLanguages();
  const preferred = useStored("preferredLocale");

  let detected: Locale | null = null;
  if (preferred && hasLocale(preferred)) detected = preferred;
  else if (browser) {
    for (const lang of browser.split(",")) {
      const code = lang.slice(0, 2).toLowerCase();
      if (hasLocale(code)) {
        detected = code;
        break;
      }
    }
  }

  const key = detected ? `promptDismissed.${locale}-${detected}` : "promptDismissed";
  const dismissed = useStored(key);
  if (!detected || detected === locale || dismissed !== "") return null;

  // O aviso fala o idioma de destino: é nele que a pessoa quer ler.
  const t = getDict(detected).langPrompt;
  return (
    <aside
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 w-[min(460px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2">
        <h2 className="text-base font-medium text-strong">{t.title}</h2>
        <button
          type="button"
          aria-label={t.close}
          onClick={() => setStored(key, "1")}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-line text-muted transition-colors hover:bg-hover hover:text-strong"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="px-5 pb-5 text-[15px] leading-snug text-ink">{fmt(t.body, localeNames[locale], localeNames[detected])}</p>
      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted" aria-hidden>
          <span className="grid h-7 min-w-8 place-items-center rounded-full border border-line bg-soft px-1">{locale.toUpperCase()}</span>
          <ArrowDown className="size-3.5 -rotate-90" />
          <span className="grid h-7 min-w-8 place-items-center rounded-full border border-line bg-soft px-1">{detected.toUpperCase()}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setStored(key, "1");
            switchLocale(detected);
          }}
          className="h-10 cursor-pointer rounded-full bg-accent px-5 text-sm font-medium whitespace-nowrap text-accent-fg transition-colors hover:bg-accent-hover"
        >
          {fmt(t.cta, localeNames[detected])}
        </button>
      </div>
    </aside>
  );
}
