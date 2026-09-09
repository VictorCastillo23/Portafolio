// Render/interaction/a11y smoke tests for ChatWidget (presentational
// shell — the real logic lives in useChatStream's own TDD suite; tasks
// 6.4/6.5). `useChatStream` is mocked so each test can drive a specific
// wireframe state (closed / open-first-time / open-answering / error /
// mobile-sheet) without a real fetch/SSE round trip.
//
// App-level request limiting (and its old exhausted-limit UI state) was
// removed by explicit product decision; limits are now handled entirely by
// Anthropic outside this app.

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../vitest.setup";
import { ChatWidget } from "./ChatWidget";
import { useChatStream, type UseChatStreamResult } from "./useChatStream";

vi.mock("./useChatStream", () => ({
  useChatStream: vi.fn(),
}));

const mockedUseChatStream = vi.mocked(useChatStream);

function stubStream(overrides: Partial<UseChatStreamResult> = {}): void {
  mockedUseChatStream.mockReturnValue({
    messages: [],
    status: "idle",
    errorMessage: null,
    sendMessage: vi.fn(),
    ...overrides,
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("ChatWidget", () => {
  it("renders only the closed launcher button by default", () => {
    stubStream();
    render(<ChatWidget />);

    expect(screen.getByRole("button", { name: "Abrir chat" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("open-first-time: opens a non-modal dialog, focuses the input, and seeds example questions", () => {
    const sendMessage = vi.fn();
    stubStream({ sendMessage });
    render(<ChatWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir chat" }));

    const dialog = screen.getByRole("dialog", { name: "Asistente virtual" });
    expect(dialog).toHaveAttribute("aria-modal", "false");
    expect(screen.getByLabelText("Escribe tu pregunta")).toHaveFocus();

    const example = screen.getByRole("button", { name: "¿Cómo puedo contactarte?" });
    fireEvent.click(example);
    expect(sendMessage).toHaveBeenCalledWith("¿Cómo puedo contactarte?");
  });

  it("Escape closes the panel and returns focus to the launcher", () => {
    stubStream();
    render(<ChatWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Abrir chat" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir chat" })).toHaveFocus();
  });

  it("open-answering: renders the conversation and disables the composer while streaming", () => {
    stubStream({
      status: "streaming",
      messages: [
        { id: "1", role: "user", content: "Hola" },
        { id: "2", role: "assistant", content: "", streaming: true },
      ],
    });
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir chat" }));

    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByLabelText("Escribe tu pregunta")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "¿Cómo puedo contactarte?" })).not.toBeInTheDocument();
  });

  it("mobile-sheet: the panel carries near-full-screen mobile classes with a corner-panel override at md+", () => {
    stubStream();
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir chat" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("inset-x-4", "bottom-20", "top-20");
    expect(dialog).toHaveClass("md:inset-x-auto", "md:bottom-24", "md:right-6", "md:w-96");
  });

  it("has no accessibility violations in the open state", async () => {
    stubStream();
    const { container } = render(<ChatWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir chat" }));

    await expectNoA11yViolations(container);
  });
});
