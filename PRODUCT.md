# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students aged roughly 13–23 revising for school, college and university assessments.
They work in short self-directed sessions, usually alone, often on a laptop and
frequently on a phone. The job is not "organise my notes" — it is "make the next
hour of revision actually count, and know that it did."

## Product Purpose

StudyQuest turns revision into measurable progression. Students build or import
flashcard sets and quizzes, study them under a spaced-repetition scheduler, and
earn Study Coins for work the server can verify. Success is a student choosing to
open it on a day nobody told them to revise.

## Positioning

**The game layer sits on top of real revision, and the currency is earned rather
than awarded.** Coins come from finishing sets, scoring on quizzes of real length,
attempting the daily quiz, and time the server measured the student actually
studying. Streaks multiply the daily reward up to x5. A competitor can copy points
and badges; it cannot copy a progression system whose payouts are validated
server-side against measured study activity.

Confirmed by the user as the centre of gravity: the working game layer — coins,
streaks, multipliers, timers, progression — not the unbuilt Arena.

## Operating Context

- Sessions are short and interruptible; a student may study on a phone between
  classes and on a laptop in the evening. Day boundaries follow the student's own
  timezone, not the server's.
- Material is either authored in-app, imported from a PDF, or saved from another
  student's public set.
- Community use is secondary to solo revision and mostly about sharing material.

## Capabilities and Constraints

**Flashcards** — sets with per-side images; Smart Mode (spaced repetition
scheduler decides what is due); Cram Mode; public sets discoverable and saveable
by other students.

**Quizzes** — multiple choice (single and multi) marked deterministically;
written answers marked by AI, with the student able to overrule a mark and give a
reason; per-quiz time limits; attempt history and results; a practice quiz
generated from the questions a student dropped marks on; PDF → quiz import.

**Daily quiz** — 3–5 questions drawn from the student's own material. Attempting
it, not passing it, is what extends the streak.

**Study Coins** — earned from completed sets, quiz scores at or above 60% on
quizzes of 10+ marks, the daily quiz, an app-time timer, and a verified
study-time bonus. Daily caps apply per plan.

**Test feedback** — upload a completed paper, get an analysis of where the marks
went, and generate practice from it.

**Communities** — create and join, invite codes, join requests, member roles
(leader, moderator), shared sets and quizzes, a post feed.

**Settings** — profile, avatar, password, timezone (rate-limited changes), plan.

**Plans** — Free and Premium, differing in AI quotas, upload limits and daily
coin caps.

**Hard constraints**

- Every reward calculation is validated server-side. The frontend must never be
  trusted to decide whether a student has earned coins.
- Study time is measured between server-recorded heartbeats. It is never
  self-reported by the client.
- The six Arena routes (1v1 Casual, 1v1 Ranked, Community Wars, Character,
  Leaderboard, Rank) are deliberate non-functional placeholders. They must stay
  visible but must not claim to work.

## Brand Commitments

**The name is provisional.** "StudyQuest" is a working title. Design must not
lean on the name: the wordmark stays a swappable component, and no layout,
illustration or lockup may depend on the specific letters.

No logo, brand colours or supplied assets exist. Identity is open.

## Evidence on Hand

Real, working product code across 33 routes. No customer testimonials, usage
figures, press, case studies or partner logos exist — none may be fabricated in
any surface. There is no marketing site in this repository.

## Product Principles

1. **Earned, not awarded.** Every number the interface celebrates must correspond
   to work the server verified. Never dramatise a figure the backend would not
   defend.
2. **The next action beats the summary.** A student opening the app should be told
   what to do now before being shown how they are doing overall.
3. **Solo revision is the product; social is support.** Communities exist to move
   material between students, not to become a feed to scroll.
4. **Honest about what is not built.** Placeholder features stay legible as
   placeholders. The user has asked that the Arena remain a quiet door rather than
   a headline.
5. **The student's day, not the server's.** Streaks, caps and daily resets follow
   the student's timezone everywhere.

## Accessibility & Inclusion

Audience includes younger teenagers and phone-first users. Established
requirements: text and interactive elements must clear WCAG AA contrast in every
theme; no state may be signalled by hue alone; touch targets stay at or above
36px; all motion collapses under `prefers-reduced-motion`.
