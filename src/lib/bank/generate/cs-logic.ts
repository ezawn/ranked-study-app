/**
 * Boolean logic.
 *
 * A truth table is small enough to compute in full, so every question here is
 * built by evaluating the expression over all input combinations and reading
 * the answer off — the gate that matches a description, the number of rows that
 * output 1, the input row that makes a circuit true. Distractors are the other
 * gates and the other rows, never invented ones.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";

const GCSE = "YEAR_10" as const;
const GCSE_LATE = "YEAR_11" as const;
const A_LEVEL = "YEAR_12" as const;

type Gate = "AND" | "OR" | "NOT" | "XOR" | "NAND" | "NOR";

const GATE_OF: Record<Gate, (a: number, b: number) => number> = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  NOT: (a) => (a ? 0 : 1),
  XOR: (a, b) => a ^ b,
  NAND: (a, b) => (a & b ? 0 : 1),
  NOR: (a, b) => (a | b ? 0 : 1),
};

const GATE_DESCRIPTION: Record<Gate, string> = {
  AND: "outputs 1 only when both inputs are 1",
  OR: "outputs 1 when at least one input is 1",
  NOT: "outputs the opposite of its single input",
  XOR: "outputs 1 when its two inputs are different",
  NAND: "outputs 0 only when both inputs are 1",
  NOR: "outputs 1 only when both inputs are 0",
};

const ALL_GATES: Gate[] = ["AND", "OR", "NOT", "XOR", "NAND", "NOR"];

export const csLogic: Generator[] = [
  generator({
    key: "cs.bool.gate-from-description",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "logic-gates",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 6,
    build: (rng) => {
      const gate = rng.pick(ALL_GATES);
      const answer = `${gate} gate`;

      return {
        prompt: `Which logic gate ${GATE_DESCRIPTION[gate]}?`,
        answer,
        distractors: othersFrom(
          answer,
          ALL_GATES.map((g) => `${g} gate`),
        ),
        explanation:
          `The ${gate} gate ${GATE_DESCRIPTION[gate]}. ` +
          `NAND and NOR are the AND and OR gates with their output inverted.`,
      };
    },
  }),

  generator({
    key: "cs.bool.gate-output",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "truth-tables",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 16,
    build: (rng) => {
      const gate = rng.pick(["AND", "OR", "XOR", "NAND", "NOR"] as const);
      const a = rng.int(0, 1);
      const b = rng.int(0, 1);
      const out = GATE_OF[gate](a, b);
      const answer = String(out);

      return {
        prompt: `A ${gate} gate has inputs A = ${a} and B = ${b}. What is its output?`,
        answer,
        distractors: pickDistractors(answer, [
          String(out ? 0 : 1),
          `Always ${out ? 0 : 1} for a ${gate} gate`,
          "The same as input A",
          "Undefined when the two inputs are equal",
        ]),
        explanation:
          `A ${gate} gate ${GATE_DESCRIPTION[gate]}. With A = ${a} and B = ${b} the output is ${out}.`,
        check: () => (GATE_OF[gate](a, b) === out ? null : "gate output mismatch"),
      };
    },
  }),

  generator({
    key: "cs.bool.truth-table-count",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "truth-tables",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 6,
    build: (rng) => {
      const expr = rng.pick(TWO_INPUT_EXPRESSIONS);
      let count = 0;
      for (const a of [0, 1]) for (const b of [0, 1]) if (expr.f(a, b)) count++;
      const answer = String(count);

      return {
        prompt:
          `Consider the Boolean expression ${expr.text}, where A and B can each be 0 or 1. ` +
          `In how many of the four rows of its truth table is the output 1?`,
        answer,
        distractors: pickDistractors(answer, [
          String(4 - count), // counted the zeros
          String(Math.min(4, count + 1)),
          String(Math.max(0, count - 1)),
          "2 in every case",
        ]),
        explanation:
          `Evaluating ${expr.text} for all four combinations of A and B gives output 1 in ` +
          `${count} row${count === 1 ? "" : "s"}: ${rowsWhereTrue(expr.f)}.`,
        check: () => {
          let c = 0;
          for (const a of [0, 1]) for (const b of [0, 1]) if (expr.f(a, b)) c++;
          return c === count ? null : "recount mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.bool.expression-eval",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "boolean-expressions",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const expr = rng.pick(THREE_INPUT_EXPRESSIONS);
      const a = rng.int(0, 1);
      const b = rng.int(0, 1);
      const c = rng.int(0, 1);
      const out = expr.f(a, b, c);
      const answer = String(out);

      return {
        prompt: `Evaluate ${expr.text} for A = ${a}, B = ${b}, C = ${c}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(out ? 0 : 1),
          `${a | b | c} (evaluated as a plain OR of the inputs)`,
          `${a & b & c} (evaluated as a plain AND of the inputs)`,
          "Cannot be evaluated without a truth table",
        ]),
        explanation:
          `Work outwards from the brackets, applying NOT first, then AND, then OR: ` +
          `${expr.trace(a, b, c)} = ${out}.`,
        check: () => (expr.f(a, b, c) === out ? null : "expression mismatch"),
      };
    },
  }),

  generator({
    key: "cs.bool.circuit-output",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "logic-circuits",
    curriculumLevel: GCSE_LATE,
    difficulty: 5,
    variants: 6,
    build: (rng) => {
      const first = rng.pick(["AND", "OR", "XOR"] as const);
      const invert = rng.bool();
      const answer = invert ? `NOT (A ${first} B)` : `(A ${first} B) OR C`;

      const description = invert
        ? `Inputs A and B go into a ${first} gate. The output of that gate is the only input to a NOT gate.`
        : `Inputs A and B go into a ${first} gate. Its output and input C go into an OR gate.`;

      return {
        prompt: code([
          [0, description],
          [0, "Which Boolean expression describes the output of the circuit?"],
        ]),
        answer,
        distractors: othersFrom(answer, [
          `NOT (A ${first} B)`,
          `(A ${first} B) OR C`,
          `A ${first} (B OR C)`,
          `NOT A ${first} NOT B`,
          `(A ${first} B) AND C`,
          `A ${first} B ${first} C`,
        ]),
        explanation:
          `Trace the wires from the inputs to the final output. ${description} ` +
          `That is exactly ${answer}.`,
      };
    },
  }),

  generator({
    key: "cs.bool.de-morgan",
    subject: "computer-science",
    topic: "cs-boolean",
    subtopic: "de-morgans",
    curriculumLevel: A_LEVEL,
    difficulty: 6,
    variants: 6,
    build: (rng) => {
      const cases = [
        { from: "NOT (A AND B)", to: "(NOT A) OR (NOT B)" },
        { from: "NOT (A OR B)", to: "(NOT A) AND (NOT B)" },
        { from: "(NOT A) AND (NOT B)", to: "NOT (A OR B)" },
        { from: "(NOT A) OR (NOT B)", to: "NOT (A AND B)" },
        { from: "NOT (NOT A AND B)", to: "A OR (NOT B)" },
        { from: "NOT (A AND NOT B)", to: "(NOT A) OR B" },
      ] as const;
      const c = rng.pick(cases);

      return {
        prompt: `Using De Morgan's laws, which expression is equivalent to ${c.from}?`,
        answer: c.to,
        distractors: othersFrom(c.to, [
          "(NOT A) OR (NOT B)",
          "(NOT A) AND (NOT B)",
          "NOT (A OR B)",
          "NOT (A AND B)",
          "A OR (NOT B)",
          "(NOT A) OR B",
          "A AND B",
        ]),
        explanation:
          `De Morgan's laws: NOT (X AND Y) = (NOT X) OR (NOT Y), and NOT (X OR Y) = (NOT X) AND (NOT Y). ` +
          `Break the bar over the whole bracket, and swap AND with OR. ${c.from} becomes ${c.to}.`,
      };
    },
  }),
];

/* -------------------------------------------------------------------------- */

