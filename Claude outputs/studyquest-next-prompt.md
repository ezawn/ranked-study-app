# StudyQuest — four changes

The project is at `C:\Users\kwanl\Desktop\studyquest`. Next.js 15 App Router, React 19,
TypeScript strict, Tailwind v4, Prisma/Postgres (Neon), Auth.js v5, Vitest.

**Read `claude/build-notes.md` and `claude/science-banks.md` in the project before starting.**
They carry the accumulated failure modes of this codebase and will save you repeating them.

## Standing rules — do not break these

- **Never run `prisma migrate dev`.** There is no migration history, so Prisma sees drift and
  offers to reset the database. That means deleting real data. Use `npx prisma db push`.
- **Rewards are decided server-side.** The browser never determines whether a user earned coins,
  what their score is, or whether an answer was correct.
- **No calculator questions in battles.** Every bank question must be doable in the head or on
  paper; the audit fails any answer with three or more decimal places.
- Out-of-scope features (Community Wars, XP, gear, Character 1v1) stay as non-functional
  placeholder screens.
- `.env` is not yours to write — if a value needs adding, say so and let me do it.

Work through the tasks in the order below. 1 and 2 change live behaviour, 3 is small, 4 is the
large additive one.

---

## 1. Every battle question must have exactly four options

**The bug.** Some questions serve only three options. `assembleOptions` in
`src/lib/bank/generate/kit.ts` (~line 382) guards with `if (distractors.length < 2)` and then
takes `distractors.slice(0, 3)`. Two surviving distractors plus the answer is three options, and
it ships. The error message even says "at least three options", so the floor was set wrong
deliberately rather than by accident.

**The scale.** I measured it by dealing the whole bank: **243 questions across 68 generators**
currently have fewer than four options.

| Subject | Affected | Total |
| --- | ---: | ---: |
| Maths | 47 | 2,596 |
| Physics | 80 | 2,694 |
| Chemistry | 77 | 1,850 |
| Biology | 39 | 1,398 |

Worst offenders: `chem.quant.empirical` (15), `chem.quant.reacting-masses` (13),
`phy.waves.standing` (11), `chem.quant.titration` (10), `phy.proj.horizontal-time` (9),
`bio.meth.sd` (9), `gcse.geometry.polygon-angles` (8), `phy.waves.critical-angle` (8),
`chem.atom.particles` (8), `bio.inh.crosses` (8).

**What to do.**

1. Change the floor in `assembleOptions` to require three distractors, so a question that cannot
   produce four options fails at build time instead of shipping short.
2. Fix every generator that then throws. The cause is almost always one of two things, both
   documented in `science-banks.md`: a distractor collapsing onto the answer for certain
   parameters, or a `cases` array whose `wrong` list only has two entries. The established fix for
   the first is to enumerate the parameter table at module load and filter out the degenerate
   combinations — `KC_CASES` and `HW_CASES` are worked examples. For the second, write a third
   wrong option that names a real mistake.
3. **Do not** pad with filler like "None of the above" or a numeric near-miss. Every distractor in
   this bank comes from a named student error, and that is what makes a wrong option teach
   something. If a question genuinely has only two plausible wrong answers, rewrite the question.

**Acceptance.** Add a check to `check_bank.ts` that fails if any dealt question has an option
count other than four, and run it over the whole bank. The count must be zero across all subjects.
Question totals may drop slightly where a generator loses variants; report the new totals.

---

## 2. Queue selection stops at subject + stage

**Why.** Picking subtopics narrows the pool so far that most questions are never asked, and two
players with different subtopic picks rarely intersect. Selection should go no deeper than a
subject at a qualification — "Chemistry A-Level" — with no drill-down beneath it.

**Where it lives.** Topic preferences flow through more than the UI, so removing the button is not
enough:

- `src/components/arena/subject-picker.tsx` — the "Topics" drill-down button and its `expanded` state
- `src/app/(app)/arena/page.tsx` — builds `topics` onto each stream
- `src/server/actions/arena.ts` and `src/server/services/arena/queue.ts` — `normalisePreference`,
  `queueTopics`, and the topic half of `intersectPreferences`
- `src/server/services/arena/match.ts`, `src/lib/bank/select.ts`,
  `src/server/services/bank/query.ts` — topic filtering in pool building and counting
- `prisma/schema.prisma` line ~1085 — `queueTopics String[]`

