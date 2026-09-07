import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Placeholder metadata for the scaffold. Full SEO/OpenGraph metadata is wired
// in a later phase once site content and the production URL are locked in.
export const metadata: Metadata = {
  title: "Víctor Castillo",
  description: "Portafolio de Víctor Castillo, desarrollador full stack.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-ink text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
