import { describe, expect, it } from "vitest";

import {
  clampOverrideMarks,
  isAttemptExpired,
  markAttempt,
  markMultipleChoice,
  markSingleChoice,
  percentage,
  type MarkableQuestion,
} from "@/lib/quiz/marking";

describe("single answer multiple choice", () => {
  it("awards full marks for the right option", () => {
    expect(markSingleChoice(["a"], ["a"], 3)).toBe(3);
  });

  it("awards nothing for the wrong option", () => {
    expect(markSingleChoice(["b"], ["a"], 3)).toBe(0);
  });

  it("awards nothing when more than one option is selected", () => {
    expect(markSingleChoice(["a", "b"], ["a"], 3)).toBe(0);
  });

  it("awards nothing for no answer", () => {
    expect(markSingleChoice([], ["a"], 3)).toBe(0);
  });
});

describe("multiple answer multiple choice", () => {
  it("awards full marks for exactly the right set", () => {
    expect(markMultipleChoice(["a", "b"], ["a", "b"], 4)).toBe(4);
  });

  it("gives partial credit for a partial answer", () => {
    expect(markMultipleChoice(["a"], ["a", "b"], 4)).toBe(2);
  });

  it("penalises wrong selections", () => {
    expect(markMultipleChoice(["a", "z"], ["a", "b"], 4)).toBe(0);
  });

  it("gives nothing for ticking everything", () => {
    expect(markMultipleChoice(["a", "b", "y", "z"], ["a", "b"], 4)).toBe(0);
  });

  it("never goes negative", () => {
    expect(markMultipleChoice(["x", "y", "z"], ["a"], 4)).toBe(0);
  });

  it("ignores duplicate selections", () => {
    expect(markMultipleChoice(["a", "a", "a"], ["a", "b"], 4)).toBe(2);
  });
});

describe("marking a whole attempt", () => {
  const questions: MarkableQuestion[] = [
    { id: "q1", type: "MCQ_SINGLE", marks: 2, correctOptionIds: ["o1"] },
    { id: "q2", type: "MCQ_MULTI", marks: 4, correctOptionIds: ["p1", "p2"] },
    { id: "q3", type: "WRITTEN", marks: 6, correctOptionIds: [] },
  ];

  it("settles multiple choice immediately and defers written answers", () => {
    const result = markAttempt(questions, [
      { questionId: "q1", selectedOptionIds: ["o1"], writtenAnswer: null },
      { questionId: "q2", selectedOptionIds: ["p1", "p2"], writtenAnswer: null },
      { questionId: "q3", selectedOptionIds: [], writtenAnswer: "An answer." },
    ]);

    expect(result.awardedMarks).toBe(6);
    expect(result.totalMarks).toBe(12);
    expect(result.pendingAiQuestionIds).toEqual(["q3"]);
  });

  it("scores unanswered questions as zero without calling the AI", () => {
    const result = markAttempt(questions, []);
    expect(result.awardedMarks).toBe(0);
    expect(result.pendingAiQuestionIds).toEqual([]);
  });

  it("ignores answers for questions that aren't in the quiz", () => {
    const result = markAttempt(questions, [
      { questionId: "not-a-question", selectedOptionIds: ["o1"], writtenAnswer: null },
    ]);
    expect(result.awardedMarks).toBe(0);
  });

  it("totals marks from the questions, not from the submission", () => {
    const result = markAttempt(questions, []);
    expect(result.totalMarks).toBe(12);
  });
});

describe("percentages", () => {
  it("floors rather than rounds", () => {
    expect(percentage(7, 12)).toBe(58);
  });

  it("handles the edges", () => {
    expect(percentage(0, 10)).toBe(0);
    expect(percentage(10, 10)).toBe(100);
    expect(percentage(0, 0)).toBe(0);
  });

  it("never returns a negative percentage", () => {
    expect(percentage(-5, 10)).toBe(0);
  });
});

describe("the deadline is the server's", () => {
  const deadline = new Date("2026-08-25T12:00:00Z");

  it("accepts a submission before the deadline", () => {
    expect(isAttemptExpired(new Date("2026-08-25T11:59:00Z"), deadline)).toBe(false);
  });

  it("allows a few seconds of grace for latency", () => {
    expect(isAttemptExpired(new Date("2026-08-25T12:00:03Z"), deadline)).toBe(false);
  });

  it("rejects a submission well past the deadline", () => {
    expect(isAttemptExpired(new Date("2026-08-25T12:05:00Z"), deadline)).toBe(true);
  });
});

describe("mark overrides are clamped", () => {
  it("cannot exceed the question's marks", () => {
    expect(clampOverrideMarks(99, 6)).toBe(6);
  });

  it("cannot go below zero", () => {
    expect(clampOverrideMarks(-10, 6)).toBe(0);
  });

  it("rejects garbage", () => {
    expect(clampOverrideMarks(NaN, 6)).toBe(0);
    expect(clampOverrideMarks(Infinity, 6)).toBe(0);
  });

  it("keeps a sensible value", () => {
    expect(clampOverrideMarks(4, 6)).toBe(4);
  });
});
