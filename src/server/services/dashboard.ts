import "server-only";

import { db } from "@/lib/db";
import { dayKey } from "@/lib/time/day";
import { streakMultiplier } from "@/lib/coins/rules";
import { earningSummary } from "./coins";
import { studyTimeToday } from "./study-time";
import type { SessionUser } from "@/lib/auth/session";

export async function getDashboard(user: SessionUser) {
  const now = new Date();
  const today = dayKey(now, user.timezone);

  const [
    coins,
    streak,
    dueCards,
    setCount,
    quizCount,
    todayAssignment,
    recentSets,
    recentQuizzes,
    communityCount,
    attemptsThisWeek,
    studyTime,
  ] = await Promise.all([
    earningSummary(user.id, user.timezone, 6),
    db.streakState.findUnique({ where: { userId: user.id } }),
    db.cardReviewState.count({ where: { userId: user.id, dueAt: { lte: now } } }),
    db.flashcardSet.count({ where: { ownerId: user.id } }),
    db.quiz.count({ where: { ownerId: user.id } }),
    db.dailyQuizAssignment.findUnique({
      where: { userId_day: { userId: user.id, day: today } },
      include: { attempt: true },
    }),
    db.flashcardSet.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: { id: true, title: true, subject: true, cardCount: true, updatedAt: true },
    }),
    db.quiz.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        subject: true,
        totalMarks: true,
        questionCount: true,
        updatedAt: true,
      },
    }),
    db.communityMember.count({ where: { userId: user.id } }),
    db.quizAttempt.count({
      where: {
        userId: user.id,
        status: "MARKED",
        submittedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    studyTimeToday(user.id, user.timezone, user.plan),
  ]);

  /*
   * Mastery for the four cards on the dashboard.
   *
   * The dashboard used to hardcode every recent item to `common`, which meant
   * the one encoding this product defends — colour is rarity, rarity is
   * mastery — was absent from the surface it matters most on. These are the
   * same two aggregates the flashcards and quizzes lists already run, scoped
   * to the handful of ids on screen, and they are display-only: nothing here
   * decides what anything is worth. Coins stay server-side, elsewhere.
   */
  const [dueBySetRows, bestByQuizRows] = await Promise.all([
    recentSets.length
      ? db.cardReviewState.groupBy({
          by: ["setId"],
          where: {
            userId: user.id,
            dueAt: { lte: now },
            setId: { in: recentSets.map((s) => s.id) },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    recentQuizzes.length
      ? db.quizAttempt.groupBy({
          by: ["quizId"],
          where: {
            userId: user.id,
            status: "MARKED",
            quizId: { in: recentQuizzes.map((q) => q.id) },
          },
          _max: { percentage: true },
        })
      : Promise.resolve([]),
  ]);

  const dueBySet = new Map(dueBySetRows.map((d) => [d.setId, d._count._all]));
  const bestByQuiz = new Map(bestByQuizRows.map((b) => [b.quizId, b._max.percentage]));

  const currentStreak = streak?.currentStreak ?? 0;

  return {
    today,
    coins,
    streak: {
      current: currentStreak,
      longest: streak?.longestStreak ?? 0,
      multiplier: streakMultiplier(Math.max(1, currentStreak)),
      /** Whether today's attempt is already done. */
      doneToday: todayAssignment?.status === "COMPLETED",
    },
    dailyQuiz: {
      exists: Boolean(todayAssignment),
      completed: todayAssignment?.status === "COMPLETED",
      questionCount: Array.isArray(todayAssignment?.questions)
        ? (todayAssignment.questions as unknown[]).length
        : 0,
      coinsEarned: todayAssignment?.attempt?.coinsAwarded ?? 0,
      correctCount: todayAssignment?.attempt?.correctCount ?? 0,
    },
    dueCards,
    setCount,
    quizCount,
    communityCount,
    attemptsThisWeek,
    recentSets: recentSets.map((s) => ({ ...s, dueCount: dueBySet.get(s.id) ?? 0 })),
    recentQuizzes: recentQuizzes.map((q) => ({
      ...q,
      bestPercentage: bestByQuiz.get(q.id) ?? null,
    })),
    studyTime,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
