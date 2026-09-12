/**
 * Physics: electricity, and magnetism.
 *
 * Electricity is the topic where a generator most easily produces something no
 * examiner would set. `V = IR` with I = 7 A and R = 13 Ω is a perfectly good
 * physics question and a perfectly useless battle question, because 91 is fine
 * but `1/7 + 1/13` is not, and the moment two resistors go in parallel the
 * arithmetic stops being doable in the head. So this file is built the other
 * way round from how the physics is taught: THE ANSWER IS CHOSEN FIRST and the
 * parameters are constructed to produce it.
 *
 * Three devices do that work.
 *
 *  1. `answerQty` writes every answer, and throws unless the number lands on a
 *     non-calculator grid — one decimal place, two below 1, or a standard-form
 *     mantissa to one decimal. A generator whose arithmetic did not come out
 *     therefore fails at build time, in the test harness, rather than shipping
 *     a keypad answer to a student with two minutes on the clock.
 *  2. The parameter TABLES below are precomputed at module load by brute force
 *     and filtered through that same grid. `PARALLEL_PAIRS` holds every pair of
 *     resistors whose parallel combination is tidy; `RESISTIVITY_CASES` holds
 *     every ρ, L and A whose R is tidy. A generator picks a row and cannot pick
 *     a bad one, which is both safer and far more varied than the usual trick
 *     of hard-coding "3 Ω and 6 Ω" forever.
 *  3. Every generator carries a `check` that re-derives its answer through
 *     DIFFERENT physics. Power is verified three ways (VI, I²R, V²/R); a series
 *     chain is verified by Kirchhoff's voltage law rather than by re-adding the
 *     resistances; a parallel combination is verified by making the branch
 *     currents sum; the motor effect is verified through the work done sweeping
 *     out flux; a circular path is verified against the centripetal condition.
 *     A generator that agrees with itself proves nothing, so none of these
 *     repeats the arithmetic the build did.
 *
 * Content is the common core of AQA, OCR and Edexcel: conventional current,
 * ideal transformers unless the question says otherwise, ε = I(R + r), and
 * constants quoted in the prompt rather than assumed, because a student who
 * used a different value for e is not wrong.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  CONSTANTS,
  exact,
  exactDiv,
  num,
  qty,
  sf,
  sup,
  toStandardForm,
  wrongOptions,
} from "./physics-kit";

/* ==========================================================================
   Writing a quantity down
   ========================================================================== */

/**
 * A quantity as a student would write it, and a build-time guarantee that they
 * could have got there without a calculator.
 *
 * Electricity spans twenty orders of magnitude — 2 × 10⁻⁷ Ω m and 240 V are
 * both ordinary answers — so this drops into standard form at the extremes and
 * stays plain in the middle. Either way `exact` decides whether the number is
 * publishable: a mantissa to one decimal, a plain value to one, or two below 1
 * because 0.25 A and 0.04 Wb are things people write down. Anything else
 * throws here, which is the point.
 */
function answerQty(value: number, unit = ""): string {
  const size = Math.abs(value);
  /* Standard form below 0.1, not 0.01. A flux of 0.025 Wb written out has
     three decimal places, which the bank audit reads as a keypad answer; as
     2.5 × 10⁻² Wb it is the same number and obviously mental. */
  if (size !== 0 && (size < 0.1 || size >= 1e5)) {
    const { mantissa, exponent } = toStandardForm(value);
    return sf(exact(mantissa, 2, "mantissa"), exponent, unit);
  }
  /* Two decimal places everywhere, which is the same line the bank audit draws:
     three or more is the signature of an answer that came off a keypad, and
     0.5² × 15 = 3.75 W is not that. One place was stricter than the rule it was
     enforcing, and it rejected perfectly mental arithmetic. */
  return qty(exact(value, 2, "value"), unit);
}

/** Would `answerQty` accept this number? The filter every table is built with. */
function tidy(value: number): boolean {
  if (!Number.isFinite(value) || value === 0) return false;
  try {
    answerQty(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * The same shape, for a WRONG answer.
 *
 * A distractor is allowed to be untidy — untidiness is often exactly what a
 * dropped factor of 10⁶ looks like — so this rounds where `answerQty` throws.
 * It rounds onto the same grid, so a mistake that happens to land on the right
 * answer produces the identical string and is dropped by `pickDistractors`
 * rather than appearing as a second correct option.
 */
function wrongQty(value: number, unit = ""): string | null {
  if (!Number.isFinite(value)) return null;
  if (value === 0) return qty(0, unit);
  const size = Math.abs(value);
  if (size < 0.01 || size >= 1e5) {
    const { mantissa, exponent } = toStandardForm(value);
    return sf(Number(mantissa.toFixed(2)), exponent, unit);
  }
  return qty(Number(value.toPrecision(size < 1 ? 3 : 4)), unit);
}

/** Sentence-case a context phrase that is otherwise written to sit mid-sentence. */
function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function divisorsOf(n: number): number[] {
  const out: number[] = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d !== 0) continue;
    out.push(d);
    if (d !== n / d) out.push(n / d);
  }
  return out.sort((a, b) => a - b);
}

/** How close two floats have to be before the arithmetic counts as agreeing. */
function agrees(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/* ==========================================================================
   Context, so two hundred questions do not all happen to a resistor
   ========================================================================== */

/**
 * Ohmic components only.
 *
 * A filament lamp is the standard example of a component that does NOT obey
 * Ohm's law, so it must never appear in a question that assumes a constant
 * resistance — that is a physics error, not a wording preference.
 */
const OHMIC = [
  "a fixed resistor",
  "a carbon film resistor",
  "a length of nichrome wire",
  "a heating element",
  "a coil of copper wire at constant temperature",
  "a wire-wound resistor",
  "a thick-film resistor",
  "a metal wire held at constant temperature",
] as const;

const APPLIANCES = [
  "a torch bulb",
  "a car headlamp",
  "an electric kettle",
  "a phone charger",
  "a doorbell",
  "a laptop cooling fan",
  "an LED strip light",
  "a soldering iron",
  "a small electric motor",
  "a hair dryer",
  "a portable radio",
  "the starter motor of a car",
  "an immersion heater",
  "a vacuum cleaner",
] as const;

const WIRES = [
  "a length of resistance wire",
  "a sample of a conducting alloy",
  "a strip of conducting film",
  "a metal rod",
  "a length of cable core",
  "a thin metal filament",
] as const;

const COILS = [
  "a 200-turn search coil",
  "a solenoid connected to a sensitive ammeter",
  "a coil of wire connected to a galvanometer",
  "a closed loop of copper wire",
  "a coil wound on a cardboard tube",
] as const;

/* ==========================================================================
   Parameter tables
   --------------------------------------------------------------------------
   Built once, by brute force, and filtered through `tidy`. A generator that
   picks a row from one of these cannot pick parameters whose answer needs a
   calculator, which is a stronger guarantee than a retry loop and gives far
   more variety than a hand-written list of the four pairs everyone uses.
   ========================================================================== */

/**
 * Resistor pairs whose parallel combination is a tidy number.
 *
 * Constructed rather than searched: if the combination is to be p, then writing
 * one resistor as p + d forces the other to be p + p²/d, so every divisor d of
 * p² gives an exact pair. p = 4 yields (5, 20), (6, 12) and (8, 8) — the pairs
 * a textbook uses — plus the rest of the family for free.
 */
const PARALLEL_PAIRS: readonly { a: number; b: number; p: number }[] = (() => {
  const out: { a: number; b: number; p: number }[] = [];
  for (const p of [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60]) {
    for (const d of divisorsOf(p * p)) {
      const a = p + d;
      const b = p + (p * p) / d;
      if (a > b) continue; // one ordering per pair; the generator swaps them
      if (b > 1500) continue; // keep both values on a resistor you could buy
      out.push({ a, b, p });
    }
  }
  return out;
})();

/**
 * A supply across two parallel branches, with whole-number branch currents.
 *
 * Both resistances divide the supply pd, so the branch currents and their total
 * are whole numbers and the combined resistance still comes out tidy.
 */
const PARALLEL_BRANCHES: readonly {
  v: number;
  a: number;
  b: number;
  i1: number;
  i2: number;
  total: number;
  rp: number;
}[] = (() => {
  const out: { v: number; a: number; b: number; i1: number; i2: number; total: number; rp: number }[] = [];
  for (const v of [6, 9, 12, 18, 20, 24, 30, 36, 40, 48, 60, 72, 100, 120]) {
    const branches = divisorsOf(v).filter((d) => d >= 2 && d <= 120);
    for (const a of branches) {
      for (const b of branches) {
        if (a > b) continue;
        const i1 = v / a;
        const i2 = v / b;
        const total = i1 + i2;
        const rp = v / total;
        if (!tidy(rp) || total > 40) continue;
        out.push({ v, a, b, i1, i2, total, rp });
      }
    }
  }
  return out;
})();

/** Supply pd and resistance pairs where P = V²/R is a whole number. */
const V_SQUARED_OVER_R: readonly { v: number; r: number; p: number }[] = (() => {
  const out: { v: number; r: number; p: number }[] = [];
  for (const v of [6, 8, 10, 12, 15, 20, 24, 30, 40, 50, 60, 100, 120, 240]) {
    for (const r of divisorsOf(v * v)) {
      const p = (v * v) / r;
      if (r < 2 || r > 1200) continue;
      if (p < 1 || p > 4000) continue;
      /* Every other table filters on `tidy`; this one did not, and 15 V across
         60 Ω duly produced 3.75 W — a two-decimal answer where `answerQty`
         allows one. The guard is the point: it threw at build time rather than
         shipping a keypad answer. */
      if (!tidy(p)) continue;
      /* The explanation quotes the current as a cross-check, so V/R has to be
         tidy too — 60 V across 180 Ω is 0.333... A and reads as a mistake. */
      if (!tidy(v / r)) continue;
      out.push({ v, r, p });
    }
  }
  return out;
})();

/** Currents and resistances where P = I²R is tidy. */
const I_SQUARED_R: readonly { i: number; r: number; p: number }[] = (() => {
  const out: { i: number; r: number; p: number }[] = [];
  const currents = [0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];
  const resistances = [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500];
  for (const i of currents) {
    for (const r of resistances) {
      const p = i * i * r;
      if (p > 15000 || !tidy(p)) continue;
      out.push({ i, r, p });
    }
  }
  return out;
})();

/** Power and time pairs whose energy is tidy, in joules. */
const POWER_TIME: readonly { p: number; t: number; e: number }[] = (() => {
  const out: { p: number; t: number; e: number }[] = [];
  const powers = [5, 10, 15, 20, 25, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 2400, 3000];
  const times = [5, 10, 15, 20, 30, 40, 45, 50, 60, 90, 100, 120, 150, 180, 200, 240, 300, 360, 450, 600, 900, 1200, 1800];
  for (const p of powers) {
    for (const t of times) {
      const e = p * t;
      if (!tidy(e)) continue;
      out.push({ p, t, e });
    }
  }
  return out;
})();

/**
 * Resistivity cases: ρ, L and A whose resistance is tidy.
 *
 * The mantissas are kept whole so that ρ, A and R can each be written in
 * standard form with a mantissa a student would accept — and so that whichever
 * of the four quantities the question hides, the answer is still clean.
 */
const RESISTIVITY_CASES: readonly {
  rhoM: number;
  rhoE: number;
  areaM: number;
  areaE: number;
  length: number;
  r: number;
}[] = (() => {
  const out: { rhoM: number; rhoE: number; areaM: number; areaE: number; length: number; r: number }[] = [];
  for (const rhoM of [1, 2, 4, 5, 8]) {
    for (const rhoE of [-8, -7, -6, -5]) {
      for (const areaM of [1, 2, 4, 5, 8]) {
        for (const areaE of [-8, -7, -6]) {
          for (const length of [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]) {
            const mantissa = (rhoM * length) / areaM;
            if (!Number.isInteger(mantissa)) continue;
            const r = mantissa * Math.pow(10, rhoE - areaE);
            if (r < 0.05 || r > 2000 || !tidy(r)) continue;
            out.push({ rhoM, rhoE, areaM, areaE, length, r });
          }
        }
      }
    }
  }
  return out;
})();

/** Ideal transformers with tidy secondary pds, both step-up and step-down. */
const TRANSFORMERS: readonly {
  np: number;
  ns: number;
  vp: number;
  vs: number;
  ratio: number;
  stepUp: boolean;
}[] = (() => {
  const out: { np: number; ns: number; vp: number; vs: number; ratio: number; stepUp: boolean }[] = [];
  const primaries = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2400];
  const ratios = [2, 3, 4, 5, 6, 8, 10, 12, 20];
  const supplies = [6, 9, 12, 20, 24, 30, 50, 60, 100, 120, 230, 240];
  for (const np of primaries) {
    for (const ratio of ratios) {
      for (const vp of supplies) {
        const ns = np * ratio;
        if (ns <= 30000) out.push({ np, ns, vp, vs: vp * ratio, ratio, stepUp: true });
        if (np % ratio === 0 && tidy(vp / ratio)) {
          out.push({ np, ns: np / ratio, vp, vs: vp / ratio, ratio, stepUp: false });
        }
      }
    }
  }
  return out;
})();

/** Flux density, length and current combinations where F = BIL is tidy. */
const MOTOR_CASES: readonly { b: number; i: number; lengthCm: number; l: number; f: number }[] = (() => {
  const out: { b: number; i: number; lengthCm: number; l: number; f: number }[] = [];
  for (const b of [0.02, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]) {
    for (const i of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12]) {
      for (const lengthCm of [2, 4, 5, 8, 10, 15, 20, 25, 40, 50, 80, 100, 150, 200]) {
        const l = lengthCm / 100;
        const f = b * i * l;
        if (f < 1e-3 || f > 100 || !tidy(f)) continue;
        out.push({ b, i, lengthCm, l, f });
      }
    }
  }
  return out;
})();

/** Charged-particle cases where F = BQv is tidy in standard form. */
const BQV_CASES: readonly { b: number; qm: number; qe: number; vm: number; ve: number; f: number }[] = (() => {
  const out: { b: number; qm: number; qe: number; vm: number; ve: number; f: number }[] = [];
  for (const b of [0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]) {
    for (const qm of [1.6, 3.2]) {
      for (const vm of [1, 2, 3, 4, 5, 6, 8]) {
        for (const ve of [4, 5, 6, 7]) {
          const f = b * qm * 1e-19 * vm * Math.pow(10, ve);
          if (!tidy(f)) continue;
          out.push({ b, qm, qe: -19, vm, ve, f });
        }
      }
    }
  }
  return out;
})();

