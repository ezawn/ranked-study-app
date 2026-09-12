"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Alert, Meter, Spinner } from "@/components/ui/feedback";
import { RankBadge } from "@/components/arena/rank-badge";
import { cn } from "@/lib/utils";
import { revealDelay, REVEAL_HOLD_MS } from "@/lib/arena/reveal";
import {
  matchStateAction,
  matchQuestionsAction,
  submitAnswerAction,
  finishMatchAction,
} from "@/server/actions/arena";

/**
 * The battle.
 *
 * Answering is a LOCAL operation. Picking an option marks it in the same frame
 * and the submission is posted afterwards, in the background, one at a time and
 * in order. Nothing the player does waits on the network.
 *
 * The first version awaited the round trip before advancing, and then awaited a
 * prefetch of the following question before releasing its guard — so every
 * answer cost two hops to a hosted database, during which the buttons were
 * dead. It read as a broken interface, which is the honest description: a
 * two-minute game cannot spend a second of it waiting to acknowledge a click.
 *
 * THE REVEAL is the one thing that does wait. Picking an option freezes the
 * question and paints it the moment the server's mark lands — the chosen box
 * green, or the chosen box red and the right one green — holds the colours for
 * REVEAL_HOLD_MS, and advances. The hold runs from the MARK, not from the
 * answer, so it is the same half second on every connection; see
 * `lib/arena/reveal` for why the first version got that backwards. A reply that
 * never comes is the only thing bounded: after MARK_TIMEOUT_MS the battle
 * advances uncoloured and the marks trail reports the result late. The correct
 * answer is never in the question payload; it arrives in the reply to an answer
 * already recorded.
 *
 * Three loops, all independent:
 *
 *   THE BUFFER keeps several questions ahead of the player, fetched a window at
 *   a time. Advancing reads from it; if it is ever empty, that is the end of
 *   the hand and not a pause.
 *
 *   THE OUTBOX drains answers to the server one at a time so they arrive in
 *   order. Its replies update the score and the result trail when they land.
 *   If one fails, it says so and the battle carries on.
 *
 *   THE OPPONENT POLL runs once a second, purely for their score and to notice
 *   the match ending. It never gates anything.
 *
 * The clock here is cosmetic. `msRemaining` from the server sets it on every
 * poll, and the server refuses answers past its own deadline whatever this
 * countdown says.
 */

const OPPONENT_POLL_MS = 1000;

/** Questions per fetch. */
const WINDOW = 6;

/** Top the buffer up once the player is within this many of its end. */
const LOOKAHEAD = 3;

interface Question {
  id: string;
  position: number;
  prompt: string;
  type: "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERIC";
  imageKey: string | null;
  options: { id: string; text: string }[];
}

interface Opponent {
  userId: string;
  name: string;
  username: string | null;
  rankKey: string;
  elo: number;
  answered: number;
  score: number;
  finished: boolean;
}

interface Pending {
  position: number;
  optionIds: string[];
  numeric: string | null;
  responseMs: number;
  attempts: number;
}

type Ending = "time" | "both-finished";

/**
 * An answered question, held on screen while its mark comes back.
 *
 * `correctIds` is null until the server replies. A reveal that never gets its
 * mark still expires — see `MARK_TIMEOUT_MS` — so this can never be a dead end.
 */
interface Reveal {
  position: number;
  chosen: string[];
  correctIds: string[] | null;
  correct: boolean | null;
}

