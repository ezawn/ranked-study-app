import type { ReactNode } from "react";

import { ComingSoonSkeleton } from "@/components/game/coming-soon-skeleton";
import {
  Skeleton,
  SkeletonHeading,
  SkeletonPage,
  SkeletonPanel,
  SkeletonRows,
  SkeletonStatStrip,
  SkeletonStudyCard,
  SkeletonText,
  SkeletonTileGrid,
} from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArenaSkeleton,
  BattleSkeleton,
  CharacterSkeleton,
  LeaderboardSkeleton,
  ProfileSkeleton,
  RankSkeleton,
} from "@/components/arena/skeletons";

/**
 * One shape per route, and one place they live.
 *
 * Every `loading.tsx` under `(app)` used to hold its own copy of its
 * placeholder — fine while Next was the only thing that ever rendered one.
 * An instant skeleton on click needs to paint a destination's shape before
 * Next has fetched anything, which means these shapes have to be plain
 * components a client can import too. Hence no `"use client"` here, no
 * hooks, nothing server-only — just markup, so the same file works from a
 * server `loading.tsx` and from whatever paints the instant preview.
 *
 * `skeletonForPath` at the bottom is the other half: given a pathname, which
 * of these a route actually uses.
 */

/* ----------------------------------------------------------------- dashboard */

/**
 * Shaped like the dashboard, section for section: the decision, the three
 * readings of Today, the figures, then the two columns. Because the boxes are
 * the same size as the real ones, the page fills in rather than reflowing.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      {/* 1. The decision */}
      <section className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-10 w-[22rem] max-w-full" />
          <Skeleton className="mt-4 h-4 w-[30rem] max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-32" />
        </div>
      </section>

      {/* 2. The figures — rules, not cells */}
      <section className="border-y border-line py-7">
        <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-line">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={i === 0 ? "sm:pr-7" : i === 3 ? "sm:pl-7" : "sm:px-7"}
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-2.5 h-3 w-28" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. Body and rail, held apart by one rule */}
      <div className="grid gap-x-10 gap-y-12 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-11">
          {/* Today */}
          <SkeletonSection>
            <div className="grid gap-7 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex min-h-32 flex-col justify-between gap-4 ${
                    i === 0 ? "sm:pr-7" : i === 2 ? "sm:pl-7" : "sm:px-7"
                  }`}
                >
                  <div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-3 h-2 w-full rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          </SkeletonSection>

          {/* Pick up where you left off */}
          <SkeletonSection>
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              {[0, 1].map((col) => (
                <div key={col}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  {[0, 1, 2].map((row) => (
                    <div
                      key={row}
                      className={`flex items-center gap-3 py-2.5 ${row > 0 ? "border-t border-line" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-3.5 w-2/5" />
                        <Skeleton className="mt-2 h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </SkeletonSection>

          {/* More to explore */}
          <SkeletonSection>
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="py-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2.5 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-2/3" />
                </div>
              ))}
            </div>
          </SkeletonSection>
        </div>

        <div className="space-y-10 xl:border-l xl:border-line xl:pl-10">
          {/* Coin timer — brings its own heading, so no kicker rule */}
          <div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="mt-2.5 h-6 w-20" />
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
            <Skeleton className="mt-4 h-3 w-36" />
          </div>

          <SkeletonSection>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="mt-2 h-3 w-1/4" />
                </div>
                <Skeleton className="h-3.5 w-8 shrink-0" />
              </div>
            ))}
          </SkeletonSection>

          <SkeletonSection>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`py-2 ${i > 0 ? "border-t border-line" : ""}`}>
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </SkeletonSection>
        </div>
      </div>
    </div>
  );
}

/**
 * The dashboard's section opener, in placeholder form: the small-caps kicker
 * and the rule it sits on. That pairing is the page's whole structure now that
 * the panels are gone, so the skeleton has to draw it or the layout visibly
 * gains its dividing lines when the content lands.
 */
function SkeletonSection({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
        <Skeleton className="h-3 w-28" />
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ library */

/**
 * Shaped like the flashcard library: the heading, the tabs-and-search
 * toolbar, then the tile grid. The toolbar only blocks in the two control
 * clusters rather than guessing at "Due today" — that chip depends on data
 * we don't have yet, and it's narrow enough that its arrival just widens the
 * row rather than pushing anything below it down.
 */
export function LibraryIndexSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading flashcards">
      <SkeletonHeading />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-11 w-44" />
        </div>
        <Skeleton className="h-11 w-full sm:ml-auto sm:w-auto sm:min-w-64 sm:flex-1" />
      </div>

      <SkeletonTileGrid />
    </div>
  );
}

