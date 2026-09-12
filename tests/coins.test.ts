import { describe, expect, it } from "vitest";

import {
  APP_TIME,
  STUDY_BONUS,
  appTimeDailyCoinCap,
  studyBonusDailyCoinCap,
  flashcardSetCoins,
  quizIsCoinEligible,
  quizScoreCoins,
  quizTimeLimitSeconds,
  streakMultiplier,
  uploadQuota,
} from "@/lib/coins/rules";
import {
  advanceStreak,
  computeDailyQuizReward,
  creditAppTime,
  creditStudyTime,
  effectiveStreak,
  decideFlashcardReward,
  decideQuizReward,
} from "@/lib/coins/decisions";

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-08-25T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * HOUR);

describe("streak multiplier", () => {
  it("starts at x1.0 on day one", () => {
    expect(streakMultiplier(1)).toBe(1);
  });

  it("climbs by 0.2 a day", () => {
    expect(streakMultiplier(2)).toBe(1.2);
    expect(streakMultiplier(6)).toBe(2);
    expect(streakMultiplier(11)).toBe(3);
  });

  it("caps at x5 on day 21 and stays there", () => {
    expect(streakMultiplier(20)).toBe(4.8);
    expect(streakMultiplier(21)).toBe(5);
    expect(streakMultiplier(1000)).toBe(5);
  });

  it("treats a zero or negative streak as day one", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(-4)).toBe(1);
  });
});

describe("flashcard coin scaling", () => {
  it("pays one coin per twenty cards, rounded down", () => {
    expect(flashcardSetCoins(20)).toBe(1);
    expect(flashcardSetCoins(45)).toBe(2);
    expect(flashcardSetCoins(200)).toBe(10);
  });

  it("gives a floor of one coin to small sets", () => {
    expect(flashcardSetCoins(1)).toBe(1);
    expect(flashcardSetCoins(19)).toBe(1);
  });

  it("pays nothing for an empty set", () => {
    expect(flashcardSetCoins(0)).toBe(0);
  });
});

describe("quiz score bands", () => {
  it.each([
    [100, 5],
    [90, 5],
    [89, 3],
    [80, 3],
    [79, 2],
    [70, 2],
    [69, 1],
    [60, 1],
    [59, 0],
    [0, 0],
  ])("%i%% pays %i coins", (percentage, coins) => {
    expect(quizScoreCoins(percentage)).toBe(coins);
  });
});

describe("quiz timing", () => {
  it("allows 1.5 minutes per mark", () => {
    expect(quizTimeLimitSeconds(1)).toBe(90);
    expect(quizTimeLimitSeconds(10)).toBe(900);
    expect(quizTimeLimitSeconds(40)).toBe(3600);
  });

  it("only pays out at ten marks or more, which is the 15 minute floor", () => {
    expect(quizIsCoinEligible(9)).toBe(false);
    expect(quizIsCoinEligible(10)).toBe(true);
    expect(quizTimeLimitSeconds(10)).toBe(15 * 60);
  });
});

describe("flashcard reward decisions", () => {
  const base = {
    cardCount: 40,
    setCreatedAt: hoursAgo(72),
    lastRewardedAt: null,
    setsRewardedToday: 0,
    plan: "FREE" as const,
    now: NOW,
  };

  it("pays a completed, mature set", () => {
    expect(decideFlashcardReward(base)).toEqual({ eligible: true, baseCoins: 2, reason: null });
  });

  it("holds new sets back for 24 hours", () => {
    expect(decideFlashcardReward({ ...base, setCreatedAt: hoursAgo(23) }).reason).toBe(
      "CONTENT_TOO_NEW",
    );
    expect(decideFlashcardReward({ ...base, setCreatedAt: hoursAgo(24.1) }).eligible).toBe(true);
  });

  it("enforces the three day cooldown per set", () => {
    expect(decideFlashcardReward({ ...base, lastRewardedAt: hoursAgo(71) }).reason).toBe(
      "REWARD_COOLDOWN",
    );
    expect(decideFlashcardReward({ ...base, lastRewardedAt: hoursAgo(73) }).eligible).toBe(true);
  });

  it("enforces the daily set limit by plan", () => {
    expect(decideFlashcardReward({ ...base, setsRewardedToday: 10 }).reason).toBe(
      "DAILY_LIMIT_REACHED",
    );
    expect(
      decideFlashcardReward({ ...base, setsRewardedToday: 10, plan: "PREMIUM" }).eligible,
    ).toBe(true);
    expect(decideFlashcardReward({ ...base, setsRewardedToday: 30, plan: "PREMIUM" }).reason).toBe(
      "DAILY_LIMIT_REACHED",
    );
  });
});

