"use client";

import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { fmtNode } from "@/components/ui/flow";
import { Button, Card, FormCard, Input, Label, Mono, Pill } from "@/components/ui/kit";
import { InlineChip, ResultFlow, UseMyIp } from "@/components/ui/flow";
import { syncUrl, useApi } from "@/components/ui/useApi";

type PortResult = {
  host: string;
  address: string;
  results: { port: number; state: "open" | "closed" | "filtered"; ms: number | null; service: string | null }[];
};

const COMMON: [number, string][] = [
  [21, "FTP"], [22, "SSH"], [23, "Telnet"], [25, "SMTP"], [53, "DNS"], [80, "HTTP"], [110, "POP3"], [143, "IMAP"],
  [443, "HTTPS"], [465, "SMTPS"], [587, "SMTP (submission)"], [993, "IMAPS"], [1433, "SQL Server"], [3306, "MySQL"],
  [3389, "Remote Desktop"], [5432, "PostgreSQL"], [5900, "VNC"], [6379, "Redis"], [25565, "Minecraft"], [27017, "MongoDB"],
];

const TONE = { open: "ok", closed: "bad", filtered: "warn" } as const;

export function PortTool({ initial }: { initial: { host?: string; ports?: string } }) {
  const t = useT().ui.ports;
  const [host, setHost] = useState(initial.host ?? "");
  const [ports, setPorts] = useState(initial.ports ?? "80");
  const { data, error, loading, run } = useApi<PortResult>();

  function submit() {
    syncUrl({ host, ports });
    run("/api/ports", { host, ports });
  }

  useEffect(() => {
    if (initial.host && initial.ports) run("/api/ports", { host: initial.host, ports: initial.ports });
  }, [initial.host, initial.ports, run]);

  // Clicar numa porta da lista inclui/remove ela do campo (várias portas separadas por vírgula).
  function toggle(port: number) {
    const list = ports.split(/[\s,;]+/).filter(Boolean);
    const has = list.includes(String(port));
    setPorts((has ? list.filter((p) => p !== String(port)) : [...list, String(port)]).join(","));
  }

  const open = data?.results.filter((r) => r.state === "open").length ?? 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_230px]">
      <div className="space-y-4">
        <FormCard onSubmit={submit}>
          <div>
            <Label htmlFor="host">{t.host}</Label>
            <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder={t.hostPh} />
            <UseMyIp onUse={setHost} />
          </div>
          <div>
            <Label htmlFor="ports">{t.ports}</Label>
            <Input id="ports" value={ports} onChange={(e) => setPorts(e.target.value)} placeholder={t.portsPh} required />
          </div>
          <Button type="submit" block loading={loading}>
            {t.submit} <Radio className="size-4" />
          </Button>
        </FormCard>

        <ResultFlow
          loading={loading}
          error={error}
          hasData={!!data}
          start={fmtNode(t.start, <InlineChip>{host || t.yourIp}</InlineChip>)}
          done={data && fmtNode(t.done, open, data.results.length, <InlineChip>{data.host}</InlineChip>)}
        >
          {data && (
            <Card>
              <ul className="divide-y divide-hair">
                {data.results.map((r) => (
                  <li key={r.port} className="flex items-center gap-4 px-5 py-3">
                    <Mono>{r.port}</Mono>
                    <span className="flex-1 text-sm text-strong">{r.service ?? "-"}</span>
                    {r.ms !== null && <span className="font-mono text-xs text-dim">{r.ms} ms</span>}
                    <Pill tone={TONE[r.state]}>{r.state === "open" ? t.open : r.state === "closed" ? t.closed : t.noReply}</Pill>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </ResultFlow>
        <p className="text-xs text-dim">{t.note}</p>
      </div>

      <aside className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm text-strong">{t.common}</h2>
        <ul className="space-y-0.5">
          {COMMON.map(([port, name]) => {
            const active = ports.split(/[\s,;]+/).includes(String(port));
            return (
              <li key={port}>
                <button
                  type="button"
                  onClick={() => toggle(port)}
                  className={`flex w-full cursor-pointer gap-2 rounded-md px-1.5 py-0.5 text-left text-sm transition-colors hover:bg-tint ${active ? "bg-tint text-strong" : ""}`}
                >
                  <span className="w-11 font-mono text-[13px] text-accent-ink">{port}</span>
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
