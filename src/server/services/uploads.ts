import "server-only";

import type { UploadKind, UsageFeature } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/auth/session";
import { storage, validateUpload, sha256, UploadRejected } from "@/lib/storage";
import { extractPdfText, suggestQuestionCount } from "@/lib/pdf";
import { uploadQuota, type QuotaFeature } from "@/lib/coins/rules";
import { dayKey } from "@/lib/time/day";
import { ai } from "@/lib/ai";
import { createQuiz, type QuestionInput } from "./quizzes";

/**
 * Uploads and the AI features they feed.
 *
 * Daily quotas are consumed transactionally BEFORE any AI call, so a user
 * cannot fire ten parallel requests through a limit of one.
 */

export class QuotaExceeded extends Error {
  readonly status = 402;
  constructor(
    readonly feature: QuotaFeature,
    readonly limit: number,
  ) {
    super(
      feature === "PDF_TO_QUIZ"
        ? `Free accounts get ${limit} PDF conversion a day. Premium is unlimited.`
        : `Free accounts get ${limit} test analysis a day. Premium is unlimited.`,
    );
    this.name = "QuotaExceeded";
  }
}

export interface QuotaState {
  used: number;
  limit: number;
  unlimited: boolean;
  remaining: number;
}

export async function quotaState(
  userId: string,
  feature: QuotaFeature,
  plan: "FREE" | "PREMIUM",
  timezone: string,
): Promise<QuotaState> {
  const limit = uploadQuota(feature, plan);
  const day = dayKey(new Date(), timezone);

  const row = await db.usageCounter.findUnique({
    where: { userId_day_feature: { userId, day, feature: feature as UsageFeature } },
    select: { count: true },
  });

  const used = row?.count ?? 0;
  return {
    used,
    limit: Number.isFinite(limit) ? limit : Infinity,
    unlimited: !Number.isFinite(limit),
    remaining: Number.isFinite(limit) ? Math.max(0, limit - used) : Infinity,
  };
}

/**
 * Take one unit of the day's allowance, or refuse.
 *
 * The check and the increment happen in one transaction against a row with a
 * unique key, so concurrent requests serialise on it.
 */
export async function consumeQuota(
  userId: string,
  feature: QuotaFeature,
  plan: "FREE" | "PREMIUM",
  timezone: string,
): Promise<void> {
  const limit = uploadQuota(feature, plan);
  if (!Number.isFinite(limit)) return; // Premium: nothing to count.

  const day = dayKey(new Date(), timezone);

  await db.$transaction(async (tx) => {
    const counter = await tx.usageCounter.upsert({
      where: { userId_day_feature: { userId, day, feature: feature as UsageFeature } },
      create: { userId, day, feature: feature as UsageFeature, count: 0 },
      update: {},
      select: { id: true, count: true },
    });

    if (counter.count >= limit) throw new QuotaExceeded(feature, limit);

    await tx.usageCounter.update({
      where: { id: counter.id },
      data: { count: { increment: 1 } },
    });
  });
}

// ---------------------------------------------------------------------------
// Storing files
// ---------------------------------------------------------------------------

export interface StoredUpload {
  id: string;
  filename: string;
  pageCount: number;
  textLength: number;
}

/**
 * Validate, store and extract a PDF.
 *
 * Extraction happens here rather than at AI time so a broken or image-only PDF
 * fails immediately with a useful message, before any quota is spent.
 */
export async function storePdf(
  userId: string,
  kind: UploadKind,
  file: { buffer: Buffer; filename: string; mimeType: string },
): Promise<StoredUpload> {
  validateUpload(file.buffer, file.mimeType, file.filename);

  const checksum = sha256(file.buffer);
  const extraction = await extractPdfText(file.buffer);
  const stored = await storage().put(file.buffer, {
    filename: file.filename,
    mimeType: file.mimeType,
  });

  const upload = await db.upload.create({
    data: {
      userId,
      kind,
      storageKey: stored.key,
      filename: file.filename.slice(0, 200),
      mimeType: file.mimeType,
      sizeBytes: stored.sizeBytes,
      checksum,
      pageCount: extraction.pageCount,
      extractedText: extraction.text,
      status: "READY",
    },
    select: { id: true },
  });

  return {
    id: upload.id,
    filename: file.filename,
    pageCount: extraction.pageCount,
    textLength: extraction.text.length,
  };
}

export async function getUpload(userId: string, uploadId: string) {
  const upload = await db.upload.findUnique({ where: { id: uploadId } });
  if (!upload) throw new NotFoundError("That upload doesn't exist.");
  if (upload.userId !== userId) throw new ForbiddenError("That upload isn't yours.");
  return upload;
}

// ---------------------------------------------------------------------------
// PDF -> quiz
// ---------------------------------------------------------------------------

export interface PdfToQuizOptions {
  title?: string;
  subject?: string;
  /** Pasted mark scheme, when the PDF didn't include one. */
  markScheme?: string;
  questionCount?: number;
}

export async function generateQuizFromPdf(
  userId: string,
  uploadId: string,
  plan: "FREE" | "PREMIUM",
  timezone: string,
  options: PdfToQuizOptions = {},
): Promise<{ quizId: string; provider: string; isRealAi: boolean; questionCount: number }> {
  const upload = await getUpload(userId, uploadId);
  if (!upload.extractedText) {
    throw new UploadRejected("There's no readable text in that upload.");
  }

  // Quota first: an AI call that fails must not have been free, and a refused
  // call must not have cost the user their allowance either — so this throws
  // before any spend and the counter is only incremented on the way in.
  await consumeQuota(userId, "PDF_TO_QUIZ", plan, timezone);

  const provider = ai();

  const generated = await provider.pdfToQuiz({
    text: upload.extractedText,
    filename: upload.filename,
    title: options.title,
    subject: options.subject,
    markScheme: options.markScheme,
    targetQuestionCount:
      options.questionCount ?? suggestQuestionCount(upload.extractedText),
  });

  const questions: QuestionInput[] = generated.questions.map((q) => ({
    type: q.type,
    prompt: q.prompt,
    marks: q.marks,
    markScheme: q.markScheme ?? null,
    explanation: q.explanation ?? null,
    options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }));

  const quiz = await createQuiz(userId, {
    title: options.title?.trim() || generated.title,
    description: generated.description,
    subject: options.subject?.trim() || generated.subject,
    origin: "PDF_IMPORT",
    questions,
  });

  await db.upload.update({ where: { id: upload.id }, data: { status: "READY" } });

  return {
    quizId: quiz.id,
    provider: provider.name,
    isRealAi: provider.isReal,
    questionCount: questions.length,
  };
}
