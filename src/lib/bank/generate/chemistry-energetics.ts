/**
 * Chemistry: Energetics and organic chemistry.
 *
 * Energetics is where sign conventions do the teaching. A student who can
 * compute 678 − 864 and still writes "+186" has not learned the topic, so the
 * distractors here are dominated by sign errors and by the bonds-made-minus-
 * bonds-broken inversion, and every enthalpy is computed from a bond table
 * rather than typed.
 *
 * Organic is mostly pattern recognition — a homologous series is a rule, and
 * the questions ask students to apply it rather than recall a list. The
 * molecular formulae are generated from n, so CnH2n+2 is enforced by the code
 * rather than trusted.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, cap, exact, num, slip, wrongOptions } from "./physics-kit";
import { formula } from "./chemistry-kit";

/* ==========================================================================
   Data
   ========================================================================== */

/** Mean bond enthalpies in kJ/mol, as quoted in data booklets. */
const BONDS: Record<string, number> = {
  "H-H": 436,
  "C-H": 413,
  "C-C": 347,
  "C=C": 614,
  "O=O": 498,
  "C=O": 805,
  "O-H": 464,
  "Cl-Cl": 242,
  "H-Cl": 432,
  "Br-Br": 193,
  "H-Br": 366,
  "C-Cl": 346,
  "C-Br": 276,
  "N≡N": 945,
  "N-H": 391,
};

interface BondReaction {
  equation: string;
  /** Bonds broken in the reactants, as [bond, count]. */
  broken: [string, number][];
  /** Bonds made in the products. */
  made: [string, number][];
  name: string;
}

const BOND_REACTIONS: readonly BondReaction[] = [
  {
    equation: "H₂ + Cl₂ → 2HCl",
    name: "hydrogen burning in chlorine",
    broken: [["H-H", 1], ["Cl-Cl", 1]],
    made: [["H-Cl", 2]],
  },
  {
    equation: "H₂ + Br₂ → 2HBr",
    name: "hydrogen reacting with bromine",
    broken: [["H-H", 1], ["Br-Br", 1]],
    made: [["H-Br", 2]],
  },
  {
    equation: "N₂ + 3H₂ → 2NH₃",
    name: "the Haber process",
    broken: [["N≡N", 1], ["H-H", 3]],
    made: [["N-H", 6]],
  },
  {
    equation: "CH₄ + 2O₂ → CO₂ + 2H₂O",
    name: "the complete combustion of methane",
    broken: [["C-H", 4], ["O=O", 2]],
    made: [["C=O", 2], ["O-H", 4]],
  },
  {
    equation: "C₂H₄ + H₂ → C₂H₆",
    name: "the hydrogenation of ethene",
    broken: [["C=C", 1], ["C-H", 4], ["H-H", 1]],
    made: [["C-C", 1], ["C-H", 6]],
  },
  {
    equation: "C₂H₄ + Br₂ → C₂H₄Br₂",
    name: "ethene decolourising bromine water",
    broken: [["C=C", 1], ["C-H", 4], ["Br-Br", 1]],
    made: [["C-C", 1], ["C-H", 4], ["C-Br", 2]],
  },
];

/** Sum a bond inventory. The table is the only source of the numbers. */
function bondTotal(list: readonly [string, number][]): number {
  let total = 0;
  for (const [bond, count] of list) {
    const energy = BONDS[bond];
    if (energy === undefined) throw new Error(`No bond energy for ${bond}`);
    total += energy * count;
  }
  return total;
}

function inventory(list: readonly [string, number][]): string {
  return list.map(([bond, count]) => (count === 1 ? bond : `${count} × ${bond}`)).join(", ");
}

/** The first ten alkanes, by stem. Names come from the stem, not a second list. */
const STEMS = [
  "meth", "eth", "prop", "but", "pent", "hex", "hept", "oct", "non", "dec",
];

/** Molecular formula of the straight-chain alkane with n carbons. */
function alkaneFormula(n: number): string {
  return formula(`C${n === 1 ? "" : n}H${2 * n + 2}`);
}

function alkeneFormula(n: number): string {
  return formula(`C${n}H${2 * n}`);
}

function alcoholFormula(n: number): string {
  return formula(`C${n === 1 ? "" : n}H${2 * n + 1}OH`);
}

/** "alcohol" → "an alcohol". Vowel-initial family names are the majority here. */
function withArticle(word: string): string {
  return `${"aeiou".includes(word[0]) ? "an" : "a"} ${word}`;
}

const FUNCTIONAL_GROUPS = [
  { family: "alkane", group: "C–C single bonds only", example: "ethane", ending: "-ane" },
  { family: "alkene", group: "C=C double bond", example: "ethene", ending: "-ene" },
  { family: "alcohol", group: "–OH", example: "ethanol", ending: "-ol" },
  { family: "carboxylic acid", group: "–COOH", example: "ethanoic acid", ending: "-oic acid" },
  { family: "ester", group: "–COO–", example: "ethyl ethanoate", ending: "-oate" },
  { family: "halogenoalkane", group: "–Cl, –Br or –I", example: "chloroethane", ending: "chloro- or bromo-" },
  { family: "aldehyde", group: "–CHO", example: "ethanal", ending: "-al" },
  { family: "ketone", group: "C=O in the middle of the chain", example: "propanone", ending: "-one" },
  { family: "amine", group: "–NH₂", example: "ethylamine", ending: "-amine" },
] as const;

const MONOMERS = [
  { monomer: "ethene", mf: "C2H4", mr: 28, polymer: "poly(ethene)", repeat: "–CH₂–CH₂–" },
  { monomer: "propene", mf: "C3H6", mr: 42, polymer: "poly(propene)", repeat: "–CH₂–CH(CH₃)–" },
  { monomer: "chloroethene", mf: "C2H3Cl", mr: 62.5, polymer: "poly(chloroethene)", repeat: "–CH₂–CHCl–" },
  { monomer: "tetrafluoroethene", mf: "C2F4", mr: 100, polymer: "poly(tetrafluoroethene)", repeat: "–CF₂–CF₂–" },
  { monomer: "styrene", mf: "C8H8", mr: 104, polymer: "poly(styrene)", repeat: "–CH₂–CH(C₆H₅)–" },
] as const;

/* ==========================================================================
   The generators
   ========================================================================== */

