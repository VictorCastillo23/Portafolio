// About section (design Part 4 file table: "profile paragraphs + skills +
// education"). Index/title come from `content.nav` rather than being
// hardcoded, so this can never drift from Nav's own labels.

import { content } from "../../data/content";
import { Section } from "../ui/Section";

export function About() {
  const navItem = content.nav.find((item) => item.id === "about")!;
  const { paragraphs, skills, education } = content.about;

  return (
    <Section id="about" index={navItem.index} title={navItem.label}>
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 text-muted">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div>
          <h3 className="font-mono text-sm text-accent">Stack</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li
                key={skill}
                className="rounded border border-line px-2 py-1 font-mono text-xs text-muted"
              >
                {skill}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 font-mono text-sm text-accent">Educación</h3>
          <p className="mt-3 font-sans text-sm font-bold text-text">{education.degree}</p>
          <p className="text-sm text-muted">{education.school}</p>
          <p className="font-mono text-xs text-muted">{education.range}</p>
          <p className="mt-2 text-sm text-muted">{education.detail}</p>
        </div>
      </div>
    </Section>
  );
}
