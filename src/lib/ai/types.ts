/**
 * The AI contract.
 *
 * Everything the app asks a model to do goes through this interface, so the
 * provider is swappable and the whole product runs without an API key using the
 * local stand-in. Feature code never imports a vendor SDK.
 */

export type GeneratedQuestionType = "MCQ_SINGLE" | "MCQ_MULTI" | "WRITTEN";

export interface GeneratedOption {
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  type: GeneratedQuestionType;
  prompt: string;
  marks: number;
  options: GeneratedOption[];
  markScheme?: string;
  explanation?: string;
}

export interface GeneratedQuiz {
  title: string;
  subject: string | null;
  description: string | null;
  questions: GeneratedQuestion[];
}

export interface PdfToQuizInput {
  text: string;
  filename: string;
  /** User-supplied title, when they gave one. */
  title?: string;
  subject?: string;
  /** Mark scheme pasted by the user, when the PDF didn't contain one. */
  markScheme?: string;
  targetQuestionCount: number;
}

export interface MarkWrittenInput {
  prompt: string;
  markScheme: string | null;
  maxMarks: number;
  answer: string;
}

export interface MarkWrittenResult {
  marks: number;
  feedback: string;
  /** 0-1. Low confidence surfaces the override prompt more prominently. */
  confidence: number;
}

export interface TestAnalysisInput {
  text: string;
  title: string;
  subject?: string;
}

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
}

export interface StrengthItem {
  topic: string;
  evidence: string;
}

export interface WeaknessItem {
  topic: string;
  evidence: string;
  suggestion: string;
}

export interface TestAnalysisResult {
  summary: string;
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  topicBreakdown: TopicScore[];
  estimatedScore: number | null;
}

export interface ImprovementQuizInput {
  /** Topics or question prompts the user got wrong. */
  weakAreas: string[];
  /** Example questions to imitate in style and difficulty. */
  exampleQuestions: string[];
  subject?: string;
  title: string;
  targetQuestionCount: number;
}

export interface AIProvider {
  readonly name: string;
  /** False for the local stand-in, so the UI can say so honestly. */
  readonly isReal: boolean;

  pdfToQuiz(input: PdfToQuizInput): Promise<GeneratedQuiz>;
  markWritten(input: MarkWrittenInput): Promise<MarkWrittenResult>;
  analyseTest(input: TestAnalysisInput): Promise<TestAnalysisResult>;
  improvementQuiz(input: ImprovementQuizInput): Promise<GeneratedQuiz>;
}

export class AIError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "AIError";
  }
}
