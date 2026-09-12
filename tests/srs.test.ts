import { describe, expect, it } from "vitest";

import {
  SRS,
  applyCramAnswer,
  describeInterval,
  initialCardState,
  isCramComplete,
  isStruggling,
  schedule,
  startCram,
  type CardState,
  type Rating,
} from "@/lib/srs/scheduler";

const NOW = new Date("2026-08-25T12:00:00.000Z");

const rate = (state: CardState, rating: Rating, recent: Rating[] = []) =>
  schedule({ state, rating, recentRatings: recent, now: NOW });

describe("base intervals match the specification", () => {
  it("schedules a first 'don't know' at roughly a day", () => {
    const result = rate(initialCardState(), "DONT_KNOW");
    expect(result.state.intervalHours).toBeLessThan(SRS.base.DONT_KNOW);
    expect(result.state.intervalHours).toBeGreaterThanOrEqual(SRS.minIntervalHours);
  });

  it("schedules a first 'partially know' at roughly two days", () => {
    expect(rate(initialCardState(), "PARTIAL").state.intervalHours).toBeCloseTo(45.6, 1);
  });

  it("schedules a first 'know' at roughly five days or more", () => {
    expect(rate(initialCardState(), "KNOW").state.intervalHours).toBeGreaterThanOrEqual(
      SRS.base.KNOW,
    );
  });
});

describe("the schedule adapts to performance", () => {
  it("stretches further out with every consecutive 'know'", () => {
    let state = initialCardState();
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      const result = rate(state, "KNOW");
      state = result.state;
      intervals.push(result.state.intervalHours);
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]!).toBeGreaterThan(intervals[i - 1]!);
    }
    expect(intervals.at(-1)!).toBeGreaterThan(24 * 20);
  });

  it("pulls a repeatedly failed card down to the 12 hour floor", () => {
    let state = initialCardState();
    const history: Rating[] = [];
    let last = 0;

    for (let i = 0; i < 4; i++) {
      const result = rate(state, "DONT_KNOW", [...history]);
      state = result.state;
      history.unshift("DONT_KNOW");
      last = result.state.intervalHours;
    }

    expect(last).toBe(SRS.minIntervalHours);
    expect(state.lapses).toBe(4);
  });

  it("never schedules anything below the floor or above the ceiling", () => {
    let state = initialCardState();
    for (let i = 0; i < 30; i++) {
      const rating: Rating = i % 3 === 0 ? "DONT_KNOW" : "KNOW";
      const result = rate(state, rating);
      state = result.state;
      expect(result.state.intervalHours).toBeGreaterThanOrEqual(SRS.minIntervalHours);
      expect(result.state.intervalHours).toBeLessThanOrEqual(SRS.maxIntervalHours);
    }
  });
});

describe("the struggle detector", () => {
  it("fires on three failures in the last four reviews", () => {
    expect(isStruggling("DONT_KNOW", ["DONT_KNOW", "DONT_KNOW"])).toBe(true);
  });

  it("does not fire on two", () => {
    expect(isStruggling("DONT_KNOW", ["DONT_KNOW", "KNOW"])).toBe(false);
  });

  it("ignores failures outside the window", () => {
    expect(
      isStruggling("DONT_KNOW", ["KNOW", "KNOW", "DONT_KNOW", "DONT_KNOW", "DONT_KNOW"]),
    ).toBe(false);
  });

  it("does not punish a correct answer by pinning it to the floor", () => {
    let state = initialCardState();
    const history: Rating[] = [];
    for (let i = 0; i < 3; i++) {
      state = rate(state, "DONT_KNOW", [...history]).state;
      history.unshift("DONT_KNOW");
    }

    const recovered = rate(state, "KNOW", history);
    expect(recovered.state.intervalHours).toBeGreaterThan(SRS.minIntervalHours);
    // ...but a depressed ease still keeps it short of a full five days.
    expect(recovered.state.intervalHours).toBeLessThan(SRS.base.KNOW);
  });
});

describe("interval descriptions", () => {
  it.each([
    [12, "12 hours"],
    [24, "1 day"],
    [144, "6 days"],
  ])("describes %i hours as %s", (hours, text) => {
    expect(describeInterval(hours)).toBe(text);
  });
});

describe("cram mode piles", () => {
  it("starts with everything unknown", () => {
    const piles = startCram(["a", "b", "c"]);
    expect(piles.unknown).toEqual(["a", "b", "c"]);
    expect(piles.known).toEqual([]);
  });

  it("moves a known card into the known pile", () => {
    const piles = applyCramAnswer(startCram(["a", "b"]), "a", true);
    expect(piles.known).toEqual(["a"]);
    expect(piles.unknown).toEqual(["b"]);
  });

  it("sends an unknown card to the back of the pile", () => {
    const piles = applyCramAnswer(startCram(["a", "b", "c"]), "a", false);
    expect(piles.unknown).toEqual(["b", "c", "a"]);
  });

  it("is only complete when the unknown pile is empty", () => {
    let piles = startCram(["a", "b"]);
    expect(isCramComplete(piles)).toBe(false);
    piles = applyCramAnswer(piles, "a", true);
    expect(isCramComplete(piles)).toBe(false);
    piles = applyCramAnswer(piles, "b", true);
    expect(isCramComplete(piles)).toBe(true);
  });

  it("ignores an answer for a card that is not in the unknown pile", () => {
    const piles = applyCramAnswer(startCram(["a"]), "zzz", true);
    expect(piles.unknown).toEqual(["a"]);
    expect(piles.known).toEqual([]);
  });

  it("always terminates — a card answered wrong forever stays in the pile", () => {
    let piles = startCram(["a", "b", "c"]);
    for (let i = 0; i < 20 && !isCramComplete(piles); i++) {
      const next = piles.unknown[0]!;
      piles = applyCramAnswer(piles, next, i > 10);
    }
    expect(isCramComplete(piles)).toBe(true);
    expect(piles.known).toHaveLength(3);
  });
});
