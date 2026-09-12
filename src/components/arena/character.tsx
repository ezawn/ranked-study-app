import { cn } from "@/lib/utils";
import {
  CATEGORY_LABEL,
  SLOT_POSITION,
  COSMETIC_CATEGORIES,
  type CosmeticCategoryKey,
} from "@/lib/arena/cosmetics";

/**
 * The character, and the placeholders standing in for artwork.
 *
 * Everything here is a labelled red circle, as specified — but the shape of
 * the code is the point rather than the circles. Each equipped item is drawn
 * by `Cosmetic`, which prefers `spriteKey` and falls back to the placeholder.
 * When artwork exists, the change is inside that one component: the shop, the
 * inventory, the equipping rules, the preview layout and the slot positions
 * all stay exactly as they are.
 *
 * Slots are positioned as percentages of the preview box (see SLOT_POSITION),
 * so the same character renders correctly at 96px in a leaderboard row and at
 * 320px on the character page without a second set of numbers.
 */

export interface EquippedItem {
  category: CosmeticCategoryKey;
  placeholderLabel: string;
  spriteKey: string | null;
}

/** One cosmetic. The single place artwork will eventually replace a circle. */
export function Cosmetic({
  label,
  spriteKey,
  size,
  className,
  title,
}: {
  label: string;
  spriteKey: string | null;
  /** Rendered diameter in px. */
  size: number;
  className?: string;
  title?: string;
}) {
  if (spriteKey) {
    /* Artwork exists for this item. Served through the authorised file route,
       the same as every other uploaded asset. */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/files/${spriteKey}`}
        alt={label}
        title={title ?? label}
        width={size}
        height={size}
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <span
      title={title ?? label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-center",
        "border border-bad/40 bg-bad/15 text-bad-ink",
        "px-1 font-display font-semibold leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        /* Scales with the circle so a 40px chip and a 90px slot both stay
           readable rather than one of them clipping. */
        fontSize: Math.max(8, Math.min(13, size * 0.17)),
      }}
    >
      <span className="line-clamp-2 break-words">{label}</span>
    </span>
  );
}

/**
 * The character preview.
 *
 * A body plate with the equipped cosmetics arranged around it. Empty slots are
 * simply absent rather than drawn as holes — a preview covered in placeholders
 * for things you do not own reads as broken, not as an invitation.
 */
export function CharacterPreview({
  equipped,
  size = 300,
  name,
  className,
}: {
  equipped: readonly EquippedItem[];
  size?: number;
  name?: string;
  className?: string;
}) {
  const worn = new Map(equipped.map((e) => [e.category, e]));

  return (
    <div className={cn("mx-auto", className)} style={{ width: size }}>
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        equipped.length === 0
          ? `${name ?? "Character"} wearing nothing yet`
          : `${name ?? "Character"} wearing ${equipped.map((e) => e.placeholderLabel).join(", ")}`
      }
    >
      {/* The body. Deliberately the largest and plainest thing here, so the
          cosmetics read as additions to a character rather than as a pile of
          circles that happens to be person-shaped.

          It carries no label. The chestpiece slot sits on the torso — that is
          what wearing a chestpiece means — and a name printed inside the body
          plate collided with it into two words on top of each other. The name
          goes under the figure, where nothing can be equipped over it. */}
      <div
        className="absolute rounded-full border-2 border-bad/45 bg-bad/12"
        style={{
          left: "50%",
          top: "50%",
          width: size * 0.46,
          height: size * 0.46,
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden
      />

      {COSMETIC_CATEGORIES.map((category) => {
        const item = worn.get(category);
        if (!item) return null;
        const slot = SLOT_POSITION[category];
        const slotSize = (size * slot.size) / 100;

        return (
          <div
            key={category}
            className="absolute"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Cosmetic
              label={item.placeholderLabel}
              spriteKey={item.spriteKey}
              size={slotSize}
              title={`${CATEGORY_LABEL[category]}: ${item.placeholderLabel}`}
            />
          </div>
        );
      })}
    </div>

    {name ? (
      <p className="mt-3 text-center font-display text-[14px] font-bold tracking-[-0.015em] text-bright">
        {name}
      </p>
    ) : null}
    </div>
  );
}

/** A small character for a leaderboard row or a match-up screen. */
export function CharacterAvatar({
  equipped,
  size = 44,
  name,
}: {
  equipped: readonly EquippedItem[];
  size?: number;
  name?: string;
}) {
  /* At this size the individual cosmetics are unreadable, so show the body and
     the hat only — enough to be recognisably that player's character without
     pretending to detail the size cannot carry. */
  const hat = equipped.find((e) => e.category === "HAT");

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <div
        className="absolute inset-x-0 bottom-0 rounded-full border border-bad/45 bg-bad/12"
        style={{ height: size * 0.78 }}
      />
      {hat ? (
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-bad/50 bg-bad/25"
          style={{ width: size * 0.44, height: size * 0.3 }}
        />
      ) : null}
      <span className="sr-only">{name ?? "Character"}</span>
    </div>
  );
}
