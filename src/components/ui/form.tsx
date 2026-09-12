import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Form controls.
 *
 * Labels sit above their input, always, and helper text sits below it. There
 * are no placeholder-as-label controls in this product: a placeholder vanishes
 * the moment someone starts typing, which is exactly when they most need to
 * know what the field was for.
 *
 * Every field passes AA against the surface it sits on in both themes, focus
 * included. The focus treatment is a filled ring rather than a border swap so
 * it is visible against a busy panel.
 */

const fieldBase = cn(
  "w-full rounded-sq border border-line bg-surface px-3.5 text-[15px] text-bright",
  "shadow-[inset_0_1px_2px_rgb(23_23_26/0.05)]",
  "placeholder:text-faint transition-[border-color,box-shadow] duration-200 outline-none",
  "hover:border-line-strong",
  "focus:border-accent focus:shadow-[0_0_0_3px_var(--sq-accent-wash)]",
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:bg-raise",
);

export function Label({ className, children, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-2 block text-[13.5px] font-semibold tracking-[-0.005em] text-bright", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(fieldBase, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, "h-11 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      {/* Drawn here rather than as a background image so it takes the theme's
          text colour instead of a hard-coded one. */}
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] font-medium text-bad">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Checkbox and radio.
 *
 * Native inputs with their default appearance stripped, drawn as a small
 * struck token rather than a background-image data URI: a URI full of
 * quotes and parentheses inside a utility class is exactly the kind of thing
 * that breaks silently at build time. The mark itself is a `::before` grown
 * from `scale(0)` on `:checked`, painted in `accent-ink` so it takes the
 * theme instead of a baked-in colour.
 */
const controlBase = cn(
  "relative inline-grid h-5 w-5 shrink-0 cursor-pointer appearance-none place-content-center",
  "border-[1.5px] border-line-strong bg-surface",
  "shadow-[inset_0_1px_2px_rgb(23_23_26/0.05)]",
  "transition-colors duration-150 ease-out hover:border-accent",
  "checked:border-transparent checked:bg-accent checked:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.3)]",
  "checked:hover:brightness-105",
  "disabled:cursor-not-allowed disabled:opacity-55",
  "before:scale-0 before:bg-accent-ink before:transition-transform before:duration-150",
  "before:ease-[cubic-bezier(0.34,1.56,0.64,1)] checked:before:scale-100",
);

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        controlBase,
        "rounded-sq-sm before:h-2.5 before:w-2.5",
        "before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)]",
        className,
      )}
      {...props}
    />
  );
}

export function Radio({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="radio"
      className={cn(controlBase, "rounded-full before:h-2 before:w-2 before:rounded-full", className)}
      {...props}
    />
  );
}
