"use client";

import { motion } from "motion/react";
import { CircleCheck, CircleX, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n/config";
import { Button, Card, CopyButton, FormCard, Input, Label, Mono, Pill } from "@/components/ui/kit";
import { Collapsible, InlineChip, ResultFlow, fmtNode } from "@/components/ui/flow";
import { syncUrl, useApi } from "@/components/ui/useApi";

type Cert = {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serial: string;
  fingerprint256: string;
  san: string[];
  keyType: string | null;
  keyBits: number | string | null;
  isCa: boolean;
};

type SslResult = {
  host: string;
  port: number;
  address: string;
  handshakeMs: number;
  protocol: string | null;
  cipher: string;
  alpn: string | null;
  trusted: boolean;
  trustError: string | null;
  matchesHost: boolean;
  daysLeft: number;
  certificate: Cert;
  chain: Cert[];
  protocols: { version: string; supported: boolean }[];
};

const fmtDate = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

function Row({ label, value, copy }: { label: string; value: React.ReactNode; copy?: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr_auto] items-center gap-3 border-t border-hair px-5 py-3 text-sm first:border-t-0 sm:grid-cols-[150px_1fr_auto]">
      <span className="text-dim">{label}</span>
      <span className="min-w-0 break-words text-strong">{value}</span>
      <span className="w-6">{copy && <CopyButton value={copy} iconOnly />}</span>
    </div>
  );
}

export function SslTool({ initial }: { initial: { host?: string; port?: string } }) {
  const { locale, t: dict } = useI18n();
  const t = dict.ui.ssl;
  const date = (iso: string) => fmtDate(iso, locale);
  const [host, setHost] = useState(initial.host ?? "");
  const [port, setPort] = useState(initial.port ?? "443");
  const { data, error, loading, run } = useApi<SslResult>();

  useEffect(() => {
    if (initial.host) run("/api/ssl", { host: initial.host, port: initial.port ?? "443" });
  }, [initial.host, initial.port, run]);

  const c = data?.certificate;
  const total = c ? new Date(c.validTo).getTime() - new Date(c.validFrom).getTime() : 1;
  // fração do prazo já consumida, a partir dos dias restantes calculados no servidor
  const used = data ? Math.min(Math.max(1 - (data.daysLeft * 86_400_000) / total, 0), 1) : 0;
  const valid = !!data && data.trusted && data.matchesHost && data.daysLeft >= 0;
  const barTone = !data ? "" : data.daysLeft < 0 ? "bg-bad" : data.daysLeft < 15 ? "bg-warn" : "bg-accent";

  return (
    <div className="space-y-4">
      <FormCard onSubmit={() => (syncUrl({ host, port }), run("/api/ssl", { host, port }))}>
        <div>
          <Label htmlFor="host">{t.host}</Label>
          <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="exemplo.com" required />
        </div>
        <div>
          <Label htmlFor="port">{t.port}</Label>
          <Input id="port" inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value)} />
        </div>
        <Button type="submit" block loading={loading}>
          {t.submit} <ShieldCheck className="size-4" />
        </Button>
      </FormCard>

      <ResultFlow
        loading={loading}
        error={error}
        hasData={!!data}
        start={fmtNode(t.start, <InlineChip>{host}:{port}</InlineChip>)}
        done={data && fmtNode(t.done, <InlineChip>{data.host}:{data.port}</InlineChip>)}
      >
        {data && c && (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <span className={`inline-flex items-center gap-2 text-base ${valid ? "text-ok" : "text-bad"}`}>
                {valid ? <CircleCheck className="size-5" /> : <CircleX className="size-5" />}
                {valid ? t.valid : t.problems}
              </span>
              <Mono>{data.host}:{data.port}</Mono>
            </div>
            <div className="border-t border-hair px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="text-strong">{data.daysLeft < 0 ? fmt(t.expiredAgo, -data.daysLeft) : fmt(t.expiresIn, data.daysLeft)}</span>
                <span className="font-mono text-xs text-dim">{date(c.validFrom)} → {date(c.validTo)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hover">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${used * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full ${barTone}`}
                />
              </div>
            </div>
            {data.trustError && <p className="border-t border-hair bg-bad-bg px-5 py-3 text-sm text-bad">{fmt(t.failed, data.trustError)}</p>}
            <Row label={t.issuedTo} value={<Mono>{c.subject}</Mono>} copy={c.subject} />
            <Row label={t.issuedBy} value={c.issuer} copy={c.issuer} />
            <Row label={t.validFrom} value={date(c.validFrom)} />
            <Row label={t.validUntil} value={date(c.validTo)} />
            <Row label={t.nameMatch} value={<Pill tone={data.matchesHost ? "ok" : "bad"}>{data.matchesHost ? t.matches : t.noMatch}</Pill>} />
            <Row
              label={fmt(t.names, c.san.length)}
              value={
                <span className="flex flex-wrap gap-1.5">
                  {c.san.map((n) => (
                    <span key={n} className="rounded-md border border-line px-1.5 py-0.5 font-mono text-xs">{n}</span>
                  ))}
                </span>
              }
              copy={c.san.join(", ")}
            />
            <Row label={t.key} value={c.keyType && `${c.keyType.toUpperCase()} ${c.keyBits ?? ""}`} />
            <Row label={t.protocol} value={`${data.protocol} · ${data.cipher}${data.alpn ? ` · ${data.alpn}` : ""}`} />
            <Row label={t.handshake} value={`${data.handshakeMs} ms (${data.address})`} />
            <Row label="SHA-256" value={<span className="font-mono text-xs break-all">{c.fingerprint256}</span>} copy={c.fingerprint256} />

            <div className="border-t border-line">
              <Collapsible title={t.protocols} defaultOpen>
                <ul className="flex flex-wrap gap-2 px-5 pb-4">
                  {data.protocols.map((p) => {
                    const legacy = p.version === "TLSv1" || p.version === "TLSv1.1";
                    return (
                      <li key={p.version}>
                        <Pill tone={p.supported ? (legacy ? "warn" : "ok") : "neutral"}>
                          {p.version}: {p.supported ? (legacy ? t.activeLegacy : t.active) : t.disabled}
                        </Pill>
                      </li>
                    );
                  })}
                </ul>
              </Collapsible>
              <Collapsible title={t.chain} count={data.chain.length}>
                <ol className="divide-y divide-hair border-t border-hair">
                  {data.chain.map((cert, i) => (
                    <li key={cert.fingerprint256} className="px-5 py-3 text-sm">
                      <span className="mr-2 font-mono text-xs text-dim">{i + 1}.</span>
                      <span className="text-strong">{cert.subject}</span>
                      <span className="block pl-5 text-xs text-dim">{fmt(t.chainItem, cert.issuer, date(cert.validTo))}</span>
                    </li>
                  ))}
                </ol>
              </Collapsible>
            </div>
          </Card>
        )}
      </ResultFlow>
    </div>
  );
}
