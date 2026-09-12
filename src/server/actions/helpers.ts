import "server-only";

import { z, ZodError } from "zod";

import { RateLimited, enforce, LIMITS } from "@/lib/rate-limit";
import { requireUserId } from "@/lib/auth/session";

/**
 * Server-action plumbing.
 *
 * Actions return a discriminated result rather than throwing across the
 * server/client boundary, so the UI always has something to show. Unexpected
 * errors are logged in full on the server and reduced to a generic message for
 * the user — internal details never leak into the browser.
 */

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { ok: false, error };
}

/**
 * A storage key for an uploaded image, as it comes back from the browser.
 *
 * Kept deliberately loose about shape — the storage adapter decides that, and
 * S3 keys won't look like local ones — but strict about characters, so nothing
 * shaped like a path traversal ever reaches the storage layer. The real gate is
 * still the file route, which only serves keys with a matching `Upload` row.
 *
 * This lives here rather than beside each form because Zod strips keys it
 * doesn't know about: a schema that forgets this field doesn't error, it
 * silently drops the image.
 */
export const imageKeySchema = z
  .string()
  .max(300)
  .regex(/^[A-Za-z0-9._/-]+$/, "That image reference isn't valid.")
  .refine((key) => !key.includes(".."), "That image reference isn't valid.")
  .nullish();

interface KnownError {
  status?: number;
  message: string;
}

/**
 * Wrap an action body: authenticate, rate-limit, run, and translate errors.
 * `fn` receives the authenticated user id.
 */
export async function guarded<T>(
  name: string,
  fn: (userId: string) => Promise<T>,
  options: { limit?: { limit: number; windowSeconds: number } } = {},
): Promise<ActionResult<T>> {
  try {
    const userId = await requireUserId();
    enforce(`${name}:${userId}`, options.limit ?? LIMITS.mutation);
    return ok(await fn(userId));
  } catch (error) {
    if (error instanceof RateLimited) return fail(error.message);

    if (error instanceof ZodError) {
      return fail(error.issues[0]?.message ?? "Those details aren't valid.");
    }

    const known = error as KnownError;
    // 4xx errors carry messages written for users; 5xx do not.
    if (known.status && known.status >= 400 && known.status < 500) {
      return fail(known.message);
    }

    console.error(`[action:${name}]`, error);
    return fail("Something went wrong. Try again in a moment.");
  }
}
