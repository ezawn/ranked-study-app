import { StudySkeleton } from "@/components/ui/route-skeletons";

/**
 * The runner's own chrome — the timer bar, the numbered question strip, the
 * answer panel — all lands inside the same shell as a flashcard study
 * screen, so it borrows that shape rather than getting a bespoke one.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading quiz">
      <StudySkeleton />
    </div>
  );
}
