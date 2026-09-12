import "server-only";

import { db } from "@/lib/db";
import type { Tx } from "@/server/services/coins";
import { awardCoins, isUniqueViolation } from "@/server/services/coins";
import { dealOptions, isAnswerCorrect, type ObjectiveType } from "@/lib/arena/pool";
import { scoreBattle, decideWinner, battleCoins, type ScoredAnswer } from "@/lib/arena/scoring";
import { applyMatchElo, nextPeakRank } from "@/lib/arena/elo";
import { rankForElo } from "@/lib/arena/ranks";
import { preferenceFilter, seedFrom as bankSeedFrom, type QueuePreference } from "@/lib/bank/select";
import {
  dealQuestions,
  seenQuestionIds,
  recordServed,
  markingFactsFor,
  markingFactsForOne,
} from "@/server/services/bank/query";

/**
 * The battle.
 *
 * Three rules run through everything here, and they are the reason this file
 * is a service rather than a route handler:
 *
 *  1. THE CLIENT NEVER MARKS ITSELF. A submitted answer carries a selection
 *     and a duration and nothing else. Correctness is decided here against the
 *     stored question; the score is computed here from the stored answers; the
 *     Elo is computed here from ratings read here. There is no figure a client
 *     can send that becomes a figure in the database.
 *  2. THE HAND IS DEALT ONCE. `Match.questionIds` is written at creation and
 *     never regenerated, so both players meet the same questions in the same
 *     order and neither client decides what comes next.
 *
 * Every new match is dealt from the permanent question bank. Matches played
 * before the bank existed carry `questionSource: "library"` and still resolve
 * against the players\' own quizzes — `questionWindow` and the marker both
 * branch on it — so history stays intact without keeping a second live path.
 *  3. THE CLOCK IS THE SERVER'S. `endsAt` is stored; the countdown in the
 *     browser is decoration. An answer arriving after `endsAt` is refused,
 *     however convincing the client's own timer was.
 */

/** How long a battle runs. */
export const BATTLE_SECONDS = 120;

/**
 * The lead-in before the first question.
 *
 * The clock starts the moment the match is created, but each player still has
 * to load the battle route and get one poll back before they can see it — so a
 * three-second countdown was mostly gone by the time it rendered, and a player
 * would catch a stray "1" or nothing at all. Four seconds leaves enough runway
 * that both players reliably see the full "3, 2, 1", which is the point of it:
 * a shared, synced beat to read who the opponent is before the timer runs.
 */
export const COUNTDOWN_SECONDS = 4;

/** Slack allowed for network latency on the final answer. */
const LATE_GRACE_MS = 1500;

export type CreateMatchResult =
  | { ok: true; match: { id: string; questionIds: string[] } }
  | { ok: false; reason: "no_questions" | "no_profile"; available: number };

/**
 * Create a match dealt from the permanent question bank.
 *
 * The other route into a battle, and the one the curriculum queues use. It
 * shares everything after the deal with `createMatch` — same clock, same
 * players, same scoring — and differs only in where the questions come from and
 * what `questionSource` records.
 *
 * Both players are passed to the dealer as one pair, so freshness is computed
 * across the two of them together: a question either has already met is
 * deprioritised for both, which is what stops the bank feeling small when two
 * friends play repeatedly.
 */
