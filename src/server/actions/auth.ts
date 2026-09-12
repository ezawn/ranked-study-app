"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { enforce, LIMITS, RateLimited } from "@/lib/rate-limit";
import { isUniqueViolation } from "@/server/services/coins";

const signUpSchema = z.object({
  name: z.string().trim().min(1, "What should we call you?").max(60),
  email: z.string().trim().toLowerCase().email("That doesn't look like an email address."),
  password: z
    .string()
    .min(8, "Passwords need to be at least 8 characters.")
    .max(200, "That password is too long."),
  timezone: z.string().max(64).optional(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Create an account.
 *
 * Deliberately does NOT sign the user in from inside the action — the client
 * calls signIn() with the same credentials afterwards, which keeps one code
 * path for session creation.
 */
export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Check the details below.", fieldErrors };
  }

  const { name, email, password, timezone } = parsed.data;

  try {
    enforce(`signup:${email}`, LIMITS.auth);
  } catch (error) {
    if (error instanceof RateLimited) return { ok: false, error: error.message };
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        timezone: isValidTimezone(timezone) ? timezone! : "Europe/London",
        streak: { create: {} },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        error: "There's already an account with that email. Try signing in instead.",
      };
    }
    console.error("[sign-up]", error);
    return { ok: false, error: "We couldn't create that account. Try again in a moment." };
  }

  return { ok: true };
}

function isValidTimezone(tz: string | undefined): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz }).format();
    return true;
  } catch {
    return false;
  }
}
