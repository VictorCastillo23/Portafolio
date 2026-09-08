---
obs_id: 196
type: architecture
topic_key: sdd/portfolio-nextjs-app/apply-progress
created_at: 2026-09-07 17:43:48
---

# sdd/portfolio-nextjs-app/apply-progress

# Apply Progress: Portfolio Next.js App (portfolio-nextjs-app)

**Status**: Implementation COMPLETE (Phases 1-8, all 9 branches). Not pushed, no PRs opened. Next: sdd-verify / judgment-day (user paused here for manual review before that).

## Branch chain (feature-branch-chain), each with tip commit
| # | Branch | Tip | Content |
|---|---|---|---|
| — | `feat/portfolio-nextjs-app` (tracker) | `c6b1f56` | pure integration point, no commits of its own |
| 1 | `feat/portfolio-nextjs-app-01-scaffold` | `db7e6ef` | Next.js 16 App Router + TS, Tailwind v4 tokens/fonts, Vitest/RTL/vitest-axe tooling |
| 2 | `feat/portfolio-nextjs-app-02-data-layer` | `ec9dc71` | data/content.ts, data/projects.ts, data/github-repos.json, scripts/fetch-github.ts |
| 3 | `feat/portfolio-nextjs-app-03-lib` | `c675ee6` | lib/projects.ts (parseSnapshot/mergeProjects/findContentGaps) — Strict TDD, 29/29 tests. 676-line diff (over budget alone). |
| 4 | `feat/portfolio-nextjs-app-04-scroll-spy` | `4d44a60` | lib/useActiveSection.ts — Strict TDD, 8/8 tests. 203-line diff. |
| 5 | `feat/portfolio-nextjs-app-05-layout-shell` | `0381ff9` | Icon, Section, Nav, SocialSidebar, EmailSidebar, Footer. 667-line diff (over budget alone). |
| 6a | `feat/portfolio-nextjs-app-06-content-a` | `2329bcc` | Hero, About, Credentials, Experience (ARIA tabs). 379-line diff. |
| 6b | `feat/portfolio-nextjs-app-06-content-b` | `fa29621` | ProjectCard, Projects, Contact. 254-line diff. |
| 7 | `feat/portfolio-nextjs-app-07-app-wiring` | `3fbc786` | app/page.tsx composition, app/layout.tsx SEO metadata, app/page.test.tsx. 104-line diff. **Final tip.** |

## Locked decisions (all applied)
- omegaup excluded (enforced at both fetch-time in scripts/fetch-github.ts AND at merge-time in lib/projects.ts — proven by tests with a synthetic omegaup fixture).
- Featured: Es_Vitrina, CameraChatbot. Other: Modulo-inventario, Risk-Game, Tutorial-Open-CV-para-principiantes-con-Python.
- Risk-Game description: no override, GitHub's own live description used (C# implementation).
- CameraChatbot description: enriched with Emerald Digital Computer Vision Engineer context (grounded in experiencia_profecional.md).
- Credentials (WER 2023 2nd place intl + MICAI 2025 publication): own dedicated section.
- Experience: Juventudes tab first/default, chronological descending.
- Contact: mailto only, email + GitHub + LinkedIn + phone (476 737 7263), no form/backend.
- Site copy: Spanish only, no i18n.
- GitHub data: committed JSON snapshot via `npm run fetch:github`, not fetched at build/runtime (avoids Next.js 15+ fetch-cache-default-flip + 60req/hr unauthenticated rate limit).
- Palette: ink #14101B / surface #1E1828 / line #3A3350 / text #EDE7F2 / muted #A79FB4 / accent #FFB35C (AAA contrast, diverges from v4's navy/mint).
- Typography: Manrope + JetBrains Mono via next/font/google.
- Section IDs (locked, in order): hero, about, experience, credentials, projects, contact.
- Breakpoints: hamburger nav at 768px (md), fixed sidebars at 1280px (xl).
- Single orchestrated hero entrance animation only (CSS `riseIn` keyframe, staggered, scoped inside `prefers-reduced-motion: no-preference`); everywhere else is hover-only (ProjectCard border+translateY, motion-safe gated).
- Strict TDD scoped to lib/projects.ts + lib/useActiveSection.ts only; all presentational components use render/a11y smoke tests (RTL + custom `expectNoA11yViolations` axe helper in vitest.setup.ts — see gotcha below).

## Verification (final, at PR7 tip)
- `npm run test`: 85/85 passing (16 test files)
- `npx tsc --noEmit`: clean
- `npm run lint`: clean
- `npm run build`: succeeds, static generation confirmed
- `npm run dev` + manual curl check: all 6 section ids present in document order, nav anchors correct, responsive breakpoint classes present
- 0 axe violations across every component

## Known gotcha for future batches
`vitest-axe@0.1.0` + Vitest 5 have a type-augmentation conflict (`expect(...).toHaveNoViolations()` doesn't type-check under this project's Vitest 5 + skipLibCheck). Fixed via a typed `expectNoA11yViolations(container)` helper in `vitest.setup.ts` that calls the matcher function directly. Reuse this helper for any future test — do not reintroduce `expect(await axe(x)).toHaveNoViolations()`.

## Open items (non-blocking, flagged for later)
1. `content.meta.siteUrl` is a placeholder (`https://victor-castillo-portfolio.vercel.app`, TODO comment in data/content.ts) — replace once a real domain exists, it feeds `metadataBase` and `og:url`.
2. No `og:image` asset exists — omitted from metadata per design's documented fallback (Next.js degrades gracefully without one). Add later once an OG image is designed.

## Next recommended
`sdd-verify` (spec/design conformance) then `judgment-day` (adversarial dual review) before any push/PR — user explicitly paused here to review the code manually first.

## Session note
This apply-progress record was manually reconciled and re-persisted via the `engram` CLI directly (bypassing the MCP plugin, which was disconnected for the session that ran PR6b/PR7) — content merges the live PR1-PR5 history already in Engram with the PR6a/PR6b/PR7 results reported back to the orchestrator in-conversation, since those batches could not self-persist.
