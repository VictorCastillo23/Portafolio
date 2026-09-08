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

import { Redis } from "@upstash/redis";

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

/**
 * Pure decision function: given the counter value AFTER incrementing and the
 * effective limit, decides whether the request is allowed. The request that
 * brings the count exactly to the limit is still allowed — it is the one
 * that legitimately exhausts the budget; anything beyond that is rejected.
 * `remaining` never goes negative.
 */
export function evaluateBudget(count: number, limit: number, now: Date): BudgetResult {
  return {
    allowed: count <= limit,
    remaining: Math.max(limit - count, 0),
    resetAt: new Date(nextResetEpochSeconds(now) * 1000).toISOString(),
  };
}

function resolveDailyBudget(): number {
  const raw = process.env.CHAT_DAILY_BUDGET;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_BUDGET;
}

function failClosed(now: Date): BudgetResult {
  return {
    allowed: false,
    remaining: 0,
    resetAt: new Date(nextResetEpochSeconds(now) * 1000).toISOString(),
  };
}

/**
 * The ONLY function in this module that talks to Upstash. Atomically
 * increments today's counter and (re-)sets its expiry in a SINGLE pipelined
 * HTTP round trip — INCR and EXPIREAT are chained onto the same `pipeline()`
 * call, never sent as two separate requests. That matters: if EXPIREAT were
 * only set "on first write" via a separate call, a crash between the two
 * requests would leave an orphaned key that never expires, permanently
 * bricking the budget for that UTC day.
 *
 * Fails CLOSED on any error — a thrown/rejected Upstash call (network
 * failure, missing/invalid env vars, outage) returns `{ allowed: false,
 * remaining: 0, ... }` rather than propagating. This is deliberately
 * asymmetric: fail-open on a public, unauthenticated endpoint risks an
 * unbounded Anthropic bill; fail-closed only risks a temporarily disabled
 * chat widget.
 *
 * The Redis client is constructed INSIDE this function (never at module
 * scope) so that `next build` succeeds even when the Upstash env vars are
 * absent — importing this module must never throw just because the app was
 * built without chat configured.
 */
export async function checkAndIncrementBudget(now: Date = new Date()): Promise<BudgetResult> {
  try {
    const key = budgetKey(now);
    const resetEpoch = nextResetEpochSeconds(now);
    const redis = Redis.fromEnv();
    const [count] = await redis.pipeline().incr(key).expireat(key, resetEpoch).exec<[number, number]>();
    return evaluateBudget(count, resolveDailyBudget(), now);
  } catch {
    return failClosed(now);
  }
}
