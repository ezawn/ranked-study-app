import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Badges, meters, alerts and the states a screen can be in.
 *
 * Colour is meaning. The rarity scale carries mastery, and the marking
 * colours carry right and wrong; nothing else gets a hue.
 *
 *   common/neutral  slate    no claim made
 *   uncommon/lime   mint     started, correct, earned
 *   rare/violet     aqua     going well, and the interactive colour
 *   epic/rose       coral    due, wrong, needs you
 *   legendary/coin  amber    mastered, and the currency itself
 *
 * The legacy tone names are kept because forty-odd files pass them; each is
 * an alias onto the rarity scale rather than a colour of its own.
 */

export type BadgeTone =
  | "violet" | "cyan" | "coin" | "lime" | "rose" | "neutral" | "amber"
  | "common" | "uncommon" | "rare" | "epic" | "legendary";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-raise-2 text-muted border-line",
  common: "bg-raise-2 text-common-ink border-line",
  uncommon: "bg-uncommon/12 text-uncommon-ink border-uncommon/30",
  lime: "bg-uncommon/12 text-uncommon-ink border-uncommon/30",
  rare: "bg-rare/12 text-rare-ink border-rare/30",
  violet: "bg-rare/12 text-rare-ink border-rare/30",
  cyan: "bg-rare/12 text-rare-ink border-rare/30",
  epic: "bg-epic/12 text-epic-ink border-epic/30",
  rose: "bg-epic/12 text-epic-ink border-epic/30",
  legendary: "bg-legendary/15 text-legendary-ink border-legendary/35",
  coin: "bg-coin/15 text-coin-ink border-coin/35",
  amber: "bg-coin/15 text-coin-ink border-coin/35",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-[12px] font-semibold leading-5 tracking-[-0.005em]",
        badgeTones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Meter({
  value,
  max = 100,
  tone = "violet",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "violet" | "coin" | "lime";
  className?: string;
  label?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn(
        "meter",
        tone === "coin" && "meter-coin",
        tone === "lime" && "meter-lime",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      {/* Scaled rather than resized — see `.meter > span` in globals.css. */}
      <span style={{ "--fill": pct / 100 } as React.CSSProperties} />
    </div>
  );
}

/**
 * Nothing here yet.
 *
 * An empty state names what would fill it and gives one way to start. The
 * dashed cut edge says "a card belongs here and hasn't been dealt", which is
 * a different message from a card that failed to load.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-sq-card border-2 border-dashed border-line",
        "bg-raise px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="card mb-5 flex h-14 w-14 items-center justify-center text-accent">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-[19px] font-bold tracking-[-0.02em] text-bright">{title}</h3>
      {description ? (
        <p className="mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/**
 * An inline message about the state of things.
 *
 * The tone lives in a tinted ground and the heading, not in a thick coloured
 * bar down one edge — that device reads as a template, and at any real
 * weight it is the loudest thing on the page for the least information.
 */
export function Alert({
  tone = "violet",
  title,
  children,
  className,
}: {
  tone?: "violet" | "rose" | "lime" | "amber";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    violet: "bg-rare/8 border-rare/25 [&_[data-alert-title]]:text-rare-ink",
    rose: "bg-epic/8 border-epic/25 [&_[data-alert-title]]:text-epic-ink",
    lime: "bg-uncommon/8 border-uncommon/25 [&_[data-alert-title]]:text-uncommon-ink",
    amber: "bg-coin/10 border-coin/30 [&_[data-alert-title]]:text-coin-ink",
  } as const;

  return (
    <div
      className={cn("rounded-sq border px-4 py-3.5 text-sm", tones[tone], className)}
    >
      {title ? (
        <div data-alert-title className="font-display font-semibold">
          {title}
        </div>
      ) : null}
      {children ? (
        <div className={cn("leading-relaxed text-muted", title && "mt-1")}>{children}</div>
      ) : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Shaped like the thing it stands in for, never a lone circle. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-sq", className)} />;
}

/** Subject or topic tag. Neutral by design, so it never competes with a badge. */
export function Tag({ children, accent }: { children: ReactNode; accent?: string }) {
  void accent;
  return (
    <span className="rounded-md bg-raise-2 px-1.5 py-0.5 text-[12px] font-medium text-muted">
      {children}
    </span>
  );
}
