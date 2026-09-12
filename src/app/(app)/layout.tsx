import type { ReactNode } from "react";
import Link from "next/link";

import { NavigationProvider, PendingSkeleton } from "@/components/layout/route-transition";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { studyTimeToday } from "@/server/services/study-time";
import { currentSearch } from "@/server/services/arena/queue";
import { QueueProvider } from "@/components/arena/queue-provider";
import { QueueIndicator } from "@/components/arena/queue-indicator";
import { CoinProvider } from "@/components/game/coin-provider";
import { CoinCounter } from "@/components/game/coin-counter";
import { SessionTimerProvider } from "@/components/game/session-timer";
import { CoinTimerCompact, SessionClock } from "@/components/game/timers";
import { MobileNav, Sidebar, Wordmark } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme";
import { CrownIcon, FlameIcon } from "@/components/icons";

/**
 * The signed-in shell.
 *
 * This layout is the authorisation boundary for everything under it:
 * `requireUser` redirects to sign-in before any child page renders, so no
 * feature page has to remember to check.
 *
 * The header is deliberately a status bar rather than a toolbar. Coins and the
 * coin timer sit together in one instrument, because they are one idea: what
 * you have, and when the next one lands. The streak sits apart from them,
 * because it is a different kind of thing you can lose.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const [streak, time, queueSearch] = await Promise.all([
    db.streakState.findUnique({
      where: { userId: user.id },
      select: { currentStreak: true },
    }),
    studyTimeToday(user.id, user.timezone, user.plan),
    currentSearch(user.id),
  ]);

  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <CoinProvider initialBalance={user.coinBalance}>
      <SessionTimerProvider
        initial={{
          activeSeconds: time.activeSeconds,
          coinsAwarded: time.coinsAwarded,
          dailyCoinCap: time.dailyCoinCap,
          coinIntervalSeconds: time.coinIntervalSeconds,
          studySeconds: time.studySeconds,
          studyBonusCoins: time.studyBonusCoins,
          studyBonusDailyCap: time.studyBonusDailyCap,
          bonusIntervalSeconds: time.bonusIntervalSeconds,
        }}
      >
        {/* Wraps the whole shell, not just the page area: the sidebar and the
            phone tab bar read the pending destination so the highlight moves
            on click rather than when the server answers. */}
        <NavigationProvider>
        <QueueProvider initial={queueSearch ? { secondsWaiting: queueSearch.secondsWaiting } : null}>
        <div className="flex min-h-dvh">
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface lg:block">
            <Sidebar streak={currentStreak} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
              <div className="flex h-16 items-center gap-2.5 px-4 lg:px-7">
                <Wordmark className="lg:hidden" />

                <div className="ml-auto flex items-center gap-2">
                  {/* One instrument: time to the next coin, and the balance. */}
                  <div className="flex items-center rounded-sq border border-line bg-surface">
                    <div className="px-2.5 py-1.5">
                      <CoinTimerCompact />
                    </div>
                    <span className="h-5 w-px bg-line" aria-hidden />
                    <div className="px-2.5 py-1.5">
                      <CoinCounter />
                    </div>
                  </div>

                  {currentStreak > 0 ? (
                    <Link
                      href="/streak"
                      title="Daily quiz streak"
                      className="flex items-center gap-1.5 rounded-sq border border-epic/30 bg-epic/10 px-2.5 py-[7px] transition-colors hover:bg-epic/16"
                    >
                      <FlameIcon size={15} className="text-epic" />
                      <span className="num text-[13px] font-semibold text-epic-ink">
                        {currentStreak}
                      </span>
                    </Link>
                  ) : null}

                  {user.plan === "PREMIUM" ? (
                    <span
                      className="hidden items-center gap-1 rounded-sq border border-coin/30 bg-coin/10 px-2 py-[7px] text-[12px] font-semibold text-coin-ink sm:inline-flex"
                      title="Premium plan"
                    >
                      <CrownIcon size={12} /> PREMIUM
                    </span>
                  ) : null}

                  <ThemeToggle />

                  <UserMenu
                    name={user.name}
                    email={user.email}
                    image={user.avatarUrl}
                    plan={user.plan}
                  />
                </div>
              </div>
            </header>

            {/* The bottom padding on small screens keeps the last row of any
                page clear of the phone navigation bar. */}
            <main className="flex-1 px-4 pb-28 pt-7 sm:px-6 lg:px-9 lg:pb-14 lg:pt-9">
              {/* The skeleton is a sibling of the page, never a replacement
                  for it. Swapping them in React would mean re-rendering a
                  subtree that is suspended mid-navigation, and a commit
                  cannot land while that is true — which is precisely the
                  pause this is here to remove. CSS hides the stale page
                  instead; see `[data-route-area]` in globals.css. */}
              <div data-route-area className="mx-auto w-full max-w-6xl">
                <PendingSkeleton />
                <div data-route-content>{children}</div>
              </div>
            </main>
          </div>
        </div>

        <SessionClock />
        <QueueIndicator />
        <MobileNav streak={currentStreak} />
        </QueueProvider>
        </NavigationProvider>
      </SessionTimerProvider>
    </CoinProvider>
  );
}
