// Pure target selection for scripts/capture-previews.ts.
//
// Only projects with a live demo get a screenshot; the rest use GitHub's
// generated social image (see Project.previewUrl in lib/projects.ts). The file
// is derived from `previewUrl` so the script writes exactly where the card
// will read from.

import type { ProjectSections } from "./projects";

/**
 * Size of every preview image, in pixels. GitHub's social image is 1200x630,
 * so the screenshots use the same size and the card reserves a single aspect
 * ratio for both variants.
 */
export const PREVIEW_SIZE = { width: 1200, height: 630 } as const;

export interface PreviewTarget {
  repo: string;
  /** Live demo to screenshot. */
  url: string;
  /** Output path, relative to the repo root, under `public/`. */
  file: string;
}

export function previewTargets(sections: ProjectSections): PreviewTarget[] {
  return [...sections.featured, ...sections.other]
    .filter((project) => Boolean(project.demoUrl))
    .map((project) => ({
      repo: project.repo,
      url: project.demoUrl as string,
      file: `public${project.previewUrl}`,
    }));
}
