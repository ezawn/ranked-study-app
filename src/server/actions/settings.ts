"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { guarded } from "./helpers";
import { LIMITS } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import {
  changePassword,
  changeTimezone,
  removeAvatar,
  setAvatar,
  updateProfile,
} from "@/server/services/account";
import { IMAGE_LIMITS } from "@/lib/storage";

const profileSchema = z.object({
  name: z.string().trim().min(1, "You need a name.").max(60),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/i, "Usernames are 3-20 letters, numbers or underscores.")
    .nullish(),
});

export async function updateProfileAction(input: unknown) {
  return guarded("settings.profile", async (userId) => {
    const data = profileSchema.parse(input);
    await updateProfile(userId, { name: data.name, username: data.username ?? null });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return null;
  });
}

export async function changeTimezoneAction(timezone: string) {
  return guarded("settings.timezone", async (userId) => {
    const result = await changeTimezone(userId, timezone);

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/streak");
    return result;
  });
}

export async function uploadAvatarAction(formData: FormData) {
  return guarded(
    "settings.avatar",
    async (userId) => {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        throw Object.assign(new Error("Choose an image."), { status: 400 });
      }
      if (file.size > IMAGE_LIMITS.maxBytes) {
        const mb = Math.round(IMAGE_LIMITS.maxBytes / (1024 * 1024));
        throw Object.assign(new Error(`Images need to be under ${mb}MB.`), { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await setAvatar(userId, { buffer, filename: file.name || "avatar" });

      revalidatePath("/settings");
      revalidatePath("/dashboard");
      return result;
    },
    { limit: LIMITS.upload },
  );
}

export async function removeAvatarAction() {
  return guarded("settings.avatar.remove", async (userId) => {
    await removeAvatar(userId);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return null;
  });
}

const passwordSchema = z.object({
  currentPassword: z.string().max(200).nullish(),
  newPassword: z.string().min(8, "Passwords need to be at least 8 characters.").max(200),
});

export async function changePasswordAction(input: unknown) {
  return guarded(
    "settings.password",
    async (userId) => {
      const data = passwordSchema.parse(input);
      await changePassword(userId, data.currentPassword ?? null, data.newPassword);
      revalidatePath("/settings");
      return null;
    },
    { limit: LIMITS.auth },
  );
}

/**
 * Switch your own plan.
 *
 * A DEVELOPMENT convenience so the free/premium limits can be exercised
 * without a payment provider wired up. It refuses to run in production — when
 * billing goes in, the webhook writes `plan` and this action goes away.
 */
export async function setPlanAction(plan: "FREE" | "PREMIUM") {
  return guarded("settings.plan", async (userId) => {
    if (process.env.NODE_ENV === "production") {
      throw Object.assign(new Error("Plan changes go through billing, not this switch."), {
        status: 403,
      });
    }

    await db.$transaction([
      db.user.update({ where: { id: userId }, data: { plan, planExpiresAt: null } }),
      db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          provider: "manual",
          status: plan === "PREMIUM" ? "active" : "canceled",
        },
        update: { status: plan === "PREMIUM" ? "active" : "canceled" },
      }),
    ]);

    revalidatePath("/settings");
    revalidatePath("/settings/plan");
    revalidatePath("/dashboard");
    return { plan };
  });
}