const TWO_INPUT_EXPRESSIONS: readonly { text: string; f: (a: number, b: number) => number }[] = [
  { text: "A AND B", f: (a, b) => a & b },
  { text: "A OR B", f: (a, b) => a | b },
  { text: "A XOR B", f: (a, b) => a ^ b },
  { text: "NOT (A AND B)", f: (a, b) => (a & b ? 0 : 1) },
  { text: "A AND (NOT B)", f: (a, b) => a & (b ? 0 : 1) },
  { text: "(NOT A) OR B", f: (a, b) => (a ? 0 : 1) | b },
];

const THREE_INPUT_EXPRESSIONS: readonly {
  text: string;
  f: (a: number, b: number, c: number) => number;
  trace: (a: number, b: number, c: number) => string;
}[] = [
  {
    text: "A AND (B OR C)",
    f: (a, b, c) => a & (b | c),
    trace: (a, b, c) => `${a} AND (${b} OR ${c}) = ${a} AND ${b | c}`,
  },
  {
    text: "(A OR B) AND (NOT C)",
    f: (a, b, c) => (a | b) & (c ? 0 : 1),
    trace: (a, b, c) => `(${a} OR ${b}) AND NOT ${c} = ${a | b} AND ${c ? 0 : 1}`,
  },
  {
    text: "NOT (A AND B) OR C",
    f: (a, b, c) => (a & b ? 0 : 1) | c,
    trace: (a, b, c) => `NOT (${a} AND ${b}) OR ${c} = ${a & b ? 0 : 1} OR ${c}`,
  },
  {
    text: "(A XOR B) AND C",
    f: (a, b, c) => (a ^ b) & c,
    trace: (a, b, c) => `(${a} XOR ${b}) AND ${c} = ${a ^ b} AND ${c}`,
  },
];

function rowsWhereTrue(f: (a: number, b: number) => number): string {
  const rows: string[] = [];
  for (const a of [0, 1]) for (const b of [0, 1]) if (f(a, b)) rows.push(`A=${a}, B=${b}`);
  return rows.join("; ");
}
