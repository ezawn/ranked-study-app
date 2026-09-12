import "server-only";

import { db } from "@/lib/db";
import { AIError } from "@/lib/ai/types";
import { finalizeAttempt, markWrittenAnswers, submitAttempt } from "@/server/services/quiz-attempts";
import { ledgerBalance } from "@/server/services/coins";

/**
 * Background work.
 *
 * Nothing here depends on a browser being open. The same functions are called
 * by the standalone worker (`npm run worker`) and by the cron route handlers,
 * so a deployment can use whichever it has.
 */

export interface JobRunSummary {
  aiJobsProcessed: number;
  aiJobsFailed: number;
  attemptsClosed: number;
  errors: string[];
}

const BACKOFF_SECONDS = [30, 120, 600];

/**
 * Work through queued AI jobs.
 *
 * Each job is claimed with a conditional update, so two workers racing for the
 * same job means one of them gets zero rows back and moves on.
 */
export async function processAiJobs(limit = 10): Promise<{ processed: number; failed: number; errors: string[] }> {
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  const candidates = await db.aiJob.findMany({
    where: { status: "QUEUED", runAfter: { lte: now } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, type: true, input: true, attempts: true, maxAttempts: true },
  });

  for (const job of candidates) {
    const claimed = await db.aiJob.updateMany({
      where: { id: job.id, status: "QUEUED" },
      data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue; // Someone else took it.

    try {
      await runJob(job.type, job.input as Record<string, unknown>);

      await db.aiJob.update({
        where: { id: job.id },
        data: { status: "COMPLETE", finishedAt: new Date(), error: null },
      });
      processed++;
    } catch (error) {
      const message = (error as Error).message.slice(0, 1000);
      const attemptsUsed = job.attempts + 1;
      const retryable = !(error instanceof AIError) || error.retryable;
      const giveUp = !retryable || attemptsUsed >= job.maxAttempts;

      await db.aiJob.update({
        where: { id: job.id },
        data: giveUp
          ? { status: "FAILED", finishedAt: new Date(), error: message }
          : {
              status: "QUEUED",
              error: message,
              runAfter: new Date(
                Date.now() + (BACKOFF_SECONDS[attemptsUsed - 1] ?? 600) * 1000,
              ),
            },
      });

      // A marking job that has run out of retries must not leave the attempt
      // stuck "marking" forever — flag it so the UI can say what happened.
      if (giveUp && job.type === "MARK_ATTEMPT") {
        const attemptId = (job.input as { attemptId?: string }).attemptId;
        if (attemptId) {
          await db.quizAttempt.updateMany({
            where: { id: attemptId, markingStatus: "PENDING" },
            data: { markingStatus: "FAILED" },
          });
        }
      }

      failed++;
      errors.push(`${job.type}: ${message}`);
    }
  }

  return { processed, failed, errors };
}

async function runJob(type: string, input: Record<string, unknown>): Promise<void> {
  switch (type) {
    case "MARK_ATTEMPT": {
      const attemptId = input.attemptId as string;
      if (!attemptId) throw new Error("MARK_ATTEMPT job has no attemptId");
      await markWrittenAnswers(attemptId);
      await finalizeAttempt(attemptId);
      return;
    }
    default:
      throw new Error(`No handler for job type ${type}`);
  }
}

/**
 * Close attempts whose time ran out and were never submitted.
 *
 * Without this an abandoned tab leaves an attempt open forever, blocking the
 * user from starting the quiz again.
 */
export async function closeExpiredAttempts(graceMinutes = 10): Promise<number> {
  const cutoff = new Date(Date.now() - graceMinutes * 60 * 1000);

  const stale = await db.quizAttempt.findMany({
    where: { status: "IN_PROGRESS", serverDeadlineAt: { lt: cutoff } },
    select: { id: true, userId: true },
    take: 100,
  });

  let closed = 0;
  for (const attempt of stale) {
    try {
      // Submits whatever was saved. It is past the deadline, so it earns nothing.
      await submitAttempt(attempt.userId, attempt.id, [], { auto: true });
      closed++;
    } catch (error) {
      console.error(`[jobs] couldn't close attempt ${attempt.id}`, error);
    }
  }

  return closed;
}

/**
 * Verify the cached coin balances still match the ledger.
 *
 * The ledger is the record; `User.coinBalance` is a cache. If they ever drift,
 * that is a bug worth knowing about immediately rather than discovering when a
 * user complains.
 */
export async function reconcileBalances(limit = 200): Promise<{
  checked: number;
  drifted: Array<{ userId: string; cached: number; actual: number }>;
}> {
  const users = await db.user.findMany({
    select: { id: true, coinBalance: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const drifted: Array<{ userId: string; cached: number; actual: number }> = [];

  for (const user of users) {
    const actual = await ledgerBalance(user.id);
    if (actual !== user.coinBalance) {
      drifted.push({ userId: user.id, cached: user.coinBalance, actual });
    }
  }

  return { checked: users.length, drifted };
}

/** Everything the scheduled run does, in one call. */
export async function runScheduledWork(): Promise<JobRunSummary> {
  const ai = await processAiJobs(20);
  const attemptsClosed = await closeExpiredAttempts();

  return {
    aiJobsProcessed: ai.processed,
    aiJobsFailed: ai.failed,
    attemptsClosed,
    errors: ai.errors,
  };
}
