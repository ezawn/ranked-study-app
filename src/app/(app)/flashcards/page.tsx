import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { listMySets, listPublicSets } from "@/server/services/flashcards";
import { FilterChip, SectionHeading } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";
import { SearchInput } from "@/components/ui/search-input";
import { SetTile } from "@/components/flashcards/set-tile";
import { DiscoverGrid } from "@/components/flashcards/discover-grid";
import { CardsIcon, GlobeIcon, PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Flashcards" };
export const dynamic = "force-dynamic";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; filter?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const tab = params.tab === "discover" ? "discover" : "mine";
  const query = params.q?.trim() || undefined;
  const dueOnly = params.filter === "due";

  const [mine, publicSets] = await Promise.all([
    listMySets(user.id, { query }),
    tab === "discover" ? listPublicSets(user.id, { query }) : Promise.resolve([]),
  ]);

  const visible = dueOnly ? mine.filter((s) => s.dueCount > 0) : mine;
  const dueTotal = mine.reduce((n, s) => n + s.dueCount, 0);

  /* The query rides along on every toolbar link, and the due filter rides along
     on the links back to "My sets", so a trip through Discover and back does
     not silently drop what you had filtered to. */
  const q = query ? `&q=${encodeURIComponent(query)}` : "";
  const mineHref = `/flashcards?tab=mine${dueOnly ? "&filter=due" : ""}${q}`;

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Flashcards"
        subtitle="Cram before a test, or let Smart Mode space them out so they stick."
        action={
          <ButtonLink href="/flashcards/new" size="lg" icon={<PlusIcon size={16} />}>
            New set
          </ButtonLink>
        }
      />

      {/* Toolbar. Tabs and filter sit together as controls; search takes the
          remaining width and drops to its own line on a phone rather than
          being squeezed to nothing. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            items={[
              { href: mineHref, label: "My sets", count: mine.length, active: tab === "mine" },
              {
                href: `/flashcards?tab=discover${q}`,
                label: "Discover",
                active: tab === "discover",
              },
            ]}
          />

          {tab === "mine" && dueTotal > 0 ? (
            <FilterChip
              href={dueOnly ? `/flashcards?tab=mine${q}` : `/flashcards?tab=mine&filter=due${q}`}
              active={dueOnly}
            >
              Due today
              <span className="num opacity-70">{dueTotal}</span>
            </FilterChip>
          ) : null}
        </div>

        <SearchInput
          className="w-full sm:ml-auto sm:w-auto sm:min-w-64 sm:flex-1"
          placeholder={tab === "discover" ? "Search public sets…" : "Search your sets…"}
        />
      </div>

      {tab === "discover" ? (
        publicSets.length === 0 ? (
          <EmptyState
            icon={<GlobeIcon size={22} />}
            title={query ? "Nothing matched that" : "No public sets yet"}
            description={
              query
                ? "Try a broader search — subject names work well."
                : "When people publish their sets, they show up here. Publish one of yours to get it started."
            }
          />
        ) : (
          <DiscoverGrid sets={publicSets} />
        )
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CardsIcon size={22} />}
          title={
            query
              ? "No sets matched that"
              : dueOnly
                ? "Nothing due right now"
                : "No flashcard sets yet"
          }
          description={
            dueOnly
              ? "Smart Mode will bring cards back when they're due. Come back later, or study a set early."
              : "Make a set, or browse Discover and save one someone else has already built."
          }
          action={
            <>
              <ButtonLink href="/flashcards/new" icon={<PlusIcon size={16} />}>
                New set
              </ButtonLink>
              <ButtonLink href="/flashcards?tab=discover" variant="secondary">
                Browse Discover
              </ButtonLink>
            </>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((set) => (
            <SetTile key={set.id} set={set} />
          ))}
        </div>
      )}
    </div>
  );
}
