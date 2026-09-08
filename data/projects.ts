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
      "Plataforma donde jóvenes publican y recomiendan obras académicas y artísticas (investigaciones, ilustraciones, poesía, proyectos) organizadas por disciplina, con comentarios, likes y revistas temáticas mensuales curadas por administradores. Full stack con Next.js 16, React 19 y TypeScript sobre Supabase (PostgreSQL, Auth, Storage), con seguridad basada en RLS y RPC en lugar de lógica en el servidor Next. Desplegado en producción en esvitrina.com.",
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
    // Based on the CV's Emerald Digital work but not the same project —
    // per explicit user instruction, no cross-reference between the two.
    // Description grounded directly in the repo's own CLAUDE.md/docs, not
    // the CV bullet points.
    description:
      "Pipeline de visión por computadora en Python: detecta personas en video, les asigna una identidad persistente entre frames y videos mediante re-identificación (YOLO + embeddings mediante FAISS), y agrega pose, atención facial, gestos y atributos como emoción y edad sobre cada detección. Persiste los resultados en PostgreSQL para su explotación analítica.",
    stack: ["Python", "YOLO", "PostgreSQL"],
  },
  {
    repo: "Modulo-inventario",
    tier: "other",
    order: 1,
    title: "Módulo de Inventario",
    description:
      "Aplicación web de gestión de inventario para almacenes: alta y baja de productos, entradas y salidas de stock, histórico de movimientos y permisos diferenciados por rol (Administrador / Almacenista). Arquitectura MVC en Java con Jakarta EE 10, Servlets/JSP y JDBC puro sobre MySQL, desplegable en Tomcat.",
    stack: ["Java", "Jakarta EE", "JSP", "MySQL", "Maven"],
  },
  {
    repo: "Risk-Game",
    tier: "other",
    order: 2,
    title: "Risk Game",
    // GitHub's own description ("Una copia del juego RISK llevada a C#") was
    // technically accurate but told none of the real story; overridden with
    // detail from the repo's own README (Risk.Domain/Risk.Engine/Risk.Web
    // split, deployment target) since GitHub's API never exposes README body
    // content — only the one-line description/language/topics fields.
    description:
      "Implementación completa y jugable del juego de mesa RISK como app web: motor de reglas propio (mapa clásico de 42 territorios, combate, refuerzos, cartas, fases de turno) separado de la interfaz jugable en Blazor Server, con tablero SVG de grilla hexagonal. Preparada para sumar un jugador de IA sin acceso a información oculta. Desplegada en Azure App Service.",
    stack: ["C#", ".NET 8", "Blazor Server"],
    demoUrl: "https://risk-game-bghugbfnhfhjhmh0.mexicocentral-01.azurewebsites.net/",
  },
  {
    repo: "Tutorial-Open-CV-para-principiantes-con-Python",
    tier: "other",
    order: 3,
    title: "Tutorial OpenCV para Principiantes",
    description:
      "Repositorio educativo de visión por computadora con Python y OpenCV: 11 módulos progresivos que cubren manipulación de imágenes, filtros, detección de características (ORB/SIFT), tracking, segmentación (Watershed/GrabCut), detección de objetos con deep learning (YOLOv4-tiny) y OCR con Tesseract, más un proyecto capstone de reconocimiento facial.",
    stack: ["Python", "OpenCV", "NumPy"],
  },
] as const;
