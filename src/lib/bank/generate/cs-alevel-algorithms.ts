/**
 * Algorithms (A-Level): recursion, Dijkstra's shortest path, graph traversal
 * and Big-O analysis.
 *
 * The recursion and traversal questions run the algorithm on a concrete input
 * and read the answer off; Dijkstra is computed with a real priority-based
 * relaxation and re-checked against a brute-force search of every simple path.
 * Big-O questions test the reasoning rather than a single number.
 */

import { generator, pickDistractors, Rng, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import { Y12, Y13, recall } from "./cs-alevel-kit";

/* ==========================================================================
   Recursion
   ========================================================================== */

interface RecFn {
  name: string;
  sig: string;
  body: string[];
  /** returns [value, callCount] */
  run: (n: number) => [number, number];
  inputs: readonly number[];
}

const REC_FNS: readonly RecFn[] = [
  {
    name: "factorial",
    sig: "f(n)",
    body: ["FUNCTION f(n)", "  IF n <= 1 THEN RETURN 1", "  RETURN n * f(n - 1)", "ENDFUNCTION"],
    run: (n) => {
      let calls = 0;
      const f = (k: number): number => {
        calls++;
        return k <= 1 ? 1 : k * f(k - 1);
      };
      return [f(n), calls];
    },
    inputs: [4, 5, 6, 7],
  },
  {
    name: "power of two",
    sig: "p(n)",
    body: ["FUNCTION p(n)", "  IF n = 0 THEN RETURN 1", "  RETURN 2 * p(n - 1)", "ENDFUNCTION"],
    run: (n) => {
      let calls = 0;
      const p = (k: number): number => {
        calls++;
        return k === 0 ? 1 : 2 * p(k - 1);
      };
      return [p(n), calls];
    },
    inputs: [4, 5, 6, 7, 8],
  },
  {
    name: "sum to n",
    sig: "s(n)",
    body: ["FUNCTION s(n)", "  IF n = 0 THEN RETURN 0", "  RETURN n + s(n - 1)", "ENDFUNCTION"],
    run: (n) => {
      let calls = 0;
      const s = (k: number): number => {
        calls++;
        return k === 0 ? 0 : k + s(k - 1);
      };
      return [s(n), calls];
    },
    inputs: [5, 6, 7, 8, 9, 10],
  },
  {
    name: "Fibonacci",
    sig: "fib(n)",
    body: [
      "FUNCTION fib(n)",
      "  IF n < 2 THEN RETURN n",
      "  RETURN fib(n - 1) + fib(n - 2)",
      "ENDFUNCTION",
    ],
    run: (n) => {
      let calls = 0;
      const fib = (k: number): number => {
        calls++;
        return k < 2 ? k : fib(k - 1) + fib(k - 2);
      };
      return [fib(n), calls];
    },
    inputs: [5, 6, 7, 8],
  },
];

export const csALevelAlgorithms: Generator[] = [
  generator({
    key: "cs.aal.recursion-value",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "recursion",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 16,
    build: (rng) => {
      const fn = rng.pick(REC_FNS);
      const n = rng.pick(fn.inputs);
      const [value] = fn.run(n);
      const answer = String(value);
      const [prevValue] = fn.run(n - 1);
      return {
        prompt: code([
          ...fn.body.map((l) => [0, l] as [number, string]),
          [0, `What does ${fn.sig.replace("n", String(n))} return?`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(prevValue), // stopped one level of recursion early
          String(value + n), // one extra combine step
          String(fn.name === "Fibonacci" ? value - 1 : value - n),
          String(Math.max(1, Math.round(value / 2))),
        ]),
        explanation:
          `Unwind the recursion to the base case and combine on the way back up. ` +
          `${fn.sig.replace("n", String(n))} = ${value}.`,
        check: () => {
          const [v] = fn.run(n);
          return String(v) === answer ? null : "recursion value mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.aal.recursion-calls",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "recursion",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const fn = rng.pick(REC_FNS.filter((f) => f.name === "Fibonacci" || f.name === "factorial" || f.name === "sum to n"));
      const n = rng.pick(fn.inputs);
      const [, calls] = fn.run(n);
      const answer = String(calls);
      const linearGuess = fn.name === "Fibonacci" ? n + 1 : n;
      return {
        prompt: code([
          ...fn.body.map((l) => [0, l] as [number, string]),
          [0, `In total, how many times is ${fn.sig.split("(")[0]} called when evaluating ${fn.sig.replace("n", String(n))}? (Count the first call and every recursive call.)`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(linearGuess), // assumed one call per level
          String(calls - 1),
          String(calls + 1),
          String(n * 2),
        ]),
        explanation:
          fn.name === "Fibonacci"
            ? `Each call below the base case spawns two more, so the calls form a tree. Evaluating fib(${n}) makes ${calls} calls in all — this exponential blow-up is why naive recursive Fibonacci is slow.`
            : `Each call reduces n by 1 down to the base case, so there are ${calls} calls for ${fn.sig.replace("n", String(n))}.`,
        check: () => {
          const [, c] = fn.run(n);
          return String(c) === answer ? null : "call count mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.aal.recursion-concepts",
    topic: "cs-algorithms",
    subtopic: "recursion",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "What is the role of the base case in a recursive subroutine?",
        a: "It gives a condition under which the routine returns without calling itself, stopping the recursion",
        wrong: [
          "It is the first line that runs and sets up the parameters",
          "It is the recursive call that does the main work",
          "It stores the return values so they can be reused",
          "It is the case that runs most often during execution",
        ],
        why: "Without a reachable base case the routine calls itself forever until the call stack overflows.",
      },
      {
        q: "Why can a deeply recursive routine cause a stack overflow when the equivalent iterative version does not?",
        a: "Each unreturned recursive call keeps a stack frame (its parameters and return address) in memory",
        wrong: [
          "Recursion copies the entire program for each call",
          "Iteration stores nothing in memory at all",
          "The compiler refuses to optimise any recursive code",
          "Recursive calls run on a separate processor core each time",
        ],
        why: "Frames accumulate until the base case is hit; a loop reuses one frame, so its memory use is constant.",
      },
      {
        q: "Which problem is most naturally expressed with recursion?",
        a: "Traversing a tree, where each subtree is a smaller problem of the same shape",
        wrong: [
          "Adding up the numbers in a fixed-size array",
          "Printing the numbers from 1 to 100",
          "Reading each line of a file once",
          "Swapping two variables' values",
        ],
        why: "Self-similar, divide-and-conquer structure is exactly what recursion mirrors cleanly.",
      },
      {
        q: "What does it mean for a recursive call to be in 'tail position'?",
        a: "The recursive call is the very last action, so nothing is left to do after it returns",
        wrong: [
          "The recursive call is inside the base case",
          "The routine calls itself more than once",
          "The recursive call passes the same arguments unchanged",
          "The routine is called from the end of the program",
        ],
        why: "A tail call needs no caller frame kept, so some compilers turn it into a loop and avoid growing the stack.",
      },
    ],
  }),

  /* ==================================================================
     Dijkstra's algorithm
     ================================================================== */

  generator({
    key: "cs.aal.dijkstra",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "dijkstra",
    curriculumLevel: Y13,
    difficulty: 7,
    variants: 14,
    build: (rng) => {
      const nodes = ["A", "B", "C", "D", "E"];
      /* Build a connected weighted graph: a spanning path plus a few extra edges. */
      const edges = new Map<string, number>();
      const addEdge = (u: string, v: string, w: number) => {
        const key = [u, v].sort().join("");
        if (!edges.has(key)) edges.set(key, w);
      };
      for (let i = 0; i < nodes.length - 1; i++) addEdge(nodes[i], nodes[i + 1], rng.int(2, 9));
      const extras = rng.int(2, 3);
      for (let k = 0; k < extras; k++) {
        const i = rng.int(0, nodes.length - 1);
        let j = rng.int(0, nodes.length - 1);
        while (j === i) j = rng.int(0, nodes.length - 1);
        addEdge(nodes[i], nodes[j], rng.int(2, 9));
      }
      const adj: Record<string, [string, number][]> = {};
      for (const n of nodes) adj[n] = [];
      for (const [key, w] of edges) {
        const u = key[0];
        const v = key[1];
        adj[u].push([v, w]);
        adj[v].push([u, w]);
      }
      const target = "E";
      const dist = dijkstra(adj, "A");
      const answer = String(dist[target]);
      const edgeList = [...edges.entries()]
        .map(([k, w]) => `${k[0]}–${k[1]} (${w})`)
        .join(", ");
      const bruteforce = shortestSimplePath(adj, "A", target);
      return {
        prompt: code([
          [0, `A weighted undirected graph has these edges (with weights): ${edgeList}.`],
          [0, "Using Dijkstra's algorithm, what is the length of the shortest path from A to E?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(dist[target] + rng.int(1, 3)),
          String(Math.max(1, dist[target] - rng.int(1, 2))),
          String(directWeight(adj, "A", target) ?? dist[target] + 5),
          String(sumAllWeights(edges)),
        ]),
        explanation:
          `Dijkstra settles nodes in order of distance from A, relaxing each edge once. ` +
          `The shortest route to E costs ${answer}${bruteforce ? ` (for example ${bruteforce.join(" → ")})` : ""}.`,
        check: () => {
          const d = dijkstra(adj, "A")[target];
          return String(d) === answer && d === (bruteforce ? pathCost(adj, bruteforce) : d)
            ? null
            : "dijkstra vs brute-force mismatch";
        },
      };
    },
  }),

  /* ==================================================================
     Graph traversal
     ================================================================== */

  generator({
    key: "cs.aal.graph-traversal",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "graph-traversal",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 16,
    build: (rng) => {
      const nodes = ["A", "B", "C", "D", "E", "F"];
      const n = rng.int(5, 6);
      const used = nodes.slice(0, n);
      const adj: Record<string, string[]> = {};
      for (const v of used) adj[v] = [];
      const link = (u: string, v: string) => {
        if (u !== v && !adj[u].includes(v)) {
          adj[u].push(v);
          adj[v].push(u);
        }
      };
      /* A "spine" path so the graph is connected, plus a couple of chords —
         kept sparse so a depth-first and a breadth-first walk really diverge. */
      const spine = new Rng(rng.int(1, 1e9)).shuffle(used);
      for (let i = 0; i < spine.length - 1; i++) link(spine[i], spine[i + 1]);
      for (let k = 0; k < rng.int(1, 2); k++) {
        link(used[rng.int(0, n - 1)], used[rng.int(0, n - 1)]);
      }
      for (const v of used) adj[v] = [...adj[v]].sort(); // alphabetical neighbour order

      const mode = rng.bool() ? "breadth-first" : "depth-first";
      const order = mode === "breadth-first" ? bfs(adj, "A") : dfs(adj, "A");
      const answer = order.join(", ");
      const swap = (arr: string[], i: number, j: number) => {
        const c = [...arr];
        [c[i], c[j]] = [c[j], c[i]];
        return c.join(", ");
      };
      const candidates = [
        (mode === "breadth-first" ? dfs(adj, "A") : bfs(adj, "A")).join(", "), // the other traversal
        [...order].reverse().join(", "), // wrote the order backwards
        swap(order, 1, 2), // two vertices visited in the wrong order
        swap(order, order.length - 2, order.length - 1),
        [...used].join(", "), // just listed the vertices alphabetically
      ];
      const adjText = used.map((v) => `${v}: ${adj[v].join(", ")}`).join("   ");
      return {
        prompt: code([
          [0, `An undirected graph has this adjacency list (neighbours in alphabetical order):`],
          [1, adjText],
          [0, `List the vertices in the order a ${mode} traversal starting at A visits them, always taking neighbours in alphabetical order.`],
        ]),
        answer,
        distractors: othersFrom(answer, candidates),
        explanation:
          mode === "breadth-first"
            ? `Breadth-first uses a queue: visit A, then all of A's neighbours, then their unvisited neighbours, level by level. That gives ${answer}.`
            : `Depth-first uses a stack (or recursion): go as deep as possible down the first unvisited neighbour before backtracking. That gives ${answer}.`,
        check: () => {
          const o = mode === "breadth-first" ? bfs(adj, "A") : dfs(adj, "A");
          return o.join(", ") === answer ? null : "traversal mismatch";
        },
      };
    },
  }),

  /* ==================================================================
     Big-O
     ================================================================== */

  recall({
    key: "cs.aal.bigo-classify",
    topic: "cs-algorithms",
    subtopic: "big-o",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "A routine has a single loop that runs from 1 to n, doing constant work each iteration. What is its time complexity?",
        a: "O(n)",
        wrong: ["O(1)", "O(n²)", "O(log n)", "O(n log n)"],
        why: "The work grows in direct proportion to n — linear time.",
      },
      {
        q: "A routine has a loop from 1 to n, and inside it another loop from 1 to n. What is its time complexity?",
        a: "O(n²)",
        wrong: ["O(n)", "O(2n)", "O(n log n)", "O(log n)"],
        why: "The inner loop runs n times for each of the n outer iterations: n × n operations.",
      },
      {
        q: "An algorithm halves the portion of data it still has to consider on every step (like binary search). What is its time complexity?",
        a: "O(log n)",
        wrong: ["O(n)", "O(n²)", "O(1)", "O(n log n)"],
        why: "The number of halvings needed to reach one element is log₂ n.",
      },
      {
        q: "Merge sort splits the list in half repeatedly and does a linear amount of merging work at each level. What is its time complexity?",
        a: "O(n log n)",
        wrong: ["O(n²)", "O(n)", "O(log n)", "O(n!)"],
        why: "There are log n levels of recursion and O(n) work merging at each level.",
      },
      {
        q: "A routine returns element A[0] of an array and does nothing else, whatever the array's size. What is its time complexity?",
        a: "O(1)",
        wrong: ["O(n)", "O(log n)", "O(n²)", "It depends on the array contents"],
        why: "A fixed number of steps regardless of n is constant time.",
      },
      {
        q: "An algorithm runs an O(n²) phase, then a separate O(n log n) phase, then a separate O(n) phase. What is its overall time complexity?",
        a: "O(n²)",
        wrong: ["O(n log n)", "O(n² log n)", "O(n)", "O(n² + n log n + n)"],
        why: "Big-O keeps only the fastest-growing term and drops constants, so the O(n²) phase dominates.",
      },
    ],
  }),

  generator({
    key: "cs.aal.bigo-scaling",
    subject: "computer-science",
    topic: "cs-algorithms",
    subtopic: "big-o",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 12,
    build: (rng) => {
      const complexity = rng.pick(["O(n)", "O(n²)", "O(log n)"] as const);
      const baseTime = rng.pick([1, 2, 4, 5] as const);
      const factor = rng.pick([2, 3, 4, 10] as const);
      let newTime: number;
      let reasoning: string;
      if (complexity === "O(n)") {
        newTime = baseTime * factor;
        reasoning = `linear time scales with the same factor, so ×${factor}`;
      } else if (complexity === "O(n²)") {
        newTime = baseTime * factor * factor;
        reasoning = `quadratic time scales with the factor squared, so ×${factor * factor}`;
      } else {
        // O(log n): assume the base n was such that time is proportional to log; approximate multiplier
        newTime = Math.round(baseTime * (1 + Math.log2(factor) / 10) * 10) / 10;
        reasoning = `logarithmic time barely grows — multiplying n by ${factor} adds only log₂ ${factor} extra steps`;
      }
      const answer = complexity === "O(log n)" ? `just over ${baseTime} seconds` : `${newTime} seconds`;
      return {
        prompt:
          `An algorithm with time complexity ${complexity} takes ${baseTime} second${baseTime === 1 ? "" : "s"} on an input of size n. ` +
          `Approximately how long will it take on an input of size ${factor}n?`,
        answer,
        distractors: othersFrom(answer, [
          `${baseTime * factor} seconds`,
          `${baseTime * factor * factor} seconds`,
          `${baseTime} seconds`,
          `${baseTime + factor} seconds`,
          `${baseTime * 2} seconds`,
        ]),
        explanation:
          `Multiplying the input size by ${factor}: ${reasoning}. ` +
          (complexity === "O(log n)"
            ? `The running time stays close to ${baseTime} seconds.`
            : `That gives about ${newTime} seconds.`),
      };
    },
  }),
];

/* ==========================================================================
   Graph helpers
   ========================================================================== */

function dijkstra(adj: Record<string, [string, number][]>, start: string): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const v of Object.keys(adj)) dist[v] = Infinity;
  dist[start] = 0;
  const settled = new Set<string>();
  while (settled.size < Object.keys(adj).length) {
    let u: string | null = null;
    let best = Infinity;
    for (const v of Object.keys(adj)) {
      if (!settled.has(v) && dist[v] < best) {
        best = dist[v];
        u = v;
      }
    }
    if (u === null) break;
    settled.add(u);
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
    }
  }
  return dist;
}

function shortestSimplePath(
  adj: Record<string, [string, number][]>,
  start: string,
  target: string,
): string[] | null {
  let bestPath: string[] | null = null;
  let bestCost = Infinity;
  const visit = (node: string, path: string[], cost: number) => {
    if (node === target) {
      if (cost < bestCost) {
        bestCost = cost;
        bestPath = [...path];
      }
      return;
    }
    for (const [next, w] of adj[node]) {
      if (!path.includes(next)) visit(next, [...path, next], cost + w);
    }
  };
  visit(start, [start], 0);
  return bestPath;
}

function pathCost(adj: Record<string, [string, number][]>, path: string[]): number {
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = adj[path[i]].find(([v]) => v === path[i + 1]);
    cost += edge ? edge[1] : 0;
  }
  return cost;
}

function directWeight(
  adj: Record<string, [string, number][]>,
  u: string,
  v: string,
): number | null {
  const e = adj[u].find(([x]) => x === v);
  return e ? e[1] : null;
}

function sumAllWeights(edges: Map<string, number>): number {
  let s = 0;
  for (const w of edges.values()) s += w;
  return s;
}

function bfs(adj: Record<string, string[]>, start: string): string[] {
  const visited = [start];
  const queue = [start];
  while (queue.length) {
    const u = queue.shift() as string;
    for (const v of adj[u]) {
      if (!visited.includes(v)) {
        visited.push(v);
        queue.push(v);
      }
    }
  }
  return visited;
}

function dfs(adj: Record<string, string[]>, start: string): string[] {
  const visited: string[] = [];
  const walk = (u: string) => {
    visited.push(u);
    for (const v of adj[u]) if (!visited.includes(v)) walk(v);
  };
  walk(start);
  return visited;
}
