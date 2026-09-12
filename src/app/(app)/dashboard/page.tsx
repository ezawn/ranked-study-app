import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/server/services/dashboard";
import { COIN_SOURCE_LABEL } from "@/server/services/coins";
import { Panel, PanelLink, StatStrip, rarityFor } from "@/components/ui/panel";
import { setRarity } from "@/components/flashcards/set-tile";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Meter } from "@/components/ui/feedback";
import { CoinTimerPanel } from "@/components/game/timers";
import { NAV, type NavItem } from "@/lib/nav";
import { cn, formatNumber, relativeTime, truncate } from "@/lib/utils";
import { APP_TIME, STUDY_BONUS } from "@/lib/coins/rules";
import {
  ArrowRightIcon,
  CalendarIcon,
  CardsIcon,
  CharacterIcon,
  CoinIcon,
  CommunityIcon,
  FeedbackIcon,
  FlameIcon,
  LockIcon,
  PlayIcon,
  QuizIcon,
  RankIcon,
  ShieldIcon,
  SparkIcon,
  SwordIcon,
  TrophyIcon,
} from "@/components/icons";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * The dashboard.
 *
 * This is a collection, not a control panel. The student's material is a set
 * of cards, so the page is dealt rather than laid out: the decision first,
 * then today's three readings on one divided frame, then the hand — the most
 * recently touched cards, each wearing the rarity its mastery earned.
 *
 * Every section here is opened by a real heading. The previous version used a
 * small-caps label above a rule as its structural device throughout, which is
 * a heading admitting it cannot carry its own weight; the craft floor bans it
 * outright and it is not coming back.
 *
 * Nothing was dropped in the rebuild. Every figure, link and control that was
 * on the tiled version is still here, in the same reading order: what to do
 * now, how today is going, where you were, and what else exists.
 */
