import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { SectionHeading } from "@/components/ui/panel";
import { SetEditor } from "@/components/flashcards/set-editor";

export const metadata: Metadata = { title: "New flashcard set" };

export default async function NewSetPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading
        title="New flashcard set"
        subtitle="Build it card by card, or paste a whole list at once."
      />
      <SetEditor />
    </div>
  );
}
