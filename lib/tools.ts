import {
  Activity,
  FileSearch,
  Fingerprint,
  Globe,
  MapPin,
  Plug,
  ShieldCheck,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/** Os textos de cada ferramenta (título, descrição, "sobre") ficam em lib/i18n/dictionaries, em `tools[slug]`. */
export const tools = [
  { slug: "my-ip", icon: Fingerprint },
  { slug: "port-checker", icon: Plug },
  { slug: "dns-lookup", icon: Globe },
  { slug: "ssl-checker", icon: ShieldCheck },
  { slug: "whois", icon: FileSearch },
  { slug: "fetch", icon: Terminal },
  { slug: "ip-location", icon: MapPin },
  { slug: "ping", icon: Activity },
] as const satisfies readonly { slug: string; icon: LucideIcon }[];

export type ToolSlug = (typeof tools)[number]["slug"];

export const toolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
