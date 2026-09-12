"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Spinner } from "@/components/ui/feedback";
import { SwordIcon, XIcon } from "@/components/icons";
import { cn, formatDuration } from "@/lib/utils";
import { useQueue } from "./queue-provider";

/**
 * "In queue" in the corner, on every page.
 *
 * The queue runs in the background now (see QueueProvider), so it needs a
 * presence away from the Arena page: a small panel bottom-right with how long
 * the search has been running and a way out of it. Bottom-left is taken by the
 * session clock, so this sits opposite it.
 *
 * Hidden on the Arena page itself — the matchmaker there shows the same state
 * in full — and on the battle and results screens, where the search is already
 * handing over to the match.
 */
export function QueueIndicator() {
  const queue = useQueue();
  const pathname = usePathname();

  const onArenaSurface =
    pathname === "/arena" ||
    pathname.startsWith("/arena/battle") ||
    pathname.startsWith("/arena/results");

  if (onArenaSurface || queue.phase === "idle") return null;

  return (
    <div className="pointer-events-none fixed bottom-[4.75rem] right-4 z-30 lg:bottom-6 lg:right-6">
      <div className="panel pointer-events-auto flex w-[15rem] animate-rise items-center gap-2.5 p-3 shadow-lift">
        {queue.phase === "searching" ? (
          <>
            <Spinner className="h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-bright">In queue</p>
              <p className="num text-[12px] text-muted">
                {formatDuration(queue.seconds)} · {queue.message.toLowerCase()}
              </p>
            </div>
            <button
              onClick={queue.cancel}
              aria-label="Leave the queue"
              className="rounded-md p-1 text-faint transition-colors hover:bg-raise-3 hover:text-bright"
            >
              <XIcon size={13} />
            </button>
          </>
        ) : queue.phase === "matched" ? (
          <>
            <SwordIcon size={16} className="shrink-0 text-accent" />
            <p className="flex-1 text-[13px] font-semibold text-bright">Opponent found — starting…</p>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-bright">
                {queue.phase === "expired" ? "No opponent found" : "Queue interrupted"}
              </p>
              <Link
                href="/arena"
                onClick={queue.dismiss}
                className={cn("link text-[12px] font-semibold")}
              >
                Search again
              </Link>
            </div>
            <button
              onClick={queue.dismiss}
              aria-label="Dismiss"
              className="rounded-md p-1 text-faint transition-colors hover:bg-raise-3 hover:text-bright"
            >
              <XIcon size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
