// POST /api/chat — Route Handler (design "Interfaces / Contracts", "Data
// Flow"). Wires the independently-tested `lib/` modules together; per the
// design's "route stays thin" principle, this file is orchestration only —
// no knowledge/prompt/SSE business logic lives here.
//
// Request lifecycle, in order (design "Data Flow"):
//   1. parseChatRequest()          invalid  -> 400 invalid_request
//   2. required env present?       no       -> 503 chat_unavailable
//   3. buildSystemPrompt(buildKnowledgeBase(...)) — the WHOLE knowledge base
//      goes in the Anthropic `system` param on every request (no retrieval).
//      Built lazily on the first request and memoized at module scope; a
//      failure to build it -> 503 chat_unavailable.
//   4. anthropic.messages.stream() — client instantiated INSIDE the
//      request handler (never at module scope), so `next build` succeeds
//      even when ANTHROPIC_API_KEY is absent. The current user turn is the
//      visitor's raw question.
//   5. delta* -> done, SSE-encoded via lib/chat/stream.ts. A failure DURING
//      the Claude stream itself is NOT surfaced as an HTTP error status —
//      the 200 + SSE headers are already committed by then — it is emitted
//      as a terminal `error` event instead (design: "error ... mid-stream
//      only").
//
// Request limits are intentionally NOT enforced at this layer. That is
// deferred entirely to Anthropic's own account and API-key level
// enforcement, configured directly in the Anthropic Console, by explicit
// product decision.

import Anthropic from "@anthropic-ai/sdk";

import { content } from "../../../data/content";
import rawSnapshot from "../../../data/github-repos.json";
import { PROJECT_CURATION } from "../../../data/projects";
import { buildKnowledgeBase } from "../../../lib/chat/knowledge";
import { buildSystemPrompt, DEFAULT_MAX_TOKENS } from "../../../lib/chat/prompt";
import { parseChatRequest, type ChatHistoryEntry } from "../../../lib/chat/request";
import { toSseStream, type ChatSseEvent } from "../../../lib/chat/stream";
import { mergeProjects, parseSnapshot } from "../../../lib/projects";

export const runtime = "nodejs";

/**
 * Small/fast Claude tier, per the design's cost-consciousness decision
 * ("defaulting to the current small/fast Claude model"). `claude-haiku-4-5`
 * is the fast/cheap tier in Anthropic's current model lineup — a good fit
 * for a public, unauthenticated endpoint. The Messages API
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

let cachedSystemPrompt: string | undefined;

/**
 * The static policy + the whole knowledge base, built on the first request
 * and reused afterwards (the inputs are committed data, so it never changes
 * at runtime). Built lazily — never at import time — so `next build` cannot
 * fail on it. A failed build is not cached, so the next request retries.
 */
function getSystemPrompt(): string {
  cachedSystemPrompt ??= buildSystemPrompt(
    buildKnowledgeBase(content, mergeProjects(PROJECT_CURATION, parseSnapshot(rawSnapshot))),
  );
  return cachedSystemPrompt;
}

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

  // Checked before any Anthropic call so the site (and this route's own
  // 503) works with chat entirely unconfigured.
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(503, "chat_unavailable", "Chat is not configured on this deployment.");
  }

  const { message, history } = parsed.value;

  let systemPrompt: string;
  try {
    systemPrompt = getSystemPrompt();
  } catch (error) {
    return jsonError(
      503,
      "chat_unavailable",
      `Chat is temporarily unavailable: ${error instanceof Error ? error.message : "failed to build the knowledge base."}`,
    );
  }

  const messages = buildAnthropicMessages(history, message);
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;

  // Lazily instantiated INSIDE the request — never at module scope — so
  // importing this route (and therefore `next build`) never throws just
  // because ANTHROPIC_API_KEY happens to be absent at build time.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      const events = streamChatEvents(anthropic, model, systemPrompt, messages);
      for await (const bytes of toSseStream(events)) {
        controller.enqueue(bytes);
      }
      controller.close();
    },
  });

  return new Response(responseBody, { status: 200, headers: SSE_HEADERS });
}

/**
 * Validated history turns first, then the current turn — the visitor's raw
 * question (`role: "system"` history entries were already dropped by
 * `parseChatRequest`; the system prompt tells the model to treat the
 * visitor's text as a question, never as instructions).
 */
function buildAnthropicMessages(history: ChatHistoryEntry[], question: string): Anthropic.MessageParam[] {
  return [
    ...history.map((entry) => ({ role: entry.role, content: entry.content }) satisfies Anthropic.MessageParam),
    { role: "user", content: question },
  ];
}

/**
 * Drives the actual Claude call and yields the SSE event sequence: `delta`
 * per text chunk, then a terminal `done`. A stream-level
 * failure (network error, API error) yields a terminal `error` event
 * instead of throwing, since the response's 200 status and SSE headers are
 * already committed by the time this runs.
 */
async function* streamChatEvents(
  anthropic: Anthropic,
  model: string,
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
): AsyncGenerator<ChatSseEvent> {
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

  yield { type: "done" };
}

function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>): Response {
  return Response.json({ code, message, ...extra }, { status });
}
