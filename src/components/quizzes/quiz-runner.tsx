"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, Radio, Textarea } from "@/components/ui/form";
import { Alert, Badge, Meter, Spinner } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, CoinIcon, FileTextIcon } from "@/components/icons";
import { StudyImage } from "@/components/ui/image-field";
import { submitAttemptAction } from "@/server/actions/quizzes";
import { cn, formatDuration } from "@/lib/utils";

interface RunnerQuestion {
  id: string;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "WRITTEN";
  prompt: string;
  marks: number;
  imageKey: string | null;
  options: Array<{ id: string; text: string }>;
}

export interface QuizRunnerProps {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  totalMarks: number;
  questions: RunnerQuestion[];
  secondsRemaining: number;
  savedAnswers: Record<string, { selectedOptionIds: string[]; writtenAnswer: string | null }>;
  coinEligible: boolean;
}

interface AnswerState {
  selectedOptionIds: string[];
  writtenAnswer: string;
}

/**
 * Taking a quiz.
 *
 * The countdown here is a display of the server's deadline, nothing more.
 * Whether the attempt was in time is decided server-side on submission, so
 * pausing this timer, editing it, or blocking its tick changes nothing.
 */
export function QuizRunner({
  attemptId,
  quizId,
  quizTitle,
  totalMarks,
  questions,
  secondsRemaining,
  savedAnswers,
  coinEligible,
}: QuizRunnerProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(secondsRemaining);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const submitted = useRef(false);

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const initial: Record<string, AnswerState> = {};
    for (const q of questions) {
      const saved = savedAnswers[q.id];
      initial[q.id] = {
        selectedOptionIds: saved?.selectedOptionIds ?? [],
        writtenAnswer: saved?.writtenAnswer ?? "",
      };
    }
    return initial;
  });

  const question = questions[index];
  const expired = remaining <= 0;

  const submit = useCallback(
    async (auto = false) => {
      if (submitted.current) return;
      submitted.current = true;
      setSubmitting(true);

      const payload = {
        attemptId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id]?.selectedOptionIds ?? [],
          writtenAnswer: answers[q.id]?.writtenAnswer || null,
        })),
      };

      const result = await submitAttemptAction(payload);

      if (!result.ok) {
        submitted.current = false;
        setSubmitting(false);
        toast.error(result.error);
        return;
      }

      if (auto) toast.push({ tone: "info", title: "Time's up — submitted for you" });

      navigate(`/quizzes/${quizId}/results/${attemptId}`);
      router.refresh();
    },
    [answers, attemptId, questions, quizId, router, toast],
  );

  // Countdown. Auto-submits when it hits zero so an abandoned tab doesn't leave
  // an attempt open forever.
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          void submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before a refresh takes an in-progress attempt with it.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (submitted.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  function toggleOption(questionId: string, optionId: string, type: RunnerQuestion["type"]) {
    setAnswers((cur) => {
      const state = cur[questionId] ?? { selectedOptionIds: [], writtenAnswer: "" };
      if (type === "MCQ_SINGLE") {
        return { ...cur, [questionId]: { ...state, selectedOptionIds: [optionId] } };
      }
      const has = state.selectedOptionIds.includes(optionId);
      return {
        ...cur,
        [questionId]: {
          ...state,
          selectedOptionIds: has
            ? state.selectedOptionIds.filter((id) => id !== optionId)
            : [...state.selectedOptionIds, optionId],
        },
      };
    });
  }

  function isAnswered(q: RunnerQuestion): boolean {
    const state = answers[q.id];
    if (!state) return false;
    return q.type === "WRITTEN"
      ? state.writtenAnswer.trim().length > 0
      : state.selectedOptionIds.length > 0;
  }

  const answeredCount = questions.filter(isAnswered).length;
  const timeLow = remaining > 0 && remaining <= 60;

  if (!question) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* --------------------------------------------------------- Timer bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[15px] font-semibold text-bright">{quizTitle}</h1>
          <p className="text-xs text-faint">
            <span className="num">{totalMarks}</span> marks ·{" "}
            <span className="num">{questions.length}</span> questions
          </p>
        </div>

        {/* Quiet while there is time, loud only once there isn't. Urgent, not
            currency — amber stays reserved for Study Coins, so the countdown
            escalates through epic instead, same as anything else in this
            product that reads "due, needs you". */}
        <div
          className={cn(
            "num flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition-colors",
            expired
              ? "border-rose/50 bg-rose/12 text-[15px] text-rose"
              : timeLow
                ? "border-epic/60 bg-epic/15 text-[17px] text-epic"
                : "border-transparent bg-raise-2 text-[15px] text-muted",
          )}
          role="timer"
          aria-live="off"
        >
          <ClockIcon
            size={16}
            className={cn(
              "shrink-0",
              expired ? "text-rose" : timeLow ? "animate-pulse text-epic" : "text-faint",
            )}
          />
          {expired ? "Time's up" : formatDuration(remaining)}
        </div>
      </div>

      {expired ? (
        <Alert tone="rose" title="The timer ran out" className="mb-5">
          Finish the quiz if you want the practice — your answers still get marked. This attempt
          won&apos;t earn Study Coins.
        </Alert>
      ) : null}

      {/* ------------------------------------------------------ Question strip */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setIndex(i)}
            aria-label={`Question ${i + 1}${isAnswered(q) ? " (answered)" : ""}`}
            className={cn(
              "num h-9 w-9 rounded-sq border text-xs font-semibold transition-colors",
              i === index
                ? "border-accent-fill bg-accent-fill text-accent-ink"
                : isAnswered(q)
                  ? "border-lime/40 bg-lime/10 text-lime hover:border-lime/60"
                  : "border-line bg-raise text-faint hover:border-line-strong hover:text-muted",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Meter value={answeredCount} max={questions.length} tone="lime" className="mb-6" label="Answered" />

      {/* ------------------------------------------------------------ Question */}
      <Panel className="p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="font-display text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">
            Question <span className="num">{index + 1}</span> of{" "}
            <span className="num">{questions.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">
              {question.marks} mark{question.marks === 1 ? "" : "s"}
            </Badge>
            {question.type === "WRITTEN" ? (
              <Badge tone="violet">
                <FileTextIcon size={10} /> Written
              </Badge>
            ) : question.type === "MCQ_MULTI" ? (
              <Badge tone="cyan">Select all that apply</Badge>
            ) : null}
          </div>
        </div>

        {question.prompt ? (
          <p className="whitespace-pre-wrap font-display text-[20px] font-semibold leading-snug tracking-[-0.02em] text-bright sm:text-[22px]">
            {question.prompt}
          </p>
        ) : null}

        <StudyImage imageKey={question.imageKey} className="mt-5" />

        <div className="mt-7">
          {question.type === "WRITTEN" ? (
            <>
              <Textarea
                value={answers[question.id]?.writtenAnswer ?? ""}
                onChange={(e) =>
                  setAnswers((cur) => ({
                    ...cur,
                    [question.id]: {
                      selectedOptionIds: [],
                      writtenAnswer: e.target.value,
                    },
                  }))
                }
                rows={9}
                maxLength={20000}
                placeholder="Write your answer…"
                className="text-base leading-relaxed"
              />
              <p className="mt-2.5 text-[12px] leading-relaxed text-faint">
                Marked by AI against the mark scheme. You&apos;ll be able to challenge the mark.
              </p>
            </>
          ) : (
            <ul className="space-y-2.5">
              {question.options.map((option) => {
                const selected = answers[question.id]?.selectedOptionIds.includes(option.id) ?? false;
                return (
                  <li key={option.id}>
                    <label
                      className={cn(
                        "flex min-h-[52px] cursor-pointer items-start gap-3 rounded-sq border px-4 py-3.5 transition-colors",
                        selected
                          ? "border-accent/70 bg-accent/10"
                          : "border-line bg-raise hover:border-line-strong hover:bg-raise-2",
                      )}
                    >
                      {question.type === "MCQ_SINGLE" ? (
                        <Radio
                          name={`q-${question.id}`}
                          checked={selected}
                          onChange={() => toggleOption(question.id, option.id, question.type)}
                          className="mt-0.5"
                        />
                      ) : (
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleOption(question.id, option.id, question.type)}
                          className="mt-0.5"
                        />
                      )}
                      <span className="text-bright">{option.text}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      {/* ------------------------------------------------------------ Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          icon={<ChevronLeftIcon size={16} />}
        >
          Previous
        </Button>

        {index < questions.length - 1 ? (
          <Button size="lg" onClick={() => setIndex((i) => i + 1)}>
            Next
            <ChevronRightIcon size={16} />
          </Button>
        ) : confirming ? (
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <span className="text-[13px] text-muted">
              {answeredCount < questions.length
                ? `${questions.length - answeredCount} unanswered — submit anyway?`
                : "Submit for marking?"}
            </span>
            <Button variant="ghost" size="lg" onClick={() => setConfirming(false)} disabled={submitting}>
              Not yet
            </Button>
            <Button size="lg" onClick={() => void submit()} disabled={submitting}>
              {submitting ? <Spinner /> : null}
              Submit
            </Button>
          </div>
        ) : (
          <Button size="lg" onClick={() => setConfirming(true)} disabled={submitting}>
            {submitting ? <Spinner /> : <CoinIcon size={16} />}
            Finish quiz
          </Button>
        )}
      </div>

      {!coinEligible ? (
        <p className="mx-auto mt-6 max-w-md text-center text-[12px] leading-relaxed text-faint">
          This quiz is under 10 marks, so it doesn&apos;t award Study Coins — it still counts for
          practice.
        </p>
      ) : null}
    </div>
  );
}
