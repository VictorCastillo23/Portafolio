# chat-full-context — chat con contexto completo (sin RAG) y sin fuentes clicables

Branch: `feat/chat-full-context` (from `origin/main` @ 15925fe). Plan: `C:\Users\vcastillo\.claude\plans\crea-un-plan-para-cheeky-rainbow.md`.

## Objective
Replace FlexSearch RAG with context stuffing: build the whole knowledge base from `content` + merged projects and send it in the Anthropic `system` param on every request. Remove clickable source chips end to end.

## Problem / why
Knowledge base is 19 chunks / 9,513 chars (~2.5–3k tokens). Retrieval already returns 8 of 19 (top-K), searches only the last message (follow-ups fail), and requires an index, embeddings and a separate build tool. Cost of full context is ~1.5–2k extra tokens per message on Haiku 4.5 (~$0.002).

## Scope
- In: new `lib/chat/knowledge.ts`; `buildSystemPrompt(knowledge)`; route without retrieval and without the `sources` SSE event; client without sources (assistant placeholder created when the stream starts); delete `lib/search/`, `data/search-index.json`, `tools/search-index-builder/`, `flexsearch`, dead config; README/CLAUDE.md.
- Out: prompt caching, URLs inside knowledge text, fixing the 4 pre-existing broken tests (Projects.test "CameraChatbot", lib/projects.test tiers, 2x Credentials.test titles).

