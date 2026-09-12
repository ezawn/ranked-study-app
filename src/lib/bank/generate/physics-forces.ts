/**
 * Physics: Forces, and the rest of Motion.
 *
 * Continues `physics-motion.ts` under the same discipline: the answer is chosen
 * first and the parameters are built around it, so `exact()` fires at build
 * time if a generator ever picks numbers that do not divide. A question whose
 * answer is 1.714285… never reaches a student because it never survives the
 * harness.
 *
 * Two conventions run through the file.
 *
 * CONSTANTS ARE QUOTED — "take g = 10 N/kg". Boards use 9.8, 9.81 and 10, and a
 * student who used a different one is not wrong. Saying which removes the
 * argument and keeps the arithmetic mental.
 *
 * GRAPHS ARE DESCRIBED IN WORDS, by their endpoints. The bank holds no images,
 * and a distance–time graph given as "a straight line from (2 s, 10 m) to
 * (8 s, 40 m)" asks for the same gradient a drawn one would.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  exact,
  exactDiv,
  exactSqrt,
  G_GCSE,
  M2,
  MS,
  MS2,
  NM,
  num,
  OBJECTS,
  qty,
  slip,
  tidy,
  VEHICLES,
  MOVERS,
  FALLERS,
} from "./physics-kit";

/* ==========================================================================
   Parameter tables
   ========================================================================== */

/** Spring constants and extensions whose force is a whole number of newtons. */
const SPRINGS: readonly { k: number; x: number; f: number }[] = (() => {
  const out: { k: number; x: number; f: number }[] = [];
  for (const k of [10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 400, 500]) {
    for (const cm of [2, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30, 40, 50]) {
      const x = cm / 100;
      const f = k * x;
      if (!tidy(f) || f < 0.5 || f > 200) continue;
      out.push({ k, x, f });
    }
  }
  return out;
})();

/** Mass, acceleration and force triples, all whole or half numbers. */
const NEWTON2: readonly { m: number; a: number; f: number }[] = (() => {
  const out: { m: number; a: number; f: number }[] = [];
  const masses = [0.5, 2, 4, 5, 8, 10, 12, 15, 20, 25, 40, 50, 60, 75, 80, 100, 200, 250, 400, 500, 800, 1000, 1200, 1500];
  const accels = [0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20];
  for (const m of masses) {
    for (const a of accels) {
      const f = m * a;
      if (!tidy(f) || f < 1 || f > 12000) continue;
      out.push({ m, a, f });
    }
  }
  return out;
})();

/** Moments: a pivot with two whole-number distances and forces that balance. */
const BALANCES: readonly { f1: number; d1: number; f2: number; d2: number }[] = (() => {
  const out: { f1: number; d1: number; f2: number; d2: number }[] = [];
  for (const moment of [12, 18, 24, 30, 36, 40, 48, 60, 72, 80, 90, 96, 120, 144, 150, 180, 200, 240, 300, 360]) {
    for (const d1 of [0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]) {
      for (const d2 of [0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]) {
        if (d1 === d2) continue;
        const f1 = moment / d1;
        const f2 = moment / d2;
        if (!tidy(f1) || !tidy(f2)) continue;
        if (f1 < 2 || f1 > 900 || f2 < 2 || f2 > 900) continue;
        out.push({ f1, d1, f2, d2 });
      }
    }
  }
  return out;
})();

/** Pressures whose force and area are both tidy. */
const PRESSURES: readonly { f: number; a: number; p: number }[] = (() => {
  const out: { f: number; a: number; p: number }[] = [];
  const areas = [0.02, 0.04, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.25, 2, 2.5, 4, 5];
  for (const a of areas) {
    for (const p of [50, 80, 100, 150, 200, 250, 400, 500, 600, 800, 1000, 1500, 2000, 2500, 4000, 5000]) {
      const f = p * a;
      if (!tidy(f) || f < 5 || f > 20000) continue;
      out.push({ f, a, p });
    }
  }
  return out;
})();

/**
 * u, v, a and s that satisfy v² = u² + 2as with every value tidy.
 *
 * Enumerated rather than sampled: the constraint is tight enough that random
 * picks fail more often than they succeed, and a table makes the failure
 * impossible rather than merely unlikely.
 */
const SUVAT_V2: readonly { u: number; v: number; a: number; s: number }[] = (() => {
  const out: { u: number; v: number; a: number; s: number }[] = [];
  for (const u of [0, 2, 3, 4, 5, 6, 8, 10, 12, 15]) {
    for (const v of [4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30, 40]) {
      if (v <= u) continue;
      for (const a of [0.5, 1, 2, 2.5, 4, 5, 8, 10]) {
        const s = (v * v - u * u) / (2 * a);
        if (!tidy(s) || s < 1 || s > 500) continue;
        out.push({ u, v, a, s });
      }
    }
  }
  return out;
})();

