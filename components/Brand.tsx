"use client";

import type { Locale } from "@/lib/i18n/config";
import { JukWordmark } from "./JukWordmark";
import { useI18n } from "./I18nProvider";

const TAG: Record<Locale, string> = { pt: "MEU IP", en: "MY IP", es: "MI IP", fr: "MON IP" };

/** Assinatura do produto: "JUK.re | MEU IP", com a tag no idioma atual. */
export function Brand({ height = 14 }: { height?: number }) {
  const { locale } = useI18n();
  return (
    <span className="inline-flex items-center gap-2.5 text-strong">
      <JukWordmark height={height} />
      <span aria-hidden className="h-3.5 w-px bg-pill" />
      <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-accent-ink">{TAG[locale]}</span>
    </span>
  );
}
