// TDD suite for the pure chunk-building logic (design "File Changes":
// lib/search/chunks.ts — buildChunks(content, sections)). Extracted from
// tools/search-index-builder/build.ts's original inline implementation
// (Phase 1); this suite also contains an approval test proving the
// extraction is behavior-preserving against the already-committed
// data/search-index.json artifact (strict-tdd.md's "Approval Testing for
// refactoring existing code").

import { describe, expect, it } from "vitest";
import realSnapshotRaw from "../../data/github-repos.json";
import realSearchIndexRaw from "../../data/search-index.json";
import { content as realContent, SECTION_IDS, type SiteContent } from "../../data/content";
import { PROJECT_CURATION } from "../../data/projects";
import { mergeProjects, parseSnapshot, type ProjectSections } from "../projects";
import { buildChunks } from "./chunks";
import { parseSearchIndex } from "./types";

function minimalContent(overrides: Partial<SiteContent> = {}): SiteContent {
  return {
    meta: {
      name: "Test Person",
      role: "Test Role",
      siteUrl: "https://example.test",
      description: "Test description.",
    },
    nav: [],
    hero: {
      eyebrow: "Hola",
      title: "Test Person.",
      tagline: "Test tagline.",
      blurb: "Test blurb.",
      cta: { label: "Ver", href: "#projects" },
    },
    about: {
      paragraphs: ["Paragraph one.", "Paragraph two."],
      skills: ["TypeScript", "Testing"],
      education: {
        degree: "Test Degree",
        school: "Test School",
        range: "2020 - 2024",
        detail: "Test detail.",
      },
    },
    experience: [
      {
        id: "acme",
        company: "Acme Corp",
        role: "Engineer",
        range: "2024 - Now",
        bullets: ["Did a thing.", "Did another thing."],
      },
    ],
    credentials: [
      {
        kind: "certification",
        title: "Test Certification",
        issuer: "Test Issuer",
        date: "2024",
        url: "https://example.test/cert",
      },
    ],
    contact: {
      eyebrow: "Next",
      title: "Contact",
      blurb: "Reach out.",
      email: "test@example.test",
      phone: "555-0100",
    },
    socials: [],
    footer: { text: "Footer text." },
    ...overrides,
  };
}

function minimalSections(overrides: Partial<ProjectSections> = {}): ProjectSections {
  return {
    featured: [
      {
        repo: "featured-repo",
        title: "Featured Project",
        description: "A featured project.",
        stack: ["TypeScript"],
        repoUrl: "https://github.com/test/featured-repo",
        demoUrl: null,
        tier: "featured",
        order: 1,
      },
    ],
    other: [
      {
        repo: "other-repo",
        title: "Other Project",
        description: "An other-tier project.",
        stack: ["Python"],
        repoUrl: "https://github.com/test/other-repo",
        demoUrl: null,
        tier: "other",
        order: 1,
      },
    ],
    ...overrides,
  };
}

