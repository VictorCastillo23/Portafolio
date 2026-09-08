// Projects section — one `#projects` section holding both tiers as labelled
// subsections (design Part 1.6). Calls `mergeProjects` (lib/projects.ts,
// strict-TDD, Phase 3) against the real committed snapshot; the allow-list
// join is what keeps `omegaup` off the site even though it exists on the
// live GitHub account.

import rawSnapshot from "../../data/github-repos.json";
import { content } from "../../data/content";
import { PROJECT_CURATION } from "../../data/projects";
import { mergeProjects, parseSnapshot } from "../../lib/projects";
import { Section } from "../ui/Section";
import { ProjectCard } from "../ui/ProjectCard";

export function Projects() {
  const navItem = content.nav.find((item) => item.id === "projects")!;
  const snapshot = parseSnapshot(rawSnapshot);
  const { featured, other } = mergeProjects(PROJECT_CURATION, snapshot);

  return (
    <Section id="projects" index={navItem.index} title={navItem.label}>
      <div>
        <h3 className="font-mono text-sm uppercase tracking-wide text-muted">Destacados</h3>
        <div className="mt-4 grid gap-6">
          {featured.map((project) => (
            <ProjectCard key={project.repo} project={project} variant="featured" />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h3 className="font-mono text-sm uppercase tracking-wide text-muted">Otros proyectos</h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {other.map((project) => (
            <ProjectCard key={project.repo} project={project} variant="other" />
          ))}
        </div>
      </div>
    </Section>
  );
}
