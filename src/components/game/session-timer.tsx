"use client";

import { usePathname } from "next/navigation";
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

import { useCoins } from "./coin-provider";
import type { StudyContext } from "@/lib/coins/rules";

/**
 * The one place the heartbeat lives.
 *
 * Everything time-related on screen reads from here: the header pill, the
 * floating clock, the dashboard panel. One loop, one source of truth, so the
 * numbers can never disagree with each other.
 *
 * Between heartbeats the counters tick locally once a second so they move in
 * real time, and every heartbeat response overwrites them with the server's
 * figures. The local tick is presentation only — the server decides what was
 * actually earned, always.
 */

const HEARTBEAT_MS = 30_000;
const IDLE_MS = 60_000;

interface TimerState {
  ready: boolean;

  /** Total active seconds today. Ticks up while active. */
  activeSeconds: number;
  /** Counts down to the next coin, then rolls back to the full interval. */
  secondsToNextCoin: number;
  coinIntervalSeconds: number;
  coinsToday: number;
  dailyCoinCap: number;
  cappedOut: boolean;

  /** Verified study seconds today. */
  studySeconds: number;
  secondsToNextBonus: number;
  bonusIntervalSeconds: number;
  studyBonusCoinsToday: number;
  studyBonusDailyCap: number;
  studyCappedOut: boolean;
  /** True when the current page is earning the study bonus. */
  studyVerified: boolean;

  /** False while the tab is hidden or the user has gone quiet. */
  active: boolean;
}

const TimerContext = createContext<TimerState | null>(null);

interface HeartbeatResponse {
  accepted: boolean;
  coinsAwarded: number;
  balance: number;
  activeSeconds: number;
  secondsToNextCoin: number;
  coinIntervalSeconds: number;
  cappedOut: boolean;
  dailyCoinCap: number;
  coinsToday: number;
  studySeconds: number;
  studyVerified: boolean;
  studyBonusCoinsToday: number;
  studyBonusDailyCap: number;
  secondsToNextBonus: number;
  studyCappedOut: boolean;
}

/** Which kind of page is this, for the study bonus? */
function contextFor(pathname: string): StudyContext | undefined {
  if (/^\/flashcards\/[^/]+\/(smart|cram)/.test(pathname)) return "flashcards";
  if (/^\/quizzes\/[^/]+\/(attempt|results)/.test(pathname)) return "quiz";
  if (pathname.startsWith("/daily")) return "quiz";
  if (pathname.startsWith("/test-feedback/")) return "test-feedback";
  return undefined;
}

