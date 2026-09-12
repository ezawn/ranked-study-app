/**
 * Physics: Motion and Forces.
 *
 * Every question here is built backwards from its answer. `F = ma` is not
 * written by choosing a force and a mass and hoping the division is kind — it
 * is written by choosing a = 3 m/s² and m = 4 kg and then stating F = 12 N, so
 * the arithmetic the student is asked to do is arithmetic this file has already
 * done. `exact()`, `exactDiv()` and `exactSqrt()` make that a build-time
 * property rather than a hope: a generator that picks parameters which do not
 * divide throws where the test harness sees it, instead of shipping a question
 * whose answer is 1.7142857 m/s².
 *
 * Three consequences worth stating before the generators.
 *
 * CONSTANTS ARE QUOTED, ALWAYS — "take g = 10 N/kg". Boards use 9.8, 9.81 and
 * 10, and a student who used a different one is not wrong. Saying which value
 * to use removes the argument and keeps the numbers mental.
 *
 * GRAPHS ARE DESCRIBED IN WORDS: "a straight line from (2 s, 4 m/s) to
 * (6 s, 20 m/s)". The bank holds no images, and a velocity–time graph given by
 * its endpoints asks a student for exactly the same thing a drawn one does —
 * find the gradient, find the area — without pretending to a figure that is not
 * there.
 *
 * DISTRACTORS ARE THIS SUBJECT'S NAMED MISTAKES: dividing where you should
 * multiply, leaving a mass in grams, using weight where the equation wants
 * mass, reading a point off a graph instead of a gradient, forgetting that the
 * area under a triangle is halved, forgetting that pressure needs m² and not
 * cm². Each one carries a comment naming the error, because a wrong option
 * whose mistake nobody can name is noise, and a student learns to spot noise
 * faster than they learn the physics.
 *
 * Every generator carries a `check` that re-derives its answer along a second
 * route — suvat cross-checked against average velocity, a force balance
 * cross-checked against work done, components recombined by Pythagoras,
 * moments summed rather than ratioed. The build and the check have to agree
 * before a question can reach a student.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  exact,
  exactDiv,
  exactSqrt,
  num,
  qty,
  sup,
  wrongOptions,
  G_GCSE,
} from "./physics-kit";

/* ==========================================================================
   Units and small helpers
   ========================================================================== */

const MS2 = `m/s${sup(2)}`;
const M2 = `m${sup(2)}`;
const CM2 = `cm${sup(2)}`;
const M3 = `m${sup(3)}`;
const KGM3 = `kg/m${sup(3)}`;

/**
 * A wrong value, written the way a student would write it after the mistake.
 *
 * Distractors come from real errors, and a real error does not land on a round
 * number — dividing where you should multiply gives 0.333… So the mistake is
 * computed honestly and then rounded to what someone would actually write down.
 * Non-finite results (a mistake that divides by zero) come back empty and are
 * dropped by `pickDistractors` rather than shown as "Infinity N".
 */
function slip(value: number, unit: string, places = 2): string {
  if (!Number.isFinite(value)) return "";
  const scale = Math.pow(10, places);
  return qty(Math.round(value * scale) / scale, unit);
}

/** Agreement to floating-point tolerance, for the `check` hooks. */
function agrees(a: number, b: number, tolerance = 1e-6): boolean {
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}

/* Context words. Their only job is to widen the space of distinct prompts:
   a generator dealing 30 variants needs 30 genuinely different questions, and
   numbers alone run out faster than numbers crossed with subjects. */
const MOVERS = [
  "cyclist", "runner", "tram", "drone", "go-kart", "ferry", "skateboarder",
  "delivery van", "rowing boat", "model train", "ice skater", "quad bike",
];
const VEHICLES = ["car", "lorry", "motorbike", "coach", "tractor", "van", "train", "bus"];
const OBJECTS = ["trolley", "crate", "sledge", "wooden block", "cart", "suitcase", "toy car", "sack of sand"];
const FALLERS = ["skydiver", "parachutist", "hailstone", "steel ball", "raindrop", "seed pod"];
const DROPPED = ["stone", "ball", "coin", "brick", "apple", "spanner", "marble"];
const LIQUIDS = [
  { name: "water", rho: 1000 },
  { name: "sea water", rho: 1030 },
  { name: "cooking oil", rho: 800 },
  { name: "glycerol", rho: 1300 },
  { name: "brine", rho: 1200 },
  { name: "mercury", rho: 13600 },
];

