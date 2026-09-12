/**
 * Physics: Radioactivity, and Quantum and Nuclear.
 *
 * The hardest file in the physics bank to keep off a calculator, and the rules
 * that make it possible are worth stating.
 *
 * HALF-LIVES ARE WHOLE NUMBERS OF HALVINGS. "After 3 half-lives" is a division
 * by 8, which is mental; "after 7 hours when the half-life is 3 hours" is not.
 * Every decay question here is built from an integer number of halvings.
 *
 * THE DECAY CONSTANT USES A TIDY ln 2. λ = ln2/T½ is only clean when the
 * half-life is chosen to make it so, so `DECAY_CONSTANTS` holds half-lives of
 * 693 s, 6930 s and so on — the same trick as choosing 60° for a cosine rule.
 *
 * PLANCK'S CONSTANT IS QUOTED AS 6.6 × 10⁻³⁴. Boards use 6.63 and 6.626; the
 * question says which, and the frequencies are chosen so the product has a
 * short mantissa. An answer of 6.626 × 10⁻³⁴ × 4.7 × 10¹⁴ is a keypad exercise
 * whatever physics it is testing.
 *
 * NUCLEAR EQUATIONS ARE ARITHMETIC ON TWO NUMBERS. Mass number and atomic
 * number must each balance, and the `check` hooks verify both — which is the
 * whole skill the question is testing.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  CONSTANTS,
  exact,
  num,
  slip,
  sup,
  tidy,
  toStandardForm,
  wrongOptions,
} from "./physics-kit";

/* ==========================================================================
   Nuclear data
   ========================================================================== */

/**
 * Isotopes, with the daughter each decay produces.
 *
 * Real nuclides only. A question that invents an isotope teaches a student to
 * trust an equation they cannot check, and the periodic table is the check.
 */
const NUCLIDES = [
  { name: "uranium-238", sym: "U", A: 238, Z: 92, alpha: { sym: "Th", name: "thorium-234" } },
  { name: "radium-226", sym: "Ra", A: 226, Z: 88, alpha: { sym: "Rn", name: "radon-222" } },
  { name: "polonium-210", sym: "Po", A: 210, Z: 84, alpha: { sym: "Pb", name: "lead-206" } },
  { name: "radon-222", sym: "Rn", A: 222, Z: 86, alpha: { sym: "Po", name: "polonium-218" } },
  { name: "thorium-232", sym: "Th", A: 232, Z: 90, alpha: { sym: "Ra", name: "radium-228" } },
  { name: "americium-241", sym: "Am", A: 241, Z: 95, alpha: { sym: "Np", name: "neptunium-237" } },
  { name: "uranium-235", sym: "U", A: 235, Z: 92, alpha: { sym: "Th", name: "thorium-231" } },
  { name: "plutonium-239", sym: "Pu", A: 239, Z: 94, alpha: { sym: "U", name: "uranium-235" } },
  { name: "polonium-218", sym: "Po", A: 218, Z: 84, alpha: { sym: "Pb", name: "lead-214" } },
  { name: "radium-224", sym: "Ra", A: 224, Z: 88, alpha: { sym: "Rn", name: "radon-220" } },
  { name: "thorium-230", sym: "Th", A: 230, Z: 90, alpha: { sym: "Ra", name: "radium-226" } },
  { name: "uranium-234", sym: "U", A: 234, Z: 92, alpha: { sym: "Th", name: "thorium-230" } },
] as const;

const BETA_MINUS = [
  { name: "carbon-14", sym: "C", A: 14, Z: 6, daughter: { sym: "N", name: "nitrogen-14" } },
  { name: "strontium-90", sym: "Sr", A: 90, Z: 38, daughter: { sym: "Y", name: "yttrium-90" } },
  { name: "caesium-137", sym: "Cs", A: 137, Z: 55, daughter: { sym: "Ba", name: "barium-137" } },
  { name: "thorium-234", sym: "Th", A: 234, Z: 90, daughter: { sym: "Pa", name: "protactinium-234" } },
  { name: "iodine-131", sym: "I", A: 131, Z: 53, daughter: { sym: "Xe", name: "xenon-131" } },
  { name: "tritium", sym: "H", A: 3, Z: 1, daughter: { sym: "He", name: "helium-3" } },
  { name: "phosphorus-32", sym: "P", A: 32, Z: 15, daughter: { sym: "S", name: "sulfur-32" } },
  { name: "cobalt-60", sym: "Co", A: 60, Z: 27, daughter: { sym: "Ni", name: "nickel-60" } },
  { name: "potassium-40", sym: "K", A: 40, Z: 19, daughter: { sym: "Ca", name: "calcium-40" } },
  { name: "lead-214", sym: "Pb", A: 214, Z: 82, daughter: { sym: "Bi", name: "bismuth-214" } },
  { name: "bismuth-214", sym: "Bi", A: 214, Z: 83, daughter: { sym: "Po", name: "polonium-214" } },
  { name: "technetium-99", sym: "Tc", A: 99, Z: 43, daughter: { sym: "Ru", name: "ruthenium-99" } },
] as const;

