// Builds the root repo's committed data/search-index.json artifact from
// data/content.ts and the merged project data (data/projects.ts +
// data/github-repos.json).
//
// Lives in its OWN isolated package (tools/search-index-builder/) so
// @huggingface/transformers — and its onnxruntime-node / sharp transitive
// deps — never enter the root app's package.json/package-lock.json. The root
// app's `npm install` and `npm audit` never see this tool's dependencies;
// only running this tool directly (`npm run build:search-index` from the
// repo root, which shells out here) does. Root-level TypeScript/ESLint/build
// tooling is configured to skip this directory entirely (see root
// tsconfig.json's "exclude" and eslint.config.mjs's globalIgnores).
//
// Run manually via `npm run build:search-index` from the repo root — NEVER
// wired into `prebuild`/`build` (spec CI-4, locked user decision). Embeddings
// are generated locally via an ONNX multilingual model (spec CI-2): the
// script itself never calls an external embeddings API. Downloading the
// model's own weights on first run is a one-time tooling asset fetch (cached
// under this package's own node_modules/@huggingface/transformers/.cache/,
// gitignored) — not a per-embedding network call.
//
// Fails closed: all chunking, embedding, and neighbor-graph computation
// happens in memory first; the committed artifact is only overwritten after
// every step succeeds, mirroring scripts/fetch-github.ts's fail-closed shape.
//
// Imports below reach across the package boundary into the root repo's
// data/ and lib/ directories via plain relative paths — this is safe and
// intentional: those files are pure TypeScript with no dependency on
// anything in the root's node_modules (or this package's), only on
// TypeScript itself, which this package provides via its own devDependency.
// Phase 2 task 2.1 extracted buildChunks() (previously defined inline here)
// into the root's lib/search/chunks.ts; this file now imports it instead of
// duplicating its logic (same cross-boundary relative-import pattern
// already used for data/content, data/projects, lib/projects, and
// lib/search/types below). Verified reachable: `npx tsc --noEmit` scoped to
// this package's own tsconfig.json resolves the import cleanly (plain
// relative-path resolution — moduleResolution "bundler" doesn't require any
// path mapping for this to work).

import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "@huggingface/transformers";
import { content } from "../../data/content";
import { PROJECT_CURATION } from "../../data/projects";
import { mergeProjects, parseSnapshot } from "../../lib/projects";
import { buildChunks } from "../../lib/search/chunks";
import {
  SEARCH_INDEX_DIMENSIONS,
  type IndexedChunk,
  type SearchChunk,
  type SearchIndex,
} from "../../lib/search/types";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const NEIGHBOR_COUNT = 3;
const EMBEDDING_PRECISION = 6;

const ROOT_DIR = path.resolve(import.meta.dirname, "../..");
const SNAPSHOT_PATH = path.resolve(ROOT_DIR, "data/github-repos.json");
const OUTPUT_PATH = path.resolve(ROOT_DIR, "data/search-index.json");

async function embedChunks(chunks: SearchChunk[]): Promise<number[][]> {
  // 8-bit quantized weights: a fraction of the fp32 download (default) with
  // no meaningful accuracy loss for this build-time, non-interactive use —
  // this is a build-tooling artifact, never shipped to the client or a
  // Vercel function.
  const extractor = await pipeline("feature-extraction", MODEL_ID, { dtype: "q8" });
  const output = await extractor(
    chunks.map((chunk) => chunk.text),
    { pooling: "mean", normalize: true },
  );
  const vectors = output.tolist() as number[][];

  return vectors.map((vector) =>
    vector.map((value) => Number(value.toFixed(EMBEDDING_PRECISION))),
  );
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Top-3 nearest neighbors per chunk by cosine similarity (self excluded).
 * Embeddings are L2-normalized (`normalize: true` above), so cosine
 * similarity reduces to a plain dot product.
 */
function buildNeighborGraph(
  chunks: SearchChunk[],
  embeddings: number[][],
): { id: string; score: number }[][] {
  return chunks.map((_, index) => {
    const scored = chunks
      .map((otherChunk, otherIndex) => ({
        id: otherChunk.id,
        score: Number(dotProduct(embeddings[index], embeddings[otherIndex]).toFixed(EMBEDDING_PRECISION)),
        otherIndex,
      }))
      .filter((entry) => entry.otherIndex !== index)
      .sort((a, b) => b.score - a.score)
      .slice(0, NEIGHBOR_COUNT);

    return scored.map(({ id, score }) => ({ id, score }));
  });
}

async function buildIndex(): Promise<SearchIndex> {
  const rawSnapshot = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  const snapshot = parseSnapshot(rawSnapshot);
  const sections = mergeProjects(PROJECT_CURATION, snapshot);

  const chunks = buildChunks(content, sections);
  console.log(`[search-index-builder] Built ${chunks.length} chunk(s).`);

  console.log(`[search-index-builder] Loading ${MODEL_ID} and generating embeddings (local, ONNX)...`);
  const embeddings = await embedChunks(chunks);

  const neighborGraph = buildNeighborGraph(chunks, embeddings);

  const indexedChunks: IndexedChunk[] = chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
    neighbors: neighborGraph[index],
  }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    dimensions: SEARCH_INDEX_DIMENSIONS,
    chunks: indexedChunks,
  };
}

async function main(): Promise<void> {
  const index = await buildIndex();

  // Minified — this is a generated data artifact (treated as opaque in
  // review), not hand-edited source; pretty-printing would roughly double
  // its committed size for no readability benefit.
  await writeFile(OUTPUT_PATH, `${JSON.stringify(index)}\n`, "utf8");
  console.log(
    `[search-index-builder] Wrote ${index.chunks.length} chunk(s) to ${path.relative(ROOT_DIR, OUTPUT_PATH)}`,
  );
}

main().catch((error: unknown) => {
  console.error("[search-index-builder] Unexpected error — search-index.json NOT written.", error);
  process.exit(1);
});
