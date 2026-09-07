// TDD suite for the three-layer project merge logic (design Part 5, Part 8).
// Curation (data/projects.ts) ALWAYS wins over the GitHub snapshot on
// conflicts; repos absent from curation are excluded — this is what enforces
// `omegaup`'s exclusion at merge time, not just at snapshot-fetch time.

import { describe, expect, it } from "vitest";
import { parseSnapshot } from "./projects";

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
