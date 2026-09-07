"use client";

// Persistent site nav (design Part 4 + wireframe 1.3, breakpoints 1.6).
//
// - `<md` (768px): logo + hamburger; the inline link list collapses into a
//   toggleable panel.
// - `>=md`: full inline link list, hamburger hidden.
// - Active-link highlighting consumes lib/useActiveSection.ts (Phase 4)
//   against the frozen SECTION_IDS.
// - Smooth-scroll to `#<id>` anchors is handled globally by
//   `html { scroll-behavior: smooth }` in app/globals.css, itself scoped
//   inside `prefers-reduced-motion: no-preference` (design decision 4's
//   pattern). The mobile menu's open transition reuses the same
//   `.animate-rise-in` keyframe for the same reason: it is a no-op under
//   reduced motion instead of a separate rule to maintain.
// - The mobile panel stays mounted (toggled via the `hidden` utility) rather
//   than being conditionally rendered, so `aria-controls` always references
//   an existing element id.

import { useEffect, useRef, useState } from "react";
import { SECTION_IDS, content } from "../../data/content";
import { useActiveSection } from "../../lib/useActiveSection";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const activeId = useActiveSection(SECTION_IDS);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 md:h-20 motion-safe:transition-colors motion-safe:duration-300 ${
        isScrolled ? "bg-surface/95 shadow-sm shadow-line/40" : "bg-transparent"
      }`}
    >
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:h-20"
      >
        <a href="#hero" onClick={closeMenu} className="font-mono text-lg font-bold text-accent">
          {getInitials(content.meta.name)}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {content.nav.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`font-mono text-sm motion-safe:transition-colors ${
                    isActive ? "text-accent" : "text-muted hover:text-text"
                  }`}
                >
                  <span aria-hidden="true">{item.index} </span>
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setIsOpen((previous) => !previous)}
          className="flex h-11 w-11 items-center justify-center text-text md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      <ul
        id="mobile-nav-menu"
        className={
          isOpen
            ? "animate-rise-in flex flex-col gap-1 border-t border-line bg-surface px-6 py-4 md:hidden"
            : "hidden"
        }
      >
        {content.nav.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "page" : undefined}
                onClick={closeMenu}
                className={`block py-2 font-mono text-sm ${isActive ? "text-accent" : "text-muted"}`}
              >
                <span aria-hidden="true">{item.index} </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
