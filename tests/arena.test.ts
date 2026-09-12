import { describe, expect, it } from "vitest";

import {
  RANKS,
  STARTING_ELO,
  rankForElo,
  rankProgress,
  rankDistance,
  nextRank,
  higherRank,
} from "@/lib/arena/ranks";
import { applyElo, applyMatchElo, expectedScore, kFactor } from "@/lib/arena/elo";
import {
  scoreBattle,
  decideWinner,
  tempoMultiplier,
  BATTLE_PACE,
  DEFAULT_EXPECTED_SECONDS,
  battleCoins,
  type ScoredAnswer,
} from "@/lib/arena/scoring";
import { rankWindowFor, pickOpponent, type Candidate } from "@/lib/arena/matchmaking";
import { seededShuffle, seedFrom, dealOptions, isAnswerCorrect } from "@/lib/arena/pool";
import { revealDelay, REVEAL_HOLD_MS, MARK_TIMEOUT_MS } from "@/lib/arena/reveal";

/* ==========================================================================
   Ranks
   ========================================================================== */

describe("ranks", () => {
  it("keeps the six specified ranks in the order they were given", () => {
    const keys = RANKS.map((r) => r.key);
    const required = ["student", "apprentice", "prodigy", "intellectual", "enlightened", "transcendent"];
    const positions = required.map((k) => keys.indexOf(k));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("has eleven ranks with strictly ascending thresholds", () => {
    expect(RANKS.length).toBe(11);
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].minElo).toBeGreaterThan(RANKS[i - 1].minElo);
    }
  });

  it("bands widen as they climb, so the top is harder than the bottom", () => {
    const bands: number[] = [];
    for (let i = 1; i < RANKS.length; i++) bands.push(RANKS[i].minElo - RANKS[i - 1].minElo);
    // Every band at least as wide as the one below it.
    for (let i = 1; i < bands.length; i++) expect(bands[i]).toBeGreaterThanOrEqual(bands[i - 1]);
  });

  it("starts new players inside Student with room to fall", () => {
    expect(rankForElo(STARTING_ELO).key).toBe("student");
    expect(STARTING_ELO).toBeGreaterThan(RANKS[0].minElo);
  });

  it("clamps rather than throwing at the extremes", () => {
    expect(rankForElo(-500).key).toBe("student");
    expect(rankForElo(999_999).key).toBe("transcendent");
  });

  it("reports progress through a band", () => {
    const apprentice = RANKS.find((r) => r.key === "apprentice")!;
    const scholar = RANKS.find((r) => r.key === "scholar")!;
    const mid = Math.round((apprentice.minElo + scholar.minElo) / 2);

    const p = rankProgress(mid);
    expect(p.rank.key).toBe("apprentice");
    expect(p.next?.key).toBe("scholar");
    expect(p.fraction).toBeGreaterThan(0.4);
    expect(p.fraction).toBeLessThan(0.6);
    expect(p.eloToNext).toBe(scholar.minElo - mid);
  });

  it("tops out without a next rank or a divide by zero", () => {
    const p = rankProgress(999_999);
    expect(p.next).toBeNull();
    expect(p.fraction).toBe(1);
    expect(p.eloToNext).toBe(0);
    expect(Number.isFinite(p.fraction)).toBe(true);
  });

  it("measures distance between ranks and refuses unknown keys", () => {
    expect(rankDistance("student", "student")).toBe(0);
    expect(rankDistance("student", "apprentice")).toBe(1);
    expect(rankDistance("apprentice", "student")).toBe(1);
    expect(rankDistance("student", "nonsense")).toBe(Number.POSITIVE_INFINITY);
  });

  it("never lets a peak rank fall", () => {
    expect(higherRank("prodigy", "student")).toBe("prodigy");
    expect(higherRank("student", "prodigy")).toBe("prodigy");
    expect(nextRank("transcendent")).toBeNull();
  });
});

