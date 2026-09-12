"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Radio } from "@/components/ui/form";
import { Alert, Badge, Meter, Spinner } from "@/components/ui/feedback";
import { Panel, rarityFor, type Rarity } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { useCoins } from "@/components/game/coin-provider";
import { CheckIcon, CoinIcon, FlameIcon, XIcon } from "@/components/icons";
import { submitDailyQuizAction } from "@/server/actions/daily-quiz";
import { DAILY_QUIZ } from "@/lib/coins/rules";
import { cn } from "@/lib/utils";

/** Same rungs the streak page grades against, so a given streak length reads
    the same colour everywhere it appears. */
const STREAK_RUNGS =
  Math.round((DAILY_QUIZ.multiplierMax - DAILY_QUIZ.multiplierStart) / DAILY_QUIZ.multiplierStep) + 1;
function streakRarity(days: number): Rarity {
  return rarityFor(Math.min(100, (days / STREAK_RUNGS) * 100));
}

const FLAME_TONE: Record<Rarity, string> = {
  common: "border-line bg-raise text-faint",
  uncommon: "border-uncommon/35 bg-uncommon/10 text-uncommon",
  rare: "border-rare/35 bg-rare/10 text-rare",
  epic: "border-epic/35 bg-epic/10 text-epic",
  legendary: "border-legendary/40 bg-legendary/14 text-legendary",
};

interface DailyQuestion {
  questionId: string;
  quizTitle: string;
  subject: string | null;
  type: "MCQ_SINGLE" | "MCQ_MULTI";
  prompt: string;
  options: Array<{ id: string; text: string }>;
}

export interface DailyResult {
  correctCount: number;
  totalCount: number;
  allCorrect: boolean;
  coinsAwarded: number;
  multiplier: number;
  answers: Array<{
    questionId: string;
    correct: boolean;
    selectedOptionIds: string[];
    correctOptionIds: string[];
  }>;
}

