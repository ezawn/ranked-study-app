import { describe, expect, it } from "vitest";

import { GENERATORS } from "@/lib/bank/generate";
import { Rng, seedFromKey } from "@/lib/bank/generate/kit";
import { rat, simplifySurd, toSigFigs } from "@/lib/bank/generate/rational";
import { poly, sup } from "@/lib/bank/generate/format";
import {
  bandFor,
  clampDifficulty,
  isKnownSubtopic,
  allSubtopicKeys,
  stageOf,
  type CurriculumLevel,
} from "@/lib/bank/taxonomy";
import {
  filterCandidates,
  matches,
  intersectPreferences,
  normalisePreference,
  preferenceFilter,
  seedFrom,
  select,
  shuffle,
  type Candidate,
} from "@/lib/bank/select";
import { isBankAnswerCorrect } from "@/server/services/bank/query";
import { validateQuestion, parseImportFile } from "@/lib/bank/import";

/**
 * The permanent question bank.
 *
 * The generator audit is the important part of this file. Two thousand
 * machine-written questions are only worth having if something checks them, and
 * "something" cannot be a person reading them all — so every generated question
 * is verified here: one correct option, no duplicate prompts anywhere in the
 * bank, a taxonomy tag that exists, determinism, and each generator's own
 * `check` re-deriving its answer a second way.
 */

/* ==========================================================================
   Exact arithmetic — everything else depends on this being right
   ========================================================================== */

describe("exact rational arithmetic", () => {
  it("adds fractions without floating-point drift", () => {
    expect(rat(1, 10).add(rat(2, 10)).toString()).toBe("3/10");
    /* The reason this class exists: 0.1 + 0.2 is not 0.3 in a double. */
    expect(rat(1, 10).add(rat(2, 10)).toNumber()).toBe(0.3);
  });

  it("always simplifies, and keeps the sign on the numerator", () => {
    expect(rat(6, 8).toString()).toBe("3/4");
    expect(rat(1, -2).toString()).toBe("-1/2");
    expect(rat(-1, -2).toString()).toBe("1/2");
  });

  it("refuses a zero denominator rather than returning Infinity", () => {
    expect(() => rat(1, 0)).toThrow();
  });

  it("refuses to leave the exact integer range", () => {
    /* The guard that caught binomial probabilities overflowing. */
    expect(() => rat(1, 10).pow(30)).toThrow();
  });

  it("simplifies surds by pulling out square factors", () => {
    expect(simplifySurd(72)).toEqual({ coefficient: 6, radicand: 2 });
    expect(simplifySurd(50)).toEqual({ coefficient: 5, radicand: 2 });
    /* A prime radicand has nothing to take out. */
    expect(simplifySurd(13)).toEqual({ coefficient: 1, radicand: 13 });
  });

  it("rounds to significant figures without exponent noise", () => {
    expect(toSigFigs(1234.5678, 4)).toBe("1235");
    expect(toSigFigs(0.00123456, 3)).toBe("0.00123");
  });
});

describe("expression formatting", () => {
  it("never writes 1x, + -, or a zero term", () => {
    expect(poly([1, -3, 0])).toBe("x² - 3x");
    expect(poly([2, 0, -5])).toBe("2x² - 5");
    expect(poly([-1, 1])).toBe("-x + 1");
  });

  it("writes an all-zero polynomial as 0 rather than an empty string", () => {
    expect(poly([0, 0])).toBe("0");
  });

  it("uses superscript digits for powers", () => {
    expect(sup(2)).toBe("²");
    expect(sup(12)).toBe("¹²");
  });
});

/* ==========================================================================
   The generated bank
   ========================================================================== */