Keep the `queueTopics` column (dropping it needs a schema change for no benefit) but stop writing
it, stop reading it, and **clear any existing values** so a player who saved topic picks before
this change is not silently filtered by them. A one-off `updateMany` setting it to `[]` is fine.

**Acceptance.** A player can tick "Chemistry · A-Level" and nothing else; two players who tick the
same stream always match; the question count shown for a stream reflects the whole stream. Add or
update a test in the matchmaking suite pinning that preferences intersect on streams alone.

---

## 3. Show-password toggle on sign-in

Add a control inside the password field that toggles between masked and visible.

Password inputs live in three components — build one small shared toggle and use it in all of
them rather than three copies:

- `src/components/auth/auth-form.tsx` — sign-in and sign-up (**this is the one that was asked for**)
- `src/components/auth/password-forms.tsx` — forgot and reset password
- `src/components/settings/profile-form.tsx` — change password in settings

Requirements: `type="button"` so it never submits the form; an `aria-label` that changes with
state ("Show password" / "Hide password"); `aria-pressed` reflecting the state; defaults to hidden
on every render, including after a failed submit; visible focus ring; hit target large enough to
tap on a phone. Match the existing design system — check `claude/design-system.md`.

---

## 4. Computer science question bank

Add computer science the same way physics, chemistry and biology were added. `science-banks.md`
documents the whole method; follow it rather than inventing a new approach.

**Shape.** A `CS_TOPICS` tree in `src/lib/bank/taxonomy.ts` covering GCSE and A-Level, common core
only — content shared across AQA, OCR and Edexcel, with board-specific NEA and option modules left
out. Aim for roughly the size of the other subjects: 15–18 topics, 80–100 subtopics. **Topic keys
must be `cs-` prefixed** — they are globally indexed and `assertNoTopicKeyCollisions` throws at
module load on a collision. Then generator files under `src/lib/bank/generate/`, wired into
`index.ts`, plus a `cs-kit.ts` for shared helpers if the arithmetic warrants one.

**Volume.** Match the other subjects — 1,400 or better, and CS should beat biology's 14 questions
per subtopic comfortably. Use `probe_variants.ts` (in my harness, or rebuild it: it raises each
generator's `variants` until the dedupe stalls, which measures the real parameter space rather
than guessing) and set counts to what the space supports, capped around 48.

**CS is unusually rich in computed questions**, which is where the good ones come from — lean on
this rather than writing recall lists:

binary/hex/denary conversion · two's complement · binary addition and overflow · shifts as
multiply and divide · logic gate truth tables and Boolean simplification · file size from
resolution × colour depth · sound size from sample rate × bit depth × duration · compression
ratios for RLE and Huffman · Big-O comparison and step counts for the standard sorts and searches
· linear vs binary search comparisons on a given list · stack and queue operation traces ·
hash table collisions · SQL result prediction · character encoding sizes · network calculations ·
parity and check digits · LMC / assembly instruction traces

**Watch out for two-option questions.** CS invites "is this valid or not", "will this compile",
"true or false" — those give two options and will now fail the four-option rule from task 1. Ask
"which of these is valid" over four candidates instead.

**Every generator follows the contract**: answers computed and never typed, distractors that are
named mistakes, a `check()` hook that re-derives the answer a *second way* and actually inspects
the published answer (a check that recomputes the same wrong value catches nothing — that is how a
−2 Ω internal resistance shipped), deterministic seeding, and no calculator questions.

**Enable it in the UI.** Nothing to do — the Arena subject picker greys a subject out on
`stream.count === 0`, which is a live query against the bank, so CS lights up on its own once
seeded.

---

## Verification

Do not report done until all of these pass:

- The bank audit over every subject, with the new four-option check added
- `npm run typecheck` — it catches the class of bug that has cost the most time here
- The Vitest suite (264 tests before your changes)
- The static checkers, run from the project root: `check_races.py`, `check_prisma.py`,
  `check_imports.py`, `check_scripts.py`, `check_hotpath.py`

Then **spot-read actual generated output** for the new CS questions rather than trusting the
audit. The audit is structural; it cannot tell you that a plausible-looking answer is wrong. The
one real content error in the science banks was found this way and not by any checker.

Afterwards I will need to run `npm run seed:bank` — tell me if anything you changed also needs
`npx prisma db push`.

Update `claude/build-notes.md` and `claude/science-banks.md` with what changed, including the
four-option rule and why the floor was wrong.
