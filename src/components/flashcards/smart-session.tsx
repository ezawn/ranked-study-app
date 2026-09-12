"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Badge, Meter, Spinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { useCoins } from "@/components/game/coin-provider";
import { BrainIcon, CheckIcon, CoinIcon, TargetIcon, XIcon, ZapIcon } from "@/components/icons";
import { StudyImage } from "@/components/ui/image-field";
import { reviewCardAction } from "@/server/actions/flashcards";
import { cn } from "@/lib/utils";

interface QueueCard {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  frontImageKey: string | null;
  backImageKey: string | null;
  isNew: boolean;
}

type Rating = "DONT_KNOW" | "PARTIAL" | "KNOW";

const RATINGS: Array<{
  value: Rating;
  label: string;
  sub: string;
  key: string;
  className: string;
  icon: React.ReactNode;
}> = [
  {
    value: "DONT_KNOW",
    label: "Don't know",
    sub: "~1 day",
    key: "1",
    className: "border-rose/45 bg-rose/10 text-rose hover:border-rose/70 hover:bg-rose/18",
    icon: <XIcon size={18} />,
  },
  {
    value: "PARTIAL",
    label: "Partially know",
    sub: "~2 days",
    key: "2",
    className: "border-rare/45 bg-rare/10 text-rare hover:border-rare/70 hover:bg-rare/18",
    icon: <TargetIcon size={18} />,
  },
  {
    value: "KNOW",
    label: "Know it",
    sub: "~5 days",
    key: "3",
    className: "border-lime/45 bg-lime/10 text-lime hover:border-lime/70 hover:bg-lime/18",
    icon: <CheckIcon size={18} />,
  },
];

