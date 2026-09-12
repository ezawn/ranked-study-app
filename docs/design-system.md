# StudyQuest design system — "Card Frames"

The rules the interface follows. Enforced in `src/app/globals.css` and the primitives in
`src/components/ui/`. Most of these are locks rather than preferences — read this before
changing anything visual.

`DESIGN.md` at the repo root is the machine-written record of the same system, derived
from the shipped code after the build. This file is the human one: it says *why*, and it
carries the history and the traps. Where they disagree, `DESIGN.md` is describing the
code and this file is describing the intent — fix whichever is wrong.

This replaces "Ink & Gold", the monochrome graphite-and-gold system that shipped before
it. That system is gone: no graphite accent, no inversion, no grain, no Space Grotesk,
no Geist Mono. Nothing below is inherited from it unless it says so.

## The one idea

**The world is the trading card, and colour is the rarity a student earned.**

A flashcard set *is* a card. A quiz *is* a card. What a student accumulates is a
collection. So the interface is built from card stock: a cut edge, a printed frame with
an inset keyline, a bevel where the light lands, and a shadow with a real offset because
the card is lying on a table.

Rarity is the one colour encoding this product can defend. It is never assigned by hand
for effect — it comes from mastery, and it means the same thing on every screen:

| Rarity | Hue | Means |
|---|---|---|
| common | slate | untouched; no claim made |
| uncommon | mint | started |
| rare | aqua | going well — and the interactive colour |
| epic | coral | due, urgent, needs you |
| legendary | amber | mastered — and the currency itself |

That makes the palette semantic rather than decorative, which is the difference between
a design system and a set of nice colours.

**One scale, one derivation.** `rarityFor(percent)` in `components/ui/panel.tsx` is the
only place the thresholds live (≥90 legendary, ≥65 epic, ≥40 rare, >0 uncommon, else
common). `setRarity(cardCount, dueCount)` in `components/flashcards/set-tile.tsx` is the
only proxy for flashcard sets, and it is deliberately conservative: a set with zero due
stays **common**, because a bare 0 cannot tell "mastered" from "never opened", and
calling the wrong one of those legendary is exactly the false claim rarity is not
allowed to make. Nine surfaces call these two functions. Do not write a tenth scale.

## Ground: two values, both warm

| Token | Light | Dark |
|---|---|---|
| table (the page) | `#f1ebe1` | `#16130f` |
| table-deep | `#e7dfd2` | `#100e0b` |
| card (stock) | `#fffdf9` | `#221d18` |
| card-2 / card-3 | `#f8f3ea` / `#f1eadd` | `#2a241e` / `#332c24` |
| ink / ink-2 / ink-3 | `#191512` / `#5c5148` / `#696057` | `#f4efe8` / `#c4b8aa` / `#a09487` |
| accent (= rare) | `#0b7d8a` | `#3ecfdd` |
| coin (= legendary) | `#e0a010`, ink `#845800` | `#f8c33c`, ink `#f5d68a` |

**Everything on screen is either table or stock.** There is no third ground. R>G>B holds
in both themes — a neutral grey here makes the whole product feel like a form — and the
dark theme is warm brown-black on purpose, not the blue-black slate every dark UI drifts
toward. Ink is never `#000`; printed ink never is.

Ground is light by default because of the use scene: a teenager at a kitchen table at
eight in the evening, or on a phone on a bus, in rooms with the lights on. A blocking
script in `<head>` sets the class before first paint, so there is no flash.

**All 136 colour × surface pairs clear WCAG AA in both themes**, verified by computing
the matrix rather than by eye. The `-ink` variants exist for exactly this: `epic` on the
table is 3.01:1, which scrapes large-text AA by a hundredth, so body and figures use
`epic-ink` at 5.06:1. Reach for `-ink` whenever a rarity colour carries text.

## Locks

**Stock means earned.** Card stock is what the product's *real* material sits on. An
unbuilt feature does not get a frame: the Arena strip is a `border-t` hairline with
chips directly on the table, never a `Panel`. Giving an unbuilt feature the same frame
as a set the student actually studied is the quiet door claiming to be furniture.

**Foil is earned-only.** `.foil` is the one blur-adjacent effect in the system and it
appears *only* on legendary. It is never decoration. If you find yourself adding foil to
make something look good, the answer is no.

**The frame carries the rarity, not a stripe.** A 3px coloured side rail was the first
draft; the craft floor refuses a coloured border above 1px, and it is one of the most
recognisable tells of a generated interface. The colour lives in the frame and its inset
keyline — which is also what a printed card actually does. The one exception is the
active-nav marker, where a short rail is a position indicator rather than a category
colour.

**Amber means money.** `coin` and `legendary` are the same hue for a reason, but amber
on a figure means that figure is literally Study Coins. A streak is coral, not amber: a
run of days is not a balance.

