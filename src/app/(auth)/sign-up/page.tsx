import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { Skeleton } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AuthForm mode="sign-up" googleEnabled={env.google.configured} />
    </Suspense>
  );
}
