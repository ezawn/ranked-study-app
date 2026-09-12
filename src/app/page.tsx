import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

/**
 * The front door.
 *
 * Signed out, the first thing anyone sees is the sign-in page, as specified.
 */
export default async function RootPage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/sign-in");
}
