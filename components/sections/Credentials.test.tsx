import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Credentials } from "./Credentials";

describe("Credentials", () => {
  it("renders the WER 2023 award and the MICAI 2025 publication", () => {
    render(<Credentials />);

    expect(
      screen.getByText(/2° Lugar Internacional — Torneo Mundial WER/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Diciembre 2023/)).toBeInTheDocument();

    expect(screen.getByText(/From Keyframes to Narrative/)).toBeInTheDocument();
    expect(screen.getByText(/MICAI 2025/)).toBeInTheDocument();
  });

  it("renders every certification from data/content.ts", () => {
    render(<Credentials />);

    expect(screen.getByText("Claude with the Anthropic API")).toBeInTheDocument();
    expect(
      screen.getByText("Google Data Analytics — Preparar datos para la exploración"),
    ).toBeInTheDocument();
  });

  it("links every credential to its url", () => {
    render(<Credentials />);

    for (const credential of content.credentials) {
      if (!credential.url) continue;
      const link = screen.getByRole("link", { name: credential.title });
      expect(link).toHaveAttribute("href", credential.url);
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("makes the whole card clickable and highlights the title on card hover", () => {
    render(<Credentials />);

    for (const credential of content.credentials) {
      if (!credential.url) continue;
      const link = screen.getByRole("link", { name: credential.title });
      const card = link.closest("li")!;

      // Stretched link: the anchor's ::after covers the whole (relative) card.
      expect(card).toHaveClass("relative", "group");
      expect(link).toHaveClass("after:absolute", "after:inset-0");
      // Title turns accent when hovering anywhere on the card.
      expect(link).toHaveClass("group-hover:text-accent");
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Credentials />);
    await expectNoA11yViolations(container);
  });
});
