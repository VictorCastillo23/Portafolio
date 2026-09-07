// Contact section — mailto: only CTA, no <form> (spec: project-showcase /
// contact requirements). Renders GitHub/LinkedIn from content.socials and
// the phone number alongside the email, per the design's amendment 2.

import { content } from "../../data/content";
import { Section } from "../ui/Section";
import { Icon } from "../ui/Icon";

export function Contact() {
  const navItem = content.nav.find((item) => item.id === "contact")!;
  const { eyebrow, title, blurb, email, phone } = content.contact;

  return (
    <Section id="contact" index={navItem.index} title={navItem.label}>
      <div className="mx-auto max-w-xl text-center">
        <p className="font-mono text-sm text-accent">{eyebrow}</p>
        <h3 className="mt-2 font-sans text-3xl font-bold text-text">{title}</h3>
        <p className="mt-4 text-muted">{blurb}</p>

        <a
          href={`mailto:${email}`}
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-accent px-6 py-3 font-mono text-sm text-accent motion-safe:transition-colors hover:bg-accent hover:text-ink"
        >
          <Icon name="mail" className="h-4 w-4" />
          {email}
        </a>

        <p className="mt-4 font-mono text-sm text-muted">{phone}</p>

        <ul className="mt-8 flex items-center justify-center gap-6">
          {content.socials.map((social) => (
            <li key={social.name}>
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                className="text-muted motion-safe:transition-colors hover:text-accent"
              >
                <Icon name={social.icon} className="h-6 w-6" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
