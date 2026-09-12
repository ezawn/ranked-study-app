"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, Spinner } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CheckIcon, CoinIcon, DownloadIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { copySetAction } from "@/server/actions/flashcards";
import { FLASHCARDS } from "@/lib/coins/rules";
import { truncate } from "@/lib/utils";

interface PublicSet {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  cardCount: number;
  downloads: number;
  alreadySaved: boolean;
  owner: { name: string | null; username: string | null; image: string | null };
}

export function DiscoverGrid({ sets }: { sets: PublicSet[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sets.map((set) => (
        <DiscoverTile key={set.id} set={set} />
      ))}
    </div>
  );
}

function DiscoverTile({ set }: { set: PublicSet }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(set.alreadySaved);

  const coins = Math.max(
    FLASHCARDS.minCoinsPerSet,
    Math.floor(set.cardCount / FLASHCARDS.cardsPerCoin),
  );

  async function save() {
    setSaving(true);
    const result = await copySetAction(set.id);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSaved(true);
    toast.success(
      "Saved to your sets",
      "Your own copy — edit it freely. It can earn coins 24 hours from now.",
    );
    router.refresh();
  }

  return (
    <div className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.015em] text-bright">
          <Link href={`/flashcards/${set.id}`} className="underline-offset-4 hover:underline">
            {truncate(set.title, 60)}
          </Link>
        </h3>

        {set.subject ? (
          <Badge tone="neutral" className="shrink-0">
            {truncate(set.subject, 18)}
          </Badge>
        ) : null}
      </div>

      {set.description ? (
        <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
          {truncate(set.description, 110)}
        </p>
      ) : null}

      <div className="num mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
        <span>{set.cardCount} cards</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1 text-coin-ink">
          <CoinIcon size={11} className="text-coin" /> {coins}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <DownloadIcon size={11} /> {set.downloads}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="min-w-0 truncate text-xs text-faint">
          by {set.owner.name ?? set.owner.username ?? "a student"}
        </span>

        {saved ? (
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-lime">
            <CheckIcon size={13} /> In your sets
          </span>
        ) : (
          <Button size="sm" variant="secondary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <DownloadIcon size={14} />}
            Save
          </Button>
        )}
      </div>
    </div>
  );
}
