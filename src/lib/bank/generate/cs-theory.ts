/**
 * Theory of computation (A-Level): finite state machines, regular expressions,
 * Backus–Naur Form and computability.
 *
 * The FSM questions run the input string through a concrete transition table;
 * the regular-expression questions test the string against the real pattern.
 * BNF and computability are worked recall.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y13, recall } from "./cs-alevel-kit";

export const csTheory: Generator[] = [
  generator({
    key: "cs.thy.fsm-accept",
    subject: "computer-science",
    topic: "cs-theory",
    subtopic: "finite-state-machines",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      /* Three FSMs over the alphabet {0, 1}. Each is a transition table
         start -> [on 0, on 1]. Accepting states are listed. */
      const machines = [
        {
          name: "ends in 1",
          states: ["S0", "S1"],
          trans: { S0: ["S0", "S1"], S1: ["S0", "S1"] } as Record<string, [string, string]>,
          accept: ["S1"],
        },
        {
          name: "an even number of 1s",
          states: ["E", "O"],
          trans: { E: ["E", "O"], O: ["O", "E"] } as Record<string, [string, string]>,
          accept: ["E"],
        },
        {
          name: "contains the substring 10",
          states: ["A", "B", "C"],
          trans: { A: ["A", "B"], B: ["C", "B"], C: ["C", "C"] } as Record<string, [string, string]>,
          accept: ["C"],
        },
      ];
      const m = rng.pick(machines);
      const len = rng.int(4, 7);
      const input = Array.from({ length: len }, () => rng.int(0, 1)).join("");
      let state = m.states[0];
      for (const ch of input) state = m.trans[state][Number(ch)];
      const accepted = m.accept.includes(state);
      const answer = accepted ? "Accepted" : "Rejected";
      return {
        prompt: code([
          [0, `A finite state machine over the alphabet {0, 1} has start state ${m.states[0]} and this transition table:`],
          ...m.states.map(
            (s) => [1, `${s}:  on 0 → ${m.trans[s][0]},  on 1 → ${m.trans[s][1]}`] as [number, string],
          ),
          [0, `Accepting state(s): ${m.accept.join(", ")}.`],
          [0, `Is the input string ${input} accepted or rejected?`],
        ]),
        answer,
        distractors: othersFrom(answer, [
          accepted ? "Rejected" : "Accepted",
          `It ends in state ${state === m.states[0] ? m.states[1] : m.states[0]}`,
          "The string is invalid for this alphabet",
          "The machine loops forever on this input",
        ]),
        explanation:
          `Feed each symbol of ${input} through the table from ${m.states[0]}. ` +
          `The machine ends in state ${state}, which is ${accepted ? "an accepting state, so the string is accepted" : "not an accepting state, so the string is rejected"}. ` +
          `This machine accepts exactly the strings with ${m.name}.`,
        check: () => {
          let s = m.states[0];
          for (const ch of input) s = m.trans[s][Number(ch)];
          return m.accept.includes(s) === accepted ? null : "fsm re-run mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.thy.fsm-concepts",
    topic: "cs-theory",
    subtopic: "finite-state-machines",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "What does it mean for a finite state machine to have no output (to be an 'acceptor' or 'recogniser')?",
        a: "It only decides whether an input string is accepted, based on the state it finishes in",
        wrong: [
          "It produces a character of output on every transition",
          "It never halts, so it has no final answer",
          "It can only process strings of a fixed length",
          "It stores the whole input in memory as it reads it",
        ],
        why: "A Mealy or Moore machine produces output; an acceptor's answer is just accept or reject.",
      },
      {
        q: "Why can a finite state machine not recognise the language of strings with equal numbers of 0s and 1s (in any order)?",
        a: "It would need to count arbitrarily high, but it has only a fixed, finite number of states",
        wrong: [
          "The alphabet is too large",
          "It cannot read a string from left to right",
          "It has no start state",
          "Such strings are always infinite",
        ],
        why: "Counting without bound needs unbounded memory; that requires at least a pushdown automaton (a stack).",
      },
      {
        q: "In a state transition diagram, what does a double circle around a state indicate?",
        a: "It is an accepting (final) state",
        wrong: [
          "It is the start state",
          "It is a state the machine can never leave",
          "It is an error state",
          "It has a transition for every symbol in the alphabet",
        ],
        why: "If the machine is in a double-circled state when the input ends, the string is accepted.",
      },
    ],
  }),

  generator({
    key: "cs.thy.regex-match",
    subject: "computer-science",
    topic: "cs-theory",
    subtopic: "regular-expressions",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const patterns: { text: string; re: RegExp; strings: string[] }[] = [
        { text: "ab*c", re: /^ab*c$/, strings: ["ac", "abc", "abbbc", "abcc", "aabc", "abbcx"] },
        { text: "(a|b)+", re: /^(a|b)+$/, strings: ["a", "abba", "b", "", "abc", "aab a"] },
        { text: "a(bc)*d", re: /^a(bc)*d$/, strings: ["ad", "abcd", "abcbcd", "abccd", "abcd d", "abd"] },
        { text: "[01]+0", re: /^[01]+0$/, strings: ["00", "110", "0110", "01", "1", "0102"] },
        { text: "x+y?z", re: /^x+y?z$/, strings: ["xz", "xyz", "xxxz", "xxyz", "yz", "xyyz"] },
      ];
      const p = rng.pick(patterns);
      const s = rng.pick(p.strings);
      const matches = p.re.test(s);
      const shown = s === "" ? "(the empty string)" : `"${s}"`;
      const answer = matches ? "Yes, it matches" : "No, it does not match";
      return {
        prompt: `Does the string ${shown} match the regular expression  ${p.text}  (the whole string must match)?`,
        answer,
        distractors: othersFrom(answer, [
          matches ? "No, it does not match" : "Yes, it matches",
          "Only if matching is not anchored to the whole string",
          "The regular expression is not valid",
          "It matches only the first character",
        ]),
        explanation:
          `In ${p.text}, * means zero or more, + means one or more, ? means optional, | means alternatives and [ ] is a character set. ` +
          `Checking ${shown} against the whole pattern: it ${matches ? "matches" : "does not match"}.`,
        check: () => (p.re.test(s) === matches ? null : "regex re-test mismatch"),
      };
    },
  }),

  recall({
    key: "cs.thy.bnf",
    topic: "cs-theory",
    subtopic: "bnf",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "In Backus–Naur Form, what does the symbol ::= mean?",
        a: "'is defined as' — the left-hand non-terminal is defined by the right-hand side",
        wrong: [
          "'is not equal to'",
          "'is assigned the value of'",
          "'is a terminal symbol'",
          "'repeat zero or more times'",
        ],
        why: "A BNF rule has the form <name> ::= definition, where | separates alternative definitions.",
      },
      {
        q: "Given the rules  <digit> ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9  and  <number> ::= <digit> | <digit><number> , which string is a valid <number>?",
        a: "407",
        wrong: ["4.7", "-7", "40 7", "seven"],
        why: "<number> is one or more digits; a decimal point, a minus sign and a space are not produced by any rule.",
      },
      {
        q: "Why is Backus–Naur Form used to define the syntax of a programming language rather than plain English?",
        a: "It is precise and unambiguous, and a parser can be generated from it automatically",
        wrong: [
          "It is shorter to read than English",
          "It also defines what each construct means, not just its form",
          "It can express rules that are impossible to write in English",
          "It runs faster when the program is compiled",
        ],
        why: "A formal grammar removes the ambiguity of natural language and drives tools like parser generators.",
      },
      {
        q: "A BNF rule is  <list> ::= <item> | <item> , <list> . What kind of structure does the rule's reference to <list> within its own definition create?",
        a: "Recursion, which allows a list of any length",
        wrong: [
          "An infinite loop that never terminates",
          "A syntax error in the grammar",
          "A list limited to exactly two items",
          "A rule that can never be satisfied",
        ],
        why: "Recursive rules are how BNF expresses repetition; the base case <item> stops the recursion.",
      },
      {
        q: "What is the difference between a terminal and a non-terminal symbol in BNF?",
        a: "A terminal is a literal symbol that appears in the language; a non-terminal is a name for a rule and is expanded further",
        wrong: [
          "A terminal ends the program; a non-terminal continues it",
          "A terminal is optional; a non-terminal is required",
          "Terminals are numbers and non-terminals are letters",
          "There is no difference; the terms are interchangeable",
        ],
        why: "Non-terminals (in <angle brackets>) are replaced using the rules until only terminals remain.",
      },
    ],
  }),

  recall({
    key: "cs.thy.computability",
    topic: "cs-theory",
    subtopic: "computability",
    level: Y13,
    difficulty: 7,
    cases: [
      {
        q: "What does the halting problem state?",
        a: "There is no general algorithm that can decide, for every program and input, whether that program will eventually stop",
        wrong: [
          "Every program eventually halts if given enough time",
          "A program can always detect its own infinite loops",
          "Programs that halt always run in polynomial time",
          "Only recursive programs can fail to halt",
        ],
        why: "Turing proved it undecidable: assuming such an algorithm exists leads to a contradiction.",
      },
      {
        q: "A problem is described as 'intractable'. What does this mean?",
        a: "It can be solved in principle, but the best known algorithms take impractically long as the input grows (e.g. exponential time)",
        wrong: [
          "No algorithm to solve it can exist",
          "It can only be solved by a quantum computer",
          "It has more than one correct answer",
          "It requires more memory than any computer has",
        ],
        why: "Tractable problems have polynomial-time algorithms; intractable ones are solvable but not efficiently.",
      },
      {
        q: "What is a Turing machine?",
        a: "A theoretical model of computation: a finite state control with an infinite tape it can read, write and move along",
        wrong: [
          "The first electronic computer ever built",
          "A machine that can only recognise regular languages",
          "A physical device used to break wartime codes",
          "A modern CPU with a very large cache",
        ],
        why: "It is the standard yardstick for what is computable; anything a real computer can do, a Turing machine can do.",
      },
      {
        q: "What does it mean to say a programming language is 'Turing complete'?",
        a: "It can compute anything a Turing machine can, given enough time and memory",
        wrong: [
          "It always produces correct programs",
          "It can solve the halting problem",
          "Its programs are guaranteed to terminate",
          "It runs faster than any other language",
        ],
        why: "Most general-purpose languages are Turing complete; it says nothing about speed or safety.",
      },
      {
        q: "Why is the Church–Turing thesis important?",
        a: "It argues that every model of 'effective computation' proposed has the same power as a Turing machine",
        wrong: [
          "It proves P = NP",
          "It gives an algorithm for the halting problem",
          "It shows that all problems are tractable",
          "It defines the maximum clock speed of a processor",
        ],
        why: "It lets us treat 'computable' as a single well-defined notion regardless of the model used.",
      },
    ],
  }),
];
