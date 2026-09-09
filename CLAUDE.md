# Portafolio

Single-page personal portfolio built with Next.js App Router.

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS v4
- Vitest + Testing Library + vitest-axe for tests
- Path alias `@/*` maps to the repo root

## Conventions

- Strict TDD: write the failing test before the implementation.
- Section order on the page is locked by `SECTION_IDS` (see `data/content.ts`) — page composition in `app/page.tsx` must follow it.
- Components are split into `components/layout` (Nav, Footer, sidebars), `components/sections` (page sections: Hero, About, Credentials, Experience, Projects, Contact), `components/ui` (shared primitives: Icon, Section, ProjectCard), and `components/chat` (the RAG chat widget: `ChatWidget`, `ChatMessage`, `useChatStream` — a self-contained, multi-file feature with its own hook, kept out of the flat single-file `components/layout` chrome).
- Project data comes from `lib/projects.ts`, which merges a local snapshot with live GitHub data fetched by `scripts/fetch-github.ts`.

## Commands

- `npm run dev` / `npm run build` / `npm run start`
- `npm test` (single run) / `npm run test:watch`
- `npm run lint`
- `npm run fetch:github` — refresh the GitHub project snapshot
- `npm run lint:content` — check for content gaps via `scripts/check-content.ts`
- `npm run build:search-index` — rebuild `data/search-index.json` for the chat widget's retrieval (see README.md)
