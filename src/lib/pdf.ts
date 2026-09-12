import "server-only";

import { UPLOAD_LIMITS } from "@/lib/coins/rules";
import { UploadRejected } from "@/lib/storage";

export interface PdfExtraction {
  text: string;
  pageCount: number;
}

/**
 * Pull the text out of a PDF.
 *
 * Imported lazily, and pointed at the library file rather than the package
 * entry point on purpose: `pdf-parse`'s index.js has a debug branch that tries
 * to read a sample PDF from its own test directory when `module.parent` is
 * falsy, which it is under a bundler. That throws ENOENT on a file that isn't
 * shipped. Importing `lib/pdf-parse.js` skips the branch entirely.
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtraction> {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = ((mod as { default?: unknown }).default ?? mod) as (
    b: Buffer,
  ) => Promise<{ text: string; numpages: number }>;

  let parsed: { text: string; numpages: number };
  try {
    parsed = await pdfParse(buffer);
  } catch {
    throw new UploadRejected(
      "That PDF couldn't be read. If it's a scan, it needs to be text-searchable (run OCR on it first).",
    );
  }

  if (parsed.numpages > UPLOAD_LIMITS.maxPages) {
    throw new UploadRejected(
      `That PDF has ${parsed.numpages} pages — the limit is ${UPLOAD_LIMITS.maxPages}. Split it and upload the part you want to study.`,
    );
  }

  const text = parsed.text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (text.length < 200) {
    throw new UploadRejected(
      "There isn't enough readable text in that PDF. If it's a scan or photos, it needs OCR before it can be turned into questions.",
    );
  }

  return { text, pageCount: parsed.numpages };
}

/** A rough question count for a document of this size. */
export function suggestQuestionCount(text: string): number {
  const words = text.split(/\s+/).length;
  if (words < 400) return 5;
  if (words < 1200) return 8;
  if (words < 3000) return 12;
  return 15;
}
