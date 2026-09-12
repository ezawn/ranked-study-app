/**
 * Number representation (A-Level): binary subtraction, bitwise manipulation
 * and floating point.
 *
 * Subtraction is done by adding the two's complement and the `check` re-runs
 * it as ordinary integer arithmetic. Bitwise questions apply the real gate to
 * each bit and re-derive with JavaScript's own operators. Floating point uses
 * one stated format throughout — an 8-bit two's complement mantissa with the
 * point after the sign bit, and a 4-bit two's complement exponent — so the
 * value is always mantissa × 2^exponent.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { toBinary, fromBinary, nibbles, twosComplement8, fromTwosComplement8 } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

/** Value of an 8-bit pattern read as two's complement with the point after bit 7. */
function mantissaValue(bits: string): number {
  let v = bits[0] === "1" ? -1 : 0;
  for (let i = 1; i < 8; i++) v += Number(bits[i]) * 2 ** -i;
  return v;
}

export const csALevelNumber: Generator[] = [
  /* ==================================================================
     Binary subtraction with two's complement
     ================================================================== */

  generator({
    key: "cs.aln.binary-subtract",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-subtraction",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const a = rng.int(40, 120);
      const b = rng.int(5, a - 5);
      const result = a - b;
      const answer = nibbles(toBinary(result, 8));
      const negB = twosComplement8(-b);
      return {
        prompt:
          `Work out ${a} − ${b} using 8-bit two's complement, by adding the two's complement of ${b} to ${a}. ` +
          `Give the 8-bit result as binary.`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles(toBinary(a + b > 255 ? (a + b) % 256 : a + b, 8)), // added instead of subtracting
          nibbles(toBinary(b - a >= 0 ? b - a : b, 8)), // subtracted the wrong way round
          nibbles(twosComplement8(-(a - b))), // gave the two's complement of the answer
          nibbles(toBinary((result + 1) % 256, 8)),
        ]),
        explanation:
          `The two's complement of ${b} in 8 bits is ${negB}. Adding: ${toBinary(a, 8)} + ${negB} = ` +
          `${toBinary(result, 8)} (the carry out of the top bit is discarded). That is ${result} = ${a} − ${b}.`,
        check: () => (fromBinary(toBinary(result, 8)) === a - b ? null : "subtraction mismatch"),
      };
    },
  }),

  generator({
    key: "cs.aln.subtract-negative-result",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-subtraction",
    curriculumLevel: Y12,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const a = rng.int(5, 40);
      const b = rng.int(a + 5, a + 90);
      const result = a - b; // negative
      const pattern = twosComplement8(result);
      const answer = nibbles(pattern);
      return {
        prompt:
          `Work out ${a} − ${b} in 8-bit two's complement. The result is negative — give its 8-bit two's complement representation.`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles(toBinary(b - a, 8)), // gave the magnitude as plain binary
          nibbles("1" + toBinary(b - a, 7)), // sign-and-magnitude
          nibbles(twosComplement8(result + 1)),
          nibbles(twosComplement8(-(result))),
        ]),
        explanation:
          `${a} − ${b} = ${result}. To store −${b - a} in 8-bit two's complement, write ${b - a} as binary ` +
          `(${toBinary(b - a, 8)}), invert every bit and add 1, giving ${pattern}. The leading 1 shows it is negative.`,
        check: () => (fromTwosComplement8(pattern) === a - b ? null : "negative result mismatch"),
      };
    },
  }),

  /* ==================================================================
     Bitwise manipulation
     ================================================================== */

  generator({
    key: "cs.aln.bitwise-op",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "bitwise",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      const a = rng.int(20, 240);
      const b = rng.int(20, 240);
      const op = rng.pick(["AND", "OR", "XOR"] as const);
      const result = op === "AND" ? a & b : op === "OR" ? a | b : a ^ b;
      const answer = nibbles(toBinary(result, 8));
      return {
        prompt:
          `Apply a bitwise ${op} to the 8-bit values ${nibbles(toBinary(a, 8))} and ${nibbles(toBinary(b, 8))}. ` +
          `Give the 8-bit result.`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles(toBinary(op === "AND" ? a | b : op === "OR" ? a & b : a & b, 8)), // used the wrong gate
          nibbles(toBinary(op === "XOR" ? a | b : a ^ b, 8)),
          nibbles(toBinary((a + b) % 256, 8)), // added the two values
          nibbles(toBinary(~result & 0xff, 8)), // inverted the result
        ]),
        explanation:
          `Line the two bytes up and apply ${op} to each column. ${op === "AND" ? "A column is 1 only if both bits are 1" : op === "OR" ? "A column is 1 if either bit is 1" : "A column is 1 only if the two bits differ"}, ` +
          `which gives ${toBinary(result, 8)}.`,
        check: () => {
          const r = op === "AND" ? a & b : op === "OR" ? a | b : a ^ b;
          return r === result ? null : "bitwise mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.aln.bit-mask",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "bitwise",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 6,
    build: (_rng, index) => {
      const cases = [
        {
          q: "Which single bitwise operation sets bits 0 and 2 of a byte to 1 while leaving every other bit unchanged?",
          a: "OR with the mask 00000101",
          wrong: [
            "AND with the mask 00000101",
            "XOR with the mask 00000101",
            "OR with the mask 11111010",
            "AND with the mask 11111010",
          ],
          why: "OR forces a bit to 1 wherever the mask has a 1 and leaves a bit alone wherever the mask has a 0.",
        },
        {
          q: "Which single bitwise operation clears (sets to 0) bits 1 and 3 of a byte while leaving every other bit unchanged?",
          a: "AND with the mask 11110101",
          wrong: [
            "OR with the mask 11110101",
            "AND with the mask 00001010",
            "XOR with the mask 00001010",
            "OR with the mask 00001010",
          ],
          why: "AND forces a bit to 0 wherever the mask has a 0 and leaves a bit alone wherever the mask has a 1.",
        },
        {
          q: "Which single bitwise operation flips (toggles) bits 4 and 5 of a byte while leaving every other bit unchanged?",
          a: "XOR with the mask 00110000",
          wrong: [
            "OR with the mask 00110000",
            "AND with the mask 00110000",
            "XOR with the mask 11001111",
            "NOT applied to the whole byte",
          ],
          why: "XOR with a 1 inverts a bit; XOR with a 0 leaves it unchanged.",
        },
        {
          q: "You want to test whether bit 6 of a byte is set. Which operation isolates that bit?",
          a: "AND with the mask 01000000, then check if the result is non-zero",
          wrong: [
            "OR with the mask 01000000, then check if the result is non-zero",
            "XOR with the mask 01000000, then check if the result is zero",
            "AND with the mask 10111111, then check if the result is zero",
            "Shift the byte left by 6 and read the sign bit",
          ],
          why: "ANDing with a mask that has a single 1 keeps only that bit; the result is non-zero exactly when the bit was set.",
        },
        {
          q: "What does ANDing an 8-bit value with the mask 00001111 achieve?",
          a: "It keeps the low nibble (bits 0–3) and clears the high nibble",
          wrong: [
            "It keeps the high nibble and clears the low nibble",
            "It sets every bit to 1",
            "It reverses the order of the bits",
            "It converts the value to hexadecimal",
          ],
          why: "The mask has 1s in the low four positions, so only those bits survive the AND.",
        },
        {
          q: "Multiplying an unsigned byte by 8 can be done with which bitwise operation (assuming no overflow)?",
          a: "A logical left shift of 3 places",
          wrong: [
            "A logical right shift of 3 places",
            "A logical left shift of 8 places",
            "XOR with 00001000",
            "AND with 00000111",
          ],
          why: "Each left shift doubles the value, so shifting left 3 places multiplies by 2³ = 8.",
        },
      ] as const;
      const c = cases[index % cases.length];
      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  generator({
    key: "cs.aln.arithmetic-shift",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "bitwise",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const value = rng.int(-120, -8);
      const places = rng.int(1, 3);
      const pattern = twosComplement8(value);
      const shifted = Math.floor(value / 2 ** places); // arithmetic right shift rounds toward -infinity
      const resultPattern = twosComplement8(shifted);
      const answer = nibbles(resultPattern);
      return {
        prompt:
          `The 8-bit two's complement value ${nibbles(pattern)} represents ${value}. ` +
          `An arithmetic right shift of ${places} place${places === 1 ? "" : "s"} is applied. What is the resulting bit pattern?`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles(toBinary(fromBinary(pattern) >> places, 8)), // logical shift, zeros in from the left
          nibbles(twosComplement8(value * 2 ** places)), // shifted the wrong way
          nibbles(twosComplement8(Math.trunc(value / 2 ** places))), // rounded toward zero instead
          nibbles(twosComplement8(shifted + 1)),
        ]),
        explanation:
          `An arithmetic right shift copies the sign bit inward, so the number stays negative and is divided by ` +
          `2^${places}: ${value} ÷ ${2 ** places} = ${shifted} (rounding toward −∞). That pattern is ${resultPattern}.`,
        check: () => (fromTwosComplement8(resultPattern) === Math.floor(value / 2 ** places) ? null : "shift mismatch"),
      };
    },
  }),

  /* ==================================================================
     Floating point
     ================================================================== */

  generator({
    key: "cs.aln.fp-to-denary",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "floating-point",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      /* Positive, normalised: mantissa 0.1xxxxx, small exponent. */
      const highBits = rng.pick(["10", "11", "101", "110", "111", "1001", "1010"] as const);
      const mantissaBits = ("0" + highBits).padEnd(8, "0");
      const exp = rng.int(1, 4);
      const expBits = toBinary(exp, 4);
      const frac = mantissaValue(mantissaBits);
      const value = frac * 2 ** exp;
      const answer = trimNumber(value);
      return {
        prompt: code12(
          `A 12-bit floating point number has an 8-bit two's complement mantissa (binary point after the sign bit) ` +
            `followed by a 4-bit two's complement exponent.`,
          `Mantissa: ${mantissaBits}    Exponent: ${expBits}`,
          "What denary value does it represent?",
        ),
        answer,
        distractors: pickDistractors(answer, [
          trimNumber(frac * exp), // multiplied the mantissa by the exponent value, not 2^exponent
          trimNumber(value * 2), // exponent read one too high
          trimNumber(value / 2), // exponent read one too low
          trimNumber(fromBinary(mantissaBits) * 2 ** exp), // mantissa read as an integer
        ]),
        explanation:
          `The mantissa ${mantissaBits} is 0.${highBits}… in binary, which is ${trimNumber(frac)}. ` +
          `The exponent ${expBits} is ${exp}, so the value is ${trimNumber(frac)} × 2^${exp} = ${answer}.`,
        check: () => (Math.abs(mantissaValue(mantissaBits) * 2 ** exp - value) < 1e-9 ? null : "fp value mismatch"),
      };
    },
  }),

  recall({
    key: "cs.aln.fp-normalisation",
    topic: "cs-number",
    subtopic: "floating-point",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "A positive floating point number stored with a two's complement mantissa is normalised. Which two bits does its mantissa always start with?",
        a: "0 then 1 (0.1…)",
        wrong: ["1 then 0 (1.0…)", "0 then 0 (0.0…)", "1 then 1 (1.1…)", "It can start with any bits"],
        why: "Normalising shifts the mantissa so the first digit after the point is 1, which for a positive number means the pattern 01…",
      },
      {
        q: "A negative floating point number with a two's complement mantissa is normalised. Which two bits does its mantissa start with?",
        a: "1 then 0 (1.0…)",
        wrong: ["0 then 1 (0.1…)", "1 then 1 (1.1…)", "0 then 0 (0.0…)", "Always 11"],
        why: "For a two's complement negative value, normalisation gives the leading pair 10 — the sign bit 1 followed by a 0.",
      },
      {
        q: "Why are floating point numbers normalised before being stored?",
        a: "It gives the greatest possible precision for a fixed number of mantissa bits and makes each value's representation unique",
        wrong: [
          "It makes the exponent always positive",
          "It removes the need for a sign bit",
          "It guarantees the number can be stored exactly",
          "It converts the number to fixed point",
        ],
        why: "Leading zeros in the mantissa waste bits; shifting them out packs in more significant figures.",
      },
      {
        q: "In a floating point format, moving one bit from the exponent to the mantissa (keeping the total width the same) has what effect?",
        a: "The precision improves but the range of representable magnitudes shrinks",
        wrong: [
          "Both the range and the precision improve",
          "The range improves but the precision gets worse",
          "Neither range nor precision changes",
          "The numbers can no longer be normalised",
        ],
        why: "Mantissa bits buy significant figures (precision); exponent bits buy the span between the largest and smallest magnitude (range).",
      },
      {
        q: "Which statement about floating point representation is correct?",
        a: "Many simple decimal fractions, such as 0.1, cannot be stored exactly and are rounded",
        wrong: [
          "Every decimal fraction can be stored exactly",
          "Only negative numbers suffer rounding errors",
          "Rounding errors never accumulate when many operations are chained",
          "Floating point can represent a smaller range of magnitudes than fixed point of the same width",
        ],
        why: "A binary mantissa can only represent sums of powers of two exactly, so 0.1 (a repeating binary fraction) is approximated.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

function code12(...lines: string[]): string {
  return lines.join("\n");
}

function trimNumber(n: number): string {
  return String(Number(n.toFixed(6)));
}
