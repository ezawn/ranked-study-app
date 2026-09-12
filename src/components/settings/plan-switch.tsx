"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { setPlanAction } from "@/server/actions/settings";

/**
 * Development-only plan switch.
 *
 * There is no payment provider wired up yet, so this exists purely so the
 * free/premium limits can be exercised end to end. The server action refuses
 * to run in production — this is not a way to get premium for free.
 */
export function PlanSwitch({ plan }: { plan: "FREE" | "PREMIUM" }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function change(next: "FREE" | "PREMIUM") {
    setPending(true);
    const result = await setPlanAction(next);
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    toast.success(next === "PREMIUM" ? "Switched to premium" : "Back on the free plan");
    router.refresh();
  }

  return (
    <Alert tone="violet" title="Development switch">
      <p className="mb-3.5 max-w-2xl">
        Billing isn&apos;t connected yet. Use this to try the premium limits — it&apos;s disabled in
        production, where the plan is set by the billing webhook instead.
      </p>
      {/* A tray around the pair so it reads as one switch with two positions
          rather than two unrelated buttons. */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-sq border border-line bg-raise p-1">
        <Button
          size="sm"
          variant={plan === "FREE" ? "secondary" : "ghost"}
          onClick={() => change("FREE")}
          disabled={pending || plan === "FREE"}
        >
          {pending ? <Spinner /> : null}
          Free
        </Button>
        <Button
          size="sm"
          variant={plan === "PREMIUM" ? "coin" : "ghost"}
          onClick={() => change("PREMIUM")}
          disabled={pending || plan === "PREMIUM"}
        >
          {pending ? <Spinner /> : null}
          Premium
        </Button>
      </div>
    </Alert>
  );
}
