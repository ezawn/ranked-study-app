/**
 * Shared helpers for the A-Level computer science generators.
 *
 * A-Level splits across ten files by topic; the pieces they all need — the
 * two curriculum levels, a recall-question builder, a binary search tree and
 * its traversals, a tiny graph type — live here so each file stays about its
 * own subject.
 */

import { generator, pickDistractors, type Generator } from "./kit";

/** A-Level is taught across Year 12 and Year 13. */
export const Y12 = "YEAR_12" as const;
export const Y13 = "YEAR_13" as const;

export interface RecallCase {
  q: string;
  a: string;
  wrong: readonly string[];
  why: string;
}

/**
 * A short recall generator: one question per case, indexed so the framework
 * never has to re-roll to find a distinct prompt.
 */
export function recall(opts: {
  key: string;
  topic: string;
  subtopic: string;
  level?: typeof Y12 | typeof Y13;
  difficulty?: number;
  cases: readonly RecallCase[];
}): Generator {
  return generator({
    key: opts.key,
    subject: "computer-science",
    topic: opts.topic,
    subtopic: opts.subtopic,
    curriculumLevel: opts.level ?? Y12,
    difficulty: opts.difficulty ?? 5,
    variants: opts.cases.length,
    build: (_rng, index) => {
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

/* ==========================================================================
   Binary search trees
   ========================================================================== */

export interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export function bstInsert(root: TreeNode | null, value: number): TreeNode {
  if (!root) return { value, left: null, right: null };
  if (value < root.value) root.left = bstInsert(root.left, value);
  else root.right = bstInsert(root.right, value);
  return root;
}

export function bstFrom(values: readonly number[]): TreeNode {
  let root: TreeNode | null = null;
  for (const v of values) root = bstInsert(root, v);
  return root as TreeNode;
}

export function inorder(node: TreeNode | null, out: number[] = []): number[] {
  if (node) {
    inorder(node.left, out);
    out.push(node.value);
    inorder(node.right, out);
  }
  return out;
}

export function preorder(node: TreeNode | null, out: number[] = []): number[] {
  if (node) {
    out.push(node.value);
    preorder(node.left, out);
    preorder(node.right, out);
  }
  return out;
}

export function postorder(node: TreeNode | null, out: number[] = []): number[] {
  if (node) {
    postorder(node.left, out);
    postorder(node.right, out);
    out.push(node.value);
  }
  return out;
}

export function treeHeight(node: TreeNode | null): number {
  return node ? 1 + Math.max(treeHeight(node.left), treeHeight(node.right)) : 0;
}

/** Number of comparisons a BST search makes looking for `target`. */
export function bstSearchComparisons(root: TreeNode | null, target: number): number {
  let node = root;
  let count = 0;
  while (node) {
    count++;
    if (node.value === target) return count;
    node = target < node.value ? node.left : node.right;
  }
  return count;
}

/** `n` distinct integers in [lo, hi], in a deterministic shuffled order. */
export function distinctList(
  rng: { int(a: number, b: number): number },
  n: number,
  lo = 10,
  hi = 99,
): number[] {
  const seen = new Set<number>();
  while (seen.size < n) seen.add(rng.int(lo, hi));
  return [...seen];
}
