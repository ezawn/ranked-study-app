/**
 * Ranks.
 *
 * Eleven tiers on one ascending Elo scale. Six of the names were specified;
 * the other five slot between them without reordering any of the six, so the
 * given progression — Student, Apprentice, Prodigy, Intellectual, Enlightened,
 * Transcendent — still reads in that order once the additions are removed.
 *
 * The bands widen as they climb: 100 Elo separates the first two ranks and 325
 * separates the last two. That is deliberate. A flat band makes the top of the
 * ladder as cheap as the bottom, and a rank nobody struggles for is a rank
 * nobody wants. Widening also slows movement where ratings are noisiest, which
 * keeps a Transcendent player from bouncing out of the rank on one bad night.
 *
 * This module is pure and has no imports. It is the single source of truth for
 * what an Elo number means — nothing else may define a threshold.
 */

export interface Rank {
  /** Stable key. Stored in the database; never rename one in place. */
  key: string;
  name: string;
  /** Lowest Elo that holds this rank. */
  minElo: number;
  /**
   * Which rarity the rank borrows for its colour. Rank is mastery, and the
   * product already has one colour scale for mastery — this reuses it rather
   * than inventing a second meaning for the same hues.
   */
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const RANKS: readonly Rank[] = [
  { key: "student", name: "Student", minElo: 900, rarity: "common" },
  { key: "apprentice", name: "Apprentice", minElo: 1100, rarity: "common" },
  { key: "scholar", name: "Scholar", minElo: 1325, rarity: "uncommon" },
  { key: "adept", name: "Adept", minElo: 1575, rarity: "uncommon" },
  { key: "prodigy", name: "Prodigy", minElo: 1850, rarity: "rare" },
  { key: "savant", name: "Savant", minElo: 2150, rarity: "rare" },
  { key: "intellectual", name: "Intellectual", minElo: 2475, rarity: "epic" },
  { key: "luminary", name: "Luminary", minElo: 2825, rarity: "epic" },
  { key: "enlightened", name: "Enlightened", minElo: 3200, rarity: "legendary" },
  { key: "sage", name: "Sage", minElo: 3600, rarity: "legendary" },
  { key: "transcendent", name: "Transcendent", minElo: 4025, rarity: "legendary" },
] as const;

/** Where a new player starts: halfway through Student. */
export const STARTING_ELO = 1000;

/**
 * Elo never goes below this.
 *
 * The floor is the bottom of the first rank rather than zero, on purpose. A
 * floor below the ladder would leave a wide band of ratings that hold the same
 * rank and mean nothing — dead basement a player can fall into and then climb
 * back through with nothing to show for it. Putting the two at the same number
 * means every point of rating is inside a band that can be lost or won.
 */
export const ELO_FLOOR = RANKS[0].minElo;

const BY_KEY = new Map(RANKS.map((r) => [r.key, r]));

/** The rank an Elo number holds. Clamps rather than throwing. */
export function rankForElo(elo: number): Rank {
  let held: Rank = RANKS[0];
  for (const rank of RANKS) {
    if (elo >= rank.minElo) held = rank;
    else break;
  }
  return held;
}

export function rankByKey(key: string): Rank | undefined {
  return BY_KEY.get(key);
}

/** Position on the ladder, 0-based. -1 for an unknown key. */
export function rankIndex(key: string): number {
  return RANKS.findIndex((r) => r.key === key);
}

/** How many tiers apart two ranks are. Used by the matchmaking window. */
export function rankDistance(a: string, b: string): number {
  const ia = rankIndex(a);
  const ib = rankIndex(b);
  if (ia < 0 || ib < 0) return Number.POSITIVE_INFINITY;
  return Math.abs(ia - ib);
}

/** The next rank up, or null at the top of the ladder. */
export function nextRank(key: string): Rank | null {
  const i = rankIndex(key);
  if (i < 0 || i >= RANKS.length - 1) return null;
  return RANKS[i + 1];
}

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  /** 0–1 through the current band. 1 when the ladder is topped out. */
  fraction: number;
  /** Elo still needed for promotion. 0 at the top. */
  eloToNext: number;
  /** Elo gained since entering this rank. */
  eloIntoRank: number;
  /** Width of the current band. 0 at the top, where there is no ceiling. */
  bandSize: number;
}

/**
 * Where a player sits inside their rank.
 *
 * The progress bar on the rank page reads entirely from this, so promotion
 * maths lives in one tested place rather than in a component.
 */
export function rankProgress(elo: number): RankProgress {
  const rank = rankForElo(elo);
  const next = nextRank(rank.key);

  if (!next) {
    return { rank, next: null, fraction: 1, eloToNext: 0, eloIntoRank: elo - rank.minElo, bandSize: 0 };
  }

  const bandSize = next.minElo - rank.minElo;
  const eloIntoRank = Math.max(0, elo - rank.minElo);
  const fraction = bandSize <= 0 ? 1 : Math.min(1, Math.max(0, eloIntoRank / bandSize));

  return {
    rank,
    next,
    fraction,
    eloToNext: Math.max(0, next.minElo - elo),
    eloIntoRank,
    bandSize,
  };
}

/** Higher of two rank keys, for "peak rank" which a demotion must not erase. */
export function higherRank(a: string, b: string): string {
  return rankIndex(a) >= rankIndex(b) ? a : b;
}
