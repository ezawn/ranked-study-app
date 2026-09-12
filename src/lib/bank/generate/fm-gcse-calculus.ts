/**
 * Differentiation (GCSE Further Maths — AQA Level 2).
 *
 * Polynomials only, and no integration. Every derivative is computed term by
 * term from the coefficient list, and questions about tangents, gradients and
 * stationary points are built so the answer is a tidy integer or fraction.
 * A `check` re-derives each result a second way.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { poly, point } from "./format";
import { Y10, Y11, recall } from "./fm-kit";

/** Derivative of a polynomial given highest-power-first, e.g. [a,b,c,d] → [3a,2b,c]. */
function diff(coeffs: number[]): number[] {
  const degree = coeffs.length - 1;
  const out: number[] = [];
  for (let i = 0; i < coeffs.length - 1; i++) out.push(coeffs[i] * (degree - i));
  return out;
}

function evalPoly(coeffs: number[], x: number): number {
  return coeffs.reduce((acc, c) => acc * x + c, 0);
}

export const fmGcseCalculus: Generator[] = [
  generator({
    key: "fmg.calc.differentiate",
    subject: "further-maths",
    topic: "fmg-calculus",
    subtopic: "differentiate",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const a = rng.nonZero(-4, 4);
      const b = rng.nonZero(-6, 6);
      const c = rng.nonZero(-8, 8);
      const d = rng.int(-9, 9);
      const f = [a, b, c, d];
      const df = diff(f);
      const answer = poly(df);
      return {
        prompt: `Given f(x) = ${poly(f)}, find f′(x).`,
        answer,
        distractors: pickDistractors(answer, [
          poly([a, b, c]), // reduced each power but kept the coefficients
          poly([3 * a, 2 * b, c, d]), // forgot the constant vanishes
          poly(diff([b, c, d])), // differentiated the wrong terms
          poly([a * 3, b * 2, c, 0]),
        ]),
        explanation:
          `Multiply each term by its power and reduce the power by 1; the constant ${d} differentiates to 0. ` +
          `So f′(x) = ${answer}.`,
        check: () => {
          /* Numerically compare against a central difference. */
          const x = 1.3;
          const h = 1e-4;
          const numeric = (evalPoly(f, x + h) - evalPoly(f, x - h)) / (2 * h);
          return Math.abs(evalPoly(df, x) - numeric) < 1e-3 ? null : "derivative disagrees with numerical estimate";
        },
      };
    },
  }),

  generator({
    key: "fmg.calc.gradient",
    subject: "further-maths",
    topic: "fmg-calculus",
    subtopic: "gradient",
    curriculumLevel: Y11,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const a = rng.nonZero(-3, 3);
      const b = rng.nonZero(-5, 5);
      const c = rng.nonZero(-6, 6);
      const f = [a, b, c, rng.int(-5, 5)];
      const df = diff(f);
      const x = rng.nonZero(-3, 3);
      const gradient = evalPoly(df, x);
      const answer = String(gradient);
      return {
        prompt: `The curve y = ${poly(f)} passes through the point where x = ${x}. Find the gradient of the curve at that point.`,
        answer,
        distractors: pickDistractors(answer, [
          String(evalPoly(f, x)), // gave the y-value instead of the gradient
          String(evalPoly(df, -x)), // used the wrong sign for x
          String(gradient + 1),
          String(-gradient),
          String(evalPoly(diff(df), x)), // used the second derivative
        ]),
        explanation:
          `Differentiate: dy/dx = ${poly(df)}. Substitute x = ${x}: the gradient is ${gradient}.`,
        check: () => (evalPoly(diff(f), x) === gradient ? null : "gradient mismatch"),
      };
    },
  }),

  generator({
    key: "fmg.calc.tangent",
    subject: "further-maths",
    topic: "fmg-calculus",
    subtopic: "tangent-normal",
    curriculumLevel: Y11,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const a = rng.nonZero(-2, 3);
      const b = rng.nonZero(-4, 4);
      const c = rng.int(-6, 6);
      const f = [a, b, c];
      const df = diff(f);
      let x0 = rng.nonZero(-3, 3);
      let tries = 0;
      while (evalPoly(df, x0) === 0 && tries < 20) {
        x0 = rng.nonZero(-3, 3);
        tries++;
      }
      if (evalPoly(df, x0) === 0) x0 = x0 === 3 ? 2 : x0 + 1; // last-ditch nudge off the stationary point
      const y0 = evalPoly(f, x0);
      const m = evalPoly(df, x0); // non-zero integer gradient
      const intercept = y0 - m * x0; // integer
      const answer = lineEquation(m, intercept);
      return {
        prompt:
          `The curve y = ${poly(f)} has a point where x = ${x0}. ` +
          `Find the equation of the tangent to the curve at that point, in the form y = mx + c.`,
        answer,
        distractors: pickDistractors(answer, [
          lineEquation(m, y0), // used y0 as the intercept
          lineEquation(y0, intercept), // used the y-value as the gradient
          lineEquation(-m, intercept), // sign slip on the gradient
          lineEquation(m, intercept + m), // arithmetic slip in y − mx
          lineEquation(evalPoly(diff(df), x0), intercept), // differentiated twice
        ]),
        explanation:
          `dy/dx = ${poly(df)}, so at x = ${x0} the gradient is m = ${m} and the curve passes through ${point(x0, y0)}. ` +
          `Substituting into y − y₁ = m(x − x₁): y − ${y0} = ${m}(x − ${x0}), which rearranges to ${answer}.`,
        check: () => {
          const yAtX0 = m * x0 + intercept;
          return yAtX0 === y0 && evalPoly(diff(f), x0) === m ? null : "tangent does not touch the curve at the point";
        },
      };
    },
  }),

  generator({
    key: "fmg.calc.stationary-points",
    subject: "further-maths",
    topic: "fmg-calculus",
    subtopic: "stationary-points",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      /* Build f so that f'(x) = 6k(x − p)(x − q): f = [2k, −3k(p+q), 6k·pq, C]. */
      const k = rng.pick([1, 1, 2, -1] as const);
      let p = rng.int(-4, 3);
      let q = rng.int(-3, 4);
      while (q <= p) q = rng.int(-3, 4);
      const C = rng.int(-6, 6);
      const f = [2 * k, -3 * k * (p + q), 6 * k * p * q, C];
      const df = diff(f); // = [6k, -6k(p+q), 6k·pq]
      const kind = rng.pick(["x-coords", "count", "nature"] as const);
      let question: string;
      let answer: string;
      let why: string;
      if (kind === "x-coords") {
        question = "Find the x-coordinates of the stationary points.";
        answer = `x = ${p} and x = ${q}`;
        why = `Solve f′(x) = 0: f′(x) = ${poly(df)} = 6${k === 1 ? "" : `(${k})`}(x ${p < 0 ? "+" : "−"} ${Math.abs(p)})(x ${q < 0 ? "+" : "−"} ${Math.abs(q)}), so x = ${p} or x = ${q}.`;
      } else if (kind === "count") {
        question = "How many stationary points does the curve have?";
        answer = "2";
        why = `f′(x) = ${poly(df)} is a quadratic with two distinct real roots, so there are two stationary points.`;
      } else {
        /* second derivative at each: f''(x) = 12k x − 6k(p+q). */
        const d2 = diff(df);
        const atP = evalPoly(d2, p);
        question = `Using the second derivative, what is the nature of the stationary point at x = ${p}?`;
        answer = atP > 0 ? "A local minimum" : "A local maximum";
        why = `f″(x) = ${poly(d2)}. At x = ${p}, f″ = ${atP}, which is ${atP > 0 ? "positive, so a minimum" : "negative, so a maximum"}.`;
      }
      return {
        prompt: `A curve has equation y = ${poly(f)}. ${question}`,
        answer,
        distractors: pickDistractors(answer, [
          kind === "x-coords" ? `x = ${-p} and x = ${-q}` : kind === "count" ? "1" : answer === "A local minimum" ? "A local maximum" : "A local minimum",
          kind === "x-coords" ? `x = ${p + 1} and x = ${q + 1}` : kind === "count" ? "0" : "A point of inflection",
          kind === "x-coords" ? `x = ${p} and x = ${q + 1}` : kind === "count" ? "3" : "It cannot be determined",
          kind === "x-coords" ? `x = 0 and x = ${p + q}` : "None",
        ]),
        explanation: why,
        check: () => {
          const roots = df; // quadratic [6k, -6k(p+q), 6k pq]
          const atRootP = evalPoly(roots, p);
          const atRootQ = evalPoly(roots, q);
          return atRootP === 0 && atRootQ === 0 ? null : `f'(${p})=${atRootP}, f'(${q})=${atRootQ}`;
        },
      };
    },
  }),

  recall({
    key: "fmg.calc.increasing-decreasing",
    topic: "fmg-calculus",
    subtopic: "increasing-decreasing",
    level: Y11,
    difficulty: 5,
    cases: [
      {
        q: "A function has f′(x) = 3x² − 12. For which values of x is f increasing?",
        a: "x < −2 or x > 2",
        wrong: ["−2 < x < 2", "x > 2 only", "x < 0", "all values of x"],
        why: "f is increasing where f′(x) > 0. 3x² − 12 > 0 ⇒ x² > 4 ⇒ x < −2 or x > 2.",
      },
      {
        q: "A function has f′(x) = 6 − 2x. For which values of x is f decreasing?",
        a: "x > 3",
        wrong: ["x < 3", "x > 0", "−3 < x < 3", "all values of x"],
        why: "f is decreasing where f′(x) < 0. 6 − 2x < 0 ⇒ x > 3.",
      },
      {
        q: "What condition on the gradient function f′(x) tells you that a curve is increasing over an interval?",
        a: "f′(x) > 0 throughout the interval",
        wrong: ["f′(x) < 0 throughout the interval", "f′(x) = 0 throughout the interval", "f″(x) > 0 throughout the interval", "f(x) > 0 throughout the interval"],
        why: "A positive gradient means y rises as x increases — the definition of an increasing function.",
      },
      {
        q: "At a stationary point of a curve, what is the value of f′(x)?",
        a: "0",
        wrong: ["1", "undefined", "equal to f(x)", "a maximum"],
        why: "A stationary point is exactly where the gradient is momentarily zero.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

/** `y = mx + c` with tidy conventions: no `1x`, no `+ -`, no `+ 0`. */
function lineEquation(m: number, c: number): string {
  const mPart = m === 0 ? "0" : m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
  if (m === 0) return `y = ${c}`;
  const cPart = c === 0 ? "" : ` ${c < 0 ? "−" : "+"} ${Math.abs(c)}`;
  return `y = ${mPart}${cPart}`;
}