const SURFACES = ["a rough bench", "a level road", "an icy path", "a carpeted floor", "a workshop table", "a concrete ramp"];
const SPRING_THINGS = ["a spring", "an elastic cord", "a steel spring", "a rubber band", "a bungee cord", "a helical spring"];
const LEVERS = ["a see-saw", "a metre rule balanced at its centre", "a light plank on a pivot", "a crowbar", "a beam balance"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsForces: Generator[] = [
  /* ------------------------------------------------------------------------
     Motion: the two subtopics physics-motion.ts does not cover
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.motion.dt-gradient",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "distance-time-graphs",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      /* Built from the speed: pick it, pick a time interval, and the distances
         follow. The gradient the student measures is the speed chosen here. */
      const speed = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]);
      const t1 = rng.int(0, 6);
      const dt = rng.pick([2, 3, 4, 5, 6, 8, 10]);
      const t2 = t1 + dt;
      const d1 = rng.pick([0, 5, 10, 20, 30, 40]);
      const d2 = d1 + speed * dt;
      const mover = rng.pick(MOVERS);
      const answer = ans(speed, MS);

      return {
        prompt:
          `A distance–time graph for a ${mover} is a straight line from ` +
          `(${t1} s, ${d1} m) to (${t2} s, ${d2} m). What is its speed?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(d2 / t2, MS), // read one point off the graph instead of the gradient
          slip(dt / (d2 - d1), MS), // inverted the gradient
          slip(d2 - d1, MS), // gave the distance travelled, not the speed
          slip(speed * 2, MS), // doubled it, as if the line were twice as steep
        ]),
        explanation:
          `The gradient of a distance–time graph is speed. ` +
          `Speed = (${d2} − ${d1}) ÷ (${t2} − ${t1}) = ${d2 - d1} ÷ ${dt} = ${answer}. ` +
          `Reading a single point off the graph gives distance over total time, which is only the same when the line starts at the origin.`,
        check: () => {
          /* Travel the line the other way: at the stated speed, the time to
             cover the gap must be the interval given. */
          const impliedTime = (d2 - d1) / speed;
          return agrees(impliedTime, dt) ? null : `${speed} m/s covers the gap in ${impliedTime} s, not ${dt} s`;
        },
      };
    },
  }),

  generator({
    key: "phy.motion.dt-stationary",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "distance-time-graphs",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      /* Three legs: move, stop, move. The average speed over the whole journey
         is the total distance over the total time, which is the mark students
         miss by averaging the two moving speeds instead. */
      const v1 = rng.pick([2, 4, 5, 6, 8, 10]);
      const t1 = rng.pick([2, 4, 5, 6, 10]);
      const stop = rng.pick([2, 3, 4, 5, 6, 10]);
      const v2 = rng.pick([2, 3, 4, 5, 6, 12, 15]);
      const t2 = rng.pick([2, 4, 5, 6, 10]);

      const d1 = v1 * t1;
      const d2 = v2 * t2;
      const total = d1 + d2;
      const totalTime = t1 + stop + t2;
      if (!tidy(total / totalTime)) {
        /* Fall back to a pair that always divides. */
        const answer = ans(5, MS);
        return {
          prompt:
            `A cyclist rides 60 m in 6 s, rests for 4 s, then rides a further 40 m in 10 s. ` +
            `What is the average speed for the whole journey?`,
          answer,
          distractors: pickDistractors(answer, [
            slip((10 + 4) / 2, MS), // averaged the two speeds
            slip(100 / 16, MS, 2), // forgot the rest counts as time
            slip(100 / 4, MS), // divided by the rest only
          ]),
          explanation:
            `Average speed = total distance ÷ total time = (60 + 40) ÷ (6 + 4 + 10) = 100 ÷ 20 = ${answer}. ` +
            `The 4 s at rest still counts as time, which is why averaging the two riding speeds gives the wrong answer.`,
          check: () => (agrees(100 / 20, 5) ? null : "the fallback journey no longer averages 5 m/s"),
        };
      }

      const average = total / totalTime;
      const answer = ans(average, MS);
      const mover = rng.pick(MOVERS);

      return {
        prompt:
          `${cap(mover)} travels ${d1} m in ${t1} s, stops for ${stop} s, then travels a further ${d2} m in ${t2} s. ` +
          `What is the average speed for the whole journey?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((v1 + v2) / 2, MS), // averaged the two speeds instead of the journey
          slip(total / (t1 + t2), MS), // left the stopped time out
          slip(total, MS), // gave the distance
          slip(v1, MS), // gave the first leg's speed
        ]),
        explanation:
          `Average speed = total distance ÷ total time = (${d1} + ${d2}) ÷ (${t1} + ${stop} + ${t2}) = ${total} ÷ ${totalTime} = ${answer}. ` +
          `The ${stop} s at rest is still time on the clock, so it belongs in the denominator.`,
        check: () => {
          const viaTotals = total / totalTime;
          return agrees(viaTotals, average) ? null : `totals give ${viaTotals} m/s, not ${average}`;
        },
      };
    },
  }),

  generator({
    key: "phy.motion.suvat-v2",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "equations-of-motion",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* Built backwards from BOTH speeds.
         Choosing u, a and s and taking the square root at the end is how this
         first went wrong: u = 2, a = 5, s = 16 gives v = √164 = 12.806…, a
         keypad answer. Picking u and v as whole numbers first and solving for
         the distance means the root is a whole number by construction. */
      const row = rng.pick(SUVAT_V2);
      const { u, v, a, s } = row;
      const vSquared = u * u + 2 * a * s;
      const answer = ans(v, MS);
      const mover = rng.pick(VEHICLES);

      return {
        prompt:
          `${cap(mover)} moving at ${u} ${MS} accelerates uniformly at ${num(a)} ${MS2} over ${s} m. ` +
          `Use v² = u² + 2as to find its final speed.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(u + a * s, MS), // used v = u + at with the distance as a time
          slip(vSquared, MS), // gave v² and forgot the square root
          slip(Math.sqrt(2 * a * s), MS, 1), // dropped the u² term
          slip(u + 2 * a * s, MS), // forgot to square anything
        ]),
        explanation:
          `v² = u² + 2as = ${u}² + 2 × ${num(a)} × ${s} = ${u * u} + ${2 * a * s} = ${vSquared}. ` +
          `So v = √${vSquared} = ${answer}.`,
        check: () => {
          /* Back through the other suvat route: the time to reach v, then the
             distance from average velocity, must return s. */
          if (a === 0) return "zero acceleration";
          const t = (v - u) / a;
          const viaAverage = ((u + v) / 2) * t;
          return agrees(viaAverage, s) ? null : `average velocity gives ${viaAverage} m, not ${s} m`;
        },
      };
    },
  }),

  generator({
    key: "phy.motion.suvat-distance",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "equations-of-motion",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* s = ut + ½at², with a and t chosen so the half never leaves a fraction. */
      const u = rng.pick([0, 2, 4, 5, 6, 8, 10, 15, 20]);
      const a = rng.pick([2, 4, 6, 8, 10, 1, 3, 5]);
      const t = rng.pick([2, 3, 4, 5, 6, 8, 10]);
      const s = exact(u * t + 0.5 * a * t * t, 2);
      const answer = ans(s, "m");
      const mover = rng.pick(VEHICLES);

      return {
        prompt:
          `${cap(mover)} travelling at ${u} ${MS} accelerates uniformly at ${a} ${MS2} for ${t} s. ` +
          `Use s = ut + ½at² to find the distance travelled.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(u * t + a * t * t, "m"), // forgot the half
          slip(u * t, "m"), // ignored the acceleration entirely
          slip(0.5 * a * t * t, "m"), // dropped the ut term
          slip((u + a * t) * t, "m"), // used the final speed for the whole journey
        ]),
        explanation:
          `s = ut + ½at² = ${u} × ${t} + ½ × ${a} × ${t}² = ${u * t} + ${0.5 * a * t * t} = ${answer}. ` +
          `Forgetting the half is the single most common slip here, and it doubles the second term.`,
        check: () => {
          /* Average velocity over the same time must give the same distance. */
          const v = u + a * t;
          const viaAverage = ((u + v) / 2) * t;
          return agrees(viaAverage, s) ? null : `average velocity gives ${viaAverage} m, not ${s} m`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Resultant forces
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.resultant-inline",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "resultant-forces",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 30,
    build: (rng) => {
      const driving = rng.pick([20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 400, 500, 600, 800, 1000, 1200, 2000, 2500, 3000]);
      const resisting = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300, 400, 500, 700, 900]);
      if (driving <= resisting) return buildResultantFallback();

      const resultant = driving - resisting;
      const thing = rng.pick(VEHICLES);
      const answer = ans(resultant, "N");

      return {
        prompt:
          `${cap(thing)} experiences a forward driving force of ${driving} N and a total resistive force of ${resisting} N. ` +
          `What is the resultant force on it?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(driving + resisting, "N"), // added instead of subtracting
          slip(driving, "N"), // ignored the resistance
          slip(resisting - driving, "N"), // subtracted the wrong way round
          slip(driving / resisting, "N"), // divided
        ]),
        explanation:
          `The forces act along the same line in opposite directions, so they subtract: ` +
          `${driving} − ${resisting} = ${answer}, forwards. ` +
          `A resultant force in the direction of motion means the ${thing} is speeding up.`,
        check: () =>
          agrees(resultant + resisting, driving)
            ? null
            : `${resultant} N plus ${resisting} N does not return the ${driving} N driving force`,
      };
    },
  }),

  generator({
    key: "phy.forces.resultant-perpendicular",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "resultant-forces",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      /* Pythagorean triples only, so the magnitude is a whole number. */
      const triple = rng.pick([
        [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17],
        [12, 16, 20], [7, 24, 25], [10, 24, 26], [20, 21, 29], [15, 20, 25],
        [18, 24, 30], [16, 30, 34],
      ] as const);
      const scale = rng.pick([1, 10, 100]);
      const [a, b, c] = triple.map((n) => n * scale) as [number, number, number];
      const answer = ans(c, "N");

      return {
        prompt:
          `Two forces act on an object at right angles to one another: ${a} N north and ${b} N east. ` +
          `What is the magnitude of the resultant force?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(a + b, "N"), // added them as if they were in line
          slip(Math.abs(b - a), "N"), // subtracted them
          slip(a * a + b * b, "N"), // forgot the square root
          slip(Math.sqrt(a * b), "N", 1), // multiplied instead of adding squares
        ]),
        explanation:
          `At right angles the resultant is the hypotenuse: √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${a * a + b * b} = ${answer}. ` +
          `Adding them directly would only be right if they pointed the same way.`,
        check: () => (agrees(a * a + b * b, c * c) ? null : `${a}, ${b}, ${c} is not a right triangle`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Newton's second law
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.f-ma",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "newtons-second-law",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(NEWTON2);
      const asked = rng.pick(["force", "acceleration", "mass"] as const);
      const thing = rng.pick(OBJECTS);
      const surface = rng.pick(SURFACES);

      if (asked === "force") {
        const answer = ans(row.f, "N");
        return {
          prompt:
            `A ${num(row.m)} kg ${thing} on ${surface} accelerates at ${num(row.a)} ${MS2}. ` +
            `What resultant force acts on it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.m / row.a, "N"), // divided instead of multiplying
            slip(row.m + row.a, "N"), // added the two quantities
            slip(row.m * G_GCSE, "N"), // gave the weight instead
            slip(row.a / row.m, "N"), // inverted the division
          ]),
          explanation:
            `F = ma = ${num(row.m)} × ${num(row.a)} = ${answer}. ` +
            `This is the RESULTANT force; the push needed would be larger by whatever friction opposes it.`,
          check: () =>
            agrees(row.f / row.m, row.a) ? null : `F ÷ m gives ${row.f / row.m}, not ${row.a}`,
        };
      }

      if (asked === "acceleration") {
        const answer = ans(row.a, MS2);
        return {
          prompt:
            `A resultant force of ${num(row.f)} N acts on a ${num(row.m)} kg ${thing}. ` +
            `Calculate its acceleration.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.f * row.m, MS2), // multiplied instead of dividing
            slip(row.m / row.f, MS2), // inverted the division
            slip(row.f / (row.m * G_GCSE), MS2), // divided by weight instead of mass
            slip(row.f - row.m, MS2), // subtracted
          ]),
          explanation:
            `Rearranging F = ma gives a = F ÷ m = ${num(row.f)} ÷ ${num(row.m)} = ${answer}. ` +
            `Mass, not weight, goes in the denominator — the same force gives the same acceleration wherever you are.`,
          check: () =>
            agrees(row.m * row.a, row.f) ? null : `ma gives ${row.m * row.a} N, not ${row.f} N`,
        };
      }

      const answer = ans(row.m, "kg");
      return {
        prompt:
          `A resultant force of ${num(row.f)} N gives a ${thing} an acceleration of ${num(row.a)} ${MS2}. ` +
          `What is its mass?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.f * row.a, "kg"), // multiplied instead of dividing
          slip(row.a / row.f, "kg"), // inverted the division
          slip(row.f / G_GCSE, "kg"), // divided by g, as if the force were a weight
          slip(row.f - row.a, "kg"), // subtracted
        ]),
        explanation:
          `Rearranging F = ma gives m = F ÷ a = ${num(row.f)} ÷ ${num(row.a)} = ${answer}. ` +
          `Dividing by g instead would give the mass only if the ${num(row.f)} N were a weight, which it is not.`,
        check: () =>
          agrees(row.m * row.a, row.f) ? null : `ma gives ${row.m * row.a} N, not ${row.f} N`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Weight and mass
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.weight",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "weight-mass",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 30,
    build: (rng) => {
      const mass = rng.pick([0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 40, 50, 60, 70, 80, 100, 250, 500, 800, 1200, 1500]);
      const asked = rng.bool();
      const thing = rng.pick(OBJECTS);

      if (asked) {
        const w = exact(mass * G_GCSE, 2);
        const answer = ans(w, "N");
        return {
          prompt:
            `Take g = ${G_GCSE} N/kg. What is the weight of a ${num(mass)} kg ${thing} on Earth?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(mass, "N"), // gave the mass, with newtons written after it
            slip(mass / G_GCSE, "N"), // divided instead of multiplying
            slip(mass * G_GCSE * G_GCSE, "N"), // multiplied by g twice
            slip(mass + G_GCSE, "N"), // added g
          ]),
          explanation:
            `W = mg = ${num(mass)} × ${G_GCSE} = ${answer}. ` +
            `Mass is in kilograms and never changes; weight is a force in newtons and depends on where you are.`,
          check: () => (agrees(w / G_GCSE, mass) ? null : `W ÷ g gives ${w / G_GCSE} kg, not ${mass} kg`),
        };
      }

      const w = exact(mass * G_GCSE, 2);
      const answer = ans(mass, "kg");
      return {
        prompt:
          `Take g = ${G_GCSE} N/kg. An object weighs ${num(w)} N on Earth. What is its mass?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(w, "kg"), // gave the weight, relabelled as a mass
          slip(w * G_GCSE, "kg"), // multiplied instead of dividing
          slip(w / (G_GCSE * G_GCSE), "kg"), // divided by g twice
          slip(w - G_GCSE, "kg"), // subtracted g
        ]),
        explanation:
          `Rearranging W = mg gives m = W ÷ g = ${num(w)} ÷ ${G_GCSE} = ${answer}. ` +
          `Taken to the Moon the mass stays ${num(mass)} kg while the weight falls to about a sixth.`,
        check: () => (agrees(mass * G_GCSE, w) ? null : `mg gives ${mass * G_GCSE} N, not ${w} N`),
      };
    },
  }),

  generator({
    key: "phy.forces.weight-other-worlds",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "weight-mass",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 24,
    build: (rng) => {
      /* The distinction that carries the marks: mass is unchanged, weight is not. */
      const world = rng.pick([
        { name: "the Moon", g: 1.6 },
        { name: "Mars", g: 3.8 },
        { name: "Mercury", g: 3.6 },
        { name: "Venus", g: 8.8 },
        { name: "Saturn", g: 10.4 },
        { name: "Neptune", g: 11.2 },
      ] as const);
      const mass = rng.pick([0.5, 2, 5, 10, 15, 20, 25, 40, 50, 60, 80, 100, 200, 500]);
      const w = exact(mass * world.g, 2);
      if (!tidy(w)) return buildWeightFallback();

      const answer = ans(w, "N");
      return {
        prompt:
          `A ${num(mass)} kg object is taken to ${world.name}, where g = ${num(world.g)} N/kg. ` +
          `What is its weight there?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(mass * G_GCSE, "N"), // used Earth's g out of habit
          slip(mass, "N"), // said the weight equals the mass
          slip(mass / world.g, "N"), // divided instead of multiplying
          slip(mass * G_GCSE - mass * world.g, "N"), // gave the change in weight
        ]),
        explanation:
          `W = mg = ${num(mass)} × ${num(world.g)} = ${answer}. ` +
          `The mass is still ${num(mass)} kg — moving an object does not change how much matter is in it — but the weight changes with the field.`,
        check: () => (agrees(w / world.g, mass) ? null : `W ÷ g gives ${w / world.g} kg, not ${mass} kg`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Hooke's law
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.hooke",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "hookes-law",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(SPRINGS);
      const asked = rng.pick(["force", "extension", "constant"] as const);
      const thing = rng.pick(SPRING_THINGS);
      const cm = exact(row.x * 100, 1);

      if (asked === "force") {
        const answer = ans(row.f, "N");
        return {
          prompt:
            `${cap(thing)} of spring constant ${row.k} N/m is extended by ${num(cm)} cm. ` +
            `What force is stretching it, assuming it obeys Hooke's law?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.k * cm, "N"), // left the extension in centimetres
            slip(row.k / row.x, "N"), // divided instead of multiplying
            slip(row.x / row.k, "N"), // inverted the whole thing
            slip(row.k, "N"), // gave the spring constant
          ]),
          explanation:
            `F = kx with x in metres: ${num(cm)} cm = ${num(row.x)} m, so F = ${row.k} × ${num(row.x)} = ${answer}. ` +
            `Leaving the extension in centimetres multiplies the answer by a hundred, which is the usual lost mark here.`,
          check: () => (agrees(row.f / row.k, row.x) ? null : `F ÷ k gives ${row.f / row.k} m, not ${row.x} m`),
        };
      }

      if (asked === "extension") {
        const answer = ans(cm, "cm");
        return {
          prompt:
            `A force of ${num(row.f)} N is applied to ${thing} of spring constant ${row.k} N/m. ` +
            `How far does it extend, in centimetres?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.f / row.k, "cm"), // forgot to convert metres to centimetres
            slip(row.f * row.k, "cm"), // multiplied instead of dividing
            slip(row.k / row.f, "cm"), // inverted the division
            slip(row.f * 100, "cm"), // ignored the spring constant
          ]),
          explanation:
            `Rearranging F = kx gives x = F ÷ k = ${num(row.f)} ÷ ${row.k} = ${num(row.x)} m, which is ${answer}.`,
          check: () => (agrees(row.k * row.x, row.f) ? null : `kx gives ${row.k * row.x} N, not ${row.f} N`),
        };
      }

      const answer = ans(row.k, "N/m");
      return {
        prompt:
          `${cap(thing)} extends by ${num(cm)} cm when a force of ${num(row.f)} N is applied. ` +
          `Calculate its spring constant.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.f / cm, "N/m"), // divided by centimetres, not metres
          slip(row.f * row.x, "N/m"), // multiplied instead of dividing
          slip(row.x / row.f, "N/m"), // inverted the division
          slip(row.f, "N/m"), // gave the force
        ]),
        explanation:
          `k = F ÷ x with x in metres: ${num(cm)} cm = ${num(row.x)} m, so k = ${num(row.f)} ÷ ${num(row.x)} = ${answer}. ` +
          `A stiffer spring has a larger k, because it needs more newtons per metre.`,
        check: () => (agrees(row.k * row.x, row.f) ? null : `kx gives ${row.k * row.x} N, not ${row.f} N`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Terminal velocity — the reasoning, not the arithmetic
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.terminal-velocity",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "terminal-velocity",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      const faller = rng.pick(FALLERS);
      const mass = rng.pick([0.5, 2, 5, 8, 10, 20, 25, 50, 60, 70, 80, 100]);
      const weight = exact(mass * G_GCSE, 2);
      const stage = rng.pick(["terminal", "start", "midway", "opened"] as const);

      if (stage === "terminal") {
        const answer = ans(weight, "N");
        return {
          prompt:
            `Take g = ${G_GCSE} N/kg. A ${num(mass)} kg ${faller} is falling at terminal velocity. ` +
            `What is the size of the drag force acting on it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(mass, "N"), // gave the mass
            slip(0, "N"), // said drag is zero because the acceleration is
            slip(weight * 2, "N"), // doubled it
            slip(weight / 2, "N"), // halved it
          ]),
          explanation:
            `At terminal velocity the acceleration is zero, so the resultant force is zero and drag must exactly balance weight. ` +
            `Weight = mg = ${num(mass)} × ${G_GCSE} = ${answer}, so the drag is the same. ` +
            `Zero resultant force does not mean zero force — it means the forces cancel.`,
          check: () => (agrees(weight, mass * G_GCSE) ? null : "weight does not equal mg"),
        };
      }

      if (stage === "start") {
        const answer = ans(weight, "N");
        return {
          prompt:
            `Take g = ${G_GCSE} N/kg. A ${num(mass)} kg ${faller} has just been released from rest. ` +
            `What is the resultant force on it at that instant?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(0, "N"), // confused the start with terminal velocity
            slip(mass, "N"), // gave the mass
            slip(weight * 2, "N"), // added drag rather than noting it is zero
            slip(G_GCSE, "N"), // gave g
          ]),
          explanation:
            `At rest there is no motion through the air, so there is no drag yet. ` +
            `The only force is weight = mg = ${num(mass)} × ${G_GCSE} = ${answer}, and that is the resultant. ` +
            `This is the moment of greatest acceleration; it falls away as drag builds.`,
          check: () => (agrees(weight, mass * G_GCSE) ? null : "weight does not equal mg"),
        };
      }

      if (stage === "midway") {
        const drag = rng.pick([10, 20, 30, 40, 50, 100, 150, 200, 300]);
        if (drag >= weight) return buildTerminalFallback();
        const resultant = weight - drag;
        const accel = exact(resultant / mass, 2);
        if (!tidy(accel)) return buildTerminalFallback();

        const answer = ans(accel, MS2);
        return {
          prompt:
            `Take g = ${G_GCSE} N/kg. A ${num(mass)} kg ${faller} falls with ${drag} N of drag acting on it. ` +
            `What is its acceleration at that moment?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(G_GCSE, MS2), // ignored the drag
            slip((weight + drag) / mass, MS2), // added drag instead of subtracting
            slip(drag / mass, MS2), // used drag alone as the resultant
            slip(resultant, MS2), // gave the resultant force, not the acceleration
          ]),
          explanation:
            `Weight = ${num(mass)} × ${G_GCSE} = ${num(weight)} N downwards, drag = ${drag} N upwards, so the resultant is ${num(weight)} − ${drag} = ${num(resultant)} N. ` +
            `a = F ÷ m = ${num(resultant)} ÷ ${num(mass)} = ${answer}, still downwards but less than g.`,
          check: () =>
            agrees(mass * accel + drag, weight)
              ? null
              : `ma + drag = ${mass * accel + drag} N, which does not return the ${weight} N weight`,
        };
      }

      const answer = "It decelerates, then falls at a new, lower terminal velocity";
      return {
        prompt:
          `A ${faller} falling at terminal velocity suddenly increases its surface area. ` +
          `What happens to its motion?`,
        answer,
        distractors: pickDistractors(answer, [
          "It stops immediately, because drag now exceeds weight permanently",
          "It carries on at the same speed, because its weight has not changed",
          "It accelerates, because a larger area means more air pushing it along",
          "It rises, because the upward force is now larger than the downward one",
        ]),
        explanation:
          `A larger area means more drag at the same speed, so drag now exceeds weight and the resultant force acts upwards: the ${faller} slows. ` +
          `As it slows the drag falls again, until it once more equals weight — at a lower speed. ` +
          `It never stops, because drag disappears when the motion does.`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Moments
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.moment",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "moments",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const f = rng.pick([4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500]);
      const cm = rng.pick([10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200]);
      const d = cm / 100;
      const m = exact(f * d, 2);
      if (!tidy(m)) return buildMomentFallback();

      const tool = rng.pick(["a spanner", "a door handle", "a crowbar", "a wheel brace", "a lever"]);
      const answer = ans(m, NM);

      return {
        prompt:
          `A force of ${f} N is applied at the end of ${tool}, ${cm} cm from the pivot and at right angles to it. ` +
          `Calculate the moment of the force about the pivot.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(f * cm, NM), // left the distance in centimetres
          slip(f / d, NM), // divided instead of multiplying
          slip(f + d, NM), // added
          slip(d / f, NM), // inverted
        ]),
        explanation:
          `Moment = force × perpendicular distance, with the distance in metres: ${cm} cm = ${num(d)} m, ` +
          `so the moment is ${f} × ${num(d)} = ${answer}. ` +
          `Doubling the distance doubles the moment, which is why a longer spanner is easier to use.`,
        check: () => (agrees(m / d, f) ? null : `moment ÷ distance gives ${m / d} N, not ${f} N`),
      };
    },
  }),

  generator({
    key: "phy.forces.balance",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "moments",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(BALANCES);
      const lever = rng.pick(LEVERS);
      const asked = rng.bool();

      if (asked) {
        const answer = ans(row.f2, "N");
        return {
          prompt:
            `${cap(lever)} is balanced. A force of ${num(row.f1)} N acts ${num(row.d1)} m from the pivot on one side. ` +
            `What force acts ${num(row.d2)} m from the pivot on the other side?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.f1, "N"), // assumed equal forces
            slip((row.f1 * row.d2) / row.d1, "N"), // used the ratio upside down
            slip(row.f1 * row.d1 * row.d2, "N"), // multiplied everything
            slip(row.f1 * row.d1, "N"), // gave the moment as a force
          ]),
          explanation:
            `Balanced means the moments are equal: ${num(row.f1)} × ${num(row.d1)} = F × ${num(row.d2)}. ` +
            `So F = ${num(row.f1 * row.d1)} ÷ ${num(row.d2)} = ${answer}. ` +
            `The force further from the pivot is always the smaller one.`,
          check: () =>
            agrees(row.f1 * row.d1, row.f2 * row.d2)
              ? null
              : `moments ${row.f1 * row.d1} and ${row.f2 * row.d2} N m do not balance`,
        };
      }

      const answer = ans(row.d2, "m");
      return {
        prompt:
          `${cap(lever)} balances with a ${num(row.f1)} N force ${num(row.d1)} m from the pivot on one side ` +
          `and a ${num(row.f2)} N force on the other. How far from the pivot is the second force?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.d1, "m"), // assumed equal distances
          slip((row.f2 * row.d1) / row.f1, "m"), // used the ratio upside down
          slip(row.f1 * row.d1, "m"), // gave the moment as a distance
          slip(row.d1 * row.f2, "m"), // multiplied the wrong pair
        ]),
        explanation:
          `Equal moments: ${num(row.f1)} × ${num(row.d1)} = ${num(row.f2)} × d, ` +
          `so d = ${num(row.f1 * row.d1)} ÷ ${num(row.f2)} = ${answer}. ` +
          `A larger force needs a shorter distance to produce the same moment.`,
        check: () =>
          agrees(row.f1 * row.d1, row.f2 * row.d2)
            ? null
            : `moments ${row.f1 * row.d1} and ${row.f2 * row.d2} N m do not balance`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Pressure
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.forces.pressure",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "pressure-fluids",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(PRESSURES);
      const asked = rng.pick(["pressure", "force", "area"] as const);
      const thing = rng.pick(["a paving slab", "a box", "a machine foot", "a stack of books", "a tank", "a filing cabinet"]);

      if (asked === "pressure") {
        const answer = ans(row.p, "Pa");
        return {
          prompt:
            `${cap(thing)} exerts a force of ${num(row.f)} N over an area of ${num(row.a)} ${M2}. ` +
            `Calculate the pressure.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.f * row.a, "Pa"), // multiplied instead of dividing
            slip(row.a / row.f, "Pa"), // inverted the division
            slip(row.f, "Pa"), // gave the force
            slip(row.f - row.a, "Pa"), // subtracted
          ]),
          explanation:
            `p = F ÷ A = ${num(row.f)} ÷ ${num(row.a)} = ${answer}. ` +
            `The same force over half the area would double the pressure, which is why a drawing pin works.`,
          check: () => (agrees(row.p * row.a, row.f) ? null : `pA gives ${row.p * row.a} N, not ${row.f} N`),
        };
      }

      if (asked === "force") {
        const answer = ans(row.f, "N");
        return {
          prompt:
            `A pressure of ${num(row.p)} Pa acts over an area of ${num(row.a)} ${M2}. ` +
            `What force does it exert?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.p / row.a, "N"), // divided instead of multiplying
            slip(row.a / row.p, "N"), // inverted
            slip(row.p, "N"), // gave the pressure
            slip(row.p + row.a, "N"), // added
          ]),
          explanation:
            `Rearranging p = F ÷ A gives F = pA = ${num(row.p)} × ${num(row.a)} = ${answer}. ` +
            `Pascals are newtons per square metre, so multiplying by an area in m² leaves newtons.`,
          check: () => (agrees(row.f / row.a, row.p) ? null : `F ÷ A gives ${row.f / row.a} Pa, not ${row.p} Pa`),
        };
      }

      const answer = ans(row.a, M2);
      return {
        prompt:
          `A force of ${num(row.f)} N produces a pressure of ${num(row.p)} Pa. ` +
          `Over what area does it act?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.f * row.p, M2), // multiplied instead of dividing
          slip(row.p / row.f, M2), // inverted the division
          slip(row.f, M2), // gave the force
          slip(row.f - row.p, M2), // subtracted
        ]),
        explanation:
          `Rearranging p = F ÷ A gives A = F ÷ p = ${num(row.f)} ÷ ${num(row.p)} = ${answer}.`,
        check: () => (agrees(row.p * row.a, row.f) ? null : `pA gives ${row.p * row.a} N, not ${row.f} N`),
      };
    },
  }),

  generator({
    key: "phy.forces.pressure-depth",
    subject: "physics",
    topic: "phy-forces",
    subtopic: "pressure-fluids",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* p = ρgh, with densities and depths chosen so the product is tidy. */
      const liquid = rng.pick([
        { name: "water", rho: 1000 },
        { name: "sea water", rho: 1030 },
        { name: "cooking oil", rho: 800 },
        { name: "glycerol", rho: 1300 },
        { name: "brine", rho: 1200 },
      ] as const);
      /* No h = 1. At unit depth ρgh² and ρg/h both collapse onto ρgh, which
         leaves the question with a single wrong option. */
      const h = rng.pick([0.5, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]);
      const p = exact(liquid.rho * G_GCSE * h, 2);
      const answer = ans(p, "Pa");

      return {
        prompt:
          `Take g = ${G_GCSE} N/kg. Calculate the pressure due to the liquid at a depth of ${num(h)} m ` +
          `in ${liquid.name}, which has a density of ${liquid.rho} kg/m³.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(liquid.rho * h, "Pa"), // left g out
          slip(liquid.rho * G_GCSE, "Pa"), // left the depth out
          slip((liquid.rho * G_GCSE) / h, "Pa"), // divided by depth instead of multiplying
          slip(liquid.rho * G_GCSE * h * h, "Pa"), // squared the depth
        ]),
        explanation:
          `p = ρgh = ${liquid.rho} × ${G_GCSE} × ${num(h)} = ${answer}. ` +
          `The area of the container does not appear: pressure at a depth depends only on the liquid and how far down you are.`,
        check: () =>
          agrees(p / (liquid.rho * G_GCSE), h)
            ? null
            : `p ÷ ρg gives a depth of ${p / (liquid.rho * G_GCSE)} m, not ${h} m`,
      };
    },
  }),
];

/* ==========================================================================
   Fallbacks
   ==========================================================================

   A generator whose random parameters do not work out returns a fixed question
   instead of throwing. The framework re-rolls duplicate prompts, so a fallback
   that fires occasionally costs one variant's variety and nothing else — where
   throwing would take the whole bank down over one unlucky draw. */

function buildResultantFallback() {
  const answer = ans(250, "N");
  return {
    prompt:
      "A van experiences a forward driving force of 900 N and a total resistive force of 650 N. " +
      "What is the resultant force on it?",
    answer,
    distractors: pickDistractors(answer, [
      slip(1550, "N"), // added instead of subtracting
      slip(900, "N"), // ignored the resistance
      slip(-250, "N"), // subtracted the wrong way round
    ]),
    explanation:
      "The forces act along the same line in opposite directions, so they subtract: 900 − 650 = 250 N forwards. " +
      "A resultant force in the direction of motion means the van is speeding up.",
    check: () => (agrees(250 + 650, 900) ? null : "the fallback no longer balances"),
  };
}

function buildWeightFallback() {
  const answer = ans(80, "N");
  return {
    prompt: "A 50 kg object is taken to the Moon, where g = 1.6 N/kg. What is its weight there?",
    answer,
    distractors: pickDistractors(answer, [
      slip(500, "N"), // used Earth's g out of habit
      slip(50, "N"), // said the weight equals the mass
      slip(31.25, "N"), // divided instead of multiplying
    ]),
    explanation:
      "W = mg = 50 × 1.6 = 80 N. The mass is still 50 kg — moving an object does not change how much matter is in it — " +
      "but the weight falls because the field is weaker.",
    check: () => (agrees(50 * 1.6, 80) ? null : "the fallback weight is wrong"),
  };
}

function buildTerminalFallback() {
  const answer = ans(6, MS2);
  return {
    prompt:
      `Take g = ${G_GCSE} N/kg. A 50 kg skydiver falls with 200 N of drag acting on her. ` +
      "What is her acceleration at that moment?",
    answer,
    distractors: pickDistractors(answer, [
      slip(10, MS2), // ignored the drag
      slip(14, MS2), // added drag instead of subtracting
      slip(4, MS2), // used drag alone as the resultant
    ]),
    explanation:
      "Weight = 50 × 10 = 500 N downwards, drag = 200 N upwards, so the resultant is 300 N. " +
      "a = F ÷ m = 300 ÷ 50 = 6 m/s², still downwards but less than g.",
    check: () => (agrees(50 * 6 + 200, 500) ? null : "the fallback forces do not balance"),
  };
}

function buildMomentFallback() {
  const answer = ans(30, NM);
  return {
    prompt:
      "A force of 60 N is applied at the end of a spanner, 50 cm from the pivot and at right angles to it. " +
      "Calculate the moment of the force about the pivot.",
    answer,
    distractors: pickDistractors(answer, [
      slip(3000, NM), // left the distance in centimetres
      slip(120, NM), // divided instead of multiplying
      slip(60.5, NM), // added
    ]),
    explanation:
      "Moment = force × perpendicular distance, with the distance in metres: 50 cm = 0.5 m, " +
      "so the moment is 60 × 0.5 = 30 N m. Doubling the distance doubles the moment.",
    check: () => (agrees(60 * 0.5, 30) ? null : "the fallback moment is wrong"),
  };
}
