import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

  it("has no accessibility violations", async () => {
    const { container } = render(<Credentials />);
    await expectNoA11yViolations(container);
  });
});
