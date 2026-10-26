"use client";

import { Globe, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n/config";
import { Button, Card, CopyButton, FormCard, Input, inputClass, Label, Pill } from "@/components/ui/kit";
import { InlineChip, ResultFlow, fmtNode } from "@/components/ui/flow";
import { syncUrl, useApi } from "@/components/ui/useApi";

type DnsResult = {
  name: string;
  resolver: string;
  ms: number;
  records: { type: string; value: string; ttl?: number; priority?: number }[];
};

const TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA", "SRV"];
const RESOLVERS: [string, string][] = [
  ["system", ""],
  ["cloudflare", "Cloudflare 1.1.1.1"],
  ["google", "Google 8.8.8.8"],
  ["quad9", "Quad9 9.9.9.9"],
  ["opendns", "OpenDNS"],
];

function ttl(s: number) {
  return s >= 3600 ? `${Math.round(s / 3600)} h` : s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`;
}

export function DnsTool({ initial }: { initial: { name?: string; type?: string; resolver?: string } }) {
  const t = useT().ui.dns;
  const [name, setName] = useState(initial.name ?? "");
  const [types, setTypes] = useState<string[]>(initial.type && initial.type !== "ALL" ? initial.type.split(",") : ["A"]);
  const [resolver, setResolver] = useState(initial.resolver ?? "system");
  const { data, error, loading, run } = useApi<DnsResult>();

  function go(n = name, t = types, r = resolver) {
    const type = t.join(",");
    syncUrl({ name: n, type, resolver: r });
    run("/api/dns", { name: n, type, resolver: r });
  }

  useEffect(() => {
    if (initial.name) run("/api/dns", { name: initial.name, type: initial.type ?? "A", resolver: initial.resolver ?? "system" });
  }, [initial.name, initial.type, initial.resolver, run]);

  const toggle = (t: string) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="space-y-4">
      <FormCard onSubmit={() => types.length && go()}>
        <div>
          <Label htmlFor="name">{t.name}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="exemplo.com" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t.types}</Label>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-pill px-2.5 py-2">
              {TYPES.map((t) => {
                const on = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(t)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs transition-colors ${on ? "border-tint-line bg-tint text-accent-ink" : "border-line text-dim hover:bg-hover"}`}
                  >
                    {t}
                    {on && <X className="size-3" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label htmlFor="resolver">{t.resolver}</Label>
            <select id="resolver" className={inputClass} value={resolver} onChange={(e) => setResolver(e.target.value)}>
              {RESOLVERS.map(([v, l]) => (
                <option key={v} value={v}>{v === "system" ? t.system : l}</option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" block loading={loading} disabled={!types.length}>
          {t.submit} <Globe className="size-4" />
        </Button>
      </FormCard>

      <ResultFlow
        loading={loading}
        error={error}
        hasData={!!data}
        start={fmtNode(t.start, <InlineChip>{types.join(", ")}</InlineChip>, <InlineChip>{name}</InlineChip>)}
        done={data && (data.ms > 0 ? fmt(t.done, data.records.length, data.ms) : fmt(t.doneNoMs, data.records.length))}
      >
        {data &&
          (data.records.length === 0 ? (
            <p className="text-sm text-dim">{t.none}</p>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-hair">
                  {data.records.map((r, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-5 py-3"><Pill tone="ok">{r.type}</Pill></td>
                      <td className="py-3 pr-4 font-mono text-[13px] break-all text-strong">
                        {r.priority !== undefined && <span className="mr-2 text-dim">{r.priority}</span>}
                        {r.value}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-xs whitespace-nowrap text-dim">{r.ttl !== undefined && `TTL ${ttl(r.ttl)}`}</td>
                      <td className="py-3 pr-4 text-right"><CopyButton value={r.value} iconOnly /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
      </ResultFlow>
    </div>
  );
}
