import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { env } from "@/lib/env";
import {
  AIError,
  type AIProvider,
  type GeneratedQuiz,
  type ImprovementQuizInput,
  type MarkWrittenInput,
  type MarkWrittenResult,
  type PdfToQuizInput,
  type TestAnalysisInput,
  type TestAnalysisResult,
} from "./types";

/**
 * Anthropic-backed provider.
 *
 * Structured output comes back through tool use rather than "please reply with
 * JSON", and everything is re-validated with Zod before it touches the
 * database — a model that returns 40 marks for a 4-mark question does not get
 * to write that.
 */

const MAX_SOURCE_CHARS = 60_000;

const optionSchema = z.object({
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  type: z.enum(["MCQ_SINGLE", "MCQ_MULTI", "WRITTEN"]),
  prompt: z.string().min(1).max(2000),
  marks: z.number().int().min(1).max(25),
  options: z.array(optionSchema).max(8).default([]),
  markScheme: z.string().max(4000).optional(),
  explanation: z.string().max(2000).optional(),
});

const quizSchema = z.object({
  title: z.string().min(1).max(160),
  subject: z.string().max(80).nullish(),
  description: z.string().max(500).nullish(),
  questions: z.array(questionSchema).min(1).max(40),
});

const analysisSchema = z.object({
  summary: z.string().min(1).max(2000),
  strengths: z
    .array(z.object({ topic: z.string().max(120), evidence: z.string().max(600) }))
    .max(10)
    .default([]),
  weaknesses: z
    .array(
      z.object({
        topic: z.string().max(120),
        evidence: z.string().max(600),
        suggestion: z.string().max(600),
      }),
    )
    .max(10)
    .default([]),
  topicBreakdown: z
    .array(
      z.object({
        topic: z.string().max(120),
        correct: z.number().int().min(0).max(200),
        total: z.number().int().min(1).max(200),
      }),
    )
    .max(20)
    .default([]),
  estimatedScore: z.number().int().min(0).max(100).nullish(),
});

const markingSchema = z.object({
  marks: z.number().min(0).max(100),
  feedback: z.string().min(1).max(1500),
  confidence: z.number().min(0).max(1),
});

