import "server-only";

import { db } from "@/lib/db";
import type { Tx } from "@/server/services/coins";
import { STARTING_ELO, rankForElo, rankProgress, rankByKey } from "@/lib/arena/ranks";
import { regionForTimezone } from "@/lib/arena/region";


/**
 * The competitive profile.
 *
 * Created lazily rather than at sign-up, so the Arena can ship without a
 * backfill over every existing user and without a migration that has to invent
 * a rating for people who have never played. The first Arena page a user opens
 * creates theirs.
 */

export async function ensureArenaProfile(userId: string, timezone: string, tx?: Tx) {
  const client = tx ?? db;

  const existing = await client.arenaProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  return client.arenaProfile.create({
    data: {
      userId,
      elo: STARTING_ELO,
      peakElo: STARTING_ELO,
      rankKey: rankForElo(STARTING_ELO).key,
      peakRankKey: rankForElo(STARTING_ELO).key,
      regionCode: regionForTimezone(timezone),
    },
  });
}

/**
 * The subjects a player can be matched on.
 *
 * Read from what they own and what they have taken into their library, because
 * a subject you have material in is a subject you can be asked about. Kept
 * denormalised on the queue row so candidate scanning never joins through this.
 */
export async function subjectsForUser(userId: string): Promise<string[]> {
  const [sets, quizzes, library] = await Promise.all([
    db.flashcardSet.findMany({
      where: { ownerId: userId, subject: { not: null } },
      select: { subject: true },
      distinct: ["subject"],
    }),
    db.quiz.findMany({
      where: { ownerId: userId, subject: { not: null } },
      select: { subject: true },
      distinct: ["subject"],
    }),
    db.libraryItem.findMany({
      where: { userId },
      select: {
        flashcardSet: { select: { subject: true } },
        quiz: { select: { subject: true } },
      },
    }),
  ]);

  return normaliseSubjects([
    ...sets.map((s) => s.subject),
    ...quizzes.map((q) => q.subject),
    ...library.map((l) => l.flashcardSet?.subject),
    ...library.map((l) => l.quiz?.subject),
  ]);
}

/**
 * Quizzes this player has actually attempted.
 *
 * The evidence of "studied" for knowledge overlap. Only MARKED attempts count:
 * opening a quiz and abandoning it is not studying it, and letting it count
 * would be a trivial way to widen your own pool.
 */
export async function studiedQuizIdsForUser(userId: string): Promise<string[]> {
  const attempts = await db.quizAttempt.findMany({
    where: { userId, status: "MARKED" },
    select: { quizId: true },
    distinct: ["quizId"],
  });
  return attempts.map((a) => a.quizId);
}

export interface ArenaStats {
  elo: number;
  peakElo: number;
  rankKey: string;
  peakRankKey: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentWinStreak: number;
  bestWinStreak: number;
  averageAccuracy: number;
  averageResponseMs: number;
  regionCode: string | null;
}

/** Derived figures for the profile and rank pages. Never stored. */
export function deriveStats(profile: {
  elo: number;
  peakElo: number;
  rankKey: string;
  peakRankKey: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  currentWinStreak: number;
  bestWinStreak: number;
  totalAnswered: number;
  totalCorrect: number;
  totalResponseMs: number;
  regionCode: string | null;
}): ArenaStats {
  return {
    elo: profile.elo,
    peakElo: profile.peakElo,
    rankKey: profile.rankKey,
    peakRankKey: profile.peakRankKey,
    matchesPlayed: profile.matchesPlayed,
    wins: profile.wins,
    losses: profile.losses,
    draws: profile.draws,
    /* Draws count as played but not as won. A 0-match player is 0%, not NaN. */
    winRate: profile.matchesPlayed === 0 ? 0 : profile.wins / profile.matchesPlayed,
    currentWinStreak: profile.currentWinStreak,
    bestWinStreak: profile.bestWinStreak,
    averageAccuracy: profile.totalAnswered === 0 ? 0 : profile.totalCorrect / profile.totalAnswered,
    averageResponseMs:
      profile.totalAnswered === 0 ? 0 : Math.round(profile.totalResponseMs / profile.totalAnswered),
    regionCode: profile.regionCode,
  };
}

/** Everything the rank page needs, in one read. */
export async function rankPageData(userId: string, timezone: string) {
  const profile = await ensureArenaProfile(userId, timezone);
  const stats = deriveStats(profile);
  const progress = rankProgress(profile.elo);

  const [recentEvents, rankedWins] = await Promise.all([
    db.eloEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, delta: true, eloAfter: true, rankAfter: true, createdAt: true, matchId: true },
    }),
    Promise.resolve(profile.wins),
  ]);

  return {
    stats,
    progress,
    peakRank: rankByKey(profile.peakRankKey) ?? progress.rank,
    recentEvents,
    rankedWins,
  };
}

/**
 * The subjects a player has played most in the Arena.
 *
 * Read from match history rather than from what they own, because "favourite
 * subject" should mean what they actually choose to compete in.
 */
export async function favouriteSubjects(userId: string, take = 3) {
  const rows = await db.matchPlayer.findMany({
    where: { userId, match: { subject: { not: null } } },
    select: { match: { select: { subject: true } } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const subject = row.match.subject;
    if (!subject) continue;
    counts.set(subject, (counts.get(subject) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([subject, matches]) => ({ subject, matches }));
}

/**
 * Subjects, compared the way a person would.
 *
 * Free text the student typed, so "Maths", " maths " and "MATHS" are the same
 * subject and must not be three. This used to live in `lib/arena/matchmaking`,
 * which no longer knows about subjects at all — matchmaking compares what
 * players TICKED, not what they happen to have studied.
 */
export function normaliseSubjects(subjects: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const raw of subjects) {
    if (!raw) continue;
    const norm = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (norm) seen.add(norm);
  }
  return [...seen].sort();
}
