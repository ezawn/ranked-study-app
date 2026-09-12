import { rankDistance } from "./ranks";

/**
 * Matchmaking, as pure predicates.
 *
 * The database work — reading the queue, locking a pair, writing the match —
 * lives in the service. Everything that decides *whether* two people should
 * meet lives here, where it can be tested without a database, because these
 * are the rules most likely to be got subtly wrong and least likely to be
 * noticed when they are.
 *
 * Two gates:
 *
 *   1. RANK, widening with patience. Same rank only at first, then a tier
 *      either side, then two, and onward. A player who has waited a long time
 *      would rather play someone slightly mismatched than nobody.
 *   2. ELO, closest first. Within whatever window is currently open, the best
 *      opponent is the one whose rating is nearest — not the one who happened
 *      to be at the front of the queue.
 *
 * There used to be a third: a subject gate comparing what the two players had
 * studied. It is gone, and its removal is the reason matchmaking works at all.
 * When the Arena moved onto the shared question bank, the caller stopped
 * populating `subjects` — but the gate remained, comparing two empty lists,
 * finding nothing in common, and rejecting every candidate. Nobody could ever
 * be matched with anybody.
 *
 * What replaced it belongs in the caller: which subjects a player has TICKED
 * are intersected before candidates reach this function, and a pairing with too
 * few questions between them is dropped there. By the time an opponent gets
 * here, the only question left is whether they are a fair fight.
 */

/** How the rank window opens as a search goes on. */
export const RANK_WINDOW_STEPS: readonly { afterSeconds: number; tiers: number }[] = [
  { afterSeconds: 0, tiers: 0 },
  { afterSeconds: 5, tiers: 1 },
  { afterSeconds: 10, tiers: 2 },
  { afterSeconds: 20, tiers: 3 },
  { afterSeconds: 35, tiers: 4 },
  { afterSeconds: 55, tiers: 6 },
  /* Past this the ladder is effectively open. */
  { afterSeconds: 80, tiers: 99 },
] as const;

/** How many rank tiers either side are acceptable after this long searching. */
export function rankWindowFor(secondsWaiting: number): number {
  let tiers = 0;
  for (const step of RANK_WINDOW_STEPS) {
    if (secondsWaiting >= step.afterSeconds) tiers = step.tiers;
    else break;
  }
  return tiers;
}

export interface Candidate {
  userId: string;
  elo: number;
  rankKey: string;
  /** When they joined the queue — the tiebreak when Elo distance ties. */
  enqueuedAt: number;
}

export interface Searcher {
  userId: string;
  elo: number;
  rankKey: string;
  /** How long this player has been waiting. Drives the rank window. */
  secondsWaiting: number;
}

export interface Pairing {
  candidate: Candidate;
  eloDistance: number;
}

/**
 * The best available opponent, or null.
 *
 * Null is a normal answer, not a failure: it means keep searching and try
 * again with a wider window a moment later.
 */
export function pickOpponent(searcher: Searcher, candidates: readonly Candidate[]): Pairing | null {
  const window = rankWindowFor(searcher.secondsWaiting);

  let best: Pairing | null = null;

  for (const candidate of candidates) {
    if (candidate.userId === searcher.userId) continue;

    /* Gate 1 — rank. */
    if (rankDistance(searcher.rankKey, candidate.rankKey) > window) continue;

    const eloDistance = Math.abs(searcher.elo - candidate.elo);

    /* Gate 2 — closest Elo wins. Longest wait breaks an exact tie, so a player
       cannot be passed over forever by a stream of equally-close arrivals. */
    if (
      best === null ||
      eloDistance < best.eloDistance ||
      (eloDistance === best.eloDistance && candidate.enqueuedAt < best.candidate.enqueuedAt)
    ) {
      best = {
        candidate,
        eloDistance,
      };
    }
  }

  return best;
}

/**
 * What to tell the player while they wait.
 *
 * An honest estimate from the window that is currently open, not a countdown
 * to a match nobody has found. It gets vaguer as the search widens, which is
 * the truth: past a minute the system genuinely does not know.
 */
export function waitMessage(secondsWaiting: number): string {
  const tiers = rankWindowFor(secondsWaiting);
  if (tiers === 0) return "Looking for someone at your rank";
  if (tiers === 1) return "Widening to nearby ranks";
  if (tiers <= 3) return `Searching within ${tiers} ranks`;
  if (tiers < 99) return "Widening the search";
  return "Searching every rank — hang tight";
}
