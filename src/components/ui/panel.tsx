import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Cards, and the rarity system printed on them.
 *
 * The frame is not a container you put things in — it is the object. Stock,
 * a cut edge, an inset keyline, a bevel where the light lands, and a shadow
 * with a real offset because the card is lying on a table. `.card` carries
 * all of that; `Panel` is the same object under the name 170 files already
 * import it by.
 *
 * Rarity is the one colour encoding this product can defend. It is not
 * decoration and it is never assigned by hand for effect: it comes from
 * mastery, and it means the same thing on every screen.
 */

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** Mastery to rarity. One function, so no screen can invent its own scale. */
export function rarityFor(percent: number | null | undefined): Rarity {
  const p = percent ?? 0;
  if (p >= 90) return "legendary";
  if (p >= 65) return "epic";
  if (p >= 40) return "rare";
  if (p > 0) return "uncommon";
  return "common";
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Untouched",
  uncommon: "Started",
  rare: "Getting there",
  epic: "Strong",
  legendary: "Mastered",
};

/** The frame's own colour at each rarity. */
const rarityColor: Record<Rarity, string> = {
  common: "var(--sq-common)",
  uncommon: "var(--sq-uncommon)",
  rare: "var(--sq-rare)",
  epic: "var(--sq-epic)",
  legendary: "var(--sq-legendary)",
};

export function Panel({
  className,
  rarity,
  plain,
  ...props
}: ComponentProps<"div"> & { rarity?: Rarity; plain?: boolean }) {
  return (
    <div
      className={cn("card p-6", plain && "card-plain", rarity && "rarity", className)}
      style={rarity ? ({ "--rarity": rarityColor[rarity] } as React.CSSProperties) : undefined}
      {...props}
    />
  );
}

/** A card that is also a link. The standard content tile. */
export function PanelLink({
  className,
  rarity,
  plain,
  ...props
}: ComponentProps<typeof Link> & { rarity?: Rarity; plain?: boolean }) {
  return (
    <Link
      className={cn(
        "card card-hover block p-6",
        plain && "card-plain",
        rarity && "rarity",
        className,
      )}
      style={rarity ? ({ "--rarity": rarityColor[rarity] } as React.CSSProperties) : undefined}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-bright">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * The page title.
 *
 * One per screen. It answers "what am I looking at" before anything else gets
 * a chance to, and it does that on its own — no small-caps label above it.
 * A kicker is a heading admitting it cannot carry its own weight.
 */
export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.028em] text-bright sm:text-[38px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * A figure and what it means.
 *
 * The number is set in the display face with tabular figures, so a changing
 * value never shuffles the layout. Colour is rationed: gold means the figure
 * is literally Study Coins, and nothing else earns a hue.
 */
export function StatTile({
  label,
  value,
  hint,
  accent = "violet",
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "violet" | "cyan" | "coin" | "lime" | "rose";
  icon?: ReactNode;
  className?: string;
}) {
  const iconTone = {
    violet: "text-accent",
    cyan: "text-accent",
    coin: "text-coin",
    lime: "text-good",
    rose: "text-bad",
  } as const;

  return (
    <div className={cn("card p-5", className)}>
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
        {icon ? <span className={iconTone[accent]}>{icon}</span> : null}
        {label}
      </div>
      <div
        className={cn(
          "num mt-3 text-[30px] font-bold leading-none tracking-[-0.03em]",
          accent === "coin" ? "text-coin-ink" : "text-bright",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs leading-snug text-muted">{hint}</div> : null}
    </div>
  );
}

/** True for 0 however it arrived — a number, or a string a formatter produced. */
function isZero(value: ReactNode): boolean {
  return value === 0 || value === "0";
}

/**
 * A row of figures that belong together.
 *
 * One divided card rather than four separate ones: four cards say "here are
 * four unrelated numbers", one divided frame says "here is the state of this
 * thing". Every screen that summarises something uses this, so a summary
 * looks the same wherever you meet it.
 */
export function StatStrip({
  stats,
  className,
}: {
  stats: Array<{
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ReactNode;
    /** Gold. Reserved for figures that are literally Study Coins. */
    gold?: boolean;
    /**
     * What to print instead of the figure when it is zero AND zero is a good
     * place to be — an empty review queue, not an empty balance. Only pass it
     * where that is true: a cheerful line over a zero the student should care
     * about is the interface lying to them.
     */
    zeroLabel?: string;
  }>;
  className?: string;
}) {
  return (
    <div className={cn("card card-plain grid grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "p-5",
            i % 2 === 0 && "border-r border-line",
            i < stats.length - 2 && "border-b border-line",
            "lg:border-b-0",
            i === stats.length - 1 ? "lg:border-r-0" : "lg:border-r lg:border-line",
          )}
        >
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
            {s.icon ? <span className={s.gold ? "text-coin" : "text-accent"}>{s.icon}</span> : null}
            {s.label}
          </div>
          {s.zeroLabel && isZero(s.value) ? (
            /* Set in the display face rather than as a numeral: it is a
               sentence, not a measurement, so it should not pretend to the
               figure's weight or its tabular figures. */
            <div className="mt-2.5 font-display text-[19px] font-bold leading-none tracking-[-0.02em] text-uncommon-ink">
              {s.zeroLabel}
            </div>
          ) : (
            <div
              className={cn(
                "num mt-2.5 text-[27px] font-bold leading-none tracking-[-0.03em]",
                s.gold ? "text-coin-ink" : "text-bright",
              )}
            >
              {s.value}
            </div>
          )}
          {s.hint ? <div className="mt-2 text-xs leading-snug text-muted">{s.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}

/**
 * A toolbar filter.
 *
 * Shaped like a card tab rather than a pill: square-ish, with the active one
 * lifted onto the accent so it reads as the selected divider in a binder.
 */
export function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-sq border px-4",
        "text-[13.5px] font-semibold transition-all duration-200",
        active
          ? "border-transparent bg-accent text-accent-ink shadow-[0_4px_12px_-4px_rgb(11_125_138/0.5)]"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-bright",
      )}
    >
      {children}
    </Link>
  );
}
