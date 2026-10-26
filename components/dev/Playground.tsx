"use client";

import { Loader2, Play, Square } from "lucide-react";
import { useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { CodeBlock } from "./CodeTabs";
import { TerminalWindow } from "./Terminal";

/** Executa a chamada de verdade, a partir do navegador, e mostra o resultado. */
export function Playground({ path, stream = false }: { path: string; stream?: boolean }) {
  const { locale, t } = useI18n();
  const [output, setOutput] = useState<string | null>(null);
  const [meta, setMeta] = useState("");
  const [running, setRunning] = useState(false);
  const controller = useRef<AbortController | null>(null);

  async function run() {
    controller.current?.abort();
    const ctl = (controller.current = new AbortController());
    const started = performance.now();
    setRunning(true);
    setOutput("");
    setMeta("");
    // o ping é cortado em 8 s, para a demonstração não ficar rodando
    const timer = stream ? setTimeout(() => ctl.abort(), 8000) : undefined;
    let text = "";
    try {
      const res = await fetch(path, { signal: ctl.signal, headers: { "x-lang": locale } });
      if (stream && res.ok && res.body) {
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += value;
          setOutput(text);
        }
      } else {
        const raw = await res.text();
        try {
          text = JSON.stringify(JSON.parse(raw), null, 2);
        } catch {
          text = raw;
        }
        setOutput(text);
      }
      setMeta(`${res.status} ${res.statusText} · ${Math.round(performance.now() - started)} ms`);
    } catch (e) {
      if (ctl.signal.aborted) setMeta("");
      else setOutput(e instanceof Error ? e.message : t.errors.network);
    } finally {
      clearTimeout(timer);
      setRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {running ? (
          <button
            type="button"
            onClick={() => controller.current?.abort()}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-pill px-4 text-sm text-ink transition-colors hover:bg-hover"
          >
            <Square className="size-3.5 fill-current" /> {t.dev.stop}
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <Play className="size-3.5 fill-current" /> {t.dev.run}
          </button>
        )}
        {running && !stream && <Loader2 className="size-4 animate-spin text-dim" />}
        {meta && <span className="font-mono text-xs text-dim">{meta}</span>}
      </div>
      {output !== null && (
        <TerminalWindow flush>
          <div className="max-h-80 overflow-y-auto">
            <CodeBlock code={output || t.dev.running} />
          </div>
        </TerminalWindow>
      )}
    </div>
  );
}
