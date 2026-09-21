import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { Analytics, SpeedInsights } = vi.hoisted(() => ({
  Analytics: vi.fn(() => null),
  SpeedInsights: vi.fn(() => null),
}));

vi.mock("@vercel/analytics/next", () => ({ Analytics }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights }));
vi.mock("next/font/google", () => ({
  Epilogue: () => ({ variable: "font-epilogue" }),
  Google_Sans: () => ({ variable: "font-google-sans" }),
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mounts Vercel Analytics once alongside the page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>contenido</main>
      </RootLayout>,
    );

    expect(html).toContain("contenido");
    expect(Analytics).toHaveBeenCalledTimes(1);
  });

  it("mounts Vercel Speed Insights once alongside the page content", () => {
    renderToStaticMarkup(
      <RootLayout>
        <main>contenido</main>
      </RootLayout>,
    );

    expect(SpeedInsights).toHaveBeenCalledTimes(1);
  });

  it("applies the headline and body font variables to <html>", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>contenido</main>
      </RootLayout>,
    );

    expect(html).toContain("font-epilogue");
    expect(html).toContain("font-google-sans");
  });

  it("inlines a theme init script that runs before the page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>contenido</main>
      </RootLayout>,
    );

    const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    expect(script).not.toBeNull();
    expect(script?.[1]).toContain("localStorage");
    expect(script?.[1]).toContain("prefers-color-scheme");
    expect(script?.[1]).toContain("dataset.theme");
    expect(html.indexOf("<script")).toBeLessThan(html.indexOf("contenido"));
  });

  describe("theme init script behavior", () => {
    // Runs the inlined script against fake browser globals (it reads
    // `localStorage`, `matchMedia` and `document` as free variables).
    function runInitScript(options: { stored?: string; storageThrows?: boolean; prefersDark: boolean }) {
      const html = renderToStaticMarkup(
        <RootLayout>
          <main>contenido</main>
        </RootLayout>,
      );
      const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? "";
      const document = { documentElement: { dataset: {} as Record<string, string> } };
      const localStorage = {
        getItem: () => {
          if (options.storageThrows) throw new Error("blocked");
          return options.stored ?? null;
        },
      };
      const matchMedia = () => ({ matches: options.prefersDark });
      new Function("localStorage", "matchMedia", "document", script)(localStorage, matchMedia, document);
      return document.documentElement.dataset.theme;
    }

    it("uses the stored choice over the OS preference", () => {
      expect(runInitScript({ stored: "dark", prefersDark: false })).toBe("dark");
      expect(runInitScript({ stored: "light", prefersDark: true })).toBe("light");
    });

    it("follows the OS preference when nothing valid is stored", () => {
      expect(runInitScript({ prefersDark: true })).toBe("dark");
      expect(runInitScript({ prefersDark: false })).toBe("light");
      expect(runInitScript({ stored: "garbage", prefersDark: true })).toBe("dark");
    });

    it("still follows the OS preference when storage is blocked", () => {
      expect(runInitScript({ storageThrows: true, prefersDark: true })).toBe("dark");
    });
  });
});
