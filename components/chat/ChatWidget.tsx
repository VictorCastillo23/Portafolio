"use client";

// RAG chat widget (design "Widget Shape", tasks 6.4). Client component,
// owns open/closed UI state and wires `useChatStream` to `ChatMessage`.
// Only mounted by app/page.tsx when `ANTHROPIC_API_KEY` is present
// (Phase 7) — this component itself has no env awareness.
//
// Layout: a circular launcher (`fixed bottom-6 right-6 xl:right-24`,
// `xl:right-24` avoids EmailSidebar's `w-16` rail) toggles a non-modal
// panel. Below `md` (768px, same breakpoint as Nav) the panel becomes a
// near-full-screen sheet instead of a small corner card, since a 24rem
// corner panel is unusable on a phone viewport.
//
// Non-modal at every breakpoint: `role="dialog" aria-modal="false"`, no
// focus trap, no backdrop, no outside-click close. Escape closes and
// returns focus to the launcher button; opening moves focus to the
// message input. `aria-live="polite"` on the message log — see
// ChatMessage's own comment for how per-delta announcements are avoided.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "../ui/Icon";
import { ChatMessage } from "./ChatMessage";
import { useChatStream } from "./useChatStream";

const EXAMPLE_QUESTIONS = [
  "¿En qué trabajaste en Juventudes?",
  "¿Qué proyectos usan Next.js?",
  "¿Cómo puedo contactarte?",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const { messages, status, errorMessage, sendMessage } = useChatStream();

  const isStreaming = status === "streaming";
  const isFirstOpen = messages.length === 0;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (text.length === 0) {
      return;
    }
    setDraft("");
    void sendMessage(text);
  }

  function handleExampleClick(question: string) {
    void sendMessage(question);
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-ink shadow-lg motion-safe:transition-transform hover:motion-safe:scale-105 xl:right-24"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
          )}
        </svg>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-widget-title"
          className="fixed inset-x-4 bottom-20 top-20 z-50 flex flex-col rounded-lg border border-line bg-surface shadow-lg md:inset-x-auto md:top-auto md:bottom-24 md:right-6 md:h-[min(32rem,70vh)] md:w-96 xl:right-24"
        >
          <header className="border-b border-line px-4 py-3">
            <h2 id="chat-widget-title" className="font-sans text-sm font-bold text-text">
              Asistente virtual
            </h2>
          </header>

          <ul aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {isFirstOpen ? (
              <li>
                <p className="text-sm text-muted">
                  Pregúntame sobre mi experiencia, proyectos o stack técnico.
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {EXAMPLE_QUESTIONS.map((question) => (
                    <li key={question}>
                      <button
                        type="button"
                        onClick={() => handleExampleClick(question)}
                        className="w-full rounded-md border border-line px-3 py-2 text-left text-sm text-text motion-safe:transition-colors hover:border-accent hover:text-accent"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}
          </ul>

          {status === "error" && errorMessage ? (
            <p role="alert" className="border-t border-line px-4 py-2 text-xs text-muted">
              {errorMessage}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-line p-3">
            <label htmlFor="chat-widget-input" className="sr-only">
              Escribe tu pregunta
            </label>
            <input
              id="chat-widget-input"
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isStreaming}
              placeholder="Escribe tu pregunta..."
              className="flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={isStreaming || draft.trim().length === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-ink disabled:opacity-40"
            >
              <Icon name="send" className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
