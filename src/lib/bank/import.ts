/**
 * Getting questions INTO the bank.
 *
 * One path for both sources — the generators and any outside dataset — because
 * they produce the same shape and there is no reason for two code paths that
 * can drift apart. The generators feed it directly; a JSON file goes through
 * `parseImportFile` first, which is the only place that has to distrust its
 * input.
 *
 * Keyed on `sourceKey`, so the whole thing is re-runnable. Seeding twice
 * updates 2,600 rows rather than creating 5,200, and a generator whose wording
 * improves can be re-seeded without anybody losing their history — the ids stay
 * the same, so `BankServe` rows still point at the right questions.
 *
 * Deliberately NOT marked `server-only`, and deliberately not importing the
 * app's Prisma singleton. This module has to be loadable by `prisma/seed-bank.ts`,
 * which runs under `tsx` — neither a client nor a server component as far as the
 * `server-only` package is concerned, so it throws on import. The server-side
 * wrapper in `server/services/bank/import.ts` keeps the marker and binds the
 * singleton; everything below is the logic they share.
 */

import type { PrismaClient } from "@prisma/client";

import {
  clampDifficulty,
  isCurriculumLevel,
  isKnownSubtopic,
  isQuestionType,
  isSubject,
  type BankQuestionType,
  type CurriculumLevel,
  type Subject,
} from "./taxonomy";

/** Whatever can run the import: the app singleton, or a script's own client. */
export type ImportClient = Pick<PrismaClient, "bankQuestion" | "$transaction">;

export interface ImportOption {
  text: string;
  isCorrect: boolean;
}

export interface ImportQuestion {
  sourceKey: string;
  subject?: string;
  topic: string;
  subtopic: string;
  curriculumLevel: string;
  difficulty: number;
  questionType?: string;
  prompt: string;
  answer: string;
  explanation: string;
  options?: ImportOption[];
  estimatedSeconds?: number;
  marks?: number;
  /** True when the question needs a calculator. Battles never serve these. */
  calculator?: boolean;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceLicence?: string | null;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  /** Every rejection, with the reason. Never silent — a question that quietly
      failed to import is a gap nobody finds until a filter comes back empty. */
  errors: string[];
}

/**
 * Validate one question.
 *
 * Strict on purpose. The taxonomy is a closed vocabulary and a typo'd topic key
 * would create a question no filter can ever reach, which is worse than a
 * rejected import because nothing reports it.
 */
export function validateQuestion(input: ImportQuestion): string | null {
  const where = input.sourceKey || "(no sourceKey)";

  if (!input.sourceKey?.trim()) return `${where}: sourceKey is required`;
  if (!input.prompt?.trim()) return `${where}: prompt is empty`;
  if (!input.answer?.trim()) return `${where}: answer is empty`;
  if (!input.explanation?.trim()) return `${where}: explanation is empty`;

  const subject = input.subject ?? "maths";
  if (!isSubject(subject)) return `${where}: unknown subject "${subject}"`;
  if (!isKnownSubtopic(input.topic, input.subtopic)) {
    return `${where}: unknown topic/subtopic "${input.topic}/${input.subtopic}"`;
  }
  if (!isCurriculumLevel(input.curriculumLevel)) {
    return `${where}: unknown curriculum level "${input.curriculumLevel}"`;
  }

  const type = input.questionType ?? "MCQ_SINGLE";
  if (!isQuestionType(type)) return `${where}: unknown question type "${type}"`;

  if (type === "MCQ_SINGLE" || type === "MCQ_MULTI") {
    const options = input.options ?? [];
    if (options.length !== 4) {
      return `${where}: a choice question needs exactly four options (got ${options.length})`;
    }

    const correct = options.filter((o) => o.isCorrect);
    if (type === "MCQ_SINGLE" && correct.length !== 1) {
      return `${where}: MCQ_SINGLE has ${correct.length} correct options, expected exactly one`;
    }
    if (type === "MCQ_MULTI" && correct.length < 1) {
      return `${where}: MCQ_MULTI has no correct option`;
    }
    if (!options.some((o) => o.text.trim() === input.answer.trim())) {
      return `${where}: the answer is not among the options`;
    }

    /* Whitespace and case are not meaningful differences between two options —
       the same normalisation the generators apply, so an import cannot slip in
       a pair the generator framework would have rejected. */
    const texts = new Set(options.map((o) => o.text.trim().toLowerCase().replace(/\s+/g, " ")));
    if (texts.size !== options.length) return `${where}: duplicate option text`;
  }

  return null;
}

/**
 * Import questions, replacing any with the same `sourceKey`.
 *
 * Takes its database client as an argument rather than importing the app's
 * singleton, which is what lets the seed script use it. `src/lib/db` is marked
 * `server-only`, and `server-only` throws the moment it is required outside a
 * Next build — so a plain `tsx prisma/seed-bank.ts` could not load this module
 * at all while it reached for the singleton itself.
 *
 * Options are deleted and rewritten rather than diffed. They have no identity
 * of their own — nothing references a `BankOption` row across time — and
 * diffing them would be more code for no benefit. `BankServe` rows point at the
 * QUESTION, so a student's history survives.
 *
 * Batched, because 2,600 questions is 2,600 upserts and issuing them one at a
 * time against a hosted database takes minutes.
 */
