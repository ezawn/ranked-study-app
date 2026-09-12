"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, Spinner } from "@/components/ui/feedback";
import { signUpAction } from "@/server/actions/auth";

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: "That email and password don't match an account.",
  OAuthAccountNotLinked: "That email is already registered with a password. Sign in with it instead.",
  AccessDenied: "That sign-in was cancelled.",
  Configuration: "Sign-in isn't configured correctly. Check the server's auth settings.",
};

export function AuthForm({
  mode,
  googleEnabled,
}: {
  mode: "sign-in" | "sign-up";
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const isSignUp = mode === "sign-up";

  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? (AUTH_ERRORS[params.get("error")!] ?? "That sign-in didn't work.") : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      if (isSignUp) {
        const result = await signUpAction({
          name: String(data.get("name") ?? ""),
          email,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        if (!result.ok) {
          setError(result.error ?? "We couldn't create that account.");
          setFieldErrors(result.fieldErrors ?? {});
          setPending(false);
          return;
        }
      }

      const response = await signIn("credentials", { email, password, redirect: false });

      if (!response || response.error) {
        setError(AUTH_ERRORS[response?.error ?? ""] ?? "That email and password don't match an account.");
        setPending(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again in a moment.");
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold tracking-[-0.03em]">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {isSignUp
          ? "Start earning Study Coins for the revision you're already doing."
          : "Pick up where you left off — your streak is waiting."}
      </p>

      {error ? (
        <Alert tone="rose" className="mt-5">
          {error}
        </Alert>
      ) : null}

      {googleEnabled ? (
        <>
          <Button
            type="button"
            variant="secondary"
            className="mt-6 w-full"
            disabled={googlePending || pending}
            onClick={() => {
              setGooglePending(true);
              void signIn("google", { redirectTo: "/dashboard" });
            }}
            icon={googlePending ? <Spinner /> : <GoogleMark />}
          >
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-raise-3" />
            or use your email
            <span className="h-px flex-1 bg-raise-3" />
          </div>
        </>
      ) : (
        <div className="mt-6" />
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignUp ? (
          <Field label="Name" htmlFor="name" error={fieldErrors.name}>
            <Input id="name" name="name" autoComplete="name" required placeholder="Alex Carter" />
          </Field>
        ) : null}

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@school.ac.uk"
          />
        </Field>

        <Field
          label={
            <span className="flex items-baseline justify-between gap-3">
              Password
              {!isSignUp ? (
                <Link
                  href="/forgot-password"
                  className="link text-xs font-medium hover:decoration-current"
                >
                  Forgot password?
                </Link>
              ) : null}
            </span>
          }
          htmlFor="password"
          error={fieldErrors.password}
          hint={isSignUp ? "At least 8 characters." : undefined}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={pending || googlePending}>
          {pending ? <Spinner /> : null}
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="link font-semibold hover:decoration-current"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>

      {!googleEnabled ? (
        <p className="mt-5 rounded-sq border border-line bg-raise px-3 py-2 text-center text-xs text-faint">
          Google sign-in appears here once <code className="text-muted">AUTH_GOOGLE_ID</code> and{" "}
          <code className="text-muted">AUTH_GOOGLE_SECRET</code> are set.
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 3c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-3.9 3C3.4 21.3 7.4 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.4 7.4 0 0 1 0-4.6l-3.9-3a12 12 0 0 0 0 10.6l3.9-3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c2.2 0 3.7.9 4.5 1.7l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.7l3.9 3C6.2 6.8 8.9 4.7 12 4.7Z"
      />
    </svg>
  );
}
