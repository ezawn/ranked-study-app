import { ComingSoonSkeleton } from "@/components/ui/route-skeletons";

/**
 * Ranked duels are a static `ComingSoon` door with nothing behind it to fetch,
 * but the route still streams in on navigation, and a blank beat before a
 * page that never changes looks worse than one that eventually will.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading Study 1v1 — Ranked">
      <ComingSoonSkeleton />
    </div>
  );
}
