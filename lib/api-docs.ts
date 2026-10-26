import type { ToolSlug } from "./tools";

/** Descrição técnica da API pública. Os textos explicativos de cada rota vêm do dicionário (tools[slug].description). */
export type Endpoint = {
  tool: ToolSlug;
  /** Letra do atalho de teclado da página Developers. */
  key: string;
  path: string;
  params: { name: string; example: string; optional?: boolean; note?: string }[];
  example: string;
  /** Exemplo de resposta (JSON, ou texto no caso do ping). */
  response: string;
  stream?: boolean;
};

export const endpoints: Endpoint[] = [
  {
    tool: "my-ip",
    key: "I",
    path: "/api/ip",
    params: [{ name: "format", example: "text", optional: true, note: "json (default) | text" }],
    example: "/api/ip",
    response: `{
  "ip": "203.0.113.7",
  "version": 4,
  "hostname": "host.example.net",
  "userAgent": "curl/8.5.0",
  "language": null
}`,
  },
  {
    tool: "port-checker",
    key: "P",
    path: "/api/ports",
    params: [
      { name: "host", example: "example.com", optional: true, note: "IP / domain" },
      { name: "ports", example: "80,443,8000-8003", note: "max 20" },
    ],
    example: "/api/ports?host=example.com&ports=80,443",
    response: `{
  "host": "example.com",
  "address": "93.184.216.34",
  "results": [
    { "port": 80, "state": "open", "ms": 19, "service": "HTTP" },
    { "port": 443, "state": "open", "ms": 18, "service": "HTTPS" }
  ]
}`,
  },
  {
    tool: "dns-lookup",
    key: "D",
    path: "/api/dns",
    params: [
      { name: "name", example: "example.com" },
      { name: "type", example: "A,MX", optional: true, note: "A AAAA CNAME MX NS TXT SOA CAA SRV PTR" },
      { name: "resolver", example: "cloudflare", optional: true, note: "system cloudflare google quad9 opendns" },
    ],
    example: "/api/dns?name=example.com&type=A,MX&resolver=cloudflare",
    response: `{
  "name": "example.com",
  "resolver": "cloudflare",
  "ms": 24,
  "records": [
    { "type": "A", "value": "93.184.216.34", "ttl": 300 },
    { "type": "MX", "value": "mail.example.com", "priority": 10 }
  ]
}`,
  },
  {
    tool: "ssl-checker",
    key: "S",
    path: "/api/ssl",
    params: [
      { name: "host", example: "example.com" },
      { name: "port", example: "443", optional: true },
    ],
    example: "/api/ssl?host=example.com",
    response: `{
  "host": "example.com",
  "port": 443,
  "protocol": "TLSv1.3",
  "trusted": true,
  "matchesHost": true,
  "daysLeft": 62,
  "certificate": {
    "subject": "example.com",
    "issuer": "Let's Encrypt R11",
    "validTo": "2026-12-27T23:59:59.000Z"
  },
  "protocols": [
    { "version": "TLSv1.2", "supported": true },
    { "version": "TLSv1.3", "supported": true }
  ]
}`,
  },
  {
    tool: "whois",
    key: "W",
    path: "/api/whois",
    params: [{ name: "q", example: "example.com", note: "domain / IP" }],
    example: "/api/whois?q=example.com",
    response: `{
  "query": "example.com",
  "type": "domain",
  "server": "whois.verisign-grs.com",
  "chain": ["whois.iana.org", "whois.verisign-grs.com"],
  "text": "Domain Name: EXAMPLE.COM\\nRegistrar: ..."
}`,
  },
  {
    tool: "fetch",
    key: "F",
    path: "/api/fetch",
    params: [
      { name: "url", example: "https://example.com" },
      { name: "method", example: "GET", optional: true, note: "GET | HEAD" },
      { name: "h", example: "X-Test: 1", optional: true, note: "repeatable" },
      { name: "cookie", example: "a=1", optional: true, note: "repeatable" },
    ],
    example: "/api/fetch?url=https://example.com&method=HEAD",
    response: `{
  "hops": [{ "url": "https://example.com/", "status": 200 }],
  "final": {
    "status": 200,
    "statusText": "OK",
    "headers": { "content-type": "text/html" },
    "timing": { "dns": 21, "connect": 19, "tls": 23, "ttfb": 68, "total": 68 }
  },
  "body": null
}`,
  },
  {
    tool: "ip-location",
    key: "L",
    path: "/api/geo",
    params: [{ name: "q", example: "8.8.8.8", optional: true, note: "IP / domain" }],
    example: "/api/geo?q=8.8.8.8",
    response: `{
  "ip": "8.8.8.8",
  "country": "United States",
  "countryCode": "US",
  "city": "Mountain View",
  "latitude": 37.386,
  "longitude": -122.084,
  "asn": 15169,
  "isp": "Google LLC"
}`,
  },
  {
    tool: "ping",
    key: "T",
    path: "/api/ping",
    params: [
      { name: "host", example: "1.1.1.1" },
      { name: "port", example: "443", optional: true, note: "TCP fallback" },
    ],
    example: "/api/ping?host=1.1.1.1",
    stream: true,
    response: `PING 1.1.1.1 (1.1.1.1)
64 bytes from 1.1.1.1: icmp_seq=1 ttl=55 time=14.4 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=55 time=14.7 ms
...`,
  },
];
