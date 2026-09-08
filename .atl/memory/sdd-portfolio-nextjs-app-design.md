---
obs_id: 194
type: architecture
topic_key: sdd/portfolio-nextjs-app/design
created_at: 2026-09-07 17:15:25
---

# sdd/portfolio-nextjs-app/design

# Design: Personal Portfolio Next.js App (portfolio-nextjs-app)

> Size note: this artifact intentionally exceeds the 800-word design budget. It carries the MANDATORY design-approval gate payload from `prompt.md` (palette, typography, wireframes, draft copy, anchors) which cannot be compressed further without losing sign-off value.

## Technical Approach

Static single-page App Router site. Zero runtime data: everything resolves at build time from three typed, committed layers merged by repo name. Server Components by default; only `Nav` (hamburger + scroll-spy) and `Experience` (ARIA tabs) are client components. The hero entrance animation is CSS-only, so `Hero` stays a Server Component — this refines the proposal's "Nav and Hero are the only client components".

## PART 1 — DESIGN-APPROVAL GATE (blocking, user sign-off required)

### 1.1 Color Palette (6 tokens)

v4 is `#0a192f` navy + `#64ffda` mint. This palette moves to the opposite hue families: plum-black + warm amber.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#14101B` | Page background (deep plum-black) |
| `surface` | `#1E1828` | Cards, tab panel, nav backdrop |
| `line` | `#3A3350` | Hairline borders/dividers (decorative only) |
| `text` | `#EDE7F2` | Primary text |
| `muted` | `#A79FB4` | Secondary text, stack tags, inactive nav |
| `accent` | `#FFB35C` | Links, section numbers, active nav, focus ring, CTA |

WCAG contrast (computed, not estimated):

| Pair | Ratio | Result |
|---|---|---|
| `text` on `ink` | 15.47:1 | AAA |
| `text` on `surface` | 14.23:1 | AAA |
| `muted` on `ink` | 7.38:1 | AAA normal text |
| `muted` on `surface` | 6.79:1 | AAA normal text |
| `accent` on `ink` | 10.59:1 | AAA |
| `accent` on `surface` | 9.74:1 | AAA |
| `ink` on `accent` (filled CTA) | 10.59:1 | AAA |
| `accent` focus ring on `ink` | 10.59:1 | Passes 3:1 non-text |

`line` (1.58:1 on `ink`) is decorative only. Card boundaries are additionally conveyed by `surface` fill; every meaningful boundary (focus, active tab indicator, hover border) uses `accent`.

### 1.2 Typography (2 families, `next/font/google`, self-hosted)

| Family | Role | Weights | Var |
|---|---|---|---|
| **Manrope** | Headings, body, nav, buttons | 400 / 500 / 700 / 800 (variable) | `--font-sans` |
| **JetBrains Mono** | Section numbers ("01."), stack tags, eyebrows, email sidebar | 400 / 500 (variable) | `--font-mono` |

Both variable, `subsets: ['latin']` (covers Spanish á é í ó ú ñ ¿ ¡), `display: 'swap'`. Deliberately avoids v4's Calibre + SF Mono. Wired into Tailwind v4 `@theme` as `--font-sans` / `--font-mono`.

### 1.3 Wireframe A — Hero

**Desktop (>=1280px)**

```
+---------------------------------------------------------------------------+
|  VC          01.Sobre mi  02.Experiencia  03.Credenciales                  |  fixed nav, h=80
|              04.Proyectos  05.Contacto                                     |
+---------------------------------------------------------------------------+
| +--+                                                              +----+   |
| |  |                                                              |    |   |
| |gh|   Hola, soy                        <- mono, accent, 14px     | d  |   |
| |in|                                                              | e  |   |
| |  |   Victor Castillo.                 <- Manrope 800, 64px      | v  |   |
| |  |                                                              | .  |   |
| |  |   Construyo software que resuelve                            | v  |   |
| |  |   problemas reales.                <- Manrope 700, 48px muted| i  |   |
| |  |                                                              | c  |   |
| |  |   Ingeniero en Informatica, full stack. Trabajo con          | t  |   |
| |  |   Angular, Next.js y Python...     <- 18px muted, max-w-xl   | o  |   |
| |  |                                                              | r  |   |
| |  |   +---------------------+                                    | @  |   |
| |  |   |  Ver mis proyectos  |          <- accent outline btn     | .. |   |
| |  |   +---------------------+                                    |    |   |
| |--|                                                              |----|   |
| +--+                                                              +----+   |
|  ^ SocialSidebar (fixed left, xl+)       EmailSidebar (fixed right, xl+) ^ |
+---------------------------------------------------------------------------+
```

