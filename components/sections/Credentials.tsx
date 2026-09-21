// Credentials section — own dedicated section, separate from About/Hero, per
// design (WER 2023 award + MICAI 2025 publication + certifications).

import type { Credential } from "../../data/content";
import { content } from "../../data/content";
import { Section } from "../ui/Section";

const KIND_LABEL: Record<Credential["kind"], string> = {
  award: "Premio",
  publication: "Publicación",
  certification: "Certificación",
  rutaAprendizaje:"Ruta de Aprendizaje",
};

export function Credentials() {
  const navItem = content.nav.find((item) => item.id === "credentials")!;

  return (
    <Section id="credentials" index={navItem.index} title={navItem.label}>
      <ul className="grid gap-6 sm:grid-cols-2">
        {content.credentials.map((credential) => (
          <li
            key={credential.title}
            className={`rounded-lg border border-line bg-surface p-6${
              credential.url
                ? " group relative motion-safe:transition-colors hover:border-accent focus-within:border-accent"
                : ""
            }`}
          >
            <span className="text-xs uppercase tracking-wide text-accent">
              {KIND_LABEL[credential.kind]}
            </span>
            <h3 className="mt-2 font-heading text-lg font-bold text-primary">
              {credential.url ? (
                // Stretched link: ::after covers the whole card, so a click
                // anywhere on it opens the url without nesting interactive
                // elements or wrapping the card's text in a giant link name.
                <a
                  href={credential.url}
                  target="_blank"
                  rel="noreferrer"
                  className="after:absolute after:inset-0 after:content-[''] motion-safe:transition-colors group-hover:text-accent focus-visible:text-accent"
                >
                  {credential.title}
                </a>
              ) : (
                credential.title
              )}
            </h3>
            <p className="mt-1 text-sm text-muted">{credential.issuer}</p>
            <p className="mt-1 text-xs text-muted">{credential.date}</p>
            {credential.detail ? (
              <p className="mt-3 text-sm text-muted">{credential.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
