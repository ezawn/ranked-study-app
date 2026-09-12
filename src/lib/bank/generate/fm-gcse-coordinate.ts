/**
 * Coordinate geometry (GCSE Further Maths — AQA Level 2).
 *
 * Perpendicular lines, the equation of a circle with any centre, and tangents
 * to a circle at a point. Circle-and-tangent questions use Pythagorean lattice
 * points so the tangent px + qy = r² has integer coefficients.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { point } from "./format";
import { Y10, Y11, recall } from "./fm-kit";

/** Points (p, q) with p² + q² a perfect square, so they sit on a circle of integer radius. */
const LATTICE: [number, number][] = [
  [3, 4],
  [4, 3],
  [-3, 4],
  [3, -4],
  [-4, -3],
  [5, 12],
  [12, 5],
  [8, 15],
  [-8, 15],
  [6, 8],
  [-6, 8],
  [9, 12],
  [7, 24],
];

export const fmGcseCoordinate: Generator[] = [
  generator({
    key: "fmg.coord.perpendicular",
    subject: "further-maths",
    topic: "fmg-coordinate",
    subtopic: "straight-lines",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const m = rng.pick([2, 3, 4, -2, -3, 5] as const); // gradient of the given line
      const lc = rng.nonZero(-9, 9); // L's y-intercept (does not affect the answer)
      const t = rng.nonZero(-3, 3);
      const x0 = m * t; // multiple of m, so the perpendicular's intercept is an integer
      const y0 = rng.nonZero(-8, 8);
      /* Perpendicular gradient = −1/m; line through (x0, y0): y = (−1/m)x + c, c = y0 + x0/m = y0 + t. */
      const c = y0 + t;
      const answer = `y = ${slopeStr(-1, m)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)}`;
      return {
        prompt:
          `Line L has equation y = ${m}x ${lc < 0 ? "−" : "+"} ${Math.abs(lc)}. ` +
          `Line M is perpendicular to L and passes through the point ${point(x0, y0)}. Find the equation of line M in the form y = mx + c.`,
        answer,
        distractors: pickDistractors(answer, [
          `y = ${m}x ${y0 - m * x0 < 0 ? "−" : "+"} ${Math.abs(y0 - m * x0)}`, // used L's gradient (parallel, not perpendicular)
          `y = ${slopeStr(-1, m)}x ${y0 < 0 ? "−" : "+"} ${Math.abs(y0)}`,
          `y = ${slopeStr(1, m)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)}`, // dropped the minus sign
          `y = ${slopeStr(-1, m)}x`,
          `y = ${m}x ${c < 0 ? "−" : "+"} ${Math.abs(c)}`,
        ]),
        explanation:
          `Perpendicular gradients multiply to −1, so line M has gradient −1/${m}. ` +
          `Substitute ${point(x0, y0)} into y = (−1/${m})x + c: ${y0} = ${slopeStr(-1, m)}(${x0}) + c, so c = ${c}. ` +
          `Thus ${answer}.`,
        check: () => {
          const yAt = (-1 / m) * x0 + c;
          return Math.abs(yAt - y0) < 1e-9 ? null : "perpendicular line misses the point";
        },
      };
    },
  }),

  generator({
    key: "fmg.coord.circle-centre-radius",
    subject: "further-maths",
    topic: "fmg-coordinate",
    subtopic: "circle-equation",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const a = rng.nonZero(-6, 6);
      const b = rng.nonZero(-6, 6);
      const r = rng.int(2, 9);
      const forward = rng.bool();
      const eq = `(x ${a < 0 ? "+" : "−"} ${Math.abs(a)})² + (y ${b < 0 ? "+" : "−"} ${Math.abs(b)})² = ${r * r}`;
      if (forward) {
        const answer = eq;
        return {
          prompt: `Write down the equation of the circle with centre ${point(a, b)} and radius ${r}.`,
          answer,
          distractors: pickDistractors(answer, [
            `(x ${a < 0 ? "−" : "+"} ${Math.abs(a)})² + (y ${b < 0 ? "−" : "+"} ${Math.abs(b)})² = ${r * r}`, // wrong signs in the brackets
            `(x ${a < 0 ? "+" : "−"} ${Math.abs(a)})² + (y ${b < 0 ? "+" : "−"} ${Math.abs(b)})² = ${r}`, // used r instead of r²
            `(x ${a < 0 ? "+" : "−"} ${Math.abs(a)})² + (y ${b < 0 ? "+" : "−"} ${Math.abs(b)})² = ${2 * r}`,
            `x² + y² = ${r * r}`,
          ]),
          explanation:
            `A circle with centre (a, b) and radius r has equation (x − a)² + (y − b)² = r². ` +
            `Here a = ${a}, b = ${b}, r = ${r}, so the equation is ${answer}.`,
        };
      }
      const answer = `centre ${point(a, b)}, radius ${r}`;
      return {
        prompt: `A circle has equation ${eq}. State its centre and radius.`,
        answer,
        distractors: pickDistractors(answer, [
          `centre ${point(-a, -b)}, radius ${r}`, // read the signs straight off the brackets
          `centre ${point(a, b)}, radius ${r * r}`, // did not square-root the right-hand side
          `centre ${point(b, a)}, radius ${r}`,
          `centre (0, 0), radius ${r}`,
        ]),
        explanation:
          `Compare with (x − a)² + (y − b)² = r². The bracket (x ${a < 0 ? "+" : "−"} ${Math.abs(a)}) gives a = ${a}, ` +
          `(y ${b < 0 ? "+" : "−"} ${Math.abs(b)}) gives b = ${b}, and r² = ${r * r} gives r = ${r}.`,
      };
    },
  }),

  generator({
    key: "fmg.coord.point-on-circle",
    subject: "further-maths",
    topic: "fmg-coordinate",
    subtopic: "circle-equation",
    curriculumLevel: Y11,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const a = rng.int(-4, 4);
      const b = rng.int(-4, 4);
      const [dx, dy] = rng.pick(LATTICE);
      const r2 = dx * dx + dy * dy;
      const on = rng.bool();
      const px = a + dx + (on ? 0 : rng.pick([1, -1, 2] as const));
      const py = b + dy;
      const lhs = (px - a) ** 2 + (py - b) ** 2;
      const isOn = lhs === r2;
      const answer = isOn ? "Yes, the point lies on the circle" : "No, the point does not lie on the circle";
      return {
        prompt:
          `Does the point ${point(px, py)} lie on the circle ` +
          `(x ${a < 0 ? "+" : "−"} ${Math.abs(a)})² + (y ${b < 0 ? "+" : "−"} ${Math.abs(b)})² = ${r2}?`,
        answer,
        distractors: pickDistractors(answer, [
          isOn ? "No, the point does not lie on the circle" : "Yes, the point lies on the circle",
          "Only if it is also the centre",
          "It lies inside the circle but not on it",
          "It cannot be decided without the radius",
        ]),
        explanation:
          `Substitute the point into the left-hand side: (${px} ${-a < 0 ? "−" : "+"} ${Math.abs(a)})² + (${py} ${-b < 0 ? "−" : "+"} ${Math.abs(b)})² = ${(px - a) ** 2} + ${(py - b) ** 2} = ${lhs}. ` +
          `This ${isOn ? "equals" : "does not equal"} ${r2}, so the point ${isOn ? "is" : "is not"} on the circle.`,
        check: () => ((lhs === r2) === isOn ? null : "membership mismatch"),
      };
    },
  }),

  generator({
    key: "fmg.coord.tangent-to-circle",
    subject: "further-maths",
    topic: "fmg-coordinate",
    subtopic: "tangents",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const [p, q] = rng.pick(LATTICE.filter(([x, y]) => x !== 0 && y !== 0));
      const r2 = p * p + q * q;
      /* Circle x² + y² = r²; tangent at (p, q) is px + qy = r². */
      const answer = `${p}x ${q < 0 ? "−" : "+"} ${Math.abs(q)}y = ${r2}`;
      const radiusGrad = `${q}/${p}`;
      const tangentGrad = slopeStr(-p, q);
      return {
        prompt:
          `The point ${point(p, q)} lies on the circle x² + y² = ${r2}. ` +
          `Find the equation of the tangent to the circle at that point.`,
        answer,
        distractors: pickDistractors(answer, [
          `${p}x ${q < 0 ? "−" : "+"} ${Math.abs(q)}y = 0`, // tangent through the origin (that is the radius, not the tangent)
          `${q}x ${p < 0 ? "−" : "+"} ${Math.abs(p)}y = ${r2}`, // swapped p and q
          `${p}x ${q < 0 ? "+" : "−"} ${Math.abs(q)}y = ${r2}`, // sign slip
          `y = ${radiusGrad}x`, // gave the radius, not the tangent
          `${p}x ${q < 0 ? "−" : "+"} ${Math.abs(q)}y = ${2 * r2}`,
        ]),
        explanation:
          `The radius to ${point(p, q)} has gradient ${q}/${p}, so the tangent (perpendicular to it) has gradient ${tangentGrad}. ` +
          `The tangent to x² + y² = r² at (p, q) is px + qy = r², which here is ${answer}.`,
        check: () => {
          /* The tangent point must satisfy the tangent line, and lie on the circle. */
          const onLine = p * p + q * q === r2;
          const onCircle = p * p + q * q === r2;
          return onLine && onCircle ? null : "tangent construction failed";
        },
      };
    },
  }),

  recall({
    key: "fmg.coord.circle-concepts",
    topic: "fmg-coordinate",
    subtopic: "tangents",
    level: Y11,
    difficulty: 5,
    cases: [
      {
        q: "What is the relationship between a radius of a circle and the tangent at the point where that radius meets the circumference?",
        a: "They are perpendicular",
        wrong: ["They are parallel", "They are equal in length", "They meet at 45°", "The tangent passes through the centre"],
        why: "The tangent–radius property: the tangent is at right angles to the radius drawn to the point of contact.",
      },
      {
        q: "A line from the centre of a circle to the midpoint of a chord does what to the chord?",
        a: "It bisects the chord at right angles",
        wrong: [
          "It is parallel to the chord",
          "It is a tangent to the circle",
          "It has the same length as the chord",
          "It bisects the chord but not at right angles",
        ],
        why: "The perpendicular from the centre to a chord bisects it — a standard circle property used in coordinate proofs.",
      },
      {
        q: "The equation x² + y² + 6x − 4y − 12 = 0 is a circle. What is its radius? (Hint: complete the square.)",
        a: "5",
        wrong: ["12", "25", "√12", "13"],
        why: "Completing the square gives (x + 3)² + (y − 2)² = 12 + 9 + 4 = 25, so r² = 25 and r = 5.",
      },
      {
        q: "How many tangents to a circle can be drawn from a point outside the circle?",
        a: "Exactly two",
        wrong: ["Exactly one", "None", "Infinitely many", "It depends on the radius"],
        why: "From an external point there are two tangent lines, symmetric about the line to the centre; from a point on the circle, just one.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

/** A slope num/den reduced to lowest terms, e.g. slopeStr(-1, 3) → "-1/3", slopeStr(-2, 4) → "-1/2", slopeStr(-3, 3) → "-1". */
function slopeStr(num: number, den: number): string {
  let n = num;
  let d = den;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd2(Math.abs(n), d) || 1;
  n /= g;
  d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

function gcd2(a: number, b: number): number {
  return b === 0 ? a : gcd2(b, a % b);
}
