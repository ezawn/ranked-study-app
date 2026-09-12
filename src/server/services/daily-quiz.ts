import "server-only";

import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/auth/session";
import { advanceStreak, computeDailyQuizReward, effectiveStreak } from "@/lib/coins/decisions";
import { DAILY_QUIZ, streakMultiplier } from "@/lib/coins/rules";
import { markMultipleChoice, markSingleChoice } from "@/lib/quiz/marking";
import { dayKey } from "@/lib/time/day";
import { shuffle } from "@/lib/utils";
import { awardCoins } from "./coins";

/**
 * The daily quiz and the streak that rides on it.
 *
 * Questions are drawn from the user's own material — quizzes they wrote and
 * quizzes they saved out of the public library (saving makes a copy they own),
 * exactly as specified. Nothing comes from strangers' content they've never
 * seen.
 *
 * Only multiple-choice questions are used, so the daily quiz marks instantly
 * and costs nothing to run. Written questions still belong in ordinary quizzes,
 * where the AI marker and your right to overrule it both apply.
 *
 * The questions are SNAPSHOTTED into the assignment when it's generated, so
 * editing or deleting the source quiz later in the day can't break it.
 */

interface SnapshotQuestion {
  questionId: string;
  quizId: string;
  quizTitle: string;
  subject: string | null;
  type: "MCQ_SINGLE" | "MCQ_MULTI";
  prompt: string;
  marks: number;
  options: Array<{ id: string; text: string }>;
  /** Server-side only. Stripped before anything reaches the browser. */
  correctOptionIds: string[];
}

export interface DailyQuestion {
  questionId: string;
  quizId: string;
  quizTitle: string;
  subject: string | null;
  type: "MCQ_SINGLE" | "MCQ_MULTI";
  prompt: string;
  options: Array<{ id: string; text: string }>;
}

export interface DailyQuizState {
  day: string;
  exists: boolean;
  completed: boolean;
  questions: DailyQuestion[];
  streak: number;
  multiplier: number;
  /** Set when the day is already done. */
  result: {
    correctCount: number;
    totalCount: number;
    allCorrect: boolean;
    coinsAwarded: number;
    multiplier: number;
    answers: Array<{
      questionId: string;
      correct: boolean;
      selectedOptionIds: string[];
      correctOptionIds: string[];
    }>;
  } | null;
  /** True when the user has no multiple-choice questions to draw from yet. */
  noSourceMaterial: boolean;
}

// ---------------------------------------------------------------------------

/** Re-exported so callers of this service don't need two imports. */
export { effectiveStreak };

export async function getDailyQuiz(
  userId: string,
  timezone: string,
): Promise<DailyQuizState> {
  const today = dayKey(new Date(), timezone);

  const [existing, streakState] = await Promise.all([
    db.dailyQuizAssignment.findUnique({
      where: { userId_day: { userId, day: today } },
      include: { attempt: true },
    }),
    db.streakState.findUnique({ where: { userId } }),
  ]);

  const live = effectiveStreak(
    streakState?.currentStreak ?? 0,
    streakState?.lastAttemptDay ?? null,
    today,
  );

  // The streak this attempt would land on if they play now.
  const prospective = advanceStreak({
    currentStreak: streakState?.currentStreak ?? 0,
    lastAttemptDay: streakState?.lastAttemptDay ?? null,
    today,
  }).streak;

  if (existing) {
    const snapshot = existing.questions as unknown as SnapshotQuestion[];
    const attempt = existing.attempt;

    return {
      day: today,
      exists: true,
      completed: existing.status === "COMPLETED",
      questions: snapshot.map(strip),
      streak: live,
      multiplier: streakMultiplier(Math.max(1, prospective)),
      result: attempt
        ? {
            correctCount: attempt.correctCount,
            totalCount: attempt.totalCount,
            allCorrect: attempt.allCorrect,
            coinsAwarded: attempt.coinsAwarded,
            multiplier: Number(attempt.multiplier),
            answers: (attempt.answers as unknown as Array<{
              questionId: string;
              correct: boolean;
              selectedOptionIds: string[];
            }>).map((a) => ({
              ...a,
              correctOptionIds:
                snapshot.find((q) => q.questionId === a.questionId)?.correctOptionIds ?? [],
            })),
          }
        : null,
      noSourceMaterial: false,
    };
  }

  const snapshot = await pickQuestions(userId);

  if (snapshot.length === 0) {
    return {
      day: today,
      exists: false,
      completed: false,
      questions: [],
      streak: live,
      multiplier: streakMultiplier(Math.max(1, prospective)),
      result: null,
      noSourceMaterial: true,
    };
  }

  const created = await db.dailyQuizAssignment.upsert({
    where: { userId_day: { userId, day: today } },
    create: {
      userId,
      day: today,
      questions: snapshot as unknown as object,
      status: "PENDING",
    },
    update: {},
    include: { attempt: true },
  });

  return {
    day: today,
    exists: true,
    completed: created.status === "COMPLETED",
    questions: (created.questions as unknown as SnapshotQuestion[]).map(strip),
    streak: live,
    multiplier: streakMultiplier(Math.max(1, prospective)),
    result: null,
    noSourceMaterial: false,
  };
}