export async function createBankMatch(
  input: { aUserId: string; bUserId: string; shared: QueuePreference },
  tx?: Tx,
): Promise<CreateMatchResult> {
  const client = tx ?? db;
  const players = [input.aUserId, input.bUserId];

  const filter = preferenceFilter(input.shared);
  const seed = bankSeedFrom(`${[...players].sort().join(":")}:${Date.now()}`);

  const [aSeen, bSeen] = await Promise.all([
    seenQuestionIds(input.aUserId, "arena"),
    seenQuestionIds(input.bUserId, "arena"),
  ]);
  const seen = new Set([...aSeen, ...bSeen]);

  const deal = await dealQuestions({
    ...filter,
    count: BANK_MATCH_QUESTIONS,
    seed,
    /* Freshness is applied here from the merged set rather than by passing one
       userId, because the deal has to be identical for both players. */
    userId: undefined,
    record: false,
  });

  /* Re-rank the dealt candidates so anything neither player has met comes
     first, without changing which questions were drawn. */
  const fresh = deal.questions.filter((q) => !seen.has(q.id));
  const familiar = deal.questions.filter((q) => seen.has(q.id));
  const questionIds = [...fresh, ...familiar].map((q) => q.id);

  if (questionIds.length < MIN_BANK_MATCH_QUESTIONS) {
    return { ok: false, reason: "no_questions", available: deal.available };
  }

  const [aProfile, bProfile] = await Promise.all([
    client.arenaProfile.findUnique({ where: { userId: input.aUserId } }),
    client.arenaProfile.findUnique({ where: { userId: input.bUserId } }),
  ]);
  if (!aProfile || !bProfile) return { ok: false, reason: "no_profile", available: 0 };

  const now = Date.now();
  const startsAt = new Date(now + COUNTDOWN_SECONDS * 1000);
  const endsAt = new Date(startsAt.getTime() + BATTLE_SECONDS * 1000);

  const match = await client.match.create({
    data: {
      status: "STARTING",
      subject:
        input.shared.streams.length === 1
          ? input.shared.streams[0]
          : input.shared.topics.length === 1
            ? input.shared.topics[0]
            : "mixed",
      pooledFrom: [...input.shared.streams, ...input.shared.topics].join(",") || "bank",
      questionSource: "bank",
      questionIds,
      startsAt,
      endsAt,
      players: {
        create: [
          { userId: input.aUserId, eloBefore: aProfile.elo, rankBefore: aProfile.rankKey },
          { userId: input.bUserId, eloBefore: bProfile.elo, rankBefore: bProfile.rankKey },
        ],
      },
    },
  });

  /* Recorded for both players so neither meets these again soon. Done after the
     match exists, so a failed deal leaves no trace. */
  await Promise.all([
    recordServed(input.aUserId, questionIds, "arena"),
    recordServed(input.bUserId, questionIds, "arena"),
  ]);

  return { ok: true, match: { id: match.id, questionIds } };
}

/** A hand big enough that a fast player never runs out inside two minutes. */
const BANK_MATCH_QUESTIONS = 45;

/**
 * Below this a battle is not worth starting.
 *
 * Exported because matchmaking uses it to decide, before choosing an opponent,
 * whether a pairing could produce a hand at all.
 */
export const MIN_BANK_MATCH_QUESTIONS = 12;

/* ==========================================================================
   Live state
   ========================================================================== */

export interface LiveQuestion {
  id: string;
  position: number;
  prompt: string;
  type: ObjectiveType;
  imageKey: string | null;
  /** Shuffled per match, but never carrying which one is right. */
  options: { id: string; text: string }[];
}

/**
 * A run of questions, in one round trip.
 *
 * The battle used to fetch one question at a time, which put a network hop
 * between every answer and the next question — on a hosted database that is a
 * visible pause, and the pause was what made answering feel broken. The client
 * now keeps a buffer several questions ahead, so advancing is a local
 * operation and the fetch happens while the player is reading.
 *
 * Reading ahead is not a leak: options never carry `isCorrect`, exactly as in
 * the quiz runner, so a buffered question is worth no more to a devtools
 * inspector than an on-screen one.
 */
