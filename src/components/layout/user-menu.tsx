"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { CrownIcon, LogOutIcon, SettingsIcon } from "@/components/icons";
import { cn, initials } from "@/lib/utils";

export function UserMenu({
  name,
  email,
  image,
  plan,
}: {
  name: string | null;
  email: string | null;
  image: string | null;
  plan: "FREE" | "PREMIUM";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-sq border border-line bg-surface py-1 pl-1 pr-2.5",
          "transition-colors hover:border-line-strong hover:bg-raise-2",
        )}
      >
        <Avatar name={name} image={image} />
        <span className="hidden max-w-28 truncate text-sm font-medium text-bright sm:block">
          {name ?? "Account"}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="panel absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 animate-rise p-2 shadow-lift"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <div className="truncate font-display text-sm font-semibold text-bright">
              {name ?? "Your account"}
            </div>
            <div className="truncate text-xs text-faint">{email}</div>
            <div className="mt-2">
              {plan === "PREMIUM" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-coin/30 bg-coin/12 px-2 py-0.5 text-[11px] font-semibold text-coin-ink">
                  <CrownIcon size={11} /> PREMIUM
                </span>
              ) : (
                <Link
                  href="/settings/plan"
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/12 px-2 py-0.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20"
                >
                  <CrownIcon size={11} /> Upgrade
                </Link>
              )}
            </div>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-sq px-3 py-2 text-sm text-muted transition-colors hover:bg-raise-2 hover:text-bright"
          >
            <SettingsIcon size={16} /> Settings
          </Link>

          <button
            type="button"
            onClick={() => void signOut({ redirectTo: "/sign-in" })}
            className="flex w-full items-center gap-2.5 rounded-sq px-3 py-2 text-sm text-muted transition-colors hover:bg-rose/10 hover:text-rose"
          >
            <LogOutIcon size={16} /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Avatar({
  name,
  image,
  size = 28,
}: {
  name: string | null;
  image: string | null;
  size?: number;
}) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-accent-fill font-display text-xs font-semibold text-accent-ink"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
