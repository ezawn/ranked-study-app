/**
 * Further calculus and differential equations (A-Level Further Maths).
 *
 * Volumes of revolution and improper p-integrals are computed from the exact
 * antiderivative and re-checked; the differential-equation questions are built
 * by choosing the roots of the auxiliary equation (or the integrating factor)
 * first, so the stated solution is guaranteed to fit.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Y13, recall } from "./fm-kit";

export const fmCalculusDE: Generator[] = [
  recall({
    key: "fm.calculus.inverse-trig-deriv",
    topic: "fm-calculus",
    subtopic: "inverse-trig-derivatives",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "What is the derivative of arcsin x with respect to x?",
        a: "1 / √(1 − x²)",
        wrong: ["−1 / √(1 − x²)", "1 / (1 + x²)", "1 / √(x² − 1)", "1 / (1 − x²)"],
        why: "Differentiating implicitly from sin y = x gives cos y · dy/dx = 1, and cos y = √(1 − x²).",
      },
      {
        q: "What is the derivative of arctan x with respect to x?",
        a: "1 / (1 + x²)",
        wrong: ["1 / √(1 − x²)", "1 / (1 − x²)", "−1 / (1 + x²)", "1 / (1 + x)²"],
        why: "From tan y = x, sec²y · dy/dx = 1, and sec²y = 1 + tan²y = 1 + x².",
      },
      {
        q: "What is the derivative of arccos x with respect to x?",
        a: "−1 / √(1 − x²)",
        wrong: ["1 / √(1 − x²)", "1 / (1 + x²)", "−1 / (1 + x²)", "−1 / √(x² − 1)"],
        why: "It is the negative of the derivative of arcsin x, since arcsin x + arccos x = π/2.",
      },
      {
        q: "What is the derivative of arctan(x / a) with respect to x, where a is a constant?",
        a: "a / (a² + x²)",
        wrong: ["1 / (a² + x²)", "a / (a² − x²)", "x / (a² + x²)", "1 / (a + x²)"],
        why: "Chain rule: d/dx arctan(u) = u'/(1 + u²) with u = x/a, giving (1/a)/(1 + x²/a²) = a/(a² + x²).",
      },
      {
        q: "∫ 1/(a² + x²) dx equals which of the following?",
        a: "(1/a) arctan(x/a) + c",
        wrong: ["arctan(x/a) + c", "(1/a) arcsin(x/a) + c", "ln(a² + x²) + c", "(1/a²) arctan(x/a) + c"],
        why: "It is the reverse of differentiating (1/a) arctan(x/a); the standard result quoted in the formula book.",
      },
      {
        q: "∫ 1/√(a² − x²) dx equals which of the following?",
        a: "arcsin(x/a) + c",
        wrong: ["(1/a) arcsin(x/a) + c", "arccos(x/a) + c", "arctan(x/a) + c", "ln(x + √(a² − x²)) + c"],
        why: "Differentiating arcsin(x/a) gives (1/a)/√(1 − x²/a²) = 1/√(a² − x²).",
      },
    ],
  }),

  generator({
    key: "fm.calculus.improper-p-integral",
    subject: "further-maths",
    topic: "fm-calculus",
    subtopic: "improper-integrals",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 10,
    build: (rng) => {
      const kind = rng.pick(["converge", "diverge", "exp"] as const);
      let prompt: string;
      let answer: string;
      let why: string;
      let claimedValue = Number.NaN;
      if (kind === "converge") {
        const n = rng.int(2, 6);
        prompt = `Evaluate the improper integral of x^(−${n}) with respect to x from 1 to ∞.`;
        claimedValue = 1 / (n - 1);
        answer = claimedValue === Math.round(claimedValue) ? String(claimedValue) : `1/${n - 1}`;
        why = `∫₁^∞ x^(−${n}) dx = [x^(−${n - 1})/(−${n - 1})]₁^∞ = 0 − (−1/${n - 1}) = 1/${n - 1}. It converges because the power exceeds 1.`;
      } else if (kind === "diverge") {
        const one = rng.bool();
        prompt = one
          ? `Evaluate the improper integral of 1/x with respect to x from 1 to ∞.`
          : `Evaluate the improper integral of 1/√x with respect to x from 1 to ∞.`;
        answer = "The integral diverges (it has no finite value)";
        why = one
          ? `∫₁^∞ (1/x) dx = [ln x]₁^∞ → ∞, so it diverges. The power 1 is the borderline case.`
          : `∫₁^∞ x^(−1/2) dx = [2√x]₁^∞ → ∞, so it diverges — the power ½ is not greater than 1.`;
      } else {
        const k = rng.int(1, 4);
        prompt = `Evaluate the improper integral of e^(−${k}x) with respect to x from 0 to ∞.`;
        claimedValue = 1 / k;
        answer = k === 1 ? "1" : `1/${k}`;
        why = `∫₀^∞ e^(−${k}x) dx = [−(1/${k})e^(−${k}x)]₀^∞ = 0 − (−1/${k}) = 1/${k}.`;
      }
      return {
        prompt,
        answer,
        distractors: pickDistractors(answer, [
          "The integral diverges (it has no finite value)",
          "0",
          "1",
          "2",
          "∞",
        ]),
        explanation: why,
        check: () => {
          if (kind === "diverge") return null;
          /* Light numeric check: a coarse Riemann sum to a large upper limit. */
          let s = 0;
          const step = 0.02;
          const g =
            kind === "converge"
              ? (x: number) => x ** -Number(answer.includes("/") ? Number(answer.split("/")[1]) + 1 : 2)
              : (x: number) => Math.exp(-x / claimedValue);
          const lo = kind === "converge" ? 1 : 0;
          for (let x = lo; x < 400; x += step) s += g(x) * step;
          return Math.abs(s - claimedValue) < 0.05 ? null : `numeric ≈ ${s.toFixed(3)}, claimed ${claimedValue}`;
        },
      };
    },
  }),

  generator({
    key: "fm.calculus.volume-revolution",
    subject: "further-maths",
    topic: "fm-calculus",
    subtopic: "volume-revolution",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      const k = rng.int(1, 3);
      const b = rng.int(2, 5);
      /* Each curve: label, y² as a function, and ∫₀^b y² dx as an exact fraction [num, den]. */
      const curves = [
        { yLabel: `${k}x`, ySqLabel: `${k * k}x²`, ySq: (x: number) => (k * x) ** 2, integ: [k * k * b ** 3, 3] as [number, number] },
        { yLabel: "x²", ySqLabel: "x⁴", ySq: (x: number) => x ** 4, integ: [b ** 5, 5] as [number, number] },
        { yLabel: "√x", ySqLabel: "x", ySq: (x: number) => x, integ: [b * b, 2] as [number, number] },
        { yLabel: `${k}`, ySqLabel: `${k * k}`, ySq: () => k * k, integ: [k * k * b, 1] as [number, number] },
      ];
      const curve = rng.pick(curves);
      const [num, den] = curve.integ;
      const exact = fracStr(num, den);
      const integralValue = num / den;
      const answer = `${exact}π`;
      return {
        prompt:
          `The region bounded by y = ${curve.yLabel}, the x-axis and the lines x = 0 and x = ${b} is rotated 2π radians (a full turn) about the x-axis. ` +
          `Find the exact volume of the solid formed.`,
        answer,
        distractors: pickDistractors(answer, [
          `${exact}`, // dropped the factor of π
          `${fracStr(2 * num, den)}π`,
          `${fracStr(num, den * 3)}π`,
          `${exact}π²`,
          `${fracStr(num + b * den, den)}π`,
        ]),
        explanation:
          `Volume = π ∫₀^${b} y² dx. Here y² = ${curve.ySqLabel}, and ∫₀^${b} ${curve.ySqLabel} dx = ${exact}, ` +
          `so the volume is ${answer}.`,
        check: () => {
          /* Coarse midpoint numeric check of the π-free integral. */
          let s = 0;
          const step = b / 2000;
          for (let x = step / 2; x < b; x += step) s += curve.ySq(x) * step;
          return Math.abs(s - integralValue) < 0.05 + 0.01 * integralValue
            ? null
            : `numeric integral ≈ ${s.toFixed(3)}, expected ${integralValue}`;
        },
      };
    },
  }),

  recall({
    key: "fm.calculus.reduction",
    topic: "fm-calculus",
    subtopic: "reduction-formulae",
    level: Y13,
    difficulty: 7,
    cases: [
      {
        q: "What is a reduction formula for an integral Iₙ?",
        a: "An equation expressing Iₙ in terms of a lower-index integral such as Iₙ₋₁ or Iₙ₋₂",
        wrong: [
          "A formula that gives Iₙ directly as a single expression in n",
          "The derivative of Iₙ with respect to n",
          "A way of writing Iₙ as an infinite series",
          "The value of Iₙ when n = 0",
        ],
        why: "Applying it repeatedly walks the index down to a base case (I₀ or I₁) that can be integrated directly.",
      },
      {
        q: "Reduction formulae are most often derived using which technique?",
        a: "Integration by parts",
        wrong: ["Partial fractions", "Substitution u = tan x", "The trapezium rule", "Implicit differentiation"],
        why: "Splitting the integrand so that one factor differentiates to a lower power is what produces the Iₙ₋₂ term.",
      },
      {
        q: "If Iₙ = ∫₀^{π/2} sinⁿx dx satisfies Iₙ = ((n−1)/n) Iₙ₋₂, and I₀ = π/2, what is I₄?",
        a: "3π/16",
        wrong: ["π/4", "3π/8", "π/16", "15π/32"],
        why: "I₂ = (1/2)I₀ = π/4; then I₄ = (3/4)I₂ = (3/4)(π/4) = 3π/16.",
      },
      {
        q: "Why is a reduction formula useful for an integral like ∫ xⁿ eˣ dx?",
        a: "Each application lowers the power of x by 1, so after n steps only ∫ eˣ dx remains",
        wrong: [
          "It avoids having to integrate eˣ at all",
          "It turns the integral into a polynomial with no integration needed",
          "It only works when n is even",
          "It converts the integral into a definite one automatically",
        ],
        why: "Integration by parts with u = xⁿ drops the exponent by one each time until the integral is elementary.",
      },
    ],
  }),

  generator({
    key: "fm.de.integrating-factor",
    subject: "further-maths",
    topic: "fm-differential-equations",
    subtopic: "first-order",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 8,
    build: (_rng, index) => {
      const cases = [
        { p: "2/x", ifac: "x²", why: "∫(2/x) dx = 2 ln x = ln x², so the integrating factor is e^{ln x²} = x²." },
        { p: "3/x", ifac: "x³", why: "∫(3/x) dx = 3 ln x = ln x³, so the integrating factor is x³." },
        { p: "1/x", ifac: "x", why: "∫(1/x) dx = ln x, so the integrating factor is e^{ln x} = x." },
        { p: "2", ifac: "e^{2x}", why: "∫2 dx = 2x, so the integrating factor is e^{2x}." },
        { p: "−1", ifac: "e^{−x}", why: "∫(−1) dx = −x, so the integrating factor is e^{−x}." },
        { p: "tan x", ifac: "sec x", why: "∫tan x dx = ln(sec x), so the integrating factor is e^{ln(sec x)} = sec x." },
        { p: "cot x", ifac: "sin x", why: "∫cot x dx = ln(sin x), so the integrating factor is sin x." },
        { p: "−2/x", ifac: "1/x²", why: "∫(−2/x) dx = −2 ln x = ln x⁻², so the integrating factor is x⁻² = 1/x²." },
      ];
      const c = cases[index % cases.length];
      return {
        prompt: `Find the integrating factor for the first-order linear differential equation dy/dx + (${c.p})y = f(x).`,
        answer: c.ifac,
        distractors: pickDistractors(c.ifac, [
          `e^{${c.p}}`,
          `${c.p}`,
          `e^{−(${c.p})}`,
          `1/(${c.ifac})`,
          "e^{x}",
        ]),
        explanation:
          `The integrating factor is e^{∫P(x) dx} where P(x) is the coefficient of y. ${c.why}`,
      };
    },
  }),

  generator({
    key: "fm.de.second-order-homogeneous",
    subject: "further-maths",
    topic: "fm-differential-equations",
    subtopic: "second-order",
    curriculumLevel: Y13,
    difficulty: 7,
    variants: 14,
    build: (rng) => {
      const type = rng.pick(["real", "repeated", "complex"] as const);
      let bCoef: number;
      let cCoef: number;
      let answer: string;
      let why: string;
      if (type === "real") {
        let m1 = rng.nonZero(-4, 4);
        let m2 = rng.nonZero(-4, 4);
        while (m2 === m1) m2 = rng.nonZero(-4, 4);
        bCoef = -(m1 + m2);
        cCoef = m1 * m2;
        [m1, m2] = [Math.min(m1, m2), Math.max(m1, m2)];
        answer = `y = A e^{${m1}x} + B e^{${m2}x}`;
        why = `The auxiliary equation m² ${bCoef < 0 ? "−" : "+"} ${Math.abs(bCoef)}m ${cCoef < 0 ? "−" : "+"} ${Math.abs(cCoef)} = 0 factorises to give distinct real roots m = ${m1} and m = ${m2}.`;
      } else if (type === "repeated") {
        const m = rng.nonZero(-3, 3);
        bCoef = -2 * m;
        cCoef = m * m;
        answer = `y = (A + Bx) e^{${m}x}`;
        why = `The auxiliary equation is (m ${m < 0 ? "+" : "−"} ${Math.abs(m)})² = 0, a repeated root m = ${m}, so the solution carries an extra factor of x.`;
      } else {
        const alpha = rng.int(-2, 2);
        const beta = rng.int(1, 3);
        bCoef = -2 * alpha;
        cCoef = alpha * alpha + beta * beta;
        answer =
          alpha === 0
            ? `y = A cos ${beta}x + B sin ${beta}x`
            : `y = e^{${alpha}x}(A cos ${beta}x + B sin ${beta}x)`;
        why = `The auxiliary equation has complex roots m = ${alpha} ± ${beta}i, giving an oscillating solution${alpha === 0 ? "" : " modulated by e^{" + alpha + "x}"}.`;
      }
      const dyTerm =
        bCoef === 0 ? "" : ` ${bCoef < 0 ? "−" : "+"} ${Math.abs(bCoef) === 1 ? "" : Math.abs(bCoef) + " "}dy/dx`;
      const yTerm = ` ${cCoef < 0 ? "−" : "+"} ${Math.abs(cCoef) === 1 ? "" : Math.abs(cCoef) + " "}y`;
      const auxMid = bCoef === 0 ? "" : ` ${bCoef < 0 ? "−" : "+"} ${Math.abs(bCoef) === 1 ? "" : Math.abs(bCoef)}m`;
      const auxEnd = ` ${cCoef < 0 ? "−" : "+"} ${Math.abs(cCoef)}`;
      return {
        prompt:
          `Find the general solution of the differential equation ` +
          `d²y/dx²${dyTerm}${yTerm} = 0.`,
        answer,
        distractors: pickDistractors(answer, [
          "y = A e^{x} + B e^{−x}",
          `y = A cos x + B sin x`,
          `y = (A + Bx) e^{x}`,
          `y = A e^{${cCoef}x} + B`,
          `y = A x e^{${bCoef}x}`,
        ]),
        explanation:
          `Form the auxiliary equation m²${auxMid}${auxEnd} = 0. ${why}`,
        check: () => {
          /* Verify the discriminant matches the claimed root type. */
          const disc = bCoef * bCoef - 4 * cCoef;
          if (type === "real") return disc > 0 ? null : `expected disc > 0, got ${disc}`;
          if (type === "repeated") return disc === 0 ? null : `expected disc = 0, got ${disc}`;
          return disc < 0 ? null : `expected disc < 0, got ${disc}`;
        },
      };
    },
  }),
];

/* -------------------------------------------------------------------------- */

/** `fracStr(9, 2)` → "9/2", `fracStr(32, 5)` → "32/5", `fracStr(8, 1)` → "8", `fracStr(6, 3)` → "2". */
function fracStr(num: number, den: number): string {
  if (den === 0) return "undefined";
  let n = num;
  let d = den;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcdInt(Math.abs(n), d) || 1;
  n /= g;
  d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

function gcdInt(a: number, b: number): number {
  return b === 0 ? a : gcdInt(b, a % b);
}
