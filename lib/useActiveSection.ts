"use client";

// Scroll-spy hook for Nav highlighting (design Part 5, Part 8).
//
// A single IntersectionObserver watches every section id's DOM element with
// a narrow `rootMargin` band in the viewport's upper-middle — this removes
// the "two sections visible, which wins?" ambiguity instead of trying to
// resolve it after the fact. A `Map<string, boolean>` tracks the last known
// intersection state per id across observer callbacks (the observer only
// reports entries that changed, not every observed element on each fire).
// The active id is always the first id in `sectionIds` order that is
// currently intersecting, so ties resolve deterministically by document
// order rather than by which one fired last.

import { useEffect, useState } from "react";

// Narrow band in the viewport's upper-middle: an element only counts as
// "active" once it crosses this band, not merely on-screen anywhere.
const ROOT_MARGIN = "-45% 0px -50% 0px";

export function useActiveSection(sectionIds: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      // SSR / environments without the API: no scroll-spy, but never throw.
      return;
    }

    const intersecting = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(entry.target.id, entry.isIntersecting);
        }

        const nextActiveId = sectionIds.find((id) => intersecting.get(id) === true);

        // If nothing is intersecting in this batch, retain the previous
        // active id instead of flickering back to null.
        if (nextActiveId !== undefined) {
          setActiveId(nextActiveId);
        }
      },
      { threshold: 0, rootMargin: ROOT_MARGIN },
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return activeId;
}
