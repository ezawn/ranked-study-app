import "server-only";

import { db } from "@/lib/db";
import { spendCoins } from "@/server/services/coins";
import { COSMETIC_CATEGORIES, type CosmeticCategoryKey } from "@/lib/arena/cosmetics";

/**
 * The shop, the inventory and what is worn.
 *
 * Three rules, all enforced in the database rather than in the UI:
 *
 *  * You cannot buy the same item twice — `@@unique([userId, itemId])` on the
 *    ownership row makes the second purchase a constraint violation rather
 *    than a second charge.
 *  * You cannot equip what you do not own — checked here, on the server, from
 *    the ownership table, not from whatever the client believed.
 *  * You cannot pay a price you chose — the price is read from the catalogue
 *    row inside the transaction; the client sends an item id and nothing else.
 */

export interface ShopItem {
  id: string;
  slug: string;
  category: CosmeticCategoryKey;
  name: string;
  description: string;
  price: number;
  placeholderLabel: string;
  spriteKey: string | null;
  owned: boolean;
  equipped: boolean;
}

/** The whole shop, annotated with what this user owns and wears. */
export async function shopFor(userId: string): Promise<Record<CosmeticCategoryKey, ShopItem[]>> {
  const [items, owned, equipped] = await Promise.all([
    db.cosmeticItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    db.cosmeticOwnership.findMany({ where: { userId }, select: { itemId: true } }),
    db.equippedCosmetic.findMany({ where: { userId }, select: { itemId: true } }),
  ]);

  const ownedIds = new Set(owned.map((o) => o.itemId));
  const equippedIds = new Set(equipped.map((e) => e.itemId));

  const grouped = Object.fromEntries(
    COSMETIC_CATEGORIES.map((c) => [c, [] as ShopItem[]]),
  ) as Record<CosmeticCategoryKey, ShopItem[]>;

  for (const item of items) {
    const category = item.category as CosmeticCategoryKey;
    if (!grouped[category]) continue;
    grouped[category].push({
      id: item.id,
      slug: item.slug,
      category,
      name: item.name,
      description: item.description,
      price: item.price,
      placeholderLabel: item.placeholderLabel,
      spriteKey: item.spriteKey,
      owned: ownedIds.has(item.id),
      equipped: equippedIds.has(item.id),
    });
  }

  return grouped;
}

export interface EquippedLook {
  category: CosmeticCategoryKey;
  itemId: string;
  name: string;
  placeholderLabel: string;
  spriteKey: string | null;
}

/**
 * What a character is wearing.
 *
 * Takes a user id rather than a session, because a player profile renders
 * somebody else's character and must go through exactly the same path.
 */
export async function equippedLook(userId: string): Promise<EquippedLook[]> {
  const rows = await db.equippedCosmetic.findMany({
    where: { userId },
    include: { item: true },
  });

  return rows.map((row) => ({
    category: row.category as CosmeticCategoryKey,
    itemId: row.itemId,
    name: row.item.name,
    placeholderLabel: row.item.placeholderLabel,
    spriteKey: row.item.spriteKey,
  }));
}

export type PurchaseResult =
  | { ok: true; balance: number; itemId: string }
  | { ok: false; reason: "unknown_item" | "already_owned" | "insufficient" | "invalid"; balance?: number };

/**
 * Buy a cosmetic.
 *
 * The charge and the ownership row are written in one transaction, so there is
 * no window in which a user has been charged but owns nothing, or owns
 * something they were never charged for.
 */
export async function purchase(userId: string, itemId: string): Promise<PurchaseResult> {
  const item = await db.cosmeticItem.findUnique({ where: { id: itemId } });
  if (!item || !item.isActive) return { ok: false, reason: "unknown_item" };

  const existing = await db.cosmeticOwnership.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });
  if (existing) return { ok: false, reason: "already_owned" };

  try {
    return await db.$transaction(async (tx) => {
      /* Create ownership FIRST. The unique index is what makes a double-click
         safe: the second attempt throws here, before any coins move, rather
         than charging twice and failing to record the second item. */
      await tx.cosmeticOwnership.create({
        data: { userId, itemId, pricePaid: item.price },
      });

      const spend = await spendCoins(
        {
          userId,
          cost: item.price,
          idempotencyKey: `cosmetic:${userId}:${itemId}`,
          refType: "cosmetic",
          refId: itemId,
        },
        tx,
      );

      if (!spend.ok) {
        /* Roll the ownership back by failing the transaction. */
        throw new InsufficientFunds(spend.balance);
      }

      return { ok: true as const, balance: spend.balance, itemId };
    });
  } catch (error) {
    if (error instanceof InsufficientFunds) {
      return { ok: false, reason: "insufficient", balance: error.balance };
    }
    /* A unique violation here means a concurrent purchase of the same item. */
    return { ok: false, reason: "already_owned" };
  }
}

class InsufficientFunds extends Error {
  constructor(public readonly balance: number) {
    super("insufficient");
  }
}

export type EquipResult =
  | { ok: true; equipped: boolean; category: CosmeticCategoryKey }
  | { ok: false; reason: "unknown_item" | "not_owned" };

/**
 * Equip or unequip.
 *
 * One item per category, so equipping replaces whatever was in that slot. A
 * second call with the same item takes it off, which is what the brief asked
 * for and what a player expects from a toggle.
 */
export async function toggleEquip(userId: string, itemId: string): Promise<EquipResult> {
  const item = await db.cosmeticItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, reason: "unknown_item" };

  const owned = await db.cosmeticOwnership.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });
  if (!owned) return { ok: false, reason: "not_owned" };

  const category = item.category as CosmeticCategoryKey;
  const current = await db.equippedCosmetic.findUnique({
    where: { userId_category: { userId, category: item.category } },
  });

  if (current?.itemId === itemId) {
    await db.equippedCosmetic.delete({ where: { id: current.id } });
    return { ok: true, equipped: false, category };
  }

  await db.equippedCosmetic.upsert({
    where: { userId_category: { userId, category: item.category } },
    create: { userId, category: item.category, itemId },
    update: { itemId, equippedAt: new Date() },
  });

  return { ok: true, equipped: true, category };
}

/** How much of the catalogue a player has collected — shown on their profile. */
export async function collectionProgress(userId: string) {
  const [owned, total] = await Promise.all([
    db.cosmeticOwnership.count({ where: { userId } }),
    db.cosmeticItem.count({ where: { isActive: true } }),
  ]);
  return { owned, total, fraction: total === 0 ? 0 : owned / total };
}
