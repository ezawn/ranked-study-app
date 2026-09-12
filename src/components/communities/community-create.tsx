"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { CommunityIcon, GlobeIcon, LockIcon, PlusIcon, ShieldIcon } from "@/components/icons";
import { acceptInviteAction, createCommunityAction } from "@/server/actions/communities";
import { cn } from "@/lib/utils";

type Access = "PUBLIC" | "PRIVATE" | "REQUEST";

const ACCESS_OPTIONS: Array<{
  value: Access;
  label: string;
  body: string;
  icon: React.ReactNode;
}> = [
  {
    value: "PUBLIC",
    label: "Public",
    body: "Anyone can find it and join straight away.",
    icon: <GlobeIcon size={16} />,
  },
  {
    value: "REQUEST",
    label: "Request to join",
    body: "Anyone can ask, but you approve every member.",
    icon: <ShieldIcon size={16} />,
  },
  {
    value: "PRIVATE",
    label: "Private",
    body: "Invite only. It won't appear in search at all.",
    icon: <LockIcon size={16} />,
  },
];

export function CommunityCreate() {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [access, setAccess] = useState<Access>("PUBLIC");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setSaving(true);
    const result = await createCommunityAction({
      name,
      description: description.trim() || null,
      subject: subject.trim() || null,
      access,
    });
    setSaving(false);

    if (!result.ok) return setError(result.error);

    toast.success("Community created", "You're the leader — invite people in.");
    navigate(`/communities/${result.data.slug}`);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} icon={<PlusIcon size={16} />}>
        New community
      </Button>
    );
  }

  return (
    <Panel className="w-full">
      <PanelHeader
        title="New community"
        subtitle="Somewhere to share sets and quizzes with people doing the same subjects."
      />

      {error ? <Alert tone="rose" className="mb-4">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" htmlFor="c-name" className="md:col-span-2">
          <Input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Year 13 Chemistry"
            maxLength={60}
          />
        </Field>
        <Field label="Subject" htmlFor="c-subject">
          <Input
            id="c-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Chemistry"
            maxLength={80}
          />
        </Field>
        <Field label="Description" htmlFor="c-desc" hint="Optional.">
          <Input
            id="c-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Revision group for the June exams"
            maxLength={600}
          />
        </Field>
      </div>

      <div className="mt-6">
        <div className="mb-2.5 text-[13.5px] font-semibold tracking-[-0.005em] text-bright">
          Who can join?
        </div>
        {/* Monochrome selection: the chosen option inverts its icon chip and
            takes an accent hairline. No tint does that work, because a tint of
            a graphite accent is indistinguishable from a hover state. */}
        <div className="grid gap-2.5 sm:grid-cols-3">
          {ACCESS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setAccess(option.value)}
              className={cn(
                "rounded-sq border p-4 text-left transition-colors duration-200",
                access === option.value
                  ? "border-accent bg-raise-2"
                  : "border-line bg-raise hover:border-line-strong hover:bg-raise-2",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-sq-sm transition-colors duration-200",
                    access === option.value
                      ? "bg-accent-fill text-accent-ink"
                      : "bg-surface-2 text-muted",
                  )}
                >
                  {option.icon}
                </span>
                <span
                  className={cn(
                    "font-display text-[14.5px] font-semibold tracking-[-0.012em]",
                    access === option.value ? "text-bright" : "text-muted",
                  )}
                >
                  {option.label}
                </span>
              </span>
              <span className="mt-2.5 block text-[12.5px] leading-relaxed text-muted">
                {option.body}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={create} disabled={saving || name.trim().length < 3}>
          {saving ? <Spinner /> : <CommunityIcon size={16} />}
          Create
        </Button>
      </div>
    </Panel>
  );
}

export function JoinByInvite() {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  async function accept() {
    if (!code.trim()) return;
    setPending(true);
    const result = await acceptInviteAction(code);
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    toast.success(`Joined ${result.data.name}`);
    navigate(`/communities/${result.data.slug}`);
    router.refresh();
  }

  return (
    <div className="flex w-full gap-2 sm:w-auto">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste an invite code"
        className="h-11 w-full min-w-0 sm:w-56"
        aria-label="Invite code"
        onKeyDown={(e) => {
          if (e.key === "Enter") void accept();
        }}
      />
      <Button
        variant="secondary"
        onClick={accept}
        disabled={pending || !code.trim()}
        className="shrink-0"
      >
        {pending ? <Spinner /> : null}
        Join
      </Button>
    </div>
  );
}
