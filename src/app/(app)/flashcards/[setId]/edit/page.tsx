import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getOwnedSet } from "@/server/services/flashcards";
import { SectionHeading } from "@/components/ui/panel";
import { SetEditor } from "@/components/flashcards/set-editor";

export const metadata: Metadata = { title: "Edit set" };

export default async function EditSetPage({ params }: { params: Promise<{ setId: string }> }) {
  const user = await requireUser();
  const { setId } = await params;

  const set = await getOwnedSet(user.id, setId).catch(() => null);
  if (!set) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading
        title="Edit set"
        subtitle="Cards you keep hold on to their review history — editing won't reset your progress."
      />
      <SetEditor
        setId={set.id}
        initial={{
          title: set.title,
          description: set.description,
          subject: set.subject,
          cards: set.cards.map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            hint: c.hint,
            frontImageKey: c.frontImageKey,
            backImageKey: c.backImageKey,
          })),
        }}
      />
    </div>
  );
}