**Mobile (375px)**

```
+-------------------------+
| VC                  =   |  fixed nav, h=64, hamburger
+-------------------------+
|                         |
| Hola, soy               |  mono accent 13px
|                         |
| Victor                  |
| Castillo.               |  40px
|                         |
| Construyo software      |
| que resuelve            |  28px muted
| problemas reales.       |
|                         |
| Ingeniero en            |
| Informatica, full       |  16px muted
| stack...                |
|                         |
| +---------------------+ |
| | Ver mis proyectos   | |
| +---------------------+ |
|                         |
| (no sidebars below xl;  |
|  same links live in     |
|  Contact + Footer)      |
+-------------------------+
```

**The single orchestrated entrance sequence** — one `@keyframes riseIn` (opacity 0->1, translateY 12px->0), 500ms `ease-out`, applied via staggered `animation-delay`. Nothing else on the page animates on entrance.

| Step | Element | Delay |
|---|---|---|
| 0 | Nav | 0ms |
| 1 | Eyebrow "Hola, soy" | 100ms |
| 2 | H1 name | 200ms |
| 3 | H2 tagline | 300ms |
| 4 | Blurb paragraph | 400ms |
| 5 | CTA button | 500ms |
| 6 | Social + Email sidebars | 600ms |

Total ~1.1s. **Critical implementation rule**: the animation is applied *inside* `@media (prefers-reduced-motion: no-preference)`. Default (no-media) state is fully visible. Never author `opacity: 0` as the base state — under reduced motion that would leave the hero permanently blank.

### 1.4 Wireframe B — Projects

**Desktop (>=1024px)**

```
+-----------------------------------------------------------------------+
|  04. Proyectos ------------------------------------------------------ |
|                                                                       |
|  Destacados                                                           |
|  +-----------------------------------------------------------------+  |
|  | Proyecto destacado                                   </>    ->  |  |  hover:
|  | Es Vitrina                                                      |  |  border -> accent
|  | Plataforma de portafolio digital academico y artistico...       |  |  translateY(-4px)
|  | TypeScript . Next.js . React . PostgreSQL . REST API            |  |  200ms ease-out
|  +-----------------------------------------------------------------+  |
|  +-----------------------------------------------------------------+  |
|  | Proyecto destacado                                   </>    ->  |  |
|  | CameraChatbot                                                   |  |
|  | Proyecto en Python que combina captura de camara...             |  |
|  | Python                                                          |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  Otros proyectos                                                      |
|  +---------------+  +---------------+  +---------------+              |
|  | []       </>  |  | []       </>  |  | []       </>  |              |
|  | Modulo-       |  | Risk-Game     |  | Tutorial      |              |
|  | inventario    |  |               |  | OpenCV        |              |
|  | Modulo de     |  | Una copia del |  | Serie de      |              |
|  | gestion de... |  | juego RISK... |  | notebooks...  |              |
|  | Java          |  | C#            |  | Jupyter NB    |              |
|  +---------------+  +---------------+  +---------------+              |
+-----------------------------------------------------------------------+
```

**Mobile (375px)** — single column, both tiers stacked, same order.

```
+-------------------------+
| 04. Proyectos --------- |
|                         |
| Destacados              |
| +---------------------+ |
| | Destacado    </> -> | |
| | Es Vitrina          | |
| | Plataforma de...    | |
| | TypeScript .        | |
| | Next.js . React     | |
| +---------------------+ |
| +---------------------+ |
| | Destacado    </> -> | |
| | CameraChatbot       | |
| | ...                 | |
| +---------------------+ |
|                         |
| Otros proyectos         |
| +---------------------+ |
| | []            </>   | |
| | Modulo-inventario   | |
| | ...            Java | |
| +---------------------+ |
| +---------------------+ |
| | Risk-Game        C# | |
| +---------------------+ |
| +---------------------+ |
| | Tutorial OpenCV     | |
| +---------------------+ |
+-------------------------+
```

