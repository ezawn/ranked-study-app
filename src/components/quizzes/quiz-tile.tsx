import { Badge } from "@/components/ui/feedback";
import { PanelLink, rarityFor } from "@/components/ui/panel";
import { ClockIcon, CoinIcon, GlobeIcon } from "@/components/icons";
import { QUIZZES, quizTimeLimitSeconds } from "@/lib/coins/rules";
import { formatDuration, truncate } from "@/lib/utils";

export interface QuizTileData {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  totalMarks: number;
  questionCount: number;
  isPublic?: boolean;
  origin?: string;
  bestPercentage?: number | null;
  attemptCount?: number;
  coinEligible?: boolean;
  timeLimitSeconds?: number;
}

/** The best any quiz can pay, read off the rules rather than written down. */
const MAX_COINS = Math.max(...QUIZZES.scoreBands.map((b) => b.coins));

/**
 * One quiz in the library.
 *
 * Deliberately the same shape as a flashcard set tile: the two libraries are
 * the same kind of place, so they should be read the same way. What differs is
 * the state on the bottom row — a set shows what is due, a quiz shows what you
 * have scored.
 *
 * The coin ceiling and the time limit both come from `lib/coins/rules` now.
 * They used to be a hard-coded "up to 5" and a hand-multiplied 90, which is the
 * kind of thing that silently goes wrong the day someone tunes the economy.
 *
 * Unlike a set tile, this one needs no proxy for its rarity rail — the best
 * mark ever scored on this quiz is exact, real mastery data, already fetched
 * for the "best X%" badge below.
 */
export function QuizTile({ quiz }: { quiz: QuizTileData }) {
  const eligible = quiz.coinEligible ?? quiz.totalMarks >= QUIZZES.minMarksForCoins;
  const seconds = quiz.timeLimitSeconds ?? quizTimeLimitSeconds(quiz.totalMarks);
  const best = quiz.bestPercentage;
  const rarity = rarityFor(best);

  return (
    <PanelLink
      href={`/quizzes/${quiz.id}`}
      rarity={rarity === "common" ? undefined : rarity}
      className="flex flex-col overflow-hidden p-5"
    >
      {rarity === "legendary" ? (
        <div
          className="foil pointer-events-none absolute inset-0 rounded-sq-card"
          aria-hidden="true"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-bright">
          {truncate(quiz.title, 60)}
        </h3>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 empty:hidden">
          {quiz.isPublic ? (
            <Badge tone="neutral">
              <GlobeIcon size={10} /> Public
            </Badge>
          ) : null}
          {quiz.origin === "PDF_IMPORT" ? <Badge tone="neutral">From PDF</Badge> : null}
          {quiz.origin === "AI_IMPROVEMENT" ? <Badge tone="neutral">AI practice</Badge> : null}
        </div>
      </div>

      {quiz.description ? (
        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
          {truncate(quiz.description, 110)}
        </p>
      ) : null}

      <div className="num mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
        <span>{quiz.questionCount} questions</span>
        <span aria-hidden="true">·</span>
        <span>{quiz.totalMarks} marks</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <ClockIcon size={11} /> {formatDuration(seconds)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        {eligible ? (
          <span className="num flex items-center gap-1 text-xs font-semibold text-coin-ink">
            <CoinIcon size={12} className="text-coin" /> up to {MAX_COINS}
          </span>
        ) : (
          <span className="text-xs text-faint">
            Under {QUIZZES.minMarksForCoins} marks — no coins
          </span>
        )}

        {best !== null && best !== undefined ? (
          <Badge tone={best >= 80 ? "lime" : best >= 60 ? "rare" : "rose"} className="shrink-0">
            <span className="num">best {best}%</span>
          </Badge>
        ) : quiz.attemptCount === 0 ? (
          <span className="shrink-0 text-xs text-faint">Not attempted</span>
        ) : null}
      </div>
    </PanelLink>
  );
}
