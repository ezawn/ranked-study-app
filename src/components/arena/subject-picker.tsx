"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { CheckIcon } from "@/components/icons";
import { STAGE_LABEL, type Stage } from "@/lib/bank/taxonomy";

/**
 * Choosing what you want to be asked.
 *
 * One level only: a SUBJECT at a qualification — GCSE Maths, A-Level Biology.
 * There is deliberately no drill-down below that. Narrowing to a single topic
 * or subtopic shrinks the pool so far that most questions in it never come up,
 * and on a small player base it also makes you nearly impossible to pair. The
 * subject tier is as fine as the picker goes.
 *
 * Ticking nothing means anything, and that is the default. It is stated on
 * screen, because an empty selection that silently meant "nothing" would be a
 * trap, and an empty selection the player thinks means "nothing" is just as
 * bad.
 *
 * Selections OVERLAP rather than having to match. Two players who tick three
 * things each and share one will be paired and asked about the one they share,
 * which is why ticking more makes you easier to match rather than harder — the
 * opposite of what an exact-match queue would do, and worth saying out loud
 * since players will assume otherwise.
 */

export interface StreamOption {
  /** `subject:stage`. */
  key: string;
  subject: string;
  subjectLabel: string;
  stage: Stage;
  count: number;
}

export function SubjectPicker({
  streams,
  selectedStreams,
  available,
  disabled,
  onStreamsChange,
}: {
  /** Every subject-and-qualification the app knows about, live or not. */
  streams: readonly StreamOption[];
  selectedStreams: readonly string[];
  /** Questions the current selection draws on. Null while it is being counted. */
  available: number | null;
  disabled?: boolean;
  onStreamsChange: (streams: string[]) => void;
}) {
  const byStage = useMemo(() => {
    const groups: Record<Stage, StreamOption[]> = { GCSE: [], A_LEVEL: [] };
    for (const stream of streams) groups[stream.stage].push(stream);
    for (const stage of ["GCSE", "A_LEVEL"] as const) {
      groups[stage].sort((a, b) => b.count - a.count || a.subjectLabel.localeCompare(b.subjectLabel));
    }
    return groups;
  }, [streams]);

  const toggleStream = (stream: StreamOption) => {
    const on = selectedStreams.includes(stream.key);
    onStreamsChange(
      on ? selectedStreams.filter((s) => s !== stream.key) : [...selectedStreams, stream.key],
    );
  };

  const anySelection = selectedStreams.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-[15px] font-bold tracking-[-0.015em] text-bright">
          What do you want to be asked?
        </h3>
        <p className="text-[12.5px] text-muted">
          {anySelection ? (
            <>
              <span className="num font-semibold text-accent-deep">
                {available === null ? "…" : available.toLocaleString()}
              </span>{" "}
              question{available === 1 ? "" : "s"} match
            </>
          ) : (
            "Nothing ticked — anything goes"
          )}
        </p>
      </div>

      {(["GCSE", "A_LEVEL"] as const).map((stage) =>
        byStage[stage].length === 0 ? null : (
          <div key={stage}>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">
              {STAGE_LABEL[stage]}
            </p>

            <div className="flex flex-wrap gap-2">
              {byStage[stage].map((stream) => {
                const empty = stream.count === 0;
                return (
                  <Tick
                    key={stream.key}
                    label={stream.subjectLabel}
                    count={empty ? undefined : stream.count}
                    note={empty ? "soon" : undefined}
                    checked={selectedStreams.includes(stream.key)}
                    disabled={disabled || empty}
                    onToggle={() => toggleStream(stream)}
                  />
                );
              })}
            </div>
          </div>
        ),
      )}

      {anySelection ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <button
            type="button"
            onClick={() => onStreamsChange([])}
            disabled={disabled}
            className="link text-[12.5px] font-semibold disabled:opacity-50"
          >
            Clear everything
          </button>
          <p className="text-[12.5px] text-muted">
            You&apos;ll be matched with anyone whose picks overlap yours, on what you share — so
            ticking more makes you easier to match, not harder.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * One tick-box.
 *
 * A button rather than a real checkbox because the whole chip is the target and
 * a comfortable hit area matters more here than the native control —
 * `role="checkbox"` and `aria-checked` keep it a checkbox to anything that is
 * listening.
 */
function Tick({
  label,
  count,
  note,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  count?: number;
  /** Shown instead of a count. Used for subjects with nothing in them yet. */
  note?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-sq border px-3 py-2 text-[13px] leading-none",
        "transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-45",
        checked
          ? "border-accent bg-accent/12 text-bright"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-bright",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border",
          checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong",
        )}
      >
        {checked ? <CheckIcon size={10} /> : null}
      </span>
      <span className="font-medium">{label}</span>
      {note ? (
        <span className="text-[11px] uppercase tracking-[0.06em] text-faint">{note}</span>
      ) : count === undefined ? null : (
        <span className="num text-[11.5px] text-faint">{count}</span>
      )}
    </button>
  );
}