export async function questionWindow(
  matchId: string,
  from: number,
  count: number,
): Promise<LiveQuestion[]> {
  if (count <= 0 || from < 0) return [];

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { questionIds: true, questionSource: true },
  });
  if (!match) return [];

  const slice = match.questionIds.slice(from, from + count);
  if (slice.length === 0) return [];

  /* Two sources, one shape. A bank match's ids point at `BankQuestion` rather
     than `Question`; everything downstream — the client, the scoring, the
     option shuffle — is identical, so the branch is confined to this lookup. */
  if (match.questionSource === "bank") {
    return bankWindow(matchId, slice, from);
  }

  const rows = await db.question.findMany({
    where: { id: { in: slice } },
    select: {
      id: true,
      prompt: true,
      type: true,
      imageKey: true,
      options: { select: { id: true, text: true }, orderBy: { position: "asc" } },
    },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));

  /* Mapped back over the slice rather than returned in query order — `findMany`
     with an `in` makes no promise about ordering, and the position each
     question is answered at has to be the position it was dealt at. */
  return slice.flatMap((id, offset) => {
    const question = byId.get(id);
    if (!question) return [];
    return [
      {
        id: question.id,
        position: from + offset,
        prompt: question.prompt,
        type: question.type as ObjectiveType,
        imageKey: question.imageKey,
        options: dealOptions(matchId, question.id, question.options),
      },
    ];
  });
}

/** The same window, drawn from the permanent bank. */
async function bankWindow(
  matchId: string,
  slice: readonly string[],
  from: number,
): Promise<LiveQuestion[]> {
  const rows = await db.bankQuestion.findMany({
    where: { id: { in: [...slice] } },
    select: {
      id: true,
      prompt: true,
      questionType: true,
      /* No `isCorrect`, and no `explanation` — the worked solution is a
         complete answer key, so it is released only after the answer is in. */
      options: { select: { id: true, text: true }, orderBy: { position: "asc" } },
    },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));

  return slice.flatMap((id, offset) => {
    const question = byId.get(id);
    if (!question) return [];
    return [
      {
        id: question.id,
        position: from + offset,
        prompt: question.prompt,
        type: question.questionType as ObjectiveType,
        imageKey: null,
        options: dealOptions(matchId, question.id, question.options),
      },
    ];
  });
}

/** Cheap membership check, for the paths that need authorisation and nothing else. */
export async function isInMatch(matchId: string, userId: string): Promise<boolean> {
  const player = await db.matchPlayer.findUnique({
    where: { matchId_userId: { matchId, userId } },
    select: { id: true },
  });
  return player !== null;
}

export interface MatchState {
  matchId: string;
  status: "starting" | "live" | "complete" | "abandoned";
  /** Server time remaining. The client's own clock is never trusted. */
  msRemaining: number;
  msUntilStart: number;
  totalQuestions: number;
  you: { answered: number; correct: number; score: number; finished: boolean };
  opponent: {
    userId: string;
    name: string;
    username: string | null;
    rankKey: string;
    elo: number;
    /** Live progress only — never their answers. */
    answered: number;
    score: number;
    /** Out of questions. Shown so waiting has a visible reason. */
    finished: boolean;
  } | null;
}

/**
 * What the polling client is told.
 *
 * The opponent's running score is included because a race with an invisible
 * opponent is not a race. Their answers are not, because knowing which option
 * they picked would be a hint.
 */
/* Answer counts this instance has already scored, so the poll does no work
   while a player is thinking. Purely an optimisation — a cold instance simply
   scores once more than it needed to. */
const lastScored = new Map<string, number>();