/** Half-lives in units that make a whole number of halvings land on round times. */
const HALF_LIVES = [
  { t: 2, unit: "days" }, { t: 3, unit: "hours" }, { t: 5, unit: "minutes" },
  { t: 4, unit: "years" }, { t: 6, unit: "hours" }, { t: 10, unit: "minutes" },
  { t: 8, unit: "days" }, { t: 20, unit: "minutes" }, { t: 25, unit: "years" },
  { t: 15, unit: "seconds" }, { t: 30, unit: "seconds" }, { t: 12, unit: "hours" },
] as const;

/** Half-lives whose ln2/T½ is a tidy decay constant. */
const DECAY_CONSTANTS = [
  { half: 693, lambda: 0.001 },
  { half: 6930, lambda: 0.0001 },
  { half: 69.3, lambda: 0.01 },
  { half: 6.93, lambda: 0.1 },
  { half: 1386, lambda: 0.0005 },
  { half: 346.5, lambda: 0.002 },
] as const;

/** Photon frequencies whose energy has a short mantissa with h = 6.6 × 10⁻³⁴. */
const PHOTONS: readonly { f: number; e: number }[] = (() => {
  const out: { f: number; e: number }[] = [];
  for (const mantissa of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) {
    for (const exponent of [12, 13, 14, 15, 16, 17, 18, 19]) {
      const f = mantissa * Math.pow(10, exponent);
      const e = CONSTANTS.h * f;
      const { mantissa: em } = toStandardForm(e);
      if (!tidy(em)) continue;
      out.push({ f, e });
    }
  }
  return out;
})();

/** Mass defects whose Δmc² has a short mantissa. */
const DEFECTS: readonly { dm: number; energy: number }[] = (() => {
  const out: { dm: number; energy: number }[] = [];
  for (const mantissa of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) {
    for (const exponent of [-30, -29, -28, -27]) {
      const dm = mantissa * Math.pow(10, exponent);
      const energy = dm * 9e16; // c² with c = 3 × 10⁸
      const { mantissa: em } = toStandardForm(energy);
      if (!tidy(em)) continue;
      out.push({ dm, energy });
    }
  }
  return out;
})();