/** Circular-path cases where r = mv/BQ is tidy. */
const RADIUS_CASES: readonly {
  massM: number;
  massE: number;
  vm: number;
  ve: number;
  b: number;
  qm: number;
  r: number;
}[] = (() => {
  const out: { massM: number; massE: number; vm: number; ve: number; b: number; qm: number; r: number }[] = [];
  for (const massM of [1, 1.6, 2, 3.2, 4, 5, 6.4, 8]) {
    for (const massE of [-27, -26, -25]) {
      for (const vm of [1, 2, 3, 4, 5, 6, 8]) {
        for (const ve of [4, 5, 6]) {
          for (const b of [0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.5, 2]) {
            for (const qm of [1.6, 3.2]) {
              const mass = massM * Math.pow(10, massE);
              const v = vm * Math.pow(10, ve);
              const r = (mass * v) / (b * qm * 1e-19);
              if (r < 5e-3 || r > 20 || !tidy(r)) continue;
              out.push({ massM, massE, vm, ve, b, qm, r });
            }
          }
        }
      }
    }
  }
  return out;
})();

/** Coils and fields whose flux and flux linkage are both tidy. */
const FLUX_CASES: readonly { b: number; areaCm: number; area: number; turns: number; flux: number; linkage: number }[] =
  (() => {
    const out: { b: number; areaCm: number; area: number; turns: number; flux: number; linkage: number }[] = [];
    for (const b of [0.02, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2]) {
      for (const areaCm of [2, 4, 5, 8, 10, 12, 15, 20, 25, 40, 50, 80, 100, 150, 200]) {
        const area = areaCm * 1e-4;
        const flux = b * area;
        if (!tidy(flux)) continue;
        for (const turns of [20, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000]) {
          const linkage = turns * flux;
          if (!tidy(linkage)) continue;
          out.push({ b, areaCm, area, turns, flux, linkage });
        }
      }
    }
    return out;
  })();

/** Flux-linkage changes collapsing in a time, with a tidy induced emf. */
const FARADAY_CASES: readonly {
  b: number;
  areaCm: number;
  area: number;
  turns: number;
  linkage: number;
  dt: number;
  emf: number;
}[] = (() => {
  const out: { b: number; areaCm: number; area: number; turns: number; linkage: number; dt: number; emf: number }[] = [];
  for (const row of FLUX_CASES) {
    for (const dt of [0.02, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 1, 2, 2.5, 4, 5]) {
      const emf = row.linkage / dt;
      if (emf < 0.01 || emf > 500 || !tidy(emf)) continue;
      out.push({ b: row.b, areaCm: row.areaCm, area: row.area, turns: row.turns, linkage: row.linkage, dt, emf });
    }
  }
  return out;
})();

/** A rod cutting field lines: ε = BLv, kept tidy. */
const MOTIONAL_CASES: readonly { b: number; lengthCm: number; l: number; v: number; emf: number }[] = (() => {
  const out: { b: number; lengthCm: number; l: number; v: number; emf: number }[] = [];
  for (const b of [0.02, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2]) {
    for (const lengthCm of [10, 15, 20, 25, 40, 50, 60, 80, 100, 150, 200, 250]) {
      for (const v of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20]) {
        const l = lengthCm / 100;
        const emf = b * l * v;
        if (emf < 0.005 || emf > 50 || !tidy(emf)) continue;
        out.push({ b, lengthCm, l, v, emf });
      }
    }
  }
  return out;
})();

