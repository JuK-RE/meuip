"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";

/** Copia a página inteira em Markdown, pronta para colar num editor ou numa IA. */
export function CopyPageButton({ markdown }: { markdown: string }) {
  const t = useT().docs;
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(markdown);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:bg-hover hover:text-strong"
    >
      {done ? <Check className="size-4 text-accent-ink" /> : <Copy className="size-4" />}
      {done ? t.copied : t.copyPage}
    </button>
  );
}
