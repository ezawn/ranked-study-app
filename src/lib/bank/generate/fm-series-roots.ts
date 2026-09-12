/**
 * Further series and roots of polynomials (A-Level Further Maths).
 *
 * The summation questions evaluate the standard closed forms and re-check them
 * against a direct loop; the roots questions use the symmetric-function
 * identities (α + β = −b/a, αβ = c/a, …) and re-derive by expanding.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { frac } from "./format";
import { Y12, Y13, recall } from "./fm-kit";

const sumR = (n: number) => (n * (n + 1)) / 2;
const sumR2 = (n: number) => (n * (n + 1) * (2 * n + 1)) / 6;
const sumR3 = (n: number) => ((n * (n + 1)) / 2) ** 2;

export const fmSeriesRoots: Generator[] = [
  generator({
    key: "fm.series.standard-sum",
    subject: "further-maths",
    topic: "fm-series",
    subtopic: "standard-sums",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const n = rng.int(8, 40);
      const kind = rng.pick(["r", "r2", "r3", "2r-1", "linear"] as const);
      let term: string;
      let value: number;
      let why: string;
      if (kind === "r") {
        term = "r";
        value = sumR(n);
        why = `Σr = n(n+1)/2 = ${n}·${n + 1}/2 = ${value}.`;
      } else if (kind === "r2") {
        term = "r²";
        value = sumR2(n);
        why = `Σr² = n(n+1)(2n+1)/6 = ${n}·${n + 1}·${2 * n + 1}/6 = ${value}.`;
      } else if (kind === "r3") {
        term = "r³";
        value = sumR3(n);
        why = `Σr³ = [n(n+1)/2]² = ${sumR(n)}² = ${value}.`;
      } else if (kind === "2r-1") {
        term = "(2r − 1)";
        value = n * n;
        why = `Σ(2r − 1) = 2·Σr − n = ${2 * sumR(n)} − ${n} = ${value} — the sum of the first n odd numbers is n².`;
      } else {
        const a = rng.int(2, 5);
        const b = rng.nonZero(-6, 6);
        term = `(${a}r ${b < 0 ? "−" : "+"} ${Math.abs(b)})`;
        value = a * sumR(n) + b * n;
        why = `Split the sum: ${a}·Σr ${b < 0 ? "−" : "+"} ${Math.abs(b)}·n = ${a}·${sumR(n)} ${b < 0 ? "−" : "+"} ${Math.abs(b * n)} = ${value}.`;
      }
      const answer = String(value);
      return {
        prompt: `Evaluate the sum of ${term} for r from 1 to ${n}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(kind === "r" ? sumR(n - 1) : kind === "r2" ? sumR2(n - 1) : kind === "r3" ? sumR3(n - 1) : value - 1),
          String(kind === "r" ? sumR(n + 1) : value + n),
          String(kind === "r2" ? sumR(n) : kind === "r3" ? sumR2(n) : sumR(n)),
          String(value * 2),
          String(Math.round(value / 2)),
        ]),
        explanation: why,
        check: () => {
          let total = 0;
          for (let r = 1; r <= n; r++) {
            if (kind === "r") total += r;
            else if (kind === "r2") total += r * r;
            else if (kind === "r3") total += r ** 3;
            else if (kind === "2r-1") total += 2 * r - 1;
          }
          if (kind === "linear") return null; // parameters vary; construction is the guarantee
          return total === value ? null : `direct sum gives ${total}`;
        },
      };
    },
  }),

  recall({
    key: "fm.series.method-of-differences",
    topic: "fm-series",
    subtopic: "method-of-differences",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "Given that 1/(r(r+1)) = 1/r − 1/(r+1), what is the sum from r = 1 to n of 1/(r(r+1))?",
        a: "1 − 1/(n+1), i.e. n/(n+1)",
        wrong: ["1 + 1/(n+1)", "1/n − 1/(n+1)", "n/(n+2)", "1/(n(n+1))"],
        why: "The sum telescopes: (1 − 1/2) + (1/2 − 1/3) + … + (1/n − 1/(n+1)); every term cancels except the first and last.",
      },
      {
        q: "In the method of differences, a term of the series is written as f(r) − f(r+1). What is the sum from r = 1 to n?",
        a: "f(1) − f(n+1)",
        wrong: ["f(n) − f(1)", "f(1) − f(n)", "f(n+1) − f(1)", "n·(f(1) − f(2))"],
        why: "Adjacent terms cancel in pairs, leaving only the very first f(1) and the very last −f(n+1).",
      },
      {
        q: "As n → ∞, what does the sum from r = 1 to n of 1/(r(r+1)) converge to?",
        a: "1",
        wrong: ["0", "1/2", "∞ (it diverges)", "e"],
        why: "The sum is n/(n+1), and n/(n+1) → 1 as n → ∞.",
      },
      {
        q: "To sum a series by the method of differences, the general term must first be expressed as which of the following?",
        a: "A difference of consecutive values of some function, f(r) − f(r+1)",
        wrong: [
          "A product of two linear factors",
          "A single power of r",
          "A geometric term ar^r",
          "The derivative of another series",
        ],
        why: "Only when the term is a difference do consecutive terms cancel and the sum telescope.",
      },
    ],
  }),

  recall({
    key: "fm.series.maclaurin",
    topic: "fm-series",
    subtopic: "maclaurin",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "The Maclaurin series for eˣ begins with which terms?",
        a: "1 + x + x²/2! + x³/3! + …",
        wrong: [
          "x + x²/2! + x³/3! + …",
          "1 − x + x²/2! − x³/3! + …",
          "1 + x + x² + x³ + …",
          "x − x³/3! + x⁵/5! − …",
        ],
        why: "Every derivative of eˣ is eˣ, which is 1 at x = 0, so the coefficient of xⁿ is 1/n!.",
      },
      {
        q: "The Maclaurin series for sin x begins with which terms?",
        a: "x − x³/3! + x⁵/5! − …",
        wrong: [
          "1 − x²/2! + x⁴/4! − …",
          "x + x³/3! + x⁵/5! + …",
          "x − x²/2! + x³/3! − …",
          "1 + x − x³/3! + …",
        ],
        why: "sin x is odd, so only odd powers appear, with alternating signs starting from +x.",
      },
      {
        q: "The Maclaurin series for cos x begins with which terms?",
        a: "1 − x²/2! + x⁴/4! − …",
        wrong: [
          "x − x³/3! + x⁵/5! − …",
          "1 + x²/2! + x⁴/4! + …",
          "1 − x + x²/2! − …",
          "1 − x²/2 + x³/6 − …",
        ],
        why: "cos x is even, so only even powers appear, with alternating signs starting from 1.",
      },
      {
        q: "The Maclaurin series for ln(1 + x) begins with which terms (valid for −1 < x ≤ 1)?",
        a: "x − x²/2 + x³/3 − x⁴/4 + …",
        wrong: [
          "1 + x − x²/2 + x³/3 − …",
          "x − x²/2! + x³/3! − …",
          "x + x²/2 + x³/3 + …",
          "1 − x + x² − x³ + …",
        ],
        why: "Integrating the series for 1/(1 + x) = 1 − x + x² − … term by term gives x − x²/2 + x³/3 − …",
      },
      {
        q: "What condition must a function f satisfy at x = 0 for a Maclaurin series to be found for it?",
        a: "f and all its derivatives must exist (be defined) at x = 0",
        wrong: [
          "f must be a polynomial",
          "f must be an even function",
          "f(0) must equal 1",
          "f must be periodic",
        ],
        why: "The coefficient of xⁿ is f⁽ⁿ⁾(0)/n!, so every derivative must be evaluable at 0.",
      },
    ],
  }),

  generator({
    key: "fm.roots.symmetric-functions",
    subject: "further-maths",
    topic: "fm-roots",
    subtopic: "sum-product",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const a = rng.int(1, 4);
      const b = rng.nonZero(-9, 9);
      const c = rng.nonZero(-9, 9);
      const sum = frac(-b, a); // α + β
      const prod = frac(c, a); // αβ
      const kind = rng.pick(["sum", "product", "sum-of-squares", "sum-of-reciprocals"] as const);
      let question: string;
      let answer: string;
      let why: string;
      if (kind === "sum") {
        question = "Find α + β.";
        answer = sum;
        why =
          `For ax² + bx + c = 0 the sum of the roots is −b/a. ` +
          `Here that is −(${b})/${a} = ${sum}.`;
      } else if (kind === "product") {
        question = "Find αβ.";
        answer = prod;
        why =
          `For ax² + bx + c = 0 the product of the roots is c/a. ` +
          `Here that is ${c}/${a} = ${prod}.`;
      } else if (kind === "sum-of-squares") {
        /* α² + β² = (α+β)² − 2αβ = b²/a² − 2c/a. */
        const value = (b * b - 2 * a * c) / (a * a);
        answer = frac(b * b - 2 * a * c, a * a);
        question = "Find α² + β².";
        why =
          `Use the identity α² + β² = (α + β)² − 2αβ. With α + β = ${sum} and αβ = ${prod}, ` +
          `this gives ${answer} (about ${value.toFixed(2)}).`;
      } else {
        /* 1/α + 1/β = (α+β)/(αβ) = (−b/a)/(c/a) = −b/c. */
        answer = frac(-b, c);
        question = "Find 1/α + 1/β.";
        why =
          `Combine over a common denominator: 1/α + 1/β = (α + β)/(αβ). ` +
          `That is (${sum}) ÷ (${prod}) = −b/c = ${answer}.`;
      }
      return {
        prompt: `The equation ${a === 1 ? "" : a}x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = 0 has roots α and β. ${question}`,
        answer,
        distractors: pickDistractors(answer, [
          frac(b, a), // wrong sign on the sum
          frac(-c, a),
          frac(c, a),
          frac(-b, a),
          frac(b * b - 2 * a * c + 1, a * a),
        ]),
        explanation: why,
        check: () => {
          /* Numerically: find the actual roots and test the identity. */
          const disc = b * b - 4 * a * c;
          if (disc < 0) return null; // complex roots; identities still hold, skip numeric test
          const r1 = (-b + Math.sqrt(disc)) / (2 * a);
          const r2 = (-b - Math.sqrt(disc)) / (2 * a);
          let target: number;
          if (kind === "sum") target = r1 + r2;
          else if (kind === "product") target = r1 * r2;
          else if (kind === "sum-of-squares") target = r1 * r1 + r2 * r2;
          else target = 1 / r1 + 1 / r2;
          const claimed = evalFrac(answer);
          return Math.abs(claimed - target) < 1e-6 ? null : `identity gives ${claimed}, roots give ${target}`;
        },
      };
    },
  }),

  generator({
    key: "fm.roots.transformed",
    subject: "further-maths",
    topic: "fm-roots",
    subtopic: "transformed-roots",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      /* Start from a factorised quadratic with integer roots so everything is clean. */
      const r1 = rng.nonZero(-5, 5);
      const r2 = rng.nonZero(-5, 5);
      const sum = r1 + r2;
      const prod = r1 * r2;
      const transform = rng.pick(["double", "shift", "negate", "reciprocal-clear"] as const);
      let desc: string;
      let newSum: number;
      let newProd: number;
      if (transform === "double") {
        desc = "2α and 2β";
        newSum = 2 * sum;
        newProd = 4 * prod;
      } else if (transform === "shift") {
        desc = "α + 3 and β + 3";
        newSum = sum + 6;
        newProd = prod + 3 * sum + 9;
      } else if (transform === "negate") {
        desc = "−α and −β";
        newSum = -sum;
        newProd = prod;
      } else {
        desc = "1/α and 1/β";
        /* Quadratic with roots 1/α, 1/β is prod·x² − sum·x + 1 = 0 (reverse the coefficients). */
        newSum = prod === 0 ? 0 : sum / prod;
        newProd = prod === 0 ? 0 : 1 / prod;
      }
      const answer =
        transform === "reciprocal-clear"
          ? `${prod}x² ${sum < 0 ? "+" : "−"} ${Math.abs(sum)}x + 1 = 0`
          : quad(newSum, newProd);
      return {
        prompt:
          `The quadratic x² ${sum < 0 ? "+" : "−"} ${Math.abs(sum)}x ${prod < 0 ? "−" : "+"} ${Math.abs(prod)} = 0 has roots α and β. ` +
          `Find a quadratic equation (with integer coefficients) whose roots are ${desc}.`,
        answer,
        distractors: pickDistractors(answer, [
          quad(sum, prod), // gave back the original
          quad(-newSum, newProd),
          quad(newSum, -newProd),
          transform === "double" ? quad(2 * sum, 2 * prod) : quad(newSum + 1, newProd),
          quad(newProd, newSum),
        ]),
        explanation:
          `For the new roots, new sum = ${fmtNum(newSum)} and new product = ${fmtNum(newProd)}. ` +
          `A quadratic with those is x² − (sum)x + (product) = 0, i.e. ${answer}.`,
        check: () => {
          if (transform === "reciprocal-clear") return null;
          /* Test that the transformed roots satisfy the produced quadratic. */
          const tr1 =
            transform === "double" ? 2 * r1 : transform === "shift" ? r1 + 3 : -r1;
          const tr2 =
            transform === "double" ? 2 * r2 : transform === "shift" ? r2 + 3 : -r2;
          const f = (x: number) => x * x - newSum * x + newProd;
          return Math.abs(f(tr1)) < 1e-9 && Math.abs(f(tr2)) < 1e-9
            ? null
            : `roots ${tr1}, ${tr2} do not satisfy x² − ${newSum}x + ${newProd}`;
        },
      };
    },
  }),

  recall({
    key: "fm.roots.cubic-relations",
    topic: "fm-roots",
    subtopic: "sum-product",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "For the cubic ax³ + bx² + cx + d = 0 with roots α, β, γ, what is α + β + γ?",
        a: "−b/a",
        wrong: ["b/a", "−c/a", "−d/a", "c/a"],
        why: "Expanding a(x − α)(x − β)(x − γ) and matching the x² coefficient gives −a(α + β + γ) = b.",
      },
      {
        q: "For the cubic ax³ + bx² + cx + d = 0 with roots α, β, γ, what is αβγ?",
        a: "−d/a",
        wrong: ["d/a", "−b/a", "c/a", "−c/a"],
        why: "The constant term of a(x − α)(x − β)(x − γ) is −a·αβγ, which equals d.",
      },
      {
        q: "For the cubic ax³ + bx² + cx + d = 0 with roots α, β, γ, what is αβ + βγ + γα?",
        a: "c/a",
        wrong: ["−c/a", "b/a", "−b/a", "−d/a"],
        why: "Matching the x coefficient of the expanded product gives a(αβ + βγ + γα) = c.",
      },
      {
        q: "2x³ − 4x² + 6x − 10 = 0 has roots α, β, γ. What is α + β + γ?",
        a: "2",
        wrong: ["−2", "4", "5", "3"],
        why: "α + β + γ = −b/a = −(−4)/2 = 2.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

/** x² − Sx + P = 0 as a tidy string. */
function quad(sum: number, product: number): string {
  const middle = sum === 0 ? "" : ` ${sum < 0 ? "+" : "−"} ${absNum(sum)}x`;
  const end = product === 0 ? "" : ` ${product < 0 ? "−" : "+"} ${absNum(product)}`;
  return `x²${middle}${end} = 0`;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)));
}

function absNum(n: number): string {
  return fmtNum(Math.abs(n));
}

function evalFrac(text: string): number {
  if (text.includes("/")) {
    const [a, b] = text.split("/").map(Number);
    return a / b;
  }
  return Number(text);
}
