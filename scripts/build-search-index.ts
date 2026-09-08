// Builds the committed data/search-index.json artifact from data/content.ts
// and the merged project data (data/projects.ts + data/github-repos.json).
//
// Run manually via `npm run build:search-index` — NEVER wired into
// `prebuild`/`build` (spec CI-4, locked user decision). Embeddings are
// generated locally via an ONNX multilingual model (spec CI-2): the script
// itself never calls an external embeddings API. Downloading the model's own
// weights on first run is a one-time tooling asset fetch (cached under
// node_modules/@huggingface/transformers/.cache/, already gitignored via
// /node_modules) — not a per-embedding network call.
//
// Fails closed: all chunking, embedding, and neighbor-graph computation
// happens in memory first; the committed artifact is only overwritten after
// every step succeeds, mirroring scripts/fetch-github.ts's fail-closed shape.

import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "@huggingface/transformers";
import { content, SECTION_IDS, type Job, type Credential, type SectionId } from "../data/content";
import { PROJECT_CURATION } from "../data/projects";
import { mergeProjects, parseSnapshot, type Project, type ProjectSections } from "../lib/projects";
import {
  SEARCH_INDEX_DIMENSIONS,
  type IndexedChunk,
  type SearchChunk,
  type SearchIndex,
} from "../lib/search/types";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const NEIGHBOR_COUNT = 3;
const EMBEDDING_PRECISION = 6;

const SNAPSHOT_PATH = path.resolve(import.meta.dirname, "../data/github-repos.json");
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../data/search-index.json");

/**
 * Deterministic ascii-ish slug for credential ids — credentials have no `id`
 * field of their own (data/content.ts's Credential shape is out of scope for
 * this change), so ids are derived from the title. Retitling a credential
 * changes its chunk id; accepted per design, since citations are not
 * persisted across builds.
 */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // strip combining diacritics (e.g. accented vowels -> plain)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function anchorFor(section: SectionId): string {
  return `#${section}`;
}

function jobChunk(job: Job): SearchChunk {
  return {
    id: `experience-${job.id}`,
    section: "experience",
    title: `${job.company} — ${job.role}`,
    text: `${job.company} — ${job.role} (${job.range}). ${job.bullets.join(" ")}`,
    anchor: anchorFor("experience"),
    url: null,
  };
}

function credentialChunk(credential: Credential): SearchChunk {
  const detail = credential.detail ? ` ${credential.detail}` : "";
  return {
    id: `credential-${slugify(credential.title)}`,
    section: "credentials",
    title: credential.title,
    text: `${credential.title} — ${credential.issuer} (${credential.date}).${detail}`,
    anchor: anchorFor("credentials"),
    url: credential.url ?? null,
  };
}

function projectChunk(project: Project): SearchChunk {
  const stack = project.stack.length > 0 ? ` Stack: ${project.stack.join(", ")}.` : "";
  return {
    id: `project-${project.repo.toLowerCase()}`,
    section: "projects",
    title: project.title,
    text: `${project.title}. ${project.description}${stack}`,
    anchor: anchorFor("projects"),
    url: project.repoUrl,
  };
}

/**
 * Pure chunk mapper — kept inline for Phase 1. Phase 2 (lib/search/chunks.ts,
 * task 2.1) extracts this into a standalone, independently unit-tested
 * `buildChunks()` per HR-1; the design's data-flow diagram already names it
 * that way. This function is written to be lift-and-shift ready for that
 * extraction.
 */
function buildChunks(sections: ProjectSections): SearchChunk[] {
  const chunks: SearchChunk[] = [
    {
      id: "hero",
      section: "hero",
      title: content.hero.title,
      text: `${content.meta.name} — ${content.meta.role}. ${content.hero.tagline} ${content.hero.blurb}`,
      anchor: anchorFor("hero"),
      url: null,
    },
    {
      id: "about-summary",
      section: "about",
      title: "Sobre mí — Resumen",
      text: content.about.paragraphs.join(" "),
      anchor: anchorFor("about"),
      url: null,
    },
    {
      id: "about-skills",
      section: "about",
      title: "Sobre mí — Habilidades",
      text: `Habilidades: ${content.about.skills.join(", ")}.`,
      anchor: anchorFor("about"),
      url: null,
    },
    {
      id: "about-education",
      section: "about",
      title: "Sobre mí — Educación",
      text: `${content.about.education.degree} — ${content.about.education.school} (${content.about.education.range}). ${content.about.education.detail}`,
      anchor: anchorFor("about"),
      url: null,
    },
    ...content.experience.map(jobChunk),
    ...content.credentials.map(credentialChunk),
    ...[...sections.featured, ...sections.other].map(projectChunk),
    {
      id: "contact",
      section: "contact",
      title: "Contacto",
      text: `${content.contact.blurb} Email: ${content.contact.email}. Teléfono: ${content.contact.phone}.`,
      anchor: anchorFor("contact"),
      url: null,
    },
  ];

  const seenIds = new Set<string>();
  for (const chunk of chunks) {
    if (seenIds.has(chunk.id)) {
      throw new Error(`[build-search-index] Duplicate chunk id detected: "${chunk.id}".`);
    }
    seenIds.add(chunk.id);
    if (!SECTION_IDS.includes(chunk.section)) {
      throw new Error(`[build-search-index] Unknown section "${chunk.section}" on chunk "${chunk.id}".`);
    }
    if (chunk.text.trim().length === 0) {
      throw new Error(`[build-search-index] Chunk "${chunk.id}" has empty text.`);
    }
  }

  return chunks;
}

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

  const chunks = buildChunks(sections);
  console.log(`[build-search-index] Built ${chunks.length} chunk(s).`);

  console.log(`[build-search-index] Loading ${MODEL_ID} and generating embeddings (local, ONNX)...`);
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
    `[build-search-index] Wrote ${index.chunks.length} chunk(s) to ${path.relative(process.cwd(), OUTPUT_PATH)}`,
  );
}

main().catch((error: unknown) => {
  console.error("[build-search-index] Unexpected error — search-index.json NOT written.", error);
  process.exit(1);
});