## Constraints
- Strict TDD: RED → GREEN → REFACTOR. Mode: enabled. Source: repo CLAUDE.md ("Strict TDD"). Runner: `npx vitest run <file>` / `npm test`.
- Conventional Commits, NO AI attribution (user's global rule). Push only on the user's request. Explicit upstream on push (`git push -u origin feat/chat-full-context`); the branch currently tracks origin/main.
- Generated artifacts in English (code/comments/tests); README stays Spanish (project convention).
- ~400 authored changed lines per task is a planning heuristic only.

## Delivery
Forecast: additions ~300, deletions >1,500 (lib/search + tools + index) → chain strategy chosen at plan time: **two stacked PRs**.
- PR-A: T1–T4 (behavior change; `lib/search` stays but unused).
- PR-B: T5–T6 (delete dead code + docs).

## Tasks
- [x] T1 — `lib/chat/knowledge.ts` + `knowledge.test.ts` (pure `buildKnowledgeBase`, real-data contract, char-budget guard ~30k). Route: delegated (writer).
- [x] T2 — `lib/chat/prompt.ts` + test: `buildSystemPrompt(knowledge)`, drop `buildContextBlock`/`escapeXml`. Route: delegated (writer).
- [x] T3 — `lib/chat/stream.ts`, `app/api/chat/route.ts` (+ tests): no `sources` event, lazy memoized system prompt, user turn = raw question. Route: delegated (writer).
- [x] T4 — client: `useChatStream.ts`, `ChatMessage.tsx` (+ tests): no `sources`, placeholder on stream start. Route: delegated (writer).
- [x] T5 — delete `lib/search/`, `data/search-index.json`, `tools/search-index-builder/`, `flexsearch`, `build:search-index` script, dead config (.gitignore, eslint, tsconfig). Route: delegated (writer).
- [x] T6 — docs: README "Chat con IA", commands, CLAUDE.md, ChatWidget header comment. Route: delegated (writer).

**Execution order (changed to keep every commit green):** T1 → T4 → (T2+T3 merged into one work unit) → T5 → T6. Reason: the client must stop depending on the `sources` event before the server stops sending it, and the `buildSystemPrompt` signature change is inseparable from the route that calls it.
- [x] T7 — simplify (over-engineering review requested by the user): (1) drop `Entry`/`renderEntry`/`renderSection` + empty-text guard in knowledge.ts and trim its tests; (2) module-level `SYSTEM_PROMPT` const in route.ts instead of lazy memo + 503 path (+ drop 2 route tests); (3) drop empty-knowledge `throw` in prompt.ts (+ 2 tests). Behavior must stay byte-identical for real data. Route: delegated (writer).

Route declaration: each task touches 2+ non-trivial files → mandatory delegation trigger (Writer). One writer at a time; parent verifies (spot-check), updates this file + Engram mirror, and commits.

## Acceptance criteria
- Assistant answers from the full knowledge base in `system`; follow-ups work; policies (third person, declines, exact contact) intact.
- No `sources` event, no source chips, no `flexsearch`/search-index references left.
- `npm test`: only the 4 pre-existing unrelated failures; `npm run lint` clean; `npm run build` compiles without `ANTHROPIC_API_KEY`.

## Progress
- Branch created from origin/main; uncommitted `ChatMessage.tsx`/`.test.tsx` (chip reorder) carried over, superseded by T4.

## Verification evidence
- T4: RED = 5 useChatStream tests failed (assistant message only existed after a `sources` event); GREEN = `npx vitest run components/chat` 22/22 (parent re-ran); eslint + `tsc --noEmit` clean. Extra (test-first): stop typing placeholder if the connection drops before the first delta. Commit 72dc3c3.
- T1: RED = suite failed to load (`./knowledge` missing); GREEN = `npx vitest run lib/chat/knowledge.test.ts` 13/13 (parent re-ran); eslint clean; real KB = 10,488 chars (budget 30,000). Commit 9ee8ba3.

- T2+T3 (merged work unit, commit 1bc09dd): RED = prompt.test 7/15 failed (wording/verbatim/throw rules) and route.test 9/9 failed (old route called `buildSystemPrompt()` without args); GREEN = `npx vitest run lib/chat app/api/chat components/chat` 83/83 (parent re-ran); eslint + `tsc --noEmit` clean. Parent fixed leftover "provided context" wording test-first. Full suite: 237 pass / 4 known unrelated failures.
- T5 (commit 2470cbd on branch `chore/remove-rag`, stacked on feat/chat-full-context): deleted lib/search (6 files), data/search-index.json, tools/ (incl. untracked node_modules), flexsearch dep + lockfile block (29 lines, no unrelated churn), build:search-index script, dead config (.gitignore/eslint/tsconfig); reworded 2 dangling comments in knowledge.ts/test. Full suite 182 pass / 4 known unrelated failures; tsc clean; lint 0 errors; `npm run build` OK without ANTHROPIC_API_KEY. 18 files, +5/-3116.
- T6 (commit 0d3b14d): README (commands table, "Chat con IA" rewritten, KNOWLEDGE_CHAR_BUDGET note, ANTHROPIC_MODEL default path), CLAUDE.md (removed build:search-index, "no RAG" convention), ChatWidget/Icon header comments. Final: `npm test` 182 pass / 4 known unrelated failures; tsc clean; lint 0 errors (2 pre-existing warnings in Hero.test.tsx); `npm run build` OK without ANTHROPIC_API_KEY; residual grep (flexsearch|search-index|lib/search|buildContextBlock|RetrievedChunk) clean.
- T7 (commit ef6e8b2): knowledge.ts 112->53 lines, tests 13->6; route.ts module-level SYSTEM_PROMPT (no lazy memo / 503); prompt.ts empty-guard removed. Parent independently verified byte-identical output for real data (old version from git vs new: identical, 10,488 chars). Full suite 171 pass / 4 known unrelated failures; tsc/eslint clean; build OK. 6 files, +49/-283.

## Review / delivery log
- T1 9ee8ba3: assess = medium, 350 lines, review_due=false (under_budget); slice stays pending until budget (~400) is reached.

- T1+T4 slice (536 lines, medium) hit slice_budget_reached → native review: consent granted, reviewer approved, acknowledged (authority burned). Reviewed boundary = 72dc3c3. Untracked `odd/` declared excluded (`--untracked-scope=exclude`). Advisory (non-blocking): R3-empty-guard-weak — `renderEntry` empty-text guard only fires for the about summary (other entries embed literal text), contradicting the "fails loudly" doc comment; handle as separate follow-up (tighten guard or fix wording).
- T2+T3 slice 1bc09dd (453 lines, medium) → slice_budget_reached → consent granted, reviewer approved, acknowledged (burned). Reviewed boundary = 1bc09dd. Advisories (non-blocking): R3-cache-not-tested-failure-retry (no test that a failed prompt build is retried), R3-history-unbounded-system (low confidence; per-request size bounded by `KNOWLEDGE_CHAR_BUDGET` test + request.ts history limits).
- PR-A = commits 9ee8ba3, 72dc3c3, 1bc09dd on `feat/chat-full-context` (not pushed).
- PR-B slice (2470cbd + 0d3b14d, 3,171 lines mostly deletions, medium) → native review: consent granted, reviewer approved with no findings, acknowledged (burned).
- PR-A = feat/chat-full-context (9ee8ba3, 72dc3c3, 1bc09dd); PR-B = chore/remove-rag (2470cbd, 0d3b14d), stacked on PR-A. Neither pushed.
- T7 slice (332 lines, medium): review_due=false (under_budget). Pushed to origin/feat/chat-full-context (single PR).

## Next step
All tasks done and pushed (single PR from feat/chat-full-context). Awaiting PR creation by the user (gh not authenticated). Optional follow-up: the 4 pre-existing stale tests.
