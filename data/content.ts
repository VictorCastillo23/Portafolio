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
  kind: "award" | "publication" | "certification" | "rutaAprendizaje";
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
    siteUrl: "https://victordevs.com",
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
    title: "Víctor Manuel Castillo Olivetto",
    tagline: "Construyo software que resuelve problemas reales.",
    blurb:
      "Ingeniero en Informática, full stack. Diseño, documento e integro APIs REST para sistemas de información, y trabajo con Java, Angular, Next.js y Python en proyectos que van de plataformas web a pipelines de visión por computadora.",
    cta: { label: "Ver mis proyectos", href: "#projects" },
  },

  about: {
    paragraphs: [
      "Ingeniero en Informática con experiencia full stack, enfocado en el diseño, documentación e integración de APIs: consumo y exposición de APIs RESTful con contratos claros y documentados (Swagger/OpenAPI), autenticación con JWT y manejo de bases de datos relacionales (SQL Server, MySQL, PostgreSQL).",
      "He trabajado con Java (JDBC, patrón MVC) y con frameworks modernos de JavaScript/TypeScript (Angular, Next.js), además de Python en proyectos de procesamiento de datos e IA, siempre bajo arquitecturas modulares, buenas prácticas de seguridad y control de versiones con Git en entornos Linux.",
      "Orientado a la resolución de problemas, la calidad del código y la innovación tecnológica. Creé EsVitrina, plataforma open source ya en operación, y he sido representante internacional de México en competencias de tecnología.",
    ],
    skills: [
      "APIs RESTful",
      "JSON",
      "Swagger/OpenAPI",
      "JWT",
      "API Gateway",
      "SQL Server",
      "MySQL",
      "PostgreSQL",
      "Java",
      "JavaScript",
      "TypeScript",
      "PHP (Laravel)",
      "C# / .NET",
      "Python",
      "Node.js",
      "Next.js",
      "Angular",
      "Angular Material",
      "Reactive Forms",
      "Responsive Design",
      "Clean Architecture",
      "Git",
      "GitHub",
      "GitLab",
      "Linux",
      "Postman",
      "Scrum",
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
      company: "Juventudes — Gobierno Estatal",
      role: "Practicante de Desarrollador de Software Full Stack",
      range: "Febrero 2026 — Actualidad",
      bullets: [
        "Desarrollo backend de servicios y APIs con Node.js, integración mediante API Gateway y ejecución de procesos en segundo plano (Background Jobs).",
        "Implementación de autenticación y autorización con JWT, validación de entradas y manejo de permisos.",
        "Implementación de buenas prácticas de seguridad: HTTPS y Secure Headers.",
        "Trabajo con SQL Server enfocado en optimización de consultas, normalización de bases de datos y mejoras de rendimiento.",
        "Migración del sistema Solicitudes de PHP a Angular + Node.js bajo arquitectura modular y principios de clean code.",
        "Desarrollo frontend con Angular Material, reactive forms, responsive design y consumo de APIs RESTful.",
        "Colaboración bajo metodología SCRUM con flujo de trabajo por Pull Requests, documentación técnica, pruebas unitarias e integración continua.",
      ],
    },
    {
      id: "emerald-digital",
      company: "Emerald Digital Inc.",
      role: "Computer Vision Engineer",
      range: "Enero – Noviembre 2025",
      bullets: [
        "Documenté especificaciones técnicas y procesos de operación del sistema.",
        "Colaboré en validación de requerimientos técnicos y soporte a equipos de desarrollo.",
        "Implementé scripts en Python para automatización y procesamiento de información.",
        "Diseñé un pipeline de multiprocesamiento de video capaz de convertir grabaciones y transmisiones en vivo en descripciones textuales de la escena en tiempo real.",
        "Identificación de objetos, personas, posiciones, eventos e interacciones mediante IA aplicada.",
        "Modelé estructuras de datos para almacenamiento y explotación analítica.",
        "Identifiqué riesgos técnicos relacionados con integridad de datos y estabilidad del sistema.",
      ],
    },
    {
      id: "corvuz",
      company: "Corvuz",
      role: "Desarrollador de Software Jr.",
      range: "Marzo – Noviembre 2025",
      bullets: [
        "Desarrollé y mantuve servicios backend utilizando PHP (Laravel) y MySQL.",
        "Ejecuté consultas SQL para extracción, validación y corrección de datos en sistemas en producción.",
        "Gestioné control de accesos, autenticación y manejo de sesiones.",
        "Participé en despliegues y mantenimiento de software en entornos Linux y Windows.",
        "Administré control de versiones y seguimiento de cambios mediante GitLab.",
        "Analicé requerimientos técnicos y documenté soluciones para desarrollo de sistemas y soporte operativo.",
        "Realicé debugging y diagnóstico de incidencias en aplicaciones backend.",
        "Implementé controles de validación y pruebas funcionales previas a despliegue en QA y producción.",
        "Colaboré en soporte a equipos internos durante liberaciones de sistema.",
      ],
    },
  ],

  credentials: [
    {
      kind: "award",
      title: "7° Lugar Internacional — Torneo Mundial WER (World Educational Robotics)",
      issuer: "World Educational Robotics — Shanghái, China",
      date: "Diciembre 2023",
      detail:
        "Después de haber obtenido el primer lugar nacional en la categoría de universidad, conseguimos el séptimo lugar a nivel internacional representando a México en Shanghái, China. Mi rol en el equipo fue el de programador; aprendí a trabajar en equipo y a desarrollar e implementar soluciones técnicas bajo presión: integración de sensores, programación y arquitectura del sistema robótico.",
      url: "https://www.wermexico.com/wer2023#comp-mg8axzbw",
    },
    {
      kind: "publication",
      title:
        "From Keyframes to Narrative: A Multi-Stage AI Pipeline for Scene Understanding Using Object Detection and Large Language Models",
      issuer:
        "24ª Conferencia Internacional Mexicana de Inteligencia Artificial (MICAI 2025) — SMIA · CIMAT · Universidad de Guanajuato",
      date: "Octubre 2025",
      detail:
        "En colaboración con Emerald Digital y el ITSPR desarrollamos un pipeline multi-etapa que combina detección de objetos con modelos de lenguaje de gran escala (LLMs) para comprensión de escenas en video, capaz de tomar una serie de videos en vivo y responder preguntas con un delay de 30 segundos.",
      url: "https://link.springer.com/chapter/10.1007/978-3-032-09044-7_23",
    },
    {
      kind: "rutaAprendizaje",
      title: "AZ-400: Desarrollo para Enterprise DevOps",
      issuer: "Microsoft Learning DevOps",
      date: "Agosto 2026",
      detail:
        "En esta ruta de aprendizaje aprendí a definir DevOps como la unión de personas, procesos y productos, además del control de código usando Git, GitHub Projects, GitHub Project Boards y Azure Boards, y también sobre cómo buscar y administrar deudas técnicas en el código, usar herramientas de calidad de código y planear revisiones de código.",
      url: "https://learn.microsoft.com/es-mx/users/vctormanuelcastilloolivetto-3812/achievements/3zpr2ebh",
    },
    {
      kind: "rutaAprendizaje",
      title: "AZ-400: Implementación de la seguridad y validación de bases de código para el cumplimiento",
      issuer: "Microsoft Learning DevOps",
      date: "Agosto 2026",
      detail:
        "En esta ruta de aprendizaje impartida por Microsoft aprendí sobre la seguridad en todo el ciclo de vida de desarrollo de software mediante prácticas de DevSecOps, a proteger las canalizaciones de CI/CD con controles de autenticación y administración de secretos, a realizar análisis de composición de software con administración de dependencias y corrección automatizada, y seguridad avanzada de GitHub.",
      url: "https://learn.microsoft.com/es-mx/users/vctormanuelcastilloolivetto-3812/achievements/3zpw7bdh",
    },
    {
      kind: "certification",
      title: "Claude with the Anthropic API",
      issuer: "Anthropic",
      date: "Julio 2026",
      detail:
        "En este curso aprendí a usar de manera completa la API de Claude, desde el uso básico hasta las arquitecturas avanzadas de agentes. Aprendí a integrar Claude en aplicaciones, implementar llamadas a herramientas, construir pipelines RAG y diseñar tanto flujos de trabajo deterministas como sistemas de agentes flexibles; estos conocimientos los usé para incluir un RAG en esta página.",
      url: "https://verify.skilljar.com/c/m24fueues7ek",
    },
    {
      kind: "certification",
      title: "Google Data Analytics — Formula preguntas para tomar decisiones basadas en datos",
      issuer: "Coursera (Google)",
      date: "Abril 2023",
      detail:
        "Aprendí a aplicar pensamiento estructurado en la resolución de problemas, utilizando datos como base para la toma de decisiones, aprendiendo a usar hojas de cálculo para ingresar y organizar información en tareas de análisis, y conectando cada paso del proceso con escenarios comunes de análisis para generar conclusiones claras.",
      url: "https://www.coursera.org/account/accomplishments/verify/UTKTSFKHBH69",
    },
  ],

  contact: {
    eyebrow: "Hola",
    title: "Hableme",
    blurb:
      "Estoy abierto a nuevas oportunidades y colaboraciones.",
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
    text: "Derechos reservados © 2026 Víctor Manuel Castillo Olivetto",
  },
};
