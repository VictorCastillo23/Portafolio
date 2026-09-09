// Hybrid retrieval (design "BLOCKING FINDING" + "Architecture Decisions").
//
// FlexSearch (Spanish-tuned encoder, see below) scores the query -> top-4
// seeds. Each seed propagates score to its precomputed nearest neighbours
// (chunk<->chunk cosine, computed at BUILD time by tools/search-index-
// builder, stored in the artifact). Fuse (0.6 lexical + 0.4 semantic,
// min-max normalized) -> top-K=8. Zero embedding model at runtime, pure JS,
// fully unit-testable.
//
// Pure and deterministic: no I/O here. The already-parsed SearchIndex is
// passed in by the caller (the future route handler loads and parses
// data/search-index.json once, at the request boundary — not in this
// module). Every exported function below takes its inputs as plain
// arguments and returns a fresh value; nothing here reads from disk,
// process.env, or module-level mutable state.
//
// Deviation flagged during Phase 2 apply: the design's casual "es module"
// phrasing assumed FlexSearch ships a built-in Spanish language pack the
// way it does for German/English/French. It does not — the installed
// flexsearch@0.8.212 only bundles node_modules/flexsearch/dist/*/lang/
// {de,en,fr}.js. SPANISH_ENCODER below is a small hand-authored
// EncoderOptions (filter + stemmer) built the same way FlexSearch's own
// language packs are structured (see node_modules/flexsearch/src/lang/
// {de,en}.js for the shape being mirrored), tuned for THIS corpus's
// vocabulary rather than a full linguistic Snowball-Spanish algorithm:
//   - stemmer strips common gerund (-ando/-iendo), past-participle
//     (-ado/-ido), adverb (-mente), infinitive (-ar/-er/-ir), and
//     plural/gender (-es/-s/-o/-a/-e) endings, e.g. "trabajo",
//     "trabajando", and "trabajado" all reduce to "trabaj".
//   - filter drops a short list of high-frequency Spanish stopwords.
// FlexSearch applies its own accent-stripping normalization (NFKD + strip
// combining marks, then lowercase) BEFORE the stemmer runs, so accented
// input ("programación") and unaccented input ("programacion") already
// converge without any extra handling here.

import { Index } from "flexsearch";
import type { IndexedChunk, SearchChunk, SearchIndex } from "./types";

/** Top-N lexical seeds considered before neighbor expansion (design). */
export const DEFAULT_SEED_COUNT = 4;
/** Final result count after fusion (design: "Fuse -> top-K=8"). */
export const DEFAULT_TOP_K = 8;
/** Fusion weights (design "Architecture Decisions": 0.6 lexical + 0.4 semantic). */
export const LEXICAL_WEIGHT = 0.6;
export const SEMANTIC_WEIGHT = 0.4;

export interface RetrievedChunk extends SearchChunk {
  /** Final fused score (0.6*lexical + 0.4*semantic, both min-max normalized). */
  score: number;
}

const SPANISH_STOPWORDS = new Set([
  "de",
  "la",
  "el",
  "en",
  "y",
  "con",
  "para",
  "que",
  "un",
  "una",
  "los",
  "las",
  "del",
  "al",
  "por",
  "se",
  "su",
  "sus",
  "es",
  "a",
  "lo",
]);

// Longest-match-wins is automatic here: FlexSearch's stemmer applies the
// alternation regex `(?!^)(k1|k2|...)$` and searches leftmost-first, so the
// earliest (i.e. longest) matching suffix always takes priority — insertion
// order below is for readability, not correctness.
const SPANISH_STEMMER = new Map<string, string>([
  ["mente", ""], // adverbs: rápidamente -> rapida (accents already stripped by then)
  ["iendo", ""], // gerund -er/-ir: haciendo -> hac
  ["ando", ""], // gerund -ar: trabajando -> trabaj
  ["ado", ""], // past participle -ar: trabajado -> trabaj
  ["ido", ""], // past participle -er/-ir: comido -> com
  ["cion", ""], // -ción nouns (accent already stripped): implementacion -> implementa
  ["sion", ""], // -sión nouns
  ["ar", ""], // infinitive -ar: trabajar -> trabaj
  ["er", ""], // infinitive -er
  ["ir", ""], // infinitive -ir
  ["es", ""], // plural: proyectos -> handled by bare "s" below; "es" plural: lenguajes -> lenguaj
  ["s", ""], // plural: proyectos -> proyecto (then further stripped by "o" below)
  ["o", ""], // masculine/singular noun-adjective ending
  ["a", ""], // feminine/singular noun-adjective ending
  ["e", ""], // neutral ending
]);

const SPANISH_ENCODER = {
  filter: SPANISH_STOPWORDS,
  stemmer: SPANISH_STEMMER,
};

function buildLexicalIndex(chunks: readonly IndexedChunk[]): Index {
  const flexIndex = new Index({ encoder: SPANISH_ENCODER });
  for (const chunk of chunks) {
    flexIndex.add(chunk.id, chunk.text);
  }
  return flexIndex;
}

