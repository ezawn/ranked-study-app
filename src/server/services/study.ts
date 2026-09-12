import "server-only";

import type { CardRating, StudyMode } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import {
  applyCramAnswer,
  describeInterval,
  initialCardState,
  isCramComplete,
  schedule,
  startCram,
  type Rating,
} from "@/lib/srs/scheduler";
import { recordSetCompletion, type CompletionResult } from "./flashcards";
import { sharedWithViewer } from "./communities";

/**
 * Studying: the Smart Mode queue and scheduler, and Cram Mode's two piles.
 *
 * Both modes verify the card belongs to a set the user may study before they
 * touch anything, and both record their reviews — but only Smart Mode moves the
 * schedule.
 */

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  frontImageKey: string | null;
  backImageKey: string | null;
  /** Null for a card this user has never seen. */
  dueAt: Date | null;
  intervalHours: number | null;
  lastRating: CardRating | null;
  isNew: boolean;
}

async function assertCanStudy(userId: string, setId: string) {
  const set = await db.flashcardSet.findUnique({
    where: { id: setId },
    select: { id: true, ownerId: true, isPublic: true, title: true, cardCount: true },
  });
  if (!set) throw new NotFoundError("That set doesn't exist.");

  if (set.ownerId !== userId && !set.isPublic) {
    // A set shared into a community they belong to is studiable without
    // its owner having to publish it publicly.
    const shared = await sharedWithViewer(userId, { flashcardSetId: setId });
    if (!shared) throw new ForbiddenError("That set is private.");
  }

  return set;
}

// ---------------------------------------------------------------------------
// Smart Mode
// ---------------------------------------------------------------------------

/**
 * What to study next.
 *
 * Cards that are due come first, oldest first, then cards never seen before.
 * `includeAll` ignores the schedule for users who want to run the whole set.
 */
export async function getSmartQueue(
  userId: string,
  setId: string,
  opts: { includeAll?: boolean; limit?: number } = {},
): Promise<{ cards: StudyCard[]; dueCount: number; newCount: number; totalCount: number }> {
  await assertCanStudy(userId, setId);

  const now = new Date();
  const cards = await db.flashcard.findMany({
    where: { setId },
    orderBy: { position: "asc" },
    include: {
      reviewStates: { where: { userId }, take: 1 },
    },
  });

  const enriched: StudyCard[] = cards.map((card) => {
    const state = card.reviewStates[0];
    return {
      id: card.id,
      front: card.front,
      back: card.back,
      hint: card.hint,
      frontImageKey: card.frontImageKey,
      backImageKey: card.backImageKey,
      dueAt: state?.dueAt ?? null,
      intervalHours: state?.intervalHours ?? null,
      lastRating: state?.lastRating ?? null,
      isNew: !state,
    };
  });

  const due = enriched
    .filter((c) => !c.isNew && c.dueAt && c.dueAt <= now)
    .sort((a, b) => (a.dueAt!.getTime() - b.dueAt!.getTime()));
  const fresh = enriched.filter((c) => c.isNew);
  const notYetDue = enriched.filter((c) => !c.isNew && c.dueAt && c.dueAt > now);

  const queue = opts.includeAll ? [...due, ...fresh, ...notYetDue] : [...due, ...fresh];

  return {
    cards: opts.limit ? queue.slice(0, opts.limit) : queue,
    dueCount: due.length,
    newCount: fresh.length,
    totalCount: enriched.length,
  };
}

export interface ReviewResult {
  intervalHours: number;
  dueAt: Date;
  nextInWords: string;
  struggling: boolean;
  /** Set when this review finished the whole set. */
  completion: CompletionResult | null;
}

/**
 * Record one Smart Mode review.
 *
 * The rating is the only thing the client supplies. The interval, the ease and
 * the due date are all computed here from stored history.
 */
export async function reviewCard(
  userId: string,
  cardId: string,
  rating: Rating,
): Promise<ReviewResult> {
  const card = await db.flashcard.findUnique({
    where: { id: cardId },
    select: { id: true, setId: true },
  });
  if (!card) throw new NotFoundError("That card doesn't exist.");
  await assertCanStudy(userId, card.setId);

  const now = new Date();

  const [existing, recent] = await Promise.all([
    db.cardReviewState.findUnique({ where: { userId_cardId: { userId, cardId } } }),
    db.cardReview.findMany({
      where: { userId, cardId, mode: "SMART" },
      orderBy: { reviewedAt: "desc" },
      take: 4,
      select: { rating: true },
    }),
  ]);

  const state = existing
    ? {
        intervalHours: existing.intervalHours,
        ease: existing.ease,
        knowStreak: existing.knowStreak,
        lapses: existing.lapses,
        reviewCount: existing.reviewCount,
      }
    : initialCardState();

  const result = schedule({
    state,
    rating,
    recentRatings: recent.map((r) => r.rating as Rating),
    now,
  });

  await db.$transaction([
    db.cardReviewState.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: {
        userId,
        cardId,
        setId: card.setId,
        intervalHours: result.state.intervalHours,
        ease: result.state.ease,
        knowStreak: result.state.knowStreak,
        lapses: result.state.lapses,
        reviewCount: result.state.reviewCount,
        lastRating: rating,
        lastReviewAt: now,
        dueAt: result.dueAt,
      },
      update: {
        intervalHours: result.state.intervalHours,
        ease: result.state.ease,
        knowStreak: result.state.knowStreak,
        lapses: result.state.lapses,
        reviewCount: result.state.reviewCount,
        lastRating: rating,
        lastReviewAt: now,
        dueAt: result.dueAt,
      },
    }),
    db.cardReview.create({
      data: {
        userId,
        cardId,
        setId: card.setId,
        rating,
        mode: "SMART",
        intervalBeforeHours: result.intervalBeforeHours,
        intervalAfterHours: result.intervalAfterHours,
        reviewedAt: now,
      },
    }),
  ]);

  // Only a "Know" can complete a set, so only then is it worth checking.
  const completion =
    rating === "KNOW" ? await recordSetCompletion(userId, card.setId, "SMART") : null;

  return {
    intervalHours: result.intervalAfterHours,
    dueAt: result.dueAt,
    nextInWords: describeInterval(result.intervalAfterHours),
    struggling: result.struggling,
    completion: completion?.completed ? completion : null,
  };
}

