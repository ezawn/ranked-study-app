# StudyQuest — UI/UX redesign round ("Card Frames")

Companion to `design-system.md`, which carries the rules. This is what happened in the
redesign round, what it cost, and what is still open. `build-notes.md` remains accurate
about the backend; nothing here changed a service, a schema or a coin rule.

## What this round was

A complete visual rebuild, run through the **impeccable** skill rather than by taste.
The brief: not a reskin, must not look AI-generated or templated, audience 13–23, lighter
warm grounds, a vibrant semantic palette, new faces, less clutter, the dashboard as the
highlight — and **no functionality removed**.

The world — "Card Frames" — was picked by Louis from a dealt hand of seven candidates,
over the roll's own assignment. Seed `f2d16265`. The full direction contract is committed
as an HTML comment in `src/app/layout.tsx` so it survives into the built markup and can be
audited there.

The system it replaces is "Ink & Gold", the monochrome graphite-and-gold scheme. That is
gone, not layered over.

## How re-theming 174 files was possible

The legacy semantic token names (`violet`, `cyan`, `lime`, `rose`, `amber`, `panel`) were
**repointed, not renamed** — each is now an alias onto the rarity scale. Changing
`globals.css` re-themed every screen at once with no chance of one being missed, and no
call site had to change. Treat that alias layer as read-only compatibility; don't extend
it and don't "clean it up" into a rename.

## Verification that ran on every round

- `check_imports.py` — all local imports resolve across 175 files.
- A 116-item control-label regression over the pre-redesign audit — **the proof no feature
  was lost**. Every button, filter, toggle and link that existed before still exists.
- 133 logic tests (economy, SRS, marking, timezone, anti-cheat) — unchanged and passing.
- A brace/paren balance parse over 166 files (two known false positives from apostrophes
  in JSX text).
- `detect.mjs --json` — the skill's slop detector, returning `[]`.
- A WCAG contrast matrix over all 136 colour × surface pairs in both themes.

## Findings worth remembering

**The detector caught three things I would have shipped.** Bounce easing on the coin pop
(replaced with exponential ease-out); `transition: width` on the meter fill (replaced with
`transform: scaleX()`); and the 3px rarity side-rail, which it named the most recognisable
tell of a generated interface. The rail became the frame itself — which is both more
authentic to a trading card and dodges the tell.

**The finish reviewer caught the serious one, and it was in my own tooling.** The app can't
run here (no database, and every package registry is blocked), so screenshots came from a
purpose-built static harness that uses the real `globals.css` and re-implements only the
Tailwind utility shapes. That harness **hand-authored one of each rarity onto the four
dashboard cards** while the page itself hardcoded every item to `common`. The screenshots
showed a rarity system the product did not have. Fixed at the root: the harness now
*computes* rarity with the same two rules the app uses, so it cannot flatter the build
again. **Sample data may stand in for a query; it may never stand in for a derivation.**

**Pre-existing bugs surfaced along the way**, all now fixed: `.sq-checkbox` / `.sq-radio`
never existed as CSS, so every checkbox and radio rendered unstyled; `.flip-scene` /
`.flip-card` / `.flip-face` / `.is-flipped` never existed either, so the flashcard 3D flip
had never worked; `animate-pulse-glow` was undefined.

**Navigation felt slow for two separate reasons.** `loading.tsx` only shows once the client
knows the boundary exists, which it learns from prefetch — and `next dev` disables prefetch
entirely, so the dev experience was misleading. The real fix was a `NavigationProvider`
holding the pending destination, with two constraints that must not be undone: the click
listener sits in the **capture** phase (in the bubble phase Next's `<Link>` has already
called `preventDefault()`), and the skeleton is a **CSS-hidden sibling** of the page, never
a React swap (a component cannot commit a state change while the subtree it renders is
suspended — which is the exact pause being removed). Separately, `pathname` in the
heartbeat effect's deps was rebuilding the effect on every navigation and producing a wave
of `429`s; it now uses a ref.

## Two rounds of finish review

Shipped on `disposition: ship` after eight material fixes and two self-inflicted
regressions. The fixes worth knowing as rules rather than as history:

- **Rarity now computes on the dashboard.** It was the one surface hardcoding `common`,
  so the product's central claim — colour means mastery — shipped on no card on the page
  that matters most.
- **Seven label-plus-big-number cells stacked back to back** is the hero-metric template.
  Today's three readings became struck pips with the meter carrying the weight, leaving
  the four totals as the page's only large numerals.
- **Three same-size icon + heading + text cards** is the first refused page scaffold. The
  onward routes became rows on one frame.
- **Stock means earned.** The Arena moved out of the rail onto a hairline at the foot,
  with no card frame at all — an unbuilt feature wearing the same stock as a set the
  student actually studied is the quiet door claiming to be furniture.
- **Cap prose by measure, not by container.** A `max-w-3xl` on a row that was already
  narrower than the cap did nothing; `max-w-[62ch]` on the text does.

## Open

1. **`.impeccable/build/state.json` does not exist.** The build ran without opening a
   build phase. It cannot be produced now without fabricating it, which would be worse
   than its absence, so it stands as a disclosed gap in the build record.
2. **The screenshots are harness renders, not the running app.** Fonts fall back to
   Liberation Sans (Archivo and Schibsted Grotesk cannot be installed here) and icons are
   geometric stand-ins for Phosphor. Layout, colour, spacing, depth and hierarchy are real;
   letterforms and glyphs are not. **Run it locally and look before signing this off.**
3. **The finish review covered the dashboard and the shell**, not every surface. The other
   screens inherit the token system and were regression-checked for controls, but they
   have not had a design review of their own.
4. **`accentFor()` in `lib/utils.ts`** is a hash-a-string-to-a-hue helper left from the old
   system, reached only by the uncalled `subjectAccent()`. It contradicts the rarity rule.
   Left in place rather than deleted, but do not wire it to anything.
5. **The product name is provisional** and now reads from `src/lib/brand.ts` everywhere.
   Renaming is one line plus a new glyph.

## Standing security constraints (unchanged by this round)

Reward calculation stays server-side; the frontend never decides whether a user earned
coins. The two dashboard aggregates added this round return `dueCount` and
`bestPercentage` for display only. Arena features remain non-functional placeholders.
`.env` is still written by Louis, not by tooling. Do not run `npm audit fix --force`.
**The Neon database password pasted into chat earlier should still be rotated.**
