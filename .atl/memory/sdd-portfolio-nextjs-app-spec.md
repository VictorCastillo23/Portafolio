---
obs_id: 193
type: architecture
topic_key: sdd/portfolio-nextjs-app/spec
created_at: 2026-09-07 17:11:11
---

# sdd/portfolio-nextjs-app/spec

# Spec: Portfolio Next.js App (portfolio-nextjs-app)

New capabilities (greenfield repo — full specs, no deltas): `portfolio-shell`, `site-navigation`, `cv-content-presentation`, `project-showcase`, `github-project-data`.

## Domain: portfolio-shell

### Requirement: Page Structure & SEO
The system MUST render one page with sections in this order, each with a stable id: Nav, Hero, About, Experience, Credentials, Featured Projects, Other Projects, Contact, fixed Social/Email sidebars, Footer. The system MUST export App Router `metadata` (title, description, Open Graph).

#### Scenario: Sections and metadata present
- GIVEN the page renders
- WHEN the DOM and `<head>` are inspected
- THEN `#hero`, `#about`, `#experience`, `#credentials`, `#projects`, `#contact` each exist once in order, and title/description/og:* tags are non-empty

### Requirement: Accessibility, Reduced Motion & Single Hero Animation
The system MUST provide visible keyboard focus, WCAG AA contrast, `alt` text on every image, and MUST suppress all animation when `prefers-reduced-motion: reduce`. The system MUST play exactly one orchestrated entrance animation scoped to Hero on load and MUST NOT apply entrance animations elsewhere, including project cards; cards MAY use a subtle hover transition only.

#### Scenario: Reduced motion suppresses animation, focus stays visible
- GIVEN `prefers-reduced-motion: reduce`
- WHEN Hero mounts and the user tabs through links
- THEN no entrance animation plays, content is immediately visible, and focus outlines remain visible

#### Scenario: No per-card entrance, hover-only transition
- GIVEN motion is not reduced
- WHEN a project card scrolls into view and is then hovered
- THEN no entrance animation plays on scroll-into-view, and a subtle transition applies on hover, reversing on hover-out

## Domain: site-navigation

### Requirement: Responsive Nav with Hamburger
Below the mobile breakpoint, the fixed nav MUST collapse into a hamburger toggle controlling an open/close mobile menu; at/above it, all links MUST be visible without a toggle.

#### Scenario: Hamburger opens and closes menu
- GIVEN viewport is below the mobile breakpoint
- WHEN the hamburger is activated twice
- THEN the menu opens then closes

### Requirement: Smooth Scroll & Active-Section Highlight
Activating a nav link MUST smooth-scroll to its section. The nav link for the section dominating the viewport MUST be marked active, and only that one.

#### Scenario: Active link tracks scroll
- GIVEN the user scrolls until `#experience` dominates the viewport
- WHEN scroll position settles
- THEN "Experience" is the only active nav link

## Domain: cv-content-presentation

### Requirement: Experience Tabs — Default & Order
Experience tabs MUST be ordered chronologically descending (Juventudes, Emerald Digital, Corvuz), sourced from `data/content.ts`, and the Juventudes tab MUST be active by default on load.

#### Scenario: Default tab and order
- GIVEN Experience mounts with no tab clicked
- WHEN tabs are read left-to-right
- THEN order is Juventudes, Emerald Digital, Corvuz, and Juventudes content is displayed

### Requirement: Dedicated Credentials Section
Credentials MUST render as their own section, separate from About and Hero, containing the WER 2023 international 2nd-place result and the MICAI 2025 publication.

#### Scenario: Credentials standalone
- GIVEN the page renders
- WHEN `#credentials` is inspected
- THEN it is distinct from `#about`/Hero and contains both the WER 2023 and MICAI 2025 entries

### Requirement: Contact via Mailto Only
Contact MUST render a `mailto:` link plus GitHub/LinkedIn links from `data/content.ts`, and MUST NOT render a form or call any backend.

#### Scenario: Mailto present, no form
- GIVEN Contact renders
- WHEN `#contact` is inspected
- THEN an `<a href="mailto:...">` exists and no `<form>` element is present

## Domain: project-showcase

### Requirement: Featured vs Other Tiers
Es_Vitrina and CameraChatbot MUST render as Featured (large cards: description, stack, repo/demo links). Modulo-inventario, Risk-Game, and Tutorial-Open-CV-para-principiantes-con-Python MUST render in a compact Other grid. `omegaup` MUST NOT appear anywhere on the site.

#### Scenario: Tier composition and exclusion
- GIVEN Projects renders
- WHEN Featured and Other grids are inspected
- THEN Featured contains exactly Es_Vitrina and CameraChatbot, Other contains exactly the remaining 3, and `omegaup` appears in neither

### Requirement: No Invented Content for Missing Descriptions
For the 4 repos without a GitHub description (Es_Vitrina, CameraChatbot, Tutorial-Open-CV-para-principiantes-con-Python, Modulo-inventario), only text explicitly approved as a `data/projects.ts` curation override MAY render; unapproved or invented functionality claims MUST NOT render.

#### Scenario: Unapproved repo blocked from rendering invented copy
- GIVEN a repo lacks a GitHub description and has no approved curation override
- WHEN the project list is built
- THEN that repo's card does not render invented functionality text (build/lint MUST flag it as an unresolved content gap)

## Domain: github-project-data

### Requirement: Three-Layer Merge, Curation Always Wins
The system MUST merge `data/content.ts`, `data/projects.ts` (curation allow-list + overrides), and `data/github-repos.json` (GitHub snapshot) by repo name at build time. On any field conflict (e.g. description), `data/projects.ts` MUST win. Repos absent from the `data/projects.ts` allow-list MUST be excluded from the merge result.

#### Scenario: Curation overrides snapshot on conflict
- GIVEN `data/projects.ts` overrides Risk-Game's description and `data/github-repos.json` differs
- WHEN the merge runs
- THEN the rendered value is the `data/projects.ts` override

#### Scenario: Non-allow-listed repo excluded
- GIVEN a repo exists in `data/github-repos.json` but not in `data/projects.ts`
- WHEN the merge runs
- THEN it is excluded from the result (this is how `omegaup` is excluded)

### Requirement: Snapshot Refresh Is Explicit, Not Build-Coupled
Repo data MUST come from the committed `data/github-repos.json` snapshot; `next build` and page render MUST NOT perform live GitHub API calls. Refreshing the snapshot MUST require running a dedicated script (`npm run fetch:github`).

#### Scenario: No network calls at build time
- GIVEN `next build` runs
- WHEN network calls are traced
- THEN zero requests to `api.github.com` occur

## Test Scope Note (Strict TDD Mode)
Strict TDD applies to `lib/projects.ts` (curation+snapshot merge logic — see github-project-data scenarios) and the scroll-spy/active-section hook (see site-navigation active-highlight scenario). Other components (Nav shell, Hero, About, Experience, Credentials, Contact, sidebars, Footer, ProjectCard) require render/a11y smoke coverage, not exhaustive unit specs, per the proposal's documented risk on TDD-vs-presentational-site mismatch.
