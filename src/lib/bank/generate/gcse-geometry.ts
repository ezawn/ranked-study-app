/**
 * GCSE Geometry, trigonometry, circle theorems, vectors and transformations.
 *
 * Triangles are built from Pythagorean triples wherever a right angle is
 * involved, so lengths come out exact and a student checking their working gets
 * the same clean number the mark scheme has. Where a question genuinely needs a
 * decimal — the sine rule, a sector area — the rounding is stated in the prompt
 * and the `check` verifies the unrounded value.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { rat, simplifySurd, surdToString } from "./rational";
import { point, sup, toPlaces } from "./format";

/** Right-angled triangles with integer sides, so Pythagoras stays exact. */
const TRIPLES: readonly [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
  [12, 35, 37],
  [28, 45, 53],
];

/*
 * Only side counts that divide 360, so every exterior angle is a whole number.
 * A heptagon's is 51.428571…, which turns an angle-fact question into a
 * calculator question about nothing.
 */
const POLYGONS: readonly { sides: number; name: string }[] = [
  { sides: 5, name: "pentagon" },
  { sides: 6, name: "hexagon" },

  { sides: 8, name: "octagon" },
  { sides: 9, name: "nonagon" },
  { sides: 10, name: "decagon" },

  { sides: 12, name: "dodecagon" },
  { sides: 15, name: "15-sided polygon" },
  { sides: 18, name: "18-sided polygon" },
  { sides: 20, name: "20-sided polygon" },
  { sides: 24, name: "24-sided polygon" },
  { sides: 30, name: "30-sided polygon" },
  { sides: 36, name: "36-sided polygon" },
];

