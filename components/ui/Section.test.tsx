import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Section } from "./Section";

describe("Section", () => {
  it("renders the section id, numbered heading, and children", () => {
    const { container } = render(
      <Section id="about" index="01." title="Sobre mí">
        <p>Contenido de prueba</p>
      </Section>,
    );

    const section = container.querySelector("section#about");
    expect(section).not.toBeNull();
    // The "01." index is aria-hidden, so the accessible name is the title alone.
    expect(screen.getByRole("heading", { level: 2, name: "Sobre mí" })).toBeInTheDocument();
    expect(screen.getByText("Contenido de prueba")).toBeInTheDocument();
  });

  it("associates the section with its heading via aria-labelledby", () => {
    const { container } = render(
      <Section id="experience" index="02." title="Experiencia">
        <p>Contenido</p>
      </Section>,
    );

    const section = container.querySelector("section#experience");
    const heading = container.querySelector("#experience-heading");

    expect(section).toHaveAttribute("aria-labelledby", "experience-heading");
    expect(heading).not.toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Section id="credentials" index="03." title="Credenciales">
        <p>Contenido</p>
      </Section>,
    );

    await expectNoA11yViolations(container);
  });
});
