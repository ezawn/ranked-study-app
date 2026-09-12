import { describe, expect, it } from "vitest";

import {
  advanceStreak,
  computeDailyQuizReward,
  creditAppTime,
  decideFlashcardReward,
  decideQuizReward,
} from "@/lib/coins/decisions";
import { APP_TIME, FLASHCARDS, QUIZZES } from "@/lib/coins/rules";
import { clampOverrideMarks, isAttemptExpired, markMultipleChoice } from "@/lib/quiz/marking";

/**
 * Exploit scenarios.
 *
 * Each of these is a way somebody might try to mint Study Coins. They are
 * written from the attacker's point of view: do the thing, then assert that it
 * did not work.
 *
 * The rules being tested here are only half the defence — the other half is
 * that they run on the server, inside a transaction, behind a unique
 * idempotency key. These tests cover the rules; the integration tests in the
 * README's checklist cover the plumbing.
 */

const NOW = new Date("2026-08-25T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * HOUR);

describe("attack: farm the study timer", () => {
  it("cannot buy time that has not passed", () => {
    let active = 0;
    let coins = 0;

    // Replay the same heartbeat 10,000 times as fast as possible.
    for (let i = 0; i < 10_000; i++) {
      const result = creditAppTime({
        activeSecondsBefore: active,
        coinsAwardedBefore: coins,
        lastHeartbeatAt: NOW,
        now: NOW,
        plan: "PREMIUM",
      });
      active = result.activeSecondsAfter;
      coins = result.coinsAwardedAfter;
    }

    expect(coins).toBe(0);
  });

  it("cannot claim a long absence as study time", () => {
    const result = creditAppTime({
      activeSecondsBefore: 0,
      coinsAwardedBefore: 0,
      lastHeartbeatAt: new Date(NOW.getTime() - 12 * HOUR),
      now: NOW,
      plan: "PREMIUM",
    });

    expect(result.activeSecondsAfter).toBe(APP_TIME.maxCreditPerHeartbeatSeconds);
    expect(result.coinsToAward).toBe(0);
  });

  it("cannot beat the daily ceiling by leaving a tab open all day", () => {
    let active = 0;
    let coins = 0;

    // 24 hours of perfectly honest 30-second heartbeats.
    for (let i = 0; i < 2880; i++) {
      const result = creditAppTime({
        activeSecondsBefore: active,
        coinsAwardedBefore: coins,
        lastHeartbeatAt: new Date(NOW.getTime() - 30_000),
        now: NOW,
        plan: "PREMIUM",
      });
      active = result.activeSecondsAfter;
      coins = result.coinsAwardedAfter;
    }

    expect(active).toBe(APP_TIME.dailyActiveSecondsCap);
    expect(coins).toBe(192);
  });

  it("cannot rewind the clock to manufacture elapsed time", () => {
    const result = creditAppTime({
      activeSecondsBefore: 100,
      coinsAwardedBefore: 0,
      lastHeartbeatAt: new Date(NOW.getTime() + 60_000), // "last" heartbeat in the future
      now: NOW,
      plan: "FREE",
    });

    expect(result.accepted).toBe(false);
    expect(result.activeSecondsAfter).toBe(100);
  });
});

describe("attack: spin up throwaway content for instant coins", () => {
  it("a brand new set earns nothing", () => {
    const decision = decideFlashcardReward({
      cardCount: 500,
      setCreatedAt: NOW,
      lastRewardedAt: null,
      setsRewardedToday: 0,
      plan: "PREMIUM",
      now: NOW,
    });

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe("CONTENT_TOO_NEW");
  });

  it("a brand new quiz earns nothing, even at 100%", () => {
    const decision = decideQuizReward({
      totalMarks: 100,
      percentage: 100,
      timeExpired: false,
      quizCreatedAt: NOW,
      lastRewardedAt: null,
      quizzesRewardedToday: 0,
      plan: "PREMIUM",
      now: NOW,
    });

    expect(decision.reason).toBe("CONTENT_TOO_NEW");
  });

  it("caps how many sets can pay in a day, however many are created", () => {
    let paid = 0;
    for (let i = 0; i < 100; i++) {
      const decision = decideFlashcardReward({
        cardCount: 100,
        setCreatedAt: hoursAgo(48),
        lastRewardedAt: null,
        setsRewardedToday: paid,
        plan: "FREE",
        now: NOW,
      });
      if (decision.eligible) paid++;
    }
    expect(paid).toBe(FLASHCARDS.dailySetLimit.FREE);
  });

  it("caps how many quizzes can pay in a day", () => {
    let paid = 0;
    for (let i = 0; i < 100; i++) {
      const decision = decideQuizReward({
        totalMarks: 20,
        percentage: 100,
        timeExpired: false,
        quizCreatedAt: hoursAgo(48),
        lastRewardedAt: null,
        quizzesRewardedToday: paid,
        plan: "PREMIUM",
        now: NOW,
      });
      if (decision.eligible) paid++;
    }
    expect(paid).toBe(QUIZZES.dailyQuizLimit.PREMIUM);
  });
});

describe("attack: grind the same content over and over", () => {
  it("the same set only pays once every three days", () => {
    let lastRewarded: Date | null = null;
    let payouts = 0;

    // Complete the set once an hour for four days.
    for (let hour = 0; hour < 96; hour++) {
      const now = new Date(NOW.getTime() + hour * HOUR);
      const decision = decideFlashcardReward({
        cardCount: 60,
        setCreatedAt: hoursAgo(48),
        lastRewardedAt: lastRewarded,
        setsRewardedToday: 0, // pretend the daily limit is never the binding constraint
        plan: "PREMIUM",
        now,
      });

      if (decision.eligible) {
        payouts++;
        lastRewarded = now;
      }
    }

    expect(payouts).toBe(2); // once at the start, once 72 hours later
  });

  it("the same quiz only pays once every three days", () => {
    let lastRewarded: Date | null = null;
    let payouts = 0;

    for (let hour = 0; hour < 168; hour++) {
      const now = new Date(NOW.getTime() + hour * HOUR);
      const decision = decideQuizReward({
        totalMarks: 20,
        percentage: 95,
        timeExpired: false,
        quizCreatedAt: hoursAgo(48),
        lastRewardedAt: lastRewarded,
        quizzesRewardedToday: 0,
        plan: "PREMIUM",
        now,
      });

      if (decision.eligible) {
        payouts++;
        lastRewarded = now;
      }
    }

    expect(payouts).toBe(3); // hours 0, 72 and 144
  });
});

describe("attack: beat the quiz timer", () => {
  it("a late submission earns nothing regardless of score", () => {
    const deadline = new Date(NOW.getTime() - 60_000);
    const expired = isAttemptExpired(NOW, deadline);
    expect(expired).toBe(true);

    const decision = decideQuizReward({
      totalMarks: 40,
      percentage: 100,
      timeExpired: expired,
      quizCreatedAt: hoursAgo(72),
      lastRewardedAt: null,
      quizzesRewardedToday: 0,
      plan: "PREMIUM",
      now: NOW,
    });

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toBe("TIME_EXPIRED");
  });

  it("padding a quiz with tiny questions doesn't shorten the honest time limit", () => {
    // 10 one-mark questions is still 15 minutes.
    expect(QUIZZES.secondsPerMark * 10).toBe(900);
  });
});

describe("attack: mark your own work", () => {
  it("an override cannot exceed the marks available", () => {
    expect(clampOverrideMarks(1_000_000, 4)).toBe(4);
  });

  it("selecting every option on a multi-answer question scores zero, not full marks", () => {
    expect(markMultipleChoice(["a", "b", "c", "d"], ["a"], 5)).toBe(0);
  });
});

describe("attack: fake a streak", () => {
  it("cannot stack multiple attempts in one day into multiple streak days", () => {
    let streak = 5;
    let last: string | null = "2026-08-24";

    for (let i = 0; i < 10; i++) {
      const result = advanceStreak({ currentStreak: streak, lastAttemptDay: last, today: "2026-08-25" });
      streak = result.streak;
      last = "2026-08-25";
    }

    expect(streak).toBe(6);
  });

  it("a long streak is worth nothing without correct answers", () => {
    expect(
      computeDailyQuizReward({ correctCount: 0, totalCount: 5, streakDays: 365 }).totalCoins,
    ).toBe(0);
  });

  it("the multiplier cannot be pushed past x5", () => {
    const result = computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 10_000 });
    expect(result.multiplier).toBe(5);
    expect(result.totalCoins).toBe(30);
  });
});

describe("attack: claim a better plan than you have", () => {
  it("free limits apply when the plan is FREE, whatever else is true", () => {
    const decision = decideFlashcardReward({
      cardCount: 100,
      setCreatedAt: hoursAgo(48),
      lastRewardedAt: null,
      setsRewardedToday: FLASHCARDS.dailySetLimit.FREE,
      plan: "FREE",
      now: NOW,
    });

    expect(decision.reason).toBe("DAILY_LIMIT_REACHED");
  });
});
