import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Projects } from "./Projects";

describe("Projects", () => {
  it("renders the two featured projects and three other projects", () => {
    render(<Projects />);

    expect(screen.getByRole("heading", { name: "Es Vitrina" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CameraChatbot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Módulo de Inventario" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Risk Game" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tutorial OpenCV para Principiantes" }),
    ).toBeInTheDocument();
  });

  it("never renders omegaup", () => {
    render(<Projects />);
    expect(screen.queryByText(/omegaup/i)).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Projects />);
    await expectNoA11yViolations(container);
  });
});
