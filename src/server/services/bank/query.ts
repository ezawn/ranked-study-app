import "server-only";

import { db } from "@/lib/db";
import {
  filterCandidates,
  select,
  seedFrom,
  preferenceFilter,
  type Candidate,
  type SelectionFilter,
  type QueuePreference,
} from "@/lib/bank/select";
import {
  stageOf,
  streamKey,
  type CurriculumLevel,
  type BankQuestionType,
  type Subject,
  type Stage,
} from "@/lib/bank/taxonomy";

/**
 * Reading the permanent question bank.
 *
 * The performance shape here is deliberate and worth stating, because the
 * obvious implementation is the slow one.
 *
 * `ORDER BY random() LIMIT n` is what most codebases reach for. It is a full
 * table scan and a full sort of every matching row on every single request —
 * at a few thousand questions you will not notice, and at a hundred thousand
 * the Arena will time out. So instead the bank keeps an in-process INDEX of
 * every question's tags — id, topic, subtopic, level, difficulty, type, and
 * nothing else — refreshed on a timer. Filtering and dealing happen against
 * that index in memory, and the only query on the request path fetches the
 * handful of rows actually chosen, by primary key.
 *
 * The index is small: about a hundred bytes a question, so a hundred thousand
 * questions is roughly ten megabytes, and every filter combination the app
 * offers is served from it without touching Postgres at all. Serverless
 * instances each build their own copy on first use, which is one query per
 * cold start.
 *
 * The database indexes in the schema still matter — they serve the counts, the
 * coverage report and the index build itself — but no request depends on
 * Postgres being able to sort randomly.
 */

/** How long a built index is trusted before it is rebuilt. */
const INDEX_TTL_MS = 5 * 60 * 1000;

/**
 * What marking needs to know about a question, beyond the answer itself.
 *
 * Held here because it is the same for every player and changes only when the
 * bank is re-seeded, and because the alternative is two more sequential
 * queries on the path that has to reply before the battle can show a colour.
 */
export interface MarkingFacts {
  /** How many options the player was choosing between. 0 for a numeric answer. */
  choices: number;
  /** The question's own estimated solving time, in seconds. */
  estimatedSeconds: number;
  questionType: BankQuestionType;
  /** Which options are right. Server-side only — never serialised to a client. */
  correctOptionIds: string[];
  /** The canonical answer, for marking a numeric response. */
  answer: string;
}

interface BankIndex {
  builtAt: number;
  candidates: Candidate[];
  byId: Map<string, Candidate>;
  marking: Map<string, MarkingFacts>;
}

let indexPromise: Promise<BankIndex> | null = null;
let index: BankIndex | null = null;

async function buildIndex(): Promise<BankIndex> {
  const rows = await db.bankQuestion.findMany({
    where: { retired: false },
    select: {
      id: true,
      subject: true,
      topic: true,
      subtopic: true,
      curriculumLevel: true,
      difficulty: true,
      questionType: true,
      calculator: true,
      estimatedSeconds: true,
      answer: true,
      options: { select: { id: true, isCorrect: true } },
    },
  });

  const candidates: Candidate[] = rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    topic: r.topic,
    subtopic: r.subtopic,
    curriculumLevel: r.curriculumLevel as CurriculumLevel,
    difficulty: r.difficulty,
    questionType: r.questionType as BankQuestionType,
    calculator: r.calculator,
  }));

  return {
    builtAt: Date.now(),
    candidates,
    byId: new Map(candidates.map((c) => [c.id, c])),
    marking: new Map(
      rows.map((r) => [
        r.id,
        {
          choices: r.options.length,
          estimatedSeconds: r.estimatedSeconds,
          questionType: r.questionType as BankQuestionType,
          correctOptionIds: r.options.filter((o) => o.isCorrect).map((o) => o.id),
          answer: r.answer,
        },
      ]),
    ),
  };
}

/**
 * The tag index, built at most once per TTL.
 *
 * Concurrent callers during a cold start share one in-flight build rather than
 * each issuing the same query — on a serverless host a burst of requests hits
 * an empty instance together, and without this every one of them would scan
 * the table.
 */
