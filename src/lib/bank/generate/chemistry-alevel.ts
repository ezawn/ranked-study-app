/**
 * Chemistry A-Level: kinetics, acids and buffers, electrochemistry and
 * thermodynamics.
 *
 * Three of these four topics are logarithmic, which is a problem for a bank
 * that refuses calculator questions. The resolution is to keep every
 * concentration a power of ten: pH, pKa and pKw are then whole numbers and the
 * arithmetic is exponent bookkeeping rather than keypad work. That is also how
 * these topics are first taught, so nothing is lost.
 *
 * Electrochemistry and Born-Haber are subtraction problems dressed up, and the
 * mistake worth catching in both is the sign — subtracting the wrong way round,
 * or adding where the arrow reverses. Every lattice enthalpy here is computed
 * by closing the cycle rather than typed, and the `check` hooks close it a
 * second way.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { agrees, answer as ans, cap, exact, num, slip, sup, tidy, wrongOptions } from "./physics-kit";

/* ==========================================================================
   Data
   ========================================================================== */

/** Standard electrode potentials in volts, most negative first. */
const ELECTRODES = [
  { half: "Li⁺ + e⁻ ⇌ Li", metal: "lithium", e: -3.03 },
  { half: "K⁺ + e⁻ ⇌ K", metal: "potassium", e: -2.92 },
  { half: "Ca²⁺ + 2e⁻ ⇌ Ca", metal: "calcium", e: -2.87 },
  { half: "Na⁺ + e⁻ ⇌ Na", metal: "sodium", e: -2.71 },
  { half: "Mg²⁺ + 2e⁻ ⇌ Mg", metal: "magnesium", e: -2.37 },
  { half: "Al³⁺ + 3e⁻ ⇌ Al", metal: "aluminium", e: -1.66 },
  { half: "Zn²⁺ + 2e⁻ ⇌ Zn", metal: "zinc", e: -0.76 },
  { half: "Fe²⁺ + 2e⁻ ⇌ Fe", metal: "iron", e: -0.44 },
  { half: "Ni²⁺ + 2e⁻ ⇌ Ni", metal: "nickel", e: -0.25 },
  { half: "Pb²⁺ + 2e⁻ ⇌ Pb", metal: "lead", e: -0.13 },
  { half: "2H⁺ + 2e⁻ ⇌ H₂", metal: "hydrogen", e: 0.0 },
  { half: "Cu²⁺ + 2e⁻ ⇌ Cu", metal: "copper", e: 0.34 },
  { half: "Ag⁺ + e⁻ ⇌ Ag", metal: "silver", e: 0.8 },
] as const;

/** Standard molar entropies in J/K/mol, quoted to one decimal place. */
const ENTROPIES: Record<string, number> = {
  "H₂(g)": 130.6,
  "O₂(g)": 205.0,
  "N₂(g)": 191.6,
  "H₂O(l)": 69.9,
  "H₂O(g)": 188.7,
  "CO₂(g)": 213.6,
  "C(s)": 5.7,
  "CaCO₃(s)": 92.9,
  "CaO(s)": 39.7,
  "NH₃(g)": 192.3,
  "CH₄(g)": 186.3,
  "NaHCO₃(s)": 102.1,
  "Na₂CO₃(s)": 135.0,
};

interface EntropyReaction {
  equation: string;
  reactants: [string, number][];
  products: [string, number][];
}

const ENTROPY_REACTIONS: readonly EntropyReaction[] = [
  {
    equation: "CaCO₃(s) → CaO(s) + CO₂(g)",
    reactants: [["CaCO₃(s)", 1]],
    products: [["CaO(s)", 1], ["CO₂(g)", 1]],
  },
  {
    equation: "H₂O(l) → H₂O(g)",
    reactants: [["H₂O(l)", 1]],
    products: [["H₂O(g)", 1]],
  },
  {
    equation: "C(s) + O₂(g) → CO₂(g)",
    reactants: [["C(s)", 1], ["O₂(g)", 1]],
    products: [["CO₂(g)", 1]],
  },
  {
    equation: "N₂(g) + 3H₂(g) → 2NH₃(g)",
    reactants: [["N₂(g)", 1], ["H₂(g)", 3]],
    products: [["NH₃(g)", 2]],
  },
  {
    equation: "2H₂(g) + O₂(g) → 2H₂O(l)",
    reactants: [["H₂(g)", 2], ["O₂(g)", 1]],
    products: [["H₂O(l)", 2]],
  },
  {
    equation: "CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)",
    reactants: [["CH₄(g)", 1], ["O₂(g)", 2]],
    products: [["CO₂(g)", 1], ["H₂O(l)", 2]],
  },
  {
    equation: "2NaHCO₃(s) → Na₂CO₃(s) + H₂O(g) + CO₂(g)",
    reactants: [["NaHCO₃(s)", 2]],
    products: [["Na₂CO₃(s)", 1], ["H₂O(g)", 1], ["CO₂(g)", 1]],
  },
];

function entropyTotal(list: readonly [string, number][]): number {
  let total = 0;
  for (const [species, count] of list) {
    const s = ENTROPIES[species];
    if (s === undefined) throw new Error(`No entropy for ${species}`);
    total += s * count;
  }
  return exact(total, 1, "entropy total");
}

/** A Born-Haber cycle, with the lattice enthalpy left to be computed. */
interface BornHaber {
  salt: string;
  metal: string;
  halogen: string;
  formation: number;
  atomiseMetal: number;
  ioniseMetal: number;
  atomiseHalogen: number;
  affinityHalogen: number;
}

const BORN_HABER: readonly BornHaber[] = [
  { salt: "NaCl", metal: "sodium", halogen: "chlorine", formation: -411, atomiseMetal: 107, ioniseMetal: 496, atomiseHalogen: 122, affinityHalogen: -349 },
  { salt: "KCl", metal: "potassium", halogen: "chlorine", formation: -437, atomiseMetal: 89, ioniseMetal: 419, atomiseHalogen: 122, affinityHalogen: -349 },
  { salt: "KBr", metal: "potassium", halogen: "bromine", formation: -394, atomiseMetal: 89, ioniseMetal: 419, atomiseHalogen: 112, affinityHalogen: -325 },
  { salt: "NaBr", metal: "sodium", halogen: "bromine", formation: -361, atomiseMetal: 107, ioniseMetal: 496, atomiseHalogen: 112, affinityHalogen: -325 },
  { salt: "LiCl", metal: "lithium", halogen: "chlorine", formation: -409, atomiseMetal: 159, ioniseMetal: 520, atomiseHalogen: 122, affinityHalogen: -349 },
  { salt: "NaF", metal: "sodium", halogen: "fluorine", formation: -574, atomiseMetal: 107, ioniseMetal: 496, atomiseHalogen: 79, affinityHalogen: -328 },
  { salt: "LiF", metal: "lithium", halogen: "fluorine", formation: -616, atomiseMetal: 159, ioniseMetal: 520, atomiseHalogen: 79, affinityHalogen: -328 },
  { salt: "NaI", metal: "sodium", halogen: "iodine", formation: -288, atomiseMetal: 107, ioniseMetal: 496, atomiseHalogen: 107, affinityHalogen: -295 },
  { salt: "KI", metal: "potassium", halogen: "iodine", formation: -328, atomiseMetal: 89, ioniseMetal: 419, atomiseHalogen: 107, affinityHalogen: -295 },
  { salt: "LiBr", metal: "lithium", halogen: "bromine", formation: -351, atomiseMetal: 159, ioniseMetal: 520, atomiseHalogen: 112, affinityHalogen: -325 },
];

/** The sum of every step in the cycle except the lattice enthalpy. */
function indirectRoute(b: BornHaber): number {
  return b.atomiseMetal + b.ioniseMetal + b.atomiseHalogen + b.affinityHalogen;
}

/**
 * Rate-constant cases, enumerated and filtered.
 *
 * The four distractors here are all derived from the rate, so any parameter set
 * where the rate happens to equal k — [A] = 1 with [B] absent, say — makes three
 * of them identical to the answer. Filtering at module load means the generator
 * cannot be handed such a set.
 */
