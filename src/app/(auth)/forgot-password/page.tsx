import { Suspense } from "react";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { Skeleton } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
