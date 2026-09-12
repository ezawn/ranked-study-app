import { Badge } from "@/components/ui/feedback";
import { PanelLink, rarityFor, type Rarity } from "@/components/ui/panel";
import { CoinIcon, DownloadIcon, GlobeIcon } from "@/components/icons";
import { FLASHCARDS } from "@/lib/coins/rules";
import { accentFor, relativeTime, truncate } from "@/lib/utils";

export interface SetTileData {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  cardCount: number;
  isPublic?: boolean;
  updatedAt?: Date;
  dueCount?: number;
  downloads?: number;
  sourceSetId?: string | null;
}

/**
 * Mastery, standing in for the exact figure the set's own page can afford —
 * that page reads every card's last rating; the library only ever fetches a
 * due count.
 *
 * A card only ever enters that due count once it has been reviewed and its
 * schedule has since lapsed, so a set nobody has opened reads the same 0-due
 * as one so thoroughly learned that nothing has come back around today. This
 * function cannot tell those two apart, and calling the wrong one of them
 * legendary is exactly the false claim rarity is not allowed to make — so it
 * stays common without positive evidence. A due pile that has visibly been
 * worked down is the one thing a bare 0 can never prove on its own; once
 * there is a due pile at all, though, how much of the set sits outside it is
 * a real, earned signal.
 */
export function setRarity(cardCount: number, dueCount: number): Rarity {
  if (cardCount <= 0 || dueCount <= 0) return "common";
  const cleared = Math.max(0, cardCount - dueCount) / cardCount;
  return rarityFor(Math.round(cleared * 100));
}

/**
 * One set in the library.
 *
 * Read top to bottom it answers, in order: what is it, what is it worth, and is
 * there anything waiting for me.
 *
 * There is no icon on this tile any more. Every item in this list is a
 * flashcard set, so an identical icon on every row carried no information and
 * cost a third of the header width. What replaces it is the thing that is
 * actually different between rows: how many cards are due — and, printed
 * along the top edge, the rarity that due pile implies. A set nobody has
 * touched carries no colour; one that's been worked all the way down turns
 * legendary and catches the light.
 */
export function SetTile({ set }: { set: SetTileData }) {
  const coins = Math.max(
    FLASHCARDS.minCoinsPerSet,
    Math.floor(set.cardCount / FLASHCARDS.cardsPerCoin),
  );
  const due = set.dueCount ?? 0;
  const rarity = setRarity(set.cardCount, due);

  return (
    <PanelLink
      href={`/flashcards/${set.id}`}
      rarity={rarity === "common" ? undefined : rarity}
      className="group flex flex-col overflow-hidden p-5"
    >
      {rarity === "legendary" ? (
        <div
          className="foil pointer-events-none absolute inset-0 rounded-sq-card"
          aria-hidden="true"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-bright">
          {truncate(set.title, 60)}
        </h3>

        <div className="flex shrink-0 items-center gap-1.5 empty:hidden">
          {set.isPublic ? (
            <Badge tone="neutral">
              <GlobeIcon size={10} /> Public
            </Badge>
          ) : null}
          {set.sourceSetId ? <Badge tone="neutral">Saved</Badge> : null}
        </div>
      </div>

      {set.description ? (
        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
          {truncate(set.description, 110)}
        </p>
      ) : null}

      <div className="num mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
        <span>{set.cardCount} cards</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1 text-coin-ink">
          <CoinIcon size={11} className="text-coin" />
          {coins}
        </span>
        {set.downloads !== undefined && set.downloads > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <DownloadIcon size={11} /> {set.downloads}
            </span>
          </>
        ) : null}
        {set.updatedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{relativeTime(set.updatedAt)}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        {set.subject ? (
          <Badge tone="neutral">{truncate(set.subject, 18)}</Badge>
        ) : (
          <span className="text-xs text-faint">No subject</span>
        )}

        {/* The one thing worth acting on, and the only thing on the tile
            allowed to be loud. */}
        {due > 0 ? (
          <span className="num inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[12px] font-semibold leading-4 text-accent-ink">
            {due} due
          </span>
        ) : (
          <span className="text-xs text-faint">Nothing due</span>
        )}
      </div>
    </PanelLink>
  );
}

export function subjectAccent(subject: string | null): string {
  return subject ? accentFor(subject) : "violet";
}
