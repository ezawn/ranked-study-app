import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { discoverCommunities, listMyCommunities } from "@/server/services/communities";
import { SectionHeading } from "@/components/ui/panel";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";
import { SearchInput } from "@/components/ui/search-input";
import { CommunityCreate, JoinByInvite } from "@/components/communities/community-create";
import { DiscoverCommunities } from "@/components/communities/discover-communities";
import { CommunityIcon, CrownIcon, GlobeIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Communities" };
export const dynamic = "force-dynamic";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const tab = params.tab === "discover" ? "discover" : "mine";
  const query = params.q?.trim() || undefined;

  const [mine, discover] = await Promise.all([
    listMyCommunities(user.id),
    tab === "discover" ? discoverCommunities(user.id, { query }) : Promise.resolve([]),
  ]);

  const suffix = query ? `&q=${encodeURIComponent(query)}` : "";

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Communities"
        subtitle="Share your sets and quizzes with people revising the same things."
        action={<CommunityCreate />}
      />

      {/* Toolbar. Tabs are the controls; the search box on Discover and the
          invite field on My communities take the remaining width and drop to
          their own line on a phone rather than being squeezed to nothing. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          items={[
            {
              href: `/communities?tab=mine${suffix}`,
              label: "My communities",
              count: mine.length,
              active: tab === "mine",
            },
            { href: `/communities?tab=discover${suffix}`, label: "Discover", active: tab === "discover" },
          ]}
        />
        {tab === "discover" ? (
          <SearchInput
            className="w-full sm:ml-auto sm:w-auto sm:min-w-64 sm:flex-1"
            placeholder="Search communities…"
          />
        ) : (
          <div className="w-full sm:ml-auto sm:w-auto">
            <JoinByInvite />
          </div>
        )}
      </div>

      {tab === "discover" ? (
        discover.length === 0 ? (
          <EmptyState
            icon={<GlobeIcon size={22} />}
            title={query ? "Nothing matched that" : "No open communities yet"}
            description={
              query
                ? "Try a subject name — that's how most of them are named."
                : "Private communities never show up here. Start one, or paste an invite code on the My communities tab."
            }
          />
        ) : (
          <DiscoverCommunities communities={discover} />
        )
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<CommunityIcon size={22} />}
          title="You're not in any communities yet"
          description="Start one for your class or your subject, browse the open ones, or join with an invite code."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.slug}`}
              className="panel panel-hover group flex flex-col p-5"
            >
              {/* Name first, standing badges second — the same reading order as
                  a flashcard tile, so the two libraries scan the same way. */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sq border border-line bg-surface-2 text-muted transition-colors group-hover:text-bright">
                    <CommunityIcon size={17} />
                  </span>
                  <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-bright">
                    {truncate(community.name, 50)}
                  </h3>
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-1.5 empty:hidden">
                  {community.role === "LEADER" ? (
                    <Badge tone="neutral">
                      <CrownIcon size={10} /> Leader
                    </Badge>
                  ) : null}
                  {community.access === "PRIVATE" ? (
                    <Badge tone="neutral">
                      <LockIcon size={10} /> Private
                    </Badge>
                  ) : community.access === "REQUEST" ? (
                    <Badge tone="neutral">
                      <ShieldIcon size={10} /> Approval
                    </Badge>
                  ) : null}
                </div>
              </div>

              {community.description ? (
                <p className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
                  {truncate(community.description, 110)}
                </p>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="num flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                  <span>
                    {community.memberCount} member{community.memberCount === 1 ? "" : "s"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{community.resourceCount} shared</span>
                </span>

                {/* The one thing worth acting on, and the only thing on the tile
                    allowed to be loud — epic is the rarity for "due, needs you". */}
                {community.pendingRequests > 0 ? (
                  <Badge tone="epic" className="shrink-0">
                    {community.pendingRequests} waiting
                  </Badge>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
