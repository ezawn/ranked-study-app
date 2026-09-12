import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/auth/session";
import { storage, validateImage, sha256 } from "@/lib/storage";
import { dayKey, hoursBetween } from "@/lib/time/day";
import { passwordResetEmail, sendMail } from "@/lib/mail";
import { env } from "@/lib/env";

/**
 * Account management: profile, timezone, avatar, password.
 */

const TIMEZONE_COOLDOWN_DAYS = 7;
const RESET_TOKEN_TTL_MINUTES = 60;

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz }).format();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfile(
  userId: string,
  input: { name: string; username: string | null },
): Promise<void> {
  if (input.username) {
    const taken = await db.user.findFirst({
      where: { username: input.username.toLowerCase(), id: { not: userId } },
      select: { id: true },
    });
    if (taken) throw new ValidationError("That username is already taken.");
  }

  await db.user.update({
    where: { id: userId },
    data: { name: input.name, username: input.username?.toLowerCase() || null },
  });
}

// ---------------------------------------------------------------------------
// Timezone
// ---------------------------------------------------------------------------

export interface TimezoneChangeResult {
  changed: boolean;
  /** Set when the change was refused because of the cooldown. */
  nextAllowedAt: Date | null;
  /** True when the change moved the user onto a different calendar day. */
  countersCarried: boolean;
}

/**
 * Change a user's timezone without handing them a fresh set of daily caps.
 *
 * Every daily counter in the app is keyed on the local calendar date, so
 * jumping timezones would otherwise land on an unused key with all limits
 * reset. Two things stop that:
 *
 *   1. The change is limited to once a week.
 *   2. When it does move the user onto a different date, today's counters move
 *      with them — the new key inherits whatever the old one had spent.
 *
 * Someone genuinely moving country notices nothing. Someone hopping timezones
 * to farm coins gets neither a reset nor a second go at it.
 */
export async function changeTimezone(
  userId: string,
  timezone: string,
): Promise<TimezoneChangeResult> {
  if (!isValidTimezone(timezone)) throw new ValidationError("That isn't a timezone I recognise.");

  const now = new Date();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true, timezoneChangedAt: true },
  });
  if (!user) throw new NotFoundError("Unknown user.");

  if (user.timezone === timezone) {
    return { changed: false, nextAllowedAt: null, countersCarried: false };
  }

  if (user.timezoneChangedAt) {
    const hoursSince = hoursBetween(user.timezoneChangedAt, now);
    if (hoursSince < TIMEZONE_COOLDOWN_DAYS * 24) {
      const nextAllowedAt = new Date(
        user.timezoneChangedAt.getTime() + TIMEZONE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
      );
      throw Object.assign(
        new ValidationError(
          `Timezone can be changed once every ${TIMEZONE_COOLDOWN_DAYS} days. You can change it again on ${nextAllowedAt.toLocaleDateString("en-GB")}.`,
        ),
        { nextAllowedAt },
      );
    }
  }

  const oldDay = dayKey(now, user.timezone);
  const newDay = dayKey(now, timezone);
  const crossesDay = oldDay !== newDay;

  await db.$transaction(async (tx) => {
    if (crossesDay) await carryCounters(tx, userId, oldDay, newDay);

    await tx.user.update({
      where: { id: userId },
      data: { timezone, timezoneChangedAt: now },
    });
  });

  return { changed: true, nextAllowedAt: null, countersCarried: crossesDay };
}

/**
 * Move today's usage onto the new date key.
 *
 * Uses the higher of the two values rather than the sum, so a user who
 * genuinely has activity under both keys isn't charged twice for it — but can
 * never end up with less spent than they had.
 */