function strip(question: SnapshotQuestion): DailyQuestion {
  return {
    questionId: question.questionId,
    quizId: question.quizId,
    quizTitle: question.quizTitle,
    subject: question.subject,
    type: question.type,
    prompt: question.prompt,
    options: question.options,
  };
}

/**
 * Pick 3-5 questions, spread across as many different subjects as the user has.
 */
async function pickQuestions(userId: string): Promise<SnapshotQuestion[]> {
  const quizzes = await db.quiz.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      subject: true,
      questions: {
        where: { type: { in: ["MCQ_SINGLE", "MCQ_MULTI"] } },
        select: {
          id: true,
          type: true,
          prompt: true,
          marks: true,
          options: { orderBy: { position: "asc" }, select: { id: true, text: true, isCorrect: true } },
        },
      },
    },
  });

  const pool: SnapshotQuestion[] = [];
  for (const quiz of quizzes) {
    for (const question of quiz.questions) {
      const correct = question.options.filter((o) => o.isCorrect).map((o) => o.id);
      if (correct.length === 0 || question.options.length < 2) continue;

      pool.push({
        questionId: question.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        subject: quiz.subject,
        type: question.type as "MCQ_SINGLE" | "MCQ_MULTI",
        prompt: question.prompt,
        marks: question.marks,
        options: shuffle(question.options).map((o) => ({ id: o.id, text: o.text })),
        correctOptionIds: correct,
      });
    }
  }

  if (pool.length === 0) return [];

  const target = Math.min(
    pool.length,
    DAILY_QUIZ.minQuestions +
      Math.floor(Math.random() * (DAILY_QUIZ.maxQuestions - DAILY_QUIZ.minQuestions + 1)),
  );

  // Round-robin across subjects first so a five-question day isn't five
  // questions from one topic.
  const bySubject = new Map<string, SnapshotQuestion[]>();
  for (const question of shuffle(pool)) {
    const key = question.subject ?? "__none";
    const list = bySubject.get(key) ?? [];
    list.push(question);
    bySubject.set(key, list);
  }

  const buckets = shuffle([...bySubject.values()]);
  const picked: SnapshotQuestion[] = [];
  let index = 0;
  while (picked.length < target && buckets.some((b) => b.length > 0)) {
    const bucket = buckets[index % buckets.length]!;
    const next = bucket.shift();
    if (next) picked.push(next);
    index++;
  }

  return picked;
}

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

export interface DailySubmitAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export interface DailySubmitResult {
  correctCount: number;
  totalCount: number;
  allCorrect: boolean;
  coinsAwarded: number;
  balance: number;
  streak: number;
  streakContinued: boolean;
  streakReset: boolean;
  multiplier: number;
  answers: Array<{
    questionId: string;
    correct: boolean;
    selectedOptionIds: string[];
    correctOptionIds: string[];
  }>;
}

