"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Badge, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/layout/user-menu";
import {
  CheckIcon,
  CrownIcon,
  LogOutIcon,
  ShieldIcon,
  UserMinusIcon,
  XIcon,
} from "@/components/icons";
import {
  createInviteAction,
  decideRequestAction,
  leaveCommunityAction,
  removeMemberAction,
} from "@/server/actions/communities";
import { relativeTime } from "@/lib/utils";

interface PendingRequest {
  id: string;
  message: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; username: string | null; image: string | null };
}

export function JoinRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function decide(requestId: string, approve: boolean) {
    setPending(requestId);
    const result = await decideRequestAction(requestId, approve);
    setPending(null);

    if (!result.ok) return toast.error(result.error);

    toast.success(approve ? "Approved" : "Request declined");
    router.refresh();
  }

  return (
    /* Epic is the rarity for "due, urgent, needs you" — and a queue of people
       waiting on you is the one thing on this page that should be impossible
       to scroll past. Amber stays reserved for Study Coins. */
    <Panel className="border-epic/30">
      <PanelHeader
        title={`${requests.length} waiting to join`}
        subtitle="Nobody gets in until you approve them."
      />
      <ul className="space-y-2.5">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-wrap items-start gap-3 rounded-sq border border-line bg-raise p-3.5"
          >
            <Avatar name={request.user.name} image={request.user.image} size={34} />
            <div className="min-w-0 flex-1 basis-48">
              <div className="font-display text-[14.5px] font-semibold tracking-[-0.012em] text-bright">
                {request.user.name ?? request.user.username ?? "A student"}
              </div>
              <div className="text-xs text-faint">asked {relativeTime(request.createdAt)}</div>
              {request.message ? (
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{request.message}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                onClick={() => decide(request.id, true)}
                disabled={pending !== null}
                icon={pending === request.id ? <Spinner /> : <CheckIcon size={14} />}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => decide(request.id, false)}
                disabled={pending !== null}
                className="hover:text-rose"
                icon={<XIcon size={14} />}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function InvitePanel({
  communityId,
  invites,
  access,
}: {
  communityId: string;
  invites: Array<{ code: string; useCount: number; maxUses: number; expiresAt: Date | null }>;
  access: "PUBLIC" | "PRIVATE" | "REQUEST";
}) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    const result = await createInviteAction(communityId);
    setCreating(false);

    if (!result.ok) return toast.error(result.error);

    toast.success("Invite created");
    router.refresh();
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy — select the code and copy it manually.");
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Invites"
        subtitle={
          access === "PRIVATE"
            ? "The only way into this community."
            : "A shortcut past the join flow."
        }
        action={
          <Button size="sm" variant="secondary" onClick={create} disabled={creating}>
            {creating ? <Spinner /> : <ShieldIcon size={14} />}
            New invite
          </Button>
        }
      />

      {invites.length === 0 ? (
        <p className="rounded-sq border border-dashed border-line-strong bg-raise px-4 py-5 text-[13.5px] leading-relaxed text-muted">
          No active invites. Create one and share the code — people paste it on the Communities page.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {invites.map((invite) => (
            <li
              key={invite.code}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-sq border border-line bg-raise px-3.5 py-3"
            >
              <code className="w-full truncate font-mono text-[13.5px] tracking-[0.01em] text-bright sm:w-auto sm:flex-1">
                {invite.code}
              </code>
              <span className="shrink-0 text-xs text-faint num">
                {invite.useCount}/{invite.maxUses} used
                {invite.expiresAt ? ` · expires ${relativeTime(invite.expiresAt)}` : ""}
              </span>
              {/* Fixed width so the label swapping to "Copied" doesn't shift
                  the row out from under the cursor. */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copy(invite.code)}
                className="ml-auto w-[4.75rem] shrink-0"
              >
                {copied === invite.code ? "Copied" : "Copy"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function LeaveCommunity({
  communityId,
  isLeader,
  memberCount,
}: {
  communityId: string;
  isLeader: boolean;
  memberCount: number;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function leave() {
    setPending(true);
    const result = await leaveCommunityAction(communityId);
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    toast.success("You've left the community");
    navigate("/communities");
    router.refresh();
  }

  if (isLeader && memberCount > 1) {
    return (
      <Alert tone="rose" title="You're the leader" className="w-full">
        You can&apos;t leave while other people are in here. Hand it over or clear it out first.
      </Alert>
    );
  }

  return confirming ? (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-sq border border-rose/35 bg-rose/10 px-3.5 py-3">
      <span className="mr-auto text-[13.5px] font-medium text-rose">Leave this community?</span>
      <Button variant="danger" size="sm" onClick={leave} disabled={pending}>
        {pending ? <Spinner /> : null}
        Leave
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Stay
      </Button>
    </div>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      className="hover:text-rose"
      icon={<LogOutIcon size={14} />}
    >
      Leave community
    </Button>
  );
}

export function MemberList({
  communityId,
  members,
  ownerId,
  currentUserId,
  canModerate,
}: {
  communityId: string;
  members: Array<{
    role: string;
    joinedAt: Date;
    user: { id: string; name: string | null; username: string | null; image: string | null };
  }>;
  ownerId: string;
  currentUserId: string;
  canModerate: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function remove(targetUserId: string, name: string) {
    setPending(targetUserId);
    const result = await removeMemberAction(communityId, targetUserId);
    setPending(null);
    setConfirming(null);

    if (!result.ok) return toast.error(result.error);

    toast.success(`${name} removed from the community`);
    router.refresh();
  }

  return (
    <Panel>
      <PanelHeader title={`Members (${members.length})`} />
      <ul className="-mx-2 divide-y divide-line">
        {members.map((member) => {
          const name = member.user.name ?? member.user.username ?? "A student";
          const isOwner = member.user.id === ownerId;
          const isSelf = member.user.id === currentUserId;
          // The leader can't be removed, and removing yourself is "leave".
          const removable = canModerate && !isOwner && !isSelf;

          return (
            <li
              key={member.user.id}
              className="flex min-h-11 items-center gap-3 px-2 py-2 transition-colors hover:bg-raise"
            >
              <Avatar name={member.user.name} image={member.user.image} size={30} />
              <span className="min-w-0 flex-1 truncate text-[14px] text-bright">
                {name}
                {isSelf ? <span className="ml-1.5 text-xs text-faint">(you)</span> : null}
              </span>

              {isOwner ? (
                <Badge tone="neutral">
                  <CrownIcon size={10} /> Leader
                </Badge>
              ) : member.role === "MODERATOR" ? (
                <Badge tone="neutral">
                  <ShieldIcon size={10} /> Mod
                </Badge>
              ) : null}

              {removable ? (
                confirming === member.user.id ? (
                  <span className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(member.user.id, name)}
                      disabled={pending !== null}
                      className="px-2.5 text-[12.5px]"
                    >
                      {pending === member.user.id ? <Spinner /> : null}
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirming(null)}
                      className="px-2.5 text-[12.5px]"
                    >
                      Cancel
                    </Button>
                  </span>
                ) : (
                  /* Always drawn, never hover-revealed: an opacity-0 control is
                     invisible on a touch screen, which is most of them. It sits
                     at `faint` so it recedes, and brightens on approach. */
                  <button
                    onClick={() => setConfirming(member.user.id)}
                    aria-label={`Remove ${name}`}
                    title={`Remove ${name}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sq-sm text-faint transition-colors duration-200 hover:bg-rose/10 hover:text-rose"
                  >
                    <UserMinusIcon size={15} />
                  </button>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
