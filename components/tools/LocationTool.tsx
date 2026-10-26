"use client";

import { useEffect, useState } from "react";
import { Map } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n/config";
import { Button, Card, FormCard, Input, KV, Label, Mono } from "@/components/ui/kit";
import { InlineChip, ResultFlow, UseMyIp, fmtNode } from "@/components/ui/flow";
import { syncUrl, useApi } from "@/components/ui/useApi";

export type GeoResult = {
  ip: string;
  version: 4 | 6;
  continent: string;
  country: string;
  countryCode: string;
  flag: string | null;
  region: string;
  city: string;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
  utcOffset: string | null;
  asn: number | null;
  org: string | null;
  isp: string | null;
  domain: string | null;
};

function MapEmbed({ lat, lon }: { lat: number; lon: number }) {
  const title = useT().ui.location.map;
  const d = 0.08;
  const bbox = [lon - d, lat - d, lon + d, lat + d].join("%2C");
  return (
    <iframe
      title={title}
      loading="lazy"
      className="map-embed h-64 w-full border-t border-line"
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`}
    />
  );
}

export function LocationTool({ initial }: { initial: { q?: string } }) {
  const t = useT().ui.location;
  const [q, setQ] = useState(initial.q ?? "");
  const { data, error, loading, run } = useApi<GeoResult>();

  useEffect(() => {
    if (initial.q) run("/api/geo", { q: initial.q });
  }, [initial.q, run]);

  return (
    <div className="space-y-4">
      <FormCard onSubmit={() => (syncUrl({ q }), run("/api/geo", { q }))}>
        <div>
          <Label htmlFor="q">{t.label}</Label>
          <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} />
          <UseMyIp onUse={setQ} />
        </div>
        <Button type="submit" block loading={loading}>
          {t.submit} <Map className="size-4" />
        </Button>
      </FormCard>

      <ResultFlow
        loading={loading}
        error={error}
        hasData={!!data}
        start={fmtNode(t.start, <InlineChip>{q || t.yourIp}</InlineChip>)}
        done={data && `${data.flag ?? ""} ${fmt(t.done, [data.city, data.country].filter(Boolean).join(", "))}`}
      >
        {data && (
          <Card className="overflow-hidden">
            <KV
              rows={[
                [t.address, <Mono key="ip">{data.ip}</Mono>],
                [t.country, `${data.flag ?? ""} ${data.country} (${data.countryCode})`],
                [t.regionCity, [data.city, data.region].filter(Boolean).join(", ")],
                [t.zip, data.postal],
                [t.coords, <Mono key="c">{data.latitude}, {data.longitude}</Mono>],
                [t.timezone, data.timezone && `${data.timezone} (UTC${data.utcOffset ?? ""})`],
                [t.provider, data.isp ?? data.org],
                [t.asn, data.asn && <Mono key="a">AS{data.asn}</Mono>],
                [t.domain, data.domain],
              ]}
            />
            <MapEmbed lat={data.latitude} lon={data.longitude} />
          </Card>
        )}
      </ResultFlow>
      <p className="text-xs text-dim">{t.note}</p>
    </div>
  );
}