describe("quiz reward decisions", () => {
  const base = {
    totalMarks: 20,
    percentage: 92,
    timeExpired: false,
    quizCreatedAt: hoursAgo(72),
    lastRewardedAt: null,
    quizzesRewardedToday: 0,
    plan: "FREE" as const,
    now: NOW,
  };

  it("pays a strong score on a mature, long-enough quiz", () => {
    expect(decideQuizReward(base)).toEqual({ eligible: true, baseCoins: 5, reason: null });
  });

  it("refuses short quizzes before anything else", () => {
    expect(decideQuizReward({ ...base, totalMarks: 9, percentage: 100 }).reason).toBe(
      "QUIZ_TOO_SHORT",
    );
  });

  it("voids the coins when the timer ran out", () => {
    expect(decideQuizReward({ ...base, timeExpired: true }).reason).toBe("TIME_EXPIRED");
  });

  it("refuses scores under 60%", () => {
    expect(decideQuizReward({ ...base, percentage: 59 }).reason).toBe("SCORE_BELOW_THRESHOLD");
    expect(decideQuizReward({ ...base, percentage: 60 }).baseCoins).toBe(1);
  });

  it("enforces the age gate, the cooldown and the daily limit", () => {
    expect(decideQuizReward({ ...base, quizCreatedAt: hoursAgo(1) }).reason).toBe(
      "CONTENT_TOO_NEW",
    );
    expect(decideQuizReward({ ...base, lastRewardedAt: hoursAgo(24) }).reason).toBe(
      "REWARD_COOLDOWN",
    );
    expect(decideQuizReward({ ...base, quizzesRewardedToday: 10 }).reason).toBe(
      "DAILY_LIMIT_REACHED",
    );
  });
});

