import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { shopFor } from "@/server/services/arena/cosmetics";
import { ensureArenaProfile } from "@/server/services/arena/profile";
import { SectionHeading } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/feedback";
import { CharacterShop } from "@/components/arena/shop";
import { CharacterIcon } from "@/components/icons";
import { COSMETIC_CATEGORIES } from "@/lib/arena/cosmetics";

export const metadata: Metadata = { title: "Your Character" };
export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const user = await requireUser();
  await ensureArenaProfile(user.id, user.timezone);

  const items = await shopFor(user.id);
  const total = COSMETIC_CATEGORIES.reduce((n, c) => n + (items[c]?.length ?? 0), 0);

  return (
    <div className="space-y-7">
      <SectionHeading
        title="Your Character"
        subtitle="Spend Study Coins on cosmetics. They change nothing about how you play — the Arena is decided by what you know, not what you're wearing."
      />

      {total === 0 ? (
        /* The catalogue is seeded, so an empty shop means the seed has not been
           run — an operational state, not a user one. Saying so beats an empty
           grid that looks like a bug. */
        <EmptyState
          icon={<CharacterIcon size={22} />}
          title="The shop hasn't been stocked yet"
          description="Run npm run db:seed:cosmetics to load the catalogue."
        />
      ) : (
        <CharacterShop
          items={items}
          balance={user.coinBalance}
          characterName={user.name?.split(" ")[0] ?? "You"}
        />
      )}
    </div>
  );
}
