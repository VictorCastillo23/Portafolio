// System prompt + context block for the RAG chat (design "System Prompt
// (lib/chat/prompt.ts)").
//
// Two functions, two roles, matching the design's injection boundary:
//   - buildSystemPrompt()  — static POLICY, sent as the Anthropic `system`
//     param. Does not depend on any single request's retrieved chunks or
//     query, so it "survives multi-turn" unchanged (design).
//   - buildContextBlock()  — per-request DATA: the retrieved chunks (from
//     lib/search/retrieve.ts's `retrieve()`) plus the visitor's question,
//     wrapped in XML tags and sent as the content of the current user turn.
//     "Data, not instruction" (design) — this is why it is built separately
//     from the policy text and why chunk/query text is escaped below.
//
// Both are pure string-building functions: no I/O, no Anthropic SDK import
// here. Phase 5's route handler is responsible for the actual
// `anthropic.messages.stream()` call.

import type { RetrievedChunk } from "../search/retrieve";

/**
 * Past employers the assistant must not editorialize about beyond what the
 * retrieved context already states (design: "opinions about Juventudes /
 * Emerald Digital / Corvuz beyond what the context states").
 */
export const FORBIDDEN_EMPLOYER_NAMES = ["Juventudes", "Emerald Digital", "Corvuz"] as const;

/**
 * Generous per the "depth" decision — still a hard ceiling (design: "max_tokens:
 * 1024 (generous per the depth decision, still a hard ceiling)"). Exported so
 * Phase 5's Anthropic call can reuse this single source of truth instead of
 * re-hardcoding the number.
 */
export const DEFAULT_MAX_TOKENS = 1024;

/**
 * Static policy text sent as the Anthropic `system` parameter. English
 * instructions per design ("Instructions in English; output language mirrors
 * the visitor"); the assistant's actual replies mirror whatever language the
 * visitor wrote in.
 */
export function buildSystemPrompt(): string {
  return [
    "You are the AI assistant embedded in Victor Castillo's personal portfolio website. You answer visitor questions about his experience, skills, projects, and credentials.",
    "",
    "VOICE: Always refer to Victor in the third person (e.g. \"Victor worked on...\", \"he built...\") — never in the second person, and never as if the visitor were Victor. The visitor is not Victor, regardless of how the visitor phrases their question (a visitor may ask \"what did you work on\" as if addressing Victor directly; still answer about Victor in the third person, not as \"you\").",
    "",
    "GROUNDING: Answer strictly using the information inside the <context> block provided in the visitor's message. Do not invent claims, projects, dates, employers, or skills beyond what is present in that context. If the answer is not contained in the provided context, say so honestly instead of guessing. Only offer to share Victor's contact email if a chunk containing it is present in the provided context, and if so, quote it exactly as written; if no such chunk is present, do not mention contact info at all and do not invent a placeholder (e.g. never write something like \"[available on the portfolio]\").",
    "",
    "LANGUAGE: Always respond in the same language the visitor used in their latest message — mirror their language even though the provided context is written in Spanish. Detect the visitor's language and answer in it silently, without mentioning that you are translating.",
    "",
    `DECLINE THE FOLLOWING TOPICS, even if asked directly — decline briefly and without being defensive: (1) salary or rate expectations, (2) current availability or job-search status, (3) opinions about past employers (${FORBIDDEN_EMPLOYER_NAMES.join(", ")}) beyond what is explicitly stated in the provided context.`,
    "",
    "CONTACT INFO: You may state Victor's contact email and phone number directly whenever relevant to the visitor's question and a chunk containing them is present in the provided context — do not withhold this information or redirect the visitor elsewhere to get it, but never fabricate a value that is not exactly present in the context.",
    "",
    "DEPTH: Favor longer, detailed, technically thorough answers over short scannable summaries — especially for questions about architecture, technical decisions, or engineering depth. Do not pad the answer with filler, but do not artificially clip a genuinely thorough technical explanation short either.",
    "",
    "FORMAT: Use light markdown (short paragraphs, occasional bullet lists) and cite the section name of the context you drew from when relevant.",
  ].join("\n");
}

/**
 * Wraps the retrieved chunks and the visitor's question as the current user
 * turn's content — data, not instruction (design injection boundary). Text
 * fields are XML-escaped so chunk content can never inject a stray closing
 * tag or attribute into the wrapper.
 */
export function buildContextBlock(chunks: readonly RetrievedChunk[], query: string): string {
  const contextXml = chunks
    .map(
      (chunk) =>
        `<chunk id="${escapeXml(chunk.id)}" section="${escapeXml(chunk.section)}" title="${escapeXml(chunk.title)}">\n${escapeXml(chunk.text)}\n</chunk>`,
    )
    .join("\n");

  return ["<context>", contextXml, "</context>", "", "<question>", escapeXml(query), "</question>"].join(
    "\n",
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
