import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { runScheduledWork } from "@/server/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled work endpoint.
 *
 * Point a cron at this (Vercel Cron, GitHub Actions, systemd timer, anything
 * that can make an HTTP request) every few minutes:
 *
 *   Authorization: Bearer $CRON_SECRET
 *
 * It is idempotent — running it twice does no harm, and the jobs it picks up
 * are claimed atomically so two overlapping runs won't duplicate work.
 */
async function handle(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${env.cronSecret}`;

  if (!auth || auth !== expected) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const summary = await runScheduledWork();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[cron]", error);
    return NextResponse.json({ ok: false, error: "Scheduled work failed." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
