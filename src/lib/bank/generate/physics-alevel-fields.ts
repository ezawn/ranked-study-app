/**
 * Physics A-Level: Fields, Capacitance and Thermal Physics.
 *
 * The last physics file, and the one where the constants fight hardest against
 * mental arithmetic. G is 6.67 × 10⁻¹¹ and R is 8.31; almost nothing built
 * directly from them divides. Three responses, used throughout:
 *
 * INVERSE-SQUARE QUESTIONS ARE ASKED AS RATIOS. "Three times as far, so a ninth
 * of the field" is the physics; evaluating GM/r² is data entry. Every
 * gravitational question here gives a value at one distance and asks for it at
 * another, which is also how the examiners ask it.
 *
 * COULOMB'S LAW USES k = 9 × 10⁹, WHICH DIVIDES. Charges in microcoulombs and
 * whole-metre separations give answers like 4 × 10⁻³ N with nothing left over.
 *
 * GAS QUESTIONS USE THE COMBINED LAW, NOT pV = nRT. p₁V₁/T₁ = p₂V₂/T₂ has no
 * constants in it at all, so every quantity cancels and the arithmetic is a
 * ratio. Temperatures are in kelvin and chosen to divide.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  agrees,
  answer as ans,
  cap,
  CONSTANTS,
  exact,
  M3,
  NKG,
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

/** Coulomb's law cases where kQ₁Q₂/r² has a short mantissa. */
const COULOMB: readonly { q1: number; q2: number; r: number; f: number }[] = (() => {
  const out: { q1: number; q2: number; r: number; f: number }[] = [];
  const charges = [1e-6, 2e-6, 3e-6, 4e-6, 5e-6, 6e-6, 1e-5, 2e-5, 1e-9, 2e-9, 5e-9];
  for (const q1 of charges) {
    for (const q2 of charges) {
      for (const r of [0.1, 0.2, 0.3, 0.5, 1, 2, 3, 5, 10]) {
        const f = (CONSTANTS.ke * q1 * q2) / (r * r);
        if (f < 1e-6 || f > 1e4) continue;
        /* `tidy` asks `answer()` directly. Checking the standard-form mantissa
           instead was wrong for values between 0.1 and 10⁵, where `answer()`
           writes the number out in full and allows only two decimal places —
           0.162 N passed the mantissa test and then threw. */
        if (!tidy(f)) continue;
        out.push({ q1, q2, r, f });
      }
    }
  }
  return out;
})();

/** Capacitor cases where Q = CV and ½CV² are both tidy. */
const CAPACITORS: readonly { c: number; v: number; q: number; e: number }[] = (() => {
  const out: { c: number; v: number; q: number; e: number }[] = [];
  const caps = [1e-6, 2e-6, 4e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 1e-3];
  for (const c of caps) {
    for (const v of [2, 4, 5, 6, 10, 12, 20, 24, 50, 100, 200]) {
      const q = c * v;
      const e = 0.5 * c * v * v;
      const qm = toStandardForm(q).mantissa;
      const em = toStandardForm(e).mantissa;
      if (!tidy(qm) || !tidy(em)) continue;
      out.push({ c, v, q, e });
    }
  }
  return out;
})();

/** Combined gas law cases where every quantity divides. */
const GAS: readonly { p1: number; v1: number; t1: number; p2: number; v2: number; t2: number }[] = (() => {
  const out: { p1: number; v1: number; t1: number; p2: number; v2: number; t2: number }[] = [];
  for (const p1 of [100, 120, 150, 200, 240, 300, 400, 500]) {
    for (const v1 of [1, 2, 3, 4, 5, 6, 10]) {
      for (const t1 of [200, 250, 300, 400, 500, 600]) {
        for (const t2 of [200, 250, 300, 400, 500, 600, 750, 800]) {
          if (t1 === t2) continue;
          for (const v2 of [1, 2, 3, 4, 5, 6, 10]) {
            const p2 = (p1 * v1 * t2) / (t1 * v2);
            if (!tidy(p2) || p2 < 10 || p2 > 5000) continue;
            out.push({ p1, v1, t1, p2, v2, t2 });
          }
        }
      }
    }
  }
  return out;
})();

/** RC circuits whose time constant is a round number of seconds. */
const RC: readonly { r: number; c: number; tau: number }[] = (() => {
  const out: { r: number; c: number; tau: number }[] = [];
  for (const r of [1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6]) {
    for (const c of [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 1e-3]) {
      const tau = r * c;
      if (tau < 0.1 || tau > 200) continue;
      if (!tidy(tau)) continue;
      out.push({ r, c, tau });
    }
  }
  return out;
})();

/**
 * Heater, time and mass combinations giving a tidy temperature rise in water.
 *
 * Enumerated, because 4200 J/kg/°C divides almost nothing: drawing the three
 * independently produced a usable case roughly once in fifty, so the generator
 * fell back to the same fixed question every time and the framework refused it
 * as a duplicate.
 */
const HEATERS: readonly { p: number; t: number; m: number; rise: number }[] = (() => {
  const out: { p: number; t: number; m: number; rise: number }[] = [];
  for (const p of [420, 630, 840, 1050, 1260, 1680, 2100, 2520, 3150, 4200]) {
    for (const t of [10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 240, 300]) {
      for (const m of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 10]) {
        const rise = (p * t) / (m * 4200);
        if (rise < 2 || rise > 90) continue;
        if (!tidy(rise)) continue;
        out.push({ p, t, m, rise });
      }
    }
  }
  return out;
})();

