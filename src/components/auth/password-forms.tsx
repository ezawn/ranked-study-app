"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, Spinner } from "@/components/ui/feedback";
import { CheckIcon } from "@/components/icons";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/server/actions/password";

/**
 * Asking for a reset link.
 *
 * Always reports the same thing back, whether or not the address has an
 * account. Confirming which emails are registered to an anonymous visitor is
 * a free gift to anyone building a list.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [logged, setLogged] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await requestPasswordResetAction(email);
    setPending(false);

    if (!result.ok) return setError(result.error ?? "Something went wrong.");

    setLogged(Boolean(result.logged));
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-sq-lg bg-lime/15 text-lime">
          <CheckIcon size={24} />
        </span>
        <h1 className="mt-5 font-display text-[21px] font-bold tracking-[-0.026em]">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          If there&apos;s an account for <span className="text-bright">{email}</span>, a reset link
          is on its way. It expires in an hour.
        </p>

        {logged ? (
          <Alert tone="violet" title="No email provider configured" className="mt-5">
            The link was printed to the server console instead of sent. Look in the terminal running{" "}
            <code className="text-bright">npm run dev</code> and copy it from there.
          </Alert>
        ) : null}

        <Link
          href="/sign-in"
          className="link mt-6 inline-block text-sm font-semibold hover:decoration-current"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold tracking-[-0.03em]">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-muted">
        Put in your email and we&apos;ll send you a link to set a new one.
      </p>

      {error ? (
        <Alert tone="rose" className="mt-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.ac.uk"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : null}
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="link font-semibold hover:decoration-current"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

/** Setting the new password, from a link. */
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) return setError("Passwords need to be at least 8 characters.");
    if (password !== confirm) return setError("Those two passwords don't match.");

    setPending(true);
    const result = await resetPasswordAction({ token, password });
    setPending(false);

    if (!result.ok) return setError(result.error ?? "That didn't work.");

    setDone(true);
    setTimeout(() => router.push("/sign-in"), 2500);
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-[21px] font-bold tracking-[-0.026em]">That link looks wrong</h1>
        <p className="mt-2 text-sm text-muted">
          It&apos;s missing its token. Copy the whole link out of the email, or ask for a new one.
        </p>
        <Link
          href="/forgot-password"
          className="link mt-6 inline-block text-sm font-semibold hover:decoration-current"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-sq-lg bg-lime/15 text-lime">
          <CheckIcon size={24} />
        </span>
        <h1 className="mt-5 font-display text-[21px] font-bold tracking-[-0.026em]">Password changed</h1>
        <p className="mt-2 text-sm text-muted">Taking you to sign in…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold tracking-[-0.03em]">Set a new password</h1>
      <p className="mt-1.5 text-sm text-muted">
        Pick something you haven&apos;t used elsewhere.
      </p>

      {error ? (
        <Alert tone="rose" className="mt-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="New password" htmlFor="password" hint="At least 8 characters.">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirm">
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : null}
          Change password
        </Button>
      </form>
    </div>
  );
}
