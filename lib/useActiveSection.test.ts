// TDD suite for the scroll-spy hook (design Part 5, Part 8). Drives the
// shared jsdom IntersectionObserver mock (vitest.setup.ts) directly so each
// test can simulate the browser firing intersection changes without a real
// viewport.

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockIntersectionObservers } from "../vitest.setup";
import { useActiveSection } from "./useActiveSection";

const TEST_SECTION_IDS = ["hero", "about", "experience"] as const;

function appendSection(id: string): HTMLElement {
  const element = document.createElement("section");
  element.id = id;
  document.body.appendChild(element);
  return element;
}

function latestObserver() {
  const observer = mockIntersectionObservers[mockIntersectionObservers.length - 1];
  if (!observer) {
    throw new Error("No IntersectionObserver instance was constructed.");
  }
  return observer;
}

function fireIntersection(entries: Array<{ target: Element; isIntersecting: boolean }>) {
  const observer = latestObserver();
  act(() => {
    observer.callback(entries as IntersectionObserverEntry[], observer);
  });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useActiveSection", () => {
  it("returns null before any intersection fires, and observes with the design's threshold/rootMargin", () => {
    appendSection("hero");
    appendSection("about");

    const { result } = renderHook(() => useActiveSection(TEST_SECTION_IDS));

    expect(result.current).toBeNull();
    expect(latestObserver().options).toEqual({
      threshold: 0,
      rootMargin: "-45% 0px -50% 0px",
    });
  });

  it("returns the id of the single intersecting section", () => {
    const heroEl = appendSection("hero");
    appendSection("about");

    const { result } = renderHook(() => useActiveSection(TEST_SECTION_IDS));
    fireIntersection([{ target: heroEl, isIntersecting: true }]);

    expect(result.current).toBe("hero");
  });

  it("picks the first id in sectionIds order when multiple sections intersect simultaneously", () => {
    const heroEl = appendSection("hero");
    const aboutEl = appendSection("about");
    const experienceEl = appendSection("experience");

    const { result } = renderHook(() => useActiveSection(TEST_SECTION_IDS));

    fireIntersection([
      { target: experienceEl, isIntersecting: true },
      { target: aboutEl, isIntersecting: true },
    ]);
    expect(result.current).toBe("about");

    fireIntersection([{ target: heroEl, isIntersecting: true }]);
    expect(result.current).toBe("hero");
  });

  it("retains the last active id when the intersecting set becomes empty (no flicker to null)", () => {
    const heroEl = appendSection("hero");

    const { result } = renderHook(() => useActiveSection(TEST_SECTION_IDS));
    fireIntersection([{ target: heroEl, isIntersecting: true }]);
    expect(result.current).toBe("hero");

    fireIntersection([{ target: heroEl, isIntersecting: false }]);
    expect(result.current).toBe("hero");
  });

  it("disconnects the observer exactly once on unmount", () => {
    appendSection("hero");

    const { unmount } = renderHook(() => useActiveSection(TEST_SECTION_IDS));
    const observer = latestObserver();

    unmount();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("skips ids with no matching DOM element without throwing", () => {
    appendSection("hero"); // "about" and "experience" are intentionally absent from the DOM

    expect(() => renderHook(() => useActiveSection(TEST_SECTION_IDS))).not.toThrow();
    expect(latestObserver().observe).toHaveBeenCalledTimes(1);
  });

  it("guards against a missing IntersectionObserver (SSR) — returns null, constructs no observer", () => {
    // vi.restoreAllMocks() (vitest.setup.ts's afterEach) does not undo
    // vi.stubGlobal, so this test restores the shared mock itself — leaving
    // it stubbed away would break every later test file that relies on it.
    const sharedMockObserver = globalThis.IntersectionObserver;
    vi.stubGlobal("IntersectionObserver", undefined);
    appendSection("hero");
    const observersBefore = mockIntersectionObservers.length;

    try {
      const { result } = renderHook(() => useActiveSection(TEST_SECTION_IDS));

      expect(result.current).toBeNull();
      expect(mockIntersectionObservers.length).toBe(observersBefore);
    } finally {
      vi.stubGlobal("IntersectionObserver", sharedMockObserver);
    }
  });
});
