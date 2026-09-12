"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="panel max-w-md px-8 py-12 text-center">
        <h1 className="font-display text-[21px] font-bold tracking-[-0.026em] text-bright">Something broke</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          That wasn&apos;t supposed to happen. Your work is saved — nothing that had already been
          recorded is lost.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-sq bg-raise-2 px-3 py-2 font-mono text-xs text-faint">
            Reference: {error.digest}
          </p>
        ) : null}
        <Button onClick={reset} size="lg" className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
