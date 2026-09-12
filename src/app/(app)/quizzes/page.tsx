import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { listMyQuizzes, listPublicQuizzes } from "@/server/services/quizzes";
import { SectionHeading } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";
import { SearchInput } from "@/components/ui/search-input";
import { QuizTile } from "@/components/quizzes/quiz-tile";
import { DiscoverQuizzes } from "@/components/quizzes/discover-quizzes";
import { GlobeIcon, PlusIcon, QuizIcon, SparkIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Quizzes" };
export const dynamic = "force-dynamic";

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const tab = params.tab === "discover" ? "discover" : "mine";
  const query = params.q?.trim() || undefined;

  const [mine, publicQuizzes] = await Promise.all([
    listMyQuizzes(user.id, { query }),
    tab === "discover" ? listPublicQuizzes(user.id, { query }) : Promise.resolve([]),
  ]);

  const suffix = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Quizzes"
        subtitle="Write them yourself, or drop in a PDF and let AI build one. Written answers get marked — and you can argue back."
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href="/quizzes/import"
              size="lg"
              variant="secondary"
              icon={<SparkIcon size={16} />}
            >
              PDF → quiz
            </ButtonLink>
            <ButtonLink href="/quizzes/new" size="lg" icon={<PlusIcon size={16} />}>
              New quiz
            </ButtonLink>
          </div>
        }
      />

      {/* Same toolbar shape as the flashcard library, because the two are the
          same kind of place and should be operated the same way. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          items={[
            {
              href: `/quizzes?tab=mine${suffix}`,
              label: "My quizzes",
              count: mine.length,
              active: tab === "mine",
            },
            { href: `/quizzes?tab=discover${suffix}`, label: "Discover", active: tab === "discover" },
          ]}
        />
        <SearchInput
          className="w-full sm:ml-auto sm:w-auto sm:min-w-64 sm:flex-1"
          placeholder={tab === "discover" ? "Search public quizzes…" : "Search your quizzes…"}
        />
      </div>

      {tab === "discover" ? (
        publicQuizzes.length === 0 ? (
          <EmptyState
            icon={<GlobeIcon size={22} />}
            title={query ? "Nothing matched that" : "No public quizzes yet"}
            description={
              query
                ? "Try a broader search — subject names tend to work best."
                : "Publish one of yours and it'll show up here for everyone."
            }
          />
        ) : (
          <DiscoverQuizzes quizzes={publicQuizzes} />
        )
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<QuizIcon size={22} />}
          title={query ? "No quizzes matched that" : "No quizzes yet"}
          description="Build one question by question, turn a PDF into one automatically, or save someone else's from Discover."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/quizzes/new" icon={<PlusIcon size={16} />}>
                New quiz
              </ButtonLink>
              <ButtonLink href="/quizzes/import" variant="secondary" icon={<SparkIcon size={16} />}>
                PDF → quiz
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((quiz) => (
            <QuizTile key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
