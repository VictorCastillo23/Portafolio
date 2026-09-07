// Fixed right rail: vertical mailto link (design Part 4, wireframe 1.3,
// breakpoint 1.6: xl/1280px threshold). Server component. Only visible at
// `xl+` — below that, Contact's mailto CTA (always rendered, every
// breakpoint) is the reachable path to the same email address, so no content
// is lost when this sidebar is hidden.

import { content } from "../../data/content";

export function EmailSidebar() {
  return (
    <div className="fixed inset-y-0 right-0 z-40 hidden w-16 flex-col items-center justify-end pb-8 xl:flex">
      <a
        href={`mailto:${content.contact.email}`}
        className="font-mono text-xs tracking-wide text-muted [writing-mode:vertical-rl] motion-safe:transition-colors hover:text-accent"
      >
        {content.contact.email}
      </a>
      <span aria-hidden="true" className="mt-6 h-24 w-px bg-line" />
    </div>
  );
}
