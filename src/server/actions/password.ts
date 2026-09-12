"use server";

import { z } from "zod";

import { requestPasswordReset, resetPassword } from "@/server/services/account";
import { hit, LIMITS } from "@/lib/rate-limit";

/**
 * Password reset — the only actions in the app that run signed out.
 *
 * They deliberately don't use the `guarded` wrapper, because that requires an
 * authenticated user. Rate limiting is applied by hand instead, keyed on the
 * email address, so a script can't grind through addresses looking for which
 * ones bounce differently.
 */

export interface PasswordActionResult {
  ok: boolean;
  error?: string;
  /** True when the reset link went to the server console instead of an inbox. */
  logged?: boolean;
}

const emailSchema = z.string().trim().toLowerCase().email();

export async function requestPasswordResetAction(email: unknown): Promise<PasswordActionResult> {
  const parsed = emailSchema.safeParse(email);

  // An invalid address gets the same answer as a valid one — no oracle.
  if (!parsed.success) return { ok: true };

  const limit = hit(`reset:${parsed.data}`, LIMITS.auth.limit, LIMITS.auth.windowSeconds);
  if (!limit.ok) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  try {
    const result = await requestPasswordReset(parsed.data);
    return { ok: true, logged: result.logged };
  } catch (error) {
    console.error("[password-reset:request]", error);
    // Still reports success — whether the address exists is not something an
    // anonymous caller gets to learn, even from an error.
    return { ok: true };
  }
}

const resetSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8, "Passwords need to be at least 8 characters.").max(200),
});

export async function resetPasswordAction(input: unknown): Promise<PasswordActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details below." };
  }

  const limit = hit(
    `reset-submit:${parsed.data.token.slice(0, 12)}`,
    LIMITS.auth.limit,
    LIMITS.auth.windowSeconds,
  );
  if (!limit.ok) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return { ok: true };
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status && status >= 400 && status < 500) {
      return { ok: false, error: (error as Error).message };
    }
    console.error("[password-reset:submit]", error);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }
}
