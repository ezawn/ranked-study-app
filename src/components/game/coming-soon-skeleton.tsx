import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stands in for `ComingSoon`.
 *
 * Six routes render that same door — Arena's three modes, Character,
 * Leaderboard and Rank — and every one of them is a static component with no
 * data fetch behind it, so this shape is shared rather than copied six times.
 * If the plate ever grows a real fetch (matchmaking status, a live board), the
 * six `loading.tsx` files that already point here start earning their keep
 * without any of them changing.
 */
export function ComingSoonSkeleton() {
  return (
    <div className="mx-auto max-w-3xl" aria-hidden="true">
      <div className="panel overflow-hidden p-0">
        {/* The plate */}
        <div className="border-b border-line bg-sunken px-5 py-12 text-center sm:px-10 sm:py-14">
          <Skeleton className="mx-auto h-20 w-20 rounded-sq-lg" />
          <Skeleton className="mx-auto mt-5 h-5 w-32 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-8 w-64 max-w-full" />
          <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" />
          <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-md" />
        </div>

        {/* What's behind it */}
        <div className="px-5 py-8 sm:px-10 sm:py-9">
          <ul className="mx-auto max-w-lg divide-y divide-line">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="flex items-start gap-3 py-3">
                <Skeleton className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sq-sm" />
                <Skeleton className="h-3.5 w-full" />
              </li>
            ))}
          </ul>

          <Skeleton className="mx-auto mt-7 h-11 w-full max-w-lg rounded-sq" />

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
