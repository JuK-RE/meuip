import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { tools } from "@/lib/tools";

export const alt = "Meu IP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagem de compartilhamento (Open Graph e Twitter), uma por idioma.
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(hasLocale(lang) ? lang : "pt");
  const subtitle = t.meta.title.split(":")[1]?.trim() ?? t.meta.title;
  const icon = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/icons/icon-512.png"))).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0f0d", padding: 72, color: "#ededed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <img src={icon} width={112} height={112} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, color: "#86efac", letterSpacing: 6 }}>JUK.RE</div>
            <div style={{ fontSize: 76, fontWeight: 700, color: "#ffffff" }}>Meu IP</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.15, maxWidth: 1000, color: "#ffffff" }}>{subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {tools.map((tool) => (
              <div key={tool.slug} style={{ display: "flex", padding: "8px 20px", borderRadius: 999, border: "2px solid #2f4a3a", color: "#86efac", fontSize: 26 }}>
                {t.tools[tool.slug].short}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
