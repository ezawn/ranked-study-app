import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireUserId } from "@/lib/auth/session";
import { enforce, LIMITS, RateLimited } from "@/lib/rate-limit";
import { recordHeartbeat } from "@/server/services/study-time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The heartbeat.
 *
 * The only thing the body may say is which kind of page the user is on, and
 * even that is a hint rather than a fact — the service checks it against real
 * study activity before it counts toward the study bonus. Elapsed time is
 * measured server-side between stored heartbeats and cannot be influenced from
 * here at all.
 */
const bodySchema = z.object({
  context: z.enum(["flashcards", "quiz", "test-feedback"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    enforce(`heartbeat:${userId}`, LIMITS.heartbeat);

    let context: "flashcards" | "quiz" | "test-feedback" | undefined;
    try {
      const parsed = bodySchema.safeParse(await request.json());
      if (parsed.success) context = parsed.data.context;
    } catch {
      // No body, or unparseable — treated as a plain presence heartbeat.
    }

    const result = await recordHeartbeat(userId, context);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RateLimited) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } },
      );
    }
    const status = (error as { status?: number }).status ?? 500;
    if (status === 500) console.error("[heartbeat]", error);
    return NextResponse.json(
      { error: status === 500 ? "Something went wrong." : (error as Error).message },
      { status },
    );
  }
}