export async function matchState(matchId: string, userId: string): Promise<MatchState | null> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      players: {
        include: {
          /* The opponent's rating comes down with the same query. It used to be
             a second round trip, on a request both clients make once a second
             for the whole match. */
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              arenaProfile: { select: { elo: true, rankKey: true } },
            },
          },
        },
      },
    },
  });
  if (!match) return null;

  const me = match.players.find((p) => p.userId === userId);
  if (!me) return null;

  const them = match.players.find((p) => p.userId !== userId) ?? null;

  const now = Date.now();
  const msRemaining = Math.max(0, match.endsAt.getTime() - now);
  const msUntilStart = Math.max(0, match.startsAt.getTime() - now);

  const total = match.questionIds.length;
  const open = match.status !== "COMPLETE" && match.status !== "ABANDONED";

  /*
   * Two ways a match ends, and both close it here.
   *
   * The clock is the obvious one: the first request to arrive after time is up
   * finalises. No cron needed, and a match cannot sit unscored because nobody
   * ran a job.
   *
   * The hand running out is the other, and it was missing. Both players could
   * answer every question with a minute to spare and then sit watching a
   * countdown with nothing left to do — the match was decided and refused to
   * admit it.
   */
  if (open && (msRemaining === 0 || bothExhausted(match.players, total))) {
    await finaliseMatch(matchId);
    return matchState(matchId, userId);
  }

  /*
   * Keep the caller's running score current.
   *
   * This used to happen inside `submitAnswer`, which meant every answer paid
   * for a full re-score before the player could be told whether they were
   * right. It belongs here instead: the poll is already running once a second,
   * nobody is waiting on it, and a score that lags by up to a second is
   * invisible. `finaliseMatch` recomputes from stored answers regardless, so
   * this is a display value and nothing depends on it.
   *
   * Skipped when the answer count has not moved since the last time this
   * instance scored them, so a player sitting on a question is not re-scored
   * once a second for no reason.
   */
  let myScore = me.score;
  if (open && lastScored.get(me.id) !== me.answered && me.answered > 0) {
    lastScored.set(me.id, me.answered);
    /* Re-scoring also repairs the counters: it counts the stored answers rather
       than trusting the increments, so any drift corrects itself here. */
    const fresh = await rescorePlayer(me.id, match.questionSource);
    myScore = fresh.score;
  }

  return {
    matchId,
    status: match.status.toLowerCase() as MatchState["status"],
    msRemaining,
    msUntilStart,
    totalQuestions: total,
    you: {
      answered: me.answered,
      correct: me.correct,
      score: myScore,
      finished: me.answered >= total,
    },
    opponent: them
      ? {
          userId: them.userId,
          name: them.user.name ?? "Opponent",
          username: them.user.username,
          rankKey: them.user.arenaProfile?.rankKey ?? them.rankBefore,
          elo: them.user.arenaProfile?.elo ?? them.eloBefore,
          answered: them.answered,
          score: them.score,
          finished: them.answered >= total,
        }
      : null,
  };
}

/**
 * Has everybody run out of questions?
 *
 * Requires two players: a match missing one is a broken match, and treating it
 * as finished would score it as though it had been played.
 */
function bothExhausted(
  players: readonly { answered: number }[],
  totalQuestions: number,
): boolean {
  if (players.length !== 2 || totalQuestions === 0) return false;
  return players.every((p) => p.answered >= totalQuestions);
}

/* ==========================================================================
   Answering
   ========================================================================== */

export type SubmitResult =
  | {
      ok: true;
      correct: boolean;
      /**
       * Which options were right, so the client can show the answer.
       *
       * This is the ONLY point at which a correct answer is allowed to reach the
       * browser, and it is safe precisely because it is a reply rather than part
       * of a question: the answer for this position is already recorded, and
       * `MatchAnswer` is unique on (player, position), so it cannot be revised.
       * It says nothing about any other question — least of all the five still
       * sitting in the client's buffer.
       */
      correctOptionIds: string[];
      nextPosition: number;
      /** Both players are out of questions; the match was closed by this answer. */
      matchOver: boolean;
    }
  | { ok: false; reason: "not_in_match" | "finished" | "out_of_time" | "duplicate" | "unknown_question" };

/**
 * Record one answer.
 *
 * `responseMs` comes from the client, which means it can be understated. It is
 * clamped to the time actually elapsed in the match so far, so a client cannot
 * claim a 5ms answer three seconds after the previous one. That bound is the
 * honest limit of what a polling design can enforce; the alternative — timing
 * each question server-side — would need a round trip to reveal every question,
 * which is exactly the pause the brief rules out.
 */
