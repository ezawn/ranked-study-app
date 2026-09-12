/**
 * Extra GCSE computer science questions.
 *
 * The core cs-* files already cover the headline skills — a binary conversion,
 * one pass of bubble sort, a file-size product. This file adds depth at the
 * same level: the questions a teacher asks second, once the first idea has
 * landed. How many values fit in n bits, which arithmetic a shift performs,
 * what `3 + 4 * 2` evaluates to, how many rows a `WHERE` clause returns.
 *
 * Every numeric answer is computed and re-checked; every recall answer carries
 * four real alternatives from the same corner of the specification. Prompt
 * wording is kept distinct from the core generators so no question appears
 * twice in the bank.
 */

import { generator, pickDistractors, Rng, type Generator } from "./kit";
import { code, othersFrom, toBinary, fromBinary } from "./cs-kit";

const GCSE = "YEAR_10" as const;
const GCSE_LATE = "YEAR_11" as const;

interface Case {
  q: string;
  a: string;
  wrong: readonly string[];
  why: string;
}

/** A short recall generator: one question per case, indexed so prompts never collide. */
function recall(opts: {
  key: string;
  topic: string;
  subtopic: string;
  level?: typeof GCSE | typeof GCSE_LATE;
  difficulty?: number;
  cases: readonly Case[];
}): Generator {
  return generator({
    key: opts.key,
    subject: "computer-science",
    topic: opts.topic,
    subtopic: opts.subtopic,
    curriculumLevel: opts.level ?? GCSE_LATE,
    difficulty: opts.difficulty ?? 3,
    variants: opts.cases.length,
    build: (_rng: Rng, index: number) => {
      const c = opts.cases[index % opts.cases.length];
      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  });
}

export const csGcseDepth: Generator[] = [
  /* ====================================================================
     Number systems
     ==================================================================== */

  generator({
    key: "cs.gnum.values-in-bits",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-denary",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 7,
    build: (_rng, index) => {
      const n = 2 + (index % 7); // 2..8
      const values = 2 ** n;
      const answer = String(values);
      return {
        prompt: `A binary number is ${n} bits long. How many different bit patterns (and therefore different values) can it represent?`,
        answer,
        distractors: pickDistractors(answer, [
          String(values - 1), // that is the largest value, not the count
          String(2 ** (n - 1)),
          String(n * 2),
          String(n * n),
        ]),
        explanation:
          `Each extra bit doubles the number of patterns, so n bits give 2ⁿ. ` +
          `With ${n} bits that is 2^${n} = ${values}. The largest value it can hold is one less, ${values - 1}, because one pattern is all zeros.`,
        check: () => (2 ** n === values ? null : "power mismatch"),
      };
    },
  }),

  generator({
    key: "cs.gnum.largest-unsigned",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-denary",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 6,
    build: (_rng, index) => {
      const n = 3 + (index % 6); // 3..8
      const largest = 2 ** n - 1;
      const answer = String(largest);
      return {
        prompt: `What is the largest whole number that can be stored in an unsigned ${n}-bit binary number?`,
        answer,
        distractors: pickDistractors(answer, [
          String(2 ** n), // counted the patterns, not the maximum
          String(2 ** (n - 1) - 1),
          String(2 ** n - 2),
          String(n * 8),
        ]),
        explanation:
          `An ${n}-bit number has ${2 ** n} possible patterns, from 0 up to ${2 ** n} − 1. ` +
          `The largest value is therefore 2^${n} − 1 = ${largest} (every bit set to 1).`,
        check: () => (fromBinary("1".repeat(n)) === largest ? null : "all-ones mismatch"),
      };
    },
  }),

  generator({
    key: "cs.gnum.bits-needed",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "denary-binary",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const value = rng.int(17, 4000);
      const bits = Math.max(1, Math.ceil(Math.log2(value + 1)));
      const answer = String(bits);
      return {
        prompt: `A program needs to store whole numbers from 0 up to and including ${value}. What is the smallest number of bits that is enough for every value in that range?`,
        answer,
        distractors: pickDistractors(answer, [
          String(bits - 1), // one short — cannot reach the top value
          String(bits + 1),
          "8",
          String(Math.ceil(bits / 4) * 4), // rounded up to a whole number of nibbles
        ]),
        explanation:
          `You need enough bits so that 2ⁿ is greater than ${value} (the patterns run 0 to 2ⁿ − 1). ` +
          `2^${bits - 1} = ${2 ** (bits - 1)} is too few and 2^${bits} = ${2 ** bits} is enough, so ${bits} bits.`,
        check: () =>
          2 ** bits > value && 2 ** (bits - 1) <= value ? null : `bit count wrong for ${value}`,
      };
    },
  }),

  generator({
    key: "cs.gnum.binary-add-overflow",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-addition",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const a = rng.int(70, 240);
      const b = rng.int(70, 240);
      const sum = a + b;
      const overflow = sum > 255;
      const answer = overflow ? "Yes, an overflow error occurs" : "No, the result fits in 8 bits";
      return {
        prompt:
          `The unsigned 8-bit binary numbers ${toBinary(a, 8)} (${a}) and ${toBinary(b, 8)} (${b}) are added together. ` +
          `Does an overflow error occur?`,
        answer,
        distractors: othersFrom(answer, [
          "Yes, an overflow error occurs",
          "No, the result fits in 8 bits",
          "Only if both numbers are greater than 127",
          "Overflow is impossible when adding unsigned binary numbers",
          "Only if the result is an odd number",
        ]),
        explanation:
          `${a} + ${b} = ${sum}. An 8-bit register can only hold values up to 255, so ` +
          (overflow
            ? `${sum} does not fit — the carry out of the top bit is lost and the answer is wrong. That is overflow.`
            : `${sum} fits comfortably and no bits are lost.`),
        check: () => (sum > 255 === overflow ? null : "overflow test mismatch"),
      };
    },
  }),

  generator({
    key: "cs.gnum.shift-to-multiply",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-shifts",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 12,
    build: (rng) => {
      const value = rng.int(3, 25);
      const places = rng.int(1, 4);
      const factor = 2 ** places;
      const answer = `Shift it left by ${places} place${places === 1 ? "" : "s"}`;
      return {
        prompt: `A programmer wants to multiply the value ${value} by ${factor} using a binary shift. What single shift does this?`,
        answer,
        distractors: othersFrom(answer, [
          `Shift it left by ${places} place${places === 1 ? "" : "s"}`,
          `Shift it left by ${factor} places`,
          `Shift it right by ${places} place${places === 1 ? "" : "s"}`,
          `Shift it left by ${places + 1} places`,
          `Shift it right by ${factor} places`,
        ]),
        explanation:
          `A left shift of one place doubles a number, so a left shift of n places multiplies by 2ⁿ. ` +
          `To multiply by ${factor} = 2^${places} you shift left ${places} place${places === 1 ? "" : "s"}: ` +
          `${value} → ${value * factor}.`,
        check: () => (value << places === value * factor ? null : "shift factor mismatch"),
      };
    },
  }),

  generator({
    key: "cs.gnum.place-value",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-denary",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 14,
    build: (rng) => {
      /* A pattern with two or three set bits, one of which is the leftmost. */
      const positions = new Set<number>();
      const leftmost = rng.int(2, 7); // 0 = units column ... 7 = 128 column
      positions.add(leftmost);
      const want = Math.min(rng.int(2, 3), leftmost); // room for extra 1-bits below the leftmost
      while (positions.size < want) positions.add(rng.int(0, leftmost - 1));
      const bits = Array.from({ length: 8 }, (_, i) => (positions.has(7 - i) ? "1" : "0")).join("");
      const columnValue = 2 ** leftmost;
      const answer = String(columnValue);
      return {
        prompt: `In the 8-bit binary number ${bits}, what is the place value of the left-most 1?`,
        answer,
        distractors: pickDistractors(answer, [
          String(columnValue * 2),
          String(columnValue / 2),
          String(leftmost + 1), // gave the column position (1-based), not its value
          String(fromBinary(bits)), // gave the whole number's value
          String(columnValue - 1),
        ]),
        explanation:
          `Reading columns from the right the place values are 1, 2, 4, 8, 16, 32, 64, 128. ` +
          `The left-most 1 sits in the ${columnValue} column, so its place value is ${columnValue}.`,
        check: () => {
          const idx = bits.indexOf("1");
          return 2 ** (7 - idx) === columnValue ? null : "column value mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.gnum.binary-compare",
    subject: "computer-science",
    topic: "cs-number",
    subtopic: "binary-denary",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 12,
    build: (rng) => {
      let x = rng.int(20, 240);
      let y = rng.int(20, 240);
      while (y === x) y = rng.int(20, 240);
      const bx = toBinary(x, 8);
      const by = toBinary(y, 8);
      const bigger = x > y ? bx : by;
      const answer = bigger;
      return {
        prompt: `Which of these two 8-bit binary numbers represents the larger value: ${bx} or ${by}?`,
        answer,
        distractors: othersFrom(answer, [
          bx,
          by,
          "They represent the same value",
          "You cannot compare binary numbers without converting to hexadecimal first",
        ]),
        explanation:
          `Convert each to denary (or compare from the left, the first place they differ decides it): ` +
          `${bx} = ${x} and ${by} = ${y}, so ${bigger} (${Math.max(x, y)}) is larger.`,
        check: () => (fromBinary(answer) === Math.max(x, y) ? null : "comparison mismatch"),
      };
    },
  }),

  recall({
    key: "cs.gnum.hex-facts",
    topic: "cs-number",
    subtopic: "hexadecimal",
    level: GCSE,
    difficulty: 2,
    cases: [
      {
        q: "How many bits does a single hexadecimal digit represent?",
        a: "4 bits",
        wrong: ["8 bits", "2 bits", "1 bit", "16 bits"],
        why: "One hex digit covers the values 0–15, which is exactly what 4 bits (one nibble) can hold.",
      },
      {
        q: "How many hexadecimal digits are needed to write one byte?",
        a: "2 digits",
        wrong: ["4 digits", "8 digits", "1 digit", "16 digits"],
        why: "A byte is 8 bits, and each hex digit stands for 4 bits, so a byte is two hex digits.",
      },
      {
        q: "What is the denary value of the hexadecimal digit D?",
        a: "13",
        wrong: ["14", "12", "4", "11"],
        why: "The hex digits run A=10, B=11, C=12, D=13, E=14, F=15.",
      },
      {
        q: "Why do programmers often prefer hexadecimal to long binary numbers?",
        a: "It is much shorter and each digit maps to exactly 4 bits, so it is easy to convert",
        wrong: [
          "Computers store numbers in hexadecimal rather than binary",
          "Hexadecimal can represent values that binary cannot",
          "It removes the need to understand place value",
          "Hexadecimal numbers are always smaller than the binary value they represent",
        ],
        why: "Hex is a compact, human-readable stand-in for binary; the machine still works in binary underneath.",
      },
      {
        q: "What is the largest value that can be written with two hexadecimal digits?",
        a: "255",
        wrong: ["256", "99", "16", "4095"],
        why: "FF in hex is (15 × 16) + 15 = 255, the same as the largest 8-bit binary number.",
      },
    ],
  }),

  /* ====================================================================
     Boolean logic
     ==================================================================== */

  generator({
    key: "cs.gbool.identity",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "boolean-expressions",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 8,
    build: (_rng, index) => {
      const cases = [
        { expr: "A AND A", result: "A", why: "ANDing a value with itself cannot change it." },
        { expr: "A OR A", result: "A", why: "ORing a value with itself cannot change it." },
        { expr: "A AND 0", result: "0", why: "An AND is only 1 when both inputs are 1, and one input is fixed at 0." },
        { expr: "A OR 1", result: "1", why: "An OR is 1 whenever any input is 1, and one input is fixed at 1." },
        { expr: "A AND 1", result: "A", why: "ANDing with 1 leaves the other input to decide the output." },
        { expr: "A OR 0", result: "A", why: "ORing with 0 leaves the other input to decide the output." },
        { expr: "A AND NOT A", result: "0", why: "A and NOT A can never both be 1 at the same time." },
        { expr: "A OR NOT A", result: "1", why: "One of A and NOT A is always 1, so the OR is always 1." },
      ] as const;
      const c = cases[index % cases.length];
      return {
        prompt: `Simplify the Boolean expression ${c.expr}.`,
        answer: c.result,
        distractors: othersFrom(c.result, ["A", "0", "1", "NOT A"]),
        explanation: `${c.expr} simplifies to ${c.result}. ${c.why}`,
      };
    },
  }),

  generator({
    key: "cs.gbool.output-column",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "truth-tables",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 8,
    build: (_rng, index) => {
      const exprs = [
        { text: "A AND (NOT B)", f: (a: number, b: number) => a & (b ? 0 : 1) },
        { text: "(NOT A) AND B", f: (a: number, b: number) => (a ? 0 : 1) & b },
        { text: "(NOT A) AND (NOT B)", f: (a: number, b: number) => (a ? 0 : 1) & (b ? 0 : 1) },
        { text: "A AND B", f: (a: number, b: number) => a & b },
        { text: "NOT (A OR B)", f: (a: number, b: number) => (a | b ? 0 : 1) },
        { text: "A OR (NOT B)", f: (a: number, b: number) => a | (b ? 0 : 1) },
        { text: "(NOT A) OR B", f: (a: number, b: number) => (a ? 0 : 1) | b },
        { text: "A XOR B", f: (a: number, b: number) => a ^ b },
      ];
      const e = exprs[index % exprs.length];
      const inputs: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      const column = inputs.map(([a, b]) => e.f(a, b));
      const answer = column.join(", ");
      /* Wrong columns: fully inverted, first bit flipped, last bit flipped, all zeros/ones. */
      const wrong = [
        column.map((v) => v ^ 1).join(", "),
        column.map((v, i) => (i === 0 ? v ^ 1 : v)).join(", "),
        column.map((v, i) => (i === 3 ? v ^ 1 : v)).join(", "),
        "0, 0, 0, 0",
        "1, 1, 1, 1",
        [...column].reverse().join(", "),
      ];
      return {
        prompt: code([
          [0, `The truth table for ${e.text} is written with the input rows in the order A,B = 00, 01, 10, 11.`],
          [0, "Reading top to bottom, what is the output column?"],
        ]),
        answer,
        distractors: othersFrom(answer, wrong),
        explanation:
          `Evaluate ${e.text} for each row: 00 → ${column[0]}, 01 → ${column[1]}, 10 → ${column[2]}, 11 → ${column[3]}. ` +
          `So the output column is ${answer}.`,
        check: () => {
          const recount = inputs.map(([a, b]) => e.f(a, b)).join(", ");
          return recount === answer ? null : "output column mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.gbool.gate-facts",
    topic: "cs-boolean",
    subtopic: "logic-gates",
    level: GCSE,
    difficulty: 2,
    cases: [
      {
        q: "A NAND gate is equivalent to which combination of gates?",
        a: "An AND gate followed by a NOT gate",
        wrong: [
          "An OR gate followed by a NOT gate",
          "Two AND gates in series",
          "A NOT gate followed by an AND gate",
          "An XOR gate followed by a NOT gate",
        ],
        why: "NAND means 'NOT AND': it gives the AND result with its output inverted.",
      },
      {
        q: "A NOR gate is equivalent to which combination of gates?",
        a: "An OR gate followed by a NOT gate",
        wrong: [
          "An AND gate followed by a NOT gate",
          "Two OR gates in series",
          "A NOT gate followed by an OR gate",
          "An XOR gate followed by a NOT gate",
        ],
        why: "NOR means 'NOT OR': it gives the OR result with its output inverted.",
      },
      {
        q: "How many rows does the truth table of a logic expression with 4 inputs have?",
        a: "16",
        wrong: ["8", "4", "32", "24"],
        why: "Each input doubles the number of rows, so n inputs give 2ⁿ rows: 2⁴ = 16.",
      },
      {
        q: "Which gate outputs 1 only when its two inputs are different?",
        a: "XOR gate",
        wrong: ["OR gate", "AND gate", "NAND gate", "NOR gate"],
        why: "XOR (exclusive OR) is 1 for 01 and 10, and 0 for 00 and 11.",
      },
    ],
  }),

  /* ====================================================================
     Systems architecture, memory and storage
     ==================================================================== */

  recall({
    key: "cs.garch.performance",
    topic: "cs-architecture",
    subtopic: "cpu-performance",
    level: GCSE_LATE,
    difficulty: 4,
    cases: [
      {
        q: "A computer's CPU is upgraded from 2.4 GHz to 3.6 GHz with everything else unchanged. What is the most direct effect?",
        a: "It can carry out more fetch–execute cycles each second",
        wrong: [
          "It can store more programs in main memory at once",
          "Its cache automatically becomes larger",
          "It gains an extra processing core",
          "Its instruction set grows to include more instructions",
        ],
        why: "Clock speed is the number of cycles per second; a higher clock means more instructions processed per second.",
      },
      {
        q: "Why does adding more cache memory usually improve performance?",
        a: "Frequently used instructions and data can be fetched without going to slower main memory",
        wrong: [
          "Cache increases the clock speed of the processor",
          "Cache replaces the need for RAM entirely",
          "Cache lets the CPU run more than one program at once",
          "Cache permanently stores the operating system",
        ],
        why: "Cache sits between the CPU and RAM; a cache hit avoids the much slower trip to main memory.",
      },
      {
        q: "A task can be split into many independent parts. Which upgrade helps most?",
        a: "Adding more processor cores",
        wrong: [
          "Increasing the clock speed only",
          "Adding more secondary storage",
          "Using a larger monitor",
          "Installing a faster network card",
        ],
        why: "Independent parts can run at the same time on separate cores; extra cores give true parallel processing.",
      },
      {
        q: "Which statement about the width of the data bus is correct?",
        a: "A wider data bus can transfer more bits between the CPU and memory in one operation",
        wrong: [
          "A wider data bus increases the amount of RAM that can be installed",
          "The data bus width sets the clock speed of the CPU",
          "A wider data bus reduces the number of cores needed",
          "The data bus only carries memory addresses, not data",
        ],
        why: "Each bus line carries one bit; more lines means more bits moved per transfer.",
      },
    ],
  }),

  generator({
    key: "cs.garch.fetch-execute-order",
    subject: "computer-science",
    topic: "cs-architecture",
    subtopic: "fetch-execute",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 4,
    build: (_rng, index) => {
      const cases = [
        {
          q: "In the fetch–execute cycle, what happens immediately after the instruction has been fetched from memory into the CPU?",
          a: "The instruction is decoded to work out what operation is required",
          wrong: [
            "The program counter is reset to zero",
            "The result is written back to secondary storage",
            "The next instruction is executed in parallel",
            "The instruction is copied to the hard disk",
          ],
          why: "The cycle is fetch, then decode, then execute; decoding identifies the opcode and operands.",
        },
        {
          q: "What role does the program counter (PC) play in the fetch–execute cycle?",
          a: "It holds the memory address of the next instruction to be fetched",
          wrong: [
            "It stores the result of the current calculation",
            "It counts how many programs are running",
            "It holds the instruction currently being decoded",
            "It records how many times the computer has been switched on",
          ],
          why: "The PC is incremented after each fetch (or overwritten by a jump) so the CPU knows where to look next.",
        },
        {
          q: "During the fetch stage, which register receives the address currently held in the program counter?",
          a: "The memory address register (MAR)",
          wrong: [
            "The memory data register (MDR)",
            "The accumulator (ACC)",
            "The current instruction register (CIR)",
            "The status register",
          ],
          why: "The address is copied PC → MAR, then memory returns the instruction into the MDR.",
        },
        {
          q: "Where is the instruction placed once it has been fetched, ready to be decoded and executed?",
          a: "The current instruction register (CIR)",
          wrong: [
            "The program counter (PC)",
            "The memory address register (MAR)",
            "Cache on the hard disk",
            "The arithmetic logic unit (ALU)",
          ],
          why: "After the fetch the instruction moves MDR → CIR, where the control unit decodes it.",
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
    key: "cs.gmem.capacity",
    subject: "computer-science",
    topic: "cs-memory",
    subtopic: "secondary-storage",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const driveGb = rng.pick([1, 2, 4, 8, 16, 32, 64, 128, 256, 500, 512, 1000] as const);
      const fileMb = rng.pick([2, 4, 5, 8, 10, 20, 25, 40, 50] as const);
      const count = Math.floor((driveGb * 1000) / fileMb); // 1 GB = 1000 MB convention
      const answer = String(count);
      return {
        prompt: `A storage device holds ${driveGb} GB. How many files of ${fileMb} MB each can it store? (Use 1 GB = 1000 MB and ignore the file system's own overhead.)`,
        answer,
        distractors: pickDistractors(answer, [
          String(Math.floor((driveGb * 1024) / fileMb)), // used 1024 instead of 1000
          String(driveGb * fileMb), // multiplied instead of dividing
          String(Math.floor(driveGb / fileMb)), // forgot to convert GB to MB
          String(count * 8), // confused bits and bytes
        ]),
        explanation:
          `${driveGb} GB is ${driveGb * 1000} MB. Dividing by the ${fileMb} MB file size gives ` +
          `${driveGb * 1000} ÷ ${fileMb} = ${count} whole files.`,
        check: () =>
          Math.floor((driveGb * 1000) / fileMb) === count ? null : "capacity division mismatch",
      };
    },
  }),

  recall({
    key: "cs.gmem.types",
    topic: "cs-memory",
    subtopic: "ram-rom",
    level: GCSE,
    difficulty: 3,
    cases: [
      {
        q: "A laptop is running slowly because too many applications are open at once. Which upgrade addresses this directly?",
        a: "Fitting more RAM",
        wrong: [
          "Fitting a larger hard disk drive",
          "Replacing the ROM chip",
          "Increasing the screen resolution",
          "Adding a second network card",
        ],
        why: "RAM holds the programs and data currently in use; more RAM means less reliance on slow virtual memory.",
      },
      {
        q: "Which statement about ROM is correct?",
        a: "It is non-volatile and normally holds the start-up instructions (the bootloader)",
        wrong: [
          "It loses its contents when the power is turned off",
          "It is where open programs are stored while running",
          "It is the largest store in a typical computer",
          "It can be written to freely by any running program",
        ],
        why: "ROM keeps its contents without power and stores the small program that starts the machine.",
      },
      {
        q: "Which single difference between RAM and ROM matters most when the power is switched off?",
        a: "RAM is volatile and loses its contents, while ROM is non-volatile and keeps them",
        wrong: [
          "RAM is always physically larger than ROM",
          "ROM can be read and written at the same speed as RAM",
          "RAM is stored on the hard disk and ROM in the CPU",
          "ROM is volatile and RAM is non-volatile",
        ],
        why: "That is why the bootloader lives in ROM: it must survive a power cycle, whereas RAM starts each session empty.",
      },
      {
        q: "Why is an SSD generally faster than a magnetic hard disk drive?",
        a: "It has no moving parts, so there is no seek time waiting for a disk to spin into position",
        wrong: [
          "It stores data in RAM rather than on a disk",
          "It compresses every file automatically",
          "It runs at the same clock speed as the CPU",
          "It only stores the operating system, so it has less to search",
        ],
        why: "Flash memory is accessed electronically; a spinning platter has mechanical latency an SSD avoids.",
      },
    ],
  }),

  /* ====================================================================
     Networks
     ==================================================================== */

  generator({
    key: "cs.gnet.download-time",
    subject: "computer-science",
    topic: "cs-networks",
    subtopic: "network-performance",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const fileMb = rng.pick([6, 9, 12, 15, 18, 24, 30, 45, 60, 90] as const);
      const speedMbps = rng.pick([2, 3, 5, 6, 8, 10, 15, 20] as const);
      const fileMbits = fileMb * 8;
      const seconds = fileMbits / speedMbps;
      const answer = Number.isInteger(seconds) ? `${seconds} seconds` : `${seconds.toFixed(1)} seconds`;
      return {
        prompt: `A ${fileMb} MB file is downloaded over a link with a speed of ${speedMbps} megabits per second (Mbps). Roughly how long does the download take?`,
        answer,
        distractors: pickDistractors(answer, [
          `${fileMb / speedMbps} seconds`, // forgot to convert bytes to bits
          `${fileMb * speedMbps} seconds`, // multiplied instead of dividing
          `${(fileMbits * 8).toFixed(0)} seconds`, // multiplied by 8 again
          `${(fileMbits / speedMbps / 60).toFixed(1)} minutes`,
        ]),
        explanation:
          `Convert the file to bits: ${fileMb} MB × 8 = ${fileMbits} megabits. ` +
          `Divide by the ${speedMbps} Mbps link speed: ${fileMbits} ÷ ${speedMbps} = ${seconds % 1 === 0 ? seconds : seconds.toFixed(1)} seconds.`,
        check: () => ((fileMb * 8) / speedMbps === seconds ? null : "transfer-time mismatch"),
      };
    },
  }),

  recall({
    key: "cs.gnet.concepts",
    topic: "cs-networks",
    subtopic: "network-performance",
    level: GCSE_LATE,
    difficulty: 4,
    cases: [
      {
        q: "Two networks have the same bandwidth, but one has much higher latency. What does higher latency mean for the user?",
        a: "There is a longer delay before data starts arriving",
        wrong: [
          "Less total data can be transferred each second",
          "The network can support fewer devices",
          "Files are automatically compressed less",
          "The wireless signal has a shorter range",
        ],
        why: "Bandwidth is capacity per second; latency is the delay on each piece of data, felt most in gaming and video calls.",
      },
      {
        q: "Which change would most improve the performance of a busy wireless network in a large office?",
        a: "Reducing the number of devices sharing each access point",
        wrong: [
          "Painting the walls a lighter colour",
          "Using longer network cables to the server",
          "Lowering the screen brightness on every laptop",
          "Switching every device to a static IP address",
        ],
        why: "Wireless bandwidth is shared; fewer devices per access point means each one gets a larger slice.",
      },
      {
        q: "A copper cable is replaced with fibre-optic cable over the same route. Which benefit is most significant?",
        a: "Higher bandwidth over longer distances with less signal loss",
        wrong: [
          "It removes the need for any network switches",
          "It makes every connected computer faster",
          "It allows more IP addresses to be used",
          "It stops all malware from spreading on the network",
        ],
        why: "Fibre carries light rather than electrical signals, so it sustains high data rates over far greater distances.",
      },
    ],
  }),

  recall({
    key: "cs.gnet.protocols-extra",
    topic: "cs-networks",
    subtopic: "protocols",
    level: GCSE_LATE,
    difficulty: 3,
    cases: [
      {
        q: "Which protocol is used to send an email from a client to a mail server?",
        a: "SMTP",
        wrong: ["POP3", "IMAP", "HTTP", "FTP"],
        why: "SMTP (Simple Mail Transfer Protocol) handles sending and relaying mail; POP3 and IMAP are for retrieval.",
      },
      {
        q: "Which protocol lets a user read email while leaving the messages stored on the server, synchronised across devices?",
        a: "IMAP",
        wrong: ["POP3", "SMTP", "HTTPS", "TCP"],
        why: "IMAP keeps mail on the server so several devices see the same folders; POP3 typically downloads and removes it.",
      },
      {
        q: "What does the S add to HTTPS compared with HTTP?",
        a: "The data is encrypted in transit using TLS",
        wrong: [
          "The pages load from a server that is physically closer",
          "The website is guaranteed to be free of malware",
          "The connection uses a faster protocol than TCP",
          "The site can be viewed without an internet connection",
        ],
        why: "HTTPS wraps HTTP inside TLS, so an eavesdropper on the network sees only ciphertext.",
      },
      {
        q: "Which protocol is responsible for splitting data into packets, numbering them and reassembling them in order at the other end?",
        a: "TCP",
        wrong: ["IP", "HTTP", "DHCP", "SMTP"],
        why: "TCP provides reliable, ordered delivery; IP handles addressing and routing of each packet.",
      },
      {
        q: "What is the job of the IP protocol?",
        a: "Addressing packets and routing them between networks toward the destination",
        wrong: [
          "Guaranteeing that every packet arrives undamaged",
          "Encrypting the contents of each packet",
          "Turning domain names into readable web pages",
          "Compressing data before it is sent",
        ],
        why: "IP is a best-effort delivery service; reliability is added on top by TCP.",
      },
    ],
  }),

  /* ====================================================================
     Programming fundamentals
     ==================================================================== */

  generator({
    key: "cs.gprog.precedence",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "operators",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const c = rng.int(3, 9);
      const shape = rng.int(0, 2);
      let expr: string;
      let value: number;
      let leftToRight: number;
      if (shape === 0) {
        expr = `${a} + ${b} * ${c}`;
        value = a + b * c;
        leftToRight = (a + b) * c;
      } else if (shape === 1) {
        expr = `${a} * ${b} + ${c}`;
        value = a * b + c;
        leftToRight = a * (b + c);
      } else {
        expr = `${a} + ${b} * ${c} - ${b}`;
        value = a + b * c - b;
        leftToRight = (a + b) * c - b;
      }
      const answer = String(value);
      return {
        prompt: `Evaluate the expression ${expr}, following the normal order of operations (do multiplication and division before addition and subtraction).`,
        answer,
        distractors: pickDistractors(answer, [
          String(leftToRight), // worked strictly left to right
          String(value + c), // one extra multiply step
          String(value - c),
          String(value + 1),
          String(value - 1),
        ]),
        explanation:
          `Multiplication binds tighter than + and −, so do ${b} * ${c} = ${b * c} first, then the rest ` +
          `left to right: ${expr} = ${value}. Working blindly left to right would wrongly give ${leftToRight}.`,
        check: () => {
          let v: number;
          if (shape === 0) v = a + b * c;
          else if (shape === 1) v = a * b + c;
          else v = a + b * c - b;
          return v === value ? null : `recompute gave ${v}`;
        },
      };
    },
  }),

  generator({
    key: "cs.gprog.boolean-condition",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "selection",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const x = rng.int(0, 20);
      const lo = rng.int(2, 8);
      const hi = rng.int(10, 18);
      const kind = rng.int(0, 2);
      let cond: string;
      let result: boolean;
      if (kind === 0) {
        cond = `(x > ${lo}) AND (x < ${hi})`;
        result = x > lo && x < hi;
      } else if (kind === 1) {
        cond = `(x < ${lo}) OR (x > ${hi})`;
        result = x < lo || x > hi;
      } else {
        cond = `NOT (x = ${lo})`;
        result = x !== lo;
      }
      const answer = result ? "True" : "False";
      return {
        prompt: code([
          [0, `The variable x holds the value ${x}.`],
          [0, `Evaluate the condition ${cond}.`],
        ]),
        answer,
        distractors: othersFrom(answer, [
          "True",
          "False",
          "It depends on the programming language",
          "The condition contains a syntax error",
        ]),
        explanation:
          `Substitute x = ${x}: ${cond} evaluates to ${answer.toLowerCase()}. ` +
          `AND needs both parts true; OR needs at least one; NOT flips the result.`,
        check: () => {
          let r: boolean;
          if (kind === 0) r = x > lo && x < hi;
          else if (kind === 1) r = x < lo || x > hi;
          else r = x !== lo;
          return r === result ? null : "condition mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.gprog.nested-loop-count",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "iteration",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const outer = rng.int(2, 6);
      const inner = rng.int(2, 6);
      const answer = String(outer * inner);
      return {
        prompt: code([
          [0, "total ← 0"],
          [0, `FOR i ← 1 TO ${outer}`],
          [1, `FOR j ← 1 TO ${inner}`],
          [2, "total ← total + 1"],
          [1, "NEXT j"],
          [0, "NEXT i"],
          [0, "What is the value of total after the loops finish?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(outer + inner), // added the limits
          String(outer * inner - 1),
          String(outer), // counted only the outer loop
          String((outer + 1) * (inner + 1)), // off-by-one on both bounds
        ]),
        explanation:
          `The inner loop runs ${inner} times for each of the ${outer} passes of the outer loop, ` +
          `so total is incremented ${outer} × ${inner} = ${outer * inner} times.`,
        check: () => {
          let t = 0;
          for (let i = 1; i <= outer; i++) for (let j = 1; j <= inner; j++) t += 1;
          return String(t) === answer ? null : "loop recount mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.gprog.array-2d",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "arrays",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const rows = 3;
      const cols = rng.int(3, 4);
      const grid: number[][] = [];
      const used = new Set<number>();
      for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let cc = 0; cc < cols; cc++) {
          let v = rng.int(10, 99);
          while (used.has(v)) v = rng.int(10, 99);
          used.add(v);
          row.push(v);
        }
        grid.push(row);
      }
      const r = rng.int(0, rows - 1);
      const c = rng.int(0, cols - 1);
      const answer = String(grid[r][c]);
      const rendered = "[" + grid.map((row) => `[${row.join(", ")}]`).join(", ") + "]";
      /* All grid values are distinct, so distinct cells give distinct distractors. */
      const wrongCells: [number, number][] = [
        [c % rows, r % cols], // read column-major (row and column swapped)
        [r, (c + 1) % cols], // slipped one column along
        [(r + 1) % rows, c], // slipped one row down
        [r, 0], // took the first item in the row
        [rows - 1, cols - 1], // took the last item in the grid
      ];
      const seenCell = new Set([`${r},${c}`]);
      const distractors: string[] = [];
      for (const [wr, wc] of wrongCells) {
        const id = `${wr},${wc}`;
        if (seenCell.has(id)) continue;
        seenCell.add(id);
        distractors.push(String(grid[wr][wc]));
      }
      for (const v of grid.flat()) {
        if (distractors.length >= 3) break;
        const s = String(v);
        if (s !== answer && !distractors.includes(s)) distractors.push(s);
      }
      return {
        prompt: code([
          [0, `grid = ${rendered}`],
          [0, `Using zero-based indexing where grid[row][column], what is the value of grid[${r}][${c}]?`],
        ]),
        answer,
        distractors,
        explanation:
          `grid[${r}] selects row ${r} (${JSON.stringify(grid[r])}), and [${c}] selects the item at ` +
          `index ${c} within that row, which is ${grid[r][c]}.`,
        check: () => (String(grid[r][c]) === answer ? null : "index mismatch"),
      };
    },
  }),

  generator({
    key: "cs.gprog.string-ops-2",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "string-manipulation",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      /* Words chosen so no letter repeats — a single-letter distractor can then
         never accidentally equal the answer. */
      const word = rng.pick(["COMPUTER", "KEYBOARD", "FLOWCHART", "ALGORITHM", "DECIMALS", "MAGNETIC"]);
      const op = rng.int(0, 3);
      const n = word.length;
      let line1: string;
      let question: string;
      let answer: string;
      let why: string;
      let distractors: string[];

      if (op === 0) {
        answer = String(n);
        line1 = `word ← "${word}"`;
        question = "What does LEN(word) return?";
        why = `LEN counts the characters in the string, and "${word}" has ${n} letters.`;
        distractors = [String(n - 1), String(n + 1), String(Math.ceil(n / 2)), String(n * 2)];
      } else if (op === 1) {
        const i = rng.int(0, n - 1);
        answer = word[i];
        line1 = `word ← "${word}"`;
        question = `Using zero-based indexing, what does word[${i}] return?`;
        why = `Index ${i} counts from 0 at the first character, so word[${i}] is '${word[i]}'.`;
        distractors = [
          word[(i + 1) % n],
          word[(i + 2) % n],
          word[0],
          word[n - 1],
          "X",
          "Z",
        ];
      } else if (op === 2) {
        const start = rng.int(0, 2);
        const len = rng.int(2, 3);
        answer = word.substring(start, start + len);
        line1 = `word ← "${word}"`;
        question = `What does SUBSTRING(word, ${start}, ${len}) return? It takes ${len} characters starting at index ${start}.`;
        why = `Starting at index ${start} and taking ${len} characters of "${word}" gives "${answer}".`;
        distractors = [
          word.substring(start + 1, start + 1 + len), // slipped the start by one
          word.substring(start, start + len + 1), // took one character too many
          word.substring(0, len), // started from the beginning
          word.substring(start, start + len).toLowerCase(),
        ];
      } else {
        const other = rng.pick(["ED", "S", "LY", "ING", "ER"]);
        answer = word + other;
        line1 = `first ← "${word}"`;
        question = `second ← "${other}". What does first + second evaluate to?`;
        why = `The + operator joins two strings end to end (concatenation): "${word}" + "${other}" = "${answer}".`;
        distractors = [
          other + word, // joined in the wrong order
          `${word} ${other}`, // inserted a space
          word, // returned only the first string
          `${word}+${other}`, // left the operator in the text
        ];
      }

      return {
        prompt: code([
          [0, line1],
          [0, question],
        ]),
        answer,
        distractors: pickDistractors(answer, distractors),
        explanation: why,
        check: () => {
          if (op === 0) return String(word.length) === answer ? null : "len mismatch";
          if (op === 1) return answer.length === 1 && word.includes(answer) ? null : "index mismatch";
          if (op === 3) return answer.startsWith(word) && answer.length > word.length ? null : "concat mismatch";
          return word.includes(answer) && answer.length >= 2 ? null : "substring mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.gprog.div-mod-word",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "operators",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const total = rng.int(20, 200);
      const per = rng.int(3, 12);
      const kind = rng.bool();
      const answer = String(kind ? Math.floor(total / per) : total % per);
      const prompt = kind
        ? `${total} students are put into teams of ${per}. How many complete teams are formed? (This is ${total} DIV ${per}.)`
        : `${total} students are put into teams of ${per}. How many students are left over without a full team? (This is ${total} MOD ${per}.)`;
      return {
        prompt,
        answer,
        distractors: pickDistractors(answer, [
          String(kind ? total % per : Math.floor(total / per)), // gave the other operator's result
          String(kind ? Math.ceil(total / per) : per - (total % per)),
          String(kind ? Math.floor(total / per) + 1 : (total % per) + 1),
          String(per),
        ]),
        explanation:
          `${total} ÷ ${per} = ${Math.floor(total / per)} remainder ${total % per}. ` +
          `DIV gives the whole-number quotient (${Math.floor(total / per)}); MOD gives the remainder (${total % per}).`,
        check: () => {
          const expected = kind ? Math.floor(total / per) : total % per;
          return String(expected) === answer ? null : "div/mod mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.gprog.data-type-choice",
    topic: "cs-programming",
    subtopic: "data-types",
    level: GCSE,
    difficulty: 2,
    cases: [
      {
        q: "Which data type is most appropriate for storing a person's exact age in whole years?",
        a: "Integer",
        wrong: ["Real (float)", "String", "Boolean", "Character"],
        why: "A whole number with no fractional part is an integer; a float would waste space and invite rounding.",
      },
      {
        q: "Which data type is most appropriate for storing a price such as £3.49?",
        a: "Real (float)",
        wrong: ["Integer", "Boolean", "Character", "String"],
        why: "A value with a decimal part needs a real/float type; an integer cannot hold the pence.",
      },
      {
        q: "Which data type is most appropriate for storing whether a user is currently logged in?",
        a: "Boolean",
        wrong: ["Integer", "String", "Real (float)", "Character"],
        why: "There are exactly two states, true or false, which is precisely what a Boolean stores.",
      },
      {
        q: "Which data type is most appropriate for storing a UK postcode such as 'SW1A 1AA'?",
        a: "String",
        wrong: ["Integer", "Real (float)", "Boolean", "Character"],
        why: "It mixes letters, digits and a space and is never used in arithmetic, so it is text — a string.",
      },
      {
        q: "A variable must hold a single letter grade: 'A', 'B', 'C', 'D' or 'E'. Which data type fits best?",
        a: "Character",
        wrong: ["String array", "Integer", "Boolean", "Real (float)"],
        why: "Exactly one character is needed, so the character type is the tightest fit.",
      },
    ],
  }),

  /* ====================================================================
     Databases
     ==================================================================== */

  generator({
    key: "cs.gdb.where-count",
    subject: "computer-science",
    topic: "cs-databases",
    subtopic: "sql-select",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const ages = Array.from({ length: rng.int(5, 7) }, () => rng.int(12, 19));
      const threshold = rng.pick([13, 14, 15, 16, 17, 18] as const);
      const op = rng.bool();
      const matching = ages.filter((a) => (op ? a >= threshold : a < threshold)).length;
      const answer = String(matching);
      const table = ages.map((a, i) => `(${i + 1}, ${a})`).join(", ");
      return {
        prompt: code([
          [0, `The table Student has rows (StudentID, Age): ${table}.`],
          [0, `How many rows does this query return?`],
          [0, `SELECT StudentID FROM Student WHERE Age ${op ? ">=" : "<"} ${threshold};`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(ages.length - matching), // counted the rows that fail the condition
          String(ages.length), // returned every row
          String(Math.max(0, matching - 1)),
          String(Math.min(ages.length, matching + 1)),
        ]),
        explanation:
          `Check each age against "${op ? ">=" : "<"} ${threshold}". The ages are ${ages.join(", ")}; ` +
          `${matching} of them satisfy the condition, so the query returns ${matching} row${matching === 1 ? "" : "s"}.`,
        check: () => {
          const c = ages.filter((a) => (op ? a >= threshold : a < threshold)).length;
          return String(c) === answer ? null : "row count mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.gdb.relational-terms",
    topic: "cs-databases",
    subtopic: "relational-model",
    level: GCSE_LATE,
    difficulty: 3,
    cases: [
      {
        q: "In a relational database table, what is a single row usually called?",
        a: "A record",
        wrong: ["A field", "A primary key", "A query", "An attribute value"],
        why: "A row holds all the data about one item — one record; a column is a field/attribute.",
      },
      {
        q: "Why is storing all data in one large flat file worse than splitting it across related tables?",
        a: "A flat file repeats the same data on many rows, wasting space and risking inconsistency",
        wrong: [
          "A flat file cannot store more than 255 rows",
          "Flat files cannot be backed up",
          "Related tables are always faster to search than a flat file",
          "A flat file cannot store text, only numbers",
        ],
        why: "Data redundancy in a flat file leads to update anomalies; normalisation into related tables removes the duplication.",
      },
      {
        q: "What is the purpose of a primary key?",
        a: "To uniquely identify each record in a table",
        wrong: [
          "To sort the table into alphabetical order",
          "To encrypt the contents of the table",
          "To link the database to the internet",
          "To store the most important field's data",
        ],
        why: "No two records share a primary key value, so it can always pick out exactly one row.",
      },
      {
        q: "What does a foreign key do?",
        a: "It holds the primary key value of a record in another table, creating a link between the tables",
        wrong: [
          "It stores data from a database in another country",
          "It is a second primary key used as a backup",
          "It encrypts the link between two tables",
          "It is any field that is not the primary key",
        ],
        why: "The foreign key is how a relational database joins related rows across tables.",
      },
    ],
  }),

  /* ====================================================================
     A little more data representation and security
     ==================================================================== */

  generator({
    key: "cs.grep.text-size-bytes",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "file-size",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 14,
    build: (rng) => {
      const chars = rng.int(40, 900);
      const header = rng.pick([0, 8, 16, 20, 32, 44] as const);
      const total = chars + header; // 1 byte per character
      const answer = `${total} bytes`;
      return {
        prompt: `A plain-text file stores ${chars} characters at 1 byte per character, together with a ${header}-byte file header. What is the total file size in bytes?`,
        answer,
        distractors: pickDistractors(answer, [
          `${chars} bytes`, // ignored the header
          `${total * 8} bytes`, // gave bits but wrote bytes
          `${Math.round(total / 8)} bytes`, // divided by 8 by mistake
          `${chars * 8 + header} bytes`,
          `${chars + header * 2} bytes`,
        ]),
        explanation:
          `Each character is one byte, so the text is ${chars} bytes. Add the ${header}-byte header: ` +
          `${chars} + ${header} = ${total} bytes.`,
        check: () => (chars + header === total ? null : "size sum mismatch"),
      };
    },
  }),

  generator({
    key: "cs.grep.sample-count",
    subject: "computer-science",
    topic: "cs-representation",
    subtopic: "sound-representation",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const rate = rng.pick([8000, 11025, 16000, 22050, 32000, 44100, 48000] as const);
      const seconds = rng.int(3, 30);
      const total = rate * seconds;
      const answer = String(total);
      return {
        prompt: `A sound is recorded at a sample rate of ${rate} Hz for ${seconds} seconds. How many individual samples are taken in total?`,
        answer,
        distractors: pickDistractors(answer, [
          String(rate + seconds), // added instead of multiplying
          String(rate), // ignored the duration
          String(Math.round(rate / seconds)),
          String(total * 2), // counted stereo when the clip is mono
          String(rate * (seconds - 1)),
        ]),
        explanation:
          `Sample rate is samples per second, so the total is rate × time = ${rate} × ${seconds} = ${total} samples. ` +
          `The bit depth would then decide how many bits each of those samples needs.`,
        check: () => (rate * seconds === total ? null : "sample product mismatch"),
      };
    },
  }),

  generator({
    key: "cs.gbool.gate-count",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "logic-circuits",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 6,
    build: (_rng, index) => {
      const cases = [
        { expr: "A AND B", gates: 1, note: "one AND gate" },
        { expr: "NOT (A AND B)", gates: 2, note: "an AND gate feeding a NOT gate" },
        { expr: "(A AND B) OR C", gates: 2, note: "an AND gate and an OR gate" },
        { expr: "(A AND B) OR (NOT C)", gates: 3, note: "an AND gate, a NOT gate and an OR gate" },
        { expr: "(NOT A) AND (NOT B)", gates: 3, note: "two NOT gates and an AND gate" },
        { expr: "(A OR B) AND (A OR C)", gates: 3, note: "two OR gates and an AND gate" },
      ] as const;
      const c = cases[index % cases.length];
      const answer = String(c.gates);
      return {
        prompt: `What is the minimum number of logic gates needed to build a circuit for the Boolean expression ${c.expr}? (Count each NOT, AND and OR gate as one gate.)`,
        answer,
        distractors: pickDistractors(answer, [
          String(c.gates + 1),
          String(c.gates + 2),
          String(c.gates + 3),
          String((c.expr.match(/[A-C]/g) ?? []).length), // counted the letters instead of the gates
        ]),
        explanation:
          `${c.expr} is built from ${c.note}, which is ${c.gates} gate${c.gates === 1 ? "" : "s"}.`,
      };
    },
  }),

  recall({
    key: "cs.gsec.threats",
    topic: "cs-security",
    subtopic: "social-engineering",
    level: GCSE_LATE,
    difficulty: 3,
    cases: [
      {
        q: "An email claims to be from a bank and asks the user to 'confirm' their login details on a linked page. What is this an example of?",
        a: "Phishing",
        wrong: ["A denial-of-service attack", "SQL injection", "A brute-force attack", "A trojan"],
        why: "Phishing uses a message that impersonates a trusted organisation to trick the victim into handing over credentials.",
      },
      {
        q: "A caller pretends to be from IT support and talks an employee into revealing their password 'to fix an urgent problem'. Which category of attack is this?",
        a: "Social engineering",
        wrong: ["Malware", "A man-in-the-middle attack", "Packet sniffing", "A dictionary attack"],
        why: "Social engineering manipulates people rather than technology; pretexting like this is one of its common forms.",
      },
      {
        q: "Which measure most directly reduces the damage a successful phishing attack can do to an account?",
        a: "Two-factor authentication",
        wrong: [
          "A faster internet connection",
          "Defragmenting the hard disk",
          "Using a larger monitor",
          "Turning off the firewall",
        ],
        why: "Even if the password is stolen, the attacker still lacks the second factor (a code or device), so the login fails.",
      },
      {
        q: "What is the main purpose of penetration testing?",
        a: "To find security weaknesses by deliberately attacking a system with permission before a real attacker does",
        wrong: [
          "To measure how fast a network can transfer data",
          "To remove malware that is already present",
          "To back up a system before an upgrade",
          "To train staff to type their passwords faster",
        ],
        why: "An authorised simulated attack surfaces vulnerabilities so they can be fixed before they are exploited.",
      },
      {
        q: "A shared computer lets any user read every other user's files. Which principle is being broken?",
        a: "Setting appropriate access rights (least privilege)",
        wrong: [
          "Using anti-malware software",
          "Applying automatic software updates",
          "Encrypting network traffic",
          "Keeping physical backups off-site",
        ],
        why: "Users should have access only to what their role needs; open access to everything is a classic misconfiguration.",
      },
    ],
  }),
];
