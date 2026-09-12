/**
 * Rank-based coin multiplier — RESERVED.
 *
 * Ranks and XP are explicitly out of scope for this version, but every coin
 * award already runs through this hook, so introducing them later is a change
 * to this one function rather than to the whole economy.
 *
 * Do not add rank logic here until ranks are actually in scope.
 */

export interface RankMultiplierInput {
  /** RESERVED — always 0 in this version. */
  xp: number;
  /** RESERVED — always null in this version. */
  rankTier: string | null;
}

export function getRankMultiplier(_user: RankMultiplierInput): number {
  return 1.0;
}
