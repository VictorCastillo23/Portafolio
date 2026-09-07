import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { ProjectCard } from "./ProjectCard";

const baseProject = {
  repo: "Es_Vitrina",
  title: "Es Vitrina",
  description: "Plataforma de portafolio digital.",
  stack: ["TypeScript", "Next.js"],
  repoUrl: "https://github.com/VictorCastillo23/Es_Vitrina",
  demoUrl: "https://esvitrina.com",
  tier: "featured" as const,
  order: 1,
};

describe("ProjectCard", () => {
  it("renders the featured eyebrow and a demo link when demoUrl is present", () => {
    render(<ProjectCard project={baseProject} variant="featured" />);

    expect(screen.getByText("Proyecto destacado")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Es Vitrina" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Demo de Es Vitrina" })).toHaveAttribute(
      "href",
      "https://esvitrina.com",
    );
    expect(screen.getByRole("link", { name: "Código de Es Vitrina en GitHub" })).toHaveAttribute(
      "href",
      baseProject.repoUrl,
    );
  });

  it("omits the featured eyebrow and demo link for the 'other' variant with no demoUrl", () => {
    render(<ProjectCard project={{ ...baseProject, demoUrl: null }} variant="other" />);

    expect(screen.queryByText("Proyecto destacado")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Demo de/ })).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProjectCard project={baseProject} variant="featured" />);
    await expectNoA11yViolations(container);
  });
});
