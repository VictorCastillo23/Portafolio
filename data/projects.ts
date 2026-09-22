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
    repo: "Modulo-inventario",
    tier: "featured",
    order: 1,
    title: "Módulo de Inventario",
    description:
      "Aplicación web de gestión de inventario para almacenes: alta y baja de productos, entradas y salidas de stock, histórico de movimientos y permisos diferenciados por rol (Administrador / Almacenista). Arquitectura MVC en Java con Jakarta EE 10, Servlets/JSP y JDBC puro sobre MySQL, desplegable en Tomcat.",
    stack: ["Java", "Jakarta EE", "JSP", "JDBC", "MySQL", "Maven"],
    demoUrl: "https://modulo-inventario-app.azurewebsites.net/",
  },
  {
    repo: "Es_Vitrina",
    tier: "featured",
    order: 2,
    title: "Es Vitrina",
    description:
      "Plataforma donde jóvenes publican y recomiendan obras académicas y artísticas organizadas por disciplina, con comentarios, likes y revistas mensuales. Full stack con Next.js 16, React 19 y TypeScript sobre Supabase (PostgreSQL, Auth, Storage), con seguridad basada en RLS y RPC en lugar de lógica en el servidor Next.",
    stack: ["TypeScript", "Next.js", "React", "PostgreSQL", "REST API"],
    demoUrl: "https://esvitrina.com",
  },
  {
    repo: "Risk-Game",
    tier: "other",
    order: 1,
    title: "Risk Game",
    description:
      "Implementación completa y jugable del juego de mesa RISK como app web: motor de reglas propio separado de la interfaz jugable en Blazor Server. Preparada para sumar un jugador de IA. Desplegada en Azure App Service.",
    stack: ["C#", ".NET 8", "Blazor Server"],
    demoUrl: "https://risk-game-bghugbfnhfhjhmh0.mexicocentral-01.azurewebsites.net/",
  },
  {
    repo: "Keyseer",
    tier: "other",
    order: 2,
    title: "Keyseer",
    description:
      "Algoritmo para detección de keyframes en video por consolidación de componentes en un modelo de mezcla gaussiana online (MOG2). el objetivo es usar un algorito para obtener los key frames de un video con camara fija, no listo para producción.",
    stack: ["Python", "NumPy"],
  },
  {
    repo: "Tutorial-Open-CV-para-principiantes-con-Python",
    tier: "other",
    order: 3,
    title: "Tutorial OpenCV para Principiantes",
    description:
      "Repositorio educativo de visión por computadora con Python y OpenCV: 11 módulos progresivos que cubren manipulación de imágenes, filtros, detección de características, tracking, segmentación, detección de objetos con deep learning (YOLOv4-tiny), más un proyecto de reconocimiento facial.",
    stack: ["Python", "OpenCV", "NumPy"],
  },
] as const;