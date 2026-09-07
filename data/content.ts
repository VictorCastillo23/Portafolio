// Static CV content for the portfolio. Everything here is sourced from the
// user's own `cv_example.md` / `experiencia_profecional.md` — no invented
// functionality claims, dates, or credentials.

export type SectionId =
  | "hero"
  | "about"
  | "experience"
  | "credentials"
  | "projects"
  | "contact";

// Frozen, document order. Consumed by the scroll-spy hook (lib/useActiveSection.ts).
export const SECTION_IDS: readonly SectionId[] = [
  "hero",
  "about",
  "experience",
  "credentials",
  "projects",
  "contact",
] as const;

export interface NavItem {
  id: Exclude<SectionId, "hero">;
  index: string;
  label: string;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  url?: string;
  range: string;
  bullets: string[];
}

export interface Credential {
  kind: "award" | "publication" | "certification";
  title: string;
  issuer: string;
  date: string;
  detail?: string;
  url?: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: "github" | "linkedin" | "mail";
}

export interface SiteContent {
  meta: {
    name: string;
    role: string;
    siteUrl: string;
    description: string;
  };
  nav: readonly NavItem[];
  hero: {
    eyebrow: string;
    title: string;
    tagline: string;
    blurb: string;
    cta: { label: string; href: string };
  };
  about: {
    paragraphs: string[];
    skills: string[];
    education: {
      degree: string;
      school: string;
      range: string;
      detail: string;
    };
  };
  // Chronological DESC; index 0 (Juventudes) is the default Experience tab.
  experience: readonly Job[];
  credentials: readonly Credential[];
  contact: {
    eyebrow: string;
    title: string;
    blurb: string;
    email: string;
    phone: string;
  };
  socials: readonly SocialLink[];
  footer: { text: string };
}

