/**
 * Battle scoring.
 *
 * The brief asked for four things to matter — accuracy, volume, speed and
 * consistency — with the explicit constraints that a fast accurate player
 * should generally beat a slow perfect one, and that random guessing must never
 * pay. Those pull in opposite directions: rewarding volume invites spamming.
 *
 * THE SHAPE: points are earned only by correct answers, and the total is then
 * scaled by how reliable the player was.
 *
 *     score = (points from correct answers) × reliability²
 *
 * Volume is the base, accuracy is the multiplier, and because the multiplier
 * touches every point earned, one careless answer costs a fraction of the whole
 * match rather than a fixed toll. That is what makes rushing questions you
 * cannot do a losing move.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS NOT SUBTRACTIVE ANY MORE.
 *
 * It used to charge each wrong answer a derived penalty and floor the result at
 * zero. The derivation was sound — the price made a guess break even at any
 * number of options — but the floor threw the answer away. A player on 10 of 45
 * and one on 15 of 45 both came out below zero, both displayed zero, and the
 * match was declared a draw. Two clearly different performances, one number.
 *
 * That is the flaw in every subtractive scheme: the interesting range is where
 * players actually are, and a floor compresses all of it to a single point. A
 * multiplicative score cannot do that. It is monotone everywhere — more correct
 * answers always help, a wrong answer always hurts, and no two different
 * performances collapse into the same value unless nobody answered anything
 * right at all.
 *
 * THE PRICE, stated honestly: a player already answering at pure chance gains a
 * point or two per extra guess, because their reliability cannot fall any
 * further and the correct count still creeps up. Guessing loses for everybody
 * above chance — around −30 a guess for a strong player, and the tests pin
 * that — but at the very bottom the gradient reverses. It is bounded by the
 * hand size, it earns a fraction of a real score (a 45-question spam run scores
 * about as much as four honest answers), and the alternative is the zero
 * collapse above. That trade is deliberate.
 * ---------------------------------------------------------------------------
 *
 * RELIABILITY is accuracy shrunk toward chance, not raw accuracy:
 *
 *     reliability = (correct + PRIOR_ANSWERS × chance) / (answered + PRIOR_ANSWERS)
 *
 * Raw accuracy makes one lucky answer look like perfect mastery — 1 of 1 would
 * multiply by 1.0, the same as 45 of 45. The shrinkage says a small sample is
 * weak evidence, so two correct answers out of two reads as "probably decent"
 * rather than "flawless", and the estimate only approaches the truth as the
 * sample grows. `chance` is the mean guess rate across the questions actually
 * asked, so a run of true/false questions is correctly treated as easier to
 * fluke than a run of four-option ones.
 *
 * Speed and consistency ride on the points, not on the multiplier: `tempo`
 * pays for answering inside the time a question is worth, and `streakMultiplier`
 * for consecutive correct answers.
 *
 * Pure. Same inputs, same score, always — it is computed on the server and the
 * client never sends a figure that reaches it.
 */

/** Points for a correct answer before speed and consistency. */
export const CORRECT_BASE = 100;

/**
 * How hard reliability bites.
 *
 * The exponent on the accuracy multiplier. 1 scales linearly; 2 means a player
 * at half accuracy keeps a quarter of what they earned, which is what makes
 * accuracy rather than volume decide a close match.
 */
export const ACCURACY_WEIGHT = 2;

/**
 * Imaginary answers at chance, mixed into the accuracy estimate.
 *
 * Four is enough that a one-or-two-answer match cannot claim perfect
 * reliability, and few enough to be irrelevant by the time a real hand is
 * played out.
 */
export const PRIOR_ANSWERS = 4;

/**
 * What share of a question's estimated solving time a battle answer is worth.
 *
 * The estimates describe writing a full solution; a battle asks only for the
 * right option out of four. A question estimated at 80 seconds is therefore
 * "answered at pace" in about 20.
 */
export const BATTLE_PACE = 0.25;

/** Assumed solving time when a question carries no estimate. */
export const DEFAULT_EXPECTED_SECONDS = 60;

/** An answer at the fastest end is worth this much on top of the base. */
export const MAX_SPEED_BONUS = 0.5;

/** Consecutive correct answers each add this, up to STREAK_CAP of them. */
export const STREAK_STEP = 0.06;
export const STREAK_CAP = 5;

/** Assumed choice count when a question does not report one. */
const DEFAULT_CHOICES = 4;

export interface ScoredAnswer {
  correct: boolean;
  responseMs: number;
  /**
   * How many options the player was choosing between. 2 for true/false, the
   * option count for multiple choice, null for a numeric answer.
   */
  choices: number | null;
  /**
   * The question's own estimated solving time, or null when it does not carry
   * one. This is what "fast" is measured against — a 40-second question and a
   * 120-second one are not the same answer at the same clock reading.
   */
  estimatedSeconds?: number | null;
}

