/**
 * Systems software (A-Level): operating system functions, scheduling
 * algorithms, translators, the stages of compilation, and development
 * methodologies.
 *
 * The scheduling questions compute average waiting and turnaround times for a
 * concrete set of jobs and re-check them; the rest is worked recall of the
 * defining behaviour of each piece of software or process.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

export const csSoftware: Generator[] = [
  recall({
    key: "cs.sw.os-functions",
    topic: "cs-software",
    subtopic: "operating-systems",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "Which operating system function decides which process runs on the CPU next and for how long?",
        a: "Process (CPU) scheduling",
        wrong: ["Memory management", "File management", "Device management", "User account management"],
        why: "The scheduler shares CPU time between processes so the machine feels responsive.",
      },
      {
        q: "An OS moves pages of a process between RAM and the disk-based page file so that programs larger than RAM can run. Which function is this?",
        a: "Memory management (virtual memory / paging)",
        wrong: ["Process scheduling", "Interrupt handling", "File management", "Peripheral driver management"],
        why: "Memory management allocates RAM to processes and uses paging to give each the illusion of a large private address space.",
      },
      {
        q: "What is the kernel of an operating system?",
        a: "The core part that always stays in memory and manages the CPU, memory and devices at the lowest level",
        wrong: [
          "The graphical user interface the user interacts with",
          "The part that stores all the user's files",
          "The utility programs bundled with the OS",
          "The bootloader stored in ROM",
        ],
        why: "The kernel runs in a privileged mode; application code calls it through system calls to access hardware.",
      },
      {
        q: "Why does an operating system provide device drivers?",
        a: "So that application software can use any peripheral through a standard interface, without knowing its hardware details",
        wrong: [
          "To make peripherals run at the CPU's clock speed",
          "To store a backup of each peripheral's firmware",
          "To connect the computer to the internet",
          "To translate high-level code into machine code",
        ],
        why: "The driver hides the specifics of a particular printer or graphics card behind a common set of OS calls.",
      },
      {
        q: "What happens when a running program executes a system call (for example, to read a file)?",
        a: "Control passes to the operating system kernel, which performs the privileged operation on the program's behalf",
        wrong: [
          "The program is terminated and restarted",
          "The CPU clock speed is temporarily increased",
          "The call is ignored unless the user is an administrator",
          "The program is recompiled to include the file's contents",
        ],
        why: "Application code cannot touch hardware directly; the system call is the controlled gateway into the kernel.",
      },
      {
        q: "What is the role of interrupt handling in an operating system?",
        a: "It lets hardware and software signal that they need attention, so the CPU can respond without constantly polling",
        wrong: [
          "It stops the computer whenever an error occurs",
          "It schedules a full shutdown at a set time",
          "It compresses data before it is written to disk",
          "It checks the user's password on every keypress",
        ],
        why: "On an interrupt the CPU saves its state, runs the interrupt service routine, then resumes the interrupted task.",
      },
    ],
  }),

  generator({
    key: "cs.sw.scheduling-wait",
    subject: "computer-science",
    topic: "cs-software",
    subtopic: "scheduling",
    curriculumLevel: Y13,
    difficulty: 7,
    variants: 12,
    build: (rng) => {
      /* Three jobs, all present at time 0, scheduled without pre-emption. */
      const jobs = [
        { name: "P1", burst: rng.int(3, 9) },
        { name: "P2", burst: rng.int(3, 9) },
        { name: "P3", burst: rng.int(3, 9) },
      ];
      const policy = rng.bool() ? "First Come First Served (in the order P1, P2, P3)" : "Shortest Job First";
      const ordered =
        policy === "Shortest Job First"
          ? [...jobs].sort((a, b) => a.burst - b.burst)
          : jobs;
      let elapsed = 0;
      const waits: number[] = [];
      for (const j of ordered) {
        waits.push(elapsed);
        elapsed += j.burst;
      }
      const avgWait = waits.reduce((a, b) => a + b, 0) / waits.length;
      const answer = trim(avgWait);
      const fcfsOrder = jobs;
      let fe = 0;
      const fcfsWaits: number[] = [];
      for (const j of fcfsOrder) {
        fcfsWaits.push(fe);
        fe += j.burst;
      }
      const fcfsAvg = fcfsWaits.reduce((a, b) => a + b, 0) / 3;
      return {
        prompt: code([
          [0, `Three processes arrive at time 0 with CPU burst times: ${jobs.map((j) => `${j.name} = ${j.burst}`).join(", ")}.`],
          [0, `They are scheduled using ${policy}, without pre-emption.`],
          [0, "What is the average waiting time (a process's waiting time is the time from arrival until it first starts running)?"],
        ]),
        answer,
        distractors: othersFrom(answer, [
          trim(fcfsAvg === avgWait ? avgWait + 1 : fcfsAvg),
          trim(elapsed / 3), // used total time instead of waiting time
          trim((elapsed + waits.reduce((a, b) => a + b, 0)) / 3), // average turnaround, not waiting
          trim(avgWait + 1),
          trim(Math.max(0, avgWait - 1)),
        ]),
        explanation:
          `Under ${policy} the run order is ${ordered.map((j) => j.name).join(" → ")}. ` +
          `The first job waits 0, the next waits ${waits[1]}, the last waits ${waits[2]}. ` +
          `Average = (${waits.join(" + ")}) ÷ 3 = ${answer}.`,
        check: () => {
          let e = 0;
          const w: number[] = [];
          for (const j of ordered) {
            w.push(e);
            e += j.burst;
          }
          return trim(w.reduce((a, b) => a + b, 0) / 3) === answer ? null : "waiting time mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.sw.scheduling-concepts",
    topic: "cs-software",
    subtopic: "scheduling",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "How does round-robin scheduling share the CPU between processes?",
        a: "Each ready process runs in turn for a fixed time slice, then goes to the back of the queue if not finished",
        wrong: [
          "The shortest process always runs to completion first",
          "The process that has waited longest runs to completion",
          "The highest-priority process runs until it blocks",
          "Processes run in the exact order they were created, each to completion",
        ],
        why: "The time slice (quantum) gives every process regular turns, which suits interactive systems.",
      },
      {
        q: "What is the main drawback of a simple Shortest Job First scheduler?",
        a: "A long job can be starved of CPU time if short jobs keep arriving",
        wrong: [
          "It cannot be used when all jobs arrive at once",
          "It always gives the worst possible average waiting time",
          "It requires the jobs to have equal burst times",
          "It can only schedule two processes at a time",
        ],
        why: "SJF minimises average waiting time but is unfair to long jobs; ageing can be added to fix starvation.",
      },
      {
        q: "What distinguishes a pre-emptive scheduler from a non-pre-emptive one?",
        a: "A pre-emptive scheduler can suspend a running process to give the CPU to another before the first has finished",
        wrong: [
          "A pre-emptive scheduler never lets a process finish",
          "A non-pre-emptive scheduler ignores process priorities",
          "A pre-emptive scheduler only works on multi-core CPUs",
          "A non-pre-emptive scheduler runs processes in parallel",
        ],
        why: "Pre-emption (e.g. on a timer interrupt or a higher-priority arrival) is what makes responsive multitasking possible.",
      },
      {
        q: "In a multi-level feedback queue scheduler, why are processes moved between queues?",
        a: "To adjust each process's priority based on its recent behaviour — CPU-bound jobs sink, interactive jobs stay high",
        wrong: [
          "To spread processes evenly across CPU cores",
          "To move finished processes into a completed queue",
          "To sort processes alphabetically by name",
          "To separate system processes from user files",
        ],
        why: "A job that uses its whole quantum is demoted; one that yields early (waiting for I/O) keeps a high priority.",
      },
    ],
  }),

  recall({
    key: "cs.sw.translators",
    topic: "cs-software",
    subtopic: "translators",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "What is the key difference between a compiler and an interpreter?",
        a: "A compiler translates the whole program to machine code once; an interpreter translates and executes it statement by statement each run",
        wrong: [
          "A compiler works on high-level code and an interpreter on assembly",
          "An interpreter produces a faster executable than a compiler",
          "A compiler needs the source code present every time the program runs",
          "There is no difference; the terms are interchangeable",
        ],
        why: "Compiled code runs fast with no translator present; interpreted code is slower but easier to test and more portable.",
      },
      {
        q: "Which is an advantage of using an interpreter during program development?",
        a: "Errors are reported at the line where they occur and the code can be run immediately without a separate build step",
        wrong: [
          "The finished program runs faster than compiled code",
          "The source code can be hidden from the user",
          "It uses less memory while the program runs",
          "It automatically fixes syntax errors",
        ],
        why: "The quick edit-run-debug cycle is why many scripting languages are interpreted.",
      },
      {
        q: "What does an assembler do?",
        a: "It translates assembly language into machine code, roughly one instruction to one instruction",
        wrong: [
          "It translates a high-level language into assembly language",
          "It links several object files into one executable",
          "It optimises machine code to run faster",
          "It executes machine code directly on the CPU",
        ],
        why: "Assembly is a symbolic form of machine code, so the translation is almost one-to-one.",
      },
      {
        q: "Why do languages such as Java compile to an intermediate 'bytecode' rather than straight to machine code?",
        a: "Bytecode is portable — one compiled file runs on any device that has the virtual machine",
        wrong: [
          "Bytecode runs faster than native machine code",
          "Bytecode cannot contain any bugs",
          "Bytecode does not need to be translated further to run",
          "Bytecode is human-readable like source code",
        ],
        why: "'Compile once, run anywhere': the VM (interpreter/JIT) bridges the bytecode to each platform's real instructions.",
      },
      {
        q: "A compiled program reports no errors but crashes when run with certain data. What kind of error is this most likely to be?",
        a: "A run-time (logic or exception) error, which the compiler cannot detect",
        wrong: [
          "A syntax error the compiler missed",
          "A linker error",
          "A lexical error",
          "An error in the compiler itself",
        ],
        why: "The compiler checks grammar and types; faults that depend on the actual input only show up during execution.",
      },
    ],
  }),

  recall({
    key: "cs.sw.compilation-stages",
    topic: "cs-software",
    subtopic: "compilation",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "During compilation, which stage groups the characters of the source code into tokens (keywords, identifiers, operators) and removes whitespace and comments?",
        a: "Lexical analysis",
        wrong: ["Syntax analysis", "Semantic analysis", "Code generation", "Optimisation"],
        why: "The lexer (scanner) produces the token stream and builds the symbol table; it also flags illegal characters.",
      },
      {
        q: "Which stage of compilation checks that the sequence of tokens follows the grammar of the language and builds a parse (syntax) tree?",
        a: "Syntax analysis (parsing)",
        wrong: ["Lexical analysis", "Semantic analysis", "Code generation", "Linking"],
        why: "The parser reports errors like a missing bracket or a statement in the wrong place.",
      },
      {
        q: "Which stage of compilation checks for errors such as using an undeclared variable or adding a number to a string?",
        a: "Semantic analysis",
        wrong: ["Lexical analysis", "Syntax analysis", "Optimisation", "Code generation"],
        why: "Semantic analysis applies meaning: type checking, scope rules and declaration-before-use.",
      },
      {
        q: "What does the code optimisation stage of a compiler do?",
        a: "It improves the intermediate or object code so it runs faster or uses less memory, without changing the result",
        wrong: [
          "It removes all the programmer's comments",
          "It translates the code into a higher-level language",
          "It checks the spelling of variable names",
          "It compresses the executable file for storage",
        ],
        why: "Examples include removing unreachable code, pre-computing constant expressions and reusing register values.",
      },
      {
        q: "What is the job of the code generation stage?",
        a: "It produces the machine code (or object code) for the target processor from the checked, optimised intermediate representation",
        wrong: [
          "It writes the source code from the programmer's design",
          "It builds the parse tree from the tokens",
          "It loads the finished program into memory to run it",
          "It combines library files with the program",
        ],
        why: "This is the last stage the compiler itself performs; a separate linker then resolves external references.",
      },
      {
        q: "What does a linker do, after compilation?",
        a: "It combines the compiled object file with library modules and resolves the addresses of external routines into one executable",
        wrong: [
          "It translates the source code into tokens",
          "It checks the program for logic errors",
          "It runs the program and reports any crashes",
          "It converts the executable back into source code",
        ],
        why: "Calls to library functions are left as placeholders by the compiler; the linker fills in the real addresses.",
      },
    ],
  }),

  recall({
    key: "cs.sw.methodologies",
    topic: "cs-software",
    subtopic: "methodologies",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "In the waterfall model of software development, how do the stages relate to each other?",
        a: "Each stage is completed in full before the next begins, flowing in one direction",
        wrong: [
          "All stages run at the same time",
          "The stages repeat in short cycles, revisiting each one often",
          "Only analysis and testing are done; the rest is skipped",
          "The customer chooses which stage to do next each week",
        ],
        why: "Waterfall suits projects with stable, well-understood requirements; going back to an earlier stage is expensive.",
      },
      {
        q: "What is the defining feature of agile development methodologies?",
        a: "Software is built in short iterations, each producing working software, with requirements refined as the project goes",
        wrong: [
          "A complete specification is signed off before any coding starts",
          "There is no testing until the whole system is finished",
          "The customer is not involved after the initial meeting",
          "Documentation is produced instead of working software",
        ],
        why: "Agile responds to changing requirements and gets feedback early through frequent, small releases.",
      },
      {
        q: "For which kind of project is the waterfall model usually a better fit than an agile approach?",
        a: "One with clear, fixed requirements and a need for thorough documentation, such as a safety-critical system",
        wrong: [
          "A start-up product whose requirements are still being discovered",
          "A project where the customer wants to see progress every two weeks",
          "A small experimental prototype",
          "A project with a rapidly changing market",
        ],
        why: "Waterfall's up-front planning is a strength when the requirements genuinely will not change.",
      },
      {
        q: "What does rapid application development (RAD) rely on heavily?",
        a: "Prototyping and user feedback, refining a series of prototypes into the final system",
        wrong: [
          "A single long design phase with no user contact",
          "Writing the full documentation before any code",
          "Formal mathematical proofs of correctness",
          "Outsourcing all coding to a separate team",
        ],
        why: "RAD trades some long-term structure for speed, building and showing prototypes quickly.",
      },
      {
        q: "Which practice is strongly associated with extreme programming (XP)?",
        a: "Pair programming and writing automated tests before the code (test-driven development)",
        wrong: [
          "A single developer owning each module in secret",
          "Releasing the software only once, at the very end",
          "Avoiding any contact with the customer during development",
          "Designing the whole system in detail before coding",
        ],
        why: "XP pushes agile practices to the limit: continuous testing, frequent integration and shared code ownership.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

function trim(n: number): string {
  return String(Number(n.toFixed(2)));
}
