import "server-only";

import { Prisma, type CoinSource } from "@prisma/client";

import { db } from "@/lib/db";
import { getRankMultiplier } from "@/lib/coins/rank";
import { dayKey } from "@/lib/time/day";

/**
 * THE COIN ENGINE.
 *
 * The only place in the codebase that moves Study Coins. There is no
 * `update({ coinBalance: { increment: n } })` anywhere else — if you find one,
 * it is a bug.
 *
 * Two properties make this safe:
 *
 *  1. Every award writes an append-only ledger row carrying a unique
 *     idempotency key, and every award looks that key up before inserting, so a
 *     replayed request awards nothing. That is what stops a user
 *     double-submitting a quiz for double coins. The unique index still backs
 *     it, but it is the last line rather than the first: a constraint error
 *     aborts the whole enclosing transaction in Postgres, and these functions
 *     are routinely handed a transaction that belongs to somebody else.
 *  2. The ledger row, the cached balance and the daily counter are written in
 *     ONE transaction. Two concurrent requests cannot both pass a limit check,
 *     because the counter row is locked by the first one to reach it.
 */

export type Tx = Prisma.TransactionClient;

export interface AwardInput {
  userId: string;
  source: CoinSource;
  /** Coins before the rank multiplier. */
  baseCoins: number;
  /** Streak or event multiplier. The rank multiplier is applied on top. */
  multiplier?: number;
  /** Must be unique per real-world award. */
  idempotencyKey: string;
  refType?: string;
  refId?: string;
  metadata?: Prisma.InputJsonValue;
  /** Day key in the user's timezone — required when counting toward a limit. */
  day?: string;
  /** Bump the per-day counter for this source (used by the 10/30 limits). */
  countsTowardDailyLimit?: boolean;
}

export interface AwardResult {
  awarded: boolean;
  /** Coins actually added. 0 on a duplicate or a zero-value award. */
  coins: number;
  /** True when this exact award had already been recorded. */
  duplicate: boolean;
  balance: number;
}

/**
 * Award coins. Safe to call twice with the same idempotency key.
 *
 * Pass `tx` to join a surrounding transaction — quiz submission, for instance,
 * marks the attempt and awards the coins atomically, so a crash can never leave
 * a marked attempt with no coins or coins with no attempt.
 */
export async function awardCoins(input: AwardInput, tx?: Tx): Promise<AwardResult> {
  const run = async (client: Tx): Promise<AwardResult> => {
    const user = await client.user.findUnique({
      where: { id: input.userId },
      select: { id: true, xp: true, rankTier: true, coinBalance: true },
    });
    if (!user) throw new Error(`Cannot award coins: unknown user ${input.userId}`);

    const rankMultiplier = getRankMultiplier({ xp: user.xp, rankTier: user.rankTier });
    const eventMultiplier = input.multiplier ?? 1;
    const coins = Math.round(input.baseCoins * eventMultiplier * rankMultiplier);

    if (coins <= 0) {
      return { awarded: false, coins: 0, duplicate: false, balance: user.coinBalance };
    }

    /* Detected with a read, NOT by catching the unique violation.
       In Postgres any failed statement poisons the whole transaction (25P02):
       every subsequent statement returns "current transaction is aborted" and
       no JavaScript catch can revive it. Catching P2002 therefore works only
       when this function owns the transaction — and this function is designed
       to be handed somebody else's. So the duplicate is found while the
       transaction is still healthy. The insert below can still lose a race
       between this read and itself; that case is caught by the wrapper at the
       bottom of this function, which owns the transaction it discards. */
    const already = await client.coinLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (already) {
      // Already awarded — the honest answer, not an error.
      return { awarded: false, coins: 0, duplicate: true, balance: user.coinBalance };
    }

    await client.coinLedgerEntry.create({
      data: {
        userId: input.userId,
        amount: coins,
        baseAmount: input.baseCoins,
        multiplier: new Prisma.Decimal(eventMultiplier * rankMultiplier),
        source: input.source,
        idempotencyKey: input.idempotencyKey,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });

    const updated = await client.user.update({
      where: { id: input.userId },
      data: { coinBalance: { increment: coins } },
      select: { coinBalance: true },
    });

    if (input.countsTowardDailyLimit) {
      const day = input.day ?? dayKey(new Date(), "UTC");
      await client.coinDailyCounter.upsert({
        where: { userId_day_source: { userId: input.userId, day, source: input.source } },
        create: { userId: input.userId, day, source: input.source, count: 1 },
        update: { count: { increment: 1 } },
      });
    }

    return { awarded: true, coins, duplicate: false, balance: updated.coinBalance };
  };

  /* Inside a caller's transaction the read above is the whole defence, and the
     caller is responsible for not calling twice concurrently for the same
     award — which is why `finaliseMatch` claims the match with an atomic
     `updateMany` before it pays anybody. */
  if (tx) return run(tx);

  try {
    return await db.$transaction((client) => run(client));
  } catch (error) {
    if (isUniqueViolation(error)) {
      /* Two identical awards raced past the read. This transaction rolled back
         whole, so nothing here was applied and the winner's award stands. */
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: { coinBalance: true },
      });
      return { awarded: false, coins: 0, duplicate: true, balance: user?.coinBalance ?? 0 };
    }
    throw error;
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** How many rewards of this source the user has already taken today. */
export async function dailyCount(
  userId: string,
  day: string,
  source: CoinSource,
  tx?: Tx,
): Promise<number> {
  const client = tx ?? db;
  const row = await client.coinDailyCounter.findUnique({
    where: { userId_day_source: { userId, day, source } },
    select: { count: true },
  });
  return row?.count ?? 0;
}

/** Ledger-derived balance. Used by the reconciliation script and the tests. */
export async function ledgerBalance(userId: string): Promise<number> {
  const result = await db.coinLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export interface EarningSummary {
  balance: number;
  earnedToday: number;
  entries: Array<{
    id: string;
    amount: number;
    source: CoinSource;
    createdAt: Date;
    metadata: Prisma.JsonValue;
  }>;
}

/** Recent activity for the coin panel on the dashboard. */
export async function earningSummary(
  userId: string,
  timezone: string,
  take = 8,
): Promise<EarningSummary> {
  const today = dayKey(new Date(), timezone);
  const startOfToday = startOfDayUtc(today, timezone);

  const [user, entries, todayTotal] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { coinBalance: true } }),
    db.coinLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, amount: true, source: true, createdAt: true, metadata: true },
    }),
    db.coinLedgerEntry.aggregate({
      where: { userId, createdAt: { gte: startOfToday } },
      _sum: { amount: true },
    }),
  ]);

  return {
    balance: user?.coinBalance ?? 0,
    earnedToday: todayTotal._sum.amount ?? 0,
    entries,
  };
}

