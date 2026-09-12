/**
 * Cosmetic catalogue seed.
 *
 *   npx tsx prisma/seed-cosmetics.ts
 *
 * Separate from the main seed and safe to re-run. The main seed builds a
 * demo world and wipes as it goes; this only ever upserts the shop, so it can
 * be run against a live database when the catalogue changes without touching
 * anybody's coins, inventory or match history.
 *
 * Items are keyed by `slug`, so renaming an item's display name is safe but
 * changing its slug creates a new item — which is correct, because ownership
 * rows point at the old one and a rename should not silently re-gift it.
 */

import "dotenv/config";

import { PrismaClient, type CosmeticCategory } from "@prisma/client";

import { COSMETICS } from "../src/lib/arena/cosmetics";

const db = new PrismaClient();

async function main() {
  console.log(`Seeding ${COSMETICS.length} cosmetics…`);

  let created = 0;
  let updated = 0;

  for (const [index, item] of COSMETICS.entries()) {
    const existing = await db.cosmeticItem.findUnique({ where: { slug: item.slug } });

    await db.cosmeticItem.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        category: item.category as CosmeticCategory,
        name: item.name,
        description: item.description,
        price: item.price,
        placeholderLabel: item.placeholderLabel,
        sortOrder: index,
        isActive: true,
      },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        placeholderLabel: item.placeholderLabel,
        sortOrder: index,
        isActive: true,
        /* spriteKey is deliberately NOT updated. Once artwork is attached to an
           item, re-running this seed must not wipe it. */
      },
    });

    if (existing) updated++;
    else created++;
  }

  console.log(`Done. ${created} created, ${updated} updated.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
