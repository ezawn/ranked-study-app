import { describe, expect, it } from "vitest";

import { awardCoins, spendCoins, type Tx } from "@/server/services/coins";

/**
 * The coin engine, against a fake transaction that behaves like Postgres.
 *
 * These are regression tests for a bug that reached production. Both functions
 * used to detect a replayed award by CATCHING the idempotency-key unique
 * violation. That reads as reasonable and works in isolation, but Postgres
 * aborts the entire transaction on any failed statement (SQLSTATE 25P02) —
 * every later statement returns "current transaction is aborted" until
 * rollback, and no JavaScript catch can revive it. Both functions accept a
 * caller's transaction, so the damage was never local: an Arena match being
 * finalised twice paid one player, hit the constraint on the second, and took
 * the rest of the finalisation down with it.
 *
 * So the fake below poisons itself exactly as Postgres would. A duplicate that
 * is detected by reading leaves the transaction healthy; a duplicate that is
 * detected by catching does not, and these tests fail.
 */

const ABORTED = "current transaction is aborted, commands ignored until end of transaction block";

interface FakeOptions {
  balance?: number;
  /** Idempotency keys already present in the ledger. */
  existing?: string[];
}

function fakeTx({ balance = 500, existing = [] }: FakeOptions = {}) {
  const state = {
    balance,
    ledger: new Map<string, { amount: number }>(existing.map((k) => [k, { amount: 0 }])),
    statements: [] as string[],
    aborted: false,
  };

  /** Every statement goes through here, so the abort is impossible to route around. */
  const stmt = <T>(label: string, run: () => T): T => {
    state.statements.push(label);
    if (state.aborted) throw new Error(ABORTED);
    try {
      return run();
    } catch (error) {
      state.aborted = true;
      throw error;
    }
  };

  const uniqueViolation = () => {
    const error = new Error(
      "Unique constraint failed on the fields: (`idempotencyKey`)",
    ) as Error & { code: string };
    error.code = "P2002";
    /* Prisma checks `instanceof PrismaClientKnownRequestError`, which this is
       not — deliberately. If the code under test reaches the catch at all it
       will rethrow, and the test fails loudly rather than passing for the
       wrong reason. */
    return error;
  };

  const tx = {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        stmt("user.findUnique", () =>
          where.id === "u1" ? { id: "u1", xp: 0, rankTier: null, coinBalance: state.balance } : null,
        ),
      update: async ({ data }: { data: { coinBalance?: { increment?: number; decrement?: number } } }) =>
        stmt("user.update", () => {
          state.balance += data.coinBalance?.increment ?? 0;
          state.balance -= data.coinBalance?.decrement ?? 0;
          return { coinBalance: state.balance };
        }),
    },
    coinLedgerEntry: {
      findUnique: async ({ where }: { where: { idempotencyKey: string } }) =>
        stmt("ledger.findUnique", () => {
          const row = state.ledger.get(where.idempotencyKey);
          return row ? { id: `led_${where.idempotencyKey}` } : null;
        }),
      create: async ({ data }: { data: { idempotencyKey: string; amount: number } }) =>
        stmt("ledger.create", () => {
          if (state.ledger.has(data.idempotencyKey)) throw uniqueViolation();
          state.ledger.set(data.idempotencyKey, { amount: data.amount });
          return { id: `led_${data.idempotencyKey}` };
        }),
    },
    coinDailyCounter: {
      upsert: async () => stmt("counter.upsert", () => ({ count: 1 })),
      findUnique: async () => stmt("counter.findUnique", () => null),
    },
  };

  return { tx: tx as unknown as Tx, state };
}

const award = (key: string, coins = 10) => ({
  userId: "u1",
  source: "ADJUSTMENT" as const,
  baseCoins: coins,
  idempotencyKey: key,
});

