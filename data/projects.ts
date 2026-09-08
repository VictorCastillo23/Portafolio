// Curation / allow-list layer for the Projects section.
//
// This is layer 2 of the 3-layer project data model (see lib/projects.ts,
// Phase 3): data/content.ts (CV copy) + data/projects.ts (this file, human
// curation — ALWAYS wins on conflicts) + data/github-repos.json (machine
// snapshot). A repo absent from PROJECT_CURATION is excluded from the
// rendered site entirely — this is how `omegaup` is excluded, even though it
// exists on the live GitHub account.

export interface ProjectCuration {
  /** Exact GitHub repo name — the join key against data/github-repos.json. */
  repo: string;
  tier: "featured" | "other";
  /** Display order within its tier (ascending). */
  order: number;
  /** Display title, e.g. "Es Vitrina" instead of the raw repo name. */
  title: string;
  /** Overrides the GitHub snapshot description when present. */
  description?: string;
  /** Overrides the snapshot's derived stack (language + topics) wholesale. */
  stack?: string[];
  demoUrl?: string | null;
}

export const PROJECT_CURATION: readonly ProjectCuration[] = [
  {
    repo: "Es_Vitrina",
    tier: "featured",
    order: 1,
    title: "Es Vitrina",
    description:
      "Plataforma de portafolio digital académico y artístico para jóvenes. Full stack con Next.js, React y TypeScript sobre PostgreSQL (Supabase). Open source y en operación.",
    // GitHub returns no topics for this repo; the real stack (from the CV's
    // own "Stack:" line) is spelled out explicitly here to match the
    // approved wireframe instead of falling back to just "TypeScript".
    stack: ["TypeScript", "Next.js", "React", "PostgreSQL", "REST API"],
  },
  {
    repo: "CameraChatbot",
    tier: "featured",
    order: 2,
    title: "CameraChatbot",
    description:
      "Proyecto en Python que aplica un pipeline de video en tiempo real desarrollado durante mi rol como Computer Vision Engineer en Emerald Digital: transforma transmisiones en vivo en descripciones textuales para su análisis por un chatbot, identificando objetos, personas y eventos mediante IA aplicada.",
  },
  {
    repo: "Modulo-inventario",
    tier: "other",
    order: 1,
    title: "Módulo de Inventario",
    description:
      "Módulo de gestión de inventario desarrollado en Java. Consulta el repositorio para el detalle de las funcionalidades implementadas.",
  },
  {
    repo: "Risk-Game",
    tier: "other",
    order: 2,
    title: "Risk Game",
    // No description override — GitHub's own live description ("Una copia
    // del juego RISK llevada a C#") is already correct. Leaving this
    // undefined lets the raw snapshot value flow through the merge.
  },
  {
    repo: "Tutorial-Open-CV-para-principiantes-con-Python",
    tier: "other",
    order: 3,
    title: "Tutorial OpenCV para Principiantes",
    description:
      "Serie de notebooks en Python para aprender OpenCV desde cero. Material introductorio de visión por computadora.",
  },
] as const;
