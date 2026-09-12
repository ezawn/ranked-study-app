"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { guarded } from "./helpers";
import {
  acceptInvite,
  createComment,
  createCommunity,
  createInvite,
  createPost,
  decideJoinRequest,
  deletePost,
  joinCommunity,
  leaveCommunity,
  removeMember,
  requestToJoin,
  shareResource,
  unshareResource,
} from "@/server/services/communities";

const communitySchema = z.object({
  name: z.string().trim().min(3, "Community names need at least 3 characters.").max(60),
  description: z.string().max(600).nullish(),
  subject: z.string().max(80).nullish(),
  access: z.enum(["PUBLIC", "PRIVATE", "REQUEST"]),
});

export async function createCommunityAction(input: unknown) {
  return guarded("communities.create", async (userId) => {
    const data = communitySchema.parse(input);
    const community = await createCommunity(userId, data);
    revalidatePath("/communities");
    return community;
  });
}

export async function joinCommunityAction(communityId: string) {
  return guarded("communities.join", async (userId) => {
    await joinCommunity(userId, communityId);
    revalidatePath("/communities");
    return null;
  });
}

export async function requestJoinAction(communityId: string, message?: string) {
  return guarded("communities.request", async (userId) => {
    await requestToJoin(userId, communityId, message);
    revalidatePath("/communities");
    return null;
  });
}

export async function decideRequestAction(requestId: string, approve: boolean) {
  return guarded("communities.decide", async (userId) => {
    await decideJoinRequest(userId, requestId, approve);
    revalidatePath("/communities");
    return null;
  });
}

export async function leaveCommunityAction(communityId: string) {
  return guarded("communities.leave", async (userId) => {
    await leaveCommunity(userId, communityId);
    revalidatePath("/communities");
    return null;
  });
}

export async function removeMemberAction(communityId: string, targetUserId: string) {
  return guarded("communities.remove", async (userId) => {
    await removeMember(userId, communityId, targetUserId);
    revalidatePath("/communities");
    return null;
  });
}

export async function createInviteAction(communityId: string) {
  return guarded("communities.invite", async (userId) => createInvite(userId, communityId));
}

export async function acceptInviteAction(code: string) {
  return guarded("communities.accept", async (userId) => {
    const community = await acceptInvite(userId, code.trim());
    revalidatePath("/communities");
    return community;
  });
}

export async function createPostAction(communityId: string, body: string) {
  return guarded("communities.post", async (userId) => {
    const post = await createPost(userId, communityId, body);
    revalidatePath("/communities");
    return post;
  });
}

export async function createCommentAction(postId: string, body: string) {
  return guarded("communities.comment", async (userId) => {
    const comment = await createComment(userId, postId, body);
    revalidatePath("/communities");
    return comment;
  });
}

export async function deletePostAction(postId: string) {
  return guarded("communities.post.delete", async (userId) => {
    await deletePost(userId, postId);
    revalidatePath("/communities");
    return null;
  });
}

const shareSchema = z.object({
  communityId: z.string().cuid(),
  type: z.enum(["FLASHCARD_SET", "QUIZ"]),
  id: z.string().cuid(),
  note: z.string().max(300).optional(),
});

export async function shareResourceAction(input: unknown) {
  return guarded("communities.share", async (userId) => {
    const data = shareSchema.parse(input);
    const resource = await shareResource(userId, data.communityId, {
      type: data.type,
      id: data.id,
      note: data.note,
    });
    revalidatePath("/communities");
    return resource;
  });
}

export async function unshareResourceAction(resourceId: string) {
  return guarded("communities.unshare", async (userId) => {
    await unshareResource(userId, resourceId);
    revalidatePath("/communities");
    return null;
  });
}
