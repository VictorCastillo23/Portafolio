// TDD suite for hybrid retrieval (design "BLOCKING FINDING" + "Architecture
// Decisions": FlexSearch lexical seeds -> precomputed neighbor-graph
// expansion -> 0.6/0.4 min-max-normalized weighted fusion -> top-K=8).
//
// FlexSearch@0.8.212 (the version actually installed — see package.json)
// ships built-in language packs only for de/en/fr (node_modules/flexsearch/
// dist/*/lang/{de,en,fr}.js) — there is NO bundled "es" module, despite that
// being the shorthand used in casual design discussion. SPANISH_ENCODER
// below is a small hand-authored EncoderOptions (filter + stemmer),
// following the exact shape FlexSearch's own de.js/en.js packs use, tuned
// for this corpus's vocabulary (verb conjugation + plural/singular) rather
// than a full linguistic Snowball-Spanish algorithm. See retrieve.ts for
// the full rationale.

import { describe, expect, it } from "vitest";
import realSearchIndexRaw from "../../data/search-index.json";
import { SECTION_IDS } from "../../data/content";
import { parseSearchIndex, type IndexedChunk, type SearchIndex } from "./types";
import { expandNeighbors, fuseScores, lexicalScores, retrieve } from "./retrieve";

function chunk(overrides: Partial<IndexedChunk> = {}): IndexedChunk {
  return {
    id: "chunk-a",
    section: "hero",
    title: "Chunk A",
    text: "Texto de ejemplo.",
    anchor: "#hero",
    url: null,
    embedding: [],
    neighbors: [],
    ...overrides,
  };
}

function searchIndex(chunks: IndexedChunk[]): SearchIndex {
  return {
    version: 1,
    generatedAt: "2026-09-08T00:00:00.000Z",
    model: "test-model",
    dimensions: 384,
    chunks,
  };
}

describe("lexicalScores", () => {
  it("finds the chunk with clear vocabulary overlap for the query (Juventudes scenario)", () => {
    const chunks = [
      chunk({
        id: "experience-juventudes",
        section: "experience",
        text: "Juventudes — Gobierno Municipal. Migración del sistema de PHP a Angular.",
      }),
      chunk({
        id: "experience-corvuz",
        section: "experience",
        text: "Corvuz. Desarrollé servicios backend con Laravel y MySQL.",
      }),
    ];

    const scores = lexicalScores(chunks, "Juventudes");

    expect([...scores.keys()]).toEqual(["experience-juventudes"]);
  });

  it("Spanish stemming: a gerund query matches a chunk containing only the noun/participle form", () => {
    const chunks = [
      chunk({ id: "hero", text: "Trabajo con Angular, Next.js y Python en proyectos diversos." }),
      chunk({ id: "about-summary", text: "He trabajado con frameworks modernos de JavaScript." }),
      chunk({ id: "contact", text: "Escríbeme y con gusto platicamos." }),
    ];

    const scores = lexicalScores(chunks, "trabajando");

    expect(scores.has("hero")).toBe(true);
    expect(scores.has("about-summary")).toBe(true);
    expect(scores.has("contact")).toBe(false);
  });

  it("Spanish stemming: a plural query matches a chunk containing only the singular form", () => {
    const chunks = [
      chunk({ id: "project-a", text: "Un proyecto de visión por computadora." }),
      chunk({ id: "contact", text: "Escríbeme y con gusto platicamos." }),
    ];

    const scores = lexicalScores(chunks, "proyectos");

    expect(scores.has("project-a")).toBe(true);
    expect(scores.has("contact")).toBe(false);
  });

  it("returns an empty map for a query with zero vocabulary overlap", () => {
    const chunks = [chunk({ id: "a", text: "Angular y Next.js." })];

    expect(lexicalScores(chunks, "xyzzyqwerty").size).toBe(0);
  });

  it("returns an empty map for an empty or whitespace-only query, without throwing", () => {
    const chunks = [chunk({ id: "a", text: "Angular y Next.js." })];

    expect(() => lexicalScores(chunks, "   ")).not.toThrow();
    expect(lexicalScores(chunks, "   ").size).toBe(0);
    expect(lexicalScores(chunks, "").size).toBe(0);
  });

  it("caps the number of returned seeds to seedCount", () => {
    const chunks = Array.from({ length: 6 }, (_, i) => chunk({ id: `chunk-${i}`, text: "Angular proyecto." }));

    expect(lexicalScores(chunks, "Angular", 3).size).toBeLessThanOrEqual(3);
  });

  it("returns scores in (0,1] that are non-increasing in rank order", () => {
    const chunks = [
      chunk({ id: "a", text: "Angular proyectos importantes de verdad." }),
      chunk({ id: "b", text: "Angular proyectos." }),
      chunk({ id: "c", text: "proyectos varios." }),
    ];

    const values = [...lexicalScores(chunks, "Angular proyectos").values()];

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });
});

