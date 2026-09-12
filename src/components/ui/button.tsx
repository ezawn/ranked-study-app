import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Buttons.
 *
 * In a world made of card stock, a button is a struck token: a solid face, a
 * lit bevel along the top edge where the light catches it, a warm shadow with
 * a real offset because it sits above the table, and one pixel of travel when
 * you press it. Nothing here is flat, and nothing here glows.
 *
 * The primary button is the only clickable thing carrying the signature
 * sheen. That is what makes the main action on a screen unmistakable without
 * it having to be the loudest object in view — and there is only ever one in
 * view. Anything competing for the same attention is secondary or ghost.
 *
 * Contrast is pinned, not inherited: `accent`, `bad`, and both ends of the
 * sheen clear WCAG AA against their label colour in both themes. Repointing
 * any of them at a lighter rarity value breaks that.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "coin" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none " +
  "font-display font-semibold tracking-[-0.008em] rounded-sq " +
  "transition-[background-color,border-color,color,transform,box-shadow,filter] duration-200 " +
  "ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-px " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

/*
 * Shadows are written out in full rather than composed from a shared
 * constant. Tailwind scans source text, so a class name assembled by template
 * interpolation is a class name it never generates.
 */
const variants: Record<ButtonVariant, string> = {
  primary:
    "brand text-accent-ink hover:brightness-[1.07] active:brightness-95 " +
    "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.28),0_1px_2px_rgb(72_52_30/0.22),0_6px_14px_-6px_rgb(11_125_138/0.5)] " +
    "hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.28),0_2px_4px_rgb(72_52_30/0.24),0_10px_22px_-8px_rgb(11_125_138/0.55)]",
  secondary:
    "bg-surface text-bright border border-line " +
    "shadow-[inset_0_1px_0_0_var(--sq-bevel),0_1px_2px_rgb(72_52_30/0.08)] " +
    "hover:bg-surface-2 hover:border-line-strong " +
    "hover:shadow-[inset_0_1px_0_0_var(--sq-bevel),0_3px_10px_-2px_rgb(72_52_30/0.14)]",
  outline: "bg-transparent text-bright border border-line-strong hover:bg-raise-2",
  ghost: "text-muted hover:text-bright hover:bg-raise-2",
  danger:
    "bg-bad text-white hover:brightness-110 active:brightness-95 " +
    "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(220_47_61/0.5)]",
  /*
   * Struck amber. Reserved for actions about MONEY — the paid plan, and
   * nothing else now that the three plain actions wearing it (submit a quiz,
   * submit the daily, start the daily from the streak page) have moved to
   * primary. Gold on an ordinary action is the fastest way to lose the one
   * signal that makes a coin balance findable on a busy screen: if everything
   * important is gold, gold has stopped meaning currency.
   */
  coin:
    "coin-gradient text-[color:var(--sq-coin-on)] hover:brightness-[1.05] active:brightness-95 " +
    "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.45),0_6px_14px_-6px_rgb(180_124_5/0.55)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14.5px]",
  lg: "h-13 px-7 text-[15.5px]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({ variant, size, className, children, icon, ...props }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, className, children, icon, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

/**
 * Square icon button.
 *
 * Always takes a label, which becomes both the accessible name and the
 * tooltip. An icon button without one is a guessing game.
 */
export function IconButton({
  className,
  children,
  label,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sq-sm",
        "text-muted transition-colors duration-200",
        "hover:bg-raise-2 hover:text-bright",
        "disabled:opacity-35 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
