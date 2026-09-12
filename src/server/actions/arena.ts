"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { guarded } from "./helpers";
import { requireUser } from "@/lib/auth/session";
import { enqueue, cancelSearch, pollQueue } from "@/server/services/arena/queue";
import {
  matchState,
  submitAnswer,
  questionWindow,
  isInMatch,
  finaliseMatch,
} from "@/server/services/arena/match";
import { purchase, toggleEquip } from "@/server/services/arena/cosmetics";
import { countForPreference } from "@/server/services/bank/query";
import { normalisePreference } from "@/lib/bank/select";
import { KNOWN_QUEUE_VALUES } from "@/lib/bank/queue-vocabulary";

/**
 * Arena actions.
 *
 * Thin by design: every one of these validates its input, then hands off to a
 * service. Nothing here computes a score, a rating or a price — those live on
 * the server side of the service boundary where the client cannot reach them.
 *
 * The rate limits are the interesting part. Matchmaking and match-state polls
 * run once a second by design, so they get limits sized for that; without them
 * the poll loop would trip the default mutation limit within seconds and the
 * feature would appear broken rather than throttled.
 */

/* Roughly one a second for three minutes, with headroom for a retry. */
const POLL_LIMIT = { limit: 240, windowSeconds: 200 };

/* A two-minute battle where every answer is instant. Generous, but finite: it
   still stops a script submitting thousands. */
const ANSWER_LIMIT = { limit: 150, windowSeconds: 180 };

/* What the player ticked. Both lists empty means "anything", which is the
   default and matches the most opponents. */
const queueSchema = z
  .object({
    /** "maths:GCSE" and friends. */
    streams: z.array(z.string().max(64)).max(20).optional(),
    topics: z.array(z.string().max(64)).max(60).optional(),
  })
  .optional();

export async function findMatchAction(input?: unknown) {
  return guarded(
    "arena.find",
    async () => {
      const user = await requireUser();
      return enqueue(user.id, user.timezone, queueSchema.parse(input) ?? {});
    },
    { limit: { limit: 20, windowSeconds: 120 } },
  );
}

/**
 * How many questions the current selection draws on.
 *
 * Shown live beside the tick-boxes, so a selection that is too narrow to play
 * is visible before the player queues rather than after three minutes of
 * spinner.
 */
export async function queueSizeAction(input: unknown) {
  return guarded(
    "arena.queue-size",
    async () => {
      const queue = queueSchema.parse(input) ?? {};
      const preference = normalisePreference(queue.streams, queue.topics, KNOWN_QUEUE_VALUES);
      return { available: await countForPreference(preference) };
    },
    { limit: { limit: 90, windowSeconds: 120 } },
  );
}

export async function pollMatchmakingAction() {
  return guarded("arena.poll", async (userId) => pollQueue(userId), { limit: POLL_LIMIT });
}

export async function cancelMatchmakingAction() {
  return guarded("arena.cancel", async (userId) => {
    await cancelSearch(userId);
    return { cancelled: true };
  });
}

const matchIdSchema = z.string().cuid();

export async function matchStateAction(input: unknown) {
  return guarded(
    "arena.state",
    async (userId) => {
      const matchId = matchIdSchema.parse(input);
      const state = await matchState(matchId, userId);
      if (!state) throw Object.assign(new Error("That match has gone."), { status: 404 });
      return state;
    },
    { limit: POLL_LIMIT },
  );
}

const questionsSchema = z.object({
  matchId: matchIdSchema,
  from: z.number().int().min(0).max(199),
  /* One buffer's worth. Bounded so this cannot become a way to pull the whole
     hand in a single request. */
  count: z.number().int().min(1).max(10),
});

export async function matchQuestionsAction(input: unknown) {
  return guarded(
    "arena.questions",
    async (userId) => {
      const { matchId, from, count } = questionsSchema.parse(input);

      /* Membership is checked before questions are handed out, so a match id is
         not a way to read somebody else's hand. This used to call `matchState`,
         which loads the match, both players, both users and both rating rows —
         a four-table read to answer a yes/no question, on the request the
         battle makes most often. */
      if (!(await isInMatch(matchId, userId))) {
        throw Object.assign(new Error("That match has gone."), { status: 404 });
      }

      return questionWindow(matchId, from, count);
    },
    { limit: ANSWER_LIMIT },
  );
}

const answerSchema = z.object({
  matchId: matchIdSchema,
  position: z.number().int().min(0).max(199),
  optionIds: z.array(z.string().cuid()).max(12).optional(),
  numeric: z.string().max(64).nullish(),
  /* Bounded so a client cannot claim a negative or absurd duration. The server
     clamps it again against the match clock; this only rejects nonsense. */
  responseMs: z.number().int().min(0).max(600_000),
});

export async function submitAnswerAction(input: unknown) {
  return guarded(
    "arena.answer",
    async (userId) => {
      const parsed = answerSchema.parse(input);
      return submitAnswer(parsed.matchId, userId, {
        position: parsed.position,
        optionIds: parsed.optionIds,
        numeric: parsed.numeric ?? null,
        responseMs: parsed.responseMs,
      });
    },
    { limit: ANSWER_LIMIT },
  );
}

export async function finishMatchAction(input: unknown) {
  return guarded("arena.finish", async (userId) => {
    const matchId = matchIdSchema.parse(input);
    const state = await matchState(matchId, userId);
    if (!state) throw Object.assign(new Error("That match has gone."), { status: 404 });

    await finaliseMatch(matchId);
    revalidatePath("/arena");
    revalidatePath("/rank");
    revalidatePath("/leaderboard");
    return { finished: true };
  });
}

/* ------------------------------------------------------------- Cosmetics */

const itemSchema = z.string().cuid();

export async function purchaseCosmeticAction(input: unknown) {
  return guarded(
    "arena.buy",
    async (userId) => {
      const itemId = itemSchema.parse(input);
      const result = await purchase(userId, itemId);

      if (!result.ok) {
        const message =
          result.reason === "insufficient"
            ? "Not enough Study Coins for that yet."
            : result.reason === "already_owned"
              ? "You already own that."
              : "That item isn't available.";
        throw Object.assign(new Error(message), { status: 400 });
      }

      revalidatePath("/character");
      return result;
    },
    { limit: { limit: 30, windowSeconds: 120 } },
  );
}

export async function equipCosmeticAction(input: unknown) {
  return guarded("arena.equip", async (userId) => {
    const itemId = itemSchema.parse(input);
    const result = await toggleEquip(userId, itemId);

    if (!result.ok) {
      const message =
        result.reason === "not_owned" ? "Buy that first." : "That item isn't available.";
      throw Object.assign(new Error(message), { status: 400 });
    }

    revalidatePath("/character");
    return result;
  });
}
