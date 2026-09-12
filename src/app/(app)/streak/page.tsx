import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { getStreakOverview } from "@/server/services/daily-quiz";
import { Panel, PanelHeader, StatStrip, rarityFor, type Rarity } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Meter } from "@/components/ui/feedback";
import { DAILY_QUIZ } from "@/lib/coins/rules";
import { addDays } from "@/lib/time/day";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  CheckIcon,
  CoinIcon,
  FlameIcon,
  QuizIcon,
  TrophyIcon,
} from "@/components/icons";

export const metadata: Metadata = { title: "Streak" };
export const dynamic = "force-dynamic";

/** Rungs on the multiplier ladder, day 1 through the day the ×5 ceiling is reached. */
const STREAK_RUNGS =
  Math.round((DAILY_QUIZ.multiplierMax - DAILY_QUIZ.multiplierStart) / DAILY_QUIZ.multiplierStep) + 1;

/**
 * A streak is the one thing on this page that is genuinely earned progression,
 * so it carries rarity too: a fresh streak is common, a streak closing in on
 * the ×5 ceiling is legendary. Progress toward the last rung stands in for a
 * percentage `rarityFor` already knows how to grade.
 */
function streakRarity(days: number): Rarity {
  return rarityFor(Math.min(100, (days / STREAK_RUNGS) * 100));
}

/** The flame chip's colour, printed rather than glowing — a border and a wash, never a fill. */
const FLAME_TONE: Record<Rarity, string> = {
  common: "border-line bg-raise text-faint",
  uncommon: "border-uncommon/35 bg-uncommon/10 text-uncommon",
  rare: "border-rare/35 bg-rare/10 text-rare",
  epic: "border-epic/35 bg-epic/10 text-epic",
  legendary: "border-legendary/40 bg-legendary/14 text-legendary",
};

/**
 * The streak.
 *
 * This is the game showcase, so it is built like an achievement screen: the
 * flame and the number carry the top of the page, the calendar underneath is
 * the proof, and the ladder is the thing still to be won.
 *
 * The calendar encodes three states — missed, attempted, all correct — and it
 * encodes them with shape first: empty, a dot, a tick. Colour only reinforces
 * what the shape already says, which is what keeps the grid readable for
 * anyone who cannot separate the two fills by hue.
 */
