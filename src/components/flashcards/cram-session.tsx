"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Meter, Spinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { useCoins } from "@/components/game/coin-provider";
import { CheckIcon, CoinIcon, ShuffleIcon, XIcon } from "@/components/icons";
import { StudyImage } from "@/components/ui/image-field";
import { answerCramAction, startCramAction } from "@/server/actions/flashcards";
import { cn } from "@/lib/utils";

interface CramCard {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  frontImageKey: string | null;
  backImageKey: string | null;
}

export interface CramInitial {
  sessionId: string;
  round: number;
  known: string[];
  unknown: string[];
  complete: boolean;
  cards: CramCard[];
}

/**
 * Cram Mode.
 *
 * Two piles, looped. A card you don't know goes to the back of the unknown
 * pile and comes round again; the session ends only when the unknown pile is
 * empty. The piles live on the server — this component renders them.
 */
export function CramSession({
  setId,
  setTitle,
  initial,
}: {
  setId: string;
  setTitle: string;
  initial: CramInitial;
}) {
  const router = useRouter();
  const toast = useToast();
  const { applyAward } = useCoins();

  const [known, setKnown] = useState(initial.known);
  const [unknown, setUnknown] = useState(initial.unknown);
  const [round, setRound] = useState(initial.round);
  const [sessionId, setSessionId] = useState(initial.sessionId);
  const [complete, setComplete] = useState(initial.complete);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [earned, setEarned] = useState<{ coins: number; reason: string | null } | null>(null);

  const byId = new Map(initial.cards.map((c) => [c.id, c]));
  const currentId = unknown[0];
  const card = currentId ? byId.get(currentId) : undefined;
  const total = initial.cards.length;

  const answer = useCallback(
    async (isKnown: boolean) => {
      if (!currentId || pending) return;

      setPending(true);
      const result = await answerCramAction(sessionId, currentId, isKnown);
      setPending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setKnown(result.data.known);
      setUnknown(result.data.unknown);
      setRound(result.data.round);
      setFlipped(false);

      if (result.data.complete) {
        setComplete(true);
        const completion = result.data.completion;
        if (completion?.coinsAwarded && completion.balance !== null) {
          applyAward(
            completion.coinsAwarded,
            completion.balance,
            "Set cleared",
            `Every card in ${setTitle} made it to the Known pile.`,
          );
          setEarned({ coins: completion.coinsAwarded, reason: null });
        } else if (completion?.reason) {
          setEarned({ coins: 0, reason: completion.reason });
        }
        router.refresh();
      }
    },
    [applyAward, currentId, pending, router, sessionId, setTitle, toast],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (complete) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return;
      if (event.key === "1") {
        event.preventDefault();
        void answer(false);
      }
      if (event.key === "2") {
        event.preventDefault();
        void answer(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, complete, flipped]);

  async function restart() {
    setRestarting(true);
    const result = await startCramAction(setId, true);
    setRestarting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSessionId(result.data.sessionId);
    setKnown(result.data.known);
    setUnknown(result.data.unknown);
    setRound(result.data.round);
    setComplete(false);
    setEarned(null);
    setFlipped(false);
  }

  if (complete) {
    return (
      <Panel className="relative mx-auto max-w-2xl overflow-hidden px-6 py-16 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />

        <div className="relative">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-sq-lg border border-lime/30 bg-lime/12 text-lime">
            <CheckIcon size={36} />
          </span>
          <h2 className="mt-6 font-display text-[30px] font-bold leading-tight tracking-[-0.028em] sm:text-[34px]">Pile cleared</h2>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
            All {total} card{total === 1 ? "" : "s"} in the Known pile
            {round > 1 ? ` after ${round} rounds` : ""}.
          </p>

          {earned?.coins ? (
            <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-2.5 rounded-sq-lg border border-coin/35 bg-coin/10 px-5 py-4">
              <CoinIcon size={24} className="animate-coin-pop text-coin" />
              <span className="font-display text-[17px] font-semibold text-coin">
                +{earned.coins} Study Coins
              </span>
            </div>
          ) : earned?.reason ? (
            <p className="mx-auto mt-8 max-w-sm rounded-sq border border-line bg-raise px-4 py-3 text-sm leading-relaxed text-muted">
              No coins this time. {earned.reason}
            </p>
          ) : null}

          <div className="mx-auto mt-9 flex max-w-xs flex-col justify-center gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap">
            <Button size="lg" onClick={restart} disabled={restarting} icon={restarting ? <Spinner /> : <ShuffleIcon size={16} />}>
              Run it again
            </Button>
            <ButtonLink href={`/flashcards/${setId}`} variant="secondary" size="lg">
              Back to set
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
        <span className="shrink-0 font-display text-[13px] font-semibold text-faint">
          Round <span className="num text-bright">{round}</span>
        </span>
      </div>

      {/* The two piles, always visible — that's what Cram Mode is. */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-sq border border-line bg-raise px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-rose">
              Don&apos;t know
            </span>
            <span className="num text-[22px] font-semibold leading-none text-rose">
              {unknown.length}
            </span>
          </div>
        </div>
        <div className="rounded-sq border border-line bg-raise px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-lime">Know</span>
            <span className="num text-[22px] font-semibold leading-none text-lime">
              {known.length}
            </span>
          </div>
        </div>
      </div>

      <Meter value={known.length} max={total} tone="lime" className="mb-8" label="Cards known" />

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

      <div className="mt-8">
        {flipped ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <button
              onClick={() => void answer(false)}
              disabled={pending}
              className={cn(
                "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-sq-lg border-2 px-4 py-4",
                "font-display font-semibold transition-colors active:translate-y-px",
                "disabled:pointer-events-none disabled:opacity-50",
                "border-rose/45 bg-rose/10 text-rose hover:border-rose/70 hover:bg-rose/18",
              )}
            >
              <span className="flex items-center gap-2 text-[16px]">
                {pending ? <Spinner /> : <XIcon size={18} />}
                Still don&apos;t know
              </span>
              <span className="text-xs font-medium opacity-70">Comes back this round · press 1</span>
            </button>

            <button
              onClick={() => void answer(true)}
              disabled={pending}
              className={cn(
                "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-sq-lg border-2 px-4 py-4",
                "font-display font-semibold transition-colors active:translate-y-px",
                "disabled:pointer-events-none disabled:opacity-50",
                "border-lime/45 bg-lime/10 text-lime hover:border-lime/70 hover:bg-lime/18",
              )}
            >
              <span className="flex items-center gap-2 text-[16px]">
                {pending ? <Spinner /> : <CheckIcon size={18} />}
                Got it
              </span>
              <span className="text-xs font-medium opacity-70">Moves to the Known pile · press 2</span>
            </button>
          </div>
        ) : (
          <Button size="lg" className="h-14 w-full text-[16px]" onClick={() => setFlipped(true)}>
            Show answer
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
        Cram doesn&apos;t change your Smart Mode schedule — cram all you like before a test.
      </p>
    </div>
  );
}