Grid: 1 col `<640`, 2 cols `640-1023`, 3 cols `>=1024`. Hover transition lives ONLY in `ProjectCard`. Under `prefers-reduced-motion: reduce` the border-color change is retained (color is not motion); the `translateY` is dropped.

### 1.5 Draft Repo Descriptions — NEEDS EXPLICIT SIGN-OFF

Derived from repo name + primary language only. **Not final copy.** Nothing here asserts functionality not implied by the name.

| Repo | Lang | Draft (Spanish) | Source basis |
|---|---|---|---|
| `Es_Vitrina` | TypeScript | "Plataforma de portafolio digital academico y artistico para jovenes. Full stack con Next.js, React y TypeScript sobre PostgreSQL (Supabase). Open source y en operacion." | Transcribed from the user's own `cv_example.md`, not inferred |
| `CameraChatbot` | Python | "Proyecto en Python que combina captura de camara con una interfaz conversacional. Consulta el repositorio para el detalle de la implementacion." | Name decomposition (Camera + Chatbot) + language only |
| `Tutorial-Open-CV-para-principiantes-con-Python` | Jupyter Notebook | "Serie de notebooks en Python para aprender OpenCV desde cero. Material introductorio de vision por computadora." | Name decomposition + language only |
| `Modulo-inventario` | Java | "Modulo de gestion de inventario desarrollado en Java. Consulta el repositorio para el detalle de las funcionalidades implementadas." | Name decomposition + language only |

`Risk-Game` needs NO override: its live GitHub description ("Una copia del juego RISK llevada a C#") is already correct. `prompt.md`'s "llevada a Next.js" is the error. Leaving `description` undefined in curation lets the snapshot value flow through — a live demonstration of merge precedence.

**Deliberate note on `CameraChatbot`**: the CV describes an Emerald Digital video->text pipeline with a chatbot. Linking that job to this repo would be an inference. Not made. If the user confirms the link, the description can be enriched at sign-off.

### 1.6 Section IDs, Nav Labels, Breakpoints (locked inputs for Nav + scroll-spy)

IDs are English (code identifiers, per the language contract and the locked spec); labels are Spanish (user-facing copy).

| Order | `id` | Nav label | In nav? |
|---|---|---|---|
| 1 | `hero` | — | No (logo scrolls to top) |
| 2 | `about` | 01. Sobre mi | Yes |
| 3 | `experience` | 02. Experiencia | Yes |
| 4 | `credentials` | 03. Credenciales | Yes |
| 5 | `projects` | 04. Proyectos | Yes |
| 6 | `contact` | 05. Contacto | Yes |

One `<section id="projects">` holds both tiers as labelled subsections ("Destacados" / "Otros proyectos") — satisfies the spec's "`#projects` exists once".

| Breakpoint | Value | Behaviour |
|---|---|---|
| `sm` | 640px | Other-projects grid 1 -> 2 cols |
| `md` | 768px | **Hamburger threshold.** `<md` hamburger; `>=md` inline nav |
| `lg` | 1024px | Other-projects grid 2 -> 3 cols |
| `xl` | 1280px | **Sidebar threshold.** `<xl` sidebars hidden; `>=xl` fixed sidebars visible |

Sidebars at `xl` (not `lg`) because content is `max-w-5xl` + `lg:px-24`; at 1024-1279px fixed sidebars would collide with content. Below `xl`, sidebar links are NOT duplicated in the a11y tree — Footer renders them via `xl:hidden`, sidebars via `hidden xl:flex`. No viewport ever has both.

Nav height 64px mobile / 80px desktop. `section[id] { scroll-margin-top: 5rem }` so the fixed nav never covers a heading on anchor jump.

## PART 2 — ARCHITECTURE DECISIONS