/**
 * What never changes about a match, cached for the answer path.
 *
 * The hand, the clock and who is playing are fixed when the match is created.
 * Re-reading them on every answer cost a round trip to a hosted database before
 * the player could be told whether they were right — 45 times a match, on the
 * one request whose latency they actually watch. Status is deliberately NOT
 * cached: it is the mutable part, and an answer arriving after finalisation is
 * harmless anyway, because `finaliseMatch` scores from stored answers and is
 * idempotent, so a late row is recorded and simply never counted.
 */
interface MatchFacts {
  questionIds: string[];
  questionSource: string;
  startsAt: number;
  endsAt: number;
  players: { id: string; userId: string }[];
}

const matchFacts = new Map<string, { at: number; facts: MatchFacts }>();
const MATCH_FACTS_TTL_MS = 15 * 60 * 1000;

async function factsFor(matchId: string): Promise<MatchFacts | null> {
  const hit = matchFacts.get(matchId);
  if (hit && Date.now() - hit.at < MATCH_FACTS_TTL_MS) return hit.facts;

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      startsAt: true,
      endsAt: true,
      questionIds: true,
      questionSource: true,
      players: { select: { id: true, userId: true } },
    },
  });
  if (!match) return null;

  const facts: MatchFacts = {
    questionIds: match.questionIds,
    questionSource: match.questionSource,
    startsAt: match.startsAt.getTime(),
    endsAt: match.endsAt.getTime(),
    players: match.players.map((p) => ({ id: p.id, userId: p.userId })),
  };
  matchFacts.set(matchId, { at: Date.now(), facts });
  return facts;
}

export async function submitAnswer(
  matchId: string,
  userId: string,
  input: { position: number; optionIds?: string[]; numeric?: string | null; responseMs: number },
): Promise<SubmitResult> {
  const facts = await factsFor(matchId);
  if (!facts) return { ok: false, reason: "not_in_match" };

  const now = Date.now();
  if (now > facts.endsAt + LATE_GRACE_MS) {
    await finaliseMatch(matchId);
    return { ok: false, reason: "out_of_time" };
  }

  const player = facts.players.find((p) => p.userId === userId);
  if (!player) return { ok: false, reason: "not_in_match" };

  const questionId = facts.questionIds[input.position];
  if (!questionId) return { ok: false, reason: "unknown_question" };

  /* Marked server-side against the stored question. A bank match reads it from
     the in-memory index and issues no query at all; only the older library path
     still goes to the database. The client sends a selection and a duration;
     nothing it sends becomes a score. */
  const question =
    facts.questionSource === "bank"
      ? await loadBankQuestionFromIndex(questionId)
      : await loadLibraryQuestionForMarking(questionId);
  if (!question) return { ok: false, reason: "unknown_question" };

  const correct = isAnswerCorrect(
    question.type,
    question.correctOptionIds,
    question.markScheme,
    { optionIds: input.optionIds ?? [], numeric: input.numeric ?? null },
  );

  /* Clamp the reported duration into what the clock allows. */
  const elapsedInMatch = Math.max(0, now - facts.startsAt);
  const responseMs = Math.min(
    Math.max(0, Math.floor(input.responseMs)),
    Math.max(250, elapsedInMatch),
  );

  /*
   * The whole write, in one round trip.
   *
   * `$transaction` with an ARRAY sends both statements together, unlike the
   * callback form which is a conversation. That matters here more than anywhere
   * else in the codebase: this is the request the player is watching, and every
   * hop to a hosted database is time spent looking at an answer that has not
   * been marked yet.
   *
   * The counters are incremented rather than recomputed, so neither statement
   * needs a read. The authoritative score is still derived from the stored
   * answers — `finaliseMatch` recomputes the whole battle from scratch, and the
   * running total the players watch is refreshed by the poll they are already
   * making once a second.
   */
  let answered: number;
  try {
    const [, updated] = await db.$transaction([
      db.matchAnswer.create({
        data: {
          matchPlayerId: player.id,
          questionId,
          position: input.position,
          selectedOptionIds: input.optionIds ?? [],
          numericAnswer: input.numeric ?? null,
          correct,
          responseMs,
        },
      }),
      db.matchPlayer.update({
        where: { id: player.id },
        data: {
          answered: { increment: 1 },
          correct: { increment: correct ? 1 : 0 },
          totalResponseMs: { increment: responseMs },
        },
        select: { answered: true },
      }),
    ]);
    answered = updated.answered;
  } catch (error) {
    /* Unique on (player, position) — a resubmitted answer changes nothing.
       Narrowed to that one error on purpose: a bare `catch` here once turned a
       Prisma validation error into a silent "duplicate", and the symptom the
       player saw was a button that highlighted and did nothing. Anything that
       is not the constraint is a real fault and must surface. */
    if (!isUniqueViolation(error)) throw error;
    return { ok: false, reason: "duplicate" };
  }

  /* Only worth asking on the last question of the hand — which is why the
     opponent's progress is no longer read on every answer. */
  let finished = false;
  if (answered >= facts.questionIds.length) {
    const opponent = facts.players.find((p) => p.userId !== userId);
    if (opponent) {
      const theirs = await db.matchPlayer.findUnique({
        where: { id: opponent.id },
        select: { answered: true },
      });
      finished = (theirs?.answered ?? 0) >= facts.questionIds.length;
      if (finished) await finaliseMatch(matchId);
    }
  }

  return {
    ok: true,
    correct,
    correctOptionIds: question.correctOptionIds,
    nextPosition: input.position + 1,
    matchOver: finished,
  };
}

