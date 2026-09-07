// TDD suite for the three-layer project merge logic (design Part 5, Part 8).
// Curation (data/projects.ts) ALWAYS wins over the GitHub snapshot on
// conflicts; repos absent from curation are excluded — this is what enforces
// `omegaup`'s exclusion at merge time, not just at snapshot-fetch time.

import { describe, expect, it } from "vitest";
import type { ProjectCuration } from "../data/projects";
import { findContentGaps, mergeProjects, parseSnapshot, type GithubSnapshot } from "./projects";

function snapshot(repos: GithubSnapshot["repos"]): GithubSnapshot {
  return {
    generatedAt: "2026-09-07T17:57:45.016Z",
    user: "VictorCastillo23",
    repos,
  };
}

function repo(overrides: Partial<GithubSnapshot["repos"][number]> = {}): GithubSnapshot["repos"][number] {
  return {
    name: "Es_Vitrina",
    description: null,
    language: "TypeScript",
    topics: [],
    htmlUrl: "https://github.com/VictorCastillo23/Es_Vitrina",
    homepage: null,
    stars: 0,
    ...overrides,
  };
}

describe("parseSnapshot", () => {
  it("parses a well-formed snapshot and returns it typed", () => {
    const raw = {
      generatedAt: "2026-09-07T17:57:45.016Z",
      user: "VictorCastillo23",
      repos: [
        {
          name: "Es_Vitrina",
          description: null,
          language: "TypeScript",
          topics: [],
          htmlUrl: "https://github.com/VictorCastillo23/Es_Vitrina",
          homepage: "https://esvitrina.com",
          stars: 1,
        },
      ],
    };

    const parsed = parseSnapshot(raw);

    expect(parsed.user).toBe("VictorCastillo23");
    expect(parsed.repos).toHaveLength(1);
    expect(parsed.repos[0].name).toBe("Es_Vitrina");
  });

  it("throws when the top-level shape is not an object", () => {
    expect(() => parseSnapshot(null)).toThrow();
    expect(() => parseSnapshot("not a snapshot")).toThrow();
    expect(() => parseSnapshot(42)).toThrow();
  });

  it("throws when required top-level fields are missing", () => {
    expect(() => parseSnapshot({ user: "VictorCastillo23", repos: [] })).toThrow();
    expect(() => parseSnapshot({ generatedAt: "2026-09-07T00:00:00.000Z", repos: [] })).toThrow();
    expect(() =>
      parseSnapshot({ generatedAt: "2026-09-07T00:00:00.000Z", user: "VictorCastillo23" }),
    ).toThrow();
  });

  it("throws when repos is not an array", () => {
    expect(() =>
      parseSnapshot({
        generatedAt: "2026-09-07T00:00:00.000Z",
        user: "VictorCastillo23",
        repos: "not-an-array",
      }),
    ).toThrow();
  });

  it("throws when a repo entry is missing a required field", () => {
    expect(() =>
      parseSnapshot({
        generatedAt: "2026-09-07T00:00:00.000Z",
        user: "VictorCastillo23",
        repos: [
          {
            // name missing
            description: null,
            language: "TypeScript",
            topics: [],
            htmlUrl: "https://github.com/VictorCastillo23/Es_Vitrina",
            homepage: null,
            stars: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("throws when a repo entry has a wrong-typed field", () => {
    expect(() =>
      parseSnapshot({
        generatedAt: "2026-09-07T00:00:00.000Z",
        user: "VictorCastillo23",
        repos: [
          {
            name: "Es_Vitrina",
            description: null,
            language: "TypeScript",
            topics: "not-an-array", // wrong type
            htmlUrl: "https://github.com/VictorCastillo23/Es_Vitrina",
            homepage: null,
            stars: 1,
          },
        ],
      }),
    ).toThrow();
  });
});

describe("mergeProjects", () => {
  it("excludes a snapshot repo absent from curation (omegaup-style exclusion)", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([
      repo({ name: "Es_Vitrina" }),
      repo({ name: "omegaup", description: "Competitive programming platform" }),
    ]);

    const result = mergeProjects(curation, snap);

    const allTitles = [...result.featured, ...result.other].map((p) => p.repo);
    expect(allTitles).toEqual(["Es_Vitrina"]);
    expect(allTitles).not.toContain("omegaup");
  });

  it("a synthetic omegaup-like entry never appears in output even with a matching curation-like name typo", () => {
    const curation: ProjectCuration[] = [
      { repo: "Risk-Game", tier: "other", order: 1, title: "Risk Game" },
    ];
    const snap = snapshot([
      repo({ name: "Risk-Game", description: "Una copia del juego RISK llevada a C#" }),
      repo({ name: "omegaup", description: "Should never render" }),
    ]);

    const result = mergeProjects(curation, snap);
    const rendered = [...result.featured, ...result.other];

    expect(rendered.some((p) => p.repo.toLowerCase() === "omegaup")).toBe(false);
    expect(rendered.some((p) => p.description === "Should never render")).toBe(false);
  });

  it("still renders a curation entry with no snapshot match, falling back to a constructed repo URL", () => {
    const curation: ProjectCuration[] = [
      { repo: "Ghost-Repo", tier: "other", order: 1, title: "Ghost Repo" },
    ];
    const snap = snapshot([]); // empty snapshot — nothing to match against

    const result = mergeProjects(curation, snap);

    expect(result.other).toHaveLength(1);
    expect(result.other[0].repoUrl).toBe("https://github.com/VictorCastillo23/Ghost-Repo");
    expect(result.other[0].description).toBe("");
    expect(result.other[0].stack).toEqual([]);
  });

  it("joins case-insensitively on repo name, using curation's title for display", () => {
    const curation: ProjectCuration[] = [
      { repo: "es_vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina", description: "from snapshot" })]);

    const result = mergeProjects(curation, snap);

    expect(result.featured).toHaveLength(1);
    expect(result.featured[0].title).toBe("Es Vitrina");
    expect(result.featured[0].description).toBe("from snapshot");
  });

  it("Es_Vitrina and CameraChatbot end up Featured with their curation override descriptions", () => {
    const curation: ProjectCuration[] = [
      {
        repo: "Es_Vitrina",
        tier: "featured",
        order: 1,
        title: "Es Vitrina",
        description: "Curated Es Vitrina description",
      },
      {
        repo: "CameraChatbot",
        tier: "featured",
        order: 2,
        title: "CameraChatbot",
        description: "Curated CameraChatbot description",
      },
    ];
    const snap = snapshot([
      repo({ name: "Es_Vitrina", description: "Raw GitHub description for Es_Vitrina" }),
      repo({ name: "CameraChatbot", description: "Raw GitHub description for CameraChatbot" }),
    ]);

    const result = mergeProjects(curation, snap);

    expect(result.featured.map((p) => p.repo)).toEqual(["Es_Vitrina", "CameraChatbot"]);
    expect(result.featured[0].description).toBe("Curated Es Vitrina description");
    expect(result.featured[1].description).toBe("Curated CameraChatbot description");
    expect(result.other).toHaveLength(0);
  });

  it("Risk-Game ends up Other with the snapshot's own description when curation has no override", () => {
    const curation: ProjectCuration[] = [
      { repo: "Risk-Game", tier: "other", order: 1, title: "Risk Game" },
    ];
    const snap = snapshot([
      repo({ name: "Risk-Game", description: "Una copia del juego RISK llevada a C#" }),
    ]);

    const result = mergeProjects(curation, snap);

    expect(result.other).toHaveLength(1);
    expect(result.other[0].description).toBe("Una copia del juego RISK llevada a C#");
    expect(result.featured).toHaveLength(0);
  });

  it("curation entries are the source of truth for tier since the raw snapshot has no tier field", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
      { repo: "Modulo-inventario", tier: "other", order: 1, title: "Modulo de Inventario" },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina" }), repo({ name: "Modulo-inventario" })]);

    const result = mergeProjects(curation, snap);

    expect(result.featured.map((p) => p.repo)).toEqual(["Es_Vitrina"]);
    expect(result.other.map((p) => p.repo)).toEqual(["Modulo-inventario"]);
  });

  it("falls back to the snapshot description when curation has none (description precedence)", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina", description: "Snapshot description" })]);

    const result = mergeProjects(curation, snap);

    expect(result.featured[0].description).toBe("Snapshot description");
  });

  it("falls back to '' when neither curation nor snapshot provide a description", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina", description: null })]);

    const result = mergeProjects(curation, snap);

    expect(result.featured[0].description).toBe("");
  });

  it("replaces the stack wholesale with curation.stack instead of merging with the snapshot", () => {
    const curation: ProjectCuration[] = [
      {
        repo: "Es_Vitrina",
        tier: "featured",
        order: 1,
        title: "Es Vitrina",
        stack: ["TypeScript", "Next.js", "React", "PostgreSQL", "REST API"],
      },
    ];
    const snap = snapshot([
      repo({ name: "Es_Vitrina", language: "TypeScript", topics: ["web", "portfolio"] }),
    ]);

    const result = mergeProjects(curation, snap);

    expect(result.featured[0].stack).toEqual([
      "TypeScript",
      "Next.js",
      "React",
      "PostgreSQL",
      "REST API",
    ]);
  });

  it("derives and dedupes the stack from snapshot language + topics when curation has no override", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([
      repo({ name: "Es_Vitrina", language: "TypeScript", topics: ["typescript", "web"] }),
    ]);

    const result = mergeProjects(curation, snap);

    expect(result.featured[0].stack).toEqual(["TypeScript", "typescript", "web"]);
  });

  it("normalizes an empty-string snapshot homepage to null for demoUrl", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina", homepage: "" })]);

    const result = mergeProjects(curation, snap);

    expect(result.featured[0].demoUrl).toBeNull();
  });

  it("uses curation.demoUrl over the snapshot homepage when both are present", () => {
    const curation: ProjectCuration[] = [
      {
        repo: "Es_Vitrina",
        tier: "featured",
        order: 1,
        title: "Es Vitrina",
        demoUrl: "https://curated-demo.example.com",
      },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina", homepage: "https://snapshot-demo.example.com" })]);

    const result = mergeProjects(curation, snap);

    expect(result.featured[0].demoUrl).toBe("https://curated-demo.example.com");
  });

  it("sorts each tier by order ascending, breaking ties alphabetically by repo", () => {
    const curation: ProjectCuration[] = [
      { repo: "Zeta-Repo", tier: "other", order: 1, title: "Zeta" },
      { repo: "Alpha-Repo", tier: "other", order: 1, title: "Alpha" },
      { repo: "Beta-Repo", tier: "other", order: 2, title: "Beta" },
    ];
    const snap = snapshot([]);

    const result = mergeProjects(curation, snap);

    expect(result.other.map((p) => p.repo)).toEqual(["Alpha-Repo", "Zeta-Repo", "Beta-Repo"]);
  });

  it("does not crash on an empty curation list or an empty snapshot", () => {
    expect(() => mergeProjects([], snapshot([]))).not.toThrow();

    const result = mergeProjects([], snapshot([]));
    expect(result).toEqual({ featured: [], other: [] });
  });

  it("is pure: calling it twice with the same inputs produces deep-equal, independent results", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina" },
    ];
    const snap = snapshot([repo({ name: "Es_Vitrina", description: "desc" })]);

    const first = mergeProjects(curation, snap);
    const second = mergeProjects(curation, snap);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.featured).not.toBe(second.featured);
  });
});

