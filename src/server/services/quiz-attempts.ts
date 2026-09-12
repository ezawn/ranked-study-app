import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import { ai } from "@/lib/ai";
import {
  clampOverrideMarks,
  isAttemptExpired,
  markAttempt,
  percentage as toPercentage,
  type MarkableQuestion,
  type SubmittedAnswer,
} from "@/lib/quiz/marking";
import { decideQuizReward, SKIP_REASON_TEXT } from "@/lib/coins/decisions";
import { QUIZZES, quizTimeLimitSeconds } from "@/lib/coins/rules";
import { dayKey } from "@/lib/time/day";
import { awardCoins, dailyCount } from "./coins";
import { sharedWithViewer } from "./communities";

/**
 * Taking, marking and rewarding quiz attempts.
 *
 * The security rules that matter, all enforced here:
 *
 *  - Correct answers and mark schemes are stripped from everything sent to the
 *    client while an attempt is open.
 *  - The deadline is written server-side when the attempt starts. The countdown
 *    in the browser is decoration; expiry is judged against the stored deadline
 *    and the server's clock.
 *  - Scores are computed from stored answers, never accepted from the client.
 *  - Coins are decided from `markedPercentage`, frozen at marking time, so a
 *    user overriding the AI marker cannot mint coins.
 */

export interface AttemptQuestion {
  id: string;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "WRITTEN";
  prompt: string;
  marks: number;
  /** Storage key for an image shown with the question, if any. */
  imageKey: string | null;
  /** Empty for written questions. Never carries `isCorrect`. */
  options: Array<{ id: string; text: string }>;
}

export interface OpenAttempt {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  totalMarks: number;
  startedAt: Date;
  serverDeadlineAt: Date;
  /** Seconds left according to the server, at the moment of this response. */
  secondsRemaining: number;
  questions: AttemptQuestion[];
  savedAnswers: Record<string, { selectedOptionIds: string[]; writtenAnswer: string | null }>;
}

// ---------------------------------------------------------------------------
// Starting
// ---------------------------------------------------------------------------

export async function startAttempt(userId: string, quizId: string): Promise<OpenAttempt> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { options: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!quiz) throw new NotFoundError("That quiz doesn't exist.");

  if (quiz.ownerId !== userId && !quiz.isPublic) {
    const shared = await sharedWithViewer(userId, { quizId });
    if (!shared) throw new ForbiddenError("That quiz is private.");
  }

  if (quiz.questions.length === 0) throw new ValidationError("That quiz has no questions yet.");

  // Resume rather than start a second attempt.
  const existing = await db.quizAttempt.findFirst({
    where: { userId, quizId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
    include: { answers: true },
  });

  const now = new Date();

  if (existing && existing.serverDeadlineAt > now) {
    return shapeAttempt(existing, quiz, now, existing.answers);
  }

  // An abandoned attempt whose time ran out gets closed off before a new one
  // starts, so the user is never silently holding two open attempts.
  if (existing) {
    await submitAttempt(userId, existing.id, [], { auto: true }).catch(() => undefined);
  }

  const seconds = quizTimeLimitSeconds(quiz.totalMarks);
  const attempt = await db.quizAttempt.create({
    data: {
      userId,
      quizId,
      status: "IN_PROGRESS",
      startedAt: now,
      serverDeadlineAt: new Date(now.getTime() + seconds * 1000),
      totalMarks: quiz.totalMarks,
    },
  });

  return shapeAttempt(attempt, quiz, now, []);
}

type QuizWithQuestions = Prisma.QuizGetPayload<{
  include: { questions: { include: { options: true } } };
}>;

function shapeAttempt(
  attempt: { id: string; quizId: string; startedAt: Date; serverDeadlineAt: Date; totalMarks: number },
  quiz: QuizWithQuestions,
  now: Date,
  answers: Array<{ questionId: string; selectedOptionIds: string[]; writtenAnswer: string | null }>,
): OpenAttempt {
  return {
    attemptId: attempt.id,
    quizId: quiz.id,
    quizTitle: quiz.title,
    totalMarks: quiz.totalMarks,
    startedAt: attempt.startedAt,
    serverDeadlineAt: attempt.serverDeadlineAt,
    secondsRemaining: Math.max(
      0,
      Math.floor((attempt.serverDeadlineAt.getTime() - now.getTime()) / 1000),
    ),
    // Answers stripped of everything that would give the game away.
    questions: quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      marks: q.marks,
      imageKey: q.imageKey,
      options: q.type === "WRITTEN" ? [] : q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
    savedAnswers: Object.fromEntries(
      answers.map((a) => [
        a.questionId,
        { selectedOptionIds: a.selectedOptionIds, writtenAnswer: a.writtenAnswer },
      ]),
    ),
  };
}

