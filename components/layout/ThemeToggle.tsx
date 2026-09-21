"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "../ui/Icon";

// The `data-theme` attribute on <html> is the single source of truth: the
// inline script in app/layout.tsx sets it before first paint, and this module
// only reads and flips it. `useSyncExternalStore` keeps the button in sync
// without a context, an effect or a hydration mismatch (the server snapshot is
// always "light").

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function toggleTheme() {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage can be blocked (private mode, disabled cookies): the toggle
    // still works for this visit, the choice just is not remembered.
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label="Modo oscuro"
      onClick={toggleTheme}
      className="flex h-11 w-11 items-center justify-center text-text motion-safe:transition-colors hover:text-accent"
    >
      <Icon name={isDark ? "sun" : "moon"} className="h-6 w-6" />
    </button>
  );
}
