"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { guarded, imageKeySchema, type ActionResult } from "./helpers";
import { LIMITS } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import {
  copyPublicQuiz,
  createQuiz,
  deleteQuiz,
  saveGeneratedQuiz,
  setQuizVisibility,
  updateQuiz,
} from "@/server/services/quizzes";
import {
  overrideMark,
  startAttempt,
  submitAttempt,
} from "@/server/services/quiz-attempts";
import { discardPractice, generateImprovementQuiz } from "@/server/services/improvement";
import { generateQuizFromPdf, storePdf } from "@/server/services/uploads";
import { UPLOAD_LIMITS } from "@/lib/coins/rules";

const optionSchema = z.object({
  id: z.string().cuid().optional(),
  text: z.string().max(1000),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(["MCQ_SINGLE", "MCQ_MULTI", "WRITTEN"]),
  prompt: z.string().max(4000),
  marks: z.number().int().min(1).max(25),
  markScheme: z.string().max(6000).nullish(),
  explanation: z.string().max(4000).nullish(),
  imageKey: imageKeySchema,
  options: z.array(optionSchema).max(8),
});

const quizSchema = z.object({
  title: z.string().trim().min(1, "Give the quiz a title.").max(160),
  description: z.string().max(1000).nullish(),
  subject: z.string().max(80).nullish(),
  questions: z.array(questionSchema).min(1, "Add at least one question.").max(100),
});

export async function createQuizAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guarded("quizzes.create", async (userId) => {
    const data = quizSchema.parse(input);
    const quiz = await createQuiz(userId, data);
    revalidatePath("/quizzes");
    revalidatePath("/dashboard");
    return quiz;
  });
}

export async function updateQuizAction(
  quizId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  return guarded("quizzes.update", async (userId) => {
    const data = quizSchema.parse(input);
    const quiz = await updateQuiz(userId, quizId, data);
    revalidatePath("/quizzes");
    revalidatePath(`/quizzes/${quizId}`);
    return quiz;
  });
}

export async function deleteQuizAction(quizId: string): Promise<ActionResult<null>> {
  return guarded("quizzes.delete", async (userId) => {
    await deleteQuiz(userId, quizId);
    revalidatePath("/quizzes");
    revalidatePath("/dashboard");
    return null;
  });
}

export async function setQuizVisibilityAction(quizId: string, isPublic: boolean) {
  return guarded("quizzes.visibility", async (userId) => {
    const result = await setQuizVisibility(userId, quizId, isPublic);
    revalidatePath(`/quizzes/${quizId}`);
    revalidatePath("/quizzes");
    return { isPublic: result.isPublic };
  });
}

export async function copyQuizAction(quizId: string) {
  return guarded("quizzes.copy", async (userId) => {
    const copy = await copyPublicQuiz(userId, quizId);
    revalidatePath("/quizzes");
    return copy;
  });
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export async function startAttemptAction(quizId: string) {
  return guarded("quizzes.attempt.start", async (userId) => startAttempt(userId, quizId));
}

const submitSchema = z.object({
  attemptId: z.string().cuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        selectedOptionIds: z.array(z.string().cuid()).max(12).optional(),
        writtenAnswer: z.string().max(20000).nullish(),
      }),
    )
    .max(120),
});

export async function submitAttemptAction(input: unknown) {
  return guarded("quizzes.attempt.submit", async (userId) => {
    const data = submitSchema.parse(input);
    const result = await submitAttempt(userId, data.attemptId, data.answers);
    revalidatePath("/dashboard");
    revalidatePath("/quizzes");
    return result;
  });
}

const overrideSchema = z.object({
  attemptId: z.string().cuid(),
  questionId: z.string().cuid(),
  marks: z.number().int().min(0).max(25),
  reason: z.string().max(1000).nullish(),
});

export async function overrideMarkAction(input: unknown) {
  return guarded("quizzes.attempt.override", async (userId) => {
    const data = overrideSchema.parse(input);
    return overrideMark(userId, data.attemptId, data.questionId, data.marks, data.reason ?? null);
  });
}

// ---------------------------------------------------------------------------
// AI features
// ---------------------------------------------------------------------------

export async function generateImprovementAction(attemptId: string) {
  return guarded(
    "quizzes.improvement",
    async (userId) => {
      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true },
      });
      return generateImprovementQuiz(userId, attemptId, user.plan);
    },
    { limit: { limit: 10, windowSeconds: 300 } },
  );
}

export async function savePracticeAction(practiceId: string) {
  return guarded("quizzes.practice.save", async (userId) => {
    const quiz = await saveGeneratedQuiz(userId, practiceId);
    revalidatePath("/quizzes");
    return quiz;
  });
}

export async function discardPracticeAction(practiceId: string) {
  return guarded("quizzes.practice.discard", async (userId) => {
    await discardPractice(userId, practiceId);
    return null;
  });
}

/**
 * PDF → quiz.
 *
 * Takes FormData because it carries a file. The daily quota is consumed inside
 * `generateQuizFromPdf`, transactionally, before any model call.
 */
export async function importPdfAction(formData: FormData) {
  return guarded(
    "quizzes.import",
    async (userId) => {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        throw Object.assign(new Error("Choose a PDF to upload."), { status: 400 });
      }
      if (file.size > UPLOAD_LIMITS.maxBytes) {
        const mb = Math.round(UPLOAD_LIMITS.maxBytes / (1024 * 1024));
        throw Object.assign(new Error(`Files need to be under ${mb}MB.`), { status: 400 });
      }

      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true, timezone: true },
      });

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await storePdf(userId, "QUIZ_SOURCE", {
        buffer,
        filename: file.name || "upload.pdf",
        mimeType: file.type || "application/pdf",
      });

      const result = await generateQuizFromPdf(userId, upload.id, user.plan, user.timezone, {
        title: String(formData.get("title") ?? "").trim() || undefined,
        subject: String(formData.get("subject") ?? "").trim() || undefined,
        markScheme: String(formData.get("markScheme") ?? "").trim() || undefined,
      });

      revalidatePath("/quizzes");
      revalidatePath("/dashboard");
      return { ...result, pageCount: upload.pageCount, filename: upload.filename };
    },
    { limit: LIMITS.upload },
  );
}