export async function submitDailyQuiz(
  userId: string,
  answers: DailySubmitAnswer[],
): Promise<DailySubmitResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true, coinBalance: true },
  });
  if (!user) throw new NotFoundError("Unknown user.");

  const today = dayKey(new Date(), user.timezone);

  const assignment = await db.dailyQuizAssignment.findUnique({
    where: { userId_day: { userId, day: today } },
    include: { attempt: true },
  });

  if (!assignment) throw new NotFoundError("Today's quiz hasn't been generated yet.");
  if (assignment.attempt) throw new ValidationError("You've already done today's quiz.");

  const snapshot = assignment.questions as unknown as SnapshotQuestion[];
  const byId = new Map(answers.map((a) => [a.questionId, a]));

  // Marked from the snapshot's stored correct answers. The client's selections
  // are the only input, and option ids outside the question are dropped.
  const marked = snapshot.map((question) => {
    const submitted = byId.get(question.questionId);
    const validIds = new Set(question.options.map((o) => o.id));
    const selected = Array.from(
      new Set((submitted?.selectedOptionIds ?? []).filter((id) => validIds.has(id))),
    );

    const awarded =
      question.type === "MCQ_SINGLE"
        ? markSingleChoice(selected, question.correctOptionIds, 1)
        : markMultipleChoice(selected, question.correctOptionIds, 1);

    return {
      questionId: question.questionId,
      selectedOptionIds: selected,
      correctOptionIds: question.correctOptionIds,
      correct: awarded >= 1,
    };
  });

  const correctCount = marked.filter((m) => m.correct).length;

  const streakState = await db.streakState.findUnique({ where: { userId } });
  const streak = advanceStreak({
    currentStreak: streakState?.currentStreak ?? 0,
    lastAttemptDay: streakState?.lastAttemptDay ?? null,
    today,
  });

  const reward = computeDailyQuizReward({
    correctCount,
    totalCount: marked.length,
    streakDays: streak.streak,
  });

  const result = await db.$transaction(async (tx) => {
    await tx.dailyQuizAttempt.create({
      data: {
        assignmentId: assignment.id,
        answers: marked.map((m) => ({
          questionId: m.questionId,
          selectedOptionIds: m.selectedOptionIds,
          correct: m.correct,
        })) as unknown as object,
        correctCount,
        totalCount: marked.length,
        allCorrect: reward.allCorrect,
        streakAtAttempt: streak.streak,
        multiplier: reward.multiplier,
        coinsAwarded: 0,
      },
    });

    await tx.dailyQuizAssignment.update({
      where: { id: assignment.id },
      data: { status: "COMPLETED" },
    });

    await tx.streakState.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: streak.streak,
        longestStreak: streak.streak,
        lastAttemptDay: today,
      },
      update: {
        currentStreak: streak.streak,
        longestStreak: Math.max(streakState?.longestStreak ?? 0, streak.streak),
        lastAttemptDay: today,
      },
    });

    // The base coins and the all-correct bonus are separate ledger lines, so
    // the history reads honestly, but both obey the same multiplier.
    let coins = 0;
    let balance = user.coinBalance;

    if (reward.baseCoins > 0) {
      const award = await awardCoins(
        {
          userId,
          source: "DAILY_QUIZ",
          baseCoins: reward.baseCoins,
          multiplier: reward.multiplier,
          idempotencyKey: `daily:${userId}:${today}`,
          refType: "daily_quiz",
          refId: assignment.id,
          metadata: { correctCount, totalCount: marked.length, streak: streak.streak },
        },
        tx,
      );
      coins += award.coins;
      balance = award.balance;
    }

    if (reward.bonusCoins > 0) {
      const bonus = await awardCoins(
        {
          userId,
          source: "DAILY_QUIZ_BONUS",
          baseCoins: reward.bonusCoins,
          multiplier: reward.multiplier,
          idempotencyKey: `daily-bonus:${userId}:${today}`,
          refType: "daily_quiz",
          refId: assignment.id,
          metadata: { streak: streak.streak },
        },
        tx,
      );
      coins += bonus.coins;
      balance = bonus.balance;
    }

    await tx.dailyQuizAttempt.update({
      where: { assignmentId: assignment.id },
      data: { coinsAwarded: coins },
    });

    return { coins, balance };
  });

  return {
    correctCount,
    totalCount: marked.length,
    allCorrect: reward.allCorrect,
    coinsAwarded: result.coins,
    balance: result.balance,
    streak: streak.streak,
    streakContinued: streak.continued,
    streakReset: streak.reset,
    multiplier: reward.multiplier,
    answers: marked,
  };
}

// ---------------------------------------------------------------------------
// Streak page data
// ---------------------------------------------------------------------------

export async function getStreakOverview(userId: string, timezone: string) {
  const today = dayKey(new Date(), timezone);

  const [state, recent, totals] = await Promise.all([
    db.streakState.findUnique({ where: { userId } }),
    db.dailyQuizAssignment.findMany({
      where: { userId },
      orderBy: { day: "desc" },
      take: 60,
      select: {
        day: true,
        status: true,
        attempt: {
          select: { correctCount: true, totalCount: true, coinsAwarded: true, allCorrect: true },
        },
      },
    }),
    db.coinLedgerEntry.aggregate({
      where: { userId, source: { in: ["DAILY_QUIZ", "DAILY_QUIZ_BONUS"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const live = effectiveStreak(state?.currentStreak ?? 0, state?.lastAttemptDay ?? null, today);

  return {
    today,
    currentStreak: live,
    storedStreak: state?.currentStreak ?? 0,
    longestStreak: state?.longestStreak ?? 0,
    lastAttemptDay: state?.lastAttemptDay ?? null,
    multiplier: streakMultiplier(Math.max(1, live)),
    nextMultiplier: streakMultiplier(Math.max(1, live) + 1),
    daysToMax: Math.max(
      0,
      Math.ceil(
        (DAILY_QUIZ.multiplierMax - DAILY_QUIZ.multiplierStart) / DAILY_QUIZ.multiplierStep,
      ) +
        1 -
        Math.max(1, live),
    ),
    doneToday: recent.some((r) => r.day === today && r.status === "COMPLETED"),
    history: recent,
    coinsFromDaily: totals._sum.amount ?? 0,
    daysPlayed: recent.filter((r) => r.status === "COMPLETED").length,
  };
}
