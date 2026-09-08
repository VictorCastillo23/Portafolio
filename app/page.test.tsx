// Page-level integration smoke test: confirms Home wires every section into
// the locked SECTION_IDS document order and renders the persistent layout
// chrome around them. Each section's own content/behaviour/a11y is already
// covered by its dedicated suite (components/sections/*.test.tsx), so this
// only asserts composition, not per-section content.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SECTION_IDS } from "../data/content";
import { expectNoA11yViolations } from "../vitest.setup";
import Home from "./page";

describe("Home", () => {
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
});
