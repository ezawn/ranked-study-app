/**
 * Matrices (A-Level Further Maths).
 *
 * Multiplication, determinants, inverses and transformations, all on 2×2
 * matrices (with a 3×3 determinant question too). Every numeric answer is
 * computed and re-checked; the simultaneous-equations question is built by
 * choosing the solution first and multiplying up.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { point } from "./format";
import { Y12, Y13, recall, M, fraction, type Mat2 } from "./fm-kit";

const mat = (rng: { nonZero(a: number, b: number): number }): Mat2 => [
  [rng.nonZero(-5, 5), rng.nonZero(-5, 5)],
  [rng.nonZero(-5, 5), rng.nonZero(-5, 5)],
];

export const fmMatrices: Generator[] = [
  generator({
    key: "fm.matrices.multiply",
    subject: "further-maths",
    topic: "fm-matrices",
    subtopic: "multiplication",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const a = mat(rng);
      const b = mat(rng);
      const product = M.mul(a, b);
      const answer = M.str(product);
      const elementwise: Mat2 = [
        [a[0][0] * b[0][0], a[0][1] * b[0][1]],
        [a[1][0] * b[1][0], a[1][1] * b[1][1]],
      ];
      const wrongOrder = M.mul(b, a);
      return {
        prompt: `Given A = ${M.str(a)} and B = ${M.str(b)}, find the matrix product AB.`,
        answer,
        distractors: pickDistractors(answer, [
          M.str(elementwise), // multiplied entry by entry
          M.eq(wrongOrder, product) ? M.str([[product[0][0], product[1][0]], [product[0][1], product[1][1]]]) : M.str(wrongOrder), // computed BA
          M.str([[product[0][0], product[0][1] + 1], [product[1][0], product[1][1]]]),
          M.str([[a[0][0] + b[0][0], a[0][1] + b[0][1]], [a[1][0] + b[1][0], a[1][1] + b[1][1]]]), // added the matrices
        ]),
        explanation:
          `Each entry of AB is a row of A dotted with a column of B. ` +
          `Top-left = (${a[0][0]})(${b[0][0]}) + (${a[0][1]})(${b[1][0]}) = ${product[0][0]}, and so on, giving ${answer}.`,
        check: () => (M.eq(M.mul(a, b), product) ? null : "matrix product mismatch"),
      };
    },
  }),

  generator({
    key: "fm.matrices.determinant-2",
    subject: "further-maths",
    topic: "fm-matrices",
    subtopic: "determinant",
    curriculumLevel: Y12,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const m = mat(rng);
      const det = M.det(m);
      const answer = String(det);
      return {
        prompt: `Find the determinant of the matrix ${M.str(m)}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(m[0][0] * m[1][1] + m[0][1] * m[1][0]), // added instead of subtracted
          String(m[0][0] * m[0][1] - m[1][0] * m[1][1]),
          String(m[0][0] + m[1][1]), // trace
          String(-det),
          String(det + m[0][1]),
        ]),
        explanation:
          `For a 2×2 matrix [[a, b], [c, d]] the determinant is ad − bc. ` +
          `Here that is (${m[0][0]})(${m[1][1]}) − (${m[0][1]})(${m[1][0]}) = ${m[0][0] * m[1][1]} − ${m[0][1] * m[1][0]} = ${det}.`,
        check: () => (m[0][0] * m[1][1] - m[0][1] * m[1][0] === det ? null : "det mismatch"),
      };
    },
  }),

  generator({
    key: "fm.matrices.determinant-3",
    subject: "further-maths",
    topic: "fm-matrices",
    subtopic: "determinant",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const g = () => rng.int(-3, 4);
      const m = [
        [g(), g(), g()],
        [g(), g(), g()],
        [g(), g(), g()],
      ];
      const minor = (r: number, c: number) => {
        const rows = [0, 1, 2].filter((x) => x !== r);
        const cols = [0, 1, 2].filter((x) => x !== c);
        return m[rows[0]][cols[0]] * m[rows[1]][cols[1]] - m[rows[0]][cols[1]] * m[rows[1]][cols[0]];
      };
      const det = m[0][0] * minor(0, 0) - m[0][1] * minor(0, 1) + m[0][2] * minor(0, 2);
      const answer = String(det);
      const rowStr = (r: number[]) => `[${r.join(", ")}]`;
      return {
        prompt:
          `Find the determinant of the 3×3 matrix with rows ${rowStr(m[0])}, ${rowStr(m[1])}, ${rowStr(m[2])}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(m[0][0] * minor(0, 0) + m[0][1] * minor(0, 1) + m[0][2] * minor(0, 2)), // all plus signs
          String(m[0][0] * minor(0, 0) - m[0][1] * minor(0, 1) - m[0][2] * minor(0, 2)),
          String(m[0][0] + m[1][1] + m[2][2]), // trace
          String(-det),
          String(det + 1),
        ]),
        explanation:
          `Expand along the top row with the checkerboard of signs + − +: ` +
          `det = ${m[0][0]}·M₁₁ − ${m[0][1]}·M₁₂ + ${m[0][2]}·M₁₃ where each Mᵢⱼ is the 2×2 minor. That gives ${det}.`,
        check: () => {
          const d = m[0][0] * minor(0, 0) - m[0][1] * minor(0, 1) + m[0][2] * minor(0, 2);
          return d === det ? null : "3x3 det mismatch";
        },
      };
    },
  }),

  generator({
    key: "fm.matrices.inverse",
    subject: "further-maths",
    topic: "fm-matrices",
    subtopic: "inverse",
    curriculumLevel: Y12,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      let m: Mat2 = [
        [rng.nonZero(-4, 4), rng.nonZero(-4, 4)],
        [rng.nonZero(-4, 4), rng.nonZero(-4, 4)],
      ];
      let guard = 0;
      while (M.det(m) === 0 && guard < 60) {
        m = [
          [rng.nonZero(-4, 4), rng.nonZero(-4, 4)],
          [rng.nonZero(-4, 4), rng.nonZero(-4, 4)],
        ];
        guard++;
      }
      if (M.det(m) === 0) m = [[2, 1], [1, 1]]; // known non-singular fallback
      const det = M.det(m);
      const adjugate: Mat2 = [
        [m[1][1], -m[0][1]],
        [-m[1][0], m[0][0]],
      ];
      const scalar = fraction(1, det);
      const answer = `${scalar === "1" ? "" : scalar + " "}${M.str(adjugate)}`;
      return {
        prompt: `Find the inverse of the matrix ${M.str(m)}. Write it as a scalar multiple of a matrix.`,
        answer,
        distractors: pickDistractors(answer, [
          `${scalar === "1" ? "" : scalar + " "}${M.str([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])}`, // forgot the adjugate swap
          `${scalar === "1" ? "" : scalar + " "}${M.str([[m[1][1], m[0][1]], [m[1][0], m[0][0]]])}`, // swapped a,d but didn't negate b,c
          `${fraction(1, -det) === "1" ? "" : fraction(1, -det) + " "}${M.str(adjugate)}`, // wrong sign on the determinant
          `${M.str(adjugate)}`, // dropped the 1/det factor
        ]),
        explanation:
          `For [[a, b], [c, d]] the inverse is (1/det)·[[d, −b], [−c, a]], provided det ≠ 0. ` +
          `Here det = ${det}, so the inverse is ${answer}.`,
        check: () => {
          const dd = M.det(m);
          const prod = M.mul(m, adjugate); // should be det·I
          return prod[0][0] === dd && prod[1][1] === dd && prod[0][1] === 0 && prod[1][0] === 0
            ? null
            : "adjugate check failed";
        },
      };
    },
  }),

  generator({
    key: "fm.matrices.transformation-image",
    subject: "further-maths",
    topic: "fm-matrices",
    subtopic: "transformations",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      const named: { m: Mat2; desc: string }[] = [
        { m: [[0, -1], [1, 0]], desc: "a rotation of 90° anticlockwise about the origin" },
        { m: [[0, 1], [-1, 0]], desc: "a rotation of 90° clockwise about the origin" },
        { m: [[-1, 0], [0, -1]], desc: "a rotation of 180° about the origin" },
        { m: [[1, 0], [0, -1]], desc: "a reflection in the x-axis" },
        { m: [[-1, 0], [0, 1]], desc: "a reflection in the y-axis" },
        { m: [[0, 1], [1, 0]], desc: "a reflection in the line y = x" },
        { m: [[2, 0], [0, 2]], desc: "an enlargement scale factor 2 about the origin" },
        { m: [[3, 0], [0, 3]], desc: "an enlargement scale factor 3 about the origin" },
      ];
      const t = rng.pick(named);
      const px = rng.nonZero(-6, 6);
      const py = rng.nonZero(-6, 6);
      const ix = t.m[0][0] * px + t.m[0][1] * py;
      const iy = t.m[1][0] * px + t.m[1][1] * py;
      const answer = point(ix, iy);
      return {
        prompt:
          `The matrix ${M.str(t.m)} represents ${t.desc}. Find the image of the point ${point(px, py)} under this transformation.`,
        answer,
        distractors: pickDistractors(answer, [
          point(t.m[0][0] * px + t.m[1][0] * py, t.m[0][1] * px + t.m[1][1] * py), // used columns as rows
          point(iy, ix), // swapped the coordinates
          point(-ix, -iy),
          point(px, py), // left the point unchanged
          point(ix + 1, iy),
        ]),
        explanation:
          `Multiply the matrix by the column vector (${px}, ${py}): ` +
          `x' = (${t.m[0][0]})(${px}) + (${t.m[0][1]})(${py}) = ${ix}, y' = (${t.m[1][0]})(${px}) + (${t.m[1][1]})(${py}) = ${iy}. Image ${answer}.`,
        check: () => {
          const x = t.m[0][0] * px + t.m[0][1] * py;
          const y = t.m[1][0] * px + t.m[1][1] * py;
          return x === ix && y === iy ? null : "image mismatch";
        },
      };
    },
  }),

  recall({
    key: "fm.matrices.transformation-identify",
    topic: "fm-matrices",
    subtopic: "transformations",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "Which single transformation does the matrix [[0, -1], [1, 0]] represent?",
        a: "A rotation of 90° anticlockwise about the origin",
        wrong: [
          "A rotation of 90° clockwise about the origin",
          "A reflection in the line y = x",
          "A reflection in the y-axis",
          "An enlargement scale factor −1",
        ],
        why: "It sends (1, 0) to (0, 1) and (0, 1) to (−1, 0), which is a quarter turn anticlockwise.",
      },
      {
        q: "Which single transformation does the matrix [[0, 1], [1, 0]] represent?",
        a: "A reflection in the line y = x",
        wrong: [
          "A rotation of 90° anticlockwise about the origin",
          "A reflection in the x-axis",
          "A rotation of 180° about the origin",
          "A shear parallel to the x-axis",
        ],
        why: "It swaps the x- and y-coordinates of every point, which is reflection in y = x.",
      },
      {
        q: "What does the determinant of a 2×2 transformation matrix tell you geometrically?",
        a: "The scale factor for area, and its sign shows whether orientation is reversed",
        wrong: [
          "The angle of rotation in degrees",
          "The distance every point is translated",
          "The number of invariant lines the transformation has",
          "Whether the transformation is a rotation or a reflection only",
        ],
        why: "|det| scales areas; a negative determinant means the transformation includes a reflection.",
      },
      {
        q: "A transformation has matrix [[k, 0], [0, k]]. What transformation is it (for k > 0)?",
        a: "An enlargement, scale factor k, centred on the origin",
        wrong: [
          "A rotation through k radians",
          "A translation by the vector (k, k)",
          "A stretch parallel to the x-axis only",
          "A shear with factor k",
        ],
        why: "Each coordinate is multiplied by k, moving every point k times as far from the origin.",
      },
      {
        q: "Under a linear transformation represented by a 2×2 matrix, which point is always invariant?",
        a: "The origin",
        wrong: [
          "The point (1, 1)",
          "Every point on the x-axis",
          "The point (1, 0)",
          "No point is ever invariant",
        ],
        why: "A matrix maps the zero vector to the zero vector, so the origin never moves.",
      },
    ],
  }),

  generator({
    key: "fm.matrices.simultaneous",
    subject: "further-maths",
    topic: "fm-matrices",
    subtopic: "simultaneous",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      let a: number, b: number, c: number, d: number;
      do {
        a = rng.nonZero(-4, 4);
        b = rng.nonZero(-4, 4);
        c = rng.nonZero(-4, 4);
        d = rng.nonZero(-4, 4);
      } while (a * d - b * c === 0);
      const x = rng.nonZero(-5, 5);
      const y = rng.nonZero(-5, 5);
      const e = a * x + b * y;
      const f = c * x + d * y;
      const answer = point(x, y);
      const eq = (p: number, q: number, r: number) =>
        `${p === 1 ? "" : p === -1 ? "-" : p}x ${q < 0 ? "-" : "+"} ${Math.abs(q) === 1 ? "" : Math.abs(q)}y = ${r}`;
      return {
        prompt:
          `Use the inverse matrix method to solve the simultaneous equations ` +
          `${eq(a, b, e)} and ${eq(c, d, f)}. Give (x, y).`,
        answer,
        distractors: pickDistractors(answer, [
          point(y, x), // swapped x and y
          point(-x, -y),
          point(x + 1, y - 1),
          point(x, -y),
          point(e - f, f),
        ]),
        explanation:
          `Write the system as a matrix equation and multiply by the inverse of [[${a}, ${b}], [${c}, ${d}]] ` +
          `(its determinant is ${a * d - b * c}). This gives x = ${x}, y = ${y}.`,
        check: () => (a * x + b * y === e && c * x + d * y === f ? null : "simultaneous solution mismatch"),
      };
    },
  }),

  recall({
    key: "fm.matrices.singular",
    topic: "fm-matrices",
    subtopic: "inverse",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "A square matrix is described as singular. What does this mean?",
        a: "Its determinant is zero, so it has no inverse",
        wrong: [
          "It is a 1×1 matrix",
          "All of its entries are equal",
          "It is its own inverse",
          "It has determinant 1",
        ],
        why: "The inverse formula divides by the determinant, so a zero determinant leaves the matrix non-invertible.",
      },
      {
        q: "The transformation represented by a singular 2×2 matrix maps the whole plane onto what?",
        a: "A straight line through the origin (or a single point)",
        wrong: [
          "The whole plane, one-to-one",
          "A circle centred at the origin",
          "A parabola",
          "The empty set",
        ],
        why: "A zero determinant means area is scaled by 0, collapsing the plane onto a lower-dimensional set.",
      },
      {
        q: "For what value of k is the matrix [[k, 3], [2, k]] singular?",
        a: "k = √6 or k = −√6",
        wrong: ["k = 6 only", "k = 0 only", "k = 5 or k = 1", "There is no such value"],
        why: "Singular means det = 0: k² − 6 = 0, so k = ±√6.",
      },
    ],
  }),
];