| # | Decision | Chosen | Rejected | Rationale |
|---|---|---|---|---|
| 1 | GitHub data source | Committed `data/github-repos.json`, refreshed by explicit `npm run fetch:github` | Build-time `fetch()` with ISR; GraphQL pinnedItems | Next 15+ flipped the `fetch` default to `no-store`; a `14+` scaffold today yields Next 16, silently exposing the 60 req/hr unauthenticated limit. Deterministic builds, zero network at build. Locked upstream |
| 2 | Client-component boundary | Only `Nav` + `Experience` | `Hero` as client (per proposal) | The entrance animation is pure CSS keyframes + `animation-delay`; no JS needed. Keeping `Hero` server reduces the client bundle. **Refines the proposal** |
| 3 | Animation tech | CSS `@keyframes` + staggered delay | framer-motion / GSAP | One sequence, six elements. A motion library is ~30KB+ of JS for something 20 lines of CSS does, and it complicates reduced-motion handling |
| 4 | Reduced-motion direction | Apply animation *inside* `@media (prefers-reduced-motion: no-preference)` | Base `opacity: 0` + `@media reduce { animation: none }` | The rejected form leaves the hero permanently invisible under reduced motion. Direction matters more than the media query |
| 5 | Tailwind config | v4 CSS-first: `@import "tailwindcss"` + `@theme` in `app/globals.css` | `tailwind.config.ts` (as listed in the proposal) | `create-next-app@latest` in 2026 scaffolds Tailwind v4, which has no JS config by default. **Supersedes the proposal's file list.** Verify at scaffold; if v3 lands, fall back to `tailwind.config.ts` |
| 6 | Merge fn purity | `mergeProjects(curation, snapshot)` — pure, snapshot injected | Reading JSON via `fs` inside the fn | Pure = trivially unit-testable with fixtures, no I/O mocking, usable directly from a Server Component |
| 7 | Join key matching | Case-insensitive on repo `name` | Case-sensitive exact | GitHub repo names are case-insensitive-unique; a casing typo in curation would silently drop a card |
| 8 | Content-gap enforcement | Separate pure `findContentGaps(sections)` + `scripts/check-content.ts` (`npm run lint:content`) | Throwing inside `mergeProjects` | Spec requires build/lint to flag unapproved copy. Separating keeps `mergeProjects` total (never throws) while giving the gate a hard CI check |
| 9 | Snapshot validation | Hand-written `parseSnapshot` type guard in `lib/projects.ts` | Zod | One shape, ~25 lines. Avoids a runtime dependency on a site with no backend |
| 10 | ProjectCard | One component, `variant: 'featured' \| 'other'` | Two components | Hover treatment and stack-tag rendering are identical; splitting duplicates the only animated code path. Only spacing/type scale differ |
| 11 | Test runner | Vitest + jsdom + RTL | Jest | Native ESM/TS, official Next recommendation. **Gotcha**: Vitest cannot render *async* Server Components — all section components MUST stay synchronous |
| 12 | OG image | `app/opengraph-image.tsx` via `next/og` `ImageResponse` | Static `public/og.png` | No design assets exist. Generated at build from the palette, no binary in git. Fallback if it causes build friction: ship without `og:image`; title/description/type/url still satisfy the spec |
| 13 | Refresh script timing | Manual only, never `prebuild` | `prebuild` hook | A GitHub outage must never break a Vercel deploy |
| 14 | Anchor language | English IDs, Spanish labels | Spanish IDs (`#sobre-mi`) | Locked by the spec, and consistent with the language contract: code identifiers English, user-facing copy Spanish |

## PART 3 — DATA FLOW

```
  scripts/fetch-github.ts  --(manual: npm run fetch:github)-->  api.github.com
             |                                                        |
             |<-------------------- JSON --------------------------- -+
             v
  data/github-repos.json  (committed snapshot, layer 3: machine)
             |
             |     data/projects.ts (layer 2: human curation, ALWAYS WINS)
             |            |
             v            v
        lib/projects.ts :: mergeProjects()   [pure, TDD]
                     |
                     +--> ProjectSections { featured[], other[] } --> <Projects> --> <ProjectCard>
                     |
                     +--> findContentGaps() --> scripts/check-content.ts (npm run lint:content)

  data/content.ts (layer 1: human CV content)
             |
             +--> Hero / About / Experience / Credentials / Contact / Sidebars / Footer / metadata

  lib/useActiveSection.ts  [client, TDD]  <-- IntersectionObserver --> section[id]
             |
             v
          <Nav>  (active link highlight)
```

