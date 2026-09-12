/**
 * Polar coordinates and proof by induction (A-Level Further Maths).
 *
 * The conversion questions are computed from points chosen so that r is exact
 * and θ is a multiple of π/4; the curve and induction questions are worked
 * recall of the standard forms and the structure of an inductive proof.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { point } from "./format";
import { Y13, recall, rootString, argPi } from "./fm-kit";

export const fmPolarInduction: Generator[] = [
  generator({
    key: "fm.polar.to-polar",
    subject: "further-maths",
    topic: "fm-polar",
    subtopic: "conversion",
    curriculumLevel: Y13,
    difficulty: 5,
    variants: 8,
    build: (_rng, index) => {
      const pts: [number, number][] = [
        [4, 4],
        [-3, 3],
        [0, 5],
        [-2, 0],
        [5, -5],
        [-6, -6],
        [7, 0],
        [0, -4],
      ];
      const [x, y] = pts[index % pts.length];
      const r = rootString(x * x + y * y);
      const theta = argPi(x, y);
      const answer = `r = ${r}, θ = ${theta}`;
      return {
        prompt: `Convert the Cartesian coordinates ${point(x, y)} to polar form (r, θ) with r > 0 and −π < θ ≤ π. Give exact values.`,
        answer,
        distractors: pickDistractors(answer, [
          `r = ${x * x + y * y}, θ = ${theta}`, // forgot the square root for r
          `r = ${r}, θ = ${argPi(x, -y)}`, // wrong quadrant for θ
          `r = ${r}, θ = ${argPi(y, x)}`,
          `r = ${Math.abs(x) + Math.abs(y)}, θ = ${theta}`,
          `r = ${r}, θ = π/3`,
        ]),
        explanation:
          `r = √(x² + y²) = √(${x}² + ${y}²) = √${x * x + y * y} = ${r}. ` +
          `The point is ${quadrantNote(x, y)}, so θ = ${theta}.`,
      };
    },
  }),

  generator({
    key: "fm.polar.to-cartesian",
    subject: "further-maths",
    topic: "fm-polar",
    subtopic: "conversion",
    curriculumLevel: Y13,
    difficulty: 5,
    variants: 8,
    build: (_rng, index) => {
      /* (r, θ) with θ a multiple of π/2 so x = r cos θ, y = r sin θ are integers. */
      const cases: { r: number; thetaLabel: string; cos: number; sin: number }[] = [
        { r: 3, thetaLabel: "0", cos: 1, sin: 0 },
        { r: 4, thetaLabel: "π/2", cos: 0, sin: 1 },
        { r: 5, thetaLabel: "π", cos: -1, sin: 0 },
        { r: 2, thetaLabel: "−π/2", cos: 0, sin: -1 },
        { r: 6, thetaLabel: "π", cos: -1, sin: 0 },
        { r: 7, thetaLabel: "π/2", cos: 0, sin: 1 },
        { r: 8, thetaLabel: "0", cos: 1, sin: 0 },
        { r: 3, thetaLabel: "−π/2", cos: 0, sin: -1 },
      ];
      const c = cases[index % cases.length];
      const x = c.r * c.cos;
      const y = c.r * c.sin;
      const answer = point(x, y);
      return {
        prompt: `Convert the polar coordinates (r, θ) = (${c.r}, ${c.thetaLabel}) to Cartesian coordinates (x, y).`,
        answer,
        distractors: pickDistractors(answer, [
          point(y, x), // swapped x and y (used sin for x, cos for y)
          point(-x, -y),
          point(c.r, c.r),
          point(x, -y),
          point(x + 1, y),
        ]),
        explanation:
          `x = r cos θ = ${c.r} cos(${c.thetaLabel}) = ${x}, and y = r sin θ = ${c.r} sin(${c.thetaLabel}) = ${y}.`,
      };
    },
  }),

  recall({
    key: "fm.polar.curves",
    topic: "fm-polar",
    subtopic: "polar-curves",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "What shape is the polar curve r = a, where a is a positive constant?",
        a: "A circle of radius a centred on the pole (origin)",
        wrong: [
          "A straight line through the pole",
          "A spiral",
          "A cardioid",
          "A half-line at angle a to the initial line",
        ],
        why: "Every point is a fixed distance a from the pole, whatever the angle — that is a circle.",
      },
      {
        q: "What shape is the polar curve r = a(1 + cos θ)?",
        a: "A cardioid (heart-shaped curve) with a cusp at the pole",
        wrong: [
          "A circle centred at the pole",
          "An ellipse",
          "A three-petal rose",
          "A straight line",
        ],
        why: "r = a(1 + cos θ) is the standard cardioid; r = 0 when θ = π, giving the cusp.",
      },
      {
        q: "The polar curve r = 2a cos θ (for −π/2 < θ < π/2) is which shape?",
        a: "A circle of radius a passing through the pole, centred at (a, 0)",
        wrong: [
          "A circle of radius 2a centred at the pole",
          "A cardioid",
          "A straight line x = a",
          "A parabola with focus at the pole",
        ],
        why: "Multiplying by r gives r² = 2ar cos θ, i.e. x² + y² = 2ax, which rearranges to (x − a)² + y² = a².",
      },
      {
        q: "What is the formula for the area of the region swept out by a polar curve r = f(θ) between θ = α and θ = β?",
        a: "½ ∫ from α to β of r² dθ",
        wrong: [
          "∫ from α to β of r dθ",
          "π ∫ from α to β of r² dθ",
          "½ ∫ from α to β of r dθ",
          "2π ∫ from α to β of r dθ",
        ],
        why: "The area of an infinitesimal sector is ½ r² dθ, and integrating adds them up.",
      },
      {
        q: "How do you find the angle θ at which a polar curve r = f(θ) is furthest from the pole?",
        a: "Solve dr/dθ = 0 and check it gives a maximum of r",
        wrong: [
          "Solve r = 0",
          "Solve d²r/dθ² = 0",
          "Set θ = π/2",
          "Solve f(θ) = 1",
        ],
        why: "r is greatest where its rate of change with θ is zero and the second condition confirms a maximum.",
      },
    ],
  }),

  recall({
    key: "fm.induction.structure",
    topic: "fm-induction",
    subtopic: "summation",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "In a proof by induction, what is established in the 'basis' (base case) step?",
        a: "That the statement is true for the smallest value of n (usually n = 1)",
        wrong: [
          "That the statement is true for all n at once",
          "That the statement is true for n = k",
          "That the statement is false for n = 0",
          "That the statement is true for two consecutive values of n",
        ],
        why: "The base case anchors the chain of implications so that 'true for k ⇒ true for k+1' can propagate from a known starting point.",
      },
      {
        q: "In the inductive step of a proof by induction, what is assumed and what is proved?",
        a: "Assume the statement holds for n = k; prove it then holds for n = k + 1",
        wrong: [
          "Assume it holds for n = k + 1; prove it holds for n = k",
          "Assume it holds for all n; prove it holds for n = 1",
          "Assume it is false for n = k; derive a contradiction",
          "Prove it directly for a general n with no assumption",
        ],
        why: "The inductive hypothesis (true for k) is used to bridge to k + 1, which with the base case gives all n.",
      },
      {
        q: "When proving Σ_{r=1}^{n} r = n(n+1)/2 by induction, the inductive step adds which term to both sides of the assumed result?",
        a: "(k + 1)",
        wrong: ["k", "(k + 1)(k + 2)/2", "n + 1", "(2k + 1)"],
        why: "Going from the sum to k to the sum to k+1 means adding the (k+1)th term, which is (k+1) itself.",
      },
      {
        q: "Why is the conclusion of an induction proof normally phrased 'true for n = 1, and true for k implies true for k + 1, so true for all positive integers n'?",
        a: "The base case plus the implication together force the statement to hold for every integer from the base upward, by a domino effect",
        wrong: [
          "Because n = 1 is the only case that matters",
          "Because the implication alone proves every case",
          "Because induction only works for finitely many n",
          "Because the statement was assumed true throughout",
        ],
        why: "Each step's truth is knocked over by the previous one, starting from the verified base case.",
      },
    ],
  }),

  recall({
    key: "fm.induction.divisibility",
    topic: "fm-induction",
    subtopic: "divisibility",
    level: Y13,
    difficulty: 7,
    cases: [
      {
        q: "To prove by induction that 6 divides (n³ + 5n) for all positive integers n, what is a useful way to write f(k + 1) in the inductive step?",
        a: "f(k + 1) = f(k) + 3k² + 3k + 6, i.e. f(k) plus a multiple of 6 (since 3k² + 3k is always even)",
        wrong: [
          "f(k + 1) = 6 f(k)",
          "f(k + 1) = f(k) + f(1)",
          "f(k + 1) = f(k) × (k + 1)",
          "f(k + 1) = f(k) − 6",
        ],
        why: "f(k+1) − f(k) = (k+1)³ + 5(k+1) − k³ − 5k = 3k² + 3k + 6, and 3k² + 3k = 3k(k+1) is divisible by 6.",
      },
      {
        q: "In a divisibility induction, after writing f(k + 1) = f(k) + (something), what must 'something' be for the step to work?",
        a: "A multiple of the divisor (so that if the divisor divides f(k), it also divides f(k + 1))",
        wrong: [
          "Equal to f(k)",
          "A prime number",
          "Zero",
          "An even number, whatever the divisor",
        ],
        why: "If d | f(k) and d | (f(k+1) − f(k)), then d | f(k+1); the whole proof rests on that second divisibility.",
      },
      {
        q: "To prove 8 divides (3^{2n} − 1) by induction, the inductive step uses 3^{2(k+1)} − 1 = 9·3^{2k} − 1. How is this rewritten to reveal the factor of 8?",
        a: "9·3^{2k} − 1 = (3^{2k} − 1) + 8·3^{2k}",
        wrong: [
          "9·3^{2k} − 1 = 9(3^{2k} − 1)",
          "9·3^{2k} − 1 = (3^{2k} − 1) + 1",
          "9·3^{2k} − 1 = 8(3^{2k} − 1)",
          "9·3^{2k} − 1 = (3^{2k} − 1) − 8",
        ],
        why: "Split 9·3^{2k} as 1·3^{2k} + 8·3^{2k}; the first part gives back f(k) and the second is visibly a multiple of 8.",
      },
      {
        q: "Which statement is proved most naturally by induction rather than by a direct algebraic argument?",
        a: "n! > 2ⁿ for all integers n ≥ 4",
        wrong: [
          "The sum of the first two odd numbers is 4",
          "2 + 2 = 4",
          "Every even number is divisible by 2",
          "x² ≥ 0 for all real x",
        ],
        why: "An inequality that must hold for every n from a starting point, with each case leaning on the previous, is the classic shape for induction.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

function quadrantNote(x: number, y: number): string {
  if (x > 0 && y > 0) return "in the first quadrant";
  if (x < 0 && y > 0) return "in the second quadrant";
  if (x < 0 && y < 0) return "in the third quadrant";
  if (x > 0 && y < 0) return "in the fourth quadrant";
  if (x === 0 && y > 0) return "on the positive y-axis";
  if (x === 0 && y < 0) return "on the negative y-axis";
  if (y === 0 && x < 0) return "on the negative x-axis";
  return "on the positive x-axis";
}
