import "server-only";

import { Prisma, type QuestionType, type QuizOrigin } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import { QUIZZES, quizTimeLimitSeconds } from "@/lib/coins/rules";
import { sharedWithViewer } from "./communities";

/**
 * Quiz authoring and the public quiz library.
 *
 * Attempt-taking and marking live in `quiz-attempts.ts` — the split matters,
 * because this file is allowed to return correct answers and mark schemes to
 * the owner, and that one never is.
 */

export interface QuestionInput {
  id?: string;
  type: QuestionType;
  prompt: string;
  marks: number;
  markScheme?: string | null;
  explanation?: string | null;
  /** Storage key for an optional image shown with the question. */
  imageKey?: string | null;
  options: Array<{ id?: string; text: string; isCorrect: boolean }>;
}

export interface QuizInput {
  title: string;
  description?: string | null;
  subject?: string | null;
  isPublic?: boolean;
  origin?: QuizOrigin;
  questions: QuestionInput[];
}

const MAX_QUESTIONS = 100;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateQuestions(questions: QuestionInput[]): QuestionInput[] {
  const cleaned = questions
    .map((q) => ({
      ...q,
      prompt: q.prompt.trim(),
      markScheme: q.markScheme?.trim() || null,
      explanation: q.explanation?.trim() || null,
      imageKey: q.imageKey || null,
      marks: Math.max(1, Math.min(25, Math.round(q.marks))),
      options: q.options
        .map((o) => ({ ...o, text: o.text.trim() }))
        .filter((o) => o.text.length > 0),
    }))
    // A question with only an image and no text is fine — a diagram to label,
    // a graph to read off.
    .filter((q) => q.prompt.length > 0 || q.imageKey);

  if (cleaned.length === 0) {
    throw new ValidationError("A quiz needs at least one question.");
  }
  if (cleaned.length > MAX_QUESTIONS) {
    throw new ValidationError(`Quizzes are capped at ${MAX_QUESTIONS} questions.`);
  }

  for (const [index, q] of cleaned.entries()) {
    if (q.type === "WRITTEN") continue;

    if (q.options.length < 2) {
      throw new ValidationError(`Question ${index + 1} needs at least two options.`);
    }
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct === 0) {
      throw new ValidationError(`Question ${index + 1} needs at least one correct answer.`);
    }
    if (q.type === "MCQ_SINGLE" && correct > 1) {
      throw new ValidationError(
        `Question ${index + 1} is single-answer but has ${correct} correct options. Switch it to multiple-answer.`,
      );
    }
  }

  return cleaned;
}

