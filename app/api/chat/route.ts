// POST /api/chat — Route Handler (design "Interfaces / Contracts", "Data
// Flow"). Wires the 3 independently-tested `lib/` modules together; per the
// design's "route stays thin" principle, this file is orchestration only —
// no retrieval/budget/prompt/SSE business logic lives here.
//
// Request lifecycle, in order (design "Data Flow"):
//   1. parseChatRequest()          invalid  -> 400 invalid_request
//   2. required env present?       no       -> 503 chat_unavailable
//   3. checkAndIncrementBudget()   BEFORE any retrieval or Claude call —
//      search and generation share ONE budget (locked decision).
//      !allowed -> 429 budget_exhausted, ZERO Claude calls made.
//   4. retrieve() against the committed data/search-index.json
//   5. buildSystemPrompt() + buildContextBlock()
//   6. anthropic.messages.stream() — client instantiated INSIDE the
//      request handler (never at module scope, mirroring Phase 3's Upstash
//      Redis client), so `next build` succeeds even when
//      ANTHROPIC_API_KEY is absent.
//   7. sources -> delta* -> done, SSE-encoded via lib/chat/stream.ts. A
//      failure DURING the Claude stream itself is NOT surfaced as an HTTP
//      error status — the 200 + SSE headers are already committed by then —
//      it is emitted as a terminal `error` event instead (design: "error
//      ... mid-stream only").

import Anthropic from "@anthropic-ai/sdk";

import rawSearchIndex from "../../../data/search-index.json";
import { buildContextBlock, buildSystemPrompt, DEFAULT_MAX_TOKENS } from "../../../lib/chat/prompt";
import { parseChatRequest, type ChatHistoryEntry } from "../../../lib/chat/request";
import { toSseStream, type ChatSource, type ChatSseEvent } from "../../../lib/chat/stream";
import { checkAndIncrementBudget } from "../../../lib/rate-limit/budget";
import { retrieve, type RetrievedChunk } from "../../../lib/search/retrieve";
import { parseSearchIndex } from "../../../lib/search/types";

export const runtime = "nodejs";

/**
 * Small/fast Claude tier, per the design's cost-consciousness decision
 * ("defaulting to the current small/fast Claude model"). `claude-haiku-4-5`
 * is the fast/cheap tier in Anthropic's current model lineup — a good fit
 * for a public, unauthenticated, budget-capped endpoint. The Messages API
 * requires the exact dated model id, not the bare family alias — using
 * `claude-haiku-4-5` alone returns a "model not found" error. Overridable
 * via `ANTHROPIC_MODEL` (documented in `.env.example`).
 */
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Accel-Buffering": "no",
} as const;

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonError(400, "invalid_request", "Request body must be valid JSON.");
  }

  const parsed = parseChatRequest(rawBody);
  if (!parsed.ok) {
    return jsonError(400, "invalid_request", parsed.error);
  }

  // Checked before any Upstash/Anthropic call so the site (and this route's
  // own 503) works with chat entirely unconfigured.
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(503, "chat_unavailable", "Chat is not configured on this deployment.");
  }

  // Locked decision: search and generation share ONE budget. Checked BEFORE
  // any retrieval or Claude call — an exhausted budget costs nothing beyond
  // this single Upstash round trip.
  const budget = await checkAndIncrementBudget();
  if (!budget.allowed) {
    return jsonError(429, "budget_exhausted", "Daily chat budget exhausted. Try again after the reset.", {
      resetAt: budget.resetAt,
    });
  }

  const { message, history } = parsed.value;

  let chunks: RetrievedChunk[];
  try {
    const index = parseSearchIndex(rawSearchIndex);
    chunks = retrieve(message, index);
  } catch (error) {
    return jsonError(
      503,
      "chat_unavailable",
      `Chat is temporarily unavailable: ${error instanceof Error ? error.message : "failed to load the search index."}`,
    );
  }

  const systemPrompt = buildSystemPrompt();
  const contextBlock = buildContextBlock(chunks, message);
  const messages = buildAnthropicMessages(history, contextBlock);
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;

  // Lazily instantiated INSIDE the request — never at module scope — so
  // importing this route (and therefore `next build`) never throws just
  // because ANTHROPIC_API_KEY happens to be absent at build time.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      const events = streamChatEvents(anthropic, model, systemPrompt, messages, chunks, budget.remaining);
      for await (const bytes of toSseStream(events)) {
        controller.enqueue(bytes);
      }
      controller.close();
    },
  });

  return new Response(responseBody, { status: 200, headers: SSE_HEADERS });
}

/**
 * Validated history turns first, then the current turn — the retrieved
 * context block + the visitor's question, wrapped as data (design injection
 * boundary; `role: "system"` history entries were already dropped by
 * `parseChatRequest`).
 */
function buildAnthropicMessages(
  history: ChatHistoryEntry[],
  contextBlock: string,
): Anthropic.MessageParam[] {
  return [
    ...history.map((entry) => ({ role: entry.role, content: entry.content }) satisfies Anthropic.MessageParam),
    { role: "user", content: contextBlock },
  ];
}

/**
 * Drives the actual Claude call and yields the SSE event sequence:
 * `sources` (always first, from retrieval — before Claude is even called),
 * then `delta` per text chunk, then `done` with the pre-computed remaining
 * budget. A stream-level failure (network error, API error) yields a
 * terminal `error` event instead of throwing, since the response's 200
 * status and SSE headers are already committed by the time this runs.
 */
async function* streamChatEvents(
  anthropic: Anthropic,
  model: string,
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  chunks: RetrievedChunk[],
  remaining: number,
): AsyncGenerator<ChatSseEvent> {
  yield { type: "sources", sources: chunks.map(toChatSource) };

  try {
    const stream = anthropic.messages.stream({
      model,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "delta", text: event.delta.text };
      }
    }
  } catch (error) {
    yield {
      type: "error",
      code: "upstream_error",
      message: error instanceof Error ? error.message : "The assistant stream failed unexpectedly.",
    };
    return;
  }

  yield { type: "done", remaining };
}

function toChatSource(chunk: RetrievedChunk): ChatSource {
  return { id: chunk.id, section: chunk.section, title: chunk.title, anchor: chunk.anchor, url: chunk.url };
}

function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>): Response {
  return Response.json({ code, message, ...extra }, { status });
}
