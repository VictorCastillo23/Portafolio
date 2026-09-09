import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { ChatMessage } from "./ChatMessage";
import type { ChatUIMessage } from "./useChatStream";

describe("ChatMessage", () => {
  it("renders a user message aligned to the end, without source chips", () => {
    const message: ChatUIMessage = { id: "1", role: "user", content: "Hola" };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(container.querySelector("li")).toHaveClass("justify-end");
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("renders source chips before the answer text for an assistant message", () => {
    const message: ChatUIMessage = {
      id: "2",
      role: "assistant",
      content: "Trabajé en Juventudes con Next.js.",
      sources: [
        { id: "experience-juventudes", section: "experience", title: "Juventudes", anchor: "#experience", url: null },
        { id: "project-foo", section: "projects", title: "Foo", anchor: "#projects", url: "https://github.com/x/foo" },
      ],
    };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    const bubble = container.querySelector("li > div");
    expect(bubble).not.toBeNull();
    const chipsList = bubble!.querySelector("ul");
    const answer = bubble!.querySelector("p");

    expect(chipsList).not.toBeNull();
    expect(answer).not.toBeNull();
    // Source chips must precede the answer paragraph in DOM order.
    expect(chipsList!.compareDocumentPosition(answer!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("link", { name: "Juventudes" })).toHaveAttribute("href", "#experience");
    const externalLink = screen.getByRole("link", { name: /Foo/ });
    expect(externalLink).toHaveAttribute("href", "https://github.com/x/foo");
    expect(externalLink).toHaveAttribute("target", "_blank");
  });

  it("hides the streaming answer text from the accessibility tree until it is done", () => {
    const streamingMessage: ChatUIMessage = {
      id: "3",
      role: "assistant",
      content: "Respuesta parcial",
      streaming: true,
    };
    const { rerender, container } = render(
      <ul>
        <ChatMessage message={streamingMessage} />
      </ul>,
    );

    const paragraph = container.querySelector("p");
    expect(paragraph).toHaveAttribute("aria-hidden", "true");

    rerender(
      <ul>
        <ChatMessage message={{ ...streamingMessage, streaming: false }} />
      </ul>,
    );

    expect(container.querySelector("p")).not.toHaveAttribute("aria-hidden");
  });

  it("shows a decorative typing indicator while awaiting the first delta", () => {
    const message: ChatUIMessage = { id: "4", role: "assistant", content: "", streaming: true };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    expect(container.querySelector("p")).toBeNull();
    const indicator = container.querySelector('[aria-hidden="true"]');
    expect(indicator).not.toBeNull();
  });

  it("has no accessibility violations", async () => {
    const message: ChatUIMessage = {
      id: "5",
      role: "assistant",
      content: "Respuesta completa.",
      sources: [{ id: "about-summary", section: "about", title: "Sobre mí", anchor: "#about", url: null }],
    };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    await expectNoA11yViolations(container);
  });
});
