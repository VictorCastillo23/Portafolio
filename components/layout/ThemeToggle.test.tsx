import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    localStorage.clear();
  });

  it("renders a button named 'Modo oscuro' that is not pressed when the page is light", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Modo oscuro" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("is pressed when <html> already carries data-theme=dark", () => {
    document.documentElement.dataset.theme = "dark";

    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Modo oscuro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("toggles data-theme, aria-pressed and the stored preference on each click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Modo oscuro" });

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("theme")).toBe("dark");

    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("still toggles when the preference cannot be stored", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Modo oscuro" });

    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ThemeToggle />);

    await expectNoA11yViolations(container);
  });
});
