/**
 * Quiz marking — pure functions.
 *
 * Multiple choice is exact-match, so it is marked deterministically here on the
 * server: that is instant, free, and cannot be wrong. Written answers (and any
 * question flagged for review) go to the AI marker instead, and the user can
 * override anything the AI touched.
 *
 * Nothing in this module trusts a client-supplied score.
 */

import { QUIZZES } from "../coins/rules";

export type QuestionType = "MCQ_SINGLE" | "MCQ_MULTI" | "WRITTEN";

export interface MarkableQuestion {
  id: string;
  type: QuestionType;
  marks: number;
  /** Option ids that are correct. Server-side only. */
  correctOptionIds: string[];
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds: string[];
  writtenAnswer: string | null;
}

export interface MarkResult {
  questionId: string;
  awardedMarks: number;
  /** True when this question still needs the AI marker. */
  needsAiMarking: boolean;
}

/** Single-answer MCQ: all or nothing. */
export function markSingleChoice(
  selected: string[],
  correctOptionIds: string[],
  marks: number,
): number {
  if (selected.length !== 1) return 0;
  return correctOptionIds.includes(selected[0]!) ? marks : 0;
}

/**
 * Multi-answer MCQ: partial credit with a penalty for wrong picks, so ticking
 * every box scores zero rather than full marks.
 *
 *   raw = (correctly selected - incorrectly selected) / number of correct options
 *   marks = round(clamp(raw, 0, 1) * question marks)
 */
export function markMultipleChoice(
  selected: string[],
  correctOptionIds: string[],
  marks: number,
): number {
  if (correctOptionIds.length === 0) return 0;

  const unique = Array.from(new Set(selected));
  const hits = unique.filter((id) => correctOptionIds.includes(id)).length;
  const misses = unique.filter((id) => !correctOptionIds.includes(id)).length;

  const raw = (hits - misses) / correctOptionIds.length;
  const clamped = Math.min(Math.max(raw, 0), 1);
  return Math.round(clamped * marks);
}

/** Mark one answer. Written questions are deferred to the AI marker. */
export function markAnswer(question: MarkableQuestion, answer: SubmittedAnswer | undefined): MarkResult {
  if (!answer) {
    return { questionId: question.id, awardedMarks: 0, needsAiMarking: false };
  }

  switch (question.type) {
    case "MCQ_SINGLE":
      return {
        questionId: question.id,
        awardedMarks: markSingleChoice(answer.selectedOptionIds, question.correctOptionIds, question.marks),
        needsAiMarking: false,
      };

    case "MCQ_MULTI":
      return {
        questionId: question.id,
        awardedMarks: markMultipleChoice(answer.selectedOptionIds, question.correctOptionIds, question.marks),
        needsAiMarking: false,
      };

    case "WRITTEN": {
      const hasContent = (answer.writtenAnswer ?? "").trim().length > 0;
      return {
        questionId: question.id,
        awardedMarks: 0,
        needsAiMarking: hasContent,
      };
    }
  }
}

export interface AttemptMarking {
  results: MarkResult[];
  /** Marks settled deterministically right now. */
  awardedMarks: number;
  totalMarks: number;
  /** Questions still waiting on the AI marker. */
  pendingAiQuestionIds: string[];
}

export function markAttempt(
  questions: MarkableQuestion[],
  answers: SubmittedAnswer[],
): AttemptMarking {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));

  const results = questions.map((q) => markAnswer(q, byQuestion.get(q.id)));

  return {
    results,
    awardedMarks: results.reduce((sum, r) => sum + r.awardedMarks, 0),
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    pendingAiQuestionIds: results.filter((r) => r.needsAiMarking).map((r) => r.questionId),
  };
}

/** Whole-number percentage, floored. 0 total marks scores 0. */
export function percentage(awardedMarks: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0;
  return Math.floor((Math.max(0, awardedMarks) / totalMarks) * 100);
}

/**
 * Did this attempt miss its deadline?
 *
 * Judged against the server-issued deadline only — the countdown the user sees
 * is cosmetic. A few seconds of grace absorbs network latency on a submission
 * fired just before time.
 */
export function isAttemptExpired(submittedAt: Date, serverDeadlineAt: Date): boolean {
  const graceMs = QUIZZES.submissionGraceSeconds * 1000;
  return submittedAt.getTime() > serverDeadlineAt.getTime() + graceMs;
}

/** Clamp an override so a user cannot award themselves more than the question is worth. */
export function clampOverrideMarks(requested: number, questionMarks: number): number {
  if (!Number.isFinite(requested)) return 0;
  return Math.min(Math.max(Math.round(requested), 0), questionMarks);
}
