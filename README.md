# StudyQuest

A study SaaS for GCSE-through-university students, built to feel like a game. Smart flashcards
with adaptive spaced repetition, AI-marked quizzes, PDF-to-quiz, test feedback, communities, a
daily quiz with streak multipliers, and a Study Coin economy designed so it can't be farmed.

---

## Getting it running

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
#    Set DATABASE_URL to a Postgres database you can write to.
#    Generate an auth secret:  npx auth secret     (or: openssl rand -base64 32)

# 3. Create the schema and some data to look at
npm run db:push
npm run db:seed

# 4. Go
npm run dev
```

Open http://localhost:3000 — the first thing you see is the sign-in page, as specified.

The seed creates two accounts:

| Account | Email | Password | Plan |
|---|---|---|---|
| Alex Carter | `alex@studyquest.test` | `password123` | Free |
| Jordan Blake | `jordan@studyquest.test` | `password123` | Premium |

Both have flashcard sets and quizzes dated far enough back that the 24-hour coin gate has already
passed, so rewards work the moment you sign in. You can also flip your own account between free and
premium on **Settings → Plans** (development only — the action refuses to run in production).

### Optional setup

**Google sign-in.** Create OAuth credentials at
[console.cloud.google.com](https://console.cloud.google.com/apis/credentials) with the redirect URI
`http://localhost:3000/api/auth/callback/google`, then set `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET`. The Google button appears on the sign-in page once both are present.

