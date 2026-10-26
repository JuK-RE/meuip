# My IP 2.0

**English** · [Português](README.md)

Free network tools that run right in your browser, with no sign up. It's **meuip.juk.re** rewritten in Next.js, with the JUK.re family look and a light green tone.

Find your IP, test ports, query DNS, check SSL/TLS certificates, look up WHOIS, make HTTP requests, locate an IP on a map and measure latency with live ping. Everything is also available through a simple HTTP API.

![Home page](docs/screenshots/home.png)

## Tools

| Tool | What it does |
|---|---|
| **My IP** | Shows your public IP, reverse host, provider and location |
| **Port checker** | Tells you if a port is open, closed or not responding (up to 20 per request) |
| **DNS lookup** | A, AAAA, CNAME, MX, NS, TXT, SOA, CAA and SRV, on Cloudflare, Google, Quad9, OpenDNS or the server's resolver |
| **SSL/TLS checker** | Certificate, chain, expiry, accepted protocols and cipher |
| **WHOIS lookup** | Domains and IP blocks, following IANA's referrals to the official registry (including Registro.br) |
| **Fetch** | HTTP request with headers and cookies, redirects, timings and response body |
| **Network location** | Country, city, provider and ASN of an IP or domain, with a map |
| **Ping** | Real time latency in terminal format, with a stop button |

<table>
  <tr>
    <td><img src="docs/screenshots/port-checker.png" alt="Port checker"></td>
    <td><img src="docs/screenshots/dns-lookup.png" alt="DNS lookup"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/ssl-checker.png" alt="SSL/TLS checker"></td>
    <td><img src="docs/screenshots/ping.png" alt="Live ping"></td>
  </tr>
</table>

## Themes and languages

The site has light, dark and system themes, and works in **Portuguese, English, Spanish and French**. The language lives in the URL (`/pt`, `/en`, `/es`, `/fr`) and a notice suggests the browser's language when it differs from the page's.

![Dark theme](docs/screenshots/home-dark.png)

## Docs and Developers

The **docs** have a side menu, search with `Ctrl+K`, "On this page" and a button to copy the page as Markdown. They include guides (public IP and CGNAT, port forwarding, DNS, certificates) and a developer section: API overview, reference, real time responses, recipes and limits.

![Docs](docs/screenshots/docs.png)

The **Developers** page shows how to use each route in 8 languages (cURL, JavaScript, Python, PHP, Go, Ruby, C# and PowerShell), with a sample response and a button to run the call. It follows the site theme: **PowerShell** look on light, **CMD** look on dark.

<table>
  <tr>
    <td><img src="docs/screenshots/developers.png" alt="Developers on the light theme (PowerShell)"></td>
    <td><img src="docs/screenshots/developers-dark.png" alt="Developers on the dark theme (CMD)"></td>
  </tr>
</table>

### On mobile

<table>
  <tr>
    <td><img src="docs/screenshots/mobile.png" alt="Home page on mobile" width="260"></td>
    <td><img src="docs/screenshots/mobile-developers.png" alt="Developers on mobile" width="260"></td>
  </tr>
</table>

## Running it

Needs Node.js 20 or newer.

```bash
npm install
npm run dev     # http://localhost:3000
```

For production:

```bash
npm run build
npm start
```

## API

Every route is a `GET`, answers in JSON (ping answers in plain text, line by line) and needs no key.

```bash
curl https://meuip.juk.re/api/ip
curl "https://meuip.juk.re/api/dns?name=example.com&type=A,MX"
curl "https://meuip.juk.re/api/ports?host=example.com&ports=80,443"
curl -N "https://meuip.juk.re/api/ping?host=1.1.1.1"
```

The limit is 30 requests per minute per IP. Errors come with an `error` field in the language of the `x-lang` or `Accept-Language` header. The full route list is at `/en/developers` and in `lib/api-docs.ts`.

## How the project is organized

- `app/[lang]/` is the site, with the language in the URL. Without a prefix, `proxy.ts` redirects using the `lang` cookie or `Accept-Language`.
- `app/api/*/route.ts` has one route per tool, all through `apiRoute` (`lib/api.ts`): rate limit, JSON and translated errors.
- `lib/net-guard.ts` blocks SSRF: every lookup resolves the host, refuses private or reserved IPs and connects to the already validated IP.
- `lib/i18n/dictionaries/*.ts` holds all the interface text. `pt.ts` defines the shape and the other three follow the same type, so a missing key is a TypeScript error.
- `lib/i18n/docs/*.ts` holds the docs articles.
- `lib/tools.ts` lists the tools. To add one, add an entry here, the texts in the dictionaries, a route in `app/api` and the component in `components/tools`.
- `components/dev/` and `lib/snippets.ts` build the Developers page.
- `app/globals.css` holds the theme (light green, dark and the PowerShell/CMD look).

SEO: per page metadata with hreflang, Open Graph, structured data, `sitemap.xml`, `robots.txt`, `manifest.webmanifest` and `llms.txt`. On another domain, set `NEXT_PUBLIC_SITE_URL`.

## In production

- The visitor's IP comes from `cf-connecting-ip`, `x-real-ip` or `x-forwarded-for`. Run behind a proxy that overwrites these headers, otherwise they can be forged.
- The rate limit is in memory, per process. With several replicas, switch to Redis or similar.
- Ping uses the `ping` binary when it exists and, when it doesn't (for example in a slim Docker image), measures TCP connect time. Behind nginx, keep buffering off for `/api/ping` (the route already sends `X-Accel-Buffering: no`).
- Geolocation uses ipwho.is. Switching providers only touches `app/api/geo/route.ts`.
- The server needs outbound access to ports 43 (WHOIS), 53 (DNS) and arbitrary ports.

## Screenshots

The images in `docs/screenshots` are generated by a script that uses headless Chrome:

```bash
npm run build && npm start -- -p 3111
CHROME_PATH=/path/to/chrome npm run screenshots
```

The script sends the header `x-real-ip: 203.0.113.42` (an address reserved for documentation), so the images don't show anyone's IP.

---

© 2026 JUK.re, developed by Juca ([josuejuca.com](https://josuejuca.com)).