export function SmartSession({
  setId,
  setTitle,
  cards,
}: {
  setId: string;
  setTitle: string;
  cards: QueueCard[];
}) {
  const router = useRouter();
  const toast = useToast();
  const { applyAward } = useCoins();

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pending, setPending] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [tally, setTally] = useState({ KNOW: 0, PARTIAL: 0, DONT_KNOW: 0 });
  const [finished, setFinished] = useState(false);
  const [earned, setEarned] = useState<{ coins: number; reason: string | null } | null>(null);

  const card = cards[index];
  const total = cards.length;

  const answer = useCallback(
    async (rating: Rating) => {
      if (!card || pending) return;

      setPending(true);
      const result = await reviewCardAction(card.id, rating);
      setPending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setTally((t) => ({ ...t, [rating]: t[rating] + 1 }));
      setLastFeedback(
        result.data.struggling && rating !== "KNOW"
          ? `Back in ${result.data.nextInWords} — this one keeps catching you out.`
          : `Next in ${result.data.nextInWords}`,
      );

      const completion = result.data.completion;
      if (completion) {
        if (completion.coinsAwarded > 0 && completion.balance !== null) {
          applyAward(
            completion.coinsAwarded,
            completion.balance,
            "Set mastered",
            `Every card in ${setTitle} is in the Known pile.`,
          );
          setEarned({ coins: completion.coinsAwarded, reason: null });
        } else if (completion.reason) {
          setEarned({ coins: 0, reason: completion.reason });
        }
      }

      if (index + 1 >= total) {
        setFinished(true);
        router.refresh();
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
        setShowHint(false);
      }
    },
    [applyAward, card, index, pending, router, setTitle, toast, total],
  );

  // Keyboard: space flips, 1/2/3 rate. Fast reviewing is the whole point.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (finished) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        setFlipped((f) => !f);
        return;
      }

      if (!flipped) return;
      const match = RATINGS.find((r) => r.key === event.key);
      if (match) {
        event.preventDefault();
        void answer(match.value);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, finished, flipped]);

  if (total === 0) {
    return (
      <Panel className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-sq-lg border border-line bg-raise-2 text-accent">
          <BrainIcon size={30} />
        </span>
        <h2 className="mt-5 font-display text-[22px] font-semibold tracking-[-0.02em]">Nothing due right now</h2>
        <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted">
          Smart Mode holds cards back until they&apos;re worth seeing again — that spacing is what
          makes them stick. Come back when they&apos;re due, or cram the whole set instead.
        </p>
        <div className="mx-auto mt-7 flex max-w-xs flex-col justify-center gap-2.5 sm:max-w-none sm:flex-row">
          <ButtonLink href={`/flashcards/${setId}/cram`} variant="secondary" size="lg">
            Cram the set
          </ButtonLink>
          <ButtonLink href={`/flashcards/${setId}`} size="lg">Back to set</ButtonLink>
        </div>
      </Panel>
    );
  }

  if (finished) {
    return (
      <Panel className="relative mx-auto max-w-2xl overflow-hidden px-6 py-16 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />

        <div className="relative">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-sq-lg border border-lime/30 bg-lime/12 text-lime">
            <CheckIcon size={36} />
          </span>
          <h2 className="mt-6 font-display text-[30px] font-bold leading-tight tracking-[-0.028em] sm:text-[34px]">Session done</h2>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
            {total} card{total === 1 ? "" : "s"} reviewed. They&apos;ll come back when you need them.
          </p>

          <div className="mx-auto mt-8 flex max-w-md justify-center gap-3">
            <Tally label="Known" value={tally.KNOW} tone="lime" />
            <Tally label="Partial" value={tally.PARTIAL} tone="rare" />
            <Tally label="Didn't know" value={tally.DONT_KNOW} tone="rose" />
          </div>

          {earned?.coins ? (
            <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-2.5 rounded-sq-lg border border-coin/35 bg-coin/10 px-5 py-4">
              <CoinIcon size={24} className="animate-coin-pop text-coin" />
              <span className="font-display text-[17px] font-semibold text-coin">
                +{earned.coins} Study Coins
              </span>
            </div>
          ) : earned?.reason ? (
            <p className="mx-auto mt-8 max-w-sm rounded-sq border border-line bg-raise px-4 py-3 text-sm leading-relaxed text-muted">
              Set complete — no coins this time. {earned.reason}
            </p>
          ) : null}

          <div className="mx-auto mt-9 flex max-w-xs flex-col justify-center gap-2.5 sm:max-w-none sm:flex-row">
            <ButtonLink href={`/flashcards/${setId}`} size="lg">Back to set</ButtonLink>
            <ButtonLink href="/flashcards" variant="secondary" size="lg">
              All sets
            </ButtonLink>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href={`/flashcards/${setId}`}
          className="min-w-0 truncate text-[13px] text-muted transition-colors hover:text-bright"
        >
          ← {setTitle}
        </Link>
        <span className="num shrink-0 text-[13px] font-semibold text-faint">
          {index + 1} / {total}
        </span>
      </div>

      <Meter value={index} max={total} className="mb-8" label="Session progress" />

      {/*
       * A card lying on the table, turned over by hand.
       *
       * `perspective` on the scene, `preserve-3d` on the card itself, and each
       * face pinned to the same box with `backface-visibility` hidden — the
       * standard flip recipe, written out as Tailwind's arbitrary-property
       * utilities rather than a named class, since the frame this needs
       * (perspective, 3D transforms, a hidden backface) has no home among the
       * card system's existing utilities and globals.css is out of scope here.
       */}
      <div className="[perspective:1600px]">
        <button
          onClick={() => setFlipped((f) => !f)}
          className={cn(
            "relative block h-[19rem] w-full text-left transition-transform duration-500",
            "ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] sm:h-[22rem]",
            flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
          )}
          aria-label={flipped ? "Show the front" : "Show the answer"}
        >
          <span className="panel absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden p-6 [backface-visibility:hidden] sm:p-10">
            {card?.isNew ? (
              <Badge tone="cyan" className="absolute left-5 top-5">
                <ZapIcon size={10} /> New
              </Badge>
            ) : null}
            <StudyImage imageKey={card?.frontImageKey} className="max-h-40" />
            {card?.front ? (
              <span className="max-w-xl text-balance text-center font-display text-[26px] font-semibold leading-snug text-bright sm:text-[30px]">
                {card.front}
              </span>
            ) : null}
            <span className="absolute inset-x-0 bottom-5 text-center text-[12px] text-faint">
              Click or press space to flip
            </span>
          </span>

          <span className="panel absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden border-accent/35 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-10">
            <StudyImage imageKey={card?.backImageKey} className="max-h-40" />
            {card?.back ? (
              <span className="max-w-xl text-balance text-center text-[22px] leading-relaxed text-bright sm:text-[24px]">
                {card.back}
              </span>
            ) : null}
          </span>
        </button>
      </div>

      {card?.hint && !flipped ? (
        <div className="mt-4 text-center">
          {showHint ? (
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted">
              <span className="text-faint">Hint: </span>
              {card.hint}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="link rounded-sq px-2 py-1 text-[13px] font-medium transition-colors hover:bg-raise-2 hover:decoration-current"
            >
              Show hint
            </button>
          )}
        </div>
      ) : null}

      <div className="mt-8">
        {flipped ? (
          <>
            <p className="mb-3 text-center text-[13px] text-faint">How well did you know that?</p>
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {RATINGS.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => void answer(rating.value)}
                  disabled={pending}
                  className={cn(
                    "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-sq-lg border-2 px-4 py-4",
                    "font-display font-semibold transition-colors active:translate-y-px",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    rating.className,
                  )}
                >
                  <span className="flex items-center gap-2 text-[16px]">
                    {pending ? <Spinner /> : rating.icon}
                    {rating.label}
                  </span>
                  <span className="text-xs font-medium opacity-70">
                    {rating.sub} · press {rating.key}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <Button size="lg" className="h-14 w-full text-[16px]" onClick={() => setFlipped(true)}>
            Show answer
          </Button>
        )}
      </div>

      {lastFeedback ? (
        <p className="mt-6 text-center text-[13px] text-faint">{lastFeedback}</p>
      ) : null}
    </div>
  );
}

function Tally({ label, value, tone }: { label: string; value: number; tone: "lime" | "rare" | "rose" }) {
  const tones = {
    lime: "text-lime",
    rare: "text-rare",
    rose: "text-rose",
  } as const;

  return (
    <div className="flex-1 rounded-sq border border-line bg-raise px-2.5 py-3.5 sm:px-3">
      <div className={cn("num text-[28px] font-semibold leading-none", tones[tone])}>{value}</div>
      <div className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.04em] text-faint">{label}</div>
    </div>
  );
}