/**
 * Same library shape as flashcards, but the heading here always carries two
 * actions — PDF import and New quiz — rather than SkeletonHeading's one, so
 * it's built by hand instead of composed from that piece.
 */
export function QuizLibraryIndexSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading quizzes">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-9 w-40 max-w-full" />
          <Skeleton className="mt-3 h-4 w-[30rem] max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Skeleton className="h-11 w-44" />
        <Skeleton className="h-11 w-full sm:ml-auto sm:w-auto sm:min-w-64 sm:flex-1" />
      </div>

      <SkeletonTileGrid />
    </div>
  );
}

/* ------------------------------------------------------------- flashcard set */

/**
 * Shaped like a set page: the back link, a heading whose action holds up to
 * three buttons rather than SkeletonHeading's one, the figures, the mastery
 * bar, then the card list against Study Coins and Manage on the right. The
 * rail assumes the visitor owns the set — the shape most people hit this
 * route in — since a rail that shrinks for a guest is a smaller jump than
 * one that grows to add a whole panel once the owner check comes back.
 */
export function SetDetailSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading set">
      <div>
        <Skeleton className="h-3.5 w-28" />
      </div>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-9 w-72 max-w-full" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-20" />
        </div>
      </div>

      <SkeletonText lines={2} className="max-w-2xl" />

      {/* Mastery is the one tile with no hint under it — its known/total count
          lives with the progress bar below instead, so the placeholder must
          not reserve a line the real tile never fills. */}
      <SkeletonStatStrip hints={[false, true, true, true]} />

      {/* The mastery meter sits on its own hairline panel below the figures —
          same shape as a Meter, just quieter, so re-stating the number here
          instead of only once above doesn't feel like new information. */}
      <div className="panel px-6 py-5">
        <div className="mb-2.5 flex items-baseline justify-between gap-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <SkeletonPanel>
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              // Matches the card row's sm/md steps below so the skeleton
              // doesn't reflow into a different shape than the real content.
              <div
                key={i}
                className="grid gap-3 py-3 sm:grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_1fr]"
              >
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6 sm:col-span-2 md:col-span-1" />
              </div>
            ))}
          </div>
        </SkeletonPanel>

        <div className="space-y-5">
          <SkeletonPanel>
            <div className="space-y-3.5">
              <Skeleton className="h-8 w-28" />
              <SkeletonText lines={2} />
              <Skeleton className="h-16 w-full" />
              <div>
                <div className="mb-1.5 flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </SkeletonPanel>

          <SkeletonPanel header={false}>
            <Skeleton className="h-4 w-20" />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-20" />
            </div>
          </SkeletonPanel>
        </div>
      </div>
    </div>
  );
}

/**
 * Shaped like the set editor: the details panel, then the card list panel
 * with its own header and footer rail. Existing sets vary wildly in card
 * count, so four rows here is a guess rather than a promise — this list is
 * the one part of the screen still free to grow once the real cards land.
 */
export function SetEditorSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading set editor">
      <SkeletonHeading action={false} />

      <div className="space-y-5">
        <SkeletonPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-11 md:col-span-2" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </SkeletonPanel>

        <SkeletonPanel header={false} className="overflow-hidden p-0">
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-5 sm:px-6">
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2.5 h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-9 w-28 shrink-0" />
          </div>

          <div className="divide-y divide-line">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="grid gap-x-3 gap-y-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-raise p-2.5 sm:px-4 sm:py-3">
            <Skeleton className="h-11 w-full" />
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

/**
 * A blank set editor always opens with exactly three empty cards, so this
 * one gets to be exact rather than a guess — unlike the edit screen, which
 * mirrors the same shape for however many cards the set already holds.
 */
export function NewSetSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading set editor">
      <SkeletonHeading action={false} />

      <div className="space-y-5">
        <SkeletonPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-11 md:col-span-2" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </SkeletonPanel>

        <SkeletonPanel header={false} className="overflow-hidden p-0">
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-5 sm:px-6">
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2.5 h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-9 w-28 shrink-0" />
          </div>

          <div className="divide-y divide-line">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="grid gap-x-3 gap-y-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-raise p-2.5 sm:px-4 sm:py-3">
            <Skeleton className="h-11 w-full" />
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- quizzes */

