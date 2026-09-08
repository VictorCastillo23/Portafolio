---
obs_id: 197
type: discovery
created_at: 2026-09-07 18:14:35
---

# Phase 3 lib/projects.ts TDD implementation, review-budget risk on PR3

**What**: Implemented lib/projects.ts (parseSnapshot, mergeProjects, findContentGaps) under strict TDD, plus scripts/check-content.ts, on branch feat/portfolio-nextjs-app-03-lib (base: PR2 branch). 4 commits, 29/29 tests passing, tsc/eslint clean.
**Why**: SDD apply Phase 3 for portfolio-nextjs-app — the merge logic that enforces omegaup's exclusion at runtime (not just snapshot-fetch time) and makes curation always win over the GitHub snapshot.
**Where**: lib/projects.ts, lib/projects.test.ts, scripts/check-content.ts (all new, on feat/portfolio-nextjs-app-03-lib, tip c675ee6)
**Learned**: Phase 3 alone already produced a 676-line diff vs PR2 — over the 400-line chained-pr budget by itself, before Phase 4 (useActiveSection) is added, even though the tasks artifact's Suggested Work Units table paired Phase 3+4 into one PR3. Flagged in tasks artifact Apply Notes and apply-progress for the orchestrator to resolve (size:exception vs splitting Phase 4 into PR3b) before the next apply batch.