/**
 * Scores the query against the corpus using FlexSearch, returning the
 * top `seedCount` matches as a Map of chunk id -> raw lexical score.
 *
 * FlexSearch's simple `Index.search()` API returns ids ordered
 * best-match-first but does not expose a numeric relevance magnitude, so
 * the raw score here is a reciprocal-rank proxy (1 / (rank + 1)): the best
 * match gets 1, the second gets 0.5, etc. This is only the RAW per-leg
 * value — fuseScores() min-max normalizes it before combining with the
 * semantic leg, so the exact shape of this decay only needs to be
 * monotonic with rank, not calibrated in absolute terms.
 *
 * `suggest: true` is required, not cosmetic: FlexSearch's default
 * `search()` requires EVERY tokenized query term to match a document (an
 * implicit AND across terms) — see `SearchOptions` in flexsearch's own
 * `index.d.ts` (no `bool`/`or` option exists in this version at all).
 * Real visitor questions are natural-language sentences ("¿Qué hiciste en
 * Juventudes?"), and filler/verb tokens like "hiciste" appear nowhere in
 * an 18-chunk corpus — under strict AND that empties the seed set for
 * almost every realistic question, even when a distinctive term like
 * "Juventudes" has an exact hit. `suggest: true` switches to partial-match
 * ranking (documents matching SOME query terms still return, ranked by how
 * many/how well they match) — discovered and fixed during Phase 5 apply;
 * see `lib/search/retrieve.test.ts`'s "natural-language-question scenario"
 * tests for the regression coverage.
 */
export function lexicalScores(
  chunks: readonly IndexedChunk[],
  query: string,
  seedCount: number = DEFAULT_SEED_COUNT,
): Map<string, number> {
  const trimmed = query.trim();
  if (!trimmed) {
    return new Map();
  }

  const flexIndex = buildLexicalIndex(chunks);
  const ids = flexIndex.search(trimmed, { limit: seedCount, suggest: true }) as Array<string | number>;

  const scores = new Map<string, number>();
  ids.forEach((id, rank) => {
    scores.set(String(id), 1 / (rank + 1));
  });
  return scores;
}

/**
 * Propagates each seed's score to its precomputed nearest neighbors
 * (design: "Each seed propagates score to its precomputed nearest
 * neighbours"). A neighbor's semantic score is `seedScore * neighborSim`;
 * when multiple seeds propagate to the same neighbor, the MAX is kept
 * (avoids inflating a chunk's score just for being adjacent to several
 * seeds — a chunk directly matching both legs should win by ranking, not
 * by summed double-counting).
 */
export function expandNeighbors(
  seedScores: Map<string, number>,
  chunksById: Map<string, IndexedChunk>,
): Map<string, number> {
  const semantic = new Map<string, number>();

  for (const [seedId, seedScore] of seedScores) {
    const seedChunk = chunksById.get(seedId);
    if (!seedChunk) {
      continue;
    }
    for (const neighbor of seedChunk.neighbors) {
      const propagated = seedScore * neighbor.score;
      const existing = semantic.get(neighbor.id) ?? 0;
      if (propagated > existing) {
        semantic.set(neighbor.id, propagated);
      }
    }
  }

  return semantic;
}

function minMaxNormalize(scores: Map<string, number>): Map<string, number> {
  if (scores.size === 0) {
    return new Map();
  }

  const values = [...scores.values()];
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    // Degenerate leg (single entry, or every entry tied): nothing to
    // discriminate on within this leg, so treat every present id as fully
    // normalized rather than dividing by zero.
    return new Map([...scores.keys()].map((id) => [id, 1]));
  }

  return new Map([...scores].map(([id, value]) => [id, (value - min) / (max - min)]));
}

/**
 * Combines the lexical and semantic legs via weighted sum after min-max
 * normalizing each leg independently (design "Architecture Decisions":
 * "Both legs normalize to [0,1] cleanly, so magnitude is real signal").
 * A chunk absent from a leg contributes 0 for that leg — it simply has no
 * signal there, not an "unranked" placeholder.
 */
export function fuseScores(
  lexicalScoresMap: Map<string, number>,
  semanticScoresMap: Map<string, number>,
): Map<string, number> {
  const normalizedLexical = minMaxNormalize(lexicalScoresMap);
  const normalizedSemantic = minMaxNormalize(semanticScoresMap);

  const ids = new Set([...normalizedLexical.keys(), ...normalizedSemantic.keys()]);
  const fused = new Map<string, number>();
  for (const id of ids) {
    const lexical = normalizedLexical.get(id) ?? 0;
    const semantic = normalizedSemantic.get(id) ?? 0;
    fused.set(id, LEXICAL_WEIGHT * lexical + SEMANTIC_WEIGHT * semantic);
  }
  return fused;
}

/**
 * Public retrieval entrypoint: query the corpus, expand via the
 * precomputed neighbor graph, fuse, and return the top `k` chunks ranked
 * best-first. Returns `[]` for an empty/whitespace query or a query with no
 * lexical seeds and therefore no expansion path — never throws on those.
 *
 * `k` defaults to 8 (design: "generous top-K" for the technical-depth use
 * case) and is never exceeded even when larger than the corpus.
 */
export function retrieve(query: string, index: SearchIndex, k: number = DEFAULT_TOP_K): RetrievedChunk[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const chunksById = new Map(index.chunks.map((chunk) => [chunk.id, chunk] as const));
  const seedScores = lexicalScores(index.chunks, trimmed);
  const semanticScores = expandNeighbors(seedScores, chunksById);
  const fused = fuseScores(seedScores, semanticScores);

  return [...fused]
    .sort(([idA, scoreA], [idB, scoreB]) => scoreB - scoreA || idA.localeCompare(idB))
    .slice(0, k)
    .map(([id, score]) => {
      const chunk = chunksById.get(id);
      if (!chunk) {
        throw new Error(`retrieve(): fused score referenced unknown chunk id "${id}".`);
      }
      return toRetrievedChunk(chunk, score);
    });
}

/** Strips the retrieval-only `embedding`/`neighbors` fields before returning a chunk to callers. */
function toRetrievedChunk(chunk: IndexedChunk, score: number): RetrievedChunk {
  return {
    id: chunk.id,
    section: chunk.section,
    title: chunk.title,
    text: chunk.text,
    anchor: chunk.anchor,
    url: chunk.url,
    score,
  };
}
