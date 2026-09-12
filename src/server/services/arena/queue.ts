import "server-only";

import { db } from "@/lib/db";
import { pickOpponent, rankWindowFor, waitMessage, type Candidate } from "@/lib/arena/matchmaking";
import {
  intersectPreferences,
  normalisePreference,
  type QueuePreference,
} from "@/lib/bank/select";
import { countForPreferences } from "@/server/services/bank/query";
import { KNOWN_QUEUE_VALUES } from "@/lib/bank/queue-vocabulary";
import { ensureArenaProfile, subjectsForUser, studiedQuizIdsForUser } from "./profile";
import { createBankMatch, MIN_BANK_MATCH_QUESTIONS } from "./match";

/**
 * The matchmaking queue.
 *
 * There is no matchmaking daemon. Every searching client polls, and each poll
 * both refreshes that player's own row and attempts to pair them — so the
 * queue is driven by the people waiting in it. That suits a serverless host,
 * where a long-lived background worker has nowhere to live, and it means a
 * queue with one person in it costs nothing.
 *
 * The hazard that design creates is the double match: two players polling at
 * the same instant, each seeing the other free, each creating a match. The fix
 * is a single transaction that re-reads both queue rows FOR UPDATE and only
 * proceeds if both are still SEARCHING. The loser of that race finds its rows
 * already MATCHED and simply returns the match the winner made — which is the
 * right answer anyway, because both players wanted the same pairing.
 */

/**
 * Stop searching after this long and tell the player honestly.
 *
 * Generous, because the queue now runs in the background while the player uses
 * the rest of the app — it is not a spinner they are staring at. When it does
 * expire the corner indicator says so and offers to search again.
 */
export const SEARCH_TIMEOUT_SECONDS = 600;

/**
 * A searcher who has not polled within this many seconds is treated as gone —
 * a closed tab, a dead connection — and skipped when choosing an opponent, so a
 * live player is never paired with somebody who will never turn up. The
 * client polls once a second while any page is open, so a real searcher stays
 * comfortably inside this even with a slow connection.
 */
export const STALE_AFTER_SECONDS = 12;



export interface QueueState {
  status: "searching" | "matched" | "cancelled" | "expired";
  matchId?: string;
  secondsWaiting: number;
  message: string;
  /** Rank tiers either side currently being considered. */
  rankWindow: number;
}

/** Join the queue, replacing any stale row this user left behind. */
export async function enqueue(
  userId: string,
  timezone: string,
  queue: { streams?: string[]; topics?: string[] } = {},
): Promise<QueueState> {
  const profile = await ensureArenaProfile(userId, timezone);
  const [subjects, studiedQuizIds] = await Promise.all([
    subjectsForUser(userId),
    studiedQuizIdsForUser(userId),
  ]);

  /* Whatever the client sent, reduced to keys that exist. An unknown topic
     would silently narrow the search to nothing. */
  const preference = normalisePreference(queue.streams, queue.topics, KNOWN_QUEUE_VALUES);
  const queueStreams = [...preference.streams];
  const queueTopics = [...preference.topics];

  await db.matchQueueEntry.upsert({
    where: { userId },
    create: {
      userId,
      status: "SEARCHING",
      elo: profile.elo,
      rankKey: profile.rankKey,
      subjects,
      studiedQuizIds,
      queueStreams,
      queueTopics,
    },
    update: {
      status: "SEARCHING",
      elo: profile.elo,
      rankKey: profile.rankKey,
      subjects,
      studiedQuizIds,
      queueStreams,
      queueTopics,
      enqueuedAt: new Date(),
      lastPolledAt: new Date(),
      matchedAt: null,
      matchId: null,
    },
  });

  return { status: "searching", secondsWaiting: 0, message: waitMessage(0), rankWindow: 0 };
}

export async function cancelSearch(userId: string): Promise<void> {
  await db.matchQueueEntry.updateMany({
    where: { userId, status: "SEARCHING" },
    data: { status: "CANCELLED" },
  });
}

/**
 * Is this player already searching?
 *
 * Read once when the signed-in shell mounts, so a reload — or opening a second
 * tab — picks the search back up rather than dropping it. Only an active
 * SEARCHING row counts; a MATCHED row is either the battle they are already on
 * or a finished match they have moved on from, and neither should reopen here.
 */