describe("the generated question bank", () => {
  const questions = GENERATORS.flatMap((g) => g.all());

  it("produces at least two thousand questions", () => {
    expect(questions.length).toBeGreaterThanOrEqual(2000);
  });

  it("gives every choice question exactly one correct option", () => {
    const broken = questions.filter((q) => {
      if (q.questionType !== "MCQ_SINGLE") return false;
      return q.options.filter((o) => o.isCorrect).length !== 1;
    });
    expect(broken.map((q) => q.sourceKey)).toEqual([]);
  });

  it("gives every choice question exactly four options, all distinct", () => {
    /* Four is the shape students expect and the shape the battle UI is built
       for. A three-option question that slipped through raised the odds of a
       lucky guess to one-in-three on that question alone. */
    const broken = questions.filter((q) => {
      if (q.options.length === 0) return false;
      if (q.options.length !== 4) return true;
      const texts = new Set(q.options.map((o) => o.text.trim().toLowerCase()));
      return texts.size !== q.options.length;
    });
    expect(broken.map((q) => q.sourceKey)).toEqual([]);
  });

  it("always includes the stated answer among the options", () => {
    const broken = questions.filter(
      (q) => q.options.length > 0 && !q.options.some((o) => o.text === q.answer && o.isCorrect),
    );
    expect(broken.map((q) => q.sourceKey)).toEqual([]);
  });

  it("never repeats a prompt anywhere in the bank", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const q of questions) {
      const key = q.prompt.trim().toLowerCase().replace(/\s+/g, " ");
      const first = seen.get(key);
      if (first) duplicates.push(`${q.sourceKey} duplicates ${first}`);
      else seen.set(key, q.sourceKey);
    }

    expect(duplicates).toEqual([]);
  });

  it("never repeats a sourceKey", () => {
    const keys = questions.map((q) => q.sourceKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("tags every question with a subtopic that exists", () => {
    const unknown = questions.filter((q) => !isKnownSubtopic(q.topic, q.subtopic));
    expect(unknown.map((q) => `${q.sourceKey} → ${q.topic}/${q.subtopic}`)).toEqual([]);
  });

  it("covers every subtopic in the taxonomy", () => {
    /* A filter a student can select but which returns nothing is a broken
       filter, so the vocabulary and the content have to agree. */
    const covered = new Set(questions.map((q) => `${q.topic}/${q.subtopic}`));
    const missing = allSubtopicKeys("maths").filter((key) => !covered.has(key));
    expect(missing).toEqual([]);
  });

  it("gives every question a difficulty in range and a real explanation", () => {
    const broken = questions.filter(
      (q) =>
        q.difficulty < 1 ||
        q.difficulty > 10 ||
        q.explanation.trim().length < 25 ||
        q.answer.trim() === "" ||
        q.prompt.trim() === "",
    );
    expect(broken.map((q) => q.sourceKey)).toEqual([]);
  });

  it("gives every question plausible marks and timing", () => {
    const broken = questions.filter(
      (q) => q.marks < 1 || q.marks > 10 || q.estimatedSeconds < 10 || q.estimatedSeconds > 400,
    );
    expect(broken.map((q) => q.sourceKey)).toEqual([]);
  });

  it("deals the same question every time for the same variant", () => {
    const drifted: string[] = [];
    for (const generator of GENERATORS) {
      const first = generator.all();
      const second = generator.all();
      for (let i = 0; i < first.length; i++) {
        if (first[i].prompt !== second[i].prompt || first[i].answer !== second[i].answer) {
          drifted.push(`${generator.key}:${i}`);
        }
      }
    }
    expect(drifted).toEqual([]);
  });

  /**
   * The one that actually verifies the mathematics.
   *
   * Each generator may supply an independent re-derivation of its own answer —
   * substitute the root back into the equation, differentiate numerically and
   * compare, sum the series term by term. Construction guarantees the answer
   * follows from the parameters; this checks the construction itself.
   */
  it("passes every generator's own independent check", () => {
    const failures: string[] = [];

    for (const generator of GENERATORS) {
      const published = generator.all();

      for (let i = 0; i < published.length; i++) {
        let matched = false;

        /* Re-derive through the same seed the published question came from,
           including the salt the deduplication used. */
        for (let salt = 0; salt <= 60 && !matched; salt++) {
          const key = salt === 0 ? `${generator.key}#${i}` : `${generator.key}#${i}@${salt}`;
          const draft = generator.build(new Rng(seedFromKey(key)), i);
          if (draft.prompt.trim() !== published[i].prompt) continue;

          matched = true;
          const failure = draft.check?.();
          if (failure) failures.push(`${generator.key}:${i} — ${failure}`);
        }

        if (!matched) failures.push(`${generator.key}:${i} — could not re-derive`);
      }
    }

    expect(failures).toEqual([]);
  });
});

/* ==========================================================================
   Taxonomy
   ========================================================================== */

describe("the taxonomy", () => {
  it("derives the difficulty band rather than storing it", () => {
    expect(bandFor(1)).toBe("EASY");
    expect(bandFor(3)).toBe("EASY");
    expect(bandFor(4)).toBe("MEDIUM");
    expect(bandFor(7)).toBe("HARD");
    expect(bandFor(10)).toBe("EXPERT");
  });

  it("clamps a difficulty outside the scale rather than storing it", () => {
    expect(clampDifficulty(0)).toBe(1);
    expect(clampDifficulty(99)).toBe(10);
    expect(clampDifficulty(Number.NaN)).toBe(1);
  });

  it("maps curriculum levels to qualifications", () => {
    expect(stageOf("YEAR_10")).toBe("GCSE");
    expect(stageOf("YEAR_11")).toBe("GCSE");
    expect(stageOf("YEAR_12")).toBe("A_LEVEL");
    expect(stageOf("YEAR_13")).toBe("A_LEVEL");
  });

  it("rejects a subtopic that is not in the tree", () => {
    expect(isKnownSubtopic("algebra", "expanding")).toBe(true);
    expect(isKnownSubtopic("algebra", "not-a-subtopic")).toBe(false);
    expect(isKnownSubtopic("not-a-topic", "expanding")).toBe(false);
  });
});

/* ==========================================================================
   Selection
   ========================================================================== */

describe("selecting questions", () => {
  const candidate = (id: string, over: Partial<Candidate> = {}): Candidate => ({
    id,
    subject: over.subject ?? "maths",
    topic: over.topic ?? "algebra",
    subtopic: over.subtopic ?? "expanding",
    curriculumLevel: over.curriculumLevel ?? "YEAR_10",
    difficulty: over.difficulty ?? 5,
    questionType: over.questionType ?? "MCQ_SINGLE",
    calculator: over.calculator ?? false,
  });

  const many = (n: number, over: Partial<Candidate> = {}) =>
    Array.from({ length: n }, (_, i) => candidate(`q${i}`, over));

  it("never deals the same question twice in one set", () => {
    const { ids } = select({ candidates: many(40), count: 20, seed: 1 });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deals the same set for the same seed and a different one otherwise", () => {
    const args = (seed: number) => ({ candidates: many(40), count: 10, seed });
    expect(select(args(7)).ids).toEqual(select(args(7)).ids);
    expect(select(args(7)).ids).not.toEqual(select(args(8)).ids);
  });

  it("deals everything unseen before anything familiar", () => {
    const seen = new Set(["q0", "q1", "q2"]);
    const { ids } = select({ candidates: many(10), count: 10, seed: 3, seen });

    const firstFamiliar = ids.findIndex((id) => seen.has(id));
    const lastFresh = ids.reduce((last, id, i) => (seen.has(id) ? last : i), -1);
    expect(firstFamiliar).toBeGreaterThan(lastFresh);
  });

  it("still fills a set when the student has seen everything", () => {
    /* Excluding seen questions rather than deprioritising them would return an
       empty practice session, which is a worse outcome than a repeat. */
    const candidates = many(15);
    const seen = new Set(candidates.map((c) => c.id));
    const { ids, repeats } = select({ candidates, count: 10, seed: 4, seen });

    expect(ids.length).toBe(10);
    expect(repeats).toBe(10);
  });

  it("spreads a mixed set across topics rather than letting one dominate", () => {
    const candidates = [
      ...many(30).map((c, i) => ({ ...c, id: `alg${i}`, topic: "algebra" })),
      ...many(5).map((c, i) => ({ ...c, id: `geo${i}`, topic: "geometry" })),
    ];
    const { ids } = select({ candidates, count: 8, seed: 5 });

    const topics = new Set(
      ids.map((id) => candidates.find((c) => c.id === id)!.topic),
    );
    expect(topics.size).toBe(2);
  });

  it("returns nothing rather than throwing when the filter matches nothing", () => {
    expect(select({ candidates: [], count: 10, seed: 1 })).toEqual({
      ids: [],
      repeats: 0,
      available: 0,
    });
  });

  it("takes everything when asked for more than exists", () => {
    const { ids, available } = select({ candidates: many(6), count: 20, seed: 1 });
    expect(ids.length).toBe(6);
    expect(available).toBe(6);
  });
});

describe("filtering", () => {
  const c: Candidate = {
    id: "q1",
    subject: "maths",
    topic: "calculus",
    subtopic: "power-rule",
    curriculumLevel: "YEAR_12",
    difficulty: 7,
    questionType: "MCQ_SINGLE",
    calculator: false,
  };

  it("matches an empty filter", () => {
    expect(matches(c, {})).toBe(true);
  });

  it("filters by topic, level, type and difficulty", () => {
    expect(matches(c, { topics: ["calculus"] })).toBe(true);
    expect(matches(c, { topics: ["algebra"] })).toBe(false);
    expect(matches(c, { levels: ["YEAR_12"] })).toBe(true);
    expect(matches(c, { levels: ["YEAR_10"] })).toBe(false);
    expect(matches(c, { types: ["NUMERIC"] })).toBe(false);
    expect(matches(c, { minDifficulty: 8 })).toBe(false);
    expect(matches(c, { maxDifficulty: 7 })).toBe(true);
  });

  it("filters by difficulty band", () => {
    expect(matches(c, { bands: ["HARD"] })).toBe(true);
    expect(matches(c, { bands: ["EASY"] })).toBe(false);
  });

  it("combines filters conjunctively", () => {
    expect(filterCandidates([c], { topics: ["calculus"], bands: ["EASY"] })).toEqual([]);
    expect(filterCandidates([c], { topics: ["calculus"], bands: ["HARD"] }).length).toBe(1);
  });
});

describe("subject selection", () => {
  const pref = (streams: string[] = [], topics: string[] = []) => ({ streams, topics });

  it("treats an empty selection as no restriction", () => {
    /* Ticking nothing must match everyone, or the default setting would be the
       one that never finds an opponent. */
    expect(intersectPreferences(pref(), pref(["maths:GCSE"]))?.streams).toEqual(["maths:GCSE"]);
    expect(intersectPreferences(pref(), pref())?.streams).toEqual([]);
  });

  it("matches on overlap rather than equality", () => {
    /* The failure this replaced: two players who each ticked three things and
       shared one were treated as being in different queues, and never met. */
    const shared = intersectPreferences(
      pref(["maths:GCSE", "maths:A_LEVEL", "biology:GCSE"]),
      pref(["maths:A_LEVEL", "physics:A_LEVEL"]),
    );
    expect(shared?.streams).toEqual(["maths:A_LEVEL"]);
  });

  it("refuses a pairing with nothing in common", () => {
    expect(intersectPreferences(pref(["maths:GCSE"]), pref(["biology:A_LEVEL"]))).toBeNull();
  });

  it("keeps a subject and a qualification bound together", () => {
    /* Ticking GCSE Maths and A-Level Biology as separate subject and level
       lists would also let through A-Level Maths and GCSE Biology, which is not
       what anybody meant. One key per pair is what prevents that. */
    expect(
      intersectPreferences(pref(["maths:GCSE"]), pref(["maths:A_LEVEL"])),
    ).toBeNull();
  });

  it("intersects topics the same way", () => {
    const shared = intersectPreferences(
      pref(["maths:A_LEVEL"], ["calculus", "statistics"]),
      pref(["maths:A_LEVEL"], ["statistics", "mechanics"]),
    );
    expect(shared?.topics).toEqual(["statistics"]);

    expect(
      intersectPreferences(pref([], ["calculus"]), pref([], ["mechanics"])),
    ).toBeNull();
  });

  it("requires both the stream and the topic to overlap", () => {
    expect(
      intersectPreferences(
        pref(["maths:GCSE"], ["algebra"]),
        pref(["maths:GCSE"], ["mechanics"]),
      ),
    ).toBeNull();
  });

  it("never lets a selection serve a question a battle cannot mark", () => {
    /* Marking free text needs a model, and the Arena rules one out. */
    expect(preferenceFilter(pref()).types).not.toContain("SHORT_ANSWER");
    expect(preferenceFilter(pref(["maths:GCSE"])).types).not.toContain("SHORT_ANSWER");
  });

  it("leaves an unrestricted field off the filter entirely", () => {
    const filter = preferenceFilter(pref(["maths:GCSE"]));
    expect(filter.streams).toEqual(["maths:GCSE"]);
    expect(filter.topics).toBeUndefined();
  });

  it("filters candidates by their subject and qualification together", () => {
    const q = (id: string, subject: string, level: CurriculumLevel): Candidate => ({
      id,
      subject,
      topic: "algebra",
      subtopic: "expanding",
      curriculumLevel: level,
      difficulty: 5,
      questionType: "MCQ_SINGLE",
      calculator: false,
    });

    const pool = [
      q("gcse-maths", "maths", "YEAR_10"),
      q("alevel-maths", "maths", "YEAR_12"),
      q("gcse-bio", "biology", "YEAR_11"),
    ];

    const kept = filterCandidates(pool, preferenceFilter(pref(["maths:GCSE"])));
    expect(kept.map((c) => c.id)).toEqual(["gcse-maths"]);
  });

  it("never puts a calculator question into a battle", () => {
    /* Both players race one clock. Whether one of them happens to have a
       calculator on the desk must not be what decides the match. */
    const q = (id: string, calculator: boolean): Candidate => ({
      id,
      subject: "maths",
      topic: "algebra",
      subtopic: "expanding",
      curriculumLevel: "YEAR_10",
      difficulty: 5,
      questionType: "MCQ_SINGLE",
      calculator,
    });

    expect(preferenceFilter(pref()).calculator).toBe(false);

    const kept = filterCandidates(
      [q("mental", false), q("keypad", true)],
      preferenceFilter(pref(["maths:GCSE"])),
    );
    expect(kept.map((c) => c.id)).toEqual(["mental"]);
  });

  it("drops values the app has never heard of", () => {
    /* An unknown key would silently narrow the search to nothing, which looks
       exactly like matchmaking being broken. */
    const known = {
      streams: new Set(["maths:GCSE", "maths:A_LEVEL"]),
      topics: new Set(["algebra", "calculus"]),
    };
    const cleaned = normalisePreference(
      ["maths:GCSE", "wizardry:GCSE", "maths:GCSE"],
      ["algebra", "not-a-topic"],
      known,
    );
    expect(cleaned.streams).toEqual(["maths:GCSE"]);
    expect(cleaned.topics).toEqual(["algebra"]);
  });

  it("normalises to a stable order, so two identical picks look identical", () => {
    const known = {
      streams: new Set(["maths:GCSE", "maths:A_LEVEL"]),
      topics: new Set<string>(),
    };
    expect(normalisePreference(["maths:GCSE", "maths:A_LEVEL"], [], known).streams).toEqual(
      normalisePreference(["maths:A_LEVEL", "maths:GCSE"], [], known).streams,
    );
  });
});

describe("the seeded shuffle", () => {
  it("keeps every item", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    expect(shuffle(items, seedFrom("m1")).sort((a, b) => a - b)).toEqual(items);
  });

  it("is stable for a seed and different across seeds", () => {
    const items = ["a", "b", "c", "d", "e", "f"];
    expect(shuffle(items, seedFrom("m1"))).toEqual(shuffle(items, seedFrom("m1")));
    expect(shuffle(items, seedFrom("m1"))).not.toEqual(shuffle(items, seedFrom("m2")));
  });
});

