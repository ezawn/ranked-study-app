"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { ImagePicker } from "@/components/ui/image-field";
import { createSetAction, updateSetAction } from "@/server/actions/flashcards";

interface EditableCard {
  key: string;
  id?: string;
  front: string;
  back: string;
  hint: string;
  frontImageKey: string | null;
  backImageKey: string | null;
}

export interface SetEditorProps {
  setId?: string;
  initial?: {
    title: string;
    description: string | null;
    subject: string | null;
    cards: Array<{
      id: string;
      front: string;
      back: string;
      hint: string | null;
      frontImageKey: string | null;
      backImageKey: string | null;
    }>;
  };
}

let keyCounter = 0;
const newKey = () => `card-${keyCounter++}`;

export function SetEditor({ setId, initial }: SetEditorProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [cards, setCards] = useState<EditableCard[]>(
    initial?.cards.length
      ? initial.cards.map((c) => ({
          key: newKey(),
          id: c.id,
          front: c.front,
          back: c.back,
          hint: c.hint ?? "",
          frontImageKey: c.frontImageKey,
          backImageKey: c.backImageKey,
        }))
      : [emptyCard(), emptyCard(), emptyCard()],
  );

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function emptyCard(): EditableCard {
    return { key: newKey(), front: "", back: "", hint: "", frontImageKey: null, backImageKey: null };
  }

  function update(key: string, patch: Partial<EditableCard>) {
    setCards((current) => current.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function remove(key: string) {
    setCards((current) => (current.length === 1 ? current : current.filter((c) => c.key !== key)));
  }

  function move(index: number, delta: number) {
    setCards((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  /**
   * Bulk import. One card per line, front and back separated by a tab, a
   * dash surrounded by spaces, a semicolon or a colon. A tab takes priority
   * over the rest, because tab-separated text is what a spreadsheet paste
   * gives you and the other characters turn up inside real card text.
   */
  function applyBulk() {
    const parsed: EditableCard[] = [];
    for (const line of bulkText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // A tab always wins when there is one. Pasting two columns out of a
      // spreadsheet gives tab-separated text, and a front like
      // "Osmosis: definition" would otherwise get split at its own colon.
      let front: string;
      let back: string;

      const tabIndex = trimmed.indexOf("\t");
      if (tabIndex > 0) {
        front = trimmed.slice(0, tabIndex).trim();
        back = trimmed.slice(tabIndex + 1).trim();
      } else {
        const match = trimmed.match(/^(.*?)( ?[–—-] | ?; ?| ?: ?)(.*)$/);
        if (!match) continue;
        front = match[1]!.trim();
        back = match[3]!.trim();
      }

      if (!front || !back) continue;

      parsed.push({ key: newKey(), front, back, hint: "", frontImageKey: null, backImageKey: null });
    }

    if (parsed.length === 0) {
      setError("Couldn't find any cards in that. Each line needs a front and a back, separated by a tab, a dash, a colon or a semicolon.");
      return;
    }

    setCards((current) => {
      const kept = current.filter(
        (c) => c.front.trim() || c.back.trim() || c.frontImageKey || c.backImageKey,
      );
      return [...kept, ...parsed];
    });
    setBulkText("");
    setBulkOpen(false);
    setError(null);
    toast.success(`Added ${parsed.length} card${parsed.length === 1 ? "" : "s"}`);
  }

  async function save() {
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      subject: subject.trim() || null,
      cards: cards
        .filter(
          (c) =>
            (c.front.trim() || c.frontImageKey) && (c.back.trim() || c.backImageKey),
        )
        .map((c) => ({
          id: c.id,
          front: c.front.trim(),
          back: c.back.trim(),
          hint: c.hint.trim() || null,
          frontImageKey: c.frontImageKey,
          backImageKey: c.backImageKey,
        })),
    };

    if (!payload.title) {
      setError("Give the set a title.");
      return;
    }
    if (payload.cards.length === 0) {
      setError("Add at least one card with something on both the front and the back.");
      return;
    }

    setSaving(true);
    const result = setId ? await updateSetAction(setId, payload) : await createSetAction(payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success(setId ? "Set saved" : "Set created", setId ? undefined : "It can earn coins 24 hours from now.");
    navigate(`/flashcards/${result.data.id}`);
    router.refresh();
  }

  const filled = cards.filter(
    (c) => (c.front.trim() || c.frontImageKey) && (c.back.trim() || c.backImageKey),
  ).length;

  return (
    <div className="space-y-5">
      {error ? <Alert tone="rose">{error}</Alert> : null}

      <Panel>
        <PanelHeader title="Set details" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" htmlFor="title" className="md:col-span-2">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Cell biology — transport across membranes"
              maxLength={160}
            />
          </Field>

          <Field label="Subject" htmlFor="subject" hint="Used for filtering and Discover.">
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Biology"
              maxLength={80}
            />
          </Field>

          <Field label="Description" htmlFor="description" hint="Optional.">
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AQA A-level, paper 1"
              maxLength={1000}
            />
          </Field>
        </div>
      </Panel>

      {/*
       * The card list is one instrument, not forty boxes.
       *
       * A bordered, filled block per card meant a forty-card set read as forty
       * separate forms stacked up. Here the panel is the container and the cards
       * are rows inside it, separated by a hairline: the eye travels down one
       * list instead of re-entering a new box at every card.
       */}
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-line px-4 py-5 sm:px-6">
          <PanelHeader
            className="mb-0"
            title={
              <>
                Cards (<span className="num">{filled}</span>)
              </>
            }
            subtitle="Front is the prompt, back is the answer."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setBulkOpen((v) => !v)}
                icon={<UploadIcon size={14} />}
              >
                Bulk paste
              </Button>
            }
          />
        </div>

        {/* Opened from the header, so it reads as a drawer belonging to this
            list rather than a floating box on top of it. */}
        {bulkOpen ? (
          <div className="border-b border-line bg-sunken px-4 py-4 sm:px-6">
            <p className="mb-2.5 text-[13.5px] leading-relaxed text-muted">
              One card per line. Separate the front and back with a tab, a dash, a colon or a
              semicolon.
            </p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={7}
              placeholder={"Osmosis - Movement of water across a partially permeable membrane\nDiffusion: Net movement of particles down a concentration gradient"}
              className="font-mono text-sm"
            />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={applyBulk}>
                Add cards
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <ul className="divide-y divide-line">
          {cards.map((card, index) => (
            <li key={card.key} className="px-4 py-4 sm:px-6 sm:py-5">
              {/* Index on the left, row controls on the right. The controls are
                  quiet but always drawn — hiding them until hover puts them out
                  of reach on a touch screen, and they are full 36px targets. */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-display text-[12px] font-semibold uppercase tracking-[0.09em] text-faint">
                  Card <span className="num tracking-normal text-muted">{index + 1}</span>
                </span>
                <div className="-mr-1.5 flex items-center">
                  <IconButton
                    label="Move up"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="text-faint"
                  >
                    <ChevronLeftIcon size={14} className="rotate-90" />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    onClick={() => move(index, 1)}
                    disabled={index === cards.length - 1}
                    className="text-faint"
                  >
                    <ChevronRightIcon size={14} className="rotate-90" />
                  </IconButton>
                  <IconButton
                    label="Delete card"
                    onClick={() => remove(card.key)}
                    disabled={cards.length === 1}
                    className="text-faint hover:text-rose"
                  >
                    <TrashIcon size={14} />
                  </IconButton>
                </div>
              </div>

              {/* Front and back sit side by side where there is room. Stacked
                  on a phone the gap between them is wider than the gap inside
                  each one, so the two halves stay legible once the placeholders
                  have been typed over. */}
              <div className="grid gap-x-3 gap-y-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Textarea
                    value={card.front}
                    onChange={(e) => update(card.key, { front: e.target.value })}
                    placeholder="Front — the question or term"
                    rows={2}
                    maxLength={4000}
                  />
                  <ImagePicker
                    value={card.frontImageKey}
                    onChange={(key) => update(card.key, { frontImageKey: key })}
                    label="Image on the front"
                  />
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={card.back}
                    onChange={(e) => update(card.key, { back: e.target.value })}
                    placeholder="Back — the answer"
                    rows={2}
                    maxLength={4000}
                  />
                  <ImagePicker
                    value={card.backImageKey}
                    onChange={(key) => update(card.key, { backImageKey: key })}
                    label="Image on the back"
                  />
                </div>
              </div>

              <Input
                value={card.hint}
                onChange={(e) => update(card.key, { hint: e.target.value })}
                placeholder="Hint (optional)"
                className="mt-3 h-9 text-sm"
                maxLength={500}
              />
            </li>
          ))}
        </ul>

        {/* Sits on the list's own footer rail, so "add another" is always the
            last thing in the container rather than a button floating below it. */}
        <div className="border-t border-line bg-raise p-2.5 sm:px-4 sm:py-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setCards((c) => [...c, emptyCard()])}
            icon={<PlusIcon size={16} />}
          >
            Add card
          </Button>
        </div>
      </Panel>

      {/*
       * The status bar for the thing being built: what you have, then the two
       * actions. It clears the 56px phone tab bar plus the home indicator, so
       * it never sits on top of the last field or the navigation.
       */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)_+_4.25rem)] z-30 lg:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-sq-lg border border-line bg-surface/90 px-4 py-3 shadow-card backdrop-blur-xl">
          <span className="text-[13.5px] text-muted">
            <span className="num text-[15px] font-semibold text-bright">{filled}</span> card
            {filled === 1 ? "" : "s"} ready
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              {setId ? "Save changes" : "Create set"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
