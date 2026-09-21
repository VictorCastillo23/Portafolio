// Regenerates public/previews/<repo>.png by screenshotting each project's live
// demo (see previewTargets in lib/previews.ts for which projects qualify).
//
// Run manually via `npm run capture:previews` — NEVER wired to `prebuild` or
// any build step: `next build` must never hit the network or launch a browser.
// The PNGs are committed, so a deploy never depends on the demos being up.
//
// Only the public demo URLs already in the curation data are visited: no
// logins, no form input. Any failed capture makes the run exit non-zero; the
// previous PNG for that project is left untouched.

import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { PROJECT_CURATION } from "../data/projects";
import { PREVIEW_SIZE, previewTargets } from "../lib/previews";
import { mergeProjects, parseSnapshot } from "../lib/projects";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const SNAPSHOT_PATH = path.resolve(REPO_ROOT, "data/github-repos.json");
// Azure App Service apps can be cold; the first request may take a while.
const NAVIGATION_TIMEOUT_MS = 60_000;

async function main(): Promise<void> {
  const raw = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  const sections = mergeProjects(PROJECT_CURATION, parseSnapshot(raw));
  const targets = previewTargets(sections);

  if (targets.length === 0) {
    console.log("[capture-previews] No projects with a live demo — nothing to capture.");
    return;
  }

  const browser = await chromium.launch({ headless: true });
  let failures = 0;

  try {
    const context = await browser.newContext({ viewport: PREVIEW_SIZE });

    for (const target of targets) {
      const outputPath = path.resolve(REPO_ROOT, target.file);
      const page = await context.newPage();
      try {
        await page.goto(target.url, { waitUntil: "networkidle", timeout: NAVIGATION_TIMEOUT_MS });
        await mkdir(path.dirname(outputPath), { recursive: true });
        await page.screenshot({ path: outputPath, type: "png" });
        const { size } = await stat(outputPath);
        console.log(`[capture-previews] OK   ${target.repo} -> ${target.file} (${size} bytes)`);
      } catch (error: unknown) {
        failures += 1;
        const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
        console.error(`[capture-previews] FAIL ${target.repo} (${target.url}): ${reason}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (failures > 0) {
    console.error(`[capture-previews] ${failures} of ${targets.length} capture(s) failed.`);
    process.exit(1);
  }

  console.log(`[capture-previews] Done — ${targets.length} preview(s) written.`);
}

main().catch((error: unknown) => {
  console.error("[capture-previews] Unexpected error.", error);
  process.exit(1);
});
