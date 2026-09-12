import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Where to fetch a stored file from.
 *
 * Uploads live outside anything served statically, so they come back out
 * through an authorised route rather than a public path.
 */
export function fileUrl(key: string | null | undefined): string | null {
  return key ? `/api/files/${key}` : null;
}

/** 1234 -> "1,234" */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

/** Compact display for big coin counts: 1200 -> "1.2k" */
export function formatCompact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** "3 minutes ago", "in 2 days" */
export function relativeTime(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - now.getTime();
  const abs = Math.abs(diffMs);

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 365 * 24 * 60 * 60 * 1000],
    ["month", 30 * 24 * 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
    ["hour", 60 * 60 * 1000],
    ["minute", 60 * 1000],
  ];

  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}

/** mm:ss for quiz timers. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** URL-safe slug from a name, with a random suffix for uniqueness. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "community";
}

/** Deterministic accent colour from any string, for avatars and subject tags. */
export function accentFor(seed: string): string {
  const accents = ["violet", "cyan", "lime", "amber", "rose", "sky"] as const;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return accents[hash % accents.length]!;
}

/** Initials for an avatar fallback. */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Shuffle a copy of an array (Fisher-Yates). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Truncate for card previews. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
