"use client";

import { useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/form";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

/**
 * A password field with a show/hide toggle.
 *
 * The toggle is a `type="button"` so it never submits the form, and it carries
 * `aria-pressed` plus a label that flips with the state so a screen reader
 * announces what it does. Revealing a password is a per-field, per-session
 * convenience — nothing is persisted — and it defaults to hidden.
 *
 * The visible text still lives in a real `<input name=…>`, so anything reading
 * the form (autofill, the submit handler, a password manager) sees it exactly
 * as it did before.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        className={cn(
          "absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-content-center",
          "rounded-sq text-faint transition-colors hover:text-bright",
          "focus-visible:text-bright focus-visible:outline-none",
          "focus-visible:shadow-[0_0_0_3px_var(--sq-accent-wash)]",
        )}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
