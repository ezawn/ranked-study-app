import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/feedback";

export { Skeleton };

/**
 * Loading shapes.
 *
 * The rule for everything in this file: a skeleton occupies the same box the
 * real thing will occupy. If the content lands and the page jumps, the skeleton
 * was decoration rather than a placeholder, and a spinner would have been more
 * honest. So each shape here is built from the same measurements as the
 * component it stands in for — `SkeletonTile` matches `SetTile`'s padding and
 * rows, `SkeletonStatStrip` matches `StatStrip`'s cell height and its two-up /
 * four-up breakpoints — and the two must be changed together.
 *
 * Nothing here animates on its own; they all inherit one shimmer whose timing
 * lives in `globals.css`, which is also where it is switched off for readers
 * who ask for reduced motion.
 */

/* -------------------------------------------------------------------- atoms */

/** A run of text. Last line is short, because a paragraph's last line is. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-1/2" : i % 2 ? "w-11/12" : "w-full")}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ regions */

/** Matches `SectionHeading`: title, optional subtitle, optional action. */
export function SkeletonHeading({ action = true }: { action?: boolean }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-[28rem] max-w-full" />
      </div>
      {action ? <Skeleton className="h-11 w-32 shrink-0" /> : null}
    </div>
  );
}

/**
 * Matches `StatStrip` — one panel, hairline-divided, two up on a phone and
 * four across from `lg`. The dividers are drawn here too: without them the
 * strip visibly gains its internal lines when the data lands.
 */
export function SkeletonStatStrip({
  count = 4,
  /**
   * Which cells will have a hint line under the figure. A strip whose real
   * tiles carry no hint would otherwise shed a row of text on load, which is
   * the exact shift this file exists to prevent. Pass an array to say so per
   * cell; the default assumes every tile has one, which most do.
   */
  hints = true,
}: {
  count?: number;
  hints?: boolean | boolean[];
}) {
  const hasHint = (i: number) => (Array.isArray(hints) ? Boolean(hints[i]) : hints);

  return (
    <div className="panel panel-plain grid grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            "p-5",
            i % 2 === 0 && "border-r border-line",
            i < count - 2 && "border-b border-line",
            "lg:border-b-0",
            i === count - 1 ? "lg:border-r-0" : "lg:border-r lg:border-line",
          )}
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3.5 h-7 w-16" />
          {hasHint(i) ? <Skeleton className="mt-2.5 h-3 w-24" /> : null}
        </div>
      ))}
    </div>
  );
}

/** Matches `Panel` + `PanelHeader`, with a body you choose the height of. */
export function SkeletonPanel({
  header = true,
  action = false,
  children,
  className,
}: {
  header?: boolean;
  action?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("panel p-6", className)} aria-hidden="true">
      {header ? (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2.5 h-3 w-64 max-w-full" />
          </div>
          {action ? <Skeleton className="h-9 w-24 shrink-0" /> : null}
        </div>
      ) : null}
      {children ?? <SkeletonText lines={3} />}
    </div>
  );
}

/**
 * Matches `SetTile` / `QuizTile`: title row, two lines of description, a meta
 * row, and a footer behind a hairline.
 */
export function SkeletonTile() {
  return (
    <div className="panel flex flex-col p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-4 h-3 w-40" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/** A grid of tiles on the same breakpoints the real libraries use. */
export function SkeletonTileGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonTile key={i} />
      ))}
    </div>
  );
}

/**
 * A list row: a small square, two stacked lines, and something on the right.
 * Used wherever a panel holds a list rather than a grid.
 */
export function SkeletonRow({ badge = true }: { badge?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5" aria-hidden="true">
      <Skeleton className="h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="mt-2 h-3 w-1/4" />
      </div>
      {badge ? <Skeleton className="h-5 w-14 shrink-0 rounded-full" /> : null}
    </div>
  );
}

export function SkeletonRows({ count = 4, badge = true }: { count?: number; badge?: boolean }) {
  return (
    <div className="-mx-2">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} badge={badge} />
      ))}
    </div>
  );
}

/** A table body. Column widths are staggered so it reads as tabular. */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const widths = ["w-2/5", "w-1/4", "w-1/3", "w-1/5", "w-1/4"];
  return (
    <div className="panel overflow-hidden p-0" aria-hidden="true">
      <div className="flex gap-4 border-b border-line px-5 py-3.5">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className={cn("h-3", widths[c % widths.length])} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={cn("flex gap-4 px-5 py-4", r > 0 && "border-t border-line")}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={cn("h-3.5", widths[(c + r) % widths.length])} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The shell a study screen loads into: a prompt card with a progress bar above
 * it. Cram, Smart and the quiz runner all land in roughly this shape, and the
 * card is deliberately tall — a short placeholder followed by a tall question
 * is the single worst layout jump in the product.
 */
export function SkeletonStudyCard() {
  return (
    <div className="mx-auto max-w-3xl" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
      <div className="panel mt-5 flex min-h-72 flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-11 w-28" />
      </div>
    </div>
  );
}

/**
 * A whole page's worth: heading, figures, then a wide column and a rail. The
 * default fallback for a route we have not given a bespoke shape.
 */
export function SkeletonPage({
  stats = true,
  rail = true,
}: {
  stats?: boolean;
  rail?: boolean;
}) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <SkeletonHeading />
      {stats ? <SkeletonStatStrip /> : null}
      <div
        className={cn(
          "mt-5 grid gap-5",
          rail && "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
        )}
      >
        <SkeletonPanel>
          <SkeletonRows count={4} />
        </SkeletonPanel>
        {rail ? (
          <SkeletonPanel>
            <SkeletonRows count={3} badge={false} />
          </SkeletonPanel>
        ) : null}
      </div>
    </div>
  );
}
