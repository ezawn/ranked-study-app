/**
 * Generators written to close subtopic gaps.
 *
 * The taxonomy is a filter vocabulary, and a subtopic a student can select but
 * which returns nothing is worse than one that does not appear — so these exist
 * to make the topic tree honest. Smaller runs than the core generators, because
 * breadth is the point here rather than depth.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { rat } from "./rational";
import { bracket, point, poly, sup, toPlaces } from "./format";

function differentiate(coefficients: readonly number[]): number[] {
  const degree = coefficients.length - 1;
  const out: number[] = [];
  for (let i = 0; i < degree; i++) out.push(coefficients[i] * (degree - i));
  return out.length ? out : [0];
}

function evaluate(coefficients: readonly number[], x: number): number {
  return coefficients.reduce((acc, c) => acc * x + c, 0);
}

function choose(n: number, k: number): number {
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

export const coverage: Generator[] = [
  generator({
    key: "gcse.cover.factorise-linear",
    topic: "algebra",
    subtopic: "factorising",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 18,
    build: (rng) => {
      const common = rng.int(2, 9);
      const p = rng.nonZero(-8, 8);
      const q = rng.nonZero(-8, 8);
      if (p === q) return build(common, p, q + 1);
      return build(common, p, q);

      function build(k: number, first: number, second: number) {
        const answer = `${k}(${poly([first, second])})`;
        return {
          prompt: `Factorise fully ${poly([k * first, k * second])}.`,
          answer,
          distractors: pickDistractors(answer, [
            `${k}(${poly([first * k, second])})`, // only partly divided out
            `${poly([first, second])}`, // dropped the common factor
            `${k * first}(${poly([1, second])})`,
            `${k}(${poly([first, -second])})`,
            `${Math.max(2, Math.floor(k / 2))}(${poly([first * 2, second * 2])})`,
          ]),
          explanation:
            `${k} divides both ${k * first} and ${k * second}, and nothing larger does. ` +
            `Taking it outside: ${answer}. "Fully" means the bracket must have no common factor left.`,
          check: () => {
            for (const x of [-2, 0, 3]) {
              const left = k * first * x + k * second;
              const right = k * (first * x + second);
              if (left !== right) return `forms disagree at x = ${x}`;
            }
            return null;
          },
        };
      }
    },
  }),

  generator({
    key: "gcse.cover.quadratic-graph",
    topic: "quadratics",
    subtopic: "quadratic-graphs",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 18,
    build: (rng) => {
      const half = rng.nonZero(-6, 6);
      const constant = rng.nonZero(-12, 12);
      const b = 2 * half;
      const c = half * half + constant;
      const answer = point(-half, constant);

      return {
        prompt: `Find the coordinates of the turning point of y = ${poly([1, b, c])}.`,
        answer,
        distractors: pickDistractors(answer, [
          point(half, constant), // sign of the x-coordinate
          point(-half, -constant),
          point(-b, c),
          point(constant, -half),
          point(-half, c),
        ]),
        explanation:
          `Completing the square: y = (x ${half >= 0 ? "+" : "−"} ${Math.abs(half)})² ` +
          `${constant >= 0 ? "+" : "−"} ${Math.abs(constant)}. ` +
          `The bracket is smallest when x = ${-half}, giving y = ${constant}, so the turning point is ${answer}. ` +
          `The x-coordinate is the opposite sign to the number inside the bracket.`,
        check: () => {
          const at = evaluate([1, b, c], -half);
          const left = evaluate([1, b, c], -half - 1);
          return Math.abs(at - constant) < 1e-9 && left > at ? null : `not the minimum`;
        },
      };
    },
  }),

  generator({
    key: "gcse.cover.direct-proportion",
    topic: "ratio",
    subtopic: "direct-proportion",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      const k = rng.int(2, 15);
      const x1 = rng.int(2, 12);
      const x2 = rng.int(2, 20);
      const y1 = k * x1 * x1;
      const y2 = k * x2 * x2;
      const answer = String(y2);

      return {
        prompt:
          `y is directly proportional to x². When x = ${x1}, y = ${y1}. Find y when x = ${x2}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(k * x2), // forgot to square
          String((y1 * x2) / x1), // treated it as proportional to x
          String(k * x2 * x2 * x2),
          String(y1 * x2),
          String(y2 + k),
        ]),
        explanation:
          `y = kx², so k = ${y1} ÷ ${x1}² = ${y1} ÷ ${x1 * x1} = ${k}. ` +
          `Then y = ${k} × ${x2}² = ${answer}. Doubling x multiplies y by four, not by two.`,
        check: () => (y2 === k * x2 * x2 ? null : `y does not recompute`),
      };
    },
  }),

  generator({
    key: "gcse.cover.ratio-fraction",
    topic: "ratio",
    subtopic: "ratio-fractions",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const p = rng.int(1, 9);
      let q = rng.int(1, 9);
      if (q === p) q = p === 9 ? 2 : p + 1;
      const answer = rat(p, p + q).toString();

      return {
        prompt:
          `A bag contains red and blue counters in the ratio ${p} : ${q}. ` +
          `What fraction of the counters are red?`,
        answer,
        distractors: pickDistractors(answer, [
          rat(p, q).toString(), // used the ratio as the fraction
          rat(q, p + q).toString(), // gave the blue fraction
          rat(p + q, p).toString(),
          rat(q, p).toString(),
          rat(p, p + q + 1).toString(),
        ]),
        explanation:
          `The ratio has ${p} + ${q} = ${p + q} parts altogether, and ${p} of them are red, ` +
          `so the fraction is ${p}/${p + q} = ${answer}. ` +
          `A ratio compares the two parts; a fraction compares one part to the whole.`,
        check: () => {
          const red = rat(p, p + q).toNumber();
          const blue = rat(q, p + q).toNumber();
          return Math.abs(red + blue - 1) < 1e-9 ? null : `fractions do not sum to 1`;
        },
      };
    },
  }),

  generator({
    key: "gcse.cover.tangent-radius",
    topic: "circle-theorems",
    subtopic: "tangent-radius",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const given = rng.int(20, 70);
      const answer = `${90 - given}°`;

      return {
        prompt:
          `A tangent touches a circle with centre O at point T. A chord TA makes an angle of ` +
          `${given}° with the tangent at T. Find the angle between the chord TA and the radius OT.`,
        answer,
        distractors: pickDistractors(answer, [
          `${given}°`,
          `${180 - given}°`,
          `${90 + given}°`,
          `${2 * given}°`,
          `${45 - given / 2}°`,
        ]),
        explanation:
          `A tangent meets a radius at 90°, so the angle between the tangent and OT is 90°. ` +
          `The chord splits that: 90 − ${given} = ${answer}. ` +
          `The tangent-radius right angle is the fact everything else here hangs off.`,
        check: () => (given + (90 - given) === 90 ? null : `angles do not sum to 90°`),
      };
    },
  }),

  generator({
    key: "gcse.cover.alternate-segment",
    topic: "circle-theorems",
    subtopic: "alternate-segment",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const given = rng.int(25, 80);
      const answer = `${given}°`;

      return {
        prompt:
          `A tangent touches a circle at T. A chord TB makes an angle of ${given}° with the tangent. ` +
          `C lies on the circle in the alternate segment. Find angle TCB.`,
        answer,
        distractors: pickDistractors(answer, [
          `${180 - given}°`,
          `${90 - given}°`,
          `${2 * given}°`,
          `${given / 2}°`,
          `${90 + given}°`,
        ]),
        explanation:
          `The alternate segment theorem: the angle between a tangent and a chord equals the angle ` +
          `in the alternate segment. So angle TCB = ${answer} — the same, not supplementary and not doubled. ` +
          `Doubling is the angle-at-the-centre theorem, which is a different configuration.`,
      };
    },
  }),

  generator({
    key: "gcse.cover.vector-path",
    topic: "vectors",
    subtopic: "vector-paths",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const m = rng.int(2, 9);
      const wantAP = rng.bool();
      const coefficient = (k: number) => (k === 1 ? "" : String(k));

      const answer = wantAP
        ? `${coefficient(m)}b − ${coefficient(m)}a`
        : `${coefficient(m - 1)}a + ${coefficient(m)}b`.replace("0a + ", "");

      return {
        prompt:
          `In triangle OAB, OA = a and OB = b. Point P satisfies OP = a + ${m}(b − a). ` +
          `Write ${wantAP ? "AP" : "OP, simplified,"} in terms of a and b.`,
        answer,
        distractors: pickDistractors(answer, [
          wantAP ? `${coefficient(m)}a − ${coefficient(m)}b` : `${coefficient(m)}a + ${coefficient(m)}b`,
          `a + ${coefficient(m)}b`,
          `b − a`, // forgot the multiplier
          `${m}(a + b)`,
          `${coefficient(m)}b + ${coefficient(m)}a`,
          `${coefficient(m + 1)}a − ${coefficient(m)}b`,
        ]),
        explanation: wantAP
          ? `AP = OP − OA = [a + ${m}(b − a)] − a = ${m}(b − a) = ${answer}. ` +
            `A vector between two points is always "destination minus origin" — getting that ` +
            `subtraction the wrong way round reverses the direction.`
          : `Expand the bracket: a + ${m}b − ${m}a = ${answer}. ` +
            `The a terms collect; the scalar multiplies everything inside the bracket, not just b.`,
      };
    },
  }),

  generator({
    key: "gcse.cover.rotation",
    topic: "transformations",
    subtopic: "rotation",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      const x = rng.nonZero(-8, 8);
      const y = rng.nonZero(-8, 8);
      const turn = rng.pick([90, 180, 270] as const);

      /* Anticlockwise about the origin. */
      const image = turn === 90 ? [-y, x] : turn === 180 ? [-x, -y] : [y, -x];
      const answer = point(image[0], image[1]);

      return {
        prompt:
          `The point ${point(x, y)} is rotated ${turn}° anticlockwise about the origin. ` +
          `Give the coordinates of its image.`,
        answer,
        distractors: pickDistractors(answer, [
          point(y, -x), // rotated the wrong way
          point(-y, -x),
          point(-x, y),
          point(x, -y),
          point(y, x),
        ]),
        explanation:
          `A ${turn}° anticlockwise rotation about the origin maps (x, y) to ` +
          `${turn === 90 ? "(−y, x)" : turn === 180 ? "(−x, −y)" : "(y, −x)"}, ` +
          `so ${point(x, y)} → ${answer}. Clockwise would give ${point(turn === 90 ? y : -image[0], turn === 90 ? -x : -image[1])}.`,
        check: () => {
          /* Rotating by the complementary amount must return the point. */
          const back = turn === 90 ? [image[1], -image[0]] : turn === 180 ? [-image[0], -image[1]] : [-image[1], image[0]];
          return back[0] === x && back[1] === y ? null : `inverse rotation did not return the point`;
        },
      };
    },
  }),

  generator({
    key: "gcse.cover.enlargement",
    topic: "transformations",
    subtopic: "enlargement",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      const cx = rng.nonZero(-5, 5);
      const cy = rng.nonZero(-5, 5);
      const px = rng.nonZero(-8, 8);
      const py = rng.nonZero(-8, 8);
      const k = rng.pick([2, 3, -1, -2]);

      const image = [cx + k * (px - cx), cy + k * (py - cy)];
      const answer = point(image[0], image[1]);

      return {
        prompt:
          `The point ${point(px, py)} is enlarged by scale factor ${k} about the centre ${point(cx, cy)}. ` +
          `Give the coordinates of its image.`,
        answer,
        distractors: pickDistractors(answer, [
          point(k * px, k * py), // enlarged about the origin instead
          point(cx + px * k, cy + py * k),
          point(image[0] + cx, image[1] + cy),
          point(px + k, py + k),
          point(-image[0], -image[1]),
        ]),
        explanation:
          `Measure from the centre: the vector from ${point(cx, cy)} to ${point(px, py)} is ` +
          `${point(px - cx, py - cy)}. Multiply it by ${k} and add it back to the centre: ${answer}. ` +
          `Multiplying the coordinates directly only works when the centre is the origin` +
          (k < 0 ? `. A negative scale factor also puts the image on the opposite side of the centre.` : `.`),
        check: () => {
          /* The centre, object and image must be collinear. */
          const cross = (px - cx) * (image[1] - cy) - (py - cy) * (image[0] - cx);
          return Math.abs(cross) < 1e-9 ? null : `centre, object and image are not collinear`;
        },
      };
    },
  }),

  generator({
    key: "gcse.cover.midpoint-distance",
    topic: "graphs",
    subtopic: "midpoint-distance",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const x1 = rng.int(-9, 9);
      const y1 = rng.int(-9, 9);
      /* A Pythagorean triple for the separation, so the distance is a whole
         number rather than √193. Both coordinate differences are even, so the
         midpoint lands on integers too. */
      const [px, py] = rng.pick([
        [6, 8],
        [8, 6],
        [10, 24],
        [24, 10],
        [16, 30],
        [30, 16],
        [14, 48],
        [12, 16],
        [18, 24],
      ] as const);
      const dx = px * rng.sign();
      const dy = py * rng.sign();
      const x2 = x1 + dx;
      const y2 = y1 + dy;

      const wantMidpoint = rng.bool();
      const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
      const answer = wantMidpoint
        ? point(rat(x1 + x2, 2).toString(), rat(y1 + y2, 2).toString())
        : String(distance);

      return {
        prompt:
          `Find the ${wantMidpoint ? "midpoint of" : "distance between"} ` +
          `${point(x1, y1)} and ${point(x2, y2)}.`,
        answer,
        distractors: pickDistractors(answer, [
          wantMidpoint ? point(x2 - x1, y2 - y1) : String(Math.abs(dx) + Math.abs(dy)),
          wantMidpoint ? point(x1 + x2, y1 + y2) : String(dx * dx + dy * dy), // forgot to halve, or to square-root
          wantMidpoint ? point(rat(x1 + x2, 2).toString(), y1 + y2) : String(distance / 2),
          wantMidpoint ? point(x1, y2) : String(distance * 2),
          wantMidpoint ? point(y1 + y2, x1 + x2) : String(Math.abs(dx)),
        ]),
        explanation: wantMidpoint
          ? `The midpoint averages each coordinate: ((${x1} + ${x2})/2, (${y1} + ${y2})/2) = ${answer}.`
          : `Distance = √((${x2} − ${x1})² + (${y2} − ${y1})²) = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy} = ${answer}. ` +
            `It is Pythagoras with the coordinate differences as the two shorter sides.`,
        check: () =>
          Math.abs(distance * distance - (dx * dx + dy * dy)) < 1e-9 ? null : `distance mismatch`,
      };
    },
  }),

  generator({
    key: "alevel.cover.graph-transformation",
    topic: "graphs",
    subtopic: "graph-transformations",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const a = rng.int(2, 5);
      const kind = rng.pick(["inside-add", "outside-add", "inside-mul", "outside-mul"] as const);

      const description =
        kind === "inside-add"
          ? `y = f(x + ${a})`
          : kind === "outside-add"
            ? `y = f(x) + ${a}`
            : kind === "inside-mul"
              ? `y = f(${a}x)`
              : `y = ${a}f(x)`;

      const answer =
        kind === "inside-add"
          ? `translation ${a} to the left`
          : kind === "outside-add"
            ? `translation ${a} upwards`
            : kind === "inside-mul"
              ? `horizontal stretch, scale factor 1/${a}`
              : `vertical stretch, scale factor ${a}`;

      return {
        prompt: `Describe the single transformation that maps y = f(x) onto ${description}.`,
        answer,
        distractors: pickDistractors(answer, [
          kind === "inside-add" ? `translation ${a} to the right` : `translation ${a} to the left`,
          kind === "outside-add" ? `translation ${a} downwards` : `translation ${a} upwards`,
          `horizontal stretch, scale factor ${a}`,
          `vertical stretch, scale factor 1/${a}`,
          `reflection in the x-axis`,
        ]),
        explanation:
          `Changes INSIDE the bracket affect x and do the opposite of what they look like: ` +
          `f(x + ${a}) shifts LEFT, and f(${a}x) squashes by 1/${a}. ` +
          `Changes outside affect y and behave as expected: f(x) + ${a} shifts up, ${a}f(x) stretches by ${a}. ` +
          `This one is ${description}, so it is ${answer}.`,
      };
    },
  }),

  generator({
    key: "gcse.cover.evaluate-function",
    topic: "functions",
    subtopic: "evaluating",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 20,
    build: (rng) => {
      const coefficients = [rng.nonZero(1, 5), rng.nonZero(-8, 8), rng.nonZero(-10, 10)];
      const x = rng.nonZero(-6, 6);
      const value = evaluate(coefficients, x);

      return {
        prompt: `f(x) = ${poly(coefficients)}. Work out f(${x}).`,
        answer: String(value),
        distractors: pickDistractors(String(value), [
          String(evaluate(coefficients, -x)), // sign slip substituting
          String(coefficients[0] * x * x - coefficients[1] * x + coefficients[2]),
          String(coefficients[0] * x + coefficients[1] * x + coefficients[2]), // did not square
          String(value + x),
          String(-value),
        ]),
        explanation:
          `Substitute x = ${x}: ${coefficients[0]}(${x})² ${coefficients[1] >= 0 ? "+" : "−"} ${Math.abs(coefficients[1])}(${x}) ` +
          `${coefficients[2] >= 0 ? "+" : "−"} ${Math.abs(coefficients[2])} = ${value}. ` +
          `A negative number squared is positive — that is where marks go missing.`,
        check: () => (evaluate(coefficients, x) === value ? null : `substitution does not recompute`),
      };
    },
  }),

  generator({
    key: "alevel.cover.circle-equation-write",
    topic: "coordinate-geometry",
    subtopic: "circle-equation",
    curriculumLevel: "YEAR_12",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const cx = rng.nonZero(-8, 8);
      const cy = rng.nonZero(-8, 8);
      const r = rng.int(2, 11);
      const answer = `(x ${cx >= 0 ? "−" : "+"} ${Math.abs(cx)})² + (y ${cy >= 0 ? "−" : "+"} ${Math.abs(cy)})² = ${r * r}`;

      return {
        prompt: `Write down the equation of the circle with centre ${point(cx, cy)} and radius ${r}.`,
        answer,
        distractors: pickDistractors(answer, [
          `(x ${cx >= 0 ? "+" : "−"} ${Math.abs(cx)})² + (y ${cy >= 0 ? "+" : "−"} ${Math.abs(cy)})² = ${r * r}`, // signs not flipped
          `(x ${cx >= 0 ? "−" : "+"} ${Math.abs(cx)})² + (y ${cy >= 0 ? "−" : "+"} ${Math.abs(cy)})² = ${r}`, // radius not squared
          `(x ${cx >= 0 ? "−" : "+"} ${Math.abs(cx)})² − (y ${cy >= 0 ? "−" : "+"} ${Math.abs(cy)})² = ${r * r}`,
          `x² + y² = ${r * r}`,
          `(x ${cx >= 0 ? "−" : "+"} ${Math.abs(cx)})² + (y ${cy >= 0 ? "−" : "+"} ${Math.abs(cy)})² = ${2 * r}`,
        ]),
        explanation:
          `(x − a)² + (y − b)² = r² with a = ${cx}, b = ${cy}, r = ${r}. ` +
          `The centre's coordinates are SUBTRACTED inside the brackets, and the right-hand side is ` +
          `the radius squared: ${answer}.`,
        check: () => {
          const value = Math.pow(cx + r - cx, 2) + Math.pow(cy - cy, 2);
          return value === r * r ? null : `a point on the circle does not satisfy the equation`;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.quotient-rule",
    topic: "differentiation",
    subtopic: "quotient-rule",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 18,
    build: (rng) => {
      const a = rng.nonZero(1, 5);
      const b = rng.nonZero(-7, 7);
      const c = rng.nonZero(1, 5);
      const d = rng.nonZero(-7, 7);

      /* y = (ax+b)/(cx+d); y' = (ad − bc)/(cx+d)² */
      const numerator = a * d - b * c;
      const answer = `${numerator}/(${poly([c, d])})${sup(2)}`;

      return {
        prompt: `Differentiate y = (${poly([a, b])})/(${poly([c, d])}) using the quotient rule.`,
        answer,
        distractors: pickDistractors(answer, [
          `${b * c - a * d}/(${poly([c, d])})${sup(2)}`, // numerator the wrong way round
          `${numerator}/(${poly([c, d])})`, // forgot to square the denominator
          `${a}/${c}`, // differentiated top and bottom separately
          `${a * d + b * c}/(${poly([c, d])})${sup(2)}`,
          `${numerator}/(${poly([a, b])})${sup(2)}`,
        ]),
        explanation:
          `(u'v − uv')/v² = [${a}(${poly([c, d])}) − ${c}(${poly([a, b])})]/(${poly([c, d])})² . ` +
          `The x terms cancel, leaving ${a}(${d}) − ${b}(${c}) = ${numerator}, so dy/dx = ${answer}. ` +
          `The order in the numerator matters — reversing it flips the sign.`,
        check: () => {
          for (const x of [0.7, 2.3, -1.4]) {
            if (Math.abs(c * x + d) < 0.2) continue;
            const h = 1e-5;
            const f = (t: number) => (a * t + b) / (c * t + d);
            const numeric = (f(x + h) - f(x - h)) / (2 * h);
            const symbolic = numerator / Math.pow(c * x + d, 2);
            if (Math.abs(numeric - symbolic) > 1e-2 * Math.max(1, Math.abs(symbolic))) {
              return `at x = ${x}: symbolic ${symbolic}, numerical ${numeric}`;
            }
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.implicit",
    topic: "differentiation",
    subtopic: "implicit",
    curriculumLevel: "YEAR_13",
    difficulty: 9,
    variants: 16,
    build: (rng) => {
      const a = rng.int(1, 5);
      const b = rng.int(1, 5);
      /* ax² + by² = k  →  2ax + 2by(dy/dx) = 0  →  dy/dx = −ax/(by) */
      const answer = `−${a === 1 ? "" : a}x/(${b === 1 ? "" : b}y)`;

      return {
        prompt: `Find dy/dx for the curve ${a === 1 ? "" : a}x² + ${b === 1 ? "" : b}y² = ${rng.int(4, 40)}.`,
        answer,
        distractors: pickDistractors(answer, [
          `${a === 1 ? "" : a}x/(${b === 1 ? "" : b}y)`, // lost the minus
          `−${b === 1 ? "" : b}y/(${a === 1 ? "" : a}x)`, // inverted
          `−${2 * a}x/${2 * b}`, // forgot the y
          `−${a === 1 ? "" : a}x/(${b === 1 ? "" : b}y²)`,
          `${2 * a}x + ${2 * b}y`,
        ]),
        explanation:
          `Differentiate both sides with respect to x, remembering the chain rule on the y term: ` +
          `${2 * a}x + ${2 * b}y(dy/dx) = 0. Rearranging gives dy/dx = −${2 * a}x/${2 * b}y = ${answer}. ` +
          `The dy/dx appears because y is a function of x — dropping it is what makes implicit differentiation fail.`,
      };
    },
  }),

  generator({
    key: "alevel.cover.integration-substitution",
    topic: "integration",
    subtopic: "substitution",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 18,
    build: (rng) => {
      const a = rng.nonZero(2, 6);
      const b = rng.nonZero(-6, 6);
      const n = rng.int(2, 6);

      /* ∫(ax+b)^n dx = (ax+b)^{n+1} / (a(n+1)) + c */
      const denominator = a * (n + 1);
      const answer = `(${poly([a, b])})${sup(n + 1)}/${denominator} + c`;

      return {
        prompt: `Find ∫ (${poly([a, b])})${sup(n)} dx.`,
        answer,
        distractors: pickDistractors(answer, [
          `(${poly([a, b])})${sup(n + 1)}/${n + 1} + c`, // forgot to divide by a
          `(${poly([a, b])})${sup(n + 1)}/${denominator}`, // forgot the constant
          `(${poly([a, b])})${sup(n - 1)}/${denominator} + c`,
          `${a}(${poly([a, b])})${sup(n + 1)}/${n + 1} + c`,
          `(${poly([a, b])})${sup(n + 1)}/${a} + c`,
        ]),
        explanation:
          `Substituting u = ${poly([a, b])} gives du = ${a} dx, so the integral is ` +
          `(1/${a})∫u${sup(n)} du = u${sup(n + 1)}/${denominator} = ${answer}. ` +
          `Differentiating the answer returns the integrand — the 1/${a} is what makes that work.`,
        check: () => {
          /* Differentiate the answer numerically and compare with the integrand. */
          const F = (x: number) => Math.pow(a * x + b, n + 1) / denominator;
          for (const x of [-0.5, 1.2]) {
            const h = 1e-5;
            const numeric = (F(x + h) - F(x - h)) / (2 * h);
            const integrand = Math.pow(a * x + b, n);
            if (Math.abs(numeric - integrand) > 1e-2 * Math.max(1, Math.abs(integrand))) {
              return `at x = ${x}: derivative ${numeric}, integrand ${integrand}`;
            }
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.integration-by-parts",
    topic: "integration",
    subtopic: "by-parts",
    curriculumLevel: "YEAR_13",
    difficulty: 9,
    variants: 16,
    build: (rng) => {
      const a = rng.nonZero(1, 9);
      const shift = rng.int(0, 1);
      /* ∫ax·e^x dx = a(x − 1)e^x + c; the shifted form integrates a(x+s)e^x. */
      const inner = shift === 0 ? "x − 1" : `x + ${shift - 1 === 0 ? "0" : shift - 1}`;
      const body = shift === 0 ? "x − 1" : "x";
      const answer = `${a === 1 ? "" : a}(${body})e${sup("x")} + c`;
      void inner;

      return {
        prompt: `Find ∫ ${a === 1 ? "" : a}${shift === 0 ? "x" : "(x + 1)"} e${sup("x")} dx.`,
        answer,
        distractors: pickDistractors(answer, [
          `${a === 1 ? "" : a}(${shift === 0 ? "x + 1" : "x − 1"})e${sup("x")} + c`, // sign slip in the second term
          `${a === 1 ? "" : a}x e${sup("x")} + c`, // never applied the rule
          `${a === 1 ? "" : a}e${sup("x")} + c`,
          `${a === 1 ? "" : a}x²e${sup("x")}/2 + c`, // integrated as a product of powers
          `${a === 1 ? "" : a}(1 − x)e${sup("x")} + c`,
          `${a === 1 ? "" : a}(x + 2)e${sup("x")} + c`,
        ]),
        explanation:
          `Take u = ${a === 1 ? "" : a}${shift === 0 ? "x" : "(x + 1)"} and dv = e${sup("x")}dx, ` +
          `so du = ${a} dx and v = e${sup("x")}. ` +
          `Then ∫u dv = uv − ∫v du = ${a === 1 ? "" : a}${shift === 0 ? "x" : "(x + 1)"}e${sup("x")} − ` +
          `${a === 1 ? "" : a}e${sup("x")} + c = ${answer}. ` +
          `Choosing u to be the part that simplifies when differentiated is the whole technique.`,
        check: () => {
          const F = (x: number) => a * (shift === 0 ? x - 1 : x) * Math.exp(x);
          for (const x of [-1, 0.5, 2]) {
            const h = 1e-5;
            const numeric = (F(x + h) - F(x - h)) / (2 * h);
            const integrand = a * (shift === 0 ? x : x + 1) * Math.exp(x);
            if (Math.abs(numeric - integrand) > 1e-3 * Math.max(1, Math.abs(integrand))) {
              return `at x = ${x}: derivative ${numeric}, integrand ${integrand}`;
            }
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.binomial-expansion",
    topic: "binomial-expansion",
    subtopic: "positive-index",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 18,
    build: (rng) => {
      const n = rng.int(3, 6);
      const a = rng.nonZero(-3, 3);

      const terms = Array.from({ length: 4 }, (_, k) => choose(n, k) * Math.pow(a, k));
      /* Written ascending, which is the convention for a binomial expansion. */
      const ascending = terms
        .map((coefficient, k) => {
          if (coefficient === 0) return "";
          const body = k === 0 ? "" : k === 1 ? "x" : `x${sup(k)}`;
          const size = Math.abs(coefficient);
          const shown = size === 1 && body !== "" ? "" : String(size);
          if (k === 0) return `${coefficient < 0 ? "-" : ""}${shown}${body}`;
          return `${coefficient < 0 ? " - " : " + "}${shown}${body}`;
        })
        .join("");

      return {
        prompt:
          `Expand (1 + ${a}x)${sup(n)} in ascending powers of x, up to and including the term in x³.`,
        answer: ascending,
        distractors: pickDistractors(ascending, [
          terms
            .map((_, k) => {
              const coefficient = choose(n, k) * (k === 0 ? 1 : a);
              const body = k === 0 ? "" : k === 1 ? "x" : `x${sup(k)}`;
              const size = Math.abs(coefficient);
              const shown = size === 1 && body !== "" ? "" : String(size);
              return k === 0
                ? `${coefficient < 0 ? "-" : ""}${shown}${body}`
                : `${coefficient < 0 ? " - " : " + "}${shown}${body}`;
            })
            .join(""), // raised a to the first power throughout
          terms
            .map((_, k) => {
              const coefficient = Math.pow(a, k);
              const body = k === 0 ? "" : k === 1 ? "x" : `x${sup(k)}`;
              const size = Math.abs(coefficient);
              const shown = size === 1 && body !== "" ? "" : String(size);
              return k === 0
                ? `${coefficient < 0 ? "-" : ""}${shown}${body}`
                : `${coefficient < 0 ? " - " : " + "}${shown}${body}`;
            })
            .join(""), // dropped the binomial coefficients
          `1 + ${n}x + ${n}x${sup(2)} + ${n}x${sup(3)}`,
          `1 + ${a}x + ${a}x${sup(2)} + ${a}x${sup(3)}`,
          ascending.replace(/ - /g, " + "),
        ]),
        explanation:
          `The coefficients are C(${n}, k)(${a})ᵏ for k = 0 to 3: ` +
          terms.map((t, k) => `C(${n},${k})×${a}${k === 0 ? "⁰" : k === 1 ? "" : sup(k)} = ${t}`).join(", ") +
          `. Ascending in x that reads ${ascending}. ` +
          `The whole of ${a}x is raised to the power, not just x.`,
        check: () => {
          /* The expansion is truncated at x³, so it only agrees with the exact
             value up to an O(x⁴) tail. At x = 0.001 that tail is around 1e-11,
             far below the tolerance — at x = 0.01 it is not, which is how this
             check was found to be testing the wrong thing. */
          const x = 0.001;
          const exact = Math.pow(1 + a * x, n);
          const approx = terms.reduce((sum, c, k) => sum + c * Math.pow(x, k), 0);
          return Math.abs(exact - approx) < 1e-8 ? null : `expansion ${approx} vs exact ${exact}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.arithmetic-sequence",
    topic: "sequences",
    subtopic: "arithmetic",
    curriculumLevel: "YEAR_12",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const a = rng.nonZero(-15, 25);
      const d = rng.nonZero(-9, 9);
      const n = rng.int(10, 60);
      const value = a + (n - 1) * d;

      return {
        prompt: `An arithmetic sequence has first term ${a} and common difference ${d}. Find the ${n}th term.`,
        answer: String(value),
        distractors: pickDistractors(String(value), [
          String(a + n * d), // used n rather than n − 1
          String(a + (n - 2) * d),
          String((n / 2) * (2 * a + (n - 1) * d)), // gave the sum
          String(a * n),
          String(value + d),
        ]),
        explanation:
          `uₙ = a + (n − 1)d = ${a} + ${n - 1}(${d}) = ${value}. ` +
          `It is n − 1 because the first term has had no difference added to it yet.`,
        check: () => {
          let brute = a;
          for (let i = 1; i < n; i++) brute += d;
          return brute === value ? null : `formula ${value}, counted ${brute}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.geometric-sequence",
    topic: "sequences",
    subtopic: "geometric",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 20,
    build: (rng) => {
      const a = rng.int(1, 12);
      const r = rng.pick([rat(2), rat(3), rat(-2), rat(1, 2), rat(1, 3)]);
      const n = rng.int(3, 7);
      const exactValue = rat(a).mul(r.pow(n - 1));
      const value = exactValue.toNumber();

      return {
        prompt:
          `A geometric sequence has first term ${a} and common ratio ${r}. ` +
          `Find the exact value of the ${n}th term.`,
        answer: exactValue.toString(),
        distractors: pickDistractors(exactValue.toString(), [
          rat(a).mul(r.pow(n)).toString(), // used n rather than n − 1
          rat(a).add(rat(n - 1).mul(r)).toString(), // treated it as arithmetic
          rat(a).mul(r).mul(rat(n - 1)).toString(),
          exactValue.mul(r).toString(),
          exactValue.div(r).toString(),
        ]),
        explanation:
          `uₙ = ar${sup("n-1")} = ${a} × ${r}${sup(n - 1)} = ${exactValue}. ` +
          `The exponent is n − 1 because the first term is multiplied by r zero times.`,
        check: () => {
          let brute = a;
          for (let i = 1; i < n; i++) brute *= r.toNumber();
          return Math.abs(brute - value) < 1e-9 ? null : `formula ${value}, multiplied out ${brute}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.natural-logs",
    topic: "exponentials-logs",
    subtopic: "natural-logs",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 18,
    build: (rng) => {
      /*
       * A quadratic in eˣ, so the answers are exact logs rather than four
       * decimal places. "Solve 3e^{0.4x} = 47" has no answer worth writing
       * down — the interesting step is spotting the hidden quadratic, and the
       * rest is typing.
       */
      const p = rng.int(2, 9);
      let q = rng.int(2, 9);
      if (q === p) q = p === 9 ? 2 : p + 1;

      const b = -(p + q);
      const c = p * q;
      const roots = [p, q].sort((a, z) => a - z);
      const answer = roots.map((r) => `x = ln ${r}`).join(" or ");

      return {
        prompt: `Solve e${sup("2x")} ${b >= 0 ? "+" : "−"} ${Math.abs(b)}e${sup("x")} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = 0, giving exact answers.`,
        answer,
        distractors: pickDistractors(answer, [
          roots.map((r) => `x = ${r}`).join(" or "), // forgot to take logs
          roots.map((r) => `x = ln ${-r}`).join(" or "),
          `x = ln ${roots[0]}`, // only one root
          `x = ln ${c}`,
          roots.map((r) => `x = e${sup(r)}`).join(" or "),
          `x = ln ${roots[0] + roots[1]}`,
        ]),
        explanation:
          `Let y = e${sup("x")}. The equation becomes y² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}y ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = 0, ` +
          `which factorises to (y − ${p})(y − ${q}) = 0, so e${sup("x")} = ${p} or ${q}. ` +
          `Taking natural logs gives ${answer}. Both roots are positive, so both give a solution — ` +
          `a negative root would have to be discarded, because e${sup("x")} is never negative.`,
        check: () => {
          for (const r of roots) {
            const y = r;
            const value = y * y + b * y + c;
            if (value !== 0) return `e^x = ${r} gives ${value}, not 0`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.iteration",
    topic: "numerical-methods",
    subtopic: "iteration",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 18,
    /* Three rounds of a cube root. The method IS the calculator; there is no
       exact form to ask for. */
    calculator: true,
    build: (rng) => {
      const a = rng.int(2, 9);
      const b = rng.int(1, 9);
      const x0 = rng.int(1, 4);

      /* x_{n+1} = cbrt(a x_n + b), which converges for these ranges. */
      const step = (x: number) => Math.cbrt(a * x + b);
      const x1 = step(x0);
      const x2 = step(x1);
      const x3 = step(x2);
      const answer = toPlaces(x3, 4);

      return {
        prompt:
          `The iteration x${sub("n+1")} = ∛(${a}x${sub("n")} + ${b}) is used with x₀ = ${x0}. ` +
          `Find x₃ to 4 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          toPlaces(x2, 4), // stopped one step short
          toPlaces(step(x3), 4), // one step too far
          toPlaces(x1, 4),
          toPlaces(Math.cbrt(a * x0 + b) * 3, 4),
          toPlaces(x3 + 0.1, 4),
        ]),
        explanation:
          `Feed each result back in: x₁ = ${toPlaces(x1, 4)}, x₂ = ${toPlaces(x2, 4)}, x₃ = ${answer}. ` +
          `Counting from x₀ rather than x₁ is what makes people stop a step early.`,
        check: () => {
          const rebuilt = Math.cbrt(a * x2 + b);
          return Math.abs(rebuilt - x3) < 1e-9 ? null : `x₃ does not follow from x₂`;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.particular-solution",
    topic: "differential-equations",
    subtopic: "particular-solutions",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 16,
    build: (rng) => {
      const a = rng.nonZero(1, 6);
      const b = rng.nonZero(-8, 8);
      const x0 = rng.nonZero(-3, 3);
      const y0 = rng.nonZero(-10, 10);

      /* dy/dx = 2ax + b  →  y = ax² + bx + c */
      const c = y0 - (a * x0 * x0 + b * x0);
      const answer = `y = ${poly([a, b, c])}`;

      return {
        prompt:
          `Solve dy/dx = ${poly([2 * a, b])} given that y = ${y0} when x = ${x0}.`,
        answer,
        distractors: pickDistractors(answer, [
          `y = ${poly([a, b, 0])}`, // never used the initial condition
          `y = ${poly([a, b, y0])}`, // used y₀ as the constant
          `y = ${poly([2 * a, b, c])}`, // forgot to halve the x² coefficient
          `y = ${poly([a, b, -c])}`,
          `y = ${poly([a * 2, b * 2, c])}`,
        ]),
        explanation:
          `Integrate: y = ${poly([a, b])} + c. ` +
          `Substituting x = ${x0}, y = ${y0} gives ${y0} = ${a * x0 * x0 + b * x0} + c, so c = ${c}. ` +
          `The particular solution is ${answer}. Without the initial condition you only have a family of curves.`,
        check: () => {
          const value = a * x0 * x0 + b * x0 + c;
          if (Math.abs(value - y0) > 1e-9) return `curve misses the point: got ${value}, expected ${y0}`;
          const derivative = differentiate([a, b, c]);
          return derivative[0] === 2 * a && derivative[1] === b
            ? null
            : `derivative ${poly(derivative)} does not match the equation`;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.algebraic-fractions",
    topic: "algebra",
    subtopic: "algebraic-fractions",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 18,
    build: (rng) => {
      const p = rng.nonZero(-6, 6);
      let q = rng.nonZero(-6, 6);
      if (q === p) q = p + 1;

      /* (x² + (p+q)x + pq) / (x + p) = x + q */
      const answer = poly([1, q]);

      return {
        prompt: `Simplify (${poly([1, p + q, p * q])})/(x ${p >= 0 ? "+" : "−"} ${Math.abs(p)}).`,
        answer,
        distractors: pickDistractors(answer, [
          poly([1, p]), // cancelled the wrong factor
          poly([1, p + q]),
          poly([1, p * q]),
          poly([1, -q]),
          poly([1, q + 1]),
        ]),
        explanation:
          `Factorise the numerator: ${poly([1, p + q, p * q])} = ${bracket(1, p)}${bracket(1, q)}. ` +
          `The factor ${bracket(1, p)} cancels with the denominator, leaving ${answer}. ` +
          `Only whole factors cancel — you cannot cancel individual terms.`,
        check: () => {
          for (const x of [2.5, -3.5, 7]) {
            if (Math.abs(x + p) < 0.1) continue;
            const left = (x * x + (p + q) * x + p * q) / (x + p);
            const right = x + q;
            if (Math.abs(left - right) > 1e-9) return `forms disagree at x = ${x}`;
          }
          return null;
        },
      };
    },
  }),

  generator({
    key: "alevel.cover.algebraic-proof",
    topic: "proof",
    subtopic: "algebraic-proof",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const items = [
        {
          claim: "the sum of two consecutive integers is odd",
          answer: "n + (n + 1) = 2n + 1",
          why: "2n is even, so 2n + 1 is odd for every integer n.",
          wrong: ["n + (n + 2) = 2n + 2", "2n + 2n = 4n", "n × (n + 1)", "n + n = 2n"],
        },
        {
          claim: "the sum of three consecutive integers is a multiple of 3",
          answer: "(n − 1) + n + (n + 1) = 3n",
          why: "3n is a multiple of 3 for every integer n.",
          wrong: ["n + (n + 1) + (n + 2) = 3n + 3", "3n + 1", "n³", "n + n + n + 3"],
        },
        {
          claim: "the difference between the squares of two consecutive integers is odd",
          answer: "(n + 1)² − n² = 2n + 1",
          why: "2n + 1 is odd for every integer n.",
          wrong: ["(n + 1)² − n² = 2n", "n² − (n − 1)² = 2n", "(n + 1)² − n² = 1", "2n² + 1"],
        },
        {
          claim: "the product of two consecutive integers is even",
          answer: "n(n + 1), and one of n, n + 1 must be even",
          why: "consecutive integers alternate parity, so their product always contains a factor of 2.",
          wrong: ["n(n + 1) = n² + n, which is even", "n² is even", "2n(n + 1)", "n + (n + 1) is even"],
        },
        {
          claim: "the sum of any two even numbers is even",
          answer: "2a + 2b = 2(a + b)",
          why: "the result has a factor of 2, so it is even.",
          wrong: ["2a + 2b = 4ab", "a + b = 2(a + b)", "2(a + b) + 1", "2a × 2b = 4ab"],
        },
        {
          claim: "the square of an odd number is odd",
          answer: "(2n + 1)² = 4n² + 4n + 1",
          why: "4n² + 4n is even, so adding 1 makes the result odd.",
          wrong: ["(2n + 1)² = 4n² + 1", "(2n)² = 4n²", "2n² + 1", "(2n + 1)² = 2n² + 2n + 1"],
        },
        {
          claim: "the sum of two consecutive odd numbers is a multiple of 4",
          answer: "(2n + 1) + (2n + 3) = 4n + 4",
          why: "4n + 4 = 4(n + 1), which is a multiple of 4.",
          wrong: ["(2n + 1) + (2n + 2) = 4n + 3", "2n + 2n = 4n", "4n + 2", "(2n + 1)(2n + 3)"],
        },
        {
          claim: "n² + n is always even",
          answer: "n² + n = n(n + 1)",
          why: "it is the product of two consecutive integers, one of which is even.",
          wrong: ["n² + n = 2n", "n(n − 1)", "n² + n = n²(1 + n)", "n² is always even"],
        },
      ];

      const chosen = items[rng.int(0, items.length - 1)];

      return {
        prompt: `Which algebraic statement proves that ${chosen.claim}?`,
        answer: chosen.answer,
        distractors: pickDistractors(chosen.answer, chosen.wrong),
        explanation:
          `${chosen.answer} — ${chosen.why} ` +
          `A proof has to hold for EVERY integer, which is why it uses n rather than examples.`,
      };
    },
  }),
];

/** Subscript digits, for iteration indices. */
function sub(text: string | number): string {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "+": "₊",
    n: "ₙ",
  };
  return String(text)
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}
