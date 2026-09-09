import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { Icon, type IconName } from "./Icon";

const ALL_ICON_NAMES: readonly IconName[] = [
  "github",
  "linkedin",
  "mail",
  "external",
  "folder",
  "code",
  "chat",
  "send",
];

describe("Icon", () => {
  it.each(ALL_ICON_NAMES)("renders %s as a decorative, hidden svg", (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it("applies a custom className", () => {
    const { container } = render(<Icon name="github" className="h-8 w-8" />);
    expect(container.querySelector("svg")).toHaveClass("h-8", "w-8");
  });

  it("has no accessibility violations when used with an accessible label on the wrapping link", async () => {
    const { container } = render(
      <a href="https://github.com/example" aria-label="GitHub">
        <Icon name="github" />
      </a>,
    );

    await expectNoA11yViolations(container);
  });
});