/** Cells on load: ε = I(R + r), with the terminal pd and lost volts both tidy. */
const CELL_CASES: readonly { emf: number; i: number; r: number; rInt: number; terminal: number; lost: number }[] =
  (() => {
    const out: { emf: number; i: number; r: number; rInt: number; terminal: number; lost: number }[] = [];
    for (const i of [0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) {
      for (const r of [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24, 30, 40, 50]) {
        for (const rInt of [0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]) {
          const lost = i * rInt;
          const terminal = i * r;
          const emf = terminal + lost;
          if (emf > 60) continue;
          if (!tidy(lost) || !tidy(terminal) || !tidy(emf)) continue;
          out.push({ emf, i, r, rInt, terminal, lost });
        }
      }
    }
    return out;
  })();

/* ==========================================================================
   Directions, for the questions a hand rule answers
   ========================================================================== */

type Vec = readonly [number, number, number];

const COMPASS: readonly { name: string; v: Vec }[] = [
  { name: "due north", v: [0, 1, 0] },
  { name: "due south", v: [0, -1, 0] },
  { name: "due east", v: [1, 0, 0] },
  { name: "due west", v: [-1, 0, 0] },
  { name: "vertically upwards", v: [0, 0, 1] },
  { name: "vertically downwards", v: [0, 0, -1] },
];

function cross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function negate(a: Vec): Vec {
  return [-a[0], -a[1], -a[2]];
}

function nameOf(v: Vec): string {
  const found = COMPASS.find((d) => d.v[0] === v[0] && d.v[1] === v[1] && d.v[2] === v[2]);
  if (!found) throw new Error(`no compass name for ${v.join(",")}`);
  return found.name;
}

function opposite(name: string): string {
  const found = COMPASS.find((d) => d.name === name);
  if (!found) throw new Error(`no compass direction called ${name}`);
  return nameOf(negate(found.v));
}

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsElectricity: Generator[] = [
  /* ------------------------------------------------------------------------
     Charge and current
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.charge.flow",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "charge-current",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 15,
    build: (rng) => {
      /* Currents to one decimal place and whole-second times, so Q = It can
         never land off the grid however the two are combined. */
      const current = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12]);
      const inMinutes = rng.bool(0.4);
      const minutes = rng.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30]);
      const seconds = inMinutes
        ? minutes * 60
        : rng.pick([5, 10, 12, 15, 20, 24, 25, 30, 36, 40, 45, 50, 60, 75, 80, 90, 100, 120, 150, 180, 200, 240, 300]);

      const charge = exact(current * seconds, 1, "charge");
      const timeText = inMinutes ? `${minutes} minute${minutes === 1 ? "" : "s"}` : `${seconds} s`;
      const device = rng.pick(APPLIANCES);
      const answer = answerQty(charge, "C");

      return {
        prompt: rng.bool()
          ? `A current of ${num(current)} A flows through ${device} for ${timeText}. Calculate the charge transferred.`
          : `${cap(device)} carries a steady current of ${num(current)} A for ${timeText}. What charge passes through it?`,
        answer,
        distractors: pickDistractors(answer, [
          /* Minutes read straight into Q = It without converting to seconds. */
          inMinutes ? wrongQty(current * minutes, "C") : wrongQty(current * seconds * 60, "C"),
          /* Converted a time that was already in seconds "into minutes". */
          inMinutes ? wrongQty(current * seconds * 60, "C") : wrongQty((current * seconds) / 60, "C"),
          wrongQty(current + seconds, "C"), // added the two quantities
          wrongQty(seconds / current, "C"), // divided instead of multiplying
          wrongQty(charge * 10, "C"), // decimal slip
        ]),
        explanation:
          `Q = It, with the time in seconds: ${inMinutes ? `${minutes} min = ${seconds} s, so ` : ""}` +
          `Q = ${num(current)} × ${seconds} = ${answer}. ` +
          `One amp is one coulomb per second, so ${num(current)} C arrive every second for ${seconds} s.`,
        check: () => {
          /* Current is charge per second by definition, so accumulating the
             charge one second at a time has to reach the same total the
             multiplication did — a different route to the same number. */
          let accumulated = 0;
          for (let t = 0; t < seconds; t++) accumulated += current;
          return agrees(accumulated, charge)
            ? null
            : `${num(current)} A for ${seconds} s accumulates ${accumulated} C, not ${charge} C`;
        },
      };
    },
  }),

  generator({
    key: "phy.elec.charge.rearranged",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "charge-current",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 15,
    build: (rng) => {
      const mode = rng.pick(["current", "time", "electrons"] as const);

      if (mode === "electrons") {
        /* Q = ne with e = 1.6 × 10⁻¹⁹ C. Choosing n as a whole mantissa times a
           power of ten makes the given charge a one-decimal number and the
           answer a clean standard-form count. */
        const countM = rng.int(1, 9);
        const countE = rng.pick([18, 19, 20, 21]);
        const charge = exact(countM * 1.6 * Math.pow(10, countE - 19), 2, "charge");
        const answer = sf(countM, countE, "electrons");
        const conductor = rng.pick(WIRES);

        return {
          prompt:
            `A charge of ${answerQty(charge, "C")} passes through ${conductor}. ` +
            `How many electrons is that? (charge on an electron = ${sf(1.6, -19, "C")})`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(charge * CONSTANTS.e, "electrons"), // multiplied by e instead of dividing
            sf(countM, -countE, "electrons"), // sign slip on the index
            sf(countM, countE + 1, "electrons"), // lost a power of ten in the division
            wrongQty(CONSTANTS.e / charge, "electrons"), // inverted the fraction
          ]),
          explanation:
            `Each electron carries ${sf(1.6, -19, "C")}, so n = Q ÷ e = ` +
            `${answerQty(charge, "C")} ÷ ${sf(1.6, -19, "C")} = ${answer}. ` +
            `Dividing by a number smaller than one makes the count enormous, which is the sense check.`,
          check: () => {
            /* Multiply the published count back by the quoted electron charge
               and the original charge has to reappear. */
            const rebuilt = countM * Math.pow(10, countE) * CONSTANTS.e;
            return agrees(rebuilt, charge) ? null : `${answer} carries ${rebuilt} C, not ${charge} C`;
          },
        };
      }

      const current = rng.pick([0.1, 0.2, 0.4, 0.5, 0.8, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]);
      const seconds = rng.pick([4, 5, 8, 10, 15, 20, 24, 25, 30, 40, 45, 50, 60, 90, 120, 150, 180, 240, 300, 600]);
      const charge = exact(current * seconds, 1, "charge");
      const device = rng.pick(APPLIANCES);

      if (mode === "current") {
        const answer = answerQty(exactDiv(charge, seconds, 2), "A");
        return {
          prompt:
            `${answerQty(charge, "C")} of charge passes through ${device} in ${seconds} s. ` +
            `What is the current in it?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(seconds / charge, "A"), // divided the wrong way round
            wrongQty(charge * seconds, "A"), // multiplied instead of dividing
            wrongQty(charge - seconds, "A"), // subtracted
            wrongQty(current * 10, "A"), // decimal slip
          ]),
          explanation:
            `I = Q ÷ t = ${answerQty(charge, "C")} ÷ ${seconds} s = ${answer}. ` +
            `Current is the rate of flow of charge, so the charge is divided by the time, never multiplied by it.`,
          check: () => {
            /* Run the published current for the stated time, one second at a
               time, and the quoted charge must come back. */
            let accumulated = 0;
            for (let t = 0; t < seconds; t++) accumulated += current;
            return agrees(accumulated, charge) ? null : `${answer} for ${seconds} s gives ${accumulated} C`;
          },
        };
      }

      const answer = answerQty(exactDiv(charge, current, 1), "s");
      return {
        prompt:
          `A steady current of ${num(current)} A in ${device} transfers ${answerQty(charge, "C")} of charge. ` +
          `How long does this take?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(current / charge, "s"), // inverted the fraction
          wrongQty(charge * current, "s"), // multiplied instead of dividing
          wrongQty(charge - current, "s"), // subtracted
          wrongQty(seconds / 60, "s"), // answered in minutes but labelled seconds
        ]),
        explanation:
          `t = Q ÷ I = ${answerQty(charge, "C")} ÷ ${num(current)} A = ${answer}. ` +
          `Check it forwards: ${num(current)} C every second for ${seconds} s is ${answerQty(charge, "C")}.`,
        check: () => {
          let accumulated = 0;
          for (let t = 0; t < seconds; t++) accumulated += current;
          return agrees(accumulated, charge) ? null : `${seconds} s at ${num(current)} A gives ${accumulated} C`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Ohm's law
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.ohms.pd",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "ohms-law",
    curriculumLevel: "YEAR_10",
    difficulty: 2,
    variants: 15,
    build: (rng) => {
      const current = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6]);
      const resistance = rng.pick([4, 5, 6, 8, 10, 12, 15, 18, 20, 24, 25, 30, 40, 45, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300]);
      const pd = exact(current * resistance, 1, "pd");
      const component = rng.pick(OHMIC);
      const answer = answerQty(pd, "V");

      return {
        prompt: rng.bool()
          ? `The current in ${component} of resistance ${resistance} Ω is ${num(current)} A. ` +
            `Calculate the potential difference across it.`
          : `${cap(component)} has a resistance of ${resistance} Ω and carries a current of ${num(current)} A. ` +
            `What is the potential difference across it?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(resistance / current, "V"), // divided instead of multiplying
          wrongQty(current / resistance, "V"), // divided the other way
          wrongQty(current + resistance, "V"), // added the two quantities
          wrongQty(pd * 10, "V"), // decimal slip
        ]),
        explanation:
          `V = IR = ${num(current)} × ${resistance} = ${answer}. ` +
          `Each ohm needs ${num(current)} V per amp of current, so ${resistance} Ω at ${num(current)} A needs ${answer}.`,
        check: () => {
          /* Verified through power rather than by re-multiplying: VI and I²R are
             the same watts only if V really is IR. */
          const viaVI = pd * current;
          const viaI2R = current * current * resistance;
          return agrees(viaVI, viaI2R)
            ? null
            : `VI = ${viaVI} W but I²R = ${viaI2R} W, so ${answer} is not the pd across ${resistance} Ω`;
        },
      };
    },
  }),

  generator({
    key: "phy.elec.ohms.rearranged",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "ohms-law",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    variants: 15,
    build: (rng) => {
      const current = rng.pick([0.1, 0.2, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8]);
      const resistance = rng.pick([3, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 36, 40, 50, 60, 75, 80, 100, 120, 150, 200, 240, 300, 400, 500]);
      const pd = exact(current * resistance, 1, "pd");
      const findCurrent = rng.bool();
      const component = rng.pick(OHMIC);

      const answer = findCurrent
        ? answerQty(exactDiv(pd, resistance, 2), "A")
        : answerQty(exactDiv(pd, current, 1), "Ω");

      return {
        prompt: findCurrent
          ? `A potential difference of ${answerQty(pd, "V")} is applied across ${component} of resistance ${resistance} Ω. ` +
            `Find the current in it.`
          : `${cap(component)} draws ${num(current)} A when a potential difference of ${answerQty(pd, "V")} is applied across it. ` +
            `Find its resistance.`,
        answer,
        distractors: findCurrent
          ? pickDistractors(answer, [
              wrongQty(pd * resistance, "A"), // multiplied instead of dividing
              wrongQty(resistance / pd, "A"), // inverted the fraction
              wrongQty(pd - resistance, "A"), // subtracted
              wrongQty(current * 10, "A"), // decimal slip
            ])
          : pickDistractors(answer, [
              wrongQty(pd * current, "Ω"), // multiplied instead of dividing
              wrongQty(current / pd, "Ω"), // inverted the fraction
              wrongQty(pd - current, "Ω"), // subtracted
              wrongQty(resistance * 10, "Ω"), // decimal slip
            ]),
        explanation: findCurrent
          ? `Rearranging V = IR gives I = V ÷ R = ${answerQty(pd, "V")} ÷ ${resistance} Ω = ${answer}. ` +
            `More resistance for the same pd means less current, so the resistance goes underneath.`
          : `Rearranging V = IR gives R = V ÷ I = ${answerQty(pd, "V")} ÷ ${num(current)} A = ${answer}. ` +
            `Resistance is volts per amp, which is what the division is measuring.`,
        check: () => {
          /* Power computed three ways. Any error in I or R shows up as a
             disagreement between VI, I²R and V²/R. */
          const viaVI = pd * current;
          const viaI2R = current * current * resistance;
          const viaV2R = (pd * pd) / resistance;
          if (!agrees(viaVI, viaI2R)) return `VI = ${viaVI} W but I²R = ${viaI2R} W`;
          if (!agrees(viaVI, viaV2R)) return `VI = ${viaVI} W but V²/R = ${viaV2R} W`;
          return null;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Series circuits
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.series",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "series-circuits",
    curriculumLevel: "YEAR_10",
    difficulty: 3,
    variants: 30,
    build: (rng) => {
      const mode = rng.pick(["total", "current", "pd", "missing"] as const);
      const values = [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24, 25, 30, 36, 40, 45, 50, 60, 75, 80, 100, 120, 150, 200];
      const count = mode === "total" ? rng.int(2, 3) : 2;

      const resistors: number[] = [];
      while (resistors.length < count) {
        const pick = rng.pick(values);
        if (!resistors.includes(pick)) resistors.push(pick);
      }
      const totalR = resistors.reduce((a, b) => a + b, 0);
      const current = rng.pick([0.1, 0.2, 0.4, 0.5, 0.8, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const supply = exact(current * totalR, 1, "supply pd");
      const list = resistors.map((r) => `${r} Ω`).join(" and ");

      if (mode === "total") {
        const answer = answerQty(totalR, "Ω");
        /* The parallel value of the same resistors, offered only when it is a
           number worth showing — it is the classic "used the wrong rule". */
        const parallel = 1 / resistors.reduce((sum, r) => sum + 1 / r, 0);
        return {
          prompt:
            `${cap(list)} resistor${count === 2 ? "s are" : "s are"} joined end to end in a series circuit. ` +
            `What is the total resistance of the ${count === 2 ? "pair" : "three"}?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(parallel, "Ω"), // used the parallel rule on a series chain
            wrongQty(resistors.reduce((a, b) => a * b, 1), "Ω"), // multiplied them
            wrongQty(totalR / count, "Ω"), // averaged them
            wrongQty(Math.max(...resistors) - Math.min(...resistors), "Ω"), // subtracted
          ]),
          explanation:
            `Resistances in series add: ${resistors.join(" + ")} = ${answer}. ` +
            `The same current passes through each one in turn, so the pushes needed to drive it add up.`,
          check: () => {
            /* Kirchhoff, not addition again: drive 1 A through the chain and the
               individual pds must sum to the pd across the whole. */
            const pds = resistors.map((r) => 1 * r);
            const sum = pds.reduce((a, b) => a + b, 0);
            return agrees(sum, 1 * totalR) ? null : `pds sum to ${sum} V across a ${totalR} Ω total`;
          },
        };
      }

      if (mode === "current") {
        const answer = answerQty(exactDiv(supply, totalR, 2), "A");
        return {
          prompt:
            `A ${answerQty(supply, "V")} battery is connected to a ${resistors[0]} Ω resistor in series with a ${resistors[1]} Ω resistor. ` +
            `What is the current in the circuit?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(supply / resistors[0], "A"), // used one resistor, not the total
            wrongQty(supply / (resistors[0] * resistors[1]), "A"), // multiplied the resistances
            wrongQty(supply * totalR, "A"), // multiplied instead of dividing
            wrongQty(current * 10, "A"), // decimal slip
          ]),
          explanation:
            `In series the resistances add: ${resistors[0]} + ${resistors[1]} = ${totalR} Ω. ` +
            `Then I = V ÷ R = ${answerQty(supply, "V")} ÷ ${totalR} Ω = ${answer}, ` +
            `and that same current flows through both resistors.`,
          check: () => {
            const pds = resistors.map((r) => current * r);
            const sum = pds.reduce((a, b) => a + b, 0);
            return agrees(sum, supply) ? null : `the pds ${pds.join(" + ")} sum to ${sum} V, not ${supply} V`;
          },
        };
      }

      if (mode === "pd") {
        const across = resistors[0];
        const other = resistors[1];
        const answer = answerQty(exact(current * across, 1, "pd"), "V");
        return {
          prompt:
            `A ${resistors[0]} Ω resistor and a ${resistors[1]} Ω resistor are in series across a ${answerQty(supply, "V")} supply. ` +
            `Calculate the potential difference across the ${across} Ω resistor.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(supply, "V"), // gave the supply pd — forgot it is shared
            wrongQty(current * other, "V"), // the pd across the other resistor
            wrongQty(supply / 2, "V"), // assumed the pd splits equally
            wrongQty(supply / across, "V"), // divided the supply by the resistance
          ]),
          explanation:
            `The current is the same everywhere: I = ${answerQty(supply, "V")} ÷ ${totalR} Ω = ${num(current)} A. ` +
            `Across the ${across} Ω resistor, V = IR = ${num(current)} × ${across} = ${answer}. ` +
            `The remaining ${answerQty(exact(current * other, 1), "V")} appears across the ${other} Ω resistor.`,
          check: () => {
            const here = current * across;
            const there = current * other;
            return agrees(here + there, supply)
              ? null
              : `${here} V + ${there} V = ${here + there} V, which is not the ${supply} V supply`;
          },
        };
      }

      const known = resistors[0];
      const missing = resistors[1];
      const answer = answerQty(exact(totalR - known, 1, "missing resistance"), "Ω");
      return {
        prompt:
          `Two resistors in series have a total resistance of ${totalR} Ω. ` +
          `One of them is ${known} Ω. What is the resistance of the other?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(totalR + known, "Ω"), // added where they should have subtracted
          wrongQty(known, "Ω"), // assumed the two are equal
          wrongQty(totalR / known, "Ω"), // divided
          wrongQty(totalR / 2, "Ω"), // halved the total
        ]),
        explanation:
          `Series resistances add, so the missing one is ${totalR} − ${known} = ${answer}. ` +
          `Adding instead would make the total larger than the total, which cannot be right.`,
        check: () => {
          /* Verified through the circuit rather than the subtraction: put 1 A
             through the pair and check the pds add to the pd across ${totalR}. */
          const pds = [known * 1, missing * 1];
          return agrees(pds[0] + pds[1], totalR)
            ? null
            : `${known} Ω and ${missing} Ω carry pds summing to ${pds[0] + pds[1]} V at 1 A, not ${totalR} V`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Parallel circuits
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.parallel.resistance",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "parallel-circuits",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 15,
    build: (rng) => {
      /* Three identical resistors sometimes, because R/3 is the version of this
         a student is expected to see instantly. */
      if (rng.bool(0.25)) {
        const each = rng.pick([3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 45, 60, 90, 120, 150, 300, 600]);
        const combined = exactDiv(each, 3, 1);
        const answer = answerQty(combined, "Ω");
        return {
          prompt: `Three ${each} Ω resistors are connected in parallel. What is their combined resistance?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(each * 3, "Ω"), // added them as though they were in series
            wrongQty(each, "Ω"), // gave one resistor, forgetting the combination
            wrongQty(3 / each, "Ω"), // stopped at 1/R and forgot to invert
            wrongQty(each / 2, "Ω"), // halved instead of dividing by three
          ]),
          explanation:
            `1/R = 1/${each} + 1/${each} + 1/${each} = 3/${each}, so R = ${each} ÷ 3 = ${answer}. ` +
            `n identical resistors in parallel always give R/n, and the total is always smaller than any one of them.`,
          check: () => {
            /* Currents, not resistances: across ${each} volts each branch takes
               1 A, so the combination must take 3 A. */
            const branchCurrent = each / each;
            const totalCurrent = 3 * branchCurrent;
            return agrees(each / combined, totalCurrent)
              ? null
              : `${answer} would draw ${each / combined} A where the three branches draw ${totalCurrent} A`;
          },
        };
      }

      const row = rng.pick(PARALLEL_PAIRS);
      const swap = rng.bool();
      const a = swap ? row.b : row.a;
      const b = swap ? row.a : row.b;
      const combined = exact(row.p, 1, "combined resistance");
      const answer = answerQty(combined, "Ω");
      const reciprocalSum = 1 / a + 1 / b;

      return {
        prompt: rng.bool()
          ? `A ${a} Ω resistor and a ${b} Ω resistor are connected in parallel. ` +
            `What is the resistance of the combination?`
          : `Two resistors, ${a} Ω and ${b} Ω, are connected side by side between the same two points. ` +
            `Calculate their combined resistance.`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(reciprocalSum, "Ω"), // worked out 1/R and forgot to invert it
          wrongQty(a + b, "Ω"), // added them as though they were in series
          wrongQty(a * b, "Ω"), // used the product without dividing by the sum
          wrongQty((a + b) / 2, "Ω"), // took the average of the two
        ]),
        explanation:
          `1/R = 1/${a} + 1/${b} = ${num(Number((b / (a * b)).toPrecision(6)))} + ${num(Number((a / (a * b)).toPrecision(6)))} = ${num(Number(((a + b) / (a * b)).toPrecision(6)))}, ` +
          `so R = (${a} × ${b}) ÷ (${a} + ${b}) = ${a * b} ÷ ${a + b} = ${answer}. ` +
          `A parallel combination is always smaller than the smaller resistor, which rules out ${a + b} Ω at a glance.`,
        check: () => {
          /* Kirchhoff's current law: across a test pd of ab volts the branches
             take b A and a A, and the combination must take their sum. */
          const testPd = a * b;
          const branchSum = testPd / a + testPd / b;
          const throughCombination = testPd / combined;
          return agrees(branchSum, throughCombination)
            ? null
            : `at ${testPd} V the branches carry ${branchSum} A but ${answer} would carry ${throughCombination} A`;
        },
      };
    },
  }),

  generator({
    key: "phy.elec.parallel.currents",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "parallel-circuits",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 15,
    build: (rng) => {
      const row = rng.pick(PARALLEL_BRANCHES.filter((r) => r.a !== r.b));
      const mode = rng.pick(["total", "branch", "combined"] as const);
      const { v, a, b, i1, i2, total, rp } = row;

      if (mode === "total") {
        const answer = answerQty(total, "A");
        return {
          prompt:
            `A ${v} V supply is connected across a ${a} Ω resistor and a ${b} Ω resistor in parallel. ` +
            `What current does the supply deliver?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(v / (a + b), "A"), // added the resistances as though in series
            wrongQty(Math.abs(i1 - i2), "A"), // subtracted the branch currents
            wrongQty(i1, "A"), // gave one branch only
            wrongQty((v * (a + b)) / (a * b) / 2, "A"), // halved the total
          ]),
          explanation:
            `Both resistors have the full ${v} V across them, so the branches carry ` +
            `${v} ÷ ${a} = ${num(i1)} A and ${v} ÷ ${b} = ${num(i2)} A. ` +
            `The supply current is the sum: ${num(i1)} + ${num(i2)} = ${answer}.`,
          check: () => {
            /* Same total, reached through the combined resistance instead of by
               adding currents. */
            const viaCombination = v / ((a * b) / (a + b));
            return agrees(viaCombination, total)
              ? null
              : `the ${num((a * b) / (a + b))} Ω combination would draw ${viaCombination} A, not ${total} A`;
          },
        };
      }

      if (mode === "branch") {
        const answer = answerQty(i1, "A");
        return {
          prompt:
            `A ${a} Ω resistor and a ${b} Ω resistor are connected in parallel across a ${v} V battery. ` +
            `Calculate the current in the ${a} Ω resistor.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(total / 2, "A"), // assumed the current splits equally
            wrongQty(i2, "A"), // the current in the other branch
            wrongQty(v / (a + b), "A"), // used the total resistance of a series pair
            wrongQty(v / rp, "A"), // gave the total supply current
          ]),
          explanation:
            `Components in parallel share the same potential difference, so the ${a} Ω resistor has the whole ${v} V across it. ` +
            `I = V ÷ R = ${v} ÷ ${a} = ${answer}. ` +
            `The ${b} Ω branch carries ${num(i2)} A, and the two only split equally when the resistances are equal.`,
          check: () => {
            /* Check by power: the branch powers must add to the supply power. */
            const branchPowers = v * i1 + v * i2;
            const supplyPower = v * total;
            return agrees(branchPowers, supplyPower)
              ? null
              : `branch powers total ${branchPowers} W against a supply power of ${supplyPower} W`;
          },
        };
      }

      const answer = answerQty(rp, "Ω");
      return {
        prompt:
          `A ${v} V supply drives ${num(i1)} A through one resistor and ${num(i2)} A through a second connected in parallel with it. ` +
          `What single resistance would draw the same total current?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(a + b, "Ω"), // added the two resistances
          wrongQty(v / Math.abs(i1 - i2), "Ω"), // subtracted the currents first
          wrongQty(a, "Ω"), // gave one of the resistors
          wrongQty((a + b) / 2, "Ω"), // averaged the resistances
        ]),
        explanation:
          `The supply delivers ${num(i1)} + ${num(i2)} = ${num(total)} A in total, ` +
          `so the equivalent resistance is R = V ÷ I = ${v} ÷ ${num(total)} = ${answer}. ` +
          `It is smaller than either branch (${a} Ω and ${b} Ω) because adding a branch gives the charge another route.`,
        check: () => {
          const viaReciprocals = 1 / (1 / a + 1 / b);
          return agrees(viaReciprocals, rp)
            ? null
            : `1/(1/${a} + 1/${b}) = ${viaReciprocals} Ω, not ${rp} Ω`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Electrical power
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.power.vi",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "electrical-power",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 15,
    build: (rng) => {
      const pd = rng.pick([3, 5, 6, 9, 12, 20, 24, 30, 40, 50, 60, 100, 110, 120, 230, 240]);
      const current = rng.pick([0.1, 0.2, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]);
      const power = exact(pd * current, 1, "power");
      const mode = rng.pick(["power", "current", "pd"] as const);
      const device = rng.pick(APPLIANCES);

      if (mode === "power") {
        const answer = answerQty(power, "W");
        return {
          prompt:
            `${cap(device)} operating from a ${pd} V supply draws a current of ${num(current)} A. ` +
            `Calculate its power.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(pd / current, "W"), // divided instead of multiplying
            wrongQty(pd + current, "W"), // added the two quantities
            wrongQty(power / 1000, "W"), // worked in kilowatts but labelled it watts
            wrongQty(power * 1000, "W"), // multiplied by 1000 in the wrong direction
          ]),
          explanation:
            `P = VI = ${pd} × ${num(current)} = ${answer}. ` +
            `Every coulomb picks up ${pd} J and ${num(current)} C pass each second, which is ${answer}.`,
          check: () => {
            const resistance = pd / current;
            const viaI2R = current * current * resistance;
            const viaV2R = (pd * pd) / resistance;
            if (!agrees(power, viaI2R)) return `VI = ${power} W but I²R = ${viaI2R} W`;
            if (!agrees(power, viaV2R)) return `VI = ${power} W but V²/R = ${viaV2R} W`;
            return null;
          },
        };
      }

      if (mode === "current") {
        const answer = answerQty(exactDiv(power, pd, 2), "A");
        return {
          prompt:
            `${cap(device)} is rated at ${answerQty(power, "W")} when connected to a ${pd} V supply. ` +
            `What current does it draw?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(power * pd, "A"), // multiplied instead of dividing
            wrongQty(pd / power, "A"), // inverted the fraction
            wrongQty(power - pd, "A"), // subtracted
            wrongQty(current * 10, "A"), // decimal slip
          ]),
          explanation:
            `Rearranging P = VI gives I = P ÷ V = ${answerQty(power, "W")} ÷ ${pd} V = ${answer}. ` +
            `A higher supply voltage delivers the same power at a smaller current, which is why the pd goes underneath.`,
          check: () => {
            const resistance = pd / current;
            const viaI2R = current * current * resistance;
            const viaV2R = (pd * pd) / resistance;
            if (!agrees(power, viaI2R)) return `I²R = ${viaI2R} W against a stated ${power} W`;
            if (!agrees(power, viaV2R)) return `V²/R = ${viaV2R} W against a stated ${power} W`;
            return null;
          },
        };
      }

      const answer = answerQty(exactDiv(power, current, 1), "V");
      return {
        prompt:
          `${cap(device)} transfers energy at ${answerQty(power, "W")} while carrying ${num(current)} A. ` +
          `What potential difference is across it?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(power * current, "V"), // multiplied instead of dividing
          wrongQty(current / power, "V"), // inverted the fraction
          wrongQty(power - current, "V"), // subtracted
          wrongQty(pd * 10, "V"), // decimal slip
        ]),
        explanation:
          `Rearranging P = VI gives V = P ÷ I = ${answerQty(power, "W")} ÷ ${num(current)} A = ${answer}. ` +
          `Potential difference is joules per coulomb, and this is ${answerQty(power, "W")} shared among ${num(current)} C each second.`,
        check: () => {
          const resistance = pd / current;
          const viaI2R = current * current * resistance;
          const viaV2R = (pd * pd) / resistance;
          if (!agrees(power, viaI2R)) return `I²R = ${viaI2R} W against a stated ${power} W`;
          if (!agrees(power, viaV2R)) return `V²/R = ${viaV2R} W against a stated ${power} W`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "phy.elec.power.squares",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "electrical-power",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 15,
    build: (rng) => {
      const useCurrent = rng.bool();
      const component = rng.pick(OHMIC);

      if (useCurrent) {
        const row = rng.pick(I_SQUARED_R);
        const { i, r, p } = row;
        const answer = answerQty(p, "W");
        return {
          prompt:
            `${cap(component)} of resistance ${r} Ω carries a current of ${num(i)} A. ` +
            `Use P = I²R to find the power dissipated in it.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(i * r, "W"), // forgot to square the current
            wrongQty(i * r * r, "W"), // squared the resistance instead of the current
            wrongQty((i * i) / r, "W"), // divided by R instead of multiplying
            wrongQty(2 * i * r, "W"), // doubled the current instead of squaring it
          ]),
          explanation:
            `P = I²R = ${num(i)}² × ${r} = ${num(exact(i * i, 2))} × ${r} = ${answer}. ` +
            `Doubling the current would quadruple this, which is why cables heat up so quickly when overloaded.`,
          check: () => {
            /* Three routes, using the pd the current would produce. */
            const pd = i * r;
            const viaVI = pd * i;
            const viaV2R = (pd * pd) / r;
            if (!agrees(p, viaVI)) return `I²R = ${p} W but VI = ${viaVI} W`;
            if (!agrees(p, viaV2R)) return `I²R = ${p} W but V²/R = ${viaV2R} W`;
            return null;
          },
        };
      }

      const row = rng.pick(V_SQUARED_OVER_R);
      const { v, r, p } = row;
      const answer = answerQty(p, "W");
      return {
        prompt:
          `A potential difference of ${v} V is applied across ${component} of resistance ${r} Ω. ` +
          `Use P = V²/R to find the power dissipated.`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(v / r, "W"), // forgot to square the pd
          wrongQty(v * v * r, "W"), // multiplied by R instead of dividing
          wrongQty((2 * v) / r, "W"), // doubled the pd instead of squaring it
          wrongQty(v / (r * r), "W"), // squared the resistance instead
        ]),
        explanation:
          `P = V²/R = ${v}² ÷ ${r} = ${v * v} ÷ ${r} = ${answer}. ` +
          `The current here is ${answerQty(exactDiv(v, r, 2), "A")}, and VI gives the same ${answer}.`,
        check: () => {
          const current = v / r;
          const viaVI = v * current;
          const viaI2R = current * current * r;
          if (!agrees(p, viaVI)) return `V²/R = ${p} W but VI = ${viaVI} W`;
          if (!agrees(p, viaI2R)) return `V²/R = ${p} W but I²R = ${viaI2R} W`;
          return null;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Energy transferred
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.energy",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "energy-transferred",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const mode = rng.pick(["pt", "qv", "vit", "time"] as const);
      const device = rng.pick(APPLIANCES);

      if (mode === "pt") {
        const row = rng.pick(POWER_TIME);
        const inMinutes = row.t % 60 === 0 && rng.bool();
        const timeText = inMinutes ? `${row.t / 60} minutes` : `${row.t} s`;
        const answer = answerQty(row.e, "J");
        return {
          prompt:
            `${cap(device)} rated at ${row.p} W is switched on for ${timeText}. ` +
            `How much energy does it transfer?`,
          answer,
          distractors: pickDistractors(answer, [
            inMinutes ? wrongQty(row.p * (row.t / 60), "J") : wrongQty(row.e / 60, "J"), // time left in minutes
            wrongQty(row.p / row.t, "J"), // divided instead of multiplying
            wrongQty(row.e / 1000, "J"), // gave kilojoules but wrote joules
            wrongQty(row.p + row.t, "J"), // added the two quantities
          ]),
          explanation:
            `E = Pt with the time in seconds: ${inMinutes ? `${row.t / 60} min = ${row.t} s, so ` : ""}` +
            `E = ${row.p} × ${row.t} = ${answer}. ` +
            `A watt is a joule per second, so ${row.p} J arrive every second for ${row.t} s.`,
          check: () => {
            /* Reached through charge instead: at a nominal 10 V the appliance
               draws P/10 amps, and E = QV must give the same energy. */
            const nominalPd = 10;
            const current = row.p / nominalPd;
            const charge = current * row.t;
            const viaQV = charge * nominalPd;
            return agrees(viaQV, row.e) ? null : `QV gives ${viaQV} J against Pt = ${row.e} J`;
          },
        };
      }

      if (mode === "qv") {
        const charge = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 80, 100, 120, 200, 250, 300, 500]);
        const pd = rng.pick([1.5, 3, 4.5, 6, 9, 12, 20, 24, 30, 50, 100, 230, 240]);
        const energy = exact(charge * pd, 1, "energy");
        const answer = answerQty(energy, "J");
        return {
          prompt:
            `${answerQty(charge, "C")} of charge is driven through ${device} by a potential difference of ${num(pd)} V. ` +
            `Calculate the energy transferred.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(charge / pd, "J"), // divided instead of multiplying
            wrongQty(pd / charge, "J"), // divided the other way
            wrongQty(charge + pd, "J"), // added the two quantities
            wrongQty(energy / 1000, "J"), // gave kilojoules but wrote joules
          ]),
          explanation:
            `Potential difference is energy per unit charge, so E = QV = ${charge} × ${num(pd)} = ${answer}. ` +
            `Each coulomb gives up ${num(pd)} J, and ${charge} of them pass through.`,
          check: () => {
            /* Same energy, reached as Pt: send the charge through in 10 s. */
            const seconds = 10;
            const current = charge / seconds;
            const viaPt = pd * current * seconds;
            return agrees(viaPt, energy) ? null : `VIt gives ${viaPt} J against QV = ${energy} J`;
          },
        };
      }

      if (mode === "vit") {
        const pd = rng.pick([3, 4, 5, 6, 9, 12, 20, 24, 30, 50, 60, 100, 120, 230, 240]);
        const current = rng.pick([0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]);
        const seconds = rng.pick([5, 10, 15, 20, 30, 40, 50, 60, 90, 120, 150, 180, 240, 300, 600]);
        const energy = pd * current * seconds;
        if (!tidy(energy)) {
          /* Fall back to a combination that always works: the pd and current
             give a whole-number power, and any of these times keeps it tidy. */
          const safeEnergy = exact(12 * 2 * 60, 0, "energy");
          const answer = answerQty(safeEnergy, "J");
          return {
            prompt:
              `${cap(device)} draws 2 A from a 12 V supply for 60 s. ` +
              `Use E = VIt to find the energy transferred.`,
            answer,
            distractors: pickDistractors(answer, [
              wrongQty(12 * 2, "J"), // forgot the time altogether
              wrongQty((12 * 2) / 60, "J"), // divided by the time
              wrongQty(safeEnergy / 1000, "J"), // gave kilojoules but wrote joules
              wrongQty(12 + 2 + 60, "J"), // added the three quantities
            ]),
            explanation:
              `E = VIt = 12 × 2 × 60 = ${answer}. ` +
              `The power is 12 × 2 = 24 W, and 24 J every second for 60 s is ${answer}.`,
            check: () => {
              const charge = 2 * 60;
              return agrees(charge * 12, safeEnergy) ? null : `QV disagrees with VIt`;
            },
          };
        }
        const answer = answerQty(energy, "J");
        return {
          prompt:
            `${cap(device)} draws ${num(current)} A from a ${pd} V supply for ${seconds} s. ` +
            `Use E = VIt to find the energy transferred.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(pd * current, "J"), // stopped at the power and forgot the time
            wrongQty((pd * current) / seconds, "J"), // divided by the time
            wrongQty(energy / 1000, "J"), // gave kilojoules but wrote joules
            wrongQty(pd + current + seconds, "J"), // added the three quantities
          ]),
          explanation:
            `E = VIt = ${pd} × ${num(current)} × ${seconds} = ${answer}. ` +
            `That is a power of ${answerQty(exact(pd * current, 1), "W")} sustained for ${seconds} s.`,
          check: () => {
            /* Same energy as QV, with Q worked out separately. */
            const charge = current * seconds;
            const viaQV = charge * pd;
            return agrees(viaQV, energy) ? null : `QV gives ${viaQV} J against VIt = ${energy} J`;
          },
        };
      }

      const row = rng.pick(POWER_TIME);
      const answer = answerQty(row.t, "s");
      return {
        prompt:
          `${cap(device)} transfers ${answerQty(row.e, "J")} of energy at a steady ${row.p} W. ` +
          `For how long was it switched on?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(row.e * row.p, "s"), // multiplied instead of dividing
          wrongQty(row.p / row.e, "s"), // inverted the fraction
          wrongQty(row.t / 60, "s"), // answered in minutes but labelled seconds
          wrongQty(row.e - row.p, "s"), // subtracted
        ]),
        explanation:
          `Rearranging E = Pt gives t = E ÷ P = ${answerQty(row.e, "J")} ÷ ${row.p} W = ${answer}. ` +
          `At ${row.p} J per second it takes ${answer} to deliver ${answerQty(row.e, "J")}.`,
        check: () => {
          /* Accumulate the energy a second at a time from the published answer. */
          let accumulated = 0;
          for (let s = 0; s < row.t; s++) accumulated += row.p;
          return agrees(accumulated, row.e) ? null : `${row.p} W for ${row.t} s gives ${accumulated} J`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Resistivity
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.resistivity",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "resistivity",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(RESISTIVITY_CASES);
      const { rhoM, rhoE, areaM, areaE, length, r } = row;
      const rho = rhoM * Math.pow(10, rhoE);
      const area = areaM * Math.pow(10, areaE);
      const sample = rng.pick(WIRES);

      /* Area quoted in mm² about half the time. It is how a data sheet gives it,
         and the missing factor of 10⁶ is the single most common slip in this
         topic — so it earns its place as a distractor rather than as a trap. */
      const inMm2 = rng.bool();
      const areaMm2 = area * 1e6;
      const areaText = inMm2 ? answerQty(areaMm2, "mm²") : sf(areaM, areaE, "m²");
      const mode = rng.pick(["resistance", "resistivity", "length", "area"] as const);

      if (mode === "resistance") {
        const answer = answerQty(r, "Ω");
        return {
          prompt:
            `${cap(sample)} of resistivity ${sf(rhoM, rhoE, "Ω m")} is ${length} m long ` +
            `and has a cross-sectional area of ${areaText}. Calculate its resistance.`,
          answer,
          distractors: pickDistractors(answer, [
            inMm2 ? wrongQty(rho * length * 1e6 / areaMm2 / 1e6, "Ω") : wrongQty((rho * area) / length, "Ω"),
            wrongQty(rho * length * area, "Ω"), // multiplied by the area instead of dividing
            wrongQty((rho * area) / length, "Ω"), // turned the fraction upside down
            wrongQty(rho / (length * area), "Ω"), // divided by the length as well
          ]),
          explanation:
            `R = ρL/A = (${sf(rhoM, rhoE, "Ω m")} × ${length} m) ÷ ${sf(areaM, areaE, "m²")} = ${answer}` +
            (inMm2 ? `, after converting ${answerQty(areaMm2, "mm²")} to ${sf(areaM, areaE, "m²")} (1 mm² = 10⁻⁶ m²).` : ".") +
            ` Doubling the length would double this; doubling the area would halve it.`,
          check: () => {
            /* Substituted back as RA = ρL, and separately as a property: a wire
               twice as long and twice as thick has the same resistance. */
            if (!agrees(r * area, rho * length)) return `RA = ${r * area} but ρL = ${rho * length}`;
            const scaled = (rho * (2 * length)) / (2 * area);
            return agrees(scaled, r) ? null : `doubling L and A changed R from ${r} to ${scaled}`;
          },
        };
      }

      if (mode === "resistivity") {
        const answer = sf(rhoM, rhoE, "Ω m");
        return {
          prompt:
            `${cap(sample)} ${length} m long with a cross-sectional area of ${areaText} ` +
            `has a resistance of ${answerQty(r, "Ω")}. Calculate the resistivity of the material.`,
          answer,
          distractors: pickDistractors(answer, [
            inMm2 ? wrongQty((r * areaMm2) / length, "Ω m") : wrongQty((r * length) / area, "Ω m"), // area left in mm², or L and A swapped
            wrongQty((r * length) / area, "Ω m"), // swapped the length and the area
            wrongQty(r * area * length, "Ω m"), // multiplied by the length instead of dividing
            wrongQty(r / (area * length), "Ω m"), // divided by both
          ]),
          explanation:
            `Rearranging R = ρL/A gives ρ = RA/L = (${answerQty(r, "Ω")} × ${sf(areaM, areaE, "m²")}) ÷ ${length} m = ${answer}. ` +
            `Resistivity is a property of the material, so it does not change when the wire is cut shorter.`,
          check: () => {
            if (!agrees(r * area, rho * length)) return `RA = ${r * area} but ρL = ${rho * length}`;
            const halved = (rho * (length / 2)) / area;
            return agrees(halved, r / 2) ? null : `halving the length gave ${halved} Ω, not ${r / 2} Ω`;
          },
        };
      }

      if (mode === "length") {
        const answer = answerQty(length, "m");
        return {
          prompt:
            `${cap(sample)} of resistivity ${sf(rhoM, rhoE, "Ω m")} and cross-sectional area ${sf(areaM, areaE, "m²")} ` +
            `has a resistance of ${answerQty(r, "Ω")}. How long is it?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty((rho * r) / area, "m"), // put ρ on top instead of A
            wrongQty(r * rho * area, "m"), // multiplied everything together
            wrongQty(area / (r * rho), "m"), // turned the fraction upside down
            wrongQty((r * area) / rho / 10, "m"), // lost a power of ten
          ]),
          explanation:
            `Rearranging R = ρL/A gives L = RA/ρ = (${answerQty(r, "Ω")} × ${sf(areaM, areaE, "m²")}) ÷ ${sf(rhoM, rhoE, "Ω m")} = ${answer}. ` +
            `The two powers of ten divide out: 10${sup(areaE)} ÷ 10${sup(rhoE)} = 10${sup(areaE - rhoE)}.`,
          check: () => {
            if (!agrees(r * area, rho * length)) return `RA = ${r * area} but ρL = ${rho * length}`;
            const rebuilt = (rho * length) / area;
            return agrees(rebuilt, r) ? null : `a ${length} m sample would have R = ${rebuilt} Ω, not ${r} Ω`;
          },
        };
      }

      const answer = sf(areaM, areaE, "m²");
      return {
        prompt:
          `A ${length} m length of ${sample.replace(/^an? /, "")} of resistivity ${sf(rhoM, rhoE, "Ω m")} ` +
          `has a resistance of ${answerQty(r, "Ω")}. Calculate its cross-sectional area.`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty((r * length) / rho, "m²"), // inverted — put R on top with L
          wrongQty(rho * length * r, "m²"), // multiplied everything together
          wrongQty(rho / (length * r), "m²"), // divided by the length instead of multiplying
          wrongQty(((rho * length) / r) * 1e6, "m²"), // answered in mm² but labelled m²
        ]),
        explanation:
          `Rearranging R = ρL/A gives A = ρL/R = (${sf(rhoM, rhoE, "Ω m")} × ${length} m) ÷ ${answerQty(r, "Ω")} = ${answer}, ` +
          `which is ${answerQty(areaMm2, "mm²")}. A thicker wire has a lower resistance, so A sits underneath R.`,
        check: () => {
          if (!agrees(r * area, rho * length)) return `RA = ${r * area} but ρL = ${rho * length}`;
          const doubled = (rho * length) / (2 * area);
          return agrees(doubled, r / 2) ? null : `doubling the area gave ${doubled} Ω, not ${r / 2} Ω`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     EMF and internal resistance
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.emf.terminal",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "emf-internal-resistance",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 15,
    build: (rng) => {
      const row = rng.pick(CELL_CASES);
      const { emf, i, r, rInt, terminal, lost } = row;
      const mode = rng.pick(["emf", "terminal", "lost"] as const);
      const cell = rng.pick(["a cell", "a battery", "a power supply", "a rechargeable cell"] as const);

      if (mode === "emf") {
        const answer = answerQty(emf, "V");
        return {
          prompt:
            `${cap(cell)} of internal resistance ${num(rInt)} Ω drives ${num(i)} A through an external resistor of ${r} Ω. ` +
            `What is its emf?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(terminal, "V"), // forgot the internal resistance entirely
            wrongQty(terminal + rInt, "V"), // added r as a voltage without multiplying by I
            wrongQty(i * (r - rInt), "V"), // subtracted the internal resistance
            wrongQty(r + rInt, "V"), // added the resistances and forgot to multiply by I
          ]),
          explanation:
            `ε = I(R + r) = ${num(i)} × (${r} + ${num(rInt)}) = ${num(i)} × ${num(exact(r + rInt, 1))} = ${answer}. ` +
            `The cell also has to push the current through its own ${num(rInt)} Ω, costing ${answerQty(lost, "V")}.`,
          check: () => {
            /* Energy accounting instead of the formula: the power the cell
               supplies must equal the power in R plus the power wasted in r. */
            const supplied = emf * i;
            const dissipated = i * i * r + i * i * rInt;
            return agrees(supplied, dissipated)
              ? null
              : `the cell supplies ${supplied} W but the circuit dissipates ${dissipated} W`;
          },
        };
      }

      if (mode === "terminal") {
        const answer = answerQty(terminal, "V");
        return {
          prompt:
            `${cap(cell)} of emf ${answerQty(emf, "V")} and internal resistance ${num(rInt)} Ω delivers a current of ${num(i)} A. ` +
            `What is the potential difference across its terminals?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(emf, "V"), // assumed the terminal pd equals the emf
            wrongQty(emf + lost, "V"), // added the lost volts instead of subtracting
            wrongQty(emf - rInt, "V"), // subtracted r rather than Ir
            wrongQty(lost, "V"), // gave the lost volts instead
          ]),
          explanation:
            `The lost volts inside the cell are Ir = ${num(i)} × ${num(rInt)} = ${answerQty(lost, "V")}, ` +
            `so V = ε − Ir = ${answerQty(emf, "V")} − ${answerQty(lost, "V")} = ${answer}. ` +
            `The terminal pd only equals the emf when no current flows.`,
          check: () => {
            /* Terminal pd re-derived from the external resistance the current
               implies, which never touches the subtraction that built it. */
            const external = terminal / i;
            const viaOhm = i * external;
            if (!agrees(viaOhm, terminal)) return `IR gives ${viaOhm} V, not ${terminal} V`;
            return agrees(i * (external + rInt), emf)
              ? null
              : `I(R + r) = ${i * (external + rInt)} V against an emf of ${emf} V`;
          },
        };
      }

      const answer = answerQty(lost, "V");
      return {
        prompt:
          `${cap(cell)} of emf ${answerQty(emf, "V")} has an internal resistance of ${num(rInt)} Ω. ` +
          `When it supplies ${num(i)} A, how many volts are lost inside the cell?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(terminal, "V"), // gave the terminal pd instead
          wrongQty(rInt, "V"), // quoted the internal resistance as a voltage
          wrongQty(emf - rInt, "V"), // subtracted r rather than Ir
          wrongQty(emf / rInt, "V"), // divided the emf by the internal resistance
        ]),
        explanation:
          `The lost volts are the pd across the internal resistance: Ir = ${num(i)} × ${num(rInt)} = ${answer}. ` +
          `That leaves ${answerQty(terminal, "V")} at the terminals, and ${answerQty(emf, "V")} − ${answer} confirms it.`,
        check: () => {
          const supplied = emf * i;
          const wasted = lost * i;
          const useful = terminal * i;
          return agrees(supplied, wasted + useful)
            ? null
            : `${supplied} W supplied does not split into ${wasted} W wasted and ${useful} W delivered`;
        },
      };
    },
  }),

  generator({
    key: "phy.elec.emf.internal-resistance",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "emf-internal-resistance",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 15,
    build: (rng) => {
      const row = rng.pick(CELL_CASES);
      const { emf, i, r, rInt, terminal, lost } = row;

      if (rng.bool()) {
        const answer = answerQty(exactDiv(emf - terminal, i, 2), "Ω");
        return {
          prompt:
            `A cell of emf ${answerQty(emf, "V")} has a terminal potential difference of ${answerQty(terminal, "V")} ` +
            `when it delivers a current of ${num(i)} A. Calculate its internal resistance.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(terminal / i, "Ω"), // that is the external resistance, not r
            wrongQty(emf / i, "Ω"), // used the emf instead of the lost volts
            wrongQty(emf - terminal, "Ω"), // gave the lost volts as a resistance
            wrongQty((emf - terminal) / terminal, "Ω"), // divided by the pd instead of the current
          ]),
          explanation:
            `The lost volts are ε − V = ${answerQty(emf, "V")} − ${answerQty(terminal, "V")} = ${answerQty(lost, "V")}, ` +
            `and those volts are dropped across r, so r = ${answerQty(lost, "V")} ÷ ${num(i)} A = ${answer}. ` +
            `Dividing the terminal pd by the current would give the external ${answerQty(exactDiv(terminal, i, 1), "Ω")} instead.`,
          check: () => {
            /* Independent route: the external resistance follows from V and I,
               and ε = I(R + r) has to close. */
            const external = terminal / i;
            return agrees(i * (external + rInt), emf)
              ? null
              : `I(R + r) = ${i * (external + rInt)} V against an emf of ${emf} V`;
          },
        };
      }

      /* Two points from the terminal-pd-against-current graph: the intercept is
         the emf and the gradient is −r, which is the standard required
         practical. Both points are built from the same cell. */
      const second = rng.pick([0.2, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5].filter((x) => x !== i));
      const secondPd = exact(emf - second * rInt, 2, "second terminal pd");
      if (secondPd <= 0) {
        /* A load that would flatten the cell is not a graph point; ask the
           straightforward version instead. */
        const answer = answerQty(rInt, "Ω");
        return {
          prompt:
            `A cell of emf ${answerQty(emf, "V")} is connected to a ${r} Ω resistor and drives ${num(i)} A. ` +
            `Calculate the internal resistance of the cell.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(emf / i, "Ω"), // gave the total circuit resistance
            wrongQty(emf / i + r, "Ω"), // added the external resistance instead of subtracting
            wrongQty(emf - terminal, "Ω"), // gave the lost volts as a resistance
            wrongQty(r - emf / i, "Ω"), // subtracted the wrong way round
          ]),
          explanation:
            `ε = I(R + r), so R + r = ${answerQty(emf, "V")} ÷ ${num(i)} A = ${answerQty(exactDiv(emf, i, 2), "Ω")}. ` +
            `Taking off the external ${r} Ω leaves r = ${answer}.`,
          check: () =>
            agrees(i * (r + rInt), emf) ? null : `I(R + r) = ${i * (r + rInt)} V against an emf of ${emf} V`,
        };
      }

      /* (V₂ − V₁) / (I₂ − I₁). The denominator was the wrong way round, which
         flipped the sign and published an internal resistance of −2 Ω — with
         the correct +2 Ω sitting in the list as a distractor. The check below
         passed anyway, because it verified the table's `rInt` rather than the
         answer actually published. A check that never looks at the answer is
         not a check. */
      const gradient = exactDiv(secondPd - terminal, second - i, 2);
      const answer = answerQty(-gradient, "Ω");
      return {
        prompt:
          `A graph of terminal potential difference against current for a cell passes through ` +
          `(${num(i)} A, ${answerQty(terminal, "V")}) and (${num(second)} A, ${answerQty(secondPd, "V")}). ` +
          `What is the internal resistance of the cell?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(gradient, "Ω"), // read the gradient without the minus sign
          wrongQty(terminal / i, "Ω"), // gave the external resistance at one point
          wrongQty(emf, "Ω"), // gave the intercept, which is the emf
          wrongQty((terminal - secondPd) / (terminal + secondPd), "Ω"), // divided by pds, not currents
        ]),
        explanation:
          `V = ε − Ir is a straight line of gradient −r, so ` +
          `r = −(${answerQty(secondPd, "V")} − ${answerQty(terminal, "V")}) ÷ (${num(second)} − ${num(i)}) A = ${answer}. ` +
          `Extrapolating back to I = 0 gives the emf, ${answerQty(emf, "V")}.`,
        check: () => {
          /* The published answer first — a resistance is never negative, and
             the gradient must reproduce the table's internal resistance. */
          if (-gradient <= 0) return `published an internal resistance of ${-gradient} Ω`;
          if (!agrees(-gradient, rInt)) {
            return `the gradient gives r = ${-gradient} Ω but the cell has ${rInt} Ω`;
          }
          /* Then both plotted points, which must satisfy ε = V + Ir with one emf. */
          const fromFirst = terminal + i * rInt;
          const fromSecond = secondPd + second * rInt;
          return agrees(fromFirst, fromSecond) && agrees(fromFirst, emf)
            ? null
            : `the two points imply emfs of ${fromFirst} V and ${fromSecond} V`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Potential dividers
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.elec.potential-divider",
    subject: "physics",
    topic: "phy-electricity",
    subtopic: "potential-dividers",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      /* Built from parts: the supply is (a + b) × m volts and the resistors are
         a and b unit-resistances, so every pd in the circuit is a whole number
         of volts however the question is asked. */
      const a = rng.int(1, 8);
      /* Never equal. With a = b the divider splits the supply in half, and
         three of the four distractors below — the other resistor's pd, half the
         supply, and the answer itself — become the same number, leaving a
         question with one wrong option. A symmetric divider is also a bad
         question: several wrong methods give the right answer. */
      let b = rng.int(1, 8);
      for (let guard = 0; guard < 20 && b === a; guard++) b = rng.int(1, 8);
      if (b === a) b = a === 8 ? 3 : a + 1;
      const m = rng.int(1, 5);
      const unit = rng.pick([10, 20, 47, 50, 100, 150, 200, 220, 470, 500, 1000]);
      const supply = (a + b) * m;
      const r1 = a * unit;
      const r2 = b * unit;
      const vTop = a * m;
      const vBottom = b * m;
      const mode = rng.pick(["bottom", "top", "resistor", "sensor"] as const);

      if (mode === "bottom") {
        const answer = answerQty(vBottom, "V");
        return {
          prompt:
            `A ${supply} V supply is connected across a ${r1} Ω resistor in series with a ${r2} Ω resistor. ` +
            `What is the output potential difference taken across the ${r2} Ω resistor?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(vTop, "V"), // used the other resistor on top of the fraction
            wrongQty((supply * r2) / r1, "V"), // divided by the wrong resistance
            wrongQty(supply / 2, "V"), // assumed the supply splits equally
            wrongQty(supply - vBottom - vTop + supply, "V"), // gave the whole supply pd
          ]),
          explanation:
            `V_out = V_in × R₂/(R₁ + R₂) = ${supply} × ${r2}/(${r1} + ${r2}) = ${supply} × ${r2}/${r1 + r2} = ${answer}. ` +
            `The remaining ${answerQty(vTop, "V")} is across the ${r1} Ω resistor, and the two add back to ${supply} V.`,
          check: () => {
            /* Through the current instead of the ratio: one current flows in the
               series pair, and IR₂ must give the same output. */
            const current = supply / (r1 + r2);
            const viaCurrent = current * r2;
            if (!agrees(viaCurrent, vBottom)) return `IR₂ = ${viaCurrent} V, not ${vBottom} V`;
            return agrees(vTop + vBottom, supply)
              ? null
              : `the two pds sum to ${vTop + vBottom} V, not the ${supply} V supply`;
          },
        };
      }

      if (mode === "top") {
        const answer = answerQty(vTop, "V");
        return {
          prompt:
            `Two resistors, ${r1} Ω and ${r2} Ω, form a potential divider across a ${supply} V supply. ` +
            `Calculate the potential difference across the ${r1} Ω resistor.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(vBottom, "V"), // used the other resistor on top of the fraction
            wrongQty((supply * r1) / r2, "V"), // divided by the wrong resistance
            wrongQty(supply / 2, "V"), // assumed the supply splits equally
            wrongQty(supply, "V"), // gave the whole supply pd
          ]),
          explanation:
            `The pd splits in the ratio of the resistances: ${r1} : ${r2} is ${a} : ${b}, ` +
            `so the ${r1} Ω resistor takes ${a}/${a + b} of ${supply} V = ${answer}. ` +
            `The ${r2} Ω resistor takes the other ${answerQty(vBottom, "V")}.`,
          check: () => {
            const current = supply / (r1 + r2);
            const viaCurrent = current * r1;
            if (!agrees(viaCurrent, vTop)) return `IR₁ = ${viaCurrent} V, not ${vTop} V`;
            return agrees(vTop + vBottom, supply)
              ? null
              : `the two pds sum to ${vTop + vBottom} V, not the ${supply} V supply`;
          },
        };
      }

      if (mode === "resistor") {
        const answer = answerQty(r2, "Ω");
        return {
          prompt:
            `A potential divider across a ${supply} V supply uses a fixed ${r1} Ω resistor at the top. ` +
            `What resistance is needed below it to give an output of ${answerQty(vBottom, "V")}?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty((r1 * vBottom) / supply, "Ω"), // divided by V_in instead of by (V_in − V_out)
            wrongQty((r1 * vTop) / vBottom, "Ω"), // inverted the ratio
            wrongQty(r1, "Ω"), // assumed the two resistors must be equal
            wrongQty(r1 + r2 + r1, "Ω"), // added rather than scaled
          ]),
          explanation:
            `The ${r1} Ω resistor must drop ${supply} − ${vBottom} = ${answerQty(vTop, "V")}, ` +
            `so the resistances are in the ratio ${vTop} : ${vBottom}. ` +
            `R₂ = ${r1} × ${vBottom}/${vTop} = ${answer}, and the current is the same through both.`,
          check: () => {
            const current = supply / (r1 + r2);
            return agrees(current * r2, vBottom)
              ? null
              : `${r2} Ω carrying ${current} A gives ${current * r2} V, not ${vBottom} V`;
          },
        };
      }

      const sensor = rng.pick([
        { name: "an LDR", cue: "in bright light" },
        { name: "a thermistor", cue: "when warm" },
        { name: "an LDR", cue: "in dim light" },
        { name: "a thermistor", cue: "when cold" },
      ] as const);
      const answer = answerQty(vBottom, "V");
      return {
        prompt:
          `${cap(sensor.name)} in series with a ${r1} Ω fixed resistor is connected across a ${supply} V supply. ` +
          `${cap(sensor.cue)} the ${sensor.name.replace(/^an? /, "")} has a resistance of ${r2} Ω. ` +
          `What is the potential difference across it then?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(vTop, "V"), // gave the pd across the fixed resistor instead
          wrongQty((supply * r2) / r1, "V"), // divided by the fixed resistor, not the total
          wrongQty(supply / 2, "V"), // assumed the supply splits equally
          wrongQty(supply, "V"), // gave the whole supply pd
        ]),
        explanation:
          `The two are in series, so V = ${supply} × ${r2}/(${r1} + ${r2}) = ${supply} × ${r2}/${r1 + r2} = ${answer}. ` +
          `As the sensor's resistance rises it takes a larger share of the ${supply} V, which is how the divider turns a resistance change into a voltage change.`,
        check: () => {
          const current = supply / (r1 + r2);
          if (!agrees(current * r2, vBottom)) return `IR gives ${current * r2} V, not ${vBottom} V`;
          return agrees(current * r1 + current * r2, supply)
            ? null
            : `the pds sum to ${current * r1 + current * r2} V, not ${supply} V`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Force on a charged particle
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.mag.force.bqv",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "magnetic-force",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 15,
    build: (rng) => {
      const row = rng.pick(BQV_CASES);
      const { b, qm, vm, ve } = row;
      /* sin 90° = 1, sin 30° = 0.5 and sin 0° = 0 are the only angles that keep
         this non-calculator, and they happen to be the three cases worth
         understanding: full force, half force, no force. */
      const angle = rng.pick([90, 90, 30, 0] as const);
      const sine = angle === 90 ? 1 : angle === 30 ? 0.5 : 0;
      const cosine = angle === 90 ? 0 : angle === 30 ? Math.sqrt(3) / 2 : 1;
      const charge = qm * 1e-19;
      const speed = vm * Math.pow(10, ve);
      const full = b * charge * speed;
      const force = full * sine;

      if (!tidy(force) && force !== 0) {
        /* Halving a one-decimal mantissa can produce a two-decimal one; when it
           does, ask the perpendicular case, which is always clean. */
        const answer = answerQty(full, "N");
        const particle = qm === 1.6 ? "a proton" : "an alpha particle";
        return {
          prompt:
            `${cap(particle)} travels at ${sf(vm, ve, "m/s")} at right angles to a uniform magnetic field ` +
            `of flux density ${num(b)} T. Calculate the magnetic force on it. ` +
            `(charge on an electron = ${sf(1.6, -19, "C")})`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(b * speed, "N"), // left the charge out of BQv
            wrongQty(b * charge, "N"), // left the speed out
            wrongQty((b * charge) / speed, "N"), // divided by the speed
            wrongQty(full * 2, "N"), // used 2e when the charge was already e
          ]),
          explanation:
            `F = BQv = ${num(b)} × ${sf(qm, -19, "C")} × ${sf(vm, ve, "m/s")} = ${answer}. ` +
            `Multiply the numbers and add the indices: 10⁻¹⁹ × 10${sup(ve)} = 10${sup(ve - 19)}.`,
          check: () =>
            agrees(full / (charge * speed), b)
              ? null
              : `F/(Qv) = ${full / (charge * speed)} T, which is not the stated ${b} T`,
        };
      }

      const particle =
        qm === 1.6
          ? rng.pick(["a proton", "an electron", "a singly charged ion"] as const)
          : rng.pick(["an alpha particle", "a doubly charged ion"] as const);
      const answer = answerQty(force, "N");
      const angleText =
        angle === 90
          ? "at right angles to"
          : angle === 30
            ? "at 30° to"
            : "parallel to";

      return {
        prompt:
          `${cap(particle)}, charge ${sf(qm, -19, "C")}, moves at ${sf(vm, ve, "m/s")} ` +
          `${angleText} a uniform magnetic field of flux density ${num(b)} T. ` +
          `Calculate the magnitude of the magnetic force on it.`,
        answer,
        distractors: pickDistractors(answer, [
          angle === 90 ? wrongQty(b * speed, "N") : wrongQty(full, "N"), // ignored the angle, or the charge
          wrongQty(full * cosine, "N"), // used cos θ where the sine is needed
          wrongQty(b * charge, "N"), // left the speed out
          wrongQty(b * charge * speed * 2, "N"), // doubled the charge unnecessarily
          wrongQty(charge * speed, "N"), // left the flux density out
        ]),
        explanation:
          angle === 0
            ? `F = BQv sin θ, and the particle moves along the field lines, so θ = 0 and sin θ = 0. ` +
              `It cuts no field lines, so the force is ${answer} however fast it goes.`
            : `F = BQv sin ${angle}° = ${num(b)} × ${sf(qm, -19, "C")} × ${sf(vm, ve, "m/s")}` +
              (angle === 30 ? ` × 0.5` : ``) +
              ` = ${answer}. ` +
              `Only the component of the velocity across the field counts, which is what sin θ picks out.`,
        check: () => {
          /* Rebuild the flux density from the published force. At θ = 0 there is
             nothing to invert, so check instead that the force really vanishes
             for motion along the field. */
          if (angle === 0) {
            return force === 0 ? null : `motion along the field must give zero force, not ${force} N`;
          }
          const rebuilt = force / (charge * speed * sine);
          return agrees(rebuilt, b) ? null : `F/(Qv sin θ) = ${rebuilt} T, which is not the stated ${b} T`;
        },
      };
    },
  }),

  generator({
    key: "phy.mag.force.path",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "magnetic-force",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    variants: 15,
    build: (rng) => {
      /* Half numbers, half hand rule. The direction questions carry no
         arithmetic at all but are where the marks are actually lost. */
      if (rng.bool(0.45)) {
        const velocity = rng.pick(COMPASS);
        const field = rng.pick(COMPASS.filter((d) => dot(d.v, velocity.v) === 0));
        const positive = rng.bool();
        const carrier = positive
          ? rng.pick(["a proton", "an alpha particle", "a positive ion"] as const)
          : rng.pick(["an electron", "a negative ion", "a beta-minus particle"] as const);

        /* F = qv × B, so a negative carrier feels the force the other way. */
        const forceVector = positive ? cross(velocity.v, field.v) : negate(cross(velocity.v, field.v));
        const answer = nameOf(forceVector);

        return {
          prompt:
            `${cap(carrier)} moves ${velocity.name} through a uniform magnetic field directed ${field.name}. ` +
            `In which direction is the magnetic force on it?`,
          answer,
          distractors: wrongOptions(answer, [
            opposite(answer), // the right axis, but the charge sign or hand was wrong
            velocity.name, // gave the direction of travel
            field.name, // gave the direction of the field
            opposite(field.name),
          ]),
          explanation:
            `The force is along qv × B, so it is perpendicular to both the velocity (${velocity.name}) ` +
            `and the field (${field.name}), which leaves the ${answer} axis. ` +
            (positive
              ? `The charge is positive, so the force is ${answer}.`
              : `The charge is negative, so the force is opposite to v × B, giving ${answer}.`),
          check: () => {
            /* Rebuilt from the vector identity rather than the same cross
               product: for a right-handed orthonormal set, a × b = c implies
               b × c = a. If the named answer is right, that must close. */
            const f = COMPASS.find((d) => d.name === answer)!.v;
            const signed: Vec = positive ? f : negate(f);
            if (dot(signed, velocity.v) !== 0 || dot(signed, field.v) !== 0) {
              return `${answer} is not perpendicular to both v and B`;
            }
            const rebuilt = cross(field.v, signed);
            return rebuilt.every((component, index) => component === velocity.v[index])
              ? null
              : `B × F gives ${nameOf(rebuilt as Vec)}, but the velocity is ${velocity.name}`;
          },
        };
      }

      const row = rng.pick(RADIUS_CASES);
      const { massM, massE, vm, ve, b, qm, r } = row;
      const mass = massM * Math.pow(10, massE);
      const speed = vm * Math.pow(10, ve);
      const charge = qm * 1e-19;
      const answer = answerQty(r, "m");

      return {
        prompt:
          `An ion of mass ${sf(massM, massE, "kg")} and charge ${sf(qm, -19, "C")} enters a uniform magnetic field ` +
          `of flux density ${num(b)} T at ${sf(vm, ve, "m/s")}, at right angles to the field. ` +
          `Calculate the radius of its circular path.`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty((b * charge) / (mass * speed), "m"), // turned the fraction upside down
          wrongQty((mass * speed) / b, "m"), // left the charge out
          wrongQty((mass * speed * b) / charge, "m"), // multiplied by B instead of dividing
          wrongQty(mass / (speed * b * charge), "m"), // divided by the speed as well
        ]),
        explanation:
          `The magnetic force provides the centripetal force: BQv = mv²/r, so r = mv/(BQ) = ` +
          `(${sf(massM, massE, "kg")} × ${sf(vm, ve, "m/s")}) ÷ (${num(b)} × ${sf(qm, -19, "C")}) = ${answer}. ` +
          `A heavier or faster ion curves less; a stronger field curves it more.`,
        check: () => {
          /* Check the centripetal condition directly rather than the rearranged
             formula: the magnetic force must equal mv²/r at the stated radius. */
          const magnetic = b * charge * speed;
          const centripetal = (mass * speed * speed) / r;
          return agrees(magnetic, centripetal)
            ? null
            : `BQv = ${magnetic} N but mv²/r = ${centripetal} N at r = ${r} m`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     The motor effect
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.mag.motor-effect",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "motor-effect",
    curriculumLevel: "YEAR_11",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(MOTOR_CASES);
      const { b, i, lengthCm, l, f } = row;
      const mode = rng.pick(["force", "field", "current", "length", "parallel"] as const);
      const setting = rng.pick([
        "a straight wire in a loudspeaker",
        "a copper rod resting on two horizontal rails",
        "one side of the coil in a d.c. motor",
        "a straight wire between the poles of a magnet",
        "a metal bar on a current balance",
      ] as const);

      if (mode === "parallel") {
        const answer = answerQty(0, "N");
        return {
          prompt:
            `${cap(setting)} carries a current of ${num(i)} A. ` +
            `The wire is ${lengthCm} cm long and lies ALONG the field lines of a ${num(b)} T uniform field. ` +
            `What is the magnetic force on it?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(f, "N"), // used F = BIL without checking the angle
            wrongQty(b * i * lengthCm, "N"), // that, and the length left in centimetres
            wrongQty(b * i, "N"), // left the length out as well
            wrongQty(f / 2, "N"), // assumed the force is halved rather than zero
          ]),
          explanation:
            `F = BIL sin θ, and a wire lying along the field has θ = 0, so sin θ = 0 and F = ${answer}. ` +
            `The current has to cut across the field lines to feel a force; ${answerQty(f, "N")} is what it would feel at right angles.`,
          check: () => {
            /* The perpendicular case must still work out, or the zero is
               meaningless. */
            const perpendicular = b * i * l;
            return agrees(perpendicular, f)
              ? null
              : `BIL at right angles gives ${perpendicular} N, not the ${f} N quoted as the contrast`;
          },
        };
      }

      if (mode === "force") {
        const answer = answerQty(f, "N");
        return {
          prompt:
            `${cap(setting)}, ${lengthCm} cm long, carries ${num(i)} A at right angles to a uniform magnetic field ` +
            `of flux density ${num(b)} T. Calculate the force on it.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(b * i * lengthCm, "N"), // left the length in centimetres
            wrongQty(f / 100, "N"), // converted centimetres to metres the wrong way
            wrongQty((b * i) / l, "N"), // divided by the length
            wrongQty(b + i + l, "N"), // added the three quantities
          ]),
          explanation:
            `Convert first: ${lengthCm} cm = ${num(l)} m. Then F = BIL = ${num(b)} × ${num(i)} × ${num(l)} = ${answer}. ` +
            `Leaving the length in centimetres would multiply the answer by 100.`,
          check: () => {
            /* Through work and flux rather than the formula: sliding the wire
               1 m sideways sweeps out an area L, so it cuts a flux BL, and the
               work done Fd must equal the flux cut times the current. */
            const workDone = f * 1;
            const fluxSwept = b * l * 1;
            return agrees(workDone, i * fluxSwept)
              ? null
              : `moving 1 m does ${workDone} J of work but sweeps IΔΦ = ${i * fluxSwept} J`;
          },
        };
      }

      if (mode === "field") {
        const answer = answerQty(b, "T");
        return {
          prompt:
            `${cap(setting)} of length ${lengthCm} cm carries ${num(i)} A and experiences a force of ${answerQty(f, "N")} ` +
            `when placed at right angles to a uniform field. Calculate the flux density.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(f / (i * lengthCm), "T"), // left the length in centimetres
            wrongQty((f * i) / l, "T"), // multiplied by the current instead of dividing
            wrongQty((i * l) / f, "T"), // turned the fraction upside down
            wrongQty(f / i, "T"), // left the length out entirely
          ]),
          explanation:
            `Rearranging F = BIL gives B = F/(IL) = ${answerQty(f, "N")} ÷ (${num(i)} × ${num(l)}) = ${answer}. ` +
            `The length must be in metres: ${lengthCm} cm = ${num(l)} m.`,
          check: () => {
            const workDone = f * 1;
            const fluxSwept = b * l * 1;
            return agrees(workDone, i * fluxSwept)
              ? null
              : `at ${b} T, sweeping 1 m gives IΔΦ = ${i * fluxSwept} J against ${workDone} J of work`;
          },
        };
      }

      if (mode === "current") {
        const answer = answerQty(i, "A");
        return {
          prompt:
            `A force of ${answerQty(f, "N")} acts on ${setting} of length ${lengthCm} cm ` +
            `placed at right angles to a ${num(b)} T magnetic field. What current is in the wire?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(f / (b * lengthCm), "A"), // left the length in centimetres
            wrongQty((b * l) / f, "A"), // turned the fraction upside down
            wrongQty(f / b, "A"), // left the length out entirely
            wrongQty(f * b * l, "A"), // multiplied everything together
          ]),
          explanation:
            `Rearranging F = BIL gives I = F/(BL) = ${answerQty(f, "N")} ÷ (${num(b)} × ${num(l)}) = ${answer}, ` +
            `taking ${lengthCm} cm as ${num(l)} m. Doubling the current would double the force.`,
          check: () => {
            const workDone = f * 1;
            const fluxSwept = b * l * 1;
            return agrees(workDone, i * fluxSwept)
              ? null
              : `at ${i} A the flux route gives ${i * fluxSwept} J against ${workDone} J of work`;
          },
        };
      }

      const answer = answerQty(l, "m");
      return {
        prompt:
          `${cap(setting)} carrying ${num(i)} A at right angles to a ${num(b)} T field ` +
          `experiences a force of ${answerQty(f, "N")}. What length of wire is in the field?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(lengthCm, "m"), // gave the length in centimetres
          wrongQty((b * i) / f, "m"), // turned the fraction upside down
          wrongQty(f / b, "m"), // left the current out
          wrongQty(f * b * i, "m"), // multiplied everything together
        ]),
        explanation:
          `Rearranging F = BIL gives L = F/(BI) = ${answerQty(f, "N")} ÷ (${num(b)} × ${num(i)}) = ${answer}, ` +
          `which is ${lengthCm} cm. Only the part of the wire inside the field contributes to the force.`,
        check: () => {
          const workDone = f * 1;
          const fluxSwept = b * l * 1;
          return agrees(workDone, i * fluxSwept)
            ? null
            : `a ${l} m wire sweeps IΔΦ = ${i * fluxSwept} J against ${workDone} J of work`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Transformers
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.mag.transformer.turns",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "transformers",
    curriculumLevel: "YEAR_11",
    difficulty: 4,
    variants: 15,
    build: (rng) => {
      const row = rng.pick(TRANSFORMERS);
      const { np, ns, vp, vs, stepUp } = row;
      const mode = rng.pick(["secondary-pd", "secondary-turns", "primary-turns"] as const);

      if (mode === "secondary-pd") {
        const answer = answerQty(vs, "V");
        return {
          prompt:
            `An ideal transformer has ${np} turns on its primary coil and ${ns} turns on its secondary. ` +
            `The primary is connected to a ${vp} V a.c. supply. What is the secondary potential difference?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty((vp * np) / ns, "V"), // inverted the turns ratio
            wrongQty(vp * ns, "V"), // multiplied by the turns without dividing
            wrongQty(vp, "V"), // assumed the transformer changes nothing
            wrongQty(vp + (ns - np) / 100, "V"), // added the turns difference as volts
          ]),
          explanation:
            `V_s/V_p = N_s/N_p, so V_s = ${vp} × ${ns}/${np} = ${answer}. ` +
            `More turns on the secondary means a ${stepUp ? "higher" : "lower"} secondary pd, ` +
            `and here the secondary has ${stepUp ? "more" : "fewer"} turns than the primary.`,
          check: () => {
            /* Cross-multiplied, so a flipped ratio cannot survive, and then the
               ideal power condition with a nominal 1 A secondary current. */
            if (!agrees(vp * ns, vs * np)) return `V_p N_s = ${vp * ns} but V_s N_p = ${vs * np}`;
            const secondaryCurrent = 1;
            const primaryCurrent = (vs * secondaryCurrent) / vp;
            return agrees(vp * primaryCurrent, vs * secondaryCurrent)
              ? null
              : `power in ${vp * primaryCurrent} W does not match power out ${vs * secondaryCurrent} W`;
          },
        };
      }

      if (mode === "secondary-turns") {
        const answer = answerQty(ns, "turns");
        return {
          prompt:
            `A transformer with ${np} turns on its primary changes ${vp} V into ${answerQty(vs, "V")}. ` +
            `Assuming it is ideal, how many turns are on the secondary coil?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty((np * vp) / vs, "turns"), // inverted the ratio of pds
            wrongQty(np * vs, "turns"), // multiplied by the secondary pd alone
            wrongQty(np, "turns"), // assumed the coils must match
            wrongQty(np + (vs - vp), "turns"), // added the pd difference to the turns
          ]),
          explanation:
            `N_s = N_p × V_s/V_p = ${np} × ${answerQty(vs, "V")}/${vp} V = ${answer}. ` +
            `The pd ${stepUp ? "rose" : "fell"}, so the secondary must have ${stepUp ? "more" : "fewer"} turns than the ${np} on the primary.`,
          check: () => {
            if (!agrees(vp * ns, vs * np)) return `V_p N_s = ${vp * ns} but V_s N_p = ${vs * np}`;
            return agrees(ns / np, vs / vp) ? null : `turns ratio ${ns / np} against pd ratio ${vs / vp}`;
          },
        };
      }

      const answer = answerQty(np, "turns");
      return {
        prompt:
          `An ideal transformer steps ${vp} V ${stepUp ? "up" : "down"} to ${answerQty(vs, "V")} ` +
          `using ${ns} turns on its secondary coil. How many turns are on the primary?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty((ns * vs) / vp, "turns"), // inverted the ratio of pds
          wrongQty(ns * vp, "turns"), // multiplied by the primary pd alone
          wrongQty(ns, "turns"), // assumed the coils must match
          wrongQty(ns + (vp - vs), "turns"), // added the pd difference to the turns
        ]),
        explanation:
          `N_p = N_s × V_p/V_s = ${ns} × ${vp}/${answerQty(vs, "V")} = ${answer}. ` +
          `The turns are in the same ratio as the pds, so the ${stepUp ? "larger" : "smaller"} secondary pd needs the ${stepUp ? "larger" : "smaller"} secondary coil.`,
        check: () => {
          if (!agrees(vp * ns, vs * np)) return `V_p N_s = ${vp * ns} but V_s N_p = ${vs * np}`;
          return agrees(np / ns, vp / vs) ? null : `turns ratio ${np / ns} against pd ratio ${vp / vs}`;
        },
      };
    },
  }),

  generator({
    key: "phy.mag.transformer.power",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "transformers",
    curriculumLevel: "YEAR_11",
    difficulty: 6,
    variants: 15,
    build: (rng) => {
      const row = rng.pick(TRANSFORMERS);
      const { np, ns, vp, vs, ratio, stepUp } = row;
      /* Choose the current on the HIGH-voltage side first. The other side then
         carries that current times the turns ratio, which is always exact. */
      const smallCurrent = rng.pick([0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const ip = stepUp ? exact(smallCurrent * ratio, 2, "primary current") : smallCurrent;
      const is = stepUp ? smallCurrent : exact(smallCurrent * ratio, 2, "secondary current");
      const power = exact(vp * ip, 1, "power");
      const mode = rng.pick(["secondary-current", "primary-current", "efficiency"] as const);

      if (mode === "efficiency") {
        /* The only non-ideal question here, and the loss is stated as a
           percentage that divides the input power exactly. */
        const efficiency = rng.pick([50, 60, 75, 80, 90, 95]);
        const outputPower = (power * efficiency) / 100;
        if (!tidy(outputPower)) {
          const answer = answerQty(power, "W");
          return {
            prompt:
              `An ideal transformer supplies ${answerQty(is, "A")} at ${answerQty(vs, "V")} from a ${vp} V mains supply. ` +
              `What power does it draw from the supply?`,
            answer,
            distractors: pickDistractors(answer, [
              wrongQty(vs * ip, "W"), // paired the secondary pd with the primary current
              wrongQty(vp * is, "W"), // paired the primary pd with the secondary current
              wrongQty(power / ratio, "W"), // assumed the transformer scales the power
              wrongQty(power * ratio, "W"),
            ]),
            explanation:
              `An ideal transformer wastes nothing, so the input power equals the output power: ` +
              `P = ${answerQty(vs, "V")} × ${answerQty(is, "A")} = ${answer}. ` +
              `The pd and the current change in opposite directions and their product does not change.`,
            check: () =>
              agrees(vp * ip, vs * is) ? null : `V_pI_p = ${vp * ip} W but V_sI_s = ${vs * is} W`,
          };
        }
        const answer = answerQty(outputPower, "W");
        return {
          prompt:
            `A transformer draws ${answerQty(ip, "A")} from a ${vp} V supply and is ${efficiency}% efficient. ` +
            `What is the power output of its secondary coil?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(power, "W"), // assumed the transformer is ideal
            wrongQty((power * 100) / efficiency, "W"), // divided by the efficiency instead of multiplying
            wrongQty(power - efficiency, "W"), // subtracted the percentage as a number of watts
            wrongQty(power * efficiency, "W"), // forgot to divide the percentage by 100
          ]),
          explanation:
            `Input power = V_pI_p = ${vp} × ${num(ip)} = ${answerQty(power, "W")}. ` +
            `At ${efficiency}% efficiency the output is ${efficiency}/100 × ${answerQty(power, "W")} = ${answer}, ` +
            `and the missing ${answerQty(power - outputPower, "W")} heats the core and the windings.`,
          check: () => {
            const wasted = power - outputPower;
            return agrees(outputPower + wasted, power)
              ? null
              : `${outputPower} W out plus ${wasted} W wasted is not the ${power} W drawn`;
          },
        };
      }

      if (mode === "secondary-current") {
        const answer = answerQty(is, "A");
        return {
          prompt:
            `An ideal transformer with ${np} primary turns and ${ns} secondary turns is connected to a ${vp} V supply ` +
            `and draws ${answerQty(ip, "A")}. What current flows in the secondary circuit?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(stepUp ? ip * ratio : ip / ratio, "A"), // scaled the current the same way as the pd
            wrongQty(ip, "A"), // assumed the current is unchanged
            wrongQty(power * vs, "A"), // multiplied the power by the pd
            wrongQty(vs / vp, "A"), // gave the turns ratio as a current
          ]),
          explanation:
            `An ideal transformer conserves power: V_pI_p = V_sI_s, so ` +
            `I_s = (${vp} × ${num(ip)}) ÷ ${answerQty(vs, "V")} = ${answerQty(power, "W")} ÷ ${answerQty(vs, "V")} = ${answer}. ` +
            `The pd was stepped ${stepUp ? "up" : "down"}, so the current is stepped ${stepUp ? "down" : "up"} by the same factor.`,
          check: () => {
            if (!agrees(vp * ip, vs * is)) return `V_pI_p = ${vp * ip} W but V_sI_s = ${vs * is} W`;
            return agrees(is / ip, np / ns) ? null : `I_s/I_p = ${is / ip} against N_p/N_s = ${np / ns}`;
          },
        };
      }

      const answer = answerQty(ip, "A");
      return {
        prompt:
          `An ideal transformer supplies ${answerQty(is, "A")} at ${answerQty(vs, "V")} to a load. ` +
          `Its primary is connected to a ${vp} V supply. What current does the primary draw?`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(stepUp ? is / ratio : is * ratio, "A"), // scaled the current the same way as the pd
          wrongQty(is, "A"), // assumed the current is unchanged
          wrongQty(power * vp, "A"), // multiplied the power by the pd
          wrongQty(vp / vs, "A"), // gave the turns ratio as a current
        ]),
        explanation:
          `Power out = ${answerQty(vs, "V")} × ${num(is)} A = ${answerQty(power, "W")}, and an ideal transformer wastes none of it. ` +
          `So I_p = ${answerQty(power, "W")} ÷ ${vp} V = ${answer}. ` +
          `The primary is at the ${stepUp ? "lower" : "higher"} pd, so it carries the ${stepUp ? "larger" : "smaller"} current.`,
        check: () => {
          if (!agrees(vp * ip, vs * is)) return `V_pI_p = ${vp * ip} W but V_sI_s = ${vs * is} W`;
          return agrees(ip / is, ns / np) ? null : `I_p/I_s = ${ip / is} against N_s/N_p = ${ns / np}`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Electromagnetic induction
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.mag.induction",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "electromagnetic-induction",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const mode = rng.pick(["faraday", "faraday", "motional", "motional", "time", "lenz"] as const);

      if (mode === "lenz") {
        /* No arithmetic, and the marks most often dropped in this topic. */
        const pole = rng.pick(["north", "south"] as const);
        const towards = rng.bool();
        const coil = rng.pick(COILS);
        const askForce = rng.bool();
        /* Lenz: the induced current always opposes the change. Approaching a
           pole makes the near face the SAME pole (repulsion); withdrawing it
           makes the near face the OPPOSITE pole (attraction). */
        const nearFace = towards ? pole : pole === "north" ? "south" : "north";
        const forceAnswer = towards
          ? "A repulsive force, opposing the magnet's approach"
          : "An attractive force, opposing the magnet's withdrawal";

        if (askForce) {
          return {
            prompt:
              `The ${pole} pole of a bar magnet is moved ${towards ? "towards" : "away from"} one end of ${coil}. ` +
              `What force does the coil exert on the magnet while it moves?`,
            answer: forceAnswer,
            distractors: wrongOptions(forceAnswer, [
              towards
                ? "An attractive force, pulling the magnet in faster"
                : "A repulsive force, pushing the magnet away faster", // ignored the minus sign in Faraday's law
              "No force, because the coil is not connected to a supply", // thought an induced current needs a battery
              "A force at right angles to the magnet's motion", // confused it with the motor effect on a wire
            ]),
            explanation:
              `The flux through the coil is changing, so a current is induced, and by Lenz's law it opposes the change. ` +
              `The near face of the coil becomes a ${nearFace} pole, which ${towards ? "repels the approaching" : "attracts the retreating"} ${pole} pole. ` +
              `Work must be done against that force, and that work is the source of the electrical energy.`,
            check: () => {
              /* The two ways of stating Lenz's law have to agree: same pole
                 facing the magnet means repulsion, opposite means attraction. */
              const repels = nearFace === pole;
              return repels === towards
                ? null
                : `a ${nearFace} near face against a ${pole} pole moving ${towards ? "in" : "out"} is inconsistent`;
            },
          };
        }

        const answer = `A ${nearFace} pole`;
        return {
          prompt:
            `The ${pole} pole of a bar magnet is pushed ${towards ? "towards" : "away from"} the end of ${coil}. ` +
            `Which magnetic pole does that end of the coil become while the magnet moves?`,
          answer,
          distractors: wrongOptions(answer, [
            `A ${nearFace === "north" ? "south" : "north"} pole`, // applied Lenz's law the wrong way round
            "Neither — the coil has no current in it", // thought an induced current needs a battery
            "It alternates too quickly to say", // confused steady motion with a.c.
          ]),
          explanation:
            `By Lenz's law the induced current opposes the change producing it. ` +
            `The magnet is moving ${towards ? "in, so the coil must push it back out" : "out, so the coil must pull it back in"}, ` +
            `which means the near face becomes a ${nearFace} pole against the magnet's ${pole} pole.`,
          check: () => {
            const repels = nearFace === pole;
            return repels === towards
              ? null
              : `a ${nearFace} near face cannot oppose a ${pole} pole moving ${towards ? "in" : "out"}`;
          },
        };
      }

      if (mode === "motional") {
        const row = rng.pick(MOTIONAL_CASES);
        const { b, lengthCm, l, v, emf } = row;
        const answer = answerQty(emf, "V");
        const scene = rng.pick([
          "A metal rod slides along horizontal rails",
          "An aircraft wing moves through the vertical component of the Earth's field",
          "A copper bar is pulled across a magnetic field",
          "A metal axle rolls along a track",
        ] as const);
        return {
          prompt:
            `${scene}. The conductor is ${lengthCm} cm long, moves at ${num(v)} m/s ` +
            `and cuts a uniform magnetic field of flux density ${num(b)} T at right angles. ` +
            `Calculate the emf induced across its ends.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(b * lengthCm * v, "V"), // left the length in centimetres
            wrongQty(b * l, "V"), // left the speed out
            wrongQty((b * l) / v, "V"), // divided by the speed
            wrongQty(b * l * v * v, "V"), // squared the speed
          ]),
          explanation:
            `ε = BLv = ${num(b)} × ${num(l)} × ${num(v)} = ${answer}, taking ${lengthCm} cm as ${num(l)} m. ` +
            `In one second the conductor sweeps out ${answerQty(l * v, "m²")}, cutting ${answer} worth of flux every second.`,
          check: () => {
            /* Faraday's law directly: the flux swept in one second, divided by
               that second, must be the same emf. */
            const areaPerSecond = l * v;
            const fluxPerSecond = b * areaPerSecond;
            return agrees(fluxPerSecond / 1, emf)
              ? null
              : `the rod sweeps ${fluxPerSecond} Wb per second, implying ${fluxPerSecond} V, not ${emf} V`;
          },
        };
      }

      const row = rng.pick(FARADAY_CASES);
      const { areaCm, area, turns, linkage, dt, emf, b } = row;

      if (mode === "time") {
        const answer = answerQty(dt, "s");
        return {
          prompt:
            `The flux linkage through a ${turns}-turn coil falls from ${answerQty(linkage, "Wb turns")} to zero, ` +
            `inducing an average emf of ${answerQty(emf, "V")}. Over what time does the change happen?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(linkage * emf, "s"), // multiplied instead of dividing
            wrongQty(emf / linkage, "s"), // inverted the fraction
            wrongQty(linkage / (emf * turns), "s"), // divided by the turns a second time
            wrongQty((linkage * turns) / emf, "s"), // multiplied by the turns a second time
          ]),
          explanation:
            `Faraday's law gives ε = Δ(NΦ)/Δt, so Δt = Δ(NΦ)/ε = ` +
            `${answerQty(linkage, "Wb turns")} ÷ ${answerQty(emf, "V")} = ${answer}. ` +
            `A slower collapse of the same flux linkage would induce a smaller emf.`,
          check: () => {
            /* Rebuild the flux linkage from the coil geometry, then check the
               rate of change against the published time. */
            const rebuiltLinkage = turns * b * area;
            if (!agrees(rebuiltLinkage, linkage)) return `NBA = ${rebuiltLinkage}, not ${linkage} Wb turns`;
            return agrees(rebuiltLinkage / dt, emf)
              ? null
              : `${rebuiltLinkage} Wb turns in ${dt} s is ${rebuiltLinkage / dt} V, not ${emf} V`;
          },
        };
      }

      const answer = answerQty(emf, "V");
      const removal = rng.pick([
        "is pulled out of the field",
        "has the field switched off",
        "is turned through 90° out of the field",
        "has the magnet removed from it",
      ] as const);
      return {
        prompt:
          `A ${turns}-turn coil of area ${areaCm} cm² lies at right angles to a uniform magnetic field of flux density ${num(b)} T. ` +
          `The coil ${removal} in ${num(dt)} s, so the flux through it falls to zero. ` +
          `Calculate the average emf induced.`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty((b * area) / dt, "V"), // forgot to multiply by the number of turns
          wrongQty((turns * b * areaCm) / dt, "V"), // left the area in cm²
          wrongQty(turns * b * area * dt, "V"), // multiplied by the time instead of dividing
          wrongQty(b / dt, "V"), // used the flux density in place of the flux
        ]),
        explanation:
          `The initial flux linkage is NΦ = NBA = ${turns} × ${num(b)} × ${sf(areaCm, -4, "m²")} = ${answerQty(linkage, "Wb turns")}. ` +
          `It falls to zero in ${num(dt)} s, so ε = Δ(NΦ)/Δt = ${answerQty(linkage, "Wb turns")} ÷ ${num(dt)} s = ${answer}. ` +
          `Forgetting the ${turns} turns is the usual way to lose this mark.`,
        check: () => {
          /* Rebuilt as a rate of change per turn, then multiplied up — a
             different order of operations from the build. */
          const emfPerTurn = (b * area) / dt;
          const rebuilt = emfPerTurn * turns;
          return agrees(rebuilt, emf)
            ? null
            : `${emfPerTurn} V per turn across ${turns} turns is ${rebuilt} V, not ${emf} V`;
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Magnetic flux and flux linkage
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.mag.flux-linkage",
    subject: "physics",
    topic: "phy-magnetism",
    subtopic: "flux-linkage",
    curriculumLevel: "YEAR_12",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(FLUX_CASES);
      const { b, areaCm, area, turns, flux, linkage } = row;
      const mode = rng.pick(["flux", "linkage", "angle", "field"] as const);

      if (mode === "flux") {
        const answer = answerQty(flux, "Wb");
        const shape = rng.pick([
          "A flat square coil",
          "A single rectangular loop of wire",
          "A flat circular coil",
          "A single turn of wire",
        ] as const);
        return {
          prompt:
            `${shape} of area ${areaCm} cm² is placed with its plane perpendicular to a uniform magnetic field ` +
            `of flux density ${num(b)} T. Calculate the magnetic flux through it.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(b * areaCm, "Wb"), // left the area in cm²
            wrongQty(b / area, "Wb"), // divided by the area instead of multiplying
            wrongQty(area / b, "Wb"), // inverted the product
            wrongQty(b * area * 1e4, "Wb"), // converted cm² to m² the wrong way
          ]),
          explanation:
            `Convert the area first: ${areaCm} cm² = ${sf(areaCm, -4, "m²")}, since 1 cm² = 10⁻⁴ m². ` +
            `Then Φ = BA = ${num(b)} × ${sf(areaCm, -4, "m²")} = ${answer}. ` +
            `A weber is a tesla metre squared, which is why the area has to be in m².`,
          check: () => {
            /* Rebuild the flux density from the published flux and the area
               converted independently. */
            const areaFromCm = areaCm / 10000;
            const rebuilt = flux / areaFromCm;
            return agrees(rebuilt, b) ? null : `Φ/A = ${rebuilt} T, which is not the stated ${b} T`;
          },
        };
      }

      if (mode === "linkage") {
        const answer = answerQty(linkage, "Wb turns");
        return {
          prompt:
            `A coil of ${turns} turns and cross-sectional area ${areaCm} cm² lies with its plane at right angles ` +
            `to a uniform magnetic field of flux density ${num(b)} T. Calculate the flux linkage.`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(flux, "Wb turns"), // gave the flux, forgetting the turns
            wrongQty(turns * b * areaCm, "Wb turns"), // left the area in cm²
            wrongQty(turns * turns * flux, "Wb turns"), // multiplied by the turns twice
            wrongQty(flux / turns, "Wb turns"), // divided by the turns instead of multiplying
          ]),
          explanation:
            `The flux through one turn is Φ = BA = ${num(b)} × ${sf(areaCm, -4, "m²")} = ${answerQty(flux, "Wb")}. ` +
            `Flux linkage is NΦ = ${turns} × ${answerQty(flux, "Wb")} = ${answer}. ` +
            `Every turn links the same flux, so the linkage is ${turns} times as large as the flux.`,
          check: () => {
            /* Divide back out: the linkage per turn must be the flux, and that
               flux must be BA with the area converted separately. */
            const perTurn = linkage / turns;
            if (!agrees(perTurn, flux)) return `NΦ/N = ${perTurn} Wb, not the ${flux} Wb through one turn`;
            return agrees(perTurn, b * (areaCm / 10000))
              ? null
              : `BA = ${b * (areaCm / 10000)} Wb against ${perTurn} Wb per turn`;
          },
        };
      }

      if (mode === "angle") {
        /* cos 0° = 1, cos 60° = 0.5 and cos 90° = 0 are the only angles that
           stay non-calculator, and θ is measured from the NORMAL to the coil,
           which is the convention every board uses. */
        const angle = rng.pick([60, 60, 90] as const);
        const cosine = angle === 60 ? 0.5 : 0;
        const value = linkage * cosine;
        const answer = answerQty(value, "Wb turns");
        return {
          prompt:
            `A ${turns}-turn coil of area ${areaCm} cm² sits in a uniform ${num(b)} T magnetic field, ` +
            `with the field at ${angle}° to the normal to the plane of the coil. ` +
            `What is the flux linkage through the coil?`,
          answer,
          distractors: pickDistractors(answer, [
            wrongQty(linkage, "Wb turns"), // ignored the angle altogether
            wrongQty(linkage * (angle === 60 ? Math.sqrt(3) / 2 : 1), "Wb turns"), // used sin θ instead of cos θ
            wrongQty(flux * cosine, "Wb turns"), // forgot the number of turns
            wrongQty(linkage * angle, "Wb turns"), // multiplied by the angle in degrees
          ]),
          explanation:
            angle === 90
              ? `NΦ = BAN cos θ, and at 90° to the normal the field lies IN the plane of the coil, so cos 90° = 0 and the linkage is ${answer}. ` +
                `No field lines pass through the coil at all, however strong the field is.`
              : `NΦ = BAN cos θ = ${num(b)} × ${sf(areaCm, -4, "m²")} × ${turns} × cos 60° = ${answerQty(linkage, "Wb turns")} × 0.5 = ${answer}. ` +
                `θ is measured from the normal to the coil, so cos θ — not sin θ — picks out the component of the field passing through it.`,
          check: () => {
            /* The perpendicular case must reproduce BAN, and the angled case
               must be that value scaled by the cosine. */
            const straightOn = turns * b * (areaCm / 10000);
            if (!agrees(straightOn, linkage)) return `BAN = ${straightOn}, not ${linkage} Wb turns`;
            return agrees(straightOn * cosine, value)
              ? null
              : `${straightOn} × cos ${angle}° = ${straightOn * cosine}, not ${value}`;
          },
        };
      }

      const answer = answerQty(b, "T");
      return {
        prompt:
          `A coil of ${turns} turns, each of area ${areaCm} cm², has a flux linkage of ${answerQty(linkage, "Wb turns")} ` +
          `when its plane is perpendicular to a uniform magnetic field. Calculate the flux density.`,
        answer,
        distractors: pickDistractors(answer, [
          wrongQty(linkage / area, "T"), // forgot to divide by the number of turns
          wrongQty(linkage / (turns * areaCm), "T"), // left the area in cm²
          wrongQty((linkage * turns) / area, "T"), // multiplied by the turns instead of dividing
          wrongQty(linkage / turns, "T"), // stopped at the flux and called it a flux density
        ]),
        explanation:
          `NΦ = BAN, so B = NΦ/(NA) = ${answerQty(linkage, "Wb turns")} ÷ (${turns} × ${sf(areaCm, -4, "m²")}) = ${answer}. ` +
          `The flux through a single turn is ${answerQty(flux, "Wb")}, and dividing that by the area gives the same ${answer}.`,
        check: () => {
          const perTurn = linkage / turns;
          const rebuilt = perTurn / (areaCm / 10000);
          return agrees(rebuilt, b) ? null : `Φ/A = ${rebuilt} T, which is not the stated ${b} T`;
        },
      };
    },
  }),
];