export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboard(user);

  const firstName = user.name?.split(" ")[0] ?? "there";
  const studyMinutes = Math.floor(data.studyTime.studySeconds / 60);

  /* The hand: sets and quizzes interleaved by when they were last touched,
     because "where was I" is one question and the student does not think of
     their material in two piles. */
  const hand = [
    ...data.recentSets.map((s) => ({
      kind: "set" as const,
      id: s.id,
      href: `/flashcards/${s.id}`,
      title: s.title,
      meta: `${s.cardCount} card${s.cardCount === 1 ? "" : "s"}`,
      tag: s.subject,
      at: s.updatedAt,
      /* The same rule the library tile uses, imported rather than restated —
         a set that has visibly been worked down earns its colour, and one
         nobody has opened stays common because a bare 0-due cannot tell
         "mastered" from "never touched". */
      rarity: setRarity(s.cardCount, s.dueCount),
    })),
    ...data.recentQuizzes.map((q) => ({
      kind: "quiz" as const,
      id: q.id,
      href: `/quizzes/${q.id}`,
      title: q.title,
      meta: `${q.questionCount} question${q.questionCount === 1 ? "" : "s"} · ${q.totalMarks} marks`,
      tag: q.subject,
      at: q.updatedAt,
      /* A quiz needs no proxy: the best mark ever scored on it is exact. */
      rarity: rarityFor(q.bestPercentage),
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-7">
      {/* ==================================================================
          1. The decision.

          Compact on purpose. The heading is the shortest line on the page and
          was set at 44px with a 6-unit gap under it, which pushed the metrics
          and the collection below the fold on a laptop for no reading gain.
          Greeting, headline and one line of copy, then the action.
          ================================================================== */}
      <section className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">
            {greeting(user.timezone)}, {firstName}
          </p>
          {/* 28 / 34 — both already steps the product uses. The compaction
              deliberately reaches for existing sizes rather than inventing a
              36px step: the ramp is already carrying 30 distinct values and
              does not need a 31st. */}
          <h1 className="mt-1 font-display text-[28px] font-bold leading-[1.05] tracking-[-0.03em] text-bright sm:text-[34px]">
            {data.dueCards > 0 ? (
              <>
                {/* `epic-ink`, not `epic`: the plain coral is 3.01:1 on the
                    table, which clears large-text AA by a hundredth. The ink
                    variant exists for exactly this. */}
                <span className="num text-epic-ink">{data.dueCards}</span> card
                {data.dueCards === 1 ? "" : "s"} ready for you
              </>
            ) : data.streak.doneToday ? (
              <>You&apos;re done for today</>
            ) : (
              <>Let&apos;s get some coins</>
            )}
          </h1>
          <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-muted">
            {data.dueCards > 0
              ? "Your spaced repetition queue is what moves the needle. Ten minutes here beats an hour of rereading."
              : data.streak.doneToday
                ? "Daily quiz done, cards clear. Anything else today is a bonus."
                : "Start with the daily quiz — it's three to five questions and it keeps your multiplier climbing."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {data.dueCards > 0 ? (
            <ButtonLink href="/flashcards?filter=due" size="lg" icon={<PlayIcon size={16} />}>
              Review {data.dueCards} card{data.dueCards === 1 ? "" : "s"}
            </ButtonLink>
          ) : null}
          <ButtonLink
            href="/daily"
            size="lg"
            variant={data.dueCards > 0 ? "secondary" : "primary"}
            icon={<CalendarIcon size={16} />}
          >
            {data.dailyQuiz.completed ? "Today's results" : "Daily quiz"}
          </ButtonLink>
        </div>
      </section>

      {/* ==================================================================
          2. Today — three readings, struck as pips.

          These used to be three label-plus-big-number cells sitting directly
          above four more of the same in the strip below: seven near-identical
          hero-metric tiles back to back, which is the one page scaffold the
          craft floor names outright. Every figure survived; the form did not.
          Today's readings are now printed the way a card prints its counters
          — a struck pip on the corner, with the meter carrying the weight —
          so the only large numerals on the page are the four totals below,
          and the two sections stop rhyming.
          ================================================================== */}
      <section>
        <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
          Today
        </h2>

        <Panel plain className="p-0">
          <div className="grid divide-line md:grid-cols-3 md:divide-x">
            <Reading
              label="Daily quiz"
              icon={<CalendarIcon size={13} className="text-accent" />}
              pip={
                data.dailyQuiz.completed
                  ? `${data.dailyQuiz.correctCount}/${data.dailyQuiz.questionCount}`
                  : null
              }
              state={data.dailyQuiz.completed ? "correct" : "Not done yet"}
              /* A link, not a button. The daily quiz had three entry points in
                 one viewport — this cell, the hero, and the rail — and two of
                 them were filled buttons competing to be the primary. The hero
                 is the page's one action anchor; this stays reachable without
                 arguing with it. The gold button in particular had to go:
                 amber means the figure IS Study Coins, and a button that
                 starts a quiz is an action, not a balance. */
              footer={
                <Link href="/daily" className="link text-[13px] font-semibold">
                  {data.dailyQuiz.completed ? "See results" : "Start the daily quiz"}
                </Link>
              }
              className="border-b border-line md:border-b-0"
            >
              {data.dailyQuiz.completed
                ? `${data.dailyQuiz.coinsEarned} coin${data.dailyQuiz.coinsEarned === 1 ? "" : "s"} earned today`
                : "3–5 questions pulled from your own material"}
            </Reading>

            <Reading
              label="Coin multiplier"
              icon={<FlameIcon size={13} className="text-epic" />}
              pip={`x${data.streak.multiplier.toFixed(1)}`}
              state="of x5.0"
              meter={
                <Meter
                  value={data.streak.multiplier}
                  max={5}
                  tone="coin"
                  label="Streak multiplier"
                />
              }
              className="border-b border-line md:border-b-0"
            >
              {data.streak.multiplier >= 5
                ? "Maxed out. Keep attempting to hold it."
                : "+0.2 every day you attempt — even if you get everything wrong."}
            </Reading>

            <Reading
              label="Studied today"
              icon={<PlayIcon size={13} className="text-accent" />}
              pip={
                studyMinutes >= 60
                  ? `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`
                  : `${studyMinutes}m`
              }
              state={`of ${Math.floor(data.studyTime.studyCapSeconds / 60)}m`}
              meter={
                <Meter
                  value={data.studyTime.studySeconds}
                  max={data.studyTime.studyCapSeconds}
                  tone="lime"
                  label="Study time counted today"
                />
              }
            >
              <span className="num">
                {data.studyTime.studyBonusCoins} / {data.studyTime.studyBonusDailyCap}
              </span>{" "}
              bonus coins banked
            </Reading>
          </div>
        </Panel>
      </section>

      {/* ==================================================================
          3. The figures.
          ================================================================== */}
      <StatStrip
        stats={[
          {
            label: "Study Coins",
            value: formatNumber(data.coins.balance),
            hint:
              data.coins.earnedToday > 0
                ? `+${data.coins.earnedToday} today`
                : "Nothing earned yet today",
            icon: <CoinIcon size={14} />,
            gold: true,
          },
          {
            label: "Streak",
            value: `${data.streak.current}d`,
            hint: `Longest: ${data.streak.longest} day${data.streak.longest === 1 ? "" : "s"}`,
            icon: <FlameIcon size={14} />,
          },
          {
            label: "Cards due",
            value: formatNumber(data.dueCards),
            /* The only zero on this strip that is good news. A balance of 0
               coins and 0 quizzes this week are both things to fix, so they
               keep their figure and say so plainly. */
            zeroLabel: data.setCount > 0 ? "All clear" : "Nothing yet",
            hint:
              data.setCount > 0
                ? `${data.setCount} set${data.setCount === 1 ? "" : "s"} in your library`
                : "Make a set and its cards land here",
            icon: <CardsIcon size={14} />,
          },
          {
            label: "Quizzes this week",
            value: formatNumber(data.attemptsThisWeek),
            hint: `${data.quizCount} quiz${data.quizCount === 1 ? "" : "zes"} you've built`,
            icon: <QuizIcon size={14} />,
          },
        ]}
      />

      {/* ==================================================================
          4. The hand, and the rail.
          ================================================================== */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
              <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
                Pick up where you left off
              </h2>
              <div className="flex items-center gap-4">
                <Link href="/flashcards" className="link text-[13px] font-semibold">
                  All sets
                </Link>
                <Link href="/quizzes" className="link text-[13px] font-semibold">
                  All quizzes
                </Link>
              </div>
            </div>

            {hand.length === 0 ? (
              <div className="rounded-sq-card border-2 border-dashed border-line bg-raise px-6 py-10 text-center">
                <p className="text-[14px] text-muted">
                  Nothing in your collection yet. Make a set or build a quiz and it lands here.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <ButtonLink href="/flashcards/new" size="sm">
                    New set
                  </ButtonLink>
                  <ButtonLink href="/quizzes/new" size="sm" variant="secondary">
                    New quiz
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {hand.map((item) => (
                  <PanelLink
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    rarity={item.rarity === "common" ? undefined : item.rarity}
                    className="group flex flex-col gap-3 overflow-hidden p-5"
                  >
                    {/* Foil, only where it was earned — same rule as the quiz
                        tile. Without this the world's one earned material
                        never appears on the surface that matters most. */}
                    {item.rarity === "legendary" ? (
                      <div
                        className="foil pointer-events-none absolute inset-0 rounded-sq-card"
                        aria-hidden="true"
                      />
                    ) : null}

                    <div className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                        {item.kind === "set" ? (
                          <CardsIcon size={13} className="text-accent" />
                        ) : (
                          <QuizIcon size={13} className="text-accent" />
                        )}
                        {item.kind === "set" ? "Flashcards" : "Quiz"}
                      </span>
                      {item.tag ? <Badge tone="neutral">{truncate(item.tag, 14)}</Badge> : null}
                    </div>

                    <h3 className="font-display text-[16px] font-bold leading-snug tracking-[-0.015em] text-bright">
                      {truncate(item.title, 52)}
                    </h3>

                    <p className="num mt-auto flex items-center gap-2 text-xs text-muted">
                      {item.meta}
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{relativeTime(item.at)}</span>
                    </p>
                  </PanelLink>
                ))}
              </div>
            )}
          </section>

          {/* The onward doors.

              Rows on one frame, not three cards — three same-size
              icon-plus-heading-plus-text tiles is the first page scaffold the
              craft floor refuses. It stays in this column rather than
              spanning the page: the rail runs taller than the collection, so
              this is what stands under the hand instead of bare table. */}
          <section>
            <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
              More to explore
            </h2>
            <Panel plain className="p-0">
              <Route
                first
                href="/quizzes/import"
                icon={<SparkIcon size={17} />}
                title="PDF → quiz"
                body="Drop in notes or a past paper and get a marked quiz out of it."
              />
              <Route
                href="/test-feedback"
                icon={<FeedbackIcon size={17} />}
                title="Test feedback"
                body="Upload a completed paper and see exactly where the marks went."
              />
              <Route
                href="/communities"
                icon={<CommunityIcon size={17} />}
                title="Communities"
                body={
                  data.communityCount > 0
                    ? `You're in ${data.communityCount} — share a set with them.`
                    : "Find people revising the same subjects."
                }
              />
            </Panel>
          </section>
        </div>

        {/* ------------------------------------------------------ The rail */}
        <aside className="space-y-6">
          <CoinTimerPanel />

          <Panel>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[16px] font-bold tracking-[-0.015em] text-bright">
                Recent coins
              </h2>
              <Link href="/streak" className="link text-[13px] font-semibold">
                Streak
              </Link>
            </div>

            {data.coins.entries.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-muted">
                Nothing yet. Coins land when you finish a set, score 60%+ on a quiz of 10 marks or
                more, or do the daily quiz. The coin timer adds one every{" "}
                {APP_TIME.secondsPerCoin[user.plan] / 60} minutes you&apos;re here, and the study
                bonus adds 5 more every {STUDY_BONUS.secondsPerBonus[user.plan] / 60} minutes spent
                actually studying.
              </p>
            ) : (
              <ul>
                {data.coins.entries.map((entry, i) => (
                  <li
                    key={entry.id}
                    className={`flex items-center justify-between gap-3 py-2.5 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-bright">
                        {COIN_SOURCE_LABEL[entry.source]}
                      </span>
                      <span className="block text-xs text-muted">
                        {relativeTime(entry.createdAt)}
                      </span>
                    </span>
                    <span className="num flex shrink-0 items-center gap-1 text-[13.5px] font-bold text-coin-ink">
                      +{entry.amount}
                      <CoinIcon size={12} className="text-coin" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

        </aside>
      </div>

      {/* The Arena, along the foot. Out of the rail: it was the only static
          panel in a column whose other two are live, and the rail ran 239px
          past the collection beside it — a ragged sixth of the page. */}
      <ArenaPanel />
    </div>
  );
}

/* ==========================================================================
   Pieces
   ========================================================================== */

/**
 * Time-of-day greeting, in the reader's timezone rather than the server's.
 * Everything else on this page already respects the user's day boundary; this
 * used to be the one thing that did not.
 */
function greeting(timezone: string): string {
  let hour: number;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        hour: "numeric",
        hour12: false,
        timeZone: timezone,
      }).format(new Date()),
    );
  } catch {
    hour = new Date().getHours();
  }

  if (!Number.isFinite(hour)) hour = new Date().getHours();
  if (hour < 5) return "Late one";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/**
 * One of today's three readings.
 *
 * The figure is a struck pip rather than a hero numeral — the counter printed
 * on a card's corner. What carries the eye is the meter under it, not the
 * size of the number, which leaves the four totals in the strip below as the
 * page's only large figures.
 */
function Reading({
  label,
  icon,
  pip,
  state,
  meter,
  footer,
  children,
  className,
}: {
  label: string;
  icon: ReactNode;
  /** The reading itself. Null when there is nothing to count yet. */
  pip: string | null;
  state: string;
  meter?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between gap-4 p-5", className)}>
      <div>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
          {icon}
          {label}
        </p>

        {/* With a pip, the state is the quiet half of the pair and the pip
            carries the rank. With no figure to strike there is no pip, so the
            state has to carry it alone — otherwise the one cell holding an
            undone action ends up the weakest thing in the row. */}
        <p className="mt-2.5 flex items-center gap-2">
          {pip ? (
            <>
              <span className="pip text-bright">{pip}</span>
              <span className="text-[13.5px] font-medium text-muted">{state}</span>
            </>
          ) : (
            <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-bright">
              {state}
            </span>
          )}
        </p>

        {meter ? <div className="mt-3">{meter}</div> : null}
      </div>

      <div className="text-[13px] leading-relaxed text-muted">{children}</div>

      {/* `items-start`, so the button is sized by its label. A bare flex child
          in a column stretches to the full cell width, which turned the one
          coin-coloured action on the page into a full-bleed gold bar. */}
      {footer ? <div className="flex items-start">{footer}</div> : null}
    </div>
  );
}

/**
 * One onward route.
 *
 * A row in a list, not a card. Three same-size icon-plus-heading-plus-text
 * cards is the first page scaffold the craft floor refuses, and it is what
 * this was: the three doors now sit on one frame as rules-separated rows, so
 * they read as a short index of what else the product does rather than as
 * three products competing with the collection above them.
 */
function Route({
  href,
  icon,
  title,
  body,
  first,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
  first?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 px-5 py-4 transition-colors duration-200",
        "hover:bg-raise",
        !first && "border-t border-line",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sq bg-accent/10 text-accent">
        {icon}
      </span>

      {/* Capped by measure, not by container. An earlier attempt wrapped the
          row in a max-w-3xl box to pull the chevron in from the edge; at this
          column width the cap never engaged, and it was solving the wrong
          problem anyway. The chevron sitting at the row's edge is the list
          convention and is what makes the whole row read as tappable — what
          actually needed bounding was the prose, which was free to run past
          100 characters. */}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-bold tracking-[-0.015em] text-bright">
          {title}
        </span>
        <span className="mt-0.5 block max-w-[62ch] text-[13px] leading-relaxed text-muted">
          {body}
        </span>
      </span>

      <ArrowRightIcon
        size={15}
        className="shrink-0 text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </Link>
  );
}

/**
 * The Arena.
 *
 * A quiet door, deliberately. The user asked that unbuilt features not take
 * attention from the parts that work, so this stays a modest list behind a
 * hatch rather than a headline. It reads off the navigation model rather than
 * a hand-written array, so the panel and the sidebar can never disagree about
 * what is coming.
 */
const ARENA_ICONS: Record<NavItem["icon"], (p: { size?: number }) => ReactNode> = {
  home: SwordIcon,
  cards: SwordIcon,
  quiz: SwordIcon,
  feedback: SwordIcon,
  community: ShieldIcon,
  calendar: CalendarIcon,
  flame: FlameIcon,
  sword: SwordIcon,
  shield: ShieldIcon,
  character: CharacterIcon,
  trophy: TrophyIcon,
  rank: RankIcon,
};

function ArenaPanel() {
  const locked = NAV.flatMap((section) => section.items).filter((item) => item.locked);

  return (
    /* A hairline and chips straight onto the table — no card stock. Stock is
       what the product's real material sits on; the Arena is not real yet,
       and giving it the same frame as a set you have actually studied is the
       quiet door claiming to be furniture. */
    <section className="border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-[15px] font-bold tracking-[-0.015em] text-bright">
          The Arena
        </h2>
        <p className="text-[13px] leading-relaxed text-muted">
          Not built yet — your coins are the head start.
        </p>
      </div>

      {/* A row of hatched chips rather than a stacked list. As a rail panel
          this was a third of a column tall and said "Arena" for the third time
          in one viewport, next to five locked sidebar rows and the sidebar's
          own note. Laid along the foot it stays a door you can see without it
          asking for the room. */}
      <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {locked.map((item) => {
          const Icon = ARENA_ICONS[item.icon];
          return (
            <li
              key={item.href}
              className="locked flex items-center gap-2 rounded-sq border border-line px-2.5 py-1.5 text-[12.5px] text-muted"
            >
              <span className="text-muted">
                <Icon size={14} />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              <LockIcon size={11} className="text-muted" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
