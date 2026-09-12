import { redirect } from "next/navigation";

/**
 * The Arena used to split Study 1v1 into casual and ranked doors, both locked.
 * There is one ranked mode now, at /arena. This route stays so an old link or
 * a bookmark still lands somewhere useful rather than on a 404.
 */
export default function Page() {
  redirect("/arena");
}