export function Battle({ matchId }: { matchId: string }) {
  const router = useRouter();

  const [buffer, setBuffer] = useState<Record<number, Question>>({});
  const [dealtTo, setDealtTo] = useState(0);
  /* Mirrors `exhaustedRef`. Two copies of one fact because they have different
     jobs: the ref has to be true the instant a short window lands, so the next
     fetch is suppressed before any render; the state has to change to trigger
     one. They are always set together. */
  const [handComplete, setHandComplete] = useState(false);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [numeric, setNumeric] = useState("");
  const [marks, setMarks] = useState<boolean[]>([]);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [msUntilStart, setMsUntilStart] = useState<number | null>(null);
  const [you, setYou] = useState({ answered: 0, correct: 0, score: 0 });
  const [youFinished, setYouFinished] = useState(false);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [total, setTotal] = useState(0);
  const [ending, setEnding] = useState<Ending | null>(null);
  /* False until the first poll has said how far this player already is. */
  const [resumed, setResumed] = useState(false);

  const askedAtRef = useRef<number>(Date.now());
  const revealFromRef = useRef(0);
  const revealPosRef = useRef(-1);
  const markedAtRef = useRef<number | null>(null);
  const fetchedToRef = useRef(0);
  const fetchingRef = useRef(false);
  const exhaustedRef = useRef(false);
  const outboxRef = useRef<Pending[]>([]);
  const drainingRef = useRef(false);
  const sentUpToRef = useRef(-1);
  const resumedRef = useRef(false);
  const finishedRef = useRef(false);
  const liveRef = useRef(true);

  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);

  const question = buffer[position] ?? null;

  /* Out of questions, by either route: the server's count says so, or the
     buffer has reached the end of the hand and this position is past it. The
     second clause is what keeps a gap in the hand — a question deleted
     mid-match — from showing a loading spinner that never resolves. */
  const outOfQuestions =
    /* Never while a reveal is open. Answering the last question makes the
       server call this player finished, and the poll a moment later would
       otherwise swap the question out mid-reveal — so the one answer whose
       result matters most is the one you never get to see. */
    !reveal &&
    (youFinished ||
      (total > 0 && position >= total) ||
      (!question && handComplete && position >= dealtTo));

  /* --------------------------------------------------------- the buffer */

  const topUp = useCallback(async () => {
    if (fetchingRef.current || exhaustedRef.current) return;
    fetchingRef.current = true;
    try {
      const from = fetchedToRef.current;
      const result = await matchQuestionsAction({ matchId, from, count: WINDOW });
      if (!liveRef.current) return;

      if (result.ok && Array.isArray(result.data)) {
        const batch = result.data as Question[];

        /* A short window is the end of the hand. Recorded, so the last few
           questions do not each fire another request for nothing. */
        if (batch.length < WINDOW) {
          exhaustedRef.current = true;
          setHandComplete(true);
        }
        if (batch.length === 0) return;

        fetchedToRef.current = from + batch.length;
        setDealtTo(fetchedToRef.current);
        setBuffer((current) => {
          const next = { ...current };
          for (const q of batch) next[q.position] = q;
          return next;
        });
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [matchId]);

  /* Fetch the first window once the starting position is known, then keep
     LOOKAHEAD ahead of the player. The condition is on `position`, so a fast run
     of answers pulls the next window early rather than catching up after the
     buffer empties.

     Waiting for `resumed` costs nothing — the first poll is already in flight
     from mount and there is a three-second countdown before the first question
     — and it stops a reload from fetching the hand from the top and dealing
     questions this player has already answered. */
  useEffect(() => {
    if (!resumed || outOfQuestions) return;
    if (fetchedToRef.current - position <= LOOKAHEAD) void topUp();
  }, [position, topUp, outOfQuestions, buffer, resumed]);

  /* --------------------------------------------------------- the outbox */

  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;

    try {
      while (outboxRef.current.length > 0) {
        const next = outboxRef.current[0];
        next.attempts += 1;

        try {
          const result = await submitAnswerAction({
            matchId,
            position: next.position,
            optionIds: next.optionIds,
            numeric: next.numeric,
            responseMs: next.responseMs,
          });

          if (!result.ok) {
            setAnswerError(result.error);
          } else if (result.data.ok) {
            const { correct, matchOver, correctOptionIds } = result.data;

            /* Paint the question this answer came from, if it is still the one
               on screen. A mark that arrives after its reveal expired is not
               late for anything — the trail below the score still takes it —
               but it must not stamp the clock of whatever reveal is open now,
               or a slow answer would cut its successor short. */
            if (revealPosRef.current === next.position) markedAtRef.current = Date.now();
            setReveal((r) =>
              r && r.position === next.position
                ? { ...r, correctIds: correctOptionIds, correct }
                : r,
            );

            setMarks((m) => [...m, correct]);
            /* The score no longer rides back with the mark — computing it was
               most of what the answer request spent its time on, and the poll
               already brings a fresher one within the second. Counts move
               straight away so the display never looks stuck. */
            setYou((y) => ({
              answered: y.answered + 1,
              correct: y.correct + (correct ? 1 : 0),
              score: y.score,
            }));

            /* The answer that ended it. Go straight to the result rather than
               waiting up to a second for the next poll to notice — but let the
               last question's reveal sit for the same beat as every other one
               first, or the final answer is the one you never get told about. */
            if (matchOver && !finishedRef.current) {
              finishedRef.current = true;
              setTimeout(() => {
                if (!liveRef.current) return;
                setEnding("both-finished");
                router.push(`/arena/results/${matchId}`);
              }, REVEAL_HOLD_MS);
            }
          } else if (result.data.reason === "out_of_time" || result.data.reason === "finished") {
            setEnding("time");
          } else if (result.data.reason !== "duplicate") {
            /* A duplicate is not worth telling anybody about — the answer is
               already recorded, which is what was wanted. */
            setAnswerError(
              result.data.reason === "unknown_question"
                ? "That question could not be loaded."
                : "That answer was not accepted.",
            );
          }
        } catch (error) {
          /* A thrown error is the network, not a rejection. The player has
             already moved on, so a lost answer is one they gave and will not be
             credited for — worth one retry before admitting it. Server
             rejections above are NOT retried; those are answers the server has
             considered and refused. */
          if (next.attempts < 2) continue;
          setAnswerError(error instanceof Error ? error.message : "Could not send that answer.");
        }

        outboxRef.current.shift();
      }
    } finally {
      drainingRef.current = false;
    }
  }, [matchId, router]);

  /* --------------------------------------------------------- answering */

  /**
   * Leave the reveal and show the next question.
   *
   * `askedAtRef` restarts HERE rather than when the answer was given, so the
   * hold is not charged to the next question's response time. Speed is scored,
   * and a player should not be billed for the interface pausing to tell them
   * how they did.
   */
  const advance = useCallback(() => {
    setReveal(null);
    revealPosRef.current = -1;
    markedAtRef.current = null;
    setPosition((p) => p + 1);
    setSelected([]);
    setNumeric("");
    askedAtRef.current = Date.now();
  }, []);

  /* The reveal clock.
   *
   * Re-runs when the mark lands, because that changes `reveal` — which is what
   * turns the timer from "wait for the mark" into "hold the colours, then go".
   * The hold is measured from the mark, so it is the same half second whether
   * the reply took 40ms or 900. */
  useEffect(() => {
    if (!reveal || ending) return;

    const id = setTimeout(
      advance,
      revealDelay({
        openedAt: revealFromRef.current,
        markedAt: markedAtRef.current,
        now: Date.now(),
      }),
    );
    return () => clearTimeout(id);
  }, [reveal, ending, advance]);

  /**
   * Mark first, send second, advance on the reveal's own clock.
   *
   * The question freezes and the submission is queued behind whatever is
   * already in flight, so answers reach the server in the order they were given
   * however fast they were given.
   */
  const answer = useCallback(
    (optionIds: string[], numericAnswer: string | null) => {
      if (!question || ending || reveal) return;

      /* Two clicks in one frame both see the same `question`, because the state
         update that moves past it has not rendered yet. Without this the second
         click queues a duplicate answer AND advances a second time, skipping a
         question the player never saw — which is exactly the "I have to click
         twice and get the next one wrong" symptom. A ref, because it has to be
         true immediately rather than after a render. */
      if (question.position <= sentUpToRef.current) return;
      sentUpToRef.current = question.position;

      outboxRef.current.push({
        position: question.position,
        optionIds,
        numeric: numericAnswer,
        responseMs: Date.now() - askedAtRef.current,
        attempts: 0,
      });

      setAnswerError(null);
      markedAtRef.current = null;
      revealFromRef.current = Date.now();
      revealPosRef.current = question.position;
      setReveal({ position: question.position, chosen: optionIds, correctIds: null, correct: null });

      void drain();
    },
    [question, ending, reveal, drain],
  );

  const pickOption = useCallback(
    (id: string) => {
      if (!question || reveal) return;
      if (question.type === "MCQ_MULTI") {
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
        return;
      }
      /* Single-choice submits on click. An extra confirm press on every
         question would cost more of a two-minute match than the questions do. */
      answer([id], null);
    },
    [question, reveal, answer],
  );

  /* ---------------------------------------------------- the opponent poll */

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const result = await matchStateAction(matchId);
      if (!live) return;

      if (result.ok) {
        const state = result.data;
        setMsRemaining(state.msRemaining);
        setMsUntilStart(state.msUntilStart);
        setOpponent(state.opponent);
        setTotal(state.totalQuestions);
        setYouFinished(state.you.finished);

        /* Resume where this player actually is.
         *
         * A reload used to restart the hand at question one, and with duplicate
         * submissions now handled silently the player would have re-answered
         * everything for no points and never been told why. The server knows how
         * many they have answered; that count is their next position. Done once,
         * on the first poll only, so it can never fight the optimistic advance. */
        if (!resumedRef.current) {
          resumedRef.current = true;
          if (state.you.answered > 0) {
            setPosition(state.you.answered);
            sentUpToRef.current = state.you.answered - 1;
            fetchedToRef.current = state.you.answered;
            askedAtRef.current = Date.now();
          }
          setResumed(true);
        }

        /* The server's answered count is authoritative but lags the optimistic
           one by a round trip. Take whichever is further along, so the display
           never counts backwards. */
        setYou((y) =>
          state.you.answered >= y.answered
            ? { answered: state.you.answered, correct: state.you.correct, score: state.you.score }
            : y,
        );

        if (state.status === "complete" || state.msRemaining === 0) {
          setEnding(state.msRemaining === 0 ? "time" : "both-finished");
          if (!finishedRef.current) {
            finishedRef.current = true;
            await finishMatchAction(matchId);
            if (live) router.push(`/arena/results/${matchId}`);
          }
          return;
        }
      }

      timer = setTimeout(() => void poll(), OPPONENT_POLL_MS);
    };

    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [matchId, router]);

  /* A local tick between polls, so the clock counts down smoothly rather than
     jumping a second at a time. The server value overwrites it each poll. */
  useEffect(() => {
    if (msRemaining === null || ending) return;
    const id = setInterval(() => {
      setMsRemaining((ms) => (ms === null ? ms : Math.max(0, ms - 200)));
    }, 200);
    return () => clearInterval(id);
  }, [msRemaining === null, ending]);

  /* ------------------------------------------------------------ rendering */

  const trail = useMemo(() => marks.slice(-10), [marks]);

  if (msUntilStart !== null && msUntilStart > 0) {
    return <Countdown ms={msUntilStart} opponent={opponent} />;
  }

  if (ending) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Spinner className="h-6 w-6 text-accent" />
        <p className="font-display text-[17px] font-bold text-bright">
          {ending === "time" ? "Time — scoring the match" : "Both finished — scoring the match"}
        </p>
      </div>
    );
  }

  const seconds = msRemaining === null ? null : Math.ceil(msRemaining / 1000);
  const lowTime = seconds !== null && seconds <= 15;

  return (
    <div className="space-y-5">
      <Panel plain className="p-0">
        <div className="grid grid-cols-3 divide-x divide-line">
          <Side label="You" score={you.score} detail={`${you.correct}/${you.answered}`} trail={trail} mine />
          <div className="flex flex-col items-center justify-center gap-1 p-4">
            <span
              className={cn(
                "num font-display text-[30px] font-bold leading-none tracking-[-0.03em]",
                lowTime ? "text-epic-ink" : "text-bright",
              )}
            >
              {seconds === null ? "—" : formatClock(seconds)}
            </span>
            <span className="text-[12px] font-semibold text-muted">
              {Math.min(position + 1, Math.max(total, 1))}
              {total > 0 ? ` of ${total}` : ""}
            </span>
          </div>
          <Side
            label={opponent?.name ?? "Opponent"}
            score={opponent?.score ?? 0}
            detail={
              opponent
                ? opponent.finished
                  ? "Finished"
                  : `${opponent.answered} answered`
                : "—"
            }
          />
        </div>
      </Panel>

      <p className="sr-only" aria-live="polite">
        {marks.length === 0 ? "" : marks[marks.length - 1] ? "Correct" : "Not quite"}
      </p>

      {answerError ? (
        <Alert tone="rose" title="That answer didn't send">
          {answerError}
        </Alert>
      ) : null}

      {outOfQuestions ? (
        <OutOfQuestions opponent={opponent} answered={you.answered} />
      ) : question ? (
        <Panel className="p-6">
          <h2 className="mb-5 font-display text-[19px] font-bold leading-snug tracking-[-0.02em] text-bright">
            {question.prompt}
          </h2>

          {question.type === "NUMERIC" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reveal && numeric.trim() !== "") answer([], numeric.trim());
              }}
              className="flex flex-wrap gap-2"
            >
              <input
                autoFocus
                inputMode="decimal"
                value={numeric}
                onChange={(e) => setNumeric(e.target.value)}
                readOnly={reveal !== null}
                placeholder="Your answer"
                className={cn(
                  "h-11 flex-1 rounded-sq border bg-surface px-3.5 text-[15px] text-bright",
                  "transition-colors duration-150",
                  reveal?.correct === true && "border-good bg-good/10",
                  reveal?.correct === false && "border-bad bg-bad/10",
                  reveal?.correct == null && "border-line",
                )}
              />
              <Button type="submit" disabled={reveal !== null || numeric.trim() === ""}>
                Answer
              </Button>
            </form>
          ) : (
            <>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {question.options.map((option) => {
                  const chosen = reveal
                    ? reveal.chosen.includes(option.id)
                    : selected.includes(option.id);
                  /* Null until the mark lands — which is the difference between
                     "you picked this" and "this was right". */
                  const isRight = reveal?.correctIds
                    ? reveal.correctIds.includes(option.id)
                    : null;

                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => pickOption(option.id)}
                        aria-pressed={chosen}
                        aria-disabled={reveal !== null}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-sq border px-4 py-3",
                          "text-left text-[14.5px] leading-snug transition-colors duration-150",

                          /* Marked. Everything the player did not pick and that
                             was not right recedes, so the two boxes that carry
                             the answer are the only ones with colour. */
                          isRight === true && "border-good bg-good/25 font-semibold text-bright",
                          isRight === false && chosen && "border-bad bg-bad/25 font-semibold text-bright",
                          isRight === false && !chosen && "border-line bg-surface text-faint",

                          /* Answered, mark not back yet.
                             The accent state is deliberate: the mark takes a
                             round trip however fast the server is, and a click
                             that changes nothing for 200ms reads as a click
                             that did not register. Removing it was tried and
                             put back — a brief blue is better than a brief
                             nothing. */
                          isRight === null && reveal && chosen && "border-accent bg-accent/12 text-bright",
                          isRight === null && reveal && !chosen && "border-line bg-surface text-faint",

                          /* Still answering. */
                          !reveal &&
                            (chosen
                              ? "border-accent bg-accent/12 text-bright"
                              : "border-line bg-surface text-muted hover:border-line-strong hover:text-bright"),
                          reveal && "cursor-default",
                        )}
                      >
                        <span className="flex-1">{option.text}</span>

                        {/* Colour alone would leave a red-green colour-blind
                            player reading two identical boxes. */}
                        {isRight === true ? (
                          <span className="shrink-0 font-display text-[15px] font-bold text-good" aria-label="Correct">
                            ✓
                          </span>
                        ) : isRight === false && chosen ? (
                          <span className="shrink-0 font-display text-[15px] font-bold text-bad" aria-label="Your answer, wrong">
                            ✕
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {question.type === "MCQ_MULTI" ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-[13px] text-muted">Pick every correct answer.</p>
                  <Button
                    size="sm"
                    onClick={() => !reveal && selected.length > 0 && answer(selected, null)}
                    disabled={reveal !== null || selected.length === 0}
                  >
                    Answer
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      ) : (
        <Panel className="p-6">
          <div className="flex items-center gap-3 text-muted">
            <Spinner className="h-4 w-4" />
            <span className="text-[14px]">Dealing questions…</span>
          </div>
        </Panel>
      )}
    </div>
  );
}

