"use client";

import { useRouter } from "next/navigation";
import { useNavigate } from "@/components/layout/route-transition";
import { useMemo, useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Checkbox, Field, Input, Radio, Select, Textarea } from "@/components/ui/form";
import { Alert, Badge, Spinner } from "@/components/ui/feedback";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CoinIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { ImagePicker } from "@/components/ui/image-field";
import { createQuizAction, updateQuizAction } from "@/server/actions/quizzes";
import { QUIZZES } from "@/lib/coins/rules";
import { cn, formatDuration } from "@/lib/utils";

type QType = "MCQ_SINGLE" | "MCQ_MULTI" | "WRITTEN";

interface EditableOption {
  key: string;
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface EditableQuestion {
  key: string;
  id?: string;
  type: QType;
  prompt: string;
  marks: number;
  markScheme: string;
  explanation: string;
  imageKey: string | null;
  options: EditableOption[];
}

export interface QuizBuilderProps {
  quizId?: string;
  initial?: {
    title: string;
    description: string | null;
    subject: string | null;
    questions: Array<{
      id: string;
      type: QType;
      prompt: string;
      marks: number;
      markScheme: string | null;
      explanation: string | null;
      imageKey: string | null;
      options: Array<{ id: string; text: string; isCorrect: boolean }>;
    }>;
  };
}

let counter = 0;
const key = () => `k${counter++}`;

function blankQuestion(type: QType = "MCQ_SINGLE"): EditableQuestion {
  return {
    key: key(),
    type,
    prompt: "",
    marks: type === "WRITTEN" ? 4 : 2,
    markScheme: "",
    explanation: "",
    imageKey: null,
    options:
      type === "WRITTEN"
        ? []
        : [
            { key: key(), text: "", isCorrect: true },
            { key: key(), text: "", isCorrect: false },
            { key: key(), text: "", isCorrect: false },
            { key: key(), text: "", isCorrect: false },
          ],
  };
}

export function QuizBuilder({ quizId, initial }: QuizBuilderProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initial?.questions.length
      ? initial.questions.map((q) => ({
          key: key(),
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          marks: q.marks,
          markScheme: q.markScheme ?? "",
          explanation: q.explanation ?? "",
          imageKey: q.imageKey,
          options: q.options.map((o) => ({ key: key(), id: o.id, text: o.text, isCorrect: o.isCorrect })),
        }))
      : [blankQuestion()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMarks = useMemo(
    () => questions.reduce((sum, q) => sum + (Number.isFinite(q.marks) ? q.marks : 0), 0),
    [questions],
  );
  const coinEligible = totalMarks >= QUIZZES.minMarksForCoins;

  function updateQuestion(k: string, patch: Partial<EditableQuestion>) {
    setQuestions((cur) => cur.map((q) => (q.key === k ? { ...q, ...patch } : q)));
  }

  function changeType(k: string, type: QType) {
    setQuestions((cur) =>
      cur.map((q) => {
        if (q.key !== k) return q;
        if (type === "WRITTEN") return { ...q, type, options: [], marks: Math.max(q.marks, 3) };
        const options = q.options.length
          ? q.options
          : blankQuestion("MCQ_SINGLE").options;
        // Switching multi -> single leaves only the first correct answer ticked.
        if (type === "MCQ_SINGLE") {
          let seen = false;
          return {
            ...q,
            type,
            options: options.map((o) => {
              if (o.isCorrect && !seen) {
                seen = true;
                return o;
              }
              return { ...o, isCorrect: false };
            }),
          };
        }
        return { ...q, type, options };
      }),
    );
  }

  function setCorrect(qKey: string, oKey: string, checked: boolean) {
    setQuestions((cur) =>
      cur.map((q) => {
        if (q.key !== qKey) return q;
        if (q.type === "MCQ_SINGLE") {
          return { ...q, options: q.options.map((o) => ({ ...o, isCorrect: o.key === oKey })) };
        }
        return {
          ...q,
          options: q.options.map((o) => (o.key === oKey ? { ...o, isCorrect: checked } : o)),
        };
      }),
    );
  }

  function move(index: number, delta: number) {
    setQuestions((cur) => {
      const next = [...cur];
      const target = index + delta;
      if (target < 0 || target >= next.length) return cur;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function save() {
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      subject: subject.trim() || null,
      questions: questions
        .filter((q) => q.prompt.trim() || q.imageKey)
        .map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt.trim(),
          marks: q.marks,
          markScheme: q.markScheme.trim() || null,
          explanation: q.explanation.trim() || null,
          imageKey: q.imageKey,
          options: q.options
            .filter((o) => o.text.trim())
            .map((o) => ({ id: o.id, text: o.text.trim(), isCorrect: o.isCorrect })),
        })),
    };

    if (!payload.title) return setError("Give the quiz a title.");
    if (payload.questions.length === 0) {
      return setError("Add at least one question with a prompt or an image.");
    }

    setSaving(true);
    const result = quizId ? await updateQuizAction(quizId, payload) : await createQuizAction(payload);
    setSaving(false);

    if (!result.ok) return setError(result.error);

    toast.success(quizId ? "Quiz saved" : "Quiz created", quizId ? undefined : "It can earn coins 24 hours from now.");
    navigate(`/quizzes/${result.data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="rose">{error}</Alert> : null}

      <Panel>
        <PanelHeader title="Quiz details" />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" htmlFor="title" className="md:col-span-2">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Electricity — circuits and resistance"
              maxLength={160}
            />
          </Field>
          <Field label="Subject" htmlFor="subject">
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Physics"
              maxLength={80}
            />
          </Field>
          <Field label="Description" htmlFor="description" hint="Optional.">
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Covers series, parallel and Ohm's law"
              maxLength={1000}
            />
          </Field>
        </div>
      </Panel>

      {/*
       * Every question in one panel, divided by hairlines.
       *
       * A panel per question meant twenty questions read as twenty documents,
       * each one re-establishing its own edge and shadow. One container with a
       * numbered row per question is a paper the author can scan.
       */}
      <Panel className="overflow-hidden p-0">
        <ul className="divide-y divide-line">
          {questions.map((question, index) => (
            <li key={question.key} className="px-4 py-5 sm:px-6">
              {/* Number, type, marks, then the row controls. It wraps rather
                  than crushes: on a phone the controls drop to their own line
                  instead of squeezing the type down to an ellipsis. */}
              <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
                <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-sq-sm border border-line bg-raise text-[13px] font-semibold text-muted">
                  {index + 1}
                </span>
                <Select
                  value={question.type}
                  onChange={(e) => changeType(question.key, e.target.value as QType)}
                  className="h-9 w-52 text-sm"
                  aria-label="Question type"
                >
                  <option value="MCQ_SINGLE">Multiple choice — one answer</option>
                  <option value="MCQ_MULTI">Multiple choice — several</option>
                  <option value="WRITTEN">Written answer (AI marked)</option>
                </Select>

                <div className="ml-auto flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={25}
                      value={question.marks}
                      onChange={(e) =>
                        updateQuestion(question.key, { marks: Math.max(1, Math.min(25, Number(e.target.value) || 1)) })
                      }
                      className="num h-9 w-16 text-center text-sm"
                      aria-label="Marks"
                    />
                    <span className="text-xs text-faint">marks</span>
                  </div>

                  <span className="h-5 w-px bg-line" aria-hidden />

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
                      disabled={index === questions.length - 1}
                      className="text-faint"
                    >
                      <ChevronRightIcon size={14} className="rotate-90" />
                    </IconButton>
                    <IconButton
                      label="Delete question"
                      onClick={() => setQuestions((cur) => (cur.length === 1 ? cur : cur.filter((q) => q.key !== question.key)))}
                      disabled={questions.length === 1}
                      className="text-faint hover:text-rose"
                    >
                      <TrashIcon size={14} />
                    </IconButton>
                  </div>
                </div>
              </div>

              <Textarea
                value={question.prompt}
                onChange={(e) => updateQuestion(question.key, { prompt: e.target.value })}
                placeholder="Write the question…"
                rows={2}
                maxLength={4000}
              />

              <ImagePicker
                value={question.imageKey}
                onChange={(imageKey) => updateQuestion(question.key, { imageKey })}
                kind="QUESTION_IMAGE"
                label="Add a diagram or image"
                className="mt-2.5"
              />

              {question.type === "WRITTEN" ? (
                <Field
                  label="Mark scheme"
                  className="mt-4"
                  hint="The AI marks against this. Say how the marks are allocated — the more specific it is, the better the marking."
                >
                  <Textarea
                    value={question.markScheme}
                    onChange={(e) => updateQuestion(question.key, { markScheme: e.target.value })}
                    placeholder={"1 mark for stating Ohm's law\n2 marks for correct rearrangement and substitution\n1 mark for the unit"}
                    rows={4}
                    maxLength={6000}
                  />
                </Field>
              ) : (
                <div className="mt-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="text-[13px] font-medium text-muted">
                      Options
                      <span className="ml-2 text-xs font-normal text-faint">
                        {question.type === "MCQ_SINGLE"
                          ? "Pick the one correct answer"
                          : "Tick every correct answer"}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateQuestion(question.key, {
                          options: [...question.options, { key: key(), text: "", isCorrect: false }],
                        })
                      }
                      disabled={question.options.length >= 8}
                      icon={<PlusIcon size={13} />}
                    >
                      Add option
                    </Button>
                  </div>

                  {/*
                   * The correct option cannot be told apart by colour here: the
                   * accent carries no hue, and a green edge would be the only
                   * colour on a page whose one colour is meant to be gold. So it
                   * is marked three ways that survive a monochrome palette — the
                   * ticked control, a solid rail down the left of the row, and a
                   * filled row on a heavier hairline.
                   */}
                  <ul className="space-y-1">
                    {question.options.map((option) => (
                      <li
                        key={option.key}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-sq py-1.5 pl-3 pr-0.5",
                          option.isCorrect && "bg-raise-2",
                        )}
                      >
                        {option.isCorrect ? (
                          <span
                            aria-hidden
                            className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent"
                          />
                        ) : null}

                        {question.type === "MCQ_SINGLE" ? (
                          <Radio
                            name={`correct-${question.key}`}
                            checked={option.isCorrect}
                            onChange={() => setCorrect(question.key, option.key, true)}
                            aria-label="Correct answer"
                          />
                        ) : (
                          <Checkbox
                            checked={option.isCorrect}
                            onChange={(e) => setCorrect(question.key, option.key, e.target.checked)}
                            aria-label="Correct answer"
                          />
                        )}

                        <Input
                          value={option.text}
                          onChange={(e) =>
                            updateQuestion(question.key, {
                              options: question.options.map((o) =>
                                o.key === option.key ? { ...o, text: e.target.value } : o,
                              ),
                            })
                          }
                          placeholder="Option text"
                          className={option.isCorrect ? "border-line-strong" : undefined}
                          maxLength={1000}
                        />

                        <IconButton
                          label="Remove option"
                          onClick={() =>
                            updateQuestion(question.key, {
                              options: question.options.filter((o) => o.key !== option.key),
                            })
                          }
                          disabled={question.options.length <= 2}
                          className="shrink-0 text-faint hover:text-rose"
                        >
                          <TrashIcon size={14} />
                        </IconButton>
                      </li>
                    ))}
                  </ul>

                  <Field label="Explanation" className="mt-4" hint="Shown after marking. Optional.">
                    <Input
                      value={question.explanation}
                      onChange={(e) => updateQuestion(question.key, { explanation: e.target.value })}
                      placeholder="Why the right answer is right"
                      maxLength={4000}
                    />
                  </Field>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2 border-t border-line bg-raise p-2.5 sm:px-4 sm:py-3">
          <Button variant="secondary" onClick={() => setQuestions((q) => [...q, blankQuestion()])} icon={<PlusIcon size={16} />}>
            Multiple choice
          </Button>
          <Button variant="secondary" onClick={() => setQuestions((q) => [...q, blankQuestion("WRITTEN")])} icon={<PlusIcon size={16} />}>
            Written question
          </Button>
        </div>
      </Panel>

      {/*
       * The status bar for the quiz being built: what it is worth, how long it
       * will take, whether it will pay — and then the two actions. It clears the
       * 56px phone tab bar and the home indicator beneath it.
       */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)_+_4.25rem)] z-30 lg:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-sq-lg border border-line bg-surface/90 px-4 py-3 shadow-card backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[13.5px] text-muted">
              <span className="num text-[15px] font-semibold text-bright">{totalMarks}</span> marks
            </span>
            <span className="h-4 w-px bg-line" aria-hidden />
            <span className="num flex items-center gap-1.5 text-[13px] text-muted">
              <ClockIcon size={14} className="text-faint" />{" "}
              {formatDuration(totalMarks * QUIZZES.secondsPerMark)}
            </span>
            {coinEligible ? (
              <Badge tone="coin">
                <CoinIcon size={10} /> Earns coins
              </Badge>
            ) : (
              <Badge tone="neutral">
                <span className="num">{QUIZZES.minMarksForCoins - totalMarks}</span> more marks to
                earn coins
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              {quizId ? "Save changes" : "Create quiz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
