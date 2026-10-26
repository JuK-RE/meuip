"use client";

import { Binoculars } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n/config";
import { Button, CopyButton, FormCard, Input, Label } from "@/components/ui/kit";
import { Collapsible, InlineChip, ResultFlow, fmtNode } from "@/components/ui/flow";
import { syncUrl, useApi } from "@/components/ui/useApi";

type WhoisResult = { query: string; type: "ip" | "domain"; server: string; text: string; chain: string[] };

/** "Chave: valor" por linha; linhas de aviso (% # >>>) e sem valor viram títulos ou são ignoradas. */
function parse(text: string): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^[%#>]/.test(line) || /^(for more information|terms of use|the data in)/i.test(line)) continue;
    const m = line.match(/^([^:]{1,60}):\s*(.*)$/);
    if (m && m[2]) rows.push({ key: m[1].trim(), value: m[2].trim() });
  }
  return rows;
}

export function WhoisTool({ initial }: { initial: { q?: string } }) {
  const tc = useT().common;
  const t = useT().ui.whois;
  const [q, setQ] = useState(initial.q ?? "");
  const { data, error, loading, run } = useApi<WhoisResult>();

  useEffect(() => {
    if (initial.q) run("/api/whois", { q: initial.q });
  }, [initial.q, run]);

  const rows = useMemo(() => (data ? parse(data.text) : []), [data]);

  return (
    <div className="space-y-4">
      <FormCard onSubmit={() => (syncUrl({ q }), run("/api/whois", { q }))}>
        <div>
          <Label htmlFor="q">{t.label}</Label>
          <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} required />
        </div>
        <Button type="submit" block loading={loading}>
          {t.submit} <Binoculars className="size-4" />
        </Button>
      </FormCard>

      <ResultFlow
        loading={loading}
        error={error}
        hasData={!!data}
        start={fmtNode(t.start, <InlineChip>{q}</InlineChip>)}
        done={data && <>{fmtNode(t.done, <InlineChip>{data.query}</InlineChip>)} <span className="text-dim">{fmt(t.via, data.chain.join(", "))}</span></>}
      >
        {data && (
          <div className="overflow-hidden rounded-xl bg-soft">
            {rows.length > 0 && (
              <dl className="space-y-1.5 px-4 py-4">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 text-[13px]">
                    <dt className="w-44 shrink-0 pt-0.5 text-dim sm:w-56">{r.key}:</dt>
                    <dd className="min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-hover px-2.5 py-0.5 font-mono text-[12.5px] break-all text-strong">{r.value}</span>
                    </dd>
                    <CopyButton value={r.value} iconOnly />
                  </div>
                ))}
              </dl>
            )}
            <div className="border-t border-line">
              <Collapsible title={t.raw} defaultOpen={rows.length === 0}>
                <div className="flex justify-end px-4"><CopyButton value={data.text} label={tc.copyAll} /></div>
                <pre className="max-h-[420px] overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-strong">{data.text}</pre>
              </Collapsible>
            </div>
          </div>
        )}
      </ResultFlow>
    </div>
  );
}
