import { StudySkeleton } from "@/components/ui/route-skeletons";

/**
 * Cram Mode's own chrome — the two pile counts, the meter, the flip card —
 * all sits inside the same shell as any study screen, so it borrows that
 * shape rather than getting a bespoke one. A set with no cards yet
 * short-circuits to an empty state before this would be on screen for long.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading Cram Mode">
      <StudySkeleton />
    </div>
  );
}