/**
 * Shaped like a quiz page: back link, a heading whose action holds up to two
 * buttons, the figures, then the question list and attempt history on the
 * left against Study Coins and Manage on the right. As on the set page, the
 * rail assumes the common case — an owner back on their own quiz — rather
 * than the shorter view a guest or a first-timer would get.
 */
export function QuizDetailSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading quiz">
      <div>
        <Skeleton className="h-3.5 w-24" />
      </div>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-9 w-72 max-w-full" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-20" />
        </div>
      </div>

      <SkeletonText lines={2} className="max-w-2xl" />

      <SkeletonStatStrip />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {/* The question list is bordered rows on their own ground, not a
              divided list — that's how the real page tells "these are
              separate items" apart from the divided lists used elsewhere. */}
          <SkeletonPanel>
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-sq border border-line bg-raise px-4 py-3"
                >
                  <Skeleton className="h-6 w-6 shrink-0 rounded-sq-sm" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3 w-8 shrink-0" />
                </div>
              ))}
            </div>
          </SkeletonPanel>

          <SkeletonPanel>
            <div className="divide-y divide-line">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </SkeletonPanel>
        </div>

        <div className="space-y-5">
          <SkeletonPanel>
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-4 h-14 w-full" />
          </SkeletonPanel>

          <SkeletonPanel header={false}>
            <Skeleton className="h-4 w-20" />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-20" />
            </div>
          </SkeletonPanel>
        </div>
      </div>
    </div>
  );
}

/**
 * Shaped like the quiz builder: details, then one question panel divided by
 * hairlines rather than a panel per question — that's how the real builder
 * reads as one paper instead of twenty documents. Three questions is a
 * guess; a saved quiz can hold far more, so this list is the part of the
 * screen most likely to grow once the real questions land.
 */
export function QuizEditorSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading quiz editor">
      <SkeletonHeading action={false} />

      <div className="space-y-5">
        <SkeletonPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-11 md:col-span-2" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </SkeletonPanel>

        <SkeletonPanel header={false} className="overflow-hidden p-0">
          <div className="divide-y divide-line">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="px-4 py-5 sm:px-6">
                <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-sq-sm" />
                  <Skeleton className="h-9 w-52" />
                  <div className="ml-auto flex items-center gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="mt-4 space-y-1.5">
                  {Array.from({ length: 4 }, (_, j) => (
                    <Skeleton key={j} className="h-11 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line bg-raise p-2.5 sm:px-4 sm:py-3">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-40" />
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

/**
 * The same builder as the edit screen, opened empty. A new quiz starts with a
 * single question, so this one is exact rather than a guess — the edit screen
 * has to estimate how many questions it is about to receive.
 */
export function NewQuizSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading quiz builder">
      <SkeletonHeading action={false} />

      <div className="space-y-5">
        <SkeletonPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-11 md:col-span-2" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </SkeletonPanel>

        <SkeletonPanel header={false} className="overflow-hidden p-0">
          <div className="px-4 py-5 sm:px-6">
            <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-sq-sm" />
              <Skeleton className="h-9 w-52" />
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="mt-4 space-y-1.5">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-11 w-full" />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line bg-raise p-2.5 sm:px-4 sm:py-3">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-40" />
          </div>
        </SkeletonPanel>
      </div>
    </div>
  );
}

/**
 * Shaped like the results screen: the score panel, the practice-your-weak-
 * spots panel before anything has been generated, then a run of answer
 * cards. Four cards is a guess — a quiz can have far more or fewer
 * questions than that, so this list is where the real page is most likely
 * to end up taller or shorter than its placeholder.
 */
export function QuizResultsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading results">
      <div>
        <Skeleton className="h-3.5 w-32" />
      </div>

      <div className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <Skeleton className="h-3 w-24" />
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Skeleton className="h-16 w-36" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="mt-5 h-1.5 w-full rounded-full sm:w-72" />
          </div>
          <Skeleton className="h-16 w-44 rounded-sq-lg" />
        </div>
      </div>

      {/* The practice panel's header is real from the moment the page loads,
          but its body only exists once a practice quiz has been generated —
          so unlike every other panel here, this one gets no placeholder body. */}
      <div className="panel p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-2.5 h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-40 shrink-0" />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <Skeleton className="h-5 w-56" />
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonPanel key={i}>
            <SkeletonText lines={2} />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }, (_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </SkeletonPanel>
        ))}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Skeleton className="h-13 w-32" />
        <Skeleton className="h-13 w-36" />
      </div>
    </div>
  );
}

