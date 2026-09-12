import { ArenaSkeleton } from "@/components/arena/skeletons";

/** Shaped like the page behind it, so nothing jumps when the data lands. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading Study 1v1">
      <ArenaSkeleton />
    </div>
  );
}
