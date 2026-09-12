"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert, Badge, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/layout/user-menu";
import { ImageIcon, KeyIcon, LockIcon, TrashIcon } from "@/components/icons";
import {
  changePasswordAction,
  changeTimezoneAction,
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from "@/server/actions/settings";
import { relativeTime } from "@/lib/utils";

const COMMON_TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

const TIMEZONE_COOLDOWN_DAYS = 7;

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export function AvatarForm({
  name,
  avatarUrl,
  hasUpload,
}: {
  name: string | null;
  avatarUrl: string | null;
  hasUpload: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;

    setPending(true);
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadAvatarAction(formData);
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    toast.success("Profile picture updated");
    router.refresh();
  }

  async function remove() {
    setPending(true);
    const result = await removeAvatarAction();
    setPending(false);

    if (!result.ok) return toast.error(result.error);

    toast.success("Profile picture removed");
    router.refresh();
  }

  return (
    <Panel>
      <PanelHeader
        title="Profile picture"
        subtitle="Shown on anything you publish or share with a community."
      />

      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={name} image={avatarUrl} size={72} />

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              icon={pending ? <Spinner /> : <ImageIcon size={14} />}
            >
              {avatarUrl ? "Change picture" : "Upload a picture"}
            </Button>

            {hasUpload ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={remove}
                disabled={pending}
                className="hover:text-rose"
                icon={<TrashIcon size={14} />}
              >
                Remove
              </Button>
            ) : null}
          </div>

          <p className="mt-2.5 text-xs text-faint">PNG, JPEG, WebP or GIF, up to 4MB.</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Name, username, timezone
// ---------------------------------------------------------------------------

export function ProfileForm({
  name,
  username,
  email,
  timezone,
  timezoneChangedAt,
}: {
  name: string | null;
  username: string | null;
  email: string | null;
  timezone: string;
  timezoneChangedAt: Date | null;
}) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({ name: name ?? "", username: username ?? "" });
  const [tz, setTz] = useState(timezone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = COMMON_TIMEZONES.includes(timezone)
    ? COMMON_TIMEZONES
    : [timezone, ...COMMON_TIMEZONES];

  const nextTimezoneChange = timezoneChangedAt
    ? new Date(timezoneChangedAt.getTime() + TIMEZONE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const timezoneLocked = Boolean(nextTimezoneChange && nextTimezoneChange > new Date());

  async function save() {
    setError(null);
    setSaving(true);

    const profile = await updateProfileAction({
      name: form.name,
      username: form.username.trim() || null,
    });

    if (!profile.ok) {
      setSaving(false);
      return setError(profile.error);
    }

    if (tz !== timezone) {
      const result = await changeTimezoneAction(tz);
      if (!result.ok) {
        setSaving(false);
        return setError(result.error);
      }
      if (result.data.countersCarried) {
        toast.push({
          tone: "info",
          title: "Timezone updated",
          description:
            "Today's limits came with you — changing timezone doesn't hand out a fresh set.",
        });
      }
    }

    setSaving(false);
    toast.success("Saved");
    router.refresh();
  }

  return (
    <Panel>
      <PanelHeader title="Your details" />

      {error ? (
        <Alert tone="rose" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={60}
          />
        </Field>

        <Field label="Username" htmlFor="username" hint="Shown on sets and quizzes you publish.">
          <Input
            id="username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="optional"
            maxLength={20}
          />
        </Field>

        <Field label="Email" htmlFor="email" hint="Sign-in address — not editable here.">
          <Input id="email" value={email ?? ""} disabled />
        </Field>

        <Field
          label={
            <span className="flex items-center gap-2">
              Timezone
              {timezoneLocked ? (
                <Badge tone="neutral">
                  <LockIcon size={10} /> Locked
                </Badge>
              ) : null}
            </span>
          }
          htmlFor="timezone"
          hint={
            timezoneLocked && nextTimezoneChange
              ? `Changeable again ${relativeTime(nextTimezoneChange)}. Daily limits reset at midnight where you are, so this can only change once every ${TIMEZONE_COOLDOWN_DAYS} days.`
              : `Decides when your day rolls over for streaks and daily limits. Changeable once every ${TIMEZONE_COOLDOWN_DAYS} days.`
          }
        >
          <Select
            id="timezone"
            value={tz}
            disabled={timezoneLocked}
            onChange={(e) => setTz(e.target.value)}
          >
            {timezones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* The commit sits below a hairline so the panel reads as a form with an
          end, rather than a stack of controls with a button after it. */}
      <div className="mt-6 flex justify-end border-t border-line pt-5">
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner /> : null}
          Save changes
        </Button>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const toast = useToast();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);

    if (next.length < 8) return setError("Passwords need to be at least 8 characters.");
    if (next !== confirm) return setError("Those two passwords don't match.");

    setSaving(true);
    const result = await changePasswordAction({
      currentPassword: hasPassword ? current : null,
      newPassword: next,
    });
    setSaving(false);

    if (!result.ok) return setError(result.error);

    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success(hasPassword ? "Password changed" : "Password set");
    router.refresh();
  }

  return (
    <Panel>
      <PanelHeader
        title={hasPassword ? "Change password" : "Set a password"}
        subtitle={
          hasPassword
            ? "You'll need your current one."
            : "You signed in with Google, so you don't have a password yet. Setting one lets you sign in either way."
        }
      />

      {error ? (
        <Alert tone="rose" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {hasPassword ? (
          <Field label="Current password" htmlFor="current" className="md:col-span-2">
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
        ) : null}

        <Field label="New password" htmlFor="next" hint="At least 8 characters.">
          <Input
            id="next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirm">
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end border-t border-line pt-5">
        <Button
          onClick={save}
          disabled={saving || !next || !confirm || (hasPassword && !current)}
          icon={saving ? <Spinner /> : <KeyIcon size={15} />}
        >
          {hasPassword ? "Change password" : "Set password"}
        </Button>
      </div>
    </Panel>
  );
}
