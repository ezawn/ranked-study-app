import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getViewableQuiz } from "@/server/services/quizzes";
import { attemptHistory, quizRewardStatus } from "@/server/services/quiz-attempts";
import { Panel, PanelHeader, rarityFor, SectionHeading, StatStrip } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Meter } from "@/components/ui/feedback";
import { QuizActions } from "@/components/quizzes/quiz-actions";
import { formatDuration, relativeTime, truncate } from "@/lib/utils";
import { QUIZZES, quizTimeLimitSeconds } from "@/lib/coins/rules";
import {
  ClockIcon,
  CoinIcon,
  EditIcon,
  FileTextIcon,
  GlobeIcon,
  PlayIcon,
  QuizIcon,
  TargetIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ quizId: string }>;
}): Promise<Metadata> {
  const { quizId } = await params;
  const user = await requireUser();
  const quiz = await getViewableQuiz(user.id, quizId).catch(() => null);
  return { title: quiz ? quiz.title : "Quiz" };
}

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const user = await requireUser();
  const { quizId } = await params;

  const quiz = await getViewableQuiz(user.id, quizId).catch(() => null);
  if (!quiz) notFound();

  const isOwner = quiz.ownerId === user.id;
  const [history, reward] = await Promise.all([
    attemptHistory(user.id, quiz.id),
    quizRewardStatus(user.id, quiz.id, user.plan),
  ]);

  const best = history.reduce((max, a) => Math.max(max, a.percentage), 0);
  const writtenCount = quiz.questions.filter((q) => q.type === "WRITTEN").length;

  // Exact, not a proxy — the best mark this quiz has ever earned — so the
  // attempt log is the one panel here trusted with the rarity rail.
  const historyRarity = rarityFor(best);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/quizzes" className="text-sm text-muted transition-colors hover:text-bright">
          ← All quizzes
        </Link>
      </div>

      <SectionHeading
        title={quiz.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {quiz.subject ? <Badge tone="neutral">{quiz.subject}</Badge> : null}
            {quiz.isPublic ? (
              <Badge tone="lime">
                <GlobeIcon size={10} /> Public
              </Badge>
            ) : null}
            {quiz.origin === "PDF_IMPORT" ? <Badge tone="cyan">Built from a PDF</Badge> : null}
            {quiz.origin === "AI_IMPROVEMENT" ? <Badge tone="neutral">AI practice</Badge> : null}
            {!isOwner ? <span className="text-sm">by {quiz.owner.name ?? "another student"}</span> : null}
          </span>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/quizzes/${quiz.id}/attempt`} size="lg" icon={<PlayIcon size={16} />}>
              {history.length > 0 ? "Take it again" : "Start quiz"}
            </ButtonLink>
            {isOwner ? (
              <ButtonLink href={`/quizzes/${quiz.id}/edit`} variant="ghost" icon={<EditIcon size={16} />}>
                Edit
              </ButtonLink>
            ) : null}
          </div>
        }
      />

      {quiz.description ? <p className="max-w-2xl text-muted">{quiz.description}</p> : null}

      <StatStrip
        stats={[
          {
            label: "Questions",
            value: quiz.questionCount,
            hint: writtenCount > 0 ? `${writtenCount} written, AI marked` : "All multiple choice",
            icon: <QuizIcon size={14} />,
          },
          {
            label: "Marks",
            value: quiz.totalMarks,
            hint:
              quiz.totalMarks >= QUIZZES.minMarksForCoins
                ? "Long enough to earn coins"
                : `Under ${QUIZZES.minMarksForCoins} — no coins`,
            icon: <TargetIcon size={14} />,
          },
          {
            label: "Time limit",
            value: formatDuration(reward?.timeLimitSeconds ?? quizTimeLimitSeconds(quiz.totalMarks)),
            hint: "1.5 minutes per mark",
            icon: <ClockIcon size={14} />,
          },
          {
            label: "Your best",
            value: history.length > 0 ? `${best}%` : "—",
            hint:
              history.length > 0
                ? `${history.length} attempt${history.length === 1 ? "" : "s"}`
                : "Not attempted yet",
            icon: <CoinIcon size={14} />,
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <PanelHeader
              title="What's in it"
              subtitle="Answers stay hidden until you've submitted."
            />
            <ol className="space-y-2">
              {quiz.questions.map((question, index) => (
                <li
                  key={question.id}
                  className="flex items-start gap-3 rounded-sq border border-line bg-raise px-4 py-3"
                >
                  <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sq-sm bg-raise-2 text-xs font-semibold text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-relaxed text-bright">
                    {truncate(question.prompt, 180)}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {question.type === "WRITTEN" ? (
                      <FileTextIcon size={14} className="text-faint" />
                    ) : null}
                    <span className="text-xs text-faint num">{question.marks}m</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          {history.length > 0 ? (
            <Panel
              rarity={historyRarity === "common" ? undefined : historyRarity}
              className="relative overflow-hidden"
            >
              {historyRarity === "legendary" ? (
                <div
                  className="foil pointer-events-none absolute inset-0 rounded-sq-card"
                  aria-hidden="true"
                />
              ) : null}
              <PanelHeader title="Your attempts" />
              <ul className="divide-y divide-line">
                {history.map((attempt) => (
                  <li key={attempt.id}>
                    <Link
                      href={`/quizzes/${quiz.id}/results/${attempt.id}`}
                      className="flex items-center gap-3 py-3 transition-colors hover:bg-raise sm:gap-4"
                    >
                      <span
                        className={`num text-lg font-semibold ${
                          attempt.percentage >= 80
                            ? "text-lime"
                            : attempt.percentage >= 60
                              ? "text-rare"
                              : "text-rose"
                        }`}
                      >
                        {attempt.percentage}%
                      </span>
                      {/* The one cell allowed to give ground: everything either
                          side of it is a fixed chip, so on a narrow phone with
                          every optional badge present, this is what wraps
                          rather than the row spilling off the screen. */}
                      <span className="min-w-0 flex-1 text-sm text-muted num">
                        {attempt.awardedMarks}/{attempt.totalMarks} marks
                        {attempt.overrideCount > 0 ? (
                          <span className="ml-2 text-xs text-rare">
                            · {attempt.overrideCount} mark{attempt.overrideCount === 1 ? "" : "s"} changed
                          </span>
                        ) : null}
                      </span>
                      {attempt.timeExpired ? (
                        <Badge tone="rose" className="shrink-0 whitespace-nowrap">
                          Timed out
                        </Badge>
                      ) : null}
                      {attempt.coinsAwarded > 0 ? (
                        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-coin num">
                          +{attempt.coinsAwarded}
                          <CoinIcon size={12} />
                        </span>
                      ) : null}
                      <span className="w-24 shrink-0 whitespace-nowrap text-right text-xs text-faint">
                        {attempt.submittedAt ? relativeTime(attempt.submittedAt) : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Study Coins" subtitle="What this quiz pays, and when." />

            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {QUIZZES.scoreBands.map((band) => (
                  <tr key={band.minPercent}>
                    <td className="py-1.5 text-muted">{band.minPercent}%+</td>
                    <td className="py-1.5 text-right font-display font-bold text-coin num">
                      {band.coins} coin{band.coins === 1 ? "" : "s"}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 text-faint">under 60%</td>
                  <td className="py-1.5 text-right text-faint">nothing</td>
                </tr>
              </tbody>
            </table>

            {reward ? (
              <div className="mt-4 space-y-3">
                {reward.eligible ? (
                  <Alert tone="lime" title="Ready to earn">
                    Score 60% or higher inside the time limit and the coins land automatically.
                  </Alert>
                ) : (
                  <Alert tone="amber" title="Not earning right now">
                    {reward.reason}
                    {reward.nextEligibleAt ? <> Ready again {relativeTime(reward.nextEligibleAt)}.</> : null}
                  </Alert>
                )}

                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted">Quizzes rewarded today</span>
                    <span className="num text-bright">
                      {reward.quizzesRewardedToday} / {reward.dailyLimit}
                    </span>
                  </div>
                  <Meter value={reward.quizzesRewardedToday} max={reward.dailyLimit} tone="coin" />
                  {user.plan === "FREE" ? (
                    <p className="mt-1.5 text-xs text-faint">
                      Premium raises this to {QUIZZES.dailyQuizLimit.PREMIUM} quizzes a day.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Panel>

          {isOwner ? (
            <Panel>
              <PanelHeader title="Manage" />
              <QuizActions quizId={quiz.id} isPublic={quiz.isPublic} questionCount={quiz.questionCount} />
              {quiz.questionCount < 3 && !quiz.isPublic ? (
                <p className="mt-3 text-xs text-faint">
                  Add at least 3 questions to publish this quiz.
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
