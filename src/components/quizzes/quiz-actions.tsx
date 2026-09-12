"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { GlobeIcon, LockIcon, TrashIcon } from "@/components/icons";
import { deleteQuizAction, setQuizVisibilityAction } from "@/server/actions/quizzes";

export function QuizActions({
  quizId,
  isPublic,
  questionCount,
}: {
  quizId: string;
  isPublic: boolean;
  questionCount: number;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState<"visibility" | "delete" | null>(null);
  const [publicNow, setPublicNow] = useState(isPublic);
  const [confirming, setConfirming] = useState(false);

  async function toggle() {
    setPending("visibility");
    const result = await setQuizVisibilityAction(quizId, !publicNow);
    setPending(null);

    if (!result.ok) return toast.error(result.error);

    setPublicNow(result.data.isPublic);
    toast.success(
      result.data.isPublic ? "Published to Discover" : "Quiz is private again",
      result.data.isPublic ? "Anyone can find it and save their own copy." : undefined,
    );
    router.refresh();
  }

  async function remove() {
    setPending("delete");
    const result = await deleteQuizAction(quizId);
    setPending(null);

    if (!result.ok) return toast.error(result.error);

    toast.success("Quiz deleted");
    navigate("/quizzes");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={toggle}
        disabled={pending !== null || (!publicNow && questionCount < 3)}
        title={
          !publicNow && questionCount < 3 ? "Quizzes need at least 3 questions to publish" : undefined
        }
        icon={
          pending === "visibility" ? (
            <Spinner />
          ) : publicNow ? (
            <LockIcon size={14} />
          ) : (
            <GlobeIcon size={14} />
          )
        }
      >
        {publicNow ? "Make private" : "Publish"}
      </Button>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-sq border border-rose/30 bg-rose/10 py-1 pl-3 pr-1">
          <span className="text-[13px] font-medium text-rose">Delete this quiz?</span>
          <Button variant="danger" size="sm" onClick={remove} disabled={pending !== null}>
            {pending === "delete" ? <Spinner /> : null}
            Yes, delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Keep
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          className="hover:bg-rose/10 hover:text-rose"
          icon={<TrashIcon size={14} />}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
