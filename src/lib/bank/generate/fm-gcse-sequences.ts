/**
 * Sequences and series (GCSE Further Maths — AQA Level 2).
 *
 * The nth term of a quadratic sequence (found from the second difference), the
 * limiting value of a rational sequence, and the sum of an arithmetic series.
 * Each quadratic sequence is built from a known an² + bn + c so the answer is
 * certain, and a `check` re-generates the listed terms.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { poly } from "./format";
import { Y10, Y11, recall } from "./fm-kit";

export const fmGcseSequences: Generator[] = [
  generator({
    key: "fmg.seq.quadratic-nth-term",
    subject: "further-maths",
    topic: "fmg-sequences",
    subtopic: "quadratic-nth-term",
    curriculumLevel: Y11,
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const a = rng.pick([1, 2, 3, -1, -2] as const);
      const b = rng.nonZero(-5, 5);
      const c = rng.nonZero(-6, 6);
      const term = (n: number) => a * n * n + b * n + c;
      const terms = [1, 2, 3, 4, 5].map(term);
      const answer = quadTerm(a, b, c);
      return {
        prompt: `A quadratic sequence begins ${terms.join(", ")}. Find an expression, in terms of n, for its nth term.`,
        answer,
        distractors: pickDistractors(answer, [
          quadTerm(2 * a, b, c), // used the second difference directly as the n² coefficient
          quadTerm(a, b + 1, c),
          quadTerm(a, -b, c),
          quadTerm(a, b, c + a + b), // off-by-one in n
          quadTerm(a, 0, terms[0] - a),
        ]),
        explanation:
          `The second difference is ${2 * a}, so the n² coefficient is half of that, ${a}. ` +
          `Subtracting ${a}n² from the terms leaves a linear sequence whose nth term is ${poly([b, c])}. ` +
          `So the nth term is ${answer}.`,
        check: () => {
          for (let n = 1; n <= 5; n++) {
            if (a * n * n + b * n + c !== terms[n - 1]) return `term ${n} mismatch`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "fmg.seq.limiting-value",
    subject: "further-maths",
    topic: "fmg-sequences",
    subtopic: "limiting-value",
    curriculumLevel: Y11,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      const p = rng.nonZero(-6, 6);
      const q = rng.nonZero(-9, 9);
      const s = rng.pick([1, 2, 3] as const); // denominator's n coefficient (positive keeps it tidy)
      const t = rng.nonZero(-9, 9);
      /* u_n = (p n + q) / (s n + t); limit as n → ∞ is p/s. */
      const answer = fracStr(p, s);
      const numer = `${p === 1 ? "" : p === -1 ? "−" : p}n ${q < 0 ? "−" : "+"} ${Math.abs(q)}`;
      const denom = `${s}n ${t < 0 ? "−" : "+"} ${Math.abs(t)}`;
      return {
        prompt: `A sequence is defined by uₙ = (${numer}) / (${denom}). What value does uₙ approach as n gets very large?`,
        answer,
        distractors: pickDistractors(answer, [
          fracStr(q, t), // took the ratio of the constant terms
          fracStr(s, p), // inverted the ratio
          fracStr(p + q, s + t),
          fracStr(p, t),
          "0",
        ]),
        explanation:
          `Divide every term by n: uₙ = (${p} + ${q}/n) / (${s} + ${t}/n). As n → ∞ the ${q}/n and ${t}/n terms vanish, ` +
          `leaving ${p}/${s} = ${answer}.`,
        check: () => {
          const big = 1e7;
          const value = (p * big + q) / (s * big + t);
          const claimed = answer.includes("/") ? Number(answer.split("/")[0]) / Number(answer.split("/")[1]) : Number(answer);
          return Math.abs(value - claimed) < 1e-4 ? null : `limit ≈ ${value}, claimed ${claimed}`;
        },
      };
    },
  }),

  generator({
    key: "fmg.seq.arithmetic-series",
    subject: "further-maths",
    topic: "fmg-sequences",
    subtopic: "arithmetic-series",
    curriculumLevel: Y10,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const first = rng.int(-6, 12);
      const d = rng.nonZero(-4, 6);
      const n = rng.int(8, 30);
      const last = first + (n - 1) * d;
      const sum = (n * (first + last)) / 2;
      const answer = String(sum);
      return {
        prompt:
          `Find the sum of the first ${n} terms of the arithmetic series that starts ${first}, ${first + d}, ${first + 2 * d}, …`,
        answer,
        distractors: pickDistractors(answer, [
          String(sum + last + d), // included one term too many
          String(n * last), // used n × last term
          String(n * (first + last)), // forgot to halve
          String(sum - d),
          String(n * first), // used n × first term
        ]),
        explanation:
          `The nth term is ${first} + (${n} − 1)(${d}) = ${last}. ` +
          `Sum = n/2 × (first + last) = ${n}/2 × (${first} + ${last}) = ${answer}.`,
        check: () => {
          let total = 0;
          for (let k = 0; k < n; k++) total += first + k * d;
          return total === sum ? null : `direct sum gives ${total}`;
        },
      };
    },
  }),

  recall({
    key: "fmg.seq.concepts",
    topic: "fmg-sequences",
    subtopic: "limiting-value",
    level: Y11,
    difficulty: 5,
    cases: [
      {
        q: "For a quadratic sequence, what is the relationship between the second difference and the coefficient of n²?",
        a: "The coefficient of n² is half the (constant) second difference",
        wrong: [
          "The coefficient of n² equals the second difference",
          "The coefficient of n² is twice the second difference",
          "The coefficient of n² is the first difference",
          "There is no fixed relationship",
        ],
        why: "Differencing n² twice gives a constant 2, so a·n² has second difference 2a.",
      },
      {
        q: "A sequence has uₙ = 5 − 3/n. What is its limiting value as n → ∞?",
        a: "5",
        wrong: ["2", "−3", "0", "8"],
        why: "The term 3/n tends to 0 as n grows, leaving 5.",
      },
      {
        q: "Which type of sequence has a constant first difference between consecutive terms?",
        a: "An arithmetic (linear) sequence",
        wrong: [
          "A quadratic sequence",
          "A geometric sequence",
          "A Fibonacci sequence",
          "Any convergent sequence",
        ],
        why: "A constant first difference is the defining property of an arithmetic sequence; a quadratic sequence has a constant second difference.",
      },
      {
        q: "The sum of the first n terms of an arithmetic series can be written as n/2 (a + l). What do a and l stand for?",
        a: "a is the first term and l is the last (nth) term",
        wrong: [
          "a is the common difference and l is the number of terms",
          "a is the last term and l is the first term",
          "a and l are both the middle term",
          "a is the first term and l is the common difference",
        ],
        why: "Pairing the first term with the last, the second with the second-to-last, and so on, each pair sums to a + l.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

/** an² + bn + c as a tidy string, e.g. a=2,b=-3,c=1 → "2n² − 3n + 1". */
function quadTerm(a: number, b: number, c: number): string {
  return poly([a, b, c], "n");
}

function fracStr(num: number, den: number): string {
  if (den === 0) return "undefined";
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
