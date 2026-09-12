/**
 * A-Level Calculus: differentiation, integration, numerical methods and
 * differential equations.
 *
 * Derivatives and integrals here are computed symbolically on coefficient
 * arrays rather than typed out — differentiating [3, -2, 5] is a two-line
 * transformation that cannot be got wrong twice in the same way, and the
 * `check` hooks verify each result numerically against a difference quotient or
 * a Riemann sum. A question whose answer disagrees with its own numerical
 * derivative fails the test suite rather than reaching a student.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Rational, rat } from "./rational";
import { poly, solutions, sup, toPlaces } from "./format";

/** d/dx of a coefficient array, highest power first. */
function differentiate(coefficients: readonly number[]): number[] {
  const degree = coefficients.length - 1;
  const out: number[] = [];
  for (let i = 0; i < degree; i++) out.push(coefficients[i] * (degree - i));
  return out.length ? out : [0];
}

/** Indefinite integral coefficients (constant of integration omitted). */
function integrate(coefficients: readonly number[]): Rational[] {
  const degree = coefficients.length - 1;
  return coefficients.map((c, i) => rat(c, degree - i + 1));
}

function evaluate(coefficients: readonly number[], x: number): number {
  return coefficients.reduce((acc, c) => acc * x + c, 0);
}

function evaluateRational(coefficients: readonly Rational[], x: number): number {
  return coefficients.reduce((acc, c) => acc * x + c.toNumber(), 0);
}

/** Format a polynomial whose coefficients are exact fractions. */
function polyRational(coefficients: readonly Rational[], variable = "x"): string {
  const degree = coefficients.length - 1;
  let out = "";
  for (let i = 0; i <= degree; i++) {
    const c = coefficients[i];
    if (c.isZero) continue;
    const power = degree - i;
    const body = power === 0 ? "" : power === 1 ? variable : `${variable}${sup(power)}`;
    const size = c.abs();
    const shown = size.equals(rat(1)) && body !== "" ? "" : size.toString();
    out += out === "" ? `${c.sign < 0 ? "-" : ""}${shown}${body}` : `${c.sign < 0 ? " - " : " + "}${shown}${body}`;
  }
  return out === "" ? "0" : out;
}