describe("findContentGaps", () => {
  it("flags a project with an empty description as a missing-description gap", () => {
    const curation: ProjectCuration[] = [
      { repo: "Ghost-Repo", tier: "other", order: 1, title: "Ghost Repo" },
    ];
    const sections = mergeProjects(curation, snapshot([])); // no snapshot match -> description ''

    const gaps = findContentGaps(sections);

    expect(gaps).toEqual([{ repo: "Ghost-Repo", reason: "missing-description" }]);
  });

  it("returns no gaps when every project has a non-empty description", () => {
    const curation: ProjectCuration[] = [
      { repo: "Es_Vitrina", tier: "featured", order: 1, title: "Es Vitrina", description: "ok" },
      { repo: "Risk-Game", tier: "other", order: 1, title: "Risk Game" },
    ];
    const snap = snapshot([repo({ name: "Risk-Game", description: "Snapshot description" })]);

    const gaps = findContentGaps(mergeProjects(curation, snap));

    expect(gaps).toEqual([]);
  });

  it("checks both the featured and other tiers", () => {
    const curation: ProjectCuration[] = [
      { repo: "Featured-Ghost", tier: "featured", order: 1, title: "Featured Ghost" },
      { repo: "Other-Ghost", tier: "other", order: 1, title: "Other Ghost" },
    ];

    const gaps = findContentGaps(mergeProjects(curation, snapshot([])));

    expect(gaps).toEqual([
      { repo: "Featured-Ghost", reason: "missing-description" },
      { repo: "Other-Ghost", reason: "missing-description" },
    ]);
  });

  it("does not crash and returns an empty array for empty sections", () => {
    expect(findContentGaps({ featured: [], other: [] })).toEqual([]);
  });
});
