"use server";

import { guarded } from "./helpers";
import { LIMITS } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { IMAGE_LIMITS, sha256, storage, validateImage } from "@/lib/storage";
import { fileUrl } from "@/lib/utils";

/**
 * Image upload, shared by the flashcard and quiz editors.
 *
 * The file is validated by its magic bytes before it touches disk, so the
 * browser's claimed content type is irrelevant. The returned key is what gets
 * saved on the card or question.
 */
export async function uploadImageAction(formData: FormData) {
  return guarded(
    "uploads.image",
    async (userId) => {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        throw Object.assign(new Error("Choose an image."), { status: 400 });
      }
      if (file.size > IMAGE_LIMITS.maxBytes) {
        const mb = Math.round(IMAGE_LIMITS.maxBytes / (1024 * 1024));
        throw Object.assign(new Error(`Images need to be under ${mb}MB.`), { status: 400 });
      }

      const kindRaw = String(formData.get("kind") ?? "CARD_IMAGE");
      const kind = kindRaw === "QUESTION_IMAGE" ? "QUESTION_IMAGE" : "CARD_IMAGE";

      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = validateImage(buffer, file.name || "image");

      const stored = await storage().put(buffer, {
        filename: file.name || "image",
        mimeType,
      });

      await db.upload.create({
        data: {
          userId,
          kind,
          storageKey: stored.key,
          filename: (file.name || "image").slice(0, 200),
          mimeType,
          sizeBytes: stored.sizeBytes,
          checksum: sha256(buffer),
          status: "READY",
        },
      });

      return { key: stored.key, url: fileUrl(stored.key)! };
    },
    { limit: LIMITS.upload },
  );
}