/**
 * Shaped like the PDF import screen: back link, heading, the dropzone panel
 * in its resting state, the details panel, then the submit button on its
 * own row. The amber "running on the local provider" notice only shows up
 * without an AI key configured, so it isn't reserved space here.
 */
export function ImportSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading PDF import">
      <div>
        <Skeleton className="h-3.5 w-24" />
      </div>

      <SkeletonHeading action={false} />

      <div className="space-y-5">
        <SkeletonPanel action>
          <div className="rounded-sq-lg border-2 border-dashed border-line p-6 text-center sm:p-8">
            <Skeleton className="mx-auto h-12 w-12" />
            <Skeleton className="mx-auto mt-4 h-4 w-56 max-w-full" />
            <Skeleton className="mx-auto mt-2 h-3 w-72 max-w-full" />
            <Skeleton className="mx-auto mt-4 h-11 w-32" />
          </div>
        </SkeletonPanel>

        <SkeletonPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
          <Skeleton className="mt-4 h-3.5 w-40" />
        </SkeletonPanel>

        <div className="flex justify-end">
          <Skeleton className="h-13 w-40" />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- community */

/**
 * Shaped like the communities index: the heading and its "New community"
 * button, the tab/search toolbar, then the grid of community tiles. The tiles
 * get their own shape rather than the generic tile from the kit because the
 * real card leads with an icon chip next to the name, not just a title line.
 */
export function CommunitiesIndexSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading communities">
      <SkeletonHeading />

      {/* Toolbar: tab pills on the left, search/join box taking the rest */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div
          className="inline-flex gap-1 rounded-sq border border-line bg-raise p-1.5"
          aria-hidden="true"
        >
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="w-full sm:ml-auto sm:w-auto" aria-hidden="true">
          <Skeleton className="h-11 w-full sm:w-56" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CommunityTileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CommunityTileSkeleton() {
  return (
    <div className="panel flex flex-col p-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-9 w-9 shrink-0" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Shaped like a community's inside — the deeper of the two states this route
 * can render, and the one worth matching since the outsider view (a single
 * join prompt) is short enough that any placeholder covers it without a jump.
 * Back link, name and its badge row, then the two columns: what the
 * community has made and its discussion on the wide side, who runs it on the
 * rail.
 */
export function CommunityDetailSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading community">
      <div aria-hidden="true">
        <Skeleton className="h-4 w-32" />
      </div>

      <div aria-hidden="true">
        <Skeleton className="h-9 w-64 max-w-full" />
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <SkeletonPanel action>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }, (_, i) => (
                <ResourceRowSkeleton key={i} />
              ))}
            </div>
          </SkeletonPanel>

          <section className="min-w-0" aria-hidden="true">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="space-y-5">
              <div className="panel p-5" aria-hidden="true">
                <Skeleton className="h-24 w-full" />
                <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>

              <div className="panel divide-y divide-line overflow-hidden" aria-hidden="true">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex items-start gap-3 p-5">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                      <Skeleton className="mt-2.5 h-3.5 w-full" />
                      <Skeleton className="mt-1.5 h-3.5 w-2/3" />
                      <Skeleton className="mt-2.5 h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="panel p-6" aria-hidden="true">
            <Skeleton className="mb-5 h-4 w-32" />
            <div className="-mx-2">
              {Array.from({ length: 5 }, (_, i) => (
                <MemberRowSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Community Wars + Membership now share one hairline-divided
              panel on the real page, so their skeleton does too. */}
          <div className="panel overflow-hidden p-0" aria-hidden="true">
            <div className="p-6">
              <Skeleton className="h-4 w-32" />
              <div className="mt-3">
                <SkeletonText lines={2} />
              </div>
            </div>
            <div className="border-t border-line p-6">
              <Skeleton className="h-4 w-28" />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Matches a shared-material row: type icon, title, meta line, type badge. */
function ResourceRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-sq border border-line bg-raise p-3.5" aria-hidden="true">
      <Skeleton className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
    </div>
  );
}

