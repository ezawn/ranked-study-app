import "server-only";

import { randomBytes } from "node:crypto";

import { Prisma, type CommunityAccess, type CommunityRole } from "@prisma/client";

import { db } from "@/lib/db";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { isUniqueViolation } from "./coins";

/**
 * Communities.
 *
 * Three access types, per spec:
 *   PUBLIC   — anyone can join immediately
 *   PRIVATE  — invitation only
 *   REQUEST  — anyone can ask; a leader has to approve
 *
 * Every read of a community's inside (posts, resources, member list) goes
 * through `requireMembership`, so a private community is not merely hidden — it
 * is unreadable to non-members.
 */

export interface CommunityInput {
  name: string;
  description?: string | null;
  subject?: string | null;
  access: CommunityAccess;
}

const MAX_COMMUNITIES_PER_USER = 20;

// ---------------------------------------------------------------------------
// Membership helpers
// ---------------------------------------------------------------------------

export async function membershipOf(userId: string, communityId: string) {
  return db.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { role: true, joinedAt: true },
  });
}

async function requireMembership(userId: string, communityId: string): Promise<CommunityRole> {
  const member = await membershipOf(userId, communityId);
  if (!member) throw new ForbiddenError("You need to be a member to see that.");
  return member.role;
}

async function requireLeader(userId: string, communityId: string): Promise<void> {
  const role = await requireMembership(userId, communityId);
  if (role !== "LEADER" && role !== "MODERATOR") {
    throw new ForbiddenError("Only the community leader can do that.");
  }
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export async function listMyCommunities(userId: string) {
  const memberships = await db.communityMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: {
      community: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          subject: true,
          access: true,
          accent: true,
          memberCount: true,
        },
      },
    },
  });

  const communityIds = memberships.map((m) => m.communityId);

  const [resourceCounts, pendingCounts] = await Promise.all([
    db.communityResource.groupBy({
      by: ["communityId"],
      where: { communityId: { in: communityIds } },
      _count: { _all: true },
    }),
    db.communityJoinRequest.groupBy({
      by: ["communityId"],
      where: { communityId: { in: communityIds }, status: "PENDING" },
      _count: { _all: true },
    }),
  ]);

  const resources = new Map(resourceCounts.map((r) => [r.communityId, r._count._all]));
  const pending = new Map(pendingCounts.map((r) => [r.communityId, r._count._all]));

  return memberships.map((m) => ({
    ...m.community,
    role: m.role,
    resourceCount: resources.get(m.communityId) ?? 0,
    // Only leaders need to see the approval queue count.
    pendingRequests:
      m.role === "LEADER" || m.role === "MODERATOR" ? (pending.get(m.communityId) ?? 0) : 0,
  }));
}

/**
 * Communities a user could join.
 *
 * PRIVATE communities never appear here — they are invitation-only, so
 * listing them would leak their existence.
 */
