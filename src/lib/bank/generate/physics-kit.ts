/**
 * Physics helpers.
 *
 * Maths has `Rational` to keep its answers exact. Physics needs the same
 * guarantee for a different reason: every question a battle serves has to be
 * doable in the head, and a physics generator that picks a mass of 7 kg and a
 * force of 12 N produces an acceleration of 1.714285... — a keypad answer, and
 * one nobody would set in a non-calculator paper.
 *
 * So the arithmetic here refuses to produce one. `exact()` throws at build time
 * if a value is not a round number, which turns "I hope these parameters divide
 * nicely" into a property the test harness checks over every variant of every
 * generator. The right way to use it is to CHOOSE THE ANSWER FIRST and work
 * backwards to the parameters — pick a = 3 and m = 4, then state F = 12 — which
 * is the same discipline the maths generators use and the reason their answers
 * cannot be wrong.
 *
 * Constants are quoted in the question rather than assumed. Boards differ on
 * whether g is 9.8, 9.81 or 10, and a student who used a different one is not
 * wrong. Saying "take g = 10 N/kg" in the prompt removes the argument and keeps
 * the arithmetic clean.
 */

/* ==========================================================================
   Constants, as they should be quoted
   ========================================================================== */

/** Gravitational field strength at GCSE. Quoted in the prompt, always. */
export const G_GCSE = 10;

/** The A-Level value. Still quoted, and still chosen to divide cleanly. */
export const G_ALEVEL = 9.8;

export const CONSTANTS = {
  /** Speed of light, m/s. */
  c: 3e8,
  /** Planck constant, J s. */
  h: 6.6e-34,
  /** Elementary charge, C. */
  e: 1.6e-19,
  /** Electron mass, kg. */
  me: 9.1e-31,
  /** Molar gas constant, J/mol/K. */
  R: 8.31,
  /** Boltzmann constant, J/K. */
  k: 1.38e-23,
  /** Gravitational constant, N m²/kg². */
  G: 6.67e-11,
  /** Coulomb constant, N m²/C². */
  ke: 9e9,
  /** Avogadro constant, /mol. */
  NA: 6.02e23,
  /** Atomic mass unit, kg. */
  u: 1.66e-27,
} as const;

/* ==========================================================================
   Keeping the arithmetic honest
   ========================================================================== */

export class NotExact extends Error {}

/**
 * Assert a value is clean enough to be a non-calculator answer.
 *
 * `places` is how many decimal places the answer is allowed. Zero means a whole
 * number. Anything that does not land on that grid throws, because it means the
 * generator picked parameters that do not work out and the question would have
 * shipped with a keypad answer.
 */
export function exact(value: number, places = 0, what = "value"): number {
  if (!Number.isFinite(value)) throw new NotExact(`${what} is not finite`);
  const scale = Math.pow(10, places);
  const rounded = Math.round(value * scale) / scale;
  if (Math.abs(value - rounded) > 1e-9 * Math.max(1, Math.abs(value))) {
    throw new NotExact(`${what} = ${value} is not exact to ${places} dp`);
  }
  return rounded;
}

/** Divide, insisting the result is clean. */
export function exactDiv(numerator: number, denominator: number, places = 0): number {
  if (denominator === 0) throw new NotExact("division by zero");
  return exact(numerator / denominator, places, `${numerator}/${denominator}`);
}

/** The positive square root, insisting it is exact. */
export function exactSqrt(value: number, places = 0): number {
  if (value < 0) throw new NotExact(`sqrt of negative ${value}`);
  return exact(Math.sqrt(value), places, `sqrt(${value})`);
}

/** Whole-number square roots, for picking parameters that work backwards. */
export const SQUARES = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400];

/* ==========================================================================
   Formatting
   ========================================================================== */

/** Trim a float to its shortest exact representation: 4.50 → "4.5", 7.0 → "7". */
export function num(value: number): string {
  if (Object.is(value, -0)) return "0";
  const text = Number(value.toPrecision(12)).toString();
  return text;
}

/** A quantity with its unit: `qty(9, "m/s²")` → "9 m/s²". */
export function qty(value: number, unit: string): string {
  return unit ? `${num(value)} ${unit}` : num(value);
}

/** Superscript digits, for units and powers. */
const SUPERS: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻", "+": "⁺",
};

export function sup(value: number | string): string {
  return String(value)
    .split("")
    .map((ch) => SUPERS[ch] ?? ch)
    .join("");
}

/**
 * Standard form, as a student would write it: `sf(3, 8, "m/s")` → "3 × 10⁸ m/s".
 *
 * The mantissa is kept to whole or one-decimal values on purpose. A question
 * whose answer is 6.626 × 10⁻³⁴ is a calculator question however it is phrased.
 */