describe("awarding coins inside a caller's transaction", () => {
  it("credits the balance once", async () => {
    const { tx, state } = fakeTx({ balance: 100 });

    const result = await awardCoins(award("k1"), tx);

    expect(result.awarded).toBe(true);
    expect(result.coins).toBe(10);
    expect(result.balance).toBe(110);
    expect(state.balance).toBe(110);
  });

  it("reports a replay as a duplicate and credits nothing", async () => {
    const { tx, state } = fakeTx({ balance: 100, existing: ["k1"] });

    const result = await awardCoins(award("k1"), tx);

    expect(result.awarded).toBe(false);
    expect(result.duplicate).toBe(true);
    expect(result.coins).toBe(0);
    expect(state.balance).toBe(100);
  });

  it("detects the replay by reading, never by inserting", async () => {
    const { tx, state } = fakeTx({ existing: ["k1"] });

    await awardCoins(award("k1"), tx);

    /* The insert is the whole bug. Issuing it and catching the failure is what
       poisoned the caller's transaction. */
    expect(state.statements.includes("ledger.create")).toBe(false);
    expect(state.statements).toContain("ledger.findUnique");
  });

  it("leaves the caller's transaction usable after a duplicate", async () => {
    const { tx, state } = fakeTx({ existing: ["k1"] });

    await awardCoins(award("k1"), tx);

    /* What `finaliseMatch` does next: write the player's result. Under the old
       implementation this threw 25P02 and the match never completed. */
    await tx.user.update({ where: { id: "u1" }, data: {} } as never);

    expect(state.aborted).toBe(false);
  });

  it("does not double-credit when the same award is replayed twice over", async () => {
    const { tx, state } = fakeTx({ balance: 0 });

    const first = await awardCoins(award("k1", 25), tx);
    const second = await awardCoins(award("k1", 25), tx);
    const third = await awardCoins(award("k1", 25), tx);

    expect(first.coins).toBe(25);
    expect(second.duplicate).toBe(true);
    expect(third.duplicate).toBe(true);
    expect(state.balance).toBe(25);
  });

  it("still refuses to award a non-positive amount", async () => {
    const { tx, state } = fakeTx({ balance: 40 });

    const result = await awardCoins(award("k1", 0), tx);

    expect(result.awarded).toBe(false);
    expect(result.duplicate).toBe(false);
    expect(state.balance).toBe(40);
    expect(state.statements.includes("ledger.create")).toBe(false);
  });
});

describe("spending coins inside a caller's transaction", () => {
  const spend = (key: string, cost: number) => ({ userId: "u1", cost, idempotencyKey: key });

  it("debits the balance once", async () => {
    const { tx, state } = fakeTx({ balance: 300 });

    const result = await spendCoins(spend("buy1", 120), tx);

    expect(result.ok).toBe(true);
    expect(state.balance).toBe(180);
  });

  it("refuses a purchase the balance cannot cover, and writes nothing", async () => {
    const { tx, state } = fakeTx({ balance: 50 });

    const result = await spendCoins(spend("buy1", 120), tx);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe("insufficient");
    expect(state.balance).toBe(50);
    expect(state.statements.includes("ledger.create")).toBe(false);
  });

  it("charges a double-clicked purchase once and keeps the transaction alive", async () => {
    const { tx, state } = fakeTx({ balance: 300 });

    const first = await spendCoins(spend("buy1", 120), tx);
    const second = await spendCoins(spend("buy1", 120), tx);

    expect(first.ok === true && first.spent).toBe(120);
    expect(second.ok === true && second.duplicate).toBe(true);
    expect(state.balance).toBe(180);
    expect(state.aborted).toBe(false);
  });

  it("rejects a fractional or negative price outright", async () => {
    for (const cost of [0, -50, 12.5, Number.NaN]) {
      const { tx, state } = fakeTx({ balance: 300 });
      const result = await spendCoins(spend("buy1", cost), tx);

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe("invalid");
      expect(state.balance).toBe(300);
    }
  });
});