export const gcseGeometry: Generator[] = [
  generator({
    key: "gcse.geometry.polygon-angles",
    topic: "geometry",
    subtopic: "angles",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 22,
    build: (rng) => {
      const { sides, name } = rng.pick(POLYGONS);
      const mode = rng.pick(["interior", "exterior", "sum"] as const);
      const exterior = 360 / sides;
      const interior = 180 - exterior;
      const sum = 180 * (sides - 2);

      const value = mode === "interior" ? interior : mode === "exterior" ? exterior : sum;
      const answer = `${toPlaces(value, 2)}°`;

      return {
        prompt:
          mode === "sum"
            ? `Work out the sum of the interior angles of a ${name}.`
            : `Work out the size of one ${mode} angle of a regular ${name}.`,
        answer,
        distractors: pickDistractors(answer, [
          `${toPlaces(mode === "interior" ? exterior : mode === "exterior" ? interior : sum + 360, 2)}°`,
          `${toPlaces(mode === "sum" ? interior : sum, 2)}°`, // one angle vs the total
          `${toPlaces(mode === "sum" ? 180 * sides : 360 / (sides - 2), 2)}°`,
          `${toPlaces(mode === "sum" ? sum / sides : 180 / sides, 2)}°`,
        ]),
        explanation:
          mode === "sum"
            ? `Split the ${name} into ${sides - 2} triangles from one vertex. Each contributes 180°, ` +
              `so the interior angles sum to 180 × ${sides - 2} = ${answer}.`
            : `Exterior angles of any polygon sum to 360°, so one exterior angle is 360 ÷ ${sides} = ${toPlaces(exterior, 2)}°. ` +
              `Interior and exterior angles lie on a straight line, so the interior angle is ` +
              `180 − ${toPlaces(exterior, 2)} = ${toPlaces(interior, 2)}°.`,
        check: () => {
          if (Math.abs(interior + exterior - 180) > 1e-9) return `angles do not sum to 180°`;
          return Math.abs(interior * sides - sum) < 1e-9
            ? null
            : `${sides} interior angles give ${interior * sides}, but the sum formula gives ${sum}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.pythagoras",
    topic: "geometry",
    subtopic: "pythagoras",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 24,
    build: (rng) => {
      const [a, b, c] = rng.pick(TRIPLES);
      const scale = rng.int(1, 3);
      const [sa, sb, sc] = [a * scale, b * scale, c * scale];
      const findHypotenuse = rng.bool();
      const answer = `${findHypotenuse ? sc : sb} cm`;

      return {
        prompt: findHypotenuse
          ? `A right-angled triangle has shorter sides ${sa} cm and ${sb} cm. Find the length of the hypotenuse.`
          : `A right-angled triangle has hypotenuse ${sc} cm and one shorter side ${sa} cm. Find the other shorter side.`,
        answer,
        distractors: pickDistractors(answer, [
          findHypotenuse ? `${sa + sb} cm` : `${sc - sa} cm`, // added or subtracted the sides directly
          findHypotenuse ? `${Math.abs(sb - sa)} cm` : `${sc + sa} cm`,
          `${toPlaces(Math.sqrt(sa * sa + sc * sc), 2)} cm`,
          `${findHypotenuse ? sc + 1 : sb + 1} cm`,
        ]),
        explanation: findHypotenuse
          ? `a² + b² = c², so c² = ${sa}² + ${sb}² = ${sa * sa} + ${sb * sb} = ${sc * sc}, and c = ${sc} cm.`
          : `The hypotenuse is squared on its own: b² = ${sc}² − ${sa}² = ${sc * sc} − ${sa * sa} = ${sb * sb}, so b = ${sb} cm. ` +
            `Subtracting the lengths rather than their squares is the usual error.`,
        check: () =>
          sa * sa + sb * sb === sc * sc ? null : `${sa}, ${sb}, ${sc} is not a right triangle`,
      };
    },
  }),

  generator({
    key: "gcse.geometry.right-angled-trig",
    topic: "trigonometry",
    subtopic: "right-angled",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      /*
       * Which ratio, not what does the calculator say.
       *
       * Asking for an angle to one decimal place from a 3-4-5 triangle is a
       * question about typing tan⁻¹(0.75), and the student who wins is the one
       * holding a calculator. The skill worth testing is choosing between sine,
       * cosine and tangent, so that is what is asked — and the numeric variant
       * uses an exact triangle where the answer is a whole number.
       */
      const [opposite, adjacent, hypotenuse] = rng.pick(TRIPLES);
      const scale = rng.int(1, 4);
      const [opp, adj, hyp] = [opposite * scale, adjacent * scale, hypotenuse * scale];
      const wantRatio = rng.bool();

      if (wantRatio) {
        const known = rng.pick(["opposite-adjacent", "opposite-hypotenuse", "adjacent-hypotenuse"] as const);
        const answer =
          known === "opposite-adjacent" ? "tan" : known === "opposite-hypotenuse" ? "sin" : "cos";
        const pair =
          known === "opposite-adjacent"
            ? "the opposite and adjacent sides"
            : known === "opposite-hypotenuse"
              ? "the opposite side and the hypotenuse"
              : "the adjacent side and the hypotenuse";

        return {
          prompt: `Which trigonometric ratio links an angle θ to ${pair}?`,
          answer,
          distractors: pickDistractors(answer, ["sin", "cos", "tan", "cosec", "sec", "cot"]),
          explanation:
            `SOH-CAH-TOA: sine is opposite over hypotenuse, cosine is adjacent over hypotenuse, ` +
            `tangent is opposite over adjacent. ${pair.charAt(0).toUpperCase()}${pair.slice(1)} means ${answer}. ` +
            `The reciprocal ratios (cosec, sec, cot) are the inverses of these, not what links these two sides.`,
        };
      }

      const answer = `${hyp} cm`;
      return {
        prompt:
          `In a right-angled triangle, sin θ = ${opposite}/${hypotenuse} and the side opposite θ ` +
          `is ${opp} cm. Find the hypotenuse.`,
        answer,
        distractors: pickDistractors(answer, [
          `${adj} cm`,
          `${(opp * opposite) / hypotenuse} cm`, // multiplied instead of dividing
          `${opp + hyp} cm`,
          `${hyp + scale} cm`,
          `${opp} cm`,
        ]),
        explanation:
          `sin θ = opposite ÷ hypotenuse, so hypotenuse = opposite ÷ sin θ = ` +
          `${opp} ÷ (${opposite}/${hypotenuse}) = ${opp} × ${hypotenuse}/${opposite} = ${hyp} cm. ` +
          `Rearranging a ratio means dividing by it, not multiplying.`,
        check: () =>
          opp * opp + adj * adj === hyp * hyp ? null : `triangle is not right-angled`,
      };
    },
  }),

  generator({
    key: "gcse.geometry.cosine-rule",
    topic: "trigonometry",
    subtopic: "cosine-rule",
    curriculumLevel: "YEAR_11",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      const b = rng.int(3, 14);
      const c = rng.int(3, 14);
      /* 60°, 90° and 120° have cosines of ½, 0 and −½, so a² comes out a whole
         number and the question is about the formula rather than the keypad. */
      const angle = rng.pick([60, 90, 120]);
      const cosine = angle === 60 ? 0.5 : angle === 90 ? 0 : -0.5;
      const aSquared = b * b + c * c - 2 * b * c * cosine;
      const a = Math.sqrt(aSquared);
      const answer = `√${aSquared} cm`;

      /* The classic slip: dropping the minus, i.e. using + 2bc cos A. */
      const wrongSign = b * b + c * c + 2 * b * c * cosine;

      return {
        prompt:
          `In triangle ABC, b = ${b} cm, c = ${c} cm and angle A = ${angle}°. ` +
          `Find the exact length of a.`,
        answer,
        distractors: pickDistractors(answer, [
          `√${wrongSign} cm`, // dropped the minus sign
          `√${b * b + c * c} cm`, // used Pythagoras on a non-right triangle
          `${aSquared} cm`, // forgot the square root
          `√${aSquared + b} cm`,
          `√${Math.abs(b * b - c * c)} cm`,
        ]),
        explanation:
          `cos ${angle}° = ${angle === 60 ? "½" : angle === 90 ? "0" : "−½"}, so ` +
          `a² = ${b}² + ${c}² − 2(${b})(${c})(${angle === 60 ? "½" : angle === 90 ? "0" : "−½"}) = ${aSquared}, ` +
          `giving a = ${answer}. The minus sign is what makes this different from Pythagoras — ` +
          `at A = 90° the cosine term vanishes and the two agree.`,
        check: () => {
          const rebuilt = b * b + c * c - 2 * b * c * Math.cos((angle * Math.PI) / 180);
          return Math.abs(a * a - rebuilt) < 1e-8 ? null : `a² does not reconstruct`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.sine-rule",
    topic: "trigonometry",
    subtopic: "sine-rule",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      /* Angles whose sines are exact and in simple ratio: sin 30° = sin 150° = ½
         and sin 90° = 1, so b comes out a whole number or a clean half. */
      const [angleA, angleB] = rng.pick([
        [30, 90],
        [90, 30],
        [30, 150],
        [150, 30],
        [90, 150],
        [150, 90],
      ] as const);
      const sinOf = (deg: number) => (deg === 90 ? 1 : 0.5);
      const a = rng.int(3, 20) * 2;
      const b = (a * sinOf(angleB)) / sinOf(angleA);
      const answer = `${b} cm`;

      return {
        prompt:
          `In triangle ABC, angle A = ${angleA}°, angle B = ${angleB}° and side a = ${a} cm. ` +
          `Find side b.`,
        answer,
        distractors: pickDistractors(answer, [
          `${(a * sinOf(angleA)) / sinOf(angleB)} cm`, // ratio upside down
          `${(a * angleB) / angleA} cm`, // scaled by the angles themselves
          `${a} cm`,
          `${b * 2} cm`,
          `${b / 2} cm`,
        ]),
        explanation:
          `a/sin A = b/sin B, so b = a sin B ÷ sin A. ` +
          `sin ${angleB}° = ${sinOf(angleB) === 1 ? "1" : "½"} and sin ${angleA}° = ${sinOf(angleA) === 1 ? "1" : "½"}, ` +
          `so b = ${a} × ${sinOf(angleB) === 1 ? "1" : "½"} ÷ ${sinOf(angleA) === 1 ? "1" : "½"} = ${answer}. ` +
          `Sides are proportional to the SINES of the opposite angles, not to the angles.`,
        check: () => {
          const left = a / Math.sin((angleA * Math.PI) / 180);
          const right = b / Math.sin((angleB * Math.PI) / 180);
          return Math.abs(left - right) < 1e-8 ? null : `sine rule ratios differ: ${left} vs ${right}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.triangle-area",
    topic: "trigonometry",
    subtopic: "triangle-area",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /* 30°, 90° and 150° have sines of ½, 1 and ½, so ½ab sin C is exact. */
      const a = rng.int(2, 12) * 2;
      const b = rng.int(2, 12);
      const angle = rng.pick([30, 90, 150]);
      const sine = angle === 90 ? 1 : 0.5;
      const area = 0.5 * a * b * sine;
      const answer = `${area} cm²`;

      return {
        prompt:
          `A triangle has two sides of ${a} cm and ${b} cm with an angle of ${angle}° between them. ` +
          `Find its exact area.`,
        answer,
        distractors: pickDistractors(answer, [
          `${area * 2} cm²`, // forgot the half
          `${a * b} cm²`,
          `${0.5 * a * b} cm²`, // treated sin as 1 regardless
          `${area / 2} cm²`,
          `${area + a} cm²`,
        ]),
        explanation:
          `Area = ½ab sin C. sin ${angle}° = ${sine === 1 ? "1" : "½"}, so ` +
          `½ × ${a} × ${b} × ${sine === 1 ? "1" : "½"} = ${answer}. ` +
          `The angle must be the one BETWEEN the two sides, and the formula needs sine, not cosine.`,
        check: () => {
          const rebuilt = 0.5 * a * b * Math.sin((angle * Math.PI) / 180);
          return Math.abs(rebuilt - area) < 1e-9 ? null : `area does not reconstruct`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.arc-sector",
    topic: "geometry",
    subtopic: "arcs-sectors",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /* Answers in terms of π, which is the exact form and needs no keypad.
         Radii and angles chosen so the coefficient is a clean fraction. */
      const radius = rng.pick([2, 3, 4, 6, 8, 9, 10, 12]);
      const angle = rng.pick([30, 45, 60, 90, 120, 135, 180, 240, 270]);
      const wantArc = rng.bool();
      const arc = rat(angle * 2 * radius, 360);
      const area = rat(angle * radius * radius, 360);
      const answer = `${(wantArc ? arc : area).toString() === "1" ? "" : (wantArc ? arc : area).toString()}π cm${wantArc ? "" : "²"}`;

      return {
        prompt:
          `A sector of a circle has radius ${radius} cm and angle ${angle}°. ` +
          `Find its ${wantArc ? "arc length" : "area"}, giving your answer in terms of π.`,
        answer,
        distractors: pickDistractors(answer, [
          `${(wantArc ? area : arc)}π cm${wantArc ? "" : "²"}`, // arc and area swapped
          `${wantArc ? 2 * radius : radius * radius}π cm${wantArc ? "" : "²"}`, // whole circle
          `${(wantArc ? arc : area).mul(rat(2))}π cm${wantArc ? "" : "²"}`,
          `${rat(angle * radius, 360)}π cm${wantArc ? "" : "²"}`,
          `${(wantArc ? arc : area).div(rat(2))}π cm${wantArc ? "" : "²"}`,
        ]),
        explanation:
          `The sector is ${angle}/360 of the circle. ` +
          (wantArc
            ? `Arc = ${angle}/360 × 2π × ${radius} = ${answer}.`
            : `Area = ${angle}/360 × π × ${radius}² = ${answer}.`) +
          ` Arc length uses the circumference; sector area uses the area — and leaving π in the ` +
          `answer keeps it exact.`,
        check: () => {
          const fraction = angle / 360;
          const expected = wantArc ? fraction * 2 * radius : fraction * radius ** 2;
          const got = (wantArc ? arc : area).toNumber();
          return Math.abs(expected - got) < 1e-9 ? null : `sector coefficient mismatch`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.similar-shapes",
    topic: "geometry",
    subtopic: "similar-shapes",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      const scale = rng.int(2, 5);
      const smallLength = rng.int(2, 12);
      const smallArea = rng.int(3, 30);
      const wantArea = rng.bool();
      const bigArea = smallArea * scale * scale;
      const bigVolume = smallArea * scale * scale * scale;
      const answer = wantArea ? `${bigArea} cm²` : `${bigVolume} cm³`;

      return {
        prompt:
          `Two similar solids have corresponding lengths ${smallLength} cm and ${smallLength * scale} cm. ` +
          `The smaller has ${wantArea ? "surface area" : "volume"} ${smallArea} cm${wantArea ? "²" : "³"}. ` +
          `Find the ${wantArea ? "surface area" : "volume"} of the larger.`,
        answer,
        distractors: pickDistractors(answer, [
          `${smallArea * scale} cm${wantArea ? "²" : "³"}`, // used the length scale factor
          `${wantArea ? bigVolume : bigArea} cm${wantArea ? "²" : "³"}`, // used the wrong power
          `${smallArea * scale * scale * scale * scale} cm${wantArea ? "²" : "³"}`,
          `${smallArea + scale} cm${wantArea ? "²" : "³"}`,
        ]),
        explanation:
          `The length scale factor is ${smallLength * scale} ÷ ${smallLength} = ${scale}. ` +
          `Areas scale by the square (${scale}² = ${scale * scale}) and volumes by the cube (${scale}³ = ${scale ** 3}). ` +
          `So the answer is ${smallArea} × ${wantArea ? scale * scale : scale ** 3} = ${answer}.`,
        check: () => {
          const ratio = wantArea ? bigArea / smallArea : bigVolume / smallArea;
          const expected = wantArea ? scale ** 2 : scale ** 3;
          return ratio === expected ? null : `ratio ${ratio}, expected ${expected}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.circle-centre",
    topic: "circle-theorems",
    subtopic: "angle-at-centre",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 20,
    build: (rng) => {
      const circumference = rng.int(20, 78);
      const centre = 2 * circumference;
      const fromCentre = rng.bool();
      const answer = `${fromCentre ? circumference : centre}°`;

      return {
        prompt: fromCentre
          ? `Points A, B and P lie on a circle with centre O. Angle AOB = ${centre}°. Find angle APB.`
          : `Points A, B and P lie on a circle with centre O. Angle APB = ${circumference}°. Find angle AOB.`,
        answer,
        distractors: pickDistractors(answer, [
          `${fromCentre ? centre : circumference}°`, // applied the theorem backwards
          `${180 - (fromCentre ? circumference : centre)}°`,
          `${fromCentre ? circumference + 10 : centre - 10}°`,
          `${360 - centre}°`,
        ]),
        explanation:
          `The angle at the centre is twice the angle at the circumference on the same arc. ` +
          (fromCentre
            ? `So angle APB = ${centre} ÷ 2 = ${circumference}°.`
            : `So angle AOB = 2 × ${circumference} = ${centre}°.`) +
          ` Halving when you should double is the error the question is checking for.`,
        check: () => (centre === 2 * circumference ? null : `theorem relation broken`),
      };
    },
  }),

  generator({
    key: "gcse.geometry.cyclic-quadrilateral",
    topic: "circle-theorems",
    subtopic: "cyclic-quadrilateral",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const given = rng.int(35, 145);
      const answer = `${180 - given}°`;

      return {
        prompt:
          `ABCD is a cyclic quadrilateral. Angle ABC = ${given}°. Find angle ADC.`,
        answer,
        distractors: pickDistractors(answer, [
          `${given}°`, // assumed they were equal
          `${360 - given}°`,
          `${90 - given}°`,
          `${2 * given}°`,
        ]),
        explanation:
          `Opposite angles of a cyclic quadrilateral add to 180°, so angle ADC = 180 − ${given} = ${answer}. ` +
          `They are supplementary, not equal — equal opposite angles would make it a parallelogram.`,
        check: () => (given + (180 - given) === 180 ? null : `angles do not sum to 180°`),
      };
    },
  }),

  generator({
    key: "gcse.geometry.column-vectors",
    topic: "vectors",
    subtopic: "column-vectors",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 22,
    build: (rng) => {
      const ax = rng.nonZero(-8, 8);
      const ay = rng.nonZero(-8, 8);
      const bx = rng.nonZero(-8, 8);
      const by = rng.nonZero(-8, 8);
      const k = rng.int(2, 4);

      const rx = k * ax - bx;
      const ry = k * ay - by;
      const answer = point(rx, ry);

      return {
        prompt:
          `a = ${point(ax, ay)} and b = ${point(bx, by)} as column vectors. ` +
          `Work out ${k}a − b.`,
        answer,
        distractors: pickDistractors(answer, [
          point(k * ax + bx, k * ay + by), // added instead of subtracting
          point(k * (ax - bx), k * (ay - by)), // scaled both
          point(ax - bx, ay - by), // forgot the scalar
          point(rx, -ry),
        ]),
        explanation:
          `Multiply each component of a by ${k}: ${point(k * ax, k * ay)}. ` +
          `Then subtract b component by component: ${point(k * ax, k * ay)} − ${point(bx, by)} = ${answer}. ` +
          `The scalar multiplies only a.`,
        check: () => (rx === k * ax - bx && ry === k * ay - by ? null : `components do not recompute`),
      };
    },
  }),

  generator({
    key: "gcse.geometry.vector-magnitude",
    topic: "vectors",
    subtopic: "magnitude",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const [x, y] = rng.pick(TRIPLES).slice(0, 2) as [number, number];
      const sx = rng.sign() * x;
      const sy = rng.sign() * y;
      const magnitude = Math.sqrt(x * x + y * y);
      const answer = String(magnitude);

      return {
        prompt: `Find the magnitude of the vector ${point(sx, sy)}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(Math.abs(sx) + Math.abs(sy)), // added the components
          String(x * x + y * y), // forgot the square root
          String(Math.abs(Math.abs(sx) - Math.abs(sy))),
          toPlaces(magnitude / 2, 2),
        ]),
        explanation:
          `|v| = √(x² + y²) = √(${sx}² + ${sy}²) = √(${x * x} + ${y * y}) = √${x * x + y * y} = ${answer}. ` +
          `Signs disappear when the components are squared, so direction does not affect magnitude.`,
        check: () =>
          Math.abs(magnitude * magnitude - (sx * sx + sy * sy)) < 1e-9 ? null : `magnitude mismatch`,
      };
    },
  }),

  generator({
    key: "gcse.geometry.transformations",
    topic: "transformations",
    subtopic: "reflection",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 22,
    build: (rng) => {
      const x = rng.nonZero(-8, 8);
      const y = rng.nonZero(-8, 8);
      const line = rng.pick(["x-axis", "y-axis", "y = x", "y = -x"] as const);

      const image =
        line === "x-axis"
          ? [x, -y]
          : line === "y-axis"
            ? [-x, y]
            : line === "y = x"
              ? [y, x]
              : [-y, -x];
      const answer = point(image[0], image[1]);

      return {
        prompt: `The point ${point(x, y)} is reflected in the line ${line}. Where does it end up?`,
        answer,
        distractors: pickDistractors(answer, [
          point(-image[0], -image[1]),
          point(image[1], image[0]),
          point(x, y), // did not move it
          point(-x, -y),
          point(x, -y),
          point(-x, y),
          point(y, x),
          point(-y, -x),
        ]),
        explanation:
          line === "x-axis"
            ? `Reflecting in the x-axis leaves x alone and negates y: ${point(x, y)} → ${answer}.`
            : line === "y-axis"
              ? `Reflecting in the y-axis negates x and leaves y alone: ${point(x, y)} → ${answer}.`
              : line === "y = x"
                ? `Reflecting in y = x swaps the coordinates: ${point(x, y)} → ${answer}.`
                : `Reflecting in y = −x swaps the coordinates and negates both: ${point(x, y)} → ${answer}.`,
        check: () => {
          /* Reflecting twice must return the original point. */
          const back =
            line === "x-axis"
              ? [image[0], -image[1]]
              : line === "y-axis"
                ? [-image[0], image[1]]
                : line === "y = x"
                  ? [image[1], image[0]]
                  : [-image[1], -image[0]];
          return back[0] === x && back[1] === y ? null : `double reflection did not return the point`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.surd-pythagoras",
    topic: "surds",
    subtopic: "surd-arithmetic",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 20,
    build: (rng) => {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const sum = a * a + b * b;
      const simplified = simplifySurd(sum);
      const answer = `${surdToString(simplified)} cm`;

      return {
        prompt:
          `A right-angled triangle has shorter sides ${a} cm and ${b} cm. ` +
          `Give the hypotenuse as a surd in its simplest form.`,
        answer,
        distractors: pickDistractors(answer, [
          `√${sum} cm`, // correct value, not simplified
          `${a + b} cm`,
          `${surdToString(simplifySurd(a * a + b * b + 1))} cm`,
          `${surdToString({ coefficient: simplified.coefficient + 1, radicand: simplified.radicand })} cm`,
        ]),
        explanation:
          `c² = ${a}² + ${b}² = ${sum}, so c = √${sum}` +
          (simplified.radicand === sum
            ? `, which has no square factors to take out.`
            : ` = ${surdToString(simplified)}, taking out the factor ${simplified.coefficient}² = ${simplified.coefficient ** 2}.`),
        check: () => {
          const value = simplified.coefficient * Math.sqrt(simplified.radicand);
          return Math.abs(value * value - sum) < 1e-9 ? null : `surd does not square back to ${sum}`;
        },
      };
    },
  }),

  generator({
    key: "gcse.geometry.area-volume",
    topic: "geometry",
    subtopic: "area-volume",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 22,
    build: (rng) => {
      const shape = rng.pick(["cylinder", "cone", "sphere", "prism"] as const);
      const r = rng.int(2, 12);
      const h = rng.int(3, 20);

      /* π stays in the answer, so the arithmetic is a whole-number coefficient
         rather than three decimal places of typing. The prism, which has no π,
         keeps a plain number. */
      const round = shape === "sphere" ? rng.pick([3, 6, 9, 12]) : r;
      const coefficient =
        shape === "cylinder"
          ? rat(round * round * h)
          : shape === "cone"
            ? rat(round * round * h, 3)
            : shape === "sphere"
              ? rat(4 * round ** 3, 3)
              : rat(0);

      const volume = shape === "prism" ? 0.5 * r * h * (r + 2) : coefficient.toNumber() * Math.PI;
      const answer =
        shape === "prism" ? `${volume} cm³` : `${coefficient.toString() === "1" ? "" : coefficient}π cm³`;
      const withPi = (value: import("./rational").Rational) =>
        `${value.toString() === "1" ? "" : value}π cm³`;

      const prompt =
        shape === "cylinder"
          ? `Find the volume of a cylinder with radius ${round} cm and height ${h} cm, in terms of π.`
          : shape === "cone"
            ? `Find the volume of a cone with base radius ${round} cm and height ${h} cm, in terms of π.`
            : shape === "sphere"
              ? `Find the volume of a sphere with radius ${round} cm, in terms of π.`
              : `A triangular prism has a cross-section of base ${r} cm and height ${h} cm, and a length of ${r + 2} cm. Find its volume.`;

      const distractors =
        shape === "cylinder"
          ? [withPi(rat(round * round * h, 3)), withPi(rat(2 * round * h)), withPi(rat(round * h))]
          : shape === "cone"
            ? [withPi(rat(round * round * h)), withPi(rat(round * h, 3)), withPi(coefficient.mul(rat(2)))]
            : shape === "sphere"
              ? [withPi(rat(4 * round * round)), withPi(rat(4 * round * round, 3)), withPi(coefficient.div(rat(2)))]
              : [`${r * h * (r + 2)} cm³`, `${0.5 * r * h} cm³`, `${volume * 2} cm³`];

      return {
        prompt,
        answer,
        distractors: pickDistractors(answer, distractors),
        explanation:
          shape === "cylinder"
            ? `V = πr²h = π × ${round}² × ${h} = ${answer}.`
            : shape === "cone"
              ? `V = ⅓πr²h = ⅓ × π × ${round}² × ${h} = ${answer}. The third is what separates a cone from a cylinder.`
              : shape === "sphere"
                ? `V = ⁴⁄₃πr³ = ⁴⁄₃ × π × ${round}³ = ${answer}. Note r cubed — 4πr² is the surface area.`
                : `Cross-sectional area = ½ × ${r} × ${h} = ${0.5 * r * h} cm², and volume = area × length = ${answer}.`,
        check: () => (volume > 0 ? null : `non-positive volume`),
      };
    },
  }),
];
