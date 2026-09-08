# Engram memory export — portafolio

Snapshot of this project's Engram (persistent memory) records, exported for the
`portfolio-nextjs-app` SDD change so the decision trail survives outside the local
Engram SQLite database.

Generated with `engram export`, filtered to the `portafolio` project. Not auto-synced —
re-run the export manually if you want an up-to-date snapshot after further SDD phases
(`sdd-verify`, `judgment-day`, archive).

The raw re-importable JSON export (`engram-export.portafolio.json`) was removed —
`.engram/` (native `engram sync`) is the canonical re-importable snapshot; these `.md`
files remain as human-readable documentation only.

## Files

| File | Topic key | What it is |
| --- | --- | --- |
| `sdd-init-portafolio.md` | `sdd-init/portafolio` | Project stack detection (greenfield, Next.js/TS/Tailwind) |
| `sdd-portafolio-testing-capabilities.md` | `sdd/portafolio/testing-capabilities` | Strict TDD Mode config, test runner capability table |
| `skill-registry.md` | `skill-registry` | Indexed skills available to this project (`.atl/skill-registry.md` is the live version) |
| `sdd-portfolio-nextjs-app-explore.md` | `sdd/portfolio-nextjs-app/explore` | Exploration: GitHub API constraints, cached-JSON recommendation |
| `sdd-portfolio-nextjs-app-proposal.md` | `sdd/portfolio-nextjs-app/proposal` | Proposal: scope, three-layer data model, open questions |
| `sdd-portfolio-nextjs-app-spec.md` | `sdd/portfolio-nextjs-app/spec` | Delta specs: requirements/scenarios for all 5 capability domains |
| `sdd-portfolio-nextjs-app-design.md` | `sdd/portfolio-nextjs-app/design` | Technical design + the approved design-approval gate (palette, fonts, wireframes) |
| `sdd-portfolio-nextjs-app-tasks.md` | `sdd/portfolio-nextjs-app/tasks` | Task breakdown, PR/work-unit split history |
| `sdd-portfolio-nextjs-app-apply-progress.md` | `sdd/portfolio-nextjs-app/apply-progress` | Final implementation state: all 9 branches, verification results, open items |
| `197-phase-3-lib-projects.ts-tdd-implementation-review-budget-risk-on-pr3.md` | — | Standalone discovery note from the PR3 TDD batch |
| `_index.json` | — | Machine-readable index of the files above |

## Why this exists

Engram's MCP connection dropped mid-session during implementation; this export was made
via the local `engram` CLI (bypassing the MCP plugin) once the underlying SQLite store
was confirmed healthy (`engram doctor`), so the full decision trail — proposal through
final apply state — could be committed to git rather than living only in a local,
un-synced database.