const RATE_CASES: { k: number; a: number; b: number; m: number; n: number }[] = (() => {
  const out: { k: number; a: number; b: number; m: number; n: number }[] = [];
  for (const k of [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10]) {
    for (const a of [0.1, 0.2, 0.5, 1, 2]) {
      for (const b of [0.1, 0.2, 0.5, 1, 2]) {
        for (const m of [1, 2]) {
          for (const n of [0, 1]) {
            const rate = k * Math.pow(a, m) * Math.pow(b, n);
            const wrong = [
              rate * Math.pow(a, m) * Math.pow(b, n),
              rate / (a * (n === 1 ? b : 1)),
              rate,
              k * 2,
            ];
            if (wrong.some((w) => agrees(w, k))) continue;
            if (new Set(wrong.map((w) => w.toFixed(6))).size < 4) continue;
            /* The rate is quoted in the prompt, so it has to be writable. */
            if (!tidy(rate)) continue;
            out.push({ k, a, b, m, n });
          }
        }
      }
    }
  }
  if (out.length < 40) throw new Error(`Only ${out.length} usable rate-constant cases`);
  return out;
})();

/** Units of the rate constant for a reaction of the given overall order. */
const K_UNITS: Record<number, string> = {
  0: `mol dm${sup(-3)} s${sup(-1)}`,
  1: `s${sup(-1)}`,
  2: `mol${sup(-1)} dm${sup(3)} s${sup(-1)}`,
  3: `mol${sup(-2)} dm${sup(6)} s${sup(-1)}`,
};

/** A power of ten, written the way a student writes a concentration. */
function powerOfTen(exponent: number): string {
  return `1 × 10${sup(exponent)}`;
}

/* ==========================================================================
   The generators
   ========================================================================== */

