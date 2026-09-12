import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { quotaState } from "@/server/services/uploads";
import { SectionHeading } from "@/components/ui/panel";
import { PdfImport } from "@/components/quizzes/pdf-import";
import { usingRealAi } from "@/lib/env";
import { Alert } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "PDF to quiz" };
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await requireUser();
  const quota = await quotaState(user.id, "PDF_TO_QUIZ", user.plan, user.timezone);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/quizzes" className="text-sm text-muted transition-colors hover:text-bright">
          ← All quizzes
        </Link>
      </div>

      <SectionHeading
        title="PDF → quiz"
        subtitle="Upload the material, get an exam-style quiz with a mark scheme. Edit anything you don't like afterwards."
      />

      {!usingRealAi() ? (
        <Alert tone="violet" title="Running on the local provider">
          No AI key is configured, so questions are built by the built-in generator. It reads your
          document properly and produces usable questions — set{" "}
          <code className="text-bright">ANTHROPIC_API_KEY</code> in <code className="text-bright">.env</code>{" "}
          for model-written ones.
        </Alert>
      ) : null}

      <PdfImport
        quota={{
          used: quota.used,
          limit: Number.isFinite(quota.limit) ? quota.limit : 0,
          unlimited: quota.unlimited,
          remaining: Number.isFinite(quota.remaining) ? quota.remaining : 999,
        }}
      />
    </div>
  );
}