## PART 4 — FILE CHANGES (all Create; greenfield)

| File | Type | Description |
|---|---|---|
| `app/layout.tsx` | Server | `<html lang="es">`, `next/font`, `metadata`, `viewport`, Nav + sidebars + Footer |
| `app/page.tsx` | Server | Section assembly in locked order |
| `app/globals.css` | CSS | Tailwind v4 `@import` + `@theme` tokens + `riseIn` keyframe + reduced-motion + `scroll-margin-top` |
| `app/opengraph-image.tsx` | Server | Build-time OG image |
| `components/layout/Nav.tsx` | **Client** | Hamburger state, scroll-spy consumer, scrolled-backdrop state |
| `components/layout/SocialSidebar.tsx` | Server | Fixed left, `hidden xl:flex` |
| `components/layout/EmailSidebar.tsx` | Server | Fixed right, vertical mailto, `hidden xl:flex` |
| `components/layout/Footer.tsx` | Server | Credit + social row (`xl:hidden`) |
| `components/sections/Hero.tsx` | Server | CSS-only orchestrated entrance |
| `components/sections/About.tsx` | Server | Profile paragraphs + skills + education |
| `components/sections/Experience.tsx` | **Client** | ARIA tablist, roving tabindex, arrow keys; Juventudes default |
| `components/sections/Credentials.tsx` | Server | WER 2023 + MICAI 2025 + certifications |
| `components/sections/Projects.tsx` | Server | Calls `mergeProjects`, renders both tiers |
| `components/sections/Contact.tsx` | Server | mailto CTA + social links, no `<form>` |
| `components/ui/ProjectCard.tsx` | Server | `variant` prop; sole owner of hover transition |
| `components/ui/Section.tsx` | Server | `<section id>` + numbered heading + rule |
| `components/ui/Icon.tsx` | Server | Inline SVG: github, linkedin, mail, external, folder, code |
| `data/content.ts` | Data | Typed CV content |
| `data/projects.ts` | Data | 5-entry curation allow-list |
| `data/github-repos.json` | Data | Committed snapshot |
| `lib/projects.ts` | Logic | `mergeProjects`, `findContentGaps`, `parseSnapshot` — **TDD** |
| `lib/useActiveSection.ts` | Client hook | IntersectionObserver scroll-spy — **TDD** |
| `scripts/fetch-github.ts` | Script | Snapshot refresh |
| `scripts/check-content.ts` | Script | Content-gap gate |
| `package.json`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `next.config.ts`, `README.md` | Config | Toolchain + run/deploy docs |

## PART 5 — INTERFACES / CONTRACTS

```ts
// data/content.ts
export type SectionId = 'hero' | 'about' | 'experience' | 'credentials' | 'projects' | 'contact';

export interface NavItem { id: Exclude<SectionId, 'hero'>; index: string; label: string }
export interface Job { id: string; company: string; role: string; url?: string; range: string; bullets: string[] }
export interface Credential { kind: 'award' | 'publication' | 'certification'; title: string; issuer: string; date: string; detail?: string; url?: string }
export interface SocialLink { name: string; url: string; icon: 'github' | 'linkedin' | 'mail' }

export interface SiteContent {
  meta: { name: string; role: string; siteUrl: string; description: string };
  nav: readonly NavItem[];
  hero: { eyebrow: string; title: string; tagline: string; blurb: string; cta: { label: string; href: string } };
  about: { paragraphs: string[]; skills: string[]; education: { degree: string; school: string; range: string; detail: string } };
  experience: readonly Job[];   // chronological DESC; index 0 = Juventudes = default tab
  credentials: readonly Credential[];
  contact: { eyebrow: string; title: string; blurb: string; email: string };
  socials: readonly SocialLink[];
  footer: { text: string };
}
export const SECTION_IDS: readonly SectionId[]; // frozen, document order — scroll-spy input
```

```ts
// data/projects.ts — layer 2, always wins
export interface ProjectCuration {
  repo: string;                 // exact GitHub repo name = join key
  tier: 'featured' | 'other';
  order: number;                // display order within tier
  title: string;                // display title, e.g. "Es Vitrina"
  description?: string;         // overrides snapshot when present
  stack?: string[];             // overrides snapshot language+topics wholesale
  demoUrl?: string | null;
}
export const PROJECT_CURATION: readonly ProjectCuration[]; // exactly 5 entries
```