export async function runImport(
  db: ImportClient,
  questions: readonly ImportQuestion[],
  options: { batchSize?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<ImportResult> {
  const batchSize = options.batchSize ?? 50;
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const valid: ImportQuestion[] = [];
  const seenKeys = new Set<string>();

  for (const question of questions) {
    const failure = validateQuestion(question);
    if (failure) {
      result.errors.push(failure);
      result.skipped++;
      continue;
    }
    if (seenKeys.has(question.sourceKey)) {
      result.errors.push(`${question.sourceKey}: duplicate sourceKey within this import`);
      result.skipped++;
      continue;
    }
    seenKeys.add(question.sourceKey);
    valid.push(question);
  }

  /* Which keys already exist, in one query rather than one per question. */
  const existing = new Set(
    (
      await db.bankQuestion.findMany({
        where: { sourceKey: { in: valid.map((q) => q.sourceKey) } },
        select: { sourceKey: true },
      })
    ).map((row) => row.sourceKey),
  );

  for (let start = 0; start < valid.length; start += batchSize) {
    const batch = valid.slice(start, start + batchSize);

    await db.$transaction(
      batch.map((question) => {
        const data = {
          subject: (question.subject ?? "maths") as Subject,
          topic: question.topic,
          subtopic: question.subtopic,
          curriculumLevel: question.curriculumLevel as CurriculumLevel,
          difficulty: clampDifficulty(question.difficulty),
          questionType: (question.questionType ?? "MCQ_SINGLE") as BankQuestionType,
          prompt: question.prompt.trim(),
          answer: question.answer.trim(),
          explanation: question.explanation.trim(),
          estimatedSeconds: question.estimatedSeconds ?? 60,
          marks: question.marks ?? 1,
          calculator: question.calculator ?? false,
          sourceName: question.sourceName ?? null,
          sourceUrl: question.sourceUrl ?? null,
          sourceLicence: question.sourceLicence ?? null,
          retired: false,
        };

        const optionRows = (question.options ?? []).map((option, position) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          position,
        }));

        return db.bankQuestion.upsert({
          where: { sourceKey: question.sourceKey },
          create: {
            sourceKey: question.sourceKey,
            ...data,
            options: { create: optionRows },
          },
          update: {
            ...data,
            /* Replace wholesale — see the note above. */
            options: { deleteMany: {}, create: optionRows },
          },
          select: { id: true },
        });
      }),
    );

    for (const question of batch) {
      if (existing.has(question.sourceKey)) result.updated++;
      else result.created++;
    }

    options.onProgress?.(Math.min(start + batchSize, valid.length), valid.length);
  }

  return result;
}

/**
 * Parse an import file.
 *
 * The documented format for bringing in outside questions:
 *
 *   {
 *     "source":  { "name": "...", "url": "...", "licence": "CC BY-SA 4.0" },
 *     "questions": [ { ...ImportQuestion without the source fields... } ]
 *   }
 *
 * Attribution lives at the top level because it is a property of the dataset,
 * not of each question — and putting it there means it cannot be forgotten on
 * one row out of four hundred. Anything openly licensed carries obligations;
 * the fields exist so honouring them is the default rather than an afterthought.
 */
export function parseImportFile(json: unknown): {
  questions: ImportQuestion[];
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof json !== "object" || json === null) {
    return { questions: [], errors: ["The import file must be a JSON object"] };
  }

  const file = json as Record<string, unknown>;
  const source = (file.source ?? {}) as Record<string, unknown>;
  const rawQuestions = file.questions;

  if (!Array.isArray(rawQuestions)) {
    return { questions: [], errors: ["`questions` must be an array"] };
  }

  const sourceName = typeof source.name === "string" ? source.name : null;
  const sourceUrl = typeof source.url === "string" ? source.url : null;
  const sourceLicence = typeof source.licence === "string" ? source.licence : null;

  if (sourceName && !sourceLicence) {
    errors.push(
      `The source "${sourceName}" has no licence. Imported material needs its licence recorded ` +
        `— that is what makes the attribution meaningful.`,
    );
  }

  const questions: ImportQuestion[] = [];

  rawQuestions.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      errors.push(`questions[${i}] is not an object`);
      return;
    }
    const q = raw as Record<string, unknown>;

    questions.push({
      sourceKey: String(q.sourceKey ?? q.id ?? `import:${i}`),
      subject: typeof q.subject === "string" ? q.subject : undefined,
      topic: String(q.topic ?? ""),
      subtopic: String(q.subtopic ?? ""),
      curriculumLevel: String(q.curriculumLevel ?? ""),
      difficulty: Number(q.difficulty ?? 5),
      questionType: typeof q.questionType === "string" ? q.questionType : undefined,
      prompt: String(q.question ?? q.prompt ?? ""),
      answer: String(q.answer ?? ""),
      explanation: String(q.explanation ?? ""),
      options: Array.isArray(q.options)
        ? (q.options as unknown[]).flatMap((option) => {
            if (typeof option === "string") {
              return [{ text: option, isCorrect: option.trim() === String(q.answer ?? "").trim() }];
            }
            if (typeof option === "object" && option !== null) {
              const o = option as Record<string, unknown>;
              return [{ text: String(o.text ?? ""), isCorrect: Boolean(o.isCorrect) }];
            }
            return [];
          })
        : undefined,
      estimatedSeconds: q.estimatedTime !== undefined ? Number(q.estimatedTime) : undefined,
      marks: q.marks !== undefined ? Number(q.marks) : undefined,
      calculator: q.calculator === undefined ? undefined : Boolean(q.calculator),
      sourceName,
      sourceUrl,
      sourceLicence,
    });
  });

  return { questions, errors };
}

