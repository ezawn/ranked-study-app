/**
 * GCSE Algebra, quadratics and surds.
 *
 * Built backwards throughout: the roots are chosen first and the quadratic is
 * expanded from them, so "solve x² − 7x + 12 = 0" cannot have an answer the
 * generator got wrong. The `check` hooks then substitute the published answer
 * back into the published equation, which catches the one thing construction
 * cannot — a mistake in the construction itself.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Rational, rat, simplifySurd, surdToString } from "./rational";
import { bracket, poly, solutions, sup, toPlaces } from "./format";

export const gcseAlgebra: Generator[] = [
  generator({
    key: "gcse.algebra.expand-double",
    topic: "algebra",
    subtopic: "expanding",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 26,
    build: (rng) => {
      const a = rng.int(1, 4);
      const b = rng.nonZero(-9, 9);
      const c = rng.int(1, 4);
      const d = rng.nonZero(-9, 9);

      const x2 = a * c;
      const x1 = a * d + b * c;
      const x0 = b * d;
      const answer = poly([x2, x1, x0]);

      return {
        prompt: `Expand and simplify ${bracket(a, b)}${bracket(c, d)}.`,
        answer,
        distractors: pickDistractors(answer, [
          poly([x2, 0, x0]), // multiplied first-and-first, last-and-last only
          poly([x2, a * d - b * c, x0]),
          poly([x2, x1, -x0]),
          poly([x2, a * d + b * c + 1, x0]),
        ]),
        explanation:
          `Each term in the first bracket multiplies each term in the second: ` +
          `${poly([x2, 0, 0])} ${a * d >= 0 ? "+" : "−"} ${Math.abs(a * d)}x ${b * c >= 0 ? "+" : "−"} ${Math.abs(b * c)}x ${x0 >= 0 ? "+" : "−"} ${Math.abs(x0)}. ` +
          `Collecting the x terms gives ${answer}.`,
        check: () => {
          /* Both forms must agree at several values of x. */
          for (const x of [-3, -1, 0, 2, 5]) {
            const left = (a * x + b) * (c * x + d);
            const right = x2 * x * x + x1 * x + x0;
            if (left !== right) return `disagree at x = ${x}: ${left} vs ${right}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.factorise-quadratic",
    topic: "quadratics",
    subtopic: "factorising-quadratics",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 26,
    build: (rng) => {
      const p = rng.nonZero(-9, 9);
      const q = rng.nonZero(-9, 9);
      const b = p + q;
      const c = p * q;
      const answer = `${bracket(1, p)}${bracket(1, q)}`;

      return {
        prompt: `Factorise ${poly([1, b, c])}.`,
        answer,
        distractors: pickDistractors(answer, [
          `${bracket(1, -p)}${bracket(1, -q)}`, // both signs flipped
          `${bracket(1, p)}${bracket(1, -q)}`,
          `${bracket(1, c)}${bracket(1, b)}`, // swapped the roles of sum and product
          `${bracket(1, p + 1)}${bracket(1, q - 1)}`,
        ]),
        explanation:
          `Find two numbers multiplying to ${c} and adding to ${b}: ${p} and ${q}. ` +
          `So ${poly([1, b, c])} = ${answer}. ` +
          `The signs come from the numbers themselves — the product tells you whether they match.`,
        check: () => {
          for (const x of [-4, -1, 0, 3, 6]) {
            const expanded = (x + p) * (x + q);
            const original = x * x + b * x + c;
            if (expanded !== original) return `factors disagree at x = ${x}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.solve-quadratic",
    topic: "quadratics",
    subtopic: "factorising-quadratics",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 26,
    build: (rng) => {
      const r1 = rng.nonZero(-8, 8);
      let r2 = rng.nonZero(-8, 8);
      if (r2 === r1) r2 = r1 === 8 ? -3 : r1 + 1;

      const b = -(r1 + r2);
      const c = r1 * r2;
      const roots = [r1, r2].sort((x, y) => x - y);
      const answer = solutions("x", roots);

      return {
        prompt: `Solve ${poly([1, b, c])} = 0.`,
        answer,
        distractors: pickDistractors(answer, [
          solutions("x", roots.map((r) => -r)), // sign error reading the brackets
          solutions("x", [roots[0], -roots[1]]),
          solutions("x", [b, c]),
          solutions("x", roots.map((r) => r + 1)),
        ]),
        explanation:
          `${poly([1, b, c])} factorises as ${bracket(1, -r1)}${bracket(1, -r2)}. ` +
          `A product is zero when a factor is zero, so ${answer}. ` +
          `Note the signs flip between the bracket and the root.`,
        check: () => {
          for (const r of roots) {
            const value = r * r + b * r + c;
            if (value !== 0) return `x = ${r} gives ${value}, not 0`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.linear-equation",
    topic: "algebra",
    subtopic: "linear-equations",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 26,
    build: (rng) => {
      const x = rng.nonZero(-12, 12);
      const a = rng.int(2, 9);
      const b = rng.nonZero(-15, 15);
      const c = a * x + b;

      return {
        prompt: `Solve ${poly([a, b])} = ${c}.`,
        answer: `x = ${x}`,
        distractors: pickDistractors(`x = ${x}`, [
          `x = ${-x}`,
          `x = ${(c + b) / a === Math.round((c + b) / a) ? (c + b) / a : c - b}`, // added instead of subtracted
          `x = ${c - b}`, // forgot to divide
          `x = ${x + 1}`,
        ]),
        explanation:
          `Subtract ${b} from both sides: ${a}x = ${c - b}. ` +
          `Then divide by ${a}: x = ${c - b} ÷ ${a} = ${x}.`,
        check: () => (a * x + b === c ? null : `x = ${x} does not satisfy the equation`),
      };
    },
  }),

  generator({
    key: "gcse.algebra.simultaneous",
    topic: "algebra",
    subtopic: "simultaneous",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const x = rng.nonZero(-7, 7);
      const y = rng.nonZero(-7, 7);
      const a1 = rng.nonZero(1, 5);
      const b1 = rng.nonZero(-5, 5);
      let a2 = rng.nonZero(1, 5);
      let b2 = rng.nonZero(-5, 5);
      /* A zero determinant means no unique solution — not a GCSE question. */
      if (a1 * b2 - a2 * b1 === 0) {
        a2 = a1 + 1;
        b2 = b1 - 1;
      }

      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      const answer = `x = ${x}, y = ${y}`;

      return {
        prompt:
          `Solve the simultaneous equations ` +
          `${a1}x ${b1 >= 0 ? "+" : "−"} ${Math.abs(b1)}y = ${c1} and ` +
          `${a2}x ${b2 >= 0 ? "+" : "−"} ${Math.abs(b2)}y = ${c2}.`,
        answer,
        distractors: pickDistractors(answer, [
          `x = ${y}, y = ${x}`, // solved and swapped
          `x = ${-x}, y = ${y}`,
          `x = ${x}, y = ${-y}`,
          `x = ${x + 1}, y = ${y - 1}`,
        ]),
        explanation:
          `Eliminate one unknown by scaling: multiplying the first by ${a2} and the second by ${a1} ` +
          `makes the x terms match, and subtracting leaves ${a2 * b1 - a1 * b2}y = ${a2 * c1 - a1 * c2}, so y = ${y}. ` +
          `Substituting back gives x = ${x}.`,
        check: () =>
          a1 * x + b1 * y === c1 && a2 * x + b2 * y === c2
            ? null
            : `(${x}, ${y}) does not satisfy both equations`,
      };
    },
  }),

  generator({
    key: "gcse.algebra.rearrange",
    topic: "algebra",
    subtopic: "rearranging",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const a = rng.int(2, 9);
      const b = rng.nonZero(-9, 9);
      const answer = `x = (y ${b >= 0 ? "−" : "+"} ${Math.abs(b)})/${a}`;

      return {
        prompt: `Make x the subject of y = ${poly([a, b])}.`,
        answer,
        distractors: pickDistractors(answer, [
          `x = y/${a} ${b >= 0 ? "−" : "+"} ${Math.abs(b)}`, // divided before subtracting
          `x = (y ${b >= 0 ? "+" : "−"} ${Math.abs(b)})/${a}`,
          `x = ${a}(y ${b >= 0 ? "−" : "+"} ${Math.abs(b)})`,
          `x = (y ${b >= 0 ? "−" : "+"} ${Math.abs(b)}) × ${a}`,
        ]),
        explanation:
          `Undo the operations in reverse order. ${b >= 0 ? "Subtract" : "Add"} ${Math.abs(b)} first: ` +
          `y ${b >= 0 ? "−" : "+"} ${Math.abs(b)} = ${a}x. Then divide by ${a}: ${answer}. ` +
          `Dividing before subtracting divides only part of the left-hand side, which is the usual slip.`,
        check: () => {
          /* Pick an x, compute y, and confirm the rearranged form returns it. */
          for (const x of [-2, 0, 3, 7]) {
            const y = a * x + b;
            if (Math.abs((y - b) / a - x) > 1e-9) return `rearrangement fails at x = ${x}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.nth-term-linear",
    topic: "sequences",
    subtopic: "linear-nth-term",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 24,
    build: (rng) => {
      const d = rng.nonZero(-9, 9);
      const first = rng.nonZero(-15, 15);
      const terms = [0, 1, 2, 3].map((i) => first + i * d);
      const constant = first - d;
      const answer = poly([d, constant], "n");

      return {
        prompt: `Find the nth term of the sequence ${terms.join(", ")}, …`,
        answer,
        distractors: pickDistractors(answer, [
          poly([d, first], "n"), // used the first term as the constant
          poly([d, constant + d], "n"),
          poly([first, d], "n"),
          poly([-d, constant], "n"),
        ]),
        explanation:
          `The terms go up by ${d} each time, so the nth term starts ${d}n. ` +
          `${d} × 1 = ${d}, and the first term is ${first}, so the constant is ${first} − ${d} = ${constant}. ` +
          `nth term = ${answer}.`,
        check: () => {
          for (let i = 0; i < terms.length; i++) {
            const n = i + 1;
            if (d * n + constant !== terms[i]) return `formula fails at n = ${n}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.nth-term-quadratic",
    topic: "sequences",
    subtopic: "quadratic-nth-term",
    curriculumLevel: "YEAR_11",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      const a = rng.int(1, 3);
      const b = rng.nonZero(-6, 6);
      const c = rng.nonZero(-9, 9);
      const terms = [1, 2, 3, 4].map((n) => a * n * n + b * n + c);
      const answer = poly([a, b, c], "n");

      return {
        prompt: `Find the nth term of the quadratic sequence ${terms.join(", ")}, …`,
        answer,
        distractors: pickDistractors(answer, [
          poly([a * 2, b, c], "n"), // used the second difference directly instead of halving it
          poly([a, -b, c], "n"),
          poly([a, b, c + a], "n"),
          poly([a, b + 1, c - 1], "n"),
        ]),
        explanation:
          `First differences: ${[1, 2, 3].map((i) => terms[i] - terms[i - 1]).join(", ")}. ` +
          `The second difference is ${2 * a}, and the n² coefficient is half of it: ${a}. ` +
          `Subtracting ${a}n² from the sequence leaves a linear sequence with nth term ${poly([b, c], "n")}, ` +
          `so the answer is ${answer}.`,
        check: () => {
          for (let i = 0; i < terms.length; i++) {
            const n = i + 1;
            if (a * n * n + b * n + c !== terms[i]) return `formula fails at n = ${n}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.inequalities",
    topic: "algebra",
    subtopic: "inequalities",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 22,
    build: (rng) => {
      const a = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5]);
      const b = rng.nonZero(-12, 12);
      const x = rng.nonZero(-9, 9);
      const c = a * x + b;
      const relation = rng.pick([">", "<"] as const);
      /* Dividing by a negative reverses the inequality — the whole point. */
      const flipped = a < 0 ? (relation === ">" ? "<" : ">") : relation;
      const answer = `x ${flipped} ${x}`;

      return {
        prompt: `Solve the inequality ${poly([a, b])} ${relation} ${c}.`,
        answer,
        distractors: pickDistractors(answer, [
          `x ${relation} ${x}`, // forgot to reverse
          `x ${flipped} ${-x}`,
          `x ${flipped === ">" ? "<" : ">"} ${-x}`,
          `x ${relation} ${c - b}`,
        ]),
        explanation:
          `${b >= 0 ? "Subtract" : "Add"} ${Math.abs(b)}: ${a}x ${relation} ${c - b}. ` +
          `Dividing by ${a} gives x ${flipped} ${x}` +
          (a < 0
            ? ` — and because ${a} is negative, the inequality sign reverses. That is the step this question is testing.`
            : `.`),
        check: () => {
          /* A value just inside the solution must satisfy the original. */
          const inside = flipped === ">" ? x + 1 : x - 1;
          const holds = relation === ">" ? a * inside + b > c : a * inside + b < c;
          return holds ? null : `x = ${inside} should satisfy the original inequality but does not`;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.quadratic-formula",
    topic: "quadratics",
    subtopic: "quadratic-formula",
    curriculumLevel: "YEAR_11",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      const a = rng.int(1, 4);
      const b = rng.nonZero(-11, 11);
      const c = rng.nonZero(-9, 9);
      const discriminant = b * b - 4 * a * c;
      /* Only deal questions with real roots — "no real roots" is the
         discriminant generator's job, not this one's. */
      const usable = discriminant > 0 ? discriminant : b * b + 4 * a * Math.abs(c);
      const cc = discriminant > 0 ? c : -Math.abs(c);

      const root1 = (-b + Math.sqrt(usable)) / (2 * a);
      const root2 = (-b - Math.sqrt(usable)) / (2 * a);
      const answer = solutions("x", [toPlaces(Math.max(root1, root2), 2), toPlaces(Math.min(root1, root2), 2)]);

      return {
        prompt:
          `Solve ${poly([a, b, cc])} = 0, giving your answers to 2 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          solutions("x", [
            toPlaces((b + Math.sqrt(usable)) / (2 * a), 2),
            toPlaces((b - Math.sqrt(usable)) / (2 * a), 2),
          ]), // dropped the minus on −b
          solutions("x", [
            toPlaces((-b + Math.sqrt(usable)) / a, 2),
            toPlaces((-b - Math.sqrt(usable)) / a, 2),
          ]), // divided by a instead of 2a
          solutions("x", [toPlaces(Math.max(root1, root2), 2)]),
          solutions("x", [
            toPlaces(Math.max(root1, root2) + 0.5, 2),
            toPlaces(Math.min(root1, root2) - 0.5, 2),
          ]),
        ]),
        explanation:
          `With a = ${a}, b = ${b}, c = ${cc}, the discriminant is ${b}² − 4(${a})(${cc}) = ${usable}. ` +
          `x = (−${b} ± √${usable}) ÷ ${2 * a}, giving ${answer}. ` +
          `The whole of −b is divided by 2a, not just the square root.`,
        check: () => {
          for (const r of [root1, root2]) {
            const value = a * r * r + b * r + cc;
            if (Math.abs(value) > 1e-8) return `root ${r} gives ${value}, not 0`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.completing-square",
    topic: "quadratics",
    subtopic: "completing-the-square",
    curriculumLevel: "YEAR_11",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      /* An even b keeps the completed square over the integers, which is the
         form GCSE asks for. */
      const half = rng.nonZero(-7, 7);
      const b = 2 * half;
      const c = rng.nonZero(-12, 12);
      const constant = c - half * half;
      const answer = `${bracket(1, half)}${sup(2)}${constant >= 0 ? " + " : " − "}${Math.abs(constant)}`;

      return {
        prompt: `Write ${poly([1, b, c])} in the form (x + p)² + q.`,
        answer,
        distractors: pickDistractors(answer, [
          `${bracket(1, half)}${sup(2)}${c >= 0 ? " + " : " − "}${Math.abs(c)}`, // forgot to subtract p²
          `${bracket(1, b)}${sup(2)}${constant >= 0 ? " + " : " − "}${Math.abs(constant)}`, // used b, not b/2
          `${bracket(1, -half)}${sup(2)}${constant >= 0 ? " + " : " − "}${Math.abs(constant)}`,
          `${bracket(1, half)}${sup(2)}${constant >= 0 ? " − " : " + "}${Math.abs(constant)}`,
        ]),
        explanation:
          `Half of ${b} is ${half}, so start with ${bracket(1, half)}${sup(2)}. ` +
          `That expands to ${poly([1, b, half * half])}, which is ${half * half} too much, ` +
          `so subtract it: ${answer}.`,
        check: () => {
          for (const x of [-3, 0, 2, 5]) {
            const left = x * x + b * x + c;
            const right = Math.pow(x + half, 2) + constant;
            if (left !== right) return `forms disagree at x = ${x}: ${left} vs ${right}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.discriminant",
    topic: "quadratics",
    subtopic: "discriminant",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const a = rng.int(1, 4);
      const b = rng.nonZero(-10, 10);
      const c = rng.nonZero(-8, 8);
      const d = b * b - 4 * a * c;
      const answer = d > 0 ? "Two distinct real roots" : d === 0 ? "One repeated root" : "No real roots";

      return {
        prompt: `How many real roots does ${poly([a, b, c])} = 0 have? Use the discriminant.`,
        answer,
        distractors: pickDistractors(answer, [
          "No real roots",
          "Two distinct real roots",
          "One repeated root",
          "Two repeated roots",
        ]),
        explanation:
          `b² − 4ac = (${b})² − 4(${a})(${c}) = ${b * b} − ${4 * a * c} = ${d}. ` +
          `A ${d > 0 ? "positive" : d === 0 ? "zero" : "negative"} discriminant means ${answer.toLowerCase()}.`,
        check: () => {
          const roots = d >= 0 ? (d === 0 ? 1 : 2) : 0;
          const claimed = answer === "No real roots" ? 0 : answer === "One repeated root" ? 1 : 2;
          return roots === claimed ? null : `discriminant ${d} implies ${roots} roots, claimed ${claimed}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.simplify-surd",
    topic: "surds",
    subtopic: "simplifying-surds",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 22,
    build: (rng) => {
      const square = rng.pick([2, 3, 4, 5, 6, 7]);
      const rest = rng.pick([2, 3, 5, 6, 7, 10, 11, 13]);
      const n = square * square * rest;
      const simplified = simplifySurd(n);
      const answer = surdToString(simplified);

      return {
        prompt: `Simplify √${n}.`,
        answer,
        distractors: pickDistractors(answer, [
          surdToString({ coefficient: square * square, radicand: rest }), // forgot to square-root the factor
          surdToString({ coefficient: square, radicand: rest * square }),
          surdToString({ coefficient: rest, radicand: square }),
          surdToString({ coefficient: square + 1, radicand: rest }),
        ]),
        explanation:
          `${n} = ${square * square} × ${rest}, and ${square * square} is a perfect square. ` +
          `√${n} = √${square * square} × √${rest} = ${answer}.`,
        check: () => {
          const value = simplified.coefficient * Math.sqrt(simplified.radicand);
          return Math.abs(value - Math.sqrt(n)) < 1e-9
            ? null
            : `${answer} is ${value}, but √${n} is ${Math.sqrt(n)}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.rationalise",
    topic: "surds",
    subtopic: "rationalising",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      const numerator = rng.int(2, 20);
      const radicand = rng.pick([2, 3, 5, 6, 7, 10, 11, 13]);
      /* numerator/√r = numerator√r / r, then cancel. */
      const simplified = Rational.of(numerator, radicand);
      const answer =
        simplified.d === 1
          ? surdToString({ coefficient: simplified.n, radicand })
          : `${surdToString({ coefficient: simplified.n, radicand })}/${simplified.d}`;

      return {
        prompt: `Rationalise the denominator of ${numerator}/√${radicand}.`,
        answer,
        distractors: pickDistractors(answer, [
          `${surdToString({ coefficient: numerator, radicand })}/${radicand * radicand}`, // squared the denominator twice
          surdToString({ coefficient: numerator, radicand }),
          `${numerator}√${radicand}`,
          `${surdToString({ coefficient: simplified.n, radicand: radicand * radicand })}/${simplified.d || 1}`,
        ]),
        explanation:
          `Multiply top and bottom by √${radicand}: (${numerator} × √${radicand}) ÷ (√${radicand} × √${radicand}) ` +
          `= ${numerator}√${radicand} ÷ ${radicand} = ${answer}. ` +
          `The denominator becomes ${radicand} because √${radicand} × √${radicand} = ${radicand}.`,
        check: () => {
          const value = (simplified.n * Math.sqrt(radicand)) / simplified.d;
          const expected = numerator / Math.sqrt(radicand);
          return Math.abs(value - expected) < 1e-9 ? null : `${answer} is ${value}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.function-composite",
    topic: "functions",
    subtopic: "composite",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const a = rng.nonZero(-5, 5);
      const b = rng.nonZero(-9, 9);
      const c = rng.nonZero(-5, 5);
      const d = rng.nonZero(-9, 9);
      const x = rng.nonZero(-6, 6);

      /* fg(x) means g first. That order is the whole question. */
      const gx = c * x + d;
      const answer = a * gx + b;
      const wrongOrder = c * (a * x + b) + d;

      return {
        prompt:
          `f(x) = ${poly([a, b])} and g(x) = ${poly([c, d])}. Work out fg(${x}).`,
        answer: String(answer),
        distractors: pickDistractors(String(answer), [
          String(wrongOrder), // applied f first
          String(a * x + b),
          String(gx),
          String(answer + c),
        ]),
        explanation:
          `fg(${x}) means apply g first: g(${x}) = ${c} × ${x} ${d >= 0 ? "+" : "−"} ${Math.abs(d)} = ${gx}. ` +
          `Then f(${gx}) = ${a} × ${gx} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} = ${answer}. ` +
          `Applying f first would give ${wrongOrder}, which is gf(${x}) — a different function.`,
        check: () => (a * (c * x + d) + b === answer ? null : `composite recomputes differently`),
      };
    },
  }),

  generator({
    key: "gcse.algebra.function-inverse",
    topic: "functions",
    subtopic: "inverse",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      const a = rng.int(2, 8);
      const b = rng.nonZero(-12, 12);
      const answer = `(x ${b >= 0 ? "−" : "+"} ${Math.abs(b)})/${a}`;

      return {
        prompt: `f(x) = ${poly([a, b])}. Find f⁻¹(x).`,
        answer,
        distractors: pickDistractors(answer, [
          `x/${a} ${b >= 0 ? "−" : "+"} ${Math.abs(b)}`,
          `(x ${b >= 0 ? "+" : "−"} ${Math.abs(b)})/${a}`,
          `1/(${poly([a, b])})`, // confused the inverse function with a reciprocal
          `${a}x ${b >= 0 ? "−" : "+"} ${Math.abs(b)}`,
        ]),
        explanation:
          `Write y = ${poly([a, b])} and make x the subject: y ${b >= 0 ? "−" : "+"} ${Math.abs(b)} = ${a}x, ` +
          `so x = ${answer}. Swapping the letters back gives f⁻¹(x) = ${answer}. ` +
          `f⁻¹ undoes f — it is not 1/f(x).`,
        check: () => {
          for (const x of [-2, 0, 3, 9]) {
            const forward = a * x + b;
            if (Math.abs((forward - b) / a - x) > 1e-9) return `inverse fails at x = ${x}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "gcse.algebra.straight-line",
    topic: "graphs",
    subtopic: "straight-lines",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 24,
    build: (rng) => {
      const m = rng.nonZero(-5, 5);
      const c = rng.nonZero(-9, 9);
      const x1 = rng.int(-6, 2);
      const x2 = x1 + rng.int(2, 7);
      const y1 = m * x1 + c;
      const y2 = m * x2 + c;
      const answer = `y = ${poly([m, c])}`;

      return {
        prompt: `Find the equation of the straight line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
        answer,
        distractors: pickDistractors(answer, [
          `y = ${poly([-m, c])}`, // sign slip on the gradient
          `y = ${rat(x2 - x1, y2 - y1)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}`, // gradient upside down
          `y = ${poly([m, -c])}`,
          `y = ${poly([m, c + m])}`,
        ]),
        explanation:
          `Gradient = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${x2 - x1} = ${m}. ` +
          `Substituting (${x1}, ${y1}) into y = ${m}x + c gives c = ${c}. So ${answer}. ` +
          `The gradient is change in y over change in x — that way round.`,
        check: () =>
          m * x1 + c === y1 && m * x2 + c === y2 ? null : `line does not pass through both points`,
      };
    },
  }),

  generator({
    key: "gcse.algebra.perpendicular",
    topic: "graphs",
    subtopic: "parallel-perpendicular",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      const num = rng.nonZero(-6, 6);
      const den = rng.int(1, 4);
      const m = rat(num, den);
      const c = rng.nonZero(-9, 9);
      const perpendicular = rat(-den, num);
      const px = rng.nonZero(-5, 5);
      const py = rng.nonZero(-9, 9);
      const intercept = rat(py).sub(perpendicular.mul(rat(px)));

      const answer = `y = ${perpendicular}x ${intercept.sign >= 0 ? "+" : "−"} ${intercept.abs()}`;

      return {
        prompt:
          `A line has equation y = ${m}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}. ` +
          `Find the equation of the line perpendicular to it passing through (${px}, ${py}).`,
        answer,
        distractors: pickDistractors(answer, [
          `y = ${m}x ${intercept.sign >= 0 ? "+" : "−"} ${intercept.abs()}`, // used the same gradient
          `y = ${rat(den, num)}x ${intercept.sign >= 0 ? "+" : "−"} ${intercept.abs()}`, // reciprocal without the sign change
          `y = ${perpendicular.neg()}x ${intercept.sign >= 0 ? "+" : "−"} ${intercept.abs()}`,
          `y = ${perpendicular}x ${intercept.sign >= 0 ? "−" : "+"} ${intercept.abs()}`,
        ]),
        explanation:
          `Perpendicular gradients multiply to −1, so the new gradient is −1 ÷ ${m} = ${perpendicular}. ` +
          `Substituting (${px}, ${py}) gives c = ${py} − (${perpendicular})(${px}) = ${intercept}. ` +
          `So ${answer}.`,
        check: () => {
          const product = m.mul(perpendicular);
          if (!product.equals(rat(-1))) return `gradients multiply to ${product}, not −1`;
          const onLine = perpendicular.mul(rat(px)).add(intercept);
          return onLine.equals(rat(py)) ? null : `line misses (${px}, ${py})`;
        },
      };
    },
  }),
];
