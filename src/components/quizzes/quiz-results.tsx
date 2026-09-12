"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { Alert, Badge, Meter, Skeleton, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader, rarityFor } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import {
  CheckIcon,
  CoinIcon,
  CrownIcon,
  EditIcon,
  SparkIcon,
  TargetIcon,
  XIcon,
} from "@/components/icons";
import {
  discardPracticeAction,
  generateImprovementAction,
  overrideMarkAction,
  savePracticeAction,
} from "@/server/actions/quizzes";
import { StudyImage } from "@/components/ui/image-field";
import { cn } from "@/lib/utils";

interface ResultAnswer {
  id: string;
  questionId: string;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "WRITTEN";
  prompt: string;
  marks: number;
  imageKey: string | null;
  markScheme: string | null;
  explanation: string | null;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  selectedOptionIds: string[];
  writtenAnswer: string | null;
  awardedMarks: number;
  aiMarks: number | null;
  aiFeedback: string | null;
  aiConfidence: number | null;
  overridden: boolean;
  overrideReason: string | null;
}

export interface QuizResultsProps {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  isPremium: boolean;
  answers: ResultAnswer[];
  summary: {
    awardedMarks: number;
    totalMarks: number;
    percentage: number;
    markedPercentage: number;
    coinsAwarded: number;
    coinSkipReason: string | null;
    timeExpired: boolean;
    overrideCount: number;
    markingPending: boolean;
  };
}

