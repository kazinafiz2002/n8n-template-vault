import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { getLang } from "@/lib/i18n";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: "Ready-made n8n workflow templates — copy and paste into your n8n.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-20">{children}</main>
        <footer className="mt-10 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {site.name}</p>
            <div className="flex gap-5">
              <a href="/#templates" className="hover:text-ink">Templates</a>
              <a href="/pricing" className="hover:text-ink">Pricing</a>
              {site.portfolio && <a href={site.portfolio} className="hover:text-ink">Portfolio</a>}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
