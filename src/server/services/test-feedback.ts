import "server-only";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import { ai } from "@/lib/ai";
import type { StrengthItem, TopicScore, WeaknessItem } from "@/lib/ai/types";
import { consumeQuota, getUpload } from "./uploads";
import { PremiumRequired } from "./improvement";
import type { QuestionInput } from "./quizzes";

/**
 * Test feedback.
 *
 * Upload a completed paper, get back what you're good at and where the marks
 * are going. Premium turns the weaknesses into practice you can add to your
 * quiz library — again, only if you choose to save it.
 */

export interface FeedbackReport {
  id: string;
  submissionId: string;
  title: string;
  subject: string | null;
  summary: string;
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  topicBreakdown: TopicScore[];
  estimatedScore: number | null;
  createdAt: Date;
  isRealAi: boolean;
}

export async function analyseTest(
  userId: string,
  uploadId: string,
  plan: "FREE" | "PREMIUM",
  timezone: string,
  meta: { title?: string; subject?: string } = {},
): Promise<FeedbackReport> {
  const upload = await getUpload(userId, uploadId);
  if (!upload.extractedText) {
    throw new ValidationError("There's no readable text in that upload.");
  }

  // Its own daily allowance, separate from PDF-to-quiz.
  await consumeQuota(userId, "TEST_FEEDBACK", plan, timezone);

  const title = meta.title?.trim() || upload.filename.replace(/\.pdf$/i, "");

  const submission = await db.testSubmission.create({
    data: {
      userId,
      uploadId: upload.id,
      title,
      subject: meta.subject?.trim() || null,
      status: "PROCESSING",
    },
    select: { id: true },
  });

  const provider = ai();

  try {
    const analysis = await provider.analyseTest({
      text: upload.extractedText,
      title,
      subject: meta.subject,
    });

    const report = await db.$transaction(async (tx) => {
      const created = await tx.testFeedbackReport.create({
        data: {
          submissionId: submission.id,
          summary: analysis.summary,
          strengths: analysis.strengths as unknown as object,
          weaknesses: analysis.weaknesses as unknown as object,
          topicBreakdown: analysis.topicBreakdown as unknown as object,
          estimatedScore: analysis.estimatedScore,
        },
      });

      await tx.testSubmission.update({
        where: { id: submission.id },
        data: { status: "READY" },
      });

      return created;
    });

    return {
      id: report.id,
      submissionId: submission.id,
      title,
      subject: meta.subject ?? null,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      topicBreakdown: analysis.topicBreakdown,
      estimatedScore: analysis.estimatedScore,
      createdAt: report.createdAt,
      isRealAi: provider.isReal,
    };
  } catch (error) {
    await db.testSubmission.update({
      where: { id: submission.id },
      data: { status: "FAILED", error: (error as Error).message.slice(0, 500) },
    });
    throw error;
  }
}

export async function listSubmissions(userId: string) {
  return db.testSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      subject: true,
      status: true,
      createdAt: true,
      report: { select: { id: true, summary: true, estimatedScore: true, weaknesses: true } },
    },
  });
}

export async function getReport(userId: string, submissionId: string) {
  const submission = await db.testSubmission.findUnique({
    where: { id: submissionId },
    include: { report: true },
  });

  if (!submission) throw new NotFoundError("That analysis doesn't exist.");
  if (submission.userId !== userId) throw new ForbiddenError("That analysis isn't yours.");

  return submission;
}

// ---------------------------------------------------------------------------
// Premium: practice from a report
// ---------------------------------------------------------------------------

export async function generatePracticeFromReport(
  userId: string,
  submissionId: string,
  plan: "FREE" | "PREMIUM",
) {
  if (plan !== "PREMIUM") {
    throw new PremiumRequired(
      "Generating practice from a test report is a premium feature.",
    );
  }

  const submission = await getReport(userId, submissionId);
  if (!submission.report) throw new ValidationError("That test hasn't been analysed yet.");

  const weaknesses = submission.report.weaknesses as unknown as WeaknessItem[];
  if (!weaknesses?.length) {
    throw new ValidationError("No weak areas were found in that report — nothing to practise.");
  }

  const provider = ai();
  const generated = await provider.improvementQuiz({
    weakAreas: weaknesses.map((w) => `${w.topic}: ${w.evidence}`),
    exampleQuestions: weaknesses.map((w) => w.suggestion),
    subject: submission.subject ?? undefined,
    title: `${submission.title} — targeted practice`,
    targetQuestionCount: Math.min(12, Math.max(5, weaknesses.length * 2)),
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
      reportId: submission.report.id,
      title: generated.title,
      payload: {
        subject: generated.subject,
        description: generated.description,
        questions,
      } as unknown as object,
    },
    select: { id: true },
  });

  return {
    id: practice.id,
    title: generated.title,
    description: generated.description,
    isRealAi: provider.isReal,
    questions: questions.map((q) => ({ type: q.type, prompt: q.prompt, marks: q.marks })),
  };
}