const PLANETS = ["a planet", "a moon", "an asteroid", "a distant world", "a gas giant"];
const CHARGES_CONTEXT = ["two small charged spheres", "two point charges", "a proton and an alpha particle", "two charged pith balls"];

/* ==========================================================================
   The generators
   ========================================================================== */

export const physicsALevelFields: Generator[] = [
  /* ------------------------------------------------------------------------
     Gravitational fields — asked as ratios
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.fields.g-inverse-square",
    subject: "physics",
    topic: "phy-fields",
    subtopic: "gravitational-field-strength",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      /* Field at one radius given, asked at another. The constants cancel, so
         the question is purely the inverse-square law — which is the physics. */
      const gSurface = rng.pick([1.6, 2, 2.5, 3.6, 4, 5, 8, 9, 10, 12.5, 16, 20, 25, 36]);
      const factor = rng.pick([2, 3, 4, 5, 6]);
      const gOut = gSurface / (factor * factor);
      if (!tidy(gOut)) return buildFieldFallback();

      const body = rng.pick(PLANETS);
      const answer = ans(gOut, NKG);

      return {
        prompt:
          `The gravitational field strength at the surface of ${body} is ${num(gSurface)} ${NKG}. ` +
          `What is the field strength at a distance of ${factor} planetary radii from its centre?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(gSurface / factor, NKG), // used 1/r rather than 1/r²
          slip(gSurface * factor * factor, NKG), // multiplied instead of dividing
          slip(gSurface, NKG), // said it is unchanged
          slip(gSurface / (factor * factor * factor), NKG), // cubed instead of squared
        ]),
        explanation:
          `g = GM ÷ r², so g is inversely proportional to the SQUARE of the distance from the centre. ` +
          `At ${factor} radii the distance is ${factor} times greater, so the field is ${factor}² = ${factor * factor} times weaker: ` +
          `${num(gSurface)} ÷ ${factor * factor} = ${answer}. ` +
          `Distances are always measured from the CENTRE, not from the surface.`,
        check: () =>
          agrees(gOut * factor * factor, gSurface)
            ? null
            : `scaling back up gives ${gOut * factor * factor}, not ${gSurface}`,
      };
    },
  }),

  generator({
    key: "phy.fields.g-potential",
    subject: "physics",
    topic: "phy-fields",
    subtopic: "gravitational-potential",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      /* V = −GM/r is inverse-FIRST-power, which is the distinction being tested. */
      const vSurface = rng.pick([-6, -8, -12, -16, -20, -24, -30, -36, -40, -60]);
      const factor = rng.pick([2, 3, 4, 5, 6]);
      const vOut = vSurface / factor;
      if (!tidy(Math.abs(vOut))) return buildPotentialFallback();

      const body = rng.pick(PLANETS);
      const answer = ans(vOut, "MJ/kg");

      return {
        prompt:
          `The gravitational potential at the surface of ${body} is ${num(vSurface)} MJ/kg. ` +
          `What is the potential at a distance of ${factor} planetary radii from its centre?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(vSurface / (factor * factor), "MJ/kg"), // used the inverse-square law by mistake
          slip(-vOut, "MJ/kg"), // dropped the minus sign
          slip(vSurface * factor, "MJ/kg"), // multiplied instead of dividing
          slip(vSurface, "MJ/kg"), // said it is unchanged
        ]),
        explanation:
          `V = −GM ÷ r, so potential is inversely proportional to the distance itself, NOT to its square — that is the difference between potential and field strength. ` +
          `At ${factor} radii: ${num(vSurface)} ÷ ${factor} = ${answer}. ` +
          `It stays negative because the zero of potential is defined at infinity, and work must be done to escape to there.`,
        check: () => {
          if (vOut >= 0) return `gravitational potential cannot be ${vOut}`;
          return agrees(vOut * factor, vSurface) ? null : `scaling back gives ${vOut * factor}, not ${vSurface}`;
        },
      };
    },
  }),

  generator({
    key: "phy.fields.orbits",
    subject: "physics",
    topic: "phy-fields",
    subtopic: "orbits",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      /* Kepler's third law as a ratio: T² ∝ r³, so a radius factor that is a
         perfect square gives a period factor that is a whole number. */
      const radiusFactor = rng.pick([4, 9, 16, 25] as const);
      const periodFactor = Math.pow(radiusFactor, 1.5);
      const t1 = rng.pick([1, 2, 4, 5, 10, 20, 100]);
      const t2 = t1 * periodFactor;
      if (!tidy(t2)) return buildOrbitFallback();

      const answer = ans(t2, "days");

      return {
        prompt:
          `Two satellites orbit the same planet. The first has an orbital period of ${num(t1)} days. ` +
          `The second orbits at ${radiusFactor} times the radius. What is its orbital period?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(t1 * radiusFactor, "days"), // assumed period is proportional to radius
          slip(t1 * radiusFactor * radiusFactor, "days"), // squared the radius factor
          slip(t1 * Math.sqrt(radiusFactor), "days"), // took the square root instead
          slip(t1, "days"), // said it is unchanged
        ]),
        explanation:
          `Kepler's third law: T² ∝ r³. Multiplying r by ${radiusFactor} multiplies T² by ${radiusFactor}³ = ${Math.pow(radiusFactor, 3)}, ` +
          `so T is multiplied by √${Math.pow(radiusFactor, 3)} = ${num(periodFactor)}. ` +
          `${num(t1)} × ${num(periodFactor)} = ${answer}. Orbiting further out always means orbiting slower AND further.`,
        check: () => {
          /* Verify the law itself rather than the arithmetic that used it. */
          const lhs = (t2 / t1) * (t2 / t1);
          const rhs = Math.pow(radiusFactor, 3);
          return agrees(lhs, rhs) ? null : `T² ratio is ${lhs} but r³ ratio is ${rhs}`;
        },
      };
    },
  }),

  generator({
    key: "phy.fields.coulomb",
    subject: "physics",
    topic: "phy-fields",
    subtopic: "coulombs-law",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(COULOMB);
      const context = rng.pick(CHARGES_CONTEXT);
      const answer = ans(row.f, "N");

      return {
        prompt:
          `Take k = 9 × 10${sup(9)} N m² C⁻². ${cap(context)} carrying charges of ${ans(row.q1, "C")} and ${ans(row.q2, "C")} ` +
          `are ${num(row.r)} m apart. What is the electrostatic force between them?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((CONSTANTS.ke * row.q1 * row.q2) / row.r, "N"), // forgot to square the separation
          slip(CONSTANTS.ke * row.q1 * row.q2 * row.r * row.r, "N"), // multiplied by r² instead of dividing
          slip((row.q1 * row.q2) / (row.r * row.r), "N"), // left k out entirely
          slip((CONSTANTS.ke * (row.q1 + row.q2)) / (row.r * row.r), "N"), // added the charges instead of multiplying
        ]),
        explanation:
          `F = kQ₁Q₂ ÷ r² = 9 × 10${sup(9)} × ${ans(row.q1, "C")} × ${ans(row.q2, "C")} ÷ ${num(row.r)}² = ${answer}. ` +
          `The separation is squared, exactly as in gravitation — the two inverse-square laws have identical form, and only the constant and the sign of the interaction differ.`,
        check: () =>
          agrees((row.f * row.r * row.r) / (CONSTANTS.ke * row.q1), row.q2)
            ? null
            : `working back gives a second charge of ${(row.f * row.r * row.r) / (CONSTANTS.ke * row.q1)} C, not ${row.q2}`,
      };
    },
  }),

  generator({
    key: "phy.fields.e-field-plates",
    subject: "physics",
    topic: "phy-fields",
    subtopic: "electric-field-strength",
    curriculumLevel: "YEAR_13",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* Uniform field between plates: E = V/d, which needs no constants. */
      const v = rng.pick([10, 20, 40, 50, 60, 100, 120, 200, 240, 500, 1000, 2000, 5000]);
      const dMm = rng.pick([2, 4, 5, 8, 10, 20, 25, 40, 50]);
      const d = dMm / 1000;
      const e = v / d;
      if (!tidy(toStandardForm(e).mantissa)) return buildPlatesFallback();

      const asked = rng.bool();
      const answer = asked ? ans(e, "V/m") : ans(v, "V");

      if (asked) {
        return {
          prompt:
            `Two parallel plates ${dMm} mm apart have a potential difference of ${num(v)} V between them. ` +
            `What is the electric field strength between the plates?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(v / dMm, "V/m"), // left the separation in millimetres
            slip(v * d, "V/m"), // multiplied instead of dividing
            slip(d / v, "V/m"), // inverted the division
            slip(v, "V/m"), // gave the potential difference
          ]),
          explanation:
            `E = V ÷ d with d in metres: ${dMm} mm = ${num(d)} m, so E = ${num(v)} ÷ ${num(d)} = ${answer}. ` +
            `The field between parallel plates is uniform, so it is the same everywhere between them — unlike a radial field, it does not fall off with distance.`,
          check: () => (agrees(e * d, v) ? null : `Ed gives ${e * d} V, not ${v} V`),
        };
      }

      return {
        prompt:
          `A uniform electric field of ${ans(e, "V/m")} exists between two parallel plates ${dMm} mm apart. ` +
          `What is the potential difference between them?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(e * dMm, "V"), // left the separation in millimetres
          slip(e / d, "V"), // divided instead of multiplying
          slip(d / e, "V"), // inverted entirely
          slip(e, "V"), // gave the field strength
        ]),
        explanation:
          `Rearranging E = V ÷ d gives V = Ed = ${ans(e, "V/m")} × ${num(d)} = ${answer}. ` +
          `Volts per metre times metres leaves volts, which is the quickest check that the units were converted.`,
        check: () => (agrees(e * d, v) ? null : `Ed gives ${e * d} V, not ${v} V`),
      };
    },
  }),

  generator({
    key: "phy.fields.e-potential",
    subject: "physics",
    topic: "phy-fields",
    subtopic: "electric-potential",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      /* Work done moving a charge through a potential difference: W = QV. */
      const q = rng.pick([1e-6, 2e-6, 4e-6, 5e-6, 1e-5, 2e-5, 1.6e-19, 3.2e-19]);
      const v = rng.pick([2, 5, 10, 20, 50, 100, 200, 500, 1000]);
      const w = q * v;
      if (!tidy(toStandardForm(w).mantissa)) return buildWorkFallback();

      const particle = q < 1e-18 ? (q > 2e-19 ? "an alpha particle" : "an electron") : "a small charged sphere";
      const answer = ans(w, "J");

      return {
        prompt:
          `${cap(particle)} carrying a charge of ${ans(q, "C")} is moved through a potential difference of ${num(v)} V. ` +
          `How much work is done on it?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(q / v, "J"), // divided instead of multiplying
          slip(v / q, "J"), // inverted the division
          slip(v, "J"), // gave the potential difference
          slip(q, "J"), // gave the charge
        ]),
        explanation:
          `W = QV = ${ans(q, "C")} × ${num(v)} = ${answer}. ` +
          `A volt is a joule per coulomb, so multiplying coulombs by volts leaves joules — which is why the electronvolt is such a convenient unit.`,
        check: () => (agrees(w / v, q) ? null : `W ÷ V gives ${w / v} C, not ${q} C`),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Capacitance
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.cap.charge",
    subject: "physics",
    topic: "phy-capacitance",
    subtopic: "capacitor-charge",
    curriculumLevel: "YEAR_13",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(CAPACITORS);
      const asked = rng.pick(["charge", "voltage", "capacitance"] as const);

      if (asked === "charge") {
        const answer = ans(row.q, "C");
        return {
          prompt:
            `A capacitor of capacitance ${ans(row.c, "F")} is charged to a potential difference of ${num(row.v)} V. ` +
            `How much charge does it store?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.c / row.v, "C"), // divided instead of multiplying
            slip(row.v / row.c, "C"), // inverted the division
            slip(0.5 * row.c * row.v, "C"), // borrowed the half from the energy equation
            slip(row.v, "C"), // gave the voltage
          ]),
          explanation:
            `Q = CV = ${ans(row.c, "F")} × ${num(row.v)} = ${answer}. ` +
            `Capacitance is charge per volt, so a farad is a coulomb per volt — and a farad is enormous, which is why real capacitors are quoted in microfarads.`,
          check: () => (agrees(row.q / row.v, row.c) ? null : `Q ÷ V gives ${row.q / row.v} F, not ${row.c}`),
        };
      }

      if (asked === "voltage") {
        const answer = ans(row.v, "V");
        return {
          prompt:
            `A capacitor of capacitance ${ans(row.c, "F")} stores a charge of ${ans(row.q, "C")}. ` +
            `What is the potential difference across it?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.q * row.c, "V"), // multiplied instead of dividing
            slip(row.c / row.q, "V"), // inverted the division
            slip(row.q, "V"), // gave the charge
            slip(row.c, "V"), // gave the capacitance
          ]),
          explanation: `Rearranging Q = CV gives V = Q ÷ C = ${ans(row.q, "C")} ÷ ${ans(row.c, "F")} = ${answer}.`,
          check: () => (agrees(row.c * row.v, row.q) ? null : `CV gives ${row.c * row.v} C, not ${row.q}`),
        };
      }

      const answer = ans(row.c, "F");
      return {
        prompt:
          `A capacitor stores ${ans(row.q, "C")} of charge when the potential difference across it is ${num(row.v)} V. ` +
          `What is its capacitance?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.q * row.v, "F"), // multiplied instead of dividing
          slip(row.v / row.q, "F"), // inverted the division
          slip(row.q, "F"), // gave the charge
          slip(row.v, "F"), // gave the voltage
        ]),
        explanation: `C = Q ÷ V = ${ans(row.q, "C")} ÷ ${num(row.v)} = ${answer}.`,
        check: () => (agrees(row.c * row.v, row.q) ? null : `CV gives ${row.c * row.v} C, not ${row.q}`),
      };
    },
  }),

  generator({
    key: "phy.cap.energy",
    subject: "physics",
    topic: "phy-capacitance",
    subtopic: "capacitor-energy",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(CAPACITORS);
      const answer = ans(row.e, "J");

      return {
        prompt:
          `A capacitor of capacitance ${ans(row.c, "F")} is charged to ${num(row.v)} V. ` +
          `How much energy is stored in it?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(row.c * row.v * row.v, "J"), // forgot the half
          slip(0.5 * row.c * row.v, "J"), // forgot to square the voltage
          slip(row.c * row.v, "J"), // gave the charge instead
          slip(0.5 * row.q * row.v * row.v, "J"), // used the charge where the capacitance belongs
        ]),
        explanation:
          `E = ½CV² = ½ × ${ans(row.c, "F")} × ${num(row.v)}² = ½ × ${ans(row.c, "F")} × ${num(row.v * row.v)} = ${answer}. ` +
          `The half appears for the same reason as in a stretched spring: the voltage rises from zero as the capacitor charges, so the average is half the final value. ` +
          `Doubling the voltage stores four times the energy.`,
        check: () => {
          /* The other two forms of the same equation must agree. */
          const viaQV = 0.5 * row.q * row.v;
          const viaQ2C = (row.q * row.q) / (2 * row.c);
          if (!agrees(viaQV, row.e)) return `½QV gives ${viaQV} J, not ${row.e} J`;
          if (!agrees(viaQ2C, row.e)) return `Q²/2C gives ${viaQ2C} J, not ${row.e} J`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "phy.cap.combined",
    subject: "physics",
    topic: "phy-capacitance",
    subtopic: "capacitors-combined",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 24,
    build: (rng) => {
      const c1 = rng.pick([2, 3, 4, 6, 10, 12, 20, 30, 60]);
      const c2 = rng.pick([2, 3, 4, 6, 10, 12, 20, 30, 60]);
      const parallel = rng.bool();
      const combined = parallel ? c1 + c2 : (c1 * c2) / (c1 + c2);
      if (!tidy(combined)) return buildCapCombineFallback();

      const answer = ans(combined, "μF");

      return {
        prompt:
          `Two capacitors of ${c1} μF and ${c2} μF are connected in ${parallel ? "parallel" : "series"}. ` +
          `What is the capacitance of the combination?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(parallel ? (c1 * c2) / (c1 + c2) : c1 + c2, "μF"), // used the rule for the other arrangement
          slip(c1 * c2, "μF"), // multiplied them
          slip(Math.abs(c1 - c2), "μF"), // subtracted them
          slip((c1 + c2) / 2, "μF"), // averaged them
        ]),
        explanation: parallel
          ? `Capacitors in PARALLEL add directly: ${c1} + ${c2} = ${answer}. ` +
            `They share the same voltage and their plate areas effectively combine, so the pair stores more charge than either alone. ` +
            `This is the opposite of the rule for resistors, which is the usual confusion.`
          : `Capacitors in SERIES combine reciprocally: 1/C = 1/${c1} + 1/${c2}, so C = (${c1} × ${c2}) ÷ (${c1} + ${c2}) = ${answer}. ` +
            `The result is always smaller than either capacitor — again the opposite of resistors.`,
        check: () => {
          const smaller = combined < Math.min(c1, c2);
          const larger = combined > Math.max(c1, c2);
          if (parallel && !larger) return `a parallel pair should exceed either capacitor`;
          if (!parallel && !smaller) return `a series pair should be less than either capacitor`;
          return null;
        },
      };
    },
  }),

  generator({
    key: "phy.cap.rc-discharge",
    subject: "physics",
    topic: "phy-capacitance",
    subtopic: "rc-discharge",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 24,
    build: (rng) => {
      const row = rng.pick(RC);
      const asked = rng.bool();

      if (asked) {
        const answer = ans(row.tau, "s");
        return {
          prompt:
            `A ${ans(row.c, "F")} capacitor discharges through a ${ans(row.r, "Ω")} resistor. ` +
            `What is the time constant of the circuit?`,
          answer,
          distractors: pickDistractors(answer, [
            slip(row.r / row.c, "s"), // divided instead of multiplying
            slip(row.c / row.r, "s"), // inverted the division
            slip(row.r, "s"), // gave the resistance
            slip(row.tau * 0.693, "s"), // gave the half-life of the discharge instead
          ]),
          explanation:
            `τ = RC = ${ans(row.r, "Ω")} × ${ans(row.c, "F")} = ${answer}. ` +
            `Ohms times farads gives seconds. After one time constant the charge has fallen to about 37% of its starting value.`,
          check: () => (agrees(row.tau / row.c, row.r) ? null : `τ ÷ C gives ${row.tau / row.c} Ω, not ${row.r}`),
        };
      }

      /* Halvings rather than exponentials: mental, and the same idea. */
      const halvings = rng.int(1, 4);
      const start = rng.pick([8, 16, 24, 32, 48, 64, 80, 96, 160]);
      const remaining = start / Math.pow(2, halvings);
      if (!tidy(remaining)) return buildRcFallback();
      const answer = ans(remaining, "V");

      return {
        prompt:
          `A capacitor discharging through a resistor loses half its voltage every ${num(row.tau)} s. ` +
          `It starts at ${num(start)} V. What is the voltage after ${num(row.tau * halvings)} s?`,
        answer,
        distractors: pickDistractors(answer, [
          slip(start / 2, "V"), // halved once regardless of the time
          slip(start / halvings, "V"), // divided by the number of halvings
          slip(start - halvings * row.tau, "V"), // subtracted the time from the voltage
          slip(0, "V"), // assumed it reaches zero
        ]),
        explanation:
          `${num(row.tau * halvings)} ÷ ${num(row.tau)} = ${halvings} halving times, so the voltage falls by a factor of 2${sup(halvings)} = ${Math.pow(2, halvings)}. ` +
          `${num(start)} ÷ ${Math.pow(2, halvings)} = ${answer}. ` +
          `An exponential decay never actually reaches zero — it just keeps halving.`,
        check: () =>
          agrees(remaining * Math.pow(2, halvings), start)
            ? null
            : `${halvings} halvings does not return ${start} V`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Thermal physics
     ------------------------------------------------------------------------ */

  generator({
    key: "phy.thermal.combined-gas",
    subject: "physics",
    topic: "phy-thermal",
    subtopic: "ideal-gas-law",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 30,
    build: (rng) => {
      const row = rng.pick(GAS);
      const answer = ans(row.p2, "kPa");

      return {
        prompt:
          `A fixed mass of ideal gas is at ${num(row.p1)} kPa in a volume of ${num(row.v1)} ${M3} at ${row.t1} K. ` +
          `It is changed to a volume of ${num(row.v2)} ${M3} at ${row.t2} K. What is its new pressure?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((row.p1 * row.v1 * row.t1) / (row.t2 * row.v2), "kPa"), // inverted the temperature ratio
          slip((row.p1 * row.v2 * row.t2) / (row.t1 * row.v1), "kPa"), // inverted the volume ratio
          slip((row.p1 * row.t2) / row.t1, "kPa"), // ignored the volume change
          slip((row.p1 * row.v1) / row.v2, "kPa"), // ignored the temperature change
        ]),
        explanation:
          `pV ÷ T is constant for a fixed mass of gas: (${num(row.p1)} × ${num(row.v1)}) ÷ ${row.t1} = (p₂ × ${num(row.v2)}) ÷ ${row.t2}. ` +
          `Rearranging gives p₂ = ${num(row.p1)} × ${num(row.v1)} × ${row.t2} ÷ (${row.t1} × ${num(row.v2)}) = ${answer}. ` +
          `Temperatures MUST be in kelvin — using celsius here makes the ratio meaningless.`,
        check: () =>
          agrees((row.p1 * row.v1) / row.t1, (row.p2 * row.v2) / row.t2)
            ? null
            : `pV/T is ${(row.p1 * row.v1) / row.t1} before and ${(row.p2 * row.v2) / row.t2} after`,
      };
    },
  }),

  generator({
    key: "phy.thermal.kinetic-theory",
    subject: "physics",
    topic: "phy-thermal",
    subtopic: "kinetic-theory",
    curriculumLevel: "YEAR_13",
    difficulty: 7,
    variants: 20,
    build: (rng) => {
      /* Ratios again: mean kinetic energy ∝ T in kelvin, speed ∝ √T. */
      const t1 = rng.pick([100, 200, 300, 400]);
      const factor = rng.pick([2, 3, 4, 9] as const);
      const t2 = t1 * factor;
      const asked = rng.bool();

      if (asked) {
        const answer = `It is multiplied by ${factor}`;
        return {
          prompt:
            `The absolute temperature of an ideal gas is raised from ${t1} K to ${t2} K. ` +
            `What happens to the mean kinetic energy of its molecules?`,
          answer,
          distractors: wrongOptions(answer, [
            `It is multiplied by ${num(Math.sqrt(factor))}`, // confused it with the speed
            `It is multiplied by ${factor * factor}`, // squared the ratio
            "It is unchanged",
            `It is divided by ${factor}`,
          ]),
          explanation:
            `The mean kinetic energy of a molecule is (3/2)kT, directly proportional to the ABSOLUTE temperature. ` +
            `Raising T from ${t1} K to ${t2} K multiplies it by ${t2} ÷ ${t1} = ${factor}. ` +
            `This only works in kelvin — the same change in celsius would give a different, wrong ratio.`,
          check: () => (agrees(t2 / t1, factor) ? null : `the temperature ratio is ${t2 / t1}, not ${factor}`),
        };
      }

      const speedFactor = Math.sqrt(factor);
      const answer =
        Number.isInteger(speedFactor)
          ? `It is multiplied by ${speedFactor}`
          : `It is multiplied by √${factor}`;

      return {
        prompt:
          `The absolute temperature of an ideal gas is raised from ${t1} K to ${t2} K. ` +
          `What happens to the root-mean-square speed of its molecules?`,
        answer,
        distractors: wrongOptions(answer, [
          `It is multiplied by ${factor}`, // confused it with the kinetic energy
          `It is multiplied by ${factor * factor}`,
          "It is unchanged",
          `It is divided by ${factor}`,
        ]),
        explanation:
          `Mean kinetic energy ∝ T and kinetic energy ∝ v², so v ∝ √T. ` +
          `Multiplying the absolute temperature by ${factor} multiplies the r.m.s. speed by √${factor}. ` +
          `The energy scales with T; the speed only with its square root, which is why gases are so hard to heat to high molecular speeds.`,
        check: () =>
          agrees(speedFactor * speedFactor, factor)
            ? null
            : `√${factor} squared gives ${speedFactor * speedFactor}`,
      };
    },
  }),

  generator({
    key: "phy.thermal.internal-energy",
    subject: "physics",
    topic: "phy-thermal",
    subtopic: "internal-energy",
    curriculumLevel: "YEAR_13",
    difficulty: 6,
    variants: 7,
    build: (rng) => {
      const cases = [
        {
          q: "What happens to the internal energy of a substance while it is melting at its melting point?",
          a: "It increases, because the potential energy of the particles rises while their kinetic energy stays the same",
          wrong: [
            "It stays the same, because the temperature does not change",
            "It falls, because energy is used to break bonds",
            "It increases, because the particles speed up",
          ],
          why: "Internal energy is the sum of the particles' kinetic and potential energies. During melting the temperature — and so the kinetic part — is constant, but energy is being supplied to separate the particles, which raises the potential part.",
        },
        {
          q: "What is the internal energy of an ideal gas made up of?",
          a: "The random kinetic energy of its molecules only",
          wrong: [
            "The kinetic and potential energies of its molecules",
            "The potential energy of its molecules only",
            "The kinetic energy of the container plus that of the gas",
          ],
          why: "An ideal gas is defined as having no forces between its molecules except during collisions, so there is no intermolecular potential energy to store. Its internal energy is purely kinetic, which is why it depends on temperature alone.",
        },
        {
          q: "Two blocks of the same material have masses of 1 kg and 2 kg, both at 300 K. How do their internal energies compare?",
          a: "The 2 kg block has twice the internal energy",
          wrong: [
            "They are equal, because they are at the same temperature",
            "The 2 kg block has four times the internal energy",
            "The 1 kg block has more, because it heats up faster",
          ],
          why: "Temperature is the average energy per particle; internal energy is the total. Twice the mass means twice the number of particles at the same average energy each, so twice the internal energy. This is exactly why temperature and internal energy are different quantities.",
        },
        {
          q: "What does absolute zero mean in terms of particle motion?",
          a: "The particles have the minimum possible kinetic energy",
          wrong: [
            "The particles are completely motionless with zero energy of any kind",
            "The particles move at a constant, very low speed",
            "The particles have zero potential energy",
          ],
          why: "Absolute zero is the temperature at which particles have as little kinetic energy as physically possible. Classically this is described as being at rest; in practice a residual zero-point energy remains, and the temperature itself is unreachable.",
        },
        {
          q: "Why does the temperature of a gas rise when it is compressed rapidly?",
          a: "Work is done on the gas, increasing the kinetic energy of its molecules",
          wrong: [
            "Friction between the molecules and the container heats it",
            "The molecules are squeezed, so their potential energy is converted to heat",
            "The pressure rise directly creates thermal energy",
          ],
          why: "The moving piston does work on the molecules that rebound from it, and they leave faster than they arrived. Higher average kinetic energy means higher temperature. If the compression is slow, heat escapes and the temperature rise is smaller.",
        },
        {
          q: "A kettle and a swimming pool are both at 40 °C. Which has the greater internal energy?",
          a: "The swimming pool, because it contains far more particles",
          wrong: [
            "The kettle, because its water was heated more recently",
            "They are equal, because internal energy depends only on temperature",
            "The kettle, because it is more concentrated",
          ],
          why: "They have the same temperature — the same average energy per particle — but internal energy is the TOTAL over all particles. A swimming pool has enormously more water, so its internal energy is vastly greater despite the identical temperature.",
        },
        {
          q: "What is the difference between heat and temperature?",
          a: "Heat is energy transferred because of a temperature difference; temperature measures the average kinetic energy of particles",
          wrong: [
            "They are the same quantity measured in different units",
            "Heat is the total energy of an object and temperature is its rate of change",
            "Temperature is energy transferred and heat is what a thermometer reads",
          ],
          why: "Temperature is a property an object HAS; heat is energy in TRANSIT between objects at different temperatures. Once the energy has arrived it is no longer heat — it is part of the object's internal energy.",
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

  generator({
    key: "phy.thermal.transfer",
    subject: "physics",
    topic: "phy-thermal",
    subtopic: "thermal-transfer",
    curriculumLevel: "YEAR_12",
    difficulty: 5,
    variants: 30,
    build: (rng) => {
      /* Energy balance: a heater running for a time raises a mass of water. */
      const row = rng.pick(HEATERS);
      const { p, t, m, rise } = row;
      const c = 4200;

      const answer = ans(rise, "°C");

      return {
        prompt:
          `A ${p} W heater is switched on for ${t} s in ${num(m)} kg of water ` +
          `(specific heat capacity ${c} ${"J/kg/°C"}). Assuming no losses, what temperature rise does it produce?`,
        answer,
        distractors: pickDistractors(answer, [
          slip((p * t) / c, "°C"), // forgot the mass
          slip((p * t) / m, "°C"), // forgot the heat capacity
          slip(p / (m * c), "°C"), // forgot the time
          slip((m * c) / (p * t), "°C"), // inverted the whole thing
        ]),
        explanation:
          `Energy supplied = Pt = ${p} × ${t} = ${num(p * t)} J. ` +
          `Then Δθ = E ÷ (mc) = ${num(p * t)} ÷ (${num(m)} × ${c}) = ${num(p * t)} ÷ ${num(m * c)} = ${answer}. ` +
          `Real heaters lose energy to the surroundings, so a measured rise is always smaller than this.`,
        check: () =>
          agrees(m * c * rise, p * t)
            ? null
            : `mcΔθ gives ${m * c * rise} J but Pt gives ${p * t} J`,
      };
    },
  }),
];

/* ==========================================================================
   Fallbacks
   ========================================================================== */

function buildFieldFallback() {
  const answer = ans(1, NKG);
  return {
    prompt:
      "The gravitational field strength at the surface of a planet is 9 N/kg. " +
      "What is the field strength at a distance of 3 planetary radii from its centre?",
    answer,
    distractors: pickDistractors(answer, [
      slip(3, NKG), // used 1/r rather than 1/r²
      slip(81, NKG), // multiplied instead of dividing
      slip(9, NKG), // said it is unchanged
    ]),
    explanation:
      "g ∝ 1/r², so at 3 radii the field is 3² = 9 times weaker: 9 ÷ 9 = 1 N/kg. " +
      "Distances are measured from the centre, not the surface.",
    check: () => (agrees(9 / 9, 1) ? null : "the fallback field is wrong"),
  };
}

function buildPotentialFallback() {
  const answer = ans(-6, "MJ/kg");
  return {
    prompt:
      "The gravitational potential at the surface of a planet is −24 MJ/kg. " +
      "What is the potential at a distance of 4 planetary radii from its centre?",
    answer,
    distractors: pickDistractors(answer, [
      slip(-1.5, "MJ/kg"), // used the inverse-square law by mistake
      slip(6, "MJ/kg"), // dropped the minus sign
      slip(-96, "MJ/kg"), // multiplied instead of dividing
    ]),
    explanation:
      "V ∝ 1/r, not 1/r²: −24 ÷ 4 = −6 MJ/kg. It stays negative because the zero of potential is at infinity.",
    check: () => (agrees(-24 / 4, -6) ? null : "the fallback potential is wrong"),
  };
}

function buildOrbitFallback() {
  const answer = ans(8, "days");
  return {
    prompt:
      "Two satellites orbit the same planet. The first has an orbital period of 1 day. " +
      "The second orbits at 4 times the radius. What is its orbital period?",
    answer,
    distractors: pickDistractors(answer, [
      slip(4, "days"), // assumed period is proportional to radius
      slip(16, "days"), // squared the radius factor
      slip(2, "days"), // took the square root instead
    ]),
    explanation:
      "Kepler's third law: T² ∝ r³. Multiplying r by 4 multiplies T² by 64, so T is multiplied by 8.",
    check: () => (agrees(64, Math.pow(4, 3)) ? null : "the fallback orbit is wrong"),
  };
}

function buildPlatesFallback() {
  const answer = ans(20000, "V/m");
  return {
    prompt:
      "Two parallel plates 5 mm apart have a potential difference of 100 V between them. " +
      "What is the electric field strength between the plates?",
    answer,
    distractors: pickDistractors(answer, [
      slip(20, "V/m"), // left the separation in millimetres
      slip(0.5, "V/m"), // multiplied instead of dividing
      slip(100, "V/m"), // gave the potential difference
    ]),
    explanation:
      "E = V ÷ d with d in metres: 5 mm = 0.005 m, so E = 100 ÷ 0.005 = 20 000 V/m. " +
      "The field between parallel plates is uniform.",
    check: () => (agrees(20000 * 0.005, 100) ? null : "the fallback field is wrong"),
  };
}

function buildWorkFallback() {
  const answer = ans(2e-4, "J");
  return {
    prompt:
      "A small charged sphere carrying a charge of 2 × 10⁻⁶ C is moved through a potential difference of 100 V. " +
      "How much work is done on it?",
    answer,
    distractors: pickDistractors(answer, [
      slip(2e-8, "J"), // divided instead of multiplying
      slip(5e7, "J"), // inverted the division
      slip(100, "J"), // gave the potential difference
    ]),
    explanation:
      "W = QV = 2 × 10⁻⁶ × 100 = 2 × 10⁻⁴ J. A volt is a joule per coulomb.",
    check: () => (agrees(2e-6 * 100, 2e-4) ? null : "the fallback work is wrong"),
  };
}

function buildCapCombineFallback() {
  const answer = ans(4, "μF");
  return {
    prompt: "Two capacitors of 6 μF and 12 μF are connected in series. What is the capacitance of the combination?",
    answer,
    distractors: pickDistractors(answer, [
      slip(18, "μF"), // used the parallel rule
      slip(72, "μF"), // multiplied them
      slip(6, "μF"), // subtracted them
    ]),
    explanation:
      "In series 1/C = 1/6 + 1/12, so C = (6 × 12) ÷ 18 = 4 μF — always smaller than either capacitor, " +
      "which is the opposite of the rule for resistors.",
    check: () => (agrees((6 * 12) / 18, 4) ? null : "the fallback combination is wrong"),
  };
}

function buildRcFallback() {
  const answer = ans(4, "V");
  return {
    prompt:
      "A capacitor discharging through a resistor loses half its voltage every 5 s. " +
      "It starts at 32 V. What is the voltage after 15 s?",
    answer,
    distractors: pickDistractors(answer, [
      slip(16, "V"), // halved once regardless of the time
      slip(10.67, "V"), // divided by the number of halvings
      slip(0, "V"), // assumed it reaches zero
    ]),
    explanation:
      "15 ÷ 5 = 3 halving times, so the voltage falls by a factor of 2³ = 8: 32 ÷ 8 = 4 V. " +
      "An exponential decay never actually reaches zero.",
    check: () => (agrees(32 / 8, 4) ? null : "the fallback discharge is wrong"),
  };
}

function buildTransferFallback() {
  const answer = ans(10, "°C");
  return {
    prompt:
      "A 2100 W heater is switched on for 40 s in 2 kg of water (specific heat capacity 4200 J/kg/°C). " +
      "Assuming no losses, what temperature rise does it produce?",
    answer,
    distractors: pickDistractors(answer, [
      slip(20, "°C"), // forgot the mass
      slip(42000, "°C"), // forgot the heat capacity
      slip(0.25, "°C"), // forgot the time
    ]),
    explanation:
      "Energy supplied = Pt = 2100 × 40 = 84 000 J. Then Δθ = E ÷ (mc) = 84 000 ÷ 8400 = 10 °C.",
    check: () => (agrees(2 * 4200 * 10, 2100 * 40) ? null : "the fallback transfer is wrong"),
  };
}
