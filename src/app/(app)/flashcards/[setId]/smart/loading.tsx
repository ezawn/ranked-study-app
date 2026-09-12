import { StudySkeleton } from "@/components/ui/route-skeletons";

/**
 * Same shell as Cram — Smart Mode is a queue through the same flip card,
 * just ordered by the spacing algorithm instead of by two piles.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading Smart Mode">
      <StudySkeleton />
    </div>
  );
}
