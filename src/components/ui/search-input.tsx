"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SearchIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * URL-backed search box.
 *
 * The query lives in the URL so results are shareable and survive a refresh,
 * and typing is debounced so a search doesn't fire per keystroke.
 */
export function SearchInput({
  placeholder = "Search…",
  paramName = "q",
  className,
}: {
  placeholder?: string;
  paramName?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [value, setValue] = useState(params.get(paramName) ?? "");
  const initial = useRef(true);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set(paramName, value.trim());
      else next.delete(paramName);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 280);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-11 w-full rounded-sq border border-line bg-surface pl-10 pr-9 text-[15px] text-bright",
          "shadow-[inset_0_1px_2px_rgb(23_23_26/0.05)]",
          "placeholder:text-faint outline-none transition-[border-color,box-shadow]",
          "hover:border-line-strong",
          "focus:border-accent focus:shadow-[0_0_0_3px_var(--sq-accent-wash)]",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-raise-2 hover:text-bright"
        >
          <XIcon size={13} />
        </button>
      ) : null}
    </div>
  );
}
