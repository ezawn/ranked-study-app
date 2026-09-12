/**
 * Runnable proof that the economy and scheduling rules behave as specified.
 *
 * Every module under test is deliberately framework-free, so this runs with a
 * bare TypeScript runtime — no database, no Next.js, no test framework:
 *
 *   npx tsx scripts/verify-logic.ts
 *
 * The same assertions are mirrored in the Vitest suite under tests/.
 */

import {
  streakMultiplier,
  flashcardSetCoins,
  quizScoreCoins,
  quizTimeLimitSeconds,
  quizIsCoinEligible,
  appTimeDailyCoinCap,
  uploadQuota,
} from "../src/lib/coins/rules";
import {
  decideFlashcardReward,
  decideQuizReward,
  creditAppTime,
  computeDailyQuizReward,
  advanceStreak,
} from "../src/lib/coins/decisions";
import { dayKey, daysBetween, addDays } from "../src/lib/time/day";
import {
  initialCardState,
  schedule,
  startCram,
  applyCramAnswer,
  isCramComplete,
  describeInterval,
  type Rating,
  type CardState,
} from "../src/lib/srs/scheduler";
import {
  markAttempt,
  markSingleChoice,
  markMultipleChoice,
  percentage,
  isAttemptExpired,
  clampOverrideMarks,
} from "../src/lib/quiz/marking";

// ---------------------------------------------------------------------------
// Tiny assertion harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures: string[] = [];
let group = "";

function describe(name: string) {
  group = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failures.push(`${group} → ${label}\n      expected ${e}\n      received ${a}`);
    console.log(`  \x1b[31m✗\x1b[0m ${label}  expected ${e}, got ${a}`);
  }
}

function checkClose(label: string, actual: number, expected: number, tolerance = 0.01) {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failures.push(`${group} → ${label}\n      expected ~${expected}\n      received ${actual}`);
    console.log(`  \x1b[31m✗\x1b[0m ${label}  expected ~${expected}, got ${actual}`);
  }
}

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-08-25T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * HOUR);

// ---------------------------------------------------------------------------

describe("Day keys and calendar arithmetic");
check("UTC midnight in London is the same day", dayKey(new Date("2026-08-25T23:30:00Z"), "Europe/London"), "2026-08-26");
check("late evening UTC is still the 25th in New York", dayKey(new Date("2026-08-25T23:30:00Z"), "America/New_York"), "2026-08-25");
check("unknown timezone falls back to UTC instead of throwing", dayKey(new Date("2026-08-25T10:00:00Z"), "Not/AZone"), "2026-08-25");
check("consecutive days are 1 apart", daysBetween("2026-08-24", "2026-08-25"), 1);
check("gap across a month boundary", daysBetween("2026-07-31", "2026-08-03"), 3);
check("addDays crosses a month", addDays("2026-08-31", 1), "2026-09-01");

// ---------------------------------------------------------------------------

describe("Streak multiplier (x1.0, +0.2/day, capped at x5)");
check("day 1 is x1.0", streakMultiplier(1), 1);
check("day 2 is x1.2", streakMultiplier(2), 1.2);
check("day 6 is x2.0", streakMultiplier(6), 2);
check("day 20 is x4.8", streakMultiplier(20), 4.8);
check("day 21 hits the x5 cap", streakMultiplier(21), 5);
check("day 400 stays at the cap", streakMultiplier(400), 5);
check("a zero streak is treated as day 1", streakMultiplier(0), 1);

// ---------------------------------------------------------------------------

describe("Flashcard coin scaling (1 per 20 cards, round down, floor of 1)");
check("empty set earns nothing", flashcardSetCoins(0), 0);
check("12 cards still earns the minimum 1", flashcardSetCoins(12), 1);
check("exactly 20 cards earns 1", flashcardSetCoins(20), 1);
check("45 cards rounds down to 2", flashcardSetCoins(45), 2);
check("200 cards earns 10", flashcardSetCoins(200), 10);

// ---------------------------------------------------------------------------

describe("Quiz score bands and timing");
check("95% earns 5", quizScoreCoins(95), 5);
check("90% earns 5", quizScoreCoins(90), 5);
check("89% earns 3", quizScoreCoins(89), 3);
check("70% earns 2", quizScoreCoins(70), 2);
check("60% earns 1", quizScoreCoins(60), 1);
check("59% earns nothing", quizScoreCoins(59), 0);
check("10 marks = 900s = the 15 minute minimum", quizTimeLimitSeconds(10), 900);
check("40 marks = 1 hour", quizTimeLimitSeconds(40), 3600);
check("9 marks is not coin-eligible", quizIsCoinEligible(9), false);
check("10 marks is coin-eligible", quizIsCoinEligible(10), true);

