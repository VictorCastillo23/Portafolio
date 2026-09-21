# dark-mode — botón en la barra superior para cambiar a modo oscuro

Branch: `feat/light-theme` (stacked on the local commit of the light theme). Not pushed.

## Objective
Add a theme toggle button to the top bar (Nav) that switches between the new light palette and a dark palette derived from it. Preference persisted; default follows `prefers-color-scheme`; no flash of the wrong theme on load.

## Decisions (user answered)
- Dark palette = derived from the light one: bg = Primary, text = light Background, accent = light Border. Surface, line, muted are derived by me.
  - `--color-ink #0F172A`, `--color-surface #1B2438`, `--color-line #2A3550`, `--color-text #F1F5FF`, `--color-primary #F1F5FF`, `--color-accent #C6D4F3`, `--color-muted #ADB2BF` (70% text over bg).
  - Contrast (computed): text/bg ~16:1, muted/bg ~8.4:1, accent/bg ~12:1.
- Mechanism: `data-theme="dark"` on `<html>` overrides the CSS tokens (all components already use semantic tokens); `color-scheme: dark` for native controls.
- Defaults chosen by me: persist in `localStorage` key `theme`; initial theme from `prefers-color-scheme` when nothing is stored; tiny inline script in `<head>` sets `data-theme` before paint (+ `suppressHydrationWarning` on `<html>`); no-JS = light.
- Toggle state via `useSyncExternalStore` (DOM attribute is the source of truth; server snapshot = light) to avoid hydration mismatch and set-state-in-effect.
- Keep it simple (user just asked for an over-engineering review): no theme context/provider, no "system" third option, no transitions library.

## Constraints
- Strict TDD (vitest; CSS is not unit-testable in jsdom — verify by build + computed contrast). Conventional Commits, no AI attribution. Push only when the user asks.
- Code/comments/tests in English; UI strings in Spanish.
- ~400 authored changed lines per task is a heuristic only.

## Tasks
- [x] U1 — theme mechanism: dark tokens in `app/globals.css`, inline no-flash script + `suppressHydrationWarning` in `app/layout.tsx` (+ `layout.test.tsx`), `components/layout/ThemeToggle.tsx` (+ test), `sun`/`moon` icons in `components/ui/Icon.tsx`. Route: delegated (writer; 2+ non-trivial files).
- [x] U2 — integrate into `components/layout/Nav.tsx` (toggle next to the hamburger, visible on all breakpoints) + Nav test. Route: delegated (writer).

## Acceptance criteria
- A button in the top bar toggles light/dark; state exposed via `aria-pressed`; accessible name in Spanish.
- Choice persists across reloads; first visit follows the OS preference; no visible flash on load.
- `npm test`: only the 4 pre-existing unrelated failures; tsc/lint clean; `npm run build` compiles.

## Progress
- Light theme committed locally as its own commit before starting.

## Verification evidence
- U1 (commit 1ab0b66): RED = layout init-script test, ThemeToggle suite (missing module), Icon shape test; GREEN 77/77 in app+layout+ui; parent added behavior tests for the init script (stored choice, OS preference, garbage, blocked storage) and fixed blocked-storage falling back to light instead of the OS preference (RED->GREEN). Built CSS verified: `:root[data-theme=dark]` present and wins by specificity; utilities resolve via variables.
- U2 (commit 11a7805): RED = 2 Nav tests (no "Modo oscuro" button); GREEN components/layout 22/22. Full suite 197 pass / 4 known unrelated failures; tsc/lint clean; `npm run build` OK.

## Review / delivery log
- Slice (3 commits: 189fcbe light theme, 1ab0b66 dark mechanism, 11a7805 nav toggle; 406 lines, medium) hit slice_budget_reached -> user declined native review for this candidate (declined_this_candidate). Nothing pushed.

## Next step
All done locally on `feat/light-theme`. Awaiting the user's decision to push / open a PR (gh not authenticated).
