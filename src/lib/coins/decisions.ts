/**
 * Reward decisions — pure functions.
 *
 * These answer "does this earn coins, and how many?" from plain values. They
 * touch no database and no request, which means every rule in the economy can
 * be unit-tested exhaustively, and the service layer's only job is to load the
 * right facts and apply the answer inside a transaction.
 *
 * The server is the only caller. None of this runs on the client.
 */

import {
  APP_TIME,
  DAILY_QUIZ,
  FLASHCARDS,
  QUIZZES,
  STUDY_BONUS,
  flashcardSetCoins,
  quizScoreCoins,
  streakMultiplier,
  type PlanKey,
} from "./rules";
import { daysBetween, hoursBetween } from "../time/day";

export type SkipReason =
  | "CONTENT_TOO_NEW"
  | "REWARD_COOLDOWN"
  | "DAILY_LIMIT_REACHED"
  | "QUIZ_TOO_SHORT"
  | "SCORE_BELOW_THRESHOLD"
  | "TIME_EXPIRED"
  | "NO_CARDS"
  | "ALREADY_AWARDED";

export const SKIP_REASON_TEXT: Record<SkipReason, string> = {
  CONTENT_TOO_NEW: "Content must be 24 hours old before it can earn coins",
  REWARD_COOLDOWN: "You've already earned from this recently — try again after the cooldown",
  DAILY_LIMIT_REACHED: "You've hit today's limit for this kind of reward",
  QUIZ_TOO_SHORT: "Quizzes under 10 marks don't earn coins",
  SCORE_BELOW_THRESHOLD: "You need 60% or higher to earn coins",
  TIME_EXPIRED: "The timer ran out, so this attempt doesn't earn coins",
  NO_CARDS: "This set has no cards",
  ALREADY_AWARDED: "Coins for this have already been awarded",
};

export interface Decision {
  eligible: boolean;
  /** Coins before the rank multiplier. */
  baseCoins: number;
  reason: SkipReason | null;
}

const DENY = (reason: SkipReason): Decision => ({ eligible: false, baseCoins: 0, reason });
const ALLOW = (baseCoins: number): Decision => ({ eligible: true, baseCoins, reason: null });

// ---------------------------------------------------------------------------
// Flashcard set completion
// ---------------------------------------------------------------------------

export interface FlashcardRewardInput {
  cardCount: number;
  /** When the set was created — gates the 24h rule. */
  setCreatedAt: Date;
  /** Last time THIS set paid this user, if ever — gates the 3-day cooldown. */
  lastRewardedAt: Date | null;
  /** Distinct sets that have already paid out today. */
  setsRewardedToday: number;
  plan: PlanKey;
  now: Date;
}

export function decideFlashcardReward(input: FlashcardRewardInput): Decision {
  if (input.cardCount <= 0) return DENY("NO_CARDS");

  if (hoursBetween(input.setCreatedAt, input.now) < FLASHCARDS.setAgeHours) {
    return DENY("CONTENT_TOO_NEW");
  }

  if (input.lastRewardedAt) {
    const hoursSince = hoursBetween(input.lastRewardedAt, input.now);
    if (hoursSince < FLASHCARDS.rewardCooldownDays * 24) {
      return DENY("REWARD_COOLDOWN");
    }
  }

  if (input.setsRewardedToday >= FLASHCARDS.dailySetLimit[input.plan]) {
    return DENY("DAILY_LIMIT_REACHED");
  }

  return ALLOW(flashcardSetCoins(input.cardCount));
}

// ---------------------------------------------------------------------------
// Quiz attempt
// ---------------------------------------------------------------------------

export interface QuizRewardInput {
  totalMarks: number;
  percentage: number;
  timeExpired: boolean;
  quizCreatedAt: Date;
  lastRewardedAt: Date | null;
  quizzesRewardedToday: number;
  plan: PlanKey;
  now: Date;
}

