// TDD suite for SSE encoding (design "Interfaces / Contracts" — the exact
// POST /api/chat response wire format):
//
//   event: sources  data: {"sources":[{"id","section","title","anchor","url"}]}
//   event: delta    data: {"text":"..."}
//   event: done     data: {"remaining":143}
//   event: error    data: {"code":"upstream_error","message":"..."}   // mid-stream only
//
// Pure encoding only — no network, no Anthropic SDK. `toSseStream` is fed a
// synthetic async iterable here; Phase 5's route handler is responsible for
// producing the real one from Claude's streaming response.

import { describe, expect, it } from "vitest";
import { sseEncode, toSseStream, type ChatSseEvent } from "./stream";

async function* toAsyncIterable<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

async function collect(stream: AsyncGenerator<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let output = "";
  for await (const chunk of stream) {
    output += decoder.decode(chunk, { stream: true });
  }
  return output;
}

describe("sseEncode", () => {
  it("encodes a sources event matching the design's exact wire format", () => {
    const event: ChatSseEvent = {
      type: "sources",
      sources: [
        { id: "experience-juventudes", section: "experience", title: "Juventudes", anchor: "#experience", url: null },
      ],
    };

    const encoded = sseEncode(event);

    expect(encoded).toBe(
      `event: sources\ndata: ${JSON.stringify({
        sources: [
          { id: "experience-juventudes", section: "experience", title: "Juventudes", anchor: "#experience", url: null },
        ],
      })}\n\n`,
    );
  });

  it("encodes a delta event", () => {
    const encoded = sseEncode({ type: "delta", text: "Hola, " });

    expect(encoded).toBe(`event: delta\ndata: ${JSON.stringify({ text: "Hola, " })}\n\n`);
  });

  it("encodes a done event carrying the remaining budget", () => {
    const encoded = sseEncode({ type: "done", remaining: 143 });

    expect(encoded).toBe(`event: done\ndata: ${JSON.stringify({ remaining: 143 })}\n\n`);
  });

  it("encodes a mid-stream error event", () => {
    const encoded = sseEncode({ type: "error", code: "upstream_error", message: "Claude API failed." });

    expect(encoded).toBe(
      `event: error\ndata: ${JSON.stringify({ code: "upstream_error", message: "Claude API failed." })}\n\n`,
    );
  });

  it("every encoded event ends with a double newline (SSE frame terminator)", () => {
    expect(sseEncode({ type: "delta", text: "x" }).endsWith("\n\n")).toBe(true);
  });
});

describe("toSseStream", () => {
  it("encodes an async sequence of events into the concatenated SSE wire format, in order", async () => {
    const events: ChatSseEvent[] = [
      {
        type: "sources",
        sources: [{ id: "contact", section: "contact", title: "Contacto", anchor: "#contact", url: null }],
      },
      { type: "delta", text: "Hola" },
      { type: "delta", text: " mundo" },
      { type: "done", remaining: 199 },
    ];

    const output = await collect(toSseStream(toAsyncIterable(events)));

    expect(output).toBe(events.map(sseEncode).join(""));
  });

  it("yields Uint8Array chunks (bytes ready for a Response stream), not strings", async () => {
    const stream = toSseStream(toAsyncIterable<ChatSseEvent>([{ type: "delta", text: "x" }]));
    const { value, done } = await stream.next();

    expect(done).toBe(false);
    // `instanceof Uint8Array` is realm-sensitive under jsdom (TextEncoder's
    // output can come from a different realm than this file's global
    // Uint8Array), so assert byte-array-ness in a realm-independent way
    // instead — this still fails if toSseStream ever yielded a plain string.
    expect(Object.prototype.toString.call(value)).toBe("[object Uint8Array]");
    expect(ArrayBuffer.isView(value)).toBe(true);
  });

  it("produces an empty output for an empty input sequence", async () => {
    const output = await collect(toSseStream(toAsyncIterable<ChatSseEvent>([])));

    expect(output).toBe("");
  });
});
