"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { guarded } from "./helpers";
import { db } from "@/lib/db";
import { submitDailyQuiz } from "@/server/services/daily-quiz";

const submitSchema = z.array(
  z.object({
    questionId: z.string().cuid(),
    selectedOptionIds: z.array(z.string().cuid()).max(12),
  }),
).max(10);

export async function submitDailyQuizAction(input: unknown) {
  return guarded(
    "daily.submit",
    async (userId) => {
      const answers = submitSchema.parse(input);
      const result = await submitDailyQuiz(userId, answers);

      revalidatePath("/daily");
      revalidatePath("/streak");
      revalidatePath("/dashboard");
      return result;
    },
    { limit: { limit: 12, windowSeconds: 300 } },
  );
}

/** Used by the streak page to show which sources today's questions could come from. */
export async function dailySourceCountAction() {
  return guarded("daily.sources", async (userId) => {
    const count = await db.question.count({
      where: { quiz: { ownerId: userId }, type: { in: ["MCQ_SINGLE", "MCQ_MULTI"] } },
    });
    return { count };
  });
}
