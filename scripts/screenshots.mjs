// Gera as capturas de tela do README (docs/screenshots) com um Chrome/Chromium em modo headless.
//
//   npm run build && npm start -- -p 3111
//   CHROME_PATH=/caminho/do/chrome npm run screenshots
//
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME_PATH;
if (!CHROME) throw new Error("Defina CHROME_PATH com o caminho do Chrome ou Chromium.");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "screenshots");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3111/pt";
await mkdir(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=9333", "about:blank"], { stdio: "ignore" });
await sleep(2500);
const target = await (await fetch("http://127.0.0.1:9333/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await send("Page.enable");
await send("Network.enable");
// IP de documentação (RFC 5737), para as capturas não mostrarem o IP de ninguém
await send("Network.setExtraHTTPHeaders", { headers: { "x-real-ip": "203.0.113.42" } });

async function shot(name, path, { w = 1440, h = 900, dark = false, mobile = false, wait = 7000, full = false } = {}) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }] });
  await send("Page.navigate", { url: BASE + path });
  await sleep(wait);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
  await writeFile(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64"));
  console.log("ok", name);
}

await shot("home", "");
await shot("home-dark", "", { dark: true });
await shot("port-checker", "/tools/port-checker?host=github.com&ports=22,80,443", { h: 1000 });
await shot("dns-lookup", "/tools/dns-lookup?name=juk.re&type=A,MX,NS&resolver=cloudflare", { h: 900 });
await shot("ssl-checker", "/tools/ssl-checker?host=github.com", { h: 1500, wait: 9000 });
await shot("whois", "/tools/whois?q=registro.br", { h: 1100 });
await shot("ping", "/tools/ping?host=1.1.1.1", { h: 900, wait: 9000 });
await shot("developers", "/developers", { h: 1000 });
await shot("developers-dark", "/developers", { h: 1000, dark: true });
await shot("docs", "/docs/port-forwarding", { h: 900 });
await shot("docs-dark", "/docs/devs", { h: 900, dark: true });
await shot("mobile", "", { w: 390, h: 844, mobile: true });
await shot("mobile-developers", "/developers", { w: 390, h: 844, mobile: true });

ws.close();
chrome.kill();