export function SessionTimerProvider({
  initial,
  children,
}: {
  initial: {
    activeSeconds: number;
    coinsAwarded: number;
    dailyCoinCap: number;
    coinIntervalSeconds: number;
    studySeconds: number;
    studyBonusCoins: number;
    studyBonusDailyCap: number;
    bonusIntervalSeconds: number;
  };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { applyAward } = useCoins();

  const lastActivity = useRef(Date.now());
  const inFlight = useRef(false);

  /*
   * The current route, held in a ref rather than read from the closure.
   *
   * `beat` only wants the pathname to label the heartbeat with what kind of
   * page you are on. Depending on it directly made `beat` a new function on
   * every navigation, which tore down and rebuilt the heartbeat effect: each
   * page change fired an extra beat 1.2s later AND restarted the 30-second
   * interval, so anyone browsing faster than that never reached the regular
   * heartbeat at all, and a quick run through six pages tripped the rate
   * limiter into 429s. A ref keeps the label current without giving `beat` a
   * reason to change identity.
   */
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const [active, setActive] = useState(true);
  const [state, setState] = useState<Omit<TimerState, "active" | "ready">>({
    activeSeconds: initial.activeSeconds,
    secondsToNextCoin:
      initial.coinIntervalSeconds - (initial.activeSeconds % initial.coinIntervalSeconds),
    coinIntervalSeconds: initial.coinIntervalSeconds,
    coinsToday: initial.coinsAwarded,
    dailyCoinCap: initial.dailyCoinCap,
    cappedOut: false,
    studySeconds: initial.studySeconds,
    secondsToNextBonus:
      initial.bonusIntervalSeconds - (initial.studySeconds % initial.bonusIntervalSeconds),
    bonusIntervalSeconds: initial.bonusIntervalSeconds,
    studyBonusCoinsToday: initial.studyBonusCoins,
    studyBonusDailyCap: initial.studyBonusDailyCap,
    studyCappedOut: false,
    studyVerified: false,
  });

  // ---------------------------------------------------------------- Activity
  const markActive = useCallback(() => {
    lastActivity.current = Date.now();
    setActive(true);
  }, []);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];
    for (const e of events) window.addEventListener(e, markActive, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, markActive);
    };
  }, [markActive]);

  const isActive = useCallback(
    () => document.visibilityState === "visible" && Date.now() - lastActivity.current <= IDLE_MS,
    [],
  );

  // --------------------------------------------------------------- Heartbeat
  const beat = useCallback(async () => {
    if (inFlight.current || !isActive()) return;

    inFlight.current = true;
    try {
      const response = await fetch("/api/study-time/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: contextFor(pathnameRef.current) }),
      });
      if (!response.ok) return;

      const data = (await response.json()) as HeartbeatResponse;

      // The server's numbers win over whatever the local tick reached.
      setState({
        activeSeconds: data.activeSeconds,
        secondsToNextCoin: data.secondsToNextCoin,
        coinIntervalSeconds: data.coinIntervalSeconds,
        coinsToday: data.coinsToday,
        dailyCoinCap: data.dailyCoinCap,
        cappedOut: data.cappedOut,
        studySeconds: data.studySeconds,
        secondsToNextBonus: data.secondsToNextBonus,
        bonusIntervalSeconds: state.bonusIntervalSeconds,
        studyBonusCoinsToday: data.studyBonusCoinsToday,
        studyBonusDailyCap: data.studyBonusDailyCap,
        studyCappedOut: data.studyCappedOut,
        studyVerified: data.studyVerified,
      });

      if (data.coinsAwarded > 0) {
        applyAward(
          data.coinsAwarded,
          data.balance,
          data.studyVerified ? "Study time" : "Coin timer",
          data.cappedOut ? "That's today's coin timer maxed out." : undefined,
        );
      }
    } catch {
      // A dropped heartbeat costs nothing — the next one credits the elapsed
      // time anyway, because elapsed time is measured, not reported.
    } finally {
      inFlight.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyAward, isActive]);

  useEffect(() => {
    const first = setTimeout(beat, 1200);
    const interval = setInterval(beat, HEARTBEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        markActive();
        void beat();
      } else {
        setActive(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(first);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [beat, markActive]);

  // ------------------------------------------------------------- Local tick
  // Runs once a second so the numbers move in real time rather than jumping
  // every thirty seconds. Pauses when the user goes idle, so the clock never
  // claims time the server won't credit.
  useEffect(() => {
    const tick = setInterval(() => {
      const stillActive = isActive();
      setActive(stillActive);
      if (!stillActive) return;

      setState((current) => {
        const nextCoin = current.secondsToNextCoin - 1;
        const nextBonus = current.secondsToNextBonus - 1;

        return {
          ...current,
          activeSeconds: current.cappedOut ? current.activeSeconds : current.activeSeconds + 1,
          // Roll back to a full interval on zero. The coin itself is awarded by
          // the next heartbeat; this is the visible reset.
          secondsToNextCoin:
            current.cappedOut ? 0 : nextCoin <= 0 ? current.coinIntervalSeconds : nextCoin,
          studySeconds:
            current.studyVerified && !current.studyCappedOut
              ? current.studySeconds + 1
              : current.studySeconds,
          secondsToNextBonus:
            !current.studyVerified || current.studyCappedOut
              ? current.secondsToNextBonus
              : nextBonus <= 0
                ? current.bonusIntervalSeconds
                : nextBonus,
        };
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [isActive]);

  const value = useMemo<TimerState>(() => ({ ...state, active, ready: true }), [state, active]);

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useSessionTimer(): TimerState {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    return {
      ready: false,
      activeSeconds: 0,
      secondsToNextCoin: 0,
      coinIntervalSeconds: 300,
      coinsToday: 0,
      dailyCoinCap: 0,
      cappedOut: false,
      studySeconds: 0,
      secondsToNextBonus: 0,
      bonusIntervalSeconds: 1800,
      studyBonusCoinsToday: 0,
      studyBonusDailyCap: 0,
      studyCappedOut: false,
      studyVerified: false,
      active: false,
    };
  }
  return ctx;
}
