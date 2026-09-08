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

export function ProjectCard({ project, variant }: ProjectCardProps) {
  const isFeatured = variant === "featured";

  return (
    <article className="rounded-lg border border-line bg-surface p-6 transition-[border-color,transform] duration-200 ease-out hover:border-accent motion-safe:hover:-translate-y-1">
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
            className="text-muted motion-safe:transition-colors hover:text-accent"
          >
            <Icon name="code" />
          </a>
          {project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Demo de ${project.title}`}
              className="text-muted motion-safe:transition-colors hover:text-accent"
            >
              <Icon name="external" />
            </a>
          ) : null}
        </div>
      </div>

      {isFeatured ? (
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-accent">
          Proyecto destacado
        </p>
      ) : null}

      <h3 className="mt-2 font-sans text-lg font-bold text-text">{project.title}</h3>
      <p className="mt-3 text-sm text-muted">{project.description}</p>

      {project.stack.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2 font-mono text-xs text-muted">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
