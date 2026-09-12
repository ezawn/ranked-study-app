/**
 * A-Level Pure: algebra, functions, coordinate geometry, sequences, series,
 * exponentials, logarithms, binomial expansion, trigonometry and proof.
 *
 * The same construction-first discipline as the GCSE files. A factor-theorem
 * question is built by choosing the root and multiplying up, so the cubic is
 * guaranteed to have it; a geometric series question chooses r and a and sums
 * them exactly. Nothing is written down that was not first computed.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Rational, rat } from "./rational";
import { bracket, poly, point, solutions, sup, toPlaces, toSigFigs } from "./format";

/** Exact trig values students are expected to know, as surd strings. */
const EXACT_TRIG: readonly { angle: number; sin: string; cos: string; tan: string }[] = [
  { angle: 0, sin: "0", cos: "1", tan: "0" },
  { angle: 30, sin: "1/2", cos: "√3/2", tan: "√3/3" },
  { angle: 45, sin: "√2/2", cos: "√2/2", tan: "1" },
  { angle: 60, sin: "√3/2", cos: "1/2", tan: "√3" },
  { angle: 90, sin: "1", cos: "0", tan: "undefined" },
];

export const aLevelPure: Generator[] = [
  generator({
    key: "alevel.pure.factor-theorem",
    topic: "algebra",
    subtopic: "factor-theorem",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      /* Build the cubic from its factors so the root is certain. */
      const r1 = rng.nonZero(-4, 4);
      const r2 = rng.nonZero(-4, 4);
      const r3 = rng.nonZero(-4, 4);

      const b = -(r1 + r2 + r3);
      const c = r1 * r2 + r1 * r3 + r2 * r3;
      const d = -(r1 * r2 * r3);
      const roots = [...new Set([r1, r2, r3])].sort((x, y) => x - y);
      const answer = solutions("x", roots);

      return {
        prompt: `Solve ${poly([1, b, c, d])} = 0.`,
        answer,
        distractors: pickDistractors(answer, [
          solutions("x", roots.map((r) => -r)), // sign confusion between factor and root
          solutions("x", roots.slice(0, Math.max(1, roots.length - 1))),
          solutions("x", roots.map((r) => r + 1)),
          solutions("x", [b, c, d].slice(0, roots.length)),
        ]),
        explanation:
          `Trying small factors of ${d}: f(${r1}) = 0, so (x ${r1 >= 0 ? "−" : "+"} ${Math.abs(r1)}) is a factor. ` +
          `Dividing gives a quadratic whose roots are the rest, so ${answer}. ` +
          `The factor theorem says f(a) = 0 exactly when (x − a) is a factor — the sign flips between the two.`,
        check: () => {
          for (const r of roots) {
            const value = r ** 3 + b * r * r + c * r + d;
            if (value !== 0) return `x = ${r} gives ${value}, not 0`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.polynomial-remainder",
    topic: "algebra",
    subtopic: "polynomial-division",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const a = rng.int(1, 4);
      const b = rng.nonZero(-8, 8);
      const c = rng.nonZero(-9, 9);
      const d = rng.nonZero(-12, 12);
      const k = rng.nonZero(-5, 5);

      const remainder = a * k ** 3 + b * k * k + c * k + d;
      const answer = String(remainder);

      return {
        prompt:
          `Find the remainder when ${poly([a, b, c, d])} is divided by ` +
          `(x ${k >= 0 ? "−" : "+"} ${Math.abs(k)}).`,
        answer,
        distractors: pickDistractors(String(remainder), [
          String(a * (-k) ** 3 + b * k * k + c * -k + d), // substituted the wrong sign
          String(d), // read off the constant term
          String(remainder + k),
          String(a + b + c + d), // substituted x = 1 regardless
        ]),
        explanation:
          `The remainder theorem: dividing by (x ${k >= 0 ? "−" : "+"} ${Math.abs(k)}) leaves f(${k}). ` +
          `f(${k}) = ${a}(${k})³ ${b >= 0 ? "+" : "−"} ${Math.abs(b)}(${k})² ${c >= 0 ? "+" : "−"} ${Math.abs(c)}(${k}) ${d >= 0 ? "+" : "−"} ${Math.abs(d)} = ${remainder}. ` +
          `Note the sign: dividing by (x + 3) means substituting x = −3.`,
        check: () => {
          const rebuilt = a * Math.pow(k, 3) + b * k * k + c * k + d;
          return rebuilt === remainder ? null : `remainder recomputes to ${rebuilt}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.circle-equation",
    topic: "coordinate-geometry",
    subtopic: "circle-properties",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const cx = rng.nonZero(-8, 8);
      const cy = rng.nonZero(-8, 8);
      const r = rng.int(2, 10);

      /* x² + y² + Dx + Ey + F = 0 form, so the student has to complete the square. */
      const D = -2 * cx;
      const E = -2 * cy;
      const F = cx * cx + cy * cy - r * r;
      const answer = `centre ${point(cx, cy)}, radius ${r}`;

      return {
        prompt:
          `A circle has equation x² + y² ${D >= 0 ? "+" : "−"} ${Math.abs(D)}x ` +
          `${E >= 0 ? "+" : "−"} ${Math.abs(E)}y ${F >= 0 ? "+" : "−"} ${Math.abs(F)} = 0. ` +
          `Find its centre and radius.`,
        answer,
        distractors: pickDistractors(answer, [
          `centre ${point(-cx, -cy)}, radius ${r}`, // sign slip completing the square
          `centre ${point(cx, cy)}, radius ${r * r}`, // forgot the square root
          `centre ${point(D, E)}, radius ${r}`,
          `centre ${point(cx, cy)}, radius ${toPlaces(Math.sqrt(Math.abs(F)), 2)}`,
        ]),
        explanation:
          `Complete the square in x and y: (x ${cx >= 0 ? "−" : "+"} ${Math.abs(cx)})² + ` +
          `(y ${cy >= 0 ? "−" : "+"} ${Math.abs(cy)})² = ${r * r}. ` +
          `Comparing with (x − a)² + (y − b)² = r² gives ${answer}. ` +
          `The centre's coordinates are the OPPOSITE sign to what appears inside the brackets.`,
        check: () => {
          /* A point on the circle must satisfy the original equation. */
          const px = cx + r;
          const py = cy;
          const value = px * px + py * py + D * px + E * py + F;
          return Math.abs(value) < 1e-9 ? null : `point on circle gives ${value}, not 0`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.arithmetic-series",
    topic: "series",
    subtopic: "arithmetic-series",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const a = rng.nonZero(-12, 20);
      const d = rng.nonZero(-8, 9);
      const n = rng.int(8, 40);
      const sum = (n / 2) * (2 * a + (n - 1) * d);
      const nth = a + (n - 1) * d;
      const answer = String(sum);

      return {
        prompt:
          `An arithmetic series has first term ${a} and common difference ${d}. ` +
          `Find the sum of the first ${n} terms.`,
        answer,
        distractors: pickDistractors(String(sum), [
          String(nth), // gave the nth term instead of the sum
          String((n / 2) * (2 * a + n * d)), // used n instead of n − 1
          String(n * a),
          String(sum + d),
        ]),
        explanation:
          `Sₙ = n/2 [2a + (n − 1)d] = ${n}/2 [2(${a}) + ${n - 1}(${d})] = ${n / 2} × ${2 * a + (n - 1) * d} = ${sum}. ` +
          `The last term is ${nth}; the sum is not the same thing.`,
        check: () => {
          let brute = 0;
          for (let i = 0; i < n; i++) brute += a + i * d;
          return brute === sum ? null : `formula gives ${sum}, term-by-term gives ${brute}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.geometric-sum",
    topic: "series",
    subtopic: "geometric-series",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      /* Exact rational arithmetic all the way through, so the answer is a
         fraction a student can write down rather than four decimal places they
         have to type for. */
      const a = rng.int(1, 9);
      const r = rng.pick([rat(2), rat(3), rat(1, 2), rat(1, 3), rat(-2)]);
      const n = rng.int(3, 7);
      const sumExact = rat(a).mul(rat(1).sub(r.pow(n))).div(rat(1).sub(r));
      const sum = sumExact.toNumber();
      const answer = sumExact.toString();

      return {
        prompt:
          `A geometric series has first term ${a} and common ratio ${r}. ` +
          `Find the exact sum of the first ${n} terms.`,
        answer,
        distractors: pickDistractors(answer, [
          rat(a).mul(rat(1).sub(r.pow(n - 1))).div(rat(1).sub(r)).toString(), // off-by-one
          rat(a).mul(r.pow(n - 1)).toString(), // gave the nth term
          rat(a).mul(r.pow(n).sub(rat(1))).div(rat(1).sub(r)).toString(), // sign flipped
          r.abs().compare(rat(1)) < 0 ? rat(a).div(rat(1).sub(r)).toString() : rat(a).mul(rat(n)).toString(),
          sumExact.add(rat(1)).toString(),
        ]),
        explanation:
          `Sₙ = a(1 − rⁿ)/(1 − r) = ${a}(1 − ${r}${sup(n)})/(1 − ${r}) = ${answer}. ` +
          (r.abs().compare(rat(1)) < 0
            ? `The sum to infinity is ${rat(a).div(rat(1).sub(r))} — a different question.`
            : `There is no sum to infinity here, because |r| ≥ 1.`),
        check: () => {
          let brute = 0;
          for (let i = 0; i < n; i++) brute += a * Math.pow(r.toNumber(), i);
          return Math.abs(brute - sum) < 1e-6 ? null : `formula ${sum} vs term-by-term ${brute}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.sum-to-infinity",
    topic: "series",
    subtopic: "sum-to-infinity",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const a = rng.int(2, 40);
      const rNum = rng.int(1, 4);
      const rDen = rng.int(rNum + 1, 9);
      const r = rat(rNum * rng.sign(), rDen);
      const sum = rat(a).div(rat(1).sub(r));
      const answer = sum.toString();

      return {
        prompt:
          `A geometric series has first term ${a} and common ratio ${r}. ` +
          `Find its sum to infinity, as a fraction in its simplest form.`,
        answer,
        distractors: pickDistractors(answer, [
          rat(a).div(rat(1).add(r)).toString(), // sign error in the denominator
          rat(a).div(r).toString(),
          rat(a).mul(rat(1).sub(r)).toString(), // multiplied instead of dividing
          rat(a).div(rat(1).sub(r.neg())).toString(),
        ]),
        explanation:
          `|r| = ${r.abs()} < 1, so the sum converges: S∞ = a/(1 − r) = ${a} ÷ (1 − ${r}) = ${a} ÷ ${rat(1).sub(r)} = ${answer}.`,
        check: () => {
          let brute = 0;
          for (let i = 0; i < 400; i++) brute += a * Math.pow(r.toNumber(), i);
          return Math.abs(brute - sum.toNumber()) < 1e-6
            ? null
            : `closed form ${sum.toNumber()} vs partial sum ${brute}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.binomial-term",
    topic: "binomial-expansion",
    subtopic: "general-term",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      const n = rng.int(5, 10);
      const k = rng.int(2, Math.min(5, n - 1));
      const a = rng.nonZero(-4, 4);

      const coefficient = choose(n, k) * Math.pow(a, k);
      const answer = String(coefficient);

      return {
        prompt: `Find the coefficient of x${sup(k)} in the expansion of (1 + ${a}x)${sup(n)}.`,
        answer,
        distractors: pickDistractors(String(coefficient), [
          String(choose(n, k)), // forgot to raise a to the power
          String(choose(n, k) * a), // raised a to the first power only
          String(choose(n, k - 1) * Math.pow(a, k)), // wrong binomial coefficient
          String(choose(n, k + 1) * Math.pow(a, k)),
          String(Math.pow(a, k)), // dropped the coefficient entirely
          String(-coefficient),
          String(coefficient * 2),
        ]),
        explanation:
          `The general term is C(${n}, r)(${a}x)ʳ. For x${sup(k)}, r = ${k}: ` +
          `C(${n}, ${k}) = ${choose(n, k)}, and (${a})${sup(k)} = ${Math.pow(a, k)}. ` +
          `Coefficient = ${choose(n, k)} × ${Math.pow(a, k)} = ${coefficient}. ` +
          `The whole of ${a}x is raised to the power, not just x.`,
        check: () => {
          const rebuilt = choose(n, k) * Math.pow(a, k);
          return rebuilt === coefficient ? null : `coefficient recomputes to ${rebuilt}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.log-laws",
    topic: "exponentials-logs",
    subtopic: "log-laws",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const base = rng.pick([2, 3, 5, 10]);
      const p = rng.int(1, 4);
      const q = rng.int(1, 4);
      const combine = rng.pick(["add", "subtract"] as const);
      const x = Math.pow(base, p);
      const y = Math.pow(base, q);
      const result = combine === "add" ? p + q : p - q;
      const answer = String(result);

      return {
        prompt:
          `Evaluate log${sub(base)}(${x}) ${combine === "add" ? "+" : "−"} log${sub(base)}(${y}).`,
        answer,
        distractors: pickDistractors(String(result), [
          String(combine === "add" ? p * q : Rational.of(p, q).toNumber()), // applied the wrong law
          String(combine === "add" ? x + y : x - y), // added the arguments instead of the logs
          String(combine === "add" ? x * y : x / y), // gave the argument, not the log
          String(-result),
          String(result + 1),
          String(result - 1),
          String(p),
          String(q),
        ]),
        explanation:
          `log ${combine === "add" ? "a + log b = log(ab)" : "a − log b = log(a/b)"}, so this is ` +
          `log${sub(base)}(${combine === "add" ? x * y : x / y}) = ${result}, because ` +
          `${base}${sup(result)} = ${Math.pow(base, result)}. ` +
          `Adding logs multiplies the arguments — it does not add them.`,
        check: () => {
          const value =
            combine === "add"
              ? Math.log(x) / Math.log(base) + Math.log(y) / Math.log(base)
              : Math.log(x) / Math.log(base) - Math.log(y) / Math.log(base);
          return Math.abs(value - result) < 1e-9 ? null : `logs evaluate to ${value}, not ${result}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.solve-exponential",
    topic: "exponentials-logs",
    subtopic: "solving-exponentials",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      /* An exact power, so the answer is a whole number and the question is
         about recognising it rather than typing log 847 ÷ log 3. */
      const base = rng.pick([2, 3, 4, 5, 10]);
      const x = rng.int(2, base <= 3 ? 8 : 5);
      const target = Math.pow(base, x);
      const answer = String(x);

      return {
        prompt: `Solve ${base}${sup("x")} = ${target}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(target / base), // divided instead of taking logs
          String(x + 1),
          String(x - 1),
          String(target - base),
          String(x * base),
        ]),
        explanation:
          `Write ${target} as a power of ${base}: ${target} = ${base}${sup(x)}. ` +
          `Equal bases mean equal indices, so x = ${answer}. ` +
          `Taking logs gives the same thing — log ${target} ÷ log ${base} = ${x} — but spotting the ` +
          `power is faster and exact.`,
        check: () =>
          Math.pow(base, x) === target ? null : `${base}^${x} = ${Math.pow(base, x)}, expected ${target}`,
      };
    },
  }),

  generator({
    key: "alevel.pure.growth-decay",
    topic: "exponentials-logs",
    subtopic: "growth-decay",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 22,
    /* e^{kt} for arbitrary k and t has no exact form worth writing down. This
       one belongs in revision, not in a two-minute race. */
    calculator: true,
    build: (rng) => {
      const initial = rng.int(2, 40) * 50;
      const rate = rng.pick([0.05, 0.08, 0.1, 0.12, 0.15, 0.2]);
      const t = rng.int(3, 15);
      const decay = rng.bool();
      const k = decay ? -rate : rate;
      const value = initial * Math.exp(k * t);
      const answer = toSigFigs(value, 4);

      return {
        prompt:
          `A population follows P = ${initial}e${sup(`${decay ? "-" : ""}${rate}t`)}, where t is in years. ` +
          `Find P when t = ${t}, to 4 significant figures.`,
        answer,
        distractors: pickDistractors(answer, [
          toSigFigs(initial * Math.exp(-k * t), 4), // sign of the exponent flipped
          toSigFigs(initial * (1 + k * t), 4), // treated it as linear
          toSigFigs(initial * Math.exp(k), 4), // ignored t
          toSigFigs(value * 2, 4),
        ]),
        explanation:
          `Substitute t = ${t}: P = ${initial} × e${sup(`${toPlaces(k * t, 3)}`)} = ${answer}. ` +
          `Exponential ${decay ? "decay" : "growth"} is multiplicative — a linear estimate would give ` +
          `${toSigFigs(initial * (1 + k * t), 4)}, which drifts further out the longer you extrapolate.`,
        check: () => {
          const rebuilt = initial * Math.exp(k * t);
          return Math.abs(rebuilt - value) < 1e-6 ? null : `value does not reconstruct`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.exact-trig",
    topic: "trigonometry",
    subtopic: "exact-values",
    curriculumLevel: "YEAR_12",
    difficulty: 4,
    /* Four angles times three ratios. There are exactly twelve of these to
       know, which is the point of the topic. */
    variants: 12,
    build: (rng) => {
      const entry = rng.pick(EXACT_TRIG.filter((e) => e.angle !== 90));
      const fn = rng.pick(["sin", "cos", "tan"] as const);
      const answer = entry[fn];

      const others = EXACT_TRIG.filter((e) => e.angle !== entry.angle).map((e) => e[fn]);

      return {
        prompt: `Write down the exact value of ${fn} ${entry.angle}°.`,
        answer,
        distractors: pickDistractors(answer, [
          fn === "sin" ? entry.cos : fn === "cos" ? entry.sin : entry.sin, // confused the ratio
          ...others,
        ]),
        explanation:
          `From the ${entry.angle === 45 ? "right-angled isosceles triangle with sides 1, 1, √2" : "equilateral triangle split in half, giving sides 1, √3, 2"}, ` +
          `${fn} ${entry.angle}° = ${answer}. These are worth memorising — a calculator gives a decimal, and exam questions ask for the exact form.`,
        check: () => {
          const expected =
            fn === "sin"
              ? Math.sin((entry.angle * Math.PI) / 180)
              : fn === "cos"
                ? Math.cos((entry.angle * Math.PI) / 180)
                : Math.tan((entry.angle * Math.PI) / 180);
          const got = evaluateSurdFraction(answer);
          return got !== null && Math.abs(got - expected) < 1e-9
            ? null
            : `${answer} evaluates to ${got}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.trig-equation",
    topic: "trigonometry",
    subtopic: "trig-equations",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    /* Three ratios, three exact angles, positive and negative. */
    variants: 18,
    build: (rng) => {
      /*
       * Only the exact values, so the prompt reads "sin x = ½" rather than
       * "sin x = 0.3420" — which is a question about owning a calculator.
       */
      const principal = rng.pick([30, 45, 60]);
      const fn = rng.pick(["sin", "cos", "tan"] as const);
      const negative = rng.bool();

      const exact: Record<number, Record<"sin" | "cos" | "tan", string>> = {
        30: { sin: "1/2", cos: "√3/2", tan: "√3/3" },
        45: { sin: "√2/2", cos: "√2/2", tan: "1" },
        60: { sin: "√3/2", cos: "1/2", tan: "√3" },
      };
      const shown = `${negative ? "−" : ""}${exact[principal][fn]}`;

      /*
       * Where the second solution lives depends on the curve, and getting it
       * from the graph rather than from a remembered rule is the whole skill.
       */
      const solutionSet =
        fn === "sin"
          ? negative
            ? [180 + principal, 360 - principal]
            : [principal, 180 - principal]
          : fn === "cos"
            ? negative
              ? [180 - principal, 180 + principal]
              : [principal, 360 - principal]
            : negative
              ? [180 - principal, 360 - principal]
              : [principal, 180 + principal];

      const ordered = [...solutionSet].sort((a, b) => a - b);
      const answer = solutions("x", ordered);

      const shape =
        fn === "sin"
          ? "The sine curve is symmetric about 90° and repeats every 360°"
          : fn === "cos"
            ? "The cosine curve is symmetric about 180°"
            : "The tangent curve repeats every 180°";

      return {
        prompt: `Solve ${fn} x = ${shown} for 0° ≤ x ≤ 360°, giving your answers in degrees.`,
        answer,
        distractors: pickDistractors(answer, [
          solutions("x", [ordered[0]]), // only the first solution
          solutions("x", [principal, 180 - principal]),
          solutions("x", [principal, 360 - principal]),
          solutions("x", [180 + principal, 360 - principal]),
          solutions("x", ordered.map((x) => (x + 90) % 360).sort((a, b) => a - b)),
        ]),
        explanation:
          `${fn} ${principal}° = ${exact[principal][fn]}, so ${principal}° is the reference angle. ` +
          `${shape}, which puts the solutions in 0° ≤ x ≤ 360° at ${answer}. ` +
          `Stopping at the calculator value loses half the marks.`,
        check: () => {
          const target =
            (negative ? -1 : 1) *
            (fn === "sin"
              ? Math.sin((principal * Math.PI) / 180)
              : fn === "cos"
                ? Math.cos((principal * Math.PI) / 180)
                : Math.tan((principal * Math.PI) / 180));

          for (const x of ordered) {
            const rad = (x * Math.PI) / 180;
            const got = fn === "sin" ? Math.sin(rad) : fn === "cos" ? Math.cos(rad) : Math.tan(rad);
            if (Math.abs(got - target) > 1e-9) {
              return `x = ${x} gives ${fn} = ${got}, expected ${target}`;
            }
          }
          return ordered.length === 2 ? null : `expected two solutions, got ${ordered.length}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.radians-sector",
    topic: "trigonometry",
    subtopic: "radians",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /* Exact, in terms of π. s = rθ and A = ½r²θ with θ a rational multiple
         of π give a rational coefficient — no rounding, no keypad. */
      const r = rng.pick([2, 3, 4, 6, 8, 9, 10, 12]);
      const thetaNum = rng.int(1, 5);
      const thetaDen = rng.pick([2, 3, 4, 6]);
      const thetaOverPi = rat(thetaNum, thetaDen);
      const theta = thetaOverPi.toNumber() * Math.PI;
      const wantArc = rng.bool();
      const arcCoefficient = thetaOverPi.mul(rat(r));
      const areaCoefficient = thetaOverPi.mul(rat(r * r, 2));
      const chosen = wantArc ? arcCoefficient : areaCoefficient;
      const answer = `${chosen.toString() === "1" ? "" : chosen}π cm${wantArc ? "" : "²"}`;

      return {
        prompt:
          `A sector has radius ${r} cm and angle ${thetaNum === 1 ? "" : thetaNum}π/${thetaDen} radians. ` +
          `Find its exact ${wantArc ? "arc length" : "area"}, in terms of π.`,
        answer,
        distractors: pickDistractors(answer, [
          `${wantArc ? areaCoefficient : arcCoefficient}π cm${wantArc ? "" : "²"}`, // arc and area swapped
          `${chosen.mul(rat(2))}π cm${wantArc ? "" : "²"}`,
          `${chosen.div(rat(2))}π cm${wantArc ? "" : "²"}`,
          `${thetaOverPi}π cm${wantArc ? "" : "²"}`, // forgot the radius
          `${rat(r)}π cm${wantArc ? "" : "²"}`,
        ]),
        explanation:
          wantArc
            ? `s = rθ = ${r} × ${thetaOverPi}π = ${answer}. These formulae only work in radians — ` +
              `in degrees you would need the θ/360 fraction instead.`
            : `A = ½r²θ = ½ × ${r}² × ${thetaOverPi}π = ${answer}. The angle must be in radians.`,
        check: () => {
          const arc = r * theta;
          const area = 0.5 * r * r * theta;
          if (Math.abs(area / arc - r / 2) > 1e-9) return `area/arc should be r/2`;
          const expected = (wantArc ? arc : area) / Math.PI;
          return Math.abs(expected - chosen.toNumber()) < 1e-9 ? null : `π coefficient mismatch`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.trig-identity",
    topic: "trigonometry",
    subtopic: "trig-identities",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    /* Five Pythagorean triples, each acute or obtuse. */
    variants: 10,
    build: (rng) => {
      /* Pythagorean triples, so sin and cos are both exact fractions. */
      const triples: Record<number, number> = { 5: 3, 13: 5, 25: 7, 17: 8, 29: 20 };
      const hyp = rng.pick([5, 13, 25, 17, 29]);
      const opp = triples[hyp];
      const adj = Math.round(Math.sqrt(hyp * hyp - opp * opp));

      const acute = rng.bool();
      const cos = acute ? adj / hyp : -adj / hyp;
      const answer = Rational.of(acute ? adj : -adj, hyp).toString();

      return {
        prompt:
          `sin θ = ${Rational.of(opp, hyp)} and θ is ${acute ? "acute" : "obtuse"}. ` +
          `Find the exact value of cos θ.`,
        answer,
        distractors: pickDistractors(answer, [
          Rational.of(acute ? -adj : adj, hyp).toString(), // wrong quadrant
          Rational.of(opp, hyp).toString(),
          Rational.of(hyp, adj).toString(),
          Rational.of(adj, opp).toString(),
        ]),
        explanation:
          `sin²θ + cos²θ = 1, so cos²θ = 1 − (${opp}/${hyp})² = ${adj * adj}/${hyp * hyp}, giving cos θ = ±${adj}/${hyp}. ` +
          `θ is ${acute ? "acute, so cosine is positive" : "obtuse, so cosine is negative"}: ${answer}. ` +
          `The identity gives the size; the quadrant gives the sign.`,
        check: () => {
          const sin = opp / hyp;
          return Math.abs(sin * sin + cos * cos - 1) < 1e-9
            ? null
            : `sin²+cos² = ${sin * sin + cos * cos}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.counterexample",
    topic: "proof",
    subtopic: "counterexample",
    curriculumLevel: "YEAR_12",
    difficulty: 4,
    /* Hand-written, because a counterexample question cannot be
       parameterised — the whole content is the claim and why it fails. */
    variants: 6,
    build: (rng) => {
      const claims = [
        {
          claim: "If n is prime then n is odd.",
          answer: "n = 2",
          why: "2 is prime and even.",
          wrong: ["n = 9", "n = 1", "n = 15"],
        },
        {
          claim: "n² > n for every integer n.",
          answer: "n = 1",
          why: "1² = 1, which is not greater than 1.",
          wrong: ["n = 2", "n = −3", "n = 10"],
        },
        {
          claim: "If n² is even then n is even, so n³ is even for all odd n.",
          answer: "n = 3",
          why: "3³ = 27, which is odd.",
          wrong: ["n = 2", "n = 4", "n = 0"],
        },
        {
          claim: "The sum of two irrational numbers is irrational.",
          answer: "√2 and −√2",
          why: "Their sum is 0, which is rational.",
          wrong: ["√2 and √3", "π and e", "√2 and 1"],
        },
        {
          claim: "Every number of the form n² + n + 41 is prime.",
          answer: "n = 41",
          why: "41² + 41 + 41 = 41 × 43, which is not prime.",
          wrong: ["n = 1", "n = 10", "n = 40"],
        },
        {
          claim: "If a > b then a² > b².",
          answer: "a = 1, b = −2",
          why: "1 > −2 but 1 is not greater than 4.",
          wrong: ["a = 3, b = 2", "a = 0, b = −1", "a = 5, b = 4"],
        },
      ];

      const chosen = rng.pick(claims);

      return {
        prompt: `Disprove this statement by counterexample: "${chosen.claim}"`,
        answer: chosen.answer,
        distractors: pickDistractors(chosen.answer, chosen.wrong),
        explanation:
          `A single counterexample disproves a universal claim. Take ${chosen.answer}: ${chosen.why} ` +
          `Every other candidate satisfies the statement, so it proves nothing.`,
      };
    },
  }),

  generator({
    key: "alevel.pure.partial-fractions",
    topic: "algebra",
    subtopic: "partial-fractions",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 20,
    build: (rng) => {
      const p = rng.nonZero(-5, 5);
      let q = rng.nonZero(-5, 5);
      if (q === p) q = p + 1;
      const A = rng.nonZero(-6, 6);
      const B = rng.nonZero(-6, 6);

      /* A/(x+p) + B/(x+q) = (numerator)/(x+p)(x+q) */
      const numLinear = A + B;
      const numConst = A * q + B * p;
      const answer = `A = ${A}, B = ${B}`;

      return {
        prompt:
          `Express ${poly([numLinear, numConst])} over ${bracket(1, p)}${bracket(1, q)} in partial fractions ` +
          `A/(x ${p >= 0 ? "+" : "−"} ${Math.abs(p)}) + B/(x ${q >= 0 ? "+" : "−"} ${Math.abs(q)}). Find A and B.`,
        answer,
        distractors: pickDistractors(answer, [
          `A = ${B}, B = ${A}`, // right values, swapped
          `A = ${-A}, B = ${-B}`,
          `A = ${A}, B = ${-B}`,
          `A = ${numLinear}, B = ${numConst}`,
        ]),
        explanation:
          `Multiply through: ${poly([numLinear, numConst])} = A(x ${q >= 0 ? "+" : "−"} ${Math.abs(q)}) + B(x ${p >= 0 ? "+" : "−"} ${Math.abs(p)}). ` +
          `Substituting x = ${-p} kills the A term and gives B = ${B}; x = ${-q} gives A = ${A}. ` +
          `Choosing those two values is what makes this quick.`,
        check: () => {
          for (const x of [0, 1, 4]) {
            if (x === -p || x === -q) continue;
            const left = (numLinear * x + numConst) / ((x + p) * (x + q));
            const right = A / (x + p) + B / (x + q);
            if (Math.abs(left - right) > 1e-9) return `forms disagree at x = ${x}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.recurrence",
    topic: "sequences",
    subtopic: "recurrence",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /* Integer multiplier, so every term is a whole number and the iteration
         can be done on paper. A ratio of ½ makes u₅ a four-decimal answer and
         the question becomes arithmetic practice with a keypad. */
      const a1 = rng.nonZero(-8, 12);
      const m = rng.pick([2, 3, -2, -1]);
      const c = rng.nonZero(-9, 9);
      const n = rng.int(4, 6);

      const terms = [a1];
      for (let i = 1; i < n; i++) terms.push(m * terms[i - 1] + c);
      const answer = String(terms[n - 1]);

      return {
        prompt:
          `A sequence is defined by u₁ = ${a1} and u${sub("n+1")} = ${m}u${sub("n")} ${c >= 0 ? "+" : "−"} ${Math.abs(c)}. ` +
          `Find u${sub(String(n))}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(terms[n - 2]), // one term short
          String(m * terms[n - 1] + c), // one term too far
          String(a1 + (n - 1) * c), // treated it as arithmetic
          String(a1 * Math.pow(m, n - 1)), // ignored the constant
          String(terms[n - 1] + c),
        ]),
        explanation:
          `Work forwards one term at a time: ${terms.map((t, i) => `u${sub(String(i + 1))} = ${t}`).join(", ")}. ` +
          `So u${sub(String(n))} = ${answer}. There is no shortcut formula here — a recurrence has to be iterated.`,
        check: () => {
          let value = a1;
          for (let i = 1; i < n; i++) value = m * value + c;
          return Math.abs(value - terms[n - 1]) < 1e-9 ? null : `recurrence does not reproduce`;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.modulus",
    topic: "functions",
    subtopic: "modulus",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 20,
    build: (rng) => {
      const a = rng.int(2, 6);
      const b = rng.nonZero(-9, 9);
      const c = rng.int(2, 18);

      /* |ax + b| = c has two solutions when c > 0. */
      const x1 = rat(c - b, a);
      const x2 = rat(-c - b, a);
      const roots = [x1, x2].sort((p, q) => p.compare(q));
      const answer = solutions("x", roots.map((r) => r.toString()));

      return {
        prompt: `Solve |${poly([a, b])}| = ${c}.`,
        answer,
        distractors: pickDistractors(answer, [
          solutions("x", [x1.toString()]), // only the positive case
          solutions("x", [x1.toString(), rat(c + b, a).toString()]),
          solutions("x", roots.map((r) => r.neg().toString())),
          solutions("x", [rat(c, a).toString(), rat(-c, a).toString()]),
        ]),
        explanation:
          `The modulus removes sign information, so ${poly([a, b])} = ${c} OR ${poly([a, b])} = ${-c}. ` +
          `Solving both gives ${answer}. Only handling the positive case loses one root every time.`,
        check: () => {
          for (const r of roots) {
            const value = Math.abs(a * r.toNumber() + b);
            if (Math.abs(value - c) > 1e-9) return `x = ${r} gives |${value}|, expected ${c}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.parametric-cartesian",
    topic: "parametric",
    subtopic: "cartesian-form",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 18,
    build: (rng) => {
      const a = rng.int(1, 5);
      const b = rng.nonZero(-6, 6);
      const c = rng.int(1, 5);
      const d = rng.nonZero(-6, 6);

      /* x = at + b, y = ct + d  →  t = (x − b)/a  →  y = c(x − b)/a + d */
      const gradient = rat(c, a);
      const intercept = rat(d).sub(gradient.mul(rat(b)));
      const answer = `y = ${gradient}x ${intercept.sign >= 0 ? "+" : "−"} ${intercept.abs()}`;

      return {
        prompt:
          `A curve is given parametrically by x = ${poly([a, b], "t")} and y = ${poly([c, d], "t")}. ` +
          `Find its Cartesian equation.`,
        answer,
        distractors: pickDistractors(answer, [
          `y = ${rat(a, c)}x ${intercept.sign >= 0 ? "+" : "−"} ${intercept.abs()}`, // gradient inverted
          `y = ${gradient}x ${intercept.sign >= 0 ? "−" : "+"} ${intercept.abs()}`,
          `y = ${gradient}x ${d >= 0 ? "+" : "−"} ${Math.abs(d)}`, // forgot to substitute b
          `y = ${poly([c, d])}`,
        ]),
        explanation:
          `Rearrange the x equation for t: t = (x ${b >= 0 ? "−" : "+"} ${Math.abs(b)})/${a}. ` +
          `Substitute into y: y = ${c}(x ${b >= 0 ? "−" : "+"} ${Math.abs(b)})/${a} ${d >= 0 ? "+" : "−"} ${Math.abs(d)} = ${answer}. ` +
          `Eliminating the parameter means substituting, not just dividing the two equations.`,
        check: () => {
          for (const t of [-2, 0, 3]) {
            const x = a * t + b;
            const y = c * t + d;
            const predicted = gradient.toNumber() * x + intercept.toNumber();
            if (Math.abs(predicted - y) > 1e-9) return `Cartesian form fails at t = ${t}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.pure.domain-range",
    topic: "functions",
    subtopic: "domain-range",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      const a = rng.int(1, 4);
      const h = rng.nonZero(-6, 6);
      const k = rng.nonZero(-10, 10);
      /* f(x) = a(x − h)² + k has range y ≥ k for a > 0. */
      const answer = `f(x) ≥ ${k}`;

      return {
        prompt:
          `f(x) = ${a}(x ${h >= 0 ? "−" : "+"} ${Math.abs(h)})² ${k >= 0 ? "+" : "−"} ${Math.abs(k)}, ` +
          `with domain all real x. Find the range.`,
        answer,
        distractors: pickDistractors(answer, [
          `f(x) ≥ ${h}`, // gave the x of the vertex
          `f(x) ≤ ${k}`,
          `f(x) ≥ 0`,
          `f(x) ≥ ${k + a}`,
        ]),
        explanation:
          `A squared term is never negative, so ${a}(x ${h >= 0 ? "−" : "+"} ${Math.abs(h)})² ≥ 0 and the smallest ` +
          `value of f is ${k}, reached at x = ${h}. The range is ${answer}. ` +
          `The vertex is (${h}, ${k}) — the range uses the y-coordinate.`,
        check: () => {
          let min = Infinity;
          for (let x = h - 20; x <= h + 20; x += 0.25) {
            min = Math.min(min, a * Math.pow(x - h, 2) + k);
          }
          return Math.abs(min - k) < 1e-9 ? null : `minimum found at ${min}, expected ${k}`;
        },
      };
    },
  }),
];

/** Binomial coefficient, computed multiplicatively so it stays exact. */
function choose(n: number, k: number): number {
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

/** Subscript digits, for u_n and log bases. */
function sub(text: string | number): string {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "+": "₊",
    n: "ₙ",
  };
  return String(text)
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

/** Evaluate the exact-trig strings, so the table can be verified rather than trusted. */
function evaluateSurdFraction(text: string): number | null {
  if (text === "0") return 0;
  if (text === "1") return 1;
  const match = /^(?:(\d+)|√(\d+))(?:\/(\d+))?$/.exec(text);
  if (!match) return null;
  const top = match[1] ? Number(match[1]) : Math.sqrt(Number(match[2]));
  const bottom = match[3] ? Number(match[3]) : 1;
  return top / bottom;
}
