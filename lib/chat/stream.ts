// SSE encoding for POST /api/chat (design "Interfaces / Contracts" — the
// exact response wire format):
//
//   event: sources  data: {"sources":[{"id","section","title","anchor","url"}]}
//   event: delta    data: {"text":"..."}
//   event: done     data: {}
//   event: error    data: {"code":"upstream_error","message":"..."}   // mid-stream only
//
// Pure encoding + a pure stream-transform helper only. No network calls, no
// Anthropic SDK import here — Phase 5's route handler owns turning Claude's
// real streaming response into a `ChatSseEvent` sequence and piping it
// through `toSseStream()`.

/** One retrieved chunk surfaced to the client as a citation (design response shape). */
export interface ChatSource {
  id: string;
  section: string;
  title: string;
  anchor: string;
  url: string | null;
}

export type ChatSseEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; code: string; message: string };

/**
 * Encodes a single {@link ChatSseEvent} into the exact SSE wire format:
 * `event: <name>\ndata: <json>\n\n`. The trailing double newline is the SSE
 * frame terminator — required so the client's EventSource/fetch reader can
 * tell where one event ends and the next begins.
 */
export function sseEncode(event: ChatSseEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(toPayload(event))}\n\n`;
}

/** Strips the `type` discriminant, leaving only the fields that belong in `data:`. */
function toPayload(event: ChatSseEvent): Record<string, unknown> {
  switch (event.type) {
    case "sources":
      return { sources: event.sources };
    case "delta":
      return { text: event.text };
    case "done":
      return {};
    case "error":
      return { code: event.code, message: event.message };
  }
}

/**
 * Transforms an async sequence of {@link ChatSseEvent}s into the byte chunks
 * a Route Handler can `enqueue()` directly onto a `ReadableStream` /
 * `Response` body. Kept as a plain async generator (not a Web
 * `TransformStream`) so it stays trivially testable with a synthetic
 * `AsyncIterable` — no `Response`/network machinery required to exercise it.
 */
export async function* toSseStream(events: AsyncIterable<ChatSseEvent>): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  for await (const event of events) {
    yield encoder.encode(sseEncode(event));
  }
}