// ---------------------------------------------------------------------------
// Submitting
// ---------------------------------------------------------------------------

export interface SubmitAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  writtenAnswer?: string | null;
}

export interface SubmitResult {
  attemptId: string;
  markingPending: boolean;
  timeExpired: boolean;
  awardedMarks: number;
  totalMarks: number;
  percentage: number;
  coinsAwarded: number;
  coinSkipReason: string | null;
  balance: number | null;
}

export async function submitAttempt(
  userId: string,
  attemptId: string,
  answers: SubmitAnswer[],
  opts: { auto?: boolean } = {},
): Promise<SubmitResult> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });

  if (!attempt) throw new NotFoundError("That attempt doesn't exist.");
  if (attempt.userId !== userId) throw new ForbiddenError("That attempt isn't yours.");
  if (attempt.status !== "IN_PROGRESS") {
    throw new ValidationError("That attempt has already been submitted.");
  }

  const now = new Date();
  const timeExpired = isAttemptExpired(now, attempt.serverDeadlineAt);

  // Only answers to questions that belong to THIS quiz, and only option ids
  // that belong to those questions. Anything else is dropped silently.
  const questionsById = new Map(attempt.quiz.questions.map((q) => [q.id, q]));

  const sanitized: SubmittedAnswer[] = [];
  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question) continue;

    const validOptionIds = new Set(question.options.map((o) => o.id));
    const selected = (answer.selectedOptionIds ?? []).filter((id) => validOptionIds.has(id));

    sanitized.push({
      questionId: question.id,
      selectedOptionIds: question.type === "WRITTEN" ? [] : Array.from(new Set(selected)),
      writtenAnswer:
        question.type === "WRITTEN" ? (answer.writtenAnswer ?? "").slice(0, 20_000) : null,
    });
  }

  const markable: MarkableQuestion[] = attempt.quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    marks: q.marks,
    correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
  }));

  const marking = markAttempt(markable, sanitized);

  await db.$transaction(async (tx) => {
    for (const result of marking.results) {
      const submitted = sanitized.find((a) => a.questionId === result.questionId);
      await tx.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: result.questionId } },
        create: {
          attemptId,
          questionId: result.questionId,
          selectedOptionIds: submitted?.selectedOptionIds ?? [],
          writtenAnswer: submitted?.writtenAnswer ?? null,
          awardedMarks: result.awardedMarks,
          markedAt: result.needsAiMarking ? null : now,
        },
        update: {
          selectedOptionIds: submitted?.selectedOptionIds ?? [],
          writtenAnswer: submitted?.writtenAnswer ?? null,
          awardedMarks: result.awardedMarks,
          markedAt: result.needsAiMarking ? null : now,
        },
      });
    }

    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        timeExpired,
        totalMarks: marking.totalMarks,
        awardedMarks: marking.awardedMarks,
        markingStatus: marking.pendingAiQuestionIds.length > 0 ? "PENDING" : "NOT_REQUIRED",
      },
    });

    if (marking.pendingAiQuestionIds.length > 0) {
      await tx.aiJob.create({
        data: {
          userId,
          type: "MARK_ATTEMPT",
          status: "QUEUED",
          input: { attemptId },
          idempotencyKey: `mark:${attemptId}`,
        },
      });
    }
  });

  if (marking.pendingAiQuestionIds.length > 0) {
    // Mark inline so the product works with no worker running. If it fails, the
    // queued job is still there and the worker (or the cron) picks it up.
    try {
      await markWrittenAnswers(attemptId);
    } catch (error) {
      console.error("[quiz] inline marking failed, leaving it queued", error);
      const pending = await db.quizAttempt.findUnique({
        where: { id: attemptId },
        select: { markingStatus: true, awardedMarks: true, totalMarks: true },
      });
      return {
        attemptId,
        markingPending: true,
        timeExpired,
        awardedMarks: pending?.awardedMarks ?? marking.awardedMarks,
        totalMarks: marking.totalMarks,
        percentage: 0,
        coinsAwarded: 0,
        coinSkipReason: null,
        balance: null,
      };
    }
  }

  const finalised = await finalizeAttempt(attemptId, { auto: opts.auto });

  return {
    attemptId,
    markingPending: false,
    timeExpired,
    awardedMarks: finalised.awardedMarks,
    totalMarks: finalised.totalMarks,
    percentage: finalised.percentage,
    coinsAwarded: finalised.coinsAwarded,
    coinSkipReason: finalised.coinSkipReason,
    balance: finalised.balance,
  };
}

