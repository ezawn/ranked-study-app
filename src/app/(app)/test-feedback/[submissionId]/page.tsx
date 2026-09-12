import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getReport } from "@/server/services/test-feedback";
import { SectionHeading } from "@/components/ui/panel";
import { Alert, Badge } from "@/components/ui/feedback";
import { ReportView } from "@/components/test-feedback/report-view";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Test analysis" };
export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const user = await requireUser();
  const { submissionId } = await params;

  const submission = await getReport(user.id, submissionId).catch(() => null);
  if (!submission) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/test-feedback" className="text-sm text-muted transition-colors hover:text-bright">
          ← All analyses
        </Link>
      </div>

      <SectionHeading
        title={submission.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {submission.subject ? <Badge tone="neutral">{submission.subject}</Badge> : null}
            <span className="text-sm">Analysed {relativeTime(submission.createdAt)}</span>
          </span>
        }
      />

      {submission.status === "FAILED" ? (
        <Alert tone="rose" title="That analysis didn't finish" className="max-w-2xl">
          {submission.error ?? "Something went wrong reading the paper."} Try uploading it again — if
          it's a scan, it needs OCR first so the text is selectable.
        </Alert>
      ) : !submission.report ? (
        <Alert tone="violet" title="Still working on it" className="max-w-2xl">
          The analysis hasn&apos;t come back yet. Refresh in a moment.
        </Alert>
      ) : (
        <ReportView
          submissionId={submission.id}
          isPremium={user.plan === "PREMIUM"}
          summary={submission.report.summary}
          strengths={submission.report.strengths as never}
          weaknesses={submission.report.weaknesses as never}
          topicBreakdown={submission.report.topicBreakdown as never}
          estimatedScore={submission.report.estimatedScore}
        />
      )}
    </div>
  );
}
