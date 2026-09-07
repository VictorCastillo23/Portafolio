// Content-gap gate — run via `npm run lint:content`.
//
// Fails the run (non-zero exit) if any curated project resolves to an empty
// description at merge time (neither data/projects.ts nor the committed
// GitHub snapshot supplied one). This is the CI-facing half of the
// spec's "No Invented Content for Missing Descriptions" requirement: the
// merge itself never invents copy (lib/projects.ts::mergeProjects renders an
// empty string instead), and this script makes that gap impossible to miss.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_CURATION } from "../data/projects";
import { findContentGaps, mergeProjects, parseSnapshot } from "../lib/projects";

const SNAPSHOT_PATH = path.resolve(import.meta.dirname, "../data/github-repos.json");

async function main(): Promise<void> {
  const raw = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  const snapshot = parseSnapshot(raw);

  const sections = mergeProjects(PROJECT_CURATION, snapshot);
  const gaps = findContentGaps(sections);

  if (gaps.length > 0) {
    console.error("[lint:content] Content gap(s) found — no rendered description:");
    for (const gap of gaps) {
      console.error(`  - ${gap.repo}: ${gap.reason}`);
    }
    console.error(
      "Add a description override in data/projects.ts, or confirm the GitHub snapshot has one.",
    );
    process.exit(1);
  }

  console.log(`[lint:content] OK — all ${sections.featured.length + sections.other.length} project(s) have a description.`);
}

main().catch((error: unknown) => {
  console.error("[lint:content] Unexpected error.", error);
  process.exit(1);
});
