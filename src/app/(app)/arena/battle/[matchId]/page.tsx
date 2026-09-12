import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { matchState } from "@/server/services/arena/match";
import { Battle } from "@/components/arena/battle";

export const metadata: Metadata = { title: "Battle" };
export const dynamic = "force-dynamic";

/**
 * The battle page.
 *
 * Membership is checked here, on the server, before the client component
 * mounts — a match id in the URL is not a way to watch somebody else's game.
 * A finished match redirects to its results rather than rendering a battle
 * that has already been scored.
 */
export default async function BattlePage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const user = await requireUser();

  const state = await matchState(matchId, user.id);
  if (!state) notFound();

  if (state.status === "complete") redirect(`/arena/results/${matchId}`);
  if (state.status === "abandoned") redirect("/arena");

  return (
    <div className="mx-auto max-w-3xl">
      <Battle matchId={matchId} />
    </div>
  );
}
