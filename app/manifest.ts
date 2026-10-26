import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meu IP",
    short_name: "Meu IP",
    description: "Network tools: IP address, port checker, DNS, SSL/TLS, WHOIS, fetch, IP location and ping.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f0d",
    theme_color: "#86efac",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