/**
 * Marking facts for a bank question, without touching the database.
 *
 * The index already holds every question in the bank; adding which options are
 * right turns marking into a map lookup. It is server-side memory — the shape
 * that reaches a client is `LiveQuestion`, which has never carried `isCorrect`.
 */
async function loadBankQuestionFromIndex(id: string): Promise<MarkableQuestion | null> {
  const facts = await markingFactsForOne(id);
  if (!facts) return null;
  return {
    type: facts.questionType as ObjectiveType,
    correctOptionIds: facts.correctOptionIds,
    /* The bank's canonical `answer` plays the role the quiz's `markScheme`
       does: the expected value for a numeric question. */
    markScheme: facts.answer,
  };
}

/**
 * Everything marking needs, from either table.
 *
 * One shape so `submitAnswer` has a single marking path — the alternative is
 * two nearly-identical blocks, and two nearly-identical blocks is where one of
 * them quietly stops matching the other.
 */
interface MarkableQuestion {
  type: ObjectiveType;
  correctOptionIds: string[];
  markScheme: string | null;
}

async function loadLibraryQuestionForMarking(id: string): Promise<MarkableQuestion | null> {
  const question = await db.question.findUnique({
    where: { id },
    select: {
      type: true,
      markScheme: true,
      options: { select: { id: true, isCorrect: true } },
    },
  });
  if (!question) return null;

  return {
    type: question.type as ObjectiveType,
    correctOptionIds: question.options.filter((o) => o.isCorrect).map((o) => o.id),
    markScheme: question.markScheme,
  };
}


/**
 * A player's answers, priced for scoring.
 *
 * The option count comes from a second query keyed on questionId rather than
 * from a relation traversal. `MatchAnswer` deliberately has no foreign key to
 * `Question` — deleting a quiz must not cascade away the match history that
 * references it — so `question: { ... }` is not a field Prisma can select, and
 * asking for it throws at runtime. That threw inside the answer handler, the
 * action swallowed it as a generic failure, and the battle silently refused to
 * advance. Two queries, no relation, no lie about the data model.
 */
