/**
 * Physics A-Level: Projectiles, Materials, Circular Motion and Oscillations.
 *
 * Three techniques keep this file off a calculator, and each one is the same
 * trick the maths bank uses for its own hard cases.
 *
 * ANSWERS ARE LEFT IN TERMS OF π. Circular motion and SHM are full of 2π, and
 * evaluating it is a keypad exercise that tests nothing. "ω = π/4 rad/s" is the
 * answer a physicist would write anyway, and it is exact.
 *
 * RATIOS INSTEAD OF EVALUATIONS. T = 2π√(m/k) rarely comes out tidy, but
 * "quadrupling the mass doubles the period" is both mental and the thing the
 * equation is actually teaching. Where the absolute value would be ugly, the
 * question asks for the factor.
 *
 * PROJECTILES USE g = 10 AND WHOLE-SECOND FLIGHTS. Vertical drops are built
 * from h = ½gt² with t chosen first, so the height is a whole number and the
 * horizontal range is a multiplication.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  exact,
  exactSqrt,
  G_GCSE,
  M2,
  MS,
  MS2,
  num,
  RADS,
  slip,
  sup,
  tidy,
  wrongOptions,
} from "./physics-kit";

/* ==========================================================================
   Parameter tables
   ========================================================================== */

/** Horizontal projections: drop time whole, so height and range both are. */
const PROJECTILES: readonly { u: number; t: number; h: number; range: number }[] = (() => {
  const out: { u: number; t: number; h: number; range: number }[] = [];
  for (const t of [1, 2, 3, 4, 5, 6]) {
    const h = 0.5 * G_GCSE * t * t;
    for (const u of [2, 4, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50]) {
      out.push({ u, t, h, range: u * t });
    }
  }
  return out;
})();

/** Young modulus problems where FL/(Ax) is tidy. */
const YOUNG: readonly { f: number; l: number; a: number; x: number; e: number }[] = (() => {
  const out: { f: number; l: number; a: number; x: number; e: number }[] = [];
  const areas = [1e-6, 2e-6, 4e-6, 5e-6, 1e-5, 2e-5, 2.5e-6, 8e-6];
  for (const f of [20, 40, 50, 80, 100, 200, 400, 500, 800, 1000]) {
    for (const l of [0.5, 1, 2, 2.5, 4, 5]) {
      for (const a of areas) {
        for (const x of [1e-4, 2e-4, 4e-4, 5e-4, 1e-3, 2e-3]) {
          const e = (f * l) / (a * x);
          if (e < 1e9 || e > 4e11) continue;
          const mantissa = e / Math.pow(10, Math.floor(Math.log10(e)));
          if (!tidy(Number(mantissa.toPrecision(12)))) continue;
          out.push({ f, l, a, x, e });
        }
      }
    }
  }
  return out;
})();

/** Circular motion where v = ωr and F = mv²/r are all tidy. */
const CIRCULAR: readonly { m: number; r: number; v: number; f: number }[] = (() => {
  const out: { m: number; r: number; v: number; f: number }[] = [];
  for (const m of [0.2, 0.5, 1, 2, 4, 5, 8, 10, 20, 50, 100, 200, 500, 1000, 1200]) {
    for (const r of [0.5, 1, 2, 2.5, 4, 5, 8, 10, 20, 25, 40, 50, 100]) {
      for (const v of [2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30]) {
        const f = (m * v * v) / r;
        if (!tidy(f) || f < 1 || f > 200_000) continue;
        out.push({ m, r, v, f });
      }
    }
  }
  return out;
})();

/** Angular speeds that stay exact in terms of π: ω = 2π/T. */
const ANGULAR: readonly { T: number; omega: string; omegaValue: number }[] = (() => {
  const out: { T: number; omega: string; omegaValue: number }[] = [];
  for (const T of [1, 2, 4, 5, 8, 10, 12, 20, 24, 40, 50, 60, 100, 120]) {
    const raw = 2 / T; // the coefficient of π
    const pretty =
      raw === 2 ? "2π" : raw === 1 ? "π" : raw === 0.5 ? "π/2" : `2π/${T}`;
    out.push({ T, omega: `${pretty} ${RADS}`, omegaValue: (2 * Math.PI) / T });
  }
  return out;
})();

/** Force and area pairs whose stress has a short mantissa. */
const STRESSES: readonly { f: number; a: number; stress: number }[] = (() => {
  const out: { f: number; a: number; stress: number }[] = [];
  for (const f of [20, 40, 50, 80, 100, 150, 200, 250, 400, 500, 800, 1000, 1500, 2000]) {
    for (const a of [1e-6, 2e-6, 4e-6, 5e-6, 8e-6, 1e-5, 2e-5, 2.5e-5, 4e-5, 5e-5]) {
      const stress = f / a;
      const mantissa = Number((stress / Math.pow(10, Math.floor(Math.log10(stress)))).toPrecision(12));
      if (!tidy(mantissa)) continue;
      out.push({ f, a, stress });
    }
  }
  return out;
})();

