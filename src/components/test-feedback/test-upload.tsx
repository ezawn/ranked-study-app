"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert, Badge, Meter, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CrownIcon, FeedbackIcon, FileTextIcon, UploadIcon, XIcon } from "@/components/icons";
import { analyseTestAction } from "@/server/actions/test-feedback";
import { UPLOAD_LIMITS } from "@/lib/coins/rules";
import { cn } from "@/lib/utils";

export function TestUpload({
  quota,
}: {
  quota: { used: number; limit: number; unlimited: boolean; remaining: number };
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outOfQuota = !quota.unlimited && quota.remaining <= 0;
  const maxMb = Math.round(UPLOAD_LIMITS.maxBytes / (1024 * 1024));

  function accept(candidate: File | undefined) {
    setError(null);
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
      return setError("Only PDFs for now.");
    }
    if (candidate.size > UPLOAD_LIMITS.maxBytes) {
      return setError(`That file is ${(candidate.size / (1024 * 1024)).toFixed(1)}MB — the limit is ${maxMb}MB.`);
    }
    setFile(candidate);
    if (!title) setTitle(candidate.name.replace(/\.pdf$/i, ""));
  }

  async function submit() {
    if (!file) return setError("Choose your test first.");

    setError(null);
    setWorking(true);

    const formData = new FormData();
    formData.set("file", file);
    if (title.trim()) formData.set("title", title.trim());
    if (subject.trim()) formData.set("subject", subject.trim());

    const result = await analyseTestAction(formData);
    setWorking(false);

    if (!result.ok) return setError(result.error);

    toast.success("Analysis ready");
    navigate(`/test-feedback/${result.data.submissionId}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="rose">{error}</Alert> : null}

      <Panel>
        <PanelHeader
          title="Upload your test"
          subtitle="A marked paper works best — the AI can see where the marks actually went."
          action={
            quota.unlimited ? (
              <Badge tone="coin">
                <CrownIcon size={10} /> Unlimited
              </Badge>
            ) : (
              <span className="text-xs text-muted num">
                {quota.used} / {quota.limit} today
              </span>
            )
          }
        />

        {!quota.unlimited ? (
          <Meter value={quota.used} max={quota.limit} className="mb-4" />
        ) : null}

        {outOfQuota ? (
          <Alert tone="violet" title="That's today's analysis used" className="mb-4">
            Free accounts get {quota.limit} test analysis a day, separate from your PDF-to-quiz
            allowance. Premium is unlimited.
          </Alert>
        ) : null}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files[0]);
          }}
          className={cn(
            "rounded-sq-lg border-2 border-dashed px-5 py-8 text-center transition-colors sm:px-8",
            dragging
              ? "border-accent bg-accent/8"
              : file
                ? "border-lime/40 bg-lime/5"
                : "border-line-strong bg-raise",
          )}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileTextIcon size={22} className="shrink-0 text-lime" />
              <div className="min-w-0 text-left">
                <div className="truncate font-display font-semibold text-bright">{file.name}</div>
                <div className="text-xs text-faint num">
                  {(file.size / (1024 * 1024)).toFixed(1)}MB
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Remove file"
                className="shrink-0 rounded-sq-sm p-1.5 text-faint transition-colors hover:bg-raise-3 hover:text-rose"
              >
                <XIcon size={16} />
              </button>
            </div>
          ) : (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-sq border border-line bg-surface text-faint shadow-card">
                <UploadIcon size={22} />
              </span>
              <p className="mt-4 font-display text-[15px] font-semibold text-bright">
                Drop your test here, or choose a file
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                PDF, up to {maxMb}MB. Photos of a paper need OCR first.
              </p>
              <Button
                variant="secondary"
                className="mt-5"
                onClick={() => inputRef.current?.click()}
                disabled={outOfQuota}
              >
                Choose file
              </Button>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => accept(e.target.files?.[0])}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="What was it?" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mock paper 2 — January"
              maxLength={160}
            />
          </Field>
          <Field label="Subject" htmlFor="subject">
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="History"
              maxLength={80}
            />
          </Field>
        </div>

        {/* The action bar reads as the end of the form rather than another row
            in it, so the hairline is doing the same job it does on every other
            panel with a commit button. */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
          {working ? <span className="text-sm text-muted">Reading your paper…</span> : null}
          <Button onClick={submit} disabled={!file || working || outOfQuota} size="lg">
            {working ? <Spinner /> : <FeedbackIcon size={16} />}
            Analyse it
          </Button>
        </div>
      </Panel>
    </div>
  );
}
