"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { guarded, imageKeySchema, type ActionResult } from "./helpers";
import {
  copyPublicSet,
  createSet,
  deleteSet,
  setVisibility,
  updateSet,
} from "@/server/services/flashcards";
import { answerCram, reviewCard, startOrResumeCram } from "@/server/services/study";

const cardSchema = z.object({
  id: z.string().cuid().optional(),
  front: z.string().max(4000),
  back: z.string().max(4000),
  hint: z.string().max(500).nullish(),
  frontImageKey: imageKeySchema,
  backImageKey: imageKeySchema,
});

const setSchema = z.object({
  title: z.string().trim().min(1, "Give the set a title.").max(160),
  description: z.string().max(1000).nullish(),
  subject: z.string().max(80).nullish(),
  isPublic: z.boolean().optional(),
  cards: z.array(cardSchema).min(1, "Add at least one card.").max(500),
});

export async function createSetAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guarded("flashcards.create", async (userId) => {
    const data = setSchema.parse(input);
    const set = await createSet(userId, data);
    revalidatePath("/flashcards");
    revalidatePath("/dashboard");
    return set;
  });
}

export async function updateSetAction(
  setId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  return guarded("flashcards.update", async (userId) => {
    const data = setSchema.parse(input);
    const set = await updateSet(userId, setId, data);
    revalidatePath("/flashcards");
    revalidatePath(`/flashcards/${setId}`);
    return set;
  });
}

export async function deleteSetAction(setId: string): Promise<ActionResult<null>> {
  return guarded("flashcards.delete", async (userId) => {
    await deleteSet(userId, setId);
    revalidatePath("/flashcards");
    revalidatePath("/dashboard");
    return null;
  });
}

export async function setVisibilityAction(
  setId: string,
  isPublic: boolean,
): Promise<ActionResult<{ isPublic: boolean }>> {
  return guarded("flashcards.visibility", async (userId) => {
    const result = await setVisibility(userId, setId, isPublic);
    revalidatePath(`/flashcards/${setId}`);
    revalidatePath("/flashcards");
    return { isPublic: result.isPublic };
  });
}

export async function copySetAction(setId: string): Promise<ActionResult<{ id: string }>> {
  return guarded("flashcards.copy", async (userId) => {
    const copy = await copyPublicSet(userId, setId);
    revalidatePath("/flashcards");
    return copy;
  });
}

const ratingSchema = z.enum(["KNOW", "PARTIAL", "DONT_KNOW"]);

export async function reviewCardAction(cardId: string, rating: unknown) {
  return guarded(
    "flashcards.review",
    async (userId) => {
      const parsed = ratingSchema.parse(rating);
      const result = await reviewCard(userId, cardId, parsed);
      if (result.completion?.coinsAwarded) {
        revalidatePath("/dashboard");
      }
      return result;
    },
    { limit: { limit: 240, windowSeconds: 60 } },
  );
}

export async function startCramAction(setId: string, restart = false) {
  return guarded("flashcards.cram.start", async (userId) => {
    return startOrResumeCram(userId, setId, restart);
  });
}

export async function answerCramAction(sessionId: string, cardId: string, known: boolean) {
  return guarded(
    "flashcards.cram.answer",
    async (userId) => {
      const result = await answerCram(userId, sessionId, cardId, known);
      if (result.completion?.coinsAwarded) {
        revalidatePath("/dashboard");
      }
      return result;
    },
    { limit: { limit: 240, windowSeconds: 60 } },
  );
}
