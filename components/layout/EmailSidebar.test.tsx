import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { EmailSidebar } from "./EmailSidebar";

describe("EmailSidebar", () => {
  it("renders a mailto link for the contact email", () => {
    render(<EmailSidebar />);

    const link = screen.getByRole("link", { name: content.contact.email });
    expect(link).toHaveAttribute("href", `mailto:${content.contact.email}`);
  });

  it("is hidden below the xl breakpoint and flex at xl+", () => {
    const { container } = render(<EmailSidebar />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass("hidden", "xl:flex");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<EmailSidebar />);
    await expectNoA11yViolations(container);
  });
});
