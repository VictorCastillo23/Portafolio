// TDD suite for the RAG system prompt + context block (design "System Prompt
// (lib/chat/prompt.ts)"). Policy stays static in `buildSystemPrompt()` (the
// design: "Policy stays in system so it survives multi-turn"); the retrieved
// chunks + the visitor's question are wrapped as data (not instruction) by
// `buildContextBlock()`, matching Anthropic's documented RAG shape — "data,
// not instruction (injection boundary)".

import { describe, expect, it } from "vitest";
import type { RetrievedChunk } from "../search/retrieve";
import { buildContextBlock, buildSystemPrompt, FORBIDDEN_EMPLOYER_NAMES } from "./prompt";

function retrievedChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: "experience-juventudes",
    section: "experience",
    title: "Juventudes — Desarrollador",
    text: "Juventudes — Gobierno Municipal. Migración del sistema de PHP a Angular.",
    anchor: "#experience",
    url: null,
    score: 0.9,
    ...overrides,
  };
}

describe("buildSystemPrompt", () => {
  const prompt = buildSystemPrompt();

  it("includes a grounding instruction restricting answers to the provided context", () => {
    expect(prompt).toMatch(/context/i);
    expect(prompt).toMatch(/do not invent|never invent|only.*context|strictly/i);
  });

  it("includes a language-mirroring instruction", () => {
    expect(prompt).toMatch(/same language|mirror.*language|visitor's language/i);
  });

  it("declines all 3 forbidden topics by name", () => {
    expect(prompt).toMatch(/salary|rate expectations/i);
    expect(prompt).toMatch(/availability|job.search status/i);
    expect(prompt).toMatch(/opinions? about.*(past )?employers?/i);
    for (const employer of FORBIDDEN_EMPLOYER_NAMES) {
      expect(prompt).toContain(employer);
    }
  });

  it("permits stating contact info directly (not a redirect-only restriction)", () => {
    expect(prompt).toMatch(/may state|directly state|state.*(email|phone).*directly/i);
    expect(prompt).not.toMatch(/never (share|state|give|provide).*(email|phone)/i);
  });

  it("favors longer, detailed technical answers over short summaries", () => {
    expect(prompt).toMatch(/longer|detailed|depth|thorough/i);
  });

  it("FORBIDDEN_EMPLOYER_NAMES lists exactly the 3 past employers from the design", () => {
    expect(FORBIDDEN_EMPLOYER_NAMES).toEqual(["Juventudes", "Emerald Digital", "Corvuz"]);
  });
});

describe("buildContextBlock", () => {
  it("incorporates the retrieved chunk id, section, title, and text", () => {
    const block = buildContextBlock([retrievedChunk()], "¿Qué hiciste en Juventudes?");

    expect(block).toContain("experience-juventudes");
    expect(block).toContain("experience");
    expect(block).toContain("Juventudes — Desarrollador");
    expect(block).toContain("Migración del sistema de PHP a Angular.");
  });

  it("incorporates the visitor's query", () => {
    const block = buildContextBlock([retrievedChunk()], "¿Qué hiciste en Juventudes?");

    expect(block).toContain("¿Qué hiciste en Juventudes?");
  });

  it("renders multiple chunks, each distinguishable in the output", () => {
    const chunks = [
      retrievedChunk({ id: "experience-juventudes", text: "Texto de Juventudes." }),
      retrievedChunk({ id: "experience-corvuz", section: "experience", text: "Texto de Corvuz." }),
    ];

    const block = buildContextBlock(chunks, "compara tus trabajos");

    expect(block).toContain("experience-juventudes");
    expect(block).toContain("Texto de Juventudes.");
    expect(block).toContain("experience-corvuz");
    expect(block).toContain("Texto de Corvuz.");
  });

  it("produces a valid (non-throwing) empty context block when no chunks were retrieved", () => {
    const block = buildContextBlock([], "pregunta sin resultados");

    expect(block).toContain("pregunta sin resultados");
    expect(() => buildContextBlock([], "x")).not.toThrow();
  });

  it("escapes XML-significant characters in chunk text so a stray tag cannot break the block", () => {
    const chunks = [retrievedChunk({ text: "Uso <script>alert('x')</script> & otras cosas." })];

    const block = buildContextBlock(chunks, "q");

    expect(block).not.toContain("<script>");
    expect(block).toContain("&lt;script&gt;");
  });
});
