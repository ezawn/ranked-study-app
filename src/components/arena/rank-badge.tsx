import { rankByKey, rankProgress, type Rank } from "@/lib/arena/ranks";
import { Meter } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

/**
 * Rank, wearing the rarity colour its tier maps to.
 *
 * Rank is mastery, and this product already has exactly one colour scale for
 * mastery. Giving ranks their own palette would mean two colour systems
 * claiming to mean "how good is this" and disagreeing about it, so the rank
 * table borrows the rarity a tier corresponds to instead.
 */

const TONE: Record<Rank["rarity"], string> = {
  common: "border-common/40 bg-raise-2 text-common-ink",
  uncommon: "border-uncommon/35 bg-uncommon/12 text-uncommon-ink",
  rare: "border-rare/35 bg-rare/12 text-rare-ink",
  epic: "border-epic/35 bg-epic/12 text-epic-ink",
  legendary: "border-legendary/40 bg-legendary/15 text-legendary-ink",
};

export function RankBadge({
  rankKey,
  size = "md",
  className,
}: {
  rankKey: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const rank = rankByKey(rankKey);
  if (!rank) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-display font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[13px]",
        TONE[rank.rarity],
        className,
      )}
    >
      {rank.name}
    </span>
  );
}

/**
 * Rank, rating, and how far through the band the player is.
 *
 * Every figure comes from `rankProgress`, so the bar and the numbers can never
 * disagree about promotion — a bar computed in the component and a threshold
 * computed in the service is exactly how those two drift apart.
 */
export function RankProgress({
  elo,
  showNumbers = true,
  className,
}: {
  elo: number;
  showNumbers?: boolean;
  className?: string;
}) {
  const progress = rankProgress(elo);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <RankBadge rankKey={progress.rank.key} />
        {progress.next ? (
          <span className="text-[13px] text-muted">
            <span className="num font-semibold text-bright">{progress.eloToNext}</span> to{" "}
            {progress.next.name}
          </span>
        ) : (
          <span className="text-[13px] font-semibold text-legendary-ink">Top of the ladder</span>
        )}
      </div>

      <Meter
        value={progress.fraction * 100}
        max={100}
        className="mt-3"
        label={
          progress.next
            ? `${Math.round(progress.fraction * 100)}% of the way to ${progress.next.name}`
            : "Highest rank reached"
        }
      />

      {showNumbers ? (
        <div className="mt-2 flex items-baseline justify-between text-xs text-muted">
          <span className="num">{progress.rank.minElo}</span>
          <span className="num font-semibold text-bright">{elo} Elo</span>
          <span className="num">{progress.next ? progress.next.minElo : "—"}</span>
        </div>
      ) : null}
    </div>
  );
}

/** A signed Elo movement, coloured by direction. */
export function EloDelta({ delta, className }: { delta: number; className?: string }) {
  const tone =
    delta > 0 ? "text-uncommon-ink" : delta < 0 ? "text-epic-ink" : "text-muted";
  return (
    <span className={cn("num font-semibold", tone, className)}>
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}
