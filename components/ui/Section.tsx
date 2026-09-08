// Numbered section shell (design Part 4 + wireframes 1.3/1.4: "01. Sobre mi
// ----"). Every content section (About, Experience, Credentials, Projects,
// Contact) renders through this so the `<section id>` + heading + rule
// pattern — and its accessible name wiring (aria-labelledby) — only exists in
// one place. `scroll-margin-top` for the fixed nav is handled globally by the
// `section[id]` rule in app/globals.css, so it is not repeated here.

import type { ReactNode } from "react";

interface SectionProps {
  /** Matches a SectionId from data/content.ts (SECTION_IDS, minus "hero"). */
  id: string;
  /** Mono-styled numeric prefix, e.g. "01." — decorative, hidden from AT. */
  index: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, index, title, children, className }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={className}>
      <h2
        id={headingId}
        className="flex items-center gap-4 font-sans text-2xl font-bold text-text sm:text-3xl"
      >
        <span aria-hidden="true" className="font-mono text-lg text-accent sm:text-xl">
          {index}
        </span>
        {title}
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