async function getIndex(): Promise<BankIndex> {
  if (index && Date.now() - index.builtAt < INDEX_TTL_MS) return index;
  if (!indexPromise) {
    indexPromise = buildIndex()
      .then((built) => {
        index = built;
        return built;
      })
      .finally(() => {
        indexPromise = null;
      });
  }
  return indexPromise;
}

/**
 * Option count and estimated time for questions being marked.
 *
 * Served from the index, so scoring an answer costs no database work. Ids the
 * index has not got — a question imported since it was built — come back
 * missing rather than wrong, and the scorer falls back to its own defaults for
 * those, identically for both players.
 */
export async function markingFactsForOne(id: string): Promise<MarkingFacts | null> {
  const { marking } = await getIndex();
  return marking.get(id) ?? null;
}

export async function markingFactsFor(
  ids: readonly string[],
): Promise<Map<string, MarkingFacts>> {
  const { marking } = await getIndex();
  const out = new Map<string, MarkingFacts>();
  for (const id of ids) {
    const facts = marking.get(id);
    if (facts) out.set(id, facts);
  }
  return out;
}

/** Drop the cached index. Called by the importer, so a seed is visible at once. */
export function invalidateBankIndex(): void {
  index = null;
}

/* ==========================================================================
   Serving questions
   ========================================================================== */

export interface ServedOption {
  id: string;
  text: string;
}

/** A question as a client may see it. Never carries which option is correct. */
export interface ServedQuestion {
  id: string;
  topic: string;
  subtopic: string;
  curriculumLevel: CurriculumLevel;
  difficulty: number;
  questionType: BankQuestionType;
  prompt: string;
  options: ServedOption[];
  estimatedSeconds: number;
  marks: number;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceLicence: string | null;
}

export interface DealOptions extends SelectionFilter {
  subject?: Subject;
  count: number;
  /** Deterministic order. Both players in a match pass the same value. */
  seed?: number;
  /** Deprioritise questions this user has already met in this context. */
  userId?: string;
  context?: string;
  /** Record the deal, so later requests know these were seen. Off for previews. */
  record?: boolean;
}

export interface DealResult {
  questions: ServedQuestion[];
  /** Matching the filter before the count was applied — the "is this filter too narrow" number. */
  available: number;
  /** How many of the dealt questions this user had already met. */
  repeats: number;
}

/**
 * Deal a set of questions.
 *
 * The only function anything outside this module should use to get questions
 * out of the bank. Filtering, freshness, topic balance and shuffling all happen
 * here so no caller has to reimplement them and get one of them subtly wrong.
 */
export async function dealQuestions(options: DealOptions): Promise<DealResult> {
  const { candidates } = await getIndex();

  const matching = filterCandidates(candidates, options);

  const seen = options.userId
    ? await seenQuestionIds(options.userId, options.context ?? "practice")
    : undefined;

  const selection = select({
    candidates: matching,
    count: options.count,
    seed: options.seed ?? seedFrom(`${Date.now()}:${Math.random()}`),
    seen,
  });

  const questions = await loadQuestions(selection.ids);

  if (options.record && options.userId && selection.ids.length > 0) {
    await recordServed(options.userId, selection.ids, options.context ?? "practice");
  }

  return { questions, available: selection.available, repeats: selection.repeats };
}

/**
 * Load chosen questions by id, in the order they were chosen.
 *
 * `findMany` with an `in` makes no promise about ordering, and the order IS the
 * deal — two players must meet the same questions in the same sequence, so the
 * rows are mapped back over the id list rather than returned as they arrive.
 */
