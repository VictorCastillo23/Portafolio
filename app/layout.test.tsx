import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { Analytics, SpeedInsights } = vi.hoisted(() => ({
  Analytics: vi.fn(() => null),
  SpeedInsights: vi.fn(() => null),
}));

vi.mock("@vercel/analytics/next", () => ({ Analytics }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights }));
vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "font-manrope" }),
  JetBrains_Mono: () => ({ variable: "font-jetbrains-mono" }),
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
});
