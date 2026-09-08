# Portafolio

Hola, mucho gusto. Este es mi portafolio profesional de una sola página
construido con Next.js App Router, que tiene el contenido de mi CV y mis
proyectos de GitHub 

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (tokens `@theme` CSS-first, sin `tailwind.config.ts`)
- Vitest, Testing Library y vitest-axe para testing

## Datos del proyecto

Tres capas tipadas y versionadas se combinan por nombre de repositorio en tiempo
de build — no se hacen llamadas en vivo a GitHub durante `next build`:

1. `data/content.ts` — contenido estático del CV (nav, hero, about, experience, credentials, contact)
2. `data/projects.ts` — lista de curaduría; gana ante cualquier conflicto con el snapshot
3. `data/github-repos.json` — snapshot versionado de la API de GitHub, actualizado manualmente