export const aLevelCalculus: Generator[] = [
  generator({
    key: "alevel.calc.differentiate-poly",
    topic: "differentiation",
    subtopic: "power-rule",
    curriculumLevel: "YEAR_12",
    difficulty: 4,
    variants: 26,
    build: (rng) => {
      const coefficients = [rng.nonZero(1, 6), rng.nonZero(-9, 9), rng.nonZero(-9, 9), rng.nonZero(-12, 12)];
      const derivative = differentiate(coefficients);
      const answer = poly(derivative);

      return {
        prompt: `Differentiate y = ${poly(coefficients)} with respect to x.`,
        answer,
        distractors: pickDistractors(answer, [
          poly([...derivative, coefficients[3]]), // kept the constant term
          poly(coefficients.map((c, i) => c * (coefficients.length - i))), // multiplied without reducing the power
          poly(differentiate(derivative)), // differentiated twice
          poly(derivative.map((c) => c + 1)),
        ]),
        explanation:
          `Bring the power down and reduce it by one: ` +
          `${coefficients[0]}x³ → ${derivative[0]}x², ${coefficients[1]}x² → ${derivative[1]}x, ` +
          `${coefficients[2]}x → ${derivative[2]}, and the constant ${coefficients[3]} differentiates to 0. ` +
          `So dy/dx = ${answer}.`,
        check: () => {
          /* Compare against a central difference quotient. */
          for (const x of [-2, 0.5, 3]) {
            const h = 1e-5;
            const numerical = (evaluate(coefficients, x + h) - evaluate(coefficients, x - h)) / (2 * h);
            const symbolic = evaluate(derivative, x);
            if (Math.abs(numerical - symbolic) > 1e-4) {
              return `at x = ${x}: symbolic ${symbolic}, numerical ${numerical}`;
            }
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.stationary-points",
    topic: "differentiation",
    subtopic: "stationary-points",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      /* Build dy/dx from its chosen roots, so the stationary points are exact
         and the student's factorising has something clean to land on. */
      const r1 = rng.nonZero(-5, 5);
      let r2 = rng.nonZero(-5, 5);
      if (r2 === r1) r2 = r1 + 1;

      /* dy/dx = 3a(x − r1)(x − r2) means b = −3a(r1 + r2)/2, so a must be even
         whenever r1 + r2 is odd — otherwise the cubic picks up a half and the
         question stops looking like one a person would set. */
      const base = rng.int(1, 3);
      const a = (r1 + r2) % 2 === 0 ? base : base * 2;

      const b = (-3 * a * (r1 + r2)) / 2;
      const c = 3 * a * r1 * r2;
      const d = rng.nonZero(-10, 10);
      const coefficients = [a, b, c, d];
      const derivative = differentiate(coefficients);

      const roots = [r1, r2].sort((x, y) => x - y);
      const answer = solutions("x", roots);

      return {
        prompt: `Find the x-coordinates of the stationary points of y = ${poly(coefficients)}.`,
        answer,
        distractors: pickDistractors(answer, [
          solutions("x", roots.map((r) => -r)),
          solutions("x", [roots[0]]),
          solutions("x", roots.map((r) => r + 1)),
          solutions("x", [0, ...roots.slice(0, 1)]),
        ]),
        explanation:
          `Stationary points are where dy/dx = 0. Differentiating gives ${poly(derivative)}, ` +
          `which factorises to ${3 * a}(x ${r1 >= 0 ? "−" : "+"} ${Math.abs(r1)})(x ${r2 >= 0 ? "−" : "+"} ${Math.abs(r2)}). ` +
          `So ${answer}.`,
        check: () => {
          for (const r of roots) {
            const slope = evaluate(derivative, r);
            if (Math.abs(slope) > 1e-9) return `dy/dx at x = ${r} is ${slope}, not 0`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.tangent",
    topic: "differentiation",
    subtopic: "tangents-normals",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const coefficients = [rng.nonZero(1, 4), rng.nonZero(-8, 8), rng.nonZero(-10, 10)];
      const derivative = differentiate(coefficients);
      const x0 = rng.nonZero(-5, 5);
      const y0 = evaluate(coefficients, x0);
      const gradient = evaluate(derivative, x0);
      const intercept = y0 - gradient * x0;
      const wantNormal = rng.bool();

      const normalGradient = gradient === 0 ? null : rat(-1).div(rat(gradient));
      const normalIntercept = normalGradient ? rat(y0).sub(normalGradient.mul(rat(x0))) : null;

      const answer =
        wantNormal && normalGradient && normalIntercept
          ? `y = ${normalGradient}x ${normalIntercept.sign >= 0 ? "+" : "−"} ${normalIntercept.abs()}`
          : `y = ${poly([gradient, intercept])}`;

      return {
        prompt:
          `Find the equation of the ${wantNormal && normalGradient ? "normal" : "tangent"} to ` +
          `y = ${poly(coefficients)} at the point where x = ${x0}.`,
        answer,
        distractors: pickDistractors(answer, [
          wantNormal && normalGradient
            ? `y = ${poly([gradient, intercept])}` // gave the tangent
            : normalGradient
              ? `y = ${normalGradient}x ${normalIntercept!.sign >= 0 ? "+" : "−"} ${normalIntercept!.abs()}`
              : `y = ${poly([gradient, intercept + 1])}`,
          `y = ${poly([gradient, y0])}`, // used y at the point as the intercept
          `y = ${poly([y0, gradient])}`,
          `y = ${poly([gradient, intercept + gradient])}`,
        ]),
        explanation:
          `At x = ${x0}: y = ${y0}, and dy/dx = ${poly(derivative)} = ${gradient}. ` +
          (wantNormal && normalGradient
            ? `The normal is perpendicular, so its gradient is −1/${gradient} = ${normalGradient}. ` +
              `Through (${x0}, ${y0}): ${answer}.`
            : `The tangent has gradient ${gradient} through (${x0}, ${y0}): ${answer}.`),
        check: () => {
          if (wantNormal && normalGradient) {
            const product = normalGradient.toNumber() * gradient;
            return Math.abs(product + 1) < 1e-9 ? null : `gradients multiply to ${product}, not −1`;
          }
          return Math.abs(gradient * x0 + intercept - y0) < 1e-9
            ? null
            : `tangent does not pass through the point`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.chain-rule",
    topic: "differentiation",
    subtopic: "chain-rule",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      const a = rng.nonZero(2, 5);
      const b = rng.nonZero(-8, 8);
      const n = rng.int(2, 6);

      /* d/dx (ax + b)^n = an(ax + b)^(n-1) */
      const outer = a * n;
      const answer = `${outer === 1 ? "" : outer}(${poly([a, b])})${sup(n - 1)}`;

      return {
        prompt: `Differentiate y = (${poly([a, b])})${sup(n)} with respect to x.`,
        answer,
        distractors: pickDistractors(answer, [
          `${n}(${poly([a, b])})${sup(n - 1)}`, // forgot the inner derivative
          `${outer}(${poly([a, b])})${sup(n)}`, // did not reduce the power
          `${outer}(${poly([a, 0])})${sup(n - 1)}`,
          `${a}${n}(${poly([a, b])})${sup(n - 1)}`,
        ]),
        explanation:
          `Chain rule: differentiate the outside, keeping the inside, then multiply by the derivative of the inside. ` +
          `${n}(${poly([a, b])})${sup(n - 1)} × ${a} = ${answer}. ` +
          `Forgetting the ×${a} is the single most common chain rule error.`,
        check: () => {
          for (const x of [-1, 0.3, 2]) {
            const h = 1e-5;
            const f = (t: number) => Math.pow(a * t + b, n);
            const numerical = (f(x + h) - f(x - h)) / (2 * h);
            const symbolic = outer * Math.pow(a * x + b, n - 1);
            if (Math.abs(numerical - symbolic) > 1e-3 * Math.max(1, Math.abs(symbolic))) {
              return `at x = ${x}: symbolic ${symbolic}, numerical ${numerical}`;
            }
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.product-rule",
    topic: "differentiation",
    subtopic: "product-rule",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 20,
    build: (rng) => {
      const a = rng.nonZero(1, 4);
      const b = rng.nonZero(-6, 6);
      const c = rng.nonZero(1, 4);
      const d = rng.nonZero(-6, 6);

      /* y = (ax + b)(cx + d); y' = a(cx + d) + c(ax + b) = 2ac x + (ad + bc) */
      const derivative = [2 * a * c, a * d + b * c];
      const answer = poly(derivative);

      return {
        prompt: `Differentiate y = (${poly([a, b])})(${poly([c, d])}) using the product rule.`,
        answer,
        distractors: pickDistractors(answer, [
          poly([a * c, 0]), // differentiated each factor and multiplied
          poly([a * c, a * d + b * c]),
          poly([2 * a * c, a * d - b * c]),
          poly([2 * a * c, b * d]),
        ]),
        explanation:
          `Product rule: u'v + uv' = ${a}(${poly([c, d])}) + ${c}(${poly([a, b])}) = ${answer}. ` +
          `Expanding first gives ${poly([a * c, a * d + b * c, b * d])}, which differentiates to the same thing — ` +
          `a useful check. Differentiating the two factors and multiplying gives ${poly([a * c, 0])}, which is wrong.`,
        check: () => {
          for (const x of [-2, 0, 1.5]) {
            const h = 1e-5;
            const f = (t: number) => (a * t + b) * (c * t + d);
            const numerical = (f(x + h) - f(x - h)) / (2 * h);
            const symbolic = evaluate(derivative, x);
            if (Math.abs(numerical - symbolic) > 1e-3) return `at x = ${x}: ${symbolic} vs ${numerical}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.integrate-poly",
    topic: "integration",
    subtopic: "indefinite",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const coefficients = [rng.nonZero(1, 8), rng.nonZero(-9, 9), rng.nonZero(-9, 9)];
      const integral = integrate(coefficients);
      const answer = `${polyRational(integral)} + c`;

      return {
        prompt: `Find ∫ ${poly(coefficients)} dx.`,
        answer,
        distractors: pickDistractors(answer, [
          polyRational(integral), // forgot the constant
          `${poly(differentiate(coefficients))} + c`, // differentiated instead
          `${polyRational(coefficients.map((v, i) => rat(v, coefficients.length - i)))} + c`,
          `${polyRational(integral.map((r) => r.mul(rat(2))))} + c`,
        ]),
        explanation:
          `Raise each power by one and divide by the new power: ` +
          coefficients
            .map((c, i) => {
              const power = coefficients.length - 1 - i;
              return `${c}x${power === 0 ? "" : sup(power)} → ${integral[i]}x${sup(power + 1)}`;
            })
            .join(", ") +
          `. Add the constant of integration: ${answer}.`,
        check: () => {
          /* Differentiating the answer must return the integrand. */
          const backCoefficients = integral.map((r, i) => r.toNumber() * (integral.length - i));
          for (let i = 0; i < coefficients.length; i++) {
            if (Math.abs(backCoefficients[i] - coefficients[i]) > 1e-9) {
              return `differentiating the integral gives ${backCoefficients[i]}, expected ${coefficients[i]}`;
            }
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.definite-integral",
    topic: "integration",
    subtopic: "definite",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const coefficients = [rng.nonZero(1, 5), rng.nonZero(-8, 8), rng.nonZero(-8, 8)];
      const integral = integrate(coefficients);
      const lower = rng.int(-3, 1);
      const upper = lower + rng.int(1, 5);

      /* Kept exact. The antiderivative has rational coefficients, so the
         definite integral is a fraction a student can write down — asking for
         four decimal places would turn a calculus question into typing. */
      const Fexact = (x: number) =>
        integral.reduce((acc, c) => acc.mul(rat(x)).add(c), rat(0)).mul(rat(x));
      const exactValue = Fexact(upper).sub(Fexact(lower));
      const exact = exactValue.toNumber();
      const answer = exactValue.toString();
      const F = (x: number) => evaluateRational(integral, x) * x;

      return {
        prompt: `Evaluate ∫ from ${lower} to ${upper} of ${poly(coefficients)} dx. Give an exact answer.`,
        answer,
        distractors: pickDistractors(answer, [
          exactValue.neg().toString(), // limits the wrong way round
          Fexact(upper).toString(), // forgot the lower limit
          String(evaluate(coefficients, upper) - evaluate(coefficients, lower)), // never integrated
          exactValue.mul(rat(2)).toString(),
          exactValue.add(rat(1)).toString(),
        ]),
        explanation:
          `Integrate: ${polyRational(integral)}. ` +
          `Then substitute the limits, top minus bottom: F(${upper}) − F(${lower}) = ` +
          `${Fexact(upper)} − ${Fexact(lower)} = ${answer}. ` +
          `No constant of integration is needed — it cancels in the subtraction.`,
        check: () => {
          /* A Riemann sum, as an independent numerical check. */
          const steps = 20000;
          const h = (upper - lower) / steps;
          let sum = 0;
          for (let i = 0; i < steps; i++) {
            sum += evaluate(coefficients, lower + (i + 0.5) * h) * h;
          }
          return Math.abs(sum - exact) < 1e-3 * Math.max(1, Math.abs(exact))
            ? null
            : `analytic ${exact}, numerical ${sum}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.area-under-curve",
    topic: "integration",
    subtopic: "area-under-curve",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      /* y = a(x − p)(x − q) with p < q, area between the roots. */
      const a = rng.int(1, 3);
      const p = rng.int(-4, 1);
      const q = p + rng.int(2, 5);

      const coefficients = [a, -a * (p + q), a * p * q];
      const integral = integrate(coefficients);
      const Fexact = (x: number) =>
        integral.reduce((acc, c) => acc.mul(rat(x)).add(c), rat(0)).mul(rat(x));
      const signedExact = Fexact(q).sub(Fexact(p));
      const areaExact = signedExact.abs();
      const signed = signedExact.toNumber();
      const area = areaExact.toNumber();
      const answer = areaExact.toString();

      return {
        prompt:
          `The curve y = ${poly(coefficients)} crosses the x-axis at x = ${p} and x = ${q}. ` +
          `Find the exact area enclosed between the curve and the x-axis.`,
        answer,
        distractors: pickDistractors(answer, [
          signedExact.toString(), // kept the negative sign
          Fexact(q).toString(),
          areaExact.div(rat(2)).toString(),
          areaExact.mul(rat(2)).toString(),
          areaExact.add(rat(1)).toString(),
        ]),
        explanation:
          `Integrate between the roots: ∫ from ${p} to ${q} gives ${signedExact}. ` +
          (signed < 0
            ? `The curve is below the axis over this interval, so the integral is negative — area is its magnitude, ${answer}.`
            : `The curve is above the axis, so the integral is already the area: ${answer}.`),
        check: () => {
          const steps = 20000;
          const h = (q - p) / steps;
          let sum = 0;
          for (let i = 0; i < steps; i++) sum += Math.abs(evaluate(coefficients, p + (i + 0.5) * h)) * h;
          return Math.abs(sum - area) < 1e-2 * Math.max(1, area) ? null : `analytic ${area}, numerical ${sum}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.trapezium-rule",
    topic: "numerical-methods",
    subtopic: "trapezium-rule",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      const coefficients = [rng.nonZero(1, 3), rng.nonZero(-5, 5), rng.nonZero(-6, 6)];
      const lower = rng.int(0, 2);
      const strips = rng.pick([2, 4]);
      const upper = lower + strips;
      const h = (upper - lower) / strips;

      const ordinates = Array.from({ length: strips + 1 }, (_, i) => evaluate(coefficients, lower + i * h));
      /* Integer coefficients, integer limits and h = 1, so every ordinate and
         the final total are whole numbers or clean halves. */
      const estimate =
        (h / 2) * (ordinates[0] + ordinates[strips] + 2 * ordinates.slice(1, -1).reduce((a, b) => a + b, 0));
      const answer = rat(Math.round(estimate * 2), 2).toString();

      return {
        prompt:
          `Use the trapezium rule with ${strips} strips to estimate ∫ from ${lower} to ${upper} of ` +
          `${poly(coefficients)} dx. Give an exact answer.`,
        answer,
        distractors: pickDistractors(answer, [
          rat(Math.round(h * ordinates.reduce((a, b) => a + b, 0) * 2), 2).toString(), // forgot the halving and doubling
          rat(Math.round((h / 2) * ordinates.reduce((a, b) => a + b, 0) * 2), 2).toString(), // interior not doubled
          rat(Math.round(((h * (ordinates[0] + ordinates[strips])) / 2) * 2), 2).toString(), // ends only
          rat(Math.round(estimate * 4), 2).toString(), // doubled
          rat(Math.round(estimate), 2).toString(), // halved
          rat(Math.round((estimate + h) * 2), 2).toString(),
          rat(Math.round((estimate - h) * 2), 2).toString(),
          rat(Math.round(estimate * 2) + 1, 2).toString(),
          rat(Math.round(estimate * 2) - 1, 2).toString(),
          rat(Math.round(estimate * 2) + 2, 2).toString(),
        ]),
        explanation:
          `h = ${h}, and the ordinates are ${ordinates.join(", ")}. ` +
          `Trapezium rule: (h/2)[first + last + 2(everything between)] = ` +
          `(${h}/2)[${ordinates[0]} + ${ordinates[strips]} + 2(${ordinates.slice(1, -1).join(" + ")})] = ${answer}. ` +
          `The end ordinates are counted once, the interior ones twice.`,
        check: () => {
          /* The trapezium estimate must bracket the true value on a quadratic:
             above it when the curve is concave up, below when concave down. */
          const integral = integrate(coefficients);
          const F = (x: number) => evaluateRational(integral, x) * x;
          const exact = F(upper) - F(lower);
          const concaveUp = coefficients[0] > 0;
          const ok = concaveUp ? estimate >= exact - 1e-9 : estimate <= exact + 1e-9;
          return ok ? null : `trapezium estimate ${estimate} on the wrong side of ${exact}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.newton-raphson",
    topic: "numerical-methods",
    subtopic: "newton-raphson",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 20,
    /* x₀ − f(x₀)/f'(x₀) to four decimal places is a division nobody does in
       their head, and pretending otherwise would just make it a worse
       question. It stays in the bank for practice, out of battles. */
    calculator: true,
    build: (rng) => {
      const coefficients = [1, rng.nonZero(-3, 3), rng.nonZero(-6, 6), rng.nonZero(-8, 8)];
      const derivative = differentiate(coefficients);
      const x0 = rng.int(1, 4);

      const fd0 = evaluate(derivative, x0);
      /* A zero derivative makes the method undefined — nudge the start. */
      const start = Math.abs(fd0) < 1e-9 ? x0 + 1 : x0;
      const fs = evaluate(coefficients, start);
      const fds = evaluate(derivative, start);
      const x1 = start - fs / fds;
      const answer = toPlaces(x1, 4);

      return {
        prompt:
          `Apply one iteration of the Newton-Raphson method to f(x) = ${poly(coefficients)} ` +
          `starting from x₀ = ${start}. Give x₁ to 4 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          toPlaces(start + fs / fds, 4), // sign error in the formula
          toPlaces(start - fds / fs, 4), // inverted the fraction
          toPlaces(fs / fds, 4),
          toPlaces(x1 + 0.5, 4),
        ]),
        explanation:
          `x₁ = x₀ − f(x₀)/f'(x₀). Here f(${start}) = ${toPlaces(fs, 4)} and ` +
          `f'(x) = ${poly(derivative)}, so f'(${start}) = ${toPlaces(fds, 4)}. ` +
          `x₁ = ${start} − ${toPlaces(fs, 4)}/${toPlaces(fds, 4)} = ${answer}. ` +
          `The subtraction is what moves the estimate towards the root.`,
        check: () => {
          /* The invariant is geometric, not convergent: x₁ is where the tangent
             at x₀ crosses the axis. Newton legitimately overshoots on a first
             step, so "the function value got smaller" is not a property of the
             method and testing for it fails on perfectly correct questions. */
          const tangentAtX1 = fs + fds * (x1 - start);
          return Math.abs(tangentAtX1) < 1e-6
            ? null
            : `the tangent at x₀ gives ${tangentAtX1} at x₁, not 0`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.separable-de",
    topic: "differential-equations",
    subtopic: "separable",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 20,
    calculator: true,
    build: (rng) => {
      const k = rng.nonZero(-4, 4);
      const y0 = rng.int(2, 20);
      const t = rng.int(1, 5);

      /* dy/dt = ky, y(0) = y0  →  y = y0 e^{kt} */
      const value = y0 * Math.exp(k * t);
      const answer = toPlaces(value, 4);

      return {
        prompt:
          `Solve dy/dt = ${k}y with y = ${y0} when t = 0, then find y when t = ${t}. ` +
          `Give your answer to 4 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          toPlaces(y0 * Math.exp(-k * t), 4), // sign of k lost
          toPlaces(y0 + k * t, 4), // integrated as though dy/dt were constant
          toPlaces(y0 * k * t, 4),
          toPlaces(Math.exp(k * t), 4), // dropped the initial condition
        ]),
        explanation:
          `Separate: (1/y) dy = ${k} dt. Integrating gives ln y = ${k}t + c, so y = Ae${sup(`${k}t`)}. ` +
          `At t = 0, y = ${y0}, so A = ${y0}. Then y(${t}) = ${y0}e${sup(`${k * t}`)} = ${answer}.`,
        check: () => {
          /* The solution must satisfy the differential equation numerically. */
          const h = 1e-6;
          const y = (s: number) => y0 * Math.exp(k * s);
          const slope = (y(t + h) - y(t - h)) / (2 * h);
          return Math.abs(slope - k * y(t)) < 1e-3 * Math.max(1, Math.abs(slope))
            ? null
            : `dy/dt = ${slope}, but ky = ${k * y(t)}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.parametric-differentiation",
    topic: "parametric",
    subtopic: "parametric-differentiation",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 18,
    build: (rng) => {
      const a = rng.nonZero(1, 4);
      const b = rng.nonZero(-5, 5);
      const c = rng.nonZero(1, 4);
      const t0 = rng.nonZero(-4, 4);

      /* x = at² + bt, y = ct³  →  dx/dt = 2at + b, dy/dt = 3ct² */
      const dxdt = 2 * a * t0 + b;
      const dydt = 3 * c * t0 * t0;
      const usable = dxdt === 0 ? 1 : dxdt;
      const gradientExact = rat(dydt, usable);
      const gradient = gradientExact.toNumber();
      const answer = gradientExact.toString();

      return {
        prompt:
          `A curve has x = ${poly([a, b, 0], "t")} and y = ${c}t³. ` +
          `Find the exact value of dy/dx when t = ${t0}.`,
        answer,
        distractors: pickDistractors(answer, [
          rat(usable, dydt === 0 ? 1 : dydt).toString(), // upside down
          String(dydt), // gave dy/dt
          String(usable), // gave dx/dt
          gradientExact.mul(rat(2)).toString(),
          gradientExact.neg().toString(),
        ]),
        explanation:
          `dy/dx = (dy/dt) ÷ (dx/dt). Here dy/dt = ${3 * c}t² = ${dydt} and dx/dt = ${poly([2 * a, b], "t")} = ${usable}. ` +
          `So dy/dx = ${dydt} ÷ ${usable} = ${answer}. Dividing the wrong way round gives dx/dy.`,
        check: () => {
          const h = 1e-5;
          const x = (t: number) => a * t * t + b * t;
          const y = (t: number) => c * t ** 3;
          const numerical = (y(t0 + h) - y(t0 - h)) / (x(t0 + h) - x(t0 - h));
          return Math.abs(numerical - gradient) < 1e-2 * Math.max(1, Math.abs(gradient))
            ? null
            : `symbolic ${gradient}, numerical ${numerical}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.calc.sign-change",
    topic: "numerical-methods",
    subtopic: "sign-change",
    curriculumLevel: "YEAR_13",
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      /*
       * Construct the sign change rather than search for one.
       *
       * Searching a fixed window and falling back when nothing was found
       * produced questions asserting a root in an interval that had none. The
       * constant term is free, so it can be SOLVED for instead: with
       * g(x) = x³ + bx² + cx, the endpoints straddle zero exactly when d lies
       * strictly between −g(upper) and −g(lower). Strictly, because d landing
       * on either bound puts a root ON an endpoint, where the product is zero
       * rather than negative and the sign-change argument does not apply.
       */
      let b = rng.nonZero(-3, 3);
      let c = rng.nonZero(-6, 6);
      let lower = rng.int(-3, 3);

      const gap = (bb: number, cc: number, l: number) => {
        const g = (x: number) => x ** 3 + bb * x * x + cc * x;
        return Math.abs(g(l + 1) - g(l));
      };

      /* A gap below 2 leaves no integer strictly between the bounds. */
      for (let attempt = 0; attempt < 40 && gap(b, c, lower) < 2; attempt++) {
        b = rng.nonZero(-3, 3);
        c = rng.nonZero(-6, 6);
        lower = rng.int(-3, 3);
      }

      const upper = lower + 1;
      const g = (x: number) => x ** 3 + b * x * x + c * x;
      const low = Math.min(-g(lower), -g(upper));
      const high = Math.max(-g(lower), -g(upper));
      const d = Math.floor((low + high) / 2) === low ? low + 1 : Math.floor((low + high) / 2);

      const coefficients = [1, b, c, d];
      const fLower = evaluate(coefficients, lower);
      const fUpper = evaluate(coefficients, upper);
      const found = fLower * fUpper < 0;
      const answer = `[${lower}, ${upper}]`;

      return {
        prompt:
          `f(x) = ${poly(coefficients)}. Given f(${lower}) = ${fLower} and f(${upper}) = ${fUpper}, ` +
          `which interval is guaranteed to contain a root?`,
        answer,
        distractors: pickDistractors(answer, [
          `[${lower - 1}, ${lower}]`,
          `[${upper}, ${upper + 1}]`,
          `[${lower - 1}, ${upper + 1}]`,
          "No interval can be guaranteed",
        ]),
        explanation:
          `f(${lower}) = ${fLower} and f(${upper}) = ${fUpper} have opposite signs, and a polynomial is ` +
          `continuous, so the graph must cross the axis somewhere between them. That guarantees a root in ${answer}. ` +
          `Continuity is the part of the argument people leave out — without it, a sign change proves nothing.`,
        check: () =>
          found && fLower * fUpper < 0
            ? null
            : `no genuine sign change: f(${lower}) = ${fLower}, f(${upper}) = ${fUpper}`,
      };
    },
  }),

  generator({
    key: "alevel.calc.second-derivative",
    topic: "differentiation",
    subtopic: "stationary-points",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 20,
    build: (rng) => {
      const a = rng.nonZero(1, 4);
      const b = rng.nonZero(-9, 9);
      const c = rng.nonZero(-9, 9);
      const coefficients = [a, b, c];
      const derivative = differentiate(coefficients);
      const second = differentiate(derivative);

      const x0 = rat(-b, 2 * a);
      const nature = second[0] > 0 ? "a minimum" : "a maximum";
      const answer = `x = ${x0}, ${nature}`;

      return {
        prompt:
          `Find the stationary point of y = ${poly(coefficients)} and use the second derivative ` +
          `to determine its nature.`,
        answer,
        distractors: pickDistractors(answer, [
          `x = ${x0}, ${second[0] > 0 ? "a maximum" : "a minimum"}`, // nature the wrong way round
          `x = ${x0.neg()}, ${nature}`,
          `x = ${rat(b, 2 * a)}, ${nature}`,
          `x = ${x0}, a point of inflection`,
        ]),
        explanation:
          `dy/dx = ${poly(derivative)}, which is zero at x = ${x0}. ` +
          `d²y/dx² = ${second[0]}, which is ${second[0] > 0 ? "positive" : "negative"} everywhere, ` +
          `so the curve is concave ${second[0] > 0 ? "up" : "down"} and the point is ${nature}. ` +
          `Positive second derivative means minimum — the curve holds water.`,
        check: () => {
          const slope = evaluate(derivative, x0.toNumber());
          if (Math.abs(slope) > 1e-9) return `dy/dx at the stationary point is ${slope}`;
          const left = evaluate(coefficients, x0.toNumber() - 1);
          const at = evaluate(coefficients, x0.toNumber());
          return second[0] > 0 ? (left > at ? null : `not a minimum`) : left < at ? null : `not a maximum`;
        },
      };
    },
  }),
];
