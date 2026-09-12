/**
 * Further algebra (GCSE Further Maths — AQA Level 2).
 *
 * Simplifying algebraic fractions, completing the square, the factor theorem,
 * dividing a cubic by a linear factor, solving cubics, and surd manipulation.
 * Every question is built from known factors or a chosen completed form, so the
 * answer is exact, and a `check` re-derives it.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { poly } from "./format";
import { Y10, Y11, recall } from "./fm-kit";

/** (x + r) as a bracket string, e.g. r = -3 → "(x − 3)", r = 2 → "(x + 2)". */
function linear(r: number): string {
  return `(x ${r < 0 ? "−" : "+"} ${Math.abs(r)})`;
}

/** Expand (x + p)(x + q) → coefficients [1, p+q, pq]. */
function expandPair(p: number, q: number): number[] {
  return [1, p + q, p * q];
}

/** Evaluate a coefficient list (highest power first) at x. */
function evalPoly(coeffs: number[], x: number): number {
  return coeffs.reduce((acc, c) => acc * x + c, 0);
}

export const fmGcseAlgebra: Generator[] = [
  generator({
    key: "fmg.alg.simplify-fraction",
    subject: "further-maths",
    topic: "fmg-algebra",
    subtopic: "algebraic-fractions",
    curriculumLevel: Y10,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      /* (x + a)(x + shared) / (x + b)(x + shared) → (x + a)/(x + b). */
      const a = rng.nonZero(-5, 5);
      let b = rng.nonZero(-5, 5);
      while (b === a) b = rng.nonZero(-5, 5);
      let shared = rng.nonZero(-6, 6);
      while (shared === a || shared === b) shared = rng.nonZero(-6, 6);
      const numer = expandPair(a, shared);
      const denom = expandPair(b, shared);
      const answer = `${linear(a)} / ${linear(b)}`;
      return {
        prompt: `Simplify fully:  (${poly(numer)}) / (${poly(denom)}).`,
        answer,
        distractors: pickDistractors(answer, [
          `${linear(b)} / ${linear(a)}`, // inverted
          `${linear(a)} / ${linear(shared)}`, // cancelled the wrong factor
          `${linear(shared)} / ${linear(b)}`,
          `${poly(numer)} / ${poly(denom)}`, // did not factorise
          `${linear(a - b)}`,
        ]),
        explanation:
          `Factorise top and bottom: numerator = ${linear(a)}${linear(shared)}, denominator = ${linear(b)}${linear(shared)}. ` +
          `The ${linear(shared)} factor cancels, leaving ${answer}.`,
        check: () => {
          /* At a test value, (x+a)/(x+b) should equal numer/denom. */
          const x = 7;
          const lhs = (x + a) / (x + b);
          const rhs = evalPoly(numer, x) / evalPoly(denom, x);
          return Math.abs(lhs - rhs) < 1e-9 ? null : "fraction simplification mismatch";
        },
      };
    },
  }),

  generator({
    key: "fmg.alg.complete-square",
    subject: "further-maths",
    topic: "fmg-algebra",
    subtopic: "completing-the-square",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      /* Non-unit leading coefficient: a(x + p)² + q = a x² + 2ap x + (a p² + q). */
      const a = rng.pick([2, 3, -1, -2, 4] as const);
      const p = rng.nonZero(-4, 4);
      const q = rng.int(-9, 9);
      const b = 2 * a * p;
      const c = a * p * p + q;
      const aPart = a === -1 ? "-" : `${a}`;
      const answer = `${aPart}(x ${p < 0 ? "−" : "+"} ${Math.abs(p)})² ${q < 0 ? "−" : "+"} ${Math.abs(q)}`;
      return {
        prompt: `Write ${poly([a, b, c])} in the form a(x + p)² + q.`,
        answer,
        distractors: pickDistractors(answer, [
          `${aPart}(x ${p < 0 ? "−" : "+"} ${Math.abs(p)})² ${c < 0 ? "−" : "+"} ${Math.abs(c)}`, // forgot to subtract ap²
          `(x ${p < 0 ? "−" : "+"} ${Math.abs(p)})² ${q < 0 ? "−" : "+"} ${Math.abs(q)}`, // dropped the factor a
          `${aPart}(x ${p < 0 ? "+" : "−"} ${Math.abs(p)})² ${q < 0 ? "−" : "+"} ${Math.abs(q)}`, // wrong sign on p
          `${aPart}(x ${b < 0 ? "−" : "+"} ${Math.abs(b)})² ${q < 0 ? "−" : "+"} ${Math.abs(q)}`,
        ]),
        explanation:
          `First take out the factor ${a}: ${a}(x² ${b / a < 0 ? "−" : "+"} ${Math.abs(b / a)}x) ${c < 0 ? "−" : "+"} ${Math.abs(c)}. ` +
          `Complete the square inside the bracket with p = ${b / a}/2 = ${p}, then multiply out and adjust the constant to reach q = ${q}. ` +
          `Answer: ${answer}.`,
        check: () => {
          const expanded = [a, 2 * a * p, a * p * p + q];
          return expanded[1] === b && expanded[2] === c ? null : "completed square does not expand back";
        },
      };
    },
  }),

  generator({
    key: "fmg.alg.factor-theorem",
    subject: "further-maths",
    topic: "fmg-algebra",
    subtopic: "factor-theorem",
    curriculumLevel: Y11,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      /* Cubic with roots r1, r2, r3. */
      const r1 = rng.nonZero(-3, 3);
      let r2 = rng.nonZero(-3, 3);
      while (r2 === r1) r2 = rng.nonZero(-3, 3);
      let r3 = rng.nonZero(-4, 4);
      while (r3 === r1 || r3 === r2) r3 = rng.nonZero(-4, 4);
      const b = -(r1 + r2 + r3);
      const c = r1 * r2 + r1 * r3 + r2 * r3;
      const d = -(r1 * r2 * r3);
      const f = [1, b, c, d];
      /* Candidates: the real factor (x − r1) plus three non-factors. */
      const options = new Set<number>([r1]);
      while (options.size < 4) {
        const cand = rng.nonZero(-4, 4);
        if (!options.has(cand) && evalPoly(f, cand) !== 0) options.add(cand);
      }
      const answer = linear(r1);
      return {
        prompt: `Use the factor theorem to decide which of these is a factor of f(x) = ${poly(f)}.`,
        answer,
        distractors: pickDistractors(
          answer,
          [...options].filter((r) => r !== r1).map(linear),
        ),
        explanation:
          `A linear expression (x − k) is a factor of f(x) exactly when f(k) = 0. ` +
          `Here f(${r1}) = 0, so ${answer} is a factor; the others give a non-zero value.`,
        check: () => {
          if (evalPoly(f, r1) !== 0) return `f(${r1}) = ${evalPoly(f, r1)}, not 0`;
          for (const r of options) if (r !== r1 && evalPoly(f, r) === 0) return `${linear(r)} is also a factor`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "fmg.alg.polynomial-division",
    subject: "further-maths",
    topic: "fmg-algebra",
    subtopic: "polynomial-division",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      const k = rng.nonZero(-3, 3); // divide by (x − k)
      const s = rng.nonZero(-4, 4); // quotient is x² + sx + t
      const t = rng.nonZero(-6, 6);
      /* f(x) = (x − k)(x² + sx + t). */
      const f = [
        1,
        s - k,
        t - k * s,
        -k * t,
      ];
      const answer = poly([1, s, t]);
      return {
        prompt: `Divide ${poly(f)} by (x ${k < 0 ? "+" : "−"} ${Math.abs(k)}).`,
        answer,
        distractors: pickDistractors(answer, [
          poly([1, s + k, t]), // sign error carried through the division
          poly([1, s, -t]),
          poly([1, -s, t]),
          poly([1, s - k, t - k * s]), // stopped early / gave two of f's coefficients
          poly([1, s, t + k]),
        ]),
        explanation:
          `Because (x ${k < 0 ? "+" : "−"} ${Math.abs(k)}) divides ${poly(f)} exactly, the quotient is a quadratic. ` +
          `Algebraic (or synthetic) division gives ${answer}; you can check by expanding (x ${k < 0 ? "+" : "−"} ${Math.abs(k)})(${answer}).`,
        check: () => {
          /* (x − k)(quotient) must expand to f. */
          const quo = [1, s, t];
          const prod = [
            quo[0],
            quo[1] - k * quo[0],
            quo[2] - k * quo[1],
            -k * quo[2],
          ];
          return prod.every((v, i) => v === f[i]) ? null : "quotient does not multiply back to f";
        },
      };
    },
  }),

  generator({
    key: "fmg.alg.solve-cubic",
    subject: "further-maths",
    topic: "fmg-algebra",
    subtopic: "cubics",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      const r1 = rng.nonZero(-3, 3);
      let r2 = rng.nonZero(-4, 4);
      while (r2 === r1) r2 = rng.nonZero(-4, 4);
      let r3 = rng.nonZero(-4, 4);
      while (r3 === r1 || r3 === r2) r3 = rng.nonZero(-4, 4);
      const b = -(r1 + r2 + r3);
      const c = r1 * r2 + r1 * r3 + r2 * r3;
      const d = -(r1 * r2 * r3);
      const f = [1, b, c, d];
      const roots = [r1, r2, r3].sort((x, y) => x - y);
      const answer = `x = ${roots[0]}, x = ${roots[1]} or x = ${roots[2]}`;
      return {
        prompt: `Given that (x ${r1 < 0 ? "+" : "−"} ${Math.abs(r1)}) is a factor of ${poly(f)}, solve ${poly(f)} = 0.`,
        answer,
        distractors: pickDistractors(answer, [
          `x = ${-roots[0]}, x = ${-roots[1]} or x = ${-roots[2]}`, // sign confusion between factor and root
          `x = ${roots[0]}, x = ${roots[1]} or x = ${roots[2] + 1}`,
          `x = ${roots[0]} only`,
          `x = ${b}, x = ${c} or x = ${d}`, // read off the coefficients
          `x = ${roots[0] + 1}, x = ${roots[1] + 1} or x = ${roots[2] + 1}`,
        ]),
        explanation:
          `Dividing by the known factor gives a quadratic, which factorises to give the other two roots. ` +
          `The solutions are ${answer}.`,
        check: () => {
          for (const r of roots) if (evalPoly(f, r) !== 0) return `x = ${r} gives ${evalPoly(f, r)}, not 0`;
          return null;
        },
      };
    },
  }),

  recall({
    key: "fmg.alg.surds",
    topic: "fmg-algebra",
    subtopic: "surds",
    level: Y10,
    difficulty: 4,
    cases: [
      {
        q: "Rationalise the denominator of 1 / (3 + √5).",
        a: "(3 − √5) / 4",
        wrong: ["(3 + √5) / 4", "(3 − √5) / 14", "(√5 − 3) / 4", "(3 − √5) / (3 + √5)"],
        why: "Multiply top and bottom by the conjugate 3 − √5. The denominator becomes 3² − 5 = 4.",
      },
      {
        q: "Simplify (2 + √3)(2 − √3).",
        a: "1",
        wrong: ["4 − √3", "7", "4 + 3", "1 + 4√3"],
        why: "This is a difference of two squares: 2² − (√3)² = 4 − 3 = 1.",
      },
      {
        q: "Write √50 + √8 as a single surd in the form k√2.",
        a: "7√2",
        wrong: ["√58", "12√2", "9√2", "58√2"],
        why: "√50 = 5√2 and √8 = 2√2, so the sum is (5 + 2)√2 = 7√2.",
      },
      {
        q: "Rationalise the denominator of 6 / √3.",
        a: "2√3",
        wrong: ["6√3", "3√3", "√18", "√2"],
        why: "Multiply top and bottom by √3: 6√3 / 3 = 2√3.",
      },
      {
        q: "Expand and simplify (1 + √2)².",
        a: "3 + 2√2",
        wrong: ["1 + 2", "3 + √2", "1 + 2√2", "5 + 2√2"],
        why: "(1 + √2)² = 1 + 2√2 + (√2)² = 1 + 2√2 + 2 = 3 + 2√2.",
      },
    ],
  }),
];
