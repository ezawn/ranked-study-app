/**
 * A-Level Applied: mechanics and statistics.
 *
 * Mechanics questions are built from a consistent physical situation — pick the
 * acceleration and the time, then derive every other quantity — so the numbers
 * in a SUVAT question always describe a motion that could actually happen. The
 * `check` hooks re-derive each answer through a different SUVAT equation, which
 * is exactly how a student is taught to check their own work.
 *
 * Statistics uses exact binomial arithmetic rather than a normal
 * approximation, and the normal-distribution questions quote standard results
 * rather than integrating, which is what the specification expects.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { Rational, rat } from "./rational";
import { sup, toPlaces, toSigFigs } from "./format";

/** Gravity, to the value used throughout A-Level mechanics. */
const G = 9.8;

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
}

/**
 * P(X = k) for X ~ B(n, p).
 *
 * Floating point here, deliberately, where the rest of the bank uses exact
 * fractions. p^k(1−p)^(n−k) with p = 1/10 and n = 30 has a denominator of
 * 10^30, which is far past the range integers stay exact in — the `assertSafe`
 * guard in `rational.ts` catches it rather than silently rounding, which is how
 * this was found. The answers are quoted to 4 significant figures, so double
 * precision is ample; what mattered was not pretending to an exactness the
 * arithmetic could not deliver.
 */