// ---------------------------------------------------------------------------

describe("Flashcard reward decisions");
const fcBase = { cardCount: 40, setCreatedAt: hoursAgo(72), lastRewardedAt: null, setsRewardedToday: 0, plan: "FREE" as const, now: NOW };

check("a set completed after the 24h gate pays out", decideFlashcardReward(fcBase), { eligible: true, baseCoins: 2, reason: null });
check("a set created an hour ago is too new", decideFlashcardReward({ ...fcBase, setCreatedAt: hoursAgo(1) }), { eligible: false, baseCoins: 0, reason: "CONTENT_TOO_NEW" });
check("23h old is still too new", decideFlashcardReward({ ...fcBase, setCreatedAt: hoursAgo(23) }), { eligible: false, baseCoins: 0, reason: "CONTENT_TOO_NEW" });
check("rewarded 2 days ago is inside the 3-day cooldown", decideFlashcardReward({ ...fcBase, lastRewardedAt: hoursAgo(48) }), { eligible: false, baseCoins: 0, reason: "REWARD_COOLDOWN" });
check("rewarded 3.5 days ago is clear of the cooldown", decideFlashcardReward({ ...fcBase, lastRewardedAt: hoursAgo(84) }), { eligible: true, baseCoins: 2, reason: null });
check("free user is capped at 10 sets a day", decideFlashcardReward({ ...fcBase, setsRewardedToday: 10 }), { eligible: false, baseCoins: 0, reason: "DAILY_LIMIT_REACHED" });
check("premium keeps going at 10 sets", decideFlashcardReward({ ...fcBase, setsRewardedToday: 10, plan: "PREMIUM" }), { eligible: true, baseCoins: 2, reason: null });
check("premium is capped at 30 sets a day", decideFlashcardReward({ ...fcBase, setsRewardedToday: 30, plan: "PREMIUM" }), { eligible: false, baseCoins: 0, reason: "DAILY_LIMIT_REACHED" });
check("an empty set is rejected before anything else", decideFlashcardReward({ ...fcBase, cardCount: 0 }), { eligible: false, baseCoins: 0, reason: "NO_CARDS" });

// ---------------------------------------------------------------------------

describe("Quiz reward decisions");
const qBase = { totalMarks: 20, percentage: 92, timeExpired: false, quizCreatedAt: hoursAgo(72), lastRewardedAt: null, quizzesRewardedToday: 0, plan: "FREE" as const, now: NOW };

check("a 92% run on a 20-mark quiz earns 5", decideQuizReward(qBase), { eligible: true, baseCoins: 5, reason: null });
check("a 9-mark quiz never pays", decideQuizReward({ ...qBase, totalMarks: 9 }), { eligible: false, baseCoins: 0, reason: "QUIZ_TOO_SHORT" });
check("running out of time voids the coins", decideQuizReward({ ...qBase, timeExpired: true }), { eligible: false, baseCoins: 0, reason: "TIME_EXPIRED" });
check("a brand new quiz is gated for 24h", decideQuizReward({ ...qBase, quizCreatedAt: hoursAgo(2) }), { eligible: false, baseCoins: 0, reason: "CONTENT_TOO_NEW" });
check("55% is below the earning threshold", decideQuizReward({ ...qBase, percentage: 55 }), { eligible: false, baseCoins: 0, reason: "SCORE_BELOW_THRESHOLD" });
check("re-running the same quiz next day hits the cooldown", decideQuizReward({ ...qBase, lastRewardedAt: hoursAgo(24) }), { eligible: false, baseCoins: 0, reason: "REWARD_COOLDOWN" });
check("the same quiz pays again after 3 days", decideQuizReward({ ...qBase, lastRewardedAt: hoursAgo(73) }), { eligible: true, baseCoins: 5, reason: null });
check("free user is capped at 10 quizzes a day", decideQuizReward({ ...qBase, quizzesRewardedToday: 10 }), { eligible: false, baseCoins: 0, reason: "DAILY_LIMIT_REACHED" });
check("premium is capped at 30 quizzes a day", decideQuizReward({ ...qBase, quizzesRewardedToday: 30, plan: "PREMIUM" }), { eligible: false, baseCoins: 0, reason: "DAILY_LIMIT_REACHED" });
check("a short quiz is rejected even at 100%", decideQuizReward({ ...qBase, totalMarks: 4, percentage: 100 }), { eligible: false, baseCoins: 0, reason: "QUIZ_TOO_SHORT" });

// ---------------------------------------------------------------------------

describe("Active-time accrual and its anti-farm clamps");

