import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { leaderboard, type LeaderboardRow } from "@/server/services/arena/leaderboard";
import { regionName } from "@/lib/arena/region";
import { Panel, SectionHeading, FilterChip } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/search-input";
import { RankBadge } from "@/components/arena/rank-badge";
import { TrophyIcon } from "@/components/icons";
import { cn, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

/**
 * Global and local boards.
 *
 * Local is derived from the timezone the user already gave us rather than from
 * an IP lookup, so the board never depends on location data nobody agreed to
 * share. It says which region it decided on, because a "local" board that
 * quietly guessed wrong is worse than one that shows its working.
 */
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const scope = params.scope === "local" ? "local" : "global";
  const query = params.q?.trim() || undefined;
  const page = Number.parseInt(params.page ?? "0", 10) || 0;

  const board = await leaderboard(user.id, user.timezone, { scope, page, query });

  const base = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { scope, q: query, page: page ? String(page) : undefined, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/leaderboard?${qs}` : "/leaderboard";
  };

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Leaderboard"
        subtitle="Ranked by Elo. Only players who have actually played a match appear."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <FilterChip href={base({ scope: "global", page: undefined })} active={scope === "global"}>
            Global
          </FilterChip>
          <FilterChip href={base({ scope: "local", page: undefined })} active={scope === "local"}>
            {board.regionCode ? regionName(board.regionCode) : "Local"}
          </FilterChip>
        </div>

        {/* Writes straight to the URL and keeps the other params, so switching
            scope does not clear a search and vice versa. */}
        <SearchInput placeholder="Find a player" className="w-full sm:w-72" />
      </div>

      {scope === "local" && !board.regionCode ? (
        <EmptyState
          icon={<TrophyIcon size={22} />}
          title="No region set"
          description="Your local board comes from your timezone. Set one in settings and this fills in."
        />
      ) : board.rows.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon size={22} />}
          title={query ? "Nobody by that name" : "Nobody has played yet"}
          description={
            query
              ? "Try a different name or username."
              : "Play a Study 1v1 and you'll be the first on the board."
          }
        />
      ) : (
        <>
          <Panel plain className="p-0">
            {/* Column headings only where there is room for them. On a phone the
                row itself carries its labels. */}
            <div className="hidden border-b border-line px-5 py-2.5 text-[12px] font-semibold text-faint sm:grid sm:grid-cols-[3rem_minmax(0,1fr)_7rem_5rem_5rem]">
              <span>#</span>
              <span>Player</span>
              <span>Rank</span>
              <span className="text-right">Elo</span>
              <span className="text-right">Win rate</span>
            </div>

            <ul>
              {board.rows.map((row, i) => (
                <Row key={row.userId} row={row} first={i === 0} />
              ))}
            </ul>
          </Panel>

          {/* The viewer's own standing, pinned when they are off the page. */}
          {board.you && !board.rows.some((r) => r.isYou) ? (
            <Panel plain className="p-0">
              <ul>
                <Row row={board.you} first />
              </ul>
            </Panel>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-muted">
              <span className="num font-semibold text-bright">{formatNumber(board.total)}</span>{" "}
              ranked player{board.total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              {page > 0 ? (
                <Link href={base({ page: String(page - 1) })} className="link text-[13px] font-semibold">
                  Previous
                </Link>
              ) : null}
              {(page + 1) * 50 < board.total ? (
                <Link href={base({ page: String(page + 1) })} className="link text-[13px] font-semibold">
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ row, first }: { row: LeaderboardRow; first: boolean }) {
  const href = row.username ? `/u/${row.username}` : undefined;

  const body = (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5",
        "sm:grid-cols-[3rem_minmax(0,1fr)_7rem_5rem_5rem]",
        !first && "border-t border-line",
        row.isYou && "bg-accent/8",
      )}
    >
      <span
        className={cn(
          "num text-[14px] font-bold",
          row.position <= 3 ? "text-legendary-ink" : "text-muted",
        )}
      >
        {row.position}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium text-bright">
          {row.name}
          {row.isYou ? <span className="ml-1.5 text-[12px] text-accent-deep">you</span> : null}
        </span>
        <span className="num block text-xs text-muted sm:hidden">
          {row.elo} Elo · {Math.round(row.winRate * 100)}%
        </span>
      </span>

      <span className="hidden sm:block">
        <RankBadge rankKey={row.rankKey} size="sm" />
      </span>

      <span className="num hidden text-right text-[14px] font-semibold text-bright sm:block">
        {formatNumber(row.elo)}
      </span>

      <span className="num hidden text-right text-[13px] text-muted sm:block">
        {Math.round(row.winRate * 100)}%
        <span className="block text-[11px] text-faint">{row.matchesPlayed} played</span>
      </span>

      <span className="sm:hidden">
        <RankBadge rankKey={row.rankKey} size="sm" />
      </span>
    </div>
  );

  return (
    <li>
      {href ? (
        <Link href={href} className="block transition-colors hover:bg-raise">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
