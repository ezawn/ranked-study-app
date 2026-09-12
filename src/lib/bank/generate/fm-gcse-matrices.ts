/**
 * Matrices (GCSE Further Maths — AQA Level 2).
 *
 * 2×2 matrix arithmetic, transformations of points, and combined
 * transformations (the product of two matrices). No determinants or inverses
 * at this level. Every result is computed and re-checked.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { point } from "./format";
import { Y10, Y11, recall, M, type Mat2 } from "./fm-kit";

const mat = (rng: { nonZero(a: number, b: number): number }): Mat2 => [
  [rng.nonZero(-5, 5), rng.nonZero(-5, 5)],
  [rng.nonZero(-5, 5), rng.nonZero(-5, 5)],
];

const NAMED: { m: Mat2; desc: string }[] = [
  { m: [[0, -1], [1, 0]], desc: "a rotation of 90° anticlockwise about the origin" },
  { m: [[0, 1], [-1, 0]], desc: "a rotation of 90° clockwise about the origin" },
  { m: [[-1, 0], [0, -1]], desc: "a rotation of 180° about the origin" },
  { m: [[1, 0], [0, -1]], desc: "a reflection in the x-axis" },
  { m: [[-1, 0], [0, 1]], desc: "a reflection in the y-axis" },
  { m: [[0, 1], [1, 0]], desc: "a reflection in the line y = x" },
  { m: [[0, -1], [-1, 0]], desc: "a reflection in the line y = −x" },
];

export const fmGcseMatrices: Generator[] = [
  generator({
    key: "fmg.mat.arithmetic",
    subject: "further-maths",
    topic: "fmg-matrices",
    subtopic: "arithmetic",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const a = mat(rng);
      const b = mat(rng);
      const op = rng.pick(["+", "−", "×", "scalar"] as const);
      let result: Mat2;
      let promptOp: string;
      if (op === "+") {
        result = [[a[0][0] + b[0][0], a[0][1] + b[0][1]], [a[1][0] + b[1][0], a[1][1] + b[1][1]]];
        promptOp = "A + B";
      } else if (op === "−") {
        result = [[a[0][0] - b[0][0], a[0][1] - b[0][1]], [a[1][0] - b[1][0], a[1][1] - b[1][1]]];
        promptOp = "A − B";
      } else if (op === "×") {
        result = M.mul(a, b);
        promptOp = "AB";
      } else {
        const k = rng.pick([2, 3, -2] as const);
        result = [[k * a[0][0], k * a[0][1]], [k * a[1][0], k * a[1][1]]];
        promptOp = `${k}A`;
      }
      const answer = M.str(result);
      return {
        prompt: `A = ${M.str(a)} and B = ${M.str(b)}. Work out ${promptOp}.`,
        answer,
        distractors: pickDistractors(answer, [
          op === "×"
            ? M.str([[a[0][0] * b[0][0], a[0][1] * b[0][1]], [a[1][0] * b[1][0], a[1][1] * b[1][1]]]) // multiplied entry by entry
            : M.str(M.mul(a, b)),
          M.str([[a[0][0] + b[0][0], a[0][1] + b[0][1]], [a[1][0] + b[1][0], a[1][1] + b[1][1]]]), // added instead
          M.str([[result[0][0], result[0][1]], [result[1][1], result[1][0]]]), // last row swapped
          M.str([[result[0][0] + 1, result[0][1]], [result[1][0], result[1][1]]]),
        ]),
        explanation:
          op === "×"
            ? `Each entry of AB is a row of A combined with a column of B: top-left = (${a[0][0]})(${b[0][0]}) + (${a[0][1]})(${b[1][0]}) = ${result[0][0]}, and so on, giving ${answer}.`
            : op === "scalar"
              ? `Multiply every entry of A by the scalar, giving ${answer}.`
              : `Add or subtract corresponding entries, giving ${answer}.`,
        check: () => {
          let expected: Mat2;
          if (op === "+") expected = [[a[0][0] + b[0][0], a[0][1] + b[0][1]], [a[1][0] + b[1][0], a[1][1] + b[1][1]]];
          else if (op === "−") expected = [[a[0][0] - b[0][0], a[0][1] - b[0][1]], [a[1][0] - b[1][0], a[1][1] - b[1][1]]];
          else if (op === "×") expected = M.mul(a, b);
          else return null;
          return M.eq(expected, result) ? null : "matrix arithmetic mismatch";
        },
      };
    },
  }),

  generator({
    key: "fmg.mat.transform-point",
    subject: "further-maths",
    topic: "fmg-matrices",
    subtopic: "transformations",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const t = rng.pick(NAMED);
      const px = rng.nonZero(-6, 6);
      const py = rng.nonZero(-6, 6);
      const ix = t.m[0][0] * px + t.m[0][1] * py;
      const iy = t.m[1][0] * px + t.m[1][1] * py;
      const answer = point(ix, iy);
      return {
        prompt: `The 2×2 matrix ${M.str(t.m)} represents ${t.desc}. Find the coordinates of the image of the point ${point(px, py)} under it.`,
        answer,
        distractors: pickDistractors(answer, [
          point(t.m[0][0] * px + t.m[1][0] * py, t.m[0][1] * px + t.m[1][1] * py), // used the columns as rows
          point(iy, ix),
          point(-ix, -iy),
          point(px, py),
          point(ix, -iy),
        ]),
        explanation:
          `Multiply the matrix by the column vector (${px}, ${py}): ` +
          `x' = (${t.m[0][0]})(${px}) + (${t.m[0][1]})(${py}) = ${ix}, y' = (${t.m[1][0]})(${px}) + (${t.m[1][1]})(${py}) = ${iy}.`,
        check: () => {
          const x = t.m[0][0] * px + t.m[0][1] * py;
          const y = t.m[1][0] * px + t.m[1][1] * py;
          return x === ix && y === iy ? null : "image mismatch";
        },
      };
    },
  }),

  generator({
    key: "fmg.mat.combined",
    subject: "further-maths",
    topic: "fmg-matrices",
    subtopic: "combined",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      let first = rng.pick(NAMED);
      let second = rng.pick(NAMED);
      let guard = 0;
      while (M.eq(first.m, second.m) && guard < 10) {
        second = rng.pick(NAMED);
        guard++;
      }
      /* "First transformation P, then Q" is represented by the product QP. */
      const combined = M.mul(second.m, first.m);
      const answer = M.str(combined);
      return {
        prompt:
          `A shape is transformed by ${first.desc} (matrix P), and then by ${second.desc} (matrix Q). ` +
          `Which single matrix represents the combined transformation?`,
        answer,
        distractors: pickDistractors(answer, [
          M.str(M.mul(first.m, second.m)), // multiplied in the wrong order (PQ instead of QP)
          M.str([[first.m[0][0] + second.m[0][0], first.m[0][1] + second.m[0][1]], [first.m[1][0] + second.m[1][0], first.m[1][1] + second.m[1][1]]]), // added the matrices
          M.str(first.m),
          M.str(second.m),
          M.str([[combined[0][0], combined[1][0]], [combined[0][1], combined[1][1]]]), // transposed
        ]),
        explanation:
          `Applying P first then Q means the combined matrix is QP (the second transformation multiplies on the left). ` +
          `QP = ${M.str(second.m)} × ${M.str(first.m)} = ${answer}.`,
        check: () => (M.eq(M.mul(second.m, first.m), combined) ? null : "combined matrix mismatch"),
      };
    },
  }),

  recall({
    key: "fmg.mat.concepts",
    topic: "fmg-matrices",
    subtopic: "transformations",
    level: Y10,
    difficulty: 3,
    cases: [
      {
        q: "What is the identity matrix for 2×2 matrix multiplication?",
        a: "[[1, 0], [0, 1]]",
        wrong: ["[[0, 0], [0, 0]]", "[[1, 1], [1, 1]]", "[[1, 0], [1, 0]]", "[[0, 1], [1, 0]]"],
        why: "Multiplying any matrix by [[1, 0], [0, 1]] leaves it unchanged, just as multiplying a number by 1 does.",
      },
      {
        q: "Which transformation does the identity matrix [[1, 0], [0, 1]] represent?",
        a: "Leaving every point where it is (no change)",
        wrong: [
          "A rotation of 90°",
          "A reflection in the x-axis",
          "An enlargement scale factor 2",
          "A translation by (1, 1)",
        ],
        why: "The identity matrix maps every point to itself.",
      },
      {
        q: "For matrices A and B, is AB always equal to BA?",
        a: "No — matrix multiplication is not commutative in general",
        wrong: [
          "Yes, always",
          "Yes, but only for 2×2 matrices",
          "Only when both are the identity",
          "Only when both have determinant 1",
        ],
        why: "Doing transformation P then Q usually gives a different result from doing Q then P, so QP ≠ PQ in general.",
      },
      {
        q: "The matrix [[3, 0], [0, 3]] represents which transformation?",
        a: "An enlargement, scale factor 3, centred on the origin",
        wrong: [
          "A rotation of 3 radians",
          "A translation by (3, 3)",
          "A reflection in the line y = 3",
          "A stretch parallel to the x-axis only",
        ],
        why: "Both coordinates are multiplied by 3, moving every point three times as far from the origin.",
      },
    ],
  }),
];
