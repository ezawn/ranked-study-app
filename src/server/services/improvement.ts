import "server-only";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import { ai } from "@/lib/ai";
import type { QuestionInput } from "./quizzes";

/**
 * AI improvement quizzes — premium.
 *
 * Built from the questions the user actually got wrong. The result is held as
 * `GeneratedPractice` and is NOT a quiz yet: saving it into their library is
 * their choice, per spec, so nothing clutters the library unasked.
 */

export class PremiumRequired extends Error {
  readonly status = 402;
  constructor(message = "That's a premium feature.") {
    super(message);
    this.name = "PremiumRequired";
  }
}

export interface GeneratedPracticePreview {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  isRealAi: boolean;
  questions: Array<{ type: string; prompt: string; marks: number; optionCount: number }>;
  weakAreas: string[];
}

export async function generateImprovementQuiz(
  userId: string,
  attemptId: string,
  plan: "FREE" | "PREMIUM",
): Promise<GeneratedPracticePreview> {
  if (plan !== "PREMIUM") {
    throw new PremiumRequired(
      "AI improvement quizzes are a premium feature. Upgrade to turn your mistakes into practice.",
    );
  }

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: { select: { title: true, subject: true } },
      answers: { include: { question: true } },
    },
  });

  if (!attempt) throw new NotFoundError("That attempt doesn't exist.");
  if (attempt.userId !== userId) throw new ForbiddenError("That attempt isn't yours.");
  if (attempt.status === "IN_PROGRESS") {
    throw new ValidationError("Finish the quiz first.");
  }

  const dropped = attempt.answers.filter((a) => a.awardedMarks < a.question.marks);
  if (dropped.length === 0) {
    throw new ValidationError("You didn't drop a mark on that one — nothing to improve.");
  }

  const weakAreas = dropped.map(
    (a) =>
      `${a.question.prompt.slice(0, 220)} (scored ${a.awardedMarks}/${a.question.marks})`,
  );
  const examples = attempt.answers.slice(0, 10).map((a) => a.question.prompt.slice(0, 220));

  const provider = ai();
  const generated = await provider.improvementQuiz({
    weakAreas,
    exampleQuestions: examples,
    subject: attempt.quiz.subject ?? undefined,
    title: `${attempt.quiz.title} — weak spots`,
    targetQuestionCount: Math.min(10, Math.max(4, dropped.length * 2)),
  });

  const questions: QuestionInput[] = generated.questions.map((q) => ({
    type: q.type,
    prompt: q.prompt,
    marks: q.marks,
    markScheme: q.markScheme ?? null,
    explanation: q.explanation ?? null,
    options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }));

  const practice = await db.generatedPractice.create({
    data: {
      userId,
      title: generated.title,
      payload: {
        subject: generated.subject,
        description: generated.description,
        questions,
      } as unknown as object,
      saved: false,
    },
    select: { id: true },
  });

  return {
    id: practice.id,
    title: generated.title,
    description: generated.description,
    provider: provider.name,
    isRealAi: provider.isReal,
    weakAreas: dropped.map((a) => a.question.prompt.slice(0, 120)),
    questions: questions.map((q) => ({
      type: q.type,
      prompt: q.prompt,
      marks: q.marks,
      optionCount: q.options.length,
    })),
  };
}

/** Discard practice the user decided not to keep. */
export async function discardPractice(userId: string, practiceId: string): Promise<void> {
  const practice = await db.generatedPractice.findUnique({
    where: { id: practiceId },
    select: { userId: true, saved: true },
  });
  if (!practice) return;
  if (practice.userId !== userId) throw new ForbiddenError("That isn't yours.");
  if (practice.saved) throw new ValidationError("That's already saved to your library.");

  await db.generatedPractice.delete({ where: { id: practiceId } });
}
