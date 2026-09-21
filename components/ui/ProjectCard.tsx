// Project card (design decision 10: one component, `variant` prop, sole
// owner of the hover transition). Hover: border -> accent + translateY(-4px),
// 200ms ease-out; under prefers-reduced-motion the translateY is dropped and
// only the border-color transition remains, since `motion-safe:` scopes the
// translate utility to `@media (prefers-reduced-motion: no-preference)`.

import type { Project } from "../../lib/projects";
import { Icon } from "./Icon";

interface ProjectCardProps {
  project: Project;
  variant: "featured" | "other";
}

const ICON_LINK = "relative z-10 text-muted motion-safe:transition-colors hover:text-accent";
// Lit while the stretched card link (not one of the icon buttons, which sit
// above it) is hovered, so the button that a card click would open is the
// one that lights up.
const CARD_TARGET = "group-has-[[data-card-link]:hover]/card:text-accent";

export function ProjectCard({ project, variant }: ProjectCardProps) {
  const isFeatured = variant === "featured";
  const hasDemo = Boolean(project.demoUrl);

  return (
    <article className="group/card relative rounded-lg border border-line bg-surface p-6 transition-[border-color,transform] duration-200 ease-out hover:border-accent motion-safe:hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span aria-hidden="true" className="text-accent">
          <Icon name="folder" />
        </span>
        <div className="flex items-center gap-3">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Código de ${project.title} en GitHub`}
            className={hasDemo ? ICON_LINK : `${ICON_LINK} ${CARD_TARGET}`}
          >
            <Icon name="github" />
          </a>
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Demo de ${project.title}`}
              className={`${ICON_LINK} ${CARD_TARGET}`}
            >
              <Icon name="external" />
            </a>
          ) : null}
        </div>
      </div>

      {isFeatured ? (
        <p className="mt-4 text-xs uppercase tracking-wide text-accent">
          Proyecto destacado
        </p>
      ) : null}

      <h3 className="mt-2 font-heading text-lg font-bold text-primary">
        {/* Stretched link: ::after covers the whole card, so a click anywhere
            opens the demo (or the repo when there is none). The icon buttons
            above sit on z-10 so they keep their own targets. */}
        <a
          href={project.demoUrl || project.repoUrl}
          target="_blank"
          rel="noreferrer"
          data-card-link
          className="after:absolute after:inset-0 after:content-['']"
        >
          {project.title}
        </a>
      </h3>
      <p className="mt-3 text-sm text-muted">{project.description}</p>

      {project.stack.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
