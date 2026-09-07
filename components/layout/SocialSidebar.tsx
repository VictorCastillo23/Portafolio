// Fixed left rail of social links (design Part 4, wireframe 1.3, breakpoint
// 1.6: xl/1280px threshold). Server component — no interactivity. Only
// visible at `xl+`; `Footer.tsx` renders the same links (`xl:hidden`) so no
// viewport ever exposes both, per the design's locked breakpoint rule.

import { content } from "../../data/content";
import { Icon } from "../ui/Icon";

export function SocialSidebar() {
  return (
    <div className="fixed inset-y-0 left-0 z-40 hidden w-16 flex-col items-center justify-end pb-8 xl:flex">
      <ul className="flex flex-col items-center gap-6">
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
      <span aria-hidden="true" className="mt-6 h-24 w-px bg-line" />
    </div>
  );
}
