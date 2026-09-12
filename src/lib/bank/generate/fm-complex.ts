/**
 * Complex numbers (A-Level Further Maths).
 *
 * Every arithmetic answer is computed with i² = −1 and re-checked. Division
 * questions are built by choosing the quotient first and multiplying up, so the
 * division always comes out to a Gaussian integer. De Moivre questions use
 * z = ±1 ± i (modulus √2, argument a multiple of π/4) so every power is an
 * exact Gaussian integer too.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Y12, Y13, recall, cplx, C, argPi, rootString, type Complex } from "./fm-kit";

export const fmComplex: Generator[] = [
  generator({
    key: "fm.complex.arithmetic",
    subject: "further-maths",
    topic: "fm-complex",
    subtopic: "arithmetic",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 20,
    build: (rng) => {
      const small = () => rng.nonZero(-5, 5);
      const op = rng.pick(["+", "−", "×", "÷"] as const);
      let z1: Complex;
      let z2: Complex;
      let result: Complex;
      if (op === "÷") {
        result = { re: small(), im: small() };
        z2 = { re: small(), im: small() };
        z1 = C.mul(result, z2);
      } else {
        z1 = { re: small(), im: small() };
        z2 = { re: small(), im: small() };
        result = op === "+" ? C.add(z1, z2) : op === "−" ? C.sub(z1, z2) : C.mul(z1, z2);
      }
      const answer = C.str(result);
      return {
        prompt: `Given z₁ = ${cplx(z1.re, z1.im)} and z₂ = ${cplx(z2.re, z2.im)}, work out z₁ ${op} z₂ in the form a + bi.`,
        answer,
        distractors: pickDistractors(answer, [
          op === "×"
            ? cplx(z1.re * z2.re + z1.im * z2.im, z1.re * z2.im + z1.im * z2.re) // treated i² as +1
            : C.str(C.add(z1, z2)),
          C.str(C.sub(z1, z2)),
          cplx(-result.re, result.im),
          cplx(result.re, -result.im), // gave the conjugate
          cplx(result.im, result.re), // swapped real and imaginary parts
        ]),
        explanation:
          op === "×"
            ? `Expand and use i² = −1: (${cplx(z1.re, z1.im)})(${cplx(z2.re, z2.im)}) = ${answer}.`
            : op === "÷"
              ? `Multiply top and bottom by the conjugate of z₂. The result is ${answer} — check by multiplying it back by z₂ to recover z₁.`
              : `Combine the real parts and the imaginary parts separately: ${answer}.`,
        check: () => {
          const recomputed =
            op === "+"
              ? C.add(z1, z2)
              : op === "−"
                ? C.sub(z1, z2)
                : op === "×"
                  ? C.mul(z1, z2)
                  : C.div(z1, z2);
          return C.eq(recomputed, result) ? null : "complex arithmetic mismatch";
        },
      };
    },
  }),

  generator({
    key: "fm.complex.modulus",
    subject: "further-maths",
    topic: "fm-complex",
    subtopic: "modulus-argument",
    curriculumLevel: Y12,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const re = rng.nonZero(-9, 9);
      const im = rng.nonZero(-9, 9);
      const sq = re * re + im * im;
      const answer = rootString(sq);
      return {
        prompt: `Find the modulus of the complex number z = ${cplx(re, im)}. Give an exact answer.`,
        answer,
        distractors: pickDistractors(answer, [
          String(Math.abs(re) + Math.abs(im)), // added the parts instead of the squares
          String(sq), // forgot to take the square root
          rootString(2 * Math.abs(re * im)),
          rootString(re * re + Math.abs(im)),
          String(Math.max(Math.abs(re), Math.abs(im))),
        ]),
        explanation:
          `|z| = √(real² + imaginary²) = √(${re}² + ${im}²) = √(${re * re} + ${im * im}) = √${sq} = ${answer}.`,
        check: () => {
          const m = Math.hypot(re, im);
          return Math.round(m * m) === sq ? null : "modulus mismatch";
        },
      };
    },
  }),

  generator({
    key: "fm.complex.argument",
    subject: "further-maths",
    topic: "fm-complex",
    subtopic: "modulus-argument",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 8,
    build: (_rng, index) => {
      const dirs: [number, number][] = [
        [3, 3],
        [-2, 2],
        [-4, -4],
        [5, -5],
        [0, 4],
        [-6, 0],
        [2, 2],
        [-1, -1],
      ];
      const [re, im] = dirs[index % dirs.length];
      const answer = argPi(re, im);
      return {
        prompt: `Find the argument of z = ${cplx(re, im)}, giving your answer in radians in the interval (−π, π].`,
        answer,
        distractors: pickDistractors(answer, [
          argPi(re, -im), // reflected in the real axis
          argPi(-re, im),
          argPi(im, re),
          answer.startsWith("-") ? answer.slice(1) : `-${answer}`,
          "π/3",
        ]),
        explanation:
          `Plot z on an Argand diagram. It lies ${describeQuadrant(re, im)}, and the reference angle is measured from the positive real axis, giving arg z = ${answer}.`,
      };
    },
  }),

  generator({
    key: "fm.complex.real-quadratic",
    subject: "further-maths",
    topic: "fm-complex",
    subtopic: "conjugate-roots",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const p = rng.nonZero(-4, 4); // real part of the root
      const q = rng.int(1, 5); // imaginary part (positive)
      /* Root p + qi, so the quadratic is z² − 2p z + (p² + q²) = 0. */
      const b = -2 * p;
      const c = p * p + q * q;
      const answer = `b = ${b}, c = ${c}`;
      return {
        prompt:
          `${cplx(p, q)} is a root of the equation z² + bz + c = 0, where b and c are real numbers. Find b and c.`,
        answer,
        distractors: pickDistractors(answer, [
          `b = ${2 * p}, c = ${c}`, // sign slip on the sum of roots
          `b = ${b}, c = ${p * p - q * q}`, // treated i² as +1 in the product
          `b = ${-p}, c = ${q}`,
          `b = ${b}, c = ${2 * p * q}`,
          `b = ${p * p + q * q}, c = ${-2 * p}`, // swapped b and c
        ]),
        explanation:
          `Real coefficients force the other root to be the conjugate ${cplx(p, -q)}. ` +
          `Sum of roots = ${2 * p} = −b, so b = ${b}. Product = (${p})² + (${q})² = ${c} = c.`,
        check: () => {
          /* Substitute the root: (p+qi)² + b(p+qi) + c should be 0. */
          const re = p * p - q * q + b * p + c;
          const im = 2 * p * q + b * q;
          return re === 0 && im === 0 ? null : `root gives ${re} + ${im}i`;
        },
      };
    },
  }),

  generator({
    key: "fm.complex.de-moivre",
    subject: "further-maths",
    topic: "fm-complex",
    subtopic: "de-moivre",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const bases: Complex[] = [
        { re: 1, im: 1 },
        { re: 1, im: -1 },
        { re: -1, im: 1 },
        { re: -1, im: -1 },
      ];
      const z = rng.pick(bases);
      const n = rng.int(3, 8);
      const result = C.pow(z, n);
      const answer = C.str(result);
      return {
        prompt: `Use De Moivre's theorem to evaluate (${cplx(z.re, z.im)})^${n}, giving your answer in the form a + bi.`,
        answer,
        distractors: pickDistractors(answer, [
          C.str(C.pow(z, n - 1)), // one power short
          cplx(result.re, -result.im),
          cplx(-result.re, result.im),
          cplx(z.re ** n, z.im ** n), // raised each part separately
          C.str(C.pow(z, n + 1)),
        ]),
        explanation:
          `Write z in modulus–argument form: |z| = √2, arg z = ${argPi(z.re, z.im)}. ` +
          `By De Moivre, z^${n} has modulus (√2)^${n} and argument ${n} × (${argPi(z.re, z.im)}). ` +
          `Converting back to a + bi gives ${answer}.`,
        check: () => (C.eq(C.pow(z, n), result) ? null : "de moivre power mismatch"),
      };
    },
  }),

  generator({
    key: "fm.complex.de-moivre-polar",
    subject: "further-maths",
    topic: "fm-complex",
    subtopic: "de-moivre",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 10,
    build: (rng) => {
      const r = rng.int(2, 4);
      const argNum = rng.int(1, 5);
      const argDen = rng.pick([6, 5, 4, 3] as const);
      const n = rng.int(2, 4);
      const newR = r ** n;
      const newNum = argNum * n;
      const answer = `modulus ${newR}, argument ${simplifyPiFraction(newNum, argDen)}`;
      return {
        prompt:
          `The complex number z has modulus ${r} and argument ${simplifyPiFraction(argNum, argDen)}. ` +
          `Find the modulus and argument of z^${n} (you need not reduce the argument into a principal range).`,
        answer,
        distractors: pickDistractors(answer, [
          `modulus ${r * n}, argument ${simplifyPiFraction(newNum, argDen)}`, // multiplied the modulus by n
          `modulus ${newR}, argument ${simplifyPiFraction(argNum, argDen)}`, // left the argument alone
          `modulus ${newR}, argument ${simplifyPiFraction(argNum + n, argDen)}`, // added n to the argument
          `modulus ${r ** (n + 1)}, argument ${simplifyPiFraction(newNum, argDen)}`,
        ]),
        explanation:
          `De Moivre's theorem: raising to the power ${n} raises the modulus to the power ${n} ` +
          `(${r}^${n} = ${newR}) and multiplies the argument by ${n} ` +
          `(${n} × ${simplifyPiFraction(argNum, argDen)} = ${simplifyPiFraction(newNum, argDen)}).`,
        check: () =>
          r ** n === newR && argNum * n === newNum ? null : "polar de moivre mismatch",
      };
    },
  }),

  recall({
    key: "fm.complex.roots-of-unity",
    topic: "fm-complex",
    subtopic: "roots-of-unity",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "How many distinct roots does the equation z⁷ = 1 have?",
        a: "7",
        wrong: ["1", "14", "6", "Infinitely many"],
        why: "z^n = 1 has exactly n distinct roots, equally spaced around the unit circle.",
      },
      {
        q: "The seventh roots of unity lie on which curve in the Argand diagram?",
        a: "A circle of radius 1 centred at the origin",
        wrong: [
          "A circle of radius 7 centred at the origin",
          "The real axis only",
          "A straight line through the origin",
          "A circle of radius 1 centred at 1 + 0i",
        ],
        why: "Every root has modulus 1, so they all sit on the unit circle, forming a regular heptagon.",
      },
      {
        q: "What is the argument of the fifth root of unity with the smallest positive argument?",
        a: "2π/5",
        wrong: ["π/5", "π/10", "2π", "5π/2"],
        why: "The roots have arguments 2πk/5 for k = 0, 1, 2, 3, 4; the smallest positive one is at k = 1.",
      },
      {
        q: "If ω is a complex cube root of unity (ω ≠ 1), what is the value of 1 + ω + ω²?",
        a: "0",
        wrong: ["1", "3", "ω", "−1"],
        why: "The roots of z³ = 1 are the roots of (z − 1)(z² + z + 1) = 0, and the sum of all n nth roots of unity is 0.",
      },
      {
        q: "The solutions of z⁶ = 1 form which shape when joined in the Argand diagram?",
        a: "A regular hexagon",
        wrong: ["A regular pentagon", "An equilateral triangle", "A square", "A straight line"],
        why: "The n nth roots of unity are the vertices of a regular n-sided polygon inscribed in the unit circle.",
      },
    ],
  }),

  recall({
    key: "fm.complex.loci",
    topic: "fm-complex",
    subtopic: "argand-loci",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "In the Argand diagram, what is the locus of points z satisfying |z − (3 + 4i)| = 5?",
        a: "A circle of radius 5 centred at the point 3 + 4i",
        wrong: [
          "A circle of radius 5 centred at the origin",
          "A straight line through 3 + 4i",
          "A circle of radius 25 centred at 3 + 4i",
          "The single point 3 + 4i",
        ],
        why: "|z − a| = r is the set of points a fixed distance r from the fixed point a — a circle.",
      },
      {
        q: "What is the locus of points z satisfying |z − 2| = |z − 6i|?",
        a: "The perpendicular bisector of the line segment joining 2 and 6i",
        wrong: [
          "A circle with the segment from 2 to 6i as its diameter",
          "The line segment joining 2 and 6i",
          "A circle centred at the midpoint of 2 and 6i",
          "The single midpoint of 2 and 6i",
        ],
        why: "|z − a| = |z − b| means z is equidistant from a and b, which is the perpendicular bisector of ab.",
      },
      {
        q: "What is the locus of points z satisfying arg(z − 1) = π/4?",
        a: "A half-line (ray) starting at the point 1, at π/4 above the positive real direction",
        wrong: [
          "The whole line through 1 at gradient 1",
          "A circle centred at 1",
          "The positive real axis shifted to start at 1",
          "An arc of a circle through 1",
        ],
        why: "Fixing the argument fixes the direction from the point 1, but z − 1 = 0 is excluded, so it is a ray, not a full line.",
      },
      {
        q: "The locus |z − a| ≤ r describes which region?",
        a: "The closed disc: all points on or inside the circle of radius r centred at a",
        wrong: [
          "Only the boundary circle",
          "All points outside the circle",
          "A square of side 2r centred at a",
          "The circle of radius r centred at the origin",
        ],
        why: "The inequality includes every point whose distance from a is at most r.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

function describeQuadrant(re: number, im: number): string {
  if (re > 0 && im > 0) return "in the first quadrant";
  if (re < 0 && im > 0) return "in the second quadrant";
  if (re < 0 && im < 0) return "in the third quadrant";
  if (re > 0 && im < 0) return "in the fourth quadrant";
  if (re === 0 && im > 0) return "on the positive imaginary axis";
  if (re === 0 && im < 0) return "on the negative imaginary axis";
  if (im === 0 && re < 0) return "on the negative real axis";
  return "on the positive real axis";
}

/** `simplifyPiFraction(2, 4)` → "π/2", `(3, 3)` → "π", `(5, 6)` → "5π/6", `(0, 4)` → "0". */
function simplifyPiFraction(num: number, den: number): string {
  if (num === 0) return "0";
  let n = num;
  let d = den;
  const g = gcdInt(Math.abs(n), d);
  n /= g;
  d /= g;
  const sign = n < 0 ? "-" : "";
  const mag = Math.abs(n);
  const top = mag === 1 ? "π" : `${mag}π`;
  return d === 1 ? `${sign}${top}` : `${sign}${top}/${d}`;
}

function gcdInt(a: number, b: number): number {
  return b === 0 ? a || 1 : gcdInt(b, a % b);
}
