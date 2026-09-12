import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { earningSummary } from "@/server/services/coins";
import { studyTimeToday } from "@/server/services/study-time";
import { Panel, PanelHeader, SectionHeading, StatStrip } from "@/components/ui/panel";
import { AvatarForm, PasswordForm, ProfileForm } from "@/components/settings/profile-form";
import { Badge } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { APP_TIME, FLASHCARDS, QUIZZES, STUDY_BONUS, UPLOAD_QUOTAS } from "@/lib/coins/rules";
import { CardsIcon, CoinIcon, CommunityIcon, CrownIcon, QuizIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const [coins, time, counts] = await Promise.all([
    earningSummary(user.id, user.timezone, 0),
    studyTimeToday(user.id, user.timezone, user.plan),
    Promise.all([
      db.flashcardSet.count({ where: { ownerId: user.id } }),
      db.quiz.count({ where: { ownerId: user.id } }),
      db.communityMember.count({ where: { userId: user.id } }),
    ]),
  ]);

  const [sets, quizzes, communities] = counts;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionHeading title="Settings" subtitle="Your account and how the limits apply to it." />

      {/* One instrument rather than four cards — this is the state of one
          account, not four unrelated figures. */}
      <StatStrip
        stats={[
          {
            label: "Study Coins",
            value: coins.balance,
            icon: <CoinIcon size={14} />,
            gold: true,
          },
          { label: "Flashcard sets", value: sets, icon: <CardsIcon size={14} /> },
          { label: "Quizzes", value: quizzes, icon: <QuizIcon size={14} /> },
          { label: "Communities", value: communities, icon: <CommunityIcon size={14} /> },
        ]}
      />

      {/* Three separate forms with three separate submit buttons, but one
          group — avatar, details and password all edit the same account, so
          they sit closer to each other than to the overview above or the
          plan below. */}
      <div className="space-y-5">
        <AvatarForm
          name={user.name}
          avatarUrl={user.avatarUrl}
          hasUpload={Boolean(user.imageKey)}
        />

        <ProfileForm
          name={user.name}
          username={user.username}
          email={user.email}
          timezone={user.timezone}
          timezoneChangedAt={user.timezoneChangedAt}
        />

        <PasswordForm hasPassword={user.hasPassword} />
      </div>

      <Panel>
        <PanelHeader
          title="Your plan"
          subtitle="What you can do today."
          action={
            user.plan === "PREMIUM" ? (
              <Badge tone="coin">
                <CrownIcon size={10} /> Premium
              </Badge>
            ) : (
              <ButtonLink href="/settings/plan" variant="coin" size="sm">
                See premium
              </ButtonLink>
            )
          }
        />

        {/* A statement, not a wall of boxes: one hairline between each limit,
            the allowance on the right where a figure belongs. */}
        <ul className="-mt-1 divide-y divide-line">
          <Limit
            label="Coin timer"
            value={`1 coin per ${APP_TIME.secondsPerCoin[user.plan] / 60} minutes`}
            detail={`${Math.round(time.coinsAwarded)} earned today, ${time.dailyCoinCap} max`}
          />
          <Limit
            label="Study bonus"
            value={`5 coins per ${STUDY_BONUS.secondsPerBonus[user.plan] / 60} minutes`}
            detail={`${time.studyBonusCoins} earned today, ${time.studyBonusDailyCap} max`}
          />
          <Limit
            label="Flashcard sets per day"
            value={String(FLASHCARDS.dailySetLimit[user.plan])}
            detail="Distinct sets that can pay out"
          />
          <Limit
            label="Quizzes per day"
            value={String(QUIZZES.dailyQuizLimit[user.plan])}
            detail="Distinct quizzes that can pay out"
          />
          <Limit
            label="PDF to quiz"
            value={
              Number.isFinite(UPLOAD_QUOTAS.PDF_TO_QUIZ[user.plan])
                ? `${UPLOAD_QUOTAS.PDF_TO_QUIZ[user.plan]} a day`
                : "Unlimited"
            }
            detail="Separate from test feedback"
          />
          <Limit
            label="Test feedback"
            value={
              Number.isFinite(UPLOAD_QUOTAS.TEST_FEEDBACK[user.plan])
                ? `${UPLOAD_QUOTAS.TEST_FEEDBACK[user.plan]} a day`
                : "Unlimited"
            }
            detail="Its own daily allowance"
          />
          <Limit
            label="AI practice from mistakes"
            value={user.plan === "PREMIUM" ? "Included" : "Premium only"}
            detail="Improvement quizzes and test practice"
          />
        </ul>
      </Panel>

      <p className="text-center text-sm leading-relaxed text-muted">
        Wondering how coins work?{" "}
        <Link href="/streak" className="link">
          The streak page
        </Link>{" "}
        explains the daily side, and every set and quiz page shows exactly what it pays.
      </p>
    </div>
  );
}

function Limit({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-bright">{label}</div>
        <div className="mt-0.5 text-xs leading-snug text-faint">{detail}</div>
      </div>
      <div className="font-display text-[14px] font-semibold tracking-[-0.01em] text-bright">
        {value}
      </div>
    </li>
  );
}
