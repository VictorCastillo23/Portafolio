import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { ChatMessage } from "./ChatMessage";
import type { ChatUIMessage } from "./useChatStream";

describe("ChatMessage", () => {
  it("renders a user message aligned to the end, without links", () => {
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

  it("renders a completed assistant message with no links and no nested list", () => {
    const message: ChatUIMessage = {
      id: "2",
      role: "assistant",
      content: "Trabajé en Juventudes con Next.js.",
    };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    const bubble = container.querySelector("li > div");
    expect(bubble).not.toBeNull();
    expect(bubble!.querySelector("p")).toHaveTextContent("Trabajé en Juventudes con Next.js.");
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(bubble!.querySelector("ul")).toBeNull();
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

  it("renders **bold** markers as strong elements instead of plain text", () => {
    const message: ChatUIMessage = {
      id: "6",
      role: "assistant",
      content: "Tengo experiencia en **Next.js** y React.",
    };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong).toHaveTextContent("Next.js");
    expect(container.querySelector("p")?.textContent).not.toContain("**");
  });

  it("has no accessibility violations", async () => {
    const message: ChatUIMessage = {
      id: "5",
      role: "assistant",
      content: "Respuesta completa.",
    };
    const { container } = render(
      <ul>
        <ChatMessage message={message} />
      </ul>,
    );

    await expectNoA11yViolations(container);
  });
});
