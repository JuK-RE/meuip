import type { IconType } from "react-icons";
import { SquareTerminal } from "lucide-react";
import { SiGo, SiJavascript, SiPhp, SiPython, SiRuby } from "react-icons/si";
import { TbBrandCSharp, TbBrandPowershell } from "react-icons/tb";

const ICONS: Record<string, { Icon: IconType; color: string }> = {
  curl: { Icon: SquareTerminal as IconType, color: "#073551" },
  js: { Icon: SiJavascript, color: "#c9a800" },
  python: { Icon: SiPython, color: "#3776ab" },
  php: { Icon: SiPhp, color: "#777bb4" },
  go: { Icon: SiGo, color: "#00a7d0" },
  ruby: { Icon: SiRuby, color: "#cc342d" },
  csharp: { Icon: TbBrandCSharp, color: "#68217a" },
  powershell: { Icon: TbBrandPowershell, color: "#2671be" },
};

/** Logo da linguagem, na cor da marca, sobre um disco branco (para aparecer bem em qualquer fundo). */
export function LangIcon({ id, size = 22 }: { id: string; size?: number }) {
  const entry = ICONS[id];
  if (!entry) return null;
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-white" style={{ width: size, height: size }}>
      <entry.Icon color={entry.color} style={{ width: size * 0.62, height: size * 0.62 }} aria-hidden />
    </span>
  );
}
