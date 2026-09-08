import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { SocialSidebar } from "./SocialSidebar";

describe("SocialSidebar", () => {
  it("renders every social link from data/content.ts with an accessible name and correct href", () => {
    render(<SocialSidebar />);

    for (const social of content.socials) {
      const link = screen.getByRole("link", { name: social.name });
      expect(link).toHaveAttribute("href", social.url);
    }
  });

  it("is hidden below the xl breakpoint and flex at xl+", () => {
    const { container } = render(<SocialSidebar />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass("hidden", "xl:flex");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SocialSidebar />);
    await expectNoA11yViolations(container);
  });
});
