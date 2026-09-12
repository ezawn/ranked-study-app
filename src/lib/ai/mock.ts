import type {
  AIProvider,
  GeneratedQuestion,
  GeneratedQuiz,
  ImprovementQuizInput,
  MarkWrittenInput,
  MarkWrittenResult,
  PdfToQuizInput,
  TestAnalysisInput,
  TestAnalysisResult,
} from "./types";

/**
 * Local stand-in provider.
 *
 * This is not a stub that returns lorem ipsum — it actually reads the document,
 * pulls out real sentences and key terms, and builds questions from them, so
 * the entire PDF-to-quiz, marking and test-feedback flow can be developed,
 * demoed and tested end-to-end with no API key and no spend.
 *
 * It is deterministic: the same input always produces the same output, which is
 * what makes it usable in the test suite.
 */

const STOPWORDS = new Set([
  "the","and","for","that","with","this","from","are","was","were","which","their","them","they",
  "have","has","had","been","also","into","than","then","when","what","where","will","would","can",
  "could","should","its","it's","because","between","about","after","before","such","some","these",
  "those","there","here","only","other","more","most","much","many","each","both","over","under",
  "does","doing","done","being","upon","while","during","however","therefore","thus","hence",
]);

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 260 && /[a-z]/i.test(s));
}

