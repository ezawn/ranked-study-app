/**
 * Adaptive spaced repetition — Smart Mode.
 *
 * The base intervals come straight from the product spec:
 *   Don't Know -> ~1 day, Partially Know -> ~2 days, Know well -> ~5 days.
 *
 * They are not fixed, though. Each card carries a per-user `ease` factor that
 * rises when the user keeps knowing it and falls when they keep failing it, so
 * the schedule adapts to that individual's performance on that individual card.
 *
 * The spec's worked example — a card seen every day, marked "Don't Know" every
 * time, where the current schedule is clearly not working — is handled by the
 * struggle detector, which floors such a card down to 12 hours.
 *
 * Pure functions, no I/O, so the behaviour is fully unit-testable.
 */

export type Rating = "KNOW" | "PARTIAL" | "DONT_KNOW";

export const SRS = {
  /** Base intervals in hours. */
  base: {
    DONT_KNOW: 24,
    PARTIAL: 48,
    KNOW: 120,
  } satisfies Record<Rating, number>,

  /** Ease adjustments per rating. */
  easeFactor: {
    KNOW: 1.2,
    PARTIAL: 0.95,
    DONT_KNOW: 0.6,
  } satisfies Record<Rating, number>,

  easeMin: 0.25,
  easeMax: 3.0,
  easeStart: 1.0,

  /** Each consecutive "Know" stretches the interval by this much. */
  knowStreakGrowth: 0.35,

  /** Absolute bounds on any scheduled interval. */
  minIntervalHours: 12,
  maxIntervalHours: 24 * 365,

  /** Struggle detector: this many DONT_KNOW ratings... */
  struggleFailures: 3,
  /** ...within this many most recent reviews floors the card to 12h. */
  struggleWindow: 4,
} as const;

export interface CardState {
  intervalHours: number;
  ease: number;
  knowStreak: number;
  lapses: number;
  reviewCount: number;
}

export interface ScheduleInput {
  state: CardState;
  rating: Rating;
  /** Most recent ratings for this card, newest first, EXCLUDING this one. */
  recentRatings: Rating[];
  now: Date;
}

export interface ScheduleResult {
  state: CardState;
  /** When the card should next appear in Smart Mode. */
  dueAt: Date;
  intervalBeforeHours: number;
  intervalAfterHours: number;
  /**
   * True when this card currently reads as a leech — failed on most of its
   * recent reviews. Drives the 12h floor and the "tricky card" hint in the UI.
   */
  struggling: boolean;
}

export function initialCardState(): CardState {
  return {
    intervalHours: SRS.base.DONT_KNOW,
    ease: SRS.easeStart,
    knowStreak: 0,
    lapses: 0,
    reviewCount: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Is this card one the user keeps failing? Counts DONT_KNOW ratings across the
 * most recent reviews, including the one being recorded now.
 */
export function isStruggling(rating: Rating, recentRatings: Rating[]): boolean {
  const window = [rating, ...recentRatings].slice(0, SRS.struggleWindow);
  const failures = window.filter((r) => r === "DONT_KNOW").length;
  return failures >= SRS.struggleFailures;
}

export function schedule(input: ScheduleInput): ScheduleResult {
  const { state, rating, recentRatings, now } = input;
  const intervalBeforeHours = state.intervalHours;

  let ease = state.ease;
  let knowStreak = state.knowStreak;
  let lapses = state.lapses;
  let intervalHours: number;

  switch (rating) {
    case "KNOW": {
      knowStreak += 1;
      ease = clamp(ease * SRS.easeFactor.KNOW, SRS.easeMin, SRS.easeMax);
      const growth = 1 + SRS.knowStreakGrowth * (knowStreak - 1);
      intervalHours = SRS.base.KNOW * ease * growth;
      break;
    }
    case "PARTIAL": {
      knowStreak = 0;
      ease = clamp(ease * SRS.easeFactor.PARTIAL, SRS.easeMin, SRS.easeMax);
      intervalHours = SRS.base.PARTIAL * ease;
      break;
    }
    case "DONT_KNOW": {
      knowStreak = 0;
      lapses += 1;
      ease = clamp(ease * SRS.easeFactor.DONT_KNOW, SRS.easeMin, SRS.easeMax);
      intervalHours = SRS.base.DONT_KNOW * ease;
      break;
    }
  }

  // The card the user keeps failing comes back within half a day, no matter
  // what the formula produced. This is the spec's worked example: seen every
  // day, marked "Don't Know" every time, current scheduling clearly not working.
  //
  // The floor deliberately does NOT apply when the user has just got the card
  // right — punishing a correct answer by pinning it to 12h would stop a
  // recovering card from ever escaping. Its depressed `ease` already keeps the
  // next interval short (a leech that clicks comes back in a day or two, not
  // five), which is the adaptive behaviour we want.
  const struggling = isStruggling(rating, recentRatings);
  if (struggling && rating !== "KNOW") {
    intervalHours = Math.min(intervalHours, SRS.minIntervalHours);
  }

  intervalHours = clamp(intervalHours, SRS.minIntervalHours, SRS.maxIntervalHours);
  // Keep it to a sane precision so stored values stay readable.
  intervalHours = Math.round(intervalHours * 100) / 100;

  const dueAt = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);

  return {
    state: {
      intervalHours,
      ease: Math.round(ease * 1000) / 1000,
      knowStreak,
      lapses,
      reviewCount: state.reviewCount + 1,
    },
    dueAt,
    intervalBeforeHours,
    intervalAfterHours: intervalHours,
    struggling,
  };
}

/** Human-readable "next in ..." for the study UI. */
export function describeInterval(hours: number): string {
  if (hours < 1) return "under an hour";
  if (hours < 24) {
    const h = Math.round(hours);
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  const days = hours / 24;
  if (days < 30) {
    const d = Math.round(days * 10) / 10;
    return d === 1 ? "1 day" : `${d % 1 === 0 ? d : d.toFixed(1)} days`;
  }
  const months = Math.round(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
}

// ---------------------------------------------------------------------------
// Cram Mode
// ---------------------------------------------------------------------------

/**
 * Cram Mode has no scheduling. Two piles; loop the unknown pile round after
 * round until it is empty. Cram reviews are recorded for history but never
 * touch Smart Mode scheduling — a pre-exam cram should not wreck a carefully
 * built long-term schedule.
 */
export interface CramPiles {
  known: string[];
  unknown: string[];
  round: number;
}

export function startCram(cardIds: string[]): CramPiles {
  return { known: [], unknown: [...cardIds], round: 1 };
}

export function applyCramAnswer(piles: CramPiles, cardId: string, known: boolean): CramPiles {
  if (!piles.unknown.includes(cardId)) return piles;

  if (!known) {
    // Stays in the unknown pile, moved to the back so the round completes.
    const rest = piles.unknown.filter((id) => id !== cardId);
    return { ...piles, unknown: [...rest, cardId] };
  }

  return {
    ...piles,
    known: [...piles.known, cardId],
    unknown: piles.unknown.filter((id) => id !== cardId),
  };
}

export function isCramComplete(piles: CramPiles): boolean {
  return piles.unknown.length === 0;
}
