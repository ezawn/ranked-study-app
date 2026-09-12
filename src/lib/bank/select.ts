/**
 * Choosing which questions to serve.
 *
 * Pure: the caller does the querying and hands in candidate ids. That split is
 * what makes the interesting part testable — "never serves the same question
 * twice in a session", "prefers questions this student has not met", "falls
 * back rather than returning an empty set" are all properties of this function
 * and none of them need a database to check.
 *
 * The two rules that matter:
 *
 *  1. FRESH BEFORE FAMILIAR. Everything the student has not seen is dealt
 *     before anything they have. Not an exclusion — on a small filter, excluding
 *     seen questions would return nothing, and an empty practice session is a
 *     worse outcome than a repeat.
 *  2. NEVER THE SAME QUESTION TWICE IN ONE DEAL. Guaranteed structurally by
 *     dealing from a deduplicated list rather than by sampling with replacement.
 */

import {
  bandFor,
  stageOf,
  streamKey,
  type CurriculumLevel,
  type BankQuestionType,
  type DifficultyBand,
} from "./taxonomy";

/** What a candidate needs to carry for selection to work. */
export interface Candidate {
  id: string;
  subject: string;
  topic: string;
  subtopic: string;
  curriculumLevel: CurriculumLevel;
  difficulty: number;
  questionType: BankQuestionType;
  calculator: boolean;
}

export interface SelectionFilter {
  /** `subject:stage` pairs, e.g. "maths:GCSE". Empty or absent = any. */
  streams?: readonly string[];
  topics?: readonly string[];
  subtopics?: readonly string[];
  levels?: readonly CurriculumLevel[];
  /** Inclusive difficulty range, 1-10. */
  minDifficulty?: number;
  maxDifficulty?: number;
  bands?: readonly DifficultyBand[];
  types?: readonly BankQuestionType[];
  /** When false, only questions doable without a calculator. */
  calculator?: boolean;
}

export interface SelectionInput {
  candidates: readonly Candidate[];
  count: number;
  /** Deterministic ordering. Two players in one match pass the same seed. */
  seed: number;
  /** Questions this student has already met. Deprioritised, never excluded. */
  seen?: ReadonlySet<string>;
  /**
   * Spread the deal across topics rather than letting one topic dominate.
   * On by default: a twenty-question practice set that happens to be eighteen
   * percentages questions is technically a random sample and useless revision.
   */
  balanceTopics?: boolean;
}

export interface Selection {
  ids: string[];
  /** How many of the dealt questions the student had already met. */
  repeats: number;
  /** Candidates matching the filter, before the count was applied. */
  available: number;
}

/** Does this candidate pass the filter? */
export function matches(candidate: Candidate, filter: SelectionFilter): boolean {
  if (
    filter.streams?.length &&
    !filter.streams.includes(streamKey(candidate.subject, stageOf(candidate.curriculumLevel)))
  ) {
    return false;
  }
  if (filter.topics?.length && !filter.topics.includes(candidate.topic)) return false;
  if (filter.subtopics?.length && !filter.subtopics.includes(candidate.subtopic)) return false;
  if (filter.levels?.length && !filter.levels.includes(candidate.curriculumLevel)) return false;
  if (filter.types?.length && !filter.types.includes(candidate.questionType)) return false;
  if (filter.minDifficulty !== undefined && candidate.difficulty < filter.minDifficulty) return false;
  if (filter.maxDifficulty !== undefined && candidate.difficulty > filter.maxDifficulty) return false;
  if (filter.bands?.length && !filter.bands.includes(bandFor(candidate.difficulty))) return false;
  if (filter.calculator !== undefined && candidate.calculator !== filter.calculator) return false;
  return true;
}

export function filterCandidates(
  candidates: readonly Candidate[],
  filter: SelectionFilter,
): Candidate[] {
  return candidates.filter((c) => matches(c, filter));
}

/**
 * Deal a set.
 *
 * Shuffle, split by whether the student has seen it, take fresh first, and —
 * when balancing — round-robin across topics so no single topic can fill the
 * whole set while another goes unrepresented.
 */
export function select({
  candidates,
  count,
  seed,
  seen,
  balanceTopics = true,
}: SelectionInput): Selection {
  const available = candidates.length;
  if (available === 0 || count <= 0) return { ids: [], repeats: 0, available };

  const shuffled = shuffle(candidates, seed);

  const fresh: Candidate[] = [];
  const familiar: Candidate[] = [];
  for (const candidate of shuffled) {
    (seen?.has(candidate.id) ? familiar : fresh).push(candidate);
  }

  const ordered = balanceTopics
    ? [...roundRobinByTopic(fresh), ...roundRobinByTopic(familiar)]
    : [...fresh, ...familiar];

  const taken = ordered.slice(0, count);

  return {
    ids: taken.map((c) => c.id),
    repeats: seen ? taken.filter((c) => seen.has(c.id)).length : 0,
    available,
  };
}

