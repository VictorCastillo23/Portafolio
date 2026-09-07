// Layer-merge logic for the Projects section (design Part 5, Part 8).
//
// Three layers, merged by repo name:
//   1. data/content.ts        — CV copy (not consumed here)
//   2. data/projects.ts       — human curation, ALWAYS wins on conflicts
//   3. data/github-repos.json — machine snapshot (parsed via parseSnapshot)
//
// A snapshot repo absent from the curation allow-list is excluded from the
// merge result — this is what enforces `omegaup`'s exclusion at runtime,
// independent of the (best-effort) filtering already done when the snapshot
// is fetched (scripts/fetch-github.ts).

export interface GithubRepoSnapshot {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  htmlUrl: string;
  homepage: string | null;
  stars: number;
}

export interface GithubSnapshot {
  generatedAt: string;
  user: string;
  repos: GithubRepoSnapshot[];
}

/**
 * Validates and narrows an unknown value to a {@link GithubSnapshot}.
 * Throws a descriptive error on any shape violation — callers (build-time
 * data loading, the contract test) are expected to fail loudly rather than
 * silently render a broken page from a malformed snapshot file.
 */
export function parseSnapshot(raw: unknown): GithubSnapshot {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid GitHub snapshot: expected an object.");
  }

  const candidate = raw as Record<string, unknown>;

  if (typeof candidate.generatedAt !== "string") {
    throw new Error("Invalid GitHub snapshot: \"generatedAt\" must be a string.");
  }
  if (typeof candidate.user !== "string") {
    throw new Error("Invalid GitHub snapshot: \"user\" must be a string.");
  }
  if (!Array.isArray(candidate.repos)) {
    throw new Error("Invalid GitHub snapshot: \"repos\" must be an array.");
  }

  const repos = candidate.repos.map((entry, index) => parseRepoEntry(entry, index));

  return {
    generatedAt: candidate.generatedAt,
    user: candidate.user,
    repos,
  };
}

function parseRepoEntry(entry: unknown, index: number): GithubRepoSnapshot {
  if (typeof entry !== "object" || entry === null) {
    throw new Error(`Invalid GitHub snapshot: repos[${index}] must be an object.`);
  }

  const repo = entry as Record<string, unknown>;

  if (typeof repo.name !== "string") {
    throw new Error(`Invalid GitHub snapshot: repos[${index}].name must be a string.`);
  }
  if (repo.description !== null && typeof repo.description !== "string") {
    throw new Error(
      `Invalid GitHub snapshot: repos[${index}].description must be a string or null.`,
    );
  }
  if (repo.language !== null && typeof repo.language !== "string") {
    throw new Error(`Invalid GitHub snapshot: repos[${index}].language must be a string or null.`);
  }
  if (!Array.isArray(repo.topics) || repo.topics.some((topic) => typeof topic !== "string")) {
    throw new Error(`Invalid GitHub snapshot: repos[${index}].topics must be a string array.`);
  }
  if (typeof repo.htmlUrl !== "string") {
    throw new Error(`Invalid GitHub snapshot: repos[${index}].htmlUrl must be a string.`);
  }
  if (repo.homepage !== null && typeof repo.homepage !== "string") {
    throw new Error(`Invalid GitHub snapshot: repos[${index}].homepage must be a string or null.`);
  }
  if (typeof repo.stars !== "number") {
    throw new Error(`Invalid GitHub snapshot: repos[${index}].stars must be a number.`);
  }

  return {
    name: repo.name,
    description: repo.description as string | null,
    language: repo.language as string | null,
    topics: repo.topics as string[],
    htmlUrl: repo.htmlUrl,
    homepage: repo.homepage as string | null,
    stars: repo.stars,
  };
}
