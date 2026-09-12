"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "@/components/layout/route-transition";
import {
  findMatchAction,
  pollMatchmakingAction,
  cancelMatchmakingAction,
} from "@/server/actions/arena";

/**
 * The 1v1 queue, hoisted out of the Arena page.
 *
 * Matchmaking has no daemon — every searching client polls, and each poll both
 * refreshes that player's row and tries to pair them. So the poll loop cannot
 * live in the Arena page component: the moment the player navigated away it
 * unmounted, the loop stopped, and the search quietly died. Here it runs for
 * the life of the signed-in shell, so a player can queue and then read a
 * flashcard set, and still be pulled into the battle the instant an opponent
 * turns up.
 *
 * The chained `setTimeout` (never `setInterval`) keeps exactly one request in
 * flight; `runRef` invalidates any response that lands after a cancel or a
 * fresh search, so a slow tick can never resurrect a queue the player left.
 */

const POLL_MS = 1000;

type Phase = "idle" | "searching" | "matched" | "expired" | "error";

interface QueueValue {
  phase: Phase;
  /** Whole seconds this player has been waiting. */
  seconds: number;
  /** The honest "widening the search" line from the server. */
  message: string;
  error: string | null;
  /** Begin a search for the given subject-and-qualification streams. */
  start: (streams: string[]) => void;
  /** Leave the queue. */
  cancel: () => void;
  /** Clear an expired / errored state without touching the server. */
  dismiss: () => void;
}

const QueueContext = createContext<QueueValue | null>(null);

export function QueueProvider({
  initial,
  children,
}: {
  /** A search already in progress when the shell mounted (a reload, a 2nd tab). */
  initial: { secondsWaiting: number } | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>(initial ? "searching" : "idle");
  const [seconds, setSeconds] = useState(initial?.secondsWaiting ?? 0);
  const [message, setMessage] = useState("Looking for someone at your rank");
  const [error, setError] = useState<string | null>(null);

  /* Bumped on every start/cancel. A tick whose id no longer matches is stale
     and its result is dropped. */
  const runRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(
    async (runId: number) => {
      const result = await pollMatchmakingAction();
      if (runId !== runRef.current) return;

      if (!result.ok) {
        setPhase("error");
        setError(result.error);
        return;
      }

      const state = result.data;
      setSeconds(state.secondsWaiting);
      setMessage(state.message);

      if (state.status === "matched" && state.matchId) {
        setPhase("matched");
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          navigate(`/arena/battle/${state.matchId}`);
          /* Drop back to idle once the battle screen owns the flow, so the
             corner indicator disappears and this loop stops. */
          timerRef.current = setTimeout(() => {
            if (runId === runRef.current) {
              setPhase("idle");
              navigatedRef.current = false;
            }
          }, 2500);
        }
        return;
      }

      if (state.status === "expired") {
        setPhase("expired");
        return;
      }

      if (state.status === "cancelled") {
        setPhase("idle");
        return;
      }

      timerRef.current = setTimeout(() => void tick(runId), POLL_MS);
    },
    [navigate],
  );

  const start = useCallback(
    (streams: string[]) => {
      clearTimer();
      const runId = ++runRef.current;
      navigatedRef.current = false;
      setError(null);
      setSeconds(0);
      setMessage("Looking for someone at your rank");
      setPhase("searching");

      void (async () => {
        const joined = await findMatchAction({ streams });
        if (runId !== runRef.current) return;
        if (!joined.ok) {
          setPhase("error");
          setError(joined.error);
          return;
        }
        void tick(runId);
      })();
    },
    [clearTimer, tick],
  );

  const cancel = useCallback(() => {
    runRef.current += 1;
    clearTimer();
    setPhase("idle");
    void cancelMatchmakingAction();
  }, [clearTimer]);

  const dismiss = useCallback(() => {
    runRef.current += 1;
    clearTimer();
    setPhase("idle");
    setError(null);
  }, [clearTimer]);

  /* Resume a search that was already running when the shell mounted. */
  useEffect(() => {
    if (!initial) return;
    const runId = ++runRef.current;
    timerRef.current = setTimeout(() => void tick(runId), POLL_MS);
    return () => {
      runRef.current += 1;
      clearTimer();
    };
    // Only ever on mount — `initial` is a server snapshot, not a live value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Local one-second tick so the timer moves smoothly between polls. The next
     poll overwrites it with the server's figure. */
  useEffect(() => {
    if (phase !== "searching") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const value = useMemo<QueueValue>(
    () => ({ phase, seconds, message, error, start, cancel, dismiss }),
    [phase, seconds, message, error, start, cancel, dismiss],
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue(): QueueValue {
  const ctx = useContext(QueueContext);
  if (!ctx) {
    return {
      phase: "idle",
      seconds: 0,
      message: "",
      error: null,
      start: () => {},
      cancel: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