export const content: SiteContent = {
  meta: {
    name: "Víctor Castillo",
    role: "Desarrollador Full Stack",
    // TODO: replace with the real production domain once deployed (Phase 7, task 7.3).
    siteUrl: "https://victor-castillo-portfolio.vercel.app",
    description:
      "Portafolio de Víctor Castillo, Ingeniero en Informática y desarrollador full stack especializado en Next.js, Angular y Python.",
  },

  nav: [
    { id: "about", index: "01.", label: "Sobre mí" },
    { id: "experience", index: "02.", label: "Experiencia" },
    { id: "credentials", index: "03.", label: "Credenciales" },
    { id: "projects", index: "04.", label: "Proyectos" },
    { id: "contact", index: "05.", label: "Contacto" },
  ],

  hero: {
    eyebrow: "Hola, soy",
    title: "Víctor Castillo.",
    tagline: "Construyo software que resuelve problemas reales.",
    blurb:
      "Ingeniero en Informática, full stack. Trabajo con Angular, Next.js y Python en proyectos que van de plataformas web a pipelines de visión por computadora.",
    cta: { label: "Ver mis proyectos", href: "#projects" },
  },

  about: {
    paragraphs: [
      "Ingeniero en Informática con experiencia full stack en desarrollo Front-end y Back-end, diseño y consumo de APIs RESTful, y manejo de bases de datos relacionales (SQL Server, MySQL, PostgreSQL).",
      "He trabajado con frameworks modernos de JavaScript/TypeScript (Angular, Next.js) y con Python en proyectos de procesamiento de datos e IA, siempre bajo arquitecturas modulares, buenas prácticas de seguridad y control de versiones con Git.",
      "Orientado a la resolución de problemas, la calidad del código y la innovación tecnológica. Creé EsVitrina, plataforma open source ya en operación, y he sido representante internacional de México en competencias de tecnología.",
    ],
    skills: [
      "Python",
      "JavaScript",
      "TypeScript",
      "PHP (Laravel)",
      "Java",
      "C# / .NET",
      "Node.js",
      "Next.js",
      "Angular",
      "Angular Material",
      "Reactive Forms",
      "Responsive Design",
      "APIs RESTful",
      "JWT",
      "API Gateway",
      "Clean Architecture",
      "SQL Server",
      "MySQL",
      "PostgreSQL (Supabase)",
      "Git",
      "GitHub",
      "GitLab",
      "Docker",
      "Linux",
      "Scrum",
      "OpenCV",
      "Computer Vision",
      "LLMs",
    ],
    education: {
      degree: "Ingeniería en Informática",
      school: "TecNM Campus Purísima del Rincón",
      range: "Agosto 2021 – Diciembre 2025",
      detail:
        "Especialidad: Desarrollo y Gestión de Sistemas Inteligentes. Proyecto de titulación: aplicación móvil MAIA (metodología Feature-Driven Development).",
    },
  },

  experience: [
    {
      id: "juventudes",
      company: "Juventudes — Gobierno Municipal",
      role: "Desarrollador de Software",
      range: "Mayo 2026 — Actualidad",
      bullets: [
        "Migración del sistema Solicitudes de PHP a Angular + Node.js bajo arquitectura modular y principios de clean code.",
        "Desarrollo frontend con Angular Material, reactive forms, responsive design y consumo de APIs RESTful.",
        "Implementación de autenticación y autorización con JWT, validación de entradas y manejo de permisos.",
        "Desarrollo backend de servicios y APIs con Node.js, integración mediante API Gateway y ejecución de procesos en segundo plano (Background Jobs).",
        "Trabajo con SQL Server enfocado en optimización de consultas, normalización de bases de datos y mejoras de rendimiento.",
        "Colaboración bajo metodología SCRUM con flujo de trabajo por Pull Requests, documentación técnica, pruebas unitarias e integración continua.",
        "Implementación de buenas prácticas de seguridad: HTTPS y Secure Headers.",
      ],
    },
    {
      id: "emerald-digital",
      company: "Emerald Digital Inc.",
      role: "Computer Vision Engineer",
      range: "Enero – Noviembre 2025",
      bullets: [
        "Diseñé un pipeline de multiprocesamiento de video capaz de convertir grabaciones y transmisiones en vivo en descripciones textuales de la escena en tiempo real.",
        "Identificación de objetos, personas, posiciones, eventos e interacciones mediante IA aplicada.",
        "Implementé scripts en Python para automatización y procesamiento de información.",
        "Modelé estructuras de datos para almacenamiento y explotación analítica.",
        "Documenté especificaciones técnicas y procesos de operación del sistema.",
        "Identifiqué riesgos técnicos relacionados con integridad de datos y estabilidad del sistema.",
        "Colaboré en validación de requerimientos técnicos y soporte a equipos de desarrollo.",
      ],
    },
    {
      id: "corvuz",
      company: "Corvuz",
      role: "Desarrollador de Software Jr.",
      range: "Marzo – Noviembre 2025",
      bullets: [
        "Analicé requerimientos técnicos y documenté soluciones para desarrollo de sistemas y soporte operativo.",
        "Desarrollé y mantuve servicios backend utilizando PHP (Laravel) y MySQL.",
        "Ejecuté consultas SQL para extracción, validación y corrección de datos en sistemas en producción.",
        "Realicé debugging y diagnóstico de incidencias en aplicaciones backend.",
        "Implementé controles de validación y pruebas funcionales previas a despliegue en QA y producción.",
        "Gestioné control de accesos, autenticación y manejo de sesiones.",
        "Participé en despliegues y mantenimiento de software en entornos Linux y Windows.",
        "Colaboré en soporte a equipos internos durante liberaciones de sistema.",
        "Administré control de versiones y seguimiento de cambios mediante GitLab.",
      ],
    },
  ],

  // Rendered in their own dedicated Credentials section (#credentials),
  // separate from About/Hero, per design.
  credentials: [
    {
      kind: "award",
      title: "2° Lugar Internacional — Torneo Mundial WER (World Educational Robotics)",
      issuer: "World Educational Robotics — Shanghái, China",
      date: "Diciembre 2023",
      detail:
        "Categoría Universidad, representando a México. Segundo lugar internacional tras obtener el primer lugar a nivel nacional.",
    },
    {
      kind: "publication",
      title:
        "From Keyframes to Narrative: A Multi-Stage AI Pipeline for Scene Understanding Using Object Detection and Large Language Models",
      issuer:
        "24ª Conferencia Internacional Mexicana de Inteligencia Artificial (MICAI 2025) — SMIA · CIMAT · Universidad de Guanajuato",
      date: "2025",
      detail:
        "Propone un pipeline multi-etapa que combina detección de objetos con modelos de lenguaje de gran escala (LLMs) para comprensión de escenas en video.",
    },
    {
      kind: "certification",
      title: "Claude with the Anthropic API",
      issuer: "Anthropic",
      date: "2026",
    },
    {
      kind: "certification",
      title: "Google Data Analytics — Preparar datos para la exploración",
      issuer: "Coursera (Google)",
      date: "Abril 2023",
      detail: "Credential ID: FQLCKGNHZ2DV",
    },
    {
      kind: "certification",
      title: "Google Data Analytics — Aspectos básicos: Datos en todas partes",
      issuer: "Coursera (Google)",
      date: "Noviembre 2022",
      detail: "Credential ID: H4GQR4BLY5WC",
    },
  ],

  contact: {
    eyebrow: "¿Qué sigue?",
    title: "Hablemos",
    blurb:
      "Estoy abierto a nuevas oportunidades y colaboraciones. Escríbeme y con gusto platicamos.",
    email: "dev.victor.olivetto23@gmail.com",
    phone: "476 737 7263",
  },

  socials: [
    {
      name: "GitHub",
      url: "https://github.com/VictorCastillo23",
      icon: "github",
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/dev-victor-castillo-olivetto",
      icon: "linkedin",
    },
  ],

  footer: {
    text: "Diseñado y construido por Víctor Castillo Olivetto — Next.js, TypeScript y Tailwind CSS.",
  },
};
