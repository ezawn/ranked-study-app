import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { Panel, PanelHeader, SectionHeading } from "@/components/ui/panel";
import { Badge } from "@/components/ui/feedback";
import { PlanSwitch } from "@/components/settings/plan-switch";
import { APP_TIME, FLASHCARDS, QUIZZES, UPLOAD_QUOTAS, appTimeDailyCoinCap } from "@/lib/coins/rules";
import { CheckIcon, CoinIcon, CrownIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

const ROWS: Array<{ label: string; free: string; premium: string; highlight?: boolean }> = [
  {
    label: "Study time coins",
    free: `1 per ${APP_TIME.secondsPerCoin.FREE / 60} min (${appTimeDailyCoinCap("FREE")}/day)`,
    premium: `1 per ${APP_TIME.secondsPerCoin.PREMIUM / 60} min (${appTimeDailyCoinCap("PREMIUM")}/day)`,
    highlight: true,
  },
  {
    label: "Flashcard sets that pay per day",
    free: String(FLASHCARDS.dailySetLimit.FREE),
    premium: String(FLASHCARDS.dailySetLimit.PREMIUM),
    highlight: true,
  },
  {
    label: "Quizzes that pay per day",
    free: String(QUIZZES.dailyQuizLimit.FREE),
    premium: String(QUIZZES.dailyQuizLimit.PREMIUM),
    highlight: true,
  },
  {
    label: "PDF → quiz conversions",
    free: `${UPLOAD_QUOTAS.PDF_TO_QUIZ.FREE} a day`,
    premium: "Unlimited",
    highlight: true,
  },
  {
    label: "Test feedback analyses",
    free: `${UPLOAD_QUOTAS.TEST_FEEDBACK.FREE} a day`,
    premium: "Unlimited",
    highlight: true,
  },
  { label: "AI improvement quizzes from your mistakes", free: "—", premium: "Included" },
  { label: "AI practice built from a test report", free: "—", premium: "Included" },
  { label: "Smart Mode spaced repetition", free: "Included", premium: "Included" },
  { label: "Cram Mode", free: "Included", premium: "Included" },
  { label: "AI-marked written answers", free: "Included", premium: "Included" },
  { label: "Overrule the AI marker", free: "Included", premium: "Included" },
  { label: "Communities", free: "Included", premium: "Included" },
  { label: "Daily quiz and streak multipliers", free: "Included", premium: "Included" },
];

export default async function PlanPage() {
  const user = await requireUser();
  const isPremium = user.plan === "PREMIUM";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/settings" className="text-sm text-muted transition-colors hover:text-bright">
          ← Settings
        </Link>
      </div>

      <SectionHeading
        title="Free and premium"
        subtitle="Everything that makes you learn is on the free plan. Premium removes the ceilings and adds the AI that turns your mistakes into practice."
      />

      {/* Free and Premium are two halves of one choice, so one hairline-divided
          card rather than two separately-bordered ones. Which side is yours is
          the "Your plan" badge's job — a coloured card border was saying the
          same thing twice. */}
      <Panel className="overflow-hidden p-0">
        <div className="grid divide-line md:grid-cols-2 md:divide-x">
          <div className={cn("flex flex-col p-6", !isPremium && "bg-accent/8")}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-[17px] font-semibold">Free</h2>
              {!isPremium ? <Badge tone="violet">Your plan</Badge> : null}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              The whole study product. Coins accrue more slowly and the AI features are rationed.
            </p>
            <div className="num mt-auto pt-5 text-[26px] font-semibold leading-none tracking-[-0.028em] text-bright">
              £0
            </div>
          </div>

          <div
            className={cn(
              "flex flex-col border-t border-line p-6 md:border-t-0",
              isPremium && "bg-coin/8",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold">
                <CrownIcon size={18} className="text-coin" />
                Premium
              </h2>
              {isPremium ? <Badge tone="coin">Your plan</Badge> : null}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Coins twice as fast, triple the daily reward limits, unlimited AI uploads.
            </p>
            <div className="mt-auto flex items-baseline gap-2 pt-5">
              <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.028em] text-coin">
                Set your price
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-faint">
              No billing provider is connected yet — pricing goes in when Stripe does.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <PanelHeader title="Side by side" className="p-6 pb-0" />
        {/* The table keeps its own scroller so the page body never moves
            sideways on a phone. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-[0.06em] text-faint">
                <th className="w-[48%] px-6 py-3 text-left font-semibold">Feature</th>
                <th className="px-4 py-3 text-center font-semibold">Free</th>
                <th className="px-4 py-3 text-center font-semibold text-coin">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map((row) => (
                <tr key={row.label} className="transition-colors hover:bg-raise">
                  <td className="px-6 py-3 leading-snug text-muted">{row.label}</td>
                  <td className="px-4 py-3 text-center">
                    {row.free === "—" ? (
                      <XIcon size={15} className="mx-auto text-faint" />
                    ) : row.free === "Included" ? (
                      <CheckIcon size={15} className="mx-auto text-lime" />
                    ) : (
                      <span className="num whitespace-nowrap text-bright">{row.free}</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-center",
                      row.highlight && "bg-raise-2",
                    )}
                  >
                    {row.premium === "Included" ? (
                      <CheckIcon size={15} className="mx-auto text-lime" />
                    ) : (
                      <span className="num whitespace-nowrap font-semibold text-coin">
                        {row.premium}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The caveat belongs to the comparison above it, not beside it as an
            equally-weighted panel — a quiet footnote under a hairline. */}
        <div className="border-t border-line p-6">
          <h3 className="mb-3 font-display text-[14.5px] font-semibold tracking-[-0.01em] text-muted">
            What premium doesn&apos;t do
          </h3>
          <ul className="divide-y divide-line text-sm leading-relaxed text-muted">
            <li className="flex items-start gap-3 pb-3">
              <CoinIcon size={15} className="mt-0.5 shrink-0 text-coin" />
              <span>
                It doesn&apos;t sell you Study Coins. Coins are earned by studying, on both plans —
                that&apos;s the whole point of them.
              </span>
            </li>
            <li className="flex items-start gap-3 pt-3">
              <CoinIcon size={15} className="mt-0.5 shrink-0 text-coin" />
              <span>
                It doesn&apos;t change the score bands, the cooldowns, or the 24-hour rule on new
                content. Those apply to everyone.
              </span>
            </li>
          </ul>
        </div>
      </Panel>

      <PlanSwitch plan={user.plan} />
    </div>
  );
}