export function decideQuizReward(input: QuizRewardInput): Decision {
  if (input.totalMarks < QUIZZES.minMarksForCoins) return DENY("QUIZ_TOO_SHORT");
  if (input.timeExpired) return DENY("TIME_EXPIRED");

  if (hoursBetween(input.quizCreatedAt, input.now) < QUIZZES.quizAgeHours) {
    return DENY("CONTENT_TOO_NEW");
  }

  if (input.lastRewardedAt) {
    const hoursSince = hoursBetween(input.lastRewardedAt, input.now);
    if (hoursSince < QUIZZES.rewardCooldownDays * 24) {
      return DENY("REWARD_COOLDOWN");
    }
  }

  if (input.quizzesRewardedToday >= QUIZZES.dailyQuizLimit[input.plan]) {
    return DENY("DAILY_LIMIT_REACHED");
  }

  const coins = quizScoreCoins(input.percentage);
  if (coins <= 0) return DENY("SCORE_BELOW_THRESHOLD");

  return ALLOW(coins);
}

// ---------------------------------------------------------------------------
// Active time on the app
// ---------------------------------------------------------------------------

export interface AppTimeInput {
  /** Active seconds already banked today. */
  activeSecondsBefore: number;
  /** Coins already paid out for today's active time. */
  coinsAwardedBefore: number;
  /** When the previous heartbeat landed. */
  lastHeartbeatAt: Date;
  now: Date;
  plan: PlanKey;
}

export interface AppTimeResult {
  /** Whether this heartbeat was accepted at all. */
  accepted: boolean;
  /** Active seconds banked after this heartbeat. */
  activeSecondsAfter: number;
  /** New coins to award right now (may be 0). */
  coinsToAward: number;
  /** Total coins paid today after this heartbeat. */
  coinsAwardedAfter: number;
  /** Set when the daily active-time ceiling has been reached. */
  cappedOut: boolean;
}

/**
 * The anti-farm core of the time system.
 *
 * Credit is `min(real elapsed server time, maxCreditPerHeartbeat)`, so a client
 * cannot buy time that has not passed: replaying heartbeats gives ~0 elapsed
 * time, and disappearing for an hour credits at most one interval on return.
 */
export function creditAppTime(input: AppTimeInput): AppTimeResult {
  const elapsedSeconds = (input.now.getTime() - input.lastHeartbeatAt.getTime()) / 1000;

  const unchanged: AppTimeResult = {
    accepted: false,
    activeSecondsAfter: input.activeSecondsBefore,
    coinsToAward: 0,
    coinsAwardedAfter: input.coinsAwardedBefore,
    cappedOut: input.activeSecondsBefore >= APP_TIME.dailyActiveSecondsCap,
  };

  // Too soon since the last heartbeat, or a clock that went backwards.
  if (elapsedSeconds < APP_TIME.minSecondsBetweenHeartbeats) return unchanged;

  const credit = Math.min(elapsedSeconds, APP_TIME.maxCreditPerHeartbeatSeconds);

  const activeSecondsAfter = Math.min(
    input.activeSecondsBefore + credit,
    APP_TIME.dailyActiveSecondsCap,
  );

  const secondsPerCoin = APP_TIME.secondsPerCoin[input.plan];
  const entitled = Math.floor(activeSecondsAfter / secondsPerCoin);
  const coinsToAward = Math.max(0, entitled - input.coinsAwardedBefore);

  return {
    accepted: true,
    activeSecondsAfter: Math.round(activeSecondsAfter),
    coinsToAward,
    coinsAwardedAfter: input.coinsAwardedBefore + coinsToAward,
    cappedOut: activeSecondsAfter >= APP_TIME.dailyActiveSecondsCap,
  };
}

// ---------------------------------------------------------------------------
// Study bonus
// ---------------------------------------------------------------------------

export interface StudyTimeInput {
  /** Verified study seconds already banked today. */
  studySecondsBefore: number;
  /** Bonuses already paid today. */
  bonusesAwardedBefore: number;
  /**
   * Seconds this heartbeat is allowed to credit — the value `creditAppTime`
   * already clamped. Taking it from there rather than recomputing means study
   * time can never exceed the app time it is a subset of.
   */
  creditedSeconds: number;
  plan: PlanKey;
}

export interface StudyTimeResult {
  studySecondsAfter: number;
  /** Bonuses earned by this heartbeat (usually 0). */
  bonusesToAward: number;
  bonusesAwardedAfter: number;
  coinsToAward: number;
  cappedOut: boolean;
}

/**
 * Credit verified study time and pay out any bonus it crosses.
 *
 * Called only when the server has confirmed the user really was studying —
 * see `verifyStudyContext` in the study-time service. An unverified heartbeat
 * never reaches this function.
 */
