import Link from "next/link";

import { cn } from "@/lib/utils";

export interface TabItem {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}

/**
 * Segmented tabs.
 *
 * Link-driven, so the selected tab lives in the URL and survives a reload or a
 * share. The active tab is a solid fill rather than a tint, because a tint at
 * this size is ambiguous next to a hover state.
 */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-sq border border-line bg-raise p-1.5",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-sq-sm px-3.5 py-2 text-[13.5px] font-medium",
            "transition-all duration-200",
            item.active
              ? "brand text-accent-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.22),0_2px_8px_-3px_rgb(23_23_26/0.45)]"
              : "text-muted hover:bg-raise-2 hover:text-bright",
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span
              className={cn(
                "num rounded-full px-1.5 text-[12px] font-semibold leading-[18px]",
                item.active ? "bg-bright/20 text-bright" : "bg-raise-3 text-faint",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
