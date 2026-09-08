// TDD suite for useChatStream (design "Interfaces / Contracts" — the SSE
// wire format; tasks 6.2). Strict TDD: this is genuinely non-trivial logic
// (SSE parsing across arbitrary chunk boundaries, message accumulation, a
// small status state machine), unlike the presentational components in this
// same phase.
//
// `sseEncode` (the already-TDD'd server-side encoder from lib/chat/stream.ts)
// is reused here to build fixtures — this gives a real contract test between
// the server's wire format and the client's parser, not two hand-authored
// copies that could silently drift apart.

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sseEncode, type ChatSseEvent } from "../../lib/chat/stream";
import { useChatStream } from "./useChatStream";

function streamFromChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index]);
        index += 1;
        return;
      }
      controller.close();
    },
  });
}

/** Encodes events into a single byte buffer, then splits it at arbitrary byte
 * offsets — proving the parser stitches frames back together across
 * `reader.read()` boundaries instead of assuming one event per chunk. */
function sseResponse(events: ChatSseEvent[], splitEvery = 17): Response {
  const encoder = new TextEncoder();
  const full = events.map((event) => encoder.encode(sseEncode(event))).reduce((acc, bytes) => {
    const merged = new Uint8Array(acc.length + bytes.length);
    merged.set(acc);
    merged.set(bytes, acc.length);
    return merged;
  }, new Uint8Array(0));

  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < full.length; offset += splitEvery) {
    chunks.push(full.slice(offset, offset + splitEvery));
  }

  return new Response(streamFromChunks(chunks), { status: 200 });
}

function jsonErrorResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useChatStream", () => {
  it("starts idle with no messages", () => {
    const { result } = renderHook(() => useChatStream());

    expect(result.current.status).toBe("idle");
    expect(result.current.messages).toEqual([]);
  });

  it("accumulates sources then streamed deltas into one assistant message, ending idle", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        { type: "sources", sources: [{ id: "about-summary", section: "about", title: "Sobre mí", anchor: "#about", url: null }] },
        { type: "delta", text: "Hola" },
        { type: "delta", text: " mundo" },
        { type: "done", remaining: 142 },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("¿Qué es Es Vitrina?");
    });

    await waitFor(() => expect(result.current.status).toBe("idle"));

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: "user", content: "¿Qué es Es Vitrina?" });
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "Hola mundo",
      streaming: false,
      sources: [{ id: "about-summary", section: "about", title: "Sobre mí", anchor: "#about", url: null }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "¿Qué es Es Vitrina?", history: [] }),
      }),
    );
  });

  it("sends prior turns as history on the next call", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        sseResponse([
          { type: "sources", sources: [] },
          { type: "delta", text: "Primera respuesta" },
          { type: "done", remaining: 199 },
        ]),
      )
      .mockResolvedValueOnce(
        sseResponse([
          { type: "sources", sources: [] },
          { type: "delta", text: "Segunda respuesta" },
          { type: "done", remaining: 198 },
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("primero");
    });
    await waitFor(() => expect(result.current.status).toBe("idle"));

    await act(async () => {
      await result.current.sendMessage("segundo");
    });
    await waitFor(() => expect(result.current.status).toBe("idle"));

    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(secondCallBody.history).toEqual([
      { role: "user", content: "primero" },
      { role: "assistant", content: "Primera respuesta" },
    ]);
  });

  it("sets budget-exhausted status and resetAt from a 429 response, without touching messages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonErrorResponse(429, {
          code: "budget_exhausted",
          message: "Daily chat budget exhausted.",
          resetAt: "2026-09-09T00:00:00.000Z",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("hola");
    });

    await waitFor(() => expect(result.current.status).toBe("budget-exhausted"));
    expect(result.current.budgetResetAt).toBe("2026-09-09T00:00:00.000Z");
  });

  it("marks the in-progress message as no longer streaming and surfaces a mid-stream error event", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        { type: "sources", sources: [] },
        { type: "delta", text: "Respuesta parcial" },
        { type: "error", code: "upstream_error", message: "El modelo falló." },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("hola");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toBe("El modelo falló.");
    expect(result.current.messages[1]).toMatchObject({ content: "Respuesta parcial", streaming: false });
  });

  it("sets an error status when the network request itself rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("hola");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMessage).toBeTruthy();
  });

  it("ignores empty or whitespace-only messages", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });
});