export async function discoverCommunities(userId: string, opts: { query?: string } = {}) {
  const where: Prisma.CommunityWhereInput = {
    access: { in: ["PUBLIC", "REQUEST"] },
    members: { none: { userId } },
  };

  if (opts.query) {
    where.OR = [
      { name: { contains: opts.query, mode: "insensitive" } },
      { description: { contains: opts.query, mode: "insensitive" } },
      { subject: { contains: opts.query, mode: "insensitive" } },
    ];
  }

  const communities = await db.community.findMany({
    where,
    orderBy: [{ memberCount: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      subject: true,
      access: true,
      accent: true,
      memberCount: true,
      owner: { select: { name: true, username: true } },
    },
  });

  const requests = await db.communityJoinRequest.findMany({
    where: { userId, communityId: { in: communities.map((c) => c.id) }, status: "PENDING" },
    select: { communityId: true },
  });
  const requested = new Set(requests.map((r) => r.communityId));

  return communities.map((c) => ({ ...c, requestPending: requested.has(c.id) }));
}

// ---------------------------------------------------------------------------
// Creating and joining
// ---------------------------------------------------------------------------

export async function createCommunity(userId: string, input: CommunityInput) {
  const name = input.name.trim();
  if (name.length < 3) throw new ValidationError("Community names need at least 3 characters.");

  const owned = await db.community.count({ where: { ownerId: userId } });
  if (owned >= MAX_COMMUNITIES_PER_USER) {
    throw new ValidationError(`You can run up to ${MAX_COMMUNITIES_PER_USER} communities.`);
  }

  // Slugs must be unique; retry with a suffix rather than failing on a clash.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? slugify(name) : `${slugify(name)}-${randomBytes(2).toString("hex")}`;

    try {
      return await db.community.create({
        data: {
          slug,
          name,
          description: input.description?.trim() || null,
          subject: input.subject?.trim() || null,
          access: input.access,
          ownerId: userId,
          memberCount: 1,
          members: { create: { userId, role: "LEADER" } },
        },
        select: { id: true, slug: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  throw new ValidationError("Couldn't find a free name for that community — try a different one.");
}

export async function joinCommunity(userId: string, communityId: string) {
  const community = await db.community.findUnique({
    where: { id: communityId },
    select: { id: true, access: true, slug: true },
  });
  if (!community) throw new NotFoundError("That community doesn't exist.");

  if (community.access === "PRIVATE") {
    throw new ForbiddenError("That community is invitation-only.");
  }
  if (community.access === "REQUEST") {
    throw new ForbiddenError("That community needs the leader's approval — send a request instead.");
  }

  return addMember(userId, communityId);
}

async function addMember(userId: string, communityId: string, role: CommunityRole = "MEMBER") {
  return db.$transaction(async (tx) => {
    const existing = await tx.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) return { alreadyMember: true };

    await tx.communityMember.create({ data: { communityId, userId, role } });
    await tx.community.update({
      where: { id: communityId },
      data: { memberCount: { increment: 1 } },
    });
    return { alreadyMember: false };
  });
}

export async function requestToJoin(userId: string, communityId: string, message?: string) {
  const community = await db.community.findUnique({
    where: { id: communityId },
    select: { access: true },
  });
  if (!community) throw new NotFoundError("That community doesn't exist.");
  if (community.access !== "REQUEST") {
    throw new ValidationError("That community doesn't use join requests.");
  }

  const existing = await membershipOf(userId, communityId);
  if (existing) throw new ValidationError("You're already a member.");

  await db.communityJoinRequest.upsert({
    where: { communityId_userId: { communityId, userId } },
    create: { communityId, userId, message: message?.slice(0, 500) || null, status: "PENDING" },
    // A previously rejected request can be sent again.
    update: { status: "PENDING", message: message?.slice(0, 500) || null, decidedAt: null, decidedById: null },
  });
}

export async function decideJoinRequest(
  leaderId: string,
  requestId: string,
  approve: boolean,
): Promise<void> {
  const request = await db.communityJoinRequest.findUnique({
    where: { id: requestId },
    select: { id: true, communityId: true, userId: true, status: true },
  });
  if (!request) throw new NotFoundError("That request no longer exists.");

  await requireLeader(leaderId, request.communityId);

  if (request.status !== "PENDING") throw new ValidationError("That request has already been decided.");

  await db.communityJoinRequest.update({
    where: { id: requestId },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      decidedById: leaderId,
      decidedAt: new Date(),
    },
  });

  if (approve) await addMember(request.userId, request.communityId);
}

export async function leaveCommunity(userId: string, communityId: string) {
  const member = await membershipOf(userId, communityId);
  if (!member) return;

  if (member.role === "LEADER") {
    const others = await db.communityMember.count({
      where: { communityId, userId: { not: userId } },
    });
    if (others > 0) {
      throw new ValidationError(
        "You're the leader. Promote someone else before you leave, or delete the community.",
      );
    }
  }

  await db.$transaction([
    db.communityMember.delete({ where: { communityId_userId: { communityId, userId } } }),
    db.community.update({
      where: { id: communityId },
      data: { memberCount: { decrement: 1 } },
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function createInvite(
  userId: string,
  communityId: string,
  opts: { maxUses?: number; expiresInDays?: number } = {},
) {
  await requireLeader(userId, communityId);

  const code = randomBytes(9).toString("base64url");

  return db.communityInvite.create({
    data: {
      communityId,
      code,
      createdById: userId,
      maxUses: Math.max(1, Math.min(100, opts.maxUses ?? 25)),
      expiresAt: opts.expiresInDays
        ? new Date(Date.now() + opts.expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    select: { code: true, expiresAt: true, maxUses: true },
  });
}

export async function acceptInvite(userId: string, code: string) {
  const invite = await db.communityInvite.findUnique({
    where: { code },
    include: { community: { select: { id: true, slug: true, name: true } } },
  });

  if (!invite) throw new NotFoundError("That invite link isn't valid.");
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new ValidationError("That invite has expired. Ask for a new one.");
  }
  if (invite.useCount >= invite.maxUses) {
    throw new ValidationError("That invite has been used up.");
  }
  if (invite.invitedUserId && invite.invitedUserId !== userId) {
    throw new ForbiddenError("That invite was meant for someone else.");
  }

  const result = await addMember(userId, invite.communityId);

  if (!result.alreadyMember) {
    await db.communityInvite.update({
      where: { id: invite.id },
      data: { useCount: { increment: 1 }, usedAt: new Date() },
    });
  }

  return invite.community;
}

// ---------------------------------------------------------------------------
// Inside a community
// ---------------------------------------------------------------------------

export async function getCommunityBySlug(userId: string, slug: string) {
  const community = await db.community.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      subject: true,
      access: true,
      accent: true,
      memberCount: true,
      ownerId: true,
      createdAt: true,
      owner: { select: { name: true, username: true, image: true } },
    },
  });

  if (!community) throw new NotFoundError("That community doesn't exist.");

  const member = await membershipOf(userId, community.id);

  // A private community is not even acknowledged to outsiders.
  if (!member && community.access === "PRIVATE") {
    throw new NotFoundError("That community doesn't exist.");
  }

  const request = member
    ? null
    : await db.communityJoinRequest.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
        select: { status: true },
      });

  return { community, membership: member, requestStatus: request?.status ?? null };
}

export async function getCommunityInside(userId: string, communityId: string) {
  const role = await requireMembership(userId, communityId);

  const [members, resources, posts, pendingRequests, invites] = await Promise.all([
    db.communityMember.findMany({
      where: { communityId },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      take: 60,
      select: {
        role: true,
        joinedAt: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    }),
    db.communityResource.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        type: true,
        note: true,
        createdAt: true,
        sharedBy: { select: { name: true, username: true } },
        flashcardSet: { select: { id: true, title: true, subject: true, cardCount: true, isPublic: true } },
        quiz: {
          select: { id: true, title: true, subject: true, totalMarks: true, questionCount: true, isPublic: true },
        },
      },
    }),
    db.communityPost.findMany({
      where: { communityId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        body: true,
        pinned: true,
        createdAt: true,
        author: { select: { id: true, name: true, username: true, image: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          take: 20,
          select: {
            id: true,
            body: true,
            createdAt: true,
            author: { select: { id: true, name: true, username: true, image: true } },
          },
        },
      },
    }),
    role === "LEADER" || role === "MODERATOR"
      ? db.communityJoinRequest.findMany({
          where: { communityId, status: "PENDING" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            message: true,
            createdAt: true,
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        })
      : Promise.resolve([]),
    role === "LEADER" || role === "MODERATOR"
      ? db.communityInvite.findMany({
          where: { communityId, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { code: true, useCount: true, maxUses: true, expiresAt: true },
        })
      : Promise.resolve([]),
  ]);

  return { role, members, resources, posts, pendingRequests, invites };
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function createPost(userId: string, communityId: string, body: string) {
  await requireMembership(userId, communityId);

  const text = body.trim();
  if (!text) throw new ValidationError("Write something first.");
  if (text.length > 4000) throw new ValidationError("That post is too long.");

  return db.communityPost.create({
    data: { communityId, authorId: userId, body: text },
    select: { id: true },
  });
}

export async function createComment(userId: string, postId: string, body: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { communityId: true },
  });
  if (!post) throw new NotFoundError("That post no longer exists.");

  await requireMembership(userId, post.communityId);

  const text = body.trim();
  if (!text) throw new ValidationError("Write something first.");
  if (text.length > 2000) throw new ValidationError("That comment is too long.");

  return db.communityComment.create({
    data: { postId, authorId: userId, body: text },
    select: { id: true },
  });
}

export async function deletePost(userId: string, postId: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { authorId: true, communityId: true },
  });
  if (!post) return;

  if (post.authorId !== userId) {
    // Leaders can moderate; everyone else can only delete their own.
    await requireLeader(userId, post.communityId);
  } else {
    await requireMembership(userId, post.communityId);
  }

  await db.communityPost.delete({ where: { id: postId } });
}

// ---------------------------------------------------------------------------
// Shared resources
// ---------------------------------------------------------------------------

export async function shareResource(
  userId: string,
  communityId: string,
  input: { type: "FLASHCARD_SET" | "QUIZ"; id: string; note?: string },
) {
  await requireMembership(userId, communityId);

  // You can only share your own material — sharing someone else's private set
  // into a community would be a way to leak it.
  if (input.type === "FLASHCARD_SET") {
    const set = await db.flashcardSet.findUnique({
      where: { id: input.id },
      select: { ownerId: true },
    });
    if (!set) throw new NotFoundError("That set doesn't exist.");
    if (set.ownerId !== userId) throw new ForbiddenError("You can only share your own sets.");
  } else {
    const quiz = await db.quiz.findUnique({ where: { id: input.id }, select: { ownerId: true } });
    if (!quiz) throw new NotFoundError("That quiz doesn't exist.");
    if (quiz.ownerId !== userId) throw new ForbiddenError("You can only share your own quizzes.");
  }

  // Sharing the same thing twice updates the existing entry rather than adding
  // a duplicate.
  //
  // Deliberately a find-then-write rather than an upsert on the composite
  // unique. The constraint is the safety net here, not the mechanism: a
  // database that hasn't had it applied yet still de-duplicates correctly,
  // instead of the whole share failing on an ON CONFLICT the database can't
  // match.
  const match =
    input.type === "FLASHCARD_SET"
      ? { communityId, flashcardSetId: input.id }
      : { communityId, quizId: input.id };

  const existing = await db.communityResource.findMany({
    where: match,
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  // Re-shares from before this de-duplicated can have left several rows for the
  // same pair. Keep the newest and clear the rest, so the list stops showing
  // the same set over and over — and so the unique constraint can be applied
  // without tripping over old data.
  if (existing.length > 1) {
    await db.communityResource.deleteMany({
      where: { id: { in: existing.slice(1).map((row) => row.id) } },
    });
  }

  const fields = {
    sharedById: userId,
    note: input.note?.slice(0, 300) || null,
    // Re-sharing bumps it back to the top of the list — that's the point of
    // sharing it again.
    createdAt: new Date(),
  };

  if (existing[0]) {
    return db.communityResource.update({
      where: { id: existing[0].id },
      data: fields,
      select: { id: true },
    });
  }

  try {
    return await db.communityResource.create({
      data: {
        communityId,
        type: input.type,
        flashcardSetId: input.type === "FLASHCARD_SET" ? input.id : null,
        quizId: input.type === "QUIZ" ? input.id : null,
        ...fields,
      },
      select: { id: true },
    });
  } catch (error) {
    // Two shares of the same set arriving at once: the constraint caught the
    // loser. Turn it into the update it should have been.
    if (!isUniqueViolation(error)) throw error;

    const row = await db.communityResource.findFirstOrThrow({
      where: match,
      select: { id: true },
    });
    return db.communityResource.update({
      where: { id: row.id },
      data: fields,
      select: { id: true },
    });
  }
}

/**
 * Is this set or quiz shared into a community the viewer belongs to?
 *
 * This is what lets someone share a private set with their class without
 * publishing it to the whole world. Access follows membership: leave the
 * community and the set stops being visible.
 */
export async function sharedWithViewer(
  viewerId: string,
  ref: { flashcardSetId?: string; quizId?: string },
): Promise<boolean> {
  if (!ref.flashcardSetId && !ref.quizId) return false;

  const shared = await db.communityResource.findFirst({
    where: {
      ...(ref.flashcardSetId ? { flashcardSetId: ref.flashcardSetId } : {}),
      ...(ref.quizId ? { quizId: ref.quizId } : {}),
      community: { members: { some: { userId: viewerId } } },
    },
    select: { id: true },
  });

  return Boolean(shared);
}

/** Remove someone from a community. Leaders and moderators only. */
export async function removeMember(
  actorId: string,
  communityId: string,
  targetUserId: string,
): Promise<void> {
  await requireLeader(actorId, communityId);

  if (actorId === targetUserId) {
    throw new ValidationError("Use 'Leave community' rather than removing yourself.");
  }

  const community = await db.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true },
  });
  if (!community) throw new NotFoundError("That community doesn't exist.");

  if (community.ownerId === targetUserId) {
    throw new ForbiddenError("The community leader can't be removed.");
  }

  const membership = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId: targetUserId } },
    select: { id: true, role: true },
  });
  if (!membership) return;

  // A moderator can remove ordinary members; only the leader can remove a
  // moderator, so two moderators can't get into a removal war.
  if (membership.role === "MODERATOR") {
    const actor = await membershipOf(actorId, communityId);
    if (actor?.role !== "LEADER") {
      throw new ForbiddenError("Only the leader can remove a moderator.");
    }
  }

  await db.$transaction([
    db.communityMember.delete({
      where: { communityId_userId: { communityId, userId: targetUserId } },
    }),
    db.community.update({
      where: { id: communityId },
      data: { memberCount: { decrement: 1 } },
    }),
    // Any pending request from them is cleared too, so removing someone
    // doesn't leave a stale approval sitting in the queue.
    db.communityJoinRequest.deleteMany({ where: { communityId, userId: targetUserId } }),
  ]);
}

export async function unshareResource(userId: string, resourceId: string) {
  const resource = await db.communityResource.findUnique({
    where: { id: resourceId },
    select: { sharedById: true, communityId: true },
  });
  if (!resource) return;

  if (resource.sharedById !== userId) {
    await requireLeader(userId, resource.communityId);
  }

  await db.communityResource.delete({ where: { id: resourceId } });
}

/** The user's own material, for the share picker. */
export async function shareableContent(userId: string) {
  const [sets, quizzes] = await Promise.all([
    db.flashcardSet.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, cardCount: true },
    }),
    db.quiz.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, questionCount: true },
    }),
  ]);
  return { sets, quizzes };
}
