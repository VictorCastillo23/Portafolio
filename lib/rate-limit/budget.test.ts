import { describe, expect, it } from "vitest";

import { budgetKey, nextResetEpochSeconds } from "./budget";

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
