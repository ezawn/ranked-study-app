import { ComingSoonSkeleton } from "@/components/ui/route-skeletons";

/**
 * Community Wars is a static `ComingSoon` door with nothing behind it to
 * fetch, but the route still streams in on navigation, and a blank beat
 * before a page that never changes looks worse than one that eventually will.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading Community Wars">
      <ComingSoonSkeleton />
    </div>
  );
}
