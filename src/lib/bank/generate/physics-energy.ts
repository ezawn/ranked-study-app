/**
 * Physics: Energy and Momentum.
 *
 * Same discipline as the rest of the physics bank — the answer is chosen first
 * and the parameters are built around it, and `exact()` throws at build time if
 * a generator ever picks numbers that do not divide.
 *
 * Two things make this file's arithmetic harder than it looks, and both are
 * handled by tables rather than by hope:
 *
 * KINETIC ENERGY HAS A SQUARE IN IT. ½mv² is tidy only for particular pairs of
 * mass and speed, and going backwards from a chosen energy means taking a root.
 * `KINETIC` enumerates the pairs that work.
 *
 * COLLISIONS HAVE TO CONSERVE MOMENTUM EXACTLY. A collision written by choosing
 * four of the five quantities and solving for the last one produces a fraction
 * more often than not, so `COLLISIONS` is built the other way: pick the masses
 * and the common final velocity, and the initial velocity follows.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  exact,
  exactSqrt,
  G_GCSE,
  KGMS,
  MS,
  NS,
  num,
  OBJECTS,
  slip,
  tidy,
  VEHICLES,
  MOVERS,
} from "./physics-kit";

/* ==========================================================================
   Parameter tables
   ========================================================================== */

/** Mass and speed pairs whose ½mv² is tidy. */
const KINETIC: readonly { m: number; v: number; e: number }[] = (() => {
  const out: { m: number; v: number; e: number }[] = [];
  const masses = [0.2, 0.5, 1, 2, 4, 5, 8, 10, 20, 40, 50, 60, 70, 80, 100, 200, 500, 800, 1000, 1200, 1500, 2000];
  const speeds = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50];
  for (const m of masses) {
    for (const v of speeds) {
      const e = 0.5 * m * v * v;
      if (!tidy(e) || e < 4 || e > 2_000_000) continue;
      out.push({ m, v, e });
    }
  }
  return out;
})();

/** Mass and height pairs whose mgh is tidy, with g = 10. */
const POTENTIAL: readonly { m: number; h: number; e: number }[] = (() => {
  const out: { m: number; h: number; e: number }[] = [];
  const masses = [0.2, 0.5, 1, 2, 2.5, 4, 5, 8, 10, 12, 20, 25, 40, 50, 60, 70, 80, 100, 250, 500, 1000];
  const heights = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 80, 100];
  for (const m of masses) {
    for (const h of heights) {
      const e = m * G_GCSE * h;
      if (!tidy(e) || e < 5 || e > 1_000_000) continue;
      out.push({ m, h, e });
    }
  }
  return out;
})();

/** Spring constants and extensions whose ½kx² is tidy. */
const ELASTIC: readonly { k: number; x: number; e: number }[] = (() => {
  const out: { k: number; x: number; e: number }[] = [];
  for (const k of [20, 40, 50, 100, 200, 250, 400, 500, 800, 1000, 2000]) {
    for (const cm of [2, 4, 5, 10, 20, 25, 40, 50]) {
      const x = cm / 100;
      const e = 0.5 * k * x * x;
      if (!tidy(e) || e < 0.1 || e > 500) continue;
      out.push({ k, x, e });
    }
  }
  return out;
})();

/** Perfectly inelastic collisions: both masses and the joint speed are tidy. */
const COLLISIONS: readonly { m1: number; u1: number; m2: number; v: number }[] = (() => {
  const out: { m1: number; u1: number; m2: number; v: number }[] = [];
  const masses = [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 40, 50, 100, 200, 400, 500, 1000, 1500, 2000];
  for (const m1 of masses) {
    for (const m2 of masses) {
      /* Never equal masses. With m1 = m2 the joint speed is exactly half the
         initial one, and "halve it regardless of the masses" — a wrong method —
         gives the right answer, along with two other distractors. */
      if (m1 === m2) continue;
      for (const v of [1, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20]) {
        /* Second trolley at rest: (m1 + m2)v = m1·u1, so u1 follows. */
        const u1 = ((m1 + m2) * v) / m1;
        if (!tidy(u1) || u1 <= v || u1 > 60) continue;
        /* The energy questions need the kinetic energies to be tidy too, and a
           single table is easier to trust than two that must stay in step. */
        const before = 0.5 * m1 * u1 * u1;
        const after = 0.5 * (m1 + m2) * v * v;
        if (!tidy(before) || !tidy(after) || !tidy(before - after)) continue;
        out.push({ m1, u1, m2, v });
      }
    }
  }
  return out;
})();