```jsonc
// data/github-repos.json — layer 3
{
  "generatedAt": "2026-09-07T00:00:00.000Z",
  "user": "VictorCastillo23",
  "repos": [
    { "name": "Es_Vitrina", "description": null, "language": "TypeScript",
      "topics": [], "htmlUrl": "https://github.com/...", "homepage": null, "stars": 0 }
  ]
}
```

```ts
// lib/projects.ts
export interface GithubRepoSnapshot { name: string; description: string | null; language: string | null; topics: string[]; htmlUrl: string; homepage: string | null; stars: number }
export interface GithubSnapshot { generatedAt: string; user: string; repos: GithubRepoSnapshot[] }
export interface Project { repo: string; title: string; description: string; stack: string[]; repoUrl: string; demoUrl: string | null; tier: 'featured' | 'other'; order: number }
export interface ProjectSections { featured: Project[]; other: Project[] }
export interface ContentGap { repo: string; reason: 'missing-description' }

export function parseSnapshot(raw: unknown): GithubSnapshot;                 // throws on shape violation
export function mergeProjects(curation: readonly ProjectCuration[], snapshot: GithubSnapshot): ProjectSections;  // total, never throws
export function findContentGaps(sections: ProjectSections): ContentGap[];
```

**Merge invariants (the TDD spec for `mergeProjects`):**

1. Allow-list only — a snapshot repo absent from curation is dropped. This is how `omegaup` is excluded.
2. A curation entry with no snapshot match still renders; `repoUrl` falls back to `https://github.com/{snapshot.user}/{repo}`. Stale/partial snapshots degrade, never crash.
3. Join is case-insensitive on repo `name`; the display `title` always comes from curation.
4. `description = curation.description ?? snapshot.description ?? ''`. Curation wins.
5. `stack = curation.stack ?? dedupe([snapshot.language, ...snapshot.topics].filter(Boolean))`. Curation replaces wholesale, never merges — predictable.
6. `demoUrl = curation.demoUrl ?? (snapshot.homepage || null)`; empty-string homepage normalizes to `null`.
7. Each tier sorted by `order` asc, ties broken alphabetically by `repo` — fully deterministic.
8. Pure: no `fs`, no `fetch`, no `Date.now()`.

```ts
// lib/useActiveSection.ts  ('use client')
export function useActiveSection(sectionIds: readonly string[]): string | null;
```

Implementation: single `IntersectionObserver`, `threshold: 0`, `rootMargin: '-45% 0px -50% 0px'` — a narrow band in the viewport's upper-middle, which removes the "two sections visible, which wins?" ambiguity. Maintains a `Map<string, boolean>`; the active id is the **first id in `sectionIds` order** that is intersecting.

**Hook invariants (TDD):**
1. Returns `null` before any intersection fires.
2. One intersecting section -> that id.
3. Multiple intersecting -> first in the provided (document) order.
4. Set becomes empty -> retains the last id (no flicker to `null`).
5. Unmount -> `disconnect()` called exactly once.
6. Ids with no matching DOM element are skipped without throwing.
7. Guards `typeof IntersectionObserver === 'undefined'` (SSR).

Observes all 6 ids including `hero`. `Nav` highlights a link only when `activeId` matches one of its hrefs, so `hero` correctly yields no highlighted link at the top of the page. `sectionIds` must be the frozen `SECTION_IDS` constant — an inline array literal would re-create the observer every render.

## PART 6 — GITHUB SNAPSHOT REFRESH SCRIPT

`scripts/fetch-github.ts`, run via `npm run fetch:github` (tsx). Manual only — never `prebuild`.

