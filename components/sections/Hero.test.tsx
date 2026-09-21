// Render/a11y smoke test (presentational component, design's test-scoping
// decision — see Phase 5 apply notes for why this is not strict TDD).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders the eyebrow, name, tagline, blurb, and CTA from data/content.ts", () => {
    render(<Hero />);

    expect(screen.getByText(content.hero.eyebrow)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: content.hero.title })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: content.hero.tagline }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.hero.blurb)).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: content.hero.cta.label });
    expect(cta).toHaveAttribute("href", content.hero.cta.href);
  });

  it("renders a Download CV link pointing at /victor_cv.pdf with a download attribute", () => {
    render(<Hero />);

    const link = screen.getByRole("link", { name: /descargar cv/i });
    expect(link).toHaveAttribute("href", "/victor_cv.pdf");
    expect(link).toHaveAttribute("download");
  });

  it("renders the portrait above the eyebrow", () => {
    render(<Hero />);

    const portrait = screen.getByRole("img", { name: /victor castillo/i });
    expect(portrait).toHaveAttribute("alt", "Victor Castillo");
    expect(portrait.getAttribute("src") ?? "").toContain("profile.png");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Hero />);
    await expectNoA11yViolations(container);
  });
});
