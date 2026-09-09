// Integration-style suite for POST /api/chat (design "Interfaces /
// Contracts", "Data Flow"). The route itself is thin wiring: these tests
// mock only the one I/O boundary it touches directly (`@anthropic-ai/sdk`)
// and exercise the REAL `lib/search/retrieve` + `lib/chat/prompt` logic
// against the committed `data/search-index.json`, verifying the route
// sequences retrieval -> prompt-building -> streaming -> SSE encoding
// correctly, matching the exact wire contract.
//
// App-level request limiting was removed by explicit product decision.
// Limits are enforced solely by Anthropic at the account/API-key level,
// outside this app; there is no 429 case for this route to produce on its
// own.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { anthropicConstructorMock, streamMock } = vi.hoisted(() => ({
  anthropicConstructorMock: vi.fn(),
  streamMock: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: anthropicConstructorMock.mockImplementation(function MockAnthropic() {
    return { messages: { stream: streamMock } };
  }),
}));

// Imported AFTER the mocks above so `route.ts` picks up the mocked modules.
const { POST } = await import("./route");

interface FakeStreamEvent {
  type: "content_block_delta";
  index: number;
  delta: { type: "text_delta"; text: string };
}

function fakeClaudeStream(deltas: string[]): AsyncIterable<FakeStreamEvent> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const text of deltas) {
        yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } };
      }
    },
  };
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function collectSseEvents(response: Response): Promise<string[]> {
  const text = await response.text();
  return text
    .split("\n\n")
    .filter((frame) => frame.length > 0)
    .map((frame) => frame.split("\n")[0]?.replace("event: ", "") ?? "");
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    streamMock.mockReturnValue(fakeClaudeStream(["Hola", " mundo"]));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 400 invalid_request for a malformed body (missing message)", async () => {
    const response = await POST(postRequest({}));

    expect(response.status).toBe(400);
    const json = (await response.json()) as { code: string; message: string };
    expect(json.code).toBe("invalid_request");
    expect(json.message).toBeTruthy();
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_request for a body that is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );

    expect(response.status).toBe(400);
    const json = (await response.json()) as { code: string };
    expect(json.code).toBe("invalid_request");
  });

  it("returns 503 chat_unavailable when ANTHROPIC_API_KEY is unset, before any Claude call", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const response = await POST(postRequest({ message: "Que hiciste en Juventudes?" }));

    expect(response.status).toBe(503);
    const json = (await response.json()) as { code: string };
    expect(json.code).toBe("chat_unavailable");
    expect(anthropicConstructorMock).not.toHaveBeenCalled();
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("streams sources -> delta* -> done in order, with the correct SSE headers, on a successful request", async () => {
    const response = await POST(postRequest({ message: "Que hiciste en Juventudes?" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Accel-Buffering")).toBe("no");

    const events = await collectSseEvents(response);

    expect(events[0]).toBe("sources");
    expect(events.slice(1, -1)).toEqual(["delta", "delta"]);
    expect(events.at(-1)).toBe("done");
  });

  it("surfaces the real retrieve() result in the sources event", async () => {
    const response = await POST(postRequest({ message: "Que hiciste en Juventudes?" }));
    const text = await response.text();

    // Real retrieval against the committed data/search-index.json (mirrors
    // Phase 2's contract test: "Juventudes" surfaces "experience-juventudes").
    expect(text).toContain("experience-juventudes");
  });

  it("passes the retrieved context, system prompt, model, and max_tokens to the Anthropic stream call", async () => {
    const response = await POST(postRequest({ message: "Que hiciste en Juventudes?" }));
    await response.text();

    expect(streamMock).toHaveBeenCalledTimes(1);
    const callArgs = streamMock.mock.calls[0]?.[0];
    expect(callArgs.model).toBe("claude-haiku-4-5-20251001");
    expect(callArgs.max_tokens).toBe(1024);
    expect(typeof callArgs.system).toBe("string");
    expect(callArgs.system).toMatch(/context/i);
    expect(Array.isArray(callArgs.messages)).toBe(true);
    const lastMessage = callArgs.messages.at(-1);
    expect(lastMessage.role).toBe("user");
    expect(lastMessage.content).toContain("Que hiciste en Juventudes?");
  });

  it("uses ANTHROPIC_MODEL from the environment when present", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "claude-sonnet-4-5");

    const response = await POST(postRequest({ message: "Que hiciste en Juventudes?" }));
    await response.text();

    const callArgs = streamMock.mock.calls[0]?.[0];
    expect(callArgs.model).toBe("claude-sonnet-4-5");
  });

  it("prepends validated history turns before the current context-block turn", async () => {
    const response = await POST(
      postRequest({
        message: "Y que mas?",
        history: [
          { role: "user", content: "Que hiciste en Juventudes?" },
          { role: "assistant", content: "Migre un sistema de PHP a Angular." },
        ],
      }),
    );
    await response.text();

    const callArgs = streamMock.mock.calls[0]?.[0];
    expect(callArgs.messages).toHaveLength(3);
    expect(callArgs.messages[0]).toEqual({ role: "user", content: "Que hiciste en Juventudes?" });
    expect(callArgs.messages[1]).toEqual({ role: "assistant", content: "Migre un sistema de PHP a Angular." });
    expect(callArgs.messages[2].role).toBe("user");
    expect(callArgs.messages[2].content).toContain("Y que mas?");
  });

  it("emits a terminal error event instead of throwing when the Claude stream itself fails", async () => {
    streamMock.mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.reject(new Error("upstream network failure")),
      }),
    });

    const response = await POST(postRequest({ message: "Que hiciste en Juventudes?" }));

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("event: sources");
    expect(text).toContain("event: error");
    expect(text).toContain("upstream network failure");
    expect(text).not.toContain("event: done");
  });
});
