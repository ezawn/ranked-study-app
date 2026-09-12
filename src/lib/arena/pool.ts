/**
 * Dealing and marking a battle's questions.
 *
 * What remains of the original studied-material pool builder. Matches are now
 * dealt from the permanent question bank (`lib/bank/select`), so choosing WHICH
 * questions a pair meets lives there; this file keeps the two pieces that are
 * still the Arena's own: the per-match option shuffle, and the marker.
 *
 * Pure — no I/O — so both can be tested without a database.
 */

/** Only objective types may enter a battle. WRITTEN is excluded upstream. */
export type ObjectiveType = "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERIC";

/**
 * A deterministic shuffle.
 *
 * Both clients must meet the same questions in the same order, and the order
 * is fixed once at match creation, so this needs to be reproducible from a
 * seed rather than `Math.random()`. Mulberry32 — small, fast, good enough for
 * dealing a hand, and not used for anything security-bearing.
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A stable numeric seed from the match id, so a match always deals the same. */
export function seedFrom(matchId: string): number {
  let h = 2166136261;
  for (let i = 0; i < matchId.length; i++) {
    h ^= matchId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The order the options are shown in.
 *
 * Questions are almost always authored with the right answer first — a
 * generator emits it first, and a person typing one types it first — so serving
 * options in stored order made the correct answer the top-left button in every
 * single question, and the top two in a multi-answer one. That is not a quiz,
 * it is a reflex test.
 *
 * Seeded from the match and the question together, so the order is stable
 * across refetches and identical for both players, and different in the next
 * match.
 */
export function dealOptions<T extends { id: string }>(
  matchId: string,
  questionId: string,
  options: readonly T[],
): T[] {
  return seededShuffle(options, seedFrom(`${matchId}:${questionId}`));
}

/**
 * Is a submitted answer right?
 *
 * Lives here so the battle and any future replay agree, and so it can be
 * tested without a database. The caller supplies the correct data from the
 * stored question — this never trusts anything a client sent beyond the
 * selection itself.
 */
export function isAnswerCorrect(
  type: ObjectiveType,
  correctOptionIds: readonly string[],
  correctNumeric: string | null,
  submitted: { optionIds?: readonly string[]; numeric?: string | null },
): boolean {
  if (type === "NUMERIC") {
    const given = (submitted.numeric ?? "").trim();
    if (!given || correctNumeric == null) return false;
    const a = Number(given.replace(/,/g, ""));
    const b = Number(String(correctNumeric).replace(/,/g, ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      /* A small relative tolerance, so 0.333333 matches 1/3 to six places
         without accepting an answer that is merely nearby. */
      const scale = Math.max(1, Math.abs(b));
      return Math.abs(a - b) <= scale * 1e-6;
    }
    return given.toLowerCase() === String(correctNumeric).trim().toLowerCase();
  }

  const given = new Set(submitted.optionIds ?? []);
  const wanted = new Set(correctOptionIds);

  /* Multi-answer must match exactly. Selecting every option is not a correct
     answer — the quiz marker already refuses that and so does this. */
  if (given.size !== wanted.size) return false;
  for (const id of wanted) if (!given.has(id)) return false;
  return true;
}
