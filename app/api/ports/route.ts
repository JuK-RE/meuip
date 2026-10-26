import net from "node:net";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost, resolvePublicTarget } from "@/lib/net-guard";

const MAX_PORTS = 20;
const TIMEOUT_MS = 3000;

const SERVICES: Record<number, string> = {
  20: "FTP (dados)", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 80: "HTTP", 110: "POP3",
  143: "IMAP", 443: "HTTPS", 465: "SMTPS", 587: "SMTP (submission)", 993: "IMAPS", 995: "POP3S",
  1194: "OpenVPN", 1433: "SQL Server", 1723: "PPTP", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
  5900: "VNC", 6379: "Redis", 8080: "HTTP alt", 8443: "HTTPS alt", 25565: "Minecraft", 27017: "MongoDB",
};

type PortState = "open" | "closed" | "filtered";

function checkPort(address: string, port: number): Promise<{ port: number; state: PortState; ms: number | null }> {
  return new Promise((resolve) => {
    const started = performance.now();
    const socket = net.connect({ host: address, port });
    const done = (state: PortState) => {
      socket.destroy();
      resolve({ port, state, ms: state === "filtered" ? null : Math.round(performance.now() - started) });
    };
    socket.setTimeout(TIMEOUT_MS, () => done("filtered"));
    socket.once("connect", () => done("open"));
    socket.once("error", (e: NodeJS.ErrnoException) => done(e.code === "ECONNREFUSED" ? "closed" : "filtered"));
  });
}

/** "80,443,8000-8003" → [80, 443, 8000, 8001, 8002, 8003] */
function parsePorts(input: string): number[] {
  const out = new Set<number>();
  for (const part of input.split(/[\s,;]+/).filter(Boolean)) {
    const m = part.match(/^(\d{1,5})(?:-(\d{1,5}))?$/);
    if (!m) throw new ApiError("portInvalidItem", 400, part);
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from < 1 || to > 65535 || to < from) throw new ApiError("portOutOfRange", 400, part);
    if (to - from + out.size >= MAX_PORTS) throw new ApiError("tooManyPorts", 400, MAX_PORTS);
    for (let p = from; p <= to; p++) out.add(p);
  }
  if (!out.size) throw new ApiError("needPort");
  return [...out];
}

export const GET = apiRoute(async (_req, { ip, params }) => {
  const host = params.get("host")?.trim();
  const target = await resolvePublicTarget(host ? parseHost(host) : ip);
  const ports = parsePorts(params.get("ports") ?? "");
  const results = await Promise.all(ports.map((p) => checkPort(target.address, p)));
  return {
    host: target.hostname,
    address: target.address,
    results: results.map((r) => ({ ...r, service: SERVICES[r.port] ?? null })),
  };
});
