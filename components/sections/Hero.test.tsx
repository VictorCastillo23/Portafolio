// Render/a11y smoke test (presentational component, design's test-scoping
// decision — see Phase 5 apply notes for why this is not strict TDD).

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

  it("has no accessibility violations", async () => {
    const { container } = render(<Hero />);
    await expectNoA11yViolations(container);
  });
});
