import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Experience } from "./Experience";

describe("Experience", () => {
  it("renders a tab per job with Juventudes selected by default", () => {
    render(<Experience />);
    const tablist = screen.getByRole("tablist", { name: "Experiencia" });
    const tabs = within(tablist).getAllByRole("tab");

    expect(tabs).toHaveLength(content.experience.length);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveTextContent("Juventudes");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
  });

  it("clicking a tab selects it and shows its panel", () => {
    render(<Experience />);
    const secondTab = screen.getAllByRole("tab")[1];

    fireEvent.click(secondTab);

    expect(secondTab).toHaveAttribute("aria-selected", "true");
    const panel = document.getElementById(secondTab.getAttribute("aria-controls")!);
    expect(panel).not.toHaveAttribute("hidden");
  });

  it("ArrowRight/ArrowLeft move the roving tabindex and wrap around", () => {
    render(<Experience />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[0]);

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tabs[tabs.length - 1]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Experience />);
    await expectNoA11yViolations(container);
  });
});
