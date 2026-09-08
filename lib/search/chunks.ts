// Pure chunk-building logic (design "File Changes": lib/search/chunks.ts).
//
// Extracted from tools/search-index-builder/build.ts's original inline
// implementation (Phase 1 apply-progress task 1.3's "lift-and-shift ready"
// note) — the isolated build tool now imports buildChunks() from here
// instead of defining its own copy (cross-package-boundary relative
// import, same pattern already used there for data/content, data/projects,
// lib/projects, lib/search/types).
//
// Maps the CV content (data/content.ts) + merged project sections
// (lib/projects.ts's mergeProjects() output) into the 18 documents that get
// embedded at build time into data/search-index.json. Pure: no I/O, no
// randomness, deterministic given the same content + sections.

import {
  SECTION_IDS,
  type Credential,
  type Job,
  type SectionId,
  type SiteContent,
} from "../../data/content";
import type { Project, ProjectSections } from "../projects";
import type { SearchChunk } from "./types";

/**
 * Deterministic ascii-ish slug for credential ids — credentials have no `id`
 * field of their own (data/content.ts's Credential shape is out of scope for
 * this change), so ids are derived from the title. Retitling a credential
 * changes its chunk id; accepted per design, since citations are not
 * persisted across builds.
 */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // strip combining diacritics (e.g. accented vowels -> plain)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function anchorFor(section: SectionId): string {
  return `#${section}`;
}

function jobChunk(job: Job): SearchChunk {
  return {
    id: `experience-${job.id}`,
    section: "experience",
    title: `${job.company} — ${job.role}`,
    text: `${job.company} — ${job.role} (${job.range}). ${job.bullets.join(" ")}`,
    anchor: anchorFor("experience"),
    url: null,
  };
}

function credentialChunk(credential: Credential): SearchChunk {
  const detail = credential.detail ? ` ${credential.detail}` : "";
  return {
    id: `credential-${slugify(credential.title)}`,
    section: "credentials",
    title: credential.title,
    text: `${credential.title} — ${credential.issuer} (${credential.date}).${detail}`,
    anchor: anchorFor("credentials"),
    url: credential.url ?? null,
  };
}

function projectChunk(project: Project): SearchChunk {
  const stack = project.stack.length > 0 ? ` Stack: ${project.stack.join(", ")}.` : "";
  return {
    id: `project-${project.repo.toLowerCase()}`,
    section: "projects",
    title: project.title,
    text: `${project.title}. ${project.description}${stack}`,
    anchor: anchorFor("projects"),
    url: project.repoUrl,
  };
}

/**
 * Maps CV content + merged project sections into the full set of search
 * chunks. Throws on a duplicate chunk id, an unknown section, or empty
 * chunk text — callers (the index-build tool, this module's own tests) are
 * expected to fail loudly rather than silently embed a broken chunk.
 */
export function buildChunks(content: SiteContent, sections: ProjectSections): SearchChunk[] {
  const chunks: SearchChunk[] = [
    {
      id: "hero",
      section: "hero",
      title: content.hero.title,
      text: `${content.meta.name} — ${content.meta.role}. ${content.hero.tagline} ${content.hero.blurb}`,
      anchor: anchorFor("hero"),
      url: null,
    },
    {
      id: "about-summary",
      section: "about",
      title: "Sobre mí — Resumen",
      text: content.about.paragraphs.join(" "),
      anchor: anchorFor("about"),
      url: null,
    },
    {
      id: "about-skills",
      section: "about",
      title: "Sobre mí — Habilidades",
      text: `Habilidades: ${content.about.skills.join(", ")}.`,
      anchor: anchorFor("about"),
      url: null,
    },
    {
      id: "about-education",
      section: "about",
      title: "Sobre mí — Educación",
      text: `${content.about.education.degree} — ${content.about.education.school} (${content.about.education.range}). ${content.about.education.detail}`,
      anchor: anchorFor("about"),
      url: null,
    },
    ...content.experience.map(jobChunk),
    ...content.credentials.map(credentialChunk),
    ...[...sections.featured, ...sections.other].map(projectChunk),
    {
      id: "contact",
      section: "contact",
      title: "Contacto",
      text: `${content.contact.blurb} Email: ${content.contact.email}. Teléfono: ${content.contact.phone}.`,
      anchor: anchorFor("contact"),
      url: null,
    },
  ];

  const seenIds = new Set<string>();
  for (const chunk of chunks) {
    if (seenIds.has(chunk.id)) {
      throw new Error(`buildChunks: duplicate chunk id detected: "${chunk.id}".`);
    }
    seenIds.add(chunk.id);
    if (!SECTION_IDS.includes(chunk.section)) {
      throw new Error(`buildChunks: unknown section "${chunk.section}" on chunk "${chunk.id}".`);
    }
    if (chunk.text.trim().length === 0) {
      throw new Error(`buildChunks: chunk "${chunk.id}" has empty text.`);
    }
  }

  return chunks;
}
