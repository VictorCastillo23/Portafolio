import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { About } from "./About";

describe("About", () => {
  it("renders the id, heading, paragraphs, skills, and education from data/content.ts", () => {
    render(<About />);

    expect(document.getElementById("about")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Sobre mí" })).toBeInTheDocument();

    for (const paragraph of content.about.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText(content.about.education.degree)).toBeInTheDocument();
    expect(screen.getByText(content.about.education.school)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<About />);
    await expectNoA11yViolations(container);
  });
});
