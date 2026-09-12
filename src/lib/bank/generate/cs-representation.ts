/**
 * Number systems and data representation.
 *
 * Everything here is arithmetic underneath — a base conversion, a file-size
 * product, a run-length count — so the generators compute the answer and a
 * `check` re-derives it a second way. Distractors are the mistakes the topic
 * actually invites: the off-by-one-nibble, the "forgot to divide by eight", the
 * colour depth read as a count rather than an exponent.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import {
  code,
  fromBinary,
  fromHex,
  fromTwosComplement8,
  nibbles,
  numericSlips,
  othersFrom,
  toBinary,
  toHex,
  twosComplement8,
} from "./cs-kit";

const GCSE = "YEAR_10" as const;
const GCSE_LATE = "YEAR_11" as const;
const A_LEVEL = "YEAR_12" as const;

export const csRepresentation: Generator[] = [
  /* ------------------------------------------------------------------------
     Binary ↔ denary
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.num.bin-to-den",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-denary",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 20,
    build: (rng) => {
      const value = rng.int(37, 249);
      const bits = toBinary(value, 8);
      const answer = String(value);

      /* The classic slip is treating the leftmost bit as the units column. */
      const reversed = fromBinary([...bits].reverse().join(""));

      return {
        prompt: `Convert the 8-bit binary number ${nibbles(bits)} to denary.`,
        answer,
        distractors: numericSlips(answer, [
          value + 1,
          value - 1,
          reversed !== value ? reversed : value + 2,
          [...bits].filter((b) => b === "1").length, // counted the set bits
          value + 128,
        ]),
        explanation:
          `The column values from the right are 1, 2, 4, 8, 16, 32, 64, 128. ` +
          `Add the values of the columns that hold a 1: ${bitSum(bits)} = ${value}.`,
        check: () => (fromBinary(bits) === value ? null : `binary re-reads as ${fromBinary(bits)}`),
      };
    },
  }),

  generator({
    key: "cs.num.den-to-bin",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "denary-binary",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 20,
    build: (rng) => {
      const value = rng.int(38, 247);
      const answer = nibbles(toBinary(value, 8));
      const off = toBinary(value + 1, 8);

      return {
        prompt: `Convert the denary number ${value} to an 8-bit binary number.`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles(off), // arithmetic slip of one
          nibbles(toBinary(value - 1, 8)),
          nibbles([...toBinary(value, 8)].reverse().join("")), // wrote it the wrong way round
          nibbles(toBinary(Math.floor(value / 2), 8)),
        ]),
        explanation:
          `Subtract the largest power of two that fits, repeatedly: ${subtractionTrace(value)}. ` +
          `That places a 1 in each column used, giving ${answer}.`,
        check: () => (fromBinary(toBinary(value, 8)) === value ? null : "does not re-read"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Hexadecimal
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.num.hex-to-den",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "hexadecimal",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 18,
    build: (rng) => {
      const value = rng.int(42, 250);
      const hex = toHex(value, 2);
      const [hi, lo] = [Math.floor(value / 16), value % 16];
      const answer = String(value);

      return {
        prompt: `Convert the hexadecimal number ${hex} to denary.`,
        answer,
        distractors: numericSlips(answer, [
          hi * 10 + lo, // treated the first digit as tens
          hi + lo, // just added the digits
          value + 16,
          value - 16,
          hi * 16 * 16 + lo,
        ]),
        explanation:
          `A two-digit hex number is (first digit × 16) + second digit. ` +
          `Here that is (${hi} × 16) + ${lo} = ${hi * 16} + ${lo} = ${value}.`,
        check: () => (fromHex(hex) === value ? null : `hex re-reads as ${fromHex(hex)}`),
      };
    },
  }),

  generator({
    key: "cs.num.den-to-hex",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "hexadecimal",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 18,
    build: (rng) => {
      const value = rng.int(43, 249);
      const answer = toHex(value, 2);
      const hi = Math.floor(value / 16);
      const lo = value % 16;

      return {
        prompt: `Convert the denary number ${value} to a two-digit hexadecimal number.`,
        answer,
        distractors: pickDistractors(answer, [
          toHex(value + 1, 2),
          toHex(value - 1, 2),
          `${lo.toString(16).toUpperCase()}${hi.toString(16).toUpperCase()}`.padStart(2, "0"), // digits swapped
          toHex(hi * 10 + lo, 2),
        ]),
        explanation:
          `Divide by 16: ${value} ÷ 16 = ${hi} remainder ${lo}. ` +
          `The quotient is the first hex digit and the remainder is the second, giving ${answer}.`,
        check: () => (fromHex(answer) === value ? null : "does not re-read"),
      };
    },
  }),

  generator({
    key: "cs.num.bin-to-hex",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "hexadecimal",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const value = rng.int(40, 250);
      const bits = toBinary(value, 8);
      const answer = toHex(value, 2);

      return {
        prompt: `Convert the binary number ${nibbles(bits)} to hexadecimal.`,
        answer,
        distractors: pickDistractors(answer, [
          toHex(fromBinary(bits.slice(4) + bits.slice(0, 4)), 2), // swapped the nibbles
          toHex(value + 1, 2),
          String(value), // gave the denary value
          toHex(value - 16, 2),
        ]),
        explanation:
          `Split the byte into two nibbles — ${bits.slice(0, 4)} and ${bits.slice(4)} — and convert each ` +
          `to one hex digit: ${fromBinary(bits.slice(0, 4)).toString(16).toUpperCase()} and ` +
          `${fromBinary(bits.slice(4)).toString(16).toUpperCase()}, giving ${answer}.`,
        check: () => (fromHex(answer) === fromBinary(bits) ? null : "nibble split disagrees"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Binary addition and shifts
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.num.binary-addition",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-addition",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const a = rng.int(30, 110);
      const b = rng.int(30, 110);
      const sum = a + b;
      const overflow = sum > 255;
      const answer = overflow
        ? "The result overflows 8 bits and a carry is lost"
        : nibbles(toBinary(sum, 8));

      return {
        prompt:
          `Add the 8-bit binary numbers ${nibbles(toBinary(a, 8))} and ${nibbles(toBinary(b, 8))}. ` +
          `Give the 8-bit result, or state what happens if it does not fit.`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles(toBinary((a + b) % 256, 8)) === answer
            ? nibbles(toBinary(Math.abs(a - b), 8))
            : nibbles(toBinary((a + b) % 256, 8)), // kept only the low 8 bits without noticing
          nibbles(toBinary(Math.abs(a - b), 8)), // subtracted
          nibbles(toBinary(a ^ b, 8)), // XORed — forgot to carry
          overflow ? nibbles(toBinary(sum - 256, 8)) : "The result overflows 8 bits and a carry is lost",
          nibbles(toBinary(a & b, 8)),
        ]),
        explanation:
          `${a} + ${b} = ${sum}. ` +
          (overflow
            ? `${sum} is greater than 255, the largest value 8 bits can hold, so the ninth carry bit ` +
              `is lost and the stored answer is wrong — this is overflow.`
            : `In binary that is ${nibbles(toBinary(sum, 8))}, carrying a 1 into the next column ` +
              `whenever a column adds to 2 or 3.`),
        check: () => (a + b === sum ? null : "sum mismatch"),
      };
    },
  }),

  generator({
    key: "cs.num.binary-shift",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-shifts",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const base = rng.int(9, 60);
      const places = rng.int(1, 3);
      const left = rng.bool();
      const result = left ? base * 2 ** places : Math.floor(base / 2 ** places);
      const factor = 2 ** places;
      const answer = left
        ? `Multiplies the number by ${factor}`
        : `Divides the number by ${factor} (rounding down)`;

      return {
        prompt:
          `An 8-bit register holds the denary value ${base}. It undergoes a logical ${left ? "left" : "right"} ` +
          `shift of ${places} place${places === 1 ? "" : "s"}. What is the effect on the value?`,
        answer,
        distractors: othersFrom(answer, [
          `Multiplies the number by ${factor}`,
          `Divides the number by ${factor} (rounding down)`,
          `Multiplies the number by ${places}`,
          `Divides the number by ${places}`,
          `Adds ${factor} to the number`,
          `Leaves the value unchanged but moves the sign bit`,
        ]),
        explanation:
          `Each place of a left shift doubles the value and each place of a right shift halves it, ` +
          `so a shift of ${places} means a factor of 2^${places} = ${factor}. ` +
          `Here ${base} becomes ${result}${left ? "" : ", with the remainder lost off the right-hand end"}.`,
        check: () => {
          const expected = left ? base * factor : Math.floor(base / factor);
          return expected === result ? null : "shift result mismatch";
        },
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Units of storage
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.num.storage-units",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "storage-units",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 5,
    build: (rng) => {
      const cases = [
        { q: "How many bits are there in one byte?", a: 8, pool: [8, 4, 16, 2, 1024] },
        { q: "How many bits are there in one nibble?", a: 4, pool: [4, 8, 2, 16, 1] },
        { q: "How many bytes are there in one kilobyte (using the 1 kB = 1000 B convention)?", a: 1000, pool: [1000, 1024, 8000, 100, 1_000_000] },
        { q: "How many kilobytes are there in one megabyte?", a: 1000, pool: [1000, 1024, 100, 1_000_000, 8] },
        { q: "How many megabytes are there in 3 gigabytes?", a: 3000, pool: [3000, 3072, 300, 3, 30_000] },
      ] as const;
      const c = rng.pick(cases);

      return {
        prompt: c.q,
        answer: String(c.a),
        distractors: pickDistractors(String(c.a), c.pool.map(String)),
        explanation:
          `In the convention used by the current specifications each unit is 1000 times the one below: ` +
          `8 bits to a byte, then ×1000 for each of kilobyte, megabyte, gigabyte and terabyte. ` +
          `The answer is ${c.a}.`,
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Two's complement (A-Level)
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.num.twos-complement",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "twos-complement",
    curriculumLevel: A_LEVEL,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const negative = rng.int(-120, -3);
      const pattern = twosComplement8(negative);
      const answer = nibbles(pattern);
      const magnitude = Math.abs(negative);

      return {
        prompt: `Represent the denary value ${negative} as an 8-bit two's complement binary number.`,
        answer,
        distractors: pickDistractors(answer, [
          nibbles("1" + toBinary(magnitude, 7)), // sign-and-magnitude instead
          nibbles(invert(toBinary(magnitude, 8))), // stopped at one's complement
          nibbles(toBinary(magnitude, 8)), // ignored the sign entirely
          nibbles(twosComplement8(negative + 1)),
        ]),
        explanation:
          `Write +${magnitude} as 8-bit binary (${toBinary(magnitude, 8)}), invert every bit ` +
          `(${invert(toBinary(magnitude, 8))}), then add 1 to get ${pattern}. ` +
          `The leading 1 marks it as negative.`,
        check: () => (fromTwosComplement8(pattern) === negative ? null : "pattern does not read back"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Character sets
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.rep.ascii-arithmetic",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "character-sets",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      /* 'A' is 65 and 'a' is 97; the gap between a letter and its position is
         all the arithmetic these questions need. */
      const upper = rng.bool();
      const base = upper ? 65 : 97;
      const letterFrom = rng.int(0, 21);
      const shift = rng.int(2, 4);
      const startChar = String.fromCharCode(base + letterFrom);
      const endChar = String.fromCharCode(base + letterFrom + shift);
      const answer = String(base + letterFrom + shift);

      return {
        prompt:
          `In ASCII, '${startChar}' has the character code ${base + letterFrom}. ` +
          `What is the character code for '${endChar}'?`,
        answer,
        distractors: numericSlips(answer, [
          base + letterFrom - shift, // moved the wrong way
          base + letterFrom + shift - 1,
          base + letterFrom + shift + (upper ? 32 : -32), // jumped case
          base + letterFrom + shift + 1,
        ]),
        explanation:
          `The letters are stored in alphabetical order with consecutive codes, so each step along ` +
          `the alphabet adds 1. Moving ${shift} places from '${startChar}' gives ` +
          `${base + letterFrom} + ${shift} = ${answer}.`,
        check: () => (endChar.charCodeAt(0) === base + letterFrom + shift ? null : "code mismatch"),
      };
    },
  }),

  generator({
    key: "cs.rep.character-storage",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "character-sets",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 14,
    build: (rng) => {
      const chars = rng.int(12, 400);
      const bitsPer = rng.pick([7, 8, 16] as const);
      const setName = bitsPer === 7 ? "standard ASCII" : bitsPer === 8 ? "extended ASCII" : "16-bit Unicode (UTF-16)";
      const totalBits = chars * bitsPer;
      const answer = `${totalBits} bits`;

      return {
        prompt:
          `A text file holds ${chars} characters, each stored using ${setName}. ` +
          `How many bits are needed for the characters?`,
        answer,
        distractors: pickDistractors(answer, [
          `${chars * (bitsPer === 16 ? 8 : bitsPer * 2)} bits`, // wrong bits-per-character
          `${chars + bitsPer} bits`,
          `${totalBits / 8} bits`, // gave bytes but labelled bits
          `${chars} bits`,
        ]),
        explanation:
          `${setName} uses ${bitsPer} bits per character, so ${chars} characters need ` +
          `${chars} × ${bitsPer} = ${totalBits} bits.`,
        check: () => (chars * bitsPer === totalBits ? null : "product mismatch"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Images
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.rep.colour-depth",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "image-representation",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 8,
    build: (rng) => {
      const depth = rng.int(1, 8);
      const colours = 2 ** depth;
      const answer = String(colours);

      return {
        prompt: `A bitmap image uses a colour depth of ${depth} bit${depth === 1 ? "" : "s"} per pixel. How many different colours can it represent?`,
        answer,
        distractors: numericSlips(answer, [
          depth * 2, // multiplied instead of raising to a power
          2 ** depth - 1,
          depth ** 2,
          2 ** (depth + 1),
        ]),
        explanation:
          `Each bit doubles the number of available colours, so n bits give 2ⁿ. ` +
          `Here 2^${depth} = ${colours}.`,
        check: () => (2 ** depth === colours ? null : "power mismatch"),
      };
    },
  }),

  generator({
    key: "cs.rep.image-size",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "file-size",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const width = rng.int(8, 64);
      const height = rng.int(8, 64);
      const depth = rng.pick([1, 2, 4, 8] as const);
      const bits = width * height * depth;
      const bytes = Math.ceil(bits / 8);
      const answer = `${bytes} bytes`;

      return {
        prompt:
          `A bitmap image is ${width} pixels wide and ${height} pixels high with a colour depth of ` +
          `${depth} bit${depth === 1 ? "" : "s"}. Ignoring metadata, what is its file size in bytes?`,
        answer,
        distractors: pickDistractors(answer, [
          `${bits} bytes`, // forgot to divide by 8
          `${width * height} bytes`, // ignored the colour depth
          `${Math.ceil((width + height) * depth / 8)} bytes`, // added the dimensions
          `${Math.ceil(bits / 8 / 1000)} bytes`,
        ]),
        explanation:
          `Size in bits = width × height × colour depth = ${width} × ${height} × ${depth} = ${bits}. ` +
          `Divide by 8 for bytes: ${bytes}.`,
        check: () => (Math.ceil((width * height * depth) / 8) === bytes ? null : "size mismatch"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Sound
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.rep.sound-size",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "sound-representation",
    curriculumLevel: GCSE_LATE,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const rate = rng.pick([8000, 11025, 16000, 22050, 44100] as const);
      const depth = rng.pick([8, 16] as const);
      const seconds = rng.int(2, 20);
      const bits = rate * depth * seconds;
      const answer = `${bits} bits`;

      return {
        prompt:
          `A mono sound clip is sampled ${rate} times per second at ${depth} bits per sample and lasts ` +
          `${seconds} seconds. How many bits are needed to store the samples?`,
        answer,
        distractors: pickDistractors(answer, [
          `${rate * seconds} bits`, // dropped the sample resolution
          `${rate * depth} bits`, // dropped the duration
          `${(rate + depth) * seconds} bits`,
          `${bits / 8} bits`,
        ]),
        explanation:
          `Bits = sample rate × bit depth × duration = ${rate} × ${depth} × ${seconds} = ${bits}. ` +
          `A stereo clip would double this for the two channels.`,
        check: () => (rate * depth * seconds === bits ? null : "product mismatch"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     Compression
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.rep.compression-choice",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "compression",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 4,
    build: (rng) => {
      const cases = [
        {
          q: "A photographer needs to email a set of high-resolution photos and file size matters more than keeping every pixel exact. Which type of compression is most appropriate?",
          a: "Lossy compression",
          why: "Lossy compression permanently discards detail the eye is unlikely to notice, giving a much smaller file — acceptable when a perfect copy is not required.",
        },
        {
          q: "A program's source code must be compressed for download and then restored exactly. Which type of compression is required?",
          a: "Lossless compression",
          why: "Source code cannot lose a single character, so only lossless compression — which reconstructs the original perfectly — can be used.",
        },
        {
          q: "Which statement about lossless compression is correct?",
          a: "The original file can be reconstructed exactly from the compressed version",
          why: "Lossless methods record enough information (for example run lengths or a dictionary) to rebuild the original byte for byte.",
        },
        {
          q: "Why does compressing a file help when sending it over a network?",
          a: "A smaller file takes less time to transmit and uses less bandwidth",
          why: "Compression reduces the number of bits sent, so the transfer finishes sooner and leaves more capacity for other traffic.",
        },
      ] as const;
      const c = rng.pick(cases);
      const pool = [
        "Lossy compression",
        "Lossless compression",
        "The original file can be reconstructed exactly from the compressed version",
        "The file is encrypted so it cannot be read in transit",
        "A smaller file takes less time to transmit and uses less bandwidth",
        "Some detail is permanently lost but the file cannot be opened without a key",
        "Compression always doubles the transfer speed regardless of file type",
      ];

      return {
        prompt: c.q,
        answer: c.a,
        distractors: othersFrom(c.a, pool),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  generator({
    key: "cs.rep.rle",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "run-length-encoding",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const symbols = ["A", "B", "C"];
      const runs: { s: string; n: number }[] = [];
      const runCount = rng.int(3, 5);
      let prev = "";
      for (let i = 0; i < runCount; i++) {
        let s = rng.pick(symbols);
        while (s === prev) s = rng.pick(symbols);
        prev = s;
        runs.push({ s, n: rng.int(2, 6) });
      }
      const raw = runs.map((r) => r.s.repeat(r.n)).join("");
      const pairs = runs.length;
      const answer = `${pairs} pairs (${pairs * 2} values)`;

      return {
        prompt:
          `A row of pixels is stored as the string ${raw}. ` +
          `Using run-length encoding that records each run as a (value, count) pair, how much data is stored?`,
        answer,
        distractors: pickDistractors(answer, [
          `${raw.length} pairs (${raw.length * 2} values)`, // encoded every character
          `${pairs} pairs (${pairs} values)`, // forgot each pair is two values
          `${pairs - 1} pairs (${(pairs - 1) * 2} values)`,
          `${raw.length} values`,
        ]),
        explanation:
          `RLE replaces each unbroken run with one pair, so the ${runs.length} runs ` +
          `(${runs.map((r) => `${r.n}×${r.s}`).join(", ")}) become ${pairs} pairs, which is ${pairs * 2} values in total. ` +
          `RLE only saves space when runs are long; on data with few repeats it can make the file larger.`,
        check: () => (runs.reduce((t, r) => t + r.n, 0) === raw.length ? null : "run lengths do not total"),
      };
    },
  }),

  /* ------------------------------------------------------------------------
     A short trace-style question that also exercises number work
     ------------------------------------------------------------------------ */

  generator({
    key: "cs.num.parity-bit",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "character-sets",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 14,
    build: (rng) => {
      const seven = toBinary(rng.int(5, 126), 7);
      const ones = [...seven].filter((b) => b === "1").length;
      const even = rng.bool();
      const parityBit = even ? (ones % 2 === 0 ? "0" : "1") : (ones % 2 === 0 ? "1" : "0");
      const answer = parityBit;

      return {
        prompt: code([
          [0, `The 7-bit value ${seven} is to be sent with ${even ? "an even" : "an odd"} parity bit added on the left.`],
          [0, `What is the value of the parity bit?`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          parityBit === "0" ? "1" : "0",
          "Any value — a parity bit is ignored when the byte is received",
          "It cannot be set until the data has been received",
          `The number of 1 bits in the data (${ones})`,
        ]),
        explanation:
          `The data has ${ones} one${ones === 1 ? "" : "s"}. ${even ? "Even" : "Odd"} parity means the total number ` +
          `of ones including the parity bit must be ${even ? "even" : "odd"}, so the parity bit is ${parityBit}.`,
        check: () => {
          const total = ones + Number(parityBit);
          return total % 2 === (even ? 0 : 1) ? null : "parity does not hold";
        },
      };
    },
  }),
];

/* -------------------------------------------------------------------------- */

function bitSum(bits: string): string {
  const values: number[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[bits.length - 1 - i] === "1") values.unshift(2 ** i);
  }
  return values.join(" + ");
}

function subtractionTrace(value: number): string {
  const steps: string[] = [];
  let remaining = value;
  for (let power = 128; power >= 1; power /= 2) {
    if (remaining >= power) {
      steps.push(`${remaining} − ${power} = ${remaining - power}`);
      remaining -= power;
    }
  }
  return steps.join(", ");
}

function invert(bits: string): string {
  return [...bits].map((b) => (b === "1" ? "0" : "1")).join("");
}
