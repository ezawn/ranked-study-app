"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Badge, Spinner } from "@/components/ui/feedback";
import { Panel } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/layout/user-menu";
import { CrownIcon, MessageIcon, TrashIcon } from "@/components/icons";
import {
  createCommentAction,
  createPostAction,
  deletePostAction,
} from "@/server/actions/communities";
import { relativeTime } from "@/lib/utils";

interface Author {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface FeedPost {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: Date;
  author: Author;
  comments: Array<{ id: string; body: string; createdAt: Date; author: Author }>;
}

/**
 * The discussion.
 *
 * A conversation, not a stack of boxes. The composer is the one raised panel —
 * it is the thing you act on — and everything already said sits below it in a
 * single surface divided by hairlines, so the eye runs down the thread instead
 * of stopping at eight separate card edges.
 */
export function CommunityFeed({
  communityId,
  posts,
  currentUserId,
  ownerId,
  canModerate,
}: {
  communityId: string;
  posts: FeedPost[];
  currentUserId: string;
  ownerId: string;
  canModerate: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    const result = await createPostAction(communityId, body);
    setPosting(false);

    if (!result.ok) return toast.error(result.error);

    setBody("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="Ask a question, share what you're stuck on, post a plan for the week…"
        />
        <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line pt-3.5">
          <span className="num text-xs text-faint">{body.length}/4000</span>
          <Button size="sm" onClick={post} disabled={posting || !body.trim()}>
            {posting ? <Spinner /> : null}
            Post
          </Button>
        </div>
      </Panel>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center rounded-sq-lg border border-dashed border-line-strong bg-raise px-6 py-14 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-sq bg-surface text-accent shadow-card">
            <MessageIcon size={20} />
          </span>
          <p className="max-w-sm text-[14.5px] leading-relaxed text-muted">
            Nothing posted yet. Be the one who starts it.
          </p>
        </div>
      ) : (
        <ul className="panel divide-y divide-line overflow-hidden">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                currentUserId={currentUserId}
                ownerId={ownerId}
                canModerate={canModerate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  ownerId,
  canModerate,
}: {
  post: FeedPost;
  currentUserId: string;
  ownerId: string;
  canModerate: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const canDelete = post.author.id === currentUserId || canModerate;

  async function send() {
    if (!comment.trim()) return;
    setSending(true);
    const result = await createCommentAction(post.id, comment);
    setSending(false);

    if (!result.ok) return toast.error(result.error);

    setComment("");
    setShowComment(false);
    router.refresh();
  }

  async function remove() {
    const result = await deletePostAction(post.id);
    if (!result.ok) return toast.error(result.error);
    router.refresh();
  }

  return (
    <article className="flex items-start gap-3 p-5">
      <Avatar name={post.author.name} image={post.author.image} size={36} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="font-display text-[14.5px] font-semibold tracking-[-0.012em] text-bright">
            {post.author.name ?? post.author.username ?? "A member"}
          </span>
          {post.author.id === ownerId ? (
            <Badge tone="neutral">
              <CrownIcon size={10} /> Leader
            </Badge>
          ) : null}
          <span className="text-xs text-faint">{relativeTime(post.createdAt)}</span>
        </div>

        {/* Generous leading — this is the only body copy on the screen someone
            actually reads rather than scans. */}
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.7] text-bright">
          {post.body}
        </p>

        <div className="mt-2.5 flex items-center gap-3">
          <button
            onClick={() => setShowComment((v) => !v)}
            className="-ml-2.5 inline-flex h-9 items-center gap-1.5 rounded-sq-sm px-2.5 text-[13px] font-medium text-muted transition-colors hover:bg-raise-2 hover:text-bright"
          >
            <MessageIcon size={13} />
            {post.comments.length > 0
              ? `${post.comments.length} repl${post.comments.length === 1 ? "y" : "ies"}`
              : "Reply"}
          </button>
        </div>

        {post.comments.length > 0 ? (
          <ul className="mt-2 space-y-3.5 border-l border-line pl-4">
            {post.comments.map((c) => (
              <li key={c.id} className="flex items-start gap-2.5">
                <Avatar name={c.author.name} image={c.author.image} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[13px] font-semibold text-bright">
                      {c.author.name ?? c.author.username ?? "A member"}
                    </span>
                    <span className="text-xs text-faint">{relativeTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.65] text-muted">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {showComment ? (
          <div className="mt-3.5 rounded-sq border border-line bg-raise p-3.5">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="Write a reply…"
              autoFocus
            />
            <div className="mt-2.5 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowComment(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={send} disabled={sending || !comment.trim()}>
                {sending ? <Spinner /> : null}
                Reply
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {canDelete ? (
        <IconButton
          label="Delete post"
          onClick={remove}
          className="shrink-0 text-faint hover:bg-rose/10 hover:text-rose"
        >
          <TrashIcon size={14} />
        </IconButton>
      ) : null}
    </article>
  );
}
