// Global daily budget guard (design "Interfaces / Contracts" ->
// lib/rate-limit/budget.ts). Protects the unauthenticated /api/chat endpoint
// from an unbounded Anthropic bill: every request first goes through an
// atomic Upstash counter keyed by the current UTC calendar date.
//
// Pure functions (budgetKey, nextResetEpochSeconds, evaluateBudget) contain
// ALL of the business logic and are fully unit-testable with an injected
// `now: Date` — no I/O, no process.env, no module-level mutable state.
//
// checkAndIncrementBudget() is the ONLY function in this module that talks
// to Upstash. It lazy-instantiates the Redis client INSIDE the function call
// (never at module scope) so that `next build` succeeds even when the
// Upstash env vars are absent — the same rule that will apply to the
// Anthropic client in the route handler.

/** Default daily budget (design). Overridable at request time via env `CHAT_DAILY_BUDGET`. */
export const DEFAULT_DAILY_BUDGET = 200;

export interface BudgetResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

/**
 * Upstash key for the current UTC calendar date, e.g. "chat:budget:2026-09-08".
 * Deliberately keyed by UTC (not local time) so the reset boundary is
 * deterministic regardless of where the server process happens to run.
 */
export function budgetKey(now: Date): string {
  const isoDate = now.toISOString().slice(0, 10);
  return `chat:budget:${isoDate}`;
}

/**
 * Epoch seconds (Unix time) of the NEXT UTC midnight strictly after `now`.
 * Always 24h (or across a month/year boundary) ahead, even when `now` is
 * exactly at midnight already — a key created at 00:00:00.000 UTC still
 * covers that entire UTC day and must expire at the START of the following
 * one, not immediately.
 */
export function nextResetEpochSeconds(now: Date): number {
  const nextMidnightMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.floor(nextMidnightMs / 1000);
}
