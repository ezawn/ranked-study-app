/**
 * Algorithms, programming fundamentals, and databases.
 *
 * Every searching and sorting question is built by running the algorithm over a
 * concrete list and reading the answer off — the number of comparisons, the
 * list after one pass, the value a loop leaves in a variable. The `check`
 * re-runs the algorithm a second way (a language built-in, a brute count) so a
 * wrong trace fails a test rather than reaching a student.
 *
 * Pseudocode is board-neutral: `←` for assignment, `FOR i ← 1 TO n`, `WHILE`,
 * `DIV` and `MOD` for integer division and remainder.
 */

import { generator, pickDistractors, Rng, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";

const GCSE = "YEAR_10" as const;
const GCSE_LATE = "YEAR_11" as const;
const A_LEVEL = "YEAR_12" as const;

const list = (rng: Rng, n: number, lo = 1, hi = 99): number[] => {
  const out = new Set<number>();
  while (out.size < n) out.add(rng.int(lo, hi));
  return [...out];
};

/* ==========================================================================
   Searching
   ========================================================================== */

export const csAlgorithms: Generator[] = [
  generator({
    key: "cs.algo.linear-search",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "linear-search",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 18,
    build: (rng) => {
      const values = list(rng, rng.int(5, 8));
      const present = rng.bool(0.7);
      const target = present ? values[rng.int(0, values.length - 1)] : rng.int(100, 140);
      const comparisons = present ? values.indexOf(target) + 1 : values.length;
      const answer = String(comparisons);

      return {
        prompt:
          `A linear search looks for ${target} in the list [${values.join(", ")}], checking items ` +
          `from left to right. How many items does it compare before it stops?`,
        answer,
        distractors: pickDistractors(answer, [
          String(present ? comparisons - 1 : values.length - 1), // off by one
          String(present ? comparisons + 1 : values.length + 1),
          String(values.length),
          present ? "It never finds the item" : "1",
        ]),
        explanation: present
          ? `${target} is at position ${values.indexOf(target) + 1} (counting from 1), and a linear ` +
            `search checks every item up to and including it, so it makes ${comparisons} comparisons.`
          : `${target} is not in the list, so a linear search has to check all ${values.length} items ` +
            `before it can report "not found".`,
        check: () => {
          let count = 0;
          for (const v of values) {
            count++;
            if (v === target) break;
          }
          return count === comparisons ? null : `counted ${count}, expected ${comparisons}`;
        },
      };
    },
  }),

  generator({
    key: "cs.algo.binary-search",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "binary-search",
    curriculumLevel: GCSE_LATE,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const n = rng.pick([7, 9, 11, 15] as const);
      const values = list(rng, n).sort((a, b) => a - b);
      const target = values[rng.int(0, values.length - 1)];

      let lo = 0;
      let hi = values.length - 1;
      let comparisons = 0;
      const checked: number[] = [];
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        comparisons++;
        checked.push(values[mid]);
        if (values[mid] === target) break;
        if (values[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      const answer = String(comparisons);

      return {
        prompt:
          `A binary search looks for ${target} in the sorted list [${values.join(", ")}]. ` +
          `How many items does it examine (including the one it finds)?`,
        answer,
        distractors: pickDistractors(answer, [
          String(comparisons + 1),
          String(comparisons - 1 || 1),
          String(Math.ceil(values.length / 2)),
          String(values.length),
        ]),
        explanation:
          `Binary search checks the middle item and halves the range each time. ` +
          `Here it examines ${checked.join(", then ")} — ${comparisons} item${comparisons === 1 ? "" : "s"}.`,
        check: () => {
          /* Re-run and compare with a straight count. */
          let l = 0;
          let h = values.length - 1;
          let c = 0;
          while (l <= h) {
            const m = Math.floor((l + h) / 2);
            c++;
            if (values[m] === target) break;
            if (values[m] < target) l = m + 1;
            else h = m - 1;
          }
          return c === comparisons ? null : `re-run gave ${c}`;
        },
      };
    },
  }),

  generator({
    key: "cs.algo.binary-search-precondition",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "binary-search",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 4,
    build: (rng) => {
      const cases = [
        {
          q: "What must be true of a list before a binary search can be used on it?",
          a: "The list must be sorted",
          wrong: [
            "The list must contain only whole numbers",
            "The list must have an odd number of items",
            "The list must be shorter than 100 items",
            "The list must contain no duplicate values",
          ],
          why: "Binary search decides which half to discard by comparing with the middle item; that only works if the list is in order.",
        },
        {
          q: "Why is binary search usually faster than linear search on a large sorted list?",
          a: "It halves the number of items still to check with every comparison",
          wrong: [
            "It checks the first and last item at the same time",
            "It skips every second item on each pass",
            "It sorts the list again before each comparison",
            "It only ever checks the middle item once",
          ],
          why: "Each step rules out half the remaining list, so the work grows with the logarithm of the list size rather than in proportion to it.",
        },
        {
          q: "A list is unsorted. Which single search is guaranteed to work correctly on it without any preparation?",
          a: "Linear search",
          wrong: [
            "Binary search",
            "Binary search, but starting from the end",
            "Merge search",
            "No search can work on an unsorted list",
          ],
          why: "Linear search checks every item in turn and makes no assumption about order, so it works on any list.",
        },
        {
          q: "Binary search is applied to a sorted list of 1000 items. What is the maximum number of items it will need to check?",
          a: "10",
          wrong: ["500", "1000", "100", "20"],
          why: "Each comparison halves the range: 1000 → 500 → 250 → 125 → 63 → 32 → 16 → 8 → 4 → 2 → 1, which is at most 10 steps.",
        },
      ] as const;
      const c = cases[rng.int(0, cases.length - 1)];

      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  /* ==========================================================================
     Sorting
     ========================================================================== */

  generator({
    key: "cs.algo.bubble-sort-pass",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "bubble-sort",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const values = list(rng, rng.int(5, 6));
      const after = [...values];
      let swaps = 0;
      for (let i = 0; i < after.length - 1; i++) {
        if (after[i] > after[i + 1]) {
          [after[i], after[i + 1]] = [after[i + 1], after[i]];
          swaps++;
        }
      }
      const answer = `[${after.join(", ")}]`;

      return {
        prompt:
          `A bubble sort works left to right, swapping any pair that is in the wrong order. ` +
          `Starting from [${values.join(", ")}], what is the list after one complete pass?`,
        answer,
        distractors: pickDistractors(answer, [
          `[${[...values].sort((a, b) => a - b).join(", ")}]`, // fully sorted
          `[${[...values].sort((a, b) => b - a).join(", ")}]`,
          `[${bubblePassRightToLeft(values).join(", ")}]`,
          `[${values.join(", ")}]`, // no change
        ]),
        explanation:
          `Compare and swap each adjacent pair in turn. After one pass the largest value has ` +
          `"bubbled" to the end: ${answer}. It took ${swaps} swap${swaps === 1 ? "" : "s"}.`,
        check: () => {
          const largest = Math.max(...values);
          return after[after.length - 1] === largest ? null : "largest not at the end after a pass";
        },
      };
    },
  }),

  generator({
    key: "cs.algo.bubble-sort-swaps",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "bubble-sort",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const values = list(rng, rng.int(5, 7));
      const after = [...values];
      let swaps = 0;
      for (let i = 0; i < after.length - 1; i++) {
        if (after[i] > after[i + 1]) {
          [after[i], after[i + 1]] = [after[i + 1], after[i]];
          swaps++;
        }
      }
      const answer = String(swaps);

      return {
        prompt:
          `How many swaps take place during the FIRST pass of a bubble sort on [${values.join(", ")}]?`,
        answer,
        distractors: pickDistractors(answer, [
          String(swaps + 1),
          String(Math.max(0, swaps - 1)),
          String(values.length - 1), // number of comparisons, not swaps
          String(values.length),
        ]),
        explanation:
          `One pass makes ${values.length - 1} comparisons; a swap happens only when a pair is out of ` +
          `order. Here that is ${swaps} time${swaps === 1 ? "" : "s"}.`,
        check: () => {
          let s = 0;
          const a = [...values];
          for (let i = 0; i < a.length - 1; i++) if (a[i] > a[i + 1]) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; s++; }
          return s === swaps ? null : "swap recount mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.algo.insertion-sort-pass",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "insertion-sort",
    curriculumLevel: GCSE_LATE,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const values = list(rng, rng.int(5, 6));
      const passes = rng.int(2, 3);
      const arr = [...values];
      for (let i = 1; i <= passes; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
          arr[j + 1] = arr[j];
          j--;
        }
        arr[j + 1] = key;
      }
      const answer = `[${arr.join(", ")}]`;

      return {
        prompt:
          `An insertion sort has processed the first ${passes + 1} items of [${values.join(", ")}]. ` +
          `What does the list look like now?`,
        answer,
        distractors: pickDistractors(answer, [
          `[${[...values].sort((a, b) => a - b).join(", ")}]`,
          `[${values.join(", ")}]`,
          `[${[...values.slice(0, passes + 1).sort((a, b) => a - b), ...values.slice(passes + 1)].reverse().join(", ")}]`,
          `[${[...values.slice(0, passes + 1)].sort((a, b) => b - a).concat(values.slice(passes + 1)).join(", ")}]`,
        ]),
        explanation:
          `Insertion sort builds a sorted section at the front, taking the next item and sliding it ` +
          `back into place. After ${passes} insertion${passes === 1 ? "" : "s"} the first ${passes + 1} items are in order: ${answer}.`,
        check: () => {
          const front = arr.slice(0, passes + 1);
          const sorted = [...front].sort((a, b) => a - b);
          return front.join() === sorted.join() ? null : "front section not sorted";
        },
      };
    },
  }),

  generator({
    key: "cs.algo.merge-sort",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "merge-sort",
    curriculumLevel: GCSE_LATE,
    difficulty: 5,
    variants: 4,
    build: (rng) => {
      const cases = [
        {
          q: "Which phrase best describes how merge sort works?",
          a: "Divide the list into single items, then repeatedly merge pairs of sorted sub-lists",
          wrong: [
            "Repeatedly swap adjacent items until no swaps are needed",
            "Take each item in turn and insert it into a sorted section at the front",
            "Repeatedly move the smallest remaining item to the front",
            "Split the list in half once and sort each half with a bubble sort",
          ],
          why: "Merge sort splits until every sub-list has one item (already sorted), then merges sorted sub-lists back together in order.",
        },
        {
          q: "A merge sort splits a list of 8 items. How many sub-lists are there once splitting is complete?",
          a: "8",
          wrong: ["4", "3", "2", "16"],
          why: "Splitting continues until each sub-list holds exactly one item, so a list of 8 becomes 8 sub-lists.",
        },
        {
          q: "What is the main disadvantage of merge sort compared with bubble sort?",
          a: "It needs extra memory to hold the sub-lists while merging",
          wrong: [
            "It only works on lists that are already nearly sorted",
            "It cannot sort lists with duplicate values",
            "It is always slower than bubble sort",
            "It requires the list length to be a power of two",
          ],
          why: "Merge sort is much faster on large lists but is not in-place; it copies data into temporary lists, using more memory.",
        },
        {
          q: "Why is merge sort more efficient than bubble sort on a large list?",
          a: "The number of operations grows roughly in proportion to n log n rather than n²",
          wrong: [
            "It never has to compare two items",
            "It uses no extra memory at all",
            "It stops as soon as the list is partly sorted",
            "It works in constant time regardless of list size",
          ],
          why: "Halving the list gives about log n levels, and each level does n work to merge, so the total work is n log n — far less than bubble sort's n² for large n.",
        },
      ] as const;
      const c = cases[rng.int(0, cases.length - 1)];

      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  generator({
    key: "cs.algo.complexity",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "complexity",
    curriculumLevel: A_LEVEL,
    difficulty: 6,
    variants: 6,
    build: (rng) => {
      const cases = [
        { q: "What is the worst-case time complexity of a linear search on a list of n items?", a: "O(n)" },
        { q: "What is the worst-case time complexity of a binary search on a sorted list of n items?", a: "O(log n)" },
        { q: "What is the worst-case time complexity of a bubble sort on a list of n items?", a: "O(n²)" },
        { q: "What is the average time complexity of merge sort on a list of n items?", a: "O(n log n)" },
        { q: "What is the time complexity of accessing an element of an array by its index?", a: "O(1)" },
        { q: "A nested loop runs the inner loop n times for each of n outer iterations. What is its time complexity?", a: "O(n²)" },
      ] as const;
      const c = cases[rng.int(0, cases.length - 1)];
      const pool = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"];

      return {
        prompt: c.q,
        answer: c.a,
        distractors: othersFrom(c.a, pool),
        explanation:
          `${c.a}. Big-O describes how the running time grows as n grows: O(1) is constant, O(log n) ` +
          `halves the problem each step, O(n) is proportional, O(n log n) is a good sort, and O(n²) is a ` +
          `nested loop over the data.`,
      };
    },
  }),

  /* ==========================================================================
     Trace tables
     ========================================================================== */

  generator({
    key: "cs.trace.loop-total",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "trace-tables",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const start = rng.int(1, 4);
      const end = rng.int(6, 10);
      const step = rng.pick([1, 2] as const);
      let total = 0;
      const added: number[] = [];
      for (let i = start; i <= end; i += step) {
        total += i;
        added.push(i);
      }
      const answer = String(total);

      return {
        prompt: code([
          [0, "total ← 0"],
          [0, `FOR i ← ${start} TO ${end} STEP ${step}`],
          [1, "total ← total + i"],
          [0, "NEXT i"],
          [0, "OUTPUT total"],
        ]) + `\n\nWhat is output?`,
        answer,
        distractors: pickDistractors(answer, [
          String(total + (end + step <= end ? 0 : end + step)), // ran one iteration too many
          String(total - added[added.length - 1]), // stopped one early
          String(added.length), // counted iterations instead of summing
          String(end - start),
        ]),
        explanation:
          `i takes the values ${added.join(", ")}, and each is added to total, giving ` +
          `${added.join(" + ")} = ${total}.`,
        check: () => {
          let t = 0;
          for (let i = start; i <= end; i += step) t += i;
          return t === total ? null : "sum mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.trace.while-count",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "trace-tables",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const startValue = rng.int(40, 200);
      const divisor = rng.pick([2, 3] as const);
      let value = startValue;
      let count = 0;
      while (value > 1) {
        value = Math.floor(value / divisor);
        count++;
      }
      const answer = String(count);

      return {
        prompt: code([
          [0, `value ← ${startValue}`],
          [0, "count ← 0"],
          [0, "WHILE value > 1"],
          [1, `value ← value DIV ${divisor}`],
          [1, "count ← count + 1"],
          [0, "ENDWHILE"],
          [0, "OUTPUT count"],
        ]) + `\n\nWhat is output?`,
        answer,
        distractors: pickDistractors(answer, [
          String(count + 1),
          String(count - 1 || 1),
          String(Math.floor(startValue / divisor)),
          String(startValue % divisor),
        ]),
        explanation:
          `Integer division by ${divisor} is applied until value reaches 1 or 0. ` +
          `Starting from ${startValue} that takes ${count} iteration${count === 1 ? "" : "s"}.`,
        check: () => {
          let v = startValue;
          let c = 0;
          while (v > 1) {
            v = Math.floor(v / divisor);
            c++;
          }
          return c === count ? null : "loop recount mismatch";
        },
      };
    },
  }),

  /* ==========================================================================
     Programming fundamentals
     ========================================================================== */

  generator({
    key: "cs.prog.data-type",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "data-types",
    curriculumLevel: GCSE,
    difficulty: 2,
    variants: 8,
    build: (rng) => {
      const cases = [
        { v: "whether a user is logged in (true or false)", a: "Boolean" },
        { v: "the number of items in a basket", a: "Integer" },
        { v: "a product price such as 4.99", a: "Real (float)" },
        { v: "a customer's full name", a: "String" },
        { v: "a single letter grade such as 'B'", a: "Character" },
        { v: "the year a book was published", a: "Integer" },
        { v: "the average score of a class, such as 62.5", a: "Real (float)" },
        { v: "a postcode such as 'SW1A 1AA'", a: "String" },
      ] as const;
      const c = cases[rng.int(0, cases.length - 1)];
      const pool = ["Boolean", "Integer", "Real (float)", "String", "Character"];

      return {
        prompt: `Which data type is most appropriate for storing ${c.v}?`,
        answer: c.a,
        distractors: othersFrom(c.a, pool),
        explanation:
          `${c.a}. A Boolean has two values; an integer is a whole number; a real stores a fractional ` +
          `part; a string is a sequence of characters; a character is exactly one.`,
      };
    },
  }),

  generator({
    key: "cs.prog.div-mod",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "operators",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const a = rng.int(17, 97);
      const b = rng.int(3, 9);
      const wantMod = rng.bool();
      const result = wantMod ? a % b : Math.floor(a / b);
      const answer = String(result);

      return {
        prompt: `Evaluate ${a} ${wantMod ? "MOD" : "DIV"} ${b}.`,
        answer,
        distractors: pickDistractors(answer, [
          String(wantMod ? Math.floor(a / b) : a % b), // did the other operation
          String(Math.round(a / b)),
          String(wantMod ? (a % b) + 1 : Math.floor(a / b) + 1),
          String(wantMod ? b - (a % b) : Math.ceil(a / b)),
        ]),
        explanation: wantMod
          ? `MOD gives the remainder: ${a} ÷ ${b} = ${Math.floor(a / b)} remainder ${a % b}, so the answer is ${a % b}.`
          : `DIV gives the whole-number part of the division: ${a} ÷ ${b} = ${a / b}, so ${a} DIV ${b} = ${Math.floor(a / b)}.`,
        check: () => {
          const expected = wantMod ? a % b : Math.floor(a / b);
          return expected === result ? null : "operator mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.prog.selection-trace",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "selection",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const mark = rng.int(0, 100);
      const grade = mark >= 70 ? "Distinction" : mark >= 55 ? "Merit" : mark >= 40 ? "Pass" : "Fail";
      const answer = grade;

      return {
        prompt: code([
          [0, `mark ← ${mark}`],
          [0, "IF mark >= 70 THEN"],
          [1, "grade ← \"Distinction\""],
          [0, "ELSE IF mark >= 55 THEN"],
          [1, "grade ← \"Merit\""],
          [0, "ELSE IF mark >= 40 THEN"],
          [1, "grade ← \"Pass\""],
          [0, "ELSE"],
          [1, "grade ← \"Fail\""],
          [0, "ENDIF"],
          [0, "OUTPUT grade"],
        ]) + `\n\nWhat is output?`,
        answer,
        distractors: othersFrom(answer, ["Distinction", "Merit", "Pass", "Fail", "No output"]),
        explanation:
          `The conditions are tested in order and the first true one wins. ${mark} ` +
          `${grade === "Distinction" ? "is at least 70" : grade === "Merit" ? "is between 55 and 69" : grade === "Pass" ? "is between 40 and 54" : "is below 40"}, ` +
          `so grade becomes "${grade}".`,
        check: () => {
          const g = mark >= 70 ? "Distinction" : mark >= 55 ? "Merit" : mark >= 40 ? "Pass" : "Fail";
          return g === grade ? null : "grade mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.prog.iteration-count",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "iteration",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 14,
    build: (rng) => {
      const from = rng.int(1, 5);
      const to = rng.int(8, 20);
      const answer = String(to - from + 1);

      return {
        prompt: code([
          [0, `count ← 0`],
          [0, `FOR i ← ${from} TO ${to}`],
          [1, "count ← count + 1"],
          [0, "NEXT i"],
          [0, "OUTPUT count"],
        ]) + `\n\nHow many times does the loop body run?`,
        answer,
        distractors: pickDistractors(answer, [
          String(to - from), // off by one — forgot the loop is inclusive
          String(to),
          String(to - from + 2),
          String(from + to),
        ]),
        explanation:
          `A FOR loop from ${from} to ${to} is inclusive of both ends, so it runs ` +
          `${to} − ${from} + 1 = ${to - from + 1} times.`,
        check: () => {
          let c = 0;
          for (let i = from; i <= to; i++) c++;
          return c === to - from + 1 ? null : "count mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.prog.array-index",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "arrays",
    curriculumLevel: GCSE,
    difficulty: 3,
    variants: 16,
    build: (rng) => {
      const arr = list(rng, 6, 10, 60);
      const idx = rng.int(0, 5);
      const answer = String(arr[idx]);

      return {
        prompt: code([
          [0, `The array is declared with the first index 0.`],
          [0, `data ← [${arr.join(", ")}]`],
          [0, `OUTPUT data[${idx}]`],
        ]) + `\n\nWhat is output?`,
        answer,
        distractors: pickDistractors(answer, [
          String(arr[idx + 1] ?? arr[0]), // off-by-one, read the next element
          String(arr[idx - 1] ?? arr[arr.length - 1]),
          String(idx), // confused the index with the value
          String(arr[arr.length - 1 - idx]),
        ]),
        explanation:
          `With zero-based indexing, data[${idx}] is the ${idx === 0 ? "first" : `${ordinal(idx + 1)}`} ` +
          `element, which is ${arr[idx]}.`,
        check: () => (arr[idx] === Number(answer) ? null : "index mismatch"),
      };
    },
  }),

  generator({
    key: "cs.prog.string-ops",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "string-manipulation",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 12,
    build: (rng) => {
      const words = ["COMPUTER", "NETWORK", "BINARY", "PROGRAM", "STORAGE", "KEYBOARD"];
      const word = rng.pick(words);
      const op = rng.pick(["length", "first3", "last2", "concat"] as const);

      const spec =
        op === "length"
          ? { prompt: `LEN("${word}")`, answer: String(word.length) }
          : op === "first3"
            ? { prompt: `"${word}".substring(0, 3)  (characters 0, 1 and 2)`, answer: word.slice(0, 3) }
            : op === "last2"
              ? { prompt: `the last two characters of "${word}"`, answer: word.slice(-2) }
              : { prompt: `"${word}" + "!"  (concatenation)`, answer: `${word}!` };

      return {
        prompt: `What is the result of ${spec.prompt}?`,
        answer: spec.answer,
        distractors: pickDistractors(spec.answer, [
          op === "length" ? String(word.length - 1) : word.slice(0, 2),
          op === "length" ? String(word.length + 1) : word.slice(1, 4),
          op === "length" ? String(word.length + word.length) : `${word} !`,
          word.toLowerCase(),
          word.split("").reverse().join(""),
        ]),
        explanation:
          op === "length"
            ? `LEN counts every character, so "${word}" has length ${word.length}.`
            : op === "concat"
              ? `Concatenation joins the strings end to end with nothing added between them: ${word}!`
              : `String positions are counted from 0, so the result is ${spec.answer}.`,
      };
    },
  }),

  generator({
    key: "cs.prog.subprograms",
    subject: "computer-science",
    topic: "cs-programming",
    subtopic: "subprograms",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 5,
    build: (rng) => {
      const cases = [
        {
          q: "What is the key difference between a function and a procedure?",
          a: "A function returns a value to the code that called it; a procedure does not",
          wrong: [
            "A procedure is faster than a function in every language",
            "A function can only be written once per program",
            "A procedure cannot take any parameters",
            "A function cannot contain a loop",
          ],
          why: "Both are named blocks of reusable code; only a function is used in an expression because it produces a result.",
        },
        {
          q: "What is a parameter in the context of subprograms?",
          a: "A variable in the subprogram's definition that receives a value when it is called",
          wrong: [
            "The name given to the subprogram",
            "The value the subprogram sends back",
            "A global variable shared by every subprogram",
            "The line of code that calls the subprogram",
          ],
          why: "The value supplied at the call site is the argument; the placeholder it is copied into is the parameter.",
        },
        {
          q: "Why are subprograms used when writing a large program?",
          a: "They avoid repeating code and let each part be written and tested separately",
          wrong: [
            "They make the program run with a lower clock speed",
            "They remove the need for any variables",
            "They stop the program from ever needing comments",
            "They convert the program directly into machine code",
          ],
          why: "Breaking a problem into named subprograms is decomposition; it also means a change to one task is made in one place.",
        },
        {
          q: "A variable is declared inside a procedure. Where can it be used?",
          a: "Only inside that procedure — it is local to it",
          wrong: [
            "Anywhere in the whole program",
            "Only inside the procedure that calls this one",
            "In every procedure except the main program",
            "Nowhere — local variables cannot be used at all",
          ],
          why: "Local variables exist only while the subprogram runs, which stops one subprogram accidentally changing another's data.",
        },
        {
          q: "Which line correctly calls a function total(a, b) and stores its result in sum?",
          a: "sum ← total(3, 5)",
          wrong: [
            "total(3, 5) ← sum",
            "CALL sum FROM total(3, 5)",
            "sum ← CALL total",
            "function total(3, 5) → sum",
          ],
          why: "A function call is written where a value is expected; the returned value is then assigned to sum.",
        },
      ] as const;
      const c = cases[rng.int(0, cases.length - 1)];

      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  /* ==========================================================================
     Databases and SQL
     ========================================================================== */

  generator({
    key: "cs.db.relational",
    subject: "computer-science",
    topic: "cs-databases",
    subtopic: "relational-model",
    curriculumLevel: GCSE_LATE,
    difficulty: 3,
    variants: 5,
    build: (rng) => {
      const cases = [
        {
          q: "In a relational database, what is a single row of a table called?",
          a: "A record",
          wrong: ["A field", "A table", "A query", "A key"],
          why: "A table is made of records (rows); each record is made of fields (columns). One record holds all the data about one entity.",
        },
        {
          q: "In a relational database, what is a single column of a table called?",
          a: "A field",
          wrong: ["A record", "A table", "A report", "A form"],
          why: "A field (column) holds one attribute — for example 'surname' — for every record in the table.",
        },
        {
          q: "Why is data split across several linked tables rather than kept in one large table?",
          a: "To avoid storing the same data repeatedly, which wastes space and risks inconsistency",
          wrong: [
            "To make queries run more slowly on purpose",
            "Because a table may hold at most 100 records",
            "So each table can have a different password",
            "Because SQL cannot read a table with more than five fields",
          ],
          why: "Separating entities into their own tables and linking them with keys removes redundancy; an update then happens in one place.",
        },
        {
          q: "What links a record in one table to a related record in another table?",
          a: "A foreign key that matches the primary key of the other table",
          wrong: [
            "A shared password between the tables",
            "The two tables having the same name",
            "A copy of every field from the other table",
            "The record being at the same row number in both tables",
          ],
          why: "The foreign key stores a copy of the other record's primary key, so the database can join the two.",
        },
        {
          q: "What does it mean for a field to be the primary key of a table?",
          a: "Its value is unique for every record, so it identifies each record",
          wrong: [
            "It is always the first column alphabetically",
            "It holds the same value in every record",
            "It may be left empty for some records",
            "It stores the table's name",
          ],
          why: "No two records may share a primary key value, and it is never left empty, which is what lets other tables refer to a record unambiguously.",
        },
      ] as const;
      const c = cases[rng.int(0, cases.length - 1)];

      return {
        prompt: c.q,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation: `${c.a}. ${c.why}`,
      };
    },
  }),

  generator({
    key: "cs.db.sql-select",
    subject: "computer-science",
    topic: "cs-databases",
    subtopic: "sql-select",
    curriculumLevel: GCSE_LATE,
    difficulty: 4,
    variants: 3,
    build: (rng) => {
      const table = "Student";
      const asks = [
        {
          need: "the names of all students in year 11",
          a: "SELECT Name FROM Student WHERE Year = 11",
          wrong: [
            "SELECT Name FROM Student WHERE Year = '11' ORDER BY Year",
            "SELECT * FROM Student",
            "SELECT Year FROM Student WHERE Name = 11",
            "FROM Student SELECT Name WHERE Year = 11",
          ],
        },
        {
          need: "every field for students whose surname is 'Patel'",
          a: "SELECT * FROM Student WHERE Surname = 'Patel'",
          wrong: [
            "SELECT Surname FROM Student WHERE * = 'Patel'",
            "SELECT * FROM Student WHERE Surname = Patel",
            "SELECT ALL FROM Student WHERE Surname LIKE Patel",
            "SELECT * WHERE Surname = 'Patel' FROM Student",
          ],
        },
        {
          need: "all students, sorted by date of birth with the oldest first",
          a: "SELECT * FROM Student ORDER BY DateOfBirth ASC",
          wrong: [
            "SELECT * FROM Student ORDER BY DateOfBirth DESC",
            "SELECT * FROM Student SORT BY DateOfBirth",
            "SELECT * FROM Student WHERE DateOfBirth ORDER ASC",
            "ORDER BY DateOfBirth FROM Student SELECT *",
          ],
        },
      ] as const;
      const c = asks[rng.int(0, asks.length - 1)];
      const flip = rng.bool();
      void flip;

      return {
        prompt:
          `The table ${table} has the fields Name, Surname, Year, DateOfBirth. ` +
          `Which SQL statement returns ${c.need}?`,
        answer: c.a,
        distractors: pickDistractors(c.a, c.wrong),
        explanation:
          `A SELECT statement is SELECT <fields> FROM <table> WHERE <condition> [ORDER BY <field>]. ` +
          `Text values are quoted, ASC sorts smallest (oldest date) first, and * means every field. ` +
          `The correct statement is: ${c.a}`,
      };
    },
  }),
];

/* -------------------------------------------------------------------------- */

function bubblePassRightToLeft(values: readonly number[]): number[] {
  const a = [...values];
  for (let i = a.length - 1; i > 0; i--) {
    if (a[i] < a[i - 1]) [a[i], a[i - 1]] = [a[i - 1], a[i]];
  }
  return a;
}

function ordinal(n: number): string {
  const names = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
  return names[n] ?? `${n}th`;
}
