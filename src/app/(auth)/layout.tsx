import type { ReactNode } from "react";

import { Meter } from "@/components/ui/feedback";
import { PRODUCT_NAME } from "@/lib/brand";
import {
  CardsIcon,
  CoinIcon,
  FeedbackIcon,
  FlameIcon,
  QuizIcon,
  SparkIcon,
} from "@/components/icons";

/**
 * The signed-out shell.
 *
 * Left half says what the product is, right half signs you in. It collapses to
 * the form alone on narrow screens.
 *
 * The panel on the left is built from the same components as the app itself
 * rather than from a mock-up of them. What a visitor sees here is literally
 * what they get after signing in, which is worth more than any illustration.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-noise pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative">
          <Wordmark />
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-[44px] font-bold leading-[1.06] tracking-[-0.035em] text-muted">
            Revision that
            <br />
            <span className="text-bright">actually levels you up.</span>
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">
            Smart flashcards that learn what you keep forgetting. Quizzes marked by AI. Turn any PDF
            into a test. Every bit of real work earns Study Coins.
          </p>

          <EarningsPreview />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Feature
              icon={<CardsIcon size={16} />}
              title="Smart flashcards"
              body="Spaced repetition that adapts to you"
            />
            <Feature
              icon={<QuizIcon size={16} />}
              title="AI-marked quizzes"
              body="Written answers, with your right to appeal"
            />
            <Feature
              icon={<FeedbackIcon size={16} />}
              title="Test feedback"
              body="Upload a paper, get your weak spots"
            />
            <Feature
              icon={<FlameIcon size={16} />}
              title="Daily streaks"
              body="Multipliers up to x5"
            />
          </div>
        </div>

        <div className="relative flex items-center gap-2.5 text-[13px] text-faint">
          <CoinIcon size={15} className="text-coin" />
          Study Coins are earned, never bought.
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-9 lg:hidden">
            <Wordmark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="brand flex h-10 w-10 items-center justify-center rounded-sq text-accent-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),0_6px_16px_-5px_rgb(23_23_26/0.45)]">
        <SparkIcon size={20} />
      </span>
      <span className="font-display text-[17px] font-semibold tracking-[-0.03em] text-bright">
        {PRODUCT_NAME}
      </span>
    </div>
  );
}

/**
 * The reward loop, in miniature.
 *
 * Real components, real type scale, illustrative figures. It exists because
 * "earn coins for studying" is abstract until you see what the counter looks
 * like.
 */
function EarningsPreview() {
  return (
    <div className="mt-8 rounded-sq-lg border border-line bg-bg p-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-[13px] font-semibold text-muted">A good week</span>
        <span className="flex items-center gap-1.5">
          <FlameIcon size={13} className="text-rare-ink" />
          <span className="num text-[13px] font-semibold text-rare-ink">12 day streak</span>
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <CoinIcon size={22} className="text-coin" />
        <span className="num text-[30px] font-semibold leading-none text-coin">1,240</span>
        <span className="text-[13px] text-muted">Study Coins</span>
      </div>

      <div className="mt-4 space-y-2.5">
        <PreviewRow label="Flashcard sets finished" value="18" pct={72} />
        <PreviewRow label="Quizzes passed" value="11" pct={44} />
        <PreviewRow label="Daily quizzes attempted" value="12" pct={100} />
      </div>
    </div>
  );
}

function PreviewRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="num font-semibold text-bright">{value}</span>
      </div>
      <Meter value={pct} max={100} tone={pct === 100 ? "lime" : "violet"} label={label} />
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-sq border border-line bg-bg p-3.5">
      <span className="text-accent">{icon}</span>
      <div className="mt-2 font-display text-[13px] font-semibold text-bright">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-faint">{body}</div>
    </div>
  );
}
