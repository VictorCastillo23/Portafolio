import { Redis } from "@upstash/redis";
import { afterEach, describe, expect, it, vi } from "vitest";

import { budgetKey, checkAndIncrementBudget, evaluateBudget, nextResetEpochSeconds } from "./budget";

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: vi.fn() },
}));

describe("budgetKey", () => {
  it("keys by the UTC calendar date", () => {
    expect(budgetKey(new Date("2026-09-08T14:30:00.000Z"))).toBe("chat:budget:2026-09-08");
  });

  it("uses the UTC date even when the local wall-clock date would differ", () => {
    // 23:59:59 UTC on the 8th is still the 8th in UTC terms, regardless of
    // what timezone the process happens to be running in.
    expect(budgetKey(new Date("2026-09-08T23:59:59.999Z"))).toBe("chat:budget:2026-09-08");
  });

  it("rolls over at the UTC date boundary", () => {
    expect(budgetKey(new Date("2026-09-09T00:00:00.000Z"))).toBe("chat:budget:2026-09-09");
  });

  it("pads single-digit UTC months and days", () => {
    expect(budgetKey(new Date("2026-01-05T00:00:00.000Z"))).toBe("chat:budget:2026-01-05");
  });
});

describe("nextResetEpochSeconds", () => {
  it("returns the epoch seconds of the next UTC midnight", () => {
    const now = new Date("2026-09-08T14:30:00.000Z");
    const expected = Date.UTC(2026, 8, 9, 0, 0, 0, 0) / 1000;
    expect(nextResetEpochSeconds(now)).toBe(expected);
  });

  it("still targets the FOLLOWING midnight when now is exactly at midnight", () => {
    // A key created at exactly 00:00:00.000 UTC covers that whole UTC day,
    // so its reset must be 24h later, not "now" itself.
    const now = new Date("2026-09-08T00:00:00.000Z");
    const expected = Date.UTC(2026, 8, 9, 0, 0, 0, 0) / 1000;
    expect(nextResetEpochSeconds(now)).toBe(expected);
  });

  it("rolls over correctly across a month boundary", () => {
    const now = new Date("2026-01-31T23:59:59.999Z");
    const expected = Date.UTC(2026, 1, 1, 0, 0, 0, 0) / 1000;
    expect(nextResetEpochSeconds(now)).toBe(expected);
  });

  it("rolls over correctly across a year boundary", () => {
    const now = new Date("2026-12-31T12:00:00.000Z");
    const expected = Date.UTC(2027, 0, 1, 0, 0, 0, 0) / 1000;
    expect(nextResetEpochSeconds(now)).toBe(expected);
  });
});

describe("evaluateBudget", () => {
  const now = new Date("2026-09-08T14:30:00.000Z");
  const expectedResetAt = new Date(Date.UTC(2026, 8, 9, 0, 0, 0, 0)).toISOString();

  it("allows the request and reports remaining budget when count is under the limit", () => {
    expect(evaluateBudget(50, 200, now)).toEqual({
      allowed: true,
      remaining: 150,
      resetAt: expectedResetAt,
    });
  });

  it("still allows the request that brings the count exactly to the limit, with zero remaining", () => {
    expect(evaluateBudget(200, 200, now)).toEqual({
      allowed: true,
      remaining: 0,
      resetAt: expectedResetAt,
    });
  });

  it("rejects the request once count exceeds the limit, remaining clamped at zero", () => {
    expect(evaluateBudget(201, 200, now)).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: expectedResetAt,
    });
  });

  it("clamps remaining at zero for counts far beyond the limit, not a negative number", () => {
    const result = evaluateBudget(500, 200, now);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe("checkAndIncrementBudget", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  function mockPipeline(execResult: unknown) {
    const pipeline = {
      incr: vi.fn().mockReturnThis(),
      expireat: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(execResult),
    };
    vi.mocked(Redis.fromEnv).mockReturnValue({
      pipeline: vi.fn().mockReturnValue(pipeline),
    } as unknown as Redis);
    return pipeline;
  }

  it("increments and expires the same UTC-date key in one pipeline call", async () => {
    const pipeline = mockPipeline([42, 1]);
    const now = new Date("2026-09-08T14:30:00.000Z");

    await checkAndIncrementBudget(now);

    expect(pipeline.incr).toHaveBeenCalledWith("chat:budget:2026-09-08");
    expect(pipeline.expireat).toHaveBeenCalledWith(
      "chat:budget:2026-09-08",
      nextResetEpochSeconds(now),
    );
    // EXPIREAT is chained onto the SAME pipeline as INCR (one exec, one HTTP
    // round trip) -- never a second, separate call that could be skipped by
    // a crash between the two.
    expect(pipeline.exec).toHaveBeenCalledTimes(1);
  });

  it("allows the request and reports remaining budget when the incremented count is under the limit", async () => {
    mockPipeline([50, 1]);
    vi.stubEnv("CHAT_DAILY_BUDGET", "200");
    const now = new Date("2026-09-08T14:30:00.000Z");

    const result = await checkAndIncrementBudget(now);

    expect(result).toEqual({
      allowed: true,
      remaining: 150,
      resetAt: new Date(nextResetEpochSeconds(now) * 1000).toISOString(),
    });
  });

  it("rejects once the incremented count exceeds the configured daily budget", async () => {
    mockPipeline([201, 1]);
    vi.stubEnv("CHAT_DAILY_BUDGET", "200");
    const now = new Date("2026-09-08T14:30:00.000Z");

    const result = await checkAndIncrementBudget(now);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("falls back to the default daily budget when CHAT_DAILY_BUDGET is unset", async () => {
    mockPipeline([199, 1]);
    vi.stubEnv("CHAT_DAILY_BUDGET", "");

    const result = await checkAndIncrementBudget(new Date("2026-09-08T14:30:00.000Z"));

    expect(result).toMatchObject({ allowed: true, remaining: 1 }); // default is 200
  });

  it("ignores a non-numeric CHAT_DAILY_BUDGET and falls back to the default", async () => {
    mockPipeline([199, 1]);
    vi.stubEnv("CHAT_DAILY_BUDGET", "not-a-number");

    const result = await checkAndIncrementBudget(new Date("2026-09-08T14:30:00.000Z"));

    expect(result).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("fails CLOSED (denies the request, zero remaining) when the Upstash pipeline rejects", async () => {
    vi.mocked(Redis.fromEnv).mockReturnValue({
      pipeline: vi.fn().mockReturnValue({
        incr: vi.fn().mockReturnThis(),
        expireat: vi.fn().mockReturnThis(),
        exec: vi.fn().mockRejectedValue(new Error("upstash unreachable")),
      }),
    } as unknown as Redis);
    const now = new Date("2026-09-08T14:30:00.000Z");

    const result = await checkAndIncrementBudget(now);

    expect(result).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: new Date(nextResetEpochSeconds(now) * 1000).toISOString(),
    });
  });

  it("fails CLOSED when constructing the Redis client itself throws (e.g. missing env vars)", async () => {
    vi.mocked(Redis.fromEnv).mockImplementation(() => {
      throw new Error("UPSTASH_REDIS_REST_URL is not set");
    });
    const now = new Date("2026-09-08T14:30:00.000Z");

    const result = await checkAndIncrementBudget(now);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("defaults `now` to the current time when not provided", async () => {
    mockPipeline([1, 1]);

    const result = await checkAndIncrementBudget();

    expect(result.allowed).toBe(true);
  });
});
