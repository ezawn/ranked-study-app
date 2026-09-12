import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ensureArenaProfile, deriveStats } from "@/server/services/arena/profile";
import { standings } from "@/server/services/arena/leaderboard";
import { equippedLook } from "@/server/services/arena/cosmetics";
import { Panel, PanelLink, SectionHeading, StatStrip } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/feedback";
import { RankProgress, RankBadge, EloDelta } from "@/components/arena/rank-badge";
import { CharacterPreview } from "@/components/arena/character";
import { Matchmaker } from "@/components/arena/matchmaker";
import { CharacterIcon, CoinIcon, RankIcon, SwordIcon, TrophyIcon } from "@/components/icons";
import { relativeTime, formatNumber } from "@/lib/utils";
import { BATTLE_SECONDS } from "@/server/services/arena/match";
import { streamOptions } from "@/server/services/bank/query";
import { SUBJECTS, SUBJECT_LABEL, STAGES, streamKey, type Subject } from "@/lib/bank/taxonomy";

export const metadata: Metadata = { title: "Study 1v1" };
export const dynamic = "force-dynamic";

/**
 * The Arena.
 *
 * The competitive centre of the product, so the decision comes first exactly
 * as it does on the dashboard: your standing, then the button that starts a
 * match, then everything else. The three other Arena screens are doors on the
 * rail rather than headlines, because you come here to play.
 */
export default async function ArenaPage() {
  const user = await requireUser();

  const profile = await ensureArenaProfile(user.id, user.timezone);
  const stats = deriveStats(profile);

  const [live, place, look, recent] = await Promise.all([
    /* What the bank can actually ask, so the picker shows real counts rather
       than offering subjects that turn out to be empty. */
    streamOptions(),
    standings(user.id),
    equippedLook(user.id),
    db.matchPlayer.findMany({
      where: { userId: user.id, match: { status: "COMPLETE" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        match: {
          include: {
            players: { include: { user: { select: { name: true, username: true } } } },
          },
        },
      },
    }),
  ]);

  /*
   * Every subject at every qualification, whether or not the bank has anything
   * for it yet. The empty ones render as greyed-out "soon" chips rather than
   * being hidden: a student choosing what to be asked should be able to see
   * where this is going, and an unticked, unclickable chip cannot produce a
   * search that matches nothing.
   */
  const byStream = new Map(live.map((stream) => [stream.stream, stream]));

  const streams = SUBJECTS.flatMap((subject: Subject) =>
    STAGES.map((stage) => {
      const key = streamKey(subject, stage);
      const found = byStream.get(key);
      return {
        key,
        subject,
        subjectLabel: SUBJECT_LABEL[subject],
        stage,
        count: found?.total ?? 0,
      };
    }),
  );

  const bankTotal = live.reduce((sum, stream) => sum + stream.total, 0);

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Study 1v1"
        subtitle={`Two minutes, rapid questions, one opponent. Questions come from the permanent GCSE and A-Level bank — tick the subjects you want and you'll be matched with anyone whose picks overlap yours.`}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
              <div className="min-w-0">
                <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
                  Ready to play
                </h2>
                <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted">
                  {BATTLE_SECONDS / 60} minutes, answer as many as you can. Both players get the
                  same questions in the same order.
                </p>
              </div>
              <RankBadge rankKey={stats.rankKey} />
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <Matchmaker streams={streams} bankTotal={bankTotal} />
            </div>
          </Panel>

          <StatStrip
            stats={[
              {
                label: "Elo",
                value: formatNumber(stats.elo),
                hint: `Peak ${formatNumber(stats.peakElo)}`,
                icon: <RankIcon size={14} />,
              },
              {
                label: "Matches",
                value: formatNumber(stats.matchesPlayed),
                zeroLabel: "None yet",
                hint: `${stats.wins}W · ${stats.losses}L · ${stats.draws}D`,
                icon: <SwordIcon size={14} />,
              },
              {
                label: "Win rate",
                value: `${Math.round(stats.winRate * 100)}%`,
                hint:
                  stats.currentWinStreak > 0
                    ? `${stats.currentWinStreak} in a row`
                    : `Best run: ${stats.bestWinStreak}`,
                icon: <TrophyIcon size={14} />,
              },
              {
                label: "Global rank",
                value: place.global ? `#${formatNumber(place.global)}` : "—",
                hint: place.local ? `#${formatNumber(place.local)} locally` : "Play a match to rank",
                icon: <TrophyIcon size={14} />,
              },
            ]}
          />

          <section>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
              <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
                Recent matches
              </h2>
              <Link href="/rank" className="link text-[13px] font-semibold">
                Rank history
              </Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon={<SwordIcon size={22} />}
                title="No matches yet"
                description="Your results, the Elo they moved and who you played will show up here."
              />
            ) : (
              <Panel plain className="p-0">
                {recent.map((row, i) => {
                  const them = row.match.players.find((p) => p.userId !== user.id);
                  const outcome = row.outcome ?? "DRAW";
                  return (
                    <Link
                      key={row.id}
                      href={`/arena/results/${row.matchId}`}
                      className={`flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-raise ${
                        i > 0 ? "border-t border-line" : ""
                      }`}
                    >
                      <span
                        className={`w-14 shrink-0 font-display text-[13px] font-bold ${
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
                        <span className="block truncate text-[14px] text-bright">
                          {them?.user.name ?? them?.user.username ?? "Opponent"}
                        </span>
                        <span className="num block text-xs text-muted">
                          {row.score} pts · {row.correct}/{row.answered} ·{" "}
                          <span className="font-sans">{relativeTime(row.createdAt)}</span>
                        </span>
                      </span>
                      {row.eloDelta === null ? null : <EloDelta delta={row.eloDelta} />}
                    </Link>
                  );
                })}
              </Panel>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <Panel className="p-6">
            <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
              Your rank
            </h2>
            <RankProgress elo={stats.elo} className="mt-4" />
            <Link href="/rank" className="link mt-4 inline-block text-[13px] font-semibold">
              Full breakdown
            </Link>
          </Panel>

          <PanelLink href="/character" className="block p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
                Your character
              </h2>
              <CharacterIcon size={16} className="text-accent" />
            </div>
            <div className="mt-4">
              <CharacterPreview equipped={look} size={168} name={user.name ?? "You"} />
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[13px] text-muted">
              <CoinIcon size={13} className="text-coin" />
              <span className="num font-semibold text-coin-ink">
                {formatNumber(user.coinBalance)}
              </span>
              to spend in the shop
            </p>
          </PanelLink>
        </aside>
      </div>
    </div>
  );
}