/** Matches a member row: avatar, name, and an optional role badge. */
function MemberRowSkeleton() {
  return (
    <div className="flex min-h-11 items-center gap-3 px-2 py-2" aria-hidden="true">
      <Skeleton className="h-[30px] w-[30px] shrink-0 rounded-full" />
      <Skeleton className="h-3.5 flex-1" />
      <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
    </div>
  );
}

/* -------------------------------------------------------------- account etc */

/**
 * Shaped like Settings: the account figures, then the stack of panels below
 * them in the order they actually load — picture, details, password, plan.
 * The plan panel gets its own row shape rather than `SkeletonRows` because a
 * limit reads left-to-right (label and detail, then the figure it allows),
 * not as a list of clickable things.
 */
export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8" aria-busy="true" aria-label="Loading settings">
      <SkeletonHeading action={false} />

      <SkeletonStatStrip count={4} />

      {/* Avatar, details and password — one group on the real page now, so
          they're spaced tighter here than the gap to the overview above or
          the plan panel below. */}
      <div className="space-y-5">
        {/* Profile picture */}
        <SkeletonPanel>
          <div className="flex flex-wrap items-center gap-5" aria-hidden="true">
            <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-full" />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-36" />
              </div>
              <Skeleton className="mt-2.5 h-3 w-44" />
            </div>
          </div>
        </SkeletonPanel>

        {/* Your details — title only, no subtitle in the real panel */}
        <div className="panel p-6" aria-hidden="true">
          <Skeleton className="mb-5 h-4 w-28" />
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="mt-2 h-11 w-full" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <Skeleton className="h-11 w-36" />
          </div>
        </div>

        {/* Password */}
        <SkeletonPanel>
          <div aria-hidden="true">
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i}>
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-2 h-11 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end border-t border-line pt-5">
              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        </SkeletonPanel>
      </div>

      {/* Your plan */}
      <SkeletonPanel action>
        <ul className="-mt-1 divide-y divide-line" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5">
              <div className="min-w-0">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-1.5 h-3 w-52" />
              </div>
              <Skeleton className="h-3.5 w-20 shrink-0" />
            </li>
          ))}
        </ul>
      </SkeletonPanel>

      <div className="flex justify-center" aria-hidden="true">
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>
    </div>
  );
}

/**
 * Shaped like the plan comparison: back link, heading, the two plan cards
 * merged into one divided card, then the feature table with its "what
 * premium doesn't do" footnote sharing that same panel, then the dev switch.
 * The table uses the real row count (13 — the length of the ROWS list on the
 * page) so the comparison doesn't grow taller once it lands.
 */
export function PlanSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8" aria-busy="true" aria-label="Loading plans">
      <div aria-hidden="true">
        <Skeleton className="h-4 w-24" />
      </div>

      <SkeletonHeading action={false} />

      {/* Free + Premium now share one hairline-divided card on the real page. */}
      <div className="panel grid divide-line p-0 md:grid-cols-2 md:divide-x" aria-hidden="true">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className={cn("flex flex-col p-6", i === 1 && "border-t border-line md:border-t-0")}>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2.5 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
            <div className="mt-auto pt-5">
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* The comparison table and its footnote share one panel on the real
          page now, so the table no longer gets its own shared SkeletonTable
          box — this hand-rolls the same row shape so the two can sit under
          one hairline instead of two stacked panels. */}
      <div className="panel overflow-hidden p-0" aria-hidden="true">
        <div className="flex items-center gap-4 border-b border-line px-6 py-3.5">
          <Skeleton className="h-3 w-2/5" />
          <div className="ml-auto flex gap-6">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        {Array.from({ length: 13 }, (_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-t border-line px-6 py-3.5 first:border-t-0"
          >
            <Skeleton className="h-3.5 w-3/5" />
            <div className="ml-auto flex gap-6">
              <Skeleton className="h-3.5 w-6" />
              <Skeleton className="h-3.5 w-10" />
            </div>
          </div>
        ))}

        <div className="border-t border-line p-6">
          {/* "What premium doesn't do" — a quiet real heading now, not a kicker. */}
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 divide-y divide-line">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <Skeleton className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Development plan switch */}
      <div
        className="relative overflow-hidden rounded-sq border border-line bg-surface py-3.5 pl-5 pr-4"
        aria-hidden="true"
      >
        <span className="absolute inset-y-0 left-0 w-1 bg-line-strong" aria-hidden="true" />
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="mt-2.5 h-3 w-full max-w-md" />
        <Skeleton className="mt-1.5 h-3 w-2/3 max-w-md" />
        <Skeleton className="mt-3.5 h-9 w-36" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ streak, daily */

