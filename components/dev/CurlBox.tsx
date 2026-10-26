"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";

/** Caixa clara com um comando pronto para copiar, no topo da página Developers. */
export function CurlBox({ command }: { command: string }) {
  const t = useT().common;
  const [done, setDone] = useState(false);
  return (
    <div className="inline-flex max-w-full items-center gap-4 rounded-sm border border-line bg-surface px-5 py-3 font-mono text-[14px] text-strong shadow-card">
      <code className="min-w-0 break-all sm:whitespace-nowrap">{command}</code>
      <button
        type="button"
        aria-label={t.copy}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {}
        }}
        className="shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
      >
        {done ? <Check className="size-4" /> : <Clipboard className="size-4" />}
      </button>
    </div>
  );
}
