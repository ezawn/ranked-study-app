"use client";

import { useRef, useState } from "react";

import { Spinner } from "@/components/ui/feedback";
import { ImageIcon, TrashIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";
import { uploadImageAction } from "@/server/actions/uploads";
import { cn, fileUrl } from "@/lib/utils";

/**
 * Attach an image to a card side or a question.
 *
 * Uploads immediately and hands back a storage key — the editor holds the key,
 * not the file, so saving a set is the same cheap operation whether it has
 * images or not.
 */
export function ImagePicker({
  value,
  onChange,
  kind = "CARD_IMAGE",
  label = "Add image",
  className,
}: {
  value: string | null;
  onChange: (key: string | null) => void;
  kind?: "CARD_IMAGE" | "QUESTION_IMAGE";
  label?: string;
  className?: string;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);

    const result = await uploadImageAction(formData);
    setUploading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    onChange(result.data.key);
  }

  if (value) {
    return (
      <div className={cn("relative overflow-hidden rounded-sq border border-line", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl(value)!}
          alt=""
          className="max-h-40 w-full bg-sunken object-contain"
        />
        {/* A 36px tap target, not a 26px one — this is the only way back out of
            a wrong image and it has to be hittable with a thumb. */}
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove image"
          className={cn(
            "absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center",
            "rounded-sq-sm border border-line bg-surface/90 text-muted backdrop-blur",
            "transition-colors duration-200 hover:bg-surface hover:text-rose",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <TrashIcon size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void upload(e.dataTransfer.files[0]);
      }}
      className={className}
    >
      {/*
       * Attaching an image is the rare case, so at rest this is a hairline that
       * stays out of the way of a long card list. The drag state is told apart
       * by shape as well as tone — the dashed edge becomes solid — because in a
       * monochrome palette a border that only darkens is not a state change.
       */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex h-9 w-full items-center justify-center gap-2 rounded-sq border px-3",
          "text-[13px] font-medium transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          dragging
            ? "border-solid border-accent bg-accent/8 text-bright"
            : "border-dashed border-line text-faint hover:border-line-strong hover:bg-raise hover:text-bright",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? <Spinner className="h-3.5 w-3.5" /> : <ImageIcon size={14} />}
        {uploading ? "Uploading…" : label}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
    </div>
  );
}

/**
 * An image on a card or question, as the student sees it.
 *
 * Constrained rather than stretched — a diagram that has been distorted to
 * fill a box is worse than useless for revision.
 */
export function StudyImage({
  imageKey,
  alt = "",
  className,
}: {
  imageKey: string | null | undefined;
  alt?: string;
  className?: string;
}) {
  const url = fileUrl(imageKey);
  if (!url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn(
        "mx-auto max-h-64 w-auto max-w-full rounded-sq border border-line bg-sunken object-contain",
        className,
      )}
    />
  );
}

/** Small marker for list rows, so you can tell at a glance a card has an image. */
export function ImageBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="text-faint" title="Has an image">
      <ImageIcon size={13} />
    </span>
  );
}