describe("expandNeighbors", () => {
  it("propagates a seed's score to its precomputed neighbors, scaled by neighbor similarity", () => {
    const seedScores = new Map([["seed-a", 1]]);
    const chunksById = new Map([
      ["seed-a", chunk({ id: "seed-a", neighbors: [{ id: "neighbor-b", score: 0.5 }] })],
    ]);

    const semantic = expandNeighbors(seedScores, chunksById);

    expect(semantic.get("neighbor-b")).toBeCloseTo(0.5);
  });

  it("surfaces a chunk with ZERO lexical overlap purely through a strong precomputed neighbor similarity", () => {
    const seedScores = new Map([["experience-juventudes", 1]]);
    const chunksById = new Map([
      [
        "experience-juventudes",
        chunk({
          id: "experience-juventudes",
          text: "Juventudes — Gobierno Municipal. Angular y Node.js.",
          neighbors: [{ id: "about-skills", score: 0.62 }],
        }),
      ],
      [
        "about-skills",
        chunk({
          id: "about-skills",
          text: "Habilidades: Python, Java, C#, SQL Server.",
          neighbors: [],
        }),
      ],
    ]);

    const semantic = expandNeighbors(seedScores, chunksById);

    expect(semantic.get("about-skills")).toBeCloseTo(0.62);
  });

  it("takes the max propagated score when multiple seeds point to the same neighbor", () => {
    const seedScores = new Map([
      ["seed-a", 1],
      ["seed-b", 0.5],
    ]);
    const chunksById = new Map([
      ["seed-a", chunk({ id: "seed-a", neighbors: [{ id: "shared", score: 0.3 }] })],
      ["seed-b", chunk({ id: "seed-b", neighbors: [{ id: "shared", score: 0.9 }] })],
    ]);

    const semantic = expandNeighbors(seedScores, chunksById);

    // seed-a: 1 * 0.3 = 0.3 ; seed-b: 0.5 * 0.9 = 0.45 -> max wins
    expect(semantic.get("shared")).toBeCloseTo(0.45);
  });

  it("returns an empty map when there are no seeds", () => {
    expect(expandNeighbors(new Map(), new Map()).size).toBe(0);
  });

  it("ignores a seed id missing from chunksById instead of throwing", () => {
    const seedScores = new Map([["ghost", 1]]);

    expect(() => expandNeighbors(seedScores, new Map())).not.toThrow();
    expect(expandNeighbors(seedScores, new Map()).size).toBe(0);
  });
});

describe("fuseScores", () => {
  it("weights lexical 0.6 and semantic 0.4 after min-max normalizing each leg independently", () => {
    const lexical = new Map([
      ["a", 10],
      ["b", 0],
    ]);
    const semantic = new Map([
      ["a", 5],
      ["b", 0],
    ]);

    const fused = fuseScores(lexical, semantic);

    expect(fused.get("a")).toBeCloseTo(1);
    expect(fused.get("b")).toBeCloseTo(0);
  });

  it("a chunk matching both legs ranks above one matching only the lexical leg", () => {
    const lexical = new Map([
      ["both", 1],
      ["lexical-only", 0.8],
    ]);
    const semantic = new Map([["both", 0.5]]);

    const fused = fuseScores(lexical, semantic);

    expect(fused.get("both")!).toBeGreaterThan(fused.get("lexical-only")!);
  });

  it("a chunk matching only the semantic leg still receives a nonzero score", () => {
    const lexical = new Map([["lexical-only", 1]]);
    const semantic = new Map([["semantic-only", 0.7]]);

    const fused = fuseScores(lexical, semantic);

    expect(fused.get("semantic-only")).toBeCloseTo(0.4);
    expect(fused.get("lexical-only")).toBeCloseTo(0.6);
  });

  it("treats a single-entry leg as fully normalized (1) rather than dividing by zero", () => {
    const lexical = new Map([["only", 5]]);

    const fused = fuseScores(lexical, new Map());

    expect(fused.get("only")).toBeCloseTo(0.6);
  });

  it("returns an empty map when both legs are empty", () => {
    expect(fuseScores(new Map(), new Map()).size).toBe(0);
  });
});

