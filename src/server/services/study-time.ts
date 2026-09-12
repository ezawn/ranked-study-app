import "server-only";

import { db } from "@/lib/db";
import { creditAppTime, creditStudyTime } from "@/lib/coins/decisions";
import {
  APP_TIME,
  STUDY_BONUS,
  appTimeDailyCoinCap,
  studyBonusDailyCoinCap,
  type StudyContext,
} from "@/lib/coins/rules";
import { dayKey } from "@/lib/time/day";
import { awardCoins } from "./coins";

/**
 * The two time-based accruals.
 *
 *   APP_TIME    — being present and active anywhere in the app.
 *   STUDY_BONUS — being present AND demonstrably studying.
 *
 * Both are driven by the same heartbeat and the same clamped elapsed time, so
 * study time can never exceed app time. The difference is that the study
 * bonus additionally requires the server to find evidence of real work.
 */

export interface HeartbeatResult {
  accepted: boolean;

  /** Coins from this heartbeat, both streams combined. */
  coinsAwarded: number;
  balance: number;

  // Coin timer
  activeSeconds: number;
  secondsToNextCoin: number;
  /** Full interval, so the client can reset its countdown correctly. */
  coinIntervalSeconds: number;
  cappedOut: boolean;
  dailyCoinCap: number;
  coinsToday: number;

  // Study bonus
  studySeconds: number;
  studyVerified: boolean;
  studyBonusCoinsToday: number;
  studyBonusDailyCap: number;
  secondsToNextBonus: number;
  studyCappedOut: boolean;
}

/**
 * Does the server believe this client is really studying?
 *
 * The browser sends a context hint. This checks it against rows that only
 * exist if the work actually happened. A hint with no evidence behind it is
 * simply ignored — the heartbeat still counts toward app time.
 */
export async function verifyStudyContext(
  userId: string,
  context: StudyContext,
  now: Date,
): Promise<boolean> {
  const since = new Date(now.getTime() - STUDY_BONUS.activityWindowSeconds * 1000);

  switch (context) {
    case "flashcards": {
      // A review written recently. Reviews are frequent while studying, so a
      // five-minute window comfortably covers thinking time on a hard card.
      const review = await db.cardReview.findFirst({
        where: { userId, reviewedAt: { gte: since } },
        select: { id: true },
      });
      return Boolean(review);
    }

    case "quiz": {
      // Mid-attempt counts even without answering, because reading a question
      // is studying — but only while the attempt is genuinely live.
      const open = await db.quizAttempt.findFirst({
        where: { userId, status: "IN_PROGRESS", serverDeadlineAt: { gt: now } },
        select: { id: true },
      });
      if (open) return true;

      // Or just submitted, so the results page counts too.
      const recent = await db.quizAttempt.findFirst({
        where: { userId, submittedAt: { gte: since } },
        select: { id: true },
      });
      return Boolean(recent);
    }

    case "test-feedback": {
      // Reading a report is slower work, so this window is longer.
      const readingWindow = new Date(now.getTime() - 15 * 60 * 1000);
      const submission = await db.testSubmission.findFirst({
        where: { userId, createdAt: { gte: readingWindow } },
        select: { id: true },
      });
      return Boolean(submission);
    }

    default:
      return false;
  }
}

