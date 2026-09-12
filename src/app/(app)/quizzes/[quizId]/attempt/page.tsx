import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { startAttempt } from "@/server/services/quiz-attempts";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { QUIZZES } from "@/lib/coins/rules";

export const metadata: Metadata = { title: "Taking quiz" };
export const dynamic = "force-dynamic";

export default async function AttemptPage({ params }: { params: Promise<{ quizId: string }> }) {
  const user = await requireUser();
  const { quizId } = await params;

  const attempt = await startAttempt(user.id, quizId).catch(() => null);
  if (!attempt) notFound();

  return (
    <QuizRunner
      attemptId={attempt.attemptId}
      quizId={attempt.quizId}
      quizTitle={attempt.quizTitle}
      totalMarks={attempt.totalMarks}
      questions={attempt.questions}
      secondsRemaining={attempt.secondsRemaining}
      savedAnswers={attempt.savedAnswers}
      coinEligible={attempt.totalMarks >= QUIZZES.minMarksForCoins}
    />
  );
}