// ---------------------------------------------------------------------------
// Cram Mode
// ---------------------------------------------------------------------------

export interface CramState {
  sessionId: string;
  round: number;
  known: string[];
  unknown: string[];
  complete: boolean;
  cards: Array<{
    id: string;
    front: string;
    back: string;
    hint: string | null;
    frontImageKey: string | null;
    backImageKey: string | null;
  }>;
}

/** Start a fresh cram run, or pick up an unfinished one. */
export async function startOrResumeCram(
  userId: string,
  setId: string,
  restart = false,
): Promise<CramState> {
  await assertCanStudy(userId, setId);

  const cards = await db.flashcard.findMany({
    where: { setId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      front: true,
      back: true,
      hint: true,
      frontImageKey: true,
      backImageKey: true,
    },
  });
  if (cards.length === 0) throw new ValidationError("This set has no cards yet.");

  const open = restart
    ? null
    : await db.cramSession.findFirst({
        where: { userId, setId, completedAt: null },
        orderBy: { startedAt: "desc" },
      });

  if (open) {
    // A card added or removed since the session started would otherwise leave
    // the piles referencing cards that no longer exist.
    const liveIds = new Set(cards.map((c) => c.id));
    const known = open.knownCardIds.filter((id) => liveIds.has(id));
    const unknown = open.unknownCardIds.filter((id) => liveIds.has(id));
    const missing = cards.map((c) => c.id).filter((id) => !known.includes(id) && !unknown.includes(id));

    return {
      sessionId: open.id,
      round: open.round,
      known,
      unknown: [...unknown, ...missing],
      complete: unknown.length + missing.length === 0,
      cards,
    };
  }

  const piles = startCram(cards.map((c) => c.id));
  const session = await db.cramSession.create({
    data: {
      userId,
      setId,
      round: piles.round,
      roundRemaining: piles.unknown.length,
      knownCardIds: piles.known,
      unknownCardIds: piles.unknown,
    },
    select: { id: true },
  });

  return {
    sessionId: session.id,
    round: 1,
    known: piles.known,
    unknown: piles.unknown,
    complete: false,
    cards,
  };
}

export interface CramAnswerResult {
  known: string[];
  unknown: string[];
  round: number;
  complete: boolean;
  completion: CompletionResult | null;
}

/**
 * Move one card between the piles.
 *
 * The piles live on the server. A client that claims to have finished has not
 * finished — the reward check re-reads the session row.
 */
export async function answerCram(
  userId: string,
  sessionId: string,
  cardId: string,
  known: boolean,
): Promise<CramAnswerResult> {
  const session = await db.cramSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError("That cram session has expired.");
  if (session.userId !== userId) throw new ForbiddenError("That session isn't yours.");

  const before = {
    known: session.knownCardIds,
    unknown: session.unknownCardIds,
    round: session.round,
  };

  const after = applyCramAnswer(before, cardId, known);
  const complete = isCramComplete(after);

  // A round is one pass over the pile as it stood when the round began. When
  // the last card of a pass is answered and cards are still unknown, the pile
  // cycles and the round number goes up.
  let round = before.round;
  let roundRemaining = Math.max(0, session.roundRemaining - 1);
  if (roundRemaining === 0 && after.unknown.length > 0) {
    round += 1;
    roundRemaining = after.unknown.length;
  }

  const now = new Date();

  await db.$transaction([
    db.cramSession.update({
      where: { id: sessionId },
      data: {
        knownCardIds: after.known,
        unknownCardIds: after.unknown,
        round,
        roundRemaining,
        completedAt: complete ? now : null,
      },
    }),
    db.cardReview.create({
      data: {
        userId,
        cardId,
        setId: session.setId,
        rating: known ? "KNOW" : "DONT_KNOW",
        mode: "CRAM",
        reviewedAt: now,
      },
    }),
  ]);

  const completion = complete ? await recordSetCompletion(userId, session.setId, "CRAM") : null;

  return {
    known: after.known,
    unknown: after.unknown,
    round,
    complete,
    completion: completion?.completed ? completion : null,
  };
}

/** Per-set study stats for the set page. */
export async function setStudyStats(userId: string, setId: string) {
  const now = new Date();
  const [total, states, dueCount, knownCount, lastReview] = await Promise.all([
    db.flashcard.count({ where: { setId } }),
    db.cardReviewState.count({ where: { userId, setId } }),
    db.cardReviewState.count({ where: { userId, setId, dueAt: { lte: now } } }),
    db.cardReviewState.count({ where: { userId, setId, lastRating: "KNOW" } }),
    db.cardReview.findFirst({
      where: { userId, setId },
      orderBy: { reviewedAt: "desc" },
      select: { reviewedAt: true },
    }),
  ]);

  return {
    total,
    seen: states,
    unseen: total - states,
    dueCount,
    knownCount,
    masteryPercent: total === 0 ? 0 : Math.round((knownCount / total) * 100),
    lastReviewAt: lastReview?.reviewedAt ?? null,
  };
}

export type { StudyMode };
