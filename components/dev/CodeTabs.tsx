"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { highlight } from "@/lib/highlight";
import { snippet, snippetLangs } from "@/lib/snippets";
import { setStored, useStored } from "@/lib/use-stored";
import { LangIcon } from "./LangIcon";
import { TerminalWindow } from "./Terminal";

function Highlighted({ code }: { code: string }) {
  return (
    <code>
      {highlight(code).map((tok, i) =>
        tok.kind ? (
          <span key={i} className={`tok-${tok.kind}`}>
            {tok.text}
          </span>
        ) : (
          tok.text
        ),
      )}
    </code>
  );
}

/** Código com realce e botão de copiar, nas cores do terminal escolhido. */
export function CodeBlock({ code }: { code: string }) {
  const t = useT().common;
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t.copy}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          } catch {}
        }}
        className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-md text-term-dim transition-colors hover:bg-white/10 hover:text-term-fg"
      >
        {done ? <Check className="size-4 text-[var(--t-kw)]" /> : <Copy className="size-4" />}
      </button>
      <pre className="p-4 pr-12 font-mono text-[12.5px] leading-relaxed break-words whitespace-pre-wrap text-term-fg">
        <Highlighted code={code} />
      </pre>
    </div>
  );
}

/** Janela de terminal com uma aba por linguagem (com o logo). A escolha vale para todas as seções. */
export function CodeTabs({ url, stream = false }: { url: string; stream?: boolean }) {
  const stored = useStored("devLang");
  const lang = snippetLangs.some((l) => l.id === stored) ? (stored as string) : "curl";

  return (
    <TerminalWindow flush>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-term-line px-2 pt-2">
        {snippetLangs.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lang === l.id}
            onClick={() => setStored("devLang", l.id)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-t-md px-3 py-2 text-[13px] transition-colors ${
              lang === l.id ? "bg-white/12 text-term-fg" : "text-term-dim hover:text-term-fg"
            }`}
          >
            <LangIcon id={l.id} size={18} />
            {l.label}
          </button>
        ))}
      </div>
      <CodeBlock code={snippet(lang, url, stream)} />
    </TerminalWindow>
  );
}
