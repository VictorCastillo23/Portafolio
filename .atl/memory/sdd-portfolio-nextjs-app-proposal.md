---
obs_id: 192
type: architecture
topic_key: sdd/portfolio-nextjs-app/proposal
created_at: 2026-09-07 17:02:21
---

# sdd/portfolio-nextjs-app/proposal

# Proposal: Personal Portfolio Next.js App (portfolio-nextjs-app)

## Intent
Víctor has no public professional site. CV content lives in two local markdown files and project credibility lives on GitHub — a recruiter cannot see either in one place. Build a single-page portfolio that presents career narrative and real repos with one URL. Success: deployable Vercel site, mobile-first, WCAG AA, no backend, content editable by a non-developer via typed data files.

## Scope

### In Scope
- Next.js 14+ App Router + TypeScript + Tailwind, greenfield scaffold
- Sections: Nav, Hero, About, Experience (tabbed: Juventudes / Emerald Digital / Corvuz), Featured Projects (2-3), Other Projects grid, Contact, fixed Social + Email sidebars, Footer
- `data/content.ts` — typed static CV content
- `data/projects.ts` — hardcoded curation allow-list (5 repos) + featured/other tier + manual description overrides
- `data/github-repos.json` + `scripts/fetch-github.ts` — cached GitHub REST data (name, description, language, topics)
- Mobile-first responsive, hamburger nav, smooth scroll, IntersectionObserver scroll-spy
- App Router metadata API (title/description/OG); a11y: visible focus, AA contrast, alt text, `prefers-reduced-motion`
- One orchestrated hero entrance animation + subtle project hover only
- **Gate**: design-approval checkpoint before any implementation

### Out of Scope
- Backend, CMS, DB, auth, contact form submission (mailto only)
- Runtime/live GitHub fetching, GraphQL pinned-items, PAT auth
- `omegaup` repo (user-excluded), blog, i18n, dark/light toggle, analytics
- Visual clone of bchiang7/v4 (structural inspiration only)

## Capabilities

### New Capabilities
- `portfolio-shell`: root layout, `next/font`, global styles, SEO metadata, section anchors
- `site-navigation`: fixed nav, hamburger, smooth scroll, active-section highlighting
- `cv-content-presentation`: hero/about/experience-tabs/contact/sidebars/footer from `data/content.ts`
- `project-showcase`: featured vs other tiers, cards with stack + repo/demo links
- `github-project-data`: cached-JSON generation + name-keyed merge of API data with curation overrides

### Modified Capabilities
- None (greenfield repo).

## Approach
Three-layer data model, merged by repo name at build time: (1) human CV content `data/content.ts`; (2) human curation `data/projects.ts`; (3) machine GitHub snapshot `data/github-repos.json`. Curation always wins over API data, so a refresh never overwrites approved copy. Cached JSON chosen over build-time `fetch()` because Next.js 15 flipped the `fetch` default from `force-cache` to `no-store` — a `14+` scaffold today yields Next 15/16, silently exposing the 60 req/hr unauthenticated rate limit. Server components by default; `Nav` and `Hero` are the only client components.

Delivery order: design gate → scaffold + shell → content layer → GitHub data layer → sections → a11y/SEO pass.

## Affected Areas
| Area | Impact | Description |
|---|---|---|
| `app/layout.tsx`, `app/page.tsx` | New | Shell, metadata, page assembly |
| `data/content.ts` | New | CV content |
| `data/projects.ts` | New | Curation allow-list + overrides |
| `data/github-repos.json`, `scripts/fetch-github.ts` | New | Cached repo snapshot |
| `lib/projects.ts` | New | Merge/curation logic (unit-testable) |
| `lib/useActiveSection.ts` | New | Scroll-spy hook (unit-testable) |
| `components/*` | New | 10 section components |
| `package.json`, `tailwind.config.ts`, `tsconfig.json` | New | Toolchain |

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Next 15 `no-store` fetch default → live GitHub calls + rate limit | Med | Cached JSON; no runtime fetch. If live fetch is ever adopted, `revalidate: 86400` is mandatory |
| 4 of 5 repos lack GitHub descriptions | High | Draft candidate copy, user sign-off at design gate; never invent functionality |
| Cached JSON goes stale | Med | Documented `npm run fetch:github` refresh step |
| Strict TDD vs mostly-presentational site | High | Test scope limited to `lib/projects.ts` merge and `lib/useActiveSection.ts`; presentational components covered by a11y/render smoke checks, not forced unit tests. Flag to sdd-tasks |
| Design gate skipped → rework of anchors/layout | Med | Hard blocker: no code before palette/typography/wireframes/content approved |
| v4 resemblance too close | Low | Palette must visibly diverge from navy/green |

## Open Questions
1. Approved short descriptions for `Es_Vitrina`, `CameraChatbot`, `Tutorial-Open-CV-para-principiantes-con-Python`, `Modulo-inventario` — drafts due at design gate.
2. Which 2-3 repos are Featured? (`Es_Vitrina` is the obvious anchor given CV depth.)
3. Contact channel: mailto address + which social links (GitHub, LinkedIn, others?).
4. Are the MICAI 2025 publication and WER 2023 award surfaced as their own section or folded into About?

## Resolved (user decisions, do not re-ask)
- `omegaup`: excluded. Only the 5 named repos.
- `Risk-Game`: C# implementation of the RISK board game. prompt.md's "llevada a Next.js" is an error; GitHub `language: C#` is authoritative.

## Rollback Plan
Greenfield repo with one prior commit and no production consumers. Rollback = delete the feature branch or `git reset` to `c6b1f56`; on Vercel, promote the previous deployment or delete the project. No data migration, no external state, no dependents.

## Dependencies
- Node 18+, `create-next-app`
- GitHub public REST API — one-time, at snapshot-generation only
- User sign-off at the design + content approval gate (blocking)

## Success Criteria
- [ ] Design gate approved (palette 4-6 hex diverging from v4, ≤2 `next/font` families, hero + projects ASCII wireframes) before first code commit
- [ ] All 5 curated repos render with approved descriptions, language and topics from live-sourced data
- [ ] `omegaup` absent from the rendered site
- [ ] Nav highlights the active section on scroll; hamburger works on mobile
- [ ] Zero runtime GitHub API calls in production
- [ ] Keyboard-navigable, AA contrast, all animation suppressed under `prefers-reduced-motion`
- [ ] `npm run dev` and Vercel deploy documented in README
