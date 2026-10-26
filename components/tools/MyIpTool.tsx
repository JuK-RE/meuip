"use client";

import { useEffect } from "react";
import { useT } from "@/components/I18nProvider";
import { Card, CopyButton, ErrorBox, KV, Mono } from "@/components/ui/kit";
import { useApi } from "@/components/ui/useApi";
import type { GeoResult } from "./LocationTool";

type IpInfo = { ip: string; version: 4 | 6 | null; hostname: string | null; userAgent: string | null; language: string | null };

export function MyIpTool() {
  const t = useT().ui.myIp;
  const info = useApi<IpInfo>();
  const geo = useApi<GeoResult>();

  useEffect(() => {
    info.run("/api/ip", {});
    geo.run("/api/geo", {});
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (info.error) return <ErrorBox message={info.error} />;

  return (
    <div className="space-y-4">
      <Card className="px-6 py-8 text-center">
        <p className="font-mono text-[10.5px] font-medium tracking-[0.08em] text-accent-ink uppercase">{t.eyebrow}</p>
        <p className="mt-3 font-mono text-3xl font-light tracking-tight break-all text-strong sm:text-5xl">{info.data?.ip ?? "..."}</p>
        {info.data && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <CopyButton value={info.data.ip} label={t.copyIp} />
            {info.data.version && <span className="rounded-full bg-tint px-2.5 py-1 text-xs text-accent-ink">IPv{info.data.version}</span>}
          </div>
        )}
      </Card>

      <Card>
        <KV
          rows={[
            [t.reverse, info.data?.hostname && <Mono>{info.data.hostname}</Mono>],
            [t.provider, geo.data && `${geo.data.isp ?? geo.data.org ?? "-"}${geo.data.asn ? ` (AS${geo.data.asn})` : ""}`],
            [t.location, geo.data && `${geo.data.flag ?? ""} ${[geo.data.city, geo.data.region, geo.data.country].filter(Boolean).join(", ")}`],
            [t.timezone, geo.data?.timezone],
            [t.language, info.data?.language],
            [t.browser, info.data?.userAgent && <span className="text-xs text-muted">{info.data.userAgent}</span>],
          ]}
        />
      </Card>
      {geo.error && <p className="text-xs text-dim">{t.locUnavailable}</p>}
    </div>
  );
}