async function carryCounters(
  tx: Prisma.TransactionClient,
  userId: string,
  oldDay: string,
  newDay: string,
): Promise<void> {
  const coinCounters = await tx.coinDailyCounter.findMany({ where: { userId, day: oldDay } });
  for (const counter of coinCounters) {
    const existing = await tx.coinDailyCounter.findUnique({
      where: { userId_day_source: { userId, day: newDay, source: counter.source } },
    });
    await tx.coinDailyCounter.upsert({
      where: { userId_day_source: { userId, day: newDay, source: counter.source } },
      create: { userId, day: newDay, source: counter.source, count: counter.count },
      update: { count: Math.max(existing?.count ?? 0, counter.count) },
    });
  }

  const usageCounters = await tx.usageCounter.findMany({ where: { userId, day: oldDay } });
  for (const counter of usageCounters) {
    const existing = await tx.usageCounter.findUnique({
      where: { userId_day_feature: { userId, day: newDay, feature: counter.feature } },
    });
    await tx.usageCounter.upsert({
      where: { userId_day_feature: { userId, day: newDay, feature: counter.feature } },
      create: { userId, day: newDay, feature: counter.feature, count: counter.count },
      update: { count: Math.max(existing?.count ?? 0, counter.count) },
    });
  }

  const oldTime = await tx.studyTimeDay.findUnique({
    where: { userId_day: { userId, day: oldDay } },
  });
  if (oldTime) {
    const existing = await tx.studyTimeDay.findUnique({
      where: { userId_day: { userId, day: newDay } },
    });
    await tx.studyTimeDay.upsert({
      where: { userId_day: { userId, day: newDay } },
      create: {
        userId,
        day: newDay,
        activeSeconds: oldTime.activeSeconds,
        coinsAwarded: oldTime.coinsAwarded,
        studySeconds: oldTime.studySeconds,
        studyBonusesAwarded: oldTime.studyBonusesAwarded,
        lastHeartbeatAt: oldTime.lastHeartbeatAt,
      },
      update: {
        activeSeconds: Math.max(existing?.activeSeconds ?? 0, oldTime.activeSeconds),
        coinsAwarded: Math.max(existing?.coinsAwarded ?? 0, oldTime.coinsAwarded),
        studySeconds: Math.max(existing?.studySeconds ?? 0, oldTime.studySeconds),
        studyBonusesAwarded: Math.max(
          existing?.studyBonusesAwarded ?? 0,
          oldTime.studyBonusesAwarded,
        ),
      },
    });
  }

  // The daily quiz is keyed on the date too — without this, crossing a day
  // boundary would hand out a second daily quiz, streak multiplier and all.
  const assignment = await tx.dailyQuizAssignment.findUnique({
    where: { userId_day: { userId, day: oldDay } },
  });
  if (assignment) {
    const clash = await tx.dailyQuizAssignment.findUnique({
      where: { userId_day: { userId, day: newDay } },
    });
    if (!clash) {
      await tx.dailyQuizAssignment.update({
        where: { id: assignment.id },
        data: { day: newDay },
      });
    }
  }

  const streak = await tx.streakState.findUnique({ where: { userId } });
  if (streak?.lastAttemptDay === oldDay) {
    await tx.streakState.update({ where: { userId }, data: { lastAttemptDay: newDay } });
  }
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export async function setAvatar(
  userId: string,
  file: { buffer: Buffer; filename: string },
): Promise<{ key: string }> {
  const mimeType = validateImage(file.buffer, file.filename);

  const stored = await storage().put(file.buffer, {
    filename: file.filename,
    mimeType,
  });

  const previous = await db.user.findUnique({
    where: { id: userId },
    select: { imageKey: true },
  });

  await db.$transaction([
    db.upload.create({
      data: {
        userId,
        kind: "AVATAR",
        storageKey: stored.key,
        filename: file.filename.slice(0, 200),
        mimeType,
        sizeBytes: stored.sizeBytes,
        checksum: sha256(file.buffer),
        status: "READY",
      },
    }),
    db.user.update({ where: { id: userId }, data: { imageKey: stored.key } }),
  ]);

  // Tidy up the one it replaced — no point keeping avatars nobody can reach.
  if (previous?.imageKey) {
    await storage().delete(previous.imageKey).catch(() => undefined);
    await db.upload.deleteMany({ where: { userId, storageKey: previous.imageKey } });
  }

  return { key: stored.key };
}

export async function removeAvatar(userId: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { imageKey: true } });
  if (!user?.imageKey) return;

  await db.user.update({ where: { id: userId }, data: { imageKey: null } });
  await storage().delete(user.imageKey).catch(() => undefined);
  await db.upload.deleteMany({ where: { userId, storageKey: user.imageKey } });
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export async function changePassword(
  userId: string,
  currentPassword: string | null,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 8) {
    throw new ValidationError("Passwords need to be at least 8 characters.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new NotFoundError("Unknown user.");

  if (user.passwordHash) {
    // Setting a new password requires proving you know the old one, otherwise
    // anyone who borrowed an unlocked laptop could lock the owner out.
    if (!currentPassword) throw new ValidationError("Enter your current password.");
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ValidationError("That current password isn't right.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  // Any outstanding reset links are void once the password changes.
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Start a password reset.
 *
 * Always reports success, whether or not the address exists. Telling an
 * anonymous caller which emails have accounts is a free user-enumeration
 * oracle, and there is no upside to it.
 */
export async function requestPasswordReset(email: string): Promise<{ logged: boolean }> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true },
  });

  if (!user?.email) return { logged: false };

  // One live token at a time.
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
    },
  });

  const link = `${env.authUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
  const result = await sendMail({ to: user.email, ...passwordResetEmail(user.name, link) });

  return { logged: result.logged };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new ValidationError("Passwords need to be at least 8 characters.");
  }

  const candidate = hashToken(token);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: candidate },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, tokenHash: true },
  });

  const invalid = new ValidationError(
    "That reset link isn't valid any more. Request a new one.",
  );

  if (!record) throw invalid;

  // Constant-time comparison, so response timing can't be used to probe for
  // valid tokens.
  const matches = timingSafeEqual(
    Buffer.from(record.tokenHash, "hex"),
    Buffer.from(candidate, "hex"),
  );
  if (!matches) throw invalid;
  if (record.usedAt) throw invalid;
  if (record.expiresAt < new Date()) throw invalid;

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Every session is invalidated by the password change on next lookup; any
    // other outstanding links are burned here.
    db.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
}
