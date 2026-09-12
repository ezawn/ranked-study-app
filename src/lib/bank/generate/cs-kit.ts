/**
 * Shared helpers for the computer science generators.
 *
 * The same idea as `format.ts` for maths: the conventions that make a bank look
 * hand-written rather than machine-made live in one place. Binary is grouped in
 * nibbles, hex is upper-case with no `0x`, pseudocode uses `←` for assignment
 * and block keywords in capitals, and every conversion here is computed so the
 * answer cannot drift from the question.
 */

import { pickDistractors } from "./kit";

/* ==========================================================================
   Number bases
   ========================================================================== */

/** A denary value as binary, left-padded to a whole number of nibbles. */
export function toBinary(value: number, bits?: number): string {
  const raw = Math.abs(Math.trunc(value)).toString(2);
  const width = bits ?? Math.ceil(raw.length / 4) * 4;
  return raw.padStart(Math.max(width, raw.length), "0");
}

/** Binary as denary. Accepts spaces between nibbles. */
export function fromBinary(bits: string): number {
  return parseInt(bits.replace(/\s+/g, ""), 2);
}

/** A denary value as hex, upper-case, at least two digits. */
export function toHex(value: number, digits = 2): string {
  return Math.abs(Math.trunc(value)).toString(16).toUpperCase().padStart(digits, "0");
}

export function fromHex(hex: string): number {
  return parseInt(hex.replace(/\s+/g, ""), 16);
}

/** Group a binary string into space-separated nibbles from the right. */
export function nibbles(bits: string): string {
  const padded = bits.padStart(Math.ceil(bits.length / 4) * 4, "0");
  return padded.replace(/(.{4})(?=.)/g, "$1 ").trim();
}

/** Eight-bit two's complement of a signed value in [-128, 127]. */
export function twosComplement8(value: number): string {
  const v = ((value % 256) + 256) % 256;
  return v.toString(2).padStart(8, "0");
}

/** Read an eight-bit two's complement pattern back to a signed denary value. */
export function fromTwosComplement8(bits: string): number {
  const n = parseInt(bits, 2);
  return n >= 128 ? n - 256 : n;
}

/* ==========================================================================
   Storage units
   ========================================================================== */

/** SI-style binary prefixes as taught: each step is ×1000 in the current spec. */
export const STORAGE_UNITS = ["bit", "nibble", "byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;

/* ==========================================================================
   Pseudocode
   ========================================================================== */

/**
 * Indent a block of pseudocode lines.
 *
 * Generators build programs as arrays of lines with a leading depth number;
 * this renders them with two spaces per level so a trace question reads like
 * code rather than a run-on sentence.
 */
export function code(lines: readonly (readonly [number, string])[]): string {
  return lines.map(([depth, text]) => `${"  ".repeat(depth)}${text}`).join("\n");
}

/* ==========================================================================
   Distractors
   ========================================================================== */

/**
 * Wrong answers for a multiple-choice concept question, drawn from a fixed pool
 * of real alternatives.
 *
 * `pool` is every plausible answer including the right one; this returns the
 * others, shuffled deterministically by the caller's RNG upstream. Keeping the
 * pool explicit means the distractors are always genuine competitors — another
 * gate, another protocol, another sorting algorithm — never noise.
 */
export function othersFrom(answer: string, pool: readonly string[], wanted = 3): string[] {
  return pickDistractors(
    answer,
    pool.filter((item) => item !== answer),
    wanted,
  );
}

/** Numeric distractors from a list of named slips, in preference order. */
export function numericSlips(
  answer: number | string,
  slips: readonly (number | string | null | undefined)[],
  wanted = 3,
): string[] {
  return pickDistractors(String(answer), slips, wanted);
}