// ---------------------------------------------------------------------------
// AI marking
// ---------------------------------------------------------------------------

/**
 * Mark every written answer on an attempt.
 *
 * Safe to call twice — answers that already have a mark are skipped, so a retry
 * after a partial failure only does the work that is left.
 */
export async function markWrittenAnswers(attemptId: string): Promise<void> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: { include: { question: true } },
    },
  });
  if (!attempt) throw new NotFoundError("That attempt doesn't exist.");

  const provider = ai();
  const pending = attempt.answers.filter(
    (a) => a.question.type === "WRITTEN" && a.markedAt === null,
  );

  for (const answer of pending) {
    const text = (answer.writtenAnswer ?? "").trim();

    if (text.length === 0) {
      await db.attemptAnswer.update({
        where: { id: answer.id },
        data: { awardedMarks: 0, aiMarks: 0, aiFeedback: "No answer given.", aiConfidence: 1, markedAt: new Date() },
      });
      continue;
    }

    const result = await provider.markWritten({
      prompt: answer.question.prompt,
      markScheme: answer.question.markScheme,
      maxMarks: answer.question.marks,
      answer: text,
    });

    // Clamped again here, whatever the provider said.
    const marks = Math.max(0, Math.min(result.marks, answer.question.marks));

    await db.attemptAnswer.update({
      where: { id: answer.id },
      data: {
        awardedMarks: marks,
        aiMarks: marks,
        aiFeedback: result.feedback,
        aiConfidence: result.confidence,
        markedAt: new Date(),
      },
    });
  }

  await db.aiJob.updateMany({
    where: { idempotencyKey: `mark:${attemptId}` },
    data: { status: "COMPLETE", finishedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Finalising and rewarding
// ---------------------------------------------------------------------------

export interface FinalizedAttempt {
  awardedMarks: number;
  totalMarks: number;
  percentage: number;
  coinsAwarded: number;
  coinSkipReason: string | null;
  balance: number | null;
}

/**
 * Total the marks, freeze the marked percentage, and award coins once.
 *
 * Idempotent: the ledger's unique key is the attempt id, so calling this twice
 * (inline and then from the worker, say) awards once.
 */
export async function finalizeAttempt(
  attemptId: string,
  opts: { auto?: boolean } = {},
): Promise<FinalizedAttempt> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      quiz: { select: { id: true, createdAt: true, totalMarks: true } },
      user: { select: { id: true, plan: true, timezone: true, coinBalance: true } },
    },
  });
  if (!attempt) throw new NotFoundError("That attempt doesn't exist.");

  const stillPending = attempt.answers.some((a) => a.markedAt === null);
  const awardedMarks = attempt.answers.reduce((sum, a) => sum + a.awardedMarks, 0);
  const totalMarks = attempt.totalMarks || attempt.quiz.totalMarks;
  const pct = toPercentage(awardedMarks, totalMarks);

  if (stillPending) {
    await db.quizAttempt.update({
      where: { id: attemptId },
      data: { awardedMarks, percentage: pct, markingStatus: "PENDING" },
    });
    return {
      awardedMarks,
      totalMarks,
      percentage: pct,
      coinsAwarded: 0,
      coinSkipReason: null,
      balance: attempt.user.coinBalance,
    };
  }

  // Already settled — return what was recorded rather than re-deciding.
  if (attempt.status === "MARKED") {
    return {
      awardedMarks: attempt.awardedMarks,
      totalMarks,
      percentage: attempt.percentage,
      coinsAwarded: attempt.coinsAwarded,
      coinSkipReason: attempt.coinSkipReason,
      balance: attempt.user.coinBalance,
    };
  }

  const now = new Date();
  const today = dayKey(now, attempt.user.timezone);

  const [lastRewarded, quizzesToday] = await Promise.all([
    db.quizAttempt.findFirst({
      where: { userId: attempt.userId, quizId: attempt.quizId, coinsAwarded: { gt: 0 } },
      orderBy: { submittedAt: "desc" },
      select: { submittedAt: true },
    }),
    dailyCount(attempt.userId, today, "QUIZ_ATTEMPT"),
  ]);

  const decision = decideQuizReward({
    totalMarks,
    percentage: pct,
    timeExpired: attempt.timeExpired,
    quizCreatedAt: attempt.quiz.createdAt,
    lastRewardedAt: lastRewarded?.submittedAt ?? null,
    quizzesRewardedToday: quizzesToday,
    plan: attempt.user.plan,
    now,
  });

  const skipReason = decision.reason ? SKIP_REASON_TEXT[decision.reason] : null;

  if (!decision.eligible) {
    await db.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "MARKED",
        markingStatus: "COMPLETE",
        awardedMarks,
        percentage: pct,
        markedPercentage: pct,
        coinsAwarded: 0,
        coinSkipReason: skipReason,
      },
    });
    return {
      awardedMarks,
      totalMarks,
      percentage: pct,
      coinsAwarded: 0,
      coinSkipReason: skipReason,
      balance: attempt.user.coinBalance,
    };
  }

  const award = await db.$transaction(async (tx) => {
    const result = await awardCoins(
      {
        userId: attempt.userId,
        source: "QUIZ_ATTEMPT",
        baseCoins: decision.baseCoins,
        idempotencyKey: `quiz_attempt:${attemptId}`,
        refType: "quiz",
        refId: attempt.quizId,
        day: today,
        countsTowardDailyLimit: true,
        metadata: { percentage: pct, totalMarks, auto: Boolean(opts.auto) },
      },
      tx,
    );

    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: "MARKED",
        markingStatus: "COMPLETE",
        awardedMarks,
        percentage: pct,
        markedPercentage: pct,
        coinsAwarded: result.coins,
        coinSkipReason: null,
      },
    });

    return result;
  });

  return {
    awardedMarks,
    totalMarks,
    percentage: pct,
    coinsAwarded: award.coins,
    coinSkipReason: null,
    balance: award.balance,
  };
}

