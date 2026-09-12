"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { CoinIcon, CheckIcon, LockIcon, XIcon } from "@/components/icons";
import { Cosmetic, CharacterPreview, type EquippedItem } from "@/components/arena/character";
import { CATEGORY_LABEL, COSMETIC_CATEGORIES, type CosmeticCategoryKey } from "@/lib/arena/cosmetics";
import { cn, formatNumber } from "@/lib/utils";
import { purchaseCosmeticAction, equipCosmeticAction } from "@/server/actions/arena";

/**
 * The character screen: preview above, shop below.
 *
 * The preview updates the moment something is equipped rather than after the
 * server round trip, because the whole point of trying a hat on is seeing it.
 * The optimistic state is local and the router refresh reconciles it; if the
 * action fails the error surfaces and the refresh puts the truth back.
 *
 * Nothing here decides a price or whether an item is owned. Those come from the
 * server on every render, and the actions re-check both — a client that lies
 * about either gets a refusal rather than a hat.
 */

export interface ShopItemView {
  id: string;
  category: CosmeticCategoryKey;
  name: string;
  description: string;
  price: number;
  placeholderLabel: string;
  spriteKey: string | null;
  owned: boolean;
  equipped: boolean;
}

export function CharacterShop({
  items,
  balance,
  characterName,
}: {
  items: Record<CosmeticCategoryKey, ShopItemView[]>;
  balance: number;
  characterName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [category, setCategory] = useState<CosmeticCategoryKey>("HAT");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Local overlay so equipping feels instant. Keyed by category, mirroring the
     one-item-per-slot rule the database enforces. */
  const [optimistic, setOptimistic] = useState<Partial<Record<CosmeticCategoryKey, string | null>>>(
    {},
  );

  const all = useMemo(() => Object.values(items).flat(), [items]);

  const equipped: EquippedItem[] = useMemo(() => {
    const out: EquippedItem[] = [];
    for (const cat of COSMETIC_CATEGORIES) {
      const override = optimistic[cat];
      const item =
        override === null
          ? undefined
          : override
            ? all.find((i) => i.id === override)
            : items[cat]?.find((i) => i.equipped);
      if (item) {
        out.push({
          category: cat,
          placeholderLabel: item.placeholderLabel,
          spriteKey: item.spriteKey,
        });
      }
    }
    return out;
  }, [all, items, optimistic]);

  const preview = previewId ? all.find((i) => i.id === previewId) ?? null : null;

  const isEquipped = (item: ShopItemView) => {
    const override = optimistic[item.category];
    if (override === undefined) return item.equipped;
    return override === item.id;
  };

  const buy = (item: ShopItemView) => {
    setError(null);
    startTransition(async () => {
      const result = await purchaseCosmeticAction(item.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const equip = (item: ShopItemView) => {
    setError(null);
    const nowEquipped = isEquipped(item);
    setOptimistic((o) => ({ ...o, [item.category]: nowEquipped ? null : item.id }));

    startTransition(async () => {
      const result = await equipCosmeticAction(item.id);
      if (!result.ok) {
        setError(result.error);
        setOptimistic((o) => {
          const next = { ...o };
          delete next[item.category];
          return next;
        });
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------ the preview */}
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
              Your character
            </h2>
            <p className="mt-1.5 text-[13.5px] text-muted">
              {equipped.length === 0
                ? "Nothing equipped yet — buy something below."
                : `Wearing ${equipped.length} item${equipped.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          <span className="num flex items-center gap-1.5 rounded-sq border border-coin/30 bg-coin/10 px-3 py-1.5 text-[14px] font-bold text-coin-ink">
            <CoinIcon size={14} className="text-coin" />
            {formatNumber(balance)}
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <CharacterPreview equipped={equipped} size={300} name={characterName} />
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-faint">
          Artwork isn&apos;t drawn yet, so every item is a labelled placeholder. Equipping,
          inventory and the shop all work — only the pictures are pending.
        </p>
      </Panel>

      {error ? (
        <Alert tone="rose" title="That didn't work">
          {error}
        </Alert>
      ) : null}

      {/* --------------------------------------------------------- the shop */}
      <div>
        <h2 className="mb-4 font-display text-[19px] font-bold tracking-[-0.02em] text-bright">
          Shop
        </h2>

        <div
          role="tablist"
          aria-label="Cosmetic categories"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2"
        >
          {COSMETIC_CATEGORIES.map((cat) => {
            const active = cat === category;
            const ownedCount = items[cat]?.filter((i) => i.owned).length ?? 0;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setCategory(cat);
                  setPreviewId(null);
                }}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sq border px-3.5",
                  "text-[13px] font-semibold transition-all duration-200",
                  active
                    ? "border-transparent bg-accent text-accent-ink"
                    : "border-line bg-surface text-muted hover:border-line-strong hover:text-bright",
                )}
              >
                {CATEGORY_LABEL[cat]}
                <span className={cn("num text-[11px]", active ? "opacity-80" : "text-faint")}>
                  {ownedCount}/{items[cat]?.length ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(items[category] ?? []).map((item) => {
              const worn = isEquipped(item);
              const affordable = item.owned || balance >= item.price;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setPreviewId(item.id)}
                    aria-pressed={previewId === item.id}
                    className={cn(
                      "flex w-full flex-col items-center gap-2 rounded-sq-card border p-3 text-center",
                      "transition-all duration-200",
                      worn
                        ? "border-accent bg-accent/10"
                        : previewId === item.id
                          ? "border-line-strong bg-raise"
                          : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <Cosmetic
                      label={item.placeholderLabel}
                      spriteKey={item.spriteKey}
                      size={62}
                      className={cn(!item.owned && !affordable && "opacity-50")}
                    />
                    <span className="line-clamp-1 text-[12.5px] font-semibold text-bright">
                      {item.name}
                    </span>

                    {item.owned ? (
                      <span
                        className={cn(
                          "num inline-flex items-center gap-1 text-[12px] font-semibold",
                          worn ? "text-accent-deep" : "text-uncommon-ink",
                        )}
                      >
                        <CheckIcon size={10} />
                        {worn ? "Equipped" : "Owned"}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "num inline-flex items-center gap-1 text-[12px] font-semibold",
                          affordable ? "text-coin-ink" : "text-faint",
                        )}
                      >
                        {affordable ? <CoinIcon size={10} /> : <LockIcon size={10} />}
                        {formatNumber(item.price)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* ------------------------------------------------ item preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {preview ? (
              <Panel className="p-5">
                <div className="flex justify-end">
                  <button
                    onClick={() => setPreviewId(null)}
                    aria-label="Close preview"
                    className="rounded-md p-1 text-faint transition-colors hover:bg-raise-2 hover:text-bright lg:hidden"
                  >
                    <XIcon size={14} />
                  </button>
                </div>

                <div className="flex justify-center">
                  <Cosmetic
                    label={preview.placeholderLabel}
                    spriteKey={preview.spriteKey}
                    size={116}
                  />
                </div>

                <h3 className="mt-4 text-center font-display text-[17px] font-bold tracking-[-0.02em] text-bright">
                  {preview.name}
                </h3>
                <p className="mt-2 text-center text-[13px] leading-relaxed text-muted">
                  {preview.description}
                </p>

                <div className="mt-4 flex justify-center">
                  <Badge tone="neutral">{CATEGORY_LABEL[preview.category]}</Badge>
                </div>

                <div className="mt-5">
                  {!preview.owned ? (
                    <Button
                      variant="coin"
                      className="w-full"
                      disabled={pending || balance < preview.price}
                      onClick={() => buy(preview)}
                      icon={<CoinIcon size={14} />}
                    >
                      {balance < preview.price
                        ? `Need ${formatNumber(preview.price - balance)} more`
                        : `Buy · ${formatNumber(preview.price)}`}
                    </Button>
                  ) : (
                    <Button
                      variant={isEquipped(preview) ? "secondary" : "primary"}
                      className="w-full"
                      disabled={pending}
                      onClick={() => equip(preview)}
                    >
                      {isEquipped(preview) ? "Equipped — tap to remove" : "Equip"}
                    </Button>
                  )}
                </div>
              </Panel>
            ) : (
              <Panel className="p-5">
                <p className="text-center text-[13px] leading-relaxed text-muted">
                  Pick an item to see it up close, what it costs and what it does to your character.
                </p>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
