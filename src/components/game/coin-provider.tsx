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

import { useToast } from "@/components/ui/toast";

/**
 * Client-side coin state.
 *
 * The number in the header is a mirror of the server's balance, not a source of
 * truth — every feature that earns coins gets the authoritative balance back
 * from the server and pushes it in here. Nothing on the client ever decides
 * that a user has earned something.
 */

interface CoinContextValue {
  balance: number;
  /** Apply an award the server has already made. */
  applyAward: (coins: number, balance: number, label?: string, description?: string) => void;
  /** Overwrite from an authoritative server value. */
  setBalance: (balance: number) => void;
  /** True briefly after an award, so the counter can celebrate. */
  celebrating: boolean;
}

const CoinContext = createContext<CoinContextValue | null>(null);

export function CoinProvider({
  initialBalance,
  children,
}: {
  initialBalance: number;
  children: ReactNode;
}) {
  const [balance, setBalanceState] = useState(initialBalance);
  const [celebrating, setCelebrating] = useState(false);
  const toast = useToast();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBalanceState(initialBalance);
  }, [initialBalance]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const applyAward = useCallback(
    (coins: number, serverBalance: number, label?: string, description?: string) => {
      setBalanceState(serverBalance);
      if (coins <= 0) return;

      setCelebrating(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCelebrating(false), 700);

      toast.coins(coins, label ?? "Study Coins earned", description);
    },
    [toast],
  );

  const value = useMemo<CoinContextValue>(
    () => ({ balance, applyAward, setBalance: setBalanceState, celebrating }),
    [balance, applyAward, celebrating],
  );

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
}

export function useCoins(): CoinContextValue {
  const ctx = useContext(CoinContext);
  if (!ctx) {
    return { balance: 0, applyAward: () => undefined, setBalance: () => undefined, celebrating: false };
  }
  return ctx;
}
