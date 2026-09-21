import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Icon } from "./Icon";
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

  it("makes the whole card a link to the demo when demoUrl is present", () => {
    render(<ProjectCard project={baseProject} variant="featured" />);

    const cardLink = screen.getByRole("link", { name: "Es Vitrina" });
    expect(cardLink).toHaveAttribute("href", baseProject.demoUrl);
    expect(cardLink).toHaveAttribute("target", "_blank");
    // Stretched link: the anchor's ::after covers the whole (relative) card.
    expect(cardLink.closest("article")).toHaveClass("relative");
    expect(cardLink).toHaveClass("after:absolute", "after:inset-0");
  });

  it("falls back to the repo url for the card link when there is no demoUrl", () => {
    render(<ProjectCard project={{ ...baseProject, demoUrl: null }} variant="other" />);

    expect(screen.getByRole("link", { name: "Es Vitrina" })).toHaveAttribute(
      "href",
      baseProject.repoUrl,
    );
  });

  it("keeps the icon buttons clickable above the card link", () => {
    render(<ProjectCard project={baseProject} variant="featured" />);

    for (const name of ["Código de Es Vitrina en GitHub", "Demo de Es Vitrina"]) {
      expect(screen.getByRole("link", { name })).toHaveClass("relative", "z-10");
    }
  });

  it("treats an empty demoUrl like a missing one", () => {
    render(<ProjectCard project={{ ...baseProject, demoUrl: "" }} variant="other" />);

    expect(screen.getByRole("link", { name: "Es Vitrina" })).toHaveAttribute(
      "href",
      baseProject.repoUrl,
    );
    expect(screen.queryByRole("link", { name: /Demo de/ })).not.toBeInTheDocument();
  });

  it("uses the GitHub logo for the repo link", () => {
    const { container: iconContainer } = render(<Icon name="github" />);
    const githubSvg = iconContainer.querySelector("svg")!.innerHTML;

    render(<ProjectCard project={baseProject} variant="featured" />);

    const repoLink = screen.getByRole("link", { name: "Código de Es Vitrina en GitHub" });
    expect(repoLink.querySelector("svg")!.innerHTML).toBe(githubSvg);
  });

  it("colors the demo button when the card link is hovered and a demo exists", () => {
    render(<ProjectCard project={baseProject} variant="featured" />);

    const hoverClass = "group-has-[[data-card-link]:hover]/card:text-accent";
    expect(screen.getByRole("link", { name: "Demo de Es Vitrina" })).toHaveClass(hoverClass);
    expect(
      screen.getByRole("link", { name: "Código de Es Vitrina en GitHub" }),
    ).not.toHaveClass(hoverClass);
  });

  it("colors the GitHub button when the card link is hovered and there is no demo", () => {
    render(<ProjectCard project={{ ...baseProject, demoUrl: null }} variant="other" />);

    expect(
      screen.getByRole("link", { name: "Código de Es Vitrina en GitHub" }),
    ).toHaveClass("group-has-[[data-card-link]:hover]/card:text-accent");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProjectCard project={baseProject} variant="featured" />);
    await expectNoA11yViolations(container);
  });
});