describe("active time accrual", () => {
  const heartbeat = (
    activeBefore: number,
    coinsBefore: number,
    gapSeconds: number,
    plan: "FREE" | "PREMIUM" = "FREE",
  ) =>
    creditAppTime({
      activeSecondsBefore: activeBefore,
      coinsAwardedBefore: coinsBefore,
      lastHeartbeatAt: new Date(NOW.getTime() - gapSeconds * 1000),
      now: NOW,
      plan,
    });

  it("caps a free user at 96 coins and premium at 192", () => {
    expect(appTimeDailyCoinCap("FREE")).toBe(96);
    expect(appTimeDailyCoinCap("PREMIUM")).toBe(192);
  });

  it("rejects heartbeats that arrive too fast", () => {
    expect(heartbeat(0, 0, 5).accepted).toBe(false);
    expect(heartbeat(0, 0, APP_TIME.minSecondsBetweenHeartbeats - 1).accepted).toBe(false);
  });

  it("credits only real elapsed time, clamped", () => {
    expect(heartbeat(0, 0, 30).activeSecondsAfter).toBe(30);
    expect(heartbeat(0, 0, 3600).activeSecondsAfter).toBe(APP_TIME.maxCreditPerHeartbeatSeconds);
  });

  it("pays a coin as each interval is crossed", () => {
    expect(heartbeat(280, 0, 30).coinsToAward).toBe(1);
    expect(heartbeat(120, 0, 30).coinsToAward).toBe(0);
    expect(heartbeat(130, 0, 30, "PREMIUM").coinsToAward).toBe(1);
  });

  it("never pays twice for time already paid for", () => {
    expect(heartbeat(600, 2, 30).coinsToAward).toBe(0);
  });

  it("stops at the eight hour ceiling", () => {
    const capped = heartbeat(APP_TIME.dailyActiveSecondsCap, 96, 30);
    expect(capped.coinsToAward).toBe(0);
    expect(capped.cappedOut).toBe(true);
  });

  it("cannot be farmed by hammering the endpoint", () => {
    let active = 0;
    let coins = 0;
    for (let i = 0; i < 5000; i++) {
      const result = creditAppTime({
        activeSecondsBefore: active,
        coinsAwardedBefore: coins,
        lastHeartbeatAt: new Date(NOW.getTime() - 1000),
        now: NOW,
        plan: "PREMIUM",
      });
      active = result.activeSecondsAfter;
      coins = result.coinsAwardedAfter;
    }
    expect(active).toBe(0);
    expect(coins).toBe(0);
  });

  it("cannot exceed the daily cap even with perfect honest heartbeats", () => {
    let active = 0;
    let coins = 0;
    for (let i = 0; i < 2000; i++) {
      const result = creditAppTime({
        activeSecondsBefore: active,
        coinsAwardedBefore: coins,
        lastHeartbeatAt: new Date(NOW.getTime() - 30_000),
        now: NOW,
        plan: "FREE",
      });
      active = result.activeSecondsAfter;
      coins = result.coinsAwardedAfter;
    }
    expect(coins).toBe(96);
  });
});

describe("daily quiz rewards", () => {
  it("pays one coin per correct answer on day one", () => {
    expect(computeDailyQuizReward({ correctCount: 3, totalCount: 5, streakDays: 1 }).totalCoins).toBe(3);
  });

  it("adds a bonus coin for a perfect round", () => {
    const result = computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 1 });
    expect(result.allCorrect).toBe(true);
    expect(result.totalCoins).toBe(6);
  });

  it("applies the streak multiplier to the bonus as well as the base", () => {
    expect(computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 6 }).totalCoins).toBe(12);
    expect(computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 21 }).totalCoins).toBe(30);
  });

  it("pays nothing when everything is wrong, however long the streak", () => {
    expect(computeDailyQuizReward({ correctCount: 0, totalCount: 5, streakDays: 40 }).totalCoins).toBe(0);
  });

  it("clamps a claimed correct count to the number of questions", () => {
    expect(computeDailyQuizReward({ correctCount: 999, totalCount: 5, streakDays: 1 }).totalCoins).toBe(6);
  });
});

describe("streaks", () => {
  it("starts at one", () => {
    expect(advanceStreak({ currentStreak: 0, lastAttemptDay: null, today: "2026-08-25" }).streak).toBe(1);
  });

  it("extends when yesterday was played", () => {
    expect(
      advanceStreak({ currentStreak: 7, lastAttemptDay: "2026-08-24", today: "2026-08-25" }).streak,
    ).toBe(8);
  });

  it("does not double count a second visit on the same day", () => {
    const result = advanceStreak({
      currentStreak: 7,
      lastAttemptDay: "2026-08-25",
      today: "2026-08-25",
    });
    expect(result.streak).toBe(7);
    expect(result.alreadyAttemptedToday).toBe(true);
  });

  it("resets after a missed day", () => {
    const result = advanceStreak({
      currentStreak: 30,
      lastAttemptDay: "2026-08-23",
      today: "2026-08-25",
    });
    expect(result.streak).toBe(1);
    expect(result.reset).toBe(true);
  });

  it("survives a day of entirely wrong answers", () => {
    const day2 = advanceStreak({
      currentStreak: 1,
      lastAttemptDay: "2026-08-24",
      today: "2026-08-25",
    });
    expect(day2.streak).toBe(2);
    expect(computeDailyQuizReward({ correctCount: 0, totalCount: 4, streakDays: day2.streak }).totalCoins).toBe(0);
  });
});

