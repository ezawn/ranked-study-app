import { ELO_FLOOR, rankForElo, higherRank } from "./ranks";

/**
 * Elo.
 *
 * Standard Elo already does most of what was asked, and it is worth being
 * precise about which parts are the textbook and which are deliberate
 * departures — because the departures are the ones that can be got wrong.
 *
 * From the textbook, unmodified:
 *
 *   * Beating a stronger player pays more than beating a weaker one, and the
 *     stronger player loses correspondingly more. Upsets are already rewarded;
 *     nothing needed adding for that.
 *   * A draw moves both players toward each other. The favourite expected more
 *     than half a point and gets half, so they lose rating; the underdog
 *     expected less and gains. That is exactly the specified behaviour, and it
 *     falls out of `S = 0.5` with no special case.
 *
 * Two departures, both intentional:
 *
 *   * UNDERDOG SHIELD. A player who was never expected to win loses almost
 *     nothing for losing. Textbook Elo already makes that loss small; this
 *     tapers it down to a single point for a heavy underdog, because a ladder
 *     that punishes people for being matched upward teaches them to dodge hard
 *     matches. It stops at one point, not zero: a defeat always costs
 *     something, mirroring the "a win always pays at least 1" rule below.
 *   * A win always pays at least 1, and a loss always costs at least 1. A
 *     crushing favourite can otherwise round a win to zero, and a shielded
 *     underdog a loss to zero, and a result that moves nothing does not feel
 *     like a result.
 *
 * The shield means the system is not strictly zero-sum: a heavy underdog's
 * shielded loss is not fully paid to the favourite. That is a considered
 * trade — retention over conservation — and it is the reason total Elo across
 * the population drifts upward slowly. If that ever matters, the shield is the
 * knob, and it is the only one.
 *
 * Pure. No database, no clock, no randomness.
 */

export type MatchResult = "win" | "loss" | "draw";

/** Score for the Elo formula: 1 a win, 0.5 a draw, 0 a loss. */
const SCORE: Record<MatchResult, number> = { win: 1, draw: 0.5, loss: 0 };

/**
 * Probability the first player beats the second, on the standard 400-point
 * logistic. A 400-point gap is roughly 10:1.
 */
export function expectedScore(elo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - elo) / 400));
}

/**
 * How much a single result may move a rating.
 *
 * Provisional players move fastest, because the system's first job is to find
 * out roughly where they belong. High ranks move slowest, because at that
 * point the rating is mostly right and volatility is the enemy.
 */
export function kFactor(matchesPlayed: number, elo: number): number {
  if (matchesPlayed < 10) return 48;
  if (elo >= 2225) return 20;
  if (elo >= 1750) return 26;
  return 32;
}

/**
 * The point below which losing is fully forgiven.
 *
 * A player expected to win 15% of the time or less is being matched well above
 * their weight; losing is the predicted outcome and charging them for it is
 * noise, not information.
 */
const SHIELD_FLOOR = 0.15;

export interface EloChange {
  delta: number;
  eloAfter: number;
  rankKeyAfter: string;
  /** True when the underdog shield reduced a loss. Shown in the results screen. */
  shielded: boolean;
  /** The pre-match win probability, kept for display and for tests. */
  expected: number;
}

export interface EloInput {
  elo: number;
  opponentElo: number;
  matchesPlayed: number;
  result: MatchResult;
}

/** Apply one result to one player's rating. */
export function applyElo({ elo, opponentElo, matchesPlayed, result }: EloInput): EloChange {
  const expected = expectedScore(elo, opponentElo);
  const k = kFactor(matchesPlayed, elo);

  let delta = Math.round(k * (SCORE[result] - expected));
  let shielded = false;

  if (result === "loss" && expected < 0.5) {
    /* Taper the loss towards a single point as the odds get long. At `expected`
       of 0.5 the full loss applies; at SHIELD_FLOOR or below, only the one
       point does. */
    const shield = Math.min(1, Math.max(0, (0.5 - expected) / (0.5 - SHIELD_FLOOR)));

    /* Reported from the shield itself, not from whether the number moved. A
       hopeless underdog's raw loss can already round to the minimum, and
       comparing before and after would then report "not shielded" for the
       player the shield exists to protect — the opposite of the truth. */
    shielded = shield > 0;
    delta = Math.round(delta * (1 - shield));
  }

  /* Neither a win nor a loss is ever worth nothing. */
  if (result === "win") delta = Math.max(1, delta);
  if (result === "loss") delta = Math.min(-1, delta);

  /* Math.round can hand back -0, which is equal to 0 but prints as "-0" and
     compares strangely under Object.is. Normalise it away. */
  if (delta === 0) delta = 0;

  const eloAfter = Math.max(ELO_FLOOR, elo + delta);

  return {
    /* Report the movement that actually happened, so a rating clamped at the
       floor does not display a loss it did not take. */
    delta: eloAfter - elo,
    eloAfter,
    rankKeyAfter: rankForElo(eloAfter).key,
    shielded,
    expected,
  };
}

export interface MatchEloOutcome {
  a: EloChange;
  b: EloChange;
}

/**
 * Both sides of one match.
 *
 * Computed from the ratings as they were before the match, so the order the
 * two players are processed in cannot change the result.
 */
export function applyMatchElo(
  a: { elo: number; matchesPlayed: number },
  b: { elo: number; matchesPlayed: number },
  result: MatchResult,
): MatchEloOutcome {
  const inverse: MatchResult = result === "win" ? "loss" : result === "loss" ? "win" : "draw";

  return {
    a: applyElo({ elo: a.elo, opponentElo: b.elo, matchesPlayed: a.matchesPlayed, result }),
    b: applyElo({ elo: b.elo, opponentElo: a.elo, matchesPlayed: b.matchesPlayed, result: inverse }),
  };
}

/** Peak rank never falls. Used when writing a profile after a match. */
export function nextPeakRank(currentPeak: string, newRankKey: string): string {
  return higherRank(currentPeak, newRankKey);
}