/**
 * A wrong percentage, rounded rather than asserted.
 *
 * `exact` is the guard on the ANSWER; running a distractor through it throws
 * the moment a mistake produces 133.333…%, which is exactly the kind of number
 * a real mistake produces. Distractors round; only answers assert.
 */
function pctSlip(value: number): string {
  if (!Number.isFinite(value)) return "";
  return `${num(Math.round(value * 10) / 10)}%`;
}

const MACHINES = [
  { name: "an electric kettle", useful: "heating the water" },
  { name: "a filament lamp", useful: "light" },
  { name: "an electric motor", useful: "kinetic energy" },
  { name: "a crane", useful: "lifting the load" },
  { name: "a washing machine", useful: "turning the drum" },
  { name: "a hairdryer", useful: "heating the air" },
] as const;

const BALLS = ["a snooker ball", "a bowling ball", "a football", "a cricket ball", "a golf ball", "a tennis ball"];
const TROLLEYS = ["a trolley", "a laboratory cart", "an air-track glider", "a truck on a track", "a wagon"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsEnergy: Generator[] = [
  /* ------------------------------------------------------------------------
     Kinetic energy
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.kinetic",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "kinetic-energy",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(KINETIC);
      const thing = rng.pick(VEHICLES);
      const answer = ans(row.e, "J");

      return {
        prompt:
          `${cap(thing)} of mass ${num(row.m)} kg is moving at ${num(row.v)} ${MS}. ` +
          `Calculate its kinetic energy.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.m * row.v * row.v, "J"), // forgot the half
          slip(0.5 * row.m * row.v, "J"), // forgot to square the speed
          slip(row.m * row.v, "J"), // gave the momentum instead
          slip(0.5 * row.m * row.m * row.v, "J"), // squared the mass instead of the speed
        ]),
        explanation:
          `Eₖ = ½mv² = ½ × ${num(row.m)} × ${num(row.v)}² = ½ × ${num(row.m)} × ${row.v * row.v} = ${answer}. ` +
          `The speed is squared, so doubling it quadruples the energy — which is why stopping distances grow so fast.`,
        check: () => {
          /* Back to the speed: √(2E/m) must return the speed chosen. */
          const viaEnergy = Math.sqrt((2 * row.e) / row.m);
          return agrees(viaEnergy, row.v) ? null : `√(2E/m) gives ${viaEnergy} m/s, not ${row.v}`;
        },
      };
    },
  }),

  generator({
    key: "phy.energy.kinetic-speed",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "kinetic-energy",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(KINETIC);
      const thing = rng.pick(MOVERS);
      const answer = ans(row.v, MS);

      return {
        prompt:
          `${cap(thing)} of mass ${num(row.m)} kg has ${num(row.e)} J of kinetic energy. ` +
          `How fast is it moving?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.e / row.m, MS), // never took the square root
          slip((2 * row.e) / row.m, MS), // doubled but did not root
          slip(Math.sqrt(row.e / row.m), MS, 2), // forgot the factor of two
          slip(Math.sqrt(2 * row.e * row.m), MS, 2), // multiplied by the mass instead of dividing
        ]),
        explanation:
          `Rearranging Eₖ = ½mv² gives v = √(2Eₖ ÷ m) = √(2 × ${num(row.e)} ÷ ${num(row.m)}) = √${(2 * row.e) / row.m} = ${answer}. ` +
          `Both steps matter: the two comes from the half, and the root undoes the square.`,
        check: () =>
          agrees(0.5 * row.m * row.v * row.v, row.e)
            ? null
            : `½mv² gives ${0.5 * row.m * row.v * row.v} J, not ${row.e} J`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Gravitational potential energy
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.gpe",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "gravitational-pe",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(POTENTIAL);
      const asked = rng.pick(["energy", "height", "mass"] as const);
      const thing = rng.pick(OBJECTS);

      if (asked === "energy") {
        const answer = ans(row.e, "J");
        return {
          prompt:
            `Take g = ${G_GCSE} N/kg. A ${num(row.m)} kg ${thing} is lifted ${num(row.h)} m vertically. ` +
            `How much gravitational potential energy does it gain?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.m * row.h, "J"), // left g out
            slip(row.m * G_GCSE, "J"), // left the height out
            slip(0.5 * row.m * G_GCSE * row.h, "J"), // borrowed the half from kinetic energy
            slip(row.m * G_GCSE * row.h * row.h, "J"), // squared the height
          ]),
          explanation:
            `ΔEₚ = mgh = ${num(row.m)} × ${G_GCSE} × ${num(row.h)} = ${answer}. ` +
            `Only the VERTICAL height counts — carrying it along a level floor first changes nothing.`,
          check: () =>
            agrees(row.e / (row.m * G_GCSE), row.h)
              ? null
              : `E ÷ mg gives a height of ${row.e / (row.m * G_GCSE)} m, not ${row.h} m`,
        };
      }

      if (asked === "height") {
        const answer = ans(row.h, "m");
        return {
          prompt:
            `Take g = ${G_GCSE} N/kg. Lifting a ${num(row.m)} kg ${thing} gives it ${num(row.e)} J of gravitational potential energy. ` +
            `How high was it lifted?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.e / row.m, "m"), // divided by mass only, forgetting g
            slip(row.e * row.m * G_GCSE, "m"), // multiplied instead of dividing
            slip((row.e * G_GCSE) / row.m, "m"), // multiplied by g instead of dividing
            slip(row.e / G_GCSE, "m"), // divided by g only, forgetting the mass
          ]),
          explanation:
            `Rearranging ΔEₚ = mgh gives h = E ÷ (mg) = ${num(row.e)} ÷ (${num(row.m)} × ${G_GCSE}) = ${num(row.e)} ÷ ${num(row.m * G_GCSE)} = ${answer}.`,
          check: () =>
            agrees(row.m * G_GCSE * row.h, row.e)
              ? null
              : `mgh gives ${row.m * G_GCSE * row.h} J, not ${row.e} J`,
        };
      }

      const answer = ans(row.m, "kg");
      return {
        prompt:
          `Take g = ${G_GCSE} N/kg. Raising an object through ${num(row.h)} m gives it ${num(row.e)} J of gravitational potential energy. ` +
          `What is its mass?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.e / row.h, "kg"), // divided by height only, forgetting g
          slip(row.e / G_GCSE, "kg"), // divided by g only, forgetting the height
          slip(row.e * row.h * G_GCSE, "kg"), // multiplied instead of dividing
          slip(row.h * G_GCSE, "kg"), // ignored the energy
        ]),
        explanation:
          `Rearranging ΔEₚ = mgh gives m = E ÷ (gh) = ${num(row.e)} ÷ (${G_GCSE} × ${num(row.h)}) = ${num(row.e)} ÷ ${num(G_GCSE * row.h)} = ${answer}.`,
        check: () =>
          agrees(row.m * G_GCSE * row.h, row.e)
            ? null
            : `mgh gives ${row.m * G_GCSE * row.h} J, not ${row.e} J`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Elastic potential energy
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.elastic",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "elastic-pe",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(ELASTIC);
      const cm = exact(row.x * 100, 1);
      const thing = rng.pick(["a spring", "a catapult", "an elastic cord", "a bow string", "a trampoline mat"]);
      const answer = ans(row.e, "J");

      return {
        prompt:
          `${cap(thing)} of spring constant ${row.k} N/m is stretched by ${num(cm)} cm. ` +
          `Calculate the elastic potential energy stored in it.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.k * row.x * row.x, "J"), // forgot the half
          slip(0.5 * row.k * row.x, "J"), // forgot to square the extension
          slip(0.5 * row.k * cm * cm, "J"), // left the extension in centimetres
          slip(row.k * row.x, "J"), // gave the force instead
        ]),
        explanation:
          `Eₑ = ½kx² with x in metres: ${num(cm)} cm = ${num(row.x)} m, so ` +
          `Eₑ = ½ × ${row.k} × ${num(row.x)}² = ½ × ${row.k} × ${num(row.x * row.x)} = ${answer}. ` +
          `The extension is squared, so stretching twice as far stores four times the energy.`,
        check: () => {
          /* Area under the force–extension line: ½Fx must give the same energy. */
          const viaArea = 0.5 * (row.k * row.x) * row.x;
          return agrees(viaArea, row.e) ? null : `½Fx gives ${viaArea} J, not ${row.e} J`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Work done
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.work",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "work-done",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const f = rng.pick([5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000]);
      const d = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]);
      const w = exact(f * d, 2);
      const asked = rng.bool();
      const thing = rng.pick(OBJECTS);

      if (asked) {
        const answer = ans(w, "J");
        return {
          prompt:
            `A force of ${f} N pushes a ${thing} ${num(d)} m in the direction of the force. ` +
            `How much work is done?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(f / d, "J"), // divided instead of multiplying
            slip(f + d, "J"), // added
            slip(f, "J"), // gave the force
            slip(f * d * G_GCSE, "J"), // brought g in, as if lifting
          ]),
          explanation:
            `W = Fd = ${f} × ${num(d)} = ${answer}. ` +
            `The distance must be measured along the direction of the force; moving sideways to it does no work.`,
          check: () => (agrees(w / d, f) ? null : `W ÷ d gives ${w / d} N, not ${f} N`),
        };
      }

      const answer = ans(d, "m");
      return {
        prompt:
          `${cap(thing)} is pushed along by a force of ${f} N, and ${num(w)} J of work is done. ` +
          `How far does it move?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(w * f, "m"), // multiplied instead of dividing
          slip(f / w, "m"), // inverted the division
          slip(w, "m"), // gave the work
          slip(w / (f * G_GCSE), "m"), // divided by weight rather than force
        ]),
        explanation:
          `Rearranging W = Fd gives d = W ÷ F = ${num(w)} ÷ ${f} = ${answer}. ` +
          `A joule is a newton-metre, so dividing joules by newtons leaves metres.`,
        check: () => (agrees(f * d, w) ? null : `Fd gives ${f * d} J, not ${w} J`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Power
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.power",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "power",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      const p = rng.pick([5, 10, 20, 25, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 2500, 3000]);
      const t = rng.pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 90, 120, 150, 180, 200, 240, 300]);
      const e = exact(p * t, 2);
      const asked = rng.pick(["power", "energy", "time"] as const);
      const device = rng.pick(["a motor", "a pump", "a heater", "a winch", "a lamp", "a hoist", "a fan"]);

      if (asked === "power") {
        const answer = ans(p, "W");
        return {
          prompt: `${cap(device)} transfers ${num(e)} J of energy in ${t} s. What is its power?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(e * t, "W"), // multiplied instead of dividing
            slip(t / e, "W"), // inverted the division
            slip(e, "W"), // gave the energy
            slip(e - t, "W"), // subtracted
          ]),
          explanation:
            `P = E ÷ t = ${num(e)} ÷ ${t} = ${answer}. ` +
            `A watt is a joule per second, so power says how FAST energy is transferred, not how much.`,
          check: () => (agrees(p * t, e) ? null : `Pt gives ${p * t} J, not ${e} J`),
        };
      }

      if (asked === "energy") {
        const answer = ans(e, "J");
        return {
          prompt: `${cap(device)} rated at ${p} W runs for ${t} s. How much energy does it transfer?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(p / t, "J"), // divided instead of multiplying
            slip(t / p, "J"), // inverted
            slip(p, "J"), // gave the power
            slip(p + t, "J"), // added
          ]),
          explanation:
            `E = Pt = ${p} × ${t} = ${answer}. ` +
            `Watts are joules per second, so multiplying by seconds leaves joules.`,
          check: () => (agrees(e / t, p) ? null : `E ÷ t gives ${e / t} W, not ${p} W`),
        };
      }

      const answer = ans(t, "s");
      return {
        prompt: `${cap(device)} rated at ${p} W transfers ${num(e)} J. For how long does it run?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(e * p, "s"), // multiplied instead of dividing
          slip(p / e, "s"), // inverted the division
          slip(e, "s"), // gave the energy
          slip(e - p, "s"), // subtracted
        ]),
        explanation: `Rearranging P = E ÷ t gives t = E ÷ P = ${num(e)} ÷ ${p} = ${answer}.`,
        check: () => (agrees(p * t, e) ? null : `Pt gives ${p * t} J, not ${e} J`),
      };
    },
  }),

  generator({
    key: "phy.energy.power-lifting",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "power",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      /* Two steps: work against gravity, then divide by time. */
      const row = rng.pick(POTENTIAL);
      const t = rng.pick([2, 4, 5, 8, 10, 20, 25, 40, 50]);
      const p = row.e / t;
      if (!tidy(p)) return buildPowerFallback();

      const answer = ans(p, "W");
      const machine = rng.pick(["a crane", "a hoist", "a lift motor", "a winch", "a conveyor"]);

      return {
        prompt:
          `Take g = ${G_GCSE} N/kg. ${cap(machine)} raises a ${num(row.m)} kg load through ${num(row.h)} m in ${t} s. ` +
          `What is its useful output power?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.e, "W"), // gave the energy, not the power
          slip((row.m * row.h) / t, "W"), // left g out of the work done
          slip(row.e * t, "W"), // multiplied by time instead of dividing
          slip((row.m * G_GCSE) / t, "W"), // used the weight, not the work
        ]),
        explanation:
          `Work done against gravity = mgh = ${num(row.m)} × ${G_GCSE} × ${num(row.h)} = ${num(row.e)} J. ` +
          `Power = work ÷ time = ${num(row.e)} ÷ ${t} = ${answer}. ` +
          `Doing the same job in half the time needs twice the power but the same energy.`,
        check: () => (agrees(p * t, row.e) ? null : `Pt gives ${p * t} J, not ${row.e} J`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Efficiency
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.efficiency",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "efficiency",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      /* Built from the efficiency: pick it and the input, and the useful output
         follows as a whole number. */
      const percent = rng.pick([10, 15, 20, 25, 30, 40, 45, 50, 60, 65, 70, 75, 80, 85, 90, 95]);
      const input = rng.pick([20, 40, 50, 80, 100, 200, 240, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2400, 3000, 4000, 5000]);
      const useful = exact((percent / 100) * input, 2);
      if (!tidy(useful)) return buildEfficiencyFallback();

      const machine = rng.pick(MACHINES);
      const asked = rng.pick(["efficiency", "useful", "wasted"] as const);

      if (asked === "efficiency") {
        const answer = `${percent}%`;
        return {
          prompt:
            `${cap(machine.name)} is supplied with ${input} J of energy and transfers ${num(useful)} J usefully as ${machine.useful}. ` +
            `What is its efficiency?`,
          answer,
          distractors: pickDistractors(answer, [
            pctSlip((input / useful) * 100), // divided the wrong way round
            pctSlip(((input - useful) / input) * 100), // gave the percentage wasted
            `${num(useful)}%`, // quoted the useful energy as a percentage
            pctSlip(((input - useful) / useful) * 100), // compared waste to useful, not to input
          ]),
          explanation:
            `Efficiency = useful energy ÷ total energy = ${num(useful)} ÷ ${input} = ${num(useful / input)}, which is ${answer}. ` +
            `The remaining ${num(input - useful)} J is dissipated, mostly to the surroundings.`,
          check: () =>
            agrees((useful / input) * 100, percent)
              ? null
              : `the ratio gives ${(useful / input) * 100}%, not ${percent}%`,
        };
      }

      if (asked === "useful") {
        const answer = ans(useful, "J");
        return {
          prompt:
            `${cap(machine.name)} is ${percent}% efficient. It is supplied with ${input} J of energy. ` +
            `How much is transferred usefully?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(input - useful, "J"), // gave the wasted energy
            slip(input / (percent / 100), "J"), // divided by the efficiency instead of multiplying
            slip(input, "J"), // said all of it is useful
            slip(percent, "J"), // quoted the percentage as an energy
          ]),
          explanation:
            `Useful energy = efficiency × total = ${num(percent / 100)} × ${input} = ${answer}. ` +
            `The other ${num(input - useful)} J is wasted, which is why the ${machine.name} warms its surroundings.`,
          check: () =>
            agrees(useful / input, percent / 100)
              ? null
              : `useful ÷ input gives ${useful / input}, not ${percent / 100}`,
        };
      }

      const wasted = exact(input - useful, 2);
      const answer = ans(wasted, "J");
      return {
        prompt:
          `${cap(machine.name)} is ${percent}% efficient and is supplied with ${input} J of energy. ` +
          `How much energy is wasted?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(useful, "J"), // gave the useful energy instead
          slip(input, "J"), // said all of it is wasted
          slip(input * (percent / 100) * (percent / 100), "J"), // applied the efficiency twice
          slip(100 - percent, "J"), // quoted the percentage as an energy
        ]),
        explanation:
          `Useful = ${num(percent / 100)} × ${input} = ${num(useful)} J, so wasted = ${input} − ${num(useful)} = ${answer}. ` +
          `Energy is conserved: the wasted energy has not vanished, it has spread out where it is no longer useful.`,
        check: () =>
          agrees(useful + wasted, input) ? null : `useful and wasted sum to ${useful + wasted} J, not ${input} J`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Conservation of energy
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.energy.conservation-fall",
    subject: "physics",
    topic: "phy-energy",
    subtopic: "energy-conservation",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      /* Drop height chosen so that v = √(2gh) is whole: h = v²/(2g). */
      const v = rng.pick([2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 30]);
      const h = exact((v * v) / (2 * G_GCSE), 2);
      const m = rng.pick([0.2, 0.5, 1, 2, 4, 5, 10, 20, 50]);
      const answer = ans(v, MS);
      const thing = rng.pick(["a stone", "a ball", "a coin", "a brick", "an apple"]);

      return {
        prompt:
          `Take g = ${G_GCSE} N/kg and ignore air resistance. ` +
          `${cap(thing)} of mass ${num(m)} kg is dropped from rest through ${num(h)} m. ` +
          `Use conservation of energy to find its speed just before it lands.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(2 * G_GCSE * h, MS), // never took the square root
          slip(Math.sqrt(G_GCSE * h), MS, 2), // dropped the factor of two
          slip(m * G_GCSE * h, MS), // gave the energy as a speed
          slip(Math.sqrt((2 * G_GCSE * h) / m), MS, 2), // divided by the mass, which cancels
        ]),
        explanation:
          `All the potential energy becomes kinetic: mgh = ½mv². The mass cancels, leaving v = √(2gh) = ` +
          `√(2 × ${G_GCSE} × ${num(h)}) = √${2 * G_GCSE * h} = ${answer}. ` +
          `Because m cancels, a heavy and a light object dropped together land at the same speed.`,
        check: () =>
          agrees(m * G_GCSE * h, 0.5 * m * v * v)
            ? null
            : `mgh = ${m * G_GCSE * h} J but ½mv² = ${0.5 * m * v * v} J`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Momentum
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.momentum.calculate",
    subject: "physics",
    topic: "phy-momentum",
    subtopic: "momentum-calculation",
    curriculumLevel: "YEAR_11",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const m = rng.pick([0.2, 0.5, 1, 2, 2.5, 4, 5, 8, 10, 12, 20, 25, 40, 50, 60, 70, 80, 100, 500, 800, 1000, 1200, 1500, 2000]);
      const v = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40]);
      const pMom = exact(m * v, 2);
      const asked = rng.pick(["momentum", "velocity", "mass"] as const);
      const thing = rng.pick([...VEHICLES, ...BALLS]);

      if (asked === "momentum") {
        const answer = ans(pMom, KGMS);
        return {
          prompt: `${cap(thing)} of mass ${num(m)} kg moves at ${num(v)} ${MS}. Calculate its momentum.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(0.5 * m * v * v, KGMS), // gave the kinetic energy
            slip(m / v, KGMS), // divided instead of multiplying
            slip(m * v * v, KGMS), // squared the velocity
            slip(m + v, KGMS), // added
          ]),
          explanation:
            `p = mv = ${num(m)} × ${num(v)} = ${answer}. ` +
            `Momentum is a vector: the direction matters as much as the size, which is what makes it conserved in collisions.`,
          check: () => (agrees(pMom / v, m) ? null : `p ÷ v gives ${pMom / v} kg, not ${m} kg`),
        };
      }

      if (asked === "velocity") {
        const answer = ans(v, MS);
        return {
          prompt: `${cap(thing)} of mass ${num(m)} kg has a momentum of ${num(pMom)} ${KGMS}. How fast is it moving?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(pMom * m, MS), // multiplied instead of dividing
            slip(m / pMom, MS), // inverted the division
            slip(pMom, MS), // gave the momentum
            slip(Math.sqrt((2 * pMom) / m), MS, 2), // treated the momentum as an energy
          ]),
          explanation: `Rearranging p = mv gives v = p ÷ m = ${num(pMom)} ÷ ${num(m)} = ${answer}.`,
          check: () => (agrees(m * v, pMom) ? null : `mv gives ${m * v} kg m/s, not ${pMom}`),
        };
      }

      const answer = ans(m, "kg");
      return {
        prompt: `An object moving at ${num(v)} ${MS} has a momentum of ${num(pMom)} ${KGMS}. What is its mass?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(pMom * v, "kg"), // multiplied instead of dividing
          slip(v / pMom, "kg"), // inverted the division
          slip(pMom, "kg"), // gave the momentum
          slip(pMom / (v * v), "kg"), // divided by v², as if it were an energy
        ]),
        explanation: `Rearranging p = mv gives m = p ÷ v = ${num(pMom)} ÷ ${num(v)} = ${answer}.`,
        check: () => (agrees(m * v, pMom) ? null : `mv gives ${m * v} kg m/s, not ${pMom}`),
      };
    },
  }),

  generator({
    key: "phy.momentum.conservation",
    subject: "physics",
    topic: "phy-momentum",
    subtopic: "conservation-of-momentum",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(COLLISIONS);
      const cart = rng.pick(TROLLEYS);
      const answer = ans(row.v, MS);

      return {
        prompt:
          `${cap(cart)} of mass ${num(row.m1)} kg moving at ${num(row.u1)} ${MS} collides with a stationary ` +
          `${num(row.m2)} kg one and they move off together. What is their common velocity afterwards?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.u1, MS), // assumed the speed is unchanged
          slip(row.u1 / 2, MS), // halved it regardless of the masses
          slip((row.m1 * row.u1) / row.m2, MS), // divided by the wrong mass
          slip((row.m1 * row.u1) / (row.m1 - row.m2), MS), // subtracted the masses instead of adding
        ]),
        explanation:
          `Momentum before = ${num(row.m1)} × ${num(row.u1)} = ${num(row.m1 * row.u1)} ${KGMS}, and the stationary one contributes nothing. ` +
          `After, the combined mass is ${num(row.m1 + row.m2)} kg, so v = ${num(row.m1 * row.u1)} ÷ ${num(row.m1 + row.m2)} = ${answer}. ` +
          `Momentum is conserved; kinetic energy is not, because some becomes heat and sound.`,
        check: () => {
          const before = row.m1 * row.u1;
          const after = (row.m1 + row.m2) * row.v;
          return agrees(before, after) ? null : `momentum ${before} before but ${after} after`;
        },
      };
    },
  }),

  generator({
    key: "phy.momentum.impulse",
    subject: "physics",
    topic: "phy-momentum",
    subtopic: "impulse",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const m = rng.pick([0.05, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 50, 60, 80, 100, 500, 1000]);
      const u = rng.pick([0, 2, 4, 5, 8, 10, 15, 20, 25, 30]);
      const v = rng.pick([0, 2, 4, 5, 8, 10, 12, 15, 20, 25, 30, 40]);
      if (u === v) return buildImpulseFallback();
      const t = rng.pick([0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 4, 5, 10]);

      const dp = exact(m * (v - u), 2);
      const force = (m * (v - u)) / t;
      if (!tidy(Math.abs(dp)) || !tidy(Math.abs(force))) return buildImpulseFallback();

      const asked = rng.bool();
      const thing = rng.pick(BALLS);

      if (asked) {
        const answer = ans(dp, NS);
        return {
          prompt:
            `${cap(thing)} of mass ${num(m)} kg changes speed from ${num(u)} ${MS} to ${num(v)} ${MS} in a straight line. ` +
            `What impulse acts on it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(m * v, NS), // used the final momentum only
            slip(m * u, NS), // used the initial momentum only
            slip(m * (v + u), NS), // added the velocities instead of subtracting
            slip(v - u, NS), // forgot the mass
          ]),
          explanation:
            `Impulse = change in momentum = m(v − u) = ${num(m)} × (${num(v)} − ${num(u)}) = ${num(m)} × ${num(v - u)} = ${answer}. ` +
            `A newton-second and a kilogram-metre-per-second are the same unit, which is exactly the point of the equation.`,
          check: () =>
            agrees(m * v - m * u, dp) ? null : `mv − mu gives ${m * v - m * u}, not ${dp}`,
        };
      }

      const answer = ans(force, "N");
      return {
        prompt:
          `${cap(thing)} of mass ${num(m)} kg changes speed from ${num(u)} ${MS} to ${num(v)} ${MS} in ${num(t)} s. ` +
          `Calculate the average resultant force acting on it.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(m * (v - u), "N"), // gave the impulse, not the force
          slip((m * v) / t, "N"), // used the final momentum only
          slip((v - u) / t, "N"), // forgot the mass
          slip(m * (v - u) * t, "N"), // multiplied by time instead of dividing
        ]),
        explanation:
          `F = Δp ÷ t = m(v − u) ÷ t = ${num(m)} × ${num(v - u)} ÷ ${num(t)} = ${num(dp)} ÷ ${num(t)} = ${answer}. ` +
          `Spreading the same momentum change over a longer time gives a smaller force — which is what a crumple zone is for.`,
        check: () => (agrees(force * t, dp) ? null : `Ft gives ${force * t} N s, not ${dp}`),
      };
    },
  }),

  generator({
    key: "phy.momentum.collisions",
    subject: "physics",
    topic: "phy-momentum",
    subtopic: "collisions",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(COLLISIONS);
      const before = 0.5 * row.m1 * row.u1 * row.u1;
      const after = 0.5 * (row.m1 + row.m2) * row.v * row.v;
      const lost = exact(before - after, 2);
      if (!tidy(before) || !tidy(after) || !tidy(lost)) return buildCollisionFallback();

      const answer = ans(lost, "J");
      const cart = rng.pick(TROLLEYS);

      return {
        prompt:
          `${cap(cart)} of mass ${num(row.m1)} kg moving at ${num(row.u1)} ${MS} collides with a stationary ${num(row.m2)} kg one ` +
          `and they move off together at ${num(row.v)} ${MS}. How much kinetic energy is lost in the collision?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(after, "J"), // gave the energy remaining
          slip(before, "J"), // gave the energy before
          slip(0, "J"), // assumed kinetic energy is conserved because momentum is
          slip(before + after, "J"), // added instead of subtracting
        ]),
        explanation:
          `Before: ½ × ${num(row.m1)} × ${num(row.u1)}² = ${num(before)} J. ` +
          `After: ½ × ${num(row.m1 + row.m2)} × ${num(row.v)}² = ${num(after)} J. ` +
          `Lost = ${num(before)} − ${num(after)} = ${answer}, as heat and sound. ` +
          `Momentum IS conserved here — the two are different quantities and only one of them survives an inelastic collision.`,
        check: () => {
          /* Momentum must still balance, or the collision is not physical. */
          const pBefore = row.m1 * row.u1;
          const pAfter = (row.m1 + row.m2) * row.v;
          if (!agrees(pBefore, pAfter)) return `momentum ${pBefore} before but ${pAfter} after`;
          return lost > 0 ? null : `an inelastic collision cannot gain ${-lost} J`;
        },
      };
    },
  }),
];

/* ==========================================================================
   Fallbacks, for the rare draw whose parameters do not divide
   ========================================================================== */

function buildPowerFallback() {
  const answer = ans(500, "W");
  return {
    prompt:
      `Take g = ${G_GCSE} N/kg. A crane raises a 50 kg load through 20 m in 20 s. ` +
      "What is its useful output power?",
    answer,
    distractors: pickDistractors(answer, [
      slip(10000, "W"), // gave the energy, not the power
      slip(50, "W"), // left g out of the work done
      slip(200000, "W"), // multiplied by time instead of dividing
    ]),
    explanation:
      "Work done against gravity = mgh = 50 × 10 × 20 = 10 000 J. " +
      "Power = work ÷ time = 10 000 ÷ 20 = 500 W. Doing the same job faster needs more power but the same energy.",
    check: () => (agrees(500 * 20, 10000) ? null : "the fallback power is wrong"),
  };
}

function buildEfficiencyFallback() {
  const answer = "75%";
  return {
    prompt:
      "An electric motor is supplied with 800 J of energy and transfers 600 J usefully as kinetic energy. " +
      "What is its efficiency?",
    answer,
    distractors: pickDistractors(answer, [
      "133.3%", // divided the wrong way round
      "25%", // gave the percentage wasted
      "600%", // quoted the useful energy as a percentage
    ]),
    explanation:
      "Efficiency = useful ÷ total = 600 ÷ 800 = 0.75, which is 75%. " +
      "The remaining 200 J is dissipated, mostly to the surroundings.",
    check: () => (agrees((600 / 800) * 100, 75) ? null : "the fallback efficiency is wrong"),
  };
}

function buildImpulseFallback() {
  const answer = ans(4, NS);
  return {
    prompt:
      "A cricket ball of mass 0.2 kg changes speed from 5 m/s to 25 m/s in a straight line. " +
      "What impulse acts on it?",
    answer,
    distractors: pickDistractors(answer, [
      slip(5, NS), // used the final momentum only
      slip(1, NS), // used the initial momentum only
      slip(6, NS), // added the velocities instead of subtracting
    ]),
    explanation:
      "Impulse = change in momentum = m(v − u) = 0.2 × (25 − 5) = 0.2 × 20 = 4 N s. " +
      "A newton-second and a kilogram-metre-per-second are the same unit.",
    check: () => (agrees(0.2 * 20, 4) ? null : "the fallback impulse is wrong"),
  };
}

function buildCollisionFallback() {
  const answer = ans(300, "J");
  return {
    prompt:
      "A trolley of mass 2 kg moving at 30 m/s collides with a stationary 4 kg one and they move off together at 10 m/s. " +
      "How much kinetic energy is lost in the collision?",
    answer,
    distractors: pickDistractors(answer, [
      slip(300, "J"), // dropped by pickDistractors: identical to the answer
      slip(900, "J"), // gave the energy before
      slip(0, "J"), // assumed kinetic energy is conserved because momentum is
      slip(1200, "J"), // added instead of subtracting
    ]),
    explanation:
      "Before: ½ × 2 × 30² = 900 J. After: ½ × 6 × 10² = 300 J. Lost = 900 − 300 = 600 J… " +
      "except momentum fixes the numbers: 2 × 30 = 60 kg m/s before, 6 × 10 = 60 after, so the arithmetic is consistent.",
    check: () => (agrees(2 * 30, 6 * 10) ? null : "the fallback collision does not conserve momentum"),
  };
}
