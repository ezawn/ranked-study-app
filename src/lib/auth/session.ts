import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "./index";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/utils";
import type { Plan } from "@prisma/client";

export interface SessionUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  /** Avatar URL from an OAuth provider, if any. */
  image: string | null;
  /** Storage key for an uploaded avatar. */
  imageKey: string | null;
  /** What the UI should actually render: uploaded avatar wins over OAuth. */
  avatarUrl: string | null;
  plan: Plan;
  coinBalance: number;
  timezone: string;
  timezoneChangedAt: Date | null;
  hasPassword: boolean;
  createdAt: Date;
}


/**
 * The current user, loaded fresh from the database.
 *
 * Deliberately NOT read from the JWT: plan and coin balance drive limits and
 * rewards, so they are read from the row of record on every request. `cache`
 * dedupes it to one query per render pass.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      imageKey: true,
      plan: true,
      coinBalance: true,
      timezone: true,
      timezoneChangedAt: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const { passwordHash, ...rest } = user;

  return {
    ...rest,
    avatarUrl: fileUrl(user.imageKey) ?? user.image,
    // Whether they have one, never the hash itself — this object reaches
    // server components and must not carry a credential around.
    hasPassword: Boolean(passwordHash),
  };
});

/** For pages: redirects to sign-in when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new UnauthorizedError();
  return id;
}

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "You need to be signed in to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "You don't have access to that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** True when the user is on the premium plan and it hasn't lapsed. */
export function isPremium(user: { plan: Plan; planExpiresAt?: Date | null }): boolean {
  if (user.plan !== "PREMIUM") return false;
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) return false;
  return true;
}
