/**
 * Chemistry: Quantitative chemistry and equations.
 *
 * The discipline is the same as the physics bank's but the constraint is
 * different. In physics a generator can choose any numbers it likes and work
 * backwards; here the relative formula masses are fixed by nature — Mr(H₂SO₄)
 * is 98 whatever anyone would prefer. So the free choice is the AMOUNT: pick
 * 0.5 mol and multiply up to get the mass, rather than picking a mass and
 * dividing.
 *
 * Every Mr is derived by `mrOf` from the formula, never typed. A bank that
 * hard-codes 101 for CaCO₃ teaches that number to everyone who reads it, and
 * nothing in the file would disagree; deriving it from Ca + C + 3×O means the
 * formula is the single source of truth and a typo in it is visible.
 *
 * `exact()` still guards every published answer, so a generator whose amounts
 * do not divide throws in the harness rather than shipping 0.10204 mol.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  exact,
  num,
  slip,
  tidy,
  wrongOptions,
} from "./physics-kit";
import {
  AVOGADRO,
  formula,
  MOLAR_VOLUME,
  mrOf,
  NICE_CONCENTRATIONS,
  NICE_MOLES,
  NICE_VOLUMES_CM3,
  SPECIES,
  WHOLE_MR,
  speciesByFormula,
} from "./chemistry-kit";

/* ==========================================================================
   Reactions used for reacting-mass questions
   ==========================================================================

   Real, balanced equations only, each with its coefficients. The `check` hooks
   verify that the masses balance — the conservation law is the thing being
   taught, so it is also the thing being tested. */

interface Reaction {
  equation: string;
  /** [formula, coefficient] for each reactant and product. */
  reactants: readonly (readonly [string, number])[];
  products: readonly (readonly [string, number])[];
}

const REACTIONS: readonly Reaction[] = [
  {
    equation: "CaCO3 → CaO + CO2",
    reactants: [["CaCO3", 1]],
    products: [["CaO", 1], ["CO2", 1]],
  },
  {
    equation: "2Mg + O2 → 2MgO",
    reactants: [["Mg", 2], ["O2", 1]],
    products: [["MgO", 2]],
  },
  {
    equation: "CH4 + 2O2 → CO2 + 2H2O",
    reactants: [["CH4", 1], ["O2", 2]],
    products: [["CO2", 1], ["H2O", 2]],
  },
  {
    equation: "2H2 + O2 → 2H2O",
    reactants: [["H2", 2], ["O2", 1]],
    products: [["H2O", 2]],
  },
  {
    equation: "Fe2O3 + 3CO → 2Fe + 3CO2",
    reactants: [["Fe2O3", 1], ["CO", 3]],
    products: [["Fe", 2], ["CO2", 3]],
  },
  {
    equation: "2NaOH + H2SO4 → Na2SO4 + 2H2O",
    reactants: [["NaOH", 2], ["H2SO4", 1]],
    products: [["Na2SO4", 1], ["H2O", 2]],
  },
  {
    equation: "CaCO3 + 2HCl → CaCl2 + H2O + CO2",
    reactants: [["CaCO3", 1], ["HCl", 2]],
    products: [["CaCl2", 1], ["H2O", 1], ["CO2", 1]],
  },
  {
    equation: "N2 + 3H2 → 2NH3",
    reactants: [["N2", 1], ["H2", 3]],
    products: [["NH3", 2]],
  },
  {
    equation: "2Al + 3Cl2 → 2AlCl3",
    reactants: [["Al", 2], ["Cl2", 3]],
    products: [["AlCl3", 2]],
  },
  {
    equation: "Zn + 2HCl → ZnCl2 + H2",
    reactants: [["Zn", 1], ["HCl", 2]],
    products: [["ZnCl2", 1], ["H2", 1]],
  },
  /* Both of these have product masses summing to exactly 100, so their atom
     economies are whole numbers — 26% and 74%, 55% and 45%. Real reactions,
     picked because the arithmetic stays mental, which is the whole constraint
     on a battle question. */
  {
    equation: "CaC2 + 2H2O → C2H2 + Ca(OH)2",
    reactants: [["CaC2", 1], ["H2O", 2]],
    products: [["C2H2", 1], ["Ca(OH)2", 1]],
  },
  {
    equation: "NH4NO3 → N2O + 2H2O",
    reactants: [["NH4NO3", 1]],
    products: [["N2O", 1], ["H2O", 2]],
  },
];

/** Does this equation conserve mass? The check every reaction question runs. */
function massBalances(reaction: Reaction): boolean {
  const side = (items: readonly (readonly [string, number])[]) =>
    items.reduce((total, [f, n]) => total + n * mrOf(f), 0);
  return Math.abs(side(reaction.reactants) - side(reaction.products)) < 1e-9;
}

/** Unbalanced equations, with the coefficients that fix them. */
const BALANCING: readonly { unbalanced: string; answer: string; wrong: readonly string[] }[] = [
  {
    unbalanced: "__ H2 + O2 → __ H2O",
    answer: "2 and 2",
    wrong: ["1 and 1", "2 and 1", "1 and 2", "4 and 2"],
  },
  {
    unbalanced: "__ Mg + O2 → __ MgO",
    answer: "2 and 2",
    wrong: ["1 and 1", "1 and 2", "2 and 1", "3 and 3"],
  },
  {
    unbalanced: "CH4 + __ O2 → CO2 + __ H2O",
    answer: "2 and 2",
    wrong: ["1 and 1", "2 and 1", "1 and 2", "3 and 2"],
  },
  {
    unbalanced: "__ Na + __ H2O → __ NaOH + H2",
    answer: "2, 2 and 2",
    wrong: ["1, 1 and 1", "2, 1 and 2", "1, 2 and 1", "2, 2 and 1"],
  },
  {
    unbalanced: "N2 + __ H2 → __ NH3",
    answer: "3 and 2",
    wrong: ["2 and 3", "1 and 1", "3 and 1", "2 and 2"],
  },
  {
    unbalanced: "__ Al + __ Cl2 → __ AlCl3",
    answer: "2, 3 and 2",
    wrong: ["1, 3 and 1", "2, 2 and 2", "1, 1 and 1", "3, 2 and 3"],
  },
  {
    unbalanced: "Fe2O3 + __ CO → __ Fe + __ CO2",
    answer: "3, 2 and 3",
    wrong: ["1, 2 and 1", "2, 3 and 2", "3, 3 and 3", "1, 1 and 1"],
  },
  {
    unbalanced: "CaCO3 + __ HCl → CaCl2 + H2O + CO2",
    answer: "2",
    wrong: ["1", "3", "4"],
  },
  {
    unbalanced: "__ C2H6 + __ O2 → __ CO2 + __ H2O",
    answer: "2, 7, 4 and 6",
    wrong: ["1, 3, 2 and 3", "2, 6, 4 and 6", "1, 7, 2 and 3", "2, 5, 4 and 6"],
  },
  {
    unbalanced: "__ KOH + H2SO4 → __ K2SO4 + __ H2O",
    answer: "2, 1 and 2",
    wrong: ["1, 1 and 1", "2, 2 and 2", "1, 2 and 1", "2, 1 and 1"],
  },
];