function keyTerms(text: string, limit: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []) {
    if (STOPWORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Deterministic pseudo-random from a string, so output is stable across runs. */
function seededPick<T>(items: T[], seed: string, index: number): T {
  let hash = 0;
  const key = seed + ":" + index;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return items[hash % items.length]!;
}

function buildQuestions(text: string, count: number, seed: string): GeneratedQuestion[] {
  const lines = sentences(text);
  const terms = keyTerms(text, Math.max(12, count * 3));
  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const sentence = lines[i % Math.max(1, lines.length)] ?? "";
    const term = terms[i % Math.max(1, terms.length)] ?? "the key concept";

    // Every third question is written, the rest alternate single/multi choice —
    // so every question type in the app gets exercised.
    if (i % 3 === 2) {
      questions.push({
        type: "WRITTEN",
        prompt: `Explain the role of "${term}" in this material, referring to specific detail from the source.`,
        marks: 4,
        options: [],
        markScheme: sentence
          ? `Award up to 4 marks. 1 mark for identifying ${term}. Up to 2 marks for accurate explanation drawn from: "${sentence}". 1 mark for a supporting example or application.`
          : `Award up to 4 marks for a clear, accurate explanation of ${term} with a supporting example.`,
        explanation: sentence || undefined,
      });
      continue;
    }

    const isMulti = i % 6 === 4;
    const distractors = terms.filter((t) => t !== term).slice(0, 6);

    if (isMulti) {
      questions.push({
        type: "MCQ_MULTI",
        prompt: `Which of the following are discussed in relation to "${term}"? Select all that apply.`,
        marks: 3,
        options: [
          { text: titleCase(term), isCorrect: true },
          { text: titleCase(seededPick(distractors.length ? distractors : ["context"], seed, i)), isCorrect: true },
          { text: "A concept not covered in this material", isCorrect: false },
          { text: "An unrelated historical event", isCorrect: false },
        ],
        markScheme: "1 mark per correct selection, minus 1 per incorrect selection.",
      });
      continue;
    }

    questions.push({
      type: "MCQ_SINGLE",
      prompt: sentence
        ? `According to the source, which statement is correct?`
        : `Which of the following best describes "${term}"?`,
      marks: 2,
      options: [
        { text: sentence || `${titleCase(term)} is central to this topic.`, isCorrect: true },
        { text: `${titleCase(term)} is never mentioned in this material.`, isCorrect: false },
        { text: `${titleCase(term)} only applies outside this subject.`, isCorrect: false },
        { text: `The source explicitly rejects the idea of ${term}.`, isCorrect: false },
      ],
      explanation: sentence ? `Taken directly from the source material.` : undefined,
    });
  }

  return questions;
}

export class MockAIProvider implements AIProvider {
  readonly name = "local";
  readonly isReal = false;

  async pdfToQuiz(input: PdfToQuizInput): Promise<GeneratedQuiz> {
    const title = input.title?.trim() || input.filename.replace(/\.pdf$/i, "") || "Generated quiz";
    return {
      title,
      subject: input.subject ?? null,
      description: `Generated from ${input.filename}.`,
      questions: buildQuestions(input.text, input.targetQuestionCount, title),
    };
  }

  async markWritten(input: MarkWrittenInput): Promise<MarkWrittenResult> {
    const answer = input.answer.trim();
    if (answer.length === 0) {
      return { marks: 0, feedback: "No answer given.", confidence: 1 };
    }

    // Overlap between the answer and the mark scheme / question, which is a
    // crude but genuinely responsive proxy for content coverage.
    const reference = `${input.markScheme ?? ""} ${input.prompt}`.toLowerCase();
    const refTerms = new Set(
      (reference.match(/[a-z][a-z'-]{3,}/g) ?? []).filter((t) => !STOPWORDS.has(t)),
    );
    const answerTerms = new Set(
      (answer.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []).filter((t) => !STOPWORDS.has(t)),
    );

    let hits = 0;
    for (const t of answerTerms) if (refTerms.has(t)) hits++;

    const coverage = refTerms.size === 0 ? 0.5 : Math.min(1, hits / Math.max(4, refTerms.size * 0.35));
    const lengthFactor = Math.min(1, answer.split(/\s+/).length / (input.maxMarks * 18));
    const score = Math.round(input.maxMarks * (coverage * 0.75 + lengthFactor * 0.25));
    const marks = Math.max(0, Math.min(score, input.maxMarks));

    const missing = [...refTerms].filter((t) => !answerTerms.has(t)).slice(0, 3);

    return {
      marks,
      feedback:
        marks >= input.maxMarks
          ? "Covers the key points from the mark scheme with enough detail. Full marks."
          : marks === 0
            ? "This doesn't yet address what the question is asking. Look at the mark scheme and try naming the key idea directly."
            : `Good start — ${marks}/${input.maxMarks}. To pick up the remaining marks, develop the parts about ${missing.join(", ") || "the mark scheme's key points"}.`,
      // Honest about itself: this is a heuristic, so confidence is never high.
      confidence: 0.45,
    };
  }

  async analyseTest(input: TestAnalysisInput): Promise<TestAnalysisResult> {
    const terms = keyTerms(input.text, 10);
    const lines = sentences(input.text);
    const strong = terms.slice(0, 3);
    const weak = terms.slice(3, 6);

    return {
      summary: `Analysed ${lines.length} passages from "${input.title}". Strongest handling appears around ${
        strong.map(titleCase).join(", ") || "the core material"
      }; the clearest gaps are around ${weak.map(titleCase).join(", ") || "the later sections"}.`,
      strengths: strong.map((topic, i) => ({
        topic: titleCase(topic),
        evidence: lines[i] ?? `Handled ${topic} consistently across the paper.`,
      })),
      weaknesses: weak.map((topic, i) => ({
        topic: titleCase(topic),
        evidence: lines[i + 3] ?? `Answers touching ${topic} were thin or missing.`,
        suggestion: `Re-read the section on ${topic}, then build a flashcard set of its key definitions and attempt 5 practice questions on it.`,
      })),
      topicBreakdown: [...strong, ...weak].map((topic, i) => ({
        topic: titleCase(topic),
        correct: i < strong.length ? 4 : 1,
        total: 5,
      })),
      estimatedScore: null,
    };
  }

  async improvementQuiz(input: ImprovementQuizInput): Promise<GeneratedQuiz> {
    const source = [...input.weakAreas, ...input.exampleQuestions].join(". ");
    return {
      title: input.title,
      subject: input.subject ?? null,
      description: `Targeted practice on: ${input.weakAreas.slice(0, 4).join(", ")}.`,
      questions: buildQuestions(source || input.title, input.targetQuestionCount, input.title),
    };
  }
}
