/**
 * Further trigonometry (GCSE Further Maths — AQA Level 2).
 *
 * Exact values, the sine and cosine rules with angles chosen so the answer is
 * exact, the Pythagorean and quotient identities, and solving trig equations
 * over a stated interval using the known exact values.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { rootString } from "./fm-kit";
import { Y10, Y11, recall } from "./fm-kit";

export const fmGcseTrig: Generator[] = [
  recall({
    key: "fmg.trig.exact-values",
    topic: "fmg-trigonometry",
    subtopic: "exact-values",
    level: Y10,
    difficulty: 4,
    cases: [
      {
        q: "What is the exact value of sin 30°?",
        a: "1/2",
        wrong: ["√3/2", "√2/2", "1", "√3/3"],
        why: "In a 30–60–90 triangle the side opposite 30° is half the hypotenuse.",
      },
      {
        q: "What is the exact value of cos 30°?",
        a: "√3/2",
        wrong: ["1/2", "√2/2", "√3/3", "1"],
        why: "cos 30° = sin 60° = √3/2.",
      },
      {
        q: "What is the exact value of tan 45°?",
        a: "1",
        wrong: ["√2", "1/2", "√2/2", "0"],
        why: "In an isosceles right-angled triangle the two shorter sides are equal, so opposite ÷ adjacent = 1.",
      },
      {
        q: "What is the exact value of sin 60°?",
        a: "√3/2",
        wrong: ["1/2", "√2/2", "√3", "√3/3"],
        why: "sin 60° = cos 30° = √3/2.",
      },
      {
        q: "What is the exact value of tan 60°?",
        a: "√3",
        wrong: ["√3/2", "1/√3", "1", "3"],
        why: "tan 60° = sin 60° ÷ cos 60° = (√3/2) ÷ (1/2) = √3.",
      },
      {
        q: "What is the exact value of cos 45°?",
        a: "√2/2",
        wrong: ["1/2", "√3/2", "1", "√2"],
        why: "cos 45° = 1/√2, which rationalises to √2/2.",
      },
    ],
  }),

  generator({
    key: "fmg.trig.cosine-rule",
    subject: "further-maths",
    topic: "fmg-trigonometry",
    subtopic: "sine-cosine-rule",
    curriculumLevel: Y11,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      /* Angle chosen from {60°, 90°, 120°} so cos C ∈ {1/2, 0, −1/2} and c² is exact. */
      const C = rng.pick([60, 90, 120] as const);
      const cosC = C === 60 ? 0.5 : C === 90 ? 0 : -0.5;
      const a = rng.int(3, 11);
      const b = rng.int(3, 11);
      const cSq = a * a + b * b - 2 * a * b * cosC;
      const c = rootString(cSq);
      const answer = c;
      return {
        prompt:
          `In triangle ABC, AB = ${a}, AC = ${b} and the angle BAC between them is ${C}°. ` +
          `Find the exact length of BC.`,
        answer,
        distractors: pickDistractors(answer, [
          rootString(a * a + b * b), // dropped the −2ab cos C term
          rootString(a * a + b * b - 2 * a * b * (-cosC)), // used the wrong sign on cos C
          rootString(a * a + b * b - a * b), // used cos 60° regardless
          rootString(a * a + b * b + a * b), // used cos 120° regardless
          String(a + b), // added the two sides
        ]),
        explanation:
          `Cosine rule: BC² = AB² + AC² − 2·AB·AC·cos(BAC) = ${a}² + ${b}² − 2(${a})(${b})cos ${C}° ` +
          `= ${a * a + b * b} − ${2 * a * b}(${cosC}) = ${cSq}. So BC = √${cSq} = ${answer}.`,
        check: () => {
          const recomputed = a * a + b * b - 2 * a * b * cosC;
          return recomputed === cSq ? null : "cosine rule mismatch";
        },
      };
    },
  }),

  generator({
    key: "fmg.trig.area",
    subject: "further-maths",
    topic: "fmg-trigonometry",
    subtopic: "sine-cosine-rule",
    curriculumLevel: Y11,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      /* Angle from {30°, 90°, 150°} so sin C ∈ {1/2, 1, 1/2}, giving an exact area. */
      const C = rng.pick([30, 90, 150] as const);
      const sinC = C === 90 ? 1 : 0.5;
      const a = rng.pick([4, 6, 8, 10, 12] as const);
      const b = rng.pick([3, 5, 7, 9, 11] as const);
      const area = 0.5 * a * b * sinC;
      const answer = Number.isInteger(area) ? String(area) : String(area);
      return {
        prompt:
          `A triangle has two sides of length ${a} and ${b} with an angle of ${C}° between them. ` +
          `Find its exact area.`,
        answer,
        distractors: pickDistractors(answer, [
          String(a * b * sinC), // forgot the factor of ½
          String(0.5 * a * b), // used sin C = 1
          String(0.5 * (a + b) * sinC),
          String(a * b),
          String(area + 1),
        ]),
        explanation:
          `Area = ½·a·b·sin C = ½ × ${a} × ${b} × sin ${C}° = ½ × ${a} × ${b} × ${sinC} = ${answer}.`,
        check: () => (0.5 * a * b * sinC === area ? null : "area mismatch"),
      };
    },
  }),

  recall({
    key: "fmg.trig.identities",
    topic: "fmg-trigonometry",
    subtopic: "identities",
    level: Y11,
    difficulty: 5,
    cases: [
      {
        q: "Simplify the expression sin θ / cos θ.",
        a: "tan θ",
        wrong: ["cot θ", "sin θ cos θ", "1", "sec θ"],
        why: "This is the definition of the tangent function.",
      },
      {
        q: "Simplify 1 − cos²θ.",
        a: "sin²θ",
        wrong: ["cos²θ", "tan²θ", "1", "2sin²θ"],
        why: "Rearranging the identity sin²θ + cos²θ = 1.",
      },
      {
        q: "Simplify the expression sin²θ + cos²θ.",
        a: "1",
        wrong: ["0", "2", "tan²θ", "sin 2θ"],
        why: "The fundamental Pythagorean identity, true for every angle θ.",
      },
      {
        q: "Which expression is equal to (1 − sin²θ)?",
        a: "cos²θ",
        wrong: ["sin²θ", "tan²θ", "sec²θ", "1 + cos²θ"],
        why: "From sin²θ + cos²θ = 1, subtracting sin²θ from both sides gives cos²θ.",
      },
      {
        q: "Simplify 5sin²θ + 5cos²θ.",
        a: "5",
        wrong: ["10", "5tan²θ", "0", "5sin 2θ"],
        why: "Factor out 5: 5(sin²θ + cos²θ) = 5(1) = 5.",
      },
    ],
  }),

  recall({
    key: "fmg.trig.equations",
    topic: "fmg-trigonometry",
    subtopic: "equations",
    level: Y11,
    difficulty: 6,
    cases: [
      {
        q: "Solve sin x = 1/2 for 0° ≤ x ≤ 360°.",
        a: "x = 30° or x = 150°",
        wrong: ["x = 30° only", "x = 30° or x = 210°", "x = 60° or x = 120°", "x = 150° or x = 330°"],
        why: "sin is positive in the first and second quadrants; the second solution is 180° − 30° = 150°.",
      },
      {
        q: "Solve cos x = 1/2 for 0° ≤ x ≤ 360°.",
        a: "x = 60° or x = 300°",
        wrong: ["x = 60° only", "x = 60° or x = 120°", "x = 30° or x = 330°", "x = 120° or x = 240°"],
        why: "cos is positive in the first and fourth quadrants; the second solution is 360° − 60° = 300°.",
      },
      {
        q: "Solve tan x = 1 for 0° ≤ x ≤ 360°.",
        a: "x = 45° or x = 225°",
        wrong: ["x = 45° only", "x = 45° or x = 135°", "x = 45° or x = 315°", "x = 135° or x = 315°"],
        why: "tan has period 180°, so the solutions are 45° and 45° + 180° = 225°.",
      },
      {
        q: "How many solutions does sin x = 0 have in the interval 0° ≤ x ≤ 360°?",
        a: "3 (at 0°, 180° and 360°)",
        wrong: ["1", "2", "4", "Infinitely many"],
        why: "sin x is zero at every multiple of 180°, and three of those lie in the closed interval.",
      },
      {
        q: "Solve sin x = −1/2 for 0° ≤ x ≤ 360°.",
        a: "x = 210° or x = 330°",
        wrong: ["x = 30° or x = 150°", "x = 210° only", "x = 150° or x = 330°", "x = 30° or x = 330°"],
        why: "sin is negative in the third and fourth quadrants: 180° + 30° = 210° and 360° − 30° = 330°.",
      },
    ],
  }),
];