export async function recordHeartbeat(
  userId: string,
  context?: StudyContext,
): Promise<HeartbeatResult> {
  const now = new Date();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, timezone: true, coinBalance: true },
  });
  if (!user) throw new Error("Unknown user");

  const day = dayKey(now, user.timezone);
  const studyVerified = context ? await verifyStudyContext(userId, context, now) : false;

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.studyTimeDay.findUnique({
      where: { userId_day: { userId, day } },
    });

    // First heartbeat of the day starts the clock and credits nothing.
    if (!existing) {
      const created = await tx.studyTimeDay.create({
        data: { userId, day, lastHeartbeatAt: now },
      });
      return {
        accepted: true,
        coinsToAward: 0,
        activeSecondsAfter: created.activeSeconds,
        coinsAwardedAfter: created.coinsAwarded,
        cappedOut: false,
        studySecondsAfter: created.studySeconds,
        bonusCoinsToAward: 0,
        bonusesAwardedAfter: created.studyBonusesAwarded,
        studyCappedOut: false,
      };
    }

    const appCredit = creditAppTime({
      activeSecondsBefore: existing.activeSeconds,
      coinsAwardedBefore: existing.coinsAwarded,
      lastHeartbeatAt: existing.lastHeartbeatAt,
      now,
      plan: user.plan,
    });

    if (!appCredit.accepted) {
      return {
        accepted: false,
        coinsToAward: 0,
        activeSecondsAfter: existing.activeSeconds,
        coinsAwardedAfter: existing.coinsAwarded,
        cappedOut: appCredit.cappedOut,
        studySecondsAfter: existing.studySeconds,
        bonusCoinsToAward: 0,
        bonusesAwardedAfter: existing.studyBonusesAwarded,
        studyCappedOut: existing.studySeconds >= STUDY_BONUS.dailyStudySecondsCap,
      };
    }

    // Exactly the seconds the app-time credit allowed — no more.
    const creditedSeconds = appCredit.activeSecondsAfter - existing.activeSeconds;

    const studyCredit = studyVerified
      ? creditStudyTime({
          studySecondsBefore: existing.studySeconds,
          bonusesAwardedBefore: existing.studyBonusesAwarded,
          creditedSeconds,
          plan: user.plan,
        })
      : {
          studySecondsAfter: existing.studySeconds,
          bonusesToAward: 0,
          bonusesAwardedAfter: existing.studyBonusesAwarded,
          coinsToAward: 0,
          cappedOut: existing.studySeconds >= STUDY_BONUS.dailyStudySecondsCap,
        };

    await tx.studyTimeDay.update({
      where: { userId_day: { userId, day } },
      data: {
        activeSeconds: appCredit.activeSecondsAfter,
        coinsAwarded: appCredit.coinsAwardedAfter,
        studySeconds: studyCredit.studySecondsAfter,
        studyBonusesAwarded: studyCredit.bonusesAwardedAfter,
        lastHeartbeatAt: now,
      },
    });

    return {
      accepted: true,
      coinsToAward: appCredit.coinsToAward,
      activeSecondsAfter: appCredit.activeSecondsAfter,
      coinsAwardedAfter: appCredit.coinsAwardedAfter,
      cappedOut: appCredit.cappedOut,
      studySecondsAfter: studyCredit.studySecondsAfter,
      bonusCoinsToAward: studyCredit.coinsToAward,
      bonusesAwardedAfter: studyCredit.bonusesAwardedAfter,
      studyCappedOut: studyCredit.cappedOut,
    };
  });

  let balance = user.coinBalance;
  let coinsAwarded = 0;

  if (result.coinsToAward > 0) {
    // The key encodes the running coin total, so two heartbeats racing for the
    // same coin collide on the unique index.
    const award = await awardCoins({
      userId,
      source: "APP_TIME",
      baseCoins: result.coinsToAward,
      idempotencyKey: `apptime:${userId}:${day}:${result.coinsAwardedAfter}`,
      refType: "study_time_day",
      refId: day,
      metadata: { activeSeconds: result.activeSecondsAfter, plan: user.plan },
    });
    balance = award.balance;
    coinsAwarded += award.coins;
  }

  if (result.bonusCoinsToAward > 0) {
    const award = await awardCoins({
      userId,
      source: "STUDY_BONUS",
      baseCoins: result.bonusCoinsToAward,
      idempotencyKey: `studybonus:${userId}:${day}:${result.bonusesAwardedAfter}`,
      refType: "study_time_day",
      refId: day,
      metadata: {
        studySeconds: result.studySecondsAfter,
        context: context ?? null,
        plan: user.plan,
      },
    });
    balance = award.balance;
    coinsAwarded += award.coins;
  }

  const secondsPerCoin = APP_TIME.secondsPerCoin[user.plan];
  const secondsPerBonus = STUDY_BONUS.secondsPerBonus[user.plan];

  return {
    accepted: result.accepted,
    coinsAwarded,
    balance,

    activeSeconds: result.activeSecondsAfter,
    secondsToNextCoin: result.cappedOut
      ? 0
      : secondsPerCoin - (result.activeSecondsAfter % secondsPerCoin),
    coinIntervalSeconds: secondsPerCoin,
    cappedOut: result.cappedOut,
    dailyCoinCap: appTimeDailyCoinCap(user.plan),
    coinsToday: result.coinsAwardedAfter,

    studySeconds: result.studySecondsAfter,
    studyVerified,
    studyBonusCoinsToday: result.bonusesAwardedAfter * STUDY_BONUS.coinsPerBonus,
    studyBonusDailyCap: studyBonusDailyCoinCap(user.plan),
    secondsToNextBonus: result.studyCappedOut
      ? 0
      : secondsPerBonus - (result.studySecondsAfter % secondsPerBonus),
    studyCappedOut: result.studyCappedOut,
  };
}

/** Today's totals, for the dashboard and the corner timer's initial render. */
export async function studyTimeToday(
  userId: string,
  timezone: string,
  plan: "FREE" | "PREMIUM",
) {
  const day = dayKey(new Date(), timezone);
  const row = await db.studyTimeDay.findUnique({ where: { userId_day: { userId, day } } });

  return {
    activeSeconds: row?.activeSeconds ?? 0,
    coinsAwarded: row?.coinsAwarded ?? 0,
    dailyCoinCap: appTimeDailyCoinCap(plan),
    capSeconds: APP_TIME.dailyActiveSecondsCap,

    studySeconds: row?.studySeconds ?? 0,
    studyBonusCoins: (row?.studyBonusesAwarded ?? 0) * STUDY_BONUS.coinsPerBonus,
    studyBonusDailyCap: studyBonusDailyCoinCap(plan),
    studyCapSeconds: STUDY_BONUS.dailyStudySecondsCap,

    coinIntervalSeconds: APP_TIME.secondsPerCoin[plan],
    bonusIntervalSeconds: STUDY_BONUS.secondsPerBonus[plan],
  };
}
