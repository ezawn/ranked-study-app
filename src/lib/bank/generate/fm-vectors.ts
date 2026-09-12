/**
 * Further vectors (A-Level Further Maths): the vector (cross) product, the
 * scalar triple product, lines and planes in 3-D, and distances.
 *
 * The cross-product and triple-product answers are computed and re-checked
 * (a × b is perpendicular to both a and b; the triple product equals the 3×3
 * determinant). Plane-membership and distance questions substitute the point.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Y12, Y13, recall, V, rootString, type Vec3 } from "./fm-kit";

const vec = (rng: { int(a: number, b: number): number }): Vec3 => [
  rng.int(-4, 4),
  rng.int(-4, 4),
  rng.int(-4, 4),
];

export const fmVectors: Generator[] = [
  generator({
    key: "fm.vectors.cross-product",
    subject: "further-maths",
    topic: "fm-vectors",
    subtopic: "cross-product",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      let a = vec(rng);
      let b = vec(rng);
      let guard = 0;
      while (V.eq(V.cross(a, b), [0, 0, 0]) && guard < 20) {
        a = vec(rng);
        b = vec(rng);
        guard++;
      }
      if (V.eq(V.cross(a, b), [0, 0, 0])) {
        a = [1, 2, 1];
        b = [2, -1, 3];
      }
      const result = V.cross(a, b);
      const answer = V.str(result);
      return {
        prompt: `Find the vector product a × b, where a = ${V.str(a)} and b = ${V.str(b)}.`,
        answer,
        distractors: pickDistractors(answer, [
          V.str(V.cross(b, a)), // computed b × a (the negative)
          V.str([a[0] * b[0], a[1] * b[1], a[2] * b[2]]), // multiplied component by component
          V.str([result[0], -result[1], result[2]]), // sign slip on the middle component
          V.str([a[1] * b[2] + a[2] * b[1], a[2] * b[0] + a[0] * b[2], a[0] * b[1] + a[1] * b[0]]), // all plus
        ]),
        explanation:
          `Using the determinant with i, j, k in the top row: ` +
          `i(a₂b₃ − a₃b₂) − j(a₁b₃ − a₃b₁) + k(a₁b₂ − a₂b₁) = ${answer}. ` +
          `Watch the minus sign on the j component.`,
        check: () => {
          const c = V.cross(a, b);
          if (!V.eq(c, result)) return "cross product mismatch";
          return V.dot(c, a) === 0 && V.dot(c, b) === 0 ? null : "result not perpendicular to a and b";
        },
      };
    },
  }),

  generator({
    key: "fm.vectors.scalar-triple",
    subject: "further-maths",
    topic: "fm-vectors",
    subtopic: "scalar-triple",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const a = vec(rng);
      const b = vec(rng);
      const c = vec(rng);
      const triple = V.dot(a, V.cross(b, c));
      const askVolume = rng.bool();
      const answer = askVolume ? String(Math.abs(triple)) : String(triple);
      return {
        prompt: askVolume
          ? `Find the volume of the parallelepiped with edges a = ${V.str(a)}, b = ${V.str(b)} and c = ${V.str(c)}.`
          : `Evaluate the scalar triple product a · (b × c), where a = ${V.str(a)}, b = ${V.str(b)} and c = ${V.str(c)}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(askVolume ? -Math.abs(triple) - 1 : -triple),
          String(V.dot(a, b) + V.dot(b, c) + V.dot(a, c)),
          String(triple + (askVolume ? 2 : 1)),
          String(V.dot(a, b)),
          String(2 * triple),
        ]),
        explanation:
          `a · (b × c) is the 3×3 determinant with rows a, b, c, which comes to ${triple}. ` +
          (askVolume
            ? `The volume of the parallelepiped is its absolute value, ${Math.abs(triple)}.`
            : `A value of 0 would mean the three vectors are coplanar.`),
        check: () => {
          const t = V.dot(a, V.cross(b, c));
          return t === triple ? null : "triple product mismatch";
        },
      };
    },
  }),

  generator({
    key: "fm.vectors.perpendicular",
    subject: "further-maths",
    topic: "fm-vectors",
    subtopic: "distances",
    curriculumLevel: Y12,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const perp = rng.bool();
      /* A non-zero a: try random, fall back if it comes out as the zero vector. */
      let a: Vec3 = vec(rng);
      if (a[0] === 0 && a[1] === 0 && a[2] === 0) a = [rng.nonZero(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
      /* (a₁−a₂, a₂−a₀, a₀−a₁) is always orthogonal to (a₀, a₁, a₂). */
      let ortho: Vec3 = [a[1] - a[2], a[2] - a[0], a[0] - a[1]];
      if (ortho[0] === 0 && ortho[1] === 0 && ortho[2] === 0) ortho = [a[1], -a[0], 0];
      if (ortho[0] === 0 && ortho[1] === 0 && ortho[2] === 0) ortho = [0, a[2], -a[1]];
      /* Perpendicular: b = ortho. Not perpendicular: b = ortho + a, so a·b = |a|² ≠ 0
         and b is not parallel to a either. */
      const b: Vec3 = perp ? ortho : [ortho[0] + a[0], ortho[1] + a[1], ortho[2] + a[2]];
      const dot = V.dot(a, b);
      const answer = dot === 0 ? "Yes, they are perpendicular" : "No, they are not perpendicular";
      return {
        prompt: `Are the vectors a = ${V.str(a)} and b = ${V.str(b)} perpendicular?`,
        answer,
        distractors: pickDistractors(answer, [
          dot === 0 ? "No, they are not perpendicular" : "Yes, they are perpendicular",
          "Only if they also have equal magnitude",
          "They are parallel, not perpendicular",
          "It cannot be decided without finding the angle exactly",
        ]),
        explanation:
          `Two vectors are perpendicular exactly when their scalar (dot) product is zero. ` +
          `Here a · b = (${a[0]})(${b[0]}) + (${a[1]})(${b[1]}) + (${a[2]})(${b[2]}) = ${dot}, ` +
          `so they ${dot === 0 ? "are" : "are not"} perpendicular.`,
        check: () => (V.dot(a, b) === dot ? null : "dot product mismatch"),
      };
    },
  }),

  generator({
    key: "fm.vectors.point-on-plane",
    subject: "further-maths",
    topic: "fm-vectors",
    subtopic: "lines-planes",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      const n: Vec3 = [rng.nonZero(-3, 3), rng.nonZero(-3, 3), rng.nonZero(-3, 3)];
      const d = rng.int(-8, 10);
      const p: Vec3 = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
      const lhs = V.dot(n, p);
      const onPlane = lhs === d;
      const planeEq = `${n[0]}x ${n[1] < 0 ? "−" : "+"} ${Math.abs(n[1])}y ${n[2] < 0 ? "−" : "+"} ${Math.abs(n[2])}z = ${d}`;
      const answer = onPlane ? "Yes, the point lies on the plane" : "No, the point does not lie on the plane";
      return {
        prompt: `Does the point ${V.str(p)} lie on the plane ${planeEq}?`,
        answer,
        distractors: pickDistractors(answer, [
          onPlane ? "No, the point does not lie on the plane" : "Yes, the point lies on the plane",
          "Only if the origin also lies on the plane",
          "The point lies on a parallel plane, not this one",
          "It cannot be determined from the equation alone",
        ]),
        explanation:
          `Substitute the point into the left-hand side: (${n[0]})(${p[0]}) + (${n[1]})(${p[1]}) + (${n[2]})(${p[2]}) = ${lhs}. ` +
          `This ${onPlane ? "equals" : "does not equal"} ${d}, so the point ${onPlane ? "does" : "does not"} lie on the plane.`,
        check: () => (V.dot(n, p) === lhs ? null : "substitution mismatch"),
      };
    },
  }),

  generator({
    key: "fm.vectors.distance-to-plane",
    subject: "further-maths",
    topic: "fm-vectors",
    subtopic: "distances",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      /* Keep |n| an integer so the exact answer is a tidy fraction. */
      const normals: Vec3[] = [
        [1, 2, 2],
        [2, 3, 6],
        [2, 6, 3],
        [1, 2, 2],
        [4, 0, 3],
        [0, 3, 4],
      ];
      const n = rng.pick(normals);
      const modN = Math.round(Math.hypot(n[0], n[1], n[2]));
      const d = rng.int(-6, 8);
      const p: Vec3 = [rng.int(-4, 5), rng.int(-4, 5), rng.int(-4, 5)];
      if (V.dot(n, p) === d) {
        /* Nudge along an axis the normal actually uses, so the point leaves the plane. */
        for (let i = 0; i < 3; i++) if (n[i] !== 0) { p[i] += 1; break; }
      }
      const numerator = Math.abs(V.dot(n, p) - d);
      const answer = fracString(numerator, modN);
      const planeEq = `${n[0]}x ${n[1] < 0 ? "−" : "+"} ${Math.abs(n[1])}y ${n[2] < 0 ? "−" : "+"} ${Math.abs(n[2])}z = ${d}`;
      return {
        prompt: `Find the perpendicular distance from the point ${V.str(p)} to the plane ${planeEq}. Give an exact answer.`,
        answer,
        distractors: pickDistractors(answer, [
          String(numerator), // forgot to divide by |n|
          fracString(numerator, modN * modN), // divided by |n|²
          fracString(Math.abs(V.dot(n, p) + d), modN), // wrong sign on d
          fracString(numerator + 1, modN),
          rootString(numerator),
        ]),
        explanation:
          `The distance is |n·p − d| / |n|. Here n·p = ${V.dot(n, p)}, so |n·p − d| = |${V.dot(n, p)} − ${d}| = ${numerator}, ` +
          `and |n| = √(${n[0]}² + ${n[1]}² + ${n[2]}²) = ${modN}. Distance = ${answer}.`,
        check: () => {
          const modCheck = Math.hypot(n[0], n[1], n[2]);
          return Math.abs(modCheck - modN) < 1e-9 && numerator === Math.abs(V.dot(n, p) - d)
            ? null
            : "distance components mismatch";
        },
      };
    },
  }),

  recall({
    key: "fm.vectors.lines-planes-concepts",
    topic: "fm-vectors",
    subtopic: "lines-planes",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "The plane 3x − y + 2z = 7 has which normal vector?",
        a: "(3, −1, 2)",
        wrong: ["(7, 7, 7)", "(3, 1, 2)", "(1/3, −1, 1/2)", "(−3, 1, −2) only"],
        why: "In the scalar-product form n·r = d, the coefficients of x, y, z are the components of the normal n.",
      },
      {
        q: "How do you find the acute angle between a line with direction d and a plane with normal n?",
        a: "Find the angle between d and n, then subtract it from 90°",
        wrong: [
          "Find the angle between d and n directly",
          "Find the angle between n and the plane 0x + 0y + 0z = 0",
          "Take the arctan of |d| / |n|",
          "It is always 90°",
        ],
        why: "The angle to the normal plus the angle to the plane is 90°, so sin(angle to plane) = |d·n| / (|d||n|).",
      },
      {
        q: "Two lines in 3-D are neither parallel nor intersecting. What are they called?",
        a: "Skew lines",
        wrong: ["Perpendicular lines", "Coincident lines", "Coplanar lines", "Parallel lines"],
        why: "Skew lines lie in different planes; this only happens in three or more dimensions.",
      },
      {
        q: "The vector equation of a line is r = a + λd. What do a and d represent?",
        a: "a is the position vector of a point on the line; d is a direction vector along the line",
        wrong: [
          "a and d are both points the line passes through",
          "a is the direction; d is a point on the line",
          "a is the origin; d is the midpoint",
          "a and d are both normals to the line",
        ],
        why: "Varying the scalar λ moves you along the line from the fixed point a in the direction d.",
      },
      {
        q: "How can you tell that two planes are parallel from their equations?",
        a: "Their normal vectors are scalar multiples of each other",
        wrong: [
          "Their constant terms d are equal",
          "They share at least one common point",
          "Their normal vectors are perpendicular",
          "The sum of their normals is the zero vector",
        ],
        why: "Parallel planes face the same way, so one normal is a multiple of the other; equal d would make them the same plane.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

/** `a/b` in lowest terms, as a plain string. */
function fracString(a: number, b: number): string {
  if (b === 0) return "undefined";
  const g = gcd2(Math.abs(a), Math.abs(b)) || 1;
  const n = a / g;
  const d = b / g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

function gcd2(a: number, b: number): number {
  return b === 0 ? a : gcd2(b, a % b);
}
