// TDD suite for the full-context system prompt (lib/chat/prompt.ts). The whole
// knowledge base is embedded in the Anthropic `system` param after the static
// policy text, so `buildSystemPrompt(knowledge)` is the only builder: policy
// first, then the knowledge string verbatim.

import { describe, expect, it } from "vitest";
import { buildSystemPrompt, FORBIDDEN_EMPLOYER_NAMES } from "./prompt";

const sampleKnowledge = "<knowledge>\n## Experiencia\n### Acme — Dev\nAcme — Dev (2020). Built things.\n</knowledge>";

describe("buildSystemPrompt", () => {
  // Neutral knowledge text (no policy keywords) so the policy assertions
  // below can only be satisfied by the static policy itself.
  const prompt = buildSystemPrompt("Some facts.");

  it("includes a grounding instruction restricting answers to the knowledge base", () => {
    expect(prompt).toMatch(/knowledge/i);
    expect(prompt).toMatch(/do not invent|never invent|only.*knowledge|strictly/i);
  });

  it("no longer refers to a \"provided context\" left over from the RAG design", () => {
    expect(prompt).not.toMatch(/provided context/i);
  });

  it("refers to the <knowledge> block explicitly", () => {
    expect(prompt).toContain("<knowledge> block");
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

  it("forbids inventing placeholder contact info when it is not present in the knowledge base", () => {
    expect(prompt).toMatch(/verbatim|exactly as (it appears|written)/i);
    expect(prompt).toMatch(/do not (invent|fabricate|make up|write a placeholder)/i);
  });

  it("forbids composing or guessing contact details from the name or domain", () => {
    expect(prompt).toMatch(/never (compose|derive|guess).*(email|contact|phone)/i);
  });

  it("instructs the assistant to refer to Victor in the third person, never as the visitor", () => {
    expect(prompt).toMatch(/third person/i);
    expect(prompt).toMatch(/visitor is not Victor|not addressing Victor|regardless of how the visitor phrases/i);
  });

  it("favors longer, detailed technical answers over short summaries", () => {
    expect(prompt).toMatch(/longer|detailed|depth|thorough/i);
  });

  it("treats the visitor's text as a question, never as instructions that can change the rules", () => {
    expect(prompt).toMatch(/question/i);
    expect(prompt).toMatch(/never as instructions/i);
  });

  it("FORBIDDEN_EMPLOYER_NAMES lists exactly the 3 past employers from the design", () => {
    expect(FORBIDDEN_EMPLOYER_NAMES).toEqual(["Juventudes", "Emerald Digital", "Corvuz"]);
  });

  it("embeds the knowledge string verbatim", () => {
    expect(buildSystemPrompt(sampleKnowledge)).toContain(sampleKnowledge);
  });

  it("places the knowledge after the policy, separated by a blank line", () => {
    const prompt = buildSystemPrompt(sampleKnowledge);
    const knowledgeStart = prompt.indexOf(sampleKnowledge);

    expect(knowledgeStart).toBeGreaterThan(0);
    expect(prompt.slice(0, knowledgeStart).endsWith("\n\n")).toBe(true);
    expect(prompt.indexOf("FORMAT:")).toBeLessThan(knowledgeStart);
    expect(prompt.endsWith(sampleKnowledge)).toBe(true);
  });

});