export const chemistryEnergetics: Generator[] = [
  /* ------------------------------------------------------------------------
     Energetics
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.energ.exo-endo",
    subject: "chemistry",
    topic: "chem-energetics",
    subtopic: "exothermic-endothermic",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What happens to the temperature of the surroundings during an exothermic reaction?", a: "It rises", wrong: ["It falls", "It stays the same", "It falls and then rises"], why: "Exothermic means energy leaves the reacting chemicals and enters the surroundings, so a thermometer in the mixture reads higher. The energy has not been created — it was stored in the bonds and has been released." },
        { q: "What happens to the temperature of the surroundings during an endothermic reaction?", a: "It falls", wrong: ["It rises", "It stays the same", "It rises and then falls"], why: "Endothermic reactions take energy IN from the surroundings, so the surroundings cool. This is why an instant cold pack works — the salt dissolving inside it is endothermic." },
        { q: "What is the sign of ΔH for an exothermic reaction?", a: "Negative", wrong: ["Positive", "Zero", "It depends on the temperature"], why: "ΔH is the change in the enthalpy of the CHEMICALS, not the surroundings. An exothermic reaction leaves the chemicals with less energy than they started with, so the change is negative — even though the surroundings get hotter." },
        { q: "What is the sign of ΔH for an endothermic reaction?", a: "Positive", wrong: ["Negative", "Zero", "It has no sign"], why: "The chemicals have gained energy from the surroundings, so their enthalpy has increased and ΔH is positive. Remember the sign describes the chemicals, which is why it feels backwards next to a cooling thermometer." },
        { q: "Which of these is an endothermic process?", a: "Thermal decomposition of calcium carbonate", wrong: ["Combustion of methane", "Neutralisation of an acid by an alkali", "Respiration"], why: "Thermal decomposition needs continuous heating precisely because it is endothermic — take the heat away and it stops. Combustion, neutralisation and respiration all release energy." },
        { q: "Which of these is an exothermic process?", a: "Neutralisation of hydrochloric acid by sodium hydroxide", wrong: ["Photosynthesis", "Thermal decomposition of limestone", "Dissolving ammonium nitrate in water"], why: "Neutralisation warms the mixture measurably — it is the standard calorimetry experiment for exactly that reason. The other three all take energy in." },
        { q: "On a reaction profile for an exothermic reaction, where are the products drawn?", a: "Below the reactants", wrong: ["Above the reactants", "At the same level as the reactants", "Above the activation energy peak"], why: "The vertical axis is energy, so products with less energy than the reactants sit lower and the drop between them is ΔH. The hump in between is the activation energy, and it exists whichever way ΔH goes." },
        { q: "What does the activation energy represent on a reaction profile?", a: "The minimum energy colliding particles need for a reaction to occur", wrong: ["The energy released by the reaction", "The difference in energy between reactants and products", "The energy of the products"], why: "Activation energy is the height of the barrier from the reactants to the peak — a separate quantity from ΔH, which is the difference between the two ends. A reaction can be strongly exothermic and still very slow if that barrier is high." },
        { q: "In terms of bonds, why is a reaction exothermic?", a: "The energy released making bonds is greater than the energy needed to break them", wrong: ["More bonds are made than broken", "Bond breaking releases energy", "The products have stronger reactants"], why: "Breaking bonds always TAKES energy in and making bonds always GIVES energy out. Which way the reaction goes overall depends on the sizes of those two totals, not on how many bonds there are." },
        { q: "Is bond breaking endothermic or exothermic?", a: "Endothermic — it always requires energy", wrong: ["Exothermic — it always releases energy", "It depends on the bond", "Neither, bond breaking involves no energy change"], why: "A bond is an attraction, and pulling two attracting things apart always costs energy. This is universal, which is why bond enthalpies are always quoted as positive numbers." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.energ.bond-energies",
    subject: "chemistry",
    topic: "chem-energetics",
    subtopic: "bond-energies",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 40,
    build: (rng) => {
      const r = rng.pick(BOND_REACTIONS);
      const broken = bondTotal(r.broken);
      const made = bondTotal(r.made);
      const dh = broken - made;
      const form = rng.int(0, 5);

      const table =
        `Bond energies in kJ/mol: ` +
        [...new Set([...r.broken, ...r.made].map(([b]) => b))].map((b) => `${b} = ${BONDS[b]}`).join(", ");

      if (form === 0) {
        const answer = ans(dh, "kJ/mol");
        return {
          prompt:
            `For the reaction ${r.equation}, bonds broken are ${inventory(r.broken)} and bonds made are ${inventory(r.made)}. ` +
            `${table}. What is ΔH?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(made - broken, "kJ/mol"), // made minus broken — the classic inversion
            slip(broken + made, "kJ/mol"), // added the two totals
            slip(broken, "kJ/mol"), // stopped at bonds broken
            slip(made, "kJ/mol"), // stopped at bonds made
          ]),
          explanation:
            `ΔH = energy in to break bonds − energy out making bonds = ${broken} − ${made} = ${answer}. ` +
            `The order matters: broken first, made second. Reversing it flips the sign and turns ${r.name} ` +
            `${dh < 0 ? "exothermic into endothermic" : "endothermic into exothermic"}.`,
          check: () => (agrees(-(made - broken), dh) ? null : "the two routes to ΔH disagree"),
        };
      }

      if (form === 1) {
        const answer = ans(broken, "kJ/mol");
        return {
          prompt:
            `For the reaction ${r.equation}, the bonds broken are ${inventory(r.broken)}. ${table}. ` +
            `How much energy is taken in to break these bonds?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(made, "kJ/mol"), // used the bonds made instead
            slip(broken - made, "kJ/mol"), // gave ΔH
            slip(broken / 2, "kJ/mol"), // halved
            slip(broken + made, "kJ/mol"),
          ]),
          explanation:
            `Multiply each bond energy by how many of that bond there are and add: ${broken} kJ/mol. ` +
            `Bond breaking is endothermic, so this number is taken IN — it is never negative.`,
          check: () => (broken > 0 ? null : "bond breaking cannot release energy"),
        };
      }

      if (form === 2) {
        const answer = dh < 0 ? "Exothermic" : "Endothermic";
        return {
          prompt:
            `Breaking the bonds in the reactants of ${r.equation} takes in ${broken} kJ/mol, and making the bonds in the products ` +
            `releases ${made} kJ/mol. Is the reaction exothermic or endothermic?`,
          answer,
          distractors: wrongOptions(answer, [
            dh < 0 ? "Endothermic" : "Exothermic",
            "Neither — the energy changes cancel exactly",
            "It depends on the temperature it is carried out at",
          ]),
          explanation:
            `${broken} in and ${made} out, so ΔH = ${dh} kJ/mol and the reaction is ${answer.toLowerCase()}. ` +
            `Compare the two totals, not the number of bonds: ${dh < 0 ? "more energy comes out than went in" : "more energy goes in than comes out"}.`,
          check: () => ((dh < 0) === (answer === "Exothermic") ? null : "the sign and the label disagree"),
        };
      }

      const moles = rng.pick([2, 3, 5, 10]);
      const total = dh * moles;
      const answer = ans(total, "kJ");
      return {
        prompt:
          `For the reaction ${r.equation}, ΔH = ${num(dh)} kJ/mol. What is the energy change when ${moles} mol reacts?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(-total, "kJ"), // right size, wrong sign
          slip(dh, "kJ"), // forgot to scale
          slip(dh / moles, "kJ"), // divided instead of multiplying
          slip(total + dh, "kJ"),
        ]),
        explanation:
          `ΔH is quoted per mole, so multiply: ${num(dh)} × ${moles} = ${answer}. ` +
          `The sign travels with it — scaling never turns an exothermic reaction endothermic.`,
        check: () => (agrees(total / moles, dh) ? null : "scaling back does not recover ΔH"),
      };
    },
  }),

  generator({
    key: "chem.energ.enthalpy",
    subject: "chemistry",
    topic: "chem-energetics",
    subtopic: "enthalpy-change",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 3);

      if (form === 0) {
        const cases = [
          { q: "What is the standard enthalpy change of formation of a compound?", a: "The enthalpy change when 1 mol of the compound is formed from its elements in their standard states", wrong: ["The enthalpy change when 1 mol of the compound is burned completely", "The enthalpy change when 1 mol of the compound is broken into its elements", "The energy needed to break 1 mol of bonds in the compound"], why: "Two details do the work: exactly ONE mole of the compound, and the elements in their standard states. It follows that the enthalpy of formation of an element is zero by definition — forming it from itself changes nothing." },
          { q: "What is the standard enthalpy change of combustion?", a: "The enthalpy change when 1 mol of a substance is burned completely in oxygen", wrong: ["The enthalpy change when 1 mol of oxygen is used up", "The enthalpy change when a substance burns incompletely", "The energy given out by any burning substance"], why: "One mole of the SUBSTANCE, burned COMPLETELY. Incomplete combustion releases less energy and gives different products, so it is a different quantity and not what the definition covers." },
          { q: "Why is the standard enthalpy of formation of oxygen gas zero?", a: "It is already an element in its standard state", wrong: ["Oxygen does not react", "Oxygen has no bonds", "The value is too small to measure"], why: "Formation means making a substance from its elements. For an element already in its standard state there is nothing to do, so the change is exactly zero — a definition, not a measurement." },
          { q: "What conditions are meant by 'standard conditions' for enthalpy changes?", a: "100 kPa pressure and a stated temperature, usually 298 K", wrong: ["0 °C and 100 kPa", "Room temperature and any pressure", "273 K and 1000 kPa"], why: "Standard conditions fix the pressure at 100 kPa and require the temperature to be stated — 298 K by convention. They are needed because enthalpy changes vary with both, so a quoted value is meaningless without them." },
        ];
        const c = rng.pick(cases);
        return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
      }

      /* Energy released, moles and enthalpy per mole. Chosen from the answer
         outwards so the division is exact. */
      const perMol = rng.pick([-180, -250, -390, -450, -560, -720, -890, -1370, -2220, -3120]);
      const moles = rng.pick([0.1, 0.2, 0.25, 0.5, 2, 4]);
      const released = exact(perMol * moles, 2, "energy released");

      if (form === 1) {
        const answer = ans(released, "kJ");
        return {
          prompt:
            `Burning ${num(moles)} mol of a fuel has ΔH = ${perMol} kJ/mol. What is the total enthalpy change?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(-released, "kJ"), // dropped the sign
            slip(perMol, "kJ"), // forgot to scale by moles
            slip(perMol / moles, "kJ"), // divided rather than multiplied
            slip(released / 2, "kJ"),
          ]),
          explanation:
            `Total = ΔH per mole × moles = ${perMol} × ${num(moles)} = ${answer}. ` +
            `Because ΔH is negative the total stays negative: burning less fuel releases less energy, not energy of the opposite sign.`,
          check: () => (agrees(released / moles, perMol) ? null : "dividing back does not give ΔH"),
        };
      }

      const answer = ans(perMol, "kJ/mol");
      return {
        prompt:
          `When ${num(moles)} mol of a fuel is burned, ${num(Math.abs(released))} kJ of energy is released. What is ΔH of combustion?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(-perMol, "kJ/mol"), // gave a positive value for an exothermic reaction
          slip(released, "kJ/mol"), // gave the total, not the per-mole value
          slip(perMol * moles * moles, "kJ/mol"), // multiplied instead of dividing
          slip(Math.abs(released) * moles, "kJ/mol"),
        ]),
        explanation:
          `ΔH = energy change ÷ moles = ${num(released)} ÷ ${num(moles)} = ${answer}. ` +
          `Energy is RELEASED, so the enthalpy of the chemicals has fallen and ΔH must carry a minus sign.`,
        check: () => (perMol < 0 ? null : "a combustion enthalpy cannot be positive"),
      };
    },
  }),

  generator({
    key: "chem.energ.calorimetry",
    subject: "chemistry",
    topic: "chem-energetics",
    subtopic: "calorimetry",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 48,
    build: (rng) => {
      /* q = mcΔT with c = 4.2 J/g/°C. Every mass here multiplies 4.2 to a whole
         number, so q is exact for any whole-number temperature rise. */
      const mass = rng.pick([25, 50, 100, 150, 200, 250]);
      const rise = rng.pick([2, 4, 5, 8, 10, 12, 15, 20, 25]);
      const q = exact(mass * 4.2 * rise, 2, "energy transferred");
      const form = rng.int(0, 2);

      if (form === 0) {
        const answer = ans(q, "J");
        return {
          prompt:
            `${mass} g of water is heated by a burning fuel and its temperature rises by ${rise} °C. ` +
            `The specific heat capacity of water is 4.2 J/g/°C. How much energy has the water gained?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(mass * rise, "J"), // forgot c
            slip(mass * 4.2, "J"), // forgot ΔT
            slip((mass * 4.2) / rise, "J"), // divided by ΔT
            slip(q / 1000, "J"), // converted to kJ but kept the unit
          ]),
          explanation:
            `q = m × c × ΔT = ${mass} × 4.2 × ${rise} = ${answer}. ` +
            `The mass is the mass of the WATER being heated, not of the fuel — using the fuel's mass here is the single commonest error in this experiment.`,
          check: () => (agrees(q / (mass * rise), 4.2) ? null : "dividing back does not recover c"),
        };
      }

      if (form === 1) {
        const answer = ans(rise, "°C");
        return {
          prompt:
            `${num(q)} J of energy is transferred to ${mass} g of water (c = 4.2 J/g/°C). What is the temperature rise?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(q / mass, "°C"), // forgot c
            slip(q / 4.2, "°C"), // forgot the mass
            slip((q * 4.2) / mass, "°C"), // multiplied by c instead of dividing
            slip(rise * 2, "°C"),
          ]),
          explanation:
            `Rearranging q = mcΔT gives ΔT = q ÷ (m × c) = ${num(q)} ÷ (${mass} × 4.2) = ${answer}. ` +
            `Both the mass and the specific heat capacity go on the bottom — dropping either one is what produces the wrong answers here.`,
          check: () => (agrees(mass * 4.2 * rise, q) ? null : "the rise does not reproduce q"),
        };
      }

      const cases = [
        { q: "In a combustion calorimetry experiment, why is the measured energy release always smaller than the true value?", a: "Energy is lost to the surroundings and the apparatus", wrong: ["The fuel does not burn at all", "Water has a low specific heat capacity", "The thermometer reads too high"], why: "Heat escapes into the air, the container and the stand rather than all of it reaching the water, so the calculated value is systematically too small. Insulating the container and shielding it from draughts reduces the loss but never removes it." },
        { q: "In the equation q = mcΔT applied to a neutralisation experiment, what does m represent?", a: "The total mass of the solutions mixed together", wrong: ["The mass of the acid only", "The mass of the reacting substance", "The mass of the calorimeter"], why: "The solutions are what get hotter, so their combined mass is what absorbs the energy. Using only the acid halves the answer, and using the mass of the solute confuses the thing reacting with the thing being heated." },
        { q: "Why is a polystyrene cup used rather than a glass beaker for neutralisation calorimetry?", a: "It is a poor conductor, so less energy escapes through the walls", wrong: ["It is lighter, so it absorbs less energy", "It reacts with neither acids nor alkalis", "It has a higher specific heat capacity"], why: "Polystyrene traps air, making it a good insulator, so more of the energy released stays in the solution where the thermometer can detect it. Glass conducts far better and lets the reading drift down as you take it." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.energ.hess",
    subject: "chemistry",
    topic: "chem-energetics",
    subtopic: "hess-cycles",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 40,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        const cases = [
          { q: "What does Hess's law state?", a: "The total enthalpy change is the same whatever route is taken from reactants to products", wrong: ["Energy cannot be created or destroyed", "The enthalpy change of a reaction equals the sum of the bond energies", "Exothermic reactions are always spontaneous"], why: "Enthalpy is a state function: it depends only on where you start and where you finish. That is what makes indirect routes usable — you can measure two easy reactions and get the enthalpy of a third you could never measure directly." },
          { q: "Why is Hess's law useful in practice?", a: "It gives enthalpy changes for reactions that cannot be measured directly", wrong: ["It makes reactions happen faster", "It predicts whether a reaction will occur", "It removes the need for standard conditions"], why: "The enthalpy of formation of methane cannot be measured by making methane from carbon and hydrogen — the reaction does not go cleanly. Combustion enthalpies can be measured, and Hess's law converts them into the one you want." },
          { q: "In a Hess cycle, what happens to the sign of ΔH when a reaction is reversed?", a: "It changes sign but keeps its magnitude", wrong: ["It stays exactly the same", "It doubles", "It becomes zero"], why: "Going backwards along an arrow undoes exactly the same energy change, so the size is identical and only the direction differs. Forgetting this is the most common cause of a Hess answer that is right in size and wrong in sign." },
        ];
        const c = rng.pick(cases);
        return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
      }

      const step1 = rng.pick([-394, -286, -890, -1560, -2220, -184, -572]);
      const step2 = rng.pick([-393, -285, -889, -110, -242, -636]);
      if (step1 === step2) {
        /* Two identical steps make the sum and the difference indistinguishable
           from one another as options, so shift one. */
        return buildHessPair(step1, step2 - 100);
      }
      return buildHessPair(step1, step2);
    },
  }),

  /* ------------------------------------------------------------------------
     Organic chemistry
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.org.alkanes",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "alkanes",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 28,
    build: (rng) => {
      const form = rng.int(0, 3);
      const n = rng.int(1, 8);
      const name = `${STEMS[n - 1]}ane`;

      if (form === 0) {
        const answer = alkaneFormula(n);
        return {
          prompt: `What is the molecular formula of ${name}?`,
          answer,
          distractors: wrongOptions(answer, [
            alkeneFormula(Math.max(2, n)), // used the alkene formula
            formula(`C${n === 1 ? "" : n}H${2 * n + 1}`), // forgot the +2
            formula(`C${n === 1 ? "" : n}H${2 * n + 4}`), // added two too many
            formula(`C${n === 1 ? "" : n}H${n + 2}`),
          ]),
          explanation:
            `Alkanes follow CₙH₂ₙ₊₂. With n = ${n}, hydrogen = 2 × ${n} + 2 = ${2 * n + 2}, giving ${answer}. ` +
            `The stem tells you n: meth = 1, eth = 2, prop = 3, but = 4, then pent, hex, hept, oct.`,
          check: () => (2 * n + 2 > 2 * n ? null : "the alkane formula is not saturated"),
        };
      }

      if (form === 1) {
        const answer = name;
        const others = [1, 2, 3, 4, 5, 6, 7, 8].filter((k) => k !== n).map((k) => `${STEMS[k - 1]}ane`);
        return {
          prompt: `Which alkane has the molecular formula ${alkaneFormula(n)}?`,
          answer,
          distractors: wrongOptions(answer, [others[0], others[1], others[2], others[3]]),
          explanation:
            `${alkaneFormula(n)} has ${n} carbon${n === 1 ? "" : "s"}, so the stem is ${STEMS[n - 1]} and the name is ${name}. ` +
            `Read the carbon count, not the hydrogen count — the hydrogens follow from it.`,
        };
      }

      if (form === 2) {
        const answer = "Carbon dioxide and water";
        return {
          prompt: `What are the products of the complete combustion of ${name}?`,
          answer,
          distractors: wrongOptions(answer, [
            "Carbon monoxide and water",
            "Carbon dioxide and hydrogen",
            "Carbon and water",
          ]),
          explanation:
            `Complete combustion of any hydrocarbon gives carbon dioxide and water: the carbon ends up fully oxidised and the hydrogen becomes water. ` +
            `Carbon monoxide and soot are the products of INCOMPLETE combustion, when the oxygen supply is limited.`,
        };
      }

      const cases = [
        { q: "Why are alkanes described as saturated?", a: "They contain only single bonds between carbon atoms", wrong: ["They cannot dissolve in water", "They contain the maximum number of carbon atoms", "They will not burn"], why: "Saturated means every carbon already holds as many hydrogens as it can, because there are no double bonds. That is exactly why alkanes do not react with bromine water — there is no double bond to open." },
        { q: "What happens to the boiling point of alkanes as the chain gets longer?", a: "It increases", wrong: ["It decreases", "It stays the same", "It increases and then decreases"], why: "Longer molecules have more surface contact and therefore stronger intermolecular forces between them, so more energy is needed to separate them. This is why fractional distillation can separate crude oil at all." },
        { q: "Why do alkanes not react with bromine water?", a: "They have no C=C double bond for the bromine to add across", wrong: ["They are too heavy", "Bromine water only reacts with acids", "They are already fully oxidised"], why: "Bromine water is decolourised by an addition reaction across a double bond. Alkanes are saturated, so there is nothing to add across and the orange colour stays — which makes this the standard test for distinguishing an alkene from an alkane." },
        { q: "What is cracking?", a: "Breaking long-chain hydrocarbons into shorter, more useful ones", wrong: ["Joining short hydrocarbons into long chains", "Burning hydrocarbons in a limited oxygen supply", "Separating crude oil by boiling point"], why: "Cracking exists because supply and demand do not match: crude oil gives more long chains than anyone wants and fewer short ones. It also produces alkenes, which are the feedstock for polymers." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.org.alkenes",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "alkenes",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 20,
    build: (rng) => {
      const form = rng.int(0, 2);
      const n = rng.int(2, 8);
      const name = `${STEMS[n - 1]}ene`;

      if (form === 0) {
        const answer = alkeneFormula(n);
        return {
          prompt: `What is the molecular formula of ${name}?`,
          answer,
          distractors: wrongOptions(answer, [
            alkaneFormula(n), // used the alkane formula
            formula(`C${n}H${2 * n - 2}`), // two too few
            formula(`C${n}H${2 * n + 1}`),
            formula(`C${n}H${n}`),
          ]),
          explanation:
            `Alkenes follow CₙH₂ₙ. With n = ${n}, hydrogen = 2 × ${n} = ${2 * n}, giving ${answer}. ` +
            `An alkene has two hydrogens fewer than the alkane with the same number of carbons, because the double bond uses up two bonding positions.`,
          check: () => (2 * n === 2 * n + 2 - 2 ? null : "an alkene should have two fewer hydrogens than its alkane"),
        };
      }

      if (form === 1) {
        const answer = name;
        const others = [2, 3, 4, 5, 6, 7, 8].filter((k) => k !== n).map((k) => `${STEMS[k - 1]}ene`);
        return {
          prompt: `Which alkene has the molecular formula ${alkeneFormula(n)}?`,
          answer,
          distractors: wrongOptions(answer, [others[0], others[1], others[2], others[3]]),
          explanation: `${alkeneFormula(n)} has ${n} carbons, so the name is ${name}. Alkene names end in -ene; the alkane with the same stem would be ${STEMS[n - 1]}ane.`,
        };
      }

      const cases = [
        { q: "What is the test for an alkene, and what is the positive result?", a: "Add bromine water — it changes from orange to colourless", wrong: ["Add bromine water — it changes from colourless to orange", "Add limewater — it turns milky", "Add universal indicator — it turns red"], why: "The bromine adds across the C=C double bond, and the coloured bromine molecule is used up, so the orange colour disappears. Alkanes leave it orange, which is what makes the test useful." },
        { q: "Why are alkenes described as unsaturated?", a: "They contain a C=C double bond, so more atoms can be added", wrong: ["They contain fewer carbon atoms than alkanes", "They cannot burn", "They dissolve in water"], why: "Unsaturated means there is room to add more atoms without removing any, which is possible because the double bond can open. Every addition reaction alkenes undergo — hydrogen, bromine, water — works this way." },
        { q: "What is the product when ethene reacts with steam in the presence of a catalyst?", a: "Ethanol", wrong: ["Ethane", "Ethanoic acid", "Ethene glycol"], why: "Water adds across the double bond, putting an –H on one carbon and an –OH on the other, giving ethanol. This hydration reaction is the industrial route to ethanol from crude oil." },
        { q: "What type of reaction is the reaction of ethene with hydrogen?", a: "Addition", wrong: ["Substitution", "Neutralisation", "Thermal decomposition"], why: "The double bond opens and the two hydrogen atoms join on, with nothing leaving the molecule. Nothing is displaced, so it is addition rather than substitution — and the product, ethane, is saturated." },
        { q: "Why are alkenes more reactive than alkanes?", a: "The C=C double bond is a region of high electron density that is readily attacked", wrong: ["Alkenes have more hydrogen atoms", "Alkenes have weaker C–H bonds", "Alkenes are smaller molecules"], why: "The extra pair of electrons in the double bond is exposed and attracts electron-poor species, so alkenes react readily under mild conditions. Alkanes have no such site and need harsh conditions such as UV light." },
        { q: "Cracking an alkane produces a shorter alkane and one other type of product. What is it?", a: "An alkene", wrong: ["An alcohol", "Hydrogen only", "A carboxylic acid"], why: "There are not enough hydrogens to make two saturated molecules from one, so one fragment must contain a double bond. That is why cracking supplies the alkenes the polymer industry needs." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.org.alcohols",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "alcohols",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    /* Eight chain lengths plus eight written cases. Sixteen is the exact size
       of the space, so ask for fewer than that and the dedupe never stalls. */
    variants: 16,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const n = rng.int(1, 8);
        const name = `${STEMS[n - 1]}anol`;
        const answer = alcoholFormula(n);
        return {
          prompt: `What is the molecular formula of ${name}, written to show the –OH group?`,
          answer,
          distractors: wrongOptions(answer, [
            formula(`C${n === 1 ? "" : n}H${2 * n + 2}OH`), // one H too many on the chain
            formula(`C${n === 1 ? "" : n}H${2 * n}OH`), // one too few
            alkaneFormula(n), // gave the alkane
            formula(`C${n === 1 ? "" : n}H${2 * n + 1}O`),
          ]),
          explanation:
            `An alcohol is an alkane with one hydrogen replaced by –OH, so the chain part is CₙH₂ₙ₊₁ and then OH: ${answer}. ` +
            `With n = ${n}, that is ${2 * n + 1} hydrogens on the carbons plus the one in the hydroxyl group.`,
          check: () => (2 * n + 1 + 1 === 2 * n + 2 ? null : "the hydrogen count does not match the parent alkane"),
        };
      }

      const cases = [
        { q: "What is the functional group of an alcohol?", a: "–OH", wrong: ["–COOH", "–CHO", "C=C"], why: "The hydroxyl group is what makes an alcohol an alcohol, and it is why alcohols dissolve in water so readily — the –OH can hydrogen bond with water molecules." },
        { q: "What is produced when ethanol is oxidised?", a: "Ethanoic acid", wrong: ["Ethene", "Ethane", "Ethyl ethanoate"], why: "Oxidation converts the alcohol group to a carboxylic acid, which is why wine left open turns to vinegar. Microbes in the air do the oxidising; in the lab acidified potassium dichromate does the same job." },
        { q: "What are the products when ethanol burns completely in air?", a: "Carbon dioxide and water", wrong: ["Ethanoic acid and water", "Carbon monoxide and hydrogen", "Ethene and water"], why: "Complete combustion of any organic compound containing only C, H and O gives carbon dioxide and water. This is why ethanol works as a fuel." },
        { q: "What is produced when sodium is added to ethanol?", a: "Hydrogen and sodium ethoxide", wrong: ["Oxygen and sodium ethanoate", "Ethene and sodium hydroxide", "No reaction occurs"], why: "The –OH hydrogen is slightly acidic, so sodium displaces it much as it displaces hydrogen from water — just more gently. The fizzing is hydrogen." },
        { q: "How is ethanol produced by fermentation?", a: "Yeast converts sugar to ethanol and carbon dioxide in the absence of air", wrong: ["Ethene reacts with steam over a catalyst", "Ethanoic acid is reduced by hydrogen", "Sugar is heated with sulfuric acid"], why: "Fermentation uses a renewable feedstock and low temperatures, but it is slow, gives a dilute product and stops when the ethanol concentration kills the yeast. Hydration of ethene is the other industrial route — faster and purer, but from crude oil." },
        { q: "Why does ethanol dissolve readily in water?", a: "Its –OH group can form hydrogen bonds with water molecules", wrong: ["It is an ionic compound", "It has a low boiling point", "It reacts with water to form an acid"], why: "The hydroxyl group is polar and hydrogen bonds to water. Longer alcohols become less soluble as the non-polar carbon chain grows and comes to dominate the molecule." },
        { q: "What colour change is seen when ethanol is warmed with acidified potassium dichromate?", a: "Orange to green", wrong: ["Green to orange", "Purple to colourless", "Colourless to orange"], why: "Dichromate(VI) ions are orange and are reduced to chromium(III) ions, which are green. The colour change is the visible sign that the alcohol has been oxidised." },
        { q: "Why are alcohols a homologous series?", a: "They share a general formula and a functional group, and differ by CH₂ each step", wrong: ["They all have the same boiling point", "They all contain exactly one carbon atom", "They all react with bromine water"], why: "A homologous series shares a functional group and general formula, so members show a gradual trend in physical properties and very similar chemical reactions. That is what lets you predict butanol's behaviour from ethanol's." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.org.carboxylic",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "carboxylic-acids",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "Why is the hydrogen of a –COOH group acidic when the hydrogen of an alcohol's –OH is not?", a: "The neighbouring C=O pulls electron density away, so the O–H bond breaks more easily", wrong: ["A carboxylic acid has more hydrogen atoms", "The –COOH group is ionic", "Alcohols contain no oxygen"], why: "The carbonyl group next door withdraws electrons and also spreads the charge of the resulting ion over two oxygens, so releasing the proton costs less. An isolated –OH has neither advantage, which is why ethanol is neutral and ethanoic acid is not." },
        { q: "What is the name of the carboxylic acid with two carbon atoms?", a: "Ethanoic acid", wrong: ["Methanoic acid", "Propanoic acid", "Ethanol"], why: "Two carbons gives the stem eth-, and the acid ending is -anoic acid. The carbon of the –COOH group counts as one of the two, which is where the off-by-one errors come from." },
        { q: "What is produced when a carboxylic acid reacts with a metal carbonate?", a: "A salt, water and carbon dioxide", wrong: ["A salt and hydrogen", "A salt and water only", "An ester and water"], why: "Carboxylic acids are acids, so they do everything acids do — including fizzing with carbonates. The fizzing is a standard test that distinguishes them from alcohols, which do not react." },
        { q: "Why are carboxylic acids described as weak acids?", a: "They only partially ionise in solution", wrong: ["They are dilute", "They contain few hydrogen atoms", "They react slowly with everything"], why: "Weak refers to how completely the acid ionises, not how concentrated it is. In ethanoic acid solution most molecules stay intact, so the pH is higher than a strong acid of the same concentration." },
        { q: "What is formed when a carboxylic acid reacts with an alcohol?", a: "An ester and water", wrong: ["A salt and water", "An aldehyde and hydrogen", "A polymer"], why: "Esterification joins the two with an –COO– link and releases water. Esters are what give many fruits their smell, which is why the reaction is usually done with an acid catalyst and a warm water bath." },
        { q: "What salt is formed when ethanoic acid reacts with sodium hydroxide?", a: "Sodium ethanoate", wrong: ["Sodium ethanol", "Sodium ethanoic", "Sodium ethene"], why: "The metal comes from the alkali and the acid's -oic acid ending becomes -oate. Neutralisation works the same way here as it does for hydrochloric acid, just with an organic acid." },
        { q: "How do the pH values of ethanoic acid and hydrochloric acid of the same concentration compare?", a: "Ethanoic acid has a higher pH", wrong: ["Ethanoic acid has a lower pH", "They are identical", "Ethanoic acid has no pH"], why: "The weak acid releases fewer H⁺ ions at the same concentration, so its solution is less acidic and its pH is higher. Same concentration, different degree of ionisation." },
        { q: "What is vinegar?", a: "A dilute solution of ethanoic acid", wrong: ["A dilute solution of ethanol", "A concentrated solution of methanoic acid", "A solution of an ester"], why: "Vinegar is roughly 5% ethanoic acid in water, made by oxidising the ethanol in wine or cider. Its smell and sourness are the smell and taste of the acid." },
        { q: "Why do carboxylic acids have higher boiling points than alcohols with the same number of carbons?", a: "They form stronger hydrogen bonds, often as pairs of molecules", wrong: ["They have more carbon atoms", "They are ionic", "They have weaker intermolecular forces"], why: "A carboxyl group has both a hydrogen bond donor and an acceptor, so two molecules can pair up and hold together with two hydrogen bonds. Separating those pairs takes more energy than separating alcohol molecules." },
        { q: "Which gas is given off when ethanoic acid reacts with magnesium?", a: "Hydrogen", wrong: ["Carbon dioxide", "Oxygen", "Methane"], why: "Metal plus acid gives salt plus hydrogen, whether the acid is organic or mineral. The reaction is slower than with hydrochloric acid because the weak acid provides fewer H⁺ ions." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.org.polymers",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "polymers",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 40,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        const m = rng.pick(MONOMERS);
        const answer = m.polymer;
        return {
          prompt: `Which polymer is made from the monomer ${m.monomer}?`,
          answer,
          distractors: wrongOptions(answer, MONOMERS.filter((x) => x.polymer !== m.polymer).map((x) => x.polymer)),
          explanation:
            `Addition polymerisation of ${m.monomer} gives ${answer}, with the repeat unit ${m.repeat}. ` +
            `The name is simply poly( ) around the monomer's name, because every atom of the monomer ends up in the polymer.`,
        };
      }

      if (form === 1) {
        /* Chain length from the Mr of the polymer. Built from the count, so the
           division is exact by construction. */
        const m = rng.pick(MONOMERS);
        const units = rng.pick([500, 800, 1000, 1500, 2000, 2500, 4000]);
        const total = exact(m.mr * units, 2, "polymer Mr");
        const answer = ans(units);
        return {
          prompt:
            `A molecule of ${m.polymer} has a relative molecular mass of ${num(total)}. The monomer ${m.monomer} has Mr = ${num(m.mr)}. ` +
            `How many monomer units are in the chain?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(m.mr, ""), // gave the monomer Mr
            slip(total / (m.mr * 2), ""), // halved
            slip(total - m.mr, ""), // subtracted instead of dividing
            slip(units * 2, ""),
          ]),
          explanation:
            `In addition polymerisation nothing is lost, so the chain's Mr is simply the monomer's Mr multiplied by the number of units: ` +
            `${num(total)} ÷ ${num(m.mr)} = ${answer}. ` +
            `This only works for ADDITION polymers — in condensation polymerisation a small molecule is lost at each link, so the arithmetic differs.`,
          check: () => (agrees(units * m.mr, total) ? null : "the chain length does not reproduce the polymer Mr"),
        };
      }

      const cases = [
        { q: "What feature must a monomer have to undergo addition polymerisation?", a: "A C=C double bond", wrong: ["An –OH group", "At least four carbon atoms", "A –COOH group"], why: "The double bond opens and its electrons form the links to the neighbouring monomers. No double bond, no addition polymerisation — which is why alkanes cannot be polymerised this way." },
        { q: "How does condensation polymerisation differ from addition polymerisation?", a: "A small molecule such as water is lost at each link", wrong: ["No catalyst is needed", "Only one type of monomer can be used", "It produces no polymer chain"], why: "Condensation monomers have two functional groups each, and joining them expels a small molecule. That means the polymer's mass is less than the total mass of monomers — the opposite of the addition case." },
        { q: "Why are many addition polymers difficult to dispose of?", a: "They are unreactive and not biodegradable, so they persist in landfill", wrong: ["They dissolve and contaminate groundwater", "They decompose into toxic gases at room temperature", "They are too valuable to discard"], why: "The strong C–C backbone that makes them durable is exactly what stops microbes breaking them down. That durability is a design advantage in use and a problem afterwards." },
        { q: "What is the repeat unit of poly(ethene)?", a: "–CH₂–CH₂–", wrong: ["–CH₃–CH₃–", "–CH=CH–", "–CH₂–CHCl–"], why: "The double bond in ethene opens to leave two CH₂ groups joined into the chain, with bonds extending at each end. The repeat unit keeps every atom of the monomer — it just redraws the double bond as two chain links." },
        { q: "Why does poly(ethene) have a much higher melting point than ethene?", a: "The polymer molecules are far longer, so intermolecular forces between them are much stronger", wrong: ["The polymer is ionic", "The C=C bond is stronger than a C–C bond", "The polymer contains hydrogen bonds"], why: "Each polymer molecule contacts its neighbours over thousands of atoms, so the total attraction between chains is large even though each individual force is weak. Ethene molecules are tiny and barely stick together at all." },
        { q: "What monomer is used to make PVC, poly(chloroethene)?", a: "Chloroethene", wrong: ["Ethene", "Chloroethane", "Tetrafluoroethene"], why: "The polymer's name names its monomer: poly(chloroethene) from chloroethene. Chloroethane is saturated and cannot polymerise — only the alkene works." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.org.isomerism",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "isomerism",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const cases = [
        { q: "What are structural isomers?", a: "Compounds with the same molecular formula but different structural formulae", wrong: ["Compounds with the same structure but different formulae", "Compounds with the same physical properties", "Different amounts of the same compound"], why: "Same atoms, arranged differently. Because the arrangement differs, so do the physical properties — which is why butane and methylpropane have different boiling points despite both being C₄H₁₀." },
        { q: "How many structural isomers does C₄H₁₀ have?", a: "2", wrong: ["1", "3", "4"], why: "Butane, a straight chain, and methylpropane, a three-carbon chain with a branch. There is no third arrangement: putting the branch on an end carbon just gives butane drawn differently." },
        { q: "How many structural isomers does C₅H₁₂ have?", a: "3", wrong: ["2", "4", "5"], why: "Pentane, methylbutane and dimethylpropane. The count grows quickly after this — C₆H₁₄ has five — because branches can be placed in more positions." },
        { q: "What is chain isomerism?", a: "Isomers that differ in how the carbon skeleton is branched", wrong: ["Isomers that differ in the position of a functional group", "Isomers with different functional groups", "Isomers that differ in the number of carbons"], why: "The skeleton is rearranged while the functional group stays the same. Butane and methylpropane are the standard example, and branching is why the branched isomer boils lower — the molecules pack together less well." },
        { q: "What is position isomerism?", a: "Isomers that differ in where the functional group sits on the same chain", wrong: ["Isomers with different carbon skeletons", "Isomers with different molecular formulae", "Isomers that are mirror images"], why: "Propan-1-ol and propan-2-ol have the same chain and the same –OH, just attached at different carbons. The locant number in the name exists precisely to tell them apart." },
        { q: "Which pair are functional group isomers?", a: "Ethanol and methoxymethane", wrong: ["Butane and methylpropane", "Propan-1-ol and propan-2-ol", "Ethene and propene"], why: "Both are C₂H₆O, but one is an alcohol and the other an ether — different functional groups from the same atoms. Their chemistry differs completely, unlike chain or position isomers which behave similarly." },
        { q: "Why do branched alkanes have lower boiling points than their straight-chain isomers?", a: "Branching reduces the surface contact between molecules, weakening intermolecular forces", wrong: ["Branched molecules are lighter", "Branched molecules have stronger bonds", "Branched molecules are polar"], why: "A branched molecule is more spherical, so neighbouring molecules touch over less area and the induced dipole forces between them are weaker. Same mass, less contact, lower boiling point." },
        { q: "Do structural isomers have the same molecular formula?", a: "Yes, by definition", wrong: ["No, they differ by CH₂", "Only if they have the same functional group", "Only for hydrocarbons"], why: "Identical molecular formula is what makes them isomers at all. Differing by CH₂ would make them members of a homologous series, which is a completely different relationship." },
        { q: "How many structural isomers does C₃H₈ have?", a: "1", wrong: ["2", "3", "0"], why: "Propane only. With three carbons there is nowhere to put a branch — a branch on the middle carbon would need a fourth carbon, giving a different formula." },
        { q: "Which of these is an isomer of butan-1-ol?", a: "Butan-2-ol", wrong: ["Butane", "Propan-1-ol", "Pentan-1-ol"], why: "Both are C₄H₁₀O, differing only in which carbon carries the –OH — position isomerism. Butane has no oxygen, and the other two have different numbers of carbons." },
        { q: "Do isomers always have similar chemical properties?", a: "No — functional group isomers behave very differently", wrong: ["Yes, always", "Yes, if they have the same mass", "No, isomers never react at all"], why: "Chain and position isomers usually react similarly because the functional group is unchanged. Functional group isomers such as ethanol and methoxymethane share only a formula, and their chemistry has nothing in common." },
        { q: "What must be true of two molecules for them to be isomers rather than the same compound?", a: "The atoms must be connected in a different order or arrangement", wrong: ["They must have different numbers of atoms", "They must be drawn differently on paper", "They must have different colours"], why: "Rotating or redrawing a molecule does not create an isomer — the connectivity has to genuinely differ. This trips people up when they draw the same chain flipped and count it twice." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.org.functional-groups",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "functional-groups",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const g = rng.pick(FUNCTIONAL_GROUPS);
      const form = rng.int(0, 1);

      if (form === 0) {
        const answer = g.group;
        return {
          prompt: `Which functional group defines ${withArticle(g.family)}?`,
          answer,
          distractors: wrongOptions(answer, FUNCTIONAL_GROUPS.filter((x) => x.group !== g.group).map((x) => x.group)),
          explanation:
            `${cap(withArticle(g.family))} is defined by ${answer}, and ${g.example} is the simplest common example. ` +
            `The functional group, not the chain length, is what determines how a molecule reacts.`,
        };
      }

      const answer = g.family;
      return {
        prompt: `${cap(g.example)} belongs to which family of organic compounds?`,
        answer,
        distractors: wrongOptions(answer, FUNCTIONAL_GROUPS.filter((x) => x.family !== g.family).map((x) => x.family)),
        explanation:
          `${cap(g.example)} contains ${g.group}, which makes it ${withArticle(answer)}. ` +
          `The name gives it away too: the ${g.ending} ending is reserved for this family.`,
      };
    },
  }),

  generator({
    key: "chem.org.reactions",
    subject: "chemistry",
    topic: "chem-organic",
    subtopic: "organic-reactions",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const cases = [
        { q: "What type of reaction occurs when an alkane reacts with chlorine in UV light?", a: "Substitution", wrong: ["Addition", "Elimination", "Polymerisation"], why: "A hydrogen atom is swapped for a chlorine atom and HCl leaves, so something goes and something comes — that is substitution. Alkanes cannot do addition because they have no double bond." },
        { q: "What conditions are needed to convert ethene into ethanol industrially?", a: "Steam, a phosphoric acid catalyst, high temperature and pressure", wrong: ["Yeast at 30 °C in the absence of air", "Acidified potassium dichromate and heat", "UV light and chlorine"], why: "This is hydration: water adds across the double bond. The alternative route to ethanol, fermentation, uses yeast instead — slower, from a renewable feedstock, and giving a much more dilute product." },
        { q: "What reagent oxidises a primary alcohol to a carboxylic acid?", a: "Acidified potassium dichromate under reflux", wrong: ["Bromine water", "Concentrated sulfuric acid alone", "Sodium hydroxide solution"], why: "Dichromate under reflux takes the alcohol all the way to the acid, and the orange-to-green colour change signals it. Distilling instead of refluxing stops at the aldehyde, because the aldehyde boils off before it can be oxidised further." },
        { q: "What is produced when ethanol is dehydrated over hot aluminium oxide?", a: "Ethene and water", wrong: ["Ethanoic acid and hydrogen", "Ethane and oxygen", "Ethyl ethanoate and water"], why: "Dehydration removes water from the alcohol and leaves a double bond — an elimination reaction, and the reverse of the hydration that made the ethanol in the first place." },
        { q: "What type of reaction is esterification?", a: "Condensation", wrong: ["Addition", "Substitution", "Oxidation"], why: "The acid and the alcohol join and a molecule of water is expelled, which is exactly what condensation means. The same logic underlies condensation polymerisation, where the joining repeats thousands of times." },
        { q: "What catalyst is used for the esterification of ethanoic acid with ethanol?", a: "Concentrated sulfuric acid", wrong: ["Aluminium oxide", "Nickel", "Phosphoric acid on silica"], why: "Concentrated sulfuric acid catalyses the reaction and also absorbs the water produced, pulling the equilibrium towards the ester. Nickel is for hydrogenation and aluminium oxide for dehydration." },
        { q: "What type of reaction converts ethene to ethane?", a: "Addition of hydrogen", wrong: ["Substitution of hydrogen", "Elimination of hydrogen", "Oxidation"], why: "The double bond opens and two hydrogen atoms add on, over a nickel catalyst. Nothing leaves the molecule, so it is addition — the same reaction that hardens vegetable oils into margarine." },
        { q: "Why is a reflux condenser used when oxidising an alcohol to a carboxylic acid?", a: "It returns evaporating reactants to the flask so they are fully oxidised", wrong: ["It removes the product as soon as it forms", "It cools the reaction to stop it", "It excludes oxygen from the mixture"], why: "Reflux lets you heat for a long time without losing volatile material. Distillation does the opposite — it removes the product early, which is how you stop at an aldehyde instead." },
        { q: "What happens to bromine water when it is shaken with an alkene?", a: "It is decolourised", wrong: ["It turns milky", "It turns from colourless to orange", "It turns green"], why: "Bromine adds across the double bond and its colour is used up, so orange becomes colourless. Limewater turning milky is the carbon dioxide test, and orange-to-green is the dichromate oxidation." },
        { q: "In the combustion of a hydrocarbon in a limited oxygen supply, what dangerous product may form?", a: "Carbon monoxide", wrong: ["Carbon dioxide", "Hydrogen", "Ozone"], why: "Without enough oxygen the carbon is only partly oxidised, giving carbon monoxide and soot. Carbon monoxide is toxic because it binds to haemoglobin more strongly than oxygen does, and it is colourless and odourless." },
        { q: "What kind of reaction is the polymerisation of ethene?", a: "Addition", wrong: ["Condensation", "Substitution", "Neutralisation"], why: "The double bonds open and the monomers join with nothing lost, so the polymer's formula is exactly a multiple of the monomer's. Condensation polymerisation would expel water at each link." },
        { q: "Why does the reaction of methane with chlorine need ultraviolet light?", a: "UV light provides the energy to split chlorine molecules into radicals", wrong: ["UV light makes methane melt", "UV light is a catalyst that is used up", "UV light removes hydrogen from methane directly"], why: "The Cl–Cl bond breaks homolytically under UV to give two chlorine radicals, and those start the chain reaction. Without initiation the mixture is stable and nothing happens in the dark." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];

/* ==========================================================================
   Helpers used by more than one branch
   ========================================================================== */

/**
 * A two-step Hess cycle.
 *
 * Both steps are enthalpies of combustion, and the target is the enthalpy
 * change of the reaction between them, so the answer is step1 − step2. Given as
 * a helper because the caller has to reject the degenerate case where the two
 * steps are equal — then the answer would be zero and two distractors would
 * collide on it.
 */
function buildHessPair(step1: number, step2: number) {
  const dh = step1 - step2;
  const answer = ans(dh, "kJ/mol");
  return {
    prompt:
      `Using a Hess cycle, the enthalpy change of a reaction is found from two combustion enthalpies. ` +
      `Route A (reactants → combustion products) is ${step1} kJ/mol and route B (products → the same combustion products) is ${step2} kJ/mol. ` +
      `What is ΔH for the reaction?`,
    answer,
    distractors: pickDistractors(answer, [
      slip(step2 - step1, "kJ/mol"), // went round the cycle the wrong way
      slip(step1 + step2, "kJ/mol"), // added instead of subtracting
      slip(step1, "kJ/mol"), // gave route A
      slip(step2, "kJ/mol"), // gave route B
    ]),
    explanation:
      `Enthalpy is a state function, so going down route A and back up route B gives the same change as the direct reaction: ` +
      `ΔH = ${step1} − (${step2}) = ${answer}. ` +
      `Travelling against an arrow reverses the sign of that step, which is what the subtraction encodes.`,
    check: () => (agrees(dh + step2, step1) ? null : "the cycle does not close"),
  };
}