describe("buildChunks", () => {
  it("builds exactly 4 + experience + credentials + projects + 1 chunks for a minimal fixture", () => {
    const chunks = buildChunks(minimalContent(), minimalSections());

    // hero, about-summary, about-skills, about-education, contact = 5 fixed
    // + 1 experience + 1 credential + 2 projects = 9
    expect(chunks).toHaveLength(9);
  });

  it("assigns the exact expected id scheme per section", () => {
    const chunks = buildChunks(minimalContent(), minimalSections());
    const ids = chunks.map((chunk) => chunk.id);

    expect(ids).toEqual([
      "hero",
      "about-summary",
      "about-skills",
      "about-education",
      "experience-acme",
      "credential-test-certification",
      "project-featured-repo",
      "project-other-repo",
      "contact",
    ]);
  });

  it("every chunk's section is a known SectionId", () => {
    const chunks = buildChunks(minimalContent(), minimalSections());

    for (const chunk of chunks) {
      expect(SECTION_IDS).toContain(chunk.section);
    }
  });

  it("anchors point to the chunk's own section, always present", () => {
    const chunks = buildChunks(minimalContent(), minimalSections());

    const heroChunk = chunks.find((chunk) => chunk.id === "hero")!;
    const experienceChunk = chunks.find((chunk) => chunk.id === "experience-acme")!;
    const projectChunk = chunks.find((chunk) => chunk.id === "project-featured-repo")!;

    expect(heroChunk.anchor).toBe("#hero");
    expect(experienceChunk.anchor).toBe("#experience");
    expect(projectChunk.anchor).toBe("#projects");
    for (const chunk of chunks) {
      expect(chunk.anchor.startsWith("#")).toBe(true);
    }
  });

  it("url is credential.url | project.repoUrl, else null", () => {
    const chunks = buildChunks(minimalContent(), minimalSections());

    const heroChunk = chunks.find((chunk) => chunk.id === "hero")!;
    const credentialChunk = chunks.find((chunk) => chunk.id === "credential-test-certification")!;
    const projectChunk = chunks.find((chunk) => chunk.id === "project-featured-repo")!;

    expect(heroChunk.url).toBeNull();
    expect(credentialChunk.url).toBe("https://example.test/cert");
    expect(projectChunk.url).toBe("https://github.com/test/featured-repo");
  });

  it("a credential without a url maps to url: null", () => {
    const chunks = buildChunks(
      minimalContent({
        credentials: [{ kind: "award", title: "No URL Award", issuer: "Test Issuer", date: "2024" }],
      }),
      minimalSections(),
    );

    const credentialChunk = chunks.find((chunk) => chunk.id === "credential-no-url-award")!;
    expect(credentialChunk.url).toBeNull();
  });

  it("slugifies credential titles with accents and punctuation into ascii-ish ids", () => {
    const chunks = buildChunks(
      minimalContent({
        credentials: [
          { kind: "certification", title: "Certificación en Programación (Nivel 2)", issuer: "X", date: "2024" },
        ],
      }),
      minimalSections(),
    );

    expect(chunks.some((chunk) => chunk.id === "credential-certificacion-en-programacion-nivel-2")).toBe(true);
  });

  it("throws on a duplicate chunk id", () => {
    const duplicateSections = minimalSections({
      other: [
        {
          repo: "featured-repo", // same repo id as the featured project -> duplicate "project-featured-repo"
          title: "Duplicate",
          description: "",
          stack: [],
          repoUrl: "https://github.com/test/featured-repo",
          demoUrl: null,
          tier: "other",
          order: 1,
        },
      ],
    });

    expect(() => buildChunks(minimalContent(), duplicateSections)).toThrow(/duplicate/i);
  });

  it("throws on empty text for a chunk", () => {
    const content = minimalContent();
    content.about.paragraphs = [];

    expect(() => buildChunks(content, minimalSections())).toThrow();
  });

  it("is pure: calling it twice with the same inputs produces deep-equal, independent arrays", () => {
    const fixtureContent = minimalContent();
    const fixtureSections = minimalSections();

    const first = buildChunks(fixtureContent, fixtureSections);
    const second = buildChunks(fixtureContent, fixtureSections);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});

describe("contract: buildChunks matches the committed data/search-index.json", () => {
  it("produces the same 18 chunks (id/section/title/text/anchor/url) as the committed artifact", () => {
    const realSnapshot = parseSnapshot(realSnapshotRaw);
    const realSections = mergeProjects(PROJECT_CURATION, realSnapshot);
    const realIndex = parseSearchIndex(realSearchIndexRaw);

    const chunks = buildChunks(realContent, realSections);

    expect(chunks).toHaveLength(18);
    expect(chunks).toHaveLength(realIndex.chunks.length);

    const actual = chunks.map(({ id, section, title, text, anchor, url }) => ({
      id,
      section,
      title,
      text,
      anchor,
      url,
    }));
    const expected = realIndex.chunks.map(({ id, section, title, text, anchor, url }) => ({
      id,
      section,
      title,
      text,
      anchor,
      url,
    }));

    expect(actual).toEqual(expected);
  });
});