check("free tier earns 96 coins a day at most", appTimeDailyCoinCap("FREE"), 96);
check("premium earns 192 coins a day at most", appTimeDailyCoinCap("PREMIUM"), 192);

const heartbeat = (activeBefore: number, coinsBefore: number, gapSeconds: number, plan: "FREE" | "PREMIUM" = "FREE") =>
  creditAppTime({
    activeSecondsBefore: activeBefore,
    coinsAwardedBefore: coinsBefore,
    lastHeartbeatAt: new Date(NOW.getTime() - gapSeconds * 1000),
    now: NOW,
    plan,
  });

check("a heartbeat 10s after the last is rejected", heartbeat(0, 0, 10).accepted, false);
check("a replayed heartbeat (0s gap) banks no time", heartbeat(100, 0, 0).activeSecondsAfter, 100);
check("a normal 30s heartbeat banks 30s", heartbeat(0, 0, 30).activeSecondsAfter, 30);
check("crossing 5 minutes pays a free user 1 coin", heartbeat(280, 0, 30).coinsToAward, 1);
check("mid-interval pays nothing", heartbeat(120, 0, 30).coinsToAward, 0);
check("an hour-long gap credits at most 45s, not the hour", heartbeat(0, 0, 3600).activeSecondsAfter, 45);
check("premium crosses its 2.5 minute mark", heartbeat(130, 0, 30, "PREMIUM").coinsToAward, 1);
check("premium has already been paid for banked time", heartbeat(130, 1, 30, "PREMIUM").coinsToAward, 0);
check("active seconds stop at the 8 hour ceiling", heartbeat(28790, 95, 30).activeSecondsAfter, 28800);
check("the last coin of the day still lands", heartbeat(28790, 95, 30).coinsToAward, 1);
check("past the ceiling nothing more is paid", heartbeat(28800, 96, 30).coinsToAward, 0);
check("the ceiling is reported", heartbeat(28800, 96, 30).cappedOut, true);

// A full simulated study session: 8 hours of unbroken 30s heartbeats.
let simActive = 0;
let simCoins = 0;
for (let i = 0; i < 2000; i++) {
  const r = creditAppTime({
    activeSecondsBefore: simActive,
    coinsAwardedBefore: simCoins,
    lastHeartbeatAt: new Date(NOW.getTime() - 30_000),
    now: NOW,
    plan: "FREE",
  });
  simActive = r.activeSecondsAfter;
  simCoins = r.coinsAwardedAfter;
}
check("2000 honest heartbeats cannot exceed the daily cap", simCoins, 96);

// The farm attempt: hammering the endpoint as fast as possible.
let farmActive = 0;
let farmCoins = 0;
for (let i = 0; i < 5000; i++) {
  const r = creditAppTime({
    activeSecondsBefore: farmActive,
    coinsAwardedBefore: farmCoins,
    lastHeartbeatAt: new Date(NOW.getTime() - 1000), // 1s apart
    now: NOW,
    plan: "PREMIUM",
  });
  farmActive = r.activeSecondsAfter;
  farmCoins = r.coinsAwardedAfter;
}
check("5000 rapid-fire heartbeats bank zero time", farmActive, 0);
check("5000 rapid-fire heartbeats earn zero coins", farmCoins, 0);

// ---------------------------------------------------------------------------

describe("Daily quiz rewards");
check("3 of 5 correct on day 1 pays 3", computeDailyQuizReward({ correctCount: 3, totalCount: 5, streakDays: 1 }).totalCoins, 3);
check("5 of 5 on day 1 pays 5 + 1 bonus", computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 1 }).totalCoins, 6);
check("all correct is flagged", computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 1 }).allCorrect, true);
check("3 of 5 on a 6-day streak doubles to 6", computeDailyQuizReward({ correctCount: 3, totalCount: 5, streakDays: 6 }).totalCoins, 6);
check("the all-correct bonus obeys the multiplier", computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 6 }).totalCoins, 12);
check("everything wrong pays nothing", computeDailyQuizReward({ correctCount: 0, totalCount: 5, streakDays: 10 }).totalCoins, 0);
check("a maxed streak with a perfect round pays 30", computeDailyQuizReward({ correctCount: 5, totalCount: 5, streakDays: 21 }).totalCoins, 30);
check("fractional totals round to a whole coin", computeDailyQuizReward({ correctCount: 3, totalCount: 5, streakDays: 3 }).totalCoins, 4); // 3 x 1.4 = 4.2
check("a claimed over-count is clamped to the total", computeDailyQuizReward({ correctCount: 99, totalCount: 5, streakDays: 1 }).totalCoins, 6);

