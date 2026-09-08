// Schema types + fail-loudly parser for the committed search-index artifact
// (data/search-index.json, design "Interfaces / Contracts"). Written and
// consumed server-side only — never imported into the client bundle.
//
// parseSearchIndex() mirrors lib/projects.ts's parseSnapshot() exactly: throw
// a descriptive Error on any shape violation instead of silently rendering or
// retrieving from a malformed index.

import { SECTION_IDS, type SectionId } from "../../data/content";

export const SEARCH_INDEX_DIMENSIONS = 384;

export interface SearchChunk {
  /** Stable id — see scripts/build-search-index.ts for the exact id scheme per section. */
  id: string;
  section: SectionId;
  title: string;
  text: string;
  /** In-page nav anchor, e.g. "#projects" — always present. */
  anchor: string;
  /** credential.url | project.repoUrl, else null. */
  url: string | null;
}

export interface IndexedChunk extends SearchChunk {
  /** L2-normalized, 6dp, length === SearchIndex["dimensions"]. */
  embedding: number[];
  /** Top-3 nearest chunks by cosine similarity, self excluded. */
  neighbors: { id: string; score: number }[];
}

export interface SearchIndex {
  version: 1;
  generatedAt: string;
  model: string;
  dimensions: 384;
  chunks: IndexedChunk[];
}

const KNOWN_SECTION_IDS: ReadonlySet<string> = new Set(SECTION_IDS);

/**
 * Validates and narrows an unknown value to a {@link SearchIndex}. Throws a
 * descriptive error on any shape violation — callers (the build script's own
 * contract check, retrieval, the contract test) are expected to fail loudly
 * rather than silently operate on a malformed index.
 */
export function parseSearchIndex(raw: unknown): SearchIndex {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid search index: expected an object.");
  }

  const candidate = raw as Record<string, unknown>;

  if (candidate.version !== 1) {
    throw new Error('Invalid search index: "version" must be 1.');
  }
  if (typeof candidate.generatedAt !== "string") {
    throw new Error('Invalid search index: "generatedAt" must be a string.');
  }
  if (typeof candidate.model !== "string") {
    throw new Error('Invalid search index: "model" must be a string.');
  }
  if (candidate.dimensions !== SEARCH_INDEX_DIMENSIONS) {
    throw new Error(`Invalid search index: "dimensions" must be ${SEARCH_INDEX_DIMENSIONS}.`);
  }
  if (!Array.isArray(candidate.chunks)) {
    throw new Error('Invalid search index: "chunks" must be an array.');
  }

  const chunks = candidate.chunks.map((entry, index) => parseIndexedChunk(entry, index));

  return {
    version: 1,
    generatedAt: candidate.generatedAt,
    model: candidate.model,
    dimensions: SEARCH_INDEX_DIMENSIONS,
    chunks,
  };
}

function parseIndexedChunk(entry: unknown, index: number): IndexedChunk {
  if (typeof entry !== "object" || entry === null) {
    throw new Error(`Invalid search index: chunks[${index}] must be an object.`);
  }

  const chunk = entry as Record<string, unknown>;

  for (const field of ["id", "title", "text", "anchor"] as const) {
    if (typeof chunk[field] !== "string") {
      throw new Error(`Invalid search index: chunks[${index}].${field} must be a string.`);
    }
  }

  if (typeof chunk.section !== "string" || !KNOWN_SECTION_IDS.has(chunk.section)) {
    throw new Error(
      `Invalid search index: chunks[${index}].section must be one of ${[...KNOWN_SECTION_IDS].join(", ")}.`,
    );
  }

  if (chunk.url !== null && typeof chunk.url !== "string") {
    throw new Error(`Invalid search index: chunks[${index}].url must be a string or null.`);
  }

  if (
    !Array.isArray(chunk.embedding) ||
    chunk.embedding.length !== SEARCH_INDEX_DIMENSIONS ||
    chunk.embedding.some((value) => typeof value !== "number")
  ) {
    throw new Error(
      `Invalid search index: chunks[${index}].embedding must be a ${SEARCH_INDEX_DIMENSIONS}-number array.`,
    );
  }

  if (!Array.isArray(chunk.neighbors)) {
    throw new Error(`Invalid search index: chunks[${index}].neighbors must be an array.`);
  }
  const neighbors = chunk.neighbors.map((neighbor, neighborIndex) =>
    parseNeighbor(neighbor, index, neighborIndex),
  );

  return {
    id: chunk.id as string,
    section: chunk.section as SectionId,
    title: chunk.title as string,
    text: chunk.text as string,
    anchor: chunk.anchor as string,
    url: chunk.url as string | null,
    embedding: chunk.embedding as number[],
    neighbors,
  };
}

function parseNeighbor(
  entry: unknown,
  chunkIndex: number,
  neighborIndex: number,
): { id: string; score: number } {
  if (typeof entry !== "object" || entry === null) {
    throw new Error(
      `Invalid search index: chunks[${chunkIndex}].neighbors[${neighborIndex}] must be an object.`,
    );
  }
  const neighbor = entry as Record<string, unknown>;
  if (typeof neighbor.id !== "string") {
    throw new Error(
      `Invalid search index: chunks[${chunkIndex}].neighbors[${neighborIndex}].id must be a string.`,
    );
  }
  if (typeof neighbor.score !== "number") {
    throw new Error(
      `Invalid search index: chunks[${chunkIndex}].neighbors[${neighborIndex}].score must be a number.`,
    );
  }
  return { id: neighbor.id, score: neighbor.score };
}