/* ==========================================================================
   Elo — the behaviours the brief actually asked for
   ========================================================================== */

describe("elo", () => {
  const seasoned = { matchesPlayed: 50 };

  it("is symmetric: equal players expect half a point each", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 10);
    expect(expectedScore(1900, 1500) + expectedScore(1500, 1900)).toBeCloseTo(1, 10);
  });

  it("pays an underdog far more for beating a favourite than the reverse", () => {
    const upset = applyElo({ elo: 1200, opponentElo: 1900, ...seasoned, result: "win" });
    const expected = applyElo({ elo: 1900, opponentElo: 1200, ...seasoned, result: "win" });
    expect(upset.delta).toBeGreaterThan(expected.delta * 3);
  });

  it("charges the favourite heavily for losing to an underdog", () => {
    const upsetLoss = applyElo({ elo: 1900, opponentElo: 1200, ...seasoned, result: "loss" });
    const normalLoss = applyElo({ elo: 1500, opponentElo: 1500, ...seasoned, result: "loss" });
    expect(upsetLoss.delta).toBeLessThan(normalLoss.delta);
  });

  it("shields a heavy underdog down to a single point", () => {
    const change = applyElo({ elo: 1100, opponentElo: 2100, ...seasoned, result: "loss" });
    expect(change.expected).toBeLessThan(0.15);
    expect(change.delta).toBe(-1);
    expect(change.shielded).toBe(true);
  });

  it("still charges a mild underdog something", () => {
    const change = applyElo({ elo: 1450, opponentElo: 1550, ...seasoned, result: "loss" });
    expect(change.delta).toBeLessThan(0);
  });

  it("never shields the favourite", () => {
    const change = applyElo({ elo: 2100, opponentElo: 1100, ...seasoned, result: "loss" });
    expect(change.shielded).toBe(false);
    expect(change.delta).toBeLessThan(-20);
  });

  it("moves a draw according to expectation, in both directions", () => {
    const { a: favourite, b: underdog } = applyMatchElo(
      { elo: 2000, matchesPlayed: 50 },
      { elo: 1300, matchesPlayed: 50 },
      "draw",
    );
    expect(favourite.delta).toBeLessThan(0);
    expect(underdog.delta).toBeGreaterThan(0);
  });

  it("barely moves a draw between equals", () => {
    const { a, b } = applyMatchElo(
      { elo: 1500, matchesPlayed: 50 },
      { elo: 1500, matchesPlayed: 50 },
      "draw",
    );
    expect(a.delta).toBe(0);
    expect(b.delta).toBe(0);
  });

  it("always pays at least a point for a win", () => {
    const crushing = applyElo({ elo: 3000, opponentElo: 900, ...seasoned, result: "win" });
    expect(crushing.delta).toBeGreaterThanOrEqual(1);
  });

  it("never drops a rating below the floor", () => {
    const change = applyElo({ elo: 3, opponentElo: 3, matchesPlayed: 50, result: "loss" });
    expect(change.eloAfter).toBeGreaterThanOrEqual(0);
    // The reported delta must match the movement that actually happened.
    expect(change.eloAfter - 3).toBe(change.delta);
  });

  it("moves provisional players faster than established ones", () => {
    expect(kFactor(0, 1000)).toBeGreaterThan(kFactor(50, 1000));
    expect(kFactor(50, 1000)).toBeGreaterThan(kFactor(50, 2400));
  });

  it("gives both sides of a match opposing outcomes", () => {
    const { a, b } = applyMatchElo(
      { elo: 1500, matchesPlayed: 30 },
      { elo: 1520, matchesPlayed: 30 },
      "win",
    );
    expect(a.delta).toBeGreaterThan(0);
    expect(b.delta).toBeLessThan(0);
  });
});

/* ==========================================================================
   Scoring — including the attacks it has to survive
   ========================================================================== */