- `GET https://api.github.com/users/VictorCastillo23/repos?per_page=100&sort=updated`
- Headers: `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: portafolio-sync`, plus `Authorization: Bearer ${GITHUB_TOKEN}` when the env var exists (raises 60 -> 5000 req/hr for whoever runs it; optional, never required).
- Non-2xx -> print status + `x-ratelimit-remaining`, `process.exit(1)`, and **do not write the file**. Never clobber a good snapshot with an error body.
- Filters to `PROJECT_CURATION` repo names before writing, so `omegaup` is excluded at the source too. `mergeProjects` re-enforces this independently — defense in depth; the exclusion guarantee never depends on the script having run correctly.
- Maps to `GithubRepoSnapshot`, sorts `repos` by `name`, writes pretty-printed JSON with a trailing newline -> clean, reviewable git diffs.
- **Verify at apply**: `topics` is returned by default under API version `2022-11-28`. If it comes back absent, fall back to `GET /repos/{owner}/{repo}/topics` per repo.

## PART 7 — APP ROUTER METADATA

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(content.meta.siteUrl),         // required for relative OG URLs
  title: { default: 'Víctor Castillo — Desarrollador Full Stack', template: '%s · Víctor Castillo' },
  description: content.meta.description,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'es_MX', url: '/', siteName: 'Víctor Castillo', title: ..., description: ... },
  twitter: { card: 'summary_large_image', title: ..., description: ... },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: '#14101B', colorScheme: 'dark' };
```

`<html lang="es">`. The OG image is supplied by `app/opengraph-image.tsx` (Next auto-wires `og:image` / `twitter:image` from the file convention — do not also hand-write an `images` array).

## PART 8 — TESTING STRATEGY

| Layer | What | How |
|---|---|---|
| Unit (**strict TDD**) | `mergeProjects` — 8 invariants | Vitest, pure fn, curation + snapshot fixtures. Red-green-refactor per invariant |
| Unit (**strict TDD**) | `useActiveSection` — 7 invariants | Vitest + jsdom + RTL `renderHook`; global `IntersectionObserver` mock in `vitest.setup.ts` captures the callback and drives it via `act()` |
| Unit | `parseSnapshot` rejects malformed JSON | Vitest, malformed fixtures |
| Contract | Real `data/github-repos.json` passes `parseSnapshot` | Vitest importing the actual file |
| Smoke | Each section renders from real `data/content.ts`; no empty headings, no literal `undefined` | RTL render (components MUST be sync — Vitest cannot render async Server Components) |
| Guard | `omegaup` renders nowhere | RTL render `Projects`, assert `queryByText(/omegaup/i)` is `null` |
| Guard | Contact has a `mailto:` and no `<form>` | RTL query |
| a11y | Automated axe pass on assembled page output | `vitest-axe` |
| Manual (pre-deploy checklist in README) | Keyboard tab order + visible focus, hamburger open/close, tab arrow keys, reduced-motion, Lighthouse a11y/SEO | Documented checklist |

## PART 9 — MIGRATION / ROLLOUT

No migration — greenfield repo, one prior commit (`c6b1f56`), no production consumers, no external state. Rollback = delete the branch or `git reset --hard c6b1f56`; on Vercel, promote the previous deployment or delete the project.

Delivery order: **design gate (blocking)** -> scaffold + shell/tokens/fonts -> `data/content.ts` -> `lib/projects.ts` + snapshot + script (TDD) -> Nav + `useActiveSection` (TDD) -> sections -> a11y/SEO/README pass.

## PART 10 — OPEN QUESTIONS

- [ ] **BLOCKING** — Approve the palette (6 hex), the Manrope + JetBrains Mono pairing, and both wireframes.
- [ ] **BLOCKING** — Approve or rewrite the 4 draft repo descriptions in §1.5. Confirm whether `CameraChatbot` may be described as related to the Emerald Digital video->text pipeline (currently NOT asserted).
- [ ] Resume/CV button in Nav: omitted from this design because no PDF asset exists. Add `public/cv.pdf` + a nav button, or leave out?
- [ ] `content.meta.siteUrl` — the production domain is needed for `metadataBase`, canonical, and OG URLs. Placeholder until the Vercel domain is known.
- [ ] Phone number `476 737 7263` appears in `cv_example.md`. Publish it on the site, or keep contact to email + GitHub + LinkedIn only? (Design currently assumes email/GitHub/LinkedIn only.)
- [ ] Confirm at scaffold whether `create-next-app@latest` yields Tailwind v4 (CSS-first `@theme`) — if v3, revert to `tailwind.config.ts` per Decision 5.
