import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deriveStats, favouriteSubjects } from "@/server/services/arena/profile";
import { standings } from "@/server/services/arena/leaderboard";
import { equippedLook, collectionProgress } from "@/server/services/arena/cosmetics";
import { regionName } from "@/lib/arena/region";
import { rankByKey } from "@/lib/arena/ranks";
import { Panel, SectionHeading, StatStrip } from "@/components/ui/panel";
import { Badge, EmptyState, Meter } from "@/components/ui/feedback";
import { CharacterPreview } from "@/components/arena/character";
import { RankBadge, RankProgress, EloDelta } from "@/components/arena/rank-badge";
import { CoinIcon, SwordIcon, TrophyIcon, RankIcon } from "@/components/icons";
import { formatNumber, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

/**
 * A player's profile.
 *
 * Reachable from a leaderboard row, a results screen and anywhere else a name
 * appears. Deliberately public to signed-in users and deliberately limited to
 * competitive facts: rank, record, character. Nothing about what they study,
 * what they own or what they have scored outside the Arena — a profile page is
 * not a reason to expose the rest of somebody's account.
 *
 * Study Coins are the one exception, because the brief asked for them and they
 * are already the visible currency of the shop.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await requireUser();

  const player = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      coinBalance: true,
      createdAt: true,
      arenaProfile: true,
    },
  });
  if (!player) notFound();

  const isYou = player.id === viewer.id;

  if (!player.arenaProfile) {
    return (
      <div className="space-y-7">
        <SectionHeading title={player.name ?? `@${player.username}`} />
        <EmptyState
          icon={<SwordIcon size={22} />}
          title="Hasn't entered the Arena"
          description={`${isYou ? "You have" : "This player has"} no competitive record yet.`}
        />
      </div>
    );
  }

  const stats = deriveStats(player.arenaProfile);

  const [place, look, collection, favourites, recent] = await Promise.all([
    standings(player.id),
    equippedLook(player.id),
    collectionProgress(player.id),
    favouriteSubjects(player.id, 3),
    db.matchPlayer.findMany({
      where: { userId: player.id, match: { status: "COMPLETE" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        match: {
          include: { players: { include: { user: { select: { name: true, username: true } } } } },
        },
      },
    }),
  ]);

  const peak = rankByKey(stats.peakRankKey);

  return (
    <div className="space-y-7">
      <SectionHeading
        title={player.name ?? `@${player.username}`}
        subtitle={player.username ? `@${player.username}` : undefined}
        action={<RankBadge rankKey={stats.rankKey} />}
      />

      <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* ------------------------------------------------- the character */}
        <div className="space-y-6">
          <Panel className="p-6">
            <CharacterPreview
              equipped={look}
              size={236}
              name={player.name?.split(" ")[0] ?? "Player"}
            />

            {look.length > 0 ? (
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {look.map((item) => (
                  <Badge key={item.category} tone="neutral">
                    {item.placeholderLabel}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-center text-[13px] text-muted">Nothing equipped.</p>
            )}

            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-muted">Collection</span>
                <span className="num font-semibold text-bright">
                  {collection.owned}/{collection.total}
                </span>
              </div>
              <Meter
                value={collection.fraction * 100}
                max={100}
                className="mt-2.5"
                label="Cosmetics collected"
              />
            </div>

            <p className="mt-4 flex items-center justify-between gap-3 text-[13px]">
              <span className="text-muted">Study Coins</span>
              <span className="num flex items-center gap-1 font-semibold text-coin-ink">
                <CoinIcon size={12} className="text-coin" />
                {formatNumber(player.coinBalance)}
              </span>
            </p>
          </Panel>

          <Panel className="p-6">
            <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
              Rank
            </h2>
            <RankProgress elo={stats.elo} className="mt-4" showNumbers={false} />
            <dl className="mt-4 space-y-2 border-t border-line pt-3 text-[13px]">
              <Line label="Highest reached" value={peak?.name ?? "—"} />
              <Line label="Peak Elo" value={formatNumber(stats.peakElo)} />
              <Line
                label="Global"
                value={place.global ? `#${formatNumber(place.global)}` : "Unranked"}
              />
              <Line
                label={stats.regionCode ? regionName(stats.regionCode) : "Local"}
                value={place.local ? `#${formatNumber(place.local)}` : "Unranked"}
              />
            </dl>
          </Panel>
        </div>

        {/* ------------------------------------------------------ the record */}
        <div className="space-y-6">
          <StatStrip
            stats={[
              {
                label: "Elo",
                value: formatNumber(stats.elo),
                hint: `${stats.matchesPlayed} matches`,
                icon: <RankIcon size={14} />,
              },
              {
                label: "Record",
                value: `${stats.wins}–${stats.losses}`,
                hint: `${stats.draws} draw${stats.draws === 1 ? "" : "s"}`,
                icon: <SwordIcon size={14} />,
              },
              {
                label: "Win rate",
                value: `${Math.round(stats.winRate * 100)}%`,
                hint: `Best streak: ${stats.bestWinStreak}`,
                icon: <TrophyIcon size={14} />,
              },
              {
                label: "Accuracy",
                value: `${Math.round(stats.averageAccuracy * 100)}%`,
                hint:
                  stats.averageResponseMs === 0
                    ? "No answers yet"
                    : `${(stats.averageResponseMs / 1000).toFixed(1)}s average`,
                icon: <TrophyIcon size={14} />,
              },
            ]}
          />

          {favourites.length > 0 ? (
            <Panel className="p-5">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
                Most played subjects
              </h2>
              <ul className="mt-3 space-y-2">
                {favourites.map((f, i) => (
                  <li key={f.subject} className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] text-bright">
                      {f.subject}
                      {i === 0 ? (
                        <span className="ml-2 text-[12px] text-muted">favourite</span>
                      ) : null}
                    </span>
                    <span className="num text-[13px] text-muted">{f.matches}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <section>
            <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
              Recent matches
            </h2>

            {recent.length === 0 ? (
              <EmptyState
                icon={<SwordIcon size={22} />}
                title="No matches yet"
                description="Results will appear here once they have played."
              />
            ) : (
              <Panel plain className="p-0">
                {recent.map((row, i) => {
                  const them = row.match.players.find((p) => p.userId !== player.id);
                  const outcome = row.outcome ?? "DRAW";
                  return (
                    <div
                      key={row.id}
                      className={`flex items-center gap-4 px-5 py-3 ${
                        i > 0 ? "border-t border-line" : ""
                      }`}
                    >
                      <span
                        className={`w-12 shrink-0 font-display text-[13px] font-bold ${
                          outcome === "WIN"
                            ? "text-uncommon-ink"
                            : outcome === "LOSS"
                              ? "text-epic-ink"
                              : "text-muted"
                        }`}
                      >
                        {outcome === "WIN" ? "Win" : outcome === "LOSS" ? "Loss" : "Draw"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] text-bright">
                          vs {them?.user.name ?? them?.user.username ?? "Opponent"}
                        </span>
                        <span className="num block text-xs text-muted">
                          {row.score} pts ·{" "}
                          <span className="font-sans">{relativeTime(row.createdAt)}</span>
                        </span>
                      </span>
                      {row.eloDelta === null ? null : <EloDelta delta={row.eloDelta} />}
                    </div>
                  );
                })}
              </Panel>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="num font-semibold text-bright">{value}</span>
    </div>
  );
}
