import type { ReactNode } from "react";

import { Panel } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { CoinIcon, LockIcon } from "@/components/icons";

/**
 * The screen behind every future game feature.
 *
 * These routes exist because the spec asks for the shape of the product to be
 * visible. They have no functionality behind them, and nothing here reads or
 * writes game state — there is none to read.
 *
 * Six routes land here, so it is built as a door rather than a dead end: a
 * recessed plate carrying the barred icon and the name of the thing, and below
 * the hairline a spec sheet of what is behind it. A 404 tells you nothing is
 * there. This tells you something is, and it isn't open yet.
 */
export function ComingSoon({
  icon,
  title,
  tagline,
  bullets,
}: {
  icon: ReactNode;
  title: string;
  tagline: string;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <Panel className="overflow-hidden p-0">
        {/* ------------------------------------------------------- The plate */}
        <div className="relative border-b border-line bg-sunken px-5 py-12 text-center sm:px-10 sm:py-14">
          <div className="grid-noise pointer-events-none absolute inset-0 opacity-70" />

          <div className="relative">
            {/* `locked` draws the hatch over the glyph — the same treatment the
                sidebar uses on these routes, so the two agree. */}
            <span className="locked inline-flex h-20 w-20 items-center justify-center rounded-sq-lg border border-line-strong bg-raise-2 text-faint">
              {icon}
            </span>

            <div className="mt-5">
              <Badge tone="neutral">
                <LockIcon size={10} /> Not built yet
              </Badge>
            </div>

            <h1 className="mt-4 font-display text-[28px] font-bold leading-[1.08] tracking-[-0.032em] text-bright sm:text-[34px]">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted">{tagline}</p>
          </div>
        </div>

        {/* -------------------------------------------------- What's behind it */}
        <div className="px-5 py-8 sm:px-10 sm:py-9">
          {/* Hairlines rather than a box per row: this is a list of intentions,
              not a set of things you can act on. */}
          <ul className="mx-auto max-w-lg text-left">
            {bullets.map((bullet, i) => (
              <li
                key={bullet}
                className={`flex items-start gap-3 py-3 text-sm leading-relaxed text-muted ${
                  i > 0 ? "hairline" : ""
                }`}
              >
                <LockIcon size={13} className="mt-1 shrink-0 text-faint" />
                {bullet}
              </li>
            ))}
          </ul>

          {/* The one line that connects this door to the work you're doing now,
              so gold appears here for the reason gold ever appears. */}
          <div className="mx-auto mt-7 flex max-w-lg items-center gap-2.5 rounded-sq border border-coin/30 bg-coin/8 px-4 py-3">
            <CoinIcon size={17} className="shrink-0 text-coin" />
            <span className="text-[13px] leading-relaxed text-muted">
              Study Coins you bank now are what you&apos;ll spend here.
            </span>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/dashboard">Back to studying</ButtonLink>
            <ButtonLink href="/daily" variant="secondary">
              Earn some coins
            </ButtonLink>
          </div>
        </div>
      </Panel>
    </div>
  );
}