function binomialPmf(n: number, k: number, p: number): number {
  return choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

export const aLevelApplied: Generator[] = [
  generator({
    key: "alevel.applied.suvat-displacement",
    topic: "mechanics",
    subtopic: "suvat",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      /* Even acceleration and whole seconds, so ½at² is a whole number and the
         answer can be worked out on paper. */
      const u = rng.int(0, 25);
      const a = rng.pick([-8, -6, -4, -2, 2, 4, 6, 8]);
      const t = rng.int(2, 10);

      const s = u * t + 0.5 * a * t * t;
      const v = u + a * t;
      const answer = `${s} m`;

      return {
        prompt:
          `A particle moves in a straight line with constant acceleration ${a} m s⁻². ` +
          `It starts with velocity ${u} m s⁻¹. Find its displacement after ${t} s.`,
        answer,
        distractors: pickDistractors(answer, [
          `${u * t + a * t * t} m`, // forgot the half
          `${u * t} m`, // ignored the acceleration
          `${v} m`, // gave the final velocity
          `${0.5 * a * t * t} m`,
          `${s + t} m`,
        ]),
        explanation:
          `s = ut + ½at² = ${u}(${t}) + ½(${a})(${t})² = ${u * t} ${0.5 * a * t * t >= 0 ? "+" : "−"} ${Math.abs(0.5 * a * t * t)} = ${answer}. ` +
          `The half applies only to the acceleration term.`,
        check: () => {
          /* Re-derive through v² = u² + 2as, a completely different equation. */
          const vSquared = u * u + 2 * a * s;
          return Math.abs(vSquared - v * v) < 1e-6
            ? null
            : `v² = u² + 2as gives ${vSquared}, but v² = ${v * v}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.applied.suvat-velocity",
    topic: "mechanics",
    subtopic: "suvat",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /*
       * Built backwards from a whole-number final speed.
       *
       * v² = u² + 2as with arbitrary numbers gives √457, which is a calculator
       * question about a square root rather than a mechanics question about
       * choosing the right equation. So u and v are chosen first and s is
       * derived, making the answer exact.
       */
      const u = rng.int(0, 12) * 2;
      const v = u + rng.int(2, 14) * 2;
      const aUsed = rng.pick([1, 2, 4, 5, 8, 10]);
      const s = (v * v - u * u) / (2 * aUsed);
      const usable = v * v;
      const answer = `${v} m s⁻¹`;

      return {
        prompt:
          `A particle starts at ${u} m s⁻¹ and accelerates uniformly at ${aUsed} m s⁻² ` +
          `over a displacement of ${s} m. Find its final speed.`,
        answer,
        distractors: pickDistractors(answer, [
          `${usable} m s⁻¹`, // forgot the square root
          `${u + aUsed * s} m s⁻¹`, // used s where t belongs
          `${u + v} m s⁻¹`,
          `${v / 2} m s⁻¹`,
          `${v + aUsed} m s⁻¹`,
        ]),
        explanation:
          `No time is given, so use v² = u² + 2as = ${u * u} + 2(${aUsed})(${s}) = ${usable}. ` +
          `Then v = √${usable} = ${answer}. Choosing the SUVAT equation without t is the whole skill here.`,
        check: () => {
          const t = aUsed === 0 ? null : (v - u) / aUsed;
          if (t === null) return null;
          const sCheck = u * t + 0.5 * aUsed * t * t;
          return Math.abs(sCheck - s) < 1e-6 ? null : `s = ut + ½at² gives ${sCheck}, expected ${s}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.applied.newton-second-law",
    topic: "mechanics",
    subtopic: "forces",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 22,
    build: (rng) => {
      /* Chosen so the acceleration is a whole number — the question is F = ma,
         not long division. */
      const mass = rng.int(2, 25);
      const acceleration = rng.int(1, 9);
      const net = mass * acceleration;
      const resistance = rng.int(5, 60);
      const applied = net + resistance;
      const answer = `${acceleration} m s⁻²`;

      return {
        prompt:
          `A ${mass} kg box is pulled along a rough horizontal floor by a force of ${applied} N. ` +
          `A resistance of ${resistance} N opposes the motion. Find the acceleration.`,
        answer,
        distractors: pickDistractors(answer, [
          `${rat(applied, mass)} m s⁻²`, // ignored the resistance
          `${rat(applied + resistance, mass)} m s⁻²`, // added the resistance
          `${net} m s⁻²`, // gave the net force
          `${rat(mass, net)} m s⁻²`,
          `${acceleration * 2} m s⁻²`,
        ]),
        explanation:
          `Resolve horizontally: the resultant force is ${applied} − ${resistance} = ${net} N. ` +
          `F = ma gives a = ${net} ÷ ${mass} = ${answer}. ` +
          `The resistance opposes motion, so it subtracts.`,
        check: () =>
          Math.abs(mass * acceleration - net) < 1e-9
            ? null
            : `F = ma does not hold: ${mass * acceleration} vs ${net}`,
      };
    },
  }),

  generator({
    key: "alevel.applied.projectile",
    topic: "mechanics",
    subtopic: "projectiles",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 20,
    /* Resolving at 35° and dividing by 9.8 is a calculator exercise however the
       numbers are chosen. Kept for practice, kept out of battles. */
    calculator: true,
    build: (rng) => {
      const speed = rng.int(10, 40);
      const angle = rng.pick([15, 25, 30, 35, 40, 45, 50, 60]);
      const radians = (angle * Math.PI) / 180;

      const vertical = speed * Math.sin(radians);
      const horizontal = speed * Math.cos(radians);
      const timeOfFlight = (2 * vertical) / G;
      const range = horizontal * timeOfFlight;
      const maxHeight = (vertical * vertical) / (2 * G);
      const wantRange = rng.bool();

      const answer = `${toPlaces(wantRange ? range : maxHeight, 3)} m`;

      return {
        prompt:
          `A projectile is launched from ground level at ${speed} m s⁻¹ at ${angle}° to the horizontal. ` +
          `Taking g = ${G} m s⁻², find its ${wantRange ? "range" : "maximum height"}, to 3 decimal places.`,
        answer,
        distractors: pickDistractors(answer, [
          `${toPlaces(wantRange ? maxHeight : range, 3)} m`, // answered the other part
          `${toPlaces(wantRange ? horizontal * (vertical / G) : (vertical * vertical) / G, 3)} m`, // half the flight time, or forgot the 2
          `${toPlaces(wantRange ? speed * timeOfFlight : speed * speed / (2 * G), 3)} m`, // used the full speed, not the component
          `${toPlaces((wantRange ? range : maxHeight) * 2, 3)} m`,
        ]),
        explanation:
          `Resolve: u_x = ${speed}cos ${angle}° = ${toPlaces(horizontal, 3)}, u_y = ${speed}sin ${angle}° = ${toPlaces(vertical, 3)}. ` +
          (wantRange
            ? `Time of flight = 2u_y/g = ${toPlaces(timeOfFlight, 3)} s, and range = u_x × t = ${answer}. ` +
              `Horizontal motion has no acceleration, so the range is just speed × time.`
            : `At the top the vertical velocity is zero, so u_y² = 2gh gives h = ${answer}. ` +
              `Only the vertical component matters for height.`),
        check: () => {
          /* Vertical displacement over the full flight must return to zero. */
          const s = vertical * timeOfFlight - 0.5 * G * timeOfFlight * timeOfFlight;
          return Math.abs(s) < 1e-6 ? null : `projectile does not land: vertical displacement ${s}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.applied.moments",
    topic: "mechanics",
    subtopic: "moments",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      /* Arms and weight chosen so the unknown force is a whole number. */
      const otherArm = rng.int(2, 6);
      const pivot = rng.int(2, 6);
      const length = pivot + otherArm;
      const distance = rng.int(1, pivot);
      /* The moment is chosen first and both forces derived from it, so neither
         the weight nor the answer picks up a fraction. */
      const moment = rng.int(2, 40) * distance * otherArm;
      const force = moment / otherArm;
      const weight = moment / distance;
      const answer = `${force} N`;

      return {
        prompt:
          `A light rod of length ${length} m rests on a pivot ${pivot} m from its left end. ` +
          `A weight of ${weight} N hangs ${distance} m to the LEFT of the pivot. ` +
          `What force applied at the right-hand end keeps the rod in equilibrium?`,
        answer,
        distractors: pickDistractors(answer, [
          `${weight} N`, // balanced the forces, not the moments
          `${rat(weight * otherArm, distance).toString()} N`, // arms the wrong way round
          `${weight * distance} N`, // gave the moment
          `${rat(weight * distance, length).toString()} N`, // used the whole rod as the arm
          `${rat(weight * distance, pivot).toString()} N`, // used the near arm
          `${force / 2} N`,
          `${force * 2} N`,
        ]),
        explanation:
          `Taking moments about the pivot, clockwise = anticlockwise. ` +
          `The weight gives ${weight} × ${distance} = ${weight * distance} N m. ` +
          `The unknown force acts ${otherArm} m from the pivot, so F × ${otherArm} = ${weight * distance}, ` +
          `giving F = ${answer}. Balancing forces alone is not enough — a rod can be in force ` +
          `equilibrium and still rotate.`,
        check: () =>
          Math.abs(force * otherArm - weight * distance) < 1e-9
            ? null
            : `moments do not balance: ${force * otherArm} vs ${weight * distance}`,
      };
    },
  }),

  generator({
    key: "alevel.applied.binomial-exact",
    topic: "statistics",
    subtopic: "binomial",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      /*
       * p = ½, so every probability is C(n, k)/2ⁿ — an exact fraction a student
       * can write down. With p = 0.3 the answer is 0.2668 and the question
       * becomes "can you type nCr", which is not the binomial distribution.
       */
      const n = rng.int(4, 10);
      const p = rat(1, 2);
      const k = rng.int(1, n - 1);

      const pv = 0.5;
      const exact = rat(choose(n, k), Math.pow(2, n));
      const probability = exact.toNumber();
      const answer = exact.toString();

      return {
        prompt: `X ~ B(${n}, ${p}). Find the exact value of P(X = ${k}).`,
        answer,
        distractors: pickDistractors(answer, [
          rat(1, Math.pow(2, n)).toString(), // dropped the binomial coefficient
          rat(choose(n, k), Math.pow(2, k)).toString(), // dropped the failure term
          rat(choose(n, k + 1), Math.pow(2, n)).toString(),
          exact.mul(rat(2)).toString(),
          rat(choose(n, k), n).toString(),
        ]),
        explanation:
          `P(X = ${k}) = C(${n}, ${k}) × (½)${sup(k)} × (½)${sup(n - k)} = C(${n}, ${k})/2${sup(n)} = ` +
          `${choose(n, k)}/${Math.pow(2, n)} = ${answer}. ` +
          `With p = ½ the successes and failures combine into a single power of two, which is why ` +
          `this case is worth recognising.`,
        check: () => {
          /* The whole distribution must sum to 1. */
          let total = 0;
          for (let i = 0; i <= n; i++) total += binomialPmf(n, i, pv);
          if (Math.abs(total - 1) > 1e-9) return `distribution sums to ${total}, not 1`;
          return Math.abs(binomialPmf(n, k, pv) - probability) < 1e-12
            ? null
            : `exact fraction disagrees with the pmf`;
        },
      };
    },
  }),

  generator({
    key: "alevel.applied.binomial-mean",
    topic: "statistics",
    subtopic: "binomial",
    curriculumLevel: "YEAR_12",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const n = rng.int(10, 200);
      const pNum = rng.int(1, 9);
      const p = rat(pNum, 10);
      const wantMean = rng.bool();

      const mean = rat(n).mul(p);
      const variance = mean.mul(rat(1).sub(p));
      const answer = (wantMean ? mean : variance).toString();

      return {
        prompt: `X ~ B(${n}, ${p}). Find ${wantMean ? "E(X)" : "Var(X)"}.`,
        answer,
        distractors: pickDistractors(answer, [
          (wantMean ? variance : mean).toString(), // gave the other statistic
          rat(n).mul(p).mul(p).toString(),
          rat(n).div(p).toString(),
          (wantMean ? mean.add(rat(1)) : variance.mul(rat(2))).toString(),
        ]),
        explanation: wantMean
          ? `E(X) = np = ${n} × ${p} = ${answer}.`
          : `Var(X) = np(1 − p) = ${n} × ${p} × ${rat(1).sub(p)} = ${answer}. ` +
            `The variance is always smaller than the mean for a binomial, because (1 − p) < 1.`,
        check: () => {
          const m = mean.toNumber();
          const v = variance.toNumber();
          return v <= m + 1e-9 ? null : `variance ${v} exceeds mean ${m}`;
        },
      };
    },
  }),

  generator({
    key: "alevel.applied.normal-standardise",
    topic: "statistics",
    subtopic: "normal",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 22,
    build: (rng) => {
      /* x is placed a whole number of standard deviations from the mean, so z
         is exact and the question is about the formula, not the division. */
      const mean = rng.int(4, 40) * 5;
      /* An even standard deviation keeps a half-step of z landing on a whole
         number of units, so the prompt never quotes a decimal. */
      const sd = rng.int(1, 12) * 2;
      const steps = rat(rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]), 2);
      const x = mean + steps.mul(rat(sd)).toNumber();

      const z = steps.toNumber();
      const answer = steps.toString();

      return {
        prompt:
          `X ~ N(${mean}, ${sd}²). Find the z-value corresponding to X = ${x}, ` +
          `Give an exact answer.`,
        answer,
        distractors: pickDistractors(answer, [
          steps.neg().toString(), // subtracted the wrong way round
          rat(Math.round((x - mean) * 2), sd * sd * 2).toString(), // divided by the variance
          String(x - mean), // never divided
          steps.mul(rat(2)).toString(),
          steps.div(rat(2)).toString(),
        ]),
        explanation:
          `z = (x − μ)/σ = (${x} − ${mean})/${sd} = ${answer}. ` +
          `The denominator is the standard deviation, not the variance — ` +
          `N(${mean}, ${sd}²) states the variance, so σ = ${sd}.`,
        check: () =>
          Math.abs(mean + z * sd - x) < 1e-9 ? null : `standardising does not invert back to ${x}`,
      };
    },
  }),

  generator({
    key: "alevel.applied.hypothesis-test",
    topic: "statistics",
    subtopic: "hypothesis-testing",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      const n = rng.int(15, 30);
      const p0 = rat(rng.pick([1, 2, 3]), 10);
      const observed = rng.int(Math.ceil(n * p0.toNumber()) + 1, n);
      const alpha = rng.pick([0.05, 0.1, 0.01]);

      /* P(X ≥ observed) under the null. */
      let tail = 0;
      for (let k = observed; k <= n; k++) tail += binomialPmf(n, k, p0.toNumber());

      const reject = tail < alpha;
      const answer = reject
        ? "Reject H₀ — there is evidence the proportion has increased"
        : "Do not reject H₀ — there is insufficient evidence";

      return {
        prompt:
          `A test of H₀: p = ${p0} against H₁: p > ${p0} uses a sample of ${n}, ` +
          `at the ${alpha * 100}% significance level. ${observed} successes are observed, ` +
          `and P(X ≥ ${observed}) = ${toSigFigs(tail, 4)}. What is the conclusion?`,
        answer,
        distractors: pickDistractors(answer, [
          reject
            ? "Do not reject H₀ — there is insufficient evidence"
            : "Reject H₀ — there is evidence the proportion has increased",
          "Accept H₀ — the proportion is exactly as stated",
          "The test is inconclusive because the sample is too small",
        ]),
        explanation:
          `The p-value is ${toSigFigs(tail, 4)} and the significance level is ${alpha}. ` +
          `Since ${toSigFigs(tail, 4)} ${reject ? "<" : ">"} ${alpha}, ${reject ? "the result is significant" : "the result is not significant"}, so ${answer.toLowerCase()}. ` +
          `Note that a test never "accepts" H₀ — failing to find evidence against something is not evidence for it.`,
        check: () =>
          tail >= 0 && tail <= 1 ? null : `tail probability ${tail} outside [0, 1]`,
      };
    },
  }),

  generator({
    key: "alevel.applied.conditional-probability",
    topic: "probability",
    subtopic: "conditional",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 22,
    build: (rng) => {
      const bothCount = rng.int(4, 20);
      const aOnly = rng.int(5, 30);
      const bOnly = rng.int(5, 30);
      const neither = rng.int(3, 25);
      const total = bothCount + aOnly + bOnly + neither;

      const pA = rat(bothCount + aOnly, total);
      const pBoth = rat(bothCount, total);
      const answer = pBoth.div(pA).toString();

      return {
        prompt:
          `Of ${total} people, ${bothCount + aOnly} own a bike and ${bothCount} of those also own a car. ` +
          `A person is chosen at random. Given that they own a bike, find the probability they own a car, ` +
          `as a fraction in its simplest form.`,
        answer,
        distractors: pickDistractors(answer, [
          pBoth.toString(), // did not condition
          pBoth.div(rat(bothCount + bOnly, total)).toString(), // conditioned on the wrong event
          rat(aOnly, bothCount + aOnly).toString(), // complement
          pA.toString(),
        ]),
        explanation:
          `P(car | bike) = P(car ∩ bike) ÷ P(bike) = (${bothCount}/${total}) ÷ (${bothCount + aOnly}/${total}) = ` +
          `${bothCount}/${bothCount + aOnly} = ${answer}. ` +
          `Conditioning shrinks the sample space to the ${bothCount + aOnly} bike owners.`,
        check: () => {
          const value = pBoth.div(pA).toNumber();
          return value >= 0 && value <= 1 ? null : `conditional probability ${value} outside [0, 1]`;
        },
      };
    },
  }),

  generator({
    key: "alevel.applied.correlation",
    topic: "statistics",
    subtopic: "correlation",
    curriculumLevel: "YEAR_13",
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      /* Whole-number coefficients: the skill is substituting into the right
         variable, not multiplying 4.1 by 37. */
      const gradient = rng.pick([-8, -5, -3, -2, 2, 3, 4, 6, 7]);
      const intercept = rng.int(-20, 60);
      const x = rng.int(2, 25);
      const predicted = gradient * x + intercept;
      const answer = String(predicted);

      return {
        prompt:
          `A regression line has equation y = ${gradient}x ${intercept >= 0 ? "+" : "−"} ${Math.abs(intercept)}. ` +
          `Use it to predict y when x = ${x}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(gradient + intercept * x), // swapped the roles
          rat(x - intercept, gradient).toString(), // solved for x instead
          String(gradient * x), // forgot the intercept
          String(predicted * 2),
          String(intercept - gradient * x),
        ]),
        explanation:
          `Substitute x = ${x}: y = ${gradient}(${x}) ${intercept >= 0 ? "+" : "−"} ${Math.abs(intercept)} = ${answer}. ` +
          `A regression line predicts y FROM x — using it the other way round is a different line, ` +
          `and reliable only inside the range of the original data.`,
        check: () =>
          Math.abs(gradient * x + intercept - predicted) < 1e-9 ? null : `prediction does not recompute`,
      };
    },
  }),
];
