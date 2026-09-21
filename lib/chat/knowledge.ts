// Pure knowledge-base builder for the chat assistant.
//
// Maps the CV content (data/content.ts) + merged project sections
// (lib/projects.ts's mergeProjects() output) into ONE string that the chat
// route embeds whole in the Anthropic `system` prompt. It replaces RAG
// chunking: the text formats below are ported from the retired chunker
// (lib/search/chunks.ts), but ids, anchors and urls are intentionally left
// out — the model must not cite or link them.
//
// Pure: no I/O, no randomness, deterministic given the same inputs. The
// labels ("Inicio", "Habilidades", "Teléfono", ...) stay in Spanish because
// they mirror the site content the assistant answers about.

import type { Credential, Job, SiteContent } from "../../data/content";
import type { Project, ProjectSections } from "../projects";

/**
 * Upper bound (in characters) for the whole knowledge base. Stuffing the
 * full text into every request is only viable while it stays small; a test
 * over the real data enforces this so growth is noticed early.
 */
export const KNOWLEDGE_CHAR_BUDGET = 30_000;

interface Entry {
  /** Human-readable name, used only in error messages. */
  name: string;
  /** Optional `###` heading; the contact section has none. */
  heading?: string;
  body: string;
}

function jobEntry(job: Job): Entry {
  const title = `${job.company} — ${job.role}`;
  return {
    name: title,
    heading: title,
    body: `${job.company} — ${job.role} (${job.range}). ${job.bullets.join(" ")}`,
  };
}

function credentialEntry(credential: Credential): Entry {
  const detail = credential.detail ? ` ${credential.detail}` : "";
  return {
    name: credential.title,
    heading: credential.title,
    body: `${credential.title} — ${credential.issuer} (${credential.date}).${detail}`,
  };
}

function projectEntry(project: Project): Entry {
  const stack = project.stack.length > 0 ? ` Stack: ${project.stack.join(", ")}.` : "";
  return {
    name: project.title,
    heading: project.title,
    body: `${project.title}. ${project.description}${stack}`,
  };
}

function renderEntry(entry: Entry): string {
  if (entry.body.trim().length === 0) {
    throw new Error(`buildKnowledgeBase: entry "${entry.name}" has empty text.`);
  }
  return entry.heading === undefined ? entry.body : `### ${entry.heading}\n${entry.body}`;
}

function renderSection(title: string, entries: Entry[]): string {
  return `## ${title}\n${entries.map(renderEntry).join("\n\n")}`;
}

/**
 * Builds the whole knowledge base about the site owner as a single string
 * wrapped in `<knowledge>` tags. Throws when any entry's text is empty, so a
 * broken content edit fails loudly instead of silently shipping a hole.
 */
export function buildKnowledgeBase(content: SiteContent, sections: ProjectSections): string {
  const { meta, hero, about, contact } = content;
  const { education } = about;

  const body = [
    renderSection("Inicio", [
      {
        name: "Inicio",
        heading: hero.title,
        body: `${meta.name} — ${meta.role}. ${hero.tagline} ${hero.blurb}`,
      },
    ]),
    renderSection("Sobre mí", [
      { name: "Sobre mí — Resumen", heading: "Resumen", body: about.paragraphs.join(" ") },
      {
        name: "Sobre mí — Habilidades",
        heading: "Habilidades",
        body: `Habilidades: ${about.skills.join(", ")}.`,
      },
      {
        name: "Sobre mí — Educación",
        heading: "Educación",
        body: `${education.degree} — ${education.school} (${education.range}). ${education.detail}`,
      },
    ]),
    renderSection("Experiencia", content.experience.map(jobEntry)),
    renderSection("Credenciales", content.credentials.map(credentialEntry)),
    renderSection("Proyectos", [...sections.featured, ...sections.other].map(projectEntry)),
    renderSection("Contacto", [
      {
        name: "Contacto",
        body: `${contact.blurb} Email: ${contact.email}. Teléfono: ${contact.phone}.`,
      },
    ]),
  ].join("\n\n");

  return `<knowledge>\n${body}\n</knowledge>`;
}
