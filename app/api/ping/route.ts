import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { apiRoute } from "@/lib/api";
import { ApiError, parseHost, resolvePublicTarget } from "@/lib/net-guard";

const COUNT = 30;

function tcpOnce(address: string, port: number): Promise<number | null> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const socket = net.connect({ host: address, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok ? Math.round((performance.now() - t0) * 10) / 10 : null);
    };
    socket.setTimeout(2000, () => done(false));
    socket.once("connect", () => done(true));
    // porta fechada (RST) também prova que o host respondeu; só o timeout conta como perda
    socket.once("error", (e: NodeJS.ErrnoException) => done(e.code === "ECONNREFUSED"));
  });
}

/** Tenta abrir o binário `ping`; devolve null se ele não existe neste servidor. */
function startIcmp(address: string, family: 4 | 6): Promise<ChildProcess | null> {
  return new Promise((resolve) => {
    const args = [family === 6 ? "-6" : "-4", "-n", "-c", String(COUNT), "-i", "1", "-W", "2", address];
    const child = spawn("ping", args, { stdio: ["ignore", "pipe", "ignore"] });
    child.once("error", () => resolve(null));
    child.once("spawn", () => resolve(child));
  });
}

/**
 * Ping em tempo real: a resposta é um texto que vai sendo escrito linha a linha,
 * no mesmo formato do terminal. Quem chama cancela a requisição para parar.
 */
export const GET = apiRoute(async (req, { params }) => {
  const target = await resolvePublicTarget(parseHost(params.get("host")));
  const port = Number(params.get("port") || 443);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ApiError("invalidPort");

  const encoder = new TextEncoder();
  let cancel = () => {};
  let closed = false; // vira true quando o cliente desconecta ou terminamos: depois disso não se escreve mais no stream

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        if (!closed) controller.enqueue(encoder.encode(text));
      };
      const end = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      send(`PING ${target.hostname} (${target.address})\n`);
      const child = await startIcmp(target.address, target.family);

      if (child) {
        cancel = () => child.kill("SIGINT"); // o ping imprime o resumo ao receber SIGINT
        let pending = "";
        child.stdout?.setEncoding("utf8");
        child.stdout?.on("data", (chunk: string) => {
          pending += chunk;
          const lines = pending.split("\n");
          pending = lines.pop() ?? "";
          for (const line of lines) if (!line.startsWith("PING ")) send(`${line}\n`);
        });
        child.once("close", () => {
          if (pending && !pending.startsWith("PING ")) send(`${pending}\n`);
          end();
        });
        return;
      }

      // Sem ICMP no servidor: mede o tempo de conexão TCP, no mesmo formato.
      let stopped = false;
      cancel = () => (stopped = true);
      const times: number[] = [];
      let sent = 0;
      for (let seq = 1; seq <= COUNT && !stopped; seq++) {
        sent++;
        const ms = await tcpOnce(target.address, port);
        if (ms === null) send(`Request timeout for tcp_seq=${seq} port=${port}\n`);
        else {
          times.push(ms);
          send(`Reply from ${target.address}: tcp_seq=${seq} port=${port} time=${ms} ms\n`);
        }
        if (seq < COUNT && !stopped) await new Promise((r) => setTimeout(r, 1000));
      }
      const loss = Math.round((1 - times.length / sent) * 100);
      send(`\n--- ${target.address} tcp ping statistics ---\n${sent} packets transmitted, ${times.length} received, ${loss}% packet loss\n`);
      if (times.length) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        send(`rtt min/avg/max = ${Math.min(...times)}/${avg.toFixed(1)}/${Math.max(...times)} ms\n`);
      }
      end();
    },
    cancel() {
      closed = true;
      cancel();
    },
  });
  req.signal.addEventListener("abort", () => cancel());

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
});
