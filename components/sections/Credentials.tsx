// Credentials section — own dedicated section, separate from About/Hero, per
// design (WER 2023 award + MICAI 2025 publication + certifications).

import type { Credential } from "../../data/content";
import { content } from "../../data/content";
import { Section } from "../ui/Section";

const KIND_LABEL: Record<Credential["kind"], string> = {
  award: "Premio",
  publication: "Publicación",
  certification: "Certificación",
};

export function Credentials() {
  const navItem = content.nav.find((item) => item.id === "credentials")!;

  return (
    <Section id="credentials" index={navItem.index} title={navItem.label}>
      <ul className="grid gap-6 sm:grid-cols-2">
        {content.credentials.map((credential) => (
          <li key={credential.title} className="rounded-lg border border-line bg-surface p-6">
            <span className="font-mono text-xs uppercase tracking-wide text-accent">
              {KIND_LABEL[credential.kind]}
            </span>
            <h3 className="mt-2 font-sans text-lg font-bold text-text">
              {credential.url ? (
                <a href={credential.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                  {credential.title}
                </a>
              ) : (
                credential.title
              )}
            </h3>
            <p className="mt-1 text-sm text-muted">{credential.issuer}</p>
            <p className="mt-1 font-mono text-xs text-muted">{credential.date}</p>
            {credential.detail ? (
              <p className="mt-3 text-sm text-muted">{credential.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
