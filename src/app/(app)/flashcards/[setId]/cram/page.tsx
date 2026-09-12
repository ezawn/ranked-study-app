import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getViewableSet } from "@/server/services/flashcards";
import { startOrResumeCram } from "@/server/services/study";
import { CramSession } from "@/components/flashcards/cram-session";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { CardsIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Cram Mode" };
export const dynamic = "force-dynamic";

export default async function CramModePage({ params }: { params: Promise<{ setId: string }> }) {
  const user = await requireUser();
  const { setId } = await params;

  const set = await getViewableSet(user.id, setId).catch(() => null);
  if (!set) notFound();

  if (set.cards.length === 0) {
    return (
      <EmptyState
        icon={<CardsIcon size={22} />}
        title="This set has no cards yet"
        description="Add some cards and Cram Mode will have something to work with."
        action={<ButtonLink href={`/flashcards/${set.id}/edit`}>Add cards</ButtonLink>}
      />
    );
  }

  const session = await startOrResumeCram(user.id, setId);

  return <CramSession setId={set.id} setTitle={set.title} initial={session} />;
}