export function sf(mantissa: number, exponent: number, unit = ""): string {
  const body = exponent === 0 ? num(mantissa) : `${num(mantissa)} × 10${sup(exponent)}`;
  return unit ? `${body} ${unit}` : body;
}

/** Split a number into a mantissa in [1, 10) and an exponent. */
export function toStandardForm(value: number): { mantissa: number; exponent: number } {
  if (value === 0) return { mantissa: 0, exponent: 0 };
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = Number((value / Math.pow(10, exponent)).toPrecision(12));
  return { mantissa, exponent };
}

/** A fraction of a whole, as a percentage string, insisting it is clean. */
export function pct(value: number, places = 0): string {
  return `${num(exact(value, places, "percentage"))}%`;
}

/* ==========================================================================
   Distractors
   ========================================================================== */

/**
 * Distractors from named mistakes, deduplicated and stripped of the answer.
 *
 * A generator hands over the wrong values a student would actually arrive at —
 * forgot to square the speed, halved instead of doubled, used the diameter as
 * the radius. Anything equal to the right answer is dropped rather than shown,
 * because a question with two correct options is worse than one with three.
 */
export function wrongOptions(answer: string, candidates: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set([answer.trim()]);
  for (const candidate of candidates) {
    const text = candidate.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

/* ==========================================================================
   Units, written once
   ========================================================================== */

export const MS = "m/s";
export const MS2 = `m/s${sup(2)}`;
export const M2 = `m${sup(2)}`;
export const CM2 = `cm${sup(2)}`;
export const M3 = `m${sup(3)}`;
export const KGM3 = `kg/m${sup(3)}`;
export const NS = "N s";
export const KGMS = "kg m/s";
export const JKGK = "J/kg/°C";
export const JKG = "J/kg";
export const NM = "N m";
export const NKG = "N/kg";
export const RADS = "rad/s";

/* ==========================================================================
   Shared generator helpers
   ========================================================================== */

/**
 * A wrong value, written the way a student would write it after the mistake.
 *
 * Distractors come from real errors, and a real error does not land on a round
 * number — dividing where you should multiply gives 0.333… So the mistake is
 * computed honestly and then rounded to what someone would actually write down.
 * Non-finite results (a mistake that divides by zero) come back empty and are
 * dropped by `pickDistractors` rather than shown as "Infinity N".
 */
export function slip(value: number, unit: string, places = 2): string {
  if (!Number.isFinite(value)) return "";
  const size = Math.abs(value);
  if (size !== 0 && (size < 0.01 || size >= 1e5)) {
    const { mantissa, exponent } = toStandardForm(value);
    return sf(Number(mantissa.toFixed(2)), exponent, unit);
  }
  const scale = Math.pow(10, places);
  return qty(Math.round(value * scale) / scale, unit);
}

/** Agreement to floating-point tolerance, for the `check` hooks. */
export function agrees(a: number, b: number, tolerance = 1e-6): boolean {
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * An answer, in whichever form keeps it mental.
 *
 * Plain below 10⁵ and above 0.1; standard form outside that, where writing the
 * zeros out is what turns a one-line calculation into a transcription exercise.
 * Throws if the value is not clean to two decimal places, which is the same
 * line the bank audit draws — three or more is the signature of a keypad.
 */
export function answer(value: number, unit = ""): string {
  const size = Math.abs(value);
  if (size !== 0 && (size < 0.1 || size >= 1e5)) {
    const { mantissa, exponent } = toStandardForm(value);
    return sf(exact(mantissa, 2, "mantissa"), exponent, unit);
  }
  return qty(exact(value, 2, "value"), unit);
}

/** Would `answer` accept this number? The filter every parameter table uses. */
export function tidy(value: number): boolean {
  if (!Number.isFinite(value) || value === 0) return false;
  try {
    answer(value);
    return true;
  } catch {
    return false;
  }
}

/** Sentence-case a context phrase written to sit mid-sentence. */
export function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* Context words. Their only job is to widen the space of distinct prompts: a
   generator dealing 30 variants needs 30 genuinely different questions, and
   numbers alone run out faster than numbers crossed with subjects. */
export const MOVERS = [
  "cyclist", "runner", "tram", "drone", "go-kart", "ferry", "skateboarder",
  "delivery van", "rowing boat", "model train", "ice skater", "quad bike",
];
export const VEHICLES = ["car", "lorry", "motorbike", "coach", "tractor", "van", "train", "bus"];
export const OBJECTS = ["trolley", "crate", "sledge", "wooden block", "cart", "suitcase", "toy car", "sack of sand"];
export const FALLERS = ["skydiver", "parachutist", "hailstone", "steel ball", "raindrop", "seed pod"];
export const DROPPED = ["stone", "ball", "coin", "brick", "apple", "spanner", "marble"];