/**
 * The UTC instant at which a given local day started.
 * Derived by probing the offset rather than pulling in a timezone library.
 */
export function startOfDayUtc(day: string, timezone: string): Date {
  const naiveUtc = new Date(`${day}T00:00:00Z`);
  const asLocal = new Date(
    naiveUtc.toLocaleString("en-US", { timeZone: timezone }),
  );
  const offsetMs = naiveUtc.getTime() - asLocal.getTime();
  return new Date(naiveUtc.getTime() + offsetMs);
}

export const COIN_SOURCE_LABEL: Record<CoinSource, string> = {
  APP_TIME: "Coin timer",
  STUDY_BONUS: "Study bonus",
  DAILY_QUIZ: "Daily quiz",
  DAILY_QUIZ_BONUS: "Perfect daily quiz",
  FLASHCARD_SET: "Flashcard set mastered",
  QUIZ_ATTEMPT: "Quiz score",
  ADJUSTMENT: "Adjustment",
  SPEND: "Spent",
};

/* ==========================================================================
   Spending
   ========================================================================== */

export interface SpendInput {
  userId: string;
  /** Coins to remove. Positive; the ledger row is written negative. */
  cost: number;
  /** Must be unique per real-world purchase. */
  idempotencyKey: string;
  refType?: string;
  refId?: string;
  metadata?: Prisma.InputJsonValue;
}

export type SpendResult =
  | { ok: true; spent: number; balance: number; duplicate: boolean }
  | { ok: false; reason: "insufficient" | "invalid"; balance: number };

/**
 * Spend coins.
 *
 * The mirror of `awardCoins`, and it exists for the same reason: so that
 * nothing else in the codebase ever writes a balance. `awardCoins` cannot be
 * reused for this — it returns early on a non-positive amount, by design, so
 * that a mis-computed award can never silently become a debit.
 *
 * The balance is re-read INSIDE the transaction and checked there. Reading it
 * in the caller and passing it in would be a time-of-check-to-time-of-use bug:
 * two purchases fired together would both see the old balance and both pass.
 * Here the second one sees the first one's write.
 *
 * The client never sends a price. The caller looks the price up server-side
 * and passes it; the same rule the coin engine has always followed.
 */
export async function spendCoins(input: SpendInput, tx?: Tx): Promise<SpendResult> {
  const run = async (client: Tx): Promise<SpendResult> => {
    if (!Number.isFinite(input.cost) || input.cost <= 0 || !Number.isInteger(input.cost)) {
      const user = await client.user.findUnique({
        where: { id: input.userId },
        select: { coinBalance: true },
      });
      return { ok: false, reason: "invalid", balance: user?.coinBalance ?? 0 };
    }

    const user = await client.user.findUnique({
      where: { id: input.userId },
      select: { coinBalance: true },
    });
    if (!user) throw new Error(`Cannot spend coins: unknown user ${input.userId}`);

    if (user.coinBalance < input.cost) {
      return { ok: false, reason: "insufficient", balance: user.coinBalance };
    }

    /* Read, don't catch — see the note in `awardCoins`. A double-click on Buy
       must not be able to abort the enclosing transaction that also equips the
       item. */
    const already = await client.coinLedgerEntry.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (already) {
      // Already charged for this exact purchase. Not an error.
      return { ok: true, spent: 0, balance: user.coinBalance, duplicate: true };
    }

    await client.coinLedgerEntry.create({
      data: {
        userId: input.userId,
        amount: -input.cost,
        baseAmount: -input.cost,
        multiplier: new Prisma.Decimal(1),
        source: "SPEND",
        idempotencyKey: input.idempotencyKey,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });

    const updated = await client.user.update({
      where: { id: input.userId },
      data: { coinBalance: { decrement: input.cost } },
      select: { coinBalance: true },
    });

    return { ok: true, spent: input.cost, balance: updated.coinBalance, duplicate: false };
  };

  if (tx) return run(tx);

  try {
    return await db.$transaction((client) => run(client));
  } catch (error) {
    if (isUniqueViolation(error)) {
      /* Two clicks landed together and both got past the read. This one rolled
         back entirely — the user was charged exactly once, by the other. */
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: { coinBalance: true },
      });
      return { ok: true, spent: 0, balance: user?.coinBalance ?? 0, duplicate: true };
    }
    throw error;
  }
}
