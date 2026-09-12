import "server-only";

import { Prisma, type StudyMode } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import { decideFlashcardReward, SKIP_REASON_TEXT } from "@/lib/coins/decisions";
import { FLASHCARDS } from "@/lib/coins/rules";
import { dayKey } from "@/lib/time/day";
import { awardCoins, dailyCount } from "./coins";
import { sharedWithViewer } from "./communities";

/**
 * Flashcard sets, cards, the public library, and the coins a completed set is
 * worth.
 *
 * Every read is scoped by ownership or by `isPublic` — there is no code path
 * that returns another user's private set.
 */

export interface CardInput {
  id?: string;
  front: string;
  back: string;
  hint?: string | null;
  frontImageKey?: string | null;
  backImageKey?: string | null;
}

export interface SetInput {
  title: string;
  description?: string | null;
  subject?: string | null;
  isPublic?: boolean;
  cards: CardInput[];
}

const MAX_CARDS_PER_SET = 500;

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listMySets(userId: string, opts: { query?: string; subject?: string } = {}) {
  const where: Prisma.FlashcardSetWhereInput = { ownerId: userId };

  if (opts.query) {
    where.OR = [
      { title: { contains: opts.query, mode: "insensitive" } },
      { description: { contains: opts.query, mode: "insensitive" } },
    ];
  }
  if (opts.subject) where.subject = opts.subject;

  const sets = await db.flashcardSet.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      cardCount: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      sourceSetId: true,
    },
  });

  // Cards waiting for review, per set — the number that actually gets people
  // to open a set.
  const due = await db.cardReviewState.groupBy({
    by: ["setId"],
    where: { userId, dueAt: { lte: new Date() } },
    _count: { _all: true },
  });
  const dueBySet = new Map(due.map((d) => [d.setId, d._count._all]));

  return sets.map((set) => ({ ...set, dueCount: dueBySet.get(set.id) ?? 0 }));
}

export async function listPublicSets(
  viewerId: string,
  opts: { query?: string; subject?: string; take?: number } = {},
) {
  const where: Prisma.FlashcardSetWhereInput = {
    isPublic: true,
    // Your own published sets don't need to appear in Discover.
    ownerId: { not: viewerId },
  };

  if (opts.query) {
    where.OR = [
      { title: { contains: opts.query, mode: "insensitive" } },
      { description: { contains: opts.query, mode: "insensitive" } },
      { subject: { contains: opts.query, mode: "insensitive" } },
    ];
  }
  if (opts.subject) where.subject = opts.subject;

  const sets = await db.flashcardSet.findMany({
    where,
    orderBy: [{ downloads: "desc" }, { publishedAt: "desc" }],
    take: opts.take ?? 40,
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      cardCount: true,
      downloads: true,
      publishedAt: true,
      owner: { select: { name: true, username: true, image: true } },
    },
  });

  const saved = await db.libraryItem.findMany({
    where: { userId: viewerId, flashcardSetId: { in: sets.map((s) => s.id) } },
    select: { flashcardSetId: true },
  });
  const savedIds = new Set(saved.map((s) => s.flashcardSetId));

  // Copies the viewer already made, so Discover doesn't offer the same set twice.
  const copies = await db.flashcardSet.findMany({
    where: { ownerId: viewerId, sourceSetId: { in: sets.map((s) => s.id) } },
    select: { sourceSetId: true },
  });
  const copiedIds = new Set(copies.map((c) => c.sourceSetId));

  return sets.map((set) => ({
    ...set,
    alreadySaved: savedIds.has(set.id) || copiedIds.has(set.id),
  }));
}

/** A set the user owns. Throws rather than returning null. */
export async function getOwnedSet(userId: string, setId: string) {
  const set = await db.flashcardSet.findUnique({
    where: { id: setId },
    include: { cards: { orderBy: { position: "asc" } } },
  });
  if (!set) throw new NotFoundError("That flashcard set doesn't exist.");
  if (set.ownerId !== userId) throw new ForbiddenError("That set isn't yours.");
  return set;
}

/**
 * A set the user owns, a public set, or one shared into a community they're in.
 *
 * That third case is what lets someone share a private set with their class
 * without publishing it to everyone.
 */
