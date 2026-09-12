import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { matchResult } from "@/server/services/arena/match";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { RankBadge, EloDelta } from "@/components/arena/rank-badge";
import { CoinIcon, SwordIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Match result" };
export const dynamic = "force-dynamic";

/**
 * The results screen.
 *
 * Every figure the brief asked for, in the order that answers the questions a
 * player actually has: did I win, by how much, what did it cost or pay me, and
 * where does that leave my rank.
 *
 * The score is stated beside its parts rather than alone, because a score
 * nobody can decompose reads as arbitrary — and this one is not: it is the
 * accuracy, the volume, the speed and the run, weighted.
 */
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const user = await requireUser();

  const result = await matchResult(matchId, user.id);
  if (!result) notFound();

  const { you, opponent } = result;
  const outcome = result.isDraw ? "draw" : result.winnerId === user.id ? "win" : "loss";

  const headline =
    outcome === "win" ? "You won" : outcome === "loss" ? "You lost" : "A draw";

  const accuracy = you.answered === 0 ? 0 : you.correct / you.answered;
  const avgMs = you.answered === 0 ? 0 : Math.round(you.totalResponseMs / you.answered);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        title={headline}
        subtitle={
          result.subject
            ? `${result.subject} · ${result.totalQuestions} questions dealt`
            : `${result.totalQuestions} questions dealt`
        }
      />

      {/* The scoreboard. Both sides at the same scale, because a result screen
          that shrinks the loser is unpleasant to lose on. */}
      <Panel plain className="p-0">
        <div className="grid grid-cols-2 divide-x divide-line">
          <ScoreSide
            name="You"
            score={you.score}
            correct={you.correct}
            answered={you.answered}
            highlight={outcome === "win"}
          />
          <ScoreSide
            name={opponent?.user.name ?? opponent?.user.username ?? "Opponent"}
            score={opponent?.score ?? 0}
            correct={opponent?.correct ?? 0}
            answered={opponent?.answered ?? 0}
            highlight={outcome === "loss"}
            href={opponent?.user.username ? `/u/${opponent.user.username}` : undefined}
          />
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
            Your match
          </h2>
          <dl className="mt-4 space-y-2.5 text-[13.5px]">
            <Row label="Score" value={String(you.score)} />
            <Row label="Questions answered" value={String(you.answered)} />
            <Row label="Correct" value={`${you.correct}`} />
            <Row label="Accuracy" value={`${Math.round(accuracy * 100)}%`} />
            <Row
              label="Average response"
              value={avgMs === 0 ? "—" : `${(avgMs / 1000).toFixed(1)}s`}
            />
          </dl>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
            What it moved
          </h2>
          <dl className="mt-4 space-y-2.5 text-[13.5px]">
            <dt className="sr-only">Elo change</dt>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted">Elo</span>
              <span className="flex items-baseline gap-2">
                {you.eloDelta === null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <EloDelta delta={you.eloDelta} />
                )}
                <span className="num text-[13px] text-faint">→ {you.eloAfter ?? you.eloBefore}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted">Rank</span>
              <span className="flex items-center gap-2">
                {you.rankAfter && you.rankAfter !== you.rankBefore ? (
                  <>
                    <RankBadge rankKey={you.rankBefore} size="sm" />
                    <span className="text-faint">→</span>
                    <RankBadge rankKey={you.rankAfter} size="sm" />
                  </>
                ) : (
                  <RankBadge rankKey={you.rankAfter ?? you.rankBefore} size="sm" />
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted">Study Coins</span>
              <span className="num flex items-center gap-1 font-semibold text-coin-ink">
                +{you.coinsAwarded}
                <CoinIcon size={12} className="text-coin" />
              </span>
            </div>
          </dl>

          {result.pooledFrom === "shared_subject" ? (
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-faint">
              You and your opponent had few quizzes in common, so questions came from public
              material in a shared subject.
            </p>
          ) : null}
        </Panel>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <ButtonLink href="/arena" size="lg" icon={<SwordIcon size={16} />}>
          Play again
        </ButtonLink>
        <ButtonLink href="/arena" size="lg" variant="secondary">
          Return to Arena
        </ButtonLink>
        {opponent?.user.username ? (
          <ButtonLink href={`/u/${opponent.user.username}`} size="lg" variant="ghost">
            View opponent
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}

function ScoreSide({
  name,
  score,
  correct,
  answered,
  highlight,
  href,
}: {
  name: string;
  score: number;
  correct: number;
  answered: number;
  highlight?: boolean;
  href?: string;
}) {
  const body = (
    <div className={cn("p-6 text-center", highlight && "bg-uncommon/8")}>
      <p className="truncate text-[13px] font-semibold text-muted">{name}</p>
      <p
        className={cn(
          "num mt-2 font-display text-[42px] font-bold leading-none tracking-[-0.035em]",
          highlight ? "text-uncommon-ink" : "text-bright",
        )}
      >
        {score}
      </p>
      <p className="num mt-2 text-[13px] text-muted">
        {correct}/{answered} correct
      </p>
      {highlight ? (
        <div className="mt-3 flex justify-center">
          <Badge tone="uncommon">Winner</Badge>
        </div>
      ) : null}
    </div>
  );

  return href ? (
    <Link href={href} className="transition-colors hover:bg-raise">
      {body}
    </Link>
  ) : (
    body
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="num font-semibold text-bright">{value}</span>
    </div>
  );
}