function totals(questions: QuestionInput[]) {
  return {
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    questionCount: questions.length,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listMyQuizzes(userId: string, opts: { query?: string; subject?: string } = {}) {
  const where: Prisma.QuizWhereInput = { ownerId: userId };
  if (opts.query) {
    where.OR = [
      { title: { contains: opts.query, mode: "insensitive" } },
      { description: { contains: opts.query, mode: "insensitive" } },
    ];
  }
  if (opts.subject) where.subject = opts.subject;

  const quizzes = await db.quiz.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      totalMarks: true,
      questionCount: true,
      isPublic: true,
      origin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const best = await db.quizAttempt.groupBy({
    by: ["quizId"],
    where: { userId, status: "MARKED", quizId: { in: quizzes.map((q) => q.id) } },
    _max: { percentage: true },
    _count: { _all: true },
  });
  const stats = new Map(best.map((b) => [b.quizId, b]));

  return quizzes.map((quiz) => ({
    ...quiz,
    bestPercentage: stats.get(quiz.id)?._max.percentage ?? null,
    attemptCount: stats.get(quiz.id)?._count._all ?? 0,
    coinEligible: quiz.totalMarks >= QUIZZES.minMarksForCoins,
    timeLimitSeconds: quizTimeLimitSeconds(quiz.totalMarks),
  }));
}

export async function listPublicQuizzes(
  viewerId: string,
  opts: { query?: string; subject?: string; take?: number } = {},
) {
  const where: Prisma.QuizWhereInput = { isPublic: true, ownerId: { not: viewerId } };
  if (opts.query) {
    where.OR = [
      { title: { contains: opts.query, mode: "insensitive" } },
      { description: { contains: opts.query, mode: "insensitive" } },
      { subject: { contains: opts.query, mode: "insensitive" } },
    ];
  }
  if (opts.subject) where.subject = opts.subject;

  const quizzes = await db.quiz.findMany({
    where,
    orderBy: [{ downloads: "desc" }, { publishedAt: "desc" }],
    take: opts.take ?? 40,
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      totalMarks: true,
      questionCount: true,
      downloads: true,
      publishedAt: true,
      owner: { select: { name: true, username: true } },
    },
  });

  const copies = await db.quiz.findMany({
    where: { ownerId: viewerId, sourceQuizId: { in: quizzes.map((q) => q.id) } },
    select: { sourceQuizId: true },
  });
  const copied = new Set(copies.map((c) => c.sourceQuizId));

  return quizzes.map((quiz) => ({
    ...quiz,
    alreadySaved: copied.has(quiz.id),
    timeLimitSeconds: quizTimeLimitSeconds(quiz.totalMarks),
  }));
}

/** Full quiz including answers — owner only. */
export async function getOwnedQuiz(userId: string, quizId: string) {
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
  if (quiz.ownerId !== userId) throw new ForbiddenError("That quiz isn't yours.");
  return quiz;
}

/**
 * Quiz metadata for anyone allowed to see it.
 *
 * Deliberately excludes options' `isCorrect` and every mark scheme — this is
 * what the quiz overview page uses, and a public quiz page must not hand out
 * the answer key.
 */
export async function getViewableQuiz(userId: string, quizId: string) {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      subject: true,
      isPublic: true,
      origin: true,
      totalMarks: true,
      questionCount: true,
      downloads: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, username: true } },
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          type: true,
          prompt: true,
          marks: true,
          position: true,
          imageKey: true,
        },
      },
    },
  });

  if (!quiz) throw new NotFoundError("That quiz doesn't exist.");

  if (quiz.ownerId !== userId && !quiz.isPublic) {
    // Shared into a community they're in counts as access, without the owner
    // having to publish it publicly.
    const shared = await sharedWithViewer(userId, { quizId });
    if (!shared) throw new ForbiddenError("That quiz is private.");
  }

  return quiz;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createQuiz(userId: string, input: QuizInput) {
  const questions = validateQuestions(input.questions);
  const title = input.title.trim();
  if (!title) throw new ValidationError("Give the quiz a title.");

  const { totalMarks, questionCount } = totals(questions);

  return db.quiz.create({
    data: {
      ownerId: userId,
      title,
      description: input.description?.trim() || null,
      subject: input.subject?.trim() || null,
      isPublic: Boolean(input.isPublic),
      publishedAt: input.isPublic ? new Date() : null,
      origin: input.origin ?? "MANUAL",
      totalMarks,
      questionCount,
      questions: {
        create: questions.map((q, index) => ({
          type: q.type,
          prompt: q.prompt,
          marks: q.marks,
          markScheme: q.markScheme,
          explanation: q.explanation,
          imageKey: q.imageKey ?? null,
          position: index,
          options: {
            create: q.options.map((o, oIndex) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              position: oIndex,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });
}

export async function updateQuiz(userId: string, quizId: string, input: QuizInput) {
  await getOwnedQuiz(userId, quizId);
  const questions = validateQuestions(input.questions);
  const title = input.title.trim();
  if (!title) throw new ValidationError("Give the quiz a title.");

  const { totalMarks, questionCount } = totals(questions);
  const keptIds = questions.map((q) => q.id).filter((id): id is string => Boolean(id));

  return db.$transaction(async (tx) => {
    await tx.question.deleteMany({
      where: { quizId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
    });

    for (const [index, q] of questions.entries()) {
      if (q.id) {
        await tx.question.update({
          where: { id: q.id },
          data: {
            type: q.type,
            prompt: q.prompt,
            marks: q.marks,
            markScheme: q.markScheme,
            explanation: q.explanation,
            imageKey: q.imageKey ?? null,
            position: index,
          },
        });
        // Options are replaced wholesale — attempt answers reference option ids,
        // but a marked attempt has already stored its awarded marks, so past
        // results are unaffected.
        await tx.questionOption.deleteMany({ where: { questionId: q.id } });
        if (q.options.length) {
          await tx.questionOption.createMany({
            data: q.options.map((o, oIndex) => ({
              questionId: q.id!,
              text: o.text,
              isCorrect: o.isCorrect,
              position: oIndex,
            })),
          });
        }
      } else {
        await tx.question.create({
          data: {
            quizId,
            type: q.type,
            prompt: q.prompt,
            marks: q.marks,
            markScheme: q.markScheme,
            explanation: q.explanation,
            imageKey: q.imageKey ?? null,
            position: index,
            options: {
              create: q.options.map((o, oIndex) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                position: oIndex,
              })),
            },
          },
        });
      }
    }

    return tx.quiz.update({
      where: { id: quizId },
      data: {
        title,
        description: input.description?.trim() || null,
        subject: input.subject?.trim() || null,
        totalMarks,
        questionCount,
      },
      select: { id: true },
    });
  });
}

export async function deleteQuiz(userId: string, quizId: string) {
  await getOwnedQuiz(userId, quizId);
  await db.quiz.delete({ where: { id: quizId } });
}

export async function setQuizVisibility(userId: string, quizId: string, isPublic: boolean) {
  const quiz = await getOwnedQuiz(userId, quizId);

  if (isPublic && quiz.questionCount < 3) {
    throw new ValidationError("Quizzes need at least 3 questions before you can publish them.");
  }

  return db.quiz.update({
    where: { id: quizId },
    data: { isPublic, publishedAt: isPublic ? (quiz.publishedAt ?? new Date()) : null },
    select: { id: true, isPublic: true },
  });
}

/** Copy a public quiz into the user's library, answers and all. */
export async function copyPublicQuiz(userId: string, quizId: string) {
  const source = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { options: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!source) throw new NotFoundError("That quiz doesn't exist.");
  if (source.ownerId === userId) throw new ValidationError("That quiz is already yours.");

  if (!source.isPublic) {
    const shared = await sharedWithViewer(userId, { quizId });
    if (!shared) throw new ForbiddenError("That quiz isn't shared with you.");
  }

  const existing = await db.quiz.findFirst({
    where: { ownerId: userId, sourceQuizId: quizId },
    select: { id: true },
  });
  if (existing) return existing;

  return db.$transaction(async (tx) => {
    const copy = await tx.quiz.create({
      data: {
        ownerId: userId,
        title: source.title,
        description: source.description,
        subject: source.subject,
        sourceQuizId: source.id,
        origin: source.origin,
        isPublic: false,
        totalMarks: source.totalMarks,
        questionCount: source.questionCount,
        questions: {
          create: source.questions.map((q, index) => ({
            type: q.type,
            prompt: q.prompt,
            marks: q.marks,
            markScheme: q.markScheme,
            explanation: q.explanation,
            imageKey: q.imageKey,
            position: index,
            options: {
              create: q.options.map((o, oIndex) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                position: oIndex,
              })),
            },
          })),
        },
      },
      select: { id: true },
    });

    await tx.quiz.update({ where: { id: source.id }, data: { downloads: { increment: 1 } } });

    await tx.libraryItem.upsert({
      where: { userId_quizId: { userId, quizId: copy.id } },
      create: { userId, type: "QUIZ", quizId: copy.id },
      update: {},
    });

    return copy;
  });
}

/** Save an AI-generated quiz into the library. Always the user's choice. */
export async function saveGeneratedQuiz(
  userId: string,
  practiceId: string,
): Promise<{ id: string }> {
  const practice = await db.generatedPractice.findUnique({ where: { id: practiceId } });
  if (!practice) throw new NotFoundError("That generated quiz has expired.");
  if (practice.userId !== userId) throw new ForbiddenError("That isn't yours.");
  if (practice.quizId) return { id: practice.quizId };

  const payload = practice.payload as unknown as {
    subject?: string | null;
    description?: string | null;
    questions: QuestionInput[];
  };

  const quiz = await createQuiz(userId, {
    title: practice.title,
    subject: payload.subject ?? null,
    description: payload.description ?? null,
    origin: "AI_IMPROVEMENT",
    questions: payload.questions,
  });

  await db.generatedPractice.update({
    where: { id: practiceId },
    data: { quizId: quiz.id, saved: true },
  });

  return quiz;
}
