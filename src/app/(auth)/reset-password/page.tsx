import { Suspense } from "react";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/password-forms";
import { Skeleton } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
