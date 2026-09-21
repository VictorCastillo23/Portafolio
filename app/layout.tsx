import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Epilogue, Google_Sans } from "next/font/google";
import { content } from "../data/content";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
});

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  display: "swap",
  // next/font has no metric-adjusted fallback for Google Sans, so declare a generic one.
  fallback: ["system-ui", "sans-serif"],
});

// SEO/OpenGraph metadata, sourced from data/content.ts so it can never drift
// from the on-page copy. `metadataBase` resolves relative OG URLs; it uses
// `content.meta.siteUrl`, which is still the placeholder flagged in
// data/content.ts until the real production domain is deployed. og:image is
// intentionally omitted — no OG image asset exists yet, and Next.js falls
// back gracefully (no broken image reference) when it's absent.
const title = `${content.meta.name} | ${content.meta.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(content.meta.siteUrl),
  title,
  description: content.meta.description,
  openGraph: {
    title,
    description: content.meta.description,
    url: content.meta.siteUrl,
    siteName: content.meta.name,
    locale: "es_MX",
    type: "website",
  },
};

// Runs synchronously in <head>, before first paint, so the stored (or OS-level)
// theme is applied without a flash of the wrong palette. Blocked storage falls
// back to the OS preference; any other failure leaves the light default.
const THEME_INIT_SCRIPT = `(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}try{if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the script above sets data-theme on <html>
    // before React hydrates, so the attribute intentionally differs from the
    // server markup.
    <html
      lang="es"
      className={`${epilogue.variable} ${googleSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-ink text-text font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
