import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Contact } from "./Contact";

describe("Contact", () => {
  it("renders a mailto CTA, the phone number, and GitHub/LinkedIn links — no <form>", () => {
    const { container } = render(<Contact />);

    expect(screen.getByRole("link", { name: new RegExp(content.contact.email) })).toHaveAttribute(
      "href",
      `mailto:${content.contact.email}`,
    );
    expect(screen.getByText(content.contact.phone)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/VictorCastillo23",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
    expect(container.querySelector("form")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Contact />);
    await expectNoA11yViolations(container);
  });
});
