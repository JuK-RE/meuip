"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloudDownload, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n/config";
import { Button, Card, CopyButton, FormCard, Input, inputClass, Label, Mono, Pill } from "@/components/ui/kit";
import { Collapsible, InlineChip, ResultFlow, fmtNode } from "@/components/ui/flow";
import { syncUrl, useApi } from "@/components/ui/useApi";

type Hop = {
  url: string;
  address: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timing: { dns: number; connect: number; tls: number | null; ttfb: number; total: number };
};
type FetchResult = { hops: Hop[]; final: Hop; body: string | null; bodyBytes: number; truncated: boolean; binary: boolean };
type Pair = { id: number; name: string; value: string };

const tone = (s: number) => (s < 300 ? "ok" : s < 400 ? "warn" : "bad");
let nextId = 1;

/** Lista editável de pares nome/valor (cabeçalhos ou cookies). */
function PairList({ label, empty, pairs, onChange }: { label: string; empty: string; pairs: Pair[]; onChange: (p: Pair[]) => void }) {
  const t = useT().ui.fetch;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => onChange([...pairs, { id: nextId++, name: "", value: "" }])}
          className="-mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-pill px-2.5 py-1 text-xs text-ink transition-colors hover:bg-hover"
        >
          <Plus className="size-3.5" /> {t.add}
        </button>
      </div>
      {pairs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-pill px-4 py-3 text-center text-sm text-dim">{empty}</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {pairs.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="flex gap-2 overflow-hidden"
              >
                <Input className="flex-1" placeholder={t.name} value={p.name} onChange={(e) => onChange(pairs.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))} />
                <Input className="flex-[2]" placeholder={t.value} value={p.value} onChange={(e) => onChange(pairs.map((x) => (x.id === p.id ? { ...x, value: e.target.value } : x)))} />
                <button type="button" aria-label={t.remove} onClick={() => onChange(pairs.filter((x) => x.id !== p.id))} className="grid w-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-pill text-dim transition-colors hover:bg-bad-bg hover:text-bad">
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export function FetchTool({ initial }: { initial: { url?: string; method?: string } }) {
  const t = useT().ui.fetch;
  const [url, setUrl] = useState(initial.url ?? "");
  const [method, setMethod] = useState(initial.method ?? "GET");
  const [headers, setHeaders] = useState<Pair[]>([]);
  const [cookies, setCookies] = useState<Pair[]>([]);
  const { data, error, loading, run } = useApi<FetchResult>();

  // useApi manda um objeto simples; cabeçalhos e cookies repetem a chave, então montamos a query à mão.
  function send(u = url, m = method) {
    const qs = new URLSearchParams({ url: u, method: m });
    headers.filter((h) => h.name.trim()).forEach((h) => qs.append("h", `${h.name.trim()}: ${h.value}`));
    cookies.filter((c) => c.name.trim()).forEach((c) => qs.append("cookie", `${c.name.trim()}=${c.value}`));
    syncUrl({ url: u, method: m });
    run("/api/fetch", Object.fromEntries(qs), qs);
  }

  useEffect(() => {
    if (initial.url) run("/api/fetch", { url: initial.url, method: initial.method ?? "GET" });
  }, [initial.url, initial.method, run]);

  return (
    <div className="space-y-4">
      <FormCard onSubmit={() => send()}>
        <div>
          <Label htmlFor="url">URL</Label>
          <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://httpbin.org/get" required />
        </div>
        <div>
          <Label htmlFor="method">{t.method}</Label>
          <select id="method" className={`${inputClass} sm:w-40`} value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>HEAD</option>
          </select>
        </div>
        <PairList label={t.headers} empty={t.noHeaders} pairs={headers} onChange={setHeaders} />
        <PairList label={t.cookies} empty={t.noCookies} pairs={cookies} onChange={setCookies} />
        <Button type="submit" block loading={loading}>
          {t.submit} <CloudDownload className="size-4" />
        </Button>
      </FormCard>

      <ResultFlow
        loading={loading}
        error={error}
        hasData={!!data}
        start={fmtNode(t.start, <InlineChip>{method}</InlineChip>, <InlineChip>{url}</InlineChip>)}
        done={
          data && (
            fmtNode(t.done, <InlineChip>{method}</InlineChip>, <InlineChip>{data.final.url}</InlineChip>, <Pill tone={tone(data.final.status)}>{data.final.status} {data.final.statusText}</Pill>, data.final.timing.total)
          )
        }
      >
        {data && (
          <Card className="overflow-hidden">
            <div className={`flex flex-wrap items-center gap-3 px-5 py-3 text-sm ${data.final.status < 300 ? "bg-ok-bg text-ok" : data.final.status < 400 ? "bg-warn-bg text-warn" : "bg-bad-bg text-bad"}`}>
              <strong>{data.final.status} {data.final.statusText}</strong>
              <span>{data.final.timing.total} ms</span>
              {data.final.headers["content-type"] && <Mono>{data.final.headers["content-type"].split(";")[0]}</Mono>}
            </div>
            {data.hops.length > 1 && (
              <Collapsible title={t.redirects} count={data.hops.length - 1}>
                <ol className="divide-y divide-hair border-t border-hair">
                  {data.hops.map((h, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                      <Pill tone={tone(h.status)}>{h.status}</Pill>
                      <span className="min-w-0 flex-1 font-mono text-[13px] break-all text-strong">{h.url}</span>
                      <span className="font-mono text-xs text-dim">{h.timing.total} ms</span>
                    </li>
                  ))}
                </ol>
              </Collapsible>
            )}
            <Collapsible title={t.timings}>
              <div className="grid grid-cols-2 gap-px border-t border-hair bg-hair sm:grid-cols-5">
                {([[t.dns, data.final.timing.dns], [t.connect, data.final.timing.connect], [t.tls, data.final.timing.tls], [t.ttfb, data.final.timing.ttfb], [t.total, data.final.timing.total]] as const).map(([label, ms]) => (
                  <div key={label} className="bg-surface px-5 py-3">
                    <p className="text-xs text-dim">{label}</p>
                    <p className="font-mono text-base text-strong">{ms === null ? "-" : `${ms} ms`}</p>
                  </div>
                ))}
              </div>
            </Collapsible>
            <Collapsible title={t.respHeaders} count={Object.keys(data.final.headers).length}>
              <dl className="divide-y divide-hair border-t border-hair">
                {Object.entries(data.final.headers).map(([k, v]) => (
                  <div key={k} className="grid gap-1 px-5 py-2.5 sm:grid-cols-[220px_1fr] sm:gap-4">
                    <dt><Mono>{k}</Mono></dt>
                    <dd className="font-mono text-[13px] break-all text-strong">{v}</dd>
                  </div>
                ))}
              </dl>
            </Collapsible>
            {(data.body !== null || data.binary) && (
              <Collapsible title={t.body} defaultOpen>
                <div className="border-t border-hair px-5 pt-2 pb-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-dim">
                    <span>{fmt(t.bytes, data.bodyBytes.toLocaleString())} {data.truncated && t.truncated}</span>
                    {data.body && <CopyButton value={data.body} iconOnly />}
                  </div>
                  {data.binary ? (
                    <p className="text-sm text-dim">{t.binary}</p>
                  ) : (
                    <pre className="max-h-[420px] overflow-auto rounded-lg bg-soft p-4 font-mono text-[12.5px] whitespace-pre-wrap break-all text-strong">{data.body}</pre>
                  )}
                </div>
              </Collapsible>
            )}
          </Card>
        )}
      </ResultFlow>
    </div>
  );
}
