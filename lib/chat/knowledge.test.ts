// TDD suite for the pure knowledge-base builder (lib/chat/knowledge.ts —
// buildKnowledgeBase(content, sections)). The chat route embeds the whole
// knowledge base in the Anthropic `system` prompt instead of retrieving
// chunks; this module ports the text formats of the retired RAG chunker
// (removed from the repo) into a single deterministic string.

import { describe, expect, it } from "vitest";
import realSnapshotRaw from "../../data/github-repos.json";
import { content as realContent, type SiteContent } from "../../data/content";
import { PROJECT_CURATION } from "../../data/projects";
import { mergeProjects, parseSnapshot, type ProjectSections } from "../projects";
import { buildKnowledgeBase, KNOWLEDGE_CHAR_BUDGET } from "./knowledge";

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
        detail: "Passed with distinction.",
        url: "https://example.test/cert",
      },
      {
        kind: "award",
        title: "Plain Award",
        issuer: "Other Issuer",
        date: "2023",
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
        stack: ["TypeScript", "React"],
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
        stack: [],
        repoUrl: "https://github.com/test/other-repo",
        demoUrl: null,
        tier: "other",
        order: 1,
      },
    ],
    ...overrides,
  };
}

describe("buildKnowledgeBase", () => {
  it("wraps the output in <knowledge> ... </knowledge> with no trailing newline", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result.startsWith("<knowledge>\n")).toBe(true);
    expect(result.endsWith("\n</knowledge>")).toBe(true);
  });

  it("emits the section headings in the documented order", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    const headings = ["## Inicio", "## Sobre mí", "## Experiencia", "## Credenciales", "## Proyectos", "## Contacto"];
    const positions = headings.map((heading) => result.indexOf(heading));

    for (const position of positions) {
      expect(position).toBeGreaterThanOrEqual(0);
    }
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("includes the hero block with title, name, role, tagline and blurb", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result).toContain("### Test Person.\nTest Person — Test Role. Test tagline. Test blurb.");
  });

  it("includes the about summary, skills line and education line", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result).toContain("### Resumen\nParagraph one. Paragraph two.");
    expect(result).toContain("### Habilidades\nHabilidades: TypeScript, Testing.");
    expect(result).toContain("### Educación\nTest Degree — Test School (2020 - 2024). Test detail.");
  });

  it("includes one block per job in content order", () => {
    const result = buildKnowledgeBase(
      minimalContent({
        experience: [
          { id: "acme", company: "Acme Corp", role: "Engineer", range: "2024 - Now", bullets: ["Did a thing.", "Did another thing."] },
          { id: "beta", company: "Beta Inc", role: "Intern", range: "2023", bullets: ["Learned."] },
        ],
      }),
      minimalSections(),
    );

    expect(result).toContain(
      "### Acme Corp — Engineer\nAcme Corp — Engineer (2024 - Now). Did a thing. Did another thing.",
    );
    expect(result).toContain("### Beta Inc — Intern\nBeta Inc — Intern (2023). Learned.");
    expect(result.indexOf("### Acme Corp — Engineer")).toBeLessThan(result.indexOf("### Beta Inc — Intern"));
  });

  it("includes a credential with detail and one without", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result).toContain(
      "### Test Certification\nTest Certification — Test Issuer (2024). Passed with distinction.",
    );
    expect(result).toContain("### Plain Award\nPlain Award — Other Issuer (2023).\n");
  });

  it("includes a project with stack and one without, featured before other", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result).toContain("### Featured Project\nFeatured Project. A featured project. Stack: TypeScript, React.");
    expect(result).toContain("### Other Project\nOther Project. An other-tier project.\n");
    expect(result).not.toContain("An other-tier project. Stack:");
    expect(result.indexOf("### Featured Project")).toBeLessThan(result.indexOf("### Other Project"));
  });

  it("includes the contact blurb, email and phone exactly as given", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result).toContain("## Contacto\nReach out. Email: test@example.test. Teléfono: 555-0100.");
  });

  it("does not leak ids, anchors or urls", () => {
    const result = buildKnowledgeBase(minimalContent(), minimalSections());

    expect(result).not.toContain("#hero");
    expect(result).not.toContain("#experience");
    expect(result).not.toContain("experience-");
    expect(result).not.toContain("credential-");
    expect(result).not.toContain("project-featured-repo");
    expect(result).not.toContain("https://example.test/cert");
    expect(result).not.toContain("https://github.com/test/featured-repo");
    expect(result).not.toContain("https://github.com/test/other-repo");
  });

  it("is deterministic: two calls with the same inputs return equal strings", () => {
    const fixtureContent = minimalContent();
    const fixtureSections = minimalSections();

    expect(buildKnowledgeBase(fixtureContent, fixtureSections)).toBe(
      buildKnowledgeBase(fixtureContent, fixtureSections),
    );
  });

  it("throws naming the entry when an entry's text would be empty", () => {
    const content = minimalContent();
    content.about.paragraphs = [];

    expect(() => buildKnowledgeBase(content, minimalSections())).toThrow(/Resumen/);
  });
});

describe("contract: buildKnowledgeBase over the real site data", () => {
  const realSections = mergeProjects(PROJECT_CURATION, parseSnapshot(realSnapshotRaw));
  const result = buildKnowledgeBase(realContent, realSections);

  it("contains every job company, credential title, project title and the exact contact details", () => {
    for (const job of realContent.experience) {
      expect(result).toContain(job.company);
    }
    for (const credential of realContent.credentials) {
      expect(result).toContain(credential.title);
    }
    for (const project of [...realSections.featured, ...realSections.other]) {
      expect(result).toContain(project.title);
    }
    expect(result).toContain(realContent.contact.email);
    expect(result).toContain(realContent.contact.phone);
  });

  // Budget guard: the knowledge base is stuffed whole into the system prompt
  // on every request. If this fails, the content has outgrown context stuffing
  // and it is time to revisit retrieval (RAG) instead of raising the budget.
  it("stays within KNOWLEDGE_CHAR_BUDGET so context stuffing remains viable", () => {
    expect(result.length).toBeLessThanOrEqual(KNOWLEDGE_CHAR_BUDGET);
  });
});
