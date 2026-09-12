import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getAttemptResult } from "@/server/services/quiz-attempts";
import { QuizResults } from "@/components/quizzes/quiz-results";

export const metadata: Metadata = { title: "Quiz results" };
export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { quizId, attemptId } = await params;

  const attempt = await getAttemptResult(user.id, attemptId).catch(() => null);
  if (!attempt || attempt.quizId !== quizId) notFound();

  return (
    <QuizResults
      attemptId={attempt.id}
      quizId={attempt.quizId}
      quizTitle={attempt.quiz.title}
      isPremium={user.plan === "PREMIUM"}
      answers={attempt.answers}
      summary={{
        awardedMarks: attempt.awardedMarks,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        markedPercentage: attempt.markedPercentage,
        coinsAwarded: attempt.coinsAwarded,
        coinSkipReason: attempt.coinSkipReason,
        timeExpired: attempt.timeExpired,
        overrideCount: attempt.overrideCount,
        markingPending: attempt.markingStatus === "PENDING",
      }}
    />
  );
}
