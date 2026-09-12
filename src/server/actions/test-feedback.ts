"use server";

import { revalidatePath } from "next/cache";

import { guarded } from "./helpers";
import { LIMITS } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { storePdf } from "@/server/services/uploads";
import { analyseTest, generatePracticeFromReport } from "@/server/services/test-feedback";
import { UPLOAD_LIMITS } from "@/lib/coins/rules";

export async function analyseTestAction(formData: FormData) {
  return guarded(
    "test-feedback.analyse",
    async (userId) => {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        throw Object.assign(new Error("Choose a PDF of your test."), { status: 400 });
      }
      if (file.size > UPLOAD_LIMITS.maxBytes) {
        const mb = Math.round(UPLOAD_LIMITS.maxBytes / (1024 * 1024));
        throw Object.assign(new Error(`Files need to be under ${mb}MB.`), { status: 400 });
      }

      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true, timezone: true },
      });

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await storePdf(userId, "TEST_PAPER", {
        buffer,
        filename: file.name || "test.pdf",
        mimeType: file.type || "application/pdf",
      });

      const report = await analyseTest(userId, upload.id, user.plan, user.timezone, {
        title: String(formData.get("title") ?? "").trim() || undefined,
        subject: String(formData.get("subject") ?? "").trim() || undefined,
      });

      revalidatePath("/test-feedback");
      return report;
    },
    { limit: LIMITS.upload },
  );
}

export async function generateTestPracticeAction(submissionId: string) {
  return guarded(
    "test-feedback.practice",
    async (userId) => {
      const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true },
      });
      return generatePracticeFromReport(userId, submissionId, user.plan);
    },
    { limit: { limit: 10, windowSeconds: 300 } },
  );
}
