import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getViewableSet } from "@/server/services/flashcards";
import { getSmartQueue } from "@/server/services/study";
import { SmartSession } from "@/components/flashcards/smart-session";

export const metadata: Metadata = { title: "Smart Mode" };
export const dynamic = "force-dynamic";

export default async function SmartModePage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const user = await requireUser();
  const { setId } = await params;
  const { all } = await searchParams;

  const set = await getViewableSet(user.id, setId).catch(() => null);
  if (!set) notFound();

  const queue = await getSmartQueue(user.id, setId, { includeAll: all === "1" });

  return (
    <SmartSession
      setId={set.id}
      setTitle={set.title}
      cards={queue.cards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        hint: c.hint,
        frontImageKey: c.frontImageKey,
        backImageKey: c.backImageKey,
        isNew: c.isNew,
      }))}
    />
  );
}