async function scoredAnswersFor(
  client: Tx | typeof db,
  matchPlayerId: string,
  source: string,
): Promise<ScoredAnswer[]> {
  const answers = await client.matchAnswer.findMany({
    where: { matchPlayerId },
    orderBy: { position: "asc" },
    select: { correct: true, responseMs: true, questionId: true },
  });
  if (answers.length === 0) return [];

  const questionIds = [...new Set(answers.map((a) => a.questionId))];

  /* The option count sets the guess penalty and the estimate sets what "fast"
     means, so both have to come from whichever table the match was dealt from.
     Counting `QuestionOption` for a bank match would return nothing, every
     question would look numeric, and a wrong answer would cost the wrong
     amount.

     A bank match reads both from the in-memory index and issues no query at
     all. That matters because this runs inside `submitAnswer`, which cannot
     reply until it finishes — and the client cannot show the player whether
     they were right until it replies. Two round trips here were two round trips
     of a blank answer on screen. */
  const facts =
    source === "bank"
      ? await markingFactsFor(questionIds)
      : new Map(
          (
            await client.questionOption.groupBy({
              by: ["questionId"],
              where: { questionId: { in: questionIds } },
              _count: { _all: true },
            })
          ).map((c) => [c.questionId, { choices: c._count._all, estimatedSeconds: 0 }]),
        );

  return answers.map((a) => {
    const known = facts.get(a.questionId);
    return {
      correct: a.correct,
      responseMs: a.responseMs,
      choices: known?.choices || null,
      estimatedSeconds: known?.estimatedSeconds || null,
    };
  });
}

/**
 * Recompute a player's running total from their stored answers.
 *
 * From scratch every time rather than incrementally, because an incremental
 * total is a number that can drift out of agreement with the answers behind
 * it, and the streak multiplier makes each answer's value depend on the ones
 * before it anyway.
 */
async function rescorePlayer(
  matchPlayerId: string,
  source: string,
): Promise<{ score: number; answered: number }> {
  const result = scoreBattle(await scoredAnswersFor(db, matchPlayerId, source));

  await db.matchPlayer.update({
    where: { id: matchPlayerId },
    data: {
      score: result.score,
      answered: result.answered,
      correct: result.correct,
      totalResponseMs: result.averageResponseMs * result.answered,
    },
  });

  return { score: result.score, answered: result.answered };
}

/* ==========================================================================
   Finalising
   ========================================================================== */

/**
 * Close a match: score both sides, move Elo, pay coins.
 *
 * Idempotent by the status guard inside the transaction — two clients finishing
 * at the same instant cannot both apply Elo, because the second one finds the
 * match already COMPLETE and does nothing.
 */
