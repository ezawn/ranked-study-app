import "server-only";

import { db } from "@/lib/db";
import { rankIndex } from "@/lib/arena/ranks";
import { regionForTimezone } from "@/lib/arena/region";

/**
 * Leaderboards.
 *
 * Sorted by rank first and Elo second, as specified. Because rank is derived
 * from Elo by a monotonic table, sorting by Elo alone produces the identical
 * order — so that is what the query does, and the rank column is carried for
 * display rather than ordering. Sorting by a text rank key would order the
 * ranks alphabetically, which is the kind of bug that looks like it works.
 *
 * Only players who have actually played appear. A board full of people at the
 * starting rating who have never entered the Arena tells nobody anything.
 */

export type LeaderboardScope = "global" | "local";

export interface LeaderboardRow {
  position: number;
  userId: string;
  name: string;
  username: string | null;
  rankKey: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  regionCode: string | null;
  /** True for the viewer's own row, so the UI can pin and highlight it. */
  isYou: boolean;
}

export interface LeaderboardPage {
  rows: LeaderboardRow[];
  total: number;
  /** The viewer's own row, even when it falls outside the page shown. */
  you: LeaderboardRow | null;
  scope: LeaderboardScope;
  regionCode: string | null;
}

const PAGE_SIZE = 50;

export async function leaderboard(
  viewerId: string,
  viewerTimezone: string,
  opts: { scope?: LeaderboardScope; page?: number; query?: string } = {},
): Promise<LeaderboardPage> {
  const scope = opts.scope ?? "global";
  const page = Math.max(0, opts.page ?? 0);
  const query = opts.query?.trim();

  const viewerProfile = await db.arenaProfile.findUnique({ where: { userId: viewerId } });
  const regionCode = viewerProfile?.regionCode ?? regionForTimezone(viewerTimezone);

  const where = {
    matchesPlayed: { gt: 0 },
    ...(scope === "local" && regionCode ? { regionCode } : {}),
    ...(query
      ? {
          user: {
            OR: [
              { username: { contains: query, mode: "insensitive" as const } },
              { name: { contains: query, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.arenaProfile.count({ where }),
    db.arenaProfile.findMany({
      where,
      orderBy: [{ elo: "desc" }, { wins: "desc" }, { createdAt: "asc" }],
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, name: true, username: true } } },
    }),
  ]);

  const mapped = rows.map((row, i) => toRow(row, page * PAGE_SIZE + i + 1, viewerId));

  return {
    rows: mapped,
    total,
    you: await viewerRow(viewerId, where, mapped),
    scope,
    regionCode,
  };
}

/**
 * The viewer's own standing.
 *
 * Their position is counted rather than searched for: the number of players
 * ahead of them, plus one. That is a single indexed count and stays correct at
 * any board size, where paging through until you find yourself would not.
 */
async function viewerRow(
  viewerId: string,
  where: Record<string, unknown>,
  alreadyShown: LeaderboardRow[],
): Promise<LeaderboardRow | null> {
  const onPage = alreadyShown.find((r) => r.isYou);
  if (onPage) return onPage;

  const mine = await db.arenaProfile.findUnique({
    where: { userId: viewerId },
    include: { user: { select: { id: true, name: true, username: true } } },
  });
  if (!mine || mine.matchesPlayed === 0) return null;

  const ahead = await db.arenaProfile.count({
    where: { ...where, elo: { gt: mine.elo } },
  });

  return toRow(mine, ahead + 1, viewerId);
}

type ProfileRow = {
  userId: string;
  rankKey: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  regionCode: string | null;
  user: { id: string; name: string | null; username: string | null };
};

function toRow(row: ProfileRow, position: number, viewerId: string): LeaderboardRow {
  return {
    position,
    userId: row.userId,
    name: row.user.name ?? row.user.username ?? "Player",
    username: row.user.username,
    rankKey: row.rankKey,
    elo: row.elo,
    matchesPlayed: row.matchesPlayed,
    wins: row.wins,
    winRate: row.matchesPlayed === 0 ? 0 : row.wins / row.matchesPlayed,
    regionCode: row.regionCode,
    isYou: row.userId === viewerId,
  };
}

/**
 * A player's standing on both boards, for their profile page.
 *
 * Returns null for a board they do not appear on rather than a fake position,
 * because "unranked" is a real state and inventing a number for it would be a
 * lie the profile then repeats everywhere.
 */
export async function standings(userId: string) {
  const profile = await db.arenaProfile.findUnique({ where: { userId } });
  if (!profile || profile.matchesPlayed === 0) return { global: null, local: null, regionCode: null };

  const [aheadGlobal, aheadLocal] = await Promise.all([
    db.arenaProfile.count({ where: { matchesPlayed: { gt: 0 }, elo: { gt: profile.elo } } }),
    profile.regionCode
      ? db.arenaProfile.count({
          where: {
            matchesPlayed: { gt: 0 },
            regionCode: profile.regionCode,
            elo: { gt: profile.elo },
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    global: aheadGlobal + 1,
    local: aheadLocal === null ? null : aheadLocal + 1,
    regionCode: profile.regionCode,
  };
}

/** Sort helper for any board rendered client-side. Rank first, then Elo. */
export function compareStanding(
  a: { rankKey: string; elo: number },
  b: { rankKey: string; elo: number },
): number {
  const byRank = rankIndex(b.rankKey) - rankIndex(a.rankKey);
  return byRank !== 0 ? byRank : b.elo - a.elo;
}
