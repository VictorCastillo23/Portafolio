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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${epilogue.variable} ${googleSans.variable}`}
    >
      <body className="bg-ink text-text font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