export async function getViewableSet(userId: string, setId: string) {
  const set = await db.flashcardSet.findUnique({
    where: { id: setId },
    include: {
      cards: { orderBy: { position: "asc" } },
      owner: { select: { id: true, name: true, username: true, image: true } },
    },
  });
  if (!set) throw new NotFoundError("That flashcard set doesn't exist.");

  if (set.ownerId !== userId && !set.isPublic) {
    const shared = await sharedWithViewer(userId, { flashcardSetId: setId });
    if (!shared) throw new ForbiddenError("That set is private.");
  }

  return set;
}

export async function subjectsForUser(userId: string): Promise<string[]> {
  const rows = await db.flashcardSet.findMany({
    where: { ownerId: userId, subject: { not: null } },
    distinct: ["subject"],
    select: { subject: true },
    orderBy: { subject: "asc" },
  });
  return rows.map((r) => r.subject!).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function validateCards(cards: CardInput[]): CardInput[] {
  const cleaned = cards
    .map((c) => ({
      id: c.id,
      front: c.front.trim(),
      back: c.back.trim(),
      hint: c.hint?.trim() || null,
      frontImageKey: c.frontImageKey || null,
      backImageKey: c.backImageKey || null,
    }))
    // A side counts as filled in if it has text OR an image — a diagram on the
    // front with a written answer on the back is a perfectly good card.
    .filter(
      (c) =>
        (c.front.length > 0 || c.frontImageKey) && (c.back.length > 0 || c.backImageKey),
    );

  if (cleaned.length === 0) {
    throw new ValidationError(
      "A set needs at least one card with something on both the front and the back.",
    );
  }
  if (cleaned.length > MAX_CARDS_PER_SET) {
    throw new ValidationError(`Sets are capped at ${MAX_CARDS_PER_SET} cards.`);
  }
  return cleaned;
}

export async function createSet(userId: string, input: SetInput) {
  const cards = validateCards(input.cards);
  const title = input.title.trim();
  if (!title) throw new ValidationError("Give the set a title.");

  return db.flashcardSet.create({
    data: {
      ownerId: userId,
      title,
      description: input.description?.trim() || null,
      subject: input.subject?.trim() || null,
      isPublic: Boolean(input.isPublic),
      publishedAt: input.isPublic ? new Date() : null,
      cardCount: cards.length,
      cards: {
        create: cards.map((card, index) => ({
          front: card.front,
          back: card.back,
          hint: card.hint,
          frontImageKey: card.frontImageKey ?? null,
          backImageKey: card.backImageKey ?? null,
          position: index,
        })),
      },
    },
    select: { id: true },
  });
}

/**
 * Replace a set's cards wholesale.
 *
 * Cards that survive keep their id, so the user's review history and schedule
 * for them survives too — re-saving a set does not reset anyone's progress.
 */
export async function updateSet(userId: string, setId: string, input: SetInput) {
  await getOwnedSet(userId, setId);
  const cards = validateCards(input.cards);
  const title = input.title.trim();
  if (!title) throw new ValidationError("Give the set a title.");

  const keptIds = cards.map((c) => c.id).filter((id): id is string => Boolean(id));

  return db.$transaction(async (tx) => {
    await tx.flashcard.deleteMany({
      where: { setId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
    });

    for (const [index, card] of cards.entries()) {
      if (card.id) {
        await tx.flashcard.update({
          where: { id: card.id },
          data: {
            front: card.front,
            back: card.back,
            hint: card.hint,
            frontImageKey: card.frontImageKey ?? null,
            backImageKey: card.backImageKey ?? null,
            position: index,
          },
        });
      } else {
        await tx.flashcard.create({
          data: {
            setId,
            front: card.front,
            back: card.back,
            hint: card.hint,
            frontImageKey: card.frontImageKey ?? null,
            backImageKey: card.backImageKey ?? null,
            position: index,
          },
        });
      }
    }

    return tx.flashcardSet.update({
      where: { id: setId },
      data: {
        title,
        description: input.description?.trim() || null,
        subject: input.subject?.trim() || null,
        cardCount: cards.length,
      },
      select: { id: true },
    });
  });
}

export async function deleteSet(userId: string, setId: string) {
  await getOwnedSet(userId, setId);
  await db.flashcardSet.delete({ where: { id: setId } });
}

export async function setVisibility(userId: string, setId: string, isPublic: boolean) {
  const set = await getOwnedSet(userId, setId);

  if (isPublic && set.cardCount < 4) {
    throw new ValidationError("Sets need at least 4 cards before you can publish them.");
  }

  return db.flashcardSet.update({
    where: { id: setId },
    data: { isPublic, publishedAt: isPublic ? (set.publishedAt ?? new Date()) : null },
    select: { id: true, isPublic: true },
  });
}

/**
 * Copy a public set into the user's own library.
 *
 * A copy, not a reference: the user can edit it, and their scheduling is
 * theirs. `sourceSetId` keeps the lineage, and the copy is a brand new set, so
 * the 24-hour coin gate applies to it exactly like anything else they made —
 * downloading a 500-card set is not an instant payout.
 */
export async function copyPublicSet(userId: string, setId: string) {
  const source = await db.flashcardSet.findUnique({
    where: { id: setId },
    include: { cards: { orderBy: { position: "asc" } } },
  });

  if (!source) throw new NotFoundError("That set doesn't exist.");
  if (source.ownerId === userId) throw new ValidationError("That set is already yours.");

  if (!source.isPublic) {
    // Not public, but a community they belong to may have it shared.
    const shared = await sharedWithViewer(userId, { flashcardSetId: setId });
    if (!shared) throw new ForbiddenError("That set isn't shared with you.");
  }

  const existing = await db.flashcardSet.findFirst({
    where: { ownerId: userId, sourceSetId: setId },
    select: { id: true },
  });
  if (existing) return existing;

  return db.$transaction(async (tx) => {
    const copy = await tx.flashcardSet.create({
      data: {
        ownerId: userId,
        title: source.title,
        description: source.description,
        subject: source.subject,
        sourceSetId: source.id,
        isPublic: false,
        cardCount: source.cards.length,
        cards: {
          create: source.cards.map((card, index) => ({
            front: card.front,
            back: card.back,
            hint: card.hint,
            frontImageKey: card.frontImageKey,
            backImageKey: card.backImageKey,
            position: index,
          })),
        },
      },
      select: { id: true },
    });

    await tx.flashcardSet.update({
      where: { id: source.id },
      data: { downloads: { increment: 1 } },
    });

    await tx.libraryItem.upsert({
      where: { userId_flashcardSetId: { userId, flashcardSetId: copy.id } },
      create: { userId, type: "FLASHCARD_SET", flashcardSetId: copy.id },
      update: {},
    });

    return copy;
  });
}

// ---------------------------------------------------------------------------
// Completion rewards
// ---------------------------------------------------------------------------

export interface CompletionResult {
  completed: boolean;
  coinsAwarded: number;
  balance: number | null;
  /** Why no coins, when none were awarded. */
  reason: string | null;
  cardCount: number;
  /** When this set can pay out again. */
  nextEligibleAt: Date | null;
}

/**
 * Record that the user got every card in a set into the Known pile, and pay
 * out if the rules allow it.
 *
 * The caller does not get to say whether the set was completed — that is
 * verified here against stored review state.
 */
export async function recordSetCompletion(
  userId: string,
  setId: string,
  mode: StudyMode,
): Promise<CompletionResult> {
  const now = new Date();

  const [set, user] = await Promise.all([
    db.flashcardSet.findUnique({
      where: { id: setId },
      select: { id: true, ownerId: true, cardCount: true, createdAt: true, isPublic: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { plan: true, timezone: true, coinBalance: true } }),
  ]);

  if (!set) throw new NotFoundError("That set doesn't exist.");
  if (!user) throw new NotFoundError("Unknown user.");

  if (set.ownerId !== userId && !set.isPublic) {
    const shared = await sharedWithViewer(userId, { flashcardSetId: setId });
    if (!shared) throw new ForbiddenError("That set is private.");
  }

  const verified = await verifyAllCardsKnown(userId, setId, mode);
  if (!verified) {
    return {
      completed: false,
      coinsAwarded: 0,
      balance: user.coinBalance,
      reason: null,
      cardCount: set.cardCount,
      nextEligibleAt: null,
    };
  }

  const today = dayKey(now, user.timezone);

  const [lastRewarded, setsToday] = await Promise.all([
    db.setCompletion.findFirst({
      where: { userId, setId, rewarded: true },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
    dailyCount(userId, today, "FLASHCARD_SET"),
  ]);

  const decision = decideFlashcardReward({
    cardCount: set.cardCount,
    setCreatedAt: set.createdAt,
    lastRewardedAt: lastRewarded?.completedAt ?? null,
    setsRewardedToday: setsToday,
    plan: user.plan,
    now,
  });

  const completion = await db.setCompletion.create({
    data: {
      userId,
      setId,
      mode,
      cardCount: set.cardCount,
      rewarded: false,
      skipReason: decision.reason ? SKIP_REASON_TEXT[decision.reason] : null,
      completedAt: now,
    },
    select: { id: true },
  });

  if (!decision.eligible) {
    return {
      completed: true,
      coinsAwarded: 0,
      balance: user.coinBalance,
      reason: decision.reason ? SKIP_REASON_TEXT[decision.reason] : null,
      cardCount: set.cardCount,
      nextEligibleAt: nextEligible(set.createdAt, lastRewarded?.completedAt ?? null),
    };
  }

  const award = await db.$transaction(async (tx) => {
    const result = await awardCoins(
      {
        userId,
        source: "FLASHCARD_SET",
        baseCoins: decision.baseCoins,
        idempotencyKey: `flashcards:${completion.id}`,
        refType: "flashcard_set",
        refId: setId,
        day: today,
        countsTowardDailyLimit: true,
        metadata: { cardCount: set.cardCount, mode },
      },
      tx,
    );

    await tx.setCompletion.update({
      where: { id: completion.id },
      data: { rewarded: result.awarded, coinsAwarded: result.coins },
    });

    return result;
  });

  return {
    completed: true,
    coinsAwarded: award.coins,
    balance: award.balance,
    reason: null,
    cardCount: set.cardCount,
    nextEligibleAt: new Date(now.getTime() + FLASHCARDS.rewardCooldownDays * 24 * 60 * 60 * 1000),
  };
}

function nextEligible(createdAt: Date, lastRewardedAt: Date | null): Date {
  const ageGate = new Date(createdAt.getTime() + FLASHCARDS.setAgeHours * 60 * 60 * 1000);
  if (!lastRewardedAt) return ageGate;
  const cooldownEnd = new Date(
    lastRewardedAt.getTime() + FLASHCARDS.rewardCooldownDays * 24 * 60 * 60 * 1000,
  );
  return cooldownEnd > ageGate ? cooldownEnd : ageGate;
}

/**
 * The server's own check that the set really is finished.
 *
 * SMART: every card's most recent rating is "Know".
 * CRAM:  the user's newest cram session for the set has an empty unknown pile.
 */
async function verifyAllCardsKnown(
  userId: string,
  setId: string,
  mode: StudyMode,
): Promise<boolean> {
  const cardIds = (
    await db.flashcard.findMany({ where: { setId }, select: { id: true } })
  ).map((c) => c.id);

  if (cardIds.length === 0) return false;

  if (mode === "CRAM") {
    const session = await db.cramSession.findFirst({
      where: { userId, setId },
      orderBy: { startedAt: "desc" },
    });
    if (!session) return false;
    if (session.unknownCardIds.length > 0) return false;
    return cardIds.every((id) => session.knownCardIds.includes(id));
  }

  const known = await db.cardReviewState.count({
    where: { userId, cardId: { in: cardIds }, lastRating: "KNOW" },
  });
  return known === cardIds.length;
}

/** Reward status for a set, shown on its page so the rules are never a mystery. */
export async function rewardStatus(userId: string, setId: string, plan: "FREE" | "PREMIUM") {
  const now = new Date();
  const [set, lastRewarded, timezone] = await Promise.all([
    db.flashcardSet.findUnique({
      where: { id: setId },
      select: { cardCount: true, createdAt: true },
    }),
    db.setCompletion.findFirst({
      where: { userId, setId, rewarded: true },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, coinsAwarded: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);

  if (!set) return null;

  const setsToday = await dailyCount(userId, dayKey(now, timezone?.timezone ?? "UTC"), "FLASHCARD_SET");

  const decision = decideFlashcardReward({
    cardCount: set.cardCount,
    setCreatedAt: set.createdAt,
    lastRewardedAt: lastRewarded?.completedAt ?? null,
    setsRewardedToday: setsToday,
    plan,
    now,
  });

  return {
    coinsIfCompleted: decision.eligible ? decision.baseCoins : 0,
    potentialCoins: Math.max(
      FLASHCARDS.minCoinsPerSet,
      Math.floor(set.cardCount / FLASHCARDS.cardsPerCoin),
    ),
    reason: decision.reason ? SKIP_REASON_TEXT[decision.reason] : null,
    nextEligibleAt: decision.eligible ? null : nextEligible(set.createdAt, lastRewarded?.completedAt ?? null),
    setsRewardedToday: setsToday,
    dailyLimit: FLASHCARDS.dailySetLimit[plan],
    lastRewardedAt: lastRewarded?.completedAt ?? null,
  };
}
