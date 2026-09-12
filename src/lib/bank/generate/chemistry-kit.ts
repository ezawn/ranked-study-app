/**
 * Chemistry helpers.
 *
 * Chemistry's version of the exactness problem is different from physics's.
 * The arithmetic is mostly division by a relative formula mass, and those are
 * fixed by nature — you cannot choose Mr(H₂SO₄) to make the numbers divide.
 * So the discipline here is to choose the MASS, not the answer: pick 0.5 mol
 * and multiply up, rather than picking 37 g and hoping.
 *
 * Everything a question needs about a substance lives in `SPECIES`, computed
 * from `RELATIVE_MASSES` rather than typed. Typing Mr values by hand is how a
 * bank ends up teaching that CaCO₃ is 101 — the formula is the source of truth,
 * and `mrOf` derives the number from it.
 *
 * Relative atomic masses are the values students are given in the data booklet,
 * rounded as boards round them. Chlorine is 35.5 and copper is 63.5, and both
 * are used deliberately: they are where the halves in real answers come from.
 */

import { exact, num } from "./physics-kit";

export { exact, num };

/* ==========================================================================
   The data booklet
   ========================================================================== */

/** Relative atomic masses, as quoted at GCSE and A-Level. */
export const RELATIVE_MASSES: Record<string, number> = {
  H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20,
  Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5, Ar: 40,
  K: 39, Ca: 40, Ti: 48, V: 51, Cr: 52, Mn: 55, Fe: 56, Co: 59, Ni: 59,
  Cu: 63.5, Zn: 65, Br: 80, Ag: 108, I: 127, Ba: 137, Pb: 207,
};

/** Atomic numbers, for electron configuration and isotope questions. */
export const ATOMIC_NUMBERS: Record<string, number> = {
  H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
  Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18,
  K: 19, Ca: 20, Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26, Co: 27, Ni: 28,
  Cu: 29, Zn: 30, Br: 35, Ag: 47, I: 53, Ba: 56, Pb: 82,
};

export const ELEMENT_NAMES: Record<string, string> = {
  H: "hydrogen", He: "helium", Li: "lithium", Be: "beryllium", B: "boron",
  C: "carbon", N: "nitrogen", O: "oxygen", F: "fluorine", Ne: "neon",
  Na: "sodium", Mg: "magnesium", Al: "aluminium", Si: "silicon", P: "phosphorus",
  S: "sulfur", Cl: "chlorine", Ar: "argon", K: "potassium", Ca: "calcium",
  Ti: "titanium", V: "vanadium", Cr: "chromium", Mn: "manganese", Fe: "iron",
  Co: "cobalt", Ni: "nickel", Cu: "copper", Zn: "zinc", Br: "bromine",
  Ag: "silver", I: "iodine", Ba: "barium", Pb: "lead",
};

/** Molar volume of a gas at room temperature and pressure, dm³/mol. */
export const MOLAR_VOLUME = 24;

/** The Avogadro constant, as quoted. */
export const AVOGADRO = 6.02e23;

/* ==========================================================================
   Formulae
   ========================================================================== */

/**
 * Relative formula mass, parsed from the formula rather than typed.
 *
 * Handles nested brackets — Ca(OH)₂, Al₂(SO₄)₃ — because those are exactly the
 * ones students get wrong and therefore exactly the ones worth asking. Formulae
 * are written in plain ASCII here ("Ca(OH)2") and rendered with subscripts by
 * `formula()` when they reach a student.
 */
export function mrOf(formula: string): number {
  let index = 0;

  const parseGroup = (): number => {
    let total = 0;
    while (index < formula.length) {
      const ch = formula[index];

      if (ch === "(") {
        index++;
        const inner = parseGroup();
        const count = readCount();
        total += inner * count;
        continue;
      }
      if (ch === ")") {
        index++;
        return total;
      }

      const symbol = readSymbol();
      if (!symbol) throw new Error(`Cannot parse "${formula}" at ${index}`);
      const mass = RELATIVE_MASSES[symbol];
      if (mass === undefined) throw new Error(`No relative mass for ${symbol}`);
      total += mass * readCount();
    }
    return total;
  };

  const readSymbol = (): string | null => {
    const first = formula[index];
    if (!first || first < "A" || first > "Z") return null;
    index++;
    let symbol = first;
    while (index < formula.length && formula[index] >= "a" && formula[index] <= "z") {
      symbol += formula[index];
      index++;
    }
    return symbol;
  };

  const readCount = (): number => {
    let digits = "";
    while (index < formula.length && formula[index] >= "0" && formula[index] <= "9") {
      digits += formula[index];
      index++;
    }
    return digits === "" ? 1 : Number(digits);
  };

  const result = parseGroup();
  /* Relative masses land on halves at worst, because chlorine and copper are
     the only common half-integers. Anything else means a parsing bug. */
  return exact(result, 1, `Mr(${formula})`);
}

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};

