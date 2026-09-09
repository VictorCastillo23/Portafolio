"use client";

// Client-side SSE consumption for POST /api/chat (design "Interfaces /
// Contracts", tasks 6.2). Owns the message-list state machine so
// ChatWidget/ChatMessage stay purely presentational.
//
// Reuses `ChatSseEvent`/`ChatSource` — the exact types the server's
// `lib/chat/stream.ts` already encodes — as a type-only import: no runtime
// code from that server module ships in the client bundle, only the shape.
//
// Status state machine: idle -> streaming -> (idle | error).
//
// App-level request limiting was removed by explicit product decision.
// Limits are enforced solely by Anthropic at the account/API-key level; any
// non-OK response from the route (400, 503, or anything else) is handled
// through the same generic `error` status, read as a plain JSON body via
// response.json().

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ChatSource, ChatSseEvent } from "../../lib/chat/stream";

export interface ChatUIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  /** True only while the assistant's own answer is still receiving deltas. */
  streaming?: boolean;
}

export type ChatStreamStatus = "idle" | "streaming" | "error";

export interface UseChatStreamResult {
  messages: ChatUIMessage[];
  status: ChatStreamStatus;
  errorMessage: string | null;
  sendMessage: (text: string) => Promise<void>;
}

export function useChatStream(): UseChatStreamResult {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [status, setStatus] = useState<ChatStreamStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read synchronously inside sendMessage (which can be called again before
  // a re-render lands the latest `messages` closure) instead of depending on
  // the `messages` state value itself. Synced in an effect, not during
  // render, per the react-hooks/refs rule (refs are for post-commit reads).
  const messagesRef = useRef<ChatUIMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const nextIdRef = useRef(0);
  const nextId = useCallback(() => {
    nextIdRef.current += 1;
    return `chat-msg-${nextIdRef.current}`;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 || status === "streaming") {
        return;
      }

      const history = messagesRef.current.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setMessages((previous) => [...previous, { id: nextId(), role: "user", content: trimmed }]);
      setStatus("streaming");
      setErrorMessage(null);

      let response: Response;
      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });
      } catch {
        setStatus("error");
        setErrorMessage("No se pudo conectar con el chat. Intenta de nuevo.");
        return;
      }

      if (!response.ok) {
        const body = await safeParseJson(response);
        setStatus("error");
        setErrorMessage(typeof body?.message === "string" ? body.message : "Ocurrió un error inesperado.");
        return;
      }

      if (!response.body) {
        setStatus("error");
        setErrorMessage("La respuesta no incluyó contenido.");
        return;
      }

      const assistantId = nextId();
      try {
        for await (const event of parseSseEvents(response.body)) {
          applyEvent(event, assistantId, setMessages, setStatus, setErrorMessage);
        }
      } catch {
        setStatus("error");
        setErrorMessage("La conexión se interrumpió.");
      }
    },
    [status, nextId],
  );

  return { messages, status, errorMessage, sendMessage };
}

function applyEvent(
  event: ChatSseEvent,
  assistantId: string,
  setMessages: Dispatch<SetStateAction<ChatUIMessage[]>>,
  setStatus: Dispatch<SetStateAction<ChatStreamStatus>>,
  setErrorMessage: Dispatch<SetStateAction<string | null>>,
): void {
  switch (event.type) {
    case "sources":
      setMessages((previous) => [
        ...previous,
        { id: assistantId, role: "assistant", content: "", sources: event.sources, streaming: true },
      ]);
      return;
    case "delta":
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId ? { ...message, content: message.content + event.text } : message,
        ),
      );
      return;
    case "done":
      setMessages((previous) =>
        previous.map((message) => (message.id === assistantId ? { ...message, streaming: false } : message)),
      );
      setStatus("idle");
      return;
    case "error":
      setMessages((previous) =>
        previous.map((message) => (message.id === assistantId ? { ...message, streaming: false } : message)),
      );
      setStatus("error");
      setErrorMessage(event.message);
      return;
  }
}

async function safeParseJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Parses a raw SSE byte stream into the typed `ChatSseEvent`s
 * `lib/chat/stream.ts#sseEncode` produces, buffering across arbitrary
 * `reader.read()` chunk boundaries (the network never guarantees one event
 * per chunk).
 */
async function* parseSseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatSseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const event = parseSseFrame(frame);
        if (event) {
          yield event;
        }
        separatorIndex = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseFrame(frame: string): ChatSseEvent | null {
  let eventName: string | null = null;
  let dataLine: string | null = null;

  for (const line of frame.split("\n")) {
    if (line.startsWith("event: ")) {
      eventName = line.slice("event: ".length);
    } else if (line.startsWith("data: ")) {
      dataLine = line.slice("data: ".length);
    }
  }

  if (eventName === null || dataLine === null) {
    return null;
  }

  let data: unknown;
  try {
    data = JSON.parse(dataLine);
  } catch {
    return null;
  }

  return toChatSseEvent(eventName, data);
}

function toChatSseEvent(eventName: string, data: unknown): ChatSseEvent | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const payload = data as Record<string, unknown>;

  switch (eventName) {
    case "sources":
      return Array.isArray(payload.sources)
        ? { type: "sources", sources: payload.sources as ChatSource[] }
        : null;
    case "delta":
      return typeof payload.text === "string" ? { type: "delta", text: payload.text } : null;
    case "done":
      return { type: "done" };
    case "error":
      return typeof payload.code === "string" && typeof payload.message === "string"
        ? { type: "error", code: payload.code, message: payload.message }
        : null;
    default:
      return null;
  }
}
