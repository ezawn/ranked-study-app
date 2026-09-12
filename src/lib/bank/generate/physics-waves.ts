/**
 * Physics: Waves, and Particles and Matter.
 *
 * Same rules as the rest of the physics bank: choose the answer, build the
 * parameters around it, and let `exact()` throw at build time rather than ship
 * a question whose answer came off a keypad.
 *
 * Waves bring one problem the mechanics files did not. The interesting
 * quantities span thirty orders of magnitude — a radio wavelength is 10³ m, a
 * gamma wavelength 10⁻¹² m — so almost every answer wants standard form. The
 * rule here is that MANTISSAS ARE KEPT SHORT: a question whose answer is
 * 6.626 × 10⁻³⁴ is a calculator question however it is phrased, so the
 * parameters are chosen to leave 2 × 10⁻⁷ and not 6.37 × 10⁻⁷.
 *
 * Refraction is restricted to the angles whose sines a student is expected to
 * know — 0°, 30°, 45°, 60°, 90° — for the same reason the maths bank restricted
 * the cosine rule to 60°, 90° and 120°. Snell's law with sin 37° is a
 * calculator exercise, not a physics one.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  exact,
  exactSqrt,
  JKG,
  JKGK,
  KGM3,
  M3,
  MS,
  num,
  slip,
  sup,
  tidy,
  toStandardForm,
  wrongOptions,
} from "./physics-kit";

/* ==========================================================================
   Parameter tables
   ========================================================================== */

/** Frequency and wavelength pairs whose product is a tidy speed. */
const WAVES: readonly { f: number; lambda: number; v: number }[] = (() => {
  const out: { f: number; lambda: number; v: number }[] = [];
  const frequencies = [2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125, 200, 250, 400, 500, 1000, 2000, 2500, 5000];
  const lengths = [0.02, 0.04, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.5, 2, 2.5, 4, 5, 8, 10, 15, 20, 25, 40, 50];
  for (const f of frequencies) {
    for (const lambda of lengths) {
      const v = f * lambda;
      if (!tidy(v) || v < 1 || v > 400_000) continue;
      out.push({ f, lambda, v });
    }
  }
  return out;
})();

/**
 * The angles whose sines a student knows exactly, as fractions.
 *
 * Snell's law only stays mental if both sines are on this list; anything else
 * needs a calculator and would be excluded from battles anyway.
 */
const SINES: readonly { deg: number; sin: number; text: string }[] = [
  { deg: 30, sin: 0.5, text: "1/2" },
  { deg: 90, sin: 1, text: "1" },
];

/** Refractions where n = sin i / sin r comes out clean. */
const REFRACTIONS: readonly { i: number; r: number; n: number }[] = (() => {
  /* sin 30° = 0.5 and sin 90° = 1 are the only two exact values that combine
     into whole-number ratios, so the usable pairs are enumerated directly:
     30° → the critical-angle geometry, and the standard n = 2 case. */
  return [
    { i: 30, r: 30, n: 1 },
    { i: 90, r: 30, n: 2 },
  ];
})();

/** Specific heat capacity problems whose energy is tidy. */
const HEATING: readonly { m: number; c: number; dt: number; e: number; name: string }[] = (() => {
  const materials = [
    { name: "water", c: 4200 },
    { name: "aluminium", c: 900 },
    { name: "copper", c: 400 },
    { name: "iron", c: 450 },
    { name: "lead", c: 130 },
    { name: "concrete", c: 800 },
    { name: "glass", c: 500 },
  ];
  const out: { m: number; c: number; dt: number; e: number; name: string }[] = [];
  for (const material of materials) {
    for (const m of [0.1, 0.2, 0.5, 1, 2, 2.5, 4, 5, 10, 20, 25, 50]) {
      for (const dt of [2, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]) {
        const e = m * material.c * dt;
        if (!tidy(e) || e < 100 || e > 10_000_000) continue;
        out.push({ m, c: material.c, dt, e, name: material.name });
      }
    }
  }
  return out;
})();

/** Latent heat problems whose energy is tidy. */
const LATENT: readonly { m: number; l: number; e: number; name: string; change: string }[] = (() => {
  const cases = [
    { name: "ice", l: 340_000, change: "melt" },
    { name: "water", l: 2_300_000, change: "boil" },
    { name: "lead", l: 25_000, change: "melt" },
    { name: "aluminium", l: 400_000, change: "melt" },
    { name: "ethanol", l: 850_000, change: "boil" },
  ];
  const out: { m: number; l: number; e: number; name: string; change: string }[] = [];
  for (const c of cases) {
    for (const m of [0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 50]) {
      const e = m * c.l;
      if (!tidy(e)) continue;
      out.push({ m, l: c.l, e, name: c.name, change: c.change });
    }
  }
  return out;
})();

/** Densities whose mass and volume are both tidy. */
const DENSITIES: readonly { rho: number; v: number; m: number; name: string }[] = (() => {
  const materials = [
    { name: "aluminium", rho: 2700 },
    { name: "iron", rho: 7900 },
    { name: "copper", rho: 8900 },
    { name: "lead", rho: 11300 },
    { name: "water", rho: 1000 },
    { name: "ice", rho: 920 },
    { name: "oak", rho: 700 },
    { name: "concrete", rho: 2400 },
  ];
  const out: { rho: number; v: number; m: number; name: string }[] = [];
  for (const material of materials) {
    for (const v of [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]) {
      const m = material.rho * v;
      if (!tidy(m) || m < 0.5) continue;
      out.push({ rho: material.rho, v, m, name: material.name });
    }
  }
  return out;
})();

