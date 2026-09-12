"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/feedback";
import { SwordIcon } from "@/components/icons";
import { SubjectPicker, type StreamOption } from "@/components/arena/subject-picker";
import { useQueue } from "@/components/arena/queue-provider";
import { queueSizeAction } from "@/server/actions/arena";

/**
 * Choosing what to be asked, and starting the search.
 *
 * The search loop itself no longer lives here — it moved to QueueProvider so it
 * survives the player navigating away (see that file). This component only
 * picks the subjects, hands them to `queue.start`, and mirrors the shared queue
 * state while the player is still on this page. Leaving the page keeps the
 * search running; the corner indicator takes over showing it.
 */

/** Debounce before re-counting what a selection matches. */
const COUNT_DEBOUNCE_MS = 250;

/** Mirrors MIN_BANK_MATCH_QUESTIONS — a battle will not start below this. */
const MIN_QUESTIONS = 12;

export function Matchmaker({
  streams,
  bankTotal,
}: {
  /** Every subject-and-qualification, live or not yet. */
  streams: readonly StreamOption[];
  /** Everything in the bank, shown when nothing is ticked. */
  bankTotal: number;
}) {
  const queue = useQueue();

  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [available, setAvailable] = useState<number | null>(bankTotal);

  /* Recount as the selection changes. Debounced, because ticking five boxes
     should be one request rather than five. */
  useEffect(() => {
    if (selectedStreams.length === 0) {
      setAvailable(bankTotal);
      return;
    }

    setAvailable(null);
    let live = true;
    const id = setTimeout(() => {
      void (async () => {
        const result = await queueSizeAction({ streams: selectedStreams });
        if (live && result.ok) setAvailable(result.data.available);
      })();
    }, COUNT_DEBOUNCE_MS);

    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [selectedStreams, bankTotal]);

  const start = useCallback(() => {
    queue.start(selectedStreams);
  }, [queue, selectedStreams]);

  const tooNarrow = available !== null && available < MIN_QUESTIONS;

  if (queue.phase === "searching" || queue.phase === "matched") {
    const found = queue.phase === "matched";
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex items-center gap-2.5 text-bright">
          {found ? null : <Spinner className="h-5 w-5 text-accent" />}
          <span className="font-display text-[17px] font-bold tracking-[-0.02em]">
            {found ? "Opponent found" : queue.message}
          </span>
        </div>

        <p className="num text-[13px] text-muted">{found ? "Starting…" : `${queue.seconds}s`}</p>

        {found ? null : (
          <>
            <p className="max-w-sm text-[13px] leading-relaxed text-muted">
              {selectedStreams.length === 0
                ? "Any subject, any level — you'll be matched with whoever turns up."
                : "Looking for anyone whose picks overlap yours. You'll be asked about what you share."}
            </p>
            <p className="max-w-sm text-[12px] leading-relaxed text-faint">
              You can leave this page and keep searching — a badge in the corner tracks it, and
              you'll be taken straight into the battle when it starts.
            </p>
            <Button variant="ghost" size="sm" onClick={queue.cancel}>
              Cancel
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubjectPicker
        streams={streams}
        selectedStreams={selectedStreams}
        available={available}
        onStreamsChange={setSelectedStreams}
      />

      {/* Said before queueing rather than after ten minutes of searching. */}
      {tooNarrow ? (
        <Alert tone="amber" title="That's too narrow to play">
          Your selection covers only {available} question{available === 1 ? "" : "s"}, and a battle
          needs at least {MIN_QUESTIONS}. Tick another subject.
        </Alert>
      ) : null}

      <div className="flex flex-col items-start gap-3 border-t border-line pt-5">
        <Button size="lg" onClick={start} disabled={tooNarrow} icon={<SwordIcon size={16} />}>
          Find match
        </Button>

        {queue.phase === "expired" ? (
          <Alert tone="amber" title="No opponent turned up">
            Nobody compatible was searching. Try again, or widen your subjects.
          </Alert>
        ) : null}

        {queue.phase === "error" && queue.error ? (
          <Alert tone="rose" title="Couldn't start a match">
            {queue.error}
          </Alert>
        ) : null}
      </div>
    </div>
  );
}
