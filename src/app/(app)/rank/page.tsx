import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { rankPageData } from "@/server/services/arena/profile";
import { standings } from "@/server/services/arena/leaderboard";
import { RANKS } from "@/lib/arena/ranks";
import { Panel, SectionHeading, StatStrip } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/feedback";
import { RankProgress, RankBadge, EloDelta } from "@/components/arena/rank-badge";
import { RankIcon, SwordIcon, TrophyIcon } from "@/components/icons";
import { cn, formatNumber, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Rank" };
export const dynamic = "force-dynamic";

export default async function RankPage() {
  const user = await requireUser();

  const [data, place] = await Promise.all([
    rankPageData(user.id, user.timezone),
    standings(user.id),
  ]);

  const { stats, progress, peakRank, recentEvents } = data;

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Rank"
        subtitle="Eleven tiers, decided by Elo. Beat someone above you and you climb faster; lose to someone far above you and you barely fall."
      />

      <Panel className="p-6">
        <RankProgress elo={stats.elo} />

        {progress.next ? (
          <p className="mt-4 border-t border-line pt-4 text-[13.5px] leading-relaxed text-muted">
            You&apos;re{" "}
            <span className="num font-semibold text-bright">
              {Math.round(progress.fraction * 100)}%
            </span>{" "}
            through {progress.rank.name}, with{" "}
            <span className="num font-semibold text-bright">{progress.eloToNext}</span> Elo to reach{" "}
            {progress.next.name}.
          </p>
        ) : (
          <p className="mt-4 border-t border-line pt-4 text-[13.5px] leading-relaxed text-muted">
            There is nothing above {progress.rank.name}. Hold it.
          </p>
        )}
      </Panel>

      <StatStrip
        stats={[
          {
            label: "Ranked wins",
            value: formatNumber(stats.wins),
            zeroLabel: "None yet",
            hint: `${stats.matchesPlayed} matches played`,
            icon: <SwordIcon size={14} />,
          },
          {
            label: "Highest rank",
            value: peakRank.name,
            hint: `Peak ${formatNumber(stats.peakElo)} Elo`,
            icon: <TrophyIcon size={14} />,
          },
          {
            label: "Win streak",
            value: formatNumber(stats.currentWinStreak),
            zeroLabel: "None running",
            hint: `Best: ${stats.bestWinStreak}`,
            icon: <RankIcon size={14} />,
          },
          {
            label: "Global position",
            value: place.global ? `#${formatNumber(place.global)}` : "—",
            hint: place.local ? `#${formatNumber(place.local)} locally` : "Unranked",
            icon: <TrophyIcon size={14} />,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
            Recent Elo
          </h2>

          {recentEvents.length === 0 ? (
            <EmptyState
              icon={<RankIcon size={22} />}
              title="No matches yet"
              description="Every gain and loss will be listed here with the match behind it."
            />
          ) : (
            <Panel plain className="p-0">
              {recentEvents.map((event, i) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center justify-between gap-3 px-5 py-3",
                    i > 0 && "border-t border-line",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[13.5px] text-bright">
                      {event.matchId ? (
                        <Link href={`/arena/results/${event.matchId}`} className="link">
                          Ranked match
                        </Link>
                      ) : (
                        "Adjustment"
                      )}
                    </span>
                    <span className="block text-xs text-muted">{relativeTime(event.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <EloDelta delta={event.delta} />
                    <span className="num text-[13px] text-faint">{event.eloAfter}</span>
                  </span>
                </div>
              ))}
            </Panel>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
            The ladder
          </h2>
          <Panel plain className="p-0">
            {[...RANKS].reverse().map((rank, i) => {
              const held = rank.key === stats.rankKey;
              const reached = stats.elo >= rank.minElo;
              return (
                <div
                  key={rank.key}
                  className={cn(
                    "flex items-center justify-between gap-3 px-5 py-2.5",
                    i > 0 && "border-t border-line",
                    held && "bg-accent/8",
                    !reached && "opacity-60",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <RankBadge rankKey={rank.key} size="sm" />
                    {held ? (
                      <span className="text-[12px] font-semibold text-accent-deep">you</span>
                    ) : null}
                  </span>
                  <span className="num text-[13px] text-muted">
                    {formatNumber(rank.minElo)}+
                  </span>
                </div>
              );
            })}
          </Panel>
        </section>
      </div>
    </div>
  );
}
