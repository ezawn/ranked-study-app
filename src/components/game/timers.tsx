"use client";

import { useState } from "react";

import { Panel } from "@/components/ui/panel";
import { Meter } from "@/components/ui/feedback";
import { BrainIcon, ClockIcon, CoinIcon, XIcon } from "@/components/icons";
import { cn, formatDuration } from "@/lib/utils";
import { PRODUCT_NAME } from "@/lib/brand";
import { useSessionTimer } from "./session-timer";

/**
 * Everything the two timers look like.
 *
 * The numbers all come from one provider, so the header, the floating clock
 * and the dashboard panel can never drift apart.
 */

// ---------------------------------------------------------------------------
// Header pill
// ---------------------------------------------------------------------------

export function CoinTimerCompact() {
  const timer = useSessionTimer();

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-faint num"
      title={`Coin timer — next coin in ${formatDuration(timer.secondsToNextCoin)}`}
    >
      <CoinIcon size={13} className={cn("text-coin/70", timer.active && "text-coin")} />
      <span>{timer.cappedOut ? "max" : formatDuration(timer.secondsToNextCoin)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating clock
// ---------------------------------------------------------------------------

/**
 * Time on the site today, bottom-left, always there.
 *
 * The figure is the stored total for today, so it carries across sign-outs and
 * reloads and resets at local midnight. It pauses when the tab is hidden or
 * the user goes quiet, which is what the server counts too.
 */
export function SessionClock() {
  const timer = useSessionTimer();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed bottom-[4.75rem] left-4 z-30 lg:bottom-6 lg:left-6">
      {open ? (
        <div className="panel pointer-events-auto w-[17rem] animate-rise p-4 shadow-lift">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-faint">
                On {PRODUCT_NAME} today
              </div>
              <div className="num mt-1 text-[26px] font-bold tracking-[-0.02em] text-bright">
                {formatDuration(timer.activeSeconds)}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse timer"
              className="rounded-md p-1 text-faint transition-colors hover:bg-raise-3 hover:text-bright"
            >
              <XIcon size={13} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                  <CoinIcon size={12} className="text-coin" /> Coin timer
                </span>
                <span className="num text-[13.5px] font-bold text-bright">
                  {timer.cappedOut ? "maxed" : formatDuration(timer.secondsToNextCoin)}
                </span>
              </div>
              <Countdown
                remaining={timer.secondsToNextCoin}
                total={timer.coinIntervalSeconds}
                spent={timer.cappedOut}
                tone="coin"
                label="Time until your next coin"
              />
              <p className="mt-1.5 text-[12px] text-faint">
                <span className="num font-semibold text-muted">
                  {timer.coinsToday} / {timer.dailyCoinCap}
                </span>{" "}
                coins today
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                  <BrainIcon size={12} className={timer.studyVerified ? "text-lime" : "text-faint"} />
                  Study bonus
                </span>
                <span className="num text-[13.5px] font-bold text-bright">
                  {timer.studyCappedOut ? "maxed" : formatDuration(timer.secondsToNextBonus)}
                </span>
              </div>
              <Countdown
                remaining={timer.secondsToNextBonus}
                total={timer.bonusIntervalSeconds}
                spent={timer.studyCappedOut}
                tone="lime"
                label="Time until your next study bonus"
              />
              <p className="mt-1.5 text-[12px] text-faint">
                <span className="num font-semibold text-muted">
                  {timer.studyBonusCoinsToday} / {timer.studyBonusDailyCap}
                </span>{" "}
                bonus coins ·{" "}
                <span className="num font-semibold text-muted">
                  {formatDuration(timer.studySeconds)}
                </span>{" "}
                studied
              </p>
            </div>
          </div>

          <p className="mt-3 border-t border-line pt-2.5 text-[12px] leading-relaxed text-faint">
            {timer.studyVerified
              ? "Earning the study bonus on this page."
              : "Open a flashcard set, a quiz or a test report to earn the study bonus."}
          </p>

          <button
            onClick={() => setHidden(true)}
            className="mt-2 text-[12px] text-faint underline-offset-2 hover:text-muted hover:underline"
          >
            Hide until next page load
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "panel pointer-events-auto flex items-center gap-2 py-1.5 pl-2.5 pr-3.5 transition-all",
            "hover:border-line-strong",
            !timer.active && "opacity-60",
          )}
          title={`Time on ${PRODUCT_NAME} today`}
        >
          <ClockIcon
            size={15}
            className={cn(timer.active ? "text-accent" : "text-faint")}
          />
          <span className="num text-[13px] font-semibold text-bright">
            {formatDuration(timer.activeSeconds)}
          </span>
          {timer.studyVerified ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-lime"
              title="Earning the study bonus"
            />
          ) : null}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard panel
// ---------------------------------------------------------------------------

/**
 * `bare` drops the panel chrome and renders on the page ground instead.
 *
 * The dashboard reads as a document rather than a set of tiles, so the timer
 * there is a section of that document. Everywhere else it would still want
 * its own surface, which is why this is a prop rather than a rewrite.
 */
export function CoinTimerPanel({ bare = false }: { bare?: boolean }) {
  const timer = useSessionTimer();
  const Shell = bare ? "div" : Panel;

  return (
    <Shell className={bare ? undefined : "p-4"}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-faint">Coin timer</span>
        <span className="flex items-center gap-1 text-xs num text-muted">
          <CoinIcon size={13} className="text-coin" />
          {timer.coinsToday} / {timer.dailyCoinCap}
        </span>
      </div>

      {timer.cappedOut ? (
        <p className="mt-2 text-sm text-muted">
          You&apos;ve maxed out today&apos;s coin timer. Everything else still earns.
        </p>
      ) : (
        <>
          <div className="num mt-2 text-[22px] font-semibold text-bright">
            {formatDuration(timer.secondsToNextCoin)}
          </div>
          <p className="mt-0.5 text-xs text-muted">until your next coin</p>
        </>
      )}

      <Countdown
        remaining={timer.secondsToNextCoin}
        total={timer.coinIntervalSeconds}
        spent={timer.cappedOut}
        tone="coin"
        className="mt-3"
        label="Time until your next coin"
      />

      <p className="mt-1.5 text-[12px] num text-faint">
        {timer.coinsToday} of {timer.dailyCoinCap} timer coins earned today
      </p>

      <div className="mt-4 border-t border-line pt-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-faint">
            <BrainIcon size={12} className={timer.studyVerified ? "text-lime" : "text-faint"} />
            Study bonus
          </span>
          <span className="text-xs num text-muted">
            {timer.studyBonusCoinsToday} / {timer.studyBonusDailyCap}
          </span>
        </div>

        {timer.studyCappedOut ? (
          <p className="mt-2 text-sm text-muted">
            You&apos;ve maxed out today&apos;s study bonus.
          </p>
        ) : (
          <>
            <div className="num mt-2 text-[22px] font-semibold text-bright">
              {formatDuration(timer.secondsToNextBonus)}
            </div>
            <p className="mt-0.5 text-xs text-muted">until your next bonus</p>
          </>
        )}

        <Countdown
          remaining={timer.secondsToNextBonus}
          total={timer.bonusIntervalSeconds}
          spent={timer.studyCappedOut}
          tone="lime"
          className="mt-3"
          label="Time until your next study bonus"
        />

        <p className="mt-1.5 text-[12px] leading-relaxed text-faint">
          +5 coins every {Math.round(timer.bonusIntervalSeconds / 60)} minutes on flashcards,
          quizzes or test feedback. {formatDuration(timer.studySeconds)} studied today.
        </p>
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/**
 * A bar that empties as its timer runs down.
 *
 * Deliberately the inverse of a progress bar: this sits directly beneath a
 * countdown, and a bar that fills while the number beside it falls reads as two
 * things disagreeing. Full at the start of an interval, empty when the coin
 * lands, then straight back to full for the next one.
 *
 * The 0.6s width transition means the refill reads as a sweep rather than a
 * jump, which is why the roll-over is left to animate instead of being snapped.
 */
function Countdown({
  remaining,
  total,
  spent,
  tone,
  className,
  label,
}: {
  remaining: number;
  total: number;
  /** Nothing left to earn today — show it empty rather than mid-drain. */
  spent?: boolean;
  tone: "coin" | "lime";
  className?: string;
  label: string;
}) {
  return (
    <Meter
      value={spent ? 0 : remaining}
      max={total}
      tone={tone}
      className={className}
      label={label}
    />
  );
}
