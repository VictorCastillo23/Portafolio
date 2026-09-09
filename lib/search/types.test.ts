// TDD suite for the search-index schema types + fail-loudly parser (design
// "Interfaces / Contracts"). Mirrors lib/projects.ts's parseSnapshot() shape
// validation exactly: throw a descriptive Error on any shape violation
// instead of silently rendering/consuming a malformed index.

import { describe, expect, it } from "vitest";
import { parseSearchIndex, type IndexedChunk, type SearchIndex } from "./types";

const DIMENSIONS = 384;

function makeEmbedding(length = DIMENSIONS): number[] {
  return Array.from({ length }, (_, index) => Number(((index % 10) / 10).toFixed(6)));
}

function validRawChunk(overrides: Partial<IndexedChunk> = {}): Record<string, unknown> {
  return {
    id: "hero",
    section: "hero",
    title: "Víctor Castillo",
    text: "Ingeniero en Informática, full stack.",
    anchor: "#hero",
    url: null,
    embedding: makeEmbedding(),
    neighbors: [{ id: "about-summary", score: 0.42 }],
    ...overrides,
  };
}

function omit(record: Record<string, unknown>, key: string): Record<string, unknown> {
  const clone = { ...record };
  delete clone[key];
  return clone;
}

function validRawIndex(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    generatedAt: "2026-09-08T00:00:00.000Z",
    model: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    dimensions: DIMENSIONS,
    chunks: [validRawChunk()],
    ...overrides,
  };
}

describe("parseSearchIndex", () => {
  it("parses a well-formed index and returns it typed", () => {
    const parsed: SearchIndex = parseSearchIndex(validRawIndex());

    expect(parsed.version).toBe(1);
    expect(parsed.dimensions).toBe(384);
    expect(parsed.model).toBe("Xenova/paraphrase-multilingual-MiniLM-L12-v2");
    expect(parsed.chunks).toHaveLength(1);
    expect(parsed.chunks[0].id).toBe("hero");
    expect(parsed.chunks[0].embedding).toHaveLength(384);
  });

  it("throws when the top-level shape is not an object", () => {
    expect(() => parseSearchIndex(null)).toThrow();
    expect(() => parseSearchIndex("not an index")).toThrow();
    expect(() => parseSearchIndex(42)).toThrow();
  });

  it("throws when version is not 1", () => {
    expect(() => parseSearchIndex(validRawIndex({ version: 2 }))).toThrow();
  });

  it("throws when dimensions is not 384", () => {
    expect(() => parseSearchIndex(validRawIndex({ dimensions: 256 }))).toThrow();
  });

  it("throws when required top-level fields are missing", () => {
    expect(() => parseSearchIndex(omit(validRawIndex(), "generatedAt"))).toThrow();
    expect(() => parseSearchIndex(omit(validRawIndex(), "model"))).toThrow();
  });

  it("throws when chunks is not an array", () => {
    expect(() => parseSearchIndex(validRawIndex({ chunks: "nope" }))).toThrow();
  });

  it("throws when a chunk is missing a required string field", () => {
    const chunkWithoutTitle = omit(validRawChunk(), "title");
    expect(() => parseSearchIndex(validRawIndex({ chunks: [chunkWithoutTitle] }))).toThrow();
  });

  it("throws when a chunk's section is not a known SectionId", () => {
    expect(() =>
      parseSearchIndex(validRawIndex({ chunks: [validRawChunk({ section: "not-a-section" as never })] })),
    ).toThrow();
  });

  it("accepts url: null and a populated url string", () => {
    const withNullUrl = parseSearchIndex(validRawIndex({ chunks: [validRawChunk({ url: null })] }));
    expect(withNullUrl.chunks[0].url).toBeNull();

    const withUrl = parseSearchIndex(
      validRawIndex({
        chunks: [validRawChunk({ url: "https://github.com/VictorCastillo23/Es_Vitrina" })],
      }),
    );
    expect(withUrl.chunks[0].url).toBe("https://github.com/VictorCastillo23/Es_Vitrina");
  });

  it("throws when embedding length does not match declared dimensions", () => {
    expect(() =>
      parseSearchIndex(validRawIndex({ chunks: [validRawChunk({ embedding: makeEmbedding(10) })] })),
    ).toThrow();
  });

  it("throws when embedding contains non-number entries", () => {
    expect(() =>
      parseSearchIndex(
        validRawIndex({
          chunks: [validRawChunk({ embedding: [...makeEmbedding(383), "0.1"] as never })],
        }),
      ),
    ).toThrow();
  });

  it("throws when neighbors is not an array", () => {
    expect(() =>
      parseSearchIndex(validRawIndex({ chunks: [validRawChunk({ neighbors: "nope" as never })] })),
    ).toThrow();
  });

  it("throws when a neighbor entry is malformed", () => {
    expect(() =>
      parseSearchIndex(
        validRawIndex({ chunks: [validRawChunk({ neighbors: [{ id: "about-summary" }] as never })] }),
      ),
    ).toThrow();
  });

  it("accepts an empty neighbors array", () => {
    const parsed = parseSearchIndex(validRawIndex({ chunks: [validRawChunk({ neighbors: [] })] }));
    expect(parsed.chunks[0].neighbors).toEqual([]);
  });
});