export async function loadQuestions(ids: readonly string[]): Promise<ServedQuestion[]> {
  if (ids.length === 0) return [];

  const rows = await db.bankQuestion.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      topic: true,
      subtopic: true,
      curriculumLevel: true,
      difficulty: true,
      questionType: true,
      prompt: true,
      estimatedSeconds: true,
      marks: true,
      sourceName: true,
      sourceUrl: true,
      sourceLicence: true,
      /* `isCorrect` is deliberately absent. A correct flag in a network
         response is a correct flag in the browser's devtools — the same rule
         the quiz runner and the Arena already follow. */
      options: { select: { id: true, text: true }, orderBy: { position: "asc" } },
    },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));

  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    return [
      {
        id: row.id,
        topic: row.topic,
        subtopic: row.subtopic,
        curriculumLevel: row.curriculumLevel as CurriculumLevel,
        difficulty: row.difficulty,
        questionType: row.questionType as BankQuestionType,
        prompt: row.prompt,
        options: row.options,
        estimatedSeconds: row.estimatedSeconds,
        marks: row.marks,
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl,
        sourceLicence: row.sourceLicence,
      },
    ];
  });
}

/* ==========================================================================
   Marking
   ========================================================================== */

export interface MarkedAnswer {
  correct: boolean;
  /** The full worked solution, released only after the answer is in. */
  explanation: string;
  answer: string;
  correctOptionIds: string[];
}

/**
 * Mark an answer, server-side, against the stored question.
 *
 * The client sends a selection and nothing else. Nothing it sends becomes a
 * score, and the explanation is only assembled after the answer has been
 * received — so a devtools reader cannot pull the worked solution out of the
 * response that delivered the question.
 */
export async function markAnswer(
  questionId: string,
  submitted: { optionIds?: readonly string[]; text?: string | null },
): Promise<MarkedAnswer | null> {
  const question = await db.bankQuestion.findUnique({
    where: { id: questionId },
    select: {
      questionType: true,
      answer: true,
      explanation: true,
      options: { select: { id: true, isCorrect: true } },
    },
  });
  if (!question) return null;

  const correctOptionIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
  const correct = isBankAnswerCorrect(
    question.questionType as BankQuestionType,
    correctOptionIds,
    question.answer,
    submitted,
  );

  return { correct, explanation: question.explanation, answer: question.answer, correctOptionIds };
}

/**
 * Is a submitted answer right?
 *
 * Exported and pure so the tests can attack it without a database — this is the
 * function that decides whether a student earns a point, so it gets the same
 * treatment as the quiz marker.
 */
