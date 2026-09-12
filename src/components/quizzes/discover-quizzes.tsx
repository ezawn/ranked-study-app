"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Spinner } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CheckIcon, ClockIcon, DownloadIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { copyQuizAction } from "@/server/actions/quizzes";
import { formatDuration, truncate } from "@/lib/utils";

interface PublicQuiz {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  totalMarks: number;
  questionCount: number;
  downloads: number;
  timeLimitSeconds: number;
  alreadySaved: boolean;
  owner: { name: string | null; username: string | null };
}

export function DiscoverQuizzes({ quizzes }: { quizzes: PublicQuiz[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {quizzes.map((quiz) => (
        <DiscoverQuizTile key={quiz.id} quiz={quiz} />
      ))}
    </div>
  );
}

function DiscoverQuizTile({ quiz }: { quiz: PublicQuiz }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(quiz.alreadySaved);

  async function save() {
    setSaving(true);
    const result = await copyQuizAction(quiz.id);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSaved(true);
    toast.success(
      "Saved to your quizzes",
      "Your own copy — it can earn coins 24 hours from now, and its questions feed your daily quiz.",
    );
    router.refresh();
  }

  return (
    <div className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-bright">
          <Link href={`/quizzes/${quiz.id}`} className="underline-offset-4 hover:underline">
            {truncate(quiz.title, 60)}
          </Link>
        </h3>

        {quiz.subject ? (
          <Badge tone="neutral" className="shrink-0">
            {truncate(quiz.subject, 18)}
          </Badge>
        ) : null}
      </div>

      {quiz.description ? (
        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
          {truncate(quiz.description, 110)}
        </p>
      ) : null}

      <div className="num mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
        <span>{quiz.questionCount} questions</span>
        <span aria-hidden="true">·</span>
        <span>{quiz.totalMarks} marks</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <ClockIcon size={11} /> {formatDuration(quiz.timeLimitSeconds)}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <DownloadIcon size={11} /> {quiz.downloads}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="min-w-0 truncate text-xs text-faint">
          by {quiz.owner.name ?? quiz.owner.username ?? "a student"}
        </span>

        {saved ? (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-lime">
            <CheckIcon size={13} /> Saved
          </span>
        ) : (
          <Button size="sm" variant="secondary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <DownloadIcon size={14} />}
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