export const physicsMotion: Generator[] = [
  /* ========================================================================
     phy-motion / speed-distance-time
     ======================================================================== */

  generator({
    key: "phy.motion.speed",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "speed-distance-time",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 16,
    build: (rng) => {
      /* The speed is chosen first and the distance built from it, so the
         division the student does can only come out whole. */
      const speed = rng.int(2, 30);
      const time = rng.int(3, 15);
      const distance = exact(speed * time, 0, "distance");
      const mover = rng.pick(MOVERS);

      const answer = qty(speed, "m/s");

      return {
        prompt: `A ${mover} travels ${distance} m in ${time} s at a steady speed. Calculate its speed.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(time / distance, "m/s"), // divided time by distance — the fraction upside down
          slip(distance * time, "m/s"), // multiplied instead of divided
          slip(distance - time, "m/s"), // subtracted the two numbers
          slip(distance / (time * 60), "m/s"), // read the time as minutes and converted anyway
        ]),
        explanation:
          `Speed = distance ÷ time = ${distance} m ÷ ${time} s = ${speed} m/s. ` +
          `Checking it the other way, ${speed} m/s for ${time} s covers ${speed} × ${time} = ${distance} m.`,
        /* Built by multiplying; verified by dividing the other way round, so the
           answer has to recover the stated time as well as the stated distance. */
        check: () =>
          agrees(distance / speed, time)
            ? null
            : `${distance} m at ${speed} m/s takes ${distance / speed} s, not ${time} s`,
      };
    },
  }),

  generator({
    key: "phy.motion.speed-units",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "speed-distance-time",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const mode = rng.pick(["distance", "time", "convert"] as const);

      if (mode === "distance") {
        /* Minutes in the prompt, seconds in the equation. The whole question is
           whether the student converts before multiplying. */
        const speed = rng.int(4, 30);
        const minutes = rng.int(2, 12);
        const seconds = minutes * 60;
        const distance = exact(speed * seconds, 0, "distance");
        const mover = rng.pick(MOVERS);

        const answer = qty(distance, "m");

        return {
          prompt: `A ${mover} moves at a steady ${speed} m/s for ${minutes} minutes. How far does it travel?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(speed * minutes, "m"), // never converted minutes to seconds
            slip(distance * 60, "m"), // converted twice
            slip(seconds / speed, "m"), // divided instead of multiplied
            slip(speed + seconds, "m"), // added the two numbers
          ]),
          explanation:
            `${minutes} minutes = ${minutes} × 60 = ${seconds} s. ` +
            `Distance = speed × time = ${speed} m/s × ${seconds} s = ${distance} m. ` +
            `Using ${minutes} s instead would give ${speed * minutes} m, sixty times too small.`,
          check: () =>
            agrees(distance / seconds, speed) && seconds === minutes * 60
              ? null
              : `${distance} m in ${seconds} s is ${distance / seconds} m/s, not ${speed} m/s`,
        };
      }

      if (mode === "time") {
        const speed = rng.int(2, 25);
        const time = rng.int(4, 40);
        const distance = exact(speed * time, 0, "distance");
        const mover = rng.pick(MOVERS);

        const answer = qty(time, "s");

        return {
          prompt: `How long does a ${mover} take to travel ${distance} m at a steady ${speed} m/s?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(distance * speed, "s"), // multiplied instead of divided
            slip(speed / distance, "s"), // the fraction upside down
            slip(distance - speed, "s"), // subtracted
            slip(distance / (speed * 60), "s"), // answered in minutes but labelled seconds
          ]),
          explanation:
            `Time = distance ÷ speed = ${distance} m ÷ ${speed} m/s = ${time} s. ` +
            `Substituting back: ${speed} m/s × ${time} s = ${distance} m.`,
          check: () =>
            agrees(speed * time, distance)
              ? null
              : `${speed} m/s for ${time} s is ${speed * time} m, not ${distance} m`,
        };
      }

      /* km/h → m/s. Speeds chosen as multiples of 5 m/s so the km/h figure is a
         whole number and the division by 3.6 is one a student can do. */
      const speed = rng.pick([5, 10, 15, 20, 25, 30, 35, 40]);
      const kmh = exact(speed * 3.6, 1, "km/h");
      const vehicle = rng.pick(VEHICLES);

      const answer = qty(speed, "m/s");

      return {
        prompt: `A ${vehicle} is travelling at ${kmh} km/h. Convert this speed to m/s.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(kmh * 3.6, "m/s"), // multiplied by 3.6 instead of dividing
          slip(kmh / 60, "m/s"), // turned hours into minutes and stopped there
          slip((kmh * 1000) / 60, "m/s"), // km → m done, hours → minutes only
          slip(kmh / 1000, "m/s"), // divided by 1000 and forgot the time
        ]),
        explanation:
          `${kmh} km/h = ${kmh} × 1000 = ${kmh * 1000} m in 3600 s, ` +
          `so the speed is ${kmh * 1000} ÷ 3600 = ${speed} m/s. ` +
          `The short cut is ÷ 3.6, and it divides — multiplying gives ${kmh * 3.6}, far too fast.`,
        /* Re-derived forwards through metres per hour rather than backwards
           through the 3.6 short cut. */
        check: () =>
          agrees((speed * 3600) / 1000, kmh)
            ? null
            : `${speed} m/s is ${(speed * 3600) / 1000} km/h, not ${kmh} km/h`,
      };
    },
  }),

  /* ========================================================================
     phy-motion / acceleration
     ======================================================================== */

  generator({
    key: "phy.motion.acceleration",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "acceleration",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      /* Acceleration chosen first, then the velocity change built from it. A
         slowing object starts fast enough that it never reaches a negative
         velocity, which would be a different question entirely. */
      const speedingUp = rng.bool();
      const size = rng.int(1, 8);
      const time = rng.int(2, 12);
      const start = speedingUp ? rng.int(0, 20) : size * time + rng.int(0, 20);
      const end = speedingUp ? start + size * time : start - size * time;
      const signed = speedingUp ? size : -size;
      const mover = rng.pick(MOVERS);

      const answer = qty(signed, MS2);
      const opening = speedingUp && start === 0
        ? `A ${mover} starts from rest and reaches ${end} m/s in ${time} s.`
        : `A ${mover} ${speedingUp ? "speeds up" : "slows down"} from ${start} m/s to ${end} m/s in ${time} s.`;

      return {
        prompt: `${opening} Calculate its acceleration.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(end / time, MS2), // forgot to subtract the starting velocity
          slip(-signed, MS2), // right size, sign the wrong way round
          slip(end - start, MS2), // change in velocity, never divided by the time
          slip(time / (end - start), MS2), // the fraction upside down
          slip(start / time, MS2), // used the initial velocity instead of the change
        ]),
        explanation:
          `Change in velocity = ${end} − ${start} = ${end - start} m/s. ` +
          `Acceleration = change in velocity ÷ time = ${end - start} ÷ ${time} = ${signed} ${MS2}` +
          (speedingUp ? "." : ", and the minus sign is what says it is slowing down."),
        /* A second route: the distance from the average velocity must match the
           distance from s = ut + ½at². Those agree only if the acceleration is
           right, so this catches a slip the division alone would not. */
        check: () => {
          const fromAverage = ((start + end) / 2) * time;
          const fromSuvat = start * time + 0.5 * signed * time * time;
          return agrees(fromAverage, fromSuvat)
            ? null
            : `average velocity gives ${fromAverage} m but suvat gives ${fromSuvat} m`;
        },
      };
    },
  }),

  generator({
    key: "phy.motion.acceleration-rearranged",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "acceleration",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      const mode = rng.pick(["final", "time", "fall"] as const);

      if (mode === "final") {
        const start = rng.int(2, 24);
        const rate = rng.int(1, 9);
        const time = rng.int(2, 12);
        const end = exact(start + rate * time, 0, "final velocity");
        const mover = rng.pick(MOVERS);

        const answer = qty(end, "m/s");

        return {
          prompt:
            `A ${mover} is moving at ${start} m/s when it accelerates at ${rate} ${MS2} for ${time} s. ` +
            `Calculate its final velocity.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(rate * time, "m/s"), // forgot to add the starting velocity
            slip(start + rate, "m/s"), // ignored how long the acceleration lasted
            slip(start - rate * time, "m/s"), // subtracted, as if it were slowing
            slip(start * rate * time, "m/s"), // multiplied everything together
          ]),
          explanation:
            `v = u + at = ${start} + ${rate} × ${time} = ${start} + ${rate * time} = ${end} m/s. ` +
            `The acceleration adds ${rate} m/s to the velocity every second for ${time} s.`,
          check: () =>
            agrees((end - start) / time, rate)
              ? null
              : `going ${start} → ${end} m/s in ${time} s is ${(end - start) / time} ${MS2}, not ${rate}`,
        };
      }

      if (mode === "time") {
        const start = rng.int(0, 18);
        const rate = rng.int(1, 9);
        const time = rng.int(3, 15);
        const end = exact(start + rate * time, 0, "final velocity");
        const mover = rng.pick(MOVERS);

        const answer = qty(time, "s");

        return {
          prompt:
            `A ${mover} accelerates uniformly at ${rate} ${MS2} from ${start} m/s to ${end} m/s. ` +
            `How long does this take?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(end / rate, "s"), // forgot to subtract the starting velocity
            slip((end - start) * rate, "s"), // multiplied instead of divided
            slip(rate / (end - start), "s"), // the fraction upside down
            slip((end + start) / rate, "s"), // added the velocities instead of subtracting
          ]),
          explanation:
            `Rearranging a = (v − u) ÷ t gives t = (v − u) ÷ a = ` +
            `(${end} − ${start}) ÷ ${rate} = ${end - start} ÷ ${rate} = ${time} s.`,
          check: () =>
            agrees(start + rate * time, end)
              ? null
              : `${start} m/s plus ${rate} ${MS2} for ${time} s is ${start + rate * time} m/s, not ${end}`,
        };
      }

      /* Free fall, with g quoted. 10 m/s² keeps every velocity whole. */
      const time = rng.int(2, 12);
      const speed = exact(G_GCSE * time, 0, "fall speed");
      const object = rng.pick(DROPPED);

      const answer = qty(speed, "m/s");

      return {
        prompt:
          `A ${object} is dropped from rest and falls freely. Take g = ${G_GCSE} ${MS2}. ` +
          `How fast is it moving after ${time} s?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(0.5 * G_GCSE * time * time, "m/s"), // used the distance equation, not the velocity one
          slip(G_GCSE + time, "m/s"), // added g and t
          slip(G_GCSE / time, "m/s"), // divided by the time
          slip(G_GCSE * time * time, "m/s"), // squared the time as well
        ]),
        explanation:
          `Starting from rest, v = gt = ${G_GCSE} × ${time} = ${speed} m/s. ` +
          `It gains ${G_GCSE} m/s of speed every second, so after ${time} s it has gained ${speed} m/s.`,
        /* Independent route: the distance fallen is s = ½gt², and v² = 2gs must
           reproduce the same velocity without ever using v = gt. */
        check: () => {
          const fallen = 0.5 * G_GCSE * time * time;
          return agrees(speed * speed, 2 * G_GCSE * fallen)
            ? null
            : `v² = ${speed * speed} but 2gs = ${2 * G_GCSE * fallen}`;
        },
      };
    },
  }),

  /* ========================================================================
     phy-motion / velocity-time-graphs
     ======================================================================== */

  generator({
    key: "phy.motion.vt-gradient",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "velocity-time-graphs",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 15,
    build: (rng) => {
      /* The section deliberately does not start at the origin. A student who
         reads one point and divides gets a plausible wrong answer, which is
         exactly the mistake this question is for. */
      const rate = rng.int(1, 8);
      const startTime = rng.int(1, 9);
      const span = rng.int(2, 10);
      const endTime = startTime + span;
      const startV = rng.int(0, 14);
      const endV = exact(startV + rate * span, 0, "final velocity");
      const mover = rng.pick(MOVERS);

      const answer = qty(rate, MS2);

      return {
        prompt:
          `On a velocity–time graph for a ${mover}, a straight line runs from ` +
          `(${startTime} s, ${startV} m/s) to (${endTime} s, ${endV} m/s). ` +
          `Calculate the acceleration over this section.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(endV / endTime, MS2), // read one point off the graph instead of the gradient
          slip((endV - startV) / endTime, MS2), // divided by the final time, not the time interval
          slip(endV - startV, MS2), // found the rise and stopped there
          slip(span / (endV - startV), MS2), // gradient upside down
        ]),
        explanation:
          `Gradient = rise ÷ run = (${endV} − ${startV}) ÷ (${endTime} − ${startTime}) = ` +
          `${endV - startV} ÷ ${span} = ${rate} ${MS2}. ` +
          `Dividing ${endV} by ${endTime} uses a point rather than the change, which only works from the origin.`,
        /* Different relation: under constant acceleration the velocity halfway
           through the interval is the mean of the endpoint velocities. */
        check: () => {
          const midpoint = startV + rate * (span / 2);
          return agrees(midpoint, (startV + endV) / 2)
            ? null
            : `midway the line reads ${midpoint} m/s but the mean velocity is ${(startV + endV) / 2} m/s`;
        },
      };
    },
  }),

  generator({
    key: "phy.motion.vt-area",
    subject: "physics",
    topic: "phy-motion",
    subtopic: "velocity-time-graphs",
    curriculumLevel: "YEAR_10",
    difficulty: 5,
    variants: 15,
    build: (rng) => {
      const shape = rng.pick(["triangle", "trapezium", "two-stage"] as const);
      const mover = rng.pick(MOVERS);

      if (shape === "triangle") {
        /* An even final velocity keeps ½vt whole however long the ramp is. */
        const top = 2 * rng.int(2, 15);
        const time = rng.int(3, 12);
        const distance = exact((top * time) / 2, 0, "area under the graph");

        const answer = qty(distance, "m");

        return {
          prompt:
            `A velocity–time graph shows a ${mover} accelerating uniformly from rest to ${top} m/s ` +
            `over ${time} s. Use the area under the graph to find the distance travelled.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(top * time, "m"), // used the whole rectangle — forgot to halve the triangle
            slip(top / time, "m"), // found the acceleration instead of the distance
            slip(top + time, "m"), // added the two readings
            slip((top * time) / 4, "m"), // halved twice
          ]),
          explanation:
            `The area is a triangle: ½ × base × height = ½ × ${time} s × ${top} m/s = ${distance} m. ` +
            `The full rectangle, ${top * time} m, would be the distance only if it moved at ${top} m/s the whole time.`,
          /* Second route: through suvat, using a = v/t and s = ½at². */
          check: () => {
            const rate = top / time;
            return agrees(0.5 * rate * time * time, distance)
              ? null
              : `s = ½at² gives ${0.5 * rate * time * time} m, not ${distance} m`;
          },
        };
      }

      if (shape === "trapezium") {
        const start = rng.int(2, 16);
        const end = start + 2 * rng.int(1, 12);
        let time = rng.int(3, 12);
        /* (u + v) is even here, so ½(u + v)t is whole for any t — but keep the
           guard, because a future edit to the ranges must not quietly break it. */
        if (((start + end) * time) % 2 !== 0) time += 1;
        const distance = exact(((start + end) / 2) * time, 0, "area under the graph");

        const answer = qty(distance, "m");

        return {
          prompt:
            `A velocity–time graph for a ${mover} is a straight line from ${start} m/s to ${end} m/s ` +
            `over ${time} s. Find the distance travelled in that time.`,
          answer,
          distractors: pickDistractors(answer, [
            slip((start + end) * time, "m"), // forgot to halve the trapezium
            slip(((end - start) / 2) * time, "m"), // subtracted the velocities instead of adding
            slip(start * time, "m"), // used the starting velocity as if it were constant
            slip(end * time, "m"), // used the final velocity as if it were constant
          ]),
          explanation:
            `The area is a trapezium: ½ × (${start} + ${end}) × ${time} = ` +
            `${(start + end) / 2} × ${time} = ${distance} m. ` +
            `The average velocity is ${(start + end) / 2} m/s because the acceleration is uniform.`,
          check: () => {
            const rate = (end - start) / time;
            return agrees(start * time + 0.5 * rate * time * time, distance)
              ? null
              : `s = ut + ½at² gives ${start * time + 0.5 * rate * time * time} m, not ${distance} m`;
          },
        };
      }

      /* Constant speed, then a ramp down to rest: a rectangle plus a triangle,
         which is the commonest shape a real exam graph takes. */
      const cruise = 2 * rng.int(2, 12);
      const flat = rng.int(3, 20);
      const brake = rng.int(2, 12);
      const distance = exact(cruise * flat + (cruise * brake) / 2, 0, "area under the graph");

      const answer = qty(distance, "m");

      return {
        prompt:
          `A ${mover} travels at a steady ${cruise} m/s for ${flat} s and then decelerates uniformly ` +
          `to rest over the next ${brake} s. Use the area under the velocity–time graph to find the total distance.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(cruise * flat + cruise * brake, "m"), // treated the braking section as a rectangle too
          slip(cruise * flat, "m"), // counted only the steady section
          slip((cruise * (flat + brake)) / 2, "m"), // halved the whole graph
          slip((cruise * brake) / 2, "m"), // counted only the braking triangle
        ]),
        explanation:
          `Rectangle: ${cruise} × ${flat} = ${cruise * flat} m. ` +
          `Triangle: ½ × ${brake} × ${cruise} = ${(cruise * brake) / 2} m. ` +
          `Total = ${cruise * flat} + ${(cruise * brake) / 2} = ${distance} m.`,
        /* The braking distance is re-derived from v² = u² + 2as instead of from
           the triangle's area, so the two halves of the graph are checked by
           two different equations. */
        check: () => {
          const rate = -cruise / brake;
          const braking = (0 - cruise * cruise) / (2 * rate);
          return agrees(cruise * flat + braking, distance)
            ? null
            : `v² = u² + 2as gives a total of ${cruise * flat + braking} m, not ${distance} m`;
        },
      };
    },
  }),
];
