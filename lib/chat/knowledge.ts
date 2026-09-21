// Pure knowledge-base builder for the chat assistant.
//
// Maps the CV content (data/content.ts) + merged project sections
// (lib/projects.ts's mergeProjects() output) into ONE string that the chat
// route embeds whole in the Anthropic `system` prompt. It replaces RAG
// chunking: the text formats below are ported from the retired RAG chunker
// (removed from the repo), but ids, anchors and urls are intentionally left
// out — the model must not cite or link them.
//
// Pure: no I/O, no randomness, deterministic given the same inputs. The
// labels ("Inicio", "Habilidades", "Teléfono", ...) stay in Spanish because
// they mirror the site content the assistant answers about.

import type { SiteContent } from "../../data/content";
import type { ProjectSections } from "../projects";

/**
 * Upper bound (in characters) for the whole knowledge base. Stuffing the
 * full text into every request is only viable while it stays small; a test
 * over the real data enforces this so growth is noticed early.
 */
export const KNOWLEDGE_CHAR_BUDGET = 30_000;

/**
 * Builds the whole knowledge base about the site owner as a single string
 * wrapped in `<knowledge>` tags.
 */
export function buildKnowledgeBase(content: SiteContent, sections: ProjectSections): string {
  const { meta, hero, about, contact } = content;
  const { education } = about;

  const jobs = content.experience.map(
    (job) => `### ${job.company} — ${job.role}\n${job.company} — ${job.role} (${job.range}). ${job.bullets.join(" ")}`,
  );
  const credentials = content.credentials.map(
    (c) => `### ${c.title}\n${c.title} — ${c.issuer} (${c.date}).${c.detail ? ` ${c.detail}` : ""}`,
  );
  const projects = [...sections.featured, ...sections.other].map(
    (p) =>
      `### ${p.title}\n${p.title}. ${p.description}${p.stack.length > 0 ? ` Stack: ${p.stack.join(", ")}.` : ""}`,
  );

  const body = [
    `## Inicio\n### ${hero.title}\n${meta.name} — ${meta.role}. ${hero.tagline} ${hero.blurb}`,
    `## Sobre mí\n### Resumen\n${about.paragraphs.join(" ")}\n\n### Habilidades\nHabilidades: ${about.skills.join(", ")}.\n\n### Educación\n${education.degree} — ${education.school} (${education.range}). ${education.detail}`,
    `## Experiencia\n${jobs.join("\n\n")}`,
    `## Credenciales\n${credentials.join("\n\n")}`,
    `## Proyectos\n${projects.join("\n\n")}`,
    `## Contacto\n${contact.blurb} Email: ${contact.email}. Teléfono: ${contact.phone}.`,
  ].join("\n\n");

  return `<knowledge>\n${body}\n</knowledge>`;
}
