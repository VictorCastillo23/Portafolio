import "@testing-library/jest-dom/vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { afterEach, expect, vi } from "vitest";

expect.extend(axeMatchers);

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
