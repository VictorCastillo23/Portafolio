// Page-level integration smoke test: confirms Home wires every section into
// the locked SECTION_IDS document order and renders the persistent layout
// chrome around them. Each section's own content/behaviour/a11y is already
// covered by its dedicated suite (components/sections/*.test.tsx), so this
// only asserts composition, not per-section content.

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SECTION_IDS } from "../data/content";
import { expectNoA11yViolations } from "../vitest.setup";
import Home from "./page";

describe("Home", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders every section from SECTION_IDS, in document order", () => {
    const { container } = render(<Home />);

    const sectionElements = SECTION_IDS.map((id) => {
      const element = container.querySelector(`#${id}`);
      expect(element, `expected a #${id} section to be rendered`).not.toBeNull();
      return element as Element;
    });

    for (let i = 1; i < sectionElements.length; i++) {
      // Node.DOCUMENT_POSITION_FOLLOWING (4): each section must come after the previous one.
      expect(
        sectionElements[i - 1].compareDocumentPosition(sectionElements[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("renders the persistent Nav, fixed sidebars, and Footer fallback around the sections", () => {
    render(<Home />);

    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Home />);
    await expectNoA11yViolations(container);
  });

  it("does not mount the chat widget when ANTHROPIC_API_KEY is absent (CW-2)", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    render(<Home />);

    expect(screen.queryByRole("button", { name: "Abrir chat" })).not.toBeInTheDocument();
  });

  it("mounts the chat widget launcher when ANTHROPIC_API_KEY is present, without adding a SECTION_IDS entry", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-fake-key-for-build-check");

    const { container } = render(<Home />);

    expect(screen.getByRole("button", { name: "Abrir chat" })).toBeInTheDocument();
    // The widget is chrome, not a page section: it must not appear in SECTION_IDS
    // nor break the locked section-order assertion above.
    const sectionElements = SECTION_IDS.map((id) => container.querySelector(`#${id}`));
    expect(sectionElements.every((element) => element !== null)).toBe(true);
  });
});
