"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CommunityIcon, ShieldIcon } from "@/components/icons";
import { joinCommunityAction, requestJoinAction } from "@/server/actions/communities";

/**
 * What a non-member sees.
 *
 * The inside of a community — its posts, its shared sets, its member list — is
 * never rendered here. That data is not fetched at all for someone who isn't a
 * member.
 *
 * Each of the three states is a composed panel rather than a bare message, so
 * being outside a community reads as a door rather than as a screen that
 * failed to load.
 */
export function CommunityJoinPrompt({
  communityId,
  slug,
  access,
  requestStatus,
}: {
  communityId: string;
  slug: string;
  access: "PUBLIC" | "PRIVATE" | "REQUEST";
  requestStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(requestStatus === "PENDING");

  async function join() {
    setPending(true);
    const result = await joinCommunityAction(communityId);
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    toast.success("You're in");
    navigate(`/communities/${slug}`);
    router.refresh();
  }

  async function request() {
    setPending(true);
    const result = await requestJoinAction(communityId, message.trim() || undefined);
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    setSent(true);
    toast.success("Request sent");
    router.refresh();
  }

  if (sent) {
    return (
      <Alert tone="violet" title="Your request is with the leader">
        You&apos;ll be able to see inside once they approve it.
      </Alert>
    );
  }

  if (requestStatus === "REJECTED") {
    return (
      <Panel className="px-6 py-12">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-sq border border-line bg-surface-2 text-accent">
            <ShieldIcon size={24} />
          </span>
          <h2 className="mt-5 font-display text-[19px] font-semibold tracking-[-0.02em] text-bright">
            That request was declined
          </h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">
            You can send another one if things have changed.
          </p>
          <div className="mt-6 w-full text-left">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Say why you'd like to join (optional)"
            />
            <Button className="mt-3 w-full sm:w-auto" onClick={request} disabled={pending}>
              {pending ? <Spinner /> : null}
              Ask again
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="px-6 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-sq border border-line bg-surface-2 text-accent">
          <CommunityIcon size={24} />
        </span>
        <h2 className="mt-5 font-display text-[19px] font-semibold tracking-[-0.02em] text-bright">
          {access === "PUBLIC" ? "You're not in this one yet" : "This community approves its members"}
        </h2>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">
          {access === "PUBLIC"
            ? "Join to see what's been shared and join the discussion."
            : "Send a request and the leader will decide. You'll see the shared sets and discussion once you're in."}
        </p>

        {access === "PUBLIC" ? (
          <Button className="mt-6" onClick={join} disabled={pending}>
            {pending ? <Spinner /> : null}
            Join community
          </Button>
        ) : (
          <div className="mt-6 w-full text-left">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Say why you'd like to join (optional)"
            />
            <Button className="mt-3 w-full sm:w-auto" onClick={request} disabled={pending}>
              {pending ? <Spinner /> : null}
              Ask to join
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
