// Request validation for POST /api/chat (design "Interfaces / Contracts").
//
// Pure and total: never throws. Route Handler callers (Phase 5) are expected
// to translate a `{ ok: false }` result directly into a 400 invalid_request
// response.
//
// Two intentionally different leniency policies (design "Architecture
// Decisions" / "Interfaces / Contracts"):
//   - `message` is STRICT — missing, empty (after trim), or over the char
//     cap rejects the WHOLE request.
//   - `history` is FORGIVING — it truncates to the last N entries, caps each
//     entry's content length, and DROPS any entry with an unrecognized role
//     (this is what removes a client-supplied `role:"system"` entry — a
//     prompt-injection vector — without failing the visitor's actual
//     message).

/** 1..500 chars after trim (design: "message: string, 1..500 chars, trimmed"). */
export const MAX_MESSAGE_LENGTH = 500;
/** "last 6 kept" (design). */
export const MAX_HISTORY_ENTRIES = 6;
/** "2000 chars each" (design). */
export const MAX_HISTORY_CONTENT_LENGTH = 2000;

const ALLOWED_HISTORY_ROLES = new Set(["user", "assistant"]);

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export interface ParsedChatRequest {
  message: string;
  history: ChatHistoryEntry[];
}

export type ParseChatRequestResult =
  | { ok: true; value: ParsedChatRequest }
  | { ok: false; error: string };

/**
 * Validates and narrows an unknown request body to a {@link ParsedChatRequest}.
 * Returns a discriminated result instead of throwing — this is a public HTTP
 * boundary, not a build artifact, so a malformed request is an expected,
 * recoverable case (400 invalid_request), not a fail-loud bug signal.
 */
export function parseChatRequest(raw: unknown): ParseChatRequestResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const candidate = raw as Record<string, unknown>;

  const message = parseMessage(candidate.message);
  if (message === null) {
    return {
      ok: false,
      error: `"message" is required and must be 1..${MAX_MESSAGE_LENGTH} chars after trimming.`,
    };
  }

  if (candidate.history !== undefined && !Array.isArray(candidate.history)) {
    return { ok: false, error: '"history" must be an array when present.' };
  }

  const history = Array.isArray(candidate.history) ? parseHistory(candidate.history) : [];

  return { ok: true, value: { message, history } };
}

function parseMessage(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  return trimmed;
}

/**
 * Filters `raw` down to well-formed entries (drops unrecognized roles —
 * including `"system"` — and malformed entries), then caps to the last
 * {@link MAX_HISTORY_ENTRIES} and each entry's content to
 * {@link MAX_HISTORY_CONTENT_LENGTH} chars.
 */
function parseHistory(raw: unknown[]): ChatHistoryEntry[] {
  const valid: ChatHistoryEntry[] = [];
  for (const entry of raw) {
    const parsed = parseHistoryEntry(entry);
    if (parsed) {
      valid.push(parsed);
    }
  }
  return valid.slice(-MAX_HISTORY_ENTRIES).map((entry) => ({
    role: entry.role,
    content: entry.content.slice(0, MAX_HISTORY_CONTENT_LENGTH),
  }));
}

function parseHistoryEntry(entry: unknown): ChatHistoryEntry | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }
  const candidate = entry as Record<string, unknown>;
  if (typeof candidate.role !== "string" || !ALLOWED_HISTORY_ROLES.has(candidate.role)) {
    return null;
  }
  if (typeof candidate.content !== "string") {
    return null;
  }
  return { role: candidate.role as "user" | "assistant", content: candidate.content };
}