/**
 * Shaped like the streak page, section for section: the flame hero, the
 * figures, the calendar next to the multiplier ladder, then the how-it-works
 * cards. The calendar draws the full 10-week, 7-day grid up front rather than
 * a generic block, because a grid of squares that suddenly appears where a
 * rectangle was is exactly the kind of jump this file exists to prevent. The
 * ladder draws all twenty-one rungs for the same reason.
 */
export function StreakSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading streak">
      {/* Hero */}
      <section className="panel relative overflow-hidden" aria-hidden="true">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-0">
          <div className="flex items-center gap-5 sm:gap-6 lg:pr-10">
            <Skeleton className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
            <div className="min-w-0">
              <Skeleton className="h-14 w-24 sm:h-16 sm:w-28" />
              <Skeleton className="mt-3 h-4 w-28" />
              <Skeleton className="mt-3 h-5 w-40 rounded-full" />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 border-t border-line pt-6 lg:items-end lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="mt-2 h-3 w-36" />
            </div>
            <Skeleton className="h-11 w-44" />
          </div>
        </div>
      </section>

      {/* Figures */}
      <SkeletonStatStrip count={4} />

      {/* Calendar + multiplier ladder, merged into one hairline-divided panel
          to match the real page. */}
      <div className="panel p-0" aria-hidden="true">
        <div className="grid divide-line lg:grid-cols-[1.4fr_1fr] lg:divide-x">
          {/* Calendar */}
          <div className="border-b border-line p-6 lg:border-b-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2.5 h-3 w-56 max-w-full" />

            <div className="mt-5 flex gap-1 overflow-x-auto pb-2 sm:gap-1.5">
              {Array.from({ length: 10 }, (_, week) => (
                <div key={week} className="flex flex-col gap-1 sm:gap-1.5">
                  {Array.from({ length: 7 }, (_, day) => (
                    <Skeleton key={day} className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-3 w-20" />
              ))}
            </div>
          </div>

          {/* Multiplier ladder */}
          <div className="p-6">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-2.5 h-3 w-40" />

            <div className="mb-4 mt-5">
              <div className="mb-1.5 flex justify-between">
                <Skeleton className="h-3 w-9" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            <Skeleton className="mb-4 h-11 w-full rounded-sq" />

            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 21 }, (_, i) => (
                <li key={i} className="rounded-sq-sm border border-line px-2 py-2">
                  <Skeleton className="h-2.5 w-10" />
                  <Skeleton className="mt-1.5 h-4 w-8" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* How it works — a plain section now, not a shadowed panel, to match
          the real page's demotion of this to reference material. The heading
          is a quiet real heading rather than a kicker, hence h-4 not h-3. */}
      <section aria-hidden="true">
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-sq border border-line bg-raise p-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="mt-3 h-3.5 w-32" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Shaped like the daily runner with questions to answer — the case worth
 * protecting, since the "nothing to draw from yet" empty state is a single
 * `EmptyState` box that can't jump far. A streak-and-progress banner above a
 * stack of question panels, each already the height a question card actually
 * takes, so the page doesn't grow as the real questions drop in.
 */
export function DailySkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" aria-busy="true" aria-label="Loading daily quiz">
      <SkeletonHeading action={false} />

      <div
        className="panel flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-6"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-44" />
          </div>
        </div>
        <div className="min-w-48 flex-1">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="mt-2 ml-auto h-3 w-24" />
        </div>
      </div>

      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="panel p-5 sm:p-6" aria-hidden="true">
          <div className="mb-3.5 flex items-center gap-2.5">
            <Skeleton className="h-7 w-7 shrink-0" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-[52px] w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- test feedback */

/**
 * Shaped like Test feedback: the heading, then the upload form beside the
 * list of past analyses. The dropzone keeps its own dashed box because that
 * border is what tells someone that a bare rectangle is a place to drop a
 * file, not a paragraph that hasn't rendered yet.
 */
export function TestFeedbackSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading test feedback">
      <SkeletonHeading action={false} />

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="panel p-6" aria-hidden="true">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2.5 h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-3.5 w-20 shrink-0" />
          </div>

          <Skeleton className="mb-4 h-1.5 w-full rounded-full" />

          <div className="rounded-sq-lg border-2 border-dashed border-line-strong bg-raise px-5 py-8 text-center sm:px-8">
            <Skeleton className="mx-auto h-12 w-12" />
            <Skeleton className="mx-auto mt-4 h-4 w-56 max-w-full" />
            <Skeleton className="mx-auto mt-2 h-3 w-64 max-w-full" />
            <Skeleton className="mx-auto mt-5 h-11 w-32" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2 h-11 w-full" />
            </div>
            <div>
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="mt-2 h-11 w-full" />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <Skeleton className="h-13 w-36" />
          </div>
        </div>

        <div className="panel p-6" aria-hidden="true">
          <Skeleton className="mb-5 h-4 w-32" />
          <SkeletonRows count={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * Shaped like a finished report — the far more common case than the "still
 * working" or "failed" states, which are both a single short `Alert` and
 * never the thing worth protecting against a layout jump. Lede with the score
 * box, the two mirrored findings, the topic table, then the practice tray.
 */
export function SubmissionSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading test analysis">
      <div aria-hidden="true">
        <Skeleton className="h-4 w-28" />
      </div>

      <div aria-hidden="true">
        <Skeleton className="h-9 w-72 max-w-full" />
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-36" />
        </div>
      </div>

      {/* Lede */}
      <div className="panel relative overflow-hidden p-6" aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 max-w-3xl flex-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-3 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-5/6" />
            <Skeleton className="mt-2 h-3.5 w-2/3" />
          </div>
          <div className="shrink-0 rounded-sq border border-line bg-raise px-5 py-3">
            <Skeleton className="ml-auto h-8 w-16" />
            <Skeleton className="ml-auto mt-1.5 h-3 w-14" />
          </div>
        </div>
      </div>

      {/* Findings, mirrored */}
      <div className="grid gap-5 md:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 2 }, (_, col) => (
          <div key={col} className="panel p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2.5 h-3 w-48" />
            <div className="mt-5 space-y-2.5">
              {Array.from({ length: 2 }, (_, row) => (
                <div key={row} className="rounded-sq border border-line bg-raise py-3 pl-4 pr-3.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Topic by topic */}
      <div className="panel p-6" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <ul className="mt-5 divide-y divide-line">
          {Array.from({ length: 4 }, (_, i) => (
            <li
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(6rem,13rem)_auto]"
            >
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20 justify-self-end sm:order-3" />
              <Skeleton className="col-span-2 h-1.5 w-full rounded-full sm:order-2 sm:col-span-1" />
            </li>
          ))}
        </ul>
      </div>

      {/* Practice tray */}
      <div className="rounded-sq-lg border border-line bg-sunken p-6" aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="mt-2.5 h-3 w-full max-w-md" />
          </div>
          <Skeleton className="h-9 w-32 shrink-0" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- shared shapes */

/**
 * The study shell — Cram, Smart and the timed quiz runner all land in it.
 * The shape itself lives in the primitive kit as `SkeletonStudyCard`, built
 * from the flip card's own measurements; re-exported here under its route
 * name so every study route can import from this one file too. Each caller
 * still wraps it with its own `aria-label` rather than that living here —
 * "Cram Mode" and "Smart Mode" are not interchangeable to someone listening
 * rather than looking, and baking one label in would speak over the other two.
 */
export const StudySkeleton = SkeletonStudyCard;

/**
 * The `ComingSoon` door — Arena's three modes, Character, Leaderboard and
 * Rank. The shape is defined in `components/game/coming-soon-skeleton`
 * because it stands in for a real game component of the same name, not for
 * a `loading.tsx`; re-exported here so those six routes, and the matcher
 * below, can both reach it through this file. Same reasoning as
 * `StudySkeleton` keeps its `aria-label` out of this component too.
 */
export { ComingSoonSkeleton };

/**
 * The catch-all for any route above without a bespoke shape, and for any
 * `(app)` route not in this file at all. Defined in the primitive kit;
 * re-exported here so the root `(app)/loading.tsx` and the matcher's
 * fallback both reach it through this one file as well.
 */
export { SkeletonPage };

/* -------------------------------------------------------------- the matcher */

/**
 * Route patterns in match order, most specific first.
 *
 * That order is load-bearing, not cosmetic. A handful of routes differ from
 * a wildcard sibling only by a literal segment — "new" or "import" is a
 * perfectly valid match for "any id" as far as `[^/]+` is concerned, so
 * `/flashcards/new` would render the set-detail shape instead of the editor
 * if the wildcard route got a turn first. Listing the literal routes ahead
 * of their wildcard parents makes them win that race instead. Multi-segment
 * routes (`/flashcards/:id/edit`) are listed ahead of their single-segment
 * parent (`/flashcards/:id`) on the same principle, belt-and-braces: today's
 * wildcard is anchored tightly enough not to need it, but the ordering is
 * what stops a future looser regex from reintroducing the bug silently.
 */
const ROUTES: Array<[RegExp, () => ReactNode]> = [
  // flashcards -----------------------------------------------------------
  [/^\/flashcards\/new$/, () => <NewSetSkeleton />],
  [/^\/flashcards\/[^/]+\/edit$/, () => <SetEditorSkeleton />],
  [/^\/flashcards\/[^/]+\/(?:cram|smart)$/, () => <StudySkeleton />],
  [/^\/flashcards\/[^/]+$/, () => <SetDetailSkeleton />],
  [/^\/flashcards$/, () => <LibraryIndexSkeleton />],

  // quizzes ----------------------------------------------------------------
  [/^\/quizzes\/new$/, () => <NewQuizSkeleton />],
  [/^\/quizzes\/import$/, () => <ImportSkeleton />],
  [/^\/quizzes\/[^/]+\/edit$/, () => <QuizEditorSkeleton />],
  [/^\/quizzes\/[^/]+\/attempt$/, () => <StudySkeleton />],
  [/^\/quizzes\/[^/]+\/results\/[^/]+$/, () => <QuizResultsSkeleton />],
  [/^\/quizzes\/[^/]+$/, () => <QuizDetailSkeleton />],
  [/^\/quizzes$/, () => <QuizLibraryIndexSkeleton />],

  // communities --------------------------------------------------------------
  [/^\/communities\/[^/]+$/, () => <CommunityDetailSkeleton />],
  [/^\/communities$/, () => <CommunitiesIndexSkeleton />],

  // settings -----------------------------------------------------------------
  [/^\/settings\/plan$/, () => <PlanSkeleton />],
  [/^\/settings$/, () => <SettingsSkeleton />],

  // test feedback --------------------------------------------------------
  [/^\/test-feedback\/[^/]+$/, () => <SubmissionSkeleton />],
  [/^\/test-feedback$/, () => <TestFeedbackSkeleton />],

  // single-shape routes --------------------------------------------------
  [/^\/dashboard$/, () => <DashboardSkeleton />],
  [/^\/daily$/, () => <DailySkeleton />],
  [/^\/streak$/, () => <StreakSkeleton />],

  // arena ----------------------------------------------------------------
  [/^\/arena$/, () => <ArenaSkeleton />],
  [/^\/arena\/battle\/[^/]+$/, () => <BattleSkeleton />],
  [/^\/arena\/results\/[^/]+$/, () => <ProfileSkeleton />],
  [/^\/character$/, () => <CharacterSkeleton />],
  [/^\/leaderboard$/, () => <LeaderboardSkeleton />],
  [/^\/rank$/, () => <RankSkeleton />],
  [/^\/u\/[^/]+$/, () => <ProfileSkeleton />],

  // static doors with nothing behind them to fetch ------------------------
  [/^\/arena\/wars$/, () => <ComingSoonSkeleton />],
];

/**
 * Which shape a pathname's destination will render.
 *
 * Pass a bare pathname — `/flashcards/abc123/cram`, no query string, no
 * origin — and get back the element to paint immediately, before the real
 * route has fetched anything. Falls back to the page-level shape for any
 * `(app)` route above that has never earned a bespoke one of its own, same
 * as the root `loading.tsx` does today.
 */
export function skeletonForPath(pathname: string): ReactNode {
  for (const [pattern, render] of ROUTES) {
    if (pattern.test(pathname)) return render();
  }
  return <SkeletonPage />;
}