export default async function StreakPage() {
  const user = await requireUser();
  const streak = await getStreakOverview(user.id, user.timezone);

  const rarity = streakRarity(streak.currentStreak);
  const maxed = streak.multiplier >= DAILY_QUIZ.multiplierMax;

  const byDay = new Map(streak.history.map((h) => [h.day, h]));

  // Last 10 weeks, oldest first, aligned so each column is a week.
  const days: string[] = [];
  for (let i = 69; i >= 0; i--) days.push(addDays(streak.today, -i));

  const multiplierSteps = Array.from(
    { length: Math.round((DAILY_QUIZ.multiplierMax - DAILY_QUIZ.multiplierStart) / DAILY_QUIZ.multiplierStep) + 1 },
    (_, i) => ({
      day: i + 1,
      multiplier: Math.min(
        DAILY_QUIZ.multiplierMax,
        Math.round((DAILY_QUIZ.multiplierStart + DAILY_QUIZ.multiplierStep * i) * 10) / 10,
      ),
    }),
  );

  const milestone = multiplierSteps.find((s) => s.day > Math.max(1, streak.currentStreak));

  return (
    <div className="space-y-8">
      {/* -------------------------------------------------------------- Hero */}
      <section className="panel relative overflow-hidden">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" />
        {/* The ×5 ceiling is the one streak moment that is actually earned in
            full, so it is the page's one foil moment — never a decoration,
            only ever this. */}
        {maxed ? <div className="foil pointer-events-none absolute inset-0" aria-hidden="true" /> : null}

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-0">
          <div className="flex items-center gap-5 sm:gap-6 lg:pr-10">
            <span
              className={cn(
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-sq-lg border sm:h-24 sm:w-24",
                FLAME_TONE[rarity],
              )}
            >
              <FlameIcon size={44} className={streak.currentStreak > 0 ? "animate-float" : ""} />
            </span>

            <div className="min-w-0">
              {/* The figure is the headline. The words around it stay muted so
                  the number is the only thing competing for the first look. */}
              <h1 className="font-display text-[19px] font-semibold leading-tight tracking-[-0.02em] text-muted sm:text-[22px]">
                <span className="num block text-[56px] font-semibold leading-[0.85] tracking-[-0.04em] text-bright sm:text-[68px]">
                  {streak.currentStreak}
                </span>
                <span className="mt-2 block">
                  day{streak.currentStreak === 1 ? "" : "s"} in a row
                </span>
              </h1>

              {streak.doneToday ? (
                <Badge tone="lime" className="mt-3">
                  <CheckIcon size={10} />
                  Today&apos;s done
                </Badge>
              ) : (
                <Badge tone="epic" className="mt-3">
                  <CalendarIcon size={10} />
                  Today&apos;s quiz is waiting
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 border-t border-line pt-6 lg:items-end lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="lg:text-right">
              <div className="num text-4xl font-semibold leading-none text-coin sm:text-[42px]">
                x{streak.multiplier.toFixed(1)}
              </div>
              <p className="mt-2 text-sm text-muted">on every daily quiz coin</p>
            </div>
            {!streak.doneToday ? (
              <ButtonLink href="/daily" icon={<CalendarIcon size={16} />}>
                Do today&apos;s quiz
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Stats */}
      <StatStrip
        stats={[
          {
            label: "Longest streak",
            value: streak.longestStreak,
            hint:
              streak.currentStreak >= streak.longestStreak && streak.currentStreak > 0
                ? "That's your record — keep it"
                : `${Math.max(0, streak.longestStreak - streak.currentStreak)} days to beat it`,
            icon: <TrophyIcon size={14} />,
          },
          {
            label: "Days played",
            value: streak.daysPlayed,
            hint: "Across the last 60 days",
            icon: <CalendarIcon size={14} />,
          },
          {
            label: "Coins from daily",
            value: streak.coinsFromDaily,
            hint: "Base plus perfect-round bonuses",
            icon: <CoinIcon size={14} />,
            gold: true,
          },
          {
            label: "Days to max",
            value: streak.multiplier >= DAILY_QUIZ.multiplierMax ? "Maxed" : streak.daysToMax,
            hint:
              streak.multiplier >= DAILY_QUIZ.multiplierMax
                ? `You're on the x${DAILY_QUIZ.multiplierMax} ceiling`
                : `Until x${DAILY_QUIZ.multiplierMax}`,
            icon: <FlameIcon size={14} />,
          },
        ]}
      />

      {/* The calendar is the proof, the ladder is what's still to be won — two
          different instruments reading the same streak, so one hairline-divided
          surface where there used to be two separately-boxed panels. */}
      <Panel className="p-0" rarity={rarity === "common" ? undefined : rarity}>
        <div className="grid divide-line lg:grid-cols-[1.4fr_1fr] lg:divide-x">
          {/* ------------------------------------------------------- Calendar */}
          <div className="border-b border-line p-6 lg:border-b-0">
            <PanelHeader
              title="The last 10 weeks"
              subtitle="Filled squares are days you attempted."
            />

            <div className="flex gap-1 overflow-x-auto pb-2 sm:gap-1.5">
              {Array.from({ length: 10 }, (_, week) => (
                <div key={week} className="flex flex-col gap-1 sm:gap-1.5">
                  {days.slice(week * 7, week * 7 + 7).map((day) => {
                    const entry = byDay.get(day);
                    const done = entry?.status === "COMPLETED";
                    const perfect = entry?.attempt?.allCorrect ?? false;
                    const isToday = day === streak.today;
                    const future = day > streak.today;

                    return (
                      <div
                        key={day}
                        title={
                          future
                            ? day
                            : done
                              ? `${day} — ${entry?.attempt?.correctCount ?? 0}/${entry?.attempt?.totalCount ?? 0} correct, +${entry?.attempt?.coinsAwarded ?? 0} coins`
                              : `${day} — missed`
                        }
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-sq-sm border transition-colors sm:h-7 sm:w-7",
                          future
                            ? "border-dashed border-line bg-transparent"
                            : perfect
                              ? "border-coin/55 bg-coin/25 text-coin-ink"
                              : done
                                ? "border-line-strong bg-raise-3 text-bright"
                                : "border-line bg-raise",
                          isToday && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
                        )}
                      >
                        {/* Shape carries the meaning: nothing, a dot, a tick. */}
                        {perfect ? (
                          <CheckIcon size={12} />
                        ) : done ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-sq-sm border border-line bg-raise" /> missed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-sq-sm border border-line-strong bg-raise-3">
                  <span className="h-1 w-1 rounded-full bg-bright" />
                </span>{" "}
                attempted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-sq-sm border border-coin/55 bg-coin/25 text-coin-ink">
                  <CheckIcon size={9} />
                </span>{" "}
                all correct
              </span>
            </div>
          </div>

          {/* ----------------------------------------------------- Multiplier */}
          <div className="p-6">
            <PanelHeader
              title="How the multiplier climbs"
              subtitle={`+${DAILY_QUIZ.multiplierStep} a day, up to x${DAILY_QUIZ.multiplierMax}.`}
            />

            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted">Now</span>
                <span className="font-semibold text-coin num">
                  x{streak.multiplier.toFixed(1)} / x{DAILY_QUIZ.multiplierMax.toFixed(1)}
                </span>
              </div>
              <Meter value={streak.multiplier} max={DAILY_QUIZ.multiplierMax} tone="coin" />
            </div>

            {milestone ? (
              <p className="mb-4 rounded-sq border border-line bg-raise px-3.5 py-2.5 text-sm leading-relaxed text-muted">
                Attempt {milestone.day - Math.max(0, streak.currentStreak)} more day
                {milestone.day - Math.max(0, streak.currentStreak) === 1 ? "" : "s"} in a row to reach{" "}
                <span className="font-semibold text-coin">x{milestone.multiplier.toFixed(1)}</span>.
              </p>
            ) : null}

            {/* Twenty-one rungs. As a list they were a scroll of identical rows;
                as a board they can be read in one look, with the next rung ringed
                and every fifth one weighted so the ladder has a rhythm. */}
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {multiplierSteps.map((step) => {
                const reached = streak.currentStreak >= step.day;
                const isNext = milestone?.day === step.day;
                const marked = step.day % 5 === 0 || step.multiplier >= DAILY_QUIZ.multiplierMax;

                return (
                  <li
                    key={step.day}
                    className={cn(
                      "rounded-sq-sm border px-2 py-2 text-center transition-colors",
                      reached
                        ? "border-line-strong bg-raise-2"
                        : marked
                          ? "border-line-strong bg-transparent"
                          : "border-line bg-transparent",
                      isNext && "border-accent ring-1 ring-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "num block text-[11px] font-medium leading-none",
                        reached ? "text-muted" : "text-faint",
                      )}
                    >
                      Day {step.day}
                    </span>
                    <span
                      className={cn(
                        "num mt-1.5 block text-[15px] font-semibold leading-none",
                        reached ? "text-coin" : "text-faint",
                      )}
                    >
                      x{step.multiplier.toFixed(1)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Panel>

      {/* Reference material, not a decision — quiet by construction, like
          "More to explore" on the dashboard, so it doesn't compete with the
          calendar and ladder above for the first look. */}
      <section>
        <h2 className="mb-3 font-display text-[14.5px] font-semibold tracking-[-0.01em] text-muted">
          How it works
        </h2>
        <ul className="grid gap-3 text-sm leading-relaxed text-muted sm:grid-cols-2">
          <li className="rounded-sq border border-line bg-raise p-4">
            <FlameIcon size={16} className="mb-2 block text-accent" />
            <span className="font-display font-semibold text-bright">Attempting is what counts.</span>{" "}
            Get every question wrong and the streak still continues. It only breaks on a day you
            don&apos;t show up.
          </li>
          <li className="rounded-sq border border-line bg-raise p-4">
            <CoinIcon size={16} className="mb-2 block text-coin" />
            <span className="font-display font-semibold text-bright">
              +{DAILY_QUIZ.coinsPerCorrect} coin per correct answer,
            </span>{" "}
            multiplied by your streak. All correct earns one bonus coin, and the multiplier applies to
            that too.
          </li>
          <li className="rounded-sq border border-line bg-raise p-4">
            <QuizIcon size={16} className="mb-2 block text-accent" />
            <span className="font-display font-semibold text-bright">Questions come from you.</span>{" "}
            Quizzes you wrote and quizzes you saved from Discover, spread across your subjects.
          </li>
          <li className="rounded-sq border border-line bg-raise p-4">
            <CalendarIcon size={16} className="mb-2 block text-accent" />
            <span className="font-display font-semibold text-bright">One go a day.</span> The set of
            questions is fixed when you open it, so it&apos;s the same quiz whenever you get to it.
          </li>
        </ul>
      </section>
    </div>
  );
}
