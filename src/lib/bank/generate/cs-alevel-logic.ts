/**
 * Boolean logic (A-Level): simplification with Boolean identities, Karnaugh
 * maps, and half and full adders.
 *
 * The adder and multi-variable truth-table questions are computed by evaluating
 * the logic over every input row; the identity and Karnaugh questions test the
 * named laws directly with worked cases.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

export const csALevelLogic: Generator[] = [
  recall({
    key: "cs.alog.identities",
    topic: "cs-boolean",
    subtopic: "boolean-algebra",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "Using Boolean algebra, simplify A·B + A·B̄ (where B̄ means NOT B).",
        a: "A",
        wrong: ["B", "A·B", "A + B", "1"],
        why: "Factor out A: A·(B + B̄). Since B + B̄ = 1, this is A·1 = A.",
      },
      {
        q: "Using Boolean algebra, simplify A + A·B.",
        a: "A",
        wrong: ["A·B", "B", "A + B", "A·(1 + B)"],
        why: "This is the absorption law: A + A·B = A·(1 + B) = A·1 = A.",
      },
      {
        q: "Using Boolean algebra, simplify A·(A + B).",
        a: "A",
        wrong: ["A·B", "A + B", "A + A·B", "B"],
        why: "Absorption again: A·(A + B) = A·A + A·B = A + A·B = A.",
      },
      {
        q: "Using Boolean algebra, simplify A + Ā·B.",
        a: "A + B",
        wrong: ["A·B", "A", "B", "Ā + B"],
        why: "A + Ā·B = (A + Ā)·(A + B) = 1·(A + B) = A + B.",
      },
      {
        q: "Using Boolean algebra, simplify A·B + Ā·B.",
        a: "B",
        wrong: ["A", "A·B", "A + B", "0"],
        why: "Factor out B: B·(A + Ā) = B·1 = B.",
      },
      {
        q: "What does A·B + A·B̄ + Ā·B simplify to?",
        a: "A + B",
        wrong: ["A·B", "A", "B", "Ā + B̄"],
        why: "A·B + A·B̄ = A, leaving A + Ā·B, which by the earlier identity is A + B.",
      },
      {
        q: "Using De Morgan's law, the expression NOT(A + B + C) is equivalent to:",
        a: "Ā·B̄·C̄",
        wrong: ["Ā + B̄ + C̄", "A·B·C", "NOT(A·B·C)", "Ā·B̄ + C̄"],
        why: "Negating an OR of terms gives the AND of each term negated.",
      },
      {
        q: "Simplify A·1 + 0·B.",
        a: "A",
        wrong: ["B", "A + B", "1", "0"],
        why: "A·1 = A and 0·B = 0, so the expression is A + 0 = A.",
      },
    ],
  }),

  generator({
    key: "cs.alog.full-adder",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "adders",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 8,
    build: (_rng, index) => {
      const combos: [number, number, number][] = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
      ];
      const [a, b, cin] = combos[index % combos.length];
      const total = a + b + cin;
      const sum = total & 1;
      const cout = total >> 1;
      const answer = `Sum = ${sum}, Carry-out = ${cout}`;
      return {
        prompt: `A full adder is given inputs A = ${a}, B = ${b} and Carry-in = ${cin}. What are its Sum and Carry-out outputs?`,
        answer,
        distractors: othersFrom(answer, [
          `Sum = ${sum ^ 1}, Carry-out = ${cout}`,
          `Sum = ${sum}, Carry-out = ${cout ^ 1}`,
          `Sum = ${cout}, Carry-out = ${sum}`,
          `Sum = ${(a | b | cin) & 1}, Carry-out = ${a & b & cin}`,
        ]),
        explanation:
          `A full adder adds the three input bits: ${a} + ${b} + ${cin} = ${total}. ` +
          `In binary that is ${cout}${sum}, so Sum (the low bit) = ${sum} and Carry-out (the high bit) = ${cout}.`,
        check: () => {
          const t = a + b + cin;
          return (t & 1) === sum && t >> 1 === cout ? null : "adder mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.alog.adder-concepts",
    topic: "cs-boolean",
    subtopic: "adders",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "What is the key difference between a half adder and a full adder?",
        a: "A full adder has a third input for a carry from the previous column; a half adder does not",
        wrong: [
          "A half adder outputs only a sum; a full adder outputs only a carry",
          "A full adder works in hexadecimal and a half adder in binary",
          "A half adder can only add 0 + 0",
          "A full adder is built from OR gates and a half adder from AND gates",
        ],
        why: "Because it accepts a carry-in, full adders can be chained to add numbers wider than one bit.",
      },
      {
        q: "To add two 8-bit numbers, how many full adders are chained together in a ripple-carry adder?",
        a: "8 (one per bit column), with the carry-out of each feeding the carry-in of the next",
        wrong: [
          "1, reused eight times by a loop in hardware",
          "16, two per bit column",
          "4, because each adder handles two bits",
          "64, one for every pair of bits",
        ],
        why: "Each column needs a full adder; the first column can be a half adder since it has no carry-in.",
      },
      {
        q: "Why is a ripple-carry adder slower for wide numbers?",
        a: "Each column must wait for the carry from the column to its right to settle before its output is valid",
        wrong: [
          "It has to convert the numbers to denary first",
          "The clock speed drops automatically as the numbers get wider",
          "It processes one bit per clock cycle by design",
          "Wide numbers must be stored in RAM between columns",
        ],
        why: "The worst-case delay grows with the number of bits; carry-lookahead adders trade gates for speed to fix this.",
      },
      {
        q: "Which logic gates implement a half adder's Sum and Carry outputs?",
        a: "Sum is A XOR B; Carry is A AND B",
        wrong: [
          "Sum is A AND B; Carry is A XOR B",
          "Sum is A OR B; Carry is A AND B",
          "Sum is A XOR B; Carry is A OR B",
          "Both outputs come from a single NAND gate",
        ],
        why: "Sum is 1 when exactly one input is 1 (XOR); a carry is generated only when both are 1 (AND).",
      },
    ],
  }),

  recall({
    key: "cs.alog.karnaugh",
    topic: "cs-boolean",
    subtopic: "karnaugh-maps",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "In a Karnaugh map, why must the cells within a group be arranged so that adjacent cells differ by exactly one variable?",
        a: "So that each grouping corresponds to a variable that can be eliminated, using A + Ā = 1",
        wrong: [
          "So the map can be drawn as a square",
          "So that every cell is used exactly once",
          "So the 1s and 0s alternate neatly",
          "So the map matches the truth table's row order",
        ],
        why: "A pair that differs in one variable means that variable takes both values inside the group, so it drops out of the term.",
      },
      {
        q: "A group of 4 adjacent 1s in the Karnaugh map of a 3-variable function eliminates how many variables from that term?",
        a: "2",
        wrong: ["1", "3", "0", "4"],
        why: "Each doubling of the group size removes one variable: a group of 2 removes 1, a group of 4 removes 2.",
      },
      {
        q: "Why must Karnaugh-map groups have a size that is a power of two (1, 2, 4, 8, …)?",
        a: "Only power-of-two groups let a whole set of variables take every combination of values and so cancel out",
        wrong: [
          "Because computers only work in powers of two",
          "Because the map always has a power-of-two number of cells",
          "To make the groups fit on the page",
          "So that no cell is left ungrouped",
        ],
        why: "A group of 3, say, cannot correspond to a clean product term because no variable is fully covered.",
      },
      {
        q: "What is the purpose of allowing Karnaugh-map groups to 'wrap around' the edges of the map?",
        a: "Cells on opposite edges are logically adjacent (they differ by one variable), so wrapping finds larger, simpler groups",
        wrong: [
          "It is only a drawing convenience with no logical meaning",
          "It lets groups of odd size be formed",
          "It is used only for maps of 5 or more variables",
          "It converts the sum-of-products form into product-of-sums",
        ],
        why: "The Gray-code ordering of rows and columns makes the top and bottom (and left and right) edges neighbours.",
      },
      {
        q: "What is the overall aim of using a Karnaugh map?",
        a: "To find a minimal sum-of-products expression, so the circuit uses the fewest gates",
        wrong: [
          "To count how many inputs a function has",
          "To convert a circuit diagram into a truth table",
          "To test a circuit for faults after it is built",
          "To work out the propagation delay of a circuit",
        ],
        why: "Fewer, larger groups mean fewer and smaller product terms, which means a cheaper, faster circuit.",
      },
    ],
  }),

  generator({
    key: "cs.alog.function-count",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "truth-tables",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 6,
    build: (_rng, index) => {
      const exprs: { text: string; f: (a: number, b: number, c: number) => number }[] = [
        { text: "A·B + C", f: (a, b, c) => (a & b) | c },
        { text: "A·(B + C̄)", f: (a, b, c) => a & (b | (c ^ 1)) },
        { text: "(A ⊕ B) + (B·C)", f: (a, b, c) => (a ^ b) | (b & c) },
        { text: "Ā·B + A·C", f: (a, b, c) => ((a ^ 1) & b) | (a & c) },
        { text: "(A + B)·(B + C)", f: (a, b, c) => (a | b) & (b | c) },
        { text: "A·B·C + Ā·B̄·C̄", f: (a, b, c) => (a & b & c) | ((a ^ 1) & (b ^ 1) & (c ^ 1)) },
      ];
      const e = exprs[index % exprs.length];
      let count = 0;
      const trueRows: string[] = [];
      for (const a of [0, 1])
        for (const b of [0, 1])
          for (const c of [0, 1]) {
            if (e.f(a, b, c)) {
              count++;
              trueRows.push(`${a}${b}${c}`);
            }
          }
      const answer = String(count);
      return {
        prompt: code([
          [0, `Consider the Boolean function F(A, B, C) = ${e.text}.`],
          [0, "For how many of the 8 possible input combinations is F equal to 1?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(8 - count), // counted the zeros
          String(Math.min(8, count + 1)),
          String(Math.max(0, count - 1)),
          String(count + 2),
        ]),
        explanation:
          `Evaluating F over all 8 rows, it is 1 for the input(s) ${trueRows.join(", ")} — ` +
          `that is ${count} row${count === 1 ? "" : "s"}.`,
        check: () => {
          let c2 = 0;
          for (const a of [0, 1]) for (const b of [0, 1]) for (const cc of [0, 1]) if (e.f(a, b, cc)) c2++;
          return c2 === count ? null : "row recount mismatch";
        },
      };
    },
  }),
];