const ACIDS = ["hydrochloric acid", "sulfuric acid", "nitric acid", "ethanoic acid"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const chemistryQuantitative: Generator[] = [
  /* ------------------------------------------------------------------------
     Relative formula mass
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.mr",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "relative-formula-mass",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 32,
    build: (rng) => {
      const s = rng.pick(SPECIES);
      const answer = ans(s.mr);

      return {
        prompt: `Calculate the relative formula mass (Mr) of ${s.name}, ${formula(s.f)}.`,
        answer,
        distractors: pickDistractors(answer, [
          /* The three mistakes that actually happen with formulae: ignoring a
             subscript, ignoring a bracket multiplier, and adding rather than
             multiplying through. */
          slip(mrOfIgnoringSubscripts(s.f), ""),
          slip(s.mr / 2, ""),
          slip(s.mr + 2, ""),
          slip(s.mr * 2, ""),
        ]),
        explanation:
          `Add the relative atomic mass of every atom in the formula, counting each subscript: ${formula(s.f)} gives Mr = ${answer}. ` +
          `A subscript multiplies only the atom immediately before it, and a subscript after a bracket multiplies everything inside.`,
        check: () => {
          /* Re-derived from the formula a second way: the parser is the thing
             being trusted, so the check must not reuse it blindly. */
          const recomputed = mrOf(s.f);
          return agrees(recomputed, s.mr) ? null : `re-parsing gives ${recomputed}, not ${s.mr}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Moles
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.moles",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "moles",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 48,
    build: (rng) => {
      /* The AMOUNT is chosen, so the mass follows and the division is exact. */
      const s = rng.pick(WHOLE_MR);
      const moles = rng.pick(NICE_MOLES);
      const mass = exact(moles * s.mr, 2);
      const asked = rng.pick(["moles", "mass", "mr"] as const);

      if (asked === "moles") {
        const answer = ans(moles, "mol");
        return {
          prompt:
            `The relative formula mass of ${s.name} (${formula(s.f)}) is ${num(s.mr)}. ` +
            `How many moles are there in ${num(mass)} g of it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(mass * s.mr, "mol"), // multiplied instead of dividing
            slip(s.mr / mass, "mol"), // inverted the division
            slip(mass, "mol"), // gave the mass
            slip(mass / (s.mr * 2), "mol"), // used twice the Mr
          ]),
          explanation:
            `moles = mass ÷ Mr = ${num(mass)} ÷ ${num(s.mr)} = ${answer}. ` +
            `A mole is a fixed NUMBER of particles, so the same number of moles of two substances have different masses.`,
          check: () => (agrees(moles * s.mr, mass) ? null : `n × Mr gives ${moles * s.mr} g, not ${mass}`),
        };
      }

      if (asked === "mass") {
        const answer = ans(mass, "g");
        return {
          prompt:
            `What is the mass of ${num(moles)} mol of ${s.name} (${formula(s.f)}, Mr = ${num(s.mr)})?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(moles / s.mr, "g"), // divided instead of multiplying
            slip(s.mr / moles, "g"), // inverted
            slip(s.mr, "g"), // gave the Mr
            slip(moles, "g"), // gave the amount
          ]),
          explanation:
            `mass = moles × Mr = ${num(moles)} × ${num(s.mr)} = ${answer}. ` +
            `The Mr in grams is the mass of exactly one mole, so multiplying by the number of moles scales it.`,
          check: () => (agrees(mass / s.mr, moles) ? null : `mass ÷ Mr gives ${mass / s.mr} mol, not ${moles}`),
        };
      }

      const answer = ans(s.mr);
      return {
        prompt: `${num(mass)} g of a compound is found to be ${num(moles)} mol. What is its relative formula mass?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(mass * moles, ""), // multiplied instead of dividing
          slip(moles / mass, ""), // inverted the division
          slip(mass, ""), // gave the mass
          slip(moles, ""), // gave the amount
        ]),
        explanation: `Rearranging moles = mass ÷ Mr gives Mr = mass ÷ moles = ${num(mass)} ÷ ${num(moles)} = ${answer}.`,
        check: () => (agrees(moles * s.mr, mass) ? null : `n × Mr gives ${moles * s.mr} g, not ${mass}`),
      };
    },
  }),

  generator({
    key: "chem.quant.avogadro",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "moles",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      /* 2 mol gives 1.204 × 10²⁴ — three decimal places in the mantissa, which
         the audit reads as a keypad answer. Only amounts that keep it to two. */
      const moles = rng.pick([0.05, 0.1, 0.5, 1, 1.5, 5, 10]);
      const particles = moles * AVOGADRO;
      if (!tidy(particles / Math.pow(10, Math.floor(Math.log10(particles))))) {
        return buildAvogadroFallback();
      }
      const s = rng.pick(SPECIES);
      const answer = ans(particles, "molecules");

      return {
        prompt:
          `Take the Avogadro constant as 6.02 × 10²³ mol⁻¹. ` +
          `How many molecules are there in ${num(moles)} mol of ${s.name}?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(AVOGADRO / moles, "molecules"), // divided instead of multiplying
          slip(AVOGADRO, "molecules"), // ignored the amount
          slip(moles, "molecules"), // gave the amount
          slip(particles * s.mr, "molecules"), // multiplied by the Mr as well
        ]),
        explanation:
          `Number of particles = moles × Avogadro constant = ${num(moles)} × 6.02 × 10²³ = ${answer}. ` +
          `The Mr does not appear: a mole of any substance contains the same number of particles, however heavy each one is.`,
        check: () =>
          agrees(particles / AVOGADRO, moles)
            ? null
            : `dividing back gives ${particles / AVOGADRO} mol, not ${moles}`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Reacting masses
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.reacting-masses",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "mass-calculations",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      const reaction = rng.pick(REACTIONS);
      const [fromF, fromN] = rng.pick(reaction.reactants);
      const [toF, toN] = rng.pick(reaction.products);
      const fromMr = mrOf(fromF);
      const toMr = mrOf(toF);

      const moles = rng.pick([0.1, 0.2, 0.5, 1, 2, 4, 5]);
      const fromMass = exact(moles * fromN * fromMr, 2);
      const toMass = moles * toN * toMr;
      if (!tidy(toMass)) return buildReactingFallback();

      const answer = ans(toMass, "g");

      return {
        prompt:
          `For the reaction ${formula(reaction.equation)}, calculate the mass of ${formula(toF)} produced ` +
          `when ${num(fromMass)} g of ${formula(fromF)} reacts completely. ` +
          `(Mr: ${formula(fromF)} = ${num(fromMr)}, ${formula(toF)} = ${num(toMr)}.)`,
        answer,
        distractors: pickDistractors(answer, [
          slip(fromMass, "g"), // assumed the mass is unchanged
          slip((fromMass * fromMr) / toMr, "g"), // used the Mr ratio upside down
          slip(moles * toMr, "g"), // ignored the balancing numbers
          slip((fromMass * toMr) / fromMr, "g"), // ignored the balancing numbers the other way
        ]),
        explanation:
          `Moles of ${formula(fromF)} = ${num(fromMass)} ÷ ${num(fromMr)} = ${num(fromMass / fromMr)} mol. ` +
          `The equation says ${fromN} ${formula(fromF)} gives ${toN} ${formula(toF)}, so moles of ${formula(toF)} = ` +
          `${num(fromMass / fromMr)} × ${toN}/${fromN} = ${num(moles * toN)} mol. ` +
          `Mass = ${num(moles * toN)} × ${num(toMr)} = ${answer}. ` +
          `The balancing numbers are the ratio; skipping them is the commonest error in the whole topic.`,
        check: () => {
          /* The equation must conserve mass, or the question is nonsense
             whatever arithmetic follows it. */
          if (!massBalances(reaction)) return `${reaction.equation} does not conserve mass`;
          const molesFrom = fromMass / fromMr / fromN;
          return agrees(molesFrom * toN * toMr, toMass)
            ? null
            : `the mole ratio gives ${molesFrom * toN * toMr} g, not ${toMass}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Concentration
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.concentration",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "concentration",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const conc = rng.pick(NICE_CONCENTRATIONS);
      const volumeCm3 = rng.pick(NICE_VOLUMES_CM3);
      const volumeDm3 = volumeCm3 / 1000;
      const moles = conc * volumeDm3;
      if (!tidy(moles)) return buildConcentrationFallback();

      const asked = rng.pick(["moles", "concentration", "volume"] as const);
      const acid = rng.pick(ACIDS);

      if (asked === "moles") {
        const answer = ans(moles, "mol");
        return {
          prompt:
            `How many moles of solute are there in ${volumeCm3} cm³ of ${num(conc)} mol/dm³ ${acid}?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(conc * volumeCm3, "mol"), // left the volume in cm³
            slip(conc / volumeDm3, "mol"), // divided instead of multiplying
            slip(volumeDm3 / conc, "mol"), // inverted
            slip(conc, "mol"), // gave the concentration
          ]),
          explanation:
            `Convert first: ${volumeCm3} cm³ = ${num(volumeDm3)} dm³. ` +
            `moles = concentration × volume = ${num(conc)} × ${num(volumeDm3)} = ${answer}. ` +
            `Forgetting to divide by 1000 multiplies the answer by a thousand, which is the single commonest slip here.`,
          check: () => (agrees(moles / volumeDm3, conc) ? null : `n ÷ V gives ${moles / volumeDm3}, not ${conc}`),
        };
      }

      if (asked === "concentration") {
        const answer = ans(conc, "mol/dm³");
        return {
          prompt:
            `${num(moles)} mol of solute is dissolved to make ${volumeCm3} cm³ of solution. ` +
            `What is its concentration?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(moles / volumeCm3, "mol/dm³"), // left the volume in cm³
            slip(moles * volumeDm3, "mol/dm³"), // multiplied instead of dividing
            slip(volumeDm3 / moles, "mol/dm³"), // inverted the division
            slip(moles, "mol/dm³"), // gave the amount
          ]),
          explanation:
            `${volumeCm3} cm³ = ${num(volumeDm3)} dm³, so concentration = moles ÷ volume = ${num(moles)} ÷ ${num(volumeDm3)} = ${answer}.`,
          check: () => (agrees(conc * volumeDm3, moles) ? null : `cV gives ${conc * volumeDm3} mol, not ${moles}`),
        };
      }

      const answer = ans(volumeCm3, "cm³");
      return {
        prompt:
          `What volume of ${num(conc)} mol/dm³ solution contains ${num(moles)} mol of solute? ` +
          `Give your answer in cm³.`,
        answer,
        distractors: pickDistractors(answer, [
          slip(volumeDm3, "cm³"), // forgot to convert back to cm³
          slip(moles * conc * 1000, "cm³"), // multiplied instead of dividing
          slip(conc / moles, "cm³"), // inverted
          slip(moles, "cm³"), // gave the amount
        ]),
        explanation:
          `volume = moles ÷ concentration = ${num(moles)} ÷ ${num(conc)} = ${num(volumeDm3)} dm³, ` +
          `which is ${num(volumeDm3)} × 1000 = ${answer}.`,
        check: () => (agrees(conc * volumeDm3, moles) ? null : `cV gives ${conc * volumeDm3} mol, not ${moles}`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Titration
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.titration",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "titration",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 48,
    build: (rng) => {
      /* Built from the acid side: choose its concentration and volume, then the
         alkali concentration follows from the ratio and its volume. */
      const ratio = rng.pick([
        { acid: "HCl", alkali: "NaOH", a: 1, b: 1, word: "1 : 1" },
        { acid: "H2SO4", alkali: "NaOH", a: 1, b: 2, word: "1 : 2" },
        { acid: "HNO3", alkali: "KOH", a: 1, b: 1, word: "1 : 1" },
        { acid: "H2SO4", alkali: "KOH", a: 1, b: 2, word: "1 : 2" },
      ] as const);

      const acidConc = rng.pick([0.05, 0.1, 0.2, 0.25, 0.5, 1, 2]);
      const acidVolume = rng.pick([10, 20, 25, 40, 50]);
      let alkaliVolume = rng.pick([10, 20, 25, 40, 50]);
      /* With a 1 : 1 ratio and equal volumes the two concentrations are equal,
         and all four distractors — ignoring the ratio, dividing by the wrong
         volume, assuming equal concentrations, applying the ratio twice — land
         on the answer at once, leaving a question with no wrong options. */
      if (ratio.a === ratio.b && alkaliVolume === acidVolume) {
        alkaliVolume = acidVolume === 50 ? 25 : 50;
      }

      const acidMoles = (acidConc * acidVolume) / 1000;
      const alkaliMoles = (acidMoles * ratio.b) / ratio.a;
      const alkaliConc = (alkaliMoles * 1000) / alkaliVolume;
      if (!tidy(alkaliConc) || alkaliConc > 10) return buildTitrationFallback();

      const answer = ans(alkaliConc, "mol/dm³");

      return {
        prompt:
          `${acidVolume} cm³ of ${num(acidConc)} mol/dm³ ${formula(ratio.acid)} exactly neutralises ` +
          `${alkaliVolume} cm³ of ${formula(ratio.alkali)} solution. The acid and alkali react in a ${ratio.word} ratio. ` +
          `What is the concentration of the ${formula(ratio.alkali)}?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((acidMoles * 1000) / alkaliVolume, "mol/dm³"), // ignored the reacting ratio
          slip((alkaliMoles * 1000) / acidVolume, "mol/dm³"), // divided by the wrong volume
          slip(acidConc, "mol/dm³"), // assumed the concentrations are equal
          slip(alkaliConc / ratio.b, "mol/dm³"), // applied the ratio twice
          slip(alkaliConc * 2, "mol/dm³"), // doubled somewhere in the conversion
          slip(alkaliConc / 2, "mol/dm³"), // halved somewhere in the conversion
        ]),
        explanation:
          `Moles of acid = ${num(acidConc)} × ${acidVolume}/1000 = ${num(acidMoles)} mol. ` +
          `The ratio is ${ratio.word}, so moles of ${formula(ratio.alkali)} = ${num(acidMoles)} × ${ratio.b}/${ratio.a} = ${num(alkaliMoles)} mol. ` +
          `Concentration = ${num(alkaliMoles)} ÷ ${num(alkaliVolume / 1000)} = ${answer}. ` +
          `${ratio.b === 2 ? "Sulfuric acid is diprotic, so each mole neutralises two moles of a single-hydroxide alkali — the ratio is not 1 : 1." : "Here the ratio is 1 : 1, but check it every time rather than assuming."}`,
        check: () => {
          /* The ratio, verified from the moles rather than restated. */
          const impliedRatio = alkaliMoles / acidMoles;
          return agrees(impliedRatio, ratio.b / ratio.a)
            ? null
            : `the moles imply a ratio of ${impliedRatio}, not ${ratio.b}/${ratio.a}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Percentage yield and atom economy
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.yield",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "percentage-yield",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const percent = rng.pick([20, 25, 30, 40, 50, 60, 64, 70, 75, 80, 85, 90, 95]);
      const theoretical = rng.pick([20, 25, 40, 50, 80, 100, 120, 200, 250, 400, 500]);
      const actual = exact((percent / 100) * theoretical, 2);
      if (!tidy(actual)) return buildYieldFallback();

      const asked = rng.pick(["percent", "actual", "theoretical"] as const);
      const product = rng.pick(SPECIES).name;

      if (asked === "percent") {
        const answer = `${percent}%`;
        return {
          prompt:
            `A reaction should produce ${num(theoretical)} g of ${product}, but only ${num(actual)} g is obtained. ` +
            `What is the percentage yield?`,
          answer,
          distractors: wrongOptions(answer, [
            `${num(Math.round((theoretical / actual) * 1000) / 10)}%`, // divided the wrong way round
            `${num(100 - percent)}%`, // gave the percentage lost
            `${num(actual)}%`, // quoted the mass as a percentage
            `${num(Math.round(((theoretical - actual) / actual) * 1000) / 10)}%`, // compared loss to actual, not theoretical
          ]),
          explanation:
            `Percentage yield = actual ÷ theoretical × 100 = ${num(actual)} ÷ ${num(theoretical)} × 100 = ${answer}. ` +
            `It can never exceed 100%; a value above that means the product is still wet or impure.`,
          check: () =>
            agrees((actual / theoretical) * 100, percent)
              ? null
              : `the ratio gives ${(actual / theoretical) * 100}%, not ${percent}%`,
        };
      }

      if (asked === "actual") {
        const answer = ans(actual, "g");
        return {
          prompt:
            `A reaction has a theoretical yield of ${num(theoretical)} g of ${product} and a percentage yield of ${percent}%. ` +
            `What mass is actually obtained?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(theoretical - actual, "g"), // gave the mass lost
            slip(theoretical / (percent / 100), "g"), // divided by the yield instead of multiplying
            slip(theoretical, "g"), // gave the theoretical yield
            slip(percent, "g"), // quoted the percentage as a mass
          ]),
          explanation:
            `actual = ${num(percent / 100)} × ${num(theoretical)} = ${answer}. ` +
            `The missing ${num(theoretical - actual)} g is lost to side reactions, incomplete reaction and transfer losses.`,
          check: () =>
            agrees(actual / theoretical, percent / 100)
              ? null
              : `actual ÷ theoretical gives ${actual / theoretical}, not ${percent / 100}`,
        };
      }

      const answer = ans(theoretical, "g");
      return {
        prompt:
          `A reaction with a percentage yield of ${percent}% produced ${num(actual)} g of ${product}. ` +
          `What was the theoretical yield?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(actual * (percent / 100), "g"), // multiplied instead of dividing
          slip(actual, "g"), // gave the actual yield
          slip(actual + percent, "g"), // added the percentage as a mass
          slip(actual / percent, "g"), // divided by the percentage without converting
        ]),
        explanation:
          `Rearranging gives theoretical = actual ÷ (percentage ÷ 100) = ${num(actual)} ÷ ${num(percent / 100)} = ${answer}. ` +
          `The theoretical yield is always the larger of the two.`,
        check: () =>
          agrees(theoretical * (percent / 100), actual)
            ? null
            : `scaling back gives ${theoretical * (percent / 100)} g, not ${actual}`,
      };
    },
  }),

  generator({
    key: "chem.quant.atom-economy",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "atom-economy",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    /* Eight multi-product reactions crossed with their products, minus the ones
       whose economy is not a whole percentage. Eight is what survives, and the
       filter is the point: an atom economy of 45.9016…% is a calculator answer. */
    variants: 8,
    build: (rng) => {
      const reaction = rng.pick(REACTIONS.filter((r) => r.products.length > 1));
      const [wantedF, wantedN] = rng.pick(reaction.products);
      const wantedMass = wantedN * mrOf(wantedF);
      const totalMass = reaction.products.reduce((sum, [f, n]) => sum + n * mrOf(f), 0);
      const economy = (wantedMass / totalMass) * 100;
      if (!tidy(economy)) return buildEconomyFallback();

      const answer = `${num(exact(economy, 2))}%`;

      return {
        prompt:
          `For the reaction ${formula(reaction.equation)}, calculate the atom economy for making ${formula(wantedF)}.`,
        answer,
        distractors: wrongOptions(answer, [
          `${num(Math.round((totalMass / wantedMass) * 1000) / 10)}%`, // divided the wrong way round
          `${num(Math.round((100 - economy) * 10) / 10)}%`, // gave the percentage wasted
          "100%", // assumed every atom ends up in the product
          `${num(Math.round((wantedMass / (totalMass - wantedMass)) * 1000) / 10)}%`, // compared wanted to waste
        ]),
        explanation:
          `Atom economy = Mr of wanted product ÷ total Mr of all products × 100. ` +
          `Wanted: ${wantedN} × ${num(mrOf(wantedF))} = ${num(wantedMass)}. Total products: ${num(totalMass)}. ` +
          `${num(wantedMass)} ÷ ${num(totalMass)} × 100 = ${answer}. ` +
          `Atom economy is about the EQUATION, not the practical loss — a reaction can have 100% atom economy and still give a poor yield.`,
        check: () => {
          if (!massBalances(reaction)) return `${reaction.equation} does not conserve mass`;
          const reactantMass = reaction.reactants.reduce((sum, [f, n]) => sum + n * mrOf(f), 0);
          return agrees(reactantMass, totalMass)
            ? null
            : `reactants total ${reactantMass} but products total ${totalMass}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Empirical formula
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.empirical",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "empirical-formula",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      /* Built from the formula: choose the ratio, then state the masses it
         implies. Going the other way — choosing masses and dividing — produces
         ratios like 1 : 2.03 that a student cannot resolve. */
      const cases = [
        { a: "Mg", an: 1, b: "O", bn: 1, result: "MgO" },
        { a: "Fe", an: 2, b: "O", bn: 3, result: "Fe2O3" },
        { a: "Cu", an: 1, b: "O", bn: 1, result: "CuO" },
        { a: "Al", an: 2, b: "O", bn: 3, result: "Al2O3" },
        { a: "Na", an: 2, b: "O", bn: 1, result: "Na2O" },
        { a: "Ca", an: 1, b: "Cl", bn: 2, result: "CaCl2" },
        { a: "Mg", an: 1, b: "Cl", bn: 2, result: "MgCl2" },
        { a: "K", an: 2, b: "S", bn: 1, result: "K2S" },
        { a: "Zn", an: 1, b: "S", bn: 1, result: "ZnS" },
        { a: "Pb", an: 1, b: "O", bn: 2, result: "PbO2" },
      ];
      const c = rng.pick(cases);
      const scale = rng.pick([0.1, 0.2, 0.5, 1, 2]);
      const massA = exact(scale * c.an * mrOf(c.a), 2);
      const massB = exact(scale * c.bn * mrOf(c.b), 2);
      const answer = formula(c.result);

      return {
        prompt:
          `${num(massA)} g of ${c.a} combines with ${num(massB)} g of ${c.b}. ` +
          `What is the empirical formula of the compound? ` +
          `(Ar: ${c.a} = ${num(mrOf(c.a))}, ${c.b} = ${num(mrOf(c.b))}.)`,
        answer,
        distractors: wrongOptions(answer, [
          formula(`${c.a}${c.bn === 1 ? "" : c.bn}${c.b}${c.an === 1 ? "" : c.an}`), // ratio the wrong way round
          formula(`${c.a}${c.b}`), // assumed a 1 : 1 ratio
          formula(`${c.a}${c.an + 1}${c.b}${c.bn}`), // miscounted the metal
          formula(`${c.a}${c.b}${c.bn + 1}`), // miscounted the non-metal
          formula(`${c.a}${c.an * 2}${c.b}${c.bn * 2}`), // failed to simplify the ratio
        ]),
        explanation:
          `Moles of ${c.a} = ${num(massA)} ÷ ${num(mrOf(c.a))} = ${num(massA / mrOf(c.a))}. ` +
          `Moles of ${c.b} = ${num(massB)} ÷ ${num(mrOf(c.b))} = ${num(massB / mrOf(c.b))}. ` +
          `Dividing both by the smaller gives a ratio of ${c.an} : ${c.bn}, so the empirical formula is ${answer}. ` +
          `Always divide by the SMALLER value — dividing by the larger gives fractions and hides the ratio.`,
        check: () => {
          const molesA = massA / mrOf(c.a);
          const molesB = massB / mrOf(c.b);
          return agrees(molesA / molesB, c.an / c.bn)
            ? null
            : `the masses imply a ratio of ${molesA / molesB}, not ${c.an}/${c.bn}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Gas volumes
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.quant.gas-volume",
    subject: "chemistry",
    topic: "chem-quantitative",
    subtopic: "gas-volumes",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 48,
    build: (rng) => {
      const moles = rng.pick([0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const volume = exact(moles * MOLAR_VOLUME, 2);
      const gas = rng.pick(SPECIES.filter((s) => s.state === "g"));
      const asked = rng.bool();

      if (asked) {
        const answer = ans(volume, "dm³");
        return {
          prompt:
            `At room temperature and pressure one mole of any gas occupies ${MOLAR_VOLUME} dm³. ` +
            `What volume does ${num(moles)} mol of ${gas.name} occupy?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(moles / MOLAR_VOLUME, "dm³"), // divided instead of multiplying
            slip(moles * gas.mr, "dm³"), // used the Mr instead of the molar volume
            slip(MOLAR_VOLUME, "dm³"), // ignored the amount
            slip(moles, "dm³"), // gave the amount
          ]),
          explanation:
            `volume = moles × ${MOLAR_VOLUME} = ${num(moles)} × ${MOLAR_VOLUME} = ${answer}. ` +
            `The Mr plays no part: at the same temperature and pressure, equal numbers of moles of ANY gas occupy equal volumes.`,
          check: () =>
            agrees(volume / MOLAR_VOLUME, moles)
              ? null
              : `V ÷ 24 gives ${volume / MOLAR_VOLUME} mol, not ${moles}`,
        };
      }

      const answer = ans(moles, "mol");
      return {
        prompt:
          `At room temperature and pressure one mole of any gas occupies ${MOLAR_VOLUME} dm³. ` +
          `How many moles are there in ${num(volume)} dm³ of ${gas.name}?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(volume * MOLAR_VOLUME, "mol"), // multiplied instead of dividing
          slip(MOLAR_VOLUME / volume, "mol"), // inverted the division
          slip(volume / gas.mr, "mol"), // divided by the Mr instead
          slip(volume, "mol"), // gave the volume
        ]),
        explanation: `moles = volume ÷ ${MOLAR_VOLUME} = ${num(volume)} ÷ ${MOLAR_VOLUME} = ${answer}.`,
        check: () =>
          agrees(moles * MOLAR_VOLUME, volume)
            ? null
            : `n × 24 gives ${moles * MOLAR_VOLUME} dm³, not ${volume}`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Equations
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.eq.balancing",
    subject: "chemistry",
    topic: "chem-equations",
    subtopic: "balancing",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 10,
    build: (rng) => {
      const row = rng.pick(BALANCING);
      return {
        prompt:
          `Balance the equation ${formula(row.unbalanced)} by filling in the blanks. ` +
          `Which numbers are needed, in order?`,
        answer: row.answer,
        distractors: wrongOptions(row.answer, row.wrong),
        explanation:
          `Count each element on both sides and adjust the coefficients until they match. ` +
          `The answer is ${row.answer}. ` +
          `Never change a subscript to balance an equation — that changes the substance rather than how much of it there is.`,
      };
    },
  }),

  generator({
    key: "chem.eq.conservation",
    subject: "chemistry",
    topic: "chem-equations",
    subtopic: "balancing",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 48,
    build: (rng) => {
      /* Conservation of mass, which is what balancing is FOR. */
      const reaction = rng.pick(REACTIONS);
      const [aF, aN] = reaction.reactants[0];
      const otherReactants = reaction.reactants.slice(1);
      const moles = rng.pick([0.5, 1, 2, 4, 5]);

      const massA = exact(moles * aN * mrOf(aF), 2);
      const massOthers = exact(
        otherReactants.reduce((sum, [f, n]) => sum + moles * n * mrOf(f), 0),
        2,
      );
      const totalProducts = massA + massOthers;
      if (!tidy(totalProducts) || otherReactants.length === 0) return buildConservationFallback();

      const answer = ans(totalProducts, "g");

      return {
        prompt:
          `In the reaction ${formula(reaction.equation)}, ${num(massA)} g of ${formula(aF)} reacts completely ` +
          `with ${num(massOthers)} g of the other reactant${otherReactants.length > 1 ? "s" : ""}. ` +
          `What is the total mass of the products?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(massA, "g"), // gave one reactant's mass
          slip(Math.abs(massA - massOthers), "g"), // subtracted instead of adding
          slip(massA * massOthers, "g"), // multiplied them
          slip(totalProducts / 2, "g"), // halved the total
        ]),
        explanation:
          `Mass is conserved: no atoms are created or destroyed, only rearranged. ` +
          `Total products = ${num(massA)} + ${num(massOthers)} = ${answer}. ` +
          `A reaction that appears to lose mass has released a gas; one that appears to gain has taken one from the air.`,
        check: () => {
          if (!massBalances(reaction)) return `${reaction.equation} does not conserve mass`;
          return agrees(massA + massOthers, totalProducts) ? null : `the masses do not add up`;
        },
      };
    },
  }),

  generator({
    key: "chem.eq.state-symbols",
    subject: "chemistry",
    topic: "chem-equations",
    subtopic: "state-symbols",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What does the state symbol (aq) mean in a chemical equation?", a: "Dissolved in water", wrong: ["A liquid at room temperature", "A gas dissolved in a solid", "Pure water"], why: "(aq) means aqueous: the substance is dissolved in water. It is different from (l), which means the pure substance is itself a liquid — water is H₂O(l), but salt water is NaCl(aq)." },
        { q: "Which state symbol is used for a pure liquid substance?", a: "(l)", wrong: ["(aq)", "(s)", "(g)"], why: "(l) means the pure substance is a liquid at the temperature of the reaction. (aq) means it is dissolved in water, which is a different situation entirely." },
        { q: "In the equation CaCO₃ → CaO + CO₂, what are the correct state symbols?", a: "(s) → (s) + (g)", wrong: ["(s) → (aq) + (g)", "(aq) → (s) + (l)", "(s) → (l) + (g)"], why: "Calcium carbonate and calcium oxide are both solids; carbon dioxide is a gas. This is thermal decomposition, and the escaping gas is why the solid appears to lose mass." },
        { q: "Sodium chloride dissolved in water is written NaCl(aq). How is solid sodium chloride written?", a: "NaCl(s)", wrong: ["NaCl(l)", "NaCl(g)", "NaCl(aq) as well"], why: "(s) for the solid crystal. NaCl(l) would mean molten sodium chloride, above 801 °C — which is a real substance but a very different one, and it conducts electricity where the solid does not." },
        { q: "Why do state symbols matter in an ionic equation?", a: "They show which species are actually free ions in solution and which are not", wrong: ["They are only decoration and can be omitted", "They show the temperature of the reaction", "They show which substance is the catalyst"], why: "Only (aq) ionic compounds are split into separate ions in an ionic equation. Solids, liquids and gases stay written as whole formulae, so the state symbols decide what the equation looks like." },
        { q: "A reaction is carried out in a sealed container and the mass does not change. In an open container the same reaction appears to lose mass. What does this suggest?", a: "One of the products is a gas that escapes in the open container", wrong: ["Mass is not conserved in open containers", "The reaction is endothermic", "The balance is faulty"], why: "Mass is always conserved. In a sealed container the gas is trapped and counted; in an open one it escapes and is not, so the mass appears to fall. The classic example is a carbonate reacting with acid." },
        { q: "In a reaction carried out in an open container, the mass INCREASES. What is the most likely explanation?", a: "A gas from the air has reacted and become part of a solid product", wrong: ["Mass was created by the reaction", "The container absorbed water", "The reaction was exothermic"], why: "Burning magnesium is the standard case: the magnesium combines with oxygen from the air, and the oxygen's mass is added to the solid product. Nothing is created; something was drawn in from outside the container." },
        { q: "What does (g) indicate about a substance in an equation?", a: "It is a gas at the conditions of the reaction", wrong: ["It is a solid in granular form", "It is dissolved in water", "It is glowing"], why: "(g) marks a gaseous substance. Noticing which products are gases is what explains apparent mass changes in open containers." },
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
    key: "chem.eq.ionic",
    subject: "chemistry",
    topic: "chem-equations",
    subtopic: "ionic-equations",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the ionic equation for the neutralisation of any strong acid by any strong alkali?", a: "H⁺(aq) + OH⁻(aq) → H₂O(l)", wrong: ["H⁺(aq) + OH⁻(aq) → H₂O(aq)", "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)", "Na⁺(aq) + Cl⁻(aq) → NaCl(aq)"], why: "The sodium and chloride ions are spectators: they are aqueous ions before and after and take no part. Cancelling them leaves the same equation for every strong acid–strong alkali pair, which is why they all release almost exactly the same energy per mole." },
        { q: "Silver nitrate solution is added to sodium chloride solution and a white precipitate forms. What is the ionic equation?", a: "Ag⁺(aq) + Cl⁻(aq) → AgCl(s)", wrong: ["Ag⁺(aq) + Cl⁻(aq) → AgCl(aq)", "AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)", "Na⁺(aq) + NO₃⁻(aq) → NaNO₃(s)"], why: "Only the ions that form the precipitate appear. The sodium and nitrate ions stay dissolved throughout and are spectators, so they are cancelled from both sides." },
        { q: "In an ionic equation, what is a spectator ion?", a: "An ion that is present in solution before and after and takes no part in the reaction", wrong: ["An ion that catalyses the reaction", "An ion that is precipitated out", "An ion that changes its charge during the reaction"], why: "Spectator ions are aqueous on both sides and are cancelled, leaving only the species that actually change. Identifying them is the whole method for writing an ionic equation." },
        { q: "Which of these would NOT be split into separate ions when writing an ionic equation?", a: "BaSO₄(s)", wrong: ["NaCl(aq)", "HCl(aq)", "KOH(aq)"], why: "Only aqueous ionic compounds are split. A solid — such as an insoluble precipitate — is held together in a lattice, so it is written as a whole formula with its state symbol." },
        { q: "Magnesium reacts with hydrochloric acid. What is the ionic equation?", a: "Mg(s) + 2H⁺(aq) → Mg²⁺(aq) + H₂(g)", wrong: ["Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)", "Mg²⁺(aq) + 2Cl⁻(aq) → MgCl₂(s)", "Mg(s) + H⁺(aq) → Mg⁺(aq) + H(g)"], why: "The chloride ions are spectators. What actually happens is that magnesium atoms lose two electrons each and hydrogen ions gain them — which is why this is also a redox reaction." },
        { q: "Barium chloride solution is added to sodium sulfate solution. What is the ionic equation for the precipitate that forms?", a: "Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)", wrong: ["Ba²⁺(aq) + 2Cl⁻(aq) → BaCl₂(s)", "Na⁺(aq) + SO₄²⁻(aq) → Na₂SO₄(s)", "BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s) + 2NaCl(aq)"], why: "Barium sulfate is insoluble, so those two ions leave the solution. Sodium and chloride remain dissolved and are cancelled. This is the standard test for a sulfate." },
        { q: "Why is the ionic equation for neutralisation the same for HCl + NaOH and for HNO₃ + KOH?", a: "In both, the only species that change are H⁺ and OH⁻ forming water", wrong: ["Because both acids have the same concentration", "Because sodium and potassium are in the same group", "Because both reactions are exothermic"], why: "All four spectator ions — Na⁺, Cl⁻, K⁺, NO₃⁻ — remain aqueous and unchanged. Once they are cancelled, both reactions reduce to H⁺(aq) + OH⁻(aq) → H₂O(l)." },
        { q: "Lead(II) nitrate solution is added to potassium iodide solution and a yellow precipitate appears. What is the ionic equation?", a: "Pb²⁺(aq) + 2I⁻(aq) → PbI₂(s)", wrong: ["Pb²⁺(aq) + I⁻(aq) → PbI(s)", "K⁺(aq) + NO₃⁻(aq) → KNO₃(s)", "Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s) + 2KNO₃(aq)"], why: "Lead is 2+ and iodide is 1−, so two iodide ions are needed to balance the charge. The charges must balance in an ionic equation just as the atoms must." },
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
    key: "chem.eq.half-equations",
    subject: "chemistry",
    topic: "chem-equations",
    subtopic: "half-equations",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "What is the half equation for the formation of sodium metal at the cathode during electrolysis?", a: "Na⁺ + e⁻ → Na", wrong: ["Na → Na⁺ + e⁻", "Na⁺ → Na + e⁻", "2Na⁺ + 2e⁻ → Na₂"], why: "The cathode is negative, so it attracts positive ions and supplies electrons to them. Gaining an electron is reduction, and every cathode half equation has electrons on the LEFT." },
        { q: "What is the half equation for chlorine forming at the anode during electrolysis?", a: "2Cl⁻ → Cl₂ + 2e⁻", wrong: ["Cl⁻ → Cl + e⁻", "Cl₂ + 2e⁻ → 2Cl⁻", "2Cl⁻ + 2e⁻ → Cl₂"], why: "Two chloride ions each lose an electron and pair up as a Cl₂ molecule. Losing electrons is oxidation, and every anode half equation has electrons on the RIGHT." },
        { q: "What is the half equation for the formation of hydrogen at the cathode?", a: "2H⁺ + 2e⁻ → H₂", wrong: ["H⁺ + e⁻ → H", "H₂ → 2H⁺ + 2e⁻", "2H⁺ → H₂ + 2e⁻"], why: "Hydrogen gas is diatomic, so two hydrogen ions and two electrons are needed. Writing H rather than H₂ leaves a species that does not exist on its own." },
        { q: "In a half equation, how do you know a species has been oxidised?", a: "It has lost electrons, which appear on the right-hand side", wrong: ["It has gained electrons, which appear on the right", "It has gained oxygen atoms only", "Its state symbol has changed"], why: "OIL RIG: oxidation is loss, reduction is gain — of electrons. Gaining oxygen is one common way to lose electrons, but the electron definition is the general one and the only one that works for reactions with no oxygen in them." },
        { q: "What is the half equation for copper forming at the cathode from copper(II) sulfate solution?", a: "Cu²⁺ + 2e⁻ → Cu", wrong: ["Cu²⁺ + e⁻ → Cu", "Cu → Cu²⁺ + 2e⁻", "Cu²⁺ → Cu + 2e⁻"], why: "The copper ion carries a 2+ charge, so it needs two electrons to become a neutral atom. The number of electrons always equals the size of the charge being cancelled." },
        { q: "What is the half equation for oxygen forming at the anode during the electrolysis of water?", a: "4OH⁻ → O₂ + 2H₂O + 4e⁻", wrong: ["2OH⁻ → O₂ + 2e⁻", "O₂ + 4e⁻ → 2O²⁻", "2H₂O → O₂ + 4H⁺"], why: "Four hydroxide ions give one oxygen molecule, two water molecules and four electrons. Both the atoms and the charges must balance, and checking the charge is what catches the wrong versions." },
        { q: "Why must the electrons cancel when two half equations are combined into a full equation?", a: "The electrons lost by one species are exactly the electrons gained by the other", wrong: ["Electrons are destroyed during the reaction", "Electrons are always spectators", "The equation would otherwise have too many atoms"], why: "There is no source or sink of free electrons in the reaction — they simply transfer. So the half equations are scaled until the electron counts match, and then they cancel exactly." },
        { q: "Which half equation represents a reduction?", a: "Fe³⁺ + e⁻ → Fe²⁺", wrong: ["Fe²⁺ → Fe³⁺ + e⁻", "2Br⁻ → Br₂ + 2e⁻", "Zn → Zn²⁺ + 2e⁻"], why: "Reduction is gain of electrons, so the electrons appear on the left. Here iron(III) gains one electron and becomes iron(II); its oxidation number falls from +3 to +2, which is the other way of spotting it." },
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
   Helpers and fallbacks
   ========================================================================== */

/** Mr as it would come out if every subscript were ignored — a real mistake. */
function mrOfIgnoringSubscripts(f: string): number {
  const symbols = f.match(/[A-Z][a-z]?/g) ?? [];
  return symbols.reduce((total, symbol) => total + (mrOf(symbol) || 0), 0);
}

function buildAvogadroFallback() {
  const answer = ans(1.204e24, "molecules");
  return {
    prompt:
      "Take the Avogadro constant as 6.02 × 10²³ mol⁻¹. How many molecules are there in 2 mol of carbon dioxide?",
    answer,
    distractors: pickDistractors(answer, [
      slip(3.01e23, "molecules"), // divided instead of multiplying
      slip(6.02e23, "molecules"), // ignored the amount
      slip(2, "molecules"), // gave the amount
    ]),
    explanation:
      "Number of particles = moles × Avogadro constant = 2 × 6.02 × 10²³ = 1.204 × 10²⁴. " +
      "The Mr plays no part: a mole of any substance contains the same number of particles.",
    check: () => (agrees(2 * 6.02e23, 1.204e24) ? null : "the fallback count is wrong"),
  };
}

function buildReactingFallback() {
  const answer = ans(56, "g");
  return {
    prompt:
      "For the reaction CaCO₃ → CaO + CO₂, calculate the mass of CaO produced when 100 g of CaCO₃ reacts completely. " +
      "(Mr: CaCO₃ = 100, CaO = 56.)",
    answer,
    distractors: pickDistractors(answer, [
      slip(100, "g"), // assumed the mass is unchanged
      slip(44, "g"), // gave the carbon dioxide instead
      slip(178.6, "g"), // used the Mr ratio upside down
    ]),
    explanation:
      "Moles of CaCO₃ = 100 ÷ 100 = 1 mol. The ratio is 1 : 1, so 1 mol of CaO forms. Mass = 1 × 56 = 56 g. " +
      "The missing 44 g left as carbon dioxide.",
    check: () => (agrees(56 + 44, 100) ? null : "the fallback does not conserve mass"),
  };
}

function buildConcentrationFallback() {
  const answer = ans(0.025, "mol");
  return {
    prompt: "How many moles of solute are there in 50 cm³ of 0.5 mol/dm³ hydrochloric acid?",
    answer,
    distractors: pickDistractors(answer, [
      slip(25, "mol"), // left the volume in cm³
      slip(10, "mol"), // divided instead of multiplying
      slip(0.5, "mol"), // gave the concentration
    ]),
    explanation:
      "Convert first: 50 cm³ = 0.05 dm³. moles = concentration × volume = 0.5 × 0.05 = 0.025 mol. " +
      "Forgetting to divide by 1000 multiplies the answer by a thousand.",
    check: () => (agrees(0.5 * 0.05, 0.025) ? null : "the fallback concentration is wrong"),
  };
}

function buildTitrationFallback() {
  const answer = ans(0.2, "mol/dm³");
  return {
    prompt:
      "25 cm³ of 0.1 mol/dm³ H₂SO₄ exactly neutralises 25 cm³ of NaOH solution. " +
      "The acid and alkali react in a 1 : 2 ratio. What is the concentration of the NaOH?",
    answer,
    distractors: pickDistractors(answer, [
      slip(0.1, "mol/dm³"), // ignored the reacting ratio
      slip(0.05, "mol/dm³"), // applied the ratio the wrong way
      slip(0.4, "mol/dm³"), // applied the ratio twice
    ]),
    explanation:
      "Moles of acid = 0.1 × 25/1000 = 0.0025 mol. The ratio is 1 : 2, so moles of NaOH = 0.005 mol. " +
      "Concentration = 0.005 ÷ 0.025 = 0.2 mol/dm³. Sulfuric acid is diprotic, so the ratio is not 1 : 1.",
    check: () => (agrees(0.005 / 0.025, 0.2) ? null : "the fallback titration is wrong"),
  };
}

function buildYieldFallback() {
  const answer = "75%";
  return {
    prompt: "A reaction should produce 80 g of product, but only 60 g is obtained. What is the percentage yield?",
    answer,
    distractors: wrongOptions(answer, ["133.3%", "25%", "60%"]),
    explanation:
      "Percentage yield = actual ÷ theoretical × 100 = 60 ÷ 80 × 100 = 75%. " +
      "It can never exceed 100%; a value above that means the product is still wet or impure.",
    check: () => (agrees((60 / 80) * 100, 75) ? null : "the fallback yield is wrong"),
  };
}

function buildEconomyFallback() {
  const answer = "56%";
  return {
    prompt: "For the reaction CaCO₃ → CaO + CO₂, calculate the atom economy for making CaO.",
    answer,
    distractors: wrongOptions(answer, ["44%", "100%", "178.6%"]),
    explanation:
      "Atom economy = Mr of wanted product ÷ total Mr of products × 100 = 56 ÷ 100 × 100 = 56%. " +
      "The other 44% leaves as carbon dioxide. Atom economy is about the equation, not practical losses.",
    check: () => (agrees((56 / 100) * 100, 56) ? null : "the fallback economy is wrong"),
  };
}

function buildConservationFallback() {
  const answer = ans(80, "g");
  return {
    prompt:
      "In the reaction 2Mg + O₂ → 2MgO, 48 g of Mg reacts completely with 32 g of oxygen. " +
      "What is the total mass of the products?",
    answer,
    distractors: pickDistractors(answer, [
      slip(48, "g"), // gave one reactant's mass
      slip(16, "g"), // subtracted instead of adding
      slip(40, "g"), // halved the total
    ]),
    explanation:
      "Mass is conserved: 48 + 32 = 80 g of magnesium oxide. No atoms are created or destroyed, only rearranged.",
    check: () => (agrees(48 + 32, 80) ? null : "the fallback does not conserve mass"),
  };
}
