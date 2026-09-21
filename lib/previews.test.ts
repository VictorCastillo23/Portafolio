// TDD suite for the preview-capture targets (scripts/capture-previews.ts).
// Only the pure target selection is covered here; driving the browser is not
// unit-testable and is verified by running the script itself.

import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import realSnapshotRaw from "../data/github-repos.json";
import { PROJECT_CURATION } from "../data/projects";
import { mergeProjects, parseSnapshot, type Project } from "./projects";
import { PREVIEW_SIZE, previewTargets } from "./previews";

function project(overrides: Partial<Project> = {}): Project {
  return {
    repo: "Es_Vitrina",
    title: "Es Vitrina",
    description: "desc",
    stack: [],
    repoUrl: "https://github.com/VictorCastillo23/Es_Vitrina",
    demoUrl: "https://esvitrina.com",
    previewUrl: "/previews/Es_Vitrina.png",
    tier: "featured",
    order: 1,
    ...overrides,
  };
}

describe("PREVIEW_SIZE", () => {
  it("matches the 1200x630 size of GitHub's social image, so both card variants share one aspect ratio", () => {
    expect(PREVIEW_SIZE).toEqual({ width: 1200, height: 630 });
  });
});

describe("previewTargets", () => {
  it("returns the demo url to capture and the file to write for a project with a demo", () => {
    const targets = previewTargets({ featured: [project()], other: [] });

    expect(targets).toEqual([
      { repo: "Es_Vitrina", url: "https://esvitrina.com", file: "public/previews/Es_Vitrina.png" },
    ]);
  });

  it("skips projects without a demoUrl, which use the GitHub image instead", () => {
    const targets = previewTargets({
      featured: [],
      other: [
        project({
          repo: "Keyseer",
          demoUrl: null,
          previewUrl: "https://opengraph.githubassets.com/1/VictorCastillo23/Keyseer",
        }),
      ],
    });

    expect(targets).toEqual([]);
  });

  it("covers both tiers, featured first", () => {
    const targets = previewTargets({
      featured: [project({ repo: "Modulo-inventario", previewUrl: "/previews/Modulo-inventario.png" })],
      other: [
        project({
          repo: "Risk-Game",
          demoUrl: "https://risk.example.com/",
          previewUrl: "/previews/Risk-Game.png",
          tier: "other",
        }),
      ],
    });

    expect(targets.map((target) => target.repo)).toEqual(["Modulo-inventario", "Risk-Game"]);
  });

  it("writes each file where the card serves it from (previewUrl under public/)", () => {
    const [target] = previewTargets({
      featured: [project({ repo: "Odd Repo", previewUrl: "/previews/Odd Repo.png" })],
      other: [],
    });

    expect(target.file).toBe("public/previews/Odd Repo.png");
  });

  it("returns no targets for empty sections", () => {
    expect(previewTargets({ featured: [], other: [] })).toEqual([]);
  });
});

describe("contract: committed screenshots", () => {
  // A project with a demo renders /previews/<repo>.png, so a missing file would
  // ship a broken image. Fail here instead; regenerate with
  // `npm run capture:previews`.
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const sections = mergeProjects(PROJECT_CURATION, parseSnapshot(realSnapshotRaw));
  const targets = previewTargets(sections);

  it("has at least one project with a live demo to capture", () => {
    expect(targets.length).toBeGreaterThan(0);
  });

  it.each(targets.map((target) => [target.repo, target.file] as const))(
    "has the screenshot for %s at %s",
    (_repo, file) => {
      expect(existsSync(path.resolve(repoRoot, file))).toBe(true);
    },
  );
});