/**
 * You are done; they are not.
 *
 * Their progress is on screen so the wait has a visible end. The match closes
 * itself the moment they finish — the poll is still running — so there is
 * nothing for the player to do here but watch, and saying so is better than a
 * spinner that looks like a stuck request.
 */
function OutOfQuestions({ opponent, answered }: { opponent: Opponent | null; answered: number }) {
  return (
    <Panel className="p-6">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Spinner className="h-5 w-5 text-accent" />
        <p className="font-display text-[17px] font-bold tracking-[-0.02em] text-bright">
          You&apos;ve answered everything
        </p>
        <p className="max-w-sm text-[13.5px] leading-relaxed text-muted">
          All {answered} questions done.{" "}
          {opponent
            ? `Waiting for ${opponent.name} — ${opponent.answered} answered so far. The match ends as soon as they finish.`
            : "The match ends as soon as your opponent finishes."}
        </p>
      </div>
    </Panel>
  );
}

function Side({
  label,
  score,
  detail,
  trail,
  mine,
}: {
  label: string;
  score: number;
  detail: string;
  trail?: boolean[];
  mine?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 p-4 text-center">
      <span className="max-w-full truncate text-[12px] font-semibold text-muted">{label}</span>
      <span
        className={cn(
          "num font-display text-[24px] font-bold leading-none tracking-[-0.03em]",
          mine ? "text-accent-deep" : "text-bright",
        )}
      >
        {score}
      </span>
      <span className="num text-[12px] text-faint">{detail}</span>

      {/* The result of each answer, landing a moment after it was given. The
          feedback that used to sit on the question itself, moved somewhere it
          can appear late without holding anything up. */}
      {trail ? (
        <span className="mt-1.5 flex h-1.5 items-center gap-1" aria-hidden>
          {trail.map((correct, i) => (
            <span
              key={`${i}-${String(correct)}`}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                correct ? "bg-uncommon" : "bg-epic",
                i === trail.length - 1 && "animate-rise",
              )}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}

/** The three-two-one before the first question. Mirrors COUNTDOWN_SECONDS. */
const LEAD_IN_SECONDS = 4;

function Countdown({ ms, opponent }: { ms: number; opponent: Opponent | null }) {
  const remaining = Math.max(1, Math.ceil(ms / 1000));
  /* The window is four seconds so both players load in and see it, but the
     number itself never starts above three — "3, 2, 1" reads better than "4". */
  const seconds = Math.min(3, remaining);

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      {opponent ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[13px] font-semibold text-muted">Your opponent</p>
          <p className="font-display text-[24px] font-bold tracking-[-0.025em] text-bright">
            {opponent.name}
          </p>
          <div className="flex items-center gap-2">
            <RankBadge rankKey={opponent.rankKey} size="sm" />
            <span className="num text-[13px] text-muted">{opponent.elo} Elo</span>
          </div>
        </div>
      ) : null}

      <div
        key={seconds}
        className="num animate-rise font-display text-[76px] font-bold leading-none tracking-[-0.04em] text-accent-deep"
        aria-live="assertive"
      >
        {seconds}
      </div>

      <Meter
        value={((LEAD_IN_SECONDS - remaining + 1) / LEAD_IN_SECONDS) * 100}
        max={100}
        className="w-40"
        label="Starting"
      />
    </div>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
