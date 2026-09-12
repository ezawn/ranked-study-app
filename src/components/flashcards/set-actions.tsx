"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { GlobeIcon, LockIcon, TrashIcon } from "@/components/icons";
import { deleteSetAction, setVisibilityAction } from "@/server/actions/flashcards";

export function SetActions({
  setId,
  isPublic,
  cardCount,
}: {
  setId: string;
  isPublic: boolean;
  cardCount: number;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState<"visibility" | "delete" | null>(null);
  const [publicNow, setPublicNow] = useState(isPublic);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function toggleVisibility() {
    setPending("visibility");
    const result = await setVisibilityAction(setId, !publicNow);
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setPublicNow(result.data.isPublic);
    toast.success(
      result.data.isPublic ? "Published to Discover" : "Set is private again",
      result.data.isPublic ? "Anyone can find and save a copy of it now." : undefined,
    );
    router.refresh();
  }

  async function remove() {
    setPending("delete");
    const result = await deleteSetAction(setId);
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Set deleted");
    navigate("/flashcards");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={toggleVisibility}
        disabled={pending !== null || (!publicNow && cardCount < 4)}
        title={!publicNow && cardCount < 4 ? "Sets need at least 4 cards to publish" : undefined}
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

      {confirmingDelete ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-sq border border-rose/30 bg-rose/10 py-1 pl-3 pr-1">
          <span className="text-[13px] font-medium text-rose">Delete this set?</span>
          <Button variant="danger" size="sm" onClick={remove} disabled={pending !== null}>
            {pending === "delete" ? <Spinner /> : null}
            Yes, delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
            Keep
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmingDelete(true)}
          className="hover:bg-rose/10 hover:text-rose"
          icon={<TrashIcon size={14} />}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
