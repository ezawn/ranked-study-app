import { describe, expect, it } from "vitest";

import { addDays, dayKey, daysBetween, hoursBetween, isDayKey, previousDay } from "@/lib/time/day";
import { effectiveStreak } from "@/lib/coins/decisions";

/**
 * Day boundaries decide when streaks break and when daily limits reset, so
 * getting them wrong in the wrong timezone would silently rob people of
 * streaks. These are worth pinning down.
 */

describe("day keys respect the user's timezone", () => {
  it("rolls over at local midnight, not UTC midnight", () => {
    const instant = new Date("2026-08-25T23:30:00Z");
    expect(dayKey(instant, "Europe/London")).toBe("2026-08-26"); // BST, UTC+1
    expect(dayKey(instant, "America/New_York")).toBe("2026-08-25"); // EDT, UTC-4
    expect(dayKey(instant, "Asia/Tokyo")).toBe("2026-08-26");
  });

  it("handles the far side of the date line", () => {
    const instant = new Date("2026-08-25T13:00:00Z");
    expect(dayKey(instant, "Pacific/Auckland")).toBe("2026-08-26");
    expect(dayKey(instant, "America/Los_Angeles")).toBe("2026-08-25");
  });

  it("falls back to UTC rather than throwing on a bad timezone", () => {
    expect(dayKey(new Date("2026-08-25T10:00:00Z"), "Nowhere/Fictional")).toBe("2026-08-25");
  });

  it("produces well-formed keys", () => {
    expect(isDayKey(dayKey(new Date(), "Europe/London"))).toBe(true);
    expect(isDayKey("2026-8-1")).toBe(false);
    expect(isDayKey("not a date")).toBe(false);
  });
});

describe("calendar arithmetic", () => {
  it("counts whole days between keys", () => {
    expect(daysBetween("2026-08-24", "2026-08-25")).toBe(1);
    expect(daysBetween("2026-08-25", "2026-08-25")).toBe(0);
    expect(daysBetween("2026-08-25", "2026-08-24")).toBe(-1);
  });

  it("crosses month and year boundaries", () => {
    expect(daysBetween("2026-07-31", "2026-08-01")).toBe(1);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("is not thrown off by daylight saving", () => {
    // The UK clocks go back on 25 October 2026 — that day is 25 hours long.
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });

  it("measures hours between instants", () => {
    expect(
      hoursBetween(new Date("2026-08-25T00:00:00Z"), new Date("2026-08-25T12:00:00Z")),
    ).toBe(12);
  });
});

describe("a streak shows as broken the moment a day is missed", () => {
  it("keeps the streak on the day it was played", () => {
    expect(effectiveStreak(9, "2026-08-25", "2026-08-25")).toBe(9);
  });

  it("keeps the streak the day after, before today's attempt", () => {
    expect(effectiveStreak(9, "2026-08-24", "2026-08-25")).toBe(9);
  });

  it("shows zero once a whole day has been missed", () => {
    expect(effectiveStreak(9, "2026-08-23", "2026-08-25")).toBe(0);
  });

  it("shows zero for someone who has never played", () => {
    expect(effectiveStreak(0, null, "2026-08-25")).toBe(0);
  });
});
