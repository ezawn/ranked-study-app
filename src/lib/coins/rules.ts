/**
 * THE STUDY COIN ECONOMY — single source of truth.
 *
 * Every number that decides how many coins a user gets lives here. Feature
 * code reads these constants; it never hard-codes a value. Tuning the economy
 * is editing this file.
 *
 * Nothing here is read on the client. The client is never told how many coins
 * an action is worth before the server has awarded them.
 */

export type PlanKey = "FREE" | "PREMIUM";

// ---------------------------------------------------------------------------
// Active time on the app
// ---------------------------------------------------------------------------

export const APP_TIME = {
  /** Seconds of *active* time that buy one coin, per plan. */
  secondsPerCoin: {
    FREE: 5 * 60, // 1 coin per 5 minutes
    PREMIUM: 150, // 1 coin per 2.5 minutes
  } satisfies Record<PlanKey, number>,

  /** Hard ceiling on how much active time counts in a day: 8 hours. */
  dailyActiveSecondsCap: 8 * 60 * 60,

  /** Client heartbeat cadence. */
  heartbeatIntervalSeconds: 30,

  /**
   * The most time a single heartbeat may credit. A client that goes quiet and
   * comes back cannot claim the gap — this clamps the credit to just over one
   * expected interval.
   */
  maxCreditPerHeartbeatSeconds: 45,

  /** Heartbeats arriving faster than this are ignored (server-side rate limit). */
  minSecondsBetweenHeartbeats: 20,

  /** No input for this long and the client stops sending heartbeats. */
  idleTimeoutSeconds: 60,
} as const;

/** Coins available per day from active time, for display. */
export function appTimeDailyCoinCap(plan: PlanKey): number {
  return Math.floor(APP_TIME.dailyActiveSecondsCap / APP_TIME.secondsPerCoin[plan]);
}

// ---------------------------------------------------------------------------
// Study bonus — time spent actually studying
// ---------------------------------------------------------------------------

/**
 * A second, separate accrual from APP_TIME.
 *
 * APP_TIME pays for being present. This pays for being *on a study page and
 * demonstrably working* — reviewing cards, mid-quiz, reading a fresh test
 * report. It has its own, much tighter ceiling, because it is the more
 * valuable behaviour and therefore the more attractive one to fake.
 *
 * The client tells the server which kind of page it is on; the server does not
 * believe it. `activityWindowSeconds` is how recently a real, database-backed
 * study action must have happened for that claim to be accepted.
 */
export const STUDY_BONUS = {
  /** Seconds of verified study time that earn one bonus, per plan. */
  secondsPerBonus: {
    FREE: 30 * 60,
    PREMIUM: 15 * 60,
  } satisfies Record<PlanKey, number>,

  /** Coins per bonus. */
  coinsPerBonus: 5,

  /** Ceiling on study time that counts in a day: 3 hours. */
  dailyStudySecondsCap: 3 * 60 * 60,

  /**
   * How recently a real study action must have been recorded for a heartbeat
   * claiming to be on a study page to be believed.
   */
  activityWindowSeconds: 5 * 60,
} as const;

/** Bonus coins available per day, for display. */
export function studyBonusDailyCoinCap(plan: PlanKey): number {
  return (
    Math.floor(STUDY_BONUS.dailyStudySecondsCap / STUDY_BONUS.secondsPerBonus[plan]) *
    STUDY_BONUS.coinsPerBonus
  );
}

/** The kinds of page that can earn the study bonus. */
export type StudyContext = "flashcards" | "quiz" | "test-feedback";

// ---------------------------------------------------------------------------
// Daily quiz
// ---------------------------------------------------------------------------

export const DAILY_QUIZ = {
  /** How many questions a daily quiz contains. */
  minQuestions: 3,
  maxQuestions: 5,

  /** Coins per correct answer, before the streak multiplier. */
  coinsPerCorrect: 1,

  /** Extra base coin when every question is correct (multiplier applies to it too). */
  allCorrectBonus: 1,

  /** Day 1 multiplier. */
  multiplierStart: 1.0,

  /** Added to the multiplier for each additional consecutive day. */
  multiplierStep: 0.2,

  /** Multiplier ceiling — reached on day 21. */
  multiplierMax: 5.0,
} as const;

/**
 * Streak multiplier for a given streak length.
 * Day 1 -> x1.0, day 2 -> x1.2, ... capped at x5.0.
 */
