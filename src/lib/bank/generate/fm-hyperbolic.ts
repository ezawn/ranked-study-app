/**
 * Hyperbolic functions (A-Level Further Maths).
 *
 * Definitions in terms of e, the identity cosh²x − sinh²x = 1 (used to turn a
 * given sinh into an exact cosh), and the logarithmic forms of the inverse
 * hyperbolic functions. The "given sinh x, find cosh x" question is built from
 * a Pythagorean pair so the answer is an exact fraction.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { frac } from "./format";
import { Y13, recall } from "./fm-kit";

export const fmHyperbolic: Generator[] = [
  recall({
    key: "fm.hyperbolic.definitions",
    topic: "fm-hyperbolic",
    subtopic: "definitions",
    level: Y13,
    difficulty: 5,
    cases: [
      {
        q: "Which expression defines sinh x?",
        a: "(eˣ − e⁻ˣ) / 2",
        wrong: ["(eˣ + e⁻ˣ) / 2", "(e⁻ˣ − eˣ) / 2", "(eˣ − e⁻ˣ)", "eˣ / 2 − e⁻ˣ"],
        why: "cosh uses the sum and sinh uses the difference, both divided by 2.",
      },
      {
        q: "Which expression defines cosh x?",
        a: "(eˣ + e⁻ˣ) / 2",
        wrong: ["(eˣ − e⁻ˣ) / 2", "(eˣ · e⁻ˣ) / 2", "eˣ + e⁻ˣ", "1 + x²/2"],
        why: "cosh x is the average of eˣ and e⁻ˣ; it is never less than 1.",
      },
      {
        q: "What is the value of cosh 0?",
        a: "1",
        wrong: ["0", "2", "e", "−1"],
        why: "cosh 0 = (e⁰ + e⁰)/2 = (1 + 1)/2 = 1. It is the minimum value of cosh.",
      },
      {
        q: "What is the value of sinh 0?",
        a: "0",
        wrong: ["1", "−1", "2", "e"],
        why: "sinh 0 = (e⁰ − e⁰)/2 = 0. sinh is an odd function, so its graph passes through the origin.",
      },
      {
        q: "The graph of y = cosh x has which shape?",
        a: "A U-shaped curve (a catenary) with a minimum value of 1 at x = 0",
        wrong: [
          "An S-shaped curve passing through the origin",
          "A straight line of gradient 1",
          "A curve oscillating between −1 and 1",
          "A curve with a vertical asymptote at x = 0",
        ],
        why: "cosh x = (eˣ + e⁻ˣ)/2 ≥ 1 for all x, with the two exponential arms giving the U shape.",
      },
      {
        q: "What is the range of tanh x?",
        a: "−1 < tanh x < 1",
        wrong: ["tanh x ≥ 1", "all real numbers", "0 ≤ tanh x ≤ 1", "−1 ≤ tanh x ≤ 1 (endpoints included)"],
        why: "tanh x = sinh x / cosh x approaches but never reaches ±1 as x → ±∞.",
      },
    ],
  }),

  generator({
    key: "fm.hyperbolic.identity",
    subject: "further-maths",
    topic: "fm-hyperbolic",
    subtopic: "identities",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 10,
    build: (rng) => {
      /* Pythagorean pairs (p, q) with p² + q² a perfect square, so cosh comes
         out exact: sinh x = p/q ⇒ cosh x = √(p²+q²)/q. */
      const pairs: [number, number][] = [
        [3, 4],
        [4, 3],
        [5, 12],
        [12, 5],
        [8, 15],
        [15, 8],
        [7, 24],
        [20, 21],
        [9, 40],
        [11, 60],
      ];
      const [p, q] = rng.pick(pairs);
      const hyp = Math.round(Math.hypot(p, q));
      const answer = frac(hyp, q);
      return {
        prompt: `Given that sinh x = ${frac(p, q)} and x > 0, find the exact value of cosh x.`,
        answer,
        distractors: pickDistractors(answer, [
          frac(p, q), // just repeated sinh x
          frac(Math.abs(hyp - q), q),
          frac(hyp, p),
          frac(p + q, q),
          frac(hyp - 1, q),
        ]),
        explanation:
          `Use cosh²x − sinh²x = 1, so cosh²x = 1 + (${frac(p, q)})² = 1 + ${p * p}/${q * q} = ${p * p + q * q}/${q * q}. ` +
          `Since x > 0, cosh x > 0, so cosh x = √(${p * p + q * q})/${q} = ${answer}.`,
        check: () => {
          const coshVal = hyp / q;
          const sinhVal = p / q;
          return Math.abs(coshVal * coshVal - sinhVal * sinhVal - 1) < 1e-9 ? null : "identity fails";
        },
      };
    },
  }),

  recall({
    key: "fm.hyperbolic.identities-recall",
    topic: "fm-hyperbolic",
    subtopic: "identities",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "Which identity is the hyperbolic analogue of sin²θ + cos²θ = 1?",
        a: "cosh²x − sinh²x = 1",
        wrong: ["sinh²x + cosh²x = 1", "cosh²x − sinh²x = −1", "sinh²x − cosh²x = 1", "tanh²x + sech²x = 1"],
        why: "The sign on the sinh² term flips compared with the circular identity — a case of Osborn's rule.",
      },
      {
        q: "By Osborn's rule, the identity cos 2θ = 1 − 2sin²θ becomes which hyperbolic identity?",
        a: "cosh 2x = 1 + 2sinh²x",
        wrong: ["cosh 2x = 1 − 2sinh²x", "cosh 2x = 2sinh²x − 1", "sinh 2x = 1 + 2sinh²x", "cosh 2x = 1 + 2cosh²x"],
        why: "Osborn's rule replaces cos with cosh and sin with sinh, but changes the sign of any term that is a product of two sinhs — here −2sin²θ becomes +2sinh²x.",
      },
      {
        q: "Which identity gives 1 − tanh²x?",
        a: "sech²x",
        wrong: ["cosech²x", "coth²x", "−sech²x", "sinh²x"],
        why: "Dividing cosh²x − sinh²x = 1 through by cosh²x gives 1 − tanh²x = sech²x.",
      },
      {
        q: "What is sinh 2x in terms of sinh x and cosh x?",
        a: "2 sinh x cosh x",
        wrong: ["sinh²x + cosh²x", "2 sinh²x", "cosh²x − sinh²x", "sinh x cosh x"],
        why: "The double-angle form matches the circular one exactly (no sign change, as it is not a product of two sinhs).",
      },
    ],
  }),

  recall({
    key: "fm.hyperbolic.inverse-log",
    topic: "fm-hyperbolic",
    subtopic: "inverse-hyperbolic",
    level: Y13,
    difficulty: 7,
    cases: [
      {
        q: "Which logarithmic form is equal to arsinh x (the inverse of sinh)?",
        a: "ln(x + √(x² + 1))",
        wrong: ["ln(x + √(x² − 1))", "ln(x − √(x² + 1))", "½ ln((1 + x)/(1 − x))", "ln(x) + √(x² + 1)"],
        why: "Setting y = arsinh x and solving sinh y = x for eʸ gives eʸ = x + √(x² + 1).",
      },
      {
        q: "Which logarithmic form is equal to arcosh x, for x ≥ 1?",
        a: "ln(x + √(x² − 1))",
        wrong: ["ln(x + √(x² + 1))", "ln(x − √(x² − 1))", "½ ln((x + 1)/(x − 1))", "ln(x) − 1"],
        why: "Solving cosh y = x gives eʸ = x ± √(x² − 1); the + root is taken so that y ≥ 0.",
      },
      {
        q: "Which logarithmic form is equal to artanh x, for |x| < 1?",
        a: "½ ln((1 + x)/(1 − x))",
        wrong: ["ln(x + √(x² + 1))", "2 ln((1 + x)/(1 − x))", "ln((1 − x)/(1 + x))", "ln(x + √(1 − x²))"],
        why: "Solving tanh y = x for e^{2y} gives e^{2y} = (1 + x)/(1 − x), then halve the logarithm.",
      },
      {
        q: "Why does arcosh x require x ≥ 1?",
        a: "cosh y ≥ 1 for every real y, so no smaller value of x can be an output of cosh to invert",
        wrong: [
          "Because the logarithm is undefined for x < 1",
          "Because arcosh is an odd function",
          "Because √(x² − 1) must be an integer",
          "It does not; arcosh x is defined for all x",
        ],
        why: "The domain of the inverse is the range of the original function, and cosh never dips below 1.",
      },
    ],
  }),
];
