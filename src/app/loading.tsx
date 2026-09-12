import { Skeleton } from "@/components/ui/feedback";

/**
 * Route-transition fallback.
 *
 * Shaped like the page it stands in for — a title, a row of figures, then
 * content — so the layout does not jump when the real thing arrives. A lone
 * spinner tells you nothing about what is coming.
 */
export default function Loading() {
  return (
    <div className="animate-rise" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
