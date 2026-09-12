"use client";

import { useEffect, useRef, useState } from "react";

import { CoinIcon } from "@/components/icons";
import { cn, formatNumber } from "@/lib/utils";
import { useCoins } from "./coin-provider";

/**
 * The coin counter in the top bar.
 *
 * Counts up rather than snapping, and pops when new coins land — the small
 * reward loop that makes the currency feel like a currency.
 */
export function CoinCounter({ className }: { className?: string }) {
  const { balance, celebrating } = useCoins();
  const [display, setDisplay] = useState(balance);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (display === balance) return;

    const from = display;
    const distance = balance - from;
    const duration = Math.min(900, 250 + Math.abs(distance) * 12);
    const started = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + distance * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      title="Study Coins"
      aria-label={`${balance} Study Coins`}
    >
      <CoinIcon size={16} className={cn("text-coin", celebrating && "animate-coin-pop")} />
      <span
        className={cn(
          "num text-[13px] font-semibold text-coin-ink transition-colors",
          celebrating && "text-coin",
        )}
      >
        {formatNumber(display)}
      </span>
    </div>
  );
}
