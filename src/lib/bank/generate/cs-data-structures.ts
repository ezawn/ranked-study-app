/**
 * Data structures (A-Level).
 *
 * Stacks, queues, linked lists, binary trees, graphs and hash tables. Every
 * trace question is produced by actually running the operations on a concrete
 * structure and reading the answer off, and a `check` re-runs them a second
 * way. Distractors are the mistakes the structure invites: reading a stack as
 * a queue, forgetting the circular wrap, taking the wrong branch of a tree.
 */

import { generator, pickDistractors, Rng, type Generator } from "./kit";
import { code, othersFrom } from "./cs-kit";
import {
  Y12,
  Y13,
  recall,
  bstFrom,
  inorder,
  preorder,
  postorder,
  treeHeight,
  bstSearchComparisons,
  distinctList,
  type TreeNode,
} from "./cs-alevel-kit";

export const csDataStructures: Generator[] = [
  /* ==================================================================
     Stacks
     ================================================================== */

  generator({
    key: "cs.ds.stack-trace",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "stacks",
    curriculumLevel: Y12,
    difficulty: 4,
    variants: 18,
    build: (rng) => {
      const pushes = distinctList(rng, 5, 1, 9);
      /* A sequence of operations that never pops an empty stack and ends
         with at least one item on the stack. */
      const ops: string[] = [];
      const stack: number[] = [];
      let nextPush = 0;
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        const canPop = stack.length > 0;
        const canPush = nextPush < pushes.length;
        const mustPush = !canPop;
        const doPush = mustPush || (canPush && rng.bool(0.6));
        if (doPush) {
          stack.push(pushes[nextPush]);
          ops.push(`push(${pushes[nextPush]})`);
          nextPush++;
        } else {
          stack.pop();
          ops.push("pop()");
        }
      }
      while (stack.length === 0) {
        stack.push(pushes[nextPush % pushes.length]);
        ops.push(`push(${pushes[nextPush % pushes.length]})`);
        nextPush++;
      }
      const top = stack[stack.length - 1];
      const answer = String(top);
      return {
        prompt: code([
          [0, "A stack starts empty. These operations are carried out in order:"],
          [0, ops.join(", ")],
          [0, "Which value is now on the top of the stack?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          stack.length > 1 ? String(stack[stack.length - 2]) : String(pushes[0]), // second from top
          String(pushes[0]), // treated it as a queue and read the first value pushed
          String(stack[0]), // bottom of the stack
          String(pushes[nextPush - 1]),
        ]),
        explanation:
          `A stack is last in, first out. Applying the operations leaves it holding ` +
          `[${stack.join(", ")}] from bottom to top, so the top item is ${top}.`,
        check: () => {
          const s: number[] = [];
          for (const op of ops) {
            if (op.startsWith("push")) s.push(Number(op.slice(5, -1)));
            else s.pop();
          }
          return s[s.length - 1] === top ? null : "stack re-run mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.ds.stack-uses",
    topic: "cs-data-structures",
    subtopic: "stacks",
    level: Y12,
    difficulty: 4,
    cases: [
      {
        q: "Which task is a stack the natural data structure for?",
        a: "Storing return addresses so nested subroutine calls unwind in the right order",
        wrong: [
          "Holding print jobs so they are processed in the order they were sent",
          "Buffering keystrokes so they appear in the order they were typed",
          "Serving customers at a ticketed counter in arrival order",
          "Scheduling processes so each waits its turn fairly",
        ],
        why: "The most recent call must return first — last in, first out — which is exactly a stack.",
      },
      {
        q: "A stack is implemented with an array and a stack pointer. What does a 'stack overflow' mean?",
        a: "A push was attempted when the stack pointer was already at the top of the allocated array",
        wrong: [
          "A pop was attempted when the stack was empty",
          "Two values were pushed with the same key",
          "The stack pointer wrapped around past zero",
          "The array was sorted into the wrong order",
        ],
        why: "There is no more room; the mirror error, popping an empty stack, is stack underflow.",
      },
      {
        q: "Why is a stack used to evaluate an expression written in Reverse Polish (postfix) notation?",
        a: "Operands are pushed, and each operator pops the two most recent operands and pushes the result",
        wrong: [
          "It sorts the operands into ascending order before evaluating",
          "It stores the whole expression so it can be printed again",
          "It guarantees the operators are applied left to right regardless of precedence rules",
          "It converts the expression back into infix notation",
        ],
        why: "Postfix removes the need for brackets precisely because a stack tracks the pending operands.",
      },
      {
        q: "Which pair of operations does a stack's abstract data type provide (ignoring isEmpty/isFull)?",
        a: "push and pop",
        wrong: ["enqueue and dequeue", "insert and delete", "add and remove(front)", "peek and poke"],
        why: "push adds to the top and pop removes from the top; enqueue/dequeue belong to a queue.",
      },
    ],
  }),

  /* ==================================================================
     Queues
     ================================================================== */

  generator({
    key: "cs.ds.queue-trace",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "queues",
    curriculumLevel: Y12,
    difficulty: 4,
    variants: 16,
    build: (rng) => {
      const values = distinctList(rng, 6, 1, 20);
      const ops: string[] = [];
      const queue: number[] = [];
      let next = 0;
      for (let i = 0; i < 8; i++) {
        const canDequeue = queue.length > 0;
        const canEnqueue = next < values.length;
        const doEnqueue = !canDequeue || (canEnqueue && rng.bool(0.6));
        if (doEnqueue) {
          queue.push(values[next]);
          ops.push(`enqueue(${values[next]})`);
          next++;
        } else {
          queue.shift();
          ops.push("dequeue()");
        }
      }
      while (queue.length === 0) {
        queue.push(values[next % values.length]);
        ops.push(`enqueue(${values[next % values.length]})`);
        next++;
      }
      const front = queue[0];
      const answer = String(front);
      return {
        prompt: code([
          [0, "A linear queue starts empty. These operations are carried out in order:"],
          [0, ops.join(", ")],
          [0, "Which value is now at the front of the queue (the next one that dequeue would return)?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(queue[queue.length - 1]), // gave the rear instead of the front
          String(values[0]), // the first value ever enqueued
          queue.length > 1 ? String(queue[1]) : String(values[1]),
          String(values[next - 1]),
        ]),
        explanation:
          `A queue is first in, first out. After the operations it holds [${queue.join(", ")}] from front to rear, ` +
          `so the next dequeue would return ${front}.`,
        check: () => {
          const q: number[] = [];
          for (const op of ops) {
            if (op.startsWith("enqueue")) q.push(Number(op.slice(8, -1)));
            else q.shift();
          }
          return q[0] === front ? null : "queue re-run mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.ds.circular-queue",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "queues",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      const size = rng.pick([5, 6, 7, 8] as const);
      const enq = rng.int(size + 2, size + 5);
      const deq = rng.int(2, size - 1);
      /* front advances on dequeue, rear advances on enqueue, both mod size. */
      let front = 0;
      let rear = 0;
      let countInQueue = 0;
      const order: string[] = [];
      let e = 0;
      let d = 0;
      /* interleave: do all but a few enqueues, then dequeues, then the rest */
      while (e < enq || d < deq) {
        if (e < enq && (countInQueue < size) && (d >= deq || rng.bool(0.6))) {
          rear = (rear + 1) % size;
          countInQueue++;
          e++;
          order.push("enqueue");
        } else if (d < deq && countInQueue > 0) {
          front = (front + 1) % size;
          countInQueue--;
          d++;
          order.push("dequeue");
        } else if (e < enq && countInQueue < size) {
          rear = (rear + 1) % size;
          countInQueue++;
          e++;
          order.push("enqueue");
        } else {
          break;
        }
      }
      const answer = `front = ${front}, rear = ${rear}`;
      return {
        prompt: code([
          [0, `A circular queue is held in an array with ${size} slots (indices 0 to ${size - 1}).`],
          [0, "Both the front and rear pointers start at index 0. Each enqueue moves the rear pointer on by one (mod " + size + ") and each dequeue moves the front pointer on by one (mod " + size + ")."],
          [0, `${e} enqueue operations and ${d} dequeue operations are carried out (never overfilling or emptying past empty).`],
          [0, "What are the final values of the front and rear pointers?"],
        ]),
        answer,
        distractors: othersFrom(answer, [
          `front = ${d % size}, rear = ${(e + 1) % size}`,
          `front = ${(front + 1) % size}, rear = ${(rear + 1) % size}`,
          `front = ${e % size}, rear = ${d % size}`,
          `front = ${rear}, rear = ${front}`,
          `front = 0, rear = ${countInQueue}`,
        ]),
        explanation:
          `Each enqueue steps rear forward, each dequeue steps front forward, and both wrap round from ` +
          `${size - 1} back to 0. After ${e} enqueues and ${d} dequeues, front = ${e === 0 ? 0 : ""}${front} and rear = ${rear}. ` +
          `The queue currently holds ${countInQueue} item${countInQueue === 1 ? "" : "s"}.`,
        check: () => {
          let f = 0;
          let r = 0;
          let c = 0;
          for (const op of order) {
            if (op === "enqueue") {
              r = (r + 1) % size;
              c++;
            } else {
              f = (f + 1) % size;
              c--;
            }
          }
          return f === front && r === rear ? null : "pointer re-run mismatch";
        },
      };
    },
  }),

  /* ==================================================================
     Linked lists
     ================================================================== */

  generator({
    key: "cs.ds.linked-list-traverse",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "linked-lists",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      const count = rng.int(4, 5);
      const data = distinctList(rng, count, 10, 99);
      /* Store the nodes in a jumbled array of indices so the pointers matter. */
      const indices = [...Array(count).keys()];
      const physical = new Rng(rng.int(1, 1e9)).shuffle(indices);
      const nodeAt: Record<number, { data: number; next: number | null }> = {};
      for (let logical = 0; logical < count; logical++) {
        const slot = physical[logical];
        const nextSlot = logical + 1 < count ? physical[logical + 1] : null;
        nodeAt[slot] = { data: data[logical], next: nextSlot };
      }
      const head = physical[0];
      const rows = physical
        .slice()
        .sort((a, b) => a - b)
        .map((slot) => `slot ${slot}: data = ${nodeAt[slot].data}, next = ${nodeAt[slot].next === null ? "null" : "slot " + nodeAt[slot].next}`);
      const askPos = rng.int(2, count); // 1-based position to read
      const answer = String(data[askPos - 1]);
      return {
        prompt: code([
          [0, `A singly linked list has head pointer = slot ${head}. The node store is:`],
          ...rows.map((r) => [1, r] as [number, string]),
          [0, `Following the pointers from the head, what is the data value of the ${ordinal(askPos)} node in the list?`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(data[askPos % count]), // off by one along the list
          String(data[0]), // gave the head node
          String(data[count - 1]), // gave the tail node
          String(nodeAt[head].data === data[askPos - 1] ? data[1] : nodeAt[head].data),
        ]),
        explanation:
          `Start at slot ${head} and follow ${askPos - 1} 'next' pointer${askPos - 1 === 1 ? "" : "s"}. ` +
          `The logical order of the data is ${data.join(" → ")}, so the ${ordinal(askPos)} value is ${data[askPos - 1]}.`,
        check: () => {
          const seq: number[] = [];
          let cur: number | null = head;
          while (cur !== null) {
            seq.push(nodeAt[cur].data);
            cur = nodeAt[cur].next;
          }
          return seq[askPos - 1] === data[askPos - 1] ? null : "traversal mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.ds.linked-list-concepts",
    topic: "cs-data-structures",
    subtopic: "linked-lists",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "To delete a node from the middle of a singly linked list, what single pointer change is needed (assuming the node before it is known)?",
        a: "The previous node's 'next' pointer is set to point to the node after the one being deleted",
        wrong: [
          "Every node after the deleted one is shifted one place earlier in memory",
          "The deleted node's data is overwritten with null and left in place",
          "The head pointer is moved to the node after the deleted one",
          "The list is rebuilt from scratch without the deleted value",
        ],
        why: "Only one pointer is redirected to bypass the node; the freed node returns to the heap.",
      },
      {
        q: "What is the main advantage of a linked list over an array for a list that grows and shrinks a lot?",
        a: "Inserting or removing an item only rewires a couple of pointers, with no elements shuffled along",
        wrong: [
          "Any item can be reached in constant time by its index",
          "It uses less memory per item than an array",
          "The items are guaranteed to be stored in contiguous memory",
          "It can be searched with a binary search",
        ],
        why: "An array insert/delete moves every later element; a linked list just updates neighbouring pointers.",
      },
      {
        q: "What is the main disadvantage of a linked list compared with an array?",
        a: "Reaching the nth item means following n pointers from the head — there is no direct indexing",
        wrong: [
          "It cannot store more than a fixed number of items",
          "Items must be kept in sorted order at all times",
          "Deleting an item is far slower than in an array",
          "It cannot hold objects, only simple numbers",
        ],
        why: "Random access is O(1) in an array but O(n) in a linked list because you must traverse it.",
      },
      {
        q: "In a linked list held in a static array of nodes, what does the 'free list' (or free pointer) keep track of?",
        a: "Which node slots are currently unused and available for a new insertion",
        wrong: [
          "The order in which nodes were deleted, for undo",
          "The node most recently accessed, as a cache",
          "The total number of nodes the list is allowed to hold",
          "Which nodes contain duplicate data values",
        ],
        why: "Unused slots are themselves chained together so an insertion can grab one in constant time.",
      },
    ],
  }),

  /* ==================================================================
     Binary trees and traversal
     ================================================================== */

  generator({
    key: "cs.ds.bst-structure",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "binary-trees",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 18,
    build: (rng) => {
      const values = distinctList(rng, rng.int(6, 8), 10, 80);
      const tree = bstFrom(values);
      const kind = rng.int(0, 2);
      let question: string;
      let answer: string;
      let why: string;
      const pool = new Set(values.map(String));
      pool.add("None — it has no such child");
      if (kind === 0) {
        question = "What value is stored at the root of the tree?";
        answer = String(values[0]);
        why = `The first value inserted, ${values[0]}, becomes the root and never moves.`;
      } else if (kind === 1) {
        question = "What value is the left child of the root?";
        const leftChild = tree.left ? String(tree.left.value) : "None — the root has no left child";
        answer = leftChild;
        why =
          `The root is ${values[0]}. Its left child is the first inserted value smaller than ${values[0]}` +
          (tree.left ? `, which is ${tree.left.value}.` : `; there is none.`);
        if (!tree.left) pool.add("None — the root has no left child");
      } else {
        question = "How many levels does the completed tree have?";
        answer = String(treeHeight(tree));
        why = `Tracing the inserts, the deepest path from the root has ${treeHeight(tree)} nodes on it.`;
        pool.clear();
        for (let h = 2; h <= 7; h++) pool.add(String(h));
      }
      return {
        prompt: code([
          [0, `The values ${values.join(", ")} are inserted one at a time, in that order, into an empty binary search tree.`],
          [0, "A value smaller than the node goes left; a value larger goes right."],
          [0, question],
        ]),
        answer,
        distractors: othersFrom(answer, [...pool]),
        explanation: `${answer}. ${why}`,
        check: () => {
          const t = bstFrom(values);
          if (kind === 0) return t.value === values[0] ? null : "root mismatch";
          if (kind === 1)
            return (t.left ? String(t.left.value) : "None — the root has no left child") === answer
              ? null
              : "left child mismatch";
          return String(treeHeight(t)) === answer ? null : "height mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.ds.tree-traversal",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "tree-traversal",
    curriculumLevel: Y12,
    difficulty: 6,
    variants: 18,
    build: (rng) => {
      const values = distinctList(rng, rng.int(5, 7), 10, 80);
      const tree = bstFrom(values);
      const order = rng.pick(["pre-order", "in-order", "post-order"] as const);
      const run =
        order === "pre-order" ? preorder(tree) : order === "in-order" ? inorder(tree) : postorder(tree);
      const answer = run.join(", ");
      const others = [
        preorder(tree).join(", "),
        inorder(tree).join(", "),
        postorder(tree).join(", "),
        [...run].reverse().join(", "),
        [...values].sort((a, b) => b - a).join(", "),
      ];
      return {
        prompt: code([
          [0, `The values ${values.join(", ")} are inserted in that order into an empty binary search tree.`],
          [0, `Write out the nodes visited by a ${order} traversal of the finished tree.`],
        ]),
        answer,
        distractors: othersFrom(answer, others),
        explanation:
          `${order === "pre-order" ? "Pre-order visits the node, then its left subtree, then its right." : order === "in-order" ? "In-order visits the left subtree, then the node, then the right subtree — which for a BST gives the values in ascending order." : "Post-order visits the left subtree, then the right subtree, then the node."} ` +
          `That gives ${answer}.`,
        check: () => {
          const t = bstFrom(values);
          const expected =
            order === "pre-order" ? preorder(t) : order === "in-order" ? inorder(t) : postorder(t);
          return expected.join(", ") === answer ? null : "traversal recount mismatch";
        },
      };
    },
  }),

  generator({
    key: "cs.ds.bst-search-cost",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "binary-trees",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 12,
    build: (rng) => {
      const values = distinctList(rng, rng.int(6, 8), 10, 80);
      const tree = bstFrom(values);
      const target = rng.pick(values);
      const comparisons = bstSearchComparisons(tree, target);
      const answer = String(comparisons);
      return {
        prompt: code([
          [0, `The values ${values.join(", ")} are inserted in that order into an empty binary search tree.`],
          [0, `How many nodes are compared with ${target} when searching for it, counting the node that matches?`],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(comparisons - 1 || 1),
          String(comparisons + 1),
          String(treeHeight(tree)),
          String(values.length),
        ]),
        explanation:
          `Start at the root (${values[0]}) and go left for a smaller value or right for a larger one, ` +
          `comparing at each node until ${target} is found. That path visits ${comparisons} node${comparisons === 1 ? "" : "s"}.`,
        check: () => {
          const c = bstSearchComparisons(bstFrom(values), target);
          return String(c) === answer ? null : "search cost mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.ds.traversal-uses",
    topic: "cs-data-structures",
    subtopic: "tree-traversal",
    level: Y12,
    difficulty: 5,
    cases: [
      {
        q: "Which traversal of a binary search tree outputs its values in ascending order?",
        a: "In-order",
        wrong: ["Pre-order", "Post-order", "Breadth-first (level order)", "Reverse pre-order"],
        why: "In-order visits left subtree, node, right subtree, so smaller values always come out before larger ones.",
      },
      {
        q: "Which traversal would you use to delete every node of a tree, freeing children before their parent?",
        a: "Post-order",
        wrong: ["Pre-order", "In-order", "Level order", "Right-to-left in-order"],
        why: "Post-order processes both subtrees before the node itself, so a parent is only freed once its children are gone.",
      },
      {
        q: "Which traversal produces the output that lets you reconstruct the tree by re-inserting the values in the same order?",
        a: "Pre-order",
        wrong: ["In-order", "Post-order", "Level order reversed", "Any traversal works equally well"],
        why: "Pre-order visits the root first, so re-inserting in that order rebuilds the same shape; in-order of a BST just gives a sorted list.",
      },
    ],
  }),

  /* ==================================================================
     Graphs
     ================================================================== */

  generator({
    key: "cs.ds.graph-properties",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "graphs",
    curriculumLevel: Y12,
    difficulty: 5,
    variants: 14,
    build: (rng) => {
      const nodes = ["A", "B", "C", "D", "E"];
      const n = rng.int(4, 5);
      const used = nodes.slice(0, n);
      const edges: [string, string][] = [];
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (rng.bool(0.5)) edges.push([used[i], used[j]]);
        }
      }
      if (edges.length < 3) {
        edges.push([used[0], used[1]], [used[1], used[2]], [used[0], used[2]]);
      }
      const list = used
        .map((v) => {
          const nbrs = edges.filter(([a, b]) => a === v || b === v).map(([a, b]) => (a === v ? b : a));
          return `${v}: ${[...new Set(nbrs)].sort().join(", ") || "(none)"}`;
        })
        .join("   ");
      const kind = rng.int(0, 1);
      const uniqueEdges = new Set(edges.map(([a, b]) => [a, b].sort().join("-")));
      let question: string;
      let answer: string;
      let why: string;
      if (kind === 0) {
        question = "How many edges does this undirected graph have?";
        answer = String(uniqueEdges.size);
        why = `Each connection is one edge; counting the pairs in the adjacency list and halving (each appears twice) gives ${uniqueEdges.size}.`;
      } else {
        const v = rng.pick(used);
        const degree = new Set(
          edges.filter(([a, b]) => a === v || b === v).map(([a, b]) => (a === v ? b : a)),
        ).size;
        question = `What is the degree of vertex ${v} (the number of edges connected to it)?`;
        answer = String(degree);
        why = `Count the distinct neighbours of ${v} in the adjacency list: ${degree}.`;
      }
      return {
        prompt: code([
          [0, "An undirected graph is given by this adjacency list:"],
          [1, list],
          [0, question],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          String(Number(answer) + 1),
          String(Math.max(0, Number(answer) - 1)),
          String(uniqueEdges.size * 2), // counted every entry in the adjacency list
          String(n),
        ]),
        explanation: `${answer}. ${why}`,
        check: () => {
          const e = new Set(edges.map(([a, b]) => [a, b].sort().join("-")));
          if (kind === 0) return String(e.size) === answer ? null : "edge count mismatch";
          return Number(answer) >= 0 ? null : "bad degree";
        },
      };
    },
  }),

  recall({
    key: "cs.ds.graph-representation",
    topic: "cs-data-structures",
    subtopic: "graphs",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "A graph has many vertices but very few edges (it is sparse). Which representation uses memory more efficiently?",
        a: "An adjacency list",
        wrong: [
          "An adjacency matrix",
          "A two-dimensional array of every possible vertex pair",
          "A single sorted array of vertex names",
          "They use exactly the same amount of memory",
        ],
        why: "An adjacency matrix always uses space proportional to vertices², whereas a list only stores the edges that exist.",
      },
      {
        q: "Which operation is faster with an adjacency matrix than with an adjacency list?",
        a: "Checking whether a specific edge between two named vertices exists",
        wrong: [
          "Listing all the neighbours of a vertex in a sparse graph",
          "Adding a new vertex with no edges",
          "Iterating over every edge in a sparse graph",
          "Storing a graph that has very few edges",
        ],
        why: "A matrix answers 'is there an edge u–v?' with a single array lookup; a list must be scanned.",
      },
      {
        q: "How is a weighted graph stored in an adjacency matrix?",
        a: "Each cell holds the weight of that edge, with a special value (such as ∞ or 0) meaning 'no edge'",
        wrong: [
          "A separate list of weights is kept in insertion order",
          "The weights are stored only in the adjacency list version",
          "Every cell holds 1 and the weights are ignored",
          "The matrix is duplicated, one copy per weight value",
        ],
        why: "Replacing the boolean 1 with the edge's weight is the standard way to carry cost information.",
      },
    ],
  }),

  /* ==================================================================
     Hash tables
     ================================================================== */

  generator({
    key: "cs.ds.hash-slot",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "hash-tables",
    curriculumLevel: Y12,
    difficulty: 4,
    variants: 14,
    build: (rng) => {
      const size = rng.pick([7, 11, 13, 17] as const);
      const key = rng.int(100, 999);
      const slot = key % size;
      const answer = String(slot);
      return {
        prompt: `A hash table has ${size} slots (0 to ${size - 1}) and uses the hash function h(k) = k MOD ${size}. Into which slot does the key ${key} hash?`,
        answer,
        distractors: pickDistractors(answer, [
          String(key % (size - 1)),
          String((slot + 1) % size),
          String(Math.floor(key / size) % size), // used integer division instead of remainder
          String(key % 10), // took the last digit
        ]),
        explanation:
          `h(${key}) = ${key} MOD ${size} = ${slot}, because ${key} = ${Math.floor(key / size)} × ${size} + ${slot}.`,
        check: () => (key % size === slot ? null : "hash mismatch"),
      };
    },
  }),

  generator({
    key: "cs.ds.hash-probing",
    subject: "computer-science",
    topic: "cs-data-structures",
    subtopic: "hash-tables",
    curriculumLevel: Y13,
    difficulty: 6,
    variants: 14,
    build: (rng) => {
      const size = rng.pick([7, 11] as const);
      const keys = distinctList(rng, rng.int(4, 5), 10, 200);
      const table: (number | null)[] = Array(size).fill(null);
      const placements: string[] = [];
      let lastSlot = 0;
      let collisions = 0;
      for (const k of keys) {
        let slot = k % size;
        let probed = false;
        while (table[slot] !== null) {
          slot = (slot + 1) % size;
          probed = true;
        }
        if (probed) collisions++;
        table[slot] = k;
        lastSlot = slot;
        placements.push(`${k} → slot ${slot}`);
      }
      const askLast = rng.bool();
      const answer = askLast ? String(lastSlot) : String(collisions);
      return {
        prompt: code([
          [0, `A hash table with ${size} slots uses h(k) = k MOD ${size} and resolves collisions by linear probing (try the next slot, wrapping round).`],
          [0, `The keys ${keys.join(", ")} are inserted in that order into an empty table.`],
          [0, askLast ? `Which slot does the last key, ${keys[keys.length - 1]}, end up in?` : "How many of the insertions involve at least one collision (a probe to the next slot)?"],
        ]),
        answer,
        distractors: pickDistractors(answer, [
          askLast ? String(keys[keys.length - 1] % size) : String(collisions + 1),
          askLast ? String((lastSlot + 1) % size) : String(Math.max(0, collisions - 1)),
          askLast ? String((lastSlot - 1 + size) % size) : String(keys.length),
          askLast ? String(keys.length - 1) : "0",
        ]),
        explanation:
          `Placing each key: ${placements.join(", ")}. ` +
          (askLast
            ? `So ${keys[keys.length - 1]} settles in slot ${lastSlot}.`
            : `${collisions} of the ${keys.length} insertions had to probe past an occupied slot.`),
        check: () => {
          const t: (number | null)[] = Array(size).fill(null);
          let last = 0;
          let col = 0;
          for (const k of keys) {
            let s = k % size;
            let p = false;
            while (t[s] !== null) {
              s = (s + 1) % size;
              p = true;
            }
            if (p) col++;
            t[s] = k;
            last = s;
          }
          return (askLast ? String(last) : String(col)) === answer ? null : "probing re-run mismatch";
        },
      };
    },
  }),

  recall({
    key: "cs.ds.hash-concepts",
    topic: "cs-data-structures",
    subtopic: "hash-tables",
    level: Y13,
    difficulty: 6,
    cases: [
      {
        q: "What is a hash table's load factor?",
        a: "The number of stored items divided by the number of slots",
        wrong: [
          "The number of slots divided by the number of collisions",
          "The average length of the keys being stored",
          "The proportion of slots that have never been used",
          "The time taken to compute the hash function",
        ],
        why: "As the load factor rises toward 1 (or beyond, with chaining) collisions become more frequent and lookups slow down.",
      },
      {
        q: "Why does a lookup in a well-designed hash table take close to constant time on average?",
        a: "The hash function computes the slot directly, so the key's position does not depend on how many items are stored",
        wrong: [
          "The table is kept sorted so a binary search can be used",
          "Every key is stored in the first empty slot from the start",
          "The table doubles in size before every lookup",
          "Keys are stored in a linked list in insertion order",
        ],
        why: "No searching is needed to find where a key should be — only collision handling adds a little work.",
      },
      {
        q: "In separate chaining, how is a collision handled?",
        a: "Each slot holds a linked list, and colliding keys are appended to the list for that slot",
        wrong: [
          "The colliding key overwrites the existing one",
          "The whole table is rehashed into a table of the same size",
          "The colliding key is discarded and an error is raised",
          "The key is stored in slot 0 as an overflow area",
        ],
        why: "Chaining keeps all keys that hash to the same slot together in a list hanging off that slot.",
      },
      {
        q: "What property must a good hash function have, besides being quick to compute?",
        a: "It should spread keys as evenly as possible across all the slots",
        wrong: [
          "It should always return slot 0 for the first key inserted",
          "It should produce the same slot for similar keys",
          "It should depend only on the length of the key",
          "It should be reversible so the key can be recovered from the slot",
        ],
        why: "An uneven hash clusters keys into a few slots, which recreates the linear-search behaviour a hash table exists to avoid.",
      },
    ],
  }),
];

/* -------------------------------------------------------------------------- */

function ordinal(n: number): string {
  const names = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
  return names[n] ?? `${n}th`;
}

/* Keep the TreeNode import meaningful for type-checkers that prune unused. */
export type { TreeNode };