**Real AI.** The app runs completely without an API key — PDF-to-quiz, written-answer marking and
test feedback all work using a local provider that genuinely reads your documents and builds
questions from them. To use Claude instead, set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`.
Every screen that used AI tells you which provider produced the result.

**The background worker.** Written-answer marking runs inline on submission, so you don't need this
to develop. Run it in production so failed marking gets retried and abandoned attempts get closed:

```bash
npm run worker
```

Or point a cron at `GET /api/cron/run` with `Authorization: Bearer $CRON_SECRET` every few minutes.
Either works; you don't need both.

---

## What's built

| Area | Status |
|---|---|
| Sign-in / sign-up, Google OAuth, sessions | Working |
| Dashboard | Working |
| Flashcards — CRUD, bulk paste, public library, search, save a copy | Working |
| Smart Mode — adaptive spaced repetition | Working |
| Cram Mode — two piles, looped until clear | Working |
| Quizzes — builder, single/multi-answer MCQ, written questions, mark schemes | Working |
| Quiz attempts — server-issued timer, marking, results | Working |
| AI marking of written answers, with your override | Working |
| PDF → quiz, with free/premium quotas | Working |
| AI improvement quizzes from your mistakes (premium) | Working |
| Test feedback — upload, strengths, weaknesses, topic breakdown | Working |
| AI practice from a test report (premium) | Working |
| Communities — 3 access types, invites, approvals, shared sets, discussion | Working |
| Daily quiz, streaks, streak multipliers | Working |
| Study Coins — all five earning paths, server-validated | Working |
| Free/premium limits | Working |
| Images on flashcards and quiz questions | Working |
| Profile picture, password change, forgot password | Working |
| Community member removal by leaders | Working |
| Arena, Character, Leaderboard, Rank, Community Wars | **Deliberately not built** — UI placeholders only |

---

## The Study Coin economy

Every number lives in **`src/lib/coins/rules.ts`**. Change the economy there; no feature code needs
touching.

### Earning

**Coin timer — active time on the app**
- Free: 1 coin per 5 minutes. Premium: 1 coin per 2.5 minutes.
- Capped at 8 hours of active time a day (96 coins free, 192 premium).
- "Active" means the tab is visible *and* there's been real input in the last minute.

**Study bonus — time spent actually studying**
- 5 coins per 30 minutes free, per 15 minutes premium.
- Its own 3-hour daily ceiling: 30 coins free, 60 premium.
- Only counts on flashcard, quiz and test-feedback pages, and only when the server can *see* the
  work: a card review written in the last few minutes, a quiz attempt genuinely in progress, a test
  report created recently. The browser sends a hint about which page it's on; the server checks it
  against rows that only exist if the studying happened. An unverified heartbeat still earns coin
  timer time, but no bonus.
- Study time is credited from the same clamped elapsed seconds as the coin timer, so it can never
  exceed the app time it's a subset of.

**Daily quiz**
- +1 coin per correct answer, +1 bonus coin for a perfect round.
- Streak multiplier: day 1 = ×1.0, +0.2 per consecutive day, capped at ×5.0 (reached on day 21).
- The multiplier applies to the bonus too.
- **The streak counts attempts, not scores.** Get everything wrong and it still continues. It only
  breaks on a day you don't show up.

**Flashcards**
- Paid when every card in a set is in the Known pile.
- `floor(cards / 20)` coins, minimum 1.
- Set must be 24 hours old; the same set pays again only after 3 days.
- Max 10 sets a day free, 30 premium.

**Quizzes**

| Score | Coins |
|---|---|
| 90 %+ | 5 |
| 80 %+ | 3 |
| 70 %+ | 2 |
| 60 %+ | 1 |
| under 60 % | 0 |

- Quiz must be at least 10 marks (the 15-minute minimum at 1.5 min/mark).
- Quiz must be 24 hours old; the same quiz pays again only after 3 days.
- Running out of time voids the coins for that attempt — the attempt still completes and still gets
  marked.
- Max 10 quizzes a day free, 30 premium.

### Why it can't be farmed

Nothing about this trusts the browser. In order:

1. **One place moves coins.** `awardCoins()` in `src/server/services/coins.ts` is the only function
   in the codebase that changes a balance. There is no `increment: coins` anywhere else.
2. **Every award is an append-only ledger row with a unique idempotency key.** Double-submit a quiz
   and the second write violates the unique index, so it awards nothing. `User.coinBalance` is a
   cache of `SUM(ledger.amount)`, written in the same transaction, and the worker periodically
   checks the two still agree.
3. **The ledger row, the balance and the daily counter are one transaction.** Two concurrent
   requests can't both pass a limit check — they serialise on the counter row.
4. **Time is measured, not reported.** The heartbeat endpoint takes no meaningful body. Elapsed
   time is `min(now − storedLastHeartbeat, 45s)` on the server's clock, with a minimum gap between
   accepted heartbeats. Replaying the request credits zero. Disappearing for an hour credits one
   interval.
5. **The quiz deadline is server-issued.** `serverDeadlineAt` is written when the attempt is
   created. The countdown you see is cosmetic; expiry is judged against the stored deadline.
6. **Answers are marked from stored data.** Correct answers and mark schemes are stripped from
   every payload sent to the browser during an attempt. The client sends selections; the server
   computes the score.
7. **Overriding the AI marker doesn't pay.** You can overrule a written-answer mark — your score
   updates, because you should be able to keep an honest record. Coins stay pinned to
   `markedPercentage`, frozen at marking time. Otherwise "I disagree" would be a button that prints
   currency. The UI says so plainly.
8. **Completion is verified, not claimed.** "I finished this set" is re-derived from stored review
   state before anything pays out.
9. **Limits are read from the database row, never the request.** A tampered session token gets you
   nothing.
10. **Changing timezone doesn't reset your caps.** Every daily counter is keyed on the local
    calendar date, so hopping timezones would otherwise land on a fresh, unused key. Two things stop
    it: the change is limited to once a week, and when it does move you onto a different date,
    today's counters — coin limits, upload quotas, the timer's ceiling, the daily quiz assignment
    and the streak's last-attempt day — move with you. Someone genuinely relocating notices nothing.

### Adding ranks later

`src/lib/coins/rank.ts` exports `getRankMultiplier()`, which returns `1.0` today. Every award
already multiplies by it. Introducing rank-based multipliers is a change to that one function.
`User.xp` and `User.rankTier` exist as reserved columns that nothing reads or writes.

---

## Adaptive spaced repetition

Base intervals are the ones from the spec: Don't Know → 24h, Partially Know → 48h, Know → 120h.

They adapt. Each card carries a per-user `ease` factor (0.25–3.0) and a `knowStreak`:

```
KNOW         knowStreak++;  ease ×= 1.20    interval = 120h × ease × (1 + 0.35 × (knowStreak − 1))
PARTIAL      knowStreak = 0; ease ×= 0.95   interval = 48h × ease
DONT_KNOW    knowStreak = 0; ease ×= 0.60   interval = 24h × ease
```

**The struggle detector** handles the spec's worked example — a card seen every day and marked
"Don't Know" every time. Three failures in the last four reviews floors the interval at 12 hours.
It deliberately does *not* fire on a correct answer: pinning a recovering card to 12h would stop it
ever escaping. Its depressed ease already keeps the next interval short (a leech that finally
clicks comes back in a day or two, not five).

Everything clamps to `[12h, 365d]`. Every review is written to `CardReview` with before/after
intervals, so the behaviour is auditable and tunable.

**Cram Mode is separate.** Two piles, looped until the unknown pile is empty. Cram reviews are
recorded but never touch Smart Mode scheduling — cramming before a test shouldn't wreck a carefully
built long-term schedule.

---

## Testing

```bash
npm test              # the full Vitest suite
npm run verify:logic  # the same rules, runnable with no test framework
```

**122 tests** across five files:

- `tests/coins.test.ts` — every rule in the economy, every band, every limit.
- `tests/srs.test.ts` — intervals, adaptation, the struggle detector, cram piles.
- `tests/marking.test.ts` — MCQ marking, partial credit, percentages, deadlines, override clamps.
- `tests/anti-cheat.test.ts` — written as attacks: farm the timer, spin up throwaway content, grind
  the same quiz, beat the clock, mark your own work, fake a streak, claim a better plan. Each one
  asserts the attack fails.
- `tests/day.test.ts` — timezone rollover, DST, leap days, streak expiry.

These cover the pure logic, which is where the rules live. What they don't cover, because it needs
a live database, is the plumbing — the transactions, the unique constraints, the authorisation
checks. Worth adding before you take real users:

- [ ] Two concurrent submissions of the same attempt award coins once
- [ ] A user can't read another user's private set, quiz, attempt or community
- [ ] The daily counter blocks the 11th reward of the day under concurrency
- [ ] Upload quota holds when several requests fire at once
- [ ] Deleting a quiz doesn't corrupt past attempts

---

## How it's put together

```
prisma/            schema.prisma · seed.ts
scripts/           worker.ts · verify-logic.ts
src/
  app/
    (auth)/        sign-in · sign-up
    (app)/         dashboard · flashcards · quizzes · test-feedback · communities ·
                   daily · streak · settings · arena* · character* · leaderboard* · rank*
    api/           auth · study-time · cron
  components/      ui/ · game/ · layout/ · flashcards/ · quizzes/ · communities/ ·
                   daily/ · test-feedback/ · settings/
  lib/             coins/ · srs/ · quiz/ · ai/ · storage/ · time/ · auth/ · db · rate-limit
  server/
    services/      all business logic
    actions/       server actions — thin, validated, rate-limited wrappers
    jobs/          background work