// ---------------------------------------------------------------------------

describe("Streaks continue on attempts, not on being right");
check("a first ever attempt starts at 1", advanceStreak({ currentStreak: 0, lastAttemptDay: null, today: "2026-08-25" }).streak, 1);
check("attempting the next day extends the streak", advanceStreak({ currentStreak: 7, lastAttemptDay: "2026-08-24", today: "2026-08-25" }).streak, 8);
check("attempting twice in one day does not double count", advanceStreak({ currentStreak: 7, lastAttemptDay: "2026-08-25", today: "2026-08-25" }).streak, 7);
check("the second attempt today is flagged", advanceStreak({ currentStreak: 7, lastAttemptDay: "2026-08-25", today: "2026-08-25" }).alreadyAttemptedToday, true);
check("missing a day resets to 1", advanceStreak({ currentStreak: 30, lastAttemptDay: "2026-08-22", today: "2026-08-25" }).streak, 1);
check("a reset is reported", advanceStreak({ currentStreak: 30, lastAttemptDay: "2026-08-22", today: "2026-08-25" }).reset, true);

// Two-day scenario from the spec: day 2 answered entirely wrong, streak survives.
const day2 = advanceStreak({ currentStreak: 1, lastAttemptDay: "2026-08-24", today: "2026-08-25" });
const day2Reward = computeDailyQuizReward({ correctCount: 0, totalCount: 4, streakDays: day2.streak });
check("day 2 with every answer wrong keeps the streak at 2", day2.streak, 2);
check("day 2 with every answer wrong still pays 0", day2Reward.totalCoins, 0);

// ---------------------------------------------------------------------------

describe("Adaptive spaced repetition");

const rate = (state: CardState, rating: Rating, recent: Rating[] = []) =>
  schedule({ state, rating, recentRatings: recent, now: NOW });

const fresh = initialCardState();
checkClose("a first 'know' schedules ~6 days", rate(fresh, "KNOW").state.intervalHours, 144);
checkClose("a first 'partially know' schedules ~2 days", rate(fresh, "PARTIAL").state.intervalHours, 45.6);
checkClose("a first 'don't know' schedules under a day", rate(fresh, "DONT_KNOW").state.intervalHours, 14.4);

// Repeated success stretches the interval out.
let good = initialCardState();
const growth: number[] = [];
for (let i = 0; i < 4; i++) {
  const r = rate(good, "KNOW");
  good = r.state;
  growth.push(r.state.intervalHours);
}
check("each consecutive 'know' pushes the card further out", growth[0]! < growth[1]! && growth[1]! < growth[2]! && growth[2]! < growth[3]!, true);
check("four straight 'knows' push the card past three weeks", growth[3]! > 24 * 20, true);

// The spec's worked example: seen daily, failed every time.
let bad = initialCardState();
const struggleIntervals: number[] = [];
const history: Rating[] = [];
for (let i = 0; i < 4; i++) {
  const r = rate(bad, "DONT_KNOW", [...history]);
  bad = r.state;
  history.unshift("DONT_KNOW");
  struggleIntervals.push(r.state.intervalHours);
}
check("a card failed over and over lands on the 12h floor", struggleIntervals[3], 12);
check("the struggle detector fires by the third failure", rate(initialCardState(), "DONT_KNOW", ["DONT_KNOW", "DONT_KNOW"]).struggling, true);
check("two failures alone do not trip it", rate(initialCardState(), "DONT_KNOW", ["DONT_KNOW"]).struggling, false);
check("nothing is ever scheduled below 12h", struggleIntervals.every((h) => h >= 12), true);
check("lapses are counted", bad.lapses, 4);

// Recovery: a struggling card that finally clicks moves back out.
const recovered = rate(bad, "KNOW", ["DONT_KNOW", "DONT_KNOW", "DONT_KNOW"]);
check("one 'know' after a bad run does not instantly jump to 5 days", recovered.state.intervalHours < 120, true);
check("but a correct answer is not pinned to the 12h floor either", recovered.state.intervalHours > 12, true);
check("the card is still flagged as a tricky one", recovered.struggling, true);

check("intervals are described in plain language", describeInterval(144), "6 days");
check("hours read as hours", describeInterval(12), "12 hours");

// ---------------------------------------------------------------------------