export function DailyRunner({
  questions,
  streak,
  multiplier,
  initialResult,
}: {
  questions: DailyQuestion[];
  streak: number;
  multiplier: number;
  initialResult: DailyResult | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const { applyAward } = useCoins();

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DailyResult | null>(initialResult);
  const [streakAfter, setStreakAfter] = useState(streak);

  const answeredCount = questions.filter((q) => (selections[q.questionId]?.length ?? 0) > 0).length;

  function toggle(question: DailyQuestion, optionId: string) {
    if (result) return;
    setSelections((cur) => {
      const current = cur[question.questionId] ?? [];
      if (question.type === "MCQ_SINGLE") return { ...cur, [question.questionId]: [optionId] };
      return {
        ...cur,
        [question.questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  }

  async function submit() {
    setSubmitting(true);
    const payload = questions.map((q) => ({
      questionId: q.questionId,
      selectedOptionIds: selections[q.questionId] ?? [],
    }));

    const response = await submitDailyQuizAction(payload);
    setSubmitting(false);

    if (!response.ok) return toast.error(response.error);

    const data = response.data;
    setResult({
      correctCount: data.correctCount,
      totalCount: data.totalCount,
      allCorrect: data.allCorrect,
      coinsAwarded: data.coinsAwarded,
      multiplier: data.multiplier,
      answers: data.answers,
    });
    setStreakAfter(data.streak);

    if (data.coinsAwarded > 0) {
      applyAward(
        data.coinsAwarded,
        data.balance,
        data.allCorrect ? "Perfect daily quiz" : "Daily quiz",
        `${data.correctCount}/${data.totalCount} correct at x${data.multiplier.toFixed(1)}`,
      );
    }

    router.refresh();
  }

  const answerFor = (questionId: string) => result?.answers.find((a) => a.questionId === questionId);

  const rarity = streakRarity(streak);
  const afterRarity = streakRarity(streakAfter);

  return (
    <div className="space-y-5 sm:space-y-6">
      {result ? (
        <Panel className="relative overflow-hidden p-6 sm:p-8">
          <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" />

          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <span className="num text-[56px] font-semibold leading-none tracking-[-0.03em] text-bright sm:text-[64px]">
                  {result.correctCount}
                  <span className="text-[28px] text-faint">/{result.totalCount}</span>
                </span>
                {result.allCorrect ? <Badge tone="coin">Perfect — bonus coin</Badge> : null}
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                {result.correctCount === 0
                  ? "Nothing right today — but your streak carries on regardless. That's the point of it."
                  : "Come back tomorrow to push the multiplier up."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={cn("flex items-center gap-2.5 rounded-sq-lg border px-4 py-3", FLAME_TONE[afterRarity])}>
                <FlameIcon size={22} />
                <div>
                  <div className="num text-[22px] font-semibold leading-none">
                    {streakAfter}
                  </div>
                  <div className="mt-1 text-[12px] text-faint">day streak</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-sq-lg border border-coin/35 bg-coin/10 px-4 py-3">
                <CoinIcon size={22} className="animate-coin-pop text-coin" />
                <div>
                  <div className="num text-[22px] font-semibold leading-none text-coin">
                    +{result.coinsAwarded}
                  </div>
                  <div className="num mt-1 text-[12px] text-faint">x{result.multiplier.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-sq border",
                FLAME_TONE[rarity],
              )}
            >
              <FlameIcon size={22} />
            </span>
            <div>
              <div className="font-display text-[17px] font-semibold">
                <span className="num">{streak}</span> day streak
              </div>
              <div className="mt-0.5 text-xs text-faint">
                Every question right is worth <span className="num">x{multiplier.toFixed(1)}</span> today
              </div>
            </div>
          </div>
          <div className="min-w-48 flex-1">
            {/* This counts questions, not coins — the coin tone stays for the
                submit button and the multiplier, where currency is actually
                on the line. */}
            <Meter value={answeredCount} max={questions.length} tone="violet" label="Answered" />
            <p className="mt-2 text-right text-[12px] text-faint">
              <span className="num">
                {answeredCount}/{questions.length}
              </span>{" "}
              answered
            </p>
          </div>
        </Panel>
      )}

      {questions.map((question, index) => {
        const answered = answerFor(question.questionId);
        const selected = answered?.selectedOptionIds ?? selections[question.questionId] ?? [];

        return (
          <Panel key={question.questionId} className="p-5 sm:p-6">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "num flex h-7 w-7 shrink-0 items-center justify-center rounded-sq border text-xs font-semibold",
                    answered
                      ? answered.correct
                        ? "border-lime/30 bg-lime/12 text-lime"
                        : "border-rose/30 bg-rose/12 text-rose"
                      : "border-accent/30 bg-accent/10 text-accent",
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate text-[12px] text-faint">
                  from {question.quizTitle}
                  {question.subject ? ` · ${question.subject}` : ""}
                </span>
              </span>
              {question.type === "MCQ_MULTI" ? (
                <Badge tone="cyan">Select all that apply</Badge>
              ) : null}
            </div>

            <p className="whitespace-pre-wrap font-display text-[19px] font-semibold leading-snug tracking-[-0.02em] text-bright sm:text-[20px]">
              {question.prompt}
            </p>

            <ul className="mt-5 space-y-2">
              {question.options.map((option) => {
                const isSelected = selected.includes(option.id);
                const isCorrect = answered?.correctOptionIds.includes(option.id) ?? false;

                return (
                  <li key={option.id}>
                    <label
                      className={cn(
                        "flex min-h-[52px] items-start gap-3 rounded-sq border px-4 py-3 transition-colors",
                        result
                          ? isCorrect
                            ? "border-lime/45 bg-lime/10"
                            : isSelected
                              ? "border-rose/45 bg-rose/10"
                              : "border-line bg-raise"
                          : isSelected
                            ? "cursor-pointer border-accent/70 bg-accent/10"
                            : "cursor-pointer border-line bg-raise hover:border-line-strong hover:bg-raise-2",
                      )}
                    >
                      {result ? (
                        <span className="mt-0.5 shrink-0">
                          {isCorrect ? (
                            <CheckIcon size={15} className="text-lime" />
                          ) : isSelected ? (
                            <XIcon size={15} className="text-rose" />
                          ) : (
                            <span className="block h-3.5 w-3.5 rounded-full border border-line-strong" />
                          )}
                        </span>
                      ) : question.type === "MCQ_SINGLE" ? (
                        <Radio
                          name={`d-${question.questionId}`}
                          checked={isSelected}
                          onChange={() => toggle(question, option.id)}
                          className="mt-0.5"
                        />
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggle(question, option.id)}
                          className="mt-0.5"
                        />
                      )}
                      <span className="text-bright">{option.text}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Panel>
        );
      })}

      {result ? (
        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/streak" size="lg">See your streak</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary" size="lg">
            Back to dashboard
          </ButtonLink>
        </div>
      ) : (
        <>
          {answeredCount < questions.length ? (
            <Alert tone="violet">
              {questions.length - answeredCount} still unanswered. You can submit anyway — the streak
              counts attempts, not scores.
            </Alert>
          ) : null}

          <Button
            size="lg"
            className="h-14 w-full text-[16px]"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? <Spinner /> : <CoinIcon size={18} />}
            Submit today&apos;s quiz
          </Button>
        </>
      )}
    </div>
  );
}
