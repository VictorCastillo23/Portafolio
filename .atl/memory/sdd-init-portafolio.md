---
obs_id: 188
type: architecture
topic_key: sdd-init/portafolio
created_at: 2026-09-07 16:55:48
---

# sdd-init/portafolio

**What**: SDD initialized for `portafolio` — a greenfield repo, no app code or package.json yet.

**Stack (planned, not yet scaffolded)**:
- Next.js 14+, App Router, TypeScript
- Tailwind CSS (no styled-components)
- Single-page scroll portfolio (nav, hero, about, experience w/ tabs, featured projects, other projects grid, contact, social/email sidebars)
- No backend; static data in `data/content.ts`; project cards sourced from GitHub public API (`api.github.com/users/VictorCastillo23/repos`) at build time or cached JSON
- SEO via App Router metadata API; accessibility (focus visible, alt text, prefers-reduced-motion respected)
- Deploy target: Vercel

**Source-of-truth files at repo root**:
- `prompt.md` — full build brief/spec for the app (design references bchiang7/v4 for structure only, not a clone)
- `experiencia_profecional.md`, `cv_example.md` — personal CV/experience content to seed the data file
- `README.md` — empty template, not yet written

**Repo state**: git initialized, branch `main`, 1 commit ("first commit"). No CI, no lint/test config, no `openspec/` directory.

**Persistence mode**: engram (per user preference). No `openspec/` created, per Hard Rules for engram mode.

**Strict TDD Mode**: enabled (marker found in active agent config — "Strict TDD Mode: enabled"). No test runner exists yet since there is no scaffolded app; once Next.js is bootstrapped, a runner (Vitest + Testing Library, and/or Playwright for E2E) must be added to support Strict TDD before implementation work begins.

**Where**: repo root `C:/proyectos/Portafolio` — `prompt.md`, `experiencia_profecional.md`, `cv_example.md`, `.atl/skill-registry.md`.

**Learned**: `.atl/skill-registry.md` already existed and was freshly generated today (2026-09-07) with only user-level skills (no project-level skill dirs or convention files found) — treated as current, not regenerated.

**Next steps**: run `sdd-explore` or `sdd-new` to scope the first change (likely: Next.js scaffold + design system + data layer + GitHub API integration), since there is no existing architecture to explore beyond the brief.
