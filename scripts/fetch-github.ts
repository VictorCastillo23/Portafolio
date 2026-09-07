// Regenerates data/github-repos.json from the live GitHub API.
//
// Run manually via `npm run fetch:github` — NEVER wired to `prebuild` or any
// build step. `next build` and page render must never hit the network; a
// GitHub outage must never break a deploy (design Part 2, decision 1 & 13).
//
// Fails closed: on any non-2xx response, or a network error, the existing
// committed snapshot is left untouched and the process exits 1.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_CURATION } from "../data/projects";

const GITHUB_USER = "VictorCastillo23";
const API_BASE = "https://api.github.com";
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../data/github-repos.json");

interface GithubApiRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
}

interface GithubRepoSnapshot {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  htmlUrl: string;
  homepage: string | null;
  stars: number;
}

interface GithubSnapshot {
  generatedAt: string;
  user: string;
  repos: GithubRepoSnapshot[];
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portafolio-sync",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function failClosed(response: Response, context: string): Promise<never> {
  const remaining = response.headers.get("x-ratelimit-remaining");
  console.error(
    `[fetch-github] ${context} failed: HTTP ${response.status} ${response.statusText}. ` +
      `x-ratelimit-remaining: ${remaining ?? "unknown"}. Snapshot NOT written.`,
  );
  process.exit(1);
}

async function fetchTopicsFallback(repoName: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_USER}/${repoName}/topics`, {
    headers: githubHeaders(),
  });
  if (!response.ok) {
    console.warn(
      `[fetch-github] topics fallback for ${repoName} failed (HTTP ${response.status}); using empty topics.`,
    );
    return [];
  }
  const body = (await response.json()) as { names?: string[] };
  return body.names ?? [];
}

async function main(): Promise<void> {
  const listResponse = await fetch(
    `${API_BASE}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    { headers: githubHeaders() },
  );

  if (!listResponse.ok) {
    await failClosed(listResponse, `GET /users/${GITHUB_USER}/repos`);
  }

  const rawRepos = (await listResponse.json()) as GithubApiRepo[];

  // Allow-list filter at snapshot-build time: only repos curated in
  // data/projects.ts are ever written to the snapshot. This drops `omegaup`
  // (and any other account repo) here, independent of the merge-time
  // allow-list enforcement in lib/projects.ts (defense in depth).
  const curatedNames = new Set(PROJECT_CURATION.map((entry) => entry.repo));
  const curatedRepos = rawRepos.filter((repo) => curatedNames.has(repo.name));

  const missing = [...curatedNames].filter(
    (name) => !curatedRepos.some((repo) => repo.name === name),
  );
  if (missing.length > 0) {
    console.warn(
      `[fetch-github] Warning: curated repo(s) not found on GitHub: ${missing.join(", ")}. ` +
        "They will be absent from the snapshot; mergeProjects() falls back to a constructed repo URL for these.",
    );
  }

  const snapshotRepos: GithubRepoSnapshot[] = [];
  for (const repo of curatedRepos) {
    // GitHub's repo-list endpoint returns `topics` by default under API
    // version 2022-11-28; fall back to the dedicated endpoint only if it
    // ever comes back missing.
    const topics = repo.topics ?? (await fetchTopicsFallback(repo.name));
    snapshotRepos.push({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      topics,
      htmlUrl: repo.html_url,
      homepage: repo.homepage || null,
      stars: repo.stargazers_count,
    });
  }

  snapshotRepos.sort((a, b) => a.name.localeCompare(b.name));

  const snapshot: GithubSnapshot = {
    generatedAt: new Date().toISOString(),
    user: GITHUB_USER,
    repos: snapshotRepos,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(
    `[fetch-github] Wrote ${snapshotRepos.length} repo(s) to ${path.relative(process.cwd(), OUTPUT_PATH)}`,
  );
}

main().catch((error: unknown) => {
  console.error("[fetch-github] Unexpected error — snapshot NOT written.", error);
  process.exit(1);
});
