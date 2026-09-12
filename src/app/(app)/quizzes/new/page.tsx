import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { SectionHeading } from "@/components/ui/panel";
import { QuizBuilder } from "@/components/quizzes/quiz-builder";

export const metadata: Metadata = { title: "New quiz" };

export default async function NewQuizPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading
        title="New quiz"
        subtitle="Multiple choice is marked instantly. Written answers go to the AI marker — and you can overrule it."
      />
      <QuizBuilder />
    </div>
  );
}