/* ==========================================================================
   Marking
   ========================================================================== */

describe("marking a bank answer", () => {
  it("marks a single-choice answer", () => {
    expect(isBankAnswerCorrect("MCQ_SINGLE", ["o2"], "x = 3", { optionIds: ["o2"] })).toBe(true);
    expect(isBankAnswerCorrect("MCQ_SINGLE", ["o2"], "x = 3", { optionIds: ["o1"] })).toBe(false);
  });

  it("requires the exact set on a multi-answer question", () => {
    expect(isBankAnswerCorrect("MCQ_MULTI", ["a", "b"], "", { optionIds: ["a", "b"] })).toBe(true);
    expect(isBankAnswerCorrect("MCQ_MULTI", ["a", "b"], "", { optionIds: ["a"] })).toBe(false);
    /* Selecting everything is not a correct answer. */
    expect(isBankAnswerCorrect("MCQ_MULTI", ["a", "b"], "", { optionIds: ["a", "b", "c"] })).toBe(
      false,
    );
  });

  it("treats an empty answer as wrong rather than as a match", () => {
    expect(isBankAnswerCorrect("MCQ_SINGLE", ["a"], "", { optionIds: [] })).toBe(false);
    expect(isBankAnswerCorrect("NUMERIC", [], "42", { text: "" })).toBe(false);
    expect(isBankAnswerCorrect("NUMERIC", [], "42", { text: null })).toBe(false);
  });

  it("marks numeric answers with a tolerance, but not a generous one", () => {
    expect(isBankAnswerCorrect("NUMERIC", [], "3.14159", { text: "3.14159" })).toBe(true);
    expect(isBankAnswerCorrect("NUMERIC", [], "1250", { text: "1,250" })).toBe(true);
    expect(isBankAnswerCorrect("NUMERIC", [], "42", { text: "42.5" })).toBe(false);
  });

  it("falls back to a string comparison when the answer is not a number", () => {
    expect(isBankAnswerCorrect("SHORT_ANSWER", [], "Two real roots", { text: "two real roots" })).toBe(
      true,
    );
    expect(isBankAnswerCorrect("SHORT_ANSWER", [], "Two real roots", { text: "no real roots" })).toBe(
      false,
    );
  });
});