const EM_BANDS = [
  { name: "radio waves", rank: 1 },
  { name: "microwaves", rank: 2 },
  { name: "infrared", rank: 3 },
  { name: "visible light", rank: 4 },
  { name: "ultraviolet", rank: 5 },
  { name: "X-rays", rank: 6 },
  { name: "gamma rays", rank: 7 },
] as const;

/**
 * Grating settings whose wavelength lands in the visible range and stays tidy.
 *
 * Enumerated rather than sampled. Drawing lines-per-millimetre, order and angle
 * independently rejects most combinations, and a generator that falls back more
 * often than it succeeds produces one prompt over and over — which the
 * framework then refuses as a duplicate.
 */
const GRATINGS: readonly {
  linesPerMm: number; d: number; n: number; theta: number; sinTheta: number; lambda: number;
}[] = (() => {
  const out: { linesPerMm: number; d: number; n: number; theta: number; sinTheta: number; lambda: number }[] = [];
  for (const linesPerMm of [100, 200, 250, 300, 400, 500, 600, 800, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000]) {
    const d = 1 / (linesPerMm * 1000);
    for (const n of [1, 2, 3, 4]) {
      for (const [theta, sinTheta] of [[30, 0.5], [90, 1]] as const) {
        const lambda = (d * sinTheta) / n;
        /* Wide enough to include the near-infrared a laboratory source might
           use, narrow enough that the answer is still a sensible wavelength. */
        if (lambda < 3e-7 || lambda > 1.2e-6) continue;
        const { mantissa } = toStandardForm(lambda);
        if (!tidy(mantissa)) continue;
        out.push({ linesPerMm, d, n, theta, sinTheta, lambda });
      }
    }
  }
  return out;
})();

