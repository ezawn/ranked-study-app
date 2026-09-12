"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CardsIcon, PlusIcon, QuizIcon, SearchIcon, TrashIcon, XIcon } from "@/components/icons";
import { shareResourceAction, unshareResourceAction } from "@/server/actions/communities";
import { cn, relativeTime, truncate } from "@/lib/utils";

/** Show a search box once the list gets long enough to be annoying. */
const SEARCH_THRESHOLD = 6;
/** Rows shown before the list starts scrolling instead of growing. */
const VISIBLE_ROWS = 10;

interface Resource {
  id: string;
  type: "FLASHCARD_SET" | "QUIZ";
  note: string | null;
  createdAt: Date;
  sharedBy: { name: string | null; username: string | null };
  flashcardSet: { id: string; title: string; subject: string | null; cardCount: number } | null;
  quiz: { id: string; title: string; subject: string | null; totalMarks: number; questionCount: number } | null;
}

export function CommunityResources({
  communityId,
  resources,
  shareable,
  canModerate,
}: {
  communityId: string;
  resources: Resource[];
  shareable: {
    sets: Array<{ id: string; title: string; cardCount: number }>;
    quizzes: Array<{ id: string; title: string; questionCount: number }>;
  };
  canModerate: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"FLASHCARD_SET" | "QUIZ">("FLASHCARD_SET");
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const [sharing, setSharing] = useState(false);
  const [query, setQuery] = useState("");

  const options = type === "FLASHCARD_SET" ? shareable.sets : shareable.quizzes;

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? resources.filter((resource) => {
        const target = resource.type === "FLASHCARD_SET" ? resource.flashcardSet : resource.quiz;
        const haystack = [
          target?.title,
          target?.subject,
          resource.note,
          resource.sharedBy.name,
          resource.sharedBy.username,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
    : resources;

  async function share() {
    if (!id) return toast.error("Pick something to share first.");
    setSharing(true);
    const result = await shareResourceAction({ communityId, type, id, note: note.trim() || undefined });
    setSharing(false);

    if (!result.ok) return toast.error(result.error);

    toast.success("Shared with the community");
    setOpen(false);
    setId("");
    setNote("");
    router.refresh();
  }

  async function unshare(resourceId: string) {
    const result = await unshareResourceAction(resourceId);
    if (!result.ok) return toast.error(result.error);
    router.refresh();
  }

  return (
    <Panel>
      <PanelHeader
        title="Shared material"
        subtitle="Sets and quizzes members have put in."
        action={
          open ? null : (
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)} icon={<PlusIcon size={14} />}>
              Share something
            </Button>
          )
        }
      />

      {open ? (
        <div className="mb-5 rounded-sq border border-line-strong bg-raise p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value as "FLASHCARD_SET" | "QUIZ");
                setId("");
              }}
              aria-label="What to share"
            >
              <option value="FLASHCARD_SET">Flashcard set</option>
              <option value="QUIZ">Quiz</option>
            </Select>

            <Select value={id} onChange={(e) => setId(e.target.value)} aria-label="Which one">
              <option value="">Choose…</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {truncate(option.title, 44)}
                </option>
              ))}
            </Select>
          </div>

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Say something about it (optional)"
            className="mt-3"
            maxLength={300}
          />

          {options.length === 0 ? (
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              You don&apos;t have any {type === "FLASHCARD_SET" ? "flashcard sets" : "quizzes"} yet — make
              one first.
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={share} disabled={sharing || !id}>
              {sharing ? <Spinner /> : null}
              Share
            </Button>
          </div>
        </div>
      ) : null}

      {resources.length === 0 ? (
        <div className="flex flex-col items-center rounded-sq-lg border border-dashed border-line-strong bg-raise px-6 py-12 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-sq bg-surface text-accent shadow-card">
            <CardsIcon size={20} />
          </span>
          <p className="max-w-sm text-[14.5px] leading-relaxed text-muted">
            Nothing shared yet. Post a set you&apos;ve made and someone will use it.
          </p>
        </div>
      ) : (
        <>
          {/* Once a community gets busy the list is the page, so it gets its
              own search and its own scroll rather than pushing everything else
              off the screen. */}
          {resources.length > SEARCH_THRESHOLD ? (
            <div className="relative mb-3.5">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${resources.length} shared items…`}
                aria-label="Search shared material"
                className={cn(
                  "h-11 w-full rounded-sq border border-line bg-surface pl-10 pr-12 text-[15px] text-bright",
                  "shadow-[inset_0_1px_2px_rgb(23_23_26/0.05)]",
                  "placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-200",
                  "hover:border-line-strong",
                  "focus:border-accent focus:shadow-[0_0_0_3px_var(--sq-accent-wash)]",
                )}
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sq-sm text-faint transition-colors hover:bg-raise-2 hover:text-bright"
                >
                  <XIcon size={14} />
                </button>
              ) : null}
            </div>
          ) : null}

          {visible.length === 0 ? (
            <p className="rounded-sq-lg border border-dashed border-line-strong bg-raise px-4 py-10 text-center text-[14.5px] leading-relaxed text-muted">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : null}

          <ul
            className={cn(
              "space-y-2.5",
              // Roughly ten rows, then it scrolls.
              visible.length > VISIBLE_ROWS && "max-h-[34rem] overflow-y-auto pr-1",
            )}
          >
          {visible.map((resource) => {
            const isSet = resource.type === "FLASHCARD_SET";
            const target = isSet ? resource.flashcardSet : resource.quiz;
            if (!target) return null;

            return (
              /* Reads in the same order as a flashcard tile: what it is, then
                 the figures, then who put it there. */
              <li
                key={resource.id}
                className="flex items-start gap-3 rounded-sq border border-line bg-raise p-3.5 transition-colors duration-200 hover:border-line-strong hover:bg-raise-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sq-sm border border-line bg-surface text-muted">
                  {isSet ? <CardsIcon size={16} /> : <QuizIcon size={16} />}
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    href={isSet ? `/flashcards/${target.id}` : `/quizzes/${target.id}`}
                    className="font-display text-[14.5px] font-semibold tracking-[-0.012em] text-bright underline-offset-4 hover:underline"
                  >
                    {truncate(target.title, 60)}
                  </Link>
                  <div className="num mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                    <span>
                      {isSet
                        ? `${resource.flashcardSet!.cardCount} cards`
                        : `${resource.quiz!.questionCount} questions · ${resource.quiz!.totalMarks} marks`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">
                      shared by {resource.sharedBy.name ?? resource.sharedBy.username ?? "a member"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">{relativeTime(resource.createdAt)}</span>
                  </div>
                  {resource.note ? (
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{resource.note}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone="neutral">{isSet ? "Set" : "Quiz"}</Badge>
                  {canModerate ? (
                    /* Low-contrast but always present. Hiding it behind a hover
                       state meant it did not exist at all on a touch screen. */
                    <IconButton
                      label="Remove from community"
                      onClick={() => unshare(resource.id)}
                      className="text-faint hover:bg-rose/10 hover:text-rose"
                    >
                      <TrashIcon size={14} />
                    </IconButton>
                  ) : null}
                </div>
              </li>
            );
          })}
          </ul>

          {!needle && resources.length > VISIBLE_ROWS ? (
            <p className="mt-3 text-center text-xs text-faint">
              Showing all {resources.length} — scroll the list to see the rest.
            </p>
          ) : null}
        </>
      )}
    </Panel>
  );
}
