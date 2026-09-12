import {
  Skeleton,
  SkeletonHeading,
  SkeletonPanel,
  SkeletonRows,
  SkeletonStatStrip,
} from "@/components/ui/skeleton";

/**
 * Arena loading shapes.
 *
 * Each one is built from the measurements of the page it stands in for, so the
 * content lands in the box the skeleton was already holding. A skeleton that
 * does not occupy the same space as the real thing is decoration — the page
 * still jumps, and a spinner would have been more honest.
 */

export function ArenaSkeleton() {
  return (
    <div className="space-y-7">
      <SkeletonHeading action={false} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* The "ready to play" card: copy block, then the button. */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-13 w-40 rounded-sq" />
          </div>

          <SkeletonStatStrip />

          <div>
            <Skeleton className="mb-4 h-6 w-44" />
            <SkeletonRows count={4} />
          </div>
        </div>

        <div className="space-y-6">
          <SkeletonPanel />
          <div className="card p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mx-auto mt-5 h-[168px] w-[168px] rounded-full" />
            <Skeleton className="mt-5 h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CharacterSkeleton() {
  return (
    <div className="space-y-7">
      <SkeletonHeading action={false} />

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-sq" />
        </div>
        <Skeleton className="mx-auto mt-6 h-[300px] w-[300px] rounded-full" />
      </div>

      <div>
        <Skeleton className="mb-4 h-6 w-20" />
        {/* The category tabs. */}
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-sq" />
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-sq-card border border-line p-3">
                <Skeleton className="h-[62px] w-[62px] rounded-full" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <SkeletonPanel />
        </div>
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-7">
      <SkeletonHeading action={false} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-sq" />
          <Skeleton className="h-11 w-32 rounded-sq" />
        </div>
        <Skeleton className="h-11 w-full rounded-sq sm:w-72" />
      </div>

      <div className="card card-plain p-0">
        <div className="border-b border-line px-5 py-2.5">
          <Skeleton className="h-3.5 w-full max-w-md" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 flex-1 max-w-48" />
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankSkeleton() {
  return (
    <div className="space-y-7">
      <SkeletonHeading action={false} />

      <div className="card p-6">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <Skeleton className="mt-4 h-4 w-full max-w-lg" />
      </div>

      <SkeletonStatStrip />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Skeleton className="mb-4 h-6 w-32" />
          <SkeletonRows count={5} badge={false} />
        </div>
        <div>
          <Skeleton className="mb-4 h-6 w-28" />
          <SkeletonRows count={8} badge={false} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-7">
      <SkeletonHeading />

      <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="card p-6">
            <Skeleton className="mx-auto h-[236px] w-[236px] rounded-full" />
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>
          <SkeletonPanel />
        </div>

        <div className="space-y-6">
          <SkeletonStatStrip />
          <div>
            <Skeleton className="mb-4 h-6 w-40" />
            <SkeletonRows count={6} badge={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The battle. Shaped like the scoreboard and the question card above it. */
export function BattleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="card card-plain p-0">
        <div className="grid grid-cols-3 divide-x divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-4">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <Skeleton className="h-6 w-3/4" />
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-sq" />
          ))}
        </div>
      </div>
    </div>
  );
}
