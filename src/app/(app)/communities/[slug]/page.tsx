import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  getCommunityBySlug,
  getCommunityInside,
  shareableContent,
} from "@/server/services/communities";
import { Panel, PanelHeader, SectionHeading } from "@/components/ui/panel";
import { Badge } from "@/components/ui/feedback";
import { CommunityFeed } from "@/components/communities/community-feed";
import { CommunityResources } from "@/components/communities/community-resources";
import {
  InvitePanel,
  JoinRequests,
  LeaveCommunity,
  MemberList,
} from "@/components/communities/community-manage";
import { CommunityJoinPrompt } from "@/components/communities/join-prompt";
import { CommunityIcon, CrownIcon, GlobeIcon, LockIcon, ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await requireUser();
  const found = await getCommunityBySlug(user.id, slug).catch(() => null);
  return { title: found ? found.community.name : "Community" };
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;

  const found = await getCommunityBySlug(user.id, slug).catch(() => null);
  if (!found) notFound();

  const { community, membership, requestStatus } = found;

  const accessBadge =
    community.access === "PUBLIC" ? (
      <Badge tone="neutral">
        <GlobeIcon size={10} /> Open to anyone
      </Badge>
    ) : community.access === "REQUEST" ? (
      <Badge tone="neutral">
        <ShieldIcon size={10} /> Approval needed
      </Badge>
    ) : (
      <Badge tone="neutral">
        <LockIcon size={10} /> Invite only
      </Badge>
    );

  /* Zone one: who this is. Name, how you get in, how big it is and who runs
     it — everything needed to place the community before scrolling. */
  const header = (
    <>
      <div>
        <Link
          href="/communities"
          className="-ml-2.5 inline-flex h-9 items-center rounded-sq-sm px-2.5 text-[13.5px] font-medium text-muted transition-colors hover:bg-raise-2 hover:text-bright"
        >
          ← All communities
        </Link>
      </div>

      <SectionHeading
        title={community.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {accessBadge}
            {community.subject ? <Badge tone="neutral">{community.subject}</Badge> : null}
            <span className="text-[14px]">
              <span className="num">{community.memberCount}</span> member
              {community.memberCount === 1 ? "" : "s"}
            </span>
            <span className="text-[14px]">
              led by {community.owner.name ?? community.owner.username ?? "a student"}
            </span>
          </span>
        }
      />

      {community.description ? (
        <p className="max-w-2xl text-[15.5px] leading-relaxed text-muted">{community.description}</p>
      ) : null}
    </>
  );

  // ---------------------------------------------------------------- Outsider
  if (!membership) {
    return (
      <div className="space-y-6">
        {header}
        <CommunityJoinPrompt
          communityId={community.id}
          slug={community.slug}
          access={community.access}
          requestStatus={requestStatus}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------ Member
  const [inside, shareable] = await Promise.all([
    getCommunityInside(user.id, community.id),
    shareableContent(user.id),
  ]);

  const canModerate = inside.role === "LEADER" || inside.role === "MODERATOR";

  return (
    <div className="space-y-8">
      {header}

      {/* Anything waiting on a decision sits above the fold, full width, before
          the two columns start. */}
      {canModerate ? <JoinRequests requests={inside.pendingRequests} /> : null}

      {/* Two zones side by side on a desktop, stacked on a phone: what the
          community has made, and how the community is run. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <CommunityResources
            communityId={community.id}
            resources={inside.resources as never}
            shareable={shareable}
            canModerate={canModerate}
          />

          <section className="min-w-0">
            <h2 className="mb-4 font-display text-[17px] font-semibold tracking-[-0.02em] text-bright">
              Discussion
            </h2>
            <CommunityFeed
              communityId={community.id}
              posts={inside.posts as never}
              currentUserId={user.id}
              ownerId={community.ownerId}
              canModerate={canModerate}
            />
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <MemberList
            communityId={community.id}
            members={inside.members}
            ownerId={community.ownerId}
            currentUserId={user.id}
            canModerate={canModerate}
          />

          {canModerate ? (
            <InvitePanel
              communityId={community.id}
              invites={inside.invites}
              access={community.access}
            />
          ) : null}

          {/* Community Wars is a future feature — visible, inert, honest — and
              two sentences don't need a full panel of their own, so it shares
              one hairline-divided surface with the membership controls below
              rather than standing as a fourth box in the rail. */}
          <Panel className="overflow-hidden p-0">
            <div className="locked p-6">
              <PanelHeader title="Community Wars" subtitle="Not built yet." className="mb-3" />
              <p className="text-sm leading-relaxed text-muted">
                Communities will eventually be able to compete against each other. Nothing here
                does anything today.
              </p>
            </div>

            <div className="border-t border-line p-6">
              <PanelHeader title="Membership" className="mb-4" />
              <div className="flex flex-wrap items-center gap-3">
                {inside.role === "LEADER" ? (
                  <Badge tone="neutral">
                    <CrownIcon size={10} /> You lead this
                  </Badge>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <CommunityIcon size={14} /> Member
                  </span>
                )}
                <LeaveCommunity
                  communityId={community.id}
                  isLeader={inside.role === "LEADER"}
                  memberCount={community.memberCount}
                />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
