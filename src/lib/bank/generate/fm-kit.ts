/**
 * Shared helpers for the A-Level Further Maths generators.
 *
 * Further Maths splits across a handful of files by topic; the pieces they all
 * need — the two curriculum levels, a recall-question builder, and the
 * formatting of complex numbers, matrices and 3-D vectors — live here so each
 * file stays about its own subject.
 *
 * Notation, applied once here so it is consistent across the bank:
 *   - complex numbers as `a + bi`  (no `1i`, no `+ -`, a real answer as just `a`)
 *   - 2×2 matrices as `[[a, b], [c, d]]`
 *   - 3-D vectors as `(a, b, c)`
 *   - arguments as an exact multiple of π, e.g. `π/4`, `-3π/4`, `π`
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { gcd } from "./rational";

export const Y10 = "YEAR_10" as const;
export const Y11 = "YEAR_11" as const;
export const Y12 = "YEAR_12" as const;
export const Y13 = "YEAR_13" as const;

type FmLevel = typeof Y10 | typeof Y11 | typeof Y12 | typeof Y13;

export interface RecallCase {
  q: string;
  a: string;
  wrong: readonly string[];
  why: string;
}

export function recall(opts: {
  key: string;
  topic: string;
  subtopic: string;
  level?: FmLevel;
  difficulty?: number;
  cases: readonly RecallCase[];
}): Generator {
  return generator({
    key: opts.key,
    subject: "further-maths",
    topic: opts.topic,
    subtopic: opts.subtopic,
    curriculumLevel: opts.level ?? Y13,
    difficulty: opts.difficulty ?? 6,
    variants: opts.cases.length,
    build: (_rng, index) => {
      const c = opts.cases[index % opts.cases.length];
      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  });
}

/* ==========================================================================
   Complex numbers
   ========================================================================== */

/** `a + bi` with the house conventions. */
export function cplx(re: number, im: number): string {
  if (im === 0) return String(re);
  const mag = Math.abs(im);
  const imPart = mag === 1 ? "i" : `${mag}i`;
  if (re === 0) return im < 0 ? `-${imPart}` : imPart;
  return `${re} ${im < 0 ? "-" : "+"} ${imPart}`;
}

export interface Complex {
  re: number;
  im: number;
}

export const C = {
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  /** Integer-only division: assumes b divides a exactly in the Gaussian integers. */
  div: (a: Complex, b: Complex): Complex => {
    const denom = b.re * b.re + b.im * b.im;
    return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
  },
  pow: (a: Complex, n: number): Complex => {
    let acc: Complex = { re: 1, im: 0 };
    for (let i = 0; i < n; i++) acc = C.mul(acc, a);
    return acc;
  },
  eq: (a: Complex, b: Complex): boolean => a.re === b.re && a.im === b.im,
  str: (a: Complex): string => cplx(a.re, a.im),
};

/** An argument as an exact multiple of π: `atanPi(1, 1)` → "π/4". a, b in {-1,0,1}·k. */
export function argPi(re: number, im: number): string {
  /* Reduce to the sign pattern; only the eight multiples of π/4 are produced. */
  const sx = Math.sign(re);
  const sy = Math.sign(im);
  const map: Record<string, string> = {
    "1,0": "0",
    "1,1": "π/4",
    "0,1": "π/2",
    "-1,1": "3π/4",
    "-1,0": "π",
    "-1,-1": "-3π/4",
    "0,-1": "-π/2",
    "1,-1": "-π/4",
  };
  return map[`${sx},${sy}`] ?? "0";
}

/* ==========================================================================
   Matrices (2×2)
   ========================================================================== */

export type Mat2 = [[number, number], [number, number]];

export const M = {
  str: (m: Mat2): string => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`,
  mul: (a: Mat2, b: Mat2): Mat2 => [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ],
  det: (m: Mat2): number => m[0][0] * m[1][1] - m[0][1] * m[1][0],
  eq: (a: Mat2, b: Mat2): boolean =>
    a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1],
};

/** `2/6` → `1/3`, `4/2` → `2`, `-3/9` → `-1/3`. */
export function fraction(numerator: number, denominator: number): string {
  if (denominator === 0) return "undefined";
  let n = numerator;
  let d = denominator;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(Math.abs(n), d) || 1;
  n /= g;
  d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

/* ==========================================================================
   3-D vectors
   ========================================================================== */

export type Vec3 = [number, number, number];

export const V = {
  str: (v: Vec3): string => `(${v[0]}, ${v[1]}, ${v[2]})`,
  dot: (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  sub: (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  eq: (a: Vec3, b: Vec3): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2],
};

/** `√n` in lowest terms: `rootString(12)` → "2√3", `rootString(9)` → "3", `rootString(7)` → "√7". */
export function rootString(n: number): string {
  if (n < 0) return "undefined";
  if (n === 0) return "0";
  let outside = 1;
  let inside = n;
  for (let f = 2; f * f <= inside; f++) {
    while (inside % (f * f) === 0) {
      inside /= f * f;
      outside *= f;
    }
  }
  if (inside === 1) return String(outside);
  return outside === 1 ? `√${inside}` : `${outside}√${inside}`;
}
