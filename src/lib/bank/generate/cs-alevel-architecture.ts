/**
 * Systems architecture (A-Level): registers, addressing modes, assembly
 * language and cache memory.
 *
 * The addressing-mode and assembly-trace questions run the instruction (or the
 * short program) against a concrete memory and read the result off; a `check`
 * re-runs it. The register and cache questions are worked recall.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

export const csALevelArchitecture: Generator[] = [
  recall({
    key: "cs.aarch.registers",
    topic: "cs-architecture",
    subtopic: "registers",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "Which register holds the address of the memory location that is about to be read from or written to?",
        a: "The Memory Address Register (MAR)",
        wrong: [
          "The Memory Data Register (MDR)",
          "The Program Counter (PC)",
          "The Current Instruction Register (CIR)",
          "The Accumulator (ACC)",
        ],
        why: "The address travels PC → MAR, then the address bus carries it to memory.",
      },
      {
        q: "Which register temporarily holds data or an instruction that has just been fetched from memory, or is about to be written to it?",
        a: "The Memory Data Register (MDR)",
        wrong: [
          "The Memory Address Register (MAR)",
          "The Program Counter (PC)",
          "The Status Register",
          "The Index Register",
        ],
        why: "The MDR (sometimes MBR) is the buffer between the CPU and the data bus.",
      },
      {
        q: "Which register holds the address of the next instruction to be fetched?",
        a: "The Program Counter (PC)",
        wrong: [
          "The Current Instruction Register (CIR)",
          "The Memory Address Register (MAR)",
          "The Accumulator (ACC)",
          "The Stack Pointer",
        ],
        why: "The PC is incremented after each fetch, or loaded with a new value by a jump instruction.",
      },
      {
        q: "Where is an instruction held while it is being decoded and executed?",
        a: "The Current Instruction Register (CIR)",
        wrong: [
          "The Program Counter (PC)",
          "The Memory Address Register (MAR)",
          "Level 1 cache",
          "The Status Register",
        ],
        why: "Once fetched, the instruction moves MDR → CIR, where the control unit splits it into opcode and operand.",
      },
      {
        q: "Which register stores the running result of arithmetic and logic operations in a simple accumulator-based CPU?",
        a: "The Accumulator (ACC)",
        wrong: [
          "The Current Instruction Register (CIR)",
          "The Memory Address Register (MAR)",
          "The Program Counter (PC)",
          "The Interrupt Register",
        ],
        why: "Instructions like ADD and SUB operate on the accumulator, which holds the working value.",
      },
      {
        q: "What is the purpose of the status register (flags register)?",
        a: "It holds condition flags such as zero, negative, carry and overflow set by the last operation",
        wrong: [
          "It records how long the CPU has been running",
          "It stores the operating system's process table",
          "It holds the address of the last interrupt handler",
          "It counts the number of instructions executed",
        ],
        why: "Conditional branch instructions test these flags to decide whether to jump.",
      },
    ],
  }),

  generator({
    key: "cs.aarch.addressing-mode",
    subject: "computer-science",
    topic: "cs-architecture",
    subtopic: "addressing-modes",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const operand = rng.int(20, 28);
      const indexReg = rng.int(1, 4);
      /* A small slice of memory holding distinct values, so the four possible
         readings can never accidentally coincide. */
      const mem: Record<number, number> = {};
      const pool = new Set<number>();
      for (let addr = 20; addr <= 34; addr++) {
        let v = rng.int(10, 99);
        while (pool.has(v) || (v >= 20 && v <= 34)) v = rng.int(10, 99);
        pool.add(v);
        mem[addr] = v;
      }
      let ptr = rng.int(20, 34); // a resolvable pointer for indirect mode
      while (ptr === operand || ptr === operand + indexReg) ptr = rng.int(20, 34);
      mem[operand] = ptr;
      const mode = rng.pick(["immediate", "direct", "indirect", "indexed"] as const);
      let value: number;
      let reasoning: string;
      if (mode === "immediate") {
        value = operand;
        reasoning = `Immediate addressing: the operand ${operand} is the data itself.`;
      } else if (mode === "direct") {
        value = mem[operand];
        reasoning = `Direct addressing: load from address ${operand}, which holds ${mem[operand]}.`;
      } else if (mode === "indirect") {
        value = mem[mem[operand]];
        reasoning = `Indirect addressing: address ${operand} holds ${mem[operand]}, and location ${mem[operand]} holds ${value}.`;
      } else {
        value = mem[operand + indexReg];
        reasoning = `Indexed addressing: effective address = operand ${operand} + index register ${indexReg} = ${operand + indexReg}, which holds ${value}.`;
      }
      const answer = String(value);
      const memLines = Object.entries(mem)
        .filter(([a]) => Number(a) >= 20 && Number(a) <= 30)
        .map(([a, v]) => `[${a}] = ${v}`)
        .join("   ");
      return {
        prompt: code([
          [0, `The index register holds ${indexReg}. Part of memory contains:`],
          [1, memLines],
          [0, `An instruction uses operand ${operand} with ${mode} addressing. What value does the CPU load?`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(operand), // read as immediate
          String(mem[operand]), // read as direct
          String(mem[mem[operand]]), // read as indirect
          String(mem[operand + indexReg]), // read as indexed
          String(operand + indexReg), // stopped at the effective address
        ]),
        explanation: reasoning,
        check: () => {
          let v: number;
          if (mode === "immediate") v = operand;
          else if (mode === "direct") v = mem[operand];
          else if (mode === "indirect") v = mem[mem[operand]];
          else v = mem[operand + indexReg];
          return String(v) === answer ? null : "addressing mode mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.aarch.assembly-trace",
    subject: "computer-science",
    topic: "cs-architecture",
    subtopic: "assembly-language",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      /* Straight-line accumulator program: LDA, then a mix of ADD/SUB, then STA. */
      const slots = [90, 91, 92, 93];
      const mem: Record<number, number> = {};
      for (const s of slots) mem[s] = rng.int(3, 40);
      const ops: string[] = [`LDA ${slots[0]}`];
      let acc = mem[slots[0]];
      const steps = rng.int(2, 3);
      for (let i = 0; i < steps; i++) {
        const src = slots[1 + (i % 3)];
        if (rng.bool()) {
          ops.push(`ADD ${src}`);
          acc += mem[src];
        } else {
          ops.push(`SUB ${src}`);
          acc -= mem[src];
        }
      }
      ops.push("STA 95");
      ops.push("HLT");
      const answer = String(acc);
      const memText = slots.map((s) => `[${s}] = ${mem[s]}`).join("   ");
      return {
        prompt: code([
          [0, "A simple accumulator machine runs this program. LDA loads into the accumulator, ADD and SUB add/subtract a memory value, STA stores the accumulator, HLT stops."],
          [1, memText],
          ...ops.map((o) => [1, o] as [number, string]),
          [0, "What value is stored in location 95 when the program halts?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(mem[slots[0]]), // just the first value loaded
          String(
            ops.reduce((t, op) => {
              const [ins, arg] = op.split(" ");
              if (ins === "LDA") return mem[Number(arg)];
              if (ins === "ADD" || ins === "SUB") return t + mem[Number(arg)];
              return t;
            }, 0),
          ), // treated every ADD/SUB as an addition
          String(acc + mem[slots[1]]),
          String(acc - mem[slots[1]]),
          String(-acc),
        ]),
        explanation:
          `Start with the accumulator at [${slots[0]}] = ${mem[slots[0]]}, then apply each ADD/SUB in turn: ` +
          `the sequence leaves ${acc} in the accumulator, which STA writes to location 95.`,
        check: () => {
          let a = 0;
          for (const op of ops) {
            const [ins, arg] = op.split(" ");
            if (ins === "LDA") a = mem[Number(arg)];
            else if (ins === "ADD") a += mem[Number(arg)];
            else if (ins === "SUB") a -= mem[Number(arg)];
          }
          return String(a) === answer ? null : "assembly re-run mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.aarch.assembly-concepts",
    topic: "cs-architecture",
    subtopic: "assembly-language",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "What is the relationship between a line of assembly language and machine code?",
        a: "Each assembly instruction corresponds to exactly one machine code instruction",
        wrong: [
          "One assembly instruction expands into many machine code instructions",
          "Assembly and machine code are the same thing written in different fonts",
          "Assembly is translated to a high-level language first",
          "Several assembly instructions combine into one machine code instruction",
        ],
        why: "This one-to-one mapping is why assembly is called a low-level language; an assembler does the translation.",
      },
      {
        q: "An assembly instruction is split into two parts. What are they?",
        a: "An opcode (the operation) and an operand (the data or address it acts on)",
        wrong: [
          "A label and a comment",
          "A register name and a clock cycle count",
          "A mnemonic and its line number",
          "A source address and a destination address, always both present",
        ],
        why: "The opcode says what to do; the operand (which some instructions omit) says what to do it to.",
      },
      {
        q: "Why might a programmer write a small routine in assembly language rather than a high-level language?",
        a: "To control the hardware precisely or to make a time-critical section as fast and small as possible",
        wrong: [
          "Because assembly is easier to read and maintain",
          "Because assembly programs are automatically portable between processors",
          "Because the compiler cannot produce machine code",
          "Because assembly has more built-in data structures",
        ],
        why: "Assembly trades portability and readability for fine control; it is used sparingly for drivers and hot loops.",
      },
      {
        q: "What does an assembler do with a symbolic label such as 'loop'?",
        a: "It replaces the label with the actual memory address it refers to",
        wrong: [
          "It ignores it, as labels are only comments",
          "It executes the code at that label immediately",
          "It stores the label as text in the running program",
          "It converts the label into a high-level function call",
        ],
        why: "Labels let the programmer branch without hand-calculating addresses; the assembler resolves them.",
      },
    ],
  }),

  recall({
    key: "cs.aarch.cache",
    topic: "cs-memory",
    subtopic: "cache",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "Where does cache memory sit in the memory hierarchy?",
        a: "Between the CPU registers and main memory (RAM), faster than RAM but smaller",
        wrong: [
          "Between main memory and secondary storage",
          "Inside the hard disk controller",
          "As a partition of virtual memory on disk",
          "Between the keyboard buffer and the CPU",
        ],
        why: "Cache holds copies of the RAM locations the CPU is most likely to need next.",
      },
      {
        q: "What is a 'cache hit'?",
        a: "The data the CPU requested is already in the cache, so RAM does not need to be accessed",
        wrong: [
          "The cache is full and an item must be evicted",
          "The CPU writes a new value into the cache",
          "The cache and RAM hold different values for the same address",
          "The requested data is found in virtual memory",
        ],
        why: "A high hit rate is what makes cache worthwhile: hits are served in a few cycles instead of many.",
      },
      {
        q: "Why does cache memory improve performance for typical programs?",
        a: "Programs show locality of reference — they reuse the same data and nearby data soon after first using it",
        wrong: [
          "Cache increases the CPU's clock speed",
          "Cache removes the need for an operating system",
          "Cache compresses instructions so more fit in RAM",
          "Cache lets several programs share one core",
        ],
        why: "Temporal and spatial locality mean a small fast store captures most memory accesses.",
      },
      {
        q: "L1, L2 and L3 cache differ mainly in what way?",
        a: "L1 is smallest and fastest (closest to the core); each further level is larger but slower",
        wrong: [
          "L1 is on disk, L2 in RAM and L3 in the CPU",
          "They hold instructions, data and addresses respectively, in that fixed order",
          "L3 is the fastest because it is checked first",
          "Only one level is ever present in a given CPU",
        ],
        why: "The CPU checks L1 first, then L2, then L3, then RAM — a trade-off of size against speed at each step.",
      },
      {
        q: "A CPU's cache is increased from 2 MB to 8 MB with everything else unchanged. What is the most likely effect?",
        a: "The cache hit rate rises, so average memory access time falls and performance improves",
        wrong: [
          "The clock speed increases in proportion",
          "The amount of installable RAM doubles",
          "Programs must be recompiled to use the larger cache",
          "The number of CPU cores effectively doubles",
        ],
        why: "More cache holds more of the working set, turning former misses into hits — with diminishing returns.",
      },
    ],
  }),
];