export function QuizResults(props: QuizResultsProps) {
  const [summary, setSummary] = useState(props.summary);
  const [answers, setAnswers] = useState(props.answers);

  const band =
    summary.percentage >= 80 ? "lime" : summary.percentage >= 60 ? "rare" : "rose";

  // Real, exact mastery for this attempt — the score panel is the one moment
  // on this page allowed to wear the rarity rail, and at the top of the
  // scale, the foil that goes with it.
  const scoreRarity = rarityFor(summary.percentage);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/quizzes/${props.quizId}`}
          className="text-[13px] text-muted transition-colors hover:text-bright"
        >
          ← {props.quizTitle}
        </Link>
      </div>

      {/* ------------------------------------------------------------- Score */}
      <Panel
        rarity={scoreRarity === "common" ? undefined : scoreRarity}
        className="relative overflow-hidden p-6 sm:p-8"
      >
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            {/* No kicker above the figure. The percentage is the largest
                thing on the page and needs no label announcing it. */}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span
                className={cn(
                  "num text-[64px] font-semibold leading-none tracking-[-0.03em] sm:text-[76px]",
                  band === "lime" ? "text-lime" : band === "rare" ? "text-rare" : "text-rose",
                )}
              >
                {summary.percentage}%
              </span>
              <span className="num font-display text-[19px] text-muted">
                {summary.awardedMarks} / {summary.totalMarks}
              </span>
            </div>
            <Meter
              value={summary.percentage}
              max={100}
              tone={band === "lime" ? "lime" : "violet"}
              className="mt-5 w-full sm:w-72"
            />
          </div>

          <div className="text-right">
            {summary.coinsAwarded > 0 ? (
              <div className="flex items-center gap-3 rounded-sq-lg border border-coin/35 bg-coin/10 px-5 py-4">
                <CoinIcon size={26} className="animate-coin-pop text-coin" />
                <span className="num text-[30px] font-semibold leading-none text-coin">
                  +{summary.coinsAwarded}
                </span>
              </div>
            ) : (
              <div className="max-w-64 rounded-sq border border-line bg-raise px-4 py-3 text-left text-[13px] leading-relaxed text-muted">
                {summary.coinSkipReason ?? "No coins from this attempt."}
              </div>
            )}
          </div>
        </div>

        {scoreRarity === "legendary" ? (
          <div
            className="foil pointer-events-none absolute inset-0 rounded-sq-card"
            aria-hidden="true"
          />
        ) : null}

        {summary.timeExpired ? (
          <Alert tone="rose" className="relative mt-6">
            The timer ran out on this attempt, so it didn&apos;t earn coins. The marks still count.
          </Alert>
        ) : null}
      </Panel>

      {/* -------------------------------------------------- Improvement quiz */}
      <ImprovementPanel
        attemptId={props.attemptId}
        isPremium={props.isPremium}
        droppedMarks={summary.totalMarks - summary.awardedMarks}
      />

      {/* ----------------------------------------------------------- Answers */}
      <div className="space-y-4 pt-2">
        <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em]">Question by question</h2>

        {answers.map((answer, index) => (
          <AnswerCard
            key={answer.id}
            index={index}
            answer={answer}
            attemptId={props.attemptId}
            onOverride={(updated, result) => {
              setAnswers((cur) => cur.map((a) => (a.id === updated.id ? updated : a)));
              setSummary((s) => ({
                ...s,
                awardedMarks: result.awardedMarks,
                percentage: result.percentage,
                overrideCount: s.overrideCount + 1,
              }));
            }}
          />
        ))}
      </div>

      {summary.overrideCount > 0 ? (
        <Alert tone="violet" title="You've changed some marks">
          Your score now reads {summary.percentage}%. Study Coins stay based on the{" "}
          {summary.markedPercentage}% the marker gave — otherwise changing your own marks would be a
          way to print coins.
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <ButtonLink href={`/quizzes/${props.quizId}/attempt`} size="lg">Try again</ButtonLink>
        <ButtonLink href={`/quizzes/${props.quizId}`} variant="secondary" size="lg">
          Back to quiz
        </ButtonLink>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AnswerCard({
  index,
  answer,
  attemptId,
  onOverride,
}: {
  index: number;
  answer: ResultAnswer;
  attemptId: string;
  onOverride: (
    updated: ResultAnswer,
    result: { awardedMarks: number; percentage: number },
  ) => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [marks, setMarks] = useState(answer.awardedMarks);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const full = answer.awardedMarks === answer.marks;
  const zero = answer.awardedMarks === 0;

  async function submitOverride() {
    setSaving(true);
    const result = await overrideMarkAction({
      attemptId,
      questionId: answer.questionId,
      marks,
      reason: reason.trim() || null,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onOverride(
      { ...answer, awardedMarks: marks, overridden: true, overrideReason: reason.trim() || null },
      { awardedMarks: result.data.awardedMarks, percentage: result.data.percentage },
    );
    setEditing(false);
    toast.success("Mark updated", "Your score reflects it. Coins stay on the original mark.");
    router.refresh();
  }

  return (
    <Panel>
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={cn(
              "num flex h-8 w-8 items-center justify-center rounded-sq border text-sm font-semibold",
              full
                ? "border-lime/30 bg-lime/12 text-lime"
                : zero
                  ? "border-rose/30 bg-rose/12 text-rose"
                  : "border-rare/30 bg-rare/12 text-rare",
            )}
          >
            {index + 1}
          </span>
          <span
            className={cn(
              "num text-sm font-semibold",
              full ? "text-lime" : zero ? "text-rose" : "text-rare",
            )}
          >
            {answer.awardedMarks} / {answer.marks}
          </span>
          {answer.overridden ? <Badge tone="neutral">Your mark</Badge> : null}
          {answer.type === "WRITTEN" && !answer.overridden && answer.aiMarks !== null ? (
            <Badge tone="violet">AI marked</Badge>
          ) : null}
        </div>

        {answer.type === "WRITTEN" && !editing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(true);
              setMarks(answer.awardedMarks);
            }}
            icon={<EditIcon size={13} />}
          >
            Disagree with this mark
          </Button>
        ) : null}
      </div>

      {answer.prompt ? (
        <p className="whitespace-pre-wrap font-display text-[17px] font-semibold leading-snug tracking-[-0.015em] text-bright">
          {answer.prompt}
        </p>
      ) : null}

      <StudyImage imageKey={answer.imageKey} className="mt-3 max-h-48" />

      {answer.type === "WRITTEN" ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-sq border border-line bg-sunken p-4">
            <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">
              Your answer
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-bright">
              {answer.writtenAnswer || <span className="text-faint">Left blank.</span>}
            </p>
          </div>

          {answer.aiFeedback ? (
            <div className="rounded-sq border border-accent/25 bg-accent/8 p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-accent">
                <SparkIcon size={12} /> Marker feedback
                {answer.aiConfidence !== null && answer.aiConfidence < 0.6 ? (
                  <Badge tone="epic">Low confidence — worth checking</Badge>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-muted">{answer.aiFeedback}</p>
            </div>
          ) : null}

          {answer.markScheme ? (
            <details className="rounded-sq border border-line bg-raise p-4">
              <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.06em] text-faint transition-colors hover:text-muted">
                Mark scheme
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {answer.markScheme}
              </p>
            </details>
          ) : null}

          {editing ? (
            <div className="rounded-sq border border-accent/25 bg-accent/8 p-4">
              <p className="text-sm leading-relaxed text-muted">
                Set the mark you believe this answer earned. Your score updates; the coins from this
                attempt don&apos;t change.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={answer.marks}
                  value={marks}
                  onChange={(e) =>
                    setMarks(Math.max(0, Math.min(answer.marks, Number(e.target.value) || 0)))
                  }
                  className="h-10 w-20 text-center"
                  aria-label="Marks"
                />
                <span className="text-sm text-muted">/ {answer.marks}</span>
              </div>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Why? (optional — useful when you come back to revise this)"
                className="mt-3"
              />
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={submitOverride} disabled={saving}>
                  {saving ? <Spinner /> : null}
                  Save mark
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : answer.overrideReason ? (
            <p className="text-xs text-faint">Your note: {answer.overrideReason}</p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {answer.options.map((option) => {
            const chosen = answer.selectedOptionIds.includes(option.id);
            return (
              <li
                key={option.id}
                className={cn(
                  "flex items-start gap-3 rounded-sq border px-4 py-3 text-sm leading-relaxed",
                  option.isCorrect
                    ? "border-lime/45 bg-lime/10 text-bright"
                    : chosen
                      ? "border-rose/45 bg-rose/10 text-bright"
                      : "border-line bg-raise text-muted",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {option.isCorrect ? (
                    <CheckIcon size={15} className="text-lime" />
                  ) : chosen ? (
                    <XIcon size={15} className="text-rose" />
                  ) : (
                    <span className="block h-3.5 w-3.5 rounded-full border border-line-strong" />
                  )}
                </span>
                <span className="flex-1">{option.text}</span>
                {chosen ? (
                  <span className="shrink-0 text-xs font-semibold text-faint">your pick</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {answer.explanation ? (
        <p className="mt-3.5 rounded-sq border border-line bg-raise px-4 py-3 text-sm leading-relaxed text-muted">
          {answer.explanation}
        </p>
      ) : null}
    </Panel>
  );
}

// ---------------------------------------------------------------------------

function ImprovementPanel({
  attemptId,
  isPremium,
  droppedMarks,
}: {
  attemptId: string;
  isPremium: boolean;
  droppedMarks: number;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [practice, setPractice] = useState<{
    id: string;
    title: string;
    description: string | null;
    isRealAi: boolean;
    questions: Array<{ type: string; prompt: string; marks: number }>;
  } | null>(null);

  if (droppedMarks <= 0) {
    return (
      <Alert tone="lime" title="Full marks">
        Nothing to improve on this one. Pick something harder.
      </Alert>
    );
  }

  if (!isPremium) {
    return (
      <Panel className="border-coin/25">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sq border border-coin/25 bg-coin/10 text-coin">
              <TargetIcon size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="flex flex-wrap items-center gap-2 font-display text-[15px] font-semibold text-bright">
                Turn these mistakes into practice
                <Badge tone="coin">
                  <CrownIcon size={10} /> Premium
                </Badge>
              </h3>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted">
                Premium builds a fresh quiz aimed at exactly what you dropped marks on — and you
                decide whether to keep it.
              </p>
            </div>
          </div>
          <ButtonLink href="/settings/plan" variant="coin" size="sm">
            See premium
          </ButtonLink>
        </div>
      </Panel>
    );
  }

  async function generate() {
    setGenerating(true);
    const result = await generateImprovementAction(attemptId);
    setGenerating(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPractice(result.data);
  }

  async function save() {
    if (!practice) return;
    setSaving(true);
    const result = await savePracticeAction(practice.id);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Saved to your quizzes");
    navigate(`/quizzes/${result.data.id}`);
    router.refresh();
  }

  async function discard() {
    if (!practice) return;
    await discardPracticeAction(practice.id);
    setPractice(null);
  }

  return (
    <Panel className="border-accent/30">
      <PanelHeader
        title="Practice your weak spots"
        subtitle={`You dropped ${droppedMarks} mark${droppedMarks === 1 ? "" : "s"}. Build a quiz that targets exactly those.`}
        action={
          practice ? null : (
            <Button size="sm" onClick={generate} disabled={generating} icon={generating ? <Spinner /> : <SparkIcon size={14} />}>
              {generating ? "Building…" : "Build practice quiz"}
            </Button>
          )
        }
      />

      {/* While the model is writing the questions this panel used to be empty
          below its header, so the finished quiz arrived as a sudden jump that
          pushed the rest of the results page down. Standing in the shape of
          the list keeps the page still and shows what is being built. */}
      {generating && !practice ? (
        <div className="space-y-4" aria-busy="true" aria-label="Building your practice quiz">
          <div>
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          </div>
          <ul className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="rounded-sq border border-line bg-raise px-4 py-3">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="mt-2 h-3.5 w-2/3" />
              </li>
            ))}
          </ul>
        </div>
      ) : practice ? (
        <div className="space-y-4">
          <div>
            <h4 className="font-display font-semibold text-bright">{practice.title}</h4>
            {practice.description ? (
              <p className="mt-0.5 text-sm text-muted">{practice.description}</p>
            ) : null}
            {!practice.isRealAi ? (
              <p className="mt-1 text-xs text-faint">
                Generated by the local provider — set an API key for model-written questions.
              </p>
            ) : null}
          </div>

          <ul className="space-y-2">
            {practice.questions.map((q, i) => (
              <li
                key={i}
                className="rounded-sq border border-line bg-raise px-4 py-3 text-sm leading-relaxed"
              >
                <span className="num mr-2 font-display font-semibold text-accent">
                  {i + 1}.
                </span>
                <span className="text-bright">{q.prompt}</span>
                <span className="ml-2 text-xs text-faint">
                  ({q.marks} mark{q.marks === 1 ? "" : "s"})
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              Save to my quizzes
            </Button>
            <Button variant="ghost" onClick={discard} disabled={saving}>
              Discard
            </Button>
            <span className="text-xs text-faint">Nothing is saved unless you say so.</span>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
