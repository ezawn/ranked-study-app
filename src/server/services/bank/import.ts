import "server-only";

import { db } from "@/lib/db";
import { invalidateBankIndex } from "./query";
import {
  runImport,
  type ImportQuestion,
  type ImportResult,
} from "@/lib/bank/import";

/**
 * The server's view of the importer.
 *
 * Thin on purpose. The logic lives in `lib/bank/import` so the seed script can
 * use it too — this binds the app's Prisma singleton and drops the cached tag
 * index afterwards, which is the one thing a script running in its own process
 * has no reason to do.
 */

export {
  validateQuestion,
  parseImportFile,
  type ImportOption,
  type ImportQuestion,
  type ImportResult,
  type ImportClient,
} from "@/lib/bank/import";

/** Import questions, replacing any with the same `sourceKey`. */
export async function importQuestions(
  questions: readonly ImportQuestion[],
  options: { batchSize?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<ImportResult> {
  const result = await runImport(db, questions, options);

  /* The cached tag index is now stale by definition. */
  invalidateBankIndex();

  return result;
}

/** Withdraw a question without deleting anybody's history of answering it. */
export async function retireQuestion(sourceKey: string): Promise<boolean> {
  const result = await db.bankQuestion.updateMany({
    where: { sourceKey },
    data: { retired: true },
  });
  invalidateBankIndex();
  return result.count > 0;
}