export function creditStudyTime(input: StudyTimeInput): StudyTimeResult {
  const studySecondsAfter = Math.min(
    input.studySecondsBefore + Math.max(0, input.creditedSeconds),
    STUDY_BONUS.dailyStudySecondsCap,
  );

  const entitled = Math.floor(studySecondsAfter / STUDY_BONUS.secondsPerBonus[input.plan]);
  const bonusesToAward = Math.max(0, entitled - input.bonusesAwardedBefore);

  return {
    studySecondsAfter: Math.round(studySecondsAfter),
    bonusesToAward,
    bonusesAwardedAfter: input.bonusesAwardedBefore + bonusesToAward,
    coinsToAward: bonusesToAward * STUDY_BONUS.coinsPerBonus,
    cappedOut: studySecondsAfter >= STUDY_BONUS.dailyStudySecondsCap,
  };
}

// ---------------------------------------------------------------------------
// Daily quiz
// ---------------------------------------------------------------------------

export interface DailyQuizRewardInput {
  correctCount: number;
  totalCount: number;
  /** The streak this attempt lands on — day 1 is a streak of 1. */
  streakDays: number;
}

export interface DailyQuizRewardResult {
  baseCoins: number;
  bonusCoins: number;
  multiplier: number;
  totalCoins: number;
  allCorrect: boolean;
}

export function computeDailyQuizReward(input: DailyQuizRewardInput): DailyQuizRewardResult {
  const correct = Math.max(0, Math.min(input.correctCount, input.totalCount));
  const allCorrect = input.totalCount > 0 && correct === input.totalCount;

  const baseCoins = correct * DAILY_QUIZ.coinsPerCorrect;
  const bonusCoins = allCorrect ? DAILY_QUIZ.allCorrectBonus : 0;
  const multiplier = streakMultiplier(input.streakDays);

  // The bonus obeys the multiplier too, per spec.
  const totalCoins = Math.round((baseCoins + bonusCoins) * multiplier);

  return { baseCoins, bonusCoins, multiplier, totalCoins, allCorrect };
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface StreakInput {
  currentStreak: number;
  /** Last day the user ATTEMPTED the daily quiz, in their timezone. */
  lastAttemptDay: string | null;
  /** Today, in the user's timezone. */
  today: string;
}

export interface StreakResult {
  streak: number;
  /** True when this attempt extends yesterday's streak. */
  continued: boolean;
  /** True when a gap reset the streak back to 1. */
  reset: boolean;
  /** True when the user already attempted today (streak unchanged). */
  alreadyAttemptedToday: boolean;
}

/**
 * The streak counts ATTEMPTS, not correctness — a user who attempts and gets
 * everything wrong keeps their streak, per spec. It breaks only on a missed day.
 */
export function advanceStreak(input: StreakInput): StreakResult {
  if (input.lastAttemptDay === input.today) {
    return {
      streak: Math.max(1, input.currentStreak),
      continued: false,
      reset: false,
      alreadyAttemptedToday: true,
    };
  }

  if (!input.lastAttemptDay) {
    return { streak: 1, continued: false, reset: false, alreadyAttemptedToday: false };
  }

  const gap = daysBetween(input.lastAttemptDay, input.today);

  if (gap === 1) {
    return {
      streak: input.currentStreak + 1,
      continued: true,
      reset: false,
      alreadyAttemptedToday: false,
    };
  }

  // Missed at least one whole day (or a clock oddity) — start again.
  return { streak: 1, continued: false, reset: true, alreadyAttemptedToday: false };
}

/**
 * The streak as it stands right now.
 *
 * `advanceStreak` decides what an attempt does to the streak; this decides what
 * to SHOW before they attempt. A stored streak of 9 whose last attempt was
 * three days ago is already dead, and the UI should say so rather than dangling
 * a number that vanishes the moment they play.
 */
export function effectiveStreak(
  currentStreak: number,
  lastAttemptDay: string | null,
  today: string,
): number {
  if (!lastAttemptDay) return 0;
  const gap = daysBetween(lastAttemptDay, today);
  // Today or yesterday keeps it alive; anything older has already lapsed.
  return gap >= 0 && gap <= 1 ? currentStreak : 0;
}

/** Coins after the rank multiplier. Rounded to a whole coin. */
export function applyRankMultiplier(baseCoins: number, rankMultiplier: number): number {
  return Math.round(baseCoins * rankMultiplier);
}