/** "Ca(OH)2" → "Ca(OH)₂". Display only; never parsed back. */
export function formula(text: string): string {
  return text
    .split("")
    .map((ch) => (SUBSCRIPTS[ch] && /[0-9]/.test(ch) ? SUBSCRIPTS[ch] : ch))
    .join("");
}

/* ==========================================================================
   Substances
   ========================================================================== */

export interface Species {
  /** ASCII formula, e.g. "Ca(OH)2". */
  f: string;
  name: string;
  /** Relative formula mass, derived from `f`. */
  mr: number;
  state?: "s" | "l" | "g" | "aq";
}

const species = (f: string, name: string, state?: Species["state"]): Species => ({
  f,
  name,
  mr: mrOf(f),
  state,
});

/** The compounds a GCSE or A-Level question is likely to use. */
export const SPECIES: readonly Species[] = [
  species("H2O", "water", "l"),
  species("CO2", "carbon dioxide", "g"),
  species("NaCl", "sodium chloride", "s"),
  species("CaCO3", "calcium carbonate", "s"),
  species("CaO", "calcium oxide", "s"),
  species("Ca(OH)2", "calcium hydroxide", "s"),
  species("NaOH", "sodium hydroxide", "aq"),
  species("KOH", "potassium hydroxide", "aq"),
  species("HCl", "hydrochloric acid", "aq"),
  species("H2SO4", "sulfuric acid", "aq"),
  species("HNO3", "nitric acid", "aq"),
  species("NH3", "ammonia", "g"),
  species("CH4", "methane", "g"),
  species("MgO", "magnesium oxide", "s"),
  species("MgCl2", "magnesium chloride", "s"),
  species("Fe2O3", "iron(III) oxide", "s"),
  species("Al2O3", "aluminium oxide", "s"),
  species("CuO", "copper(II) oxide", "s"),
  species("CuSO4", "copper(II) sulfate", "s"),
  species("ZnO", "zinc oxide", "s"),
  species("Na2CO3", "sodium carbonate", "s"),
  species("NaHCO3", "sodium hydrogencarbonate", "s"),
  species("KNO3", "potassium nitrate", "s"),
  species("NH4NO3", "ammonium nitrate", "s"),
  species("(NH4)2SO4", "ammonium sulfate", "s"),
  species("Al2(SO4)3", "aluminium sulfate", "s"),
  species("PbBr2", "lead(II) bromide", "s"),
  species("AgNO3", "silver nitrate", "aq"),
  species("BaCl2", "barium chloride", "aq"),
  species("BaSO4", "barium sulfate", "s"),
  species("C2H5OH", "ethanol", "l"),
  species("CH3COOH", "ethanoic acid", "aq"),
  species("C6H12O6", "glucose", "s"),
  species("SO2", "sulfur dioxide", "g"),
  species("NO2", "nitrogen dioxide", "g"),
];

/** The subset whose Mr is a whole number, for questions that must divide. */
export const WHOLE_MR = SPECIES.filter((s) => Number.isInteger(s.mr));

export function speciesByFormula(f: string): Species {
  const found = SPECIES.find((s) => s.f === f);
  if (!found) throw new Error(`No species called ${f}`);
  return found;
}

/* ==========================================================================
   Amounts
   ========================================================================== */

/** Mole amounts that keep masses and volumes tidy. */
export const NICE_MOLES = [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 10];

/** Concentrations in mol/dm³ that divide cleanly against those amounts. */
export const NICE_CONCENTRATIONS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 4, 5];

/** Volumes in cm³ that convert to tidy dm³. */
export const NICE_VOLUMES_CM3 = [10, 20, 25, 40, 50, 100, 125, 200, 250, 400, 500, 1000];
