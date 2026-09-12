"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Meter, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader, rarityFor, type Rarity } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CheckIcon, CrownIcon, SparkIcon, TargetIcon } from "@/components/icons";
import { generateTestPracticeAction } from "@/server/actions/test-feedback";
import { savePracticeAction, discardPracticeAction } from "@/server/actions/quizzes";
import { cn } from "@/lib/utils";

interface Strength {
  topic: string;
  evidence: string;
}
interface Weakness {
  topic: string;
  evidence: string;
  suggestion: string;
}
interface TopicScore {
  topic: string;
  correct: number;
  total: number;
}

/**
 * The estimated score chip, coloured by the same rarity scale a set or quiz
 * tile earns through mastery — a paper is graded the same way anything else
 * in this product is.
 */
const SCORE_CHIP: Record<Rarity, string> = {
  common: "border-line bg-raise text-bright",
  uncommon: "border-uncommon/35 bg-uncommon/10 text-uncommon-ink",
  rare: "border-rare/35 bg-rare/10 text-rare-ink",
  epic: "border-epic/35 bg-epic/10 text-epic-ink",
  legendary: "border-legendary/40 bg-legendary/14 text-legendary-ink",
};

/**
 * The report.
 *
 * It is laid out as a document rather than a dashboard: a lede with the one
 * figure that summarises the paper — its rarity comes from the same
 * `rarityFor` scale every set and quiz is graded on — then the two findings
 * side by side and deliberately mirrored — a tick against a target, mint
 * against coral — then the topic table, then the tool.
 *
 * The practice block at the bottom is a recessed tray rather than another lit
 * panel, because it is not a finding. It is a thing you can run.
 */
