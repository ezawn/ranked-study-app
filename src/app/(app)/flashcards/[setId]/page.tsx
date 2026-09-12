import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getViewableSet, rewardStatus } from "@/server/services/flashcards";
import { setStudyStats } from "@/server/services/study";
import { Panel, PanelHeader, rarityFor, SectionHeading, StatStrip } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Meter } from "@/components/ui/feedback";
import { SetActions } from "@/components/flashcards/set-actions";
import { relativeTime, truncate } from "@/lib/utils";
import { FLASHCARDS } from "@/lib/coins/rules";
import {
  BrainIcon,
  CardsIcon,
  CoinIcon,
  EditIcon,
  GlobeIcon,
  ShuffleIcon,
  TargetIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ setId: string }>;
}): Promise<Metadata> {
  const { setId } = await params;
  const user = await requireUser();
  const set = await getViewableSet(user.id, setId).catch(() => null);
  return { title: set ? set.title : "Flashcards" };
}

export default async function SetPage({ params }: { params: Promise<{ setId: string }> }) {
  const user = await requireUser();
  const { setId } = await params;

  const set = await getViewableSet(user.id, setId).catch(() => null);
  if (!set) notFound();

  const isOwner = set.ownerId === user.id;
  const [stats, reward] = await Promise.all([
    setStudyStats(user.id, set.id),
    rewardStatus(user.id, set.id, user.plan),
  ]);

  // The one place on this page with exact mastery, not a proxy — so the one
  // place the rarity rail can be trusted with the full five-tier scale.
  const rarity = rarityFor(stats.masteryPercent);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/flashcards" className="text-sm text-muted transition-colors hover:text-bright">
          ← All flashcards
        </Link>
      </div>

      <SectionHeading
        title={set.title}
        subtitle={
          // Card count lives in the "Cards" figure below, paired with when it
          // was last studied — restating the bare number up here just to sit
          // beside the subject/visibility badges added nothing.
          <span className="flex flex-wrap items-center gap-2">
            {set.subject ? <Badge tone="neutral">{set.subject}</Badge> : null}
            {set.isPublic ? (
              <Badge tone="lime">
                <GlobeIcon size={10} /> Public
              </Badge>
            ) : null}
            {!isOwner ? <span className="text-sm">by {set.owner.name ?? "another student"}</span> : null}
          </span>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/flashcards/${set.id}/smart`} icon={<BrainIcon size={16} />}>
              Smart Mode
              {stats.dueCount > 0 ? (
                <span className="ml-1 rounded-full bg-raise-3 px-1.5 text-xs num">
                  {stats.dueCount}
                </span>
              ) : null}
            </ButtonLink>
            <ButtonLink
              href={`/flashcards/${set.id}/cram`}
              variant="secondary"
              icon={<ShuffleIcon size={16} />}
            >
              Cram Mode
            </ButtonLink>
            {isOwner ? (
              <ButtonLink
                href={`/flashcards/${set.id}/edit`}
                variant="ghost"
                icon={<EditIcon size={16} />}
              >
                Edit
              </ButtonLink>
            ) : null}
          </div>
        }
      />

      {set.description ? <p className="max-w-2xl text-muted">{set.description}</p> : null}

      {/* One instrument rather than four cards: these four figures are the
          state of one thing, and reading them as a row is the point. */}
      <StatStrip
        stats={[
          {
            // No hint here: the known/total count this would repeat is
            // stated once already, right beside the progress bar below —
            // that's the more useful place for it, next to the bar it labels.
            label: "Mastery",
            value: `${stats.masteryPercent}%`,
            icon: <TargetIcon size={14} />,
          },
          {
            label: "Due now",
            value: stats.dueCount,
            hint: stats.unseen > 0 ? `${stats.unseen} never seen` : "Everything's been seen",
            icon: <BrainIcon size={14} />,
          },
          {
            label: "Cards",
            value: stats.total,
            hint: stats.lastReviewAt
              ? `Last studied ${relativeTime(stats.lastReviewAt)}`
              : "Not studied yet",
            icon: <CardsIcon size={14} />,
          },
          {
            label: "Worth",
            value: reward?.potentialCoins ?? 0,
            hint: "Coins for getting every card into the Known pile",
            icon: <CoinIcon size={14} />,
            gold: true,
          },
        ]}
      />

      {/* Mastery again, as a bar. The percentage above tells you where you are;
          this tells you how far there is to go, which is the thing that keeps
          people coming back to a set. The rail along the top is the same
          mastery printed as rarity — the one panel on this page allowed to
          wear it, since this is the one figure on the page that IS mastery,
          not a reading of it. */}
      <Panel
        rarity={rarity === "common" ? undefined : rarity}
        className="relative overflow-hidden px-6 py-5"
      >
        {rarity === "legendary" ? (
          <div
            className="foil pointer-events-none absolute inset-0 rounded-sq-card"
            aria-hidden="true"
          />
        ) : null}
        <div className="mb-2.5 flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-medium text-muted">Progress through this set</span>
          <span className="num text-[13px] font-semibold text-bright">
            {stats.knownCount} / {stats.total} known
          </span>
        </div>
        <Meter
          value={stats.knownCount}
          max={Math.max(1, stats.total)}
          tone={stats.masteryPercent >= 100 ? "coin" : "violet"}
          label="Cards known in this set"
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader
            title="Cards"
            subtitle={isOwner ? "Everything in this set." : "Save a copy to edit these."}
          />
          <ul className="divide-y divide-line">
            {set.cards.map((card, index) => (
              // Front and back used to jump straight from a stacked phone
              // layout to three inline columns at md. The sm step pairs the
              // index with front and drops back to its own full-width line,
              // so the tablet width in between isn't stuck with the mobile
              // stack.
              <li
                key={card.id}
                className="grid gap-3 py-3 sm:grid-cols-[2rem_1fr] md:grid-cols-[2rem_1fr_1fr]"
              >
                <span className="font-display text-sm font-semibold text-faint num">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-bright">{truncate(card.front, 220)}</span>
                <span className="text-sm leading-relaxed text-muted sm:col-span-2 md:col-span-1">
                  {truncate(card.back, 220)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Study Coins" subtitle="What this set can earn, and when." />

            {reward ? (
              <div className="space-y-3.5">
                <div className="flex items-baseline gap-2">
                  <CoinIcon size={20} className="text-coin" />
                  <span className="num text-3xl font-semibold text-coin">
                    {reward.potentialCoins}
                  </span>
                  <span className="text-sm text-muted">on completion</span>
                </div>

                <p className="text-sm leading-relaxed text-muted">
                  1 coin per {FLASHCARDS.cardsPerCoin} cards, rounded down, minimum{" "}
                  {FLASHCARDS.minCoinsPerSet}. Paid when every card is in the Known pile.
                </p>

                {reward.reason ? (
                  <Alert tone="amber" title="Not earning right now">
                    {reward.reason}
                    {reward.nextEligibleAt ? (
                      <> Ready again {relativeTime(reward.nextEligibleAt)}.</>
                    ) : null}
                  </Alert>
                ) : (
                  <Alert tone="lime" title="Ready to earn">
                    Finish the set and the coins land automatically.
                  </Alert>
                )}

                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted">Sets rewarded today</span>
                    <span className="num text-bright">
                      {reward.setsRewardedToday} / {reward.dailyLimit}
                    </span>
                  </div>
                  <Meter value={reward.setsRewardedToday} max={reward.dailyLimit} tone="coin" />
                  {user.plan === "FREE" ? (
                    <p className="mt-1.5 text-xs text-faint">
                      Premium raises this to {FLASHCARDS.dailySetLimit.PREMIUM} sets a day.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Panel>

          {isOwner ? (
            <Panel>
              <PanelHeader title="Manage" />
              <SetActions setId={set.id} isPublic={set.isPublic} cardCount={set.cardCount} />
              {set.cardCount < 4 && !set.isPublic ? (
                <p className="mt-3 text-xs text-faint">
                  Add at least 4 cards to publish this set to Discover.
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
