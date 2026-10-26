"use client";

import { Activity, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Button, ErrorBox, FormCard, Input, Label } from "@/components/ui/kit";
import { UseMyIp } from "@/components/ui/flow";
import { syncUrl } from "@/components/ui/useApi";

type Status = "idle" | "running" | "finished" | "stopped";

/** Resumo no formato do ping do terminal, usado quando o usuário para antes do fim. */
function summary(host: string, text: string): string {
  const times = [...text.matchAll(/time[=<]([\d.]+)\s*ms/g)].map((m) => Number(m[1]));
  const sent = Math.max(
    ...[...text.matchAll(/(?:icmp|tcp)_seq=(\d+)/g)].map((m) => Number(m[1])),
    times.length,
  );
  if (!sent) return "";
  const loss = Math.round((1 - times.length / sent) * 100);
  let out = `\n--- ${host} ping statistics ---\n${sent} packets transmitted, ${times.length} received, ${loss}% packet loss\n`;
  if (times.length) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    out += `rtt min/avg/max = ${Math.min(...times)}/${avg.toFixed(1)}/${Math.max(...times)} ms\n`;
  }
  return out;
}

export function PingTool({ initial }: { initial: { host?: string } }) {
  const { locale, t: dict } = useI18n();
  const t = dict.ui.ping;
  const [host, setHost] = useState(initial.host ?? "");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const screen = useRef<HTMLPreElement>(null);

  // acompanha o fim da saída, como um terminal
  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [output]);

  useEffect(() => () => controller.current?.abort(), []);

  async function start(target = host) {
    controller.current?.abort();
    const ctl = (controller.current = new AbortController());
    syncUrl({ host: target });
    setOutput("");
    setError(null);
    setStatus("running");
    let text = "";
    try {
      const res = await fetch(`/api/ping?${new URLSearchParams({ host: target })}`, { signal: ctl.signal, headers: { "x-lang": locale } });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? dict.errors.unknown);
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += value;
        setOutput(text);
      }
      setStatus("finished");
    } catch (e) {
      if (ctl.signal.aborted) {
        setOutput(text + summary(target, text));
        setStatus("stopped");
        return;
      }
      setError(e instanceof Error ? e.message : dict.errors.network);
      setStatus("idle");
    }
  }

  useEffect(() => {
    if (initial.host) queueMicrotask(() => start(initial.host));
    // só na montagem, quando o link já traz o host
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = status === "running";

  return (
    <div className="space-y-4">
      <FormCard onSubmit={() => start()}>
        <div>
          <Label htmlFor="host">{t.label}</Label>
          <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="exemplo.com" required />
          <UseMyIp onUse={setHost} />
        </div>
        {running ? (
          <Button key="stop" type="button" block variant="outline" onClick={() => controller.current?.abort()}>
            {t.stop} <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button key="start" type="submit" block>
            {t.submit} <Activity className="size-4" />
          </Button>
        )}
      </FormCard>

      {error && <ErrorBox message={error} />}

      {status !== "idle" && (
        <div className="overflow-hidden rounded-2xl border border-line bg-[#0f1411] shadow-card">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs text-white/60">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </span>
            <span className="ml-2 font-mono">ping {host}</span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${running ? "animate-pulse bg-[#86efac]" : "bg-white/30"}`} />
              {running ? t.running : status === "finished" ? t.finished : t.stopped}
            </span>
          </div>
          <pre ref={screen} className="h-72 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#cdeed8]">
            {output || t.waiting}
            {running && output && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-[#86efac]" />}
          </pre>
        </div>
      )}
      <p className="text-xs text-dim">{t.note}</p>
    </div>
  );
}