// ---------------------------------------------------------------------------
// Results and overrides
// ---------------------------------------------------------------------------

export async function getAttemptResult(userId: string, attemptId: string) {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { id: true, title: true, subject: true, ownerId: true, totalMarks: true } },
      answers: {
        include: {
          question: { include: { options: { orderBy: { position: "asc" } } } },
        },
      },
    },
  });

  if (!attempt) throw new NotFoundError("That attempt doesn't exist.");
  if (attempt.userId !== userId) throw new ForbiddenError("That attempt isn't yours.");

  // Correct answers are only revealed once the attempt is submitted.
  const revealed = attempt.status !== "IN_PROGRESS";

  return {
    ...attempt,
    answers: attempt.answers
      .slice()
      .sort((a, b) => a.question.position - b.question.position)
      .map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        type: answer.question.type,
        prompt: answer.question.prompt,
        marks: answer.question.marks,
        imageKey: answer.question.imageKey,
        markScheme: revealed ? answer.question.markScheme : null,
        explanation: revealed ? answer.question.explanation : null,
        options: answer.question.options.map((o) => ({
          id: o.id,
          text: o.text,
          isCorrect: revealed ? o.isCorrect : false,
        })),
        selectedOptionIds: answer.selectedOptionIds,
        writtenAnswer: answer.writtenAnswer,
        awardedMarks: answer.awardedMarks,
        aiMarks: answer.aiMarks,
        aiFeedback: answer.aiFeedback,
        aiConfidence: answer.aiConfidence,
        overridden: answer.overridden,
        overrideReason: answer.overrideReason,
      })),
  };
}

export interface OverrideResult {
  awardedMarks: number;
  percentage: number;
  /** The score coins were based on — unchanged by overrides. */
  markedPercentage: number;
  coinsAwarded: number;
}

/**
 * Let the user overrule the AI on a written answer.
 *
 * Their score updates, because they should be able to keep an honest record of
 * how they did. Their coins do not, because a self-service marking button that
 * paid out would be the easiest exploit in the app. The UI says so plainly.
 */