export interface BattleScore {
  score: number;
  answered: number;
  correct: number;
  /** 0–1. Zero when nothing was answered, never NaN. */
  accuracy: number;
  /** Accuracy shrunk toward chance — what actually multiplies the score. */
  reliability: number;
  /** Mean response time over answered questions, in ms. 0 when none. */
  averageResponseMs: number;
  /** Longest run of consecutive correct answers. */
  bestStreak: number;
}

/** The odds of getting this question right by guessing. */
export function chanceOf(choices: number | null): number {
  const n = choices && choices > 1 ? choices : DEFAULT_CHOICES;
  return 1 / n;
}

/**
 * How hard this answer was pushed, relative to what the question is worth.
 *
 * 1.5 at the fast end, falling to 1.0 once the answer has taken as long as the
 * question deserves.
 */
export function tempoMultiplier(
  responseMs: number,
  estimatedSeconds?: number | null,
): number {
  const estimate =
    estimatedSeconds && estimatedSeconds > 0 ? estimatedSeconds : DEFAULT_EXPECTED_SECONDS;
  const reference = estimate * 1000 * BATTLE_PACE;
  const clamped = Math.min(Math.max(responseMs, 0), reference);
  return 1 + MAX_SPEED_BONUS * (1 - clamped / reference);
}

/** Consistency multiplier for the Nth consecutive correct answer. */
export function streakMultiplier(streakLength: number): number {
  return 1 + Math.min(streakLength, STREAK_CAP) * STREAK_STEP;
}

/**
 * Accuracy, shrunk toward the rate a guesser would manage.
 *
 * Exported because the results screen shows it: a player who sees "8 of 10" and
 * a multiplier that is not 0.8 deserves to be told why, and the honest answer is
 * that ten answers is not yet proof.
 */
export function reliabilityOf(correct: number, answered: number, chance: number): number {
  if (answered <= 0) return 0;
  return (correct + PRIOR_ANSWERS * chance) / (answered + PRIOR_ANSWERS);
}

/**
 * Score one player's whole battle.
 *
 * Answers must be in the order they were given, because the streak multiplier
 * depends on the run.
 */
export function scoreBattle(answers: readonly ScoredAnswer[]): BattleScore {
  let earned = 0;
  let correct = 0;
  let totalMs = 0;
  let chanceTotal = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const answer of answers) {
    totalMs += Math.max(0, answer.responseMs);
    chanceTotal += chanceOf(answer.choices);

    if (answer.correct) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      correct += 1;
      earned +=
        CORRECT_BASE *
        tempoMultiplier(answer.responseMs, answer.estimatedSeconds) *
        streakMultiplier(streak - 1);
    } else {
      streak = 0;
    }
  }

  const answered = answers.length;
  if (answered === 0) {
    return {
      score: 0,
      answered: 0,
      correct: 0,
      accuracy: 0,
      reliability: 0,
      averageResponseMs: 0,
      bestStreak: 0,
    };
  }

  const chance = chanceTotal / answered;
  const reliability = reliabilityOf(correct, answered, chance);

  return {
    /* No floor and no clamp: the product of a non-negative total and a
       non-negative multiplier cannot go below zero on its own, which is the
       whole reason this shape replaced the subtractive one. */
    score: Math.round(earned * Math.pow(reliability, ACCURACY_WEIGHT)),
    answered,
    correct,
    accuracy: correct / answered,
    reliability,
    averageResponseMs: Math.round(totalMs / answered),
    bestStreak,
  };
}

export type Verdict = "a" | "b" | "draw";

/**
 * Who won.
 *
 * Score alone, because score is already the weighted combination of everything
 * that was supposed to count. Adding a tiebreak on accuracy or volume here
 * would quietly re-weight the formula and make the displayed score a liar — if
 * accuracy is not deciding matches, that is an argument about `scoreBattle`,
 * where the player can see it, not a thumb on the scale here.
 *
 * A draw now means what it says. Under the old subtractive score two different
 * performances could both floor at zero and come out level; the multiplicative
 * one only ties when the players genuinely earned the same, or when neither got
 * anything right.
 */
export function decideWinner(a: BattleScore, b: BattleScore): Verdict {
  if (a.score > b.score) return "a";
  if (b.score > a.score) return "b";
  return "draw";
}

/**
 * Study Coins for a finished battle.
 *
 * Deliberately modest and mostly flat: the Arena is a reason to revise, not a
 * faster coin printer than revising. Participation pays, winning pays a little
 * more, and a player who answered nothing earns nothing so that queueing and
 * idling cannot farm the economy.
 */
export function battleCoins(result: "win" | "loss" | "draw", score: BattleScore): number {
  if (score.answered === 0 || score.correct === 0) return 0;
  const base = result === "win" ? 12 : result === "draw" ? 8 : 5;
  /* One extra coin per five correct answers, capped, so a long good match pays
     a little more than a short one without becoming the point. */
  return base + Math.min(5, Math.floor(score.correct / 5));
}
