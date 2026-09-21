// Hero section (design Part 1.3 wireframe A, Part 2 decisions 2-4).
//
// Server Component — the entrance sequence is pure CSS (`riseIn` keyframe +
// staggered `.animate-rise-in-N` delay classes, both defined in
// app/globals.css), so no client JS is needed here. This refines the
// proposal's "Nav and Hero are the only client components" (decision 2).
// Steps 1-5 of the design's Step/Delay table live in this component's own
// elements (eyebrow/name/tagline/blurb/cta); step 0 (Nav) and step 6
// (sidebars) belong to their own already-shipped components. Every animated
// element is fully visible by default — the stagger classes only exist
// inside `@media (prefers-reduced-motion: no-preference)`, so reduced-motion
// users see the finished layout immediately instead of a blank hero.

import Image from "next/image";

import { content } from "../../data/content";

export function Hero() {
  const { eyebrow, title, tagline, blurb, cta } = content.hero;

  return (
    <section
      id="hero"
      className="flex min-h-screen flex-col justify-center px-6 sm:px-12 lg:px-24"
    >
      <Image
        src="/profile.png"
        alt="Victor Castillo"
        width={128}
        height={128}
        priority
        className="animate-rise-in-100 mb-8 h-28 w-28 rounded-full object-cover sm:h-32 sm:w-32"
      />
      <p className="animate-rise-in-100 font-mono text-sm text-accent sm:text-base">{eyebrow}</p>
      <h1 className="animate-rise-in-200 mt-4 font-sans text-4xl font-extrabold text-text sm:text-6xl">
        {title}
      </h1>
      <h2 className="animate-rise-in-300 mt-2 max-w-2xl font-sans text-2xl font-bold text-muted sm:text-4xl">
        {tagline}
      </h2>
      <p className="animate-rise-in-400 mt-6 max-w-xl text-base text-muted sm:text-lg">{blurb}</p>
      <div className="mt-10 flex flex-wrap gap-4">
        <a
          href={cta.href}
          className="animate-rise-in-500 inline-flex w-fit items-center rounded-md border border-accent px-6 py-3 font-mono text-sm text-accent motion-safe:transition-colors hover:bg-accent hover:text-ink"
        >
          {cta.label}
        </a>
        <a
          href="/victor_cv.pdf"
          download
          className="animate-rise-in-500 inline-flex w-fit items-center rounded-md border border-accent px-6 py-3 font-mono text-sm text-accent motion-safe:transition-colors hover:bg-accent hover:text-ink"
        >
          Descargar CV
        </a>
      </div>
    </section>
  );
}