export function ReportView({
  submissionId,
  isPremium,
  summary,
  strengths,
  weaknesses,
  topicBreakdown,
  estimatedScore,
}: {
  submissionId: string;
  isPremium: boolean;
  summary: string;
  strengths: Strength[];
  weaknesses: Weakness[];
  topicBreakdown: TopicScore[];
  estimatedScore: number | null;
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
    questions: Array<{ prompt: string; marks: number }>;
  } | null>(null);

  async function generate() {
    setGenerating(true);
    const result = await generateTestPracticeAction(submissionId);
    setGenerating(false);
    if (!result.ok) return toast.error(result.error);
    setPractice(result.data);
  }

  async function save() {
    if (!practice) return;
    setSaving(true);
    const result = await savePracticeAction(practice.id);
    setSaving(false);
    if (!result.ok) return toast.error(result.error);

    toast.success("Added to your quizzes");
    navigate(`/quizzes/${result.data.id}`);
    router.refresh();
  }

  const rarity = rarityFor(estimatedScore);

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------- Lede */}
      <Panel
        className="relative overflow-hidden"
        rarity={rarity === "common" ? undefined : rarity}
      >
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
        {/* A 90%+ paper is the one moment this screen genuinely earned foil. */}
        {rarity === "legendary" ? (
          <div className="foil pointer-events-none absolute inset-0" aria-hidden="true" />
        ) : null}
        <div className="relative flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 max-w-3xl">
            <h2 className="font-display text-lg font-semibold text-bright">The short version</h2>
            <p className="mt-2 leading-relaxed text-muted">{summary}</p>
          </div>
          {estimatedScore !== null ? (
            <div className={cn("shrink-0 rounded-sq border px-5 py-3 text-right", SCORE_CHIP[rarity])}>
              <div className="num text-[32px] font-semibold leading-none tracking-[-0.02em]">
                {estimatedScore}%
              </div>
              <div className="mt-1.5 text-xs text-faint">estimated</div>
            </div>
          ) : null}
        </div>
      </Panel>

      {/* --------------------------------------------------------- Findings */}
      <div className="grid gap-5 md:grid-cols-2">
        <Panel>
          <PanelHeader title="What's working" subtitle="Backed by what's in the paper." />
          {strengths.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              Nothing stood out as a clear strength this time.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {strengths.map((item, i) => (
                <li
                  key={i}
                  className="rounded-sq border border-line bg-raise py-3 pl-4 pr-3.5"
                >
                  <div className="flex items-start gap-2 font-display text-[14.5px] font-semibold text-lime">
                    <CheckIcon size={15} className="mt-0.5 shrink-0" />
                    {item.topic}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.evidence}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Where the marks went" subtitle="Each one has a next step." />
          {weaknesses.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">No clear weak spots — nice paper.</p>
          ) : (
            <ul className="space-y-2.5">
              {weaknesses.map((item, i) => (
                <li
                  key={i}
                  className="rounded-sq border border-line bg-raise py-3 pl-4 pr-3.5"
                >
                  <div className="flex items-start gap-2 font-display text-[14.5px] font-semibold text-rose">
                    <TargetIcon size={15} className="mt-0.5 shrink-0" />
                    {item.topic}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.evidence}</p>
                  <p className="mt-2.5 rounded-sq-sm border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-bright">
                    {item.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ---------------------------------------------------- Topic by topic */}
      {topicBreakdown.length > 0 ? (
        <Panel>
          <PanelHeader title="Topic by topic" />
          {/* Bars start at the same x on a wide screen, so the short ones are
              obvious without reading a single percentage. */}
          <ul className="divide-y divide-line">
            {topicBreakdown.map((topic, i) => {
              const pct = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
              return (
                <li
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(6rem,13rem)_auto]"
                >
                  <span className="min-w-0 truncate text-sm text-bright">{topic.topic}</span>
                  <span className="num shrink-0 whitespace-nowrap text-right text-[13px] text-muted sm:order-3">
                    {topic.correct}/{topic.total} · {pct}%
                  </span>
                  <div className="col-span-2 sm:order-2 sm:col-span-1">
                    <Meter value={pct} max={100} tone={pct >= 70 ? "lime" : "violet"} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      {/* --------------------------------------------------- Premium practice */}
      <section
        className={cn(
          "rounded-sq-lg border bg-sunken p-6 shadow-[inset_0_1px_2px_rgb(23_23_26/0.05)]",
          isPremium ? "border-accent/30" : "border-coin/30",
        )}
      >
        <PanelHeader
          title="Turn the gaps into practice"
          subtitle={
            isPremium
              ? "Builds questions aimed at exactly what you dropped marks on. You decide whether to keep them."
              : "Premium builds targeted practice questions from this report and adds them to your quizzes."
          }
          action={
            isPremium ? (
              practice ? null : (
                <Button
                  size="sm"
                  onClick={generate}
                  disabled={generating || weaknesses.length === 0}
                  icon={generating ? <Spinner /> : <SparkIcon size={14} />}
                >
                  {generating ? "Building…" : "Build practice"}
                </Button>
              )
            ) : (
              <ButtonLink href="/settings/plan" variant="coin" size="sm" icon={<CrownIcon size={14} />}>
                See premium
              </ButtonLink>
            )
          }
        />

        {practice ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-display font-semibold text-bright">{practice.title}</h4>
              {practice.description ? (
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{practice.description}</p>
              ) : null}
            </div>

            <ul className="space-y-2">
              {practice.questions.map((q, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-2 rounded-sq border border-line bg-surface px-4 py-3 text-sm"
                >
                  <span className="num shrink-0 font-semibold text-accent">{i + 1}.</span>
                  <span className="min-w-0 flex-1 leading-relaxed text-bright">{q.prompt}</span>
                  <span className="shrink-0 text-xs text-faint">({q.marks}m)</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? <Spinner /> : null}
                Add to my quizzes
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await discardPracticeAction(practice.id);
                  setPractice(null);
                }}
                disabled={saving}
              >
                Discard
              </Button>
              <Badge tone="neutral">Nothing is saved unless you say so</Badge>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