describe("upload quotas", () => {
  it("gives free accounts one of each per day, counted separately", () => {
    expect(uploadQuota("PDF_TO_QUIZ", "FREE")).toBe(1);
    expect(uploadQuota("TEST_FEEDBACK", "FREE")).toBe(1);
  });

  it("gives premium unlimited on both", () => {
    expect(uploadQuota("PDF_TO_QUIZ", "PREMIUM")).toBe(Infinity);
    expect(uploadQuota("TEST_FEEDBACK", "PREMIUM")).toBe(Infinity);
  });
});


describe("the study bonus", () => {
  const credit = (
    studyBefore: number,
    bonusesBefore: number,
    seconds: number,
    plan: "FREE" | "PREMIUM" = "FREE",
  ) =>
    creditStudyTime({
      studySecondsBefore: studyBefore,
      bonusesAwardedBefore: bonusesBefore,
      creditedSeconds: seconds,
      plan,
    });

  it("pays 5 coins per 30 minutes on free", () => {
    expect(STUDY_BONUS.secondsPerBonus.FREE).toBe(1800);
    expect(credit(1770, 0, 30).coinsToAward).toBe(5);
  });

  it("pays 5 coins per 15 minutes on premium", () => {
    expect(STUDY_BONUS.secondsPerBonus.PREMIUM).toBe(900);
    expect(credit(870, 0, 30, "PREMIUM").coinsToAward).toBe(5);
  });

  it("pays nothing mid-interval", () => {
    expect(credit(600, 0, 30).coinsToAward).toBe(0);
  });

  it("never pays twice for the same interval", () => {
    expect(credit(1830, 1, 30).coinsToAward).toBe(0);
  });

  it("stops at the 3 hour ceiling", () => {
    expect(STUDY_BONUS.dailyStudySecondsCap).toBe(3 * 60 * 60);
    const capped = credit(STUDY_BONUS.dailyStudySecondsCap, 6, 30);
    expect(capped.coinsToAward).toBe(0);
    expect(capped.cappedOut).toBe(true);
  });

  it("caps the day at 30 coins free and 60 premium", () => {
    expect(studyBonusDailyCoinCap("FREE")).toBe(30);
    expect(studyBonusDailyCoinCap("PREMIUM")).toBe(60);
  });

  it("cannot accrue more study time than the app time it came from", () => {
    // creditedSeconds is whatever creditAppTime already clamped, so a full
    // day of honest heartbeats is the ceiling on both.
    let study = 0;
    let bonuses = 0;
    let coins = 0;

    for (let i = 0; i < 2000; i++) {
      const result = credit(study, bonuses, 30, "PREMIUM");
      study = result.studySecondsAfter;
      bonuses = result.bonusesAwardedAfter;
      coins += result.coinsToAward;
    }

    expect(study).toBe(STUDY_BONUS.dailyStudySecondsCap);
    expect(coins).toBe(60);
  });

  it("ignores a negative or nonsense credit", () => {
    expect(credit(600, 0, -9999).studySecondsAfter).toBe(600);
  });
});

describe("a streak reads as broken the moment a day is missed", () => {
  it("survives on the day after", () => {
    expect(effectiveStreak(12, "2026-08-24", "2026-08-25")).toBe(12);
  });

  it("is gone once a whole day passes without an attempt", () => {
    expect(effectiveStreak(12, "2026-08-23", "2026-08-25")).toBe(0);
  });

  it("is zero for someone who has never attempted", () => {
    expect(effectiveStreak(0, null, "2026-08-25")).toBe(0);
  });
});