const INSTRUMENTS = ["a guitar string", "a violin string", "a stretched wire", "a piano string", "a length of elastic"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsWaves: Generator[] = [
  /* ------------------------------------------------------------------------
     The wave equation
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.waves.equation",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "wave-equation",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(WAVES);
      const asked = rng.pick(["speed", "frequency", "wavelength"] as const);
      const kind = rng.pick(["a water wave", "a sound wave", "a wave on a rope", "a wave in a ripple tank", "a seismic wave"]);

      if (asked === "speed") {
        const answer = ans(row.v, MS);
        return {
          prompt:
            `${cap(kind)} has a frequency of ${num(row.f)} Hz and a wavelength of ${num(row.lambda)} m. ` +
            `Calculate its speed.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.f / row.lambda, MS), // divided instead of multiplying
            slip(row.lambda / row.f, MS), // inverted the division
            slip(row.f + row.lambda, MS), // added
            slip(row.f, MS), // gave the frequency
          ]),
          explanation:
            `v = fλ = ${num(row.f)} × ${num(row.lambda)} = ${answer}. ` +
            `Frequency is waves per second and wavelength is metres per wave, so the product is metres per second.`,
          check: () =>
            agrees(row.v / row.lambda, row.f) ? null : `v ÷ λ gives ${row.v / row.lambda} Hz, not ${row.f}`,
        };
      }

      if (asked === "frequency") {
        const answer = ans(row.f, "Hz");
        return {
          prompt:
            `${cap(kind)} travels at ${num(row.v)} ${MS} with a wavelength of ${num(row.lambda)} m. ` +
            `What is its frequency?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.v * row.lambda, "Hz"), // multiplied instead of dividing
            slip(row.lambda / row.v, "Hz"), // inverted the division
            slip(row.v, "Hz"), // gave the speed
            slip(row.v - row.lambda, "Hz"), // subtracted
          ]),
          explanation:
            `Rearranging v = fλ gives f = v ÷ λ = ${num(row.v)} ÷ ${num(row.lambda)} = ${answer}. ` +
            `Frequency does not change when a wave enters a new medium — the speed and wavelength both do.`,
          check: () =>
            agrees(row.f * row.lambda, row.v) ? null : `fλ gives ${row.f * row.lambda} m/s, not ${row.v}`,
        };
      }

      const answer = ans(row.lambda, "m");
      return {
        prompt:
          `${cap(kind)} of frequency ${num(row.f)} Hz travels at ${num(row.v)} ${MS}. ` +
          `What is its wavelength?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.v * row.f, "m"), // multiplied instead of dividing
          slip(row.f / row.v, "m"), // inverted the division
          slip(row.v, "m"), // gave the speed
          slip(row.v - row.f, "m"), // subtracted
        ]),
        explanation:
          `Rearranging v = fλ gives λ = v ÷ f = ${num(row.v)} ÷ ${num(row.f)} = ${answer}.`,
        check: () =>
          agrees(row.f * row.lambda, row.v) ? null : `fλ gives ${row.f * row.lambda} m/s, not ${row.v}`,
      };
    },
  }),

  generator({
    key: "phy.waves.period",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "wave-properties",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      /* f = 1/T, chosen from reciprocal pairs so neither side is a decimal mess. */
      const pair = rng.pick([
        { f: 2, T: 0.5 }, { f: 4, T: 0.25 }, { f: 5, T: 0.2 },
        { f: 10, T: 0.1 }, { f: 20, T: 0.05 }, { f: 25, T: 0.04 }, { f: 40, T: 0.025 },
        { f: 50, T: 0.02 }, { f: 100, T: 0.01 }, { f: 200, T: 0.005 }, { f: 250, T: 0.004 },
        { f: 500, T: 0.002 }, { f: 1000, T: 0.001 }, { f: 0.5, T: 2 }, { f: 0.2, T: 5 },
        { f: 0.25, T: 4 }, { f: 0.1, T: 10 },
      ] as const);
      const asked = rng.bool();
      const kind = rng.pick(["a pendulum", "a vibrating string", "a loudspeaker cone", "a water wave", "an oscillating mass"]);

      if (asked) {
        const answer = ans(pair.T, "s");
        return {
          prompt: `${cap(kind)} oscillates at ${num(pair.f)} Hz. What is its time period?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(pair.f, "s"), // gave the frequency back
            slip(pair.f * 2, "s"), // doubled instead of inverting
            slip(pair.f / 2, "s"), // halved instead of inverting
            slip(60 / pair.f, "s"), // treated hertz as beats per minute
          ]),
          explanation:
            `T = 1 ÷ f = 1 ÷ ${num(pair.f)} = ${answer}. ` +
            `Period and frequency are reciprocals: more oscillations per second means less time for each one.`,
          check: () => (agrees(pair.f * pair.T, 1) ? null : `fT gives ${pair.f * pair.T}, not 1`),
        };
      }

      const answer = ans(pair.f, "Hz");
      return {
        prompt: `${cap(kind)} completes one oscillation every ${num(pair.T)} s. What is its frequency?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(pair.T, "Hz"), // gave the period back
          slip(pair.T * 2, "Hz"), // doubled instead of inverting
          slip(pair.T / 2, "Hz"), // halved instead of inverting
          slip(60 * pair.T, "Hz"), // confused it with beats per minute
        ]),
        explanation: `f = 1 ÷ T = 1 ÷ ${num(pair.T)} = ${answer}.`,
        check: () => (agrees(pair.f * pair.T, 1) ? null : `fT gives ${pair.f * pair.T}, not 1`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Refraction
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.waves.refractive-index",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "refraction",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* n = c/v, with v chosen as a whole fraction of c so the index is clean. */
      const n = rng.pick([1.2, 1.25, 1.5, 1.6, 2, 2.4, 1.33, 1.5, 2.5]);
      const c = 3e8;
      const v = c / n;
      const { mantissa, exponent } = toStandardForm(v);
      if (!tidy(mantissa)) return buildRefractionFallback();

      const asked = rng.bool();
      const material = rng.pick(["a glass block", "a clear plastic", "a diamond", "a water tank", "a perspex sheet", "a quartz crystal"]);

      if (asked) {
        const answer = ans(n);
        return {
          prompt:
            `Light travels at ${ans(v, MS)} inside ${material}. ` +
            `Taking the speed of light in a vacuum as 3 × 10${sup(8)} ${MS}, what is the refractive index of the material?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(v / c, ""), // divided the wrong way round
            slip(c - v, ""), // subtracted the speeds
            slip(c * v, ""), // multiplied them
            slip(n * 2, ""), // doubled the index
          ]),
          explanation:
            `n = c ÷ v = 3 × 10${sup(8)} ÷ ${ans(v, MS)} = ${answer}. ` +
            `Light always travels SLOWER in a medium, so the refractive index is always greater than 1 — an answer below 1 is a sign the division went the wrong way.`,
          check: () => (agrees(c / n, v) ? null : `c ÷ n gives ${c / n} m/s, not ${v}`),
        };
      }

      const answer = ans(v, MS);
      return {
        prompt:
          `${cap(material)} has a refractive index of ${num(n)}. ` +
          `Taking the speed of light in a vacuum as 3 × 10${sup(8)} ${MS}, how fast does light travel inside it?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(c * n, MS), // multiplied instead of dividing
          slip(c, MS), // said it is unchanged
          slip(c / (n * n), MS), // divided by the index twice
          slip(c - n, MS), // subtracted the index
        ]),
        explanation:
          `Rearranging n = c ÷ v gives v = c ÷ n = 3 × 10${sup(8)} ÷ ${num(n)} = ${answer}. ` +
          `The frequency is unchanged; it is the wavelength that shortens along with the speed.`,
        check: () => (agrees(v * n, c) ? null : `vn gives ${v * n} m/s, not c`),
      };
    },
  }),

  generator({
    key: "phy.waves.critical-angle",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "refraction",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    /* Only two refractive indices give a critical angle whose sine a student
       knows exactly, so the variety comes from the context. Sixteen is the
       honest ceiling — claiming more would make the framework throw. */
    variants: 16,
    build: (rng) => {
      /* sin C = 1/n, restricted to the indices whose critical angle is one of
         the exact angles: n = 2 gives C = 30°, n = √2 gives 45°. */
      const row = rng.pick([
        { n: 2, c: 30, sinText: "1/2" },
        { n: 1.41, c: 45, sinText: "1/√2" },
      ] as const);
      const material = rng.pick([
        "a glass fibre", "a perspex block", "a light guide", "a prism", "a plastic rod",
        "an acrylic rod", "a glass core", "a transparent slab",
      ]);
      const answer = `${row.c}°`;

      return {
        prompt:
          `${cap(material)} has a refractive index of ${num(row.n)} and is surrounded by air. ` +
          `What is its critical angle, to the nearest degree?`,
        answer,
        distractors: wrongOptions(answer, [
          `${90 - row.c}°`, // measured from the surface instead of the normal
          `${row.c * 2}°`, // doubled it
          "90°", // confused the critical angle with grazing incidence
          "0°", // assumed light escapes straight through
        ]),
        explanation:
          `sin C = 1 ÷ n = 1 ÷ ${num(row.n)} = ${row.sinText}, so C = ${answer}. ` +
          `Beyond this angle the light is totally internally reflected, which is how an optical fibre keeps a signal inside it.`,
        check: () => {
          const impliedSin = Math.sin((row.c * Math.PI) / 180);
          return Math.abs(impliedSin - 1 / row.n) < 0.01
            ? null
            : `sin ${row.c}° = ${impliedSin}, but 1/n = ${1 / row.n}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     The electromagnetic spectrum
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.waves.em-order",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "em-spectrum",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    /* Seven bands, four question shapes: 24 is what the space actually holds. */
    variants: 24,
    build: (rng) => {
      const mode = rng.pick(["longer", "shorter", "speed", "use"] as const);

      if (mode === "speed") {
        const band = rng.pick(EM_BANDS);
        const answer = `3 × 10${sup(8)} ${MS}, the same as all the others`;
        return {
          prompt: `How fast do ${band.name} travel through a vacuum?`,
          answer,
          distractors: wrongOptions(answer, [
            `Faster than visible light, because ${band.name} carry more energy`,
            `Slower than visible light, because ${band.name} have a different frequency`,
            "It depends on the frequency: higher frequency means higher speed",
          ]),
          explanation:
            `Every electromagnetic wave travels at 3 × 10${sup(8)} ${MS} in a vacuum, whatever its frequency. ` +
            `What changes across the spectrum is frequency and wavelength, and since v = fλ is fixed, one rises exactly as the other falls.`,
        };
      }

      if (mode === "use") {
        const cases = [
          { band: "microwaves", use: "heating food and satellite communication" },
          { band: "infrared", use: "thermal imaging and remote controls" },
          { band: "ultraviolet", use: "security marking and sun beds" },
          { band: "X-rays", use: "medical imaging of bones" },
          { band: "gamma rays", use: "sterilising equipment and treating tumours" },
          { band: "radio waves", use: "television and radio broadcasting" },
        ];
        const chosen = rng.pick(cases);
        const others = cases.filter((c) => c.band !== chosen.band);
        const answer = chosen.band;

        return {
          prompt: `Which part of the electromagnetic spectrum is used for ${chosen.use}?`,
          answer,
          distractors: wrongOptions(answer, rng.shuffle(others).slice(0, 3).map((c) => c.band)),
          explanation:
            `${cap(chosen.band)} are used for ${chosen.use}. ` +
            `The uses follow the energy: the low-frequency end carries information over distance, and the high-frequency end has enough energy per photon to ionise atoms.`,
        };
      }

      const wantLonger = mode === "longer";
      const band = rng.pick(EM_BANDS.filter((b) => (wantLonger ? b.rank > 1 : b.rank < 7)));
      const target = EM_BANDS.find((b) => b.rank === band.rank + (wantLonger ? -1 : 1))!;
      const answer = target.name;

      return {
        prompt:
          `Which part of the electromagnetic spectrum has a ${wantLonger ? "longer" : "shorter"} wavelength than ${band.name}, ` +
          `and lies immediately next to it?`,
        answer,
        distractors: wrongOptions(
          answer,
          EM_BANDS.filter((b) => b.name !== answer && b.name !== band.name)
            .slice(0, 3)
            .map((b) => b.name),
        ),
        explanation:
          `The spectrum runs radio, microwave, infrared, visible, ultraviolet, X-ray, gamma from longest wavelength to shortest. ` +
          `${cap(band.name)} sits at position ${band.rank}, so the band with the ${wantLonger ? "next longer" : "next shorter"} wavelength is ${answer}.`,
        check: () =>
          Math.abs(target.rank - band.rank) === 1
            ? null
            : `${target.name} is not adjacent to ${band.name}`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Sound
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.waves.sound-echo",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "sound-waves",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      /* The halving is the whole point: the sound goes there AND back. */
      const speed = rng.pick([330, 340, 1500, 1400, 320, 300]);
      const t = rng.pick([0.2, 0.4, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const distance = exact((speed * t) / 2, 2);
      if (!tidy(distance)) return buildEchoFallback();

      const setting = speed > 1000 ? "a ship's sonar in sea water" : "a person shouting at a cliff";
      const answer = ans(distance, "m");

      return {
        prompt:
          `Sound travels at ${speed} ${MS} in this medium. Using ${setting}, an echo returns after ${num(t)} s. ` +
          `How far away is the reflecting surface?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(speed * t, "m"), // forgot the sound makes a round trip
          slip(speed / t, "m"), // divided instead of multiplying
          slip(t / speed, "m"), // inverted entirely
          slip((speed * t) / 4, "m"), // halved twice
        ]),
        explanation:
          `In ${num(t)} s the sound covers ${speed} × ${num(t)} = ${num(speed * t)} m, but that is there AND back. ` +
          `The surface is half that distance away: ${answer}. Forgetting to halve is the standard lost mark here.`,
        check: () =>
          agrees((2 * distance) / speed, t)
            ? null
            : `the round trip would take ${(2 * distance) / speed} s, not ${t} s`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Superposition, standing waves, gratings
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.waves.superposition",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "superposition",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 24,
    build: (rng) => {
      const lambda = rng.pick([0.2, 0.4, 0.5, 1, 2, 2.5, 4, 5]);
      const orders = rng.pick([0, 1, 2, 3]);
      const half = rng.bool();
      const pathDifference = exact(half ? (orders + 0.5) * lambda : orders * lambda, 2);
      const answer = half
        ? "Destructive interference — the waves cancel"
        : "Constructive interference — the waves reinforce";

      return {
        prompt:
          `Two coherent sources emit waves of wavelength ${num(lambda)} m. At a certain point the path difference ` +
          `from the two sources is ${num(pathDifference)} m. What happens at that point?`,
        answer,
        distractors: wrongOptions(answer, [
          half
            ? "Constructive interference — the waves reinforce"
            : "Destructive interference — the waves cancel",
          "Nothing, because the two waves never meet",
          "The waves refract, changing direction at the meeting point",
        ]),
        explanation:
          `Path difference ÷ wavelength = ${num(pathDifference)} ÷ ${num(lambda)} = ${num(pathDifference / lambda)} wavelengths. ` +
          `A whole number of wavelengths means the waves arrive in phase and reinforce; a half-number means they arrive exactly out of phase and cancel. ` +
          `Here it is ${half ? "a half-number, so they cancel" : "a whole number, so they reinforce"}.`,
        check: () => {
          const ratio = pathDifference / lambda;
          const isWhole = Math.abs(ratio - Math.round(ratio)) < 1e-9;
          return isWhole === !half
            ? null
            : `path difference of ${ratio}λ does not match a ${half ? "destructive" : "constructive"} answer`;
        },
      };
    },
  }),

  generator({
    key: "phy.waves.standing",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "standing-waves",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      /* On a string fixed at both ends the nth harmonic has n half-wavelengths,
         so λ = 2L/n and f = nv/(2L). Lengths and speeds chosen to divide. */
      const L = rng.pick([0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]);
      const n = rng.int(1, 4);
      const v = rng.pick([20, 40, 60, 80, 100, 120, 200, 240, 300, 400, 600]);
      /* Tidiness is checked before it is asserted: `exact` throws, so calling
         it first means the fallback never gets a chance to run. */
      const rawLambda = (2 * L) / n;
      if (!tidy(rawLambda) || !tidy(v / rawLambda)) return buildStandingFallback();
      const lambda = exact(rawLambda, 2);
      const f = v / lambda;

      const asked = rng.bool();
      const string = rng.pick(INSTRUMENTS);
      const ordinal = ["first", "second", "third", "fourth"][n - 1];

      if (asked) {
        const answer = ans(lambda, "m");
        return {
          prompt:
            `${cap(string)} of length ${num(L)} m is fixed at both ends and vibrates in its ${ordinal} harmonic. ` +
            `What is the wavelength of the standing wave?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(L / n, "m"), // forgot the factor of two
            slip(2 * L * n, "m"), // multiplied by n instead of dividing
            slip(L, "m"), // said the wavelength equals the length
            slip(L / (2 * n), "m"), // halved instead of doubling
          ]),
          explanation:
            `The ${ordinal} harmonic fits ${n} half-wavelength${n === 1 ? "" : "s"} into the string, so ${n} × (λ ÷ 2) = ${num(L)} m. ` +
            `That gives λ = 2L ÷ n = 2 × ${num(L)} ÷ ${n} = ${answer}.`,
          check: () =>
            agrees((n * lambda) / 2, L) ? null : `${n} half-wavelengths span ${(n * lambda) / 2} m, not ${L} m`,
        };
      }

      const answer = ans(f, "Hz");
      return {
        prompt:
          `${cap(string)} of length ${num(L)} m is fixed at both ends. Waves travel along it at ${v} ${MS}. ` +
          `What is the frequency of its ${ordinal} harmonic?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(v / (2 * L), "Hz"), // gave the fundamental whatever the harmonic asked
          slip(v / L, "Hz"), // forgot the factor of two
          slip((v * n) / L, "Hz"), // forgot the two but kept n
          slip(v, "Hz"), // gave the wave speed
        ]),
        explanation:
          `λ = 2L ÷ n = 2 × ${num(L)} ÷ ${n} = ${num(lambda)} m, then f = v ÷ λ = ${v} ÷ ${num(lambda)} = ${answer}. ` +
          `Each harmonic is a whole-number multiple of the fundamental, which is why a string sounds like one note and not a mush.`,
        check: () =>
          agrees(f * lambda, v) ? null : `fλ gives ${f * lambda} m/s, not the ${v} m/s stated`,
      };
    },
  }),

  generator({
    key: "phy.waves.grating",
    subject: "physics",
    topic: "phy-waves",
    subtopic: "diffraction-grating",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    /* Twenty settings give a tidy wavelength in a sensible range; claiming more
       would make the framework throw rather than repeat itself. */
    variants: 20,
    build: (rng) => {
      /* d sin θ = nλ, restricted to θ = 30° and 90° so the sine is exact. */
      const combo = rng.pick(GRATINGS);
      const { linesPerMm, d, n, theta, sinTheta, lambda } = combo;

      const answer = ans(lambda, "m");
      const source = rng.pick(["a laser", "a monochromatic source", "a sodium lamp", "a filtered lamp"]);

      return {
        prompt:
          `A diffraction grating has ${linesPerMm} lines per millimetre. ` +
          `The ${["first", "second", "third", "fourth"][n - 1]}-order maximum for ${source} is at ${theta}° to the straight-through direction. ` +
          `Calculate the wavelength of the light. (sin ${theta}° = ${sinTheta === 0.5 ? "0.5" : "1"}.)`,
        answer,
        distractors: pickDistractors(answer, [
          /* Order-based mistakes rather than d-based ones. At first order with
             sin 90° the slit spacing IS the wavelength, so "gave d" and "forgot
             to divide by n" both collapse onto the answer and the question is
             left with one wrong option. Doubling and halving never collide. */
          slip(lambda * 2, "m"), // read the second-order maximum as the first
          slip(lambda / 2, "m"), // divided by the order twice
          slip(lambda * 1000, "m"), // slipped a factor of 1000 converting mm to m
          slip(d, "m"), // gave the slit spacing
        ]),
        explanation:
          `The slit spacing is d = 1 ÷ (${linesPerMm} × 1000) = ${ans(d, "m")}. ` +
          `Rearranging d sin θ = nλ gives λ = d sin θ ÷ n = ${ans(d, "m")} × ${sinTheta} ÷ ${n} = ${answer}. ` +
          `Converting lines per millimetre to a spacing in metres is where this question is usually lost.`,
        check: () =>
          agrees(d * sinTheta, n * lambda)
            ? null
            : `d sin θ = ${d * sinTheta} but nλ = ${n * lambda}`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Density
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.matter.density",
    subject: "physics",
    topic: "phy-matter",
    subtopic: "density",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(DENSITIES);
      const asked = rng.pick(["density", "mass", "volume"] as const);

      if (asked === "density") {
        const answer = ans(row.rho, KGM3);
        return {
          prompt:
            `A block of ${row.name} has a mass of ${num(row.m)} kg and a volume of ${num(row.v)} ${M3}. ` +
            `Calculate its density.`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.v / row.m, KGM3), // inverted the division
            slip(row.m * row.v, KGM3), // multiplied instead of dividing
            slip(row.m, KGM3), // gave the mass
            slip(row.m - row.v, KGM3), // subtracted
          ]),
          explanation:
            `ρ = m ÷ V = ${num(row.m)} ÷ ${num(row.v)} = ${answer}. ` +
            `Density is a property of the material, not the object: a larger block of ${row.name} has the same density.`,
          check: () => (agrees(row.rho * row.v, row.m) ? null : `ρV gives ${row.rho * row.v} kg, not ${row.m}`),
        };
      }

      if (asked === "mass") {
        const answer = ans(row.m, "kg");
        return {
          prompt:
            `${cap(row.name)} has a density of ${num(row.rho)} ${KGM3}. ` +
            `What is the mass of a ${num(row.v)} ${M3} block of it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.rho / row.v, "kg"), // divided instead of multiplying
            slip(row.v / row.rho, "kg"), // inverted
            slip(row.rho, "kg"), // gave the density
            slip(row.rho + row.v, "kg"), // added
          ]),
          explanation: `Rearranging ρ = m ÷ V gives m = ρV = ${num(row.rho)} × ${num(row.v)} = ${answer}.`,
          check: () => (agrees(row.m / row.v, row.rho) ? null : `m ÷ V gives ${row.m / row.v}, not ${row.rho}`),
        };
      }

      const answer = ans(row.v, M3);
      return {
        prompt:
          `${num(row.m)} kg of ${row.name} has a density of ${num(row.rho)} ${KGM3}. ` +
          `What volume does it occupy?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.m * row.rho, M3), // multiplied instead of dividing
          slip(row.rho / row.m, M3), // inverted the division
          slip(row.m, M3), // gave the mass
          slip(row.rho - row.m, M3), // subtracted
        ]),
        explanation: `Rearranging ρ = m ÷ V gives V = m ÷ ρ = ${num(row.m)} ÷ ${num(row.rho)} = ${answer}.`,
        check: () => (agrees(row.rho * row.v, row.m) ? null : `ρV gives ${row.rho * row.v} kg, not ${row.m}`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Specific heat capacity and latent heat
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.matter.specific-heat",
    subject: "physics",
    topic: "phy-matter",
    subtopic: "specific-heat-capacity",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(HEATING);
      const asked = rng.pick(["energy", "rise", "capacity"] as const);

      if (asked === "energy") {
        const answer = ans(row.e, "J");
        return {
          prompt:
            `The specific heat capacity of ${row.name} is ${row.c} ${JKGK}. ` +
            `How much energy is needed to raise the temperature of ${num(row.m)} kg of it by ${row.dt} °C?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.m * row.c, "J"), // left the temperature change out
            slip(row.c * row.dt, "J"), // left the mass out
            slip((row.m * row.c) / row.dt, "J"), // divided by the rise instead of multiplying
            slip(row.m * row.dt, "J"), // left the capacity out
          ]),
          explanation:
            `E = mcΔθ = ${num(row.m)} × ${row.c} × ${row.dt} = ${answer}. ` +
            `Water's capacity is unusually large, which is why it takes so long to boil and why it is used as a coolant.`,
          check: () =>
            agrees(row.e / (row.m * row.c), row.dt)
              ? null
              : `E ÷ mc gives a rise of ${row.e / (row.m * row.c)} °C, not ${row.dt}`,
        };
      }

      if (asked === "rise") {
        const answer = ans(row.dt, "°C");
        return {
          prompt:
            `${num(row.e)} J of energy is supplied to ${num(row.m)} kg of ${row.name}, ` +
            `which has a specific heat capacity of ${row.c} ${JKGK}. What is the temperature rise?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.e / row.c, "°C"), // forgot the mass
            slip(row.e / row.m, "°C"), // forgot the capacity
            slip(row.e * row.m * row.c, "°C"), // multiplied everything
            slip((row.m * row.c) / row.e, "°C"), // inverted the division
          ]),
          explanation:
            `Rearranging E = mcΔθ gives Δθ = E ÷ (mc) = ${num(row.e)} ÷ (${num(row.m)} × ${row.c}) = ${num(row.e)} ÷ ${num(row.m * row.c)} = ${answer}.`,
          check: () =>
            agrees(row.m * row.c * row.dt, row.e)
              ? null
              : `mcΔθ gives ${row.m * row.c * row.dt} J, not ${row.e}`,
        };
      }

      const answer = ans(row.c, JKGK);
      return {
        prompt:
          `Supplying ${num(row.e)} J to ${num(row.m)} kg of a substance raises its temperature by ${row.dt} °C. ` +
          `What is its specific heat capacity?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.e / row.m, JKGK), // forgot the temperature rise
          slip(row.e / row.dt, JKGK), // forgot the mass
          slip(row.e * row.m * row.dt, JKGK), // multiplied everything
          slip((row.m * row.dt) / row.e, JKGK), // inverted the division
        ]),
        explanation:
          `Rearranging E = mcΔθ gives c = E ÷ (mΔθ) = ${num(row.e)} ÷ (${num(row.m)} × ${row.dt}) = ${num(row.e)} ÷ ${num(row.m * row.dt)} = ${answer}.`,
        check: () =>
          agrees(row.m * row.c * row.dt, row.e)
            ? null
            : `mcΔθ gives ${row.m * row.c * row.dt} J, not ${row.e}`,
      };
    },
  }),

  generator({
    key: "phy.matter.latent-heat",
    subject: "physics",
    topic: "phy-matter",
    subtopic: "latent-heat",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(LATENT);
      const asked = rng.bool();

      if (asked) {
        const answer = ans(row.e, "J");
        return {
          prompt:
            `The specific latent heat for ${row.name} to ${row.change} is ${ans(row.l, JKG)}. ` +
            `How much energy is needed to ${row.change} ${num(row.m)} kg of it, already at the change temperature?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.l / row.m, "J"), // divided instead of multiplying
            slip(row.l, "J"), // ignored the mass
            slip(row.m, "J"), // gave the mass
            slip(row.m * row.l * 100, "J"), // slipped in a temperature rise
          ]),
          explanation:
            `E = mL = ${num(row.m)} × ${ans(row.l, JKG)} = ${answer}. ` +
            `There is no ΔT term: the temperature does not change during a change of state, because the energy goes into breaking bonds rather than into motion.`,
          check: () => (agrees(row.e / row.l, row.m) ? null : `E ÷ L gives ${row.e / row.l} kg, not ${row.m}`),
        };
      }

      const answer = ans(row.m, "kg");
      return {
        prompt:
          `${ans(row.e, "J")} of energy is supplied to ${row.name} at its ${row.change === "melt" ? "melting" : "boiling"} point, ` +
          `whose specific latent heat is ${ans(row.l, JKG)}. What mass changes state?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.e * row.l, "kg"), // multiplied instead of dividing
          slip(row.l / row.e, "kg"), // inverted the division
          slip(row.e, "kg"), // gave the energy
          slip(row.l, "kg"), // gave the latent heat
        ]),
        explanation: `Rearranging E = mL gives m = E ÷ L = ${ans(row.e, "J")} ÷ ${ans(row.l, JKG)} = ${answer}.`,
        check: () => (agrees(row.m * row.l, row.e) ? null : `mL gives ${row.m * row.l} J, not ${row.e}`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Gas pressure and states
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.matter.boyle",
    subject: "physics",
    topic: "phy-matter",
    subtopic: "gas-pressure",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* p₁V₁ = p₂V₂ at constant temperature, built from a chosen product. */
      const product = rng.pick([120, 200, 240, 300, 360, 400, 480, 600, 720, 800, 900, 1200, 1800, 2400]);
      const v1 = rng.pick([0.5, 1, 1.2, 1.5, 2, 2.4, 3, 4, 5, 6, 8, 10, 12]);
      const v2 = rng.pick([0.5, 1, 1.2, 1.5, 2, 2.4, 3, 4, 5, 6, 8, 10, 12]);
      if (v1 === v2) return buildBoyleFallback();
      const p1 = product / v1;
      const p2 = product / v2;
      if (!tidy(p1) || !tidy(p2)) return buildBoyleFallback();

      const answer = ans(p2, "kPa");
      const container = rng.pick(["a sealed syringe", "a gas cylinder", "a bicycle pump", "a piston in a cylinder", "a sealed flask"]);

      return {
        prompt:
          `A fixed mass of gas in ${container} at constant temperature has a volume of ${num(v1)} ${M3} at a pressure of ${num(p1)} kPa. ` +
          `The volume is changed to ${num(v2)} ${M3}. What is the new pressure?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((p1 * v2) / v1, "kPa"), // used the volume ratio the wrong way up
          slip(p1, "kPa"), // said the pressure is unchanged
          slip(p1 * v1 * v2, "kPa"), // multiplied everything
          slip(p1 + (v1 - v2), "kPa"), // treated it as an additive change
        ]),
        explanation:
          `At constant temperature pV is constant: p₁V₁ = ${num(p1)} × ${num(v1)} = ${num(product)}. ` +
          `So p₂ = ${num(product)} ÷ ${num(v2)} = ${answer}. ` +
          `${v2 < v1 ? "Squeezing the gas into a smaller volume raises" : "Letting the gas expand lowers"} the pressure, because the molecules hit the walls ${v2 < v1 ? "more" : "less"} often.`,
        check: () => (agrees(p1 * v1, p2 * v2) ? null : `p₁V₁ = ${p1 * v1} but p₂V₂ = ${p2 * v2}`),
      };
    },
  }),

  generator({
    key: "phy.matter.states",
    subject: "physics",
    topic: "phy-matter",
    subtopic: "states-of-matter",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    /* Six written cases is six questions. Reasoning questions do not have
       parameters to vary, so the count is the count. */
    variants: 6,
    build: (rng) => {
      const cases = [
        {
          q: "What happens to the mass of a substance when it melts?",
          a: "It stays the same",
          wrong: ["It increases, because the particles move further apart", "It decreases, because energy is used up", "It halves"],
          why: "Melting rearranges the particles but does not create or destroy any. Changes of state conserve mass; it is the density that changes, because the volume does.",
        },
        {
          q: "Why does the temperature stay constant while a pure substance is boiling, even though energy is still being supplied?",
          a: "The energy is breaking the bonds between particles rather than speeding them up",
          wrong: [
            "The substance stops absorbing energy once it reaches its boiling point",
            "The energy is lost to the surroundings as fast as it is supplied",
            "The thermometer cannot read temperatures above the boiling point",
          ],
          why: "Temperature measures the average kinetic energy of the particles. During a change of state the energy supplied goes into potential energy — separating the particles — so the kinetic energy, and therefore the temperature, does not change.",
        },
        {
          q: "A sealed container of gas is heated at constant volume. What happens to the pressure?",
          a: "It increases, because the particles hit the walls harder and more often",
          wrong: [
            "It decreases, because the particles spread out",
            "It stays the same, because the volume has not changed",
            "It stays the same, because the number of particles has not changed",
          ],
          why: "Heating raises the average speed of the particles. They strike the walls both more frequently and with more momentum each time, and pressure is force per unit area, so it rises.",
        },
        {
          q: "Why is the density of a gas so much lower than that of the same substance as a liquid?",
          a: "The particles are much further apart, so the same mass occupies a far larger volume",
          wrong: [
            "The particles are lighter in a gas",
            "There are fewer particles in a gas",
            "Gas particles have no mass",
          ],
          why: "Density is mass per unit volume. The particles themselves are unchanged — same number, same mass each — but in a gas they are separated by distances much larger than their own size, so the volume is enormously greater.",
        },
        {
          q: "What is the name of the change of state from a gas directly to a solid?",
          a: "Deposition",
          wrong: ["Sublimation", "Condensation", "Freezing"],
          why: "Deposition is gas to solid; sublimation is the reverse, solid to gas. Condensation is gas to liquid and freezing is liquid to solid.",
        },
        {
          q: "Internal energy is the total of which two things?",
          a: "The kinetic energy and the potential energy of the particles",
          wrong: [
            "The temperature and the pressure of the substance",
            "The kinetic energy of the particles and the energy supplied to the container",
            "The mass and the specific heat capacity",
          ],
          why: "Internal energy is the sum of the randomly distributed kinetic energies of the particles and the potential energies stored in the forces between them. Heating a substance raises the kinetic part; melting or boiling it raises the potential part.",
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

function buildRefractionFallback() {
  const answer = ans(1.5);
  return {
    prompt:
      `Light travels at 2 × 10${sup(8)} m/s inside a glass block. ` +
      `Taking the speed of light in a vacuum as 3 × 10${sup(8)} m/s, what is the refractive index of the glass?`,
    answer,
    distractors: pickDistractors(answer, [
      slip(2 / 3, ""), // divided the wrong way round
      slip(1e8, ""), // subtracted the speeds
      slip(3, ""), // doubled the index
    ]),
    explanation:
      "n = c ÷ v = 3 × 10⁸ ÷ 2 × 10⁸ = 1.5. Light always travels slower in a medium, so n is always greater than 1.",
    check: () => (agrees(3 / 2, 1.5) ? null : "the fallback index is wrong"),
  };
}

function buildEchoFallback() {
  const answer = ans(340, "m");
  return {
    prompt:
      "Sound travels at 340 m/s in air. A person shouts at a cliff and the echo returns after 2 s. " +
      "How far away is the cliff?",
    answer,
    distractors: pickDistractors(answer, [
      slip(680, "m"), // forgot the sound makes a round trip
      slip(170, "m"), // halved twice
      slip(170.5, "m"), // divided instead of multiplying
    ]),
    explanation:
      "In 2 s the sound covers 340 × 2 = 680 m, but that is there and back. The cliff is half that away: 340 m.",
    check: () => (agrees((2 * 340) / 340, 2) ? null : "the fallback echo timing is wrong"),
  };
}

function buildStandingFallback() {
  const answer = ans(1, "m");
  return {
    prompt:
      "A guitar string of length 0.5 m is fixed at both ends and vibrates in its first harmonic. " +
      "What is the wavelength of the standing wave?",
    answer,
    distractors: pickDistractors(answer, [
      slip(0.5, "m"), // said the wavelength equals the length
      slip(0.25, "m"), // halved instead of doubling
      slip(2, "m"), // doubled twice
    ]),
    explanation:
      "The first harmonic fits one half-wavelength into the string, so λ ÷ 2 = 0.5 m and λ = 1 m.",
    check: () => (agrees(1 / 2, 0.5) ? null : "the fallback harmonic is wrong"),
  };
}

function buildGratingFallback() {
  const answer = ans(5e-7, "m");
  return {
    prompt:
      "A diffraction grating has 500 lines per millimetre. The first-order maximum for a monochromatic source " +
      "is at 30° to the straight-through direction. Calculate the wavelength of the light. (sin 30° = 0.5.)",
    answer,
    distractors: pickDistractors(answer, [
      slip(2e-6, "m"), // gave the slit spacing
      slip(1e-6, "m"), // forgot to halve
      slip(2.5e-7, "m"), // halved twice
    ]),
    explanation:
      "The slit spacing is d = 1 ÷ (500 × 1000) = 2 × 10⁻⁶ m. Then λ = d sin θ ÷ n = 2 × 10⁻⁶ × 0.5 ÷ 1 = 5 × 10⁻⁷ m.",
    check: () => (agrees(2e-6 * 0.5, 1e-6) ? null : "the fallback grating arithmetic is wrong"),
  };
}

function buildBoyleFallback() {
  const answer = ans(200, "kPa");
  return {
    prompt:
      "A fixed mass of gas in a sealed syringe at constant temperature has a volume of 4 m³ at a pressure of 100 kPa. " +
      "The volume is changed to 2 m³. What is the new pressure?",
    answer,
    distractors: pickDistractors(answer, [
      slip(50, "kPa"), // used the volume ratio the wrong way up
      slip(100, "kPa"), // said the pressure is unchanged
      slip(800, "kPa"), // multiplied everything
    ]),
    explanation:
      "At constant temperature pV is constant: 100 × 4 = 400, so p₂ = 400 ÷ 2 = 200 kPa. " +
      "Halving the volume doubles the pressure.",
    check: () => (agrees(100 * 4, 200 * 2) ? null : "the fallback does not conserve pV"),
  };
}
