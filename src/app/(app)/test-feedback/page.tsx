import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { quotaState } from "@/server/services/uploads";
import { listSubmissions } from "@/server/services/test-feedback";
import { Panel, PanelHeader, SectionHeading } from "@/components/ui/panel";
import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { TestUpload } from "@/components/test-feedback/test-upload";
import { usingRealAi } from "@/lib/env";
import { relativeTime, truncate } from "@/lib/utils";
import { FeedbackIcon, TargetIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Test feedback" };
export const dynamic = "force-dynamic";

export default async function TestFeedbackPage() {
  const user = await requireUser();

  const [quota, submissions] = await Promise.all([
    quotaState(user.id, "TEST_FEEDBACK", user.plan, user.timezone),
    listSubmissions(user.id),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Test feedback"
        subtitle="Upload a paper you've done and find out what you're actually good at — and where the marks keep leaking."
      />

      {!usingRealAi() ? (
        <Alert tone="amber" title="Running on the local provider">
          No AI key is configured, so the analysis comes from the built-in provider. Set{" "}
          <code className="text-bright">ANTHROPIC_API_KEY</code> in{" "}
          <code className="text-bright">.env</code> for a real read of your paper.
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <TestUpload
          quota={{
            used: quota.used,
            limit: Number.isFinite(quota.limit) ? quota.limit : 0,
            unlimited: quota.unlimited,
            remaining: Number.isFinite(quota.remaining) ? quota.remaining : 999,
          }}
        />

        <Panel>
          <PanelHeader title="Past analyses" />
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-sq border border-dashed border-line-strong px-4 py-10 text-center">
              <TargetIcon size={22} className="text-faint" />
              <p className="text-sm leading-relaxed text-muted">
                Nothing analysed yet. Your reports will collect here.
              </p>
            </div>
          ) : (
            <ul className="-mx-2">
              {submissions.map((submission) => {
                const weaknessCount = Array.isArray(submission.report?.weaknesses)
                  ? (submission.report.weaknesses as unknown[]).length
                  : 0;

                return (
                  <li key={submission.id}>
                    <Link
                      href={`/test-feedback/${submission.id}`}
                      className="flex items-start gap-3 rounded-sq px-2 py-2.5 transition-colors hover:bg-raise-2"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sq bg-raise-2 text-accent">
                        <FeedbackIcon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-bright">
                          {truncate(submission.title, 40)}
                        </span>
                        <span className="block text-xs text-faint">
                          {relativeTime(submission.createdAt)}
                          {submission.subject ? ` · ${submission.subject}` : ""}
                        </span>
                      </span>
                      {submission.status === "FAILED" ? (
                        <Badge tone="rose">Failed</Badge>
                      ) : weaknessCount > 0 ? (
                        <Badge tone="amber">{weaknessCount} to fix</Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={<FeedbackIcon size={22} />}
          title="How this works"
          description="Upload a completed test. The analysis names your strongest topics with evidence from the paper, then lists what's costing you marks and what to do about each one. On premium it can also build practice questions aimed at those gaps and drop them straight into your quiz library."
        />
      ) : null}
    </div>
  );
}