/**
 * Interleave by topic.
 *
 * Takes one from each topic in turn, so the first n questions of a mixed set
 * cover as many topics as it has. Order within each topic is whatever the
 * shuffle produced, so this changes the spread without making the deal
 * predictable.
 */
function roundRobinByTopic(candidates: readonly Candidate[]): Candidate[] {
  if (candidates.length === 0) return [];

  const byTopic = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const bucket = byTopic.get(candidate.topic);
    if (bucket) bucket.push(candidate);
    else byTopic.set(candidate.topic, [candidate]);
  }

  const buckets = [...byTopic.values()];
  const out: Candidate[] = [];

  for (let round = 0; out.length < candidates.length; round++) {
    let placed = false;
    for (const bucket of buckets) {
      if (round < bucket.length) {
        out.push(bucket[round]);
        placed = true;
      }
    }
    /* Every bucket exhausted — impossible while out.length < candidates.length,
       but a loop with no guaranteed exit is a hang waiting to happen. */
    if (!placed) break;
  }

  return out;
}

/**
 * Mulberry32, the same shuffle the Arena deals hands with.
 *
 * Seeded rather than `Math.random()` so two players in one match receive
 * identical questions in identical order from a single shared seed, without
 * either client being told what the other will see.
 */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
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

/** A stable 32-bit seed from any string. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ==========================================================================
   Queues
   ========================================================================== */

/**
 * What a player is willing to be asked.
 *
 * Empty means "anything" in both fields, which is the default and the setting
 * that matches the most people.
 */
export interface QueuePreference {
  /** `subject:stage` pairs the player ticked. Empty = any subject, any level. */
  streams: readonly string[];
  /** Topic keys, narrowing within those streams. Empty = any topic. */
  topics: readonly string[];
}

/**
 * Are these two players compatible, and what would they be asked?
 *
 * Overlap, not equality.
 *
 * The first version keyed each queue by its exact contents, so two players
 * could both tick "GCSE Maths" plus one other thing and never meet — the keys
 * differed, so as far as matchmaking was concerned they were in different
 * rooms. On a small player base that is close to nobody ever matching.
 *
 * So a pair is compatible when their choices INTERSECT, and the match is dealt
 * from the intersection: tick GCSE Maths and A-Level Maths, meet somebody who
 * ticked A-Level Maths and A-Level Biology, and you both get A-Level Maths. An
 * empty set means no restriction and intersects with everything, so a player
 * who ticks nothing can be matched with anybody.
 */
export function intersectPreferences(
  a: QueuePreference,
  b: QueuePreference,
): QueuePreference | null {
  const streams = intersectOrEither(a.streams, b.streams);
  if (streams === null) return null;

  const topics = intersectOrEither(a.topics, b.topics);
  if (topics === null) return null;

  return { streams, topics };
}

/**
 * The intersection, treating an empty list as "no restriction".
 *
 * Returns null when both sides restrict and share nothing — the one case where
 * two players genuinely cannot be given the same questions.
 */
function intersectOrEither<T extends string>(a: readonly T[], b: readonly T[]): T[] | null {
  if (a.length === 0) return [...b];
  if (b.length === 0) return [...a];

  const bSet = new Set(b);
  const shared = a.filter((value) => bSet.has(value));
  return shared.length > 0 ? shared : null;
}

/** A preference as a selection filter. */
export function preferenceFilter(preference: QueuePreference): SelectionFilter {
  /* Only auto-markable types, always. A battle cannot mark free text without a
     model, and the Arena rules one out. */
  const types: BankQuestionType[] = ["MCQ_SINGLE", "MCQ_MULTI", "NUMERIC"];

  return {
    types,
    /* Never a calculator question in a battle. Both players race the same
       clock, and whether one of them has a calculator to hand is not something
       the game can see or should be deciding matches on. */
    calculator: false,
    ...(preference.streams.length > 0 ? { streams: preference.streams } : {}),
    ...(preference.topics.length > 0 ? { topics: preference.topics } : {}),
  };
}

/** Normalise what a client sent: known values only, deduplicated, sorted. */
export function normalisePreference(
  streams: readonly string[] | undefined,
  topics: readonly string[] | undefined,
  known: { streams: ReadonlySet<string>; topics: ReadonlySet<string> },
): QueuePreference {
  const clean = (values: readonly string[] | undefined, allowed: ReadonlySet<string>) =>
    [...new Set((values ?? []).map((value) => value.trim()))].filter((v) => allowed.has(v)).sort();

  return {
    streams: clean(streams, known.streams),
    topics: clean(topics, known.topics),
  };
}