export function streakMultiplier(streakDays: number): number {
  const effective = Math.max(1, Math.floor(streakDays));
  const raw = DAILY_QUIZ.multiplierStart + DAILY_QUIZ.multiplierStep * (effective - 1);
  // Guard against binary float drift (0.1 + 0.2 problems) before comparing.
  const rounded = Math.round(raw * 100) / 100;
  return Math.min(rounded, DAILY_QUIZ.multiplierMax);
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

export const FLASHCARDS = {
  /** One coin per this many cards... */
  cardsPerCoin: 20,
  /** ...rounded down, but never below this when a set is completed. */
  minCoinsPerSet: 1,

  /** A newly created set cannot pay out until it is this old. */
  setAgeHours: 24,

  /** After paying out, the same set cannot pay out again for this long. */
  rewardCooldownDays: 3,

  /** How many distinct sets can pay out in one day, per plan. */
  dailySetLimit: {
    FREE: 10,
    PREMIUM: 30,
  } satisfies Record<PlanKey, number>,
} as const;

/** Coins a completed set of `cardCount` cards is worth. */
export function flashcardSetCoins(cardCount: number): number {
  if (cardCount <= 0) return 0;
  const scaled = Math.floor(cardCount / FLASHCARDS.cardsPerCoin);
  return Math.max(scaled, FLASHCARDS.minCoinsPerSet);
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export const QUIZZES = {
  /** Time allowance: 1.5 minutes per mark. */
  secondsPerMark: 90,

  /**
   * A few seconds of slack so a submission that leaves the browser just before
   * the deadline is not voided by network latency.
   */
  submissionGraceSeconds: 5,

  /**
   * Quizzes below this many marks never pay coins. At 90s/mark this is the
   * 15-minute minimum from the specification.
   */
  minMarksForCoins: 10,

  /** A newly created quiz cannot pay out until it is this old. */
  quizAgeHours: 24,

  /** After paying out, the same quiz cannot pay out again for this long. */
  rewardCooldownDays: 3,

  /** How many distinct quizzes can pay out in one day, per plan. */
  dailyQuizLimit: {
    FREE: 10,
    PREMIUM: 30,
  } satisfies Record<PlanKey, number>,

  /** Score bands, highest first. */
  scoreBands: [
    { minPercent: 90, coins: 5 },
    { minPercent: 80, coins: 3 },
    { minPercent: 70, coins: 2 },
    { minPercent: 60, coins: 1 },
  ] as const,
} as const;

/** Coins for a quiz percentage, before the rank multiplier. */
export function quizScoreCoins(percentage: number): number {
  for (const band of QUIZZES.scoreBands) {
    if (percentage >= band.minPercent) return band.coins;
  }
  return 0;
}

/** Server-side time allowance for a quiz, in seconds. */
export function quizTimeLimitSeconds(totalMarks: number): number {
  return Math.max(totalMarks, 0) * QUIZZES.secondsPerMark;
}

/** Whether a quiz is long enough to be worth coins at all. */
export function quizIsCoinEligible(totalMarks: number): boolean {
  return totalMarks >= QUIZZES.minMarksForCoins;
}

// ---------------------------------------------------------------------------
// AI upload quotas (free tier)
// ---------------------------------------------------------------------------

export const UPLOAD_QUOTAS = {
  /** PDF-to-quiz conversions per day. */
  PDF_TO_QUIZ: {
    FREE: 1,
    PREMIUM: Infinity,
  } satisfies Record<PlanKey, number>,

  /** Test-feedback analyses per day. Separate allowance from PDF-to-quiz. */
  TEST_FEEDBACK: {
    FREE: 1,
    PREMIUM: Infinity,
  } satisfies Record<PlanKey, number>,
} as const;

export type QuotaFeature = keyof typeof UPLOAD_QUOTAS;

export function uploadQuota(feature: QuotaFeature, plan: PlanKey): number {
  return UPLOAD_QUOTAS[feature][plan];
}

// ---------------------------------------------------------------------------
// Premium-only capabilities
// ---------------------------------------------------------------------------

export const PREMIUM_ONLY = {
  /** AI-generated "improve your weak areas" quizzes after a quiz attempt. */
  improvementQuizzes: true,
  /** AI-generated practice from a test-feedback report. */
  testFeedbackPractice: true,
} as const;

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

export const UPLOAD_LIMITS = {
  maxBytes: 10 * 1024 * 1024, // 10 MB
  maxPages: 40,
  allowedMimeTypes: ["application/pdf"] as const,
} as const;