export async function currentSearch(
  userId: string,
): Promise<{ secondsWaiting: number; streams: string[] } | null> {
  const entry = await db.matchQueueEntry.findUnique({ where: { userId } });
  if (!entry || entry.status !== "SEARCHING") return null;
  if (elapsedSeconds(entry.enqueuedAt) > SEARCH_TIMEOUT_SECONDS) return null;
  return { secondsWaiting: elapsedSeconds(entry.enqueuedAt), streams: entry.queueStreams };
}

/**
 * One tick of the search.
 *
 * Called by the polling client. Returns immediately if this player has already
 * been paired by somebody else's tick.
 */
export async function pollQueue(userId: string): Promise<QueueState> {
  const entry = await db.matchQueueEntry.findUnique({ where: { userId } });

  if (!entry || entry.status === "CANCELLED") {
    return { status: "cancelled", secondsWaiting: 0, message: "Search cancelled", rankWindow: 0 };
  }

  if (entry.status === "MATCHED" && entry.matchId) {
    return {
      status: "matched",
      matchId: entry.matchId,
      secondsWaiting: elapsedSeconds(entry.enqueuedAt),
      message: "Opponent found",
      rankWindow: 0,
    };
  }

  const secondsWaiting = elapsedSeconds(entry.enqueuedAt);

  if (secondsWaiting > SEARCH_TIMEOUT_SECONDS) {
    await db.matchQueueEntry.update({ where: { userId }, data: { status: "EXPIRED" } });
    return {
      status: "expired",
      secondsWaiting,
      message: "Nobody available right now",
      rankWindow: rankWindowFor(secondsWaiting),
    };
  }

  /* Mark this searcher as still here. Skipped for the very first poll of a row
     that `enqueue` just created — that already stamped it. */
  await db.matchQueueEntry.update({
    where: { userId },
    data: { lastPolledAt: new Date() },
  });

  const paired = await attemptPair(userId, secondsWaiting);

  if (paired && "matchId" in paired) {
    return {
      status: "matched",
      matchId: paired.matchId,
      secondsWaiting,
      message: "Opponent found",
      rankWindow: rankWindowFor(secondsWaiting),
    };
  }

  return {
    status: "searching",
    secondsWaiting,
    message: waitMessage(secondsWaiting),
    rankWindow: rankWindowFor(secondsWaiting),
  };
}

/**
 * Try to pair this searcher with somebody.
 *
 * Candidate selection is deliberately generous — every other searching row —
 * and the filtering is done by the pure predicates in lib/arena/matchmaking.
 * Pushing the rank window into SQL would scatter the rules across two places
 * and make them untestable; the queue is small enough that reading it whole is
 * cheaper than the complexity, and the index on (status, enqueuedAt) keeps it
 * bounded.
 *
 * Anyone this player could not actually be given questions with is removed
 * BEFORE an opponent is chosen. That ordering is the whole design: the previous
 * version picked first and discovered the problem afterwards, which is why the
 * player used to be told "found an opponent, but no questions" and left
 * watching a spinner. A pairing that cannot produce a hand is simply not a
 * pairing, and the search carries on as though it had not been considered.
 */
type PairAttempt = { matchId: string } | null;

