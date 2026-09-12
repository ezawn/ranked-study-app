"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { CheckIcon, CoinIcon, InfoIcon, XIcon } from "@/components/icons";

export type ToastTone = "success" | "error" | "info" | "coin";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Rendered large on coin toasts. */
  amount?: number;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
  coins: (amount: number, title?: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = nextId++;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      coins: (amount, title, description) =>
        push({ tone: "coin", title: title ?? "Study Coins earned", description, amount }),
      error: (title, description) => push({ tone: "error", title, description }),
      success: (title, description) => push({ tone: "success", title, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Bottom-right on desktop, but full width along the bottom on a phone,
          where a fixed 320px card would otherwise sit half off the screen. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[4.75rem] z-100 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:w-[21rem] lg:bottom-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.tone === "error" ? 7000 : 4500);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.tone]);

  /* The tone rides on a small icon chip alone — its shape (check, cross,
     coin) plus its colour, never a thick coloured bar down one edge, which
     is exactly the template look Alert's own tone treatment refuses. */
  const chips: Record<ToastTone, string> = {
    success: "bg-good/12 text-good",
    error: "bg-bad/12 text-bad",
    info: "bg-accent/12 text-accent",
    coin: "bg-coin/12 text-coin",
  };

  const icons: Record<ToastTone, ReactNode> = {
    success: <CheckIcon size={15} />,
    error: <XIcon size={15} />,
    info: <InfoIcon size={15} />,
    coin: <CoinIcon size={15} />,
  };

  return (
    <div
      role="status"
      className={cn(
        "panel pointer-events-auto relative flex animate-deal items-start gap-3 overflow-hidden p-3.5 shadow-lift",
        // A coin toast is the one moment this card was actually earned.
        toast.tone === "coin" && "foil",
      )}
    >
      <div
        className={cn(
          "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-sq",
          chips[toast.tone],
        )}
      >
        {icons[toast.tone]}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {toast.amount !== undefined ? (
            <span className="num text-[17px] font-semibold text-coin-ink">+{toast.amount}</span>
          ) : null}
          <span className="font-display text-sm font-semibold text-bright">{toast.title}</span>
        </div>
        {toast.description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted">{toast.description}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-faint transition-colors hover:bg-raise-2 hover:text-bright"
      >
        <XIcon size={13} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Never throw over a toast — losing a notification must not take down a page.
    return {
      push: () => undefined,
      coins: () => undefined,
      error: () => undefined,
      success: () => undefined,
    };
  }
  return ctx;
}