**Nothing is distinguished by hue alone.** Every place that could rely on colour carries
a second cue — Leader vs Mod is crown vs shield, the streak calendar is empty/dot/tick,
a correct option is a ticked control plus a filled row, a locked field carries a lock
glyph, a locked feature carries a hatch (`.locked`).

**Legacy token names are repointed, not renamed.** `violet`, `cyan`, `lime`, `rose`,
`amber` and `panel` still resolve — each is an alias onto the rarity scale, not a colour
of its own. That is deliberate: it let ~174 files re-theme from one file with no chance
of a screen being missed. Read them as a compatibility layer. Do not extend it, and do
not "clean it up" into a rename.

## Type

**Two faces, and each has a job.**

- **Archivo** — headings, card titles, and every number. A grotesque with real width in
  its stems: it looks *struck* rather than set, which is what a card's title block and
  its stat pips both want.
- **Schibsted Grotesk** — every word you actually read.

Space Grotesk and Geist were the previous pair. Both sit on the detector's overused
list, which is precisely why the old interface felt familiar before you had seen it.

**Figures are measurement.** `.num` puts Archivo with tabular lining figures on anything
that is a coin, a timer or a score, so a ticking value never nudges the layout. There is
no mono face in this system — monospace as a costume for "technical" is refused, and a
display face with `tabular-nums` is the honest version. Use `.num`, never bare
`tabular-nums`.

**Pips and totals.** `.pip` is the struck counter printed on a card's corner; it carries
small readings. Large numerals are reserved for the four totals in `StatStrip`. This
split is load-bearing: seven label-plus-big-number cells stacked back to back is the
hero-metric template, and it is refused. If you are adding a big number, check what is
directly above and below it first.

**No kickers.** A small-caps label above a heading is banned outright — no brief earns
it back. The heading carries its own weight. *(The previous version of this document
recommended exactly that device for demoting a section; it was wrong, and five of them
shipped before it was caught.)* To demote a group, use size, weight and space.

**Radius:** 10px chips, 14px controls, 20px containers, `rounded-full` for pills and
avatars only. **Density 4:** panels at `p-6`, controls at `h-9/11/13`.

## Layout language

- **`StatStrip`** is how any screen summarises a thing — one divided panel, not four
  cards. Four cards say "here are four unrelated numbers"; one divided frame says "here
  is the state of this thing".
- **`FilterChip`** is the toolbar filter control. It exists because these were being
  hand-styled inline, which is how a design system quietly stops being one.
- **Long repeating lists are one panel with hairline-divided rows**, never a card per
  row. Twenty bordered blocks read as twenty documents. This also applies to short
  lists of links: the dashboard's three onward routes are rows on one frame, because
  same-size cards of icon + heading + text is the first page scaffold on the refuse
  list.
- **Tiles carry no decorative icon.** Where every item in a list is the same kind of
  thing, an identical icon on every row is pure cost. What replaces it is the state that
  actually differs — cards due, best score, and the rarity the frame is already wearing.
- **Cap prose by measure, not by container.** Body text gets a `ch` cap
  (`max-w-[62ch]`); trailing chevrons stay at the row edge, where they are what makes a
  row read as tappable.
- **Sticky bars** clear the phone nav with `calc(env(safe-area-inset-bottom) + 4.25rem)`,
  `lg:bottom-4`, `z-30` (under header 40, under nav 50).
- **Touch targets are 36px minimum**, and no control is hover-gated.

## Density and tiering

Clutter here was never the number of features. It was that everything sat at the same
visual weight, and several facts were stated three times over.

- **State a fact once, in the place it belongs.** Duplicates within a single page are
  the first thing to cut, and the only kind of deletion a redesign here is allowed to
  make. The Arena was recently stated three times in one viewport — five locked sidebar
  rows, the sidebar's note, and a rail panel; the panel became a footer strip.
- **Tier the page so the bottom half can be ignored** — with hierarchy, never with a
  kicker, and never with a click that did not previously exist. Nothing goes behind an
  accordion, a tab or a modal.
- **Two halves of one idea become one hairline-divided surface**, not two panels side by
  side. "Today" is one instrument with three readings; the plan page merges Free and
  Premium; the streak page merges the calendar and the multiplier ladder.

The dashboard's reading order is the model: **the decision, then today, then the
figures, then where you were, then everything else.**

## Loading states

**Every route in `(app)` has a `loading.tsx`, and each one is shaped like the page it
stands in for.** A skeleton that does not occupy the same box as the real content is
decoration — the page still jumps when the data lands, and a spinner would have been
more honest. `src/components/ui/skeleton.tsx` is the kit; `SkeletonTile` is built from
`SetTile`'s measurements. **Change a component and change its skeleton with it.**