/* ==========================================================================
   Import
   ========================================================================== */

describe("importing questions", () => {
  const valid = {
    sourceKey: "test:1",
    topic: "algebra",
    subtopic: "expanding",
    curriculumLevel: "YEAR_10",
    difficulty: 4,
    questionType: "MCQ_SINGLE",
    prompt: "Expand (x + 1)(x + 2).",
    answer: "x² + 3x + 2",
    explanation: "Multiply each term in the first bracket by each term in the second.",
    options: [
      { text: "x² + 3x + 2", isCorrect: true },
      { text: "x² + 2", isCorrect: false },
      { text: "x² + 2x + 3", isCorrect: false },
      { text: "x² + 3x + 3", isCorrect: false },
    ],
  };

  it("accepts a well-formed question", () => {
    expect(validateQuestion(valid)).toBeNull();
  });

  it("refuses a choice question that does not have exactly four options", () => {
    /* Every question in the bank offers four choices; three raises the odds of
       a lucky guess and the battle UI has nowhere to put a fifth. */
    expect(validateQuestion({ ...valid, options: valid.options.slice(0, 3) })).toContain(
      "exactly four options",
    );
    expect(
      validateQuestion({
        ...valid,
        options: [...valid.options, { text: "x² + 4x + 2", isCorrect: false }],
      }),
    ).toContain("exactly four options");
  });

  it("refuses a topic or subtopic that is not in the taxonomy", () => {
    /* Otherwise the question exists but no filter can ever reach it. */
    expect(validateQuestion({ ...valid, subtopic: "made-up" })).toContain("unknown topic/subtopic");
    expect(validateQuestion({ ...valid, topic: "made-up" })).toContain("unknown topic/subtopic");
  });

  it("refuses a choice question with the wrong number of correct options", () => {
    const twoCorrect = {
      ...valid,
      options: valid.options.map((o) => ({ ...o, isCorrect: true })),
    };
    expect(validateQuestion(twoCorrect)).toContain("expected exactly one");
  });

  it("refuses a choice question whose answer is not among its options", () => {
    expect(validateQuestion({ ...valid, answer: "something else" })).toContain(
      "not among the options",
    );
  });

  it("refuses duplicate option text", () => {
    const duplicated = {
      ...valid,
      options: [
        { text: "x² + 3x + 2", isCorrect: true },
        { text: "x² + 2", isCorrect: false },
        { text: "x²  +  2", isCorrect: false },
        { text: "x² + 2x + 3", isCorrect: false },
      ],
    };
    expect(validateQuestion(duplicated)).toContain("duplicate option text");
  });

  it("refuses a question with no explanation", () => {
    expect(validateQuestion({ ...valid, explanation: "  " })).toContain("explanation is empty");
  });

  it("carries the source attribution onto every imported question", () => {
    const { questions } = parseImportFile({
      source: { name: "Some Open Dataset", url: "https://example.org", licence: "CC BY-SA 4.0" },
      questions: [{ ...valid, sourceKey: "a" }, { ...valid, sourceKey: "b" }],
    });

    expect(questions.length).toBe(2);
    for (const question of questions) {
      expect(question.sourceLicence).toBe("CC BY-SA 4.0");
      expect(question.sourceName).toBe("Some Open Dataset");
    }
  });

  it("complains when a named source has no licence", () => {
    const { errors } = parseImportFile({
      source: { name: "Some Dataset" },
      questions: [],
    });
    expect(errors.join(" ")).toContain("licence");
  });

  it("rejects a file that is not shaped like an import", () => {
    expect(parseImportFile(null).errors.length).toBeGreaterThan(0);
    expect(parseImportFile({ questions: "nope" }).errors.length).toBeGreaterThan(0);
  });
});