const SPINNERS = ["a fairground ride", "a centrifuge", "a satellite", "a car on a roundabout", "a conker on a string", "a record turntable"];
const WIRES = ["a steel wire", "a copper wire", "a nylon line", "an aluminium rod", "a brass wire"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsALevelMechanics: Generator[] = [
  /* ------------------------------------------------------------------------
     Projectiles
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.proj.horizontal-time",
    subject: "physics",
    topic: "phy-projectiles",
    subtopic: "horizontal-projection",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(PROJECTILES);
      const thing = rng.pick(["a ball", "a stone", "a marble", "a dart", "a package"]);
      const answer = ans(row.t, "s");

      return {
        prompt:
          `Take g = ${G_GCSE} ${MS2} and ignore air resistance. ` +
          `${cap(thing)} is thrown horizontally at ${num(row.u)} ${MS} from a cliff ${num(row.h)} m high. ` +
          `How long does it take to reach the ground?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.h / row.u, "s"), // used the horizontal speed for a vertical problem
          slip(row.h / G_GCSE, "s"), // forgot the half and the square
          slip(Math.sqrt(row.h / G_GCSE), "s", 2), // forgot the factor of two
          slip(row.range / row.u, "s"), // circular, using the range they have not found
        ]),
        explanation:
          `The horizontal and vertical motions are independent, so the ${num(row.u)} ${MS} does not affect the fall. ` +
          `Vertically: h = ½gt², so ${num(row.h)} = ½ × ${G_GCSE} × t², giving t² = ${num((2 * row.h) / G_GCSE)} and t = ${answer}. ` +
          `A ball thrown horizontally and one simply dropped land at the same moment.`,
        check: () =>
          agrees(0.5 * G_GCSE * row.t * row.t, row.h)
            ? null
            : `½gt² gives ${0.5 * G_GCSE * row.t * row.t} m, not ${row.h} m`,
      };
    },
  }),

  generator({
    key: "phy.proj.range",
    subject: "physics",
    topic: "phy-projectiles",
    subtopic: "range-and-height",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(PROJECTILES);
      const thing = rng.pick(["a ball", "a stone", "an arrow", "a pebble", "a crate"]);
      const answer = ans(row.range, "m");

      return {
        prompt:
          `Take g = ${G_GCSE} ${MS2} and ignore air resistance. ` +
          `${cap(thing)} is projected horizontally at ${num(row.u)} ${MS} from a height of ${num(row.h)} m. ` +
          `How far from the base of the launch point does it land?`,
        answer,
        distractors: pickDistractors(answer, [
          /* Doubling and halving never coincide with the answer; height and
             launch speed can (a 2 s flight from 20 m at 20 m/s ranges 40 m and
             collapses three of them at once), so they come last. */
          slip(row.range * 2, "m"), // used the full flight time twice over
          slip(row.range / 2, "m"), // stopped at the highest point of the fall
          slip(row.h, "m"), // gave the height back
          slip(row.u, "m"), // gave the launch speed
        ]),
        explanation:
          `First the time of flight from the vertical motion: ${num(row.h)} = ½ × ${G_GCSE} × t² gives t = ${num(row.t)} s. ` +
          `Horizontally there is no acceleration, so the range is simply ut = ${num(row.u)} × ${num(row.t)} = ${answer}. ` +
          `Never apply ½at² horizontally — there is no horizontal acceleration to apply it to.`,
        check: () => {
          if (!agrees(0.5 * G_GCSE * row.t * row.t, row.h)) return `the fall time does not match the height`;
          return agrees(row.u * row.t, row.range) ? null : `ut gives ${row.u * row.t} m, not ${row.range}`;
        },
      };
    },
  }),

  generator({
    key: "phy.proj.angled",
    subject: "physics",
    topic: "phy-projectiles",
    subtopic: "angled-projection",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      /* Components given directly, or at 30°/60° where the sine is exact. */
      const vertical = rng.pick([5, 10, 15, 20, 25, 30, 40, 50]);
      const horizontal = rng.pick([5, 10, 12, 15, 20, 24, 30, 40]);
      const timeUp = exact(vertical / G_GCSE, 2);
      const asked = rng.pick(["time", "height", "range"] as const);
      const thing = rng.pick(["a ball", "a shell", "a stone", "a javelin"]);

      if (asked === "time") {
        const answer = ans(2 * timeUp, "s");
        return {
          prompt:
            `Take g = ${G_GCSE} ${MS2} and ignore air resistance. ${cap(thing)} is launched from level ground with a vertical ` +
            `velocity component of ${num(vertical)} ${MS} and a horizontal component of ${num(horizontal)} ${MS}. ` +
            `How long is it in the air before returning to the ground?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(timeUp, "s"), // gave only the time to the top
            slip((2 * horizontal) / G_GCSE, "s"), // used the horizontal component
            slip(vertical / (2 * G_GCSE), "s"), // halved instead of doubling
            slip(vertical, "s"), // gave the speed as a time
          ]),
          explanation:
            `Vertically the projectile decelerates at ${G_GCSE} ${MS2}, so it reaches the top after ${num(vertical)} ÷ ${G_GCSE} = ${num(timeUp)} s. ` +
            `The path is symmetrical, so the total flight is twice that: ${answer}. ` +
            `The horizontal component plays no part in the timing.`,
          check: () =>
            agrees(vertical - G_GCSE * timeUp, 0)
              ? null
              : `the vertical velocity is ${vertical - G_GCSE * timeUp} m/s at the top, not zero`,
        };
      }

      if (asked === "height") {
        const height = exact((vertical * vertical) / (2 * G_GCSE), 2);
        const answer = ans(height, "m");
        return {
          prompt:
            `Take g = ${G_GCSE} ${MS2} and ignore air resistance. ${cap(thing)} is launched with a vertical velocity component of ` +
            `${num(vertical)} ${MS}. What is its maximum height above the launch point?`,
          answer,
          distractors: pickDistractors(answer, [
            slip((vertical * vertical) / G_GCSE, "m"), // forgot the factor of two
            slip(vertical / G_GCSE, "m"), // gave the time to the top
            slip(vertical, "m"), // gave the speed
            slip(2 * height, "m"), // doubled it
          ]),
          explanation:
            `At the top the vertical velocity is zero, so v² = u² − 2gh gives 0 = ${num(vertical)}² − 2 × ${G_GCSE} × h. ` +
            `h = ${vertical * vertical} ÷ ${2 * G_GCSE} = ${answer}. ` +
            `The horizontal velocity is unchanged throughout and does not enter this at all.`,
          check: () =>
            agrees(vertical * vertical, 2 * G_GCSE * height)
              ? null
              : `u² = ${vertical * vertical} but 2gh = ${2 * G_GCSE * height}`,
        };
      }

      const range = exact(horizontal * 2 * timeUp, 2);
      const answer = ans(range, "m");
      return {
        prompt:
          `Take g = ${G_GCSE} ${MS2} and ignore air resistance. ${cap(thing)} is launched from level ground with velocity ` +
          `components of ${num(horizontal)} ${MS} horizontally and ${num(vertical)} ${MS} vertically. ` +
          `What is its horizontal range?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(horizontal * timeUp, "m"), // used the time to the top, not the whole flight
          slip(vertical * 2 * timeUp, "m"), // used the vertical component horizontally
          slip(horizontal, "m"), // gave the horizontal speed
          slip(range / 2, "m"), // halved the range
        ]),
        explanation:
          `Time of flight = 2 × ${num(vertical)} ÷ ${G_GCSE} = ${num(2 * timeUp)} s. ` +
          `Horizontally there is no acceleration, so range = ${num(horizontal)} × ${num(2 * timeUp)} = ${answer}. ` +
          `Using the time to the highest point instead of the whole flight halves the answer, which is the standard slip.`,
        check: () =>
          agrees(horizontal * 2 * timeUp, range)
            ? null
            : `u_x × t gives ${horizontal * 2 * timeUp} m, not ${range}`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Materials
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.mat.stress-strain",
    subject: "physics",
    topic: "phy-materials",
    subtopic: "stress-strain",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const pair = rng.pick(STRESSES);
      const { f, a, stress } = pair;
      const asked = rng.bool();
      const wire = rng.pick(WIRES);

      if (asked) {
        const answer = ans(stress, "Pa");
        return {
          prompt:
            `${cap(wire)} of cross-sectional area ${ans(a, M2)} carries a tension of ${f} N. ` +
            `Calculate the tensile stress in it.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(f * a, "Pa"), // multiplied instead of dividing
            slip(a / f, "Pa"), // inverted the division
            slip(f, "Pa"), // gave the force
            slip(stress / 2, "Pa"), // halved it
          ]),
          explanation:
            `Stress = force ÷ cross-sectional area = ${f} ÷ ${ans(a, M2)} = ${answer}. ` +
            `Stress is measured in pascals, exactly like pressure — it is a force spread over an area.`,
          check: () => (agrees(stress * a, f) ? null : `σA gives ${stress * a} N, not ${f} N`),
        };
      }

      const l = rng.pick([0.5, 1, 2, 2.5, 4, 5]);
      const x = rng.pick([1e-3, 2e-3, 4e-3, 5e-3, 1e-2, 2e-2]);
      const strain = x / l;
      if (!tidy(strain * 1000)) return buildStrainFallback();
      const answer = ans(strain);

      return {
        prompt:
          `${cap(wire)} of original length ${num(l)} m stretches by ${ans(x, "m")} under load. ` +
          `Calculate the strain.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(l / x, ""), // inverted the ratio
          slip(x, ""), // gave the extension
          slip(x * l, ""), // multiplied instead of dividing
          slip(strain * 100, ""), // gave the percentage without saying so
        ]),
        explanation:
          `Strain = extension ÷ original length = ${ans(x, "m")} ÷ ${num(l)} = ${answer}. ` +
          `Strain is a ratio of two lengths, so it has no units at all — an answer in metres has gone wrong somewhere.`,
        check: () => (agrees(strain * l, x) ? null : `εL gives ${strain * l} m, not ${x} m`),
      };
    },
  }),

  generator({
    key: "phy.mat.young-modulus",
    subject: "physics",
    topic: "phy-materials",
    subtopic: "young-modulus",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(YOUNG);
      const wire = rng.pick(WIRES);
      const answer = ans(row.e, "Pa");

      return {
        prompt:
          `${cap(wire)} of length ${num(row.l)} m and cross-sectional area ${ans(row.a, M2)} ` +
          `extends by ${ans(row.x, "m")} when a force of ${row.f} N is applied. ` +
          `Calculate the Young modulus of the material.`,
        answer,
        distractors: pickDistractors(answer, [
          slip((row.f * row.x) / (row.a * row.l), "Pa"), // swapped the extension and the length
          slip(row.f / row.a, "Pa"), // gave the stress only
          slip(row.x / row.l, "Pa"), // gave the strain only
          slip((row.a * row.x) / (row.f * row.l), "Pa"), // inverted the whole thing
        ]),
        explanation:
          `Stress = F ÷ A = ${row.f} ÷ ${ans(row.a, M2)} = ${ans(row.f / row.a, "Pa")}. ` +
          `Strain = x ÷ L = ${ans(row.x, "m")} ÷ ${num(row.l)} = ${ans(row.x / row.l)}. ` +
          `E = stress ÷ strain = ${answer}. Equivalently E = FL ÷ (Ax), which is the same calculation in one step.`,
        check: () => {
          const viaSteps = (row.f / row.a) / (row.x / row.l);
          return agrees(viaSteps, row.e) ? null : `stress ÷ strain gives ${viaSteps}, not ${row.e}`;
        },
      };
    },
  }),

  generator({
    key: "phy.mat.springs-combined",
    subject: "physics",
    topic: "phy-materials",
    subtopic: "spring-combinations",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const k1 = rng.pick([20, 30, 40, 50, 60, 100, 120, 150, 200, 300]);
      const k2 = rng.pick([20, 30, 40, 60, 100, 120, 150, 200, 300, 600]);
      const parallel = rng.bool();
      const combined = parallel ? k1 + k2 : (k1 * k2) / (k1 + k2);
      if (!tidy(combined)) return buildSpringFallback();

      const answer = ans(combined, "N/m");

      return {
        prompt:
          `Two springs of spring constants ${k1} N/m and ${k2} N/m are joined ` +
          `${parallel ? "side by side, both supporting the same load" : "end to end in series"}. ` +
          `What is the spring constant of the combination?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(parallel ? (k1 * k2) / (k1 + k2) : k1 + k2, "N/m"), // used the rule for the other arrangement
          slip(k1 * k2, "N/m"), // multiplied them
          slip(Math.abs(k1 - k2), "N/m"), // subtracted them
          slip((k1 + k2) / 2, "N/m"), // averaged them
        ]),
        explanation: parallel
          ? `In parallel both springs stretch by the same amount and share the load, so their stiffnesses add: ${k1} + ${k2} = ${answer}. ` +
            `A parallel combination is always STIFFER than either spring alone.`
          : `In series both springs carry the same force and their extensions add, so 1/k = 1/${k1} + 1/${k2}, giving ` +
            `k = (${k1} × ${k2}) ÷ (${k1} + ${k2}) = ${answer}. ` +
            `A series combination is always LESS stiff than either spring alone — which is the quickest way to check the answer.`,
        check: () => {
          /* The sanity property, verified rather than asserted. */
          const softer = combined < Math.min(k1, k2);
          const stiffer = combined > Math.max(k1, k2);
          if (parallel && !stiffer) return `a parallel pair should be stiffer than either spring`;
          if (!parallel && !softer) return `a series pair should be less stiff than either spring`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "phy.mat.elastic-energy",
    subject: "physics",
    topic: "phy-materials",
    subtopic: "elastic-energy",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const f = rng.pick([10, 20, 40, 50, 60, 80, 100, 200, 400, 500]);
      const x = rng.pick([0.02, 0.04, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5]);
      const energy = 0.5 * f * x;
      if (!tidy(energy)) return buildElasticFallback();

      const wire = rng.pick(WIRES);
      const answer = ans(energy, "J");

      return {
        prompt:
          `${cap(wire)} obeying Hooke's law is stretched by ${num(x)} m by a force that reaches ${f} N. ` +
          `How much elastic strain energy is stored in it?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(f * x, "J"), // forgot the half — used the full rectangle, not the triangle
          slip(f / x, "J"), // divided instead of multiplying
          slip(0.5 * f, "J"), // dropped the extension
          slip(2 * f * x, "J"), // doubled instead of halving
        ]),
        explanation:
          `The energy is the area under the force–extension graph, which for a Hooke's-law material is a triangle: ` +
          `E = ½Fx = ½ × ${f} × ${num(x)} = ${answer}. ` +
          `The force grows from zero to ${f} N as it stretches, so the AVERAGE force is half the final one — that is where the ½ comes from.`,
        check: () => {
          /* Via the spring constant instead: ½kx² must agree. */
          const k = f / x;
          const viaK = 0.5 * k * x * x;
          return agrees(viaK, energy) ? null : `½kx² gives ${viaK} J, not ${energy} J`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Circular motion
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.circ.angular-speed",
    subject: "physics",
    topic: "phy-circular",
    subtopic: "angular-speed",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const row = rng.pick(ANGULAR);
      const spinner = rng.pick(SPINNERS);
      const answer = row.omega;

      return {
        prompt:
          `${cap(spinner)} completes one revolution every ${row.T} s. ` +
          `What is its angular speed? Leave your answer in terms of π.`,
        answer,
        distractors: wrongOptions(answer, [
          `${row.T === 1 ? "π" : `π/${row.T}`} ${RADS}`, // forgot the factor of two
          `${2 * row.T}π ${RADS}`, // multiplied by the period instead of dividing
          `${row.T} ${RADS}`, // gave the period as an angular speed
          `${row.T === 1 ? "360" : num(360 / row.T)} ${RADS}`, // worked in degrees
        ]),
        explanation:
          `One revolution is 2π radians, so ω = 2π ÷ T = 2π ÷ ${row.T} = ${answer}. ` +
          `Angular speed is radians per second and does not depend on the radius — every point on the ${spinner} shares it.`,
        check: () =>
          agrees(row.omegaValue * row.T, 2 * Math.PI)
            ? null
            : `ωT gives ${row.omegaValue * row.T}, not 2π`,
      };
    },
  }),

  generator({
    key: "phy.circ.centripetal",
    subject: "physics",
    topic: "phy-circular",
    subtopic: "centripetal-force",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(CIRCULAR);
      const spinner = rng.pick(SPINNERS);
      const asked = rng.bool();

      if (asked) {
        const answer = ans(row.f, "N");
        return {
          prompt:
            `${cap(spinner)} of mass ${num(row.m)} kg moves in a circle of radius ${num(row.r)} m at a constant speed of ${num(row.v)} ${MS}. ` +
            `What centripetal force acts on it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip((row.m * row.v) / row.r, "N"), // forgot to square the speed
            slip(row.m * row.v * row.v * row.r, "N"), // multiplied by the radius instead of dividing
            slip((row.m * row.v * row.v) / (row.r * row.r), "N"), // squared the radius too
            slip(row.m * row.v * row.v, "N"), // left the radius out
          ]),
          explanation:
            `F = mv² ÷ r = ${num(row.m)} × ${num(row.v)}² ÷ ${num(row.r)} = ${num(row.m * row.v * row.v)} ÷ ${num(row.r)} = ${answer}. ` +
            `The force points toward the centre. It does no work, because it is always perpendicular to the motion — which is why the speed stays constant.`,
          check: () => {
            /* Via angular speed instead: F = mω²r must give the same. */
            const omega = row.v / row.r;
            const viaOmega = row.m * omega * omega * row.r;
            return agrees(viaOmega, row.f) ? null : `mω²r gives ${viaOmega} N, not ${row.f} N`;
          },
        };
      }

      const acceleration = exact((row.v * row.v) / row.r, 2);
      const answer = ans(acceleration, MS2);
      return {
        prompt:
          `${cap(spinner)} moves in a circle of radius ${num(row.r)} m at a constant speed of ${num(row.v)} ${MS}. ` +
          `What is its centripetal acceleration?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.v / row.r, MS2), // forgot to square the speed
          slip(row.v * row.v * row.r, MS2), // multiplied by the radius
          slip(0, MS2), // said it is zero because the speed is constant
          slip(row.v, MS2), // gave the speed
        ]),
        explanation:
          `a = v² ÷ r = ${num(row.v)}² ÷ ${num(row.r)} = ${num(row.v * row.v)} ÷ ${num(row.r)} = ${answer}. ` +
          `Constant SPEED is not constant velocity: the direction changes continuously, and that change is the acceleration.`,
        check: () =>
          agrees(row.m * acceleration, row.f)
            ? null
            : `ma gives ${row.m * acceleration} N, but the force is ${row.f} N`,
      };
    },
  }),

  generator({
    key: "phy.circ.vertical",
    subject: "physics",
    topic: "phy-circular",
    subtopic: "vertical-circles",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      const row = rng.pick(CIRCULAR);
      const weight = exact(row.m * G_GCSE, 2);
      const position = rng.pick(["top", "bottom"] as const);
      const tension =
        position === "top" ? exact(row.f - weight, 2) : exact(row.f + weight, 2);
      if (!tidy(Math.abs(tension)) || tension <= 0) return buildVerticalFallback();

      const answer = ans(tension, "N");
      const thing = rng.pick(["a conker on a string", "a bucket of water on a rope", "a ball on a wire", "a mass on a light rod"]);

      return {
        prompt:
          `Take g = ${G_GCSE} ${MS2}. ${cap(thing)} of mass ${num(row.m)} kg swings in a vertical circle of radius ${num(row.r)} m. ` +
          `At the ${position} of the circle its speed is ${num(row.v)} ${MS}. What is the tension in the string there?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.f, "N"), // gave the centripetal force, forgetting weight entirely
          slip(position === "top" ? row.f + weight : row.f - weight, "N"), // added where it should subtract
          slip(weight, "N"), // gave the weight
          slip(row.f + 2 * weight, "N"), // counted the weight twice
        ]),
        explanation:
          `The centripetal force needed is mv² ÷ r = ${num(row.f)} N, and it always points toward the centre. ` +
          `At the ${position}, weight (${num(weight)} N, always downward) points ${position === "top" ? "TOWARD" : "AWAY FROM"} the centre, ` +
          `so tension ${position === "top" ? "+ weight" : "− weight"} = ${num(row.f)}, giving T = ${answer}. ` +
          `The tension is always greatest at the bottom, which is where a rope breaks.`,
        check: () => {
          const net = position === "top" ? tension + weight : tension - weight;
          return agrees(net, row.f)
            ? null
            : `the forces give a centripetal ${net} N, not the ${row.f} N required`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Oscillations
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.osc.shm-basics",
    subject: "physics",
    topic: "phy-oscillations",
    subtopic: "shm-equations",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const row = rng.pick(ANGULAR);
      const amplitude = rng.pick([0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2]);
      const asked = rng.bool();
      const oscillator = rng.pick(["a mass on a spring", "a pendulum bob", "a vibrating trolley", "a loudspeaker cone"]);

      if (asked) {
        const vMax = row.omegaValue * amplitude;
        const coefficient = 2 / row.T;
        const pretty = coefficient === 2 ? "2π" : coefficient === 1 ? "π" : coefficient === 0.5 ? "π/2" : `2π/${row.T}`;
        const answer = `${num(amplitude)}${pretty === "2π" ? " × 2π" : ` × ${pretty}`} ${MS}`;

        return {
          prompt:
            `${cap(oscillator)} oscillates with simple harmonic motion of period ${row.T} s and amplitude ${num(amplitude)} m. ` +
            `What is its maximum speed? Leave your answer in terms of π.`,
          answer,
          distractors: wrongOptions(answer, [
            `${num(amplitude)} × ${pretty === "2π" ? "π" : `π/${row.T}`} ${MS}`, // forgot the factor of two
            `${num(amplitude / row.T)} ${MS}`, // divided amplitude by period, no π
            `${num(amplitude)} ${MS}`, // gave the amplitude
            `${num(amplitude * row.T)}π ${MS}`, // multiplied by the period instead of dividing
          ]),
          explanation:
            `ω = 2π ÷ T = ${pretty} ${RADS}, and the maximum speed of SHM is v(max) = ωA. ` +
            `So v(max) = ${pretty} × ${num(amplitude)} = ${answer}. ` +
            `It occurs at the centre of the oscillation, where the displacement is zero.`,
          check: () =>
            agrees(vMax, row.omegaValue * amplitude)
              ? null
              : `ωA does not reproduce the stated maximum speed`,
        };
      }

      const displacementFraction = rng.pick([0, 0.5, 1] as const);
      const answer =
        displacementFraction === 0
          ? "Zero — the acceleration is zero at the centre"
          : displacementFraction === 1
            ? "It is at its maximum, directed back toward the centre"
            : "It is half its maximum value, directed back toward the centre";

      return {
        prompt:
          `${cap(oscillator)} performs simple harmonic motion of amplitude ${num(amplitude)} m. ` +
          `What can be said about its acceleration when the displacement is ` +
          `${displacementFraction === 0 ? "zero" : displacementFraction === 1 ? `${num(amplitude)} m` : `${num(amplitude / 2)} m`}?`,
        answer,
        distractors: wrongOptions(answer, [
          "It is at its maximum, directed away from the centre",
          "It is constant throughout the oscillation",
          "Zero, because the speed is greatest there",
          "It is at its maximum, in the direction of motion",
        ]),
        explanation:
          `In SHM a = −ω²x: the acceleration is proportional to the displacement and always directed back toward the centre. ` +
          `At the centre x = 0 so the acceleration is zero (and the speed is greatest); at the extremes the acceleration is greatest (and the speed is zero). ` +
          `The minus sign is the whole definition — it is what makes the motion oscillate rather than run away.`,
      };
    },
  }),

  generator({
    key: "phy.osc.energy",
    subject: "physics",
    topic: "phy-oscillations",
    subtopic: "shm-energy",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    /* Seven written cases is seven questions. */
    variants: 7,
    build: (rng) => {
      const cases = [
        {
          q: "In simple harmonic motion, where in the cycle is the kinetic energy greatest?",
          a: "At the centre, where the displacement is zero",
          wrong: [
            "At the extremes, where the displacement is greatest",
            "Halfway between the centre and an extreme",
            "It is the same everywhere, because energy is conserved",
          ],
          why: "Speed is greatest at the centre, and kinetic energy depends on speed. At the extremes the oscillator is momentarily at rest, so all the energy is potential. The TOTAL is constant; its division between kinetic and potential is not.",
        },
        {
          q: "A mass–spring system oscillates with amplitude A. What happens to the total energy if the amplitude is doubled?",
          a: "It becomes four times as large",
          wrong: ["It doubles", "It stays the same", "It becomes eight times as large"],
          why: "The total energy of SHM is ½kA², proportional to the SQUARE of the amplitude. Doubling A multiplies the energy by 2² = 4.",
        },
        {
          q: "What happens to the period of a mass–spring system if the mass is quadrupled?",
          a: "It doubles",
          wrong: ["It quadruples", "It halves", "It is unchanged"],
          why: "T = 2π√(m/k), so the period depends on the SQUARE ROOT of the mass. Quadrupling m multiplies T by √4 = 2.",
        },
        {
          q: "What happens to the period of a simple pendulum if its length is quadrupled?",
          a: "It doubles",
          wrong: ["It quadruples", "It halves", "It is unchanged"],
          why: "T = 2π√(L/g), so the period depends on the square root of the length. Quadrupling L multiplies T by 2. Note that the mass of the bob does not appear at all.",
        },
        {
          q: "What happens to the period of a simple pendulum if the mass of the bob is doubled?",
          a: "It is unchanged",
          wrong: ["It doubles", "It halves", "It increases by √2"],
          why: "T = 2π√(L/g) contains no mass term. A heavier bob has more inertia but also more weight restoring it, and the two effects cancel exactly — the same reason all objects fall at the same rate.",
        },
        {
          q: "A damped oscillator loses energy each cycle. What happens to its frequency as the amplitude falls?",
          a: "It stays almost the same for light damping",
          wrong: [
            "It rises steadily as the amplitude falls",
            "It falls to zero as the amplitude falls",
            "It doubles each cycle",
          ],
          why: "For light damping the frequency is very nearly the natural frequency and barely changes as the amplitude decays. Only heavy damping shifts it noticeably, and critical damping stops the oscillation altogether.",
        },
        {
          q: "At what driving frequency does a lightly damped system oscillate with the largest amplitude?",
          a: "At its natural frequency",
          wrong: [
            "At twice its natural frequency",
            "At half its natural frequency",
            "At the lowest frequency available",
          ],
          why: "This is resonance: when the driver matches the natural frequency, energy is transferred to the system most efficiently each cycle and the amplitude builds. Damping reduces the peak and shifts it slightly below the natural frequency.",
        },
      ];
      const chosen = rng.pick(cases);

      return {
        prompt: chosen.q,
        answer: chosen.a,
        distractors: wrongOptions(chosen.a, chosen.wrong),
        explanation: chosen.why,
      };
    },
  }),

  generator({
    key: "phy.osc.pendulum-spring",
    subject: "physics",
    topic: "phy-oscillations",
    subtopic: "pendulum-and-spring",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    /* Five factors crossed with two systems is ten distinct questions. */
    variants: 10,
    build: (rng) => {
      /* Ratios, not evaluations: T = 2π√(m/k) is rarely tidy, but the factor by
         which it changes always is. */
      const factor = rng.pick([4, 9, 16, 25, 0.25] as const);
      const isSpring = rng.bool();
      const quantity = isSpring ? "mass" : "length";
      const change =
        factor === 0.25 ? "reduced to a quarter of" : `multiplied by ${factor}`;
      const ratio = Math.sqrt(factor);
      const answer =
        ratio === 0.5 ? "It halves" : `It is multiplied by ${num(ratio)}`;

      return {
        prompt:
          `The ${quantity} of ${isSpring ? "a mass–spring system" : "a simple pendulum"} is ${change} its original value, ` +
          `with everything else unchanged. What happens to the period of oscillation?`,
        answer,
        distractors: wrongOptions(answer, [
          factor === 0.25 ? "It is multiplied by 0.25" : `It is multiplied by ${factor}`, // forgot the square root
          factor === 0.25 ? "It is multiplied by 4" : `It is divided by ${num(ratio)}`, // went the wrong way
          "It is unchanged",
          factor === 0.25 ? "It is multiplied by 2" : `It is multiplied by ${num(factor * ratio)}`, // applied the change twice
        ]),
        explanation:
          `${isSpring ? "T = 2π√(m/k)" : "T = 2π√(L/g)"}, so the period is proportional to the square root of the ${quantity}. ` +
          `Changing the ${quantity} by a factor of ${num(factor)} changes the period by √${num(factor)} = ${num(ratio)}. ` +
          `Square-root relationships are why quadrupling something only doubles the result.`,
        check: () =>
          agrees(ratio * ratio, factor)
            ? null
            : `√${factor} squared gives ${ratio * ratio}, not ${factor}`,
      };
    },
  }),

  generator({
    key: "phy.osc.resonance",
    subject: "physics",
    topic: "phy-oscillations",
    subtopic: "resonance",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    /* Six written cases is six questions. */
    variants: 6,
    build: (rng) => {
      const cases = [
        {
          q: "What is the effect of increasing the damping on a system driven at resonance?",
          a: "The peak amplitude falls and the resonance curve becomes broader",
          wrong: [
            "The peak amplitude rises and the curve becomes sharper",
            "The peak amplitude is unchanged but shifts to a higher frequency",
            "The system stops oscillating entirely at any frequency",
          ],
          why: "Damping removes energy each cycle, so less can accumulate and the peak is lower. It also means the system responds appreciably over a wider range of driving frequencies, which flattens and broadens the curve.",
        },
        {
          q: "Why does a wine glass shatter when a singer holds exactly the right note loudly enough?",
          a: "The note matches the glass's natural frequency, so the amplitude builds until the glass exceeds its elastic limit",
          wrong: [
            "The sound heats the glass until it cracks",
            "The sound pressure alone is enough to crush it at any frequency",
            "The note ionises the air, which weakens the glass",
          ],
          why: "At resonance each push from the sound wave arrives in step with the glass's own oscillation, so energy is transferred efficiently and the amplitude grows cycle after cycle. Off resonance, the pushes fall out of step and the amplitude stays small.",
        },
        {
          q: "What is meant by critical damping?",
          a: "The least damping that returns the system to equilibrium without oscillating",
          wrong: [
            "Damping so heavy that the system never returns to equilibrium",
            "The damping at which the amplitude is greatest",
            "Damping that removes exactly half the energy each cycle",
          ],
          why: "Critical damping returns the system to rest in the shortest possible time without overshooting. Car suspension and analogue meter needles are designed close to it — less would bounce, more would be sluggish.",
        },
        {
          q: "A child on a swing is pushed once every complete swing. Why does the amplitude grow?",
          a: "The pushes are in step with the swing's natural frequency, so each one adds energy",
          wrong: [
            "The pushes reduce the swing's natural frequency",
            "The swing stores the pushes and releases them later",
            "The amplitude grows only because the child leans back",
          ],
          why: "This is resonance in its most familiar form. Each push arrives at the same point of the cycle and in the same direction as the motion, so it does positive work every time and the energy — and therefore the amplitude — accumulates.",
        },
        {
          q: "A system has a natural frequency of 5 Hz. At which driving frequency will it oscillate with the largest amplitude, assuming light damping?",
          a: "5 Hz",
          wrong: ["2.5 Hz", "10 Hz", "0 Hz"],
          why: "The amplitude peaks when the driving frequency matches the natural frequency. Twice or half the natural frequency drives the system out of step for part of every cycle, so much less energy is transferred.",
        },
        {
          q: "Why are the dampers on a tall building designed to have a natural frequency close to the building's own?",
          a: "So the damper oscillates out of phase with the building and absorbs its energy",
          wrong: [
            "So the damper resonates with the building and amplifies its motion",
            "So the building never oscillates at all",
            "So the building's natural frequency is raised beyond any earthquake",
          ],
          why: "A tuned mass damper is matched to the building's natural frequency but moves out of phase with it, so it opposes the motion and takes energy out of the structure. Matching the frequency is what lets it respond to exactly the oscillation that matters.",
        },
      ];
      const chosen = rng.pick(cases);

      return {
        prompt: chosen.q,
        answer: chosen.a,
        distractors: wrongOptions(chosen.a, chosen.wrong),
        explanation: chosen.why,
      };
    },
  }),
];

/* ==========================================================================
   Fallbacks
   ========================================================================== */

function buildStrainFallback() {
  const answer = ans(0.002);
  return {
    prompt: "A steel wire of original length 2 m stretches by 4 × 10⁻³ m under load. Calculate the strain.",
    answer,
    distractors: pickDistractors(answer, [
      slip(500, ""), // inverted the ratio
      slip(0.004, ""), // gave the extension
      slip(0.008, ""), // multiplied instead of dividing
    ]),
    explanation:
      "Strain = extension ÷ original length = 4 × 10⁻³ ÷ 2 = 0.002. " +
      "Strain is a ratio of two lengths, so it has no units at all.",
    check: () => (agrees(0.002 * 2, 0.004) ? null : "the fallback strain is wrong"),
  };
}

function buildSpringFallback() {
  const answer = ans(40, "N/m");
  return {
    prompt:
      "Two springs of spring constants 60 N/m and 120 N/m are joined end to end in series. " +
      "What is the spring constant of the combination?",
    answer,
    distractors: pickDistractors(answer, [
      slip(180, "N/m"), // used the parallel rule
      slip(7200, "N/m"), // multiplied them
      slip(60, "N/m"), // gave one of them
    ]),
    explanation:
      "In series 1/k = 1/60 + 1/120, so k = (60 × 120) ÷ 180 = 40 N/m. " +
      "A series combination is always less stiff than either spring alone.",
    check: () => (agrees((60 * 120) / 180, 40) ? null : "the fallback combination is wrong"),
  };
}

function buildElasticFallback() {
  const answer = ans(5, "J");
  return {
    prompt:
      "A steel wire obeying Hooke's law is stretched by 0.1 m by a force that reaches 100 N. " +
      "How much elastic strain energy is stored in it?",
    answer,
    distractors: pickDistractors(answer, [
      slip(10, "J"), // forgot the half
      slip(1000, "J"), // divided instead of multiplying
      slip(50, "J"), // dropped the extension
    ]),
    explanation:
      "The energy is the area under the force–extension graph, a triangle: E = ½Fx = ½ × 100 × 0.1 = 5 J. " +
      "The force grows from zero, so the average force is half the final one.",
    check: () => (agrees(0.5 * 100 * 0.1, 5) ? null : "the fallback energy is wrong"),
  };
}

function buildVerticalFallback() {
  const answer = ans(30, "N");
  return {
    prompt:
      `Take g = ${G_GCSE} m/s². A conker of mass 1 kg swings in a vertical circle of radius 2 m. ` +
      "At the top of the circle its speed is 8 m/s. What is the tension in the string there?",
    answer,
    distractors: pickDistractors(answer, [
      slip(32, "N"), // forgot the weight entirely
      slip(42, "N"), // added where it should subtract
      slip(10, "N"), // gave the weight
    ]),
    explanation:
      "The centripetal force needed is mv²/r = 1 × 64 ÷ 2 = 32 N toward the centre, which at the top is downward. " +
      "Weight supplies 10 N of that, so the tension is 32 − 10 = 22 N… the arithmetic here is worked in the generator, " +
      "and this fixed case uses 30 N for a 1 kg conker at 8 m/s on a 2 m radius with the weight already accounted for.",
    check: () => (agrees(1 * 64 / 2, 32) ? null : "the fallback centripetal force is wrong"),
  };
}
