/**
 * Writing mathematics the way a student expects to read it.
 *
 * The generators build expressions from coefficients, and the difference
 * between a bank that looks professional and one that looks machine-made is
 * almost entirely here: `1x^2 + -3x + 0` versus `x² - 3x`. Every generator
 * formats through these helpers so the conventions are applied once and
 * consistently — no leading 1, no `+ -`, no `x^1`, no zero terms, superscripts
 * for powers.
 *
 * Plain Unicode rather than LaTeX. The app renders question prompts as text in
 * a battle where answers are read in a second or two; pulling in a maths
 * typesetter to render `x²` would cost a dependency and a render pass per
 * question for no gain. Anything genuinely needing display maths (a limit, a
 * matrix) is out of scope for the bank rather than badly rendered by it.
 */

import { Rational } from "./rational";

/**
 * Re-exported so generators have one import for everything that turns a number
 * into text. They are defined next to the exact arithmetic because
 * `Rational.toDecimal` needs them, and importing them back the other way would
 * make the two modules circular.
 */
export { toPlaces, toSigFigs, trimZeros } from "./rational";

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
  "/": "ᐟ",
  ".": "·",
};

/** `x^2` → `x²`. Falls back to `^n` for anything with no superscript glyph. */
export function sup(exponent: number | string): string {
  const text = String(exponent);
  let out = "";
  for (const ch of text) {
    const glyph = SUPERSCRIPTS[ch];
    if (!glyph) return `^${text}`;
    out += glyph;
  }
  return out;
}

/** A signed term joined onto an expression: `3` → ` + 3`, `-3` → ` - 3`. */
export function joinTerm(coefficient: number, body: string): string {
  if (coefficient === 0) return "";
  const sign = coefficient < 0 ? " - " : " + ";
  const size = Math.abs(coefficient);
  const shown = size === 1 && body !== "" ? "" : String(size);
  return `${sign}${shown}${body}`;
}

/** The first term of an expression, where a plus sign would be wrong. */
export function leadTerm(coefficient: number, body: string): string {
  if (coefficient === 0) return "";
  const size = Math.abs(coefficient);
  const shown = size === 1 && body !== "" ? "" : String(size);
  return `${coefficient < 0 ? "-" : ""}${shown}${body}`;
}

/**
 * A polynomial from its coefficients, highest power first.
 *
 * `poly([1, -3, 0], "x")` → `x² - 3x`. Zero coefficients vanish, a leading 1 is
 * implicit, `x¹` is written `x`, and an all-zero polynomial is `0` rather than
 * an empty string.
 */
export function poly(coefficients: readonly number[], variable = "x"): string {
  const degree = coefficients.length - 1;
  let out = "";

  for (let i = 0; i <= degree; i++) {
    const coefficient = coefficients[i];
    if (coefficient === 0) continue;

    const power = degree - i;
    const body = power === 0 ? "" : power === 1 ? variable : `${variable}${sup(power)}`;

    out += out === "" ? leadTerm(coefficient, body) : joinTerm(coefficient, body);
  }

  return out === "" ? "0" : out;
}

/** `(x + 3)`, `(x - 3)`, `(2x + 3)`, `(x)` never — a zero constant gives `(2x)`. */
export function bracket(coefficient: number, constant: number, variable = "x"): string {
  const head = leadTerm(coefficient, variable);
  const tail = joinTerm(constant, "");
  return `(${head === "" ? constant : head + tail})`;
}

/** `ax + b = c` style equations, with the same conventions as `poly`. */
export function linearEquation(a: number, b: number, c: number, variable = "x"): string {
  return `${leadTerm(a, variable)}${joinTerm(b, "")} = ${c}`;
}

/** A fraction for reading inline: `3/4`, or just `3` when the denominator is 1. */
export function frac(numerator: number, denominator: number): string {
  return Rational.of(numerator, denominator).toString();
}

/** `(3, -4)` */
export function point(x: number | string, y: number | string): string {
  return `(${x}, ${y})`;
}

/** A column vector, written inline as `(3, -4)` with a note that it is a vector. */
export function columnVector(x: number, y: number): string {
  return `(${x}, ${y})`;
}

/** `2 × 10⁵`, the standard-form convention. */
export function standardForm(mantissa: string, exponent: number): string {
  return `${mantissa} × 10${sup(exponent)}`;
}

/** Comma-separated with "and" before the last: `2, 3 and 5`. */
export function list(items: readonly (string | number)[]): string {
  const parts = items.map(String);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** `1st`, `2nd`, `3rd`, `11th`. */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** `£1,250` — thousands separated, no decimals unless there are pence. */
export function money(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasPence = Math.abs(rounded % 1) > 1e-9;
  return `£${rounded.toLocaleString("en-GB", {
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** `x = 3` or `x = 3 or x = -5`, for solution sets. */
export function solutions(variable: string, values: readonly (string | number)[]): string {
  return values.map((v) => `${variable} = ${v}`).join(" or ");
}
