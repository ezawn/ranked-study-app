"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Alert, Badge, Meter, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CrownIcon, FileTextIcon, SparkIcon, UploadIcon, XIcon } from "@/components/icons";
import { importPdfAction } from "@/server/actions/quizzes";
import { UPLOAD_LIMITS } from "@/lib/coins/rules";
import { cn } from "@/lib/utils";

export function PdfImport({
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
  const [markScheme, setMarkScheme] = useState("");
  const [showMarkScheme, setShowMarkScheme] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outOfQuota = !quota.unlimited && quota.remaining <= 0;
  const maxMb = Math.round(UPLOAD_LIMITS.maxBytes / (1024 * 1024));

  function accept(candidate: File | undefined) {
    setError(null);
    if (!candidate) return;

    if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDFs for now.");
      return;
    }
    if (candidate.size > UPLOAD_LIMITS.maxBytes) {
      setError(`That file is ${(candidate.size / (1024 * 1024)).toFixed(1)}MB — the limit is ${maxMb}MB.`);
      return;
    }

    setFile(candidate);
    if (!title) setTitle(candidate.name.replace(/\.pdf$/i, ""));
  }

  async function submit() {
    if (!file) return setError("Choose a PDF first.");

    setError(null);
    setWorking(true);

    const formData = new FormData();
    formData.set("file", file);
    if (title.trim()) formData.set("title", title.trim());
    if (subject.trim()) formData.set("subject", subject.trim());
    if (markScheme.trim()) formData.set("markScheme", markScheme.trim());

    const result = await importPdfAction(formData);
    setWorking(false);

    if (!result.ok) return setError(result.error);

    toast.success(
      `Built ${result.data.questionCount} questions`,
      result.data.isRealAi
        ? undefined
        : "Made by the local provider — add an ANTHROPIC_API_KEY for model-written questions.",
    );
    navigate(`/quizzes/${result.data.quizId}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="rose">{error}</Alert> : null}

      {outOfQuota ? (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="flex flex-wrap items-center gap-2 font-display font-semibold text-bright">
                That&apos;s today&apos;s conversion used
                <Badge tone="coin">
                  <CrownIcon size={10} /> Premium is unlimited
                </Badge>
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                Free accounts get {quota.limit} PDF conversion a day. Yours resets at midnight.
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title="Upload a PDF"
          subtitle="Notes, a textbook chapter, a past paper — anything with real text in it."
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

        {/* The quota meter measures conversions, not currency, so it fills with
            graphite. Gold on this screen means the plan that buys more. */}
        {!quota.unlimited ? (
          <Meter value={quota.used} max={quota.limit} className="mb-4" />
        ) : null}

        {/*
         * The dropzone, and its five states.
         *
         * None of them are told apart by hue, because in this palette they
         * cannot be: idle is a dashed hairline on a raised ground, dragging
         * turns the edge solid and fills the tile, a chosen file replaces the
         * whole contents and closes the edge, working spins in place of the
         * document mark, and no quota left sinks the ground and dims it.
         */}
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
            "rounded-sq-lg p-6 text-center transition-colors duration-200 sm:p-8",
            dragging
              ? "border-2 border-solid border-accent bg-accent/8"
              : file
                ? "border-2 border-solid border-line-strong bg-surface-2"
                : outOfQuota
                  ? "border border-dashed border-line bg-sunken"
                  : "border-2 border-dashed border-line-strong bg-raise",
          )}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sq border border-line bg-surface text-muted shadow-card">
                {working ? <Spinner className="h-5 w-5" /> : <FileTextIcon size={20} />}
              </span>
              <div className="min-w-0 text-left">
                <div className="truncate font-display font-semibold text-bright">{file.name}</div>
                <div className="text-xs text-faint num">
                  {(file.size / (1024 * 1024)).toFixed(1)}MB
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Remove file"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sq-sm text-faint transition-colors duration-200 hover:bg-raise-3 hover:text-rose focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <XIcon size={16} />
              </button>
            </div>
          ) : (
            <>
              <span
                className={cn(
                  "mx-auto flex h-12 w-12 items-center justify-center rounded-sq border transition-colors duration-200",
                  dragging
                    ? "border-transparent bg-accent text-accent-ink"
                    : outOfQuota
                      ? "border-line bg-raise text-faint"
                      : "border-line bg-surface text-faint shadow-card",
                )}
              >
                <UploadIcon size={24} />
              </span>
              <p className="mt-4 font-display font-semibold text-bright">
                Drop a PDF here, or choose a file
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">
                Up to {maxMb}MB and {UPLOAD_LIMITS.maxPages} pages. Scans need OCR first — the text
                has to be selectable.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
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
      </Panel>

      <Panel>
        <PanelHeader title="Details" subtitle="All optional — the AI fills in what you leave blank." />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Quiz title" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Taken from the filename"
              maxLength={160}
            />
          </Field>
          <Field label="Subject" htmlFor="subject">
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Chemistry"
              maxLength={80}
            />
          </Field>
        </div>

        {/* An inline text link, so it carries the permanent underline — the
            accent has no hue left to announce it with. */}
        <button
          type="button"
          onClick={() => setShowMarkScheme((v) => !v)}
          className="link mt-4 text-sm font-medium"
        >
          {showMarkScheme ? "Hide mark scheme" : "Add a mark scheme"}
        </button>

        {showMarkScheme ? (
          <Field
            className="mt-3"
            hint="If your PDF already contains the mark scheme, skip this — the AI will use it from the document."
          >
            <Textarea
              value={markScheme}
              onChange={(e) => setMarkScheme(e.target.value)}
              rows={6}
              maxLength={8000}
              placeholder="Paste the mark scheme or answer key here…"
            />
          </Field>
        ) : null}
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
        {working ? (
          <span className="text-[13.5px] text-muted">Reading the PDF and writing questions…</span>
        ) : null}
        <Button size="lg" onClick={submit} disabled={!file || working || outOfQuota}>
          {working ? <Spinner /> : <SparkIcon size={16} />}
          Build the quiz
        </Button>
      </div>
    </div>
  );
}