const SOURCES = ["a sample", "a sealed source", "a rock specimen", "a medical tracer", "a laboratory source"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsNuclear: Generator[] = [
  /* ------------------------------------------------------------------------
     Half-life
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.rad.half-life-remaining",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "half-life",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      const half = rng.pick(HALF_LIVES);
      const halvings = rng.int(2, 5);
      const elapsed = half.t * halvings;
      /* The starting count is a multiple of 2^halvings, so the answer is whole. */
      const remaining = rng.pick([1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]);
      const start = remaining * Math.pow(2, halvings);
      const source = rng.pick(SOURCES);
      const answer = ans(remaining, "counts per second");

      return {
        prompt:
          `${cap(source)} has a half-life of ${half.t} ${half.unit} and an initial count rate of ${num(start)} counts per second. ` +
          `What is the count rate after ${num(elapsed)} ${half.unit}?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(start / 2, "counts per second"), // halved once regardless of the time
          slip(start / halvings, "counts per second"), // divided by the number of half-lives
          slip(start - halvings * half.t, "counts per second"), // subtracted the time from the count
          slip(remaining / 2, "counts per second"), // one halving too many
        ]),
        explanation:
          `${num(elapsed)} ÷ ${half.t} = ${halvings} half-lives. Each one halves the count rate, so it falls by a factor of 2${sup(halvings)} = ${Math.pow(2, halvings)}. ` +
          `${num(start)} ÷ ${Math.pow(2, halvings)} = ${answer}. ` +
          `Halving repeatedly is division by a power of two, never subtraction.`,
        check: () =>
          agrees(start / Math.pow(2, halvings), remaining)
            ? null
            : `${halvings} halvings of ${start} gives ${start / Math.pow(2, halvings)}, not ${remaining}`,
      };
    },
  }),

  generator({
    key: "phy.rad.half-life-find",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "half-life",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const half = rng.pick(HALF_LIVES);
      const halvings = rng.int(2, 5);
      const elapsed = half.t * halvings;
      const remaining = rng.pick([1, 2, 5, 10, 20, 25, 50, 100]);
      const start = remaining * Math.pow(2, halvings);
      const answer = ans(half.t, half.unit);
      const source = rng.pick(SOURCES);

      return {
        prompt:
          `The activity of ${source} falls from ${num(start)} Bq to ${num(remaining)} Bq in ${num(elapsed)} ${half.unit}. ` +
          `What is its half-life?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(elapsed / 2, half.unit), // assumed it halved once
          slip(elapsed, half.unit), // gave the whole elapsed time
          slip(elapsed / (halvings + 1), half.unit), // miscounted the halvings by one
          slip(start / remaining, half.unit), // gave the ratio as a time
        ]),
        explanation:
          `The activity falls by a factor of ${num(start)} ÷ ${num(remaining)} = ${Math.pow(2, halvings)}, which is 2${sup(halvings)} — so ${halvings} half-lives have passed. ` +
          `Each one is ${num(elapsed)} ÷ ${halvings} = ${answer}.`,
        check: () =>
          agrees(Math.pow(2, halvings) * remaining, start) && agrees(half.t * halvings, elapsed)
            ? null
            : `${halvings} halvings does not take ${start} Bq to ${remaining} Bq in ${elapsed}`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Activity and the decay constant
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.rad.activity",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "activity",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 30,
    build: (rng) => {
      const half = rng.pick(HALF_LIVES);
      const halvings = rng.int(1, 5);
      const remaining = rng.pick([25, 50, 100, 200, 400, 500, 1000, 2000]);
      const start = remaining * Math.pow(2, halvings);
      const fraction = `1/${Math.pow(2, halvings)}`;
      const asked = rng.bool();

      if (asked) {
        const answer = fraction;
        return {
          prompt:
            `A radioactive isotope has a half-life of ${half.t} ${half.unit}. ` +
            `What fraction of the original nuclei remain undecayed after ${num(half.t * halvings)} ${half.unit}?`,
          answer,
          distractors: wrongOptions(answer, [
            `1/${halvings * 2}`, // multiplied by two instead of raising to a power
            `1/${halvings}`, // divided by the number of half-lives
            `${Math.pow(2, halvings) - 1}/${Math.pow(2, halvings)}`, // gave the fraction that HAS decayed
            "0", // assumed it all decays after a few half-lives
          ]),
          explanation:
            `${num(half.t * halvings)} ÷ ${half.t} = ${halvings} half-lives, and each one leaves half of what was there. ` +
            `The fraction remaining is (1/2)${sup(halvings)} = ${answer}. ` +
            `It never reaches zero — halving something repeatedly always leaves something.`,
        };
      }

      const answer = ans(start, "Bq");
      return {
        prompt:
          `A source has a half-life of ${half.t} ${half.unit}. Its activity is now ${num(remaining)} Bq, ` +
          `${num(half.t * halvings)} ${half.unit} after it was made. What was its activity when it was made?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(remaining * 2, "Bq"), // doubled once regardless of the time
          slip(remaining * halvings, "Bq"), // multiplied by the number of half-lives
          slip(remaining / Math.pow(2, halvings), "Bq"), // went the wrong way in time
          slip(remaining + halvings * half.t, "Bq"), // added the time to the activity
        ]),
        explanation:
          `${halvings} half-lives have passed, so the activity has fallen by a factor of 2${sup(halvings)} = ${Math.pow(2, halvings)}. ` +
          `Going backwards multiplies: ${num(remaining)} × ${Math.pow(2, halvings)} = ${answer}.`,
        check: () =>
          agrees(start / Math.pow(2, halvings), remaining)
            ? null
            : `${halvings} halvings of ${start} gives ${start / Math.pow(2, halvings)}, not ${remaining}`,
      };
    },
  }),

  generator({
    key: "phy.rad.decay-constant",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "decay-constant",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      const row = rng.pick(DECAY_CONSTANTS);
      const asked = rng.bool();
      const source = rng.pick(SOURCES);

      if (asked) {
        const answer = ans(row.lambda, "s⁻¹");
        return {
          prompt:
            `${cap(source)} has a half-life of ${num(row.half)} s. ` +
            `Calculate its decay constant. (Take ln 2 = 0.693.)`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.half / 0.693, "s⁻¹"), // inverted the division
            slip(1 / row.half, "s⁻¹"), // forgot ln 2 entirely
            slip(0.693 * row.half, "s⁻¹"), // multiplied instead of dividing
            slip(row.half, "s⁻¹"), // gave the half-life back
          ]),
          explanation:
            `λ = ln2 ÷ T½ = 0.693 ÷ ${num(row.half)} = ${answer}. ` +
            `The decay constant is the probability per second that any one nucleus decays, so a long half-life means a small λ.`,
          check: () =>
            agrees(row.lambda * row.half, 0.693)
              ? null
              : `λT½ gives ${row.lambda * row.half}, not ln 2`,
        };
      }

      const answer = ans(row.half, "s");
      return {
        prompt:
          `${cap(source)} has a decay constant of ${ans(row.lambda, "s⁻¹")}. ` +
          `What is its half-life? (Take ln 2 = 0.693.)`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.lambda / 0.693, "s"), // inverted the division
          slip(1 / row.lambda, "s"), // forgot ln 2 entirely
          slip(0.693 * row.lambda, "s"), // multiplied instead of dividing
          slip(row.lambda, "s"), // gave the decay constant back
        ]),
        explanation:
          `Rearranging λ = ln2 ÷ T½ gives T½ = 0.693 ÷ λ = 0.693 ÷ ${ans(row.lambda, "")} = ${answer}. ` +
          `Note it is not simply 1/λ — that is the mean lifetime, which is longer than the half-life.`,
        check: () =>
          agrees(row.lambda * row.half, 0.693)
            ? null
            : `λT½ gives ${row.lambda * row.half}, not ln 2`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Decay equations and radiation types
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.rad.alpha-decay",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "decay-equations",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 12,
    build: (rng) => {
      const parent = rng.pick(NUCLIDES);
      const A = parent.A - 4;
      const Z = parent.Z - 2;
      const answer = `${A}${parent.alpha.sym} with ${Z} protons`;

      return {
        prompt:
          `${cap(parent.name)} (mass number ${parent.A}, atomic number ${parent.Z}) emits an alpha particle. ` +
          `What is the daughter nuclide?`,
        answer,
        distractors: wrongOptions(answer, [
          `${parent.A - 4}${parent.alpha.sym} with ${parent.Z} protons`, // changed A but not Z
          `${parent.A}${parent.alpha.sym} with ${Z} protons`, // changed Z but not A
          `${parent.A - 2}${parent.alpha.sym} with ${parent.Z - 4} protons`, // swapped the two changes
          `${parent.A + 4}${parent.alpha.sym} with ${parent.Z + 2} protons`, // added instead of subtracting
        ]),
        explanation:
          `An alpha particle is a helium nucleus: 2 protons and 2 neutrons, so mass number 4 and atomic number 2. ` +
          `The daughter has mass number ${parent.A} − 4 = ${A} and atomic number ${parent.Z} − 2 = ${Z}, which is ${parent.alpha.name}. ` +
          `Both numbers must balance across the equation — that is the check worth doing every time.`,
        check: () => {
          /* Both conservation laws, verified separately. */
          if (A + 4 !== parent.A) return `mass numbers do not balance: ${A} + 4 ≠ ${parent.A}`;
          if (Z + 2 !== parent.Z) return `atomic numbers do not balance: ${Z} + 2 ≠ ${parent.Z}`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "phy.rad.beta-decay",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "decay-equations",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 12,
    build: (rng) => {
      const parent = rng.pick(BETA_MINUS);
      const A = parent.A;
      const Z = parent.Z + 1;
      const answer = `${A}${parent.daughter.sym} with ${Z} protons`;

      return {
        prompt:
          `${cap(parent.name)} (mass number ${parent.A}, atomic number ${parent.Z}) undergoes beta-minus decay. ` +
          `What is the daughter nuclide?`,
        answer,
        distractors: wrongOptions(answer, [
          `${A}${parent.daughter.sym} with ${parent.Z - 1} protons`, // decreased Z instead of increasing it
          `${parent.A - 1}${parent.daughter.sym} with ${Z} protons`, // reduced the mass number too
          `${parent.A}${parent.daughter.sym} with ${parent.Z} protons`, // changed nothing
          `${parent.A - 4}${parent.daughter.sym} with ${parent.Z - 2} protons`, // applied alpha decay instead
        ]),
        explanation:
          `In beta-minus decay a neutron becomes a proton, an electron and an antineutrino. ` +
          `The mass number is unchanged at ${A} — a neutron and a proton both count as one — while the atomic number rises by one to ${Z}. ` +
          `That makes the daughter ${parent.daughter.name}.`,
        check: () => {
          if (A !== parent.A) return `beta decay must not change the mass number`;
          if (Z !== parent.Z + 1) return `atomic number should rise by exactly one`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "phy.rad.radiation-types",
    subject: "physics",
    topic: "phy-radioactivity",
    subtopic: "radiation-types",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    /* Eight written cases is eight questions. Reasoning questions have no
       parameters to vary, so the count is the count. */
    variants: 8,
    build: (rng) => {
      const cases = [
        {
          q: "Which type of nuclear radiation is stopped by a few centimetres of air or a sheet of paper?",
          a: "Alpha",
          wrong: ["Beta", "Gamma", "All three are stopped equally"],
          why: "An alpha particle is comparatively large and carries two positive charges, so it ionises very strongly and loses its energy within a few centimetres. Strong ionisation and low penetration always go together.",
        },
        {
          q: "Which type of nuclear radiation is the most strongly ionising?",
          a: "Alpha",
          wrong: ["Beta", "Gamma", "They ionise equally"],
          why: "Alpha is the most ionising because of its charge of +2 and its size — it interacts with almost every atom it passes. This is also why it is the least penetrating, and why an alpha emitter is dangerous inside the body but harmless outside it.",
        },
        {
          q: "Which type of nuclear radiation is an electromagnetic wave rather than a particle?",
          a: "Gamma",
          wrong: ["Alpha", "Beta", "Both alpha and beta"],
          why: "Gamma is a high-frequency electromagnetic wave emitted when a nucleus loses excess energy. Alpha is a helium nucleus and beta is a fast-moving electron; both are particles with mass and charge.",
        },
        {
          q: "A radioactive source is placed near a magnetic field and the radiation is undeflected. Which type is it?",
          a: "Gamma",
          wrong: ["Alpha", "Beta-minus", "Beta-plus"],
          why: "A magnetic field deflects moving charges. Alpha (+2) and beta (−1 or +1) are both charged and are deflected in opposite directions; gamma carries no charge, so it passes straight through.",
        },
        {
          q: "Which type of nuclear radiation needs several centimetres of lead or thick concrete to reduce it significantly?",
          a: "Gamma",
          wrong: ["Alpha", "Beta", "None of them can be reduced"],
          why: "Gamma is weakly ionising, so it interacts rarely and travels a long way through matter. It is never fully stopped — only attenuated — which is why shielding is quoted as a halving thickness rather than a stopping distance.",
        },
        {
          q: "What is emitted alongside the electron in beta-minus decay?",
          a: "An antineutrino",
          wrong: ["A neutrino", "A proton", "A gamma photon, always"],
          why: "Beta-minus decay produces an electron and an electron antineutrino. The antineutrino was proposed to account for energy that otherwise appeared to go missing, and its detection confirmed it.",
        },
        {
          q: "Why is an alpha emitter far more dangerous when swallowed than when held at arm's length?",
          a: "Outside the body its radiation cannot penetrate the skin, but inside it ionises living tissue directly",
          wrong: [
            "Swallowing it increases its activity",
            "Stomach acid makes alpha particles more penetrating",
            "It becomes a gamma emitter once inside the body",
          ],
          why: "Alpha radiation is stopped by the dead outer layer of skin, so an external source does little harm. Inside the body there is no such barrier, and the same strong ionisation that made it harmless outside now acts directly on living cells.",
        },
        {
          q: "What is meant by background radiation?",
          a: "The radiation always present from natural and artificial sources around us",
          wrong: [
            "Radiation released only by nuclear power stations",
            "Radiation left over from a source that has been removed",
            "The radiation a detector produces by itself",
          ],
          why: "Background radiation comes mostly from radon gas, rocks, cosmic rays and food, with a small contribution from medical and industrial sources. It must be measured and subtracted before an experimental count rate means anything.",
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

  /* ------------------------------------------------------------------------
     Photons
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.quantum.photon-energy",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "photon-energy",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(PHOTONS);
      const asked = rng.bool();
      const source = rng.pick(["a laser", "an ultraviolet lamp", "an X-ray tube", "a sodium lamp", "an infrared source"]);

      if (asked) {
        const answer = ans(row.e, "J");
        return {
          prompt:
            `Take h = 6.6 × 10${sup(-34)} J s. ${cap(source)} emits photons of frequency ${ans(row.f, "Hz")}. ` +
            `What is the energy of one photon?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.f / CONSTANTS.h, "J"), // divided instead of multiplying
            slip(CONSTANTS.h / row.f, "J"), // inverted the division
            slip(row.f, "J"), // gave the frequency
            slip(CONSTANTS.h, "J"), // gave Planck's constant
          ]),
          explanation:
            `E = hf = 6.6 × 10${sup(-34)} × ${ans(row.f, "Hz")} = ${answer}. ` +
            `Photon energy depends only on frequency — a brighter source of the same colour sends MORE photons, not more energetic ones.`,
          check: () =>
            agrees(row.e / CONSTANTS.h, row.f)
              ? null
              : `E ÷ h gives ${row.e / CONSTANTS.h} Hz, not ${row.f}`,
        };
      }

      const answer = ans(row.f, "Hz");
      return {
        prompt:
          `Take h = 6.6 × 10${sup(-34)} J s. A photon carries ${ans(row.e, "J")} of energy. ` +
          `What is its frequency?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.e * CONSTANTS.h, "Hz"), // multiplied instead of dividing
          slip(CONSTANTS.h / row.e, "Hz"), // inverted the division
          slip(row.e, "Hz"), // gave the energy
          slip(row.e / CONSTANTS.c, "Hz"), // divided by c instead of h
        ]),
        explanation:
          `Rearranging E = hf gives f = E ÷ h = ${ans(row.e, "J")} ÷ 6.6 × 10${sup(-34)} = ${answer}.`,
        check: () =>
          agrees(CONSTANTS.h * row.f, row.e)
            ? null
            : `hf gives ${CONSTANTS.h * row.f} J, not ${row.e}`,
      };
    },
  }),

  generator({
    key: "phy.quantum.photoelectric",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "photoelectric-effect",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      /* Worked entirely in electronvolts, where the arithmetic is subtraction. */
      const workFunction = rng.pick([1.5, 2, 2.2, 2.5, 3, 3.5, 4, 4.5, 5, 6]);
      const excess = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const photon = exact(workFunction + excess, 2);
      const metal = rng.pick(["caesium", "sodium", "zinc", "potassium", "calcium", "magnesium"]);
      const asked = rng.pick(["kinetic", "work", "threshold"] as const);

      if (asked === "kinetic") {
        const answer = ans(excess, "eV");
        return {
          prompt:
            `A photon of energy ${num(photon)} eV strikes a ${metal} surface whose work function is ${num(workFunction)} eV. ` +
            `What is the maximum kinetic energy of an emitted electron?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(photon + workFunction, "eV"), // added instead of subtracting
            slip(photon, "eV"), // gave the whole photon energy
            slip(workFunction, "eV"), // gave the work function
            slip(workFunction - photon, "eV"), // subtracted the wrong way round
          ]),
          explanation:
            `Eₖ(max) = hf − φ = ${num(photon)} − ${num(workFunction)} = ${answer}. ` +
            `The work function is the minimum energy needed to free an electron; whatever the photon has left over becomes kinetic energy. ` +
            `It is a MAXIMUM because electrons deeper in the metal need more than the minimum to escape.`,
          check: () =>
            agrees(workFunction + excess, photon)
              ? null
              : `φ + Eₖ gives ${workFunction + excess} eV, not the ${photon} eV photon`,
        };
      }

      if (asked === "work") {
        const answer = ans(workFunction, "eV");
        return {
          prompt:
            `Photons of energy ${num(photon)} eV strike a ${metal} surface and the fastest electrons emerge with ${num(excess)} eV of kinetic energy. ` +
            `What is the work function of the metal?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(photon + excess, "eV"), // added instead of subtracting
            slip(excess - photon, "eV"), // subtracted the wrong way round
            slip(photon, "eV"), // gave the photon energy
            slip(excess, "eV"), // gave the kinetic energy
          ]),
          explanation:
            `Rearranging hf = φ + Eₖ(max) gives φ = ${num(photon)} − ${num(excess)} = ${answer}. ` +
            `The work function is a property of the metal alone — shining a brighter light does not change it.`,
          check: () =>
            agrees(workFunction + excess, photon)
              ? null
              : `φ + Eₖ gives ${workFunction + excess} eV, not ${photon} eV`,
        };
      }

      const answer =
        "No electrons are emitted at all, however bright the light is";
      return {
        prompt:
          `Light of photon energy ${num(workFunction - 0.5)} eV shines on a ${metal} surface whose work function is ${num(workFunction)} eV. ` +
          `What happens?`,
        answer,
        distractors: wrongOptions(answer, [
          "Electrons are emitted, but more slowly than with higher-energy photons",
          "Electrons are emitted only if the light is bright enough",
          "Electrons are emitted after a delay while they absorb several photons",
        ]),
        explanation:
          `Each electron absorbs one photon, and ${num(workFunction - 0.5)} eV is less than the ${num(workFunction)} eV needed to escape. ` +
          `Brightness increases the NUMBER of photons per second, not the energy of each one, so no amount of it helps. ` +
          `This threshold behaviour is exactly what the wave model of light could not explain.`,
      };
    },
  }),

  generator({
    key: "phy.quantum.de-broglie",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "de-broglie",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      /* λ = h/p, with momenta chosen so the mantissa stays short. */
      const pMantissa = rng.pick([1.1, 2.2, 3.3, 6.6, 1.32, 2.64, 0.66, 3.3]);
      const pExponent = rng.pick([-22, -23, -24, -25, -26]);
      const p = pMantissa * Math.pow(10, pExponent);
      const lambda = CONSTANTS.h / p;
      const { mantissa } = toStandardForm(lambda);
      if (!tidy(mantissa)) return buildDeBroglieFallback();

      const particle = rng.pick(["an electron", "a proton", "a neutron", "an alpha particle"]);
      const answer = ans(lambda, "m");

      return {
        prompt:
          `Take h = 6.6 × 10${sup(-34)} J s. ${cap(particle)} has a momentum of ${ans(p, "kg m/s")}. ` +
          `Calculate its de Broglie wavelength.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(CONSTANTS.h * p, "m"), // multiplied instead of dividing
          slip(p / CONSTANTS.h, "m"), // inverted the division
          slip(CONSTANTS.h, "m"), // gave Planck's constant
          slip(p, "m"), // gave the momentum
        ]),
        explanation:
          `λ = h ÷ p = 6.6 × 10${sup(-34)} ÷ ${ans(p, "kg m/s")} = ${answer}. ` +
          `Every particle has a wavelength; it is only observable when the momentum is small enough to make λ comparable to the spacing of the atoms it passes through.`,
        check: () =>
          agrees(lambda * p, CONSTANTS.h)
            ? null
            : `λp gives ${lambda * p}, not h`,
      };
    },
  }),

  generator({
    key: "phy.quantum.energy-levels",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "energy-levels",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      /* Level energies in eV, negative and increasing toward zero. */
      const levels = rng.pick([
        [-13.6, -3.4, -1.5, -0.85],
        [-10.4, -5.2, -2.6, -1.3],
        [-8, -4, -2, -1],
        [-12, -6, -3, -1.5],
        [-9, -4.5, -1.5, -0.5],
      ] as const);
      const from = rng.int(1, 3);
      const to = rng.int(0, from - 1);
      const diff = exact(levels[from] - levels[to], 2);
      const answer = ans(diff, "eV");

      return {
        prompt:
          `An atom has energy levels at ${levels.map((l) => `${num(l)} eV`).join(", ")}. ` +
          `An electron falls from the ${["first", "second", "third", "fourth"][from]} level to the ${["first", "second", "third", "fourth"][to]}. ` +
          `What is the energy of the emitted photon?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(levels[to] - levels[from], "eV"), // subtracted the wrong way, giving a negative
          slip(Math.abs(levels[from]) + Math.abs(levels[to]), "eV"), // added the magnitudes
          slip(Math.abs(levels[from]), "eV"), // gave the starting level's magnitude
          slip(Math.abs(levels[to]), "eV"), // gave the finishing level's magnitude
        ]),
        explanation:
          `The photon carries the difference between the two levels: ${num(levels[from])} − (${num(levels[to])}) = ${answer}. ` +
          `Levels are negative because the electron is bound; a photon energy is always positive, so the answer is the SIZE of the gap.`,
        check: () => {
          if (diff <= 0) return `an emitted photon cannot carry ${diff} eV`;
          return agrees(levels[to] + diff, levels[from])
            ? null
            : `the gap does not return the starting level`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Mass defect and binding energy
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.quantum.mass-defect",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "mass-defect",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      const row = rng.pick(DEFECTS);
      const nuclide = rng.pick(["helium-4", "carbon-12", "oxygen-16", "iron-56", "lithium-7", "nitrogen-14"]);
      const answer = ans(row.energy, "J");

      return {
        prompt:
          `Take c = 3 × 10${sup(8)} ${"m/s"}. A ${nuclide} nucleus has a mass defect of ${ans(row.dm, "kg")}. ` +
          `Calculate the energy equivalent of that mass defect.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.dm * 3e8, "J"), // multiplied by c instead of c²
          slip(row.dm / 9e16, "J"), // divided instead of multiplying
          slip(row.dm, "J"), // gave the mass
          slip(row.energy / 2, "J"), // borrowed the half from ½mv²
        ]),
        explanation:
          `E = Δmc² = ${ans(row.dm, "kg")} × (3 × 10${sup(8)})² = ${ans(row.dm, "kg")} × 9 × 10${sup(16)} = ${answer}. ` +
          `The c is SQUARED — using 3 × 10⁸ instead of 9 × 10¹⁶ is the standard slip and it is out by a factor of 300 million.`,
        check: () =>
          agrees(row.energy / 9e16, row.dm)
            ? null
            : `E ÷ c² gives ${row.energy / 9e16} kg, not ${row.dm}`,
      };
    },
  }),

  generator({
    key: "phy.quantum.binding-energy",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "binding-energy",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      /* Binding energy per nucleon, which is a division a student can do. */
      const nucleons = rng.pick([4, 8, 12, 16, 20, 24, 40, 50, 56, 60, 100, 120, 200, 240]);
      const perNucleon = rng.pick([1.5, 2, 2.5, 4, 5, 6, 7, 7.5, 8, 8.5]);
      const total = exact(nucleons * perNucleon, 2);
      const nuclide = rng.pick(["a nuclide", "an isotope", "a nucleus"]);
      const asked = rng.bool();

      if (asked) {
        const answer = ans(perNucleon, "MeV");
        return {
          prompt:
            `${cap(nuclide)} with ${nucleons} nucleons has a total binding energy of ${num(total)} MeV. ` +
            `What is its binding energy per nucleon?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(total * nucleons, "MeV"), // multiplied instead of dividing
            slip(nucleons / total, "MeV"), // inverted the division
            slip(total, "MeV"), // gave the total
            slip(nucleons, "MeV"), // gave the nucleon count
          ]),
          explanation:
            `Binding energy per nucleon = ${num(total)} ÷ ${nucleons} = ${answer}. ` +
            `This is the quantity that decides nuclear stability: it peaks near iron-56, which is why light nuclei release energy by fusing and heavy ones by splitting.`,
          check: () =>
            agrees(perNucleon * nucleons, total)
              ? null
              : `${perNucleon} × ${nucleons} gives ${perNucleon * nucleons} MeV, not ${total}`,
        };
      }

      const answer = ans(total, "MeV");
      return {
        prompt:
          `${cap(nuclide)} with ${nucleons} nucleons has a binding energy per nucleon of ${num(perNucleon)} MeV. ` +
          `What is its total binding energy?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(perNucleon / nucleons, "MeV"), // divided instead of multiplying
          slip(nucleons / perNucleon, "MeV"), // inverted
          slip(perNucleon, "MeV"), // gave the per-nucleon value
          slip(nucleons, "MeV"), // gave the nucleon count
        ]),
        explanation:
          `Total binding energy = ${num(perNucleon)} × ${nucleons} = ${answer}. ` +
          `This is the energy that would be needed to pull the nucleus completely apart into separate nucleons.`,
        check: () =>
          agrees(perNucleon * nucleons, total)
            ? null
            : `${perNucleon} × ${nucleons} gives ${perNucleon * nucleons} MeV, not ${total}`,
      };
    },
  }),

  generator({
    key: "phy.quantum.nuclear-equations",
    subject: "physics",
    topic: "phy-quantum",
    subtopic: "nuclear-equations",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      /* Balance the two numbers. Built by choosing the products and deriving
         the missing particle, so the equation cannot fail to balance. */
      const parentA = rng.int(200, 240);
      const parentZ = rng.int(84, 96);
      const mode = rng.pick(["alpha", "beta", "neutron", "positron"] as const);

      const emitted = {
        alpha: { A: 4, Z: 2, name: "an alpha particle" },
        beta: { A: 0, Z: -1, name: "a beta-minus particle" },
        neutron: { A: 1, Z: 0, name: "a neutron" },
        positron: { A: 0, Z: 1, name: "a positron" },
      }[mode];

      const daughterA = parentA - emitted.A;
      const daughterZ = parentZ - emitted.Z;
      const answer = `mass number ${daughterA}, atomic number ${daughterZ}`;

      return {
        prompt:
          `A nucleus of mass number ${parentA} and atomic number ${parentZ} emits ${emitted.name}. ` +
          `What are the mass number and atomic number of the daughter nucleus?`,
        answer,
        distractors: wrongOptions(answer, [
          `mass number ${parentA - emitted.Z}, atomic number ${parentZ - emitted.A}`, // swapped the two changes
          `mass number ${parentA + emitted.A}, atomic number ${parentZ + emitted.Z}`, // added instead of subtracting
          `mass number ${daughterA}, atomic number ${parentZ}`, // adjusted only the mass number
          `mass number ${parentA}, atomic number ${daughterZ}`, // adjusted only the atomic number
        ]),
        explanation:
          `Both numbers are conserved. ${cap(emitted.name)} carries mass number ${emitted.A} and atomic number ${emitted.Z}, ` +
          `so the daughter has ${parentA} − ${emitted.A} = ${daughterA} and ${parentZ} − (${emitted.Z}) = ${daughterZ}. ` +
          `A beta-minus particle has atomic number −1, so subtracting it INCREASES the daughter's atomic number.`,
        check: () => {
          if (daughterA + emitted.A !== parentA) return `mass numbers do not balance`;
          if (daughterZ + emitted.Z !== parentZ) return `atomic numbers do not balance`;
          return null;
        },
      };
    },
  }),
];

/* ==========================================================================
   Fallbacks
   ========================================================================== */

function buildDeBroglieFallback() {
  const answer = ans(3e-10, "m");
  return {
    prompt:
      `Take h = 6.6 × 10${sup(-34)} J s. An electron has a momentum of 2.2 × 10${sup(-24)} kg m/s. ` +
      "Calculate its de Broglie wavelength.",
    answer,
    distractors: pickDistractors(answer, [
      slip(1.452e-57, "m"), // multiplied instead of dividing
      slip(3.33e9, "m"), // inverted the division
      slip(6.6e-34, "m"), // gave Planck's constant
    ]),
    explanation:
      "λ = h ÷ p = 6.6 × 10⁻³⁴ ÷ 2.2 × 10⁻²⁴ = 3 × 10⁻¹⁰ m. " +
      "That is about the spacing of atoms in a crystal, which is why electrons diffract through one.",
    check: () => (agrees(6.6e-34 / 2.2e-24, 3e-10) ? null : "the fallback wavelength is wrong"),
  };
}
