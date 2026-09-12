import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { Skeleton } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AuthForm mode="sign-in" googleEnabled={env.google.configured} />
    </Suspense>
  );
}
