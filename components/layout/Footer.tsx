// Mobile/tablet fallback for SocialSidebar's links (design Part 4, breakpoint
// 1.6: xl/1280px threshold). `xl:hidden` — the exact complement of
// SocialSidebar's `hidden xl:flex`, so no viewport ever exposes both copies
// of the same links. Server component.

import { content } from "../../data/content";
import { Icon } from "../ui/Icon";

export function Footer() {
  return (
    <footer className="border-t border-line px-6 py-10 xl:hidden">
      <ul className="flex items-center justify-center gap-6">
        {content.socials.map((social) => (
          <li key={social.name}>
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer"
              aria-label={social.name}
              className="text-muted motion-safe:transition-colors hover:text-accent"
            >
              <Icon name={social.icon} className="h-5 w-5" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center font-mono text-xs text-muted">{content.footer.text}</p>
    </footer>
  );
}
