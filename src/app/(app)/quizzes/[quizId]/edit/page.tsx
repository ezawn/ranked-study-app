import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getOwnedQuiz } from "@/server/services/quizzes";
import { SectionHeading } from "@/components/ui/panel";
import { QuizBuilder } from "@/components/quizzes/quiz-builder";

export const metadata: Metadata = { title: "Edit quiz" };

export default async function EditQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  const user = await requireUser();
  const { quizId } = await params;

  const quiz = await getOwnedQuiz(user.id, quizId).catch(() => null);
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading title="Edit quiz" subtitle="Past attempts keep the marks they were given." />
      <QuizBuilder
        quizId={quiz.id}
        initial={{
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          questions: quiz.questions.map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            marks: q.marks,
            markScheme: q.markScheme,
            explanation: q.explanation,
            imageKey: q.imageKey,
            options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
          })),
        }}
      />
    </div>
  );
}