describe("retrieve", () => {
  it("returns [] for an empty or whitespace-only query without throwing", () => {
    const index = searchIndex([chunk()]);

    expect(() => retrieve("   ", index)).not.toThrow();
    expect(retrieve("   ", index)).toEqual([]);
    expect(retrieve("", index)).toEqual([]);
  });

  it("returns [] for a query with zero vocabulary overlap and no neighbor path", () => {
    const index = searchIndex([chunk({ id: "a", text: "Angular y Next.js." })]);

    expect(retrieve("xyzzyqwerty", index)).toEqual([]);
  });

  it("never returns more results than the corpus size, even when k is much larger", () => {
    const chunks = Array.from({ length: 3 }, (_, i) => chunk({ id: `c-${i}`, text: `Angular proyecto numero ${i}.` }));
    const index = searchIndex(chunks);

    const results = retrieve("Angular", index, 50);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returned chunks expose SearchChunk fields plus a score, never embedding/neighbors", () => {
    const index = searchIndex([
      chunk({ id: "a", text: "Angular proyecto.", embedding: [1, 2, 3], neighbors: [] }),
    ]);

    const [result] = retrieve("Angular", index);

    expect(result.id).toBe("a");
    expect(typeof result.score).toBe("number");
    expect(result).not.toHaveProperty("embedding");
    expect(result).not.toHaveProperty("neighbors");
  });

  it("ranks a chunk with both a lexical hit and neighbor support above a chunk found via neighbor expansion alone", () => {
    const core = chunk({
      id: "core",
      text: "Angular es mi framework principal para el frontend.",
      neighbors: [{ id: "expanded", score: 0.9 }],
    });
    const expanded = chunk({
      id: "expanded",
      text: "Sin relación léxica directa con la consulta realizada.",
    });
    const index = searchIndex([core, expanded]);

    const results = retrieve("Angular", index, 10);

    expect(results.map((r) => r.id)).toEqual(["core", "expanded"]);
  });

  it("fails loudly on a referentially-broken index instead of silently dropping a dangling neighbor", () => {
    // A neighbor id that doesn't correspond to any chunk in this index is a
    // data-consistency bug (parseSearchIndex validates shape, not
    // referential integrity) — retrieve() surfaces it instead of masking
    // it, mirroring this codebase's parseSnapshot/parseSearchIndex
    // fail-loudly convention rather than silently degrading results.
    const index = searchIndex([
      chunk({ id: "a", text: "Angular proyecto.", neighbors: [{ id: "does-not-exist", score: 0.9 }] }),
    ]);

    expect(() => retrieve("Angular", index)).toThrow(/does-not-exist/);
  });

  it("respects a custom k smaller than the candidate set", () => {
    const chunks = [
      chunk({ id: "a", text: "Angular proyecto uno." }),
      chunk({ id: "b", text: "Angular proyecto dos." }),
      chunk({ id: "c", text: "Angular proyecto tres." }),
    ];
    const index = searchIndex(chunks);

    expect(retrieve("Angular", index, 1)).toHaveLength(1);
  });
});

describe("contract: real data/search-index.json", () => {
  const realIndex = parseSearchIndex(realSearchIndexRaw);

  it("parses without throwing and has at least one chunk per known section", () => {
    for (const section of SECTION_IDS) {
      expect(realIndex.chunks.some((c) => c.section === section)).toBe(true);
    }
  });

  it("a lexical query for a proper noun in the corpus finds its chunk as the top result", () => {
    const results = retrieve("Juventudes", realIndex);

    expect(results[0]?.id).toBe("experience-juventudes");
  });

  it("neighbor expansion surfaces a real chunk with no lexical overlap for that same query", () => {
    const results = retrieve("Juventudes", realIndex);

    expect(results.map((r) => r.id)).toContain("about-skills");
  });
});