async function attemptPair(userId: string, secondsWaiting: number): Promise<PairAttempt> {
  const freshSince = new Date(Date.now() - STALE_AFTER_SECONDS * 1000);
  const [me, others] = await Promise.all([
    db.matchQueueEntry.findUnique({ where: { userId } }),
    db.matchQueueEntry.findMany({
      /* Only searchers who are still actively polling — a stale row is a player
         who left, and pairing with them strands whoever the winner's tick
         chose. */
      where: { status: "SEARCHING", userId: { not: userId }, lastPolledAt: { gte: freshSince } },
      orderBy: { enqueuedAt: "asc" },
      take: 200,
    }),
  ]);

  if (!me || me.status !== "SEARCHING") return null;
  if (others.length === 0) return null;

  const mine: QueuePreference = { streams: me.queueStreams, topics: me.queueTopics };

  /*
   * Overlap, not equality.
   *
   * Two players who each ticked three subjects and share one can play those
   * shared questions. Requiring identical selections would mean almost nobody
   * ever matched — on a small player base that is indistinguishable from the
   * feature being broken.
   */
  const overlapping = others
    .map((other) => ({
      entry: other,
      shared: intersectPreferences(mine, {
        streams: other.queueStreams,
        topics: other.queueTopics,
      }),
    }))
    .filter((row): row is { entry: (typeof others)[number]; shared: QueuePreference } =>
      row.shared !== null,
    );

  if (overlapping.length === 0) return null;

  /* How many questions each pairing would actually have. Served from the
     in-memory bank index, so this costs no database work. */
  const counts = await countForPreferences(overlapping.map((row) => row.shared));
  const playable = overlapping.filter((_, i) => counts[i] >= MIN_BANK_MATCH_QUESTIONS);

  if (playable.length === 0) return null;

  const candidates: Candidate[] = playable.map(({ entry }) => ({
    userId: entry.userId,
    elo: entry.elo,
    rankKey: entry.rankKey,
    enqueuedAt: entry.enqueuedAt.getTime(),
  }));

  /* Rank and Elo only. Whether the two CAN play each other was settled above;
     this decides whether they SHOULD. */
  const pairing = pickOpponent(
    { userId: me.userId, elo: me.elo, rankKey: me.rankKey, secondsWaiting },
    candidates,
  );

  if (!pairing) return null;

  const chosen = playable.find(({ entry }) => entry.userId === pairing.candidate.userId);
  if (!chosen) return null;

  return claimPair(me.userId, pairing.candidate.userId, chosen.shared);
}

/** Thrown to roll the claim transaction back when somebody else got there first. */
class ClaimLost extends Error {}

/**
 * Turn a chosen pairing into a match, or lose the race gracefully.
 *
 * The claim is an atomic UPDATE, not a read followed by a check.
 *
 * It used to be the latter — `findUnique` both rows, confirm both said
 * SEARCHING, then create the match. Under READ COMMITTED that is not a lock.
 * Both players poll at the same instant, both transactions read both rows as
 * SEARCHING because neither has committed yet, and both go on to create a
 * match. The result is TWO matches: A is in one with B, B is in another with A,
 * and each client polls only its own. Each sees an opponent who never answers
 * anything, and each wins. That is exactly the symptom this fixes, and it is
 * the same mistake `finaliseMatch` made — a read is not a lock, however
 * carefully it is checked afterwards.
 *
 * `updateMany` with the status in its WHERE is atomic: of two racing
 * transactions, exactly one changes the row and the other gets `count: 0`. The
 * two rows are claimed in sorted order so a pair racing in both directions can
 * never each hold one and wait for the other.
 */
async function claimPair(
  aUserId: string,
  bUserId: string,
  shared: QueuePreference,
): Promise<PairAttempt> {
  try {
    return await db.$transaction(async (tx) => {
      /* Deterministic lock order, so two simultaneous ticks on the same pair
         cannot deadlock against each other. */
      const [firstId, secondId] = [aUserId, bUserId].sort();

      for (const userId of [firstId, secondId]) {
        const claimed = await tx.matchQueueEntry.updateMany({
          where: { userId, status: "SEARCHING" },
          data: { status: "MATCHED", matchedAt: new Date() },
        });
        /* Somebody else already paired this player. Abandon the whole claim —
           throwing rolls back the row we may already have taken, so a lost race
           never leaves a player marked MATCHED with no match to go to. */
        if (claimed.count === 0) throw new ClaimLost();
      }

      const created = await createBankMatch({ aUserId, bUserId, shared }, tx);

      if (!created.ok) {
        /* The pairing was filtered as playable a moment ago, so this is a race
           rather than a dead end. Roll back to SEARCHING and try again next
           tick; the player is told nothing, because there is nothing for them
           to act on. */
        throw new ClaimLost();
      }

      await tx.matchQueueEntry.updateMany({
        where: { userId: { in: [aUserId, bUserId] } },
        data: { matchId: created.match.id },
      });

      return { matchId: created.match.id };
    });
  } catch (error) {
    if (error instanceof ClaimLost) {
      /* If we lost because our own row was already MATCHED, the winner made a
         match we belong to — go to it rather than carrying on searching. */
      const mine = await db.matchQueueEntry.findUnique({ where: { userId: aUserId } });
      return mine?.status === "MATCHED" && mine.matchId ? { matchId: mine.matchId } : null;
    }
    throw error;
  }
}

function elapsedSeconds(from: Date): number {
  return Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
}