describe("Cram Mode piles");
let piles = startCram(["a", "b", "c"]);
check("everything starts unknown", piles.unknown.length, 3);
piles = applyCramAnswer(piles, "a", true);
check("a known card leaves the unknown pile", piles.unknown.includes("a"), false);
check("a known card joins the known pile", piles.known, ["a"]);
piles = applyCramAnswer(piles, "b", false);
check("an unknown card stays in the pile", piles.unknown.includes("b"), true);
check("it moves to the back of the round", piles.unknown, ["c", "b"]);
check("the session is not complete yet", isCramComplete(piles), false);
piles = applyCramAnswer(piles, "c", true);
piles = applyCramAnswer(piles, "b", true);
check("the session ends when the unknown pile empties", isCramComplete(piles), true);
check("every card ends up known", piles.known.length, 3);
check("answering a card that is already known is a no-op", applyCramAnswer(piles, "a", false).unknown.length, 0);

// ---------------------------------------------------------------------------

describe("Quiz marking");
check("the right single answer scores full marks", markSingleChoice(["o1"], ["o1"], 3), 3);
check("the wrong single answer scores zero", markSingleChoice(["o2"], ["o1"], 3), 0);
check("picking two on a single-answer question scores zero", markSingleChoice(["o1", "o2"], ["o1"], 3), 0);
check("all correct options scores full marks", markMultipleChoice(["a", "b"], ["a", "b"], 4), 4);
check("half right, none wrong scores half", markMultipleChoice(["a"], ["a", "b"], 4), 2);
check("one right and one wrong cancels out", markMultipleChoice(["a", "z"], ["a", "b"], 4), 0);
check("ticking every box scores zero", markMultipleChoice(["a", "b", "y", "z"], ["a", "b"], 4), 0);
check("duplicate selections are ignored", markMultipleChoice(["a", "a"], ["a", "b"], 4), 2);

const questions = [
  { id: "q1", type: "MCQ_SINGLE" as const, marks: 2, correctOptionIds: ["o1"] },
  { id: "q2", type: "MCQ_MULTI" as const, marks: 4, correctOptionIds: ["p1", "p2"] },
  { id: "q3", type: "WRITTEN" as const, marks: 6, correctOptionIds: [] },
];
const marking = markAttempt(questions, [
  { questionId: "q1", selectedOptionIds: ["o1"], writtenAnswer: null },
  { questionId: "q2", selectedOptionIds: ["p1"], writtenAnswer: null },
  { questionId: "q3", selectedOptionIds: [], writtenAnswer: "Photosynthesis converts light energy..." },
]);
check("total marks are summed from the questions", marking.totalMarks, 12);
check("multiple choice is settled immediately", marking.awardedMarks, 4);
check("written answers are queued for the AI marker", marking.pendingAiQuestionIds, ["q3"]);

const unanswered = markAttempt(questions, []);
check("skipped questions score zero", unanswered.awardedMarks, 0);
check("a blank written answer needs no AI call", unanswered.pendingAiQuestionIds, []);

check("percentages floor", percentage(7, 12), 58);
check("a perfect score is 100", percentage(12, 12), 100);
check("zero total marks is 0%, not a crash", percentage(0, 0), 0);

const deadline = new Date("2026-08-25T12:00:00Z");
check("submitting on time is not expired", isAttemptExpired(new Date("2026-08-25T11:59:59Z"), deadline), false);
check("3 seconds late is inside the grace window", isAttemptExpired(new Date("2026-08-25T12:00:03Z"), deadline), false);
check("a minute late is expired", isAttemptExpired(new Date("2026-08-25T12:01:00Z"), deadline), true);

check("an override cannot exceed the question's marks", clampOverrideMarks(99, 6), 6);
check("an override cannot go negative", clampOverrideMarks(-5, 6), 0);
check("a sensible override is kept", clampOverrideMarks(4, 6), 4);
check("garbage input becomes zero", clampOverrideMarks(NaN, 6), 0);

// ---------------------------------------------------------------------------

describe("Upload quotas");
check("free gets 1 PDF-to-quiz a day", uploadQuota("PDF_TO_QUIZ", "FREE"), 1);
check("free gets 1 test analysis a day, separately", uploadQuota("TEST_FEEDBACK", "FREE"), 1);
check("premium is unlimited on PDFs", uploadQuota("PDF_TO_QUIZ", "PREMIUM"), null); // Infinity -> null through JSON
check("premium is unlimited on tests", uploadQuota("TEST_FEEDBACK", "PREMIUM"), null);

// ---------------------------------------------------------------------------

console.log("\n" + "─".repeat(64));
if (failures.length === 0) {
  console.log(`\x1b[32m\x1b[1m  ${passed} checks passed.\x1b[0m`);
  process.exit(0);
} else {
  console.log(`\x1b[31m\x1b[1m  ${failures.length} failed, ${passed} passed\x1b[0m\n`);
  for (const f of failures) console.log("  " + f + "\n");
  process.exit(1);
}
