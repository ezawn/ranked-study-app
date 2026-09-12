/**
 * Exact rational arithmetic.
 *
 * Every generated question's answer is computed rather than written down, which
 * only helps if the computation is right. Floating point is not right: 0.1 + 0.2
 * is 0.30000000000000004, and a generator that solves 10x = 3 in doubles will
 * confidently produce the answer 0.30000000000000004 and three distractors
 * around it. A bank built that way is worse than no bank, because the errors
 * are invisible until a student loses a mark to one.
 *
 * So the generators work in exact fractions and only convert to a decimal
 * deliberately, at the end, where a decimal is what the question asks for.
 *
 * Numerators and denominators are plain numbers rather than BigInt. Every
 * generator here works with small integers by construction — coefficients under
 * a hundred, results under a few thousand — and `assertSafe` fails loudly if a
 * calculation ever leaves that range, rather than silently losing precision the
 * way a double would past 2^53.
 */

export class Rational {
  readonly n: number;
  readonly d: number;

  private constructor(n: number, d: number) {
    this.n = n;
    this.d = d;
  }

  static of(numerator: number, denominator = 1): Rational {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      throw new Error(`Rational needs integers, got ${numerator}/${denominator}`);
    }
    if (denominator === 0) throw new Error("Rational with zero denominator");

    assertSafe(numerator);
    assertSafe(denominator);

    /* Sign always lives on the numerator, so equality and formatting never have
       to consider -1/2 and 1/-2 as different numbers. */
    const sign = denominator < 0 ? -1 : 1;
    const n = numerator * sign;
    const d = denominator * sign;
    const g = gcd(Math.abs(n), d) || 1;

    return new Rational(n / g, d / g);
  }

  static readonly ZERO = Rational.of(0);
  static readonly ONE = Rational.of(1);

  add(other: Rational): Rational {
    return Rational.of(this.n * other.d + other.n * this.d, this.d * other.d);
  }

  sub(other: Rational): Rational {
    return Rational.of(this.n * other.d - other.n * this.d, this.d * other.d);
  }

  mul(other: Rational): Rational {
    return Rational.of(this.n * other.n, this.d * other.d);
  }

  div(other: Rational): Rational {
    if (other.n === 0) throw new Error("Division by zero");
    return Rational.of(this.n * other.d, this.d * other.n);
  }

  neg(): Rational {
    return Rational.of(-this.n, this.d);
  }

  pow(exponent: number): Rational {
    if (!Number.isInteger(exponent)) throw new Error("Rational.pow needs an integer exponent");
    if (exponent < 0) return Rational.ONE.div(this.pow(-exponent));
    return Rational.of(Math.pow(this.n, exponent), Math.pow(this.d, exponent));
  }

  get isInteger(): boolean {
    return this.d === 1;
  }

  get isZero(): boolean {
    return this.n === 0;
  }

  get sign(): -1 | 0 | 1 {
    return this.n === 0 ? 0 : this.n > 0 ? 1 : -1;
  }

  abs(): Rational {
    return this.n < 0 ? this.neg() : this;
  }

  equals(other: Rational): boolean {
    return this.n === other.n && this.d === other.d;
  }

  compare(other: Rational): number {
    return this.n * other.d - other.n * this.d;
  }

  toNumber(): number {
    return this.n / this.d;
  }

  /** `3`, `-5`, `2/3`, `-7/4`. Improper fractions stay improper — that is the form a mark scheme wants. */
  toString(): string {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }

  /**
   * A decimal, rounded, with trailing zeros trimmed.
   *
   * Used only where the question explicitly asks for a decimal — a
   * probability to 3 significant figures, a length to 1 d.p. Anywhere the
   * answer is exact, `toString` is the honest form.
   */
  toDecimal(places: number): string {
    return trimZeros(this.toNumber().toFixed(places));
  }
}

export function rat(numerator: number, denominator = 1): Rational {
  return Rational.of(numerator, denominator);
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Guard against the range where doubles stop being exact on integers.
 *
 * Nothing here should come close; if something does, that is a generator bug
 * worth a crash rather than a wrong answer in the bank.
 */
export function assertSafe(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Integer arithmetic left the exact range: ${value}`);
  }
}

/** `1.500` → `1.5`, `2.000` → `2`. */
export function trimZeros(text: string): string {
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

/** Round to n significant figures, as a trimmed string. */
export function toSigFigs(value: number, figures: number): string {
  if (value === 0) return "0";
  const rounded = Number(value.toPrecision(figures));
  return trimZeros(
    Math.abs(rounded) >= 1e-4 && Math.abs(rounded) < 1e10 ? String(rounded) : rounded.toExponential(),
  );
}

/** Round to n decimal places, as a trimmed string. */
export function toPlaces(value: number, places: number): string {
  /* `-0` formats as "-0", which is never the answer anybody wants. */
  const fixed = (value + 0).toFixed(places);
  return trimZeros(fixed === (-0).toFixed(places) ? (0).toFixed(places) : fixed);
}

/* ==========================================================================
   Surds
   ========================================================================== */

/**
 * A surd in the form `coefficient * sqrt(radicand)`, always fully simplified.
 *
 * Surds are their own topic at GCSE and A-Level and the answers are exact, so
 * they get an exact representation rather than a decimal. `simplifySurd(72)`
 * gives 6√2 because 72 = 36 × 2 — computed by pulling out square factors, not
 * by a lookup table that could be wrong.
 */
export interface Surd {
  coefficient: number;
  radicand: number;
}

export function simplifySurd(radicand: number, coefficient = 1): Surd {
  if (radicand < 0) throw new Error("simplifySurd does not handle negative radicands");
  if (radicand === 0) return { coefficient: 0, radicand: 1 };

  let outside = coefficient;
  let inside = radicand;

  for (let factor = 2; factor * factor <= inside; factor++) {
    const square = factor * factor;
    while (inside % square === 0) {
      inside /= square;
      outside *= factor;
    }
  }

  return { coefficient: outside, radicand: inside };
}

export function surdToString(surd: Surd): string {
  const { coefficient, radicand } = surd;
  if (radicand === 1) return String(coefficient);
  if (coefficient === 0) return "0";
  if (coefficient === 1) return `√${radicand}`;
  if (coefficient === -1) return `-√${radicand}`;
  return `${coefficient}√${radicand}`;
}

/** Is n a perfect square? Used to decide whether an answer is exact or a surd. */
export function isPerfectSquare(n: number): boolean {
  if (n < 0) return false;
  const root = Math.round(Math.sqrt(n));
  return root * root === n;
}
