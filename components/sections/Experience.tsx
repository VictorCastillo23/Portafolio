"use client";

// Experience section — ARIA tablist with roving tabindex (accessibility
// skill's ARIA tabs pattern) and arrow-key navigation. `content.experience`
// is already chronological DESC with Juventudes at index 0, which is the
// default selected tab per design.

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { content } from "../../data/content";
import { Section } from "../ui/Section";

export function Experience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const navItem = content.nav.find((item) => item.id === "experience")!;
  const baseId = useId();
  const jobCount = content.experience.length;

  function focusTab(index: number) {
    const nextIndex = (index + jobCount) % jobCount;
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(activeIndex - 1);
    }
  }

  return (
    <Section id="experience" index={navItem.index} title={navItem.label}>
      <div
        role="tablist"
        aria-label={navItem.label}
        onKeyDown={handleKeyDown}
        className="flex flex-wrap gap-2 border-b border-line"
      >
        {content.experience.map((job, index) => {
          const isSelected = index === activeIndex;
          return (
            <button
              key={job.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${job.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${job.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              className={`px-4 py-3 font-mono text-sm motion-safe:transition-colors ${
                isSelected ? "border-b-2 border-accent text-accent" : "text-muted hover:text-text"
              }`}
            >
              {job.company}
            </button>
          );
        })}
      </div>

      {content.experience.map((job, index) => (
        <div
          key={job.id}
          role="tabpanel"
          id={`${baseId}-panel-${job.id}`}
          aria-labelledby={`${baseId}-tab-${job.id}`}
          hidden={index !== activeIndex}
          tabIndex={0}
          className="mt-6"
        >
          <h3 className="font-sans text-lg font-bold text-text">
            {job.role} <span className="text-muted">· {job.company}</span>
          </h3>
          <p className="mt-1 font-mono text-xs text-muted">{job.range}</p>
          <ul className="mt-4 space-y-2">
            {job.bullets.map((bullet, bulletIndex) => (
              <li key={bulletIndex} className="flex gap-2 text-sm text-muted">
                <span aria-hidden="true" className="text-accent">
                  ▹
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Section>
  );
}
