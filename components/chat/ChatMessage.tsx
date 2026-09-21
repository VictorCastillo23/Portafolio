// Presentational chat message bubble (design "Widget Shape"; tasks 6.3).
// Pure render of a single `ChatUIMessage` — no state, no fetch, so it is
// tested with render + accessibility smoke checks rather than exhaustive
// TDD unit specs (same convention as the other presentational components in
// this repo, e.g. ProjectCard).
//
// Live-region announcement technique: the parent `<ul>` in ChatWidget is
// `aria-live="polite"`. If the answer paragraph stayed in the accessible
// tree while its text grew delta-by-delta, a screen reader would announce
// every partial sentence. Instead the paragraph is `aria-hidden="true"`
// (excluded from the accessibility tree, so DOM mutations inside it are
// never announced) for as long as `message.streaming` is true, and only
// loses `aria-hidden` once the message is done — one accessible-tree
// insertion, one announcement, holding the final text. The visible text
// still grows in real time for sighted users throughout.

import type { ReactNode } from "react";
import type { ChatUIMessage } from "./useChatStream";

interface ChatMessageProps {
  message: ChatUIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAwaitingFirstDelta = !isUser && message.streaming && message.content.length === 0;
  const renderedContent = isUser ? message.content : renderInlineMarkdown(message.content);

  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
          isUser ? "bg-accent text-ink" : "border border-line bg-surface text-text"
        }`}
      >
        {isAwaitingFirstDelta ? (
          <span aria-hidden="true" className="flex items-center gap-1 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-pulse [animation-delay:300ms]" />
          </span>
        ) : (
          <p
            aria-hidden={!isUser && message.streaming ? "true" : undefined}
            className="whitespace-pre-wrap"
          >
            {renderedContent}
          </p>
        )}
      </div>
    </li>
  );
}

function renderInlineMarkdown(content: string): ReactNode[] {
  const parts = content.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>,
  );
}
