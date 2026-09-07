import "@testing-library/jest-dom/vitest";
import { axe } from "vitest-axe";
import * as axeMatchers from "vitest-axe/matchers";
// `vitest-axe`'s package-root `matchers.d.ts` re-exports everything via
// `export type *`, which erases `toHaveNoViolations` to a type-only binding
// (fine for `expect.extend(axeMatchers)` below, which only needs the runtime
// values — TS's structural check for that call is permissive enough not to
// need the export to be value-typed). Calling the function directly needs
// its VALUE typing, which only the untouched `dist/matchers.d.ts` provides.
import { toHaveNoViolations } from "vitest-axe/dist/matchers.js";
import { afterEach, expect, vi } from "vitest";

expect.extend(axeMatchers);

/**
 * Runs an axe accessibility scan and fails the test with the violation
 * report if any are found.
 *
 * `vitest-axe@0.1.0` types its `toHaveNoViolations()` matcher for
 * `expect(...).toHaveNoViolations()` against the pre-Vitest-5
 * `declare global { namespace Vi { ... } } }` augmentation shape. Vitest 5
 * moved matcher typing to `declare module "vitest" { interface Assertion<R,
 * T> ... } }`, and its own two internal `.d.ts` chunks already disagree with
 * each other on that interface's type-parameter constraints/defaults
 * (tolerated between them only because `skipLibCheck` skips re-validating
 * `.d.ts`-to-`.d.ts` consistency) — so re-declaring the augmentation in a
 * checked `.ts` file here cannot satisfy every existing declaration's arity
 * at once (tried multiple signatures; always TS2428). Calling the matcher
 * function directly sidesteps `expect(...)`'s type entirely and needs no
 * `any`/module augmentation.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe(container);
  const { pass, message } = toHaveNoViolations(results);
  if (!pass) {
    throw new Error(message());
  }
}

/**
 * jsdom does not implement IntersectionObserver. This mock is shared by any
 * test that needs one (notably lib/useActiveSection.ts's TDD suite): it
 * records every constructed instance in `mockIntersectionObservers` so a
 * test can grab the latest instance, inspect what it observed, and manually
 * invoke `.callback(entries, observer)` inside `act()` to simulate the
 * browser firing intersection changes.
 */
export const mockIntersectionObservers: MockIntersectionObserver[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  readonly callback: IntersectionObserverCallback;
  readonly options?: IntersectionObserverInit;
  observedElements: Element[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    mockIntersectionObservers.push(this);
  }

  observe = vi.fn((element: Element) => {
    this.observedElements.push(element);
  });

  unobserve = vi.fn((element: Element) => {
    this.observedElements = this.observedElements.filter((el) => el !== element);
  });

  disconnect = vi.fn(() => {
    this.observedElements = [];
  });

  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

afterEach(() => {
  mockIntersectionObservers.length = 0;
  vi.restoreAllMocks();
});
