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

import type { ProjectCuration } from "../data/projects";

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

export interface Project {
  repo: string;
  title: string;
  description: string;
  stack: string[];
  repoUrl: string;
  demoUrl: string | null;
  tier: "featured" | "other";
  order: number;
}

export interface ProjectSections {
  featured: Project[];
  other: Project[];
}

/**
 * Merges the curation allow-list (data/projects.ts) with the GitHub snapshot
 * by repo name (case-insensitive). Curation is layer 2 and ALWAYS wins on
 * conflicts; the snapshot only fills in fields curation leaves unset.
 *
 * Total function — never throws. A curation entry with no snapshot match
 * still renders (degraded: empty description/stack, constructed repo URL)
 * instead of crashing the build on a partial or stale snapshot. A snapshot
 * repo absent from `curation` is silently dropped — this is the allow-list
 * enforcement that excludes `omegaup` at merge time.
 */
export function mergeProjects(
  curation: readonly ProjectCuration[],
  snapshot: GithubSnapshot,
): ProjectSections {
  const snapshotByName = new Map(
    snapshot.repos.map((repo) => [repo.name.toLowerCase(), repo] as const),
  );

  const projects = curation.map((entry) => buildProject(entry, snapshotByName, snapshot.user));

  return {
    featured: sortTier(projects.filter((project) => project.tier === "featured")),
    other: sortTier(projects.filter((project) => project.tier === "other")),
  };
}

function buildProject(
  entry: ProjectCuration,
  snapshotByName: Map<string, GithubRepoSnapshot>,
  snapshotUser: string,
): Project {
  const match = snapshotByName.get(entry.repo.toLowerCase());

  const description = entry.description ?? match?.description ?? "";
  const stack = entry.stack ?? deriveStack(match);
  const repoUrl = match?.htmlUrl ?? `https://github.com/${snapshotUser}/${entry.repo}`;
  const demoUrl = entry.demoUrl ?? (match?.homepage || null);

  return {
    repo: entry.repo,
    title: entry.title,
    description,
    stack,
    repoUrl,
    demoUrl,
    tier: entry.tier,
    order: entry.order,
  };
}

function deriveStack(match: GithubRepoSnapshot | undefined): string[] {
  if (!match) {
    return [];
  }
  const candidates = [match.language, ...match.topics].filter(
    (value): value is string => Boolean(value),
  );
  return Array.from(new Set(candidates));
}

function sortTier(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.order - b.order || a.repo.localeCompare(b.repo));
}

export interface ContentGap {
  repo: string;
  reason: "missing-description";
}

/**
 * Flags projects that resolved to an empty description — i.e. neither
 * `data/projects.ts` nor the GitHub snapshot supplied one. Per spec
 * (project-showcase: "No Invented Content for Missing Descriptions"), an
 * empty description must never silently render; this gate exists so
 * `npm run lint:content` (scripts/check-content.ts) can fail loudly instead.
 */
export function findContentGaps(sections: ProjectSections): ContentGap[] {
  return [...sections.featured, ...sections.other]
    .filter((project) => project.description === "")
    .map((project) => ({ repo: project.repo, reason: "missing-description" as const }));
}