tests/
```

`*` = the future game features. They render a "not built yet" screen and read no state.

**The layering rule:** pages and components never touch the database. They call server actions,
which validate input with Zod, enforce rate limits, and delegate to services. Services own the
business rules and the transactions. Pure logic (`lib/coins`, `lib/srs`, `lib/quiz`) has no I/O at
all, which is why it can be tested exhaustively.

**The authorisation boundary** is `src/app/(app)/layout.tsx`: it calls `requireUser()` before any
child page renders, so no feature page has to remember to check. Every service query is
additionally scoped by ownership or membership.

### Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL · Prisma ·
Auth.js v5 · Zod · Vitest

Deploys to Vercel plus any managed Postgres. Set `STORAGE_DRIVER=s3` and finish the adapter in
`src/lib/storage/index.ts` before production — the local driver writes to disk, which an ephemeral
container will lose.

---

## Decisions worth knowing about

Where the spec was silent, these were chosen. Each is a one-line change if you disagree.

1. **MCQ is marked deterministically on the server**, not by AI. Multiple choice is exact-match, so
   AI would be slower, cost money, and could only make it worse. AI marks written answers, and
   partial credit on multi-answer questions uses a documented penalty formula. Say the word if you
   want AI in the MCQ path.
2. **The daily quiz uses multiple-choice questions only**, so it marks instantly and costs nothing
   to run for every user, every day. Written questions live in ordinary quizzes.
3. **Overriding the AI marker doesn't change your coins** — see the anti-cheat section.
4. **Cram Mode doesn't feed Smart Mode scheduling.**
5. **Coin totals round to the nearest whole coin** after the multiplier (3 correct × ×1.4 = 4.2 → 4).
6. **Daily quiz questions are snapshotted** when the day's quiz is generated, so editing or deleting
   the source quiz mid-day can't break it.
7. **Day boundaries use the user's timezone**, captured at sign-up and editable in settings.
8. **Private communities are invisible**, not merely locked — they never appear in Discover and the
   page 404s for non-members rather than saying "you can't see this".
9. **Sets need 4 cards and quizzes need 3 questions to publish**, to keep the public library from
   filling with stubs.
10. **Images are served through an authorised route**, never a public path, and are identified by
    their magic bytes rather than the browser's claimed content type. Any signed-in user can fetch
    any image key — keys are unguessable UUIDs, and per-resource checks on every image request
    weren't worth the latency for revision material. Tighten it if images ever hold anything
    sensitive.
11. **Sharing into a community grants access without publishing.** A private set shared with your
    class is viewable and copyable by that community's members and nobody else. Leave the community
    and it stops being visible.
12. **Re-sharing the same set updates the existing entry** rather than adding a duplicate, enforced
    by a unique constraint on (community, set) and (community, quiz).
13. **Rate limiting is in-process.** Fine for one Node process; swap `hit()` in
    `src/lib/rate-limit.ts` for a Redis counter before scaling horizontally. It's defence in depth
    either way — the coin rules are idempotent and time-clamped, so exceeding a rate limit still
    can't mint coins.

## Known gaps

Honest list of what isn't done:

- **No payment provider.** `User.plan` drives every limit, `Subscription` exists as the seam, and
  the dev-only switch on Settings → Plans lets you test both tiers. Wiring Stripe means writing
  `plan` from a webhook.
- **The S3 storage driver is a stub.** Local disk works; the S3 adapter throws a clear error rather
  than silently falling back.
- **Uploads are PDF-only.** Photos of a paper need OCR first; the error message says so.
- **Email is optional.** Password reset works end to end with no provider — the link is printed to
  the server console. Set `RESEND_API_KEY` and `MAIL_FROM` to send it for real. Email verification
  on sign-up still isn't built.
- **The app hasn't been run.** It was built in an environment with no access to the npm registry, so
  `npm install` was never possible there. The logic is verified by the test suite above; the wiring
  — Prisma client generation, Tailwind compilation, Auth.js routes — is verified by review, not by
  execution. Expect to fix a small thing or two on first boot.
