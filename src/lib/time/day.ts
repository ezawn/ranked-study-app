/**
 * Day-boundary helpers.
 *
 * Streaks and daily limits are per calendar day *in the user's own timezone*,
 * not UTC. A day key is the string "YYYY-MM-DD". Every counter, streak and
 * quota in the app is keyed on one of these.
 *
 * Framework-free by design so it can be unit-tested without a database.
 */

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Milliseconds in one day. */
export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "YYYY-MM-DD" for the given instant, as seen in `timeZone`.
 * `en-CA` formats as ISO, which is what we want.
 */
export function dayKey(date: Date = new Date(), timeZone = "UTC"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    // Unknown timezone string — fall back to UTC rather than throwing inside
    // a reward transaction.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

export function isDayKey(value: string): boolean {
  return DAY_KEY_PATTERN.test(value);
}

/** Parse a day key into its numeric parts. */
function parseDayKey(key: string): { y: number; m: number; d: number } {
  if (!isDayKey(key)) throw new Error(`Invalid day key: ${key}`);
  return {
    y: Number(key.slice(0, 4)),
    m: Number(key.slice(5, 7)),
    d: Number(key.slice(8, 10)),
  };
}

/** Whole days between two day keys (b - a). Calendar arithmetic, DST-safe. */
export function daysBetween(a: string, b: string): number {
  const pa = parseDayKey(a);
  const pb = parseDayKey(b);
  const ua = Date.UTC(pa.y, pa.m - 1, pa.d);
  const ub = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((ub - ua) / DAY_MS);
}

/** Shift a day key by a number of days. */
export function addDays(key: string, days: number): string {
  const p = parseDayKey(key);
  const shifted = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return shifted.toISOString().slice(0, 10);
}

/** The day key immediately before `key`. */
export function previousDay(key: string): string {
  return addDays(key, -1);
}

/** Hours elapsed between two instants. */
export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (60 * 60 * 1000);
}

/** True when `date` is at least `hours` old relative to `now`. */
export function isOlderThanHours(date: Date, hours: number, now: Date = new Date()): boolean {
  return hoursBetween(date, now) >= hours;
}
