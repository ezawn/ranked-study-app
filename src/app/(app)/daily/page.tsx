import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { getDailyQuiz } from "@/server/services/daily-quiz";
import { SectionHeading } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { DailyRunner } from "@/components/daily/daily-runner";
import { CalendarIcon, PlusIcon, SparkIcon } from "@/components/icons";
import { DAILY_QUIZ } from "@/lib/coins/rules";

export const metadata: Metadata = { title: "Daily quiz" };
export const dynamic = "force-dynamic";

export default async function DailyQuizPage() {
  const user = await requireUser();
  const daily = await getDailyQuiz(user.id, user.timezone);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeading
        title="Daily quiz"
        subtitle={`${DAILY_QUIZ.minQuestions}–${DAILY_QUIZ.maxQuestions} questions pulled from quizzes you made or saved. Attempting it keeps your streak alive — even if you get everything wrong.`}
      />

      {daily.noSourceMaterial ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="Nothing to draw from yet"
          description="The daily quiz uses multiple-choice questions from your own quizzes and any you've saved from Discover. Make one or save one and tomorrow's quiz will have material."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/quizzes/new" icon={<PlusIcon size={16} />}>
                Build a quiz
              </ButtonLink>
              <ButtonLink href="/quizzes/import" variant="secondary" icon={<SparkIcon size={16} />}>
                PDF → quiz
              </ButtonLink>
              <ButtonLink href="/quizzes?tab=discover" variant="ghost">
                Browse Discover
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <DailyRunner
          questions={daily.questions}
          streak={daily.streak}
          multiplier={daily.multiplier}
          initialResult={daily.result}
        />
      )}
    </div>
  );
}
