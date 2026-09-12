/**
 * The cosmetic catalogue.
 *
 * Data, not database. The seed writes these rows and the shop reads them back
 * from Postgres, but the definitions live here so the catalogue is reviewable
 * in a diff and so category order and pricing are one decision rather than
 * eighty.
 *
 * Every item currently renders as a labelled red circle. `placeholderLabel` is
 * what that circle prints. When artwork arrives it goes in `spriteKey` on the
 * database row and the renderer prefers it — the shop, the inventory, the
 * equipping rules and the character preview do not change at all. That is the
 * whole reason the placeholder is a field rather than a hardcoded fallback.
 *
 * Prices climb with the anchor slot: a hat is cheap and a pet is not, so there
 * is something to save for beyond the first evening.
 */

export const COSMETIC_CATEGORIES = [
  "HAT",
  "CHESTPIECE",
  "LEGGINGS",
  "SHOES",
  "GLOVES",
  "WEAPON",
  "PET",
  "ACCESSORY",
] as const;

export type CosmeticCategoryKey = (typeof COSMETIC_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<CosmeticCategoryKey, string> = {
  HAT: "Hats",
  CHESTPIECE: "Chestpieces",
  LEGGINGS: "Leggings",
  SHOES: "Shoes",
  GLOVES: "Gloves",
  WEAPON: "Weapons",
  PET: "Pets",
  ACCESSORY: "Accessories",
};

/**
 * Where each slot sits on the character preview.
 *
 * Percentages of the preview box, so the layout survives any preview size and
 * so swapping a circle for a sprite is a change of what is drawn, not where.
 */
export const SLOT_POSITION: Record<CosmeticCategoryKey, { x: number; y: number; size: number }> = {
  HAT: { x: 50, y: 8, size: 26 },
  CHESTPIECE: { x: 50, y: 42, size: 34 },
  LEGGINGS: { x: 50, y: 68, size: 28 },
  SHOES: { x: 50, y: 89, size: 22 },
  GLOVES: { x: 22, y: 55, size: 20 },
  WEAPON: { x: 80, y: 48, size: 26 },
  PET: { x: 86, y: 84, size: 24 },
  ACCESSORY: { x: 18, y: 24, size: 20 },
};

export interface CosmeticDef {
  slug: string;
  category: CosmeticCategoryKey;
  name: string;
  description: string;
  price: number;
  placeholderLabel: string;
}

/** Base price per slot, before the tier step. */
const BASE_PRICE: Record<CosmeticCategoryKey, number> = {
  HAT: 120,
  CHESTPIECE: 200,
  LEGGINGS: 180,
  SHOES: 140,
  GLOVES: 130,
  WEAPON: 260,
  PET: 400,
  ACCESSORY: 110,
};

/** Ten items per slot, cheapest first. */
const ITEMS: Record<CosmeticCategoryKey, [name: string, description: string][]> = {
  HAT: [
    ["Study Cap", "Where everyone starts. Slightly too big."],
    ["Top Hat", "For the student who revises in formalwear."],
    ["Beanie", "Warm, unbothered, quietly confident."],
    ["Graduation Cap", "Optimistic. Tassel included."],
    ["Headphones", "The universal signal for do not talk to me."],
    ["Crown of Notes", "Woven from paper you meant to file."],
    ["Wizard Hat", "Pointed. Purple. Unnecessary."],
    ["Laurel Wreath", "Traditionally awarded. Here, purchased."],
    ["Visor of Focus", "Blocks out everything except the question."],
    ["Halo", "Attendance was perfect. Behaviour, less so."],
  ],
  CHESTPIECE: [
    ["Plain Jumper", "Comfortable. Forgettable."],
    ["School Blazer", "Buttons optional."],
    ["Hoodie", "The revision uniform."],
    ["Lab Coat", "Suggests you know what you are doing."],
    ["Varsity Jacket", "For someone else's team."],
    ["Scholar's Robe", "Long enough to trip on."],
    ["Chainmail", "Heavy. Historically inaccurate."],
    ["Cardigan of Patience", "For very long past papers."],
    ["Plated Cuirass", "Nobody has asked why you own this."],
    ["Aurora Cloak", "Catches the light when you get one right."],
  ],
  LEGGINGS: [
    ["Grey Trousers", "Regulation."],
    ["Joggers", "Revision-appropriate."],
    ["Cargo Trousers", "Eleven pockets. Two used."],
    ["Pleated Skirt", "Sharp."],
    ["Denim", "Reliable."],
    ["Track Bottoms", "Fast, allegedly."],
    ["Greaves", "Clanks when you walk."],
    ["Robed Legs", "Mysterious from the knee down."],
    ["Starlight Trousers", "Faintly luminous."],
    ["Legendary Chinos", "Nobody knows why these are legendary."],
  ],
  SHOES: [
    ["School Shoes", "Scuffed within a week."],
    ["Trainers", "Broken in properly."],
    ["High Tops", "Laces never quite even."],
    ["Boots", "For walking to the library in weather."],
    ["Slippers", "Home revision only."],
    ["Running Spikes", "Overkill for a two-minute battle."],
    ["Sabatons", "Steel-toed. Loud."],
    ["Winged Sandals", "Answer faster, in theory."],
    ["Cloud Steppers", "No noticeable effect. Pleasant."],
    ["Boots of the Late Reviser", "Worn at 2am."],
  ],
  GLOVES: [
    ["Bare Hands", "Free, and honest."],
    ["Fingerless Gloves", "For typing in a cold room."],
    ["Woolly Mittens", "Terrible for multiple choice."],
    ["Leather Gloves", "Serious."],
    ["Lab Gloves", "Snap them on before a hard question."],
    ["Gauntlets", "Heavier than the exam."],
    ["Ink-Stained Wraps", "Evidence of work."],
    ["Duelling Gloves", "One is for throwing down."],
    ["Gloves of Precision", "Fewer typos, spiritually."],
    ["Starforged Grips", "Absurd. Expensive."],
  ],
  WEAPON: [
    ["Pencil", "The original weapon."],
    ["Ruler", "Doubles as a bookmark."],
    ["Fountain Pen", "Leaks under pressure."],
    ["Highlighter", "Deals fluorescent damage."],
    ["Textbook", "Blunt but effective."],
    ["Compass", "Pointy. Confiscated twice."],
    ["Sword", "Classic. Impractical."],
    ["Staff of Revision", "Glows near a past paper."],
    ["Quill of Truth", "Writes only correct answers. Allegedly."],
    ["Calculator Blade", "Scientific, in both senses."],
  ],
  PET: [
    ["Study Buddy", "A small blob. Encouraging."],
    ["Library Cat", "Sits on your notes."],
    ["Loyal Dog", "Has eaten homework."],
    ["Owl", "Nocturnal, like your revision."],
    ["Raven", "Judgemental."],
    ["Fox", "Clever, obviously."],
    ["Dragonling", "Small. Warm. Fire hazard."],
    ["Phoenix", "Comes back after a bad result."],
    ["Griffin", "Majestic and entirely impractical."],
    ["Void Companion", "Nobody is sure what it is."],
  ],
  ACCESSORY: [
    ["Lanyard", "Contains one expired card."],
    ["Round Glasses", "Instantly more academic."],
    ["Scarf", "Two metres of commitment."],
    ["Badge Set", "Achievements you awarded yourself."],
    ["Pocket Watch", "For timing your own battles."],
    ["Backpack", "Full of things you did not need."],
    ["Amulet", "Warm to the touch."],
    ["Monocle", "One eye takes revision seriously."],
    ["Aura of Focus", "A faint ring. Purely decorative."],
    ["Constellation Pin", "Points north. Sometimes."],
  ],
};

/** The whole catalogue, built from the tables above. */
export const COSMETICS: CosmeticDef[] = COSMETIC_CATEGORIES.flatMap((category) =>
  ITEMS[category].map(([name, description], index) => ({
    slug: `${category.toLowerCase()}-${slugify(name)}`,
    category,
    name,
    description,
    /* Ten steps from the slot's base price to roughly six times it, so the last
       item in a slot is a genuine goal rather than an afternoon's play. */
    price: Math.round(BASE_PRICE[category] * (1 + index * 0.55)),
    placeholderLabel: name,
  })),
);

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function cosmeticsByCategory(category: CosmeticCategoryKey): CosmeticDef[] {
  return COSMETICS.filter((c) => c.category === category);
}
