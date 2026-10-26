import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { LanguagePrompt } from "@/components/LanguagePrompt";
import { I18nProvider } from "@/components/I18nProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { MotionProvider } from "@/components/ui/flow";
import { hasLocale, locales } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dictionaries";
import { SITE_URL } from "@/lib/site";
import "../globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Meu IP",
    title: { default: t.meta.title, template: "%s | Meu IP" },
    description: t.meta.description,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0d" },
  ],
};

// Aplica o tema salvo antes da primeira pintura, pra não piscar claro→escuro.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);

  return (
    <html lang={lang} className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <I18nProvider locale={lang} t={t}>
          <MotionProvider>
            <SiteNav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <LanguagePrompt />
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
