import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content } from "../../data/content";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the credit text and every social link", () => {
    render(<Footer />);

    expect(screen.getByText(content.footer.text)).toBeInTheDocument();
    for (const social of content.socials) {
      const link = screen.getByRole("link", { name: social.name });
      expect(link).toHaveAttribute("href", social.url);
    }
  });

  it("is xl:hidden — the complement of SocialSidebar's hidden xl:flex", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toHaveClass("xl:hidden");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Footer />);
    await expectNoA11yViolations(container);
  });
});
