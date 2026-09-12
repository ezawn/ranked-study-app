/**
 * Functions and graphs (GCSE Further Maths — AQA Level 2).
 *
 * Composite and inverse functions built from linear and simple quadratic
 * pieces so every answer is exact, plus graph-transformation questions where
 * the image of a labelled point is computed directly.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { poly, point } from "./format";
import { Y10, Y11, recall } from "./fm-kit";

export const fmGcseFunctions: Generator[] = [
  generator({
    key: "fmg.fn.composite",
    subject: "further-maths",
    topic: "fmg-functions",
    subtopic: "composite",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const a = rng.nonZero(-4, 4);
      const b = rng.nonZero(-6, 6);
      const c = rng.nonZero(-4, 4);
      const d = rng.nonZero(-6, 6);
      /* f(x) = ax + b, g(x) = cx + d. */
      const order = rng.bool(); // true: fg, false: gf
      const x = rng.nonZero(-4, 5);
      const inner = order ? c * x + d : a * x + b;
      const value = order ? a * inner + b : c * inner + d;
      const answer = String(value);
      return {
        prompt:
          `f(x) = ${poly([a, b])} and g(x) = ${poly([c, d])}. ` +
          `Work out ${order ? "fg" : "gf"}(${x}).`,
        answer,
        distractors: pickDistractors(answer, [
          String(order ? c * (a * x + b) + d : a * (c * x + d) + b), // did the functions in the wrong order
          String(order ? a * x + b : c * x + d), // applied only the outer function to x
          String(value + (order ? a : c)),
          String(inner), // stopped after the inner function
          String(-value),
        ]),
        explanation:
          `${order ? "fg" : "gf"}(${x}) means apply ${order ? "g" : "f"} first, then ${order ? "f" : "g"}. ` +
          `${order ? "g" : "f"}(${x}) = ${inner}, then ${order ? "f" : "g"}(${inner}) = ${value}.`,
        check: () => {
          const rin = order ? c * x + d : a * x + b;
          const rout = order ? a * rin + b : c * rin + d;
          return rout === value ? null : "composite mismatch";
        },
      };
    },
  }),

  generator({
    key: "fmg.fn.composite-expression",
    subject: "further-maths",
    topic: "fmg-functions",
    subtopic: "composite",
    curriculumLevel: Y11,
    difficulty: 5,
    variants: 12,
    build: (rng) => {
      const a = rng.nonZero(-3, 3);
      const b = rng.nonZero(-5, 5);
      /* f(x) = ax + b, g(x) = x². fg(x) = a x² + b; gf(x) = (ax + b)². */
      const order = rng.bool();
      const answer = order ? poly([a, 0, b]) : expandSquare(a, b);
      return {
        prompt: `f(x) = ${poly([a, b])} and g(x) = x². Write ${order ? "fg(x)" : "gf(x)"} as a simplified expression.`,
        answer,
        distractors: pickDistractors(answer, [
          order ? expandSquare(a, b) : poly([a, 0, b]), // did fg and gf the wrong way round
          poly([a * a, 0, b * b]), // squared each term separately
          poly([a, b, 0]),
          `${a}x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x`,
          poly([a, 2 * b]),
        ]),
        explanation: order
          ? `fg(x) = f(g(x)) = f(x²) = ${a === 1 ? "" : a}x²${b < 0 ? " − " + Math.abs(b) : " + " + b}.`
          : `gf(x) = g(f(x)) = (${poly([a, b])})² = ${answer}, expanding the bracket.`,
        check: () => {
          const t = 2;
          const lhs = order ? a * t * t + b : (a * t + b) ** 2;
          const rhs = order ? a * t * t + b : a * a * t * t + 2 * a * b * t + b * b;
          return lhs === rhs ? null : "expression check failed";
        },
      };
    },
  }),

  generator({
    key: "fmg.fn.inverse",
    subject: "further-maths",
    topic: "fmg-functions",
    subtopic: "inverse",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const a = rng.pick([2, 3, 4, 5, -2, -3] as const);
      const b = rng.nonZero(-9, 9);
      /* f(x) = (x + b)/a, so f⁻¹(x) = ax − b. Choose this form so the inverse is tidy. */
      const askValue = rng.bool();
      const x = rng.nonZero(-4, 5);
      const invValue = a * x - b;
      const answer = askValue ? String(invValue) : `${a}x ${b < 0 ? "+" : "−"} ${Math.abs(b)}`;
      return {
        prompt: askValue
          ? `f(x) = (x ${b < 0 ? "−" : "+"} ${Math.abs(b)}) / ${a}. Find f⁻¹(${x}).`
          : `f(x) = (x ${b < 0 ? "−" : "+"} ${Math.abs(b)}) / ${a}. Find f⁻¹(x).`,
        answer,
        distractors: askValue
          ? pickDistractors(answer, [
              String((x + b) / a === Math.round((x + b) / a) ? (x + b) / a : x - b),
              String(x / a - b),
              String(a * x + b),
              String(-invValue),
              String(invValue + a),
            ])
          : pickDistractors(answer, [
              `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`, // sign slip on b
              `(x ${b < 0 ? "+" : "−"} ${Math.abs(b)}) / ${a}`, // left it as a fraction
              `x/${a} ${b < 0 ? "+" : "−"} ${Math.abs(b)}`,
              `${a}(x ${b < 0 ? "+" : "−"} ${Math.abs(b)})`,
            ]),
        explanation:
          `Let y = (x ${b < 0 ? "−" : "+"} ${Math.abs(b)})/${a}. Swap x and y, then make y the subject: ` +
          `x = (y ${b < 0 ? "−" : "+"} ${Math.abs(b)})/${a} ⇒ ${a}x = y ${b < 0 ? "−" : "+"} ${Math.abs(b)} ⇒ y = ${a}x ${b < 0 ? "+" : "−"} ${Math.abs(b)}. ` +
          (askValue ? `So f⁻¹(${x}) = ${a}(${x}) ${b < 0 ? "+" : "−"} ${Math.abs(b)} = ${invValue}.` : ``),
        check: () => {
          /* f(f⁻¹(x)) should be x. */
          const fi = a * x - b;
          const back = (fi + b) / a;
          return Math.abs(back - x) < 1e-9 ? null : "inverse does not undo f";
        },
      };
    },
  }),

  generator({
    key: "fmg.fn.transformation-point",
    subject: "further-maths",
    topic: "fmg-functions",
    subtopic: "transformations",
    curriculumLevel: Y11,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const px = rng.pick([-4, -2, 2, 4, 6] as const); // even, so y = f(2x) still lands on an integer x
      const py = rng.nonZero(-6, 6);
      const t = rng.pick([
        { desc: "y = f(x) + 3", fx: (x: number) => x, fy: (y: number) => y + 3, name: "translation 3 up" },
        { desc: "y = f(x) − 2", fx: (x: number) => x, fy: (y: number) => y - 2, name: "translation 2 down" },
        { desc: "y = f(x − 4)", fx: (x: number) => x + 4, fy: (y: number) => y, name: "translation 4 right" },
        { desc: "y = f(x + 1)", fx: (x: number) => x - 1, fy: (y: number) => y, name: "translation 1 left" },
        { desc: "y = 2f(x)", fx: (x: number) => x, fy: (y: number) => 2 * y, name: "stretch, scale factor 2, parallel to the y-axis" },
        { desc: "y = −f(x)", fx: (x: number) => x, fy: (y: number) => -y, name: "reflection in the x-axis" },
        { desc: "y = f(−x)", fx: (x: number) => -x, fy: (y: number) => y, name: "reflection in the y-axis" },
        { desc: "y = f(2x)", fx: (x: number) => x / 2, fy: (y: number) => y, name: "stretch, scale factor ½, parallel to the x-axis" },
      ] as const);
      const ix = t.fx(px);
      const iy = t.fy(py);
      const answer = point(ix, iy);
      return {
        prompt:
          `The point ${point(px, py)} lies on the curve y = f(x). ` +
          `The curve is transformed to ${t.desc}. What are the coordinates of the corresponding point on the new curve?`,
        answer,
        distractors: pickDistractors(answer, [
          point(t.fy(px), t.fx(py)), // applied the transformations to the wrong coordinates
          point(px, py), // left the point unchanged
          point(-ix, iy),
          point(ix, -iy),
          point(iy, ix),
        ]),
        explanation:
          `${t.desc} is a ${t.name}. ` +
          `A change inside f(...) moves the x-coordinate the opposite way; a change outside f moves or scales the y-coordinate directly. ` +
          `So ${point(px, py)} maps to ${answer}.`,
        check: () => {
          const x = t.fx(px);
          const y = t.fy(py);
          return x === ix && y === iy ? null : "image point mismatch";
        },
      };
    },
  }),

  recall({
    key: "fmg.fn.domain-range",
    topic: "fmg-functions",
    subtopic: "domain-range",
    level: Y11,
    difficulty: 5,
    cases: [
      {
        q: "What is the range of the function f(x) = x² + 5, defined for all real x?",
        a: "f(x) ≥ 5",
        wrong: ["f(x) > 5", "all real numbers", "f(x) ≤ 5", "0 ≤ f(x) ≤ 5"],
        why: "x² is never negative, so the smallest value of x² + 5 is 5, reached at x = 0.",
      },
      {
        q: "What is the largest possible domain of the function f(x) = √(x − 3)?",
        a: "x ≥ 3",
        wrong: ["x > 3", "x ≤ 3", "all real numbers", "x ≥ 0"],
        why: "The expression under a square root cannot be negative, so x − 3 ≥ 0.",
      },
      {
        q: "What is the range of f(x) = 2ˣ, defined for all real x?",
        a: "f(x) > 0",
        wrong: ["f(x) ≥ 0", "all real numbers", "f(x) ≥ 1", "0 ≤ f(x) ≤ 1"],
        why: "An exponential is always positive but approaches 0 without ever reaching it.",
      },
      {
        q: "The function g(x) = 1/(x − 2) cannot be evaluated at which value of x?",
        a: "x = 2",
        wrong: ["x = 0", "x = −2", "x = 1", "every value can be used"],
        why: "x = 2 makes the denominator zero, so it must be excluded from the domain.",
      },
      {
        q: "If a function has domain x ≥ 0 and its inverse exists, what is the range of the inverse function?",
        a: "The range of the inverse is x ≥ 0 (the domain of the original)",
        wrong: [
          "All real numbers",
          "The range of the original function",
          "x ≤ 0",
          "It cannot be determined",
        ],
        why: "The domain and range swap when a function is inverted.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

/** (ax + b)² expanded and simplified, e.g. a=2,b=-3 → "4x² − 12x + 9". */
function expandSquare(a: number, b: number): string {
  return poly([a * a, 2 * a * b, b * b]);
}