export async function finaliseMatch(matchId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    /*
     * Claim the match before doing any work.
     *
     * `updateMany` with the status in its WHERE is atomic: of several racers,
     * exactly one gets `count: 1` and the rest get 0 and stop. Reading the
     * status and then checking it in JavaScript — which is what this did — is
     * not a lock. Under READ COMMITTED both callers read LIVE, both proceed,
     * and both try to write the same coin ledger rows; the loser hits the
     * idempotency-key unique constraint, and in Postgres that aborts the whole
     * transaction rather than just the one statement.
     *
     * There are three racers here, not two: both players poll `matchState`
     * once a second and it finalises lazily when the clock hits zero, and the
     * battle component calls `finishMatchAction` as well.
     */
    const claimed = await tx.match.updateMany({
      where: { id: matchId, status: { in: ["STARTING", "LIVE"] } },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
    if (claimed.count === 0) return;

    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });
    if (!match) return;

    if (match.players.length !== 2) {
      await tx.match.update({ where: { id: matchId }, data: { status: "ABANDONED" } });
      return;
    }

    const [a, b] = match.players;

    const [aAnswers, bAnswers] = await Promise.all([
      scoredAnswersFor(tx, a.id, match.questionSource),
      scoredAnswersFor(tx, b.id, match.questionSource),
    ]);

    const aScore = scoreBattle(aAnswers);
    const bScore = scoreBattle(bAnswers);
    const verdict = decideWinner(aScore, bScore);

    const [aProfile, bProfile] = await Promise.all([
      tx.arenaProfile.findUnique({ where: { userId: a.userId } }),
      tx.arenaProfile.findUnique({ where: { userId: b.userId } }),
    ]);
    if (!aProfile || !bProfile) return;

    const aResult = verdict === "a" ? "win" : verdict === "b" ? "loss" : "draw";
    const elo = applyMatchElo(
      { elo: aProfile.elo, matchesPlayed: aProfile.matchesPlayed },
      { elo: bProfile.elo, matchesPlayed: bProfile.matchesPlayed },
      aResult,
    );

    const bResult = aResult === "win" ? "loss" : aResult === "loss" ? "win" : "draw";

    /* Status and completedAt were written by the claim above. */
    await tx.match.update({
      where: { id: matchId },
      data: {
        isDraw: verdict === "draw",
        winnerId: verdict === "a" ? a.userId : verdict === "b" ? b.userId : null,
      },
    });

    for (const side of [
      { player: a, score: aScore, change: elo.a, profile: aProfile, result: aResult },
      { player: b, score: bScore, change: elo.b, profile: bProfile, result: bResult },
    ] as const) {
      const coins = battleCoins(side.result, side.score);

      await tx.matchPlayer.update({
        where: { id: side.player.id },
        data: {
          score: side.score.score,
          answered: side.score.answered,
          correct: side.score.correct,
          totalResponseMs: side.score.averageResponseMs * side.score.answered,
          outcome: side.result === "win" ? "WIN" : side.result === "loss" ? "LOSS" : "DRAW",
          eloAfter: side.change.eloAfter,
          eloDelta: side.change.delta,
          rankAfter: side.change.rankKeyAfter,
          coinsAwarded: coins,
          finishedAt: new Date(),
        },
      });

      const won = side.result === "win";
      const rankAfter = rankForElo(side.change.eloAfter).key;

      await tx.arenaProfile.update({
        where: { userId: side.player.userId },
        data: {
          elo: side.change.eloAfter,
          peakElo: Math.max(side.profile.peakElo, side.change.eloAfter),
          rankKey: rankAfter,
          peakRankKey: nextPeakRank(side.profile.peakRankKey, rankAfter),
          matchesPlayed: { increment: 1 },
          wins: { increment: won ? 1 : 0 },
          losses: { increment: side.result === "loss" ? 1 : 0 },
          draws: { increment: side.result === "draw" ? 1 : 0 },
          currentWinStreak: won ? side.profile.currentWinStreak + 1 : 0,
          bestWinStreak: won
            ? Math.max(side.profile.bestWinStreak, side.profile.currentWinStreak + 1)
            : side.profile.bestWinStreak,
          totalAnswered: { increment: side.score.answered },
          totalCorrect: { increment: side.score.correct },
          totalResponseMs: { increment: side.score.averageResponseMs * side.score.answered },
        },
      });

      /* Keep the denormalised copy the coin engine reads in step, inside the
         same transaction that moved the rank. */
      await tx.user.update({
        where: { id: side.player.userId },
        data: { rankTier: rankAfter },
      });

      await tx.eloEvent.create({
        data: {
          userId: side.player.userId,
          matchId,
          delta: side.change.delta,
          eloAfter: side.change.eloAfter,
          rankAfter,
        },
      });

      if (coins > 0) {
        await awardCoins(
          {
            userId: side.player.userId,
            source: "ADJUSTMENT",
            baseCoins: coins,
            idempotencyKey: `arena:match:${matchId}:${side.player.userId}`,
            refType: "match",
            refId: matchId,
          },
          tx,
        );
      }
    }
  });
}

/** Everything the results screen shows. */
export async function matchResult(matchId: string, userId: string) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      players: {
        include: { user: { select: { id: true, name: true, username: true, imageKey: true, image: true } } },
      },
    },
  });
  if (!match) return null;

  const me = match.players.find((p) => p.userId === userId);
  const them = match.players.find((p) => p.userId !== userId);
  if (!me) return null;

  return {
    matchId: match.id,
    subject: match.subject,
    pooledFrom: match.pooledFrom,
    isDraw: match.isDraw,
    winnerId: match.winnerId,
    you: me,
    opponent: them ?? null,
    totalQuestions: match.questionIds.length,
  };
}