export const chemistryALevel: Generator[] = [
  /* ------------------------------------------------------------------------
     Kinetics
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.kin.rate-equations",
    subject: "chemistry",
    topic: "chem-kinetics",
    subtopic: "rate-equations",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      const form = rng.int(0, 2);
      const m = rng.int(0, 2);
      /* Capped so the overall order stays within the units table — a fourth
         order rate equation has no entry there, and does not appear at A-Level. */
      const n = rng.int(0, Math.min(2, 3 - m));
      const overall = m + n;

      if (form === 0) {
        const answer = ans(overall);
        return {
          prompt:
            `A reaction has the rate equation rate = k[A]${sup(m)}[B]${sup(n)}. What is the overall order of reaction?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(m * n, ""), // multiplied the orders
            slip(Math.abs(m - n), ""), // subtracted them
            slip(overall + 1, ""), // counted k as an order
            slip(2, ""),
            slip(1, ""),
          ]),
          explanation:
            `The overall order is the sum of the individual orders: ${m} + ${n} = ${answer}. ` +
            `The rate constant k has no order of its own — it carries the units that make the equation balance, which is a different job.`,
          check: () => (agrees(m + n, overall) ? null : "the orders do not sum"),
        };
      }

      if (form === 1) {
        const answer = K_UNITS[overall];
        return {
          prompt:
            `A reaction has the rate equation rate = k[A]${sup(m)}[B]${sup(n)}, with rate in mol dm${sup(-3)} s${sup(-1)} and ` +
            `concentrations in mol dm${sup(-3)}. What are the units of k?`,
          answer,
          distractors: wrongOptions(answer, [
            K_UNITS[(overall + 1) % 4],
            K_UNITS[(overall + 2) % 4],
            K_UNITS[(overall + 3) % 4],
          ]),
          explanation:
            `Rearrange to k = rate ÷ [A]${sup(m)}[B]${sup(n)}. Each concentration on the bottom cancels one mol dm${sup(-3)}, ` +
            `so an overall order of ${overall} leaves ${answer}. Work the units out from the equation every time — they change with the order, which is why they are worth asking about.`,
        };
      }

      const cases = [
        { q: "Why can a rate equation only be found experimentally, not from the balanced equation?", a: "The orders depend on the mechanism, not on the stoichiometry", wrong: ["Balanced equations are often written incorrectly", "The rate equation changes with temperature", "Stoichiometric coefficients are always fractions"], why: "Only the species involved up to and including the rate-determining step appear in the rate equation, and their orders reflect how many are involved in that step. A reactant with a large coefficient can be zero order if it joins after the slow step." },
        { q: "What does it mean for a reaction to be zero order with respect to a reactant?", a: "Changing that reactant's concentration does not change the rate", wrong: ["That reactant is not present", "The reaction does not occur", "That reactant is used up first"], why: "Zero order means the concentration term is raised to the power zero and therefore equals one whatever the concentration. Physically, the reactant is involved only after the rate-determining step, so adding more cannot speed the slow step up." },
        { q: "What is the rate-determining step?", a: "The slowest step in a multi-step mechanism", wrong: ["The first step, always", "The step that releases most energy", "The step with the most reactants"], why: "The overall rate cannot exceed the rate of the slowest step, so that step controls everything. This is why only the species in it, and the ones before it, appear in the rate equation." },
        { q: "If rate = k[A]²[B] and [A] is doubled while [B] is unchanged, what happens to the rate?", a: "It increases by a factor of 4", wrong: ["It doubles", "It increases by a factor of 8", "It is unchanged"], why: "Second order means the rate depends on the square: 2² = 4. Doubling both would multiply the rate by 4 × 2 = 8, which is where the factor-of-8 answer comes from." },
        { q: "In rate = k[A][B], what happens to k when the temperature is increased?", a: "It increases", wrong: ["It decreases", "It stays the same", "It becomes zero"], why: "Concentration terms are unchanged by temperature, so a faster rate at higher temperature must come from k. More particles exceed the activation energy, and the Arrhenius equation quantifies the increase." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.kin.orders",
    subject: "chemistry",
    topic: "chem-kinetics",
    subtopic: "orders-of-reaction",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 48,
    build: (rng) => {
      /* Two experiments differing only in [A]. The rate ratio is the factor
         raised to the order, so the order is readable straight off. */
      const order = rng.int(0, 2);
      const factor = rng.pick([2, 3]);
      const ratio = Math.pow(factor, order);
      const baseRate = rng.pick([0.002, 0.004, 0.005, 0.01, 0.02, 0.05]);
      const newRate = exact(baseRate * ratio, 4, "second rate");
      const conc = rng.pick([0.1, 0.2, 0.5]);
      const words = ["zero", "first", "second"];
      const answer = `${cap(words[order])} order`;

      return {
        prompt:
          `In two experiments, [B] is kept constant. When [A] = ${num(conc)} mol dm${sup(-3)} the rate is ` +
          `${num(baseRate)} mol dm${sup(-3)} s${sup(-1)}; when [A] = ${num(conc * factor)} mol dm${sup(-3)} the rate is ` +
          `${num(newRate)} mol dm${sup(-3)} s${sup(-1)}. What is the order with respect to A?`,
        answer,
        distractors: wrongOptions(answer, [
          `${cap(words[(order + 1) % 3])} order`,
          `${cap(words[(order + 2) % 3])} order`,
          "Third order",
        ]),
        explanation:
          `[A] was multiplied by ${factor} and the rate was multiplied by ${num(ratio)}. ` +
          `Since ${factor}${sup(order)} = ${num(ratio)}, the order is ${order}. ` +
          `${order === 0 ? "No change in rate means zero order — the reactant plays no part in the rate-determining step." : order === 1 ? "The rate changed by the same factor as the concentration, which is first order." : "The rate changed by the square of the factor, which is second order."}`,
        check: () => (agrees(Math.pow(factor, order), newRate / baseRate) ? null : "the rate ratio does not match the order"),
      };
    },
  }),

  generator({
    key: "chem.kin.rate-constant",
    subject: "chemistry",
    topic: "chem-kinetics",
    subtopic: "rate-constant",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 48,
    build: (rng) => {
      /* k chosen first, so the rate is built from it and the division back is
         exact by construction. The cases are enumerated because [A] = [B] = 1
         makes the rate equal to k and collapses three of the four distractors
         onto the answer. */
      const { k, a, b, m, n } = rng.pick(RATE_CASES);
      const rate = exact(k * Math.pow(a, m) * Math.pow(b, n), 6, "rate");
      const overall = m + n;
      const answer = ans(k, K_UNITS[overall]);

      return {
        prompt:
          `A reaction has the rate equation rate = k[A]${sup(m)}${n === 1 ? "[B]" : ""}. ` +
          `When [A] = ${num(a)}${n === 1 ? ` and [B] = ${num(b)}` : ""} mol dm${sup(-3)}, the rate is ` +
          `${num(rate)} mol dm${sup(-3)} s${sup(-1)}. What is the value of k?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(rate * Math.pow(a, m) * Math.pow(b, n), K_UNITS[overall]), // multiplied instead of dividing
          slip(rate / (a * (n === 1 ? b : 1)), K_UNITS[overall]), // ignored the order on A
          slip(rate, K_UNITS[overall]), // gave the rate as k
          slip(k * 2, K_UNITS[overall]),
        ]),
        explanation:
          `Rearranging, k = rate ÷ [A]${sup(m)}${n === 1 ? "[B]" : ""} = ${num(rate)} ÷ ${num(Math.pow(a, m) * Math.pow(b, n))} = ${answer}. ` +
          `Raise the concentration to its order BEFORE dividing — with a second-order term, using [A] rather than [A]² is off by a factor of [A].`,
        check: () => (agrees(k * Math.pow(a, m) * Math.pow(b, n), rate) ? null : "k does not reproduce the rate"),
      };
    },
  }),

  generator({
    key: "chem.kin.arrhenius",
    subject: "chemistry",
    topic: "chem-kinetics",
    subtopic: "arrhenius",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 8,
    build: (rng) => {
      const cases = [
        { q: "In the Arrhenius equation k = Ae^(−Ea/RT), what happens to k as the activation energy increases at fixed temperature?", a: "k decreases", wrong: ["k increases", "k is unchanged", "k becomes negative"], why: "A larger Ea makes the exponent more negative, so the exponential term shrinks and fewer collisions succeed. A rate constant can never be negative — the exponential is always positive." },
        { q: "In k = Ae^(−Ea/RT), what happens to k as temperature increases?", a: "k increases", wrong: ["k decreases", "k is unchanged", "k first rises then falls"], why: "T is on the bottom of the exponent, so raising it makes −Ea/RT less negative and the exponential larger. A greater fraction of molecules now has energy above Ea." },
        { q: "A graph of ln k against 1/T is plotted. What does the gradient equal?", a: "−Ea/R", wrong: ["Ea/R", "−Ea", "ln A"], why: "Taking logs of the Arrhenius equation gives ln k = ln A − (Ea/R)(1/T), which is y = mx + c with 1/T as x. The gradient is therefore −Ea/R, and the intercept is ln A." },
        { q: "On a plot of ln k against 1/T, what does the y-intercept represent?", a: "ln A", wrong: ["A", "Ea/R", "−Ea/R"], why: "Setting 1/T to zero in ln k = ln A − (Ea/R)(1/T) leaves ln k = ln A. To get A itself you must take the exponential of the intercept — reading A straight off the axis is the standard slip." },
        { q: "What does the constant A in the Arrhenius equation represent?", a: "The frequency of collisions with the correct orientation", wrong: ["The activation energy", "The concentration of the reactants", "The absolute temperature"], why: "A is the pre-exponential or frequency factor: it accounts for how often particles collide and whether they are lined up correctly. The exponential term then supplies the fraction of those collisions with enough energy." },
        { q: "Why does a small rise in temperature produce a large increase in reaction rate?", a: "The fraction of molecules with energy above Ea rises steeply, because the distribution's tail is exponential", wrong: ["The molecules become larger", "The activation energy falls with temperature", "The concentration increases with temperature"], why: "Average kinetic energy rises only modestly, but the number of molecules in the high-energy tail rises far faster. Activation energy is a property of the reaction pathway and does not change with temperature — only a catalyst lowers it." },
        { q: "How does a catalyst affect the Arrhenius equation?", a: "It lowers Ea, which increases k", wrong: ["It increases A only", "It raises the temperature term", "It changes the value of R"], why: "A catalyst provides an alternative route with a lower activation energy, so the exponential term grows and k rises at the same temperature. R is a universal constant and cannot be altered by anything in the flask." },
        { q: "What are the units of the activation energy Ea when R is 8.31 J K⁻¹ mol⁻¹?", a: "J/mol", wrong: ["kJ/mol", "J", "J/K"], why: "Ea/RT must be dimensionless, so Ea has to carry the same energy-per-mole units as R × T. Data books usually quote Ea in kJ/mol, so multiplying by 1000 before substituting is a necessary step people forget." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Acids, bases and buffers
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.acid.ph",
    subject: "chemistry",
    topic: "chem-acids",
    subtopic: "ph-calculations",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    /* Six [H⁺] values, six pH values and five [OH⁻] values: seventeen distinct
       questions in total, so fourteen leaves the dedupe room to work. */
    variants: 16,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        const p = rng.int(1, 6);
        const answer = ans(p);
        return {
          prompt:
            `A strong monoprotic acid has [H⁺] = ${powerOfTen(-p)} mol dm${sup(-3)}. What is the pH?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(-p, ""), // forgot the minus in the definition
            slip(14 - p, ""), // gave the pOH
            slip(p + 1, ""),
            slip(p - 1, ""),
          ]),
          explanation:
            `pH = −log₁₀[H⁺]. With [H⁺] = 10${sup(-p)}, the log is −${p} and the pH is ${answer}. ` +
            `The minus sign in the definition is what turns a negative exponent into a positive pH — the pH scale would otherwise run backwards.`,
          check: () => (agrees(Math.pow(10, -p), Math.pow(10, -Number(answer))) ? null : "the pH does not invert to [H⁺]"),
        };
      }

      if (form === 1) {
        const p = rng.int(1, 6);
        const answer = `${powerOfTen(-p)} mol dm${sup(-3)}`;
        return {
          prompt: `A solution has pH ${p}. What is [H⁺]?`,
          answer,
          distractors: wrongOptions(answer, [
            `${powerOfTen(p)} mol dm${sup(-3)}`,
            `${powerOfTen(-(14 - p))} mol dm${sup(-3)}`,
            `${powerOfTen(-(p + 1))} mol dm${sup(-3)}`,
            `${num(p)} mol dm${sup(-3)}`,
          ]),
          explanation:
            `[H⁺] = 10${sup("−pH")}, so pH ${p} gives ${answer}. ` +
            `A positive exponent would mean a concentration above 1 mol dm${sup(-3)} — impossible here, and a quick sanity check on the sign.`,
        };
      }

      /* Strong base: get [H⁺] from Kw, then the pH. */
      const p = rng.int(1, 5);
      const ph = 14 - p;
      const answer = ans(ph);
      return {
        prompt:
          `A strong base has [OH⁻] = ${powerOfTen(-p)} mol dm${sup(-3)}. Given Kw = 1 × 10${sup(-14)} mol² dm${sup(-6)}, what is the pH?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(p, ""), // gave the pOH instead of the pH
          slip(14 + p, ""), // added instead of subtracting
          slip(7, ""), // assumed a base must be at pH 7 plus something
          slip(ph - 1, ""),
        ]),
        explanation:
          `[H⁺] = Kw ÷ [OH⁻] = 10${sup(-14)} ÷ 10${sup(-p)} = 10${sup(-(14 - p))}, so pH = ${answer}. ` +
          `Equivalently pH + pOH = 14, so pH = 14 − ${p}. Going straight from [OH⁻] to a pH without passing through Kw is what produces the pOH as an answer.`,
        check: () => (agrees(Math.pow(10, -ph) * Math.pow(10, -p), 1e-14) ? null : "the ion product is not Kw"),
      };
    },
  }),

  generator({
    key: "chem.acid.strong-weak",
    subject: "chemistry",
    topic: "chem-acids",
    subtopic: "strong-weak-acids",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What distinguishes a strong acid from a weak acid?", a: "A strong acid ionises completely in solution", wrong: ["A strong acid is more concentrated", "A strong acid is more corrosive", "A strong acid contains more hydrogen atoms"], why: "Strength is about the DEGREE of ionisation; concentration is about how much acid is dissolved. A dilute solution of a strong acid and a concentrated solution of a weak acid can easily have the same pH." },
        { q: "Which has the lower pH: 0.1 mol dm⁻³ hydrochloric acid or 0.1 mol dm⁻³ ethanoic acid?", a: "Hydrochloric acid", wrong: ["Ethanoic acid", "They are identical", "It depends on the volume"], why: "Both are the same concentration, but hydrochloric acid ionises fully and ethanoic acid only partially, so hydrochloric acid has far more H⁺ and a lower pH. Volume makes no difference to concentration or pH." },
        { q: "Two acids of the same concentration, one strong and one weak, are titrated with the same alkali. How do the volumes of alkali needed compare?", a: "They are the same", wrong: ["The strong acid needs more", "The weak acid needs more", "The weak acid needs none"], why: "Titration measures the total moles of acid available, and the weak acid keeps ionising as its H⁺ is removed. Equal concentrations and volumes therefore need equal alkali — only the pH curve shape and the end point pH differ." },
        { q: "Why is the pH at the equivalence point of a weak acid–strong base titration above 7?", a: "The salt formed is that of a weak acid, and it hydrolyses to give a slightly alkaline solution", wrong: ["Excess alkali has been added", "The indicator changes colour late", "Water is alkaline at that point"], why: "At equivalence you have a solution of the salt, and the anion of a weak acid is a base — it takes H⁺ from water and leaves OH⁻ behind. This is why phenolphthalein is the correct indicator for this titration and methyl orange is not." },
        { q: "What is meant by a monoprotic acid?", a: "It donates one proton per molecule", wrong: ["It contains one hydrogen atom in total", "It has a pH of 1", "It reacts with one type of base only"], why: "Monoprotic means one ionisable hydrogen. Ethanoic acid, CH₃COOH, has four hydrogens but only the one in the –COOH group is released, so it is monoprotic." },
        { q: "For 0.1 mol dm⁻³ sulfuric acid, why is [H⁺] not simply 0.1 mol dm⁻³?", a: "Sulfuric acid is diprotic, so it can release two protons per molecule", wrong: ["It is a weak acid", "It reacts with water", "Its formula mass is too large"], why: "The first ionisation is complete and the second substantial, so [H⁺] is close to twice the acid concentration. Treating a diprotic acid as monoprotic understates [H⁺] and overstates the pH." },
        { q: "Does diluting a strong acid tenfold always raise its pH by exactly 1?", a: "Approximately, until the concentration approaches that of water's own ions", wrong: ["Yes, always, without exception", "No, pH never changes on dilution", "No, the pH falls by 1"], why: "Each tenfold dilution divides [H⁺] by ten, which adds 1 to the pH. Very dilute acids break the pattern because water's own ionisation contributes appreciably, and the pH can never exceed 7 no matter how much you dilute." },
        { q: "What is the conjugate base of ethanoic acid, CH₃COOH?", a: "CH₃COO⁻", wrong: ["CH₃COOH₂⁺", "CH₃CH₂OH", "OH⁻"], why: "A conjugate base is what remains after the acid donates its proton, so remove one H⁺ and the negative charge stays behind. Every acid–base reaction involves two such pairs." },
        { q: "Which statement about a concentrated weak acid is correct?", a: "It contains a large amount of acid, most of which is not ionised", wrong: ["It ionises completely because it is concentrated", "It has a lower pH than any strong acid", "It cannot be neutralised"], why: "Concentration and strength are independent properties. A concentrated weak acid has plenty of acid molecules present, but only a small fraction of them have released their proton at any instant." },
        { q: "Why does a weak acid resist a change in pH when a little alkali is added?", a: "Undissociated acid molecules ionise to replace the H⁺ removed", wrong: ["The alkali is neutralised by water", "Weak acids do not react with alkalis", "The pH scale is logarithmic"], why: "A reservoir of unionised acid is available to top the H⁺ back up, which is exactly the buffering effect. A strong acid has no such reservoir — every molecule has already ionised." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.acid.buffers",
    subject: "chemistry",
    topic: "chem-acids",
    subtopic: "buffers",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 12,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        /* Equal concentrations of acid and salt, so pH = pKa exactly and no
           logarithm beyond a power of ten is needed. */
        const pka = rng.int(3, 6);
        const answer = ans(pka);
        return {
          prompt:
            `A buffer contains equal concentrations of a weak acid HA (Ka = ${powerOfTen(-pka)} mol dm${sup(-3)}) and its salt NaA. What is the pH?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(14 - pka, ""), // gave the pOH
            slip(7, ""), // assumed a buffer must be neutral
            slip(pka + 1, ""),
            slip(pka - 1, ""),
          ]),
          explanation:
            `pH = pKa + log([A⁻]/[HA]). With equal concentrations the ratio is 1 and its log is 0, so pH = pKa = ${answer}. ` +
            `Notice the pH does not depend on how concentrated the buffer is, only on the RATIO — which is why diluting a buffer barely changes its pH.`,
          check: () => (agrees(Math.pow(10, -pka), Math.pow(10, -Number(answer))) ? null : "pH and pKa disagree"),
        };
      }

      const cases = [
        { q: "What two components make an acidic buffer?", a: "A weak acid and its salt", wrong: ["A strong acid and its salt", "A weak acid and a strong base", "A weak acid and water"], why: "The weak acid supplies H⁺ when alkali is added, and the salt supplies the conjugate base that mops up added acid. A strong acid cannot work — it is already fully ionised, so it has no reservoir." },
        { q: "What happens in a buffer when a small amount of acid is added?", a: "The conjugate base A⁻ reacts with the added H⁺", wrong: ["The weak acid ionises further", "The water evaporates", "Nothing happens at all"], why: "A⁻ + H⁺ → HA removes the added protons, so [H⁺] barely changes. Adding alkali does the mirror image: HA ionises to replace the H⁺ that the OH⁻ removed." },
        { q: "Why does diluting a buffer have little effect on its pH?", a: "Both components are diluted equally, so their ratio is unchanged", wrong: ["The buffer produces more acid on dilution", "Water is a buffer itself", "Dilution removes the salt"], why: "pH depends on the RATIO [A⁻]/[HA], and dilution divides both by the same factor. What does fall is the buffer capacity — a dilute buffer is overwhelmed by a smaller addition of acid or alkali." },
        { q: "Which mixture would act as a buffer?", a: "Ethanoic acid and sodium ethanoate", wrong: ["Hydrochloric acid and sodium chloride", "Sodium hydroxide and sodium chloride", "Ethanoic acid and hydrochloric acid"], why: "You need a weak acid alongside its conjugate base. Hydrochloric acid and its salt fail because HCl is fully ionised and Cl⁻ is far too weak a base to accept a proton back." },
        { q: "What is the biological importance of the carbonic acid–hydrogencarbonate buffer?", a: "It keeps blood pH close to 7.4", wrong: ["It transports oxygen", "It neutralises stomach acid", "It regulates body temperature"], why: "Enzymes denature outside a narrow pH range, so blood pH must stay near 7.4 despite the acids that metabolism constantly produces. The H₂CO₃/HCO₃⁻ pair absorbs those changes." },
        { q: "A buffer is made from a weak acid and its salt. If the salt concentration is increased, what happens to the pH?", a: "It rises", wrong: ["It falls", "It is unchanged", "It falls to 7"], why: "More conjugate base raises the ratio [A⁻]/[HA], and the log of a ratio above 1 is positive, so the pH goes up. This is exactly how a buffer is tuned to a target pH near the pKa." },
        { q: "Why must the pKa of the chosen acid be close to the target pH of a buffer?", a: "The buffer works best when the acid and base concentrations are similar", wrong: ["The acid dissolves only near its pKa", "A buffer cannot work above pH 7", "The salt is insoluble otherwise"], why: "pH = pKa + log(ratio), so a target far from the pKa forces an extreme ratio, leaving one component in short supply and the buffer easily exhausted on that side." },
        { q: "What is buffer capacity?", a: "The amount of acid or alkali a buffer can absorb before its pH changes significantly", wrong: ["The volume of the buffer solution", "The pH range of the buffer", "The rate at which the buffer reacts"], why: "Capacity depends on how many moles of each component are present, so a concentrated buffer resists larger additions than a dilute one at the same pH. It is a separate property from the pH itself." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.acid.ka-kw",
    subject: "chemistry",
    topic: "chem-acids",
    subtopic: "ka-kw",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 18,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        /* Ka from [H+] and the acid concentration, both powers of ten, so Ka is
           a power of ten too and no calculator is needed. */
        const h = rng.int(2, 4); // [H+] = 10^-h
        const conc = rng.int(0, 2); // [HA] = 10^-conc
        const kaExp = conc - 2 * h;
        const answer = `${powerOfTen(kaExp)} mol dm${sup(-3)}`;
        return {
          prompt:
            `A weak monoprotic acid of concentration ${powerOfTen(-conc)} mol dm${sup(-3)} has [H⁺] = ${powerOfTen(-h)} mol dm${sup(-3)}. ` +
            `What is Ka?`,
          answer,
          distractors: wrongOptions(answer, [
            `${powerOfTen(conc - h)} mol dm${sup(-3)}`,
            `${powerOfTen(2 * h - conc)} mol dm${sup(-3)}`,
            `${powerOfTen(-h)} mol dm${sup(-3)}`,
            `${powerOfTen(kaExp + 1)} mol dm${sup(-3)}`,
          ]),
          explanation:
            `Ka = [H⁺][A⁻] ÷ [HA], and for a weak acid [A⁻] = [H⁺], so Ka = [H⁺]² ÷ [HA] = ` +
            `(10${sup(-h)})² ÷ 10${sup(-conc)} = ${answer}. ` +
            `Squaring the numerator is what most answers miss — [H⁺] appears twice in the expression, once as itself and once as [A⁻].`,
          check: () =>
            agrees(Math.pow(10, -h) * Math.pow(10, -h) / Math.pow(10, -conc), Math.pow(10, kaExp))
              ? null
              : "the exponent arithmetic does not match the expression",
        };
      }

      if (form === 1) {
        const pka = rng.int(3, 6);
        const answer = ans(pka);
        return {
          prompt: `A weak acid has Ka = ${powerOfTen(-pka)} mol dm${sup(-3)}. What is its pKa?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(-pka, ""), // dropped the minus in the definition
            slip(14 - pka, ""), // confused pKa with pKw arithmetic
            slip(pka * 2, ""),
            slip(pka + 1, ""),
          ]),
          explanation:
            `pKa = −log₁₀Ka, and log₁₀(10${sup(-pka)}) = −${pka}, so pKa = ${answer}. ` +
            `A SMALLER Ka means a weaker acid and a LARGER pKa — the minus sign reverses the ordering, which is the point of the p-scale.`,
        };
      }

      const cases = [
        { q: "What is the expression for Kw?", a: "Kw = [H⁺][OH⁻]", wrong: ["Kw = [H⁺]/[OH⁻]", "Kw = [H⁺] + [OH⁻]", "Kw = [H₂O]/[H⁺][OH⁻]"], why: "Water's ionisation constant is the product of the two ion concentrations. [H₂O] does not appear because it is effectively constant and has been absorbed into the value of Kw." },
        { q: "What is the value of Kw at 298 K?", a: "1 × 10⁻¹⁴ mol² dm⁻⁶", wrong: ["1 × 10⁻⁷ mol² dm⁻⁶", "1 × 10⁻¹⁴ mol dm⁻³", "14 mol² dm⁻⁶"], why: "In pure water [H⁺] = [OH⁻] = 10⁻⁷, so their product is 10⁻¹⁴. The units are squared because two concentration terms are multiplied — quoting mol dm⁻³ is a common slip." },
        { q: "Kw increases as temperature rises. What does this tell you about the ionisation of water?", a: "It is endothermic", wrong: ["It is exothermic", "It is unaffected by temperature", "It stops above 298 K"], why: "Raising the temperature shifts an equilibrium towards the endothermic direction, so if more ions form on heating, forming them must take energy in. It also means the pH of neutral water falls below 7 above 298 K — while still being neutral." },
        { q: "Why does a larger Ka mean a stronger acid?", a: "It means a greater proportion of the acid has ionised at equilibrium", wrong: ["It means the acid is more concentrated", "It means the acid has more hydrogen atoms", "It means the acid reacts faster"], why: "Ka is the equilibrium constant for the ionisation, so a large value puts the position of equilibrium far to the right. Strength is a thermodynamic property and says nothing about how fast the acid reacts." },
        { q: "In deriving Ka for a weak acid, why is [H⁺] assumed equal to [A⁻]?", a: "Both come from the same ionisation, in a 1:1 ratio", wrong: ["Water supplies equal amounts of both", "The acid is fully ionised", "They are always equal in any solution"], why: "Each HA that ionises gives one H⁺ and one A⁻. The approximation ignores the tiny contribution of water's own ionisation, which is safe unless the acid is extremely weak or extremely dilute." },
        { q: "What second approximation is made when calculating the pH of a weak acid from Ka?", a: "That the concentration of unionised acid equals the initial concentration", wrong: ["That the acid is fully ionised", "That water contributes most of the H⁺", "That Ka equals Kw"], why: "Only a small fraction ionises, so subtracting the ionised amount from the initial concentration changes it very little. The approximation breaks down for acids that are not particularly weak, where a significant fraction has ionised." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Electrochemistry
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.electro.potentials",
    subject: "chemistry",
    topic: "chem-electro",
    subtopic: "electrode-potentials",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 48,
    build: (rng) => {
      const [i, j] = rng.distinct(2, 0, ELECTRODES.length - 1);
      const lower = ELECTRODES[Math.min(i, j)];
      const upper = ELECTRODES[Math.max(i, j)];
      const emf = exact(upper.e - lower.e, 2, "cell emf");
      const form = rng.int(0, 1);

      if (form === 0) {
        const answer = ans(emf, "V");
        return {
          prompt:
            `A cell is made from the half-cells ${lower.half} (E° = ${num(lower.e)} V) and ${upper.half} (E° = ${num(upper.e)} V). ` +
            `What is the standard cell potential?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(lower.e - upper.e, "V"), // subtracted the wrong way round
            slip(lower.e + upper.e, "V"), // added the two
            slip(upper.e, "V"), // gave one electrode potential
            slip(lower.e, "V"),
          ]),
          explanation:
            `E°cell = E°(reduced half-cell) − E°(oxidised half-cell) = ${num(upper.e)} − (${num(lower.e)}) = ${answer}. ` +
            `Take the more positive value first and a standard cell potential always comes out positive — a negative answer means the two were subtracted the wrong way round.`,
          check: () => (emf > 0 ? null : `a cell potential of ${emf} V cannot be right for these half-cells`),
        };
      }

      const answer = upper.metal === "hydrogen" ? "The hydrogen electrode" : `The ${upper.metal} half-cell`;
      return {
        prompt:
          `A cell is made from ${lower.half} (E° = ${num(lower.e)} V) and ${upper.half} (E° = ${num(upper.e)} V). ` +
          `Which half-cell is reduced when the cell operates?`,
        answer,
        distractors: wrongOptions(answer, [
          lower.metal === "hydrogen" ? "The hydrogen electrode" : `The ${lower.metal} half-cell`,
          "Both are reduced simultaneously",
          "Neither — no reaction occurs",
        ]),
        explanation:
          `The half-cell with the MORE POSITIVE electrode potential is reduced, so ${answer.toLowerCase()} gains electrons ` +
          `and the ${lower.metal} half-cell is oxidised. The electrons flow through the wire from the more negative electrode to the more positive one.`,
        check: () => (upper.e > lower.e ? null : "the electrodes are the wrong way round"),
      };
    },
  }),

  generator({
    key: "chem.electro.cells",
    subject: "chemistry",
    topic: "chem-electro",
    subtopic: "cells",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "In an electrochemical cell, which electrode is the negative one?", a: "The one with the more negative electrode potential, where oxidation occurs", wrong: ["The one where reduction occurs", "The one made of the less reactive metal", "The one connected to the salt bridge"], why: "The more reactive metal loses electrons more readily, so electrons pile up there and make it negative. Oxidation and the negative terminal always go together in a cell that is generating a current." },
        { q: "What is the purpose of a salt bridge?", a: "To complete the circuit by allowing ions to flow between the half-cells", wrong: ["To allow electrons to flow between the half-cells", "To mix the two solutions", "To prevent any current flowing"], why: "Electrons travel through the external wire; the circuit is only complete if charge can also move through the solutions. Ions, not electrons, carry that charge — which is why a wire dipped between the beakers would not do the job." },
        { q: "What are the standard conditions for measuring an electrode potential?", a: "298 K, 100 kPa and 1 mol dm⁻³ solutions", wrong: ["273 K, 100 kPa and 1 mol dm⁻³ solutions", "298 K, 1 kPa and 0.1 mol dm⁻³ solutions", "Any temperature with 1 mol dm⁻³ solutions"], why: "Electrode potentials shift with concentration and temperature, so a quoted value is meaningless without fixing both. The reference is the standard hydrogen electrode under the same conditions, defined as exactly 0.00 V." },
        { q: "Why is the standard hydrogen electrode assigned a potential of exactly 0.00 V?", a: "It is an arbitrary reference point against which all others are measured", wrong: ["Hydrogen has no electrons to transfer", "It genuinely produces no voltage", "Hydrogen is the lightest element"], why: "Only differences in potential can be measured, never an absolute value for a single electrode. Fixing one electrode at zero makes every other value a measurable difference from it." },
        { q: "In which direction do electrons flow in the external circuit of a cell?", a: "From the more negative electrode to the more positive one", wrong: ["From the more positive electrode to the more negative one", "In both directions equally", "Through the salt bridge"], why: "Electrons leave the electrode where oxidation happens, which is the more negative one, and travel to the electrode being reduced. Conventional current is drawn the other way, which is a frequent source of confusion." },
        { q: "What happens to the mass of the negative electrode as a cell discharges?", a: "It decreases as the metal is oxidised into solution", wrong: ["It increases as metal is deposited", "It stays the same", "It increases then decreases"], why: "Oxidation converts solid metal atoms into aqueous ions, so the electrode dissolves away. The positive electrode gains mass as ions are reduced onto it — the two changes mirror each other." },
        { q: "How does a fuel cell differ from a conventional cell?", a: "Reactants are supplied continuously from outside, so it does not run down", wrong: ["It produces no voltage", "It cannot be used to power a vehicle", "It requires no electrodes"], why: "A hydrogen fuel cell keeps working as long as hydrogen and oxygen are fed in, whereas a battery contains a fixed amount of reactant. Its only product is water, though making the hydrogen in the first place may not be clean." },
        { q: "Why is a high-resistance voltmeter used to measure a cell potential?", a: "It draws almost no current, so the cell stays at equilibrium", wrong: ["It gives a larger reading", "It protects the voltmeter from damage", "It speeds up the reaction"], why: "Drawing current shifts the half-cell equilibria and lowers the measured voltage below the true e.m.f. High resistance keeps the current negligible so the reading is the standard value." },
        { q: "What does a cell potential of 0.00 V between two half-cells indicate?", a: "The two half-cells have equal electrode potentials, so there is no tendency to react", wrong: ["The cell is broken", "One half-cell is missing", "The reaction is extremely fast"], why: "Cell potential measures the difference between the two electrodes' tendencies to be reduced. Equal tendencies mean no net driving force in either direction — the system is already at equilibrium." },
        { q: "In cell notation, which side is conventionally written on the right?", a: "The half-cell being reduced, the more positive one", wrong: ["The half-cell being oxidised", "The more reactive metal", "Whichever is written first alphabetically"], why: "The convention puts reduction on the right so that E°cell = E°(right) − E°(left) gives a positive value for a spontaneous cell. Reversing the notation reverses the sign of the answer." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.electro.feasibility",
    subject: "chemistry",
    topic: "chem-electro",
    subtopic: "feasibility",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const [i, j] = rng.distinct(2, 0, ELECTRODES.length - 1);
        const oxidised = ELECTRODES[Math.min(i, j)];
        const reduced = ELECTRODES[Math.max(i, j)];
        /* Ask the question in the order that makes it feasible half the time. */
        const asFeasible = rng.bool();
        const first = asFeasible ? reduced : oxidised;
        const second = asFeasible ? oxidised : reduced;
        const emf = exact(first.e - second.e, 2, "cell emf");
        const answer = emf > 0 ? "Yes — the cell potential is positive" : "No — the cell potential is negative";

        return {
          prompt:
            `Is the reduction of the ${first.metal} half-cell (E° = ${num(first.e)} V) by the ${second.metal} half-cell ` +
            `(E° = ${num(second.e)} V) feasible under standard conditions?`,
          answer,
          distractors: wrongOptions(answer, [
            emf > 0 ? "No — the cell potential is negative" : "Yes — the cell potential is positive",
            "Yes, but only above 298 K",
            "It cannot be decided from electrode potentials",
          ]),
          explanation:
            `E°cell = ${num(first.e)} − (${num(second.e)}) = ${num(emf)} V. ` +
            `A positive cell potential means the reaction is feasible; a negative one means it goes the other way. ` +
            `Feasible is not the same as fast — a positive E° says nothing about the rate, and a reaction with a large activation energy may not happen at all in practice.`,
          check: () => ((emf > 0) === answer.startsWith("Yes") ? null : "the sign and the verdict disagree"),
        };
      }

      const cases = [
        { q: "What does a positive standard cell potential tell you?", a: "The reaction is thermodynamically feasible under standard conditions", wrong: ["The reaction will happen quickly", "The reaction is exothermic", "The reaction goes to completion"], why: "Feasibility and rate are separate questions. A reaction with a large positive E° can still be immeasurably slow if its activation energy is high — diamond turning into graphite is the classic example." },
        { q: "Why might a reaction with a positive E°cell still not be observed?", a: "Its activation energy may be too high for it to proceed at a measurable rate", wrong: ["Electrode potentials are unreliable", "It requires a salt bridge", "Positive potentials indicate an impossible reaction"], why: "Thermodynamics says which direction is downhill; kinetics decides whether anything moves. A high activation energy barrier can lock a feasible reaction in place indefinitely." },
        { q: "How do non-standard concentrations affect the feasibility predicted by E°?", a: "They shift the electrode potentials, so a marginal reaction may reverse", wrong: ["They have no effect", "They always make the reaction feasible", "They change the activation energy"], why: "Standard values assume 1 mol dm⁻³. Changing a concentration shifts that half-cell's equilibrium and hence its potential, so a cell potential close to zero can change sign — which is why marginal predictions should be treated cautiously." },
        { q: "A reaction has E°cell = −0.45 V. What can you conclude?", a: "The reverse reaction is feasible under standard conditions", wrong: ["No reaction is possible in either direction", "The forward reaction is feasible but slow", "The reaction is at equilibrium"], why: "A negative value for one direction is a positive value of the same size for the other. So the reaction as written will not go, but its reverse will." },
        { q: "Why can electrode potentials predict whether a metal will displace another from solution?", a: "Displacement is a redox reaction, and E° values rank how readily each is reduced", wrong: ["Electrode potentials measure solubility", "Displacement depends only on density", "Electrode potentials measure reaction rates"], why: "The metal with the more negative electrode potential is oxidised more readily and pushes the other out of solution. This is the reactivity series with numbers attached, and the numbers let you handle pairs you have never seen." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  /* ------------------------------------------------------------------------
     Thermodynamics
     ------------------------------------------------------------------------ */

  generator({
    key: "chem.thermo.lattice",
    subject: "chemistry",
    topic: "chem-thermo",
    subtopic: "lattice-enthalpy",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    variants: 10,
    build: (rng) => {
      const cases = [
        { q: "What is the lattice enthalpy of formation?", a: "The enthalpy change when 1 mol of an ionic solid forms from its gaseous ions", wrong: ["The enthalpy change when 1 mol of an ionic solid dissolves", "The energy needed to melt 1 mol of an ionic solid", "The enthalpy change when 1 mol of a solid forms from its elements"], why: "Gaseous ions coming together to form a lattice releases a large amount of energy, so this value is always strongly negative. Defining it the other way round — lattice enthalpy of dissociation — gives the same number with the opposite sign, so always check which convention a question uses." },
        { q: "How does lattice enthalpy change as the ionic radius increases?", a: "It becomes less negative", wrong: ["It becomes more negative", "It is unaffected", "It becomes positive"], why: "Larger ions cannot approach as closely, so the electrostatic attraction between their centres is weaker and less energy is released. This is why lattice enthalpies get smaller in magnitude down a group." },
        { q: "How does lattice enthalpy change as ionic charge increases?", a: "It becomes more negative", wrong: ["It becomes less negative", "It is unaffected", "It becomes zero"], why: "Attraction is proportional to the product of the charges, so a 2+ ion attracts far more strongly than a 1+ ion at the same distance. MgO has a much larger lattice enthalpy than NaCl for exactly this reason, and a much higher melting point as a result." },
        { q: "Why do experimental and theoretical lattice enthalpies differ for silver iodide?", a: "The bonding has significant covalent character, which the purely ionic model ignores", wrong: ["The experiment is inaccurate", "Silver iodide does not form a lattice", "The theoretical model assumes covalent bonding"], why: "The theoretical value assumes perfect spheres of charge. A large, polarisable anion next to a small, highly polarising cation has its electron cloud distorted towards the cation, adding covalent character and making the real lattice stronger than predicted." },
        { q: "Which compound has the most negative lattice enthalpy?", a: "MgO", wrong: ["NaCl", "KCl", "KBr"], why: "MgO pairs 2+ with 2−, so the charge product is four times that of any 1+/1− salt, and both ions are small. Charge dominates, and small size reinforces it." },
        { q: "What is the enthalpy change of hydration?", a: "The enthalpy change when 1 mol of gaseous ions dissolves in water to give aqueous ions", wrong: ["The enthalpy change when water is added to a solid", "The energy needed to evaporate water from a solution", "The enthalpy change when a solid dissolves"], why: "Water molecules surround and attract the ion, releasing energy, so hydration enthalpies are negative. Combined with lattice enthalpy in a cycle, they give the enthalpy of solution — which is why some salts dissolve endothermically and others exothermically." },
        { q: "How does the enthalpy of hydration change with ionic charge density?", a: "It becomes more negative as charge density increases", wrong: ["It becomes less negative as charge density increases", "It is independent of charge density", "It becomes positive for small ions"], why: "A small, highly charged ion attracts the polar water molecules strongly, so more energy is released on hydration. The same size and charge arguments that govern lattice enthalpy govern hydration too." },
        { q: "Which two quantities are combined to find the enthalpy of solution?", a: "Lattice enthalpy of dissociation and the enthalpies of hydration of the ions", wrong: ["Lattice enthalpy and bond enthalpies", "Ionisation energy and electron affinity", "Enthalpy of formation and entropy"], why: "Breaking the lattice into gaseous ions costs energy, hydrating those ions releases it, and the enthalpy of solution is the sum. When the two nearly cancel, small differences decide whether dissolving warms or cools the solution." },
        { q: "Why is the lattice enthalpy of NaCl more negative than that of NaBr?", a: "The chloride ion is smaller, so the ions are closer together", wrong: ["Chlorine is more reactive than bromine", "Bromide has a higher charge", "NaBr is covalent"], why: "Both salts have the same charges, so only size differs. The smaller chloride allows a closer approach and a stronger electrostatic attraction, releasing more energy on lattice formation." },
        { q: "Are lattice enthalpies of formation measured directly?", a: "No — they are calculated from a Born-Haber cycle", wrong: ["Yes, by calorimetry", "Yes, by titration", "No — they cannot be found at all"], why: "You cannot get a mole of isolated gaseous ions into a calorimeter and watch them condense into a lattice. Hess's law lets you assemble the value from steps that can be measured." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.thermo.born-haber",
    subject: "chemistry",
    topic: "chem-thermo",
    subtopic: "born-haber",
    curriculumLevel: "YEAR_13",
    difficulty: 9,
    variants: 10,
    build: (rng) => {
      const b = rng.pick(BORN_HABER);
      const indirect = indirectRoute(b);
      const lattice = exact(b.formation - indirect, 0, "lattice enthalpy");
      const answer = ans(lattice, "kJ/mol");

      return {
        prompt:
          `A Born-Haber cycle for ${b.salt} has: enthalpy of formation ${b.formation}, atomisation of ${b.metal} +${b.atomiseMetal}, ` +
          `first ionisation energy of ${b.metal} +${b.ioniseMetal}, atomisation of ${b.halogen} +${b.atomiseHalogen}, ` +
          `first electron affinity of ${b.halogen} ${b.affinityHalogen} (all kJ/mol). What is the lattice enthalpy of formation?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(indirect - b.formation, "kJ/mol"), // went round the cycle the wrong way
          slip(b.formation + indirect, "kJ/mol"), // added instead of subtracting
          slip(indirect, "kJ/mol"), // gave the sum of the other steps
          slip(b.formation, "kJ/mol"), // gave the enthalpy of formation
        ]),
        explanation:
          `The two routes from elements to solid must give the same total, so ΔHf = (atomisation + ionisation + atomisation + electron affinity) + lattice enthalpy. ` +
          `The steps other than the lattice enthalpy sum to ${indirect}, so lattice enthalpy = ${b.formation} − (${indirect}) = ${answer}. ` +
          `The electron affinity is already negative, so it is ADDED as a negative number — subtracting it is the commonest error in this cycle.`,
        check: () => (agrees(indirect + lattice, b.formation) ? null : "the Born-Haber cycle does not close"),
      };
    },
  }),

  generator({
    key: "chem.thermo.entropy",
    subject: "chemistry",
    topic: "chem-thermo",
    subtopic: "entropy",
    curriculumLevel: "YEAR_13",
    difficulty: 8,
    /* Seven reactions and six written cases. */
    variants: 12,
    build: (rng) => {
      const form = rng.int(0, 1);

      if (form === 0) {
        const r = rng.pick(ENTROPY_REACTIONS);
        const before = entropyTotal(r.reactants);
        const after = entropyTotal(r.products);
        const ds = exact(after - before, 1, "entropy change");
        const answer = ans(ds, "J/K/mol");
        const table = [...new Set([...r.reactants, ...r.products].map(([s]) => s))]
          .map((s) => `S°(${s}) = ${num(ENTROPIES[s])}`)
          .join(", ");

        return {
          prompt:
            `For the reaction ${r.equation}, standard entropies in J/K/mol are: ${table}. What is ΔS for the reaction?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(before - after, "J/K/mol"), // reactants minus products
            slip(before + after, "J/K/mol"), // added the totals
            slip(after, "J/K/mol"), // gave the products' entropy
            slip(before, "J/K/mol"),
          ]),
          explanation:
            `ΔS = ΣS(products) − ΣS(reactants) = ${num(after)} − ${num(before)} = ${answer}. ` +
            `Multiply each entropy by its balancing number before adding — a coefficient of 2 or 3 counts twice or three times. ` +
            `The sign is a sanity check: ${ds > 0 ? "this reaction produces more gas or more disorder, so a positive ΔS is expected" : "this reaction produces less gas or more order, so a negative ΔS is expected"}.`,
          check: () => (agrees(before + ds, after) ? null : "the entropy totals do not reconcile"),
        };
      }

      const cases = [
        { q: "What does entropy measure?", a: "The number of ways the energy and particles of a system can be arranged", wrong: ["The total energy of a system", "The temperature of a system", "The rate of a reaction"], why: "Entropy counts arrangements, which is why it rises with disorder. A gas has vastly more arrangements available than a solid at the same temperature, so gases have much higher entropies." },
        { q: "Which state of a substance has the highest entropy?", a: "Gas", wrong: ["Solid", "Liquid", "They are all equal"], why: "Gas particles move freely through a large volume, so the number of arrangements available to them dwarfs that of a liquid or a fixed lattice. Counting moles of gas on each side of an equation is the quickest way to predict the sign of an entropy change." },
        { q: "What is the sign of ΔS when a solid dissolves in water?", a: "Usually positive", wrong: ["Always negative", "Always zero", "Always positive without exception"], why: "An ordered lattice becomes freely moving ions, which increases disorder. It is only usually positive because strongly hydrating ions can order the surrounding water enough to reverse the sign." },
        { q: "What is the entropy of a perfect crystal at 0 K?", a: "Zero", wrong: ["Infinite", "Equal to its enthalpy", "Undefined"], why: "At absolute zero a perfect crystal has exactly one possible arrangement, so there is nothing to count and the entropy is zero. This is the third law, and it is why absolute entropies can be quoted rather than only changes." },
        { q: "For the reaction 2H₂(g) + O₂(g) → 2H₂O(l), what is the sign of ΔS?", a: "Negative", wrong: ["Positive", "Zero", "It cannot be predicted"], why: "Three moles of gas become two moles of liquid, so both the amount of gas and the freedom of the particles fall sharply. Counting moles of gas on each side predicts the sign of ΔS more reliably than anything else." },
        { q: "Why does a reaction that produces a gas from a solid usually have a positive ΔS?", a: "Gas particles have far more available arrangements than particles in a solid", wrong: ["Gases are hotter than solids", "Gases have more mass", "Solids have no entropy"], why: "Moving from a fixed lattice to free movement through a large volume multiplies the number of possible arrangements enormously. This is why thermal decompositions become feasible at high temperature despite being endothermic." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),

  generator({
    key: "chem.thermo.gibbs",
    subject: "chemistry",
    topic: "chem-thermo",
    subtopic: "gibbs-free-energy",
    curriculumLevel: "YEAR_13",
    difficulty: 9,
    variants: 48,
    build: (rng) => {
      const form = rng.int(0, 2);

      if (form === 0) {
        /* ΔG = ΔH − TΔS, with ΔS in J/K/mol and ΔH in kJ/mol. The pair is
           chosen so TΔS/1000 lands on two decimal places. */
        const dh = rng.pick([-180, -120, -80, -50, 50, 90, 120, 178, 200]);
        const ds = rng.pick([-200, -160, -120, -80, 80, 120, 160, 200, 250]);
        const t = rng.pick([200, 250, 300, 400, 500, 600, 800, 1000]);
        const tds = exact((t * ds) / 1000, 2, "TΔS");
        const dg = exact(dh - tds, 2, "ΔG");
        const answer = ans(dg, "kJ/mol");

        return {
          prompt:
            `A reaction has ΔH = ${dh} kJ/mol and ΔS = ${ds} J/K/mol. What is ΔG at ${t} K?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(dh - t * ds, "kJ/mol"), // forgot to convert ΔS from J to kJ
            slip(dh + tds, "kJ/mol"), // added instead of subtracting
            slip(tds - dh, "kJ/mol"), // subtracted the wrong way round
            slip(dh, "kJ/mol"), // gave ΔH
          ]),
          explanation:
            `ΔG = ΔH − TΔS. Convert ΔS to kJ first: ${ds} J/K/mol = ${num(ds / 1000)} kJ/K/mol. ` +
            `Then TΔS = ${t} × ${num(ds / 1000)} = ${num(tds)} kJ/mol, and ΔG = ${dh} − (${num(tds)}) = ${answer}. ` +
            `Mixing the units is the single most common error here — ΔH is in kJ and ΔS in J, and they must be made to match before subtracting.`,
          check: () => (agrees(dh - tds, dg) ? null : "ΔG does not reproduce from ΔH and TΔS"),
        };
      }

      if (form === 1) {
        /* The temperature at which a reaction becomes feasible: ΔG = 0. */
        const t = rng.pick([200, 250, 400, 500, 800, 1000, 1200]);
        const ds = rng.pick([100, 120, 160, 200, 250]);
        const dh = exact((t * ds) / 1000, 2, "ΔH at the crossover");
        const answer = ans(t, "K");

        return {
          prompt:
            `An endothermic reaction has ΔH = +${num(dh)} kJ/mol and ΔS = +${ds} J/K/mol. ` +
            `Above what temperature does it become feasible?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(dh / ds, "K"), // forgot the J-to-kJ conversion
            slip(dh * ds, "K"), // multiplied instead of dividing
            slip((ds * 1000) / dh, "K"), // inverted the fraction
            slip(t / 2, "K"),
          ]),
          explanation:
            `A reaction is feasible when ΔG ≤ 0, so the crossover is at ΔH = TΔS, giving T = ΔH ÷ ΔS. ` +
            `With ΔS converted to kJ: T = ${num(dh)} ÷ ${num(ds / 1000)} = ${answer}. ` +
            `Because both ΔH and ΔS are positive, raising the temperature makes TΔS win eventually — which is exactly why thermal decompositions need heating.`,
          check: () => (agrees((t * ds) / 1000, dh) ? null : "the crossover temperature does not satisfy ΔH = TΔS"),
        };
      }

      const cases = [
        { q: "What condition on ΔG makes a reaction feasible?", a: "ΔG must be zero or negative", wrong: ["ΔG must be positive", "ΔG must be greater than ΔH", "ΔG must equal TΔS exactly"], why: "A negative ΔG means the reaction is thermodynamically downhill. ΔG = 0 is the balance point, and it is the temperature at which feasibility switches on or off." },
        { q: "A reaction has ΔH negative and ΔS positive. When is it feasible?", a: "At all temperatures", wrong: ["Only at high temperatures", "Only at low temperatures", "Never"], why: "ΔG = ΔH − TΔS: a negative first term minus a positive quantity is negative whatever T is. This is the only combination that is feasible everywhere." },
        { q: "A reaction has ΔH positive and ΔS negative. When is it feasible?", a: "Never", wrong: ["At all temperatures", "Only at high temperatures", "Only at low temperatures"], why: "A positive first term minus a negative quantity gives a positive ΔG at every temperature. Heating makes it worse, not better — the reverse reaction is the feasible one." },
        { q: "A reaction has ΔH positive and ΔS positive. When is it feasible?", a: "At high temperatures", wrong: ["At low temperatures", "At all temperatures", "Never"], why: "TΔS grows with temperature until it overtakes ΔH and makes ΔG negative. Thermal decomposition of limestone is the standard example, which is why the kiln has to be hot." },
        { q: "Why is a reaction with a negative ΔG sometimes not observed?", a: "The activation energy may be too high for a measurable rate", wrong: ["ΔG values are unreliable", "It means the reaction has already happened", "Negative ΔG means the reverse reaction occurs"], why: "ΔG answers whether, not how fast. Kinetics and thermodynamics are separate questions, and a large activation energy can stall a strongly feasible reaction indefinitely." },
        { q: "In ΔG = ΔH − TΔS, what units must T be in?", a: "Kelvin", wrong: ["Degrees Celsius", "Joules", "It does not matter"], why: "The relationship is only linear in absolute temperature, so a Celsius value has to be converted by adding 273. Using Celsius gives a wildly wrong TΔS and, near room temperature, sometimes the wrong sign entirely." },
      ];
      const c = rng.pick(cases);
      return { prompt: c.q, answer: c.a, distractors: wrongOptions(c.a, c.wrong), explanation: c.why };
    },
  }),
];
