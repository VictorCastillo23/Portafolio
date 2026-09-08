---
obs_id: 195
type: architecture
topic_key: sdd/portfolio-nextjs-app/tasks
created_at: 2026-09-07 17:22:08
---

# sdd/portfolio-nextjs-app/tasks

# Tasks: Portfolio Next.js App (portfolio-nextjs-app)

Updated below with `[x]` marks placed on completed Phase 2, Phase 3, Phase 4, and Phase 5 tasks. Full original content preserved, only checkbox states changed. PR numbering in Suggested Work Units re-split twice: once for Phase 3/Phase 4 (documented in the Phase 4 apply batch), and again in this batch for Phase 5/Phase 6 — see notes below.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 1500-3000+ (greenfield: scaffold + ~14 components + 3 data files + 2 TDD lib files w/ tests + 2 scripts + app wiring) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 -> PR2 -> PR3 -> PR4 -> PR5 -> PR6 -> PR7 (see Work Units; renumbered twice below — first after the PR3/PR4 split, then again after the PR5/PR6 split) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain (tracker: `feat/portfolio-nextjs-app`) |

Decision needed before apply: No (resolved — auto-chain / feature-branch-chain)
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Scaffold + tokens/fonts + test tooling (Phase 1) | PR 1 | Base: tracker `feat/portfolio-nextjs-app`. **DONE** — branch `feat/portfolio-nextjs-app-01-scaffold` |
| 2 | Data layer: content.ts, projects.ts, snapshot, fetch script (Phase 2) | PR 2 | Base: PR1 branch. **DONE** — branch `feat/portfolio-nextjs-app-02-data-layer` |
| 3 | lib/projects.ts TDD (Phase 3 only) | PR 3 | Base: PR2. **DONE** — branch `feat/portfolio-nextjs-app-03-lib`, 676 changed lines (already at budget alone — this is why it was split from Phase 4 below) |
| 4 | lib/useActiveSection.ts TDD (Phase 4 only) | PR 4 | Base: PR3. **DONE** — branch `feat/portfolio-nextjs-app-04-scroll-spy`, 203 changed lines. **Re-split from the original combined "PR3 (Phase 3-4)" unit** — Phase 3 alone already exceeded the 400-line budget, so the orchestrator moved Phase 4 into its own PR per auto-chain delivery strategy. Originally labelled Phase 3-4/PR3 in earlier revisions of this artifact. |
| 5 | Layout shell components ONLY (Phase 5 only) | PR 5 | Base: PR4. **DONE** — branch `feat/portfolio-nextjs-app-05-layout-shell`, 667 changed lines (already over the 400-line budget alone). **Re-split from the original combined "PR 5 (Phase 5-6)" unit** — Layout Shell alone (Icon, Section, Nav, SocialSidebar, EmailSidebar, Footer + their render/a11y tests) already exceeded budget, so per the orchestrator's explicit per-batch scoping instruction ("implement ONLY Phase 5... do NOT wire into app/page.tsx yet") Phase 6 lands on its own PR instead. Mirrors the Phase 3/4 re-split exactly. |
| 6 | Content Section components (Phase 6 only) | PR 6 | Base: PR5. (Was folded into "PR 5 (Phase 5-6)" before this batch's re-split — renumbered.) |
| 7 | App Router wiring + verification/a11y/README (Phase 7-8) | PR 7 | Base: PR6. (Was "PR 6" before the Phase 5/6 re-split — renumbered a second time.) |

## Phase 1: Scaffold & Foundation
- [x] 1.1 `create-next-app` (TS, App Router, ESLint, Tailwind); verify v4 CSS-first `@theme` in `app/globals.css`, else fall back to `tailwind.config.ts`.
- [x] 1.2 `app/globals.css`: `@theme` tokens (ink/surface/line/text/muted/accent), `riseIn` keyframe inside `prefers-reduced-motion: no-preference`, `scroll-margin-top`.
- [x] 1.3 Wire Manrope + JetBrains Mono via `next/font/google` in `app/layout.tsx` as `--font-sans`/`--font-mono`.
- [x] 1.4 Add Vitest + jsdom + RTL + vitest-axe, `vitest.config.ts`, `vitest.setup.ts` (IntersectionObserver mock), npm scripts `test`/`fetch:github`/`lint:content`.

## Phase 2: Data Layer
- [x] 2.1 `data/content.ts` (SiteContent type+values): nav, hero, about, experience (Juventudes/Emerald Digital/Corvuz order), credentials (WER 2023, MICAI 2025), contact (email + phone "476 737 7263" + GitHub + LinkedIn), footer — sourced from cv_example.md/experiencia_profecional.md.
- [x] 2.2 `data/projects.ts` PROJECT_CURATION (5): featured = Es_Vitrina, CameraChatbot (enriched Emerald Digital description); other = Modulo-inventario, Risk-Game (no override), Tutorial-Open-CV.
- [x] 2.3 `scripts/fetch-github.ts` — REST fetch, filter to curation names, write `data/github-repos.json`, fail-closed on non-2xx.
- [x] 2.4 Run script, commit initial `data/github-repos.json` snapshot.

## Phase 3: lib/projects.ts (Strict TDD)
- [x] 3.1 RED: failing tests for `parseSnapshot` (valid/malformed fixtures).
- [x] 3.2 GREEN: implement `parseSnapshot` type guard.
- [x] 3.3 RED: failing tests for `mergeProjects` 8 invariants (allow-list, fallback URL, case-insensitive join, description/stack/demoUrl precedence, sort, purity).
- [x] 3.4 GREEN+REFACTOR: implement `mergeProjects` per Part 5 contract.
- [x] 3.5 RED->GREEN: `findContentGaps` tests + implementation; add `scripts/check-content.ts` (`npm run lint:content`).
- [x] 3.6 Contract test: real `data/github-repos.json` passes `parseSnapshot`.

## Phase 4: lib/useActiveSection.ts (Strict TDD)
- [x] 4.1 RED: failing tests for 7 hook invariants (null-initial, single/multi intersecting, empty-retains-last, unmount disconnect, missing-id skip, SSR guard) via `renderHook` + mocked `IntersectionObserver`.
- [x] 4.2 GREEN: implement `useActiveSection` (single observer, `rootMargin:'-45% 0px -50% 0px'`, Map tracking, first-in-order id).
- [x] 4.3 REFACTOR; verify against frozen `SECTION_IDS`.

## Phase 5: Layout Shell
- [x] 5.1 `components/ui/Icon.tsx` + `components/ui/Section.tsx`.
- [x] 5.2 `components/layout/Nav.tsx` (client: hamburger, `useActiveSection`, scrolled backdrop) from `data/content.ts` nav.
- [x] 5.3 `components/layout/SocialSidebar.tsx`, `EmailSidebar.tsx` (fixed, `xl:` only), `Footer.tsx` (`xl:hidden` fallback).

## Phase 6: Content Sections
- [ ] 6.1 `components/sections/Hero.tsx` (server, CSS-only staggered entrance).
- [ ] 6.2 `components/sections/About.tsx` + `components/sections/Credentials.tsx` (standalone, WER 2023 + MICAI 2025).
- [ ] 6.3 `components/sections/Experience.tsx` (client: ARIA tablist, roving tabindex, arrow keys, Juventudes default).
- [ ] 6.4 `components/ui/ProjectCard.tsx` (variant prop, sole hover-transition owner) + `components/sections/Projects.tsx` (calls `mergeProjects`, Destacados/Otros under one `#projects`).
- [ ] 6.5 `components/sections/Contact.tsx` — mailto CTA + GitHub/LinkedIn + phone "476 737 7263", no `<form>`.

## Phase 7: App Router Wiring
- [ ] 7.1 `app/layout.tsx` — `lang="es"`, fonts, `metadata`/`viewport`, compose Nav+sidebars+Footer.
- [ ] 7.2 `app/page.tsx` — assemble sections in locked order; `app/opengraph-image.tsx` via `next/og`.
- [ ] 7.3 Set `content.meta.siteUrl` placeholder; TODO note to update at deploy.

## Phase 8: Verification
- [ ] 8.1 Smoke-render tests per section from real `data/content.ts` (no empty headings/"undefined").
- [ ] 8.2 Guard tests: `omegaup` absent from Projects output; Contact has `mailto:` + phone text + no `<form>`.
- [ ] 8.3 `vitest-axe` a11y pass on assembled `page.tsx` output.
- [ ] 8.4 Manual checklist (README): keyboard focus, hamburger, scroll-spy highlight, reduced-motion, breakpoints sm/md/lg/xl; document `npm run dev/build/test/fetch:github/lint:content`.

## Amendments Baked In
1. CameraChatbot description (2.2, 6.4/6.5 via Projects) = enriched Emerald Digital Computer Vision Engineer pipeline text, not the generic draft. **Applied in 2.2.**
2. Phone "476 737 7263" added to `data/content.ts` contact (2.1) and rendered in Contact section (6.5) alongside email/GitHub/LinkedIn. **Applied in 2.1.** Per this batch's scope note, phone stays Contact-section-only — not duplicated in SocialSidebar/EmailSidebar/Footer (5.3).
3. Es_Vitrina stack curation override (`TypeScript, Next.js, React, PostgreSQL, REST API`) added in 2.2 to match the approved wireframe (1.4) — GitHub returns no topics for this repo, so without the override the derived stack would only show "TypeScript".

## Apply Notes (Phase 1, applied 2026-09-07)
- Scaffolded with `create-next-app@16.3.4` (Next 16.3.4, React 19.2.8) — confirms Tailwind v4 CSS-first `@theme` (design decision 5) held; no `tailwind.config.ts` fallback needed.
- `@types/node` bumped `^20` -> `^26` to satisfy `vitest@5` peer requirement and match installed Node 24 runtime.
- `package.json` gained `"type": "module"` to silence Vite's native config loader CJS/ESM warning.
- `vitest-axe@^0.1.0` installed (latest stable dist-tag; a `1.0.0-pre.5` exists but was not used to avoid a prerelease in the lockfile).
- Kept Next 16's auto-generated `AGENTS.md`/`CLAUDE.md` (framework-authored agent-guidance files, regenerated by `next dev` if removed).
- Dropped the default Next.js demo SVGs from `public/` (file.svg, globe.svg, next.svg, vercel.svg, window.svg) — unused boilerplate not part of the design.
- `app/page.tsx` is a temporary placeholder pending Phase 7 section assembly.

## Apply Notes (Phase 2, applied 2026-09-07)
- Fetched live from `https://api.github.com/users/VictorCastillo23/repos` (unauthenticated, no `GITHUB_TOKEN` set) — confirmed 6 repos on the account (`Risk-Game`, `Es_Vitrina`, `CameraChatbot`, `Tutorial-Open-CV-para-principiantes-con-Python`, `Modulo-inventario`, `omegaup`); filtered to the 5 curated names, `omegaup` dropped at snapshot-build time as designed.
- `data/github-repos.json` fields match `lib/projects.ts`'s future `GithubRepoSnapshot` shape exactly (`htmlUrl` camelCase, includes `stars` from `stargazers_count`) even though the task prompt's parenthetical used snake_case `html_url` — that was describing the GitHub API's own field name, not the snapshot's output shape. Chose the design's shape since Phase 3's `parseSnapshot` contract test (task 3.6) will validate against it directly.
- `Risk-Game.homepage` came back as `""` from the API; normalized to `null` in the snapshot (harmless overlap with Phase 3's own `snapshot.homepage || null` merge logic — defense in depth, not required).
- `scripts/fetch-github.ts` imports `data/projects.ts` without a `.ts` extension (`from "../data/projects"`) — `tsc --noEmit` rejects `.ts`-suffixed relative imports under `moduleResolution: "bundler"` unless `allowImportingTsExtensions` is set, which this project does not set.
- The repo's local pre-commit hook (Gentleman Guardian Angel / `.gga` config, pre-existing, not created by this batch) flagged that the fetch script's header comment overstated its fail-closed guarantee (it only applies to the main repo-list request, not the best-effort per-repo topics fallback). Fixed in a follow-up commit on the same PR2 branch.

## Apply Notes (Phase 3, applied 2026-09-07)
- `lib/projects.ts` implements exactly the design Part 5 contract: `parseSnapshot`, `mergeProjects`, `findContentGaps`, plus the `Project`/`ProjectSections`/`ContentGap`/`GithubRepoSnapshot`/`GithubSnapshot` types. No separate `lib/types.ts` — the tasks/design artifacts group all shapes inside `lib/projects.ts` itself, so none was created.
- `mergeProjects` join key matching is case-insensitive via a `Map<string.toLowerCase(), GithubRepoSnapshot>` lookup; `title`, `tier`, and `order` always come from curation (the snapshot has no such fields) — verified by a dedicated test since curation is the only possible source of truth for tier.
- Stack dedupe is exact-string (`Set`), not case-insensitive — matches design's literal "dedupe" wording; a test locks in that `["TypeScript", "typescript", "web"]` (language + differently-cased topic) is NOT collapsed further.
- `scripts/check-content.ts` created and wired to the pre-existing `npm run lint:content` script (added in Phase 1's `package.json`, unimplemented until now). It is thin I/O composition (`readFile` + `parseSnapshot` + `mergeProjects` + `findContentGaps`) around already unit-tested pure functions, so it was verified by manual execution (`npx tsx scripts/check-content.ts` against the real snapshot — 5/5 projects have descriptions, exit 0) rather than a unit test, consistent with Phase 2's precedent of not unit-testing `scripts/fetch-github.ts`.
- Contract test (3.6) imports the real `data/github-repos.json` directly (`resolveJsonModule: true` already set in `tsconfig.json`) and asserts against the real `PROJECT_CURATION`: Featured = exactly [Es_Vitrina, CameraChatbot], Other = exactly [Modulo-inventario, Risk-Game, Tutorial-Open-CV-para-principiantes-con-Python], `omegaup` absent from both, zero content gaps. This is the strongest guarantee that `omegaup` cannot leak through in production, not just in synthetic fixtures.
- **Re-split risk found and resolved (Chain strategy)**: this artifact originally paired Phase 3 (`lib/projects.ts`) and Phase 4 (`useActiveSection`) into one PR3 unit. Phase 3 alone already produced a 676-line diff vs the PR2 branch tip — already over the 400-line review budget by itself. The orchestrator resolved this in the Phase 4 batch: Phase 4 now lands on its own branch/PR (`feat/portfolio-nextjs-app-04-scroll-spy`, "PR 4"), not merged into PR3. See the renumbered Suggested Work Units table above and Apply Notes (Phase 4) below.

## Apply Notes (Phase 4, applied 2026-09-07)
- **PR boundary resolved**: per explicit orchestrator instruction, Phase 4 is its own PR ("PR 4"), branch `feat/portfolio-nextjs-app-04-scroll-spy`, created off PR3's branch tip (`feat/portfolio-nextjs-app-03-lib` @ `c675ee6`) — not appended to the PR3 branch. This corrects the original combined "Phase 3-4 = PR3" unit in the Suggested Work Units table (now renumbered: former PR4/PR5 become PR5/PR6).
- `lib/useActiveSection.ts` implements exactly the design Part 5 contract: `useActiveSection(sectionIds: readonly string[]): string | null`, single `IntersectionObserver`, `threshold: 0`, `rootMargin: '-45% 0px -50% 0px'`, a `Map<string, boolean>` tracking last-known intersection state per id (the observer only reports entries that changed per callback, not every observed element), and the first-in-`sectionIds`-order intersecting id as the active one.
- All 7 design-specified hook invariants have a dedicated test in `lib/useActiveSection.test.ts`, driven via the shared `MockIntersectionObserver` in `vitest.setup.ts` (`mockIntersectionObservers` array exposes `.callback`/`.options`/`.observe`/`.disconnect` — no mock changes needed, its existing shape was already sufficient). An 8th contract test renders the hook against the real frozen `SECTION_IDS` from `data/content.ts` (not just a synthetic 3-id fixture) per task 4.3's "verify against frozen SECTION_IDS."
- **Test hygiene gotcha found and fixed**: the SSR-guard test (invariant 7) must `vi.stubGlobal("IntersectionObserver", undefined)` to simulate an environment without the API. `vitest.setup.ts`'s `afterEach` only calls `vi.restoreAllMocks()`, which does NOT undo `vi.stubGlobal` — fixed correctly by scoping the save/restore to the SSR test itself.
- Sort/tie-break assertion for invariant 3 (multiple simultaneous intersecting sections) uses ids in an order deliberately different from `sectionIds` order in the fired entries array (`experience` then `about`) to prove the hook's own ordering logic — not the entries array's order — determines the winner.
- No refactor needed after GREEN: the implementation was minimal and clean from the first pass.

## Apply Notes (Phase 5, applied 2026-09-07)
- **PR boundary resolved (second re-split)**: per the orchestrator's explicit per-batch scope instruction ("implement ONLY Phase 5... do NOT wire into `app/page.tsx` yet — that's Phase 7, a later batch"), Phase 5 (Layout Shell) is its own PR ("PR 5"), branch `feat/portfolio-nextjs-app-05-layout-shell`, created off PR4's branch tip (`feat/portfolio-nextjs-app-04-scroll-spy` @ `4d44a60`). Diff vs PR4 tip: 14 files changed, 667 insertions(+), 0 deletions — already over the 400-line budget by itself, confirming the split from Phase 6 (content sections, "PR 6" now) was the correct call. Mirrors the Phase 3/4 precedent exactly.
- **Test-scoping decision applied as instructed**: this batch is presentational components, so it used render/a11y smoke tests (RTL + vitest-axe) instead of full strict-TDD RED->GREEN->REFACTOR ceremony, per the design's stated test-scoping decision (Strict TDD stays scoped to `lib/projects.ts` and `lib/useActiveSection.ts` only, both already done in PR3/PR4). Every component has a render/interaction smoke test AND a dedicated `expectNoA11yViolations` axe check with zero violations.
- **`vitest-axe@0.1.0` / Vitest 5 type-augmentation gap found and fixed**: `vitest-axe`'s `toHaveNoViolations()` matcher types itself for `expect(...).toHaveNoViolations()` via the pre-Vitest-5 `declare global { namespace Vi { ... } } }` shape (its `vitest-axe/extend-expect` entry point). Vitest 5 moved matcher typing to `declare module "vitest" { interface Assertion<R, T> ... } }`, and — worse — vitest's own two internal `.d.ts` chunks (`config.d.*.d.ts` vs `task-utils.d.*.d.ts`) already disagree with each other on that interface's type-parameter arity/defaults, tolerated only because `skipLibCheck: true` skips re-validating `.d.ts`-to-`.d.ts` consistency. Re-declaring the augmentation in a checked `.ts` file (tried three different signatures matching each candidate "canonical" shape) always produced `TS2428: All declarations of 'Assertion' must have identical type parameters`, because a checked file cannot satisfy conflicting-but-individually-untypechecked `.d.ts` declarations at once. **Fix**: added an `expectNoA11yViolations(container)` helper in `vitest.setup.ts` that calls the underlying `toHaveNoViolations` matcher FUNCTION directly (imported from the still-correctly-typed `vitest-axe/dist/matchers.js`, since the package-root `vitest-axe/matchers.d.ts` re-exports via `export type *`, which erases it to a type-only binding) — sidesteps `expect(...)`'s type surface entirely, no `any`, no module augmentation. Sanity-verified against a deliberately broken `<img>` with no `alt` — the helper threw with the real axe violation report before being removed. All 7 component test files use this helper.
- **Icon.tsx** implements exactly the design's 6-name set (`github`, `linkedin`, `mail`, `external`, `folder`, `code`) as hand-drawn Feather-style inline SVGs (stroke-based, `currentColor`), always `aria-hidden="true"` + `focusable="false"` — accessible names belong on the wrapping link/button per the accessibility skill's icon-button guidance. The hamburger/close icon in `Nav.tsx` is drawn inline in that file rather than added as a 7th `Icon` name, since the design's Part 4 file table locks Icon to exactly those 6.
- **Section.tsx** renders `<section id> + aria-labelledby heading>` with the "01. Title ----" numbered pattern from the wireframes; `scroll-margin-top` is NOT repeated here since `app/globals.css`'s existing `section[id] { scroll-margin-top: 5rem }` rule (Phase 1) already covers every section this component renders.
- **Nav.tsx**: single fixed `<header>` with a `motion-safe:transition-colors` scrolled backdrop (`window.scrollY > 8`), full inline link list `hidden md:flex` at the locked md/768px threshold, and a hamburger `md:hidden` toggling a mobile `<ul id="mobile-nav-menu">` that stays permanently mounted (toggled via the Tailwind `hidden` utility, not conditional unmounting) so `aria-controls="mobile-nav-menu"` always references an existing element — unmounting it would fail axe's `aria-valid-attr-value` rule while closed. Escape closes the menu and returns focus to the toggle button. The mobile panel's open transition reuses the existing `.animate-rise-in` keyframe (Phase 1) rather than adding a new one, so it is a no-op under `prefers-reduced-motion: reduce` for free. Added `html { scroll-behavior: smooth }` to `app/globals.css`, scoped inside the same `prefers-reduced-motion: no-preference` block as `riseIn`, to satisfy the "smooth-scroll to locked section IDs" requirement without JS.
- **SocialSidebar.tsx / EmailSidebar.tsx / Footer.tsx**: `content.socials` (GitHub, LinkedIn only — no phone, matching the batch's explicit scope note that phone stays Contact-section-only) renders in both SocialSidebar (`hidden xl:flex`) and Footer (`xl:hidden`) — the exact breakpoint complement, so no viewport ever shows both, per the design's locked rule. `EmailSidebar` (vertical mailto, `[writing-mode:vertical-rl]`) has NO Footer-side duplicate by design: below `xl`, Contact's own mailto CTA (Phase 6, rendered at every breakpoint) already keeps the email reachable, so duplicating it in Footer would be redundant rather than required by the "no viewport exposes both" rule (that rule is about the SAME link disappearing entirely at some viewport, not about every fixed-sidebar link needing a mobile twin).
- Not wired into `app/layout.tsx`/`app/page.tsx` yet, per explicit batch scope — that is Phase 7.

## Session: manual-save-portafolio
Project: portafolio
Scope: project
Topic: sdd/portfolio-nextjs-app/tasks
