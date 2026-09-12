/**
 * Programming paradigms (A-Level): object-oriented and functional programming.
 *
 * The functional questions evaluate map / filter / fold expressions over a
 * concrete list and re-check the result; the OOP questions are worked recall
 * of encapsulation, inheritance and polymorphism, plus small "which method
 * runs" traces.
 */

import { generator, pickDistractors, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

export const csALevelParadigms: Generator[] = [
  recall({
    key: "cs.apar.oop-principles",
    topic: "cs-programming",
    subtopic: "oop",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "What does encapsulation mean in object-oriented programming?",
        a: "An object's data is kept private and can only be read or changed through its own methods",
        wrong: [
          "One class can be used in place of another class",
          "A class inherits the attributes and methods of a parent class",
          "The same method name behaves differently for different objects",
          "Large problems are broken into smaller sub-problems",
        ],
        why: "Hiding the internal state behind an interface stops other code from putting the object into an invalid state.",
      },
      {
        q: "A class Car inherits from a class Vehicle. What does this achieve?",
        a: "Car automatically has Vehicle's attributes and methods and can add or override its own",
        wrong: [
          "Every Vehicle object is also a Car object",
          "Car and Vehicle must have exactly the same methods",
          "Vehicle can now call Car's private methods",
          "Car objects cannot be created directly",
        ],
        why: "Inheritance models an 'is-a' relationship and lets shared behaviour be written once in the superclass.",
      },
      {
        q: "What is polymorphism in object-oriented programming?",
        a: "A single method call behaves differently depending on the actual class of the object it is called on",
        wrong: [
          "An object can change its class while the program runs",
          "A class can inherit from more than one parent",
          "Two objects of the same class always behave identically",
          "Attributes can hold values of any data type",
        ],
        why: "Calling draw() on a list of Shape objects runs Circle.draw or Square.draw as appropriate — the caller need not know which.",
      },
      {
        q: "What is the difference between a class and an object?",
        a: "A class is the template or blueprint; an object is a specific instance created from it",
        wrong: [
          "A class is created at run time; an object is written by the programmer",
          "An object can have methods but a class cannot",
          "There can only ever be one object per class",
          "A class stores data and an object stores code",
        ],
        why: "One Dog class can be instantiated into many Dog objects, each with its own attribute values.",
      },
      {
        q: "Why are an object's attributes usually declared private and accessed through public 'getter' and 'setter' methods?",
        a: "So the class can validate changes and is free to alter its internal representation later without breaking other code",
        wrong: [
          "Because private attributes use less memory",
          "Because public attributes cannot store objects",
          "Because getters and setters run faster than direct access",
          "Because the compiler requires every attribute to have a getter",
        ],
        why: "This is encapsulation in practice: the interface stays stable even if the implementation changes.",
      },
      {
        q: "What is a constructor method?",
        a: "A special method that runs when an object is created, used to set up its initial attribute values",
        wrong: [
          "The method that destroys an object and frees its memory",
          "A method that builds a new class at run time",
          "The first method listed in the class definition, whatever its name",
          "A method that can only be called once per program",
        ],
        why: "The constructor guarantees a new object starts in a valid, fully initialised state.",
      },
    ],
  }),

  generator({
    key: "cs.apar.polymorphism-trace",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "oop",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 6,
    build: (_rng, index) => {
      const cases = [
        {
          setup: [
            "CLASS Animal",
            "  PROCEDURE speak()  OUTPUT \"...\"  ENDPROCEDURE",
            "ENDCLASS",
            "CLASS Dog INHERITS Animal",
            "  PROCEDURE speak()  OUTPUT \"Woof\"  ENDPROCEDURE",
            "ENDCLASS",
            "a = NEW Dog()",
            "a.speak()",
          ],
          a: '"Woof"',
          wrong: ['"..."', 'Both "..." and "Woof"', "Nothing — Dog has no speak method", "A run-time error, because Animal.speak is abstract"],
          why: "a refers to a Dog object, so the overriding Dog.speak() runs — this is polymorphism.",
        },
        {
          setup: [
            "CLASS Shape",
            "  PROCEDURE area()  RETURN 0  ENDPROCEDURE",
            "ENDCLASS",
            "CLASS Square INHERITS Shape",
            "  PROCEDURE area()  RETURN side * side  ENDPROCEDURE",
            "ENDCLASS",
            "s = NEW Square()   s.side = 4",
            "OUTPUT s.area()",
          ],
          a: "16",
          wrong: ["0", "4", "8", "A run-time error because Shape.area returns 0"],
          why: "s is a Square, so the overriding area() runs: 4 × 4 = 16.",
        },
        {
          setup: [
            "CLASS Account",
            "  PRIVATE balance = 0",
            "  PROCEDURE deposit(n)  balance = balance + n  ENDPROCEDURE",
            "  FUNCTION getBalance()  RETURN balance  ENDFUNCTION",
            "ENDCLASS",
            "acc = NEW Account()",
            "acc.deposit(50)   acc.deposit(30)",
            "OUTPUT acc.getBalance()",
          ],
          a: "80",
          wrong: ["50", "30", "0", "A run-time error because balance is private"],
          why: "deposit() is a public method of the class, so it is allowed to change the private balance: 50 + 30 = 80.",
        },
        {
          setup: [
            "CLASS Account",
            "  PRIVATE balance = 100",
            "ENDCLASS",
            "acc = NEW Account()",
            "acc.balance = 0   // code outside the class",
            "OUTPUT acc.balance",
          ],
          a: "A compile-time or run-time error: balance is private and cannot be accessed from outside the class",
          wrong: ["0", "100", "The line is ignored and nothing is output", "50"],
          why: "Private attributes are only visible to the class's own methods; external code must use a setter.",
        },
        {
          setup: [
            "CLASS Bird",
            "  PROCEDURE move()  OUTPUT \"fly\"  ENDPROCEDURE",
            "ENDCLASS",
            "CLASS Penguin INHERITS Bird",
            "  PROCEDURE move()  OUTPUT \"swim\"  ENDPROCEDURE",
            "ENDCLASS",
            "birds = [NEW Bird(), NEW Penguin()]",
            "FOR EACH b IN birds  b.move()",
          ],
          a: '"fly" then "swim"',
          wrong: ['"fly" then "fly"', '"swim" then "swim"', '"swim" then "fly"', 'A run-time error'],
          why: "Each object runs its own version of move(); the loop does not need to know which type each element is.",
        },
        {
          setup: [
            "CLASS Employee",
            "  PROTECTED pay = 20000",
            "  FUNCTION annualPay()  RETURN pay  ENDFUNCTION",
            "ENDCLASS",
            "CLASS Manager INHERITS Employee",
            "  FUNCTION annualPay()  RETURN pay + 5000  ENDFUNCTION",
            "ENDCLASS",
            "m = NEW Manager()",
            "OUTPUT m.annualPay()",
          ],
          a: "25000",
          wrong: ["20000", "5000", "45000", "A run-time error: pay is protected"],
          why: "Manager overrides annualPay() and, because pay is protected, the subclass may read it: 20000 + 5000.",
        },
      ] as const;
      const c = cases[index % cases.length];
      return {
        prompt: code([
          ...c.setup.map((l) => [0, l] as [number, string]),
          [0, "What is output?"],
        ]),
        answer: c.a,
        distractors: othersFrom(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  generator({
    key: "cs.apar.functional-eval",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "functional",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const list = Array.from({ length: rng.int(4, 5) }, () => rng.int(1, 9));
      const op = rng.int(0, 3);
      let expr: string;
      let result: string;
      let why: string;
      if (op === 0) {
        const k = rng.int(2, 4);
        const mapped = list.map((x) => x * k);
        expr = `map (λx → x * ${k}) [${list.join(", ")}]`;
        result = `[${mapped.join(", ")}]`;
        why = `map applies the function to every element: each is multiplied by ${k}.`;
      } else if (op === 1) {
        const filtered = list.filter((x) => x % 2 === 0);
        expr = `filter (λx → x MOD 2 = 0) [${list.join(", ")}]`;
        result = `[${filtered.join(", ")}]`;
        why = `filter keeps only the elements for which the predicate is true — here, the even numbers.`;
      } else if (op === 2) {
        const total = list.reduce((a, b) => a + b, 0);
        expr = `fold (+) 0 [${list.join(", ")}]`;
        result = String(total);
        why = `fold combines the elements left to right with +, starting from 0: the sum of the list.`;
      } else {
        const k = rng.int(3, 6);
        const filtered = list.filter((x) => x > k);
        expr = `filter (λx → x > ${k}) [${list.join(", ")}]`;
        result = `[${filtered.join(", ")}]`;
        why = `filter keeps the elements greater than ${k} and discards the rest.`;
      }
      return {
        prompt: code([
          [0, "In a functional language, evaluate:"],
          [1, expr],
        ]),
        answer: result,
        distractors: othersFrom(result, [
          `[${list.join(", ")}]`, // returned the list unchanged
          `[${[...list].reverse().join(", ")}]`,
          String(list.reduce((a, b) => a + b, 0)),
          `[${list.filter((x) => x % 2 === 1).join(", ")}]`,
          `[${list.map((x) => x + 1).join(", ")}]`,
          "[]",
        ]),
        explanation: `${why} The result is ${result}.`,
        check: () => {
          let expected: string;
          if (op === 0) {
            const k = Number(expr.match(/x \* (\d+)/)![1]);
            expected = `[${list.map((x) => x * k).join(", ")}]`;
          } else if (op === 1) {
            expected = `[${list.filter((x) => x % 2 === 0).join(", ")}]`;
          } else if (op === 2) {
            expected = String(list.reduce((a, b) => a + b, 0));
          } else {
            const k = Number(expr.match(/x > (\d+)/)![1]);
            expected = `[${list.filter((x) => x > k).join(", ")}]`;
          }
          return expected === result ? null : "functional eval mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.apar.paradigm-identify",
    topic: "cs-programming",
    subtopic: "functional",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "A program is written as a sequence of statements that change the values of variables, using loops and procedure calls. Which paradigm is this?",
        a: "Procedural (imperative)",
        wrong: ["Functional", "Object-oriented", "Declarative", "Logic"],
        why: "Procedural code describes step by step how to reach the result, updating state as it goes.",
      },
      {
        q: "A program is built entirely from pure functions with no variables that change and no side effects. Which paradigm is this?",
        a: "Functional",
        wrong: ["Procedural", "Object-oriented", "Event-driven", "Imperative"],
        why: "Functional programming avoids mutable state; the same inputs always give the same output.",
      },
      {
        q: "In a database query language you write WHAT result you want (the conditions rows must meet) but not HOW to fetch it. Which paradigm is this?",
        a: "Declarative",
        wrong: ["Procedural", "Object-oriented", "Functional", "Assembly"],
        why: "SQL is declarative: the query optimiser decides the procedure; you only state the goal.",
      },
      {
        q: "Which feature is characteristic of a functional language?",
        a: "Functions are first-class values that can be passed to and returned from other functions",
        wrong: [
          "Every value is stored in a global variable",
          "Programs must be compiled, never interpreted",
          "Data and the methods that act on it are bundled into classes",
          "Execution jumps to a handler whenever an event occurs",
        ],
        why: "Higher-order functions like map and fold take other functions as arguments — a defining trait.",
      },
      {
        q: "Why does avoiding side effects (immutability) make functional code easier to reason about and to parallelise?",
        a: "A function's result depends only on its arguments, so calls cannot interfere with each other",
        wrong: [
          "Immutable data uses far less memory",
          "The compiler can skip type checking",
          "Functions run in a fixed order that never changes",
          "It removes the need for any function parameters",
        ],
        why: "With no shared mutable state, independent calls can safely run on different cores.",
      },
    ],
  }),
];
