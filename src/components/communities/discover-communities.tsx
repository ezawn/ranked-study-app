"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { CheckIcon, CommunityIcon, GlobeIcon, ShieldIcon } from "@/components/icons";
import { joinCommunityAction, requestJoinAction } from "@/server/actions/communities";
import { truncate } from "@/lib/utils";

interface DiscoverCommunity {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string | null;
  access: "PUBLIC" | "PRIVATE" | "REQUEST";
  memberCount: number;
  requestPending: boolean;
  owner: { name: string | null; username: string | null };
}

export function DiscoverCommunities({ communities }: { communities: DiscoverCommunity[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {communities.map((community) => (
        <DiscoverTile key={community.id} community={community} />
      ))}
    </div>
  );
}

/** Same tile as My communities, so the two tabs scan identically. */
function DiscoverTile({ community }: { community: DiscoverCommunity }) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(community.requestPending);

  async function act() {
    setPending(true);

    if (community.access === "PUBLIC") {
      const result = await joinCommunityAction(community.id);
      setPending(false);
      if (!result.ok) return toast.error(result.error);

      toast.success(`Joined ${community.name}`);
      navigate(`/communities/${community.slug}`);
      router.refresh();
      return;
    }

    const result = await requestJoinAction(community.id);
    setPending(false);
    if (!result.ok) return toast.error(result.error);

    setRequested(true);
    toast.success("Request sent", "The leader has to approve it before you're in.");
    router.refresh();
  }

  return (
    <div className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sq border border-line bg-surface-2 text-muted">
            <CommunityIcon size={17} />
          </span>
          <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-bright">
            {truncate(community.name, 50)}
          </h3>
        </div>

        <Badge tone="neutral" className="shrink-0">
          {community.access === "PUBLIC" ? (
            <>
              <GlobeIcon size={10} /> Open
            </>
          ) : (
            <>
              <ShieldIcon size={10} /> Approval
            </>
          )}
        </Badge>
      </div>

      {community.description ? (
        <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
          {truncate(community.description, 110)}
        </p>
      ) : null}

      <div className="num mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
        <span>
          {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
        </span>
        {community.subject ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{community.subject}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="min-w-0 truncate text-xs text-faint">
          led by {community.owner.name ?? community.owner.username ?? "a student"}
        </span>

        {requested ? (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted">
            <CheckIcon size={13} /> Requested
          </span>
        ) : (
          <Button size="sm" variant="secondary" onClick={act} disabled={pending} className="shrink-0">
            {pending ? <Spinner /> : null}
            {community.access === "PUBLIC" ? "Join" : "Ask to join"}
          </Button>
        )}
      </div>
    </div>
  );
}