export async function overrideMark(
  userId: string,
  attemptId: string,
  questionId: string,
  marks: number,
  reason: string | null,
): Promise<OverrideResult> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: { include: { question: true } } },
  });

  if (!attempt) throw new NotFoundError("That attempt doesn't exist.");
  if (attempt.userId !== userId) throw new ForbiddenError("That attempt isn't yours.");
  if (attempt.status === "IN_PROGRESS") {
    throw new ValidationError("Submit the quiz before changing any marks.");
  }

  const answer = attempt.answers.find((a) => a.questionId === questionId);
  if (!answer) throw new NotFoundError("That question isn't part of this attempt.");
  if (answer.question.type !== "WRITTEN") {
    throw new ValidationError("Only AI-marked written answers can be overridden.");
  }

  const clamped = clampOverrideMarks(marks, answer.question.marks);

  const updated = await db.$transaction(async (tx) => {
    await tx.attemptAnswer.update({
      where: { id: answer.id },
      data: {
        awardedMarks: clamped,
        overridden: true,
        overrideMarks: clamped,
        overrideReason: reason?.slice(0, 1000) || null,
      },
    });

    const answers = await tx.attemptAnswer.findMany({
      where: { attemptId },
      select: { awardedMarks: true },
    });
    const awardedMarks = answers.reduce((sum, a) => sum + a.awardedMarks, 0);
    const pct = toPercentage(awardedMarks, attempt.totalMarks);

    return tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        awardedMarks,
        percentage: pct,
        overrideCount: { increment: 1 },
      },
      select: {
        awardedMarks: true,
        percentage: true,
        markedPercentage: true,
        coinsAwarded: true,
      },
    });
  });

  return updated;
}

/** Attempt history for a quiz. */
export async function attemptHistory(userId: string, quizId: string) {
  return db.quizAttempt.findMany({
    where: { userId, quizId, status: { in: ["SUBMITTED", "MARKED"] } },
    orderBy: { submittedAt: "desc" },
    take: 10,
    select: {
      id: true,
      submittedAt: true,
      awardedMarks: true,
      totalMarks: true,
      percentage: true,
      coinsAwarded: true,
      timeExpired: true,
      markingStatus: true,
      overrideCount: true,
    },
  });
}

/** What this quiz would pay right now, for the pre-attempt screen. */
export async function quizRewardStatus(userId: string, quizId: string, plan: "FREE" | "PREMIUM") {
  const now = new Date();
  const [quiz, user] = await Promise.all([
    db.quiz.findUnique({ where: { id: quizId }, select: { createdAt: true, totalMarks: true } }),
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);
  if (!quiz) return null;

  const today = dayKey(now, user?.timezone ?? "UTC");
  const [lastRewarded, quizzesToday] = await Promise.all([
    db.quizAttempt.findFirst({
      where: { userId, quizId, coinsAwarded: { gt: 0 } },
      orderBy: { submittedAt: "desc" },
      select: { submittedAt: true },
    }),
    dailyCount(userId, today, "QUIZ_ATTEMPT"),
  ]);

  // Asks "would a top score pay?" — the gates, not the grade.
  const decision = decideQuizReward({
    totalMarks: quiz.totalMarks,
    percentage: 100,
    timeExpired: false,
    quizCreatedAt: quiz.createdAt,
    lastRewardedAt: lastRewarded?.submittedAt ?? null,
    quizzesRewardedToday: quizzesToday,
    plan,
    now,
  });

  const cooldownEnd = lastRewarded?.submittedAt
    ? new Date(lastRewarded.submittedAt.getTime() + QUIZZES.rewardCooldownDays * 24 * 60 * 60 * 1000)
    : null;
  const ageGate = new Date(quiz.createdAt.getTime() + QUIZZES.quizAgeHours * 60 * 60 * 1000);

  return {
    eligible: decision.eligible,
    reason: decision.reason ? SKIP_REASON_TEXT[decision.reason] : null,
    nextEligibleAt:
      cooldownEnd && cooldownEnd > ageGate ? cooldownEnd : ageGate > now ? ageGate : null,
    quizzesRewardedToday: quizzesToday,
    dailyLimit: QUIZZES.dailyQuizLimit[plan],
    timeLimitSeconds: quizTimeLimitSeconds(quiz.totalMarks),
    minMarks: QUIZZES.minMarksForCoins,
    totalMarks: quiz.totalMarks,
  };
}