- **The fallback lives in `(app)/loading.tsx`, not at the root.** The root one sits above
  the signed-in layout, so it tore down the sidebar, header and coin timer on every
  navigation and rebuilt them a moment later.
- **The skeleton must appear on click, not on response.** `NavigationProvider` in
  `components/layout/route-transition.tsx` holds the pending destination; the sidebar
  highlight and the skeleton both read it, so both move immediately. Two traps are baked
  into that file and must not be undone: the click listener is in the **capture** phase
  (in the bubble phase Next's `<Link>` has already called `preventDefault()`, so the
  handler sees a defaultPrevented event and bails), and the skeleton is a **sibling** of
  the page hidden by CSS, never a React swap (a component cannot commit a state change
  while the subtree it renders is suspended, which is the exact pause this removes).
- **One shimmer, defined once**, and it goes flat rather than freezing mid-gradient
  under `prefers-reduced-motion`.
- **Skeleton the destination, not the button.** Where a button navigates on success the
  button keeps its spinner and the destination route's `loading.tsx` does the rest.

## Material and motion

- **Shadows carry a real offset and a soft blur**, warm, because the card is lying on a
  table. A zero-offset coloured halo is decoration, not depth.
- **A lit top edge** (`--sq-inner-lit`) on raised surfaces, and an inset keyline
  (`.card::after`) 3px in from the cut edge — that keyline is what makes a card read as
  a frame rather than a div with a border.
- **Buttons are struck tokens**: solid face, lit bevel along the top edge, warm offset
  shadow, one pixel of travel on press. Only the primary carries the signature sheen,
  and there is only ever one primary in view.
- **Gradients are rationed to four roles** — the primary button, the wordmark tile, the
  active tab, and the active-nav rail. A gradient everywhere is wallpaper; a gradient in
  four places is a signature. `grep '"brand '` to check.
- **Blur belongs to chrome, not content** — the sticky header, the phone bar, and modal
  scrims. Never a content surface.
- **Motion is motivated.** Exponential ease-out, never bounce. Nothing loops for
  decoration except foil, which is material. Everything collapses under
  `prefers-reduced-motion`.
- **Animate transforms, not layout.** The meter fills with `scaleX()` on a
  `transform-origin: left`, not by animating `width`.

## Browser surfaces

The parts you did not draw still carry the design: `::selection`, the caret, custom
scrollbars, focus rings, underline offset. All themed from the palette in `@layer base`.
This is the cheapest signal that a page was built rather than assembled, and the one
most reliably skipped.

## Icons

Phosphor via `@phosphor-icons/react/dist/ssr`. `src/components/icons.tsx` re-exports
every name with the same API. **Bold** for anything you navigate with or act on,
**fill** for anything you have or have earned. No Unicode glyphs, no emoji, no
hand-rolled SVG paths.

## The wordmark is provisional

The product name is not settled. `src/lib/brand.ts` exports `PRODUCT_NAME` and
`MAIL_FROM_NAME`, and **every** user-facing occurrence reads from it — wordmark, auth
screen, timer labels, page metadata, transactional mail, the `MAIL_FROM` default.
Renaming should be one line plus a new glyph. `grep -r StudyQuest src/` should return
only `brand.ts` and the direction-contract comment in `app/layout.tsx`.

## Banned outright

Gradients outside the four signature roles; glows; decorative `blur-[…]` divs;
`border-white/*` and `bg-white/*` (they break in light mode); off-scale radii;
hand-rolled SVG icon paths; bare `tabular-nums`; kickers and eyebrows; coloured side
stripes above 1px; hard offset shadows (`4px 4px 0`); gradient text; monospace as a
costume; a hash-a-string-to-a-hue helper for per-item colour — `accentFor()` in
`lib/utils.ts` survives from the old system, is reached only by the uncalled
`subjectAccent()`, and contradicts the rarity rule. Do not wire it to anything.

## Gotchas

- **`@theme inline` does not emit its keys as custom properties.** Anything referenced
  from a plain CSS rule must be a real `:root` variable.
- **Tailwind scans source text.** A class built by template interpolation
  (`` `shadow-[${x}]` ``) is never generated. Button shadows are written out in full. A
  ternary picking between two *complete* literal strings is fine.
- **`Badge`/`Meter` still take `tone="violet"`.** That is the primitive's own name for
  the accent; the rarity names are also accepted. It is not a legacy colour.
- **`next dev` disables prefetch**, so `loading.tsx` boundaries the client has not
  learned about will not show. Judge navigation feel against a production build.
- **Do not put `pathname` in the heartbeat effect's deps.** It tears the effect down and
  rebuilds it on every navigation, which produced a wave of `429`s. Use a ref.

## Deliberately left alone

Product copy still uses em-dashes throughout. Rewriting dozens of user-facing strings is
a change to voice, not design. Worth a separate decision.
