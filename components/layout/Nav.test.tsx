// Render/interaction/a11y smoke tests for Nav (presentational component —
// design's test-scoping decision keeps this out of strict TDD). The
// underlying useActiveSection hook already has its own full TDD suite
// (lib/useActiveSection.test.ts); here we only need to confirm Nav wires it
// up correctly, plus its own hamburger/keyboard/backdrop behaviour.

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations, mockIntersectionObservers } from "../../vitest.setup";
import { Nav } from "./Nav";

function appendSection(id: string): HTMLElement {
  const element = document.createElement("section");
  element.id = id;
  document.body.appendChild(element);
  return element;
}

function latestObserver() {
  const observer = mockIntersectionObservers[mockIntersectionObservers.length - 1];
  if (!observer) {
    throw new Error("No IntersectionObserver instance was constructed.");
  }
  return observer;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Nav", () => {
  it("renders the logo linking to #hero and every nav item from data/content.ts", () => {
    render(<Nav />);
    const desktopNav = screen.getByRole("navigation", { name: "Navegación principal" });

    expect(within(desktopNav).getByRole("link", { name: "VC" })).toHaveAttribute("href", "#hero");

    for (const item of content.nav) {
      const link = within(desktopNav).getByRole("link", { name: new RegExp(item.label) });
      expect(link).toHaveAttribute("href", `#${item.id}`);
    }
  });

  it("hamburger toggle opens and closes the mobile menu, updating aria-expanded", () => {
    render(<Nav />);
    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    const panel = document.getElementById("mobile-nav-menu");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel?.className.split(" ")).toContain("hidden");

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Note: the open state keeps "md:hidden" (so the panel never shows
    // alongside the full desktop nav at md+); only the bare "hidden" token
    // is toggled off.
    expect(panel?.className.split(" ")).not.toContain("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));

    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes the mobile menu and returns focus to the toggle on Escape", () => {
    render(<Nav />);
    const toggle = screen.getByRole("button", { name: "Abrir menú" });

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.keyDown(document, { key: "Escape" });

    const reopenedToggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(reopenedToggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(reopenedToggle);
  });

  it("closes the mobile menu when a mobile link is clicked", () => {
    render(<Nav />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    const panel = document.getElementById("mobile-nav-menu") as HTMLElement;
    const firstItem = content.nav[0];
    const mobileLink = within(panel).getByRole("link", { name: new RegExp(firstItem.label) });

    fireEvent.click(mobileLink);

    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("highlights the active nav link reported by the scroll-spy hook", () => {
    const aboutSection = appendSection("about");
    render(<Nav />);
    const desktopNav = screen.getByRole("navigation", { name: "Navegación principal" });
    const observer = latestObserver();

    act(() => {
      observer.callback(
        [{ target: aboutSection, isIntersecting: true } as unknown as IntersectionObserverEntry],
        observer,
      );
    });

    const activeLink = within(desktopNav).getByRole("link", { name: /Sobre mí/ });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("has no accessibility violations when closed or open", async () => {
    const { container } = render(<Nav />);
    await expectNoA11yViolations(container);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    await expectNoA11yViolations(container);
  });
});