const QUIZ_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    title: { type: "string" },
    subject: { type: "string" },
    description: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["MCQ_SINGLE", "MCQ_MULTI", "WRITTEN"] },
          prompt: { type: "string" },
          marks: { type: "integer", minimum: 1, maximum: 25 },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: { text: { type: "string" }, isCorrect: { type: "boolean" } },
              required: ["text", "isCorrect"],
            },
          },
          markScheme: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["type", "prompt", "marks", "options"],
      },
    },
  },
  required: ["title", "questions"],
};

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  readonly isReal = true;

  private client: Anthropic;

  constructor() {
    if (!env.ai.anthropicKey) {
      throw new AIError("ANTHROPIC_API_KEY is not set", false);
    }
    this.client = new Anthropic({ apiKey: env.ai.anthropicKey });
  }

  /** One call, one tool, structured result. Throws AIError on anything unusable. */
  private async callTool<T>(opts: {
    system: string;
    prompt: string;
    toolName: string;
    toolDescription: string;
    schema: Record<string, unknown>;
    validate: (raw: unknown) => T;
    maxTokens?: number;
  }): Promise<T> {
    let response;
    try {
      response = await this.client.messages.create({
        model: env.ai.anthropicModel,
        max_tokens: opts.maxTokens ?? 8000,
        system: opts.system,
        tools: [
          {
            name: opts.toolName,
            description: opts.toolDescription,
            input_schema: opts.schema as never,
          },
        ],
        tool_choice: { type: "tool", name: opts.toolName },
        messages: [{ role: "user", content: opts.prompt }],
      });
    } catch (error) {
      const status = (error as { status?: number }).status;
      // 4xx other than rate limiting will not succeed on retry.
      const retryable = status === undefined || status === 429 || status >= 500;
      throw new AIError(
        `Anthropic request failed${status ? ` (${status})` : ""}: ${(error as Error).message}`,
        retryable,
      );
    }

    const block = response.content.find((c) => c.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      throw new AIError("The model did not return structured output.", true);
    }

    try {
      return opts.validate(block.input);
    } catch (error) {
      throw new AIError(`The model's output failed validation: ${(error as Error).message}`, true);
    }
  }

  async pdfToQuiz(input: PdfToQuizInput): Promise<GeneratedQuiz> {
    const source = input.text.slice(0, MAX_SOURCE_CHARS);

    const raw = await this.callTool({
      toolName: "build_quiz",
      toolDescription: "Return a quiz built from the supplied study material.",
      schema: QUIZ_TOOL_SCHEMA,
      system:
        "You write exam-style revision questions for students between GCSE and undergraduate level. " +
        "Every question must be answerable from the supplied material alone. Never invent facts that " +
        "are not in the source. Distractors must be plausible and clearly wrong to someone who knows " +
        "the material. Marks should reflect the depth of the answer required (1-2 for recall, 3-6 for " +
        "explanation). Every WRITTEN question needs a mark scheme that says how marks are allocated.",
      prompt: [
        `Build a quiz of about ${input.targetQuestionCount} questions from this material.`,
        input.title ? `Preferred title: ${input.title}` : "",
        input.subject ? `Subject: ${input.subject}` : "",
        input.markScheme
          ? `The student supplied this mark scheme — use it as the authority for correct answers:\n${input.markScheme.slice(0, 8000)}`
          : "If the material contains its own mark scheme or answer key, use it and do not turn answer-key text into questions.",
        "Mix MCQ_SINGLE, MCQ_MULTI and WRITTEN questions. MCQ questions need 4 options with at least one correct.",
        "",
        "--- MATERIAL ---",
        source,
      ]
        .filter(Boolean)
        .join("\n"),
      validate: (r) => quizSchema.parse(r),
    });

    return {
      title: raw.title,
      subject: raw.subject ?? input.subject ?? null,
      description: raw.description ?? null,
      questions: raw.questions.map((q) => ({ ...q, options: q.options ?? [] })),
    };
  }

  async markWritten(input: MarkWrittenInput): Promise<MarkWrittenResult> {
    const raw = await this.callTool({
      toolName: "record_mark",
      toolDescription: "Record the marks and feedback for one written answer.",
      maxTokens: 1500,
      schema: {
        type: "object",
        properties: {
          marks: { type: "number", minimum: 0 },
          feedback: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["marks", "feedback", "confidence"],
      },
      system:
        "You are a fair, encouraging exam marker. Award marks strictly against the mark scheme, " +
        "not against your own preferred answer. Credit correct content expressed in the student's " +
        "own words. Never award more than the maximum. Feedback must be two or three sentences, " +
        "addressed to the student, and must say specifically what would earn the remaining marks. " +
        "Set confidence below 0.6 when the answer is ambiguous, off-topic in a way that might still " +
        "be valid, or when the mark scheme does not cover what the student wrote.",
      prompt: [
        `Question (${input.maxMarks} marks): ${input.prompt}`,
        input.markScheme ? `Mark scheme:\n${input.markScheme}` : "No mark scheme was provided — mark on subject accuracy and completeness.",
        "",
        `Student's answer:\n${input.answer.slice(0, 12000)}`,
      ].join("\n"),
      validate: (r) => markingSchema.parse(r),
    });

    // The model is never allowed to exceed the question's marks, whatever it says.
    return {
      marks: Math.max(0, Math.min(Math.round(raw.marks), input.maxMarks)),
      feedback: raw.feedback,
      confidence: raw.confidence,
    };
  }

  async analyseTest(input: TestAnalysisInput): Promise<TestAnalysisResult> {
    const raw = await this.callTool({
      toolName: "record_analysis",
      toolDescription: "Record an analysis of a student's completed test.",
      schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          strengths: {
            type: "array",
            items: {
              type: "object",
              properties: { topic: { type: "string" }, evidence: { type: "string" } },
              required: ["topic", "evidence"],
            },
          },
          weaknesses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                evidence: { type: "string" },
                suggestion: { type: "string" },
              },
              required: ["topic", "evidence", "suggestion"],
            },
          },
          topicBreakdown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                correct: { type: "integer" },
                total: { type: "integer" },
              },
              required: ["topic", "correct", "total"],
            },
          },
          estimatedScore: { type: "integer", minimum: 0, maximum: 100 },
        },
        required: ["summary", "strengths", "weaknesses", "topicBreakdown"],
      },
      system:
        "You analyse a student's completed test paper and report what they are good at and where " +
        "they are losing marks. Ground every point in evidence from the paper — quote or paraphrase " +
        "the specific question or answer. Be direct about weaknesses without being discouraging. " +
        "Each weakness needs one concrete, doable next step. If the paper does not show marks or " +
        "correct answers, infer carefully and say so in the summary rather than inventing a score.",
      prompt: [
        `Test title: ${input.title}`,
        input.subject ? `Subject: ${input.subject}` : "",
        "",
        "--- PAPER ---",
        input.text.slice(0, MAX_SOURCE_CHARS),
      ]
        .filter(Boolean)
        .join("\n"),
      validate: (r) => analysisSchema.parse(r),
    });

    return {
      summary: raw.summary,
      strengths: raw.strengths,
      weaknesses: raw.weaknesses,
      topicBreakdown: raw.topicBreakdown,
      estimatedScore: raw.estimatedScore ?? null,
    };
  }

  async improvementQuiz(input: ImprovementQuizInput): Promise<GeneratedQuiz> {
    const raw = await this.callTool({
      toolName: "build_quiz",
      toolDescription: "Return a practice quiz targeting the student's weak areas.",
      schema: QUIZ_TOOL_SCHEMA,
      system:
        "You build targeted practice for a student who has just got specific things wrong. Every " +
        "question must attack one of the listed weak areas. Match the style and difficulty of the " +
        "example questions. Do not simply reword the questions they already saw — test the same " +
        "understanding from a different angle.",
      prompt: [
        `Build ${input.targetQuestionCount} practice questions titled "${input.title}".`,
        input.subject ? `Subject: ${input.subject}` : "",
        "",
        "Weak areas to target:",
        ...input.weakAreas.slice(0, 20).map((w) => `- ${w}`),
        "",
        "Questions they have already seen, for style reference only:",
        ...input.exampleQuestions.slice(0, 10).map((q) => `- ${q}`),
      ]
        .filter(Boolean)
        .join("\n"),
      validate: (r) => quizSchema.parse(r),
    });

    return {
      title: raw.title,
      subject: raw.subject ?? input.subject ?? null,
      description: raw.description ?? null,
      questions: raw.questions.map((q) => ({ ...q, options: q.options ?? [] })),
    };
  }
}