export function isBankAnswerCorrect(
  type: BankQuestionType,
  correctOptionIds: readonly string[],
  canonicalAnswer: string,
  submitted: { optionIds?: readonly string[]; text?: string | null },
): boolean {
  if (type === "NUMERIC" || type === "SHORT_ANSWER") {
    const given = (submitted.text ?? "").trim();
    if (!given) return false;

    const a = Number(given.replace(/,/g, "").replace(/\s/g, ""));
    const b = Number(String(canonicalAnswer).replace(/,/g, "").replace(/\s/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      /* A relative tolerance, so a rounded decimal matches without accepting an
         answer that is merely nearby. */
      return Math.abs(a - b) <= Math.max(1, Math.abs(b)) * 1e-6;
    }
    return given.toLowerCase() === canonicalAnswer.trim().toLowerCase();
  }

  const given = new Set(submitted.optionIds ?? []);
  const wanted = new Set(correctOptionIds);

  /* Selecting everything is not a correct answer to a multi-answer question. */
  if (given.size !== wanted.size) return false;
  for (const id of wanted) if (!given.has(id)) return false;
  return true;
}

/* ==========================================================================
   What a user has seen
   ========================================================================== */

export async function seenQuestionIds(userId: string, context: string): Promise<Set<string>> {
  const rows = await db.bankServe.findMany({
    where: { userId, context },
    select: { questionId: true },
  });
  return new Set(rows.map((r) => r.questionId));
}

/**
 * Record that these questions were served.
 *
 * `createMany` with `skipDuplicates`, because the unique constraint on
 * (user, question, context) is the thing keeping the table from growing without
 * bound — and because a duplicate here must not abort an enclosing transaction.
 */
export async function recordServed(
  userId: string,
  questionIds: readonly string[],
  context: string,
): Promise<void> {
  if (questionIds.length === 0) return;
  await db.bankServe.createMany({
    data: questionIds.map((questionId) => ({ userId, questionId, context })),
    skipDuplicates: true,
  });
}

/**
 * Forget what a user has seen in one context.
 *
 * Needed once somebody has worked through the whole bank in a narrow filter:
 * without a reset their practice sessions would be permanently all repeats.
 */
export async function resetSeen(userId: string, context: string): Promise<number> {
  const result = await db.bankServe.deleteMany({ where: { userId, context } });
  return result.count;
}

/* ==========================================================================
   Counts and coverage
   ========================================================================== */

export interface BankCoverage {
  total: number;
  byLevel: Record<string, number>;
  byTopic: Record<string, number>;
  byBand: Record<string, number>;
}

/** How many questions a filter would draw from. Served from the index. */
export async function countAvailable(filter: SelectionFilter): Promise<number> {
  const { candidates } = await getIndex();
  return filterCandidates(candidates, filter).length;
}

/** What the bank holds, for the Arena precondition and the admin view. */
export async function bankCoverage(): Promise<BankCoverage> {
  const { candidates } = await getIndex();

  const byLevel: Record<string, number> = {};
  const byTopic: Record<string, number> = {};
  const byBand: Record<string, number> = {};

  for (const candidate of candidates) {
    byLevel[candidate.curriculumLevel] = (byLevel[candidate.curriculumLevel] ?? 0) + 1;
    byTopic[candidate.topic] = (byTopic[candidate.topic] ?? 0) + 1;
    const band =
      candidate.difficulty <= 3
        ? "EASY"
        : candidate.difficulty <= 6
          ? "MEDIUM"
          : candidate.difficulty <= 8
            ? "HARD"
            : "EXPERT";
    byBand[band] = (byBand[band] ?? 0) + 1;
  }

  return { total: candidates.length, byLevel, byTopic, byBand };
}

/**
 * How many questions a pairing would have between them.
 *
 * Called on the matchmaking path, once per candidate per poll, so it reads the
 * in-memory index and never touches the database. That is the whole reason the
 * index exists: asking "could these two play?" of every waiting opponent, once
 * a second, is not a question a hosted Postgres should be answering.
 */
export async function countForPreference(preference: QueuePreference): Promise<number> {
  return countAvailable(preferenceFilter(preference));
}

/** The same count for many preferences at once, sharing one index read. */
export async function countForPreferences(
  preferences: readonly QueuePreference[],
): Promise<number[]> {
  const { candidates } = await getIndex();
  return preferences.map((preference) => filterCandidates(candidates, preferenceFilter(preference)).length);
}

export interface StreamSummary {
  /** `subject:stage`, the unit a player ticks. */
  stream: string;
  subject: string;
  stage: Stage;
  total: number;
  /** Topics inside this stream, for the finer picker. */
  topics: { topic: string; total: number }[];
}

/**
 * What the player can choose from, with counts.
 *
 * Shown next to each tick-box, because a subject with fourteen questions and
 * one with three hundred are very different propositions and the difference
 * should not be a surprise discovered mid-match. Subjects the bank holds
 * nothing for do not appear here at all — the picker adds them separately, and
 * greys them out.
 */
export async function streamOptions(): Promise<StreamSummary[]> {
  const { candidates } = await getIndex();

  const byStream = new Map<string, StreamSummary>();
  const topicCounts = new Map<string, Map<string, number>>();

  for (const candidate of candidates) {
    const stage = stageOf(candidate.curriculumLevel);
    const stream = streamKey(candidate.subject, stage);

    let entry = byStream.get(stream);
    if (!entry) {
      entry = { stream, subject: candidate.subject, stage, total: 0, topics: [] };
      byStream.set(stream, entry);
      topicCounts.set(stream, new Map());
    }
    entry.total++;

    const topics = topicCounts.get(stream)!;
    topics.set(candidate.topic, (topics.get(candidate.topic) ?? 0) + 1);
  }

  for (const [stream, entry] of byStream) {
    entry.topics = [...topicCounts.get(stream)!]
      .map(([topic, total]) => ({ topic, total }))
      .sort((a, b) => b.total - a.total);
  }

  return [...byStream.values()].sort((a, b) => a.stream.localeCompare(b.stream));
}