describe("scoring", () => {
  const answer = (
    correct: boolean,
    ms: number,
    choices: number | null = 4,
    estimatedSeconds: number | null = null,
  ): ScoredAnswer => ({ correct, responseMs: ms, choices, estimatedSeconds });

  /* Correct answers spread through the run rather than bunched, which is the
     neutral assumption — clustering hands out a streak bonus nobody described. */
  const run = (correct: number, total: number, ms: number, estS: number | null = 75) => {
    let credited = 0;
    return Array.from({ length: total }, (_, i) => {
      const isCorrect = Math.round(((i + 1) * correct) / total) > credited;
      if (isCorrect) credited++;
      return answer(isCorrect, ms, 4, estS);
    });
  };

  it("scores nothing for nothing", () => {
    const s = scoreBattle([]);
    expect(s.score).toBe(0);
    expect(s.accuracy).toBe(0);
    expect(s.reliability).toBe(0);
    expect(s.averageResponseMs).toBe(0);
    expect(Number.isNaN(s.accuracy)).toBe(false);
  });

  it("rewards a fast correct answer more than a slow one", () => {
    expect(scoreBattle([answer(true, 1000)]).score).toBeGreaterThan(
      scoreBattle([answer(true, 14_000)]).score,
    );
  });

  it("stops rewarding speed past the reference instead of going negative", () => {
    const ref = DEFAULT_EXPECTED_SECONDS * 1000 * BATTLE_PACE;
    expect(tempoMultiplier(ref)).toBeCloseTo(1, 10);
    expect(tempoMultiplier(ref * 4)).toBeCloseTo(1, 10);
    expect(tempoMultiplier(-5)).toBeCloseTo(1.5, 10);
  });

  it("measures speed against the question, not against the clock", () => {
    expect(tempoMultiplier(10_000, 120)).toBeGreaterThan(tempoMultiplier(10_000, 40));
    expect(tempoMultiplier(10_000, 40)).toBeCloseTo(1, 10);
  });

  it("never floors two different performances to the same number", () => {
    /* The bug this shape exists to fix. Under the old subtractive score, 10 of
       45 and 15 of 45 both went below zero, both displayed zero, and the match
       was called a draw. */
    const worse = scoreBattle(run(10, 45, 2700));
    const better = scoreBattle(run(15, 45, 2700));
    expect(worse.score).toBeGreaterThan(0);
    expect(better.score).toBeGreaterThan(worse.score);
    expect(decideWinner(better, worse)).toBe("a");
  });

  it("stays ordered across the whole range, with no dead zone", () => {
    /* Monotone in correct answers at fixed volume: every extra one is worth
       something, however badly the match is going. The old subtractive score
       was flat at zero for everything below about 37% accuracy — half the
       realistic range — and that flat region is where the reported draw came
       from.

       Only 0 and 1 out of 45 still round together, at the very bottom where the
       multiplier is near zero. Two players that far down have nothing to
       separate, and calling it a draw is honest. */
    const scores = Array.from(
      { length: 46 },
      (_, correct) => scoreBattle(run(correct, 45, 4000)).score,
    );

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
    for (let i = 3; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
    /* And the range the reported match sat in is comfortably separated. */
    expect(scores[15] - scores[10]).toBeGreaterThan(100);
  });

  it("never returns a negative score", () => {
    for (const [c, n] of [[0, 45], [1, 45], [0, 1], [2, 40]] as [number, number][]) {
      expect(scoreBattle(run(c, n, 1000)).score).toBeGreaterThanOrEqual(0);
    }
  });

  it("makes guessing lose for anyone playing properly", () => {
    /* The expected value of one extra blind guess, for a player at a given hit
       rate. Above chance it is always negative — sharply so for a strong one. */
    const guessGain = (correct: number, answered: number) => {
      const now = scoreBattle(run(correct, answered, 4000)).score;
      const hit = scoreBattle(run(correct + 1, answered + 1, 4000)).score;
      const miss = scoreBattle(run(correct, answered + 1, 4000)).score;
      return 0.25 * hit + 0.75 * miss - now;
    };

    expect(guessGain(20, 25)).toBeLessThan(0);
    expect(guessGain(30, 40)).toBeLessThan(0);
    expect(guessGain(6, 10)).toBeLessThan(0);
    /* And the stronger the player, the more a guess costs them. */
    expect(guessGain(30, 40)).toBeLessThan(guessGain(10, 40));
  });

  it("keeps a spam run worth less than a handful of honest answers", () => {
    const spam = scoreBattle(run(11, 45, 1000));
    const honest = scoreBattle(run(7, 8, 14_000));
    expect(honest.score).toBeGreaterThan(spam.score);
  });

  it("lets volume beat slow perfection, as specified", () => {
    const busy = scoreBattle(run(18, 20, 4000));
    const perfectionist = scoreBattle(run(6, 6, 19_000));
    expect(busy.correct).toBeGreaterThan(perfectionist.correct);
    expect(busy.score).toBeGreaterThan(perfectionist.score);
  });

  it("does not let a tiny sample claim perfect reliability", () => {
    /* One lucky answer is not mastery. Reliability is shrunk toward chance, so
       it only approaches the raw hit rate as the sample grows. */
    const one = scoreBattle(run(1, 1, 12_000));
    const many = scoreBattle(run(45, 45, 12_000));
    expect(one.accuracy).toBe(1);
    expect(one.reliability).toBeLessThan(0.5);
    expect(many.reliability).toBeGreaterThan(0.9);
    expect(one.reliability).toBeLessThan(many.reliability);
  });

  it("treats a true/false run as easier to fluke than a four-option one", () => {
    const coinFlips = scoreBattle(
      Array.from({ length: 20 }, (_, i) => answer(i % 2 === 0, 3000, 2)),
    );
    const fourWay = scoreBattle(
      Array.from({ length: 20 }, (_, i) => answer(i % 2 === 0, 3000, 4)),
    );
    expect(coinFlips.accuracy).toBeCloseTo(fourWay.accuracy, 6);
    /* Same hit rate, but half of it is what a coin would manage. */
    expect(coinFlips.reliability).toBeGreaterThan(fourWay.reliability);
  });

  it("re-scores the match that exposed the draw", () => {
    /* Reported: 10 of 45 against 15 of 45, both scored zero, declared a draw. */
    const mine = scoreBattle(run(10, 45, 2700));
    const theirs = scoreBattle(run(15, 45, 2700));
    expect(decideWinner(theirs, mine)).toBe("a");
    expect(mine.score).not.toBe(theirs.score);
  });
});

/* ==========================================================================
   Matchmaking
   ========================================================================== */

describe("matchmaking", () => {
  const candidate = (over: Partial<Candidate> & { userId: string }): Candidate => ({
    elo: 1500,
    rankKey: "adept",
    enqueuedAt: 0,
    ...over,
  });

  const searcher = (over: Partial<{ userId: string; elo: number; rankKey: string; secondsWaiting: number }> = {}) => ({
    userId: "a",
    elo: 1500,
    rankKey: "adept",
    secondsWaiting: 0,
    ...over,
  });

  it("widens the rank window with patience, exactly as specified", () => {
    expect(rankWindowFor(0)).toBe(0);
    expect(rankWindowFor(4)).toBe(0);
    expect(rankWindowFor(5)).toBe(1);
    expect(rankWindowFor(9)).toBe(1);
    expect(rankWindowFor(10)).toBe(2);
    expect(rankWindowFor(19)).toBe(2);
    expect(rankWindowFor(20)).toBe(3);
    expect(rankWindowFor(300)).toBeGreaterThan(3);
  });

  it("matches two players who have studied nothing in common", () => {
    /*
     * The regression that broke matchmaking outright.
     *
     * There used to be a subject gate here comparing what each player had
     * STUDIED. When the Arena moved onto the shared question bank the caller
     * stopped populating those lists — but the gate stayed, compared two empty
     * arrays, found no overlap, and rejected every candidate. Nobody could be
     * matched with anybody. What players tick is now intersected by the caller
     * before candidates ever reach this function.
     */
    expect(pickOpponent(searcher(), [candidate({ userId: "b" })])?.candidate.userId).toBe("b");
  });

  it("refuses an out-of-window rank early and accepts it once the window opens", () => {
    const far = candidate({ userId: "b", rankKey: "savant" }); // two tiers up

    expect(pickOpponent(searcher({ secondsWaiting: 0 }), [far])).toBeNull();
    expect(pickOpponent(searcher({ secondsWaiting: 12 }), [far])?.candidate.userId).toBe("b");
  });

  it("picks the closest Elo, not the first in the queue", () => {
    const found = pickOpponent(searcher({ elo: 1458 }), [
      candidate({ userId: "far", elo: 1510 }),
      candidate({ userId: "near", elo: 1450 }),
      candidate({ userId: "mid", elo: 1472 }),
    ]);
    expect(found?.candidate.userId).toBe("near");
    expect(found?.eloDistance).toBe(8);
  });

  it("breaks an exact Elo tie by who waited longest", () => {
    const found = pickOpponent(searcher(), [
      candidate({ userId: "recent", elo: 1510, enqueuedAt: 5000 }),
      candidate({ userId: "waiting", elo: 1490, enqueuedAt: 1000 }),
    ]);
    expect(found?.candidate.userId).toBe("waiting");
  });

  it("never returns the searcher themselves", () => {
    expect(pickOpponent(searcher({ secondsWaiting: 60 }), [candidate({ userId: "a" })])).toBeNull();
  });

  it("returns null rather than throwing when nobody is waiting", () => {
    expect(pickOpponent(searcher(), [])).toBeNull();
  });
});

/* ==========================================================================
   Question pool
   ========================================================================== */

/* ==========================================================================
   Option order — the bug where the answer was always the top-left button
   ========================================================================== */

describe("option order", () => {
  const options = [
    { id: "correct", text: "The right one" },
    { id: "b", text: "b" },
    { id: "c", text: "c" },
    { id: "d", text: "d" },
  ];

  it("is stable for one question in one match", () => {
    expect(dealOptions("m1", "q1", options)).toEqual(dealOptions("m1", "q1", options));
  });

  it("differs between questions and between matches", () => {
    const perQuestion = new Set(
      Array.from({ length: 12 }, (_, i) =>
        dealOptions("m1", `q${i}`, options)
          .map((o) => o.id)
          .join(","),
      ),
    );
    expect(perQuestion.size).toBeGreaterThan(1);

    const perMatch = new Set(
      Array.from({ length: 12 }, (_, i) =>
        dealOptions(`m${i}`, "q1", options)
          .map((o) => o.id)
          .join(","),
      ),
    );
    expect(perMatch.size).toBeGreaterThan(1);
  });

  it("keeps every option exactly once", () => {
    const dealt = dealOptions("m1", "q1", options);
    expect(dealt.length).toBe(options.length);
    expect(
      dealt
        .map((o) => o.id)
        .sort()
        .join(","),
    ).toBe("b,c,correct,d");
  });

  it("does not leave the authored answer in the first slot", () => {
    /* The whole failure: questions are authored answer-first, so serving them
       in stored order put the correct one top-left every single time. Over a
       hand of 40 it must land in the first slot roughly a quarter of the time,
       not always. */
    const first = Array.from({ length: 40 }, (_, i) => dealOptions("m1", `q${i}`, options)[0].id);
    const alwaysFirst = first.filter((id) => id === "correct").length;

    expect(alwaysFirst).toBeLessThan(20);
    expect(new Set(first).size).toBeGreaterThan(1);
  });
});

/* ==========================================================================
   Answer marking — the same attacks the quiz marker had to survive
   ========================================================================== */

describe("answer marking", () => {
  it("marks a single-choice answer", () => {
    expect(isAnswerCorrect("MCQ_SINGLE", ["o2"], null, { optionIds: ["o2"] })).toBe(true);
    expect(isAnswerCorrect("MCQ_SINGLE", ["o2"], null, { optionIds: ["o1"] })).toBe(false);
  });

  it("refuses selecting everything on a multi-answer question", () => {
    expect(
      isAnswerCorrect("MCQ_MULTI", ["o1", "o3"], null, { optionIds: ["o1", "o2", "o3", "o4"] }),
    ).toBe(false);
  });

  it("requires the exact set on a multi-answer question", () => {
    expect(isAnswerCorrect("MCQ_MULTI", ["o1", "o3"], null, { optionIds: ["o3", "o1"] })).toBe(true);
    expect(isAnswerCorrect("MCQ_MULTI", ["o1", "o3"], null, { optionIds: ["o1"] })).toBe(false);
  });

  it("treats an empty answer as wrong, not as a match", () => {
    expect(isAnswerCorrect("MCQ_SINGLE", ["o1"], null, { optionIds: [] })).toBe(false);
    expect(isAnswerCorrect("NUMERIC", [], "42", { numeric: "" })).toBe(false);
    expect(isAnswerCorrect("NUMERIC", [], "42", {})).toBe(false);
  });

  it("marks numeric answers with a tolerance but not a generous one", () => {
    expect(isAnswerCorrect("NUMERIC", [], "42", { numeric: " 42 " })).toBe(true);
    expect(isAnswerCorrect("NUMERIC", [], "42", { numeric: "42.0000001" })).toBe(true);
    expect(isAnswerCorrect("NUMERIC", [], "42", { numeric: "42.1" })).toBe(false);
    expect(isAnswerCorrect("NUMERIC", [], "1000", { numeric: "1,000" })).toBe(true);
  });

  it("falls back to a string comparison when the answer is not a number", () => {
    expect(isAnswerCorrect("NUMERIC", [], "two thirds", { numeric: "Two Thirds" })).toBe(true);
    expect(isAnswerCorrect("NUMERIC", [], "two thirds", { numeric: "three" })).toBe(false);
  });
});

/* ==========================================================================
   The reveal clock
   ========================================================================== */

describe("the answer reveal", () => {
  const at = (markedAt: number | null, now: number) =>
    revealDelay({ openedAt: 0, markedAt, now });

  it("shows the colours for the full hold, however slow the mark was", () => {
    /* The property that matters, and the one the first version got wrong: the
       hold runs from the MARK. Measuring it from the answer and capping the
       total meant latency ate the reveal — at 800ms it flashed, past the cap it
       never appeared at all, which is exactly what was reported. */
    for (const latency of [0, 120, 400, 800, 1500, 3000]) {
      expect(at(latency, latency)).toBe(REVEAL_HOLD_MS);
    }
  });

  it("waits for a mark that is still coming", () => {
    expect(at(null, 0)).toBe(MARK_TIMEOUT_MS);
    expect(at(null, 400)).toBe(MARK_TIMEOUT_MS - 400);
  });

  it("gives up on a mark that is not coming, rather than stalling", () => {
    /* A failed answer or a dead connection must still advance. */
    expect(at(null, MARK_TIMEOUT_MS)).toBe(0);
    expect(at(null, 99_999)).toBe(0);
  });

  it("never schedules a timer into the past", () => {
    expect(at(50, 5000)).toBe(0);
    expect(at(null, 5000)).toBe(0);
  });

  it("counts the hold down as it elapses", () => {
    expect(at(1000, 1000)).toBe(REVEAL_HOLD_MS);
    expect(at(1000, 1000 + 200)).toBe(REVEAL_HOLD_MS - 200);
    expect(at(1000, 1000 + REVEAL_HOLD_MS)).toBe(0);
  });

  it("holds for half a second, as specified", () => {
    expect(REVEAL_HOLD_MS).toBe(500);
  });
});
