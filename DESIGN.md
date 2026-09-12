---
name: StudyQuest
description: A collection, not a dashboard — warm card stock on a warm table, where colour is the rarity a student earned.
colors:
  # Ground — two values, and only two. Everything is table or stock.
  table: "#f1ebe1"
  table-deep: "#e7dfd2"
  card: "#fffdf9"
  card-2: "#f8f3ea"
  card-3: "#f1eadd"
  # Ink
  ink: "#191512"
  ink-2: "#5c5148"
  ink-3: "#696057"
  # Frame lines and bevel
  line: "rgb(25 21 18 / 0.14)"
  line-strong: "rgb(25 21 18 / 0.28)"
  bevel: "rgb(255 253 249 / 0.9)"
  raise: "rgb(25 21 18 / 0.04)"
  raise-2: "rgb(25 21 18 / 0.075)"
  raise-3: "rgb(25 21 18 / 0.13)"
  # Rarity — the semantic palette. Five steps, one meaning each.
  common: "#6f7f8d"
  common-ink: "#4c5966"
  uncommon: "#12a06f"
  uncommon-ink: "#0a6e4c"
  rare: "#0d93a3"
  rare-ink: "#066b78"
  rare-fill: "#0b7d8a"
  epic: "#ef4d5a"
  epic-ink: "#c11f2e"
  legendary: "#e0a010"
  legendary-ink: "#845800"
  # Interactive — an alias layer over rare, so the accent moves in one line.
  accent: "#0b7d8a"
  accent-ink: "#ffffff"
  accent-soft: "#0d93a3"
  accent-deep: "#065f6b"
  accent-wash: "rgb(13 147 163 / 0.14)"
  # Currency — an alias layer over legendary.
  coin: "#e0a010"
  coin-ink: "#845800"
  coin-light: "#f6cf6a"
  coin-deep: "#b47c05"
  coin-on: "#2c1c00"
  # Marking
  good: "#12a06f"
  bad: "#dc2f3d"
  bad-ink: "#b01522"
  warn: "#8e5507"
  # The one gradient, and it is a printing effect.
  brand-from: "#0d93a3"
  brand-to: "#076874"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: "-0.032em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
    fontFeature: "cv01, ss01"
  label:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.005em"
  numeral:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum 1, lnum 1"
rounded:
  sq-sm: "0.5rem"
  sq: "0.75rem"
  sq-card: "1rem"
  sq-lg: "1.125rem"
  full: "999px"
spacing:
  base: "4px"
  tight: "10px"
  gutter: "16px"
  tile: "20px"
  card: "24px"
  section: "32px"
components:
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sq-card}"
    padding: "24px"
  card-tile:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sq-card}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.brand-from}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.sq}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.brand-from}"
    textColor: "{colors.accent-ink}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sq}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.card-2}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sq}"
    padding: "0 20px"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sq}"
    padding: "0 20px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.bad}"
    textColor: "#ffffff"
    rounded: "{rounded.sq}"
    padding: "0 20px"
    height: "44px"
  button-coin:
    backgroundColor: "{colors.coin}"
    textColor: "{colors.coin-on}"
    rounded: "{rounded.sq}"
    padding: "0 20px"
    height: "44px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sq}"
    padding: "0 14px"
    height: "44px"
  badge-neutral:
    backgroundColor: "{colors.raise-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-legendary:
    textColor: "{colors.legendary-ink}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  chip-filter:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sq}"
    padding: "0 16px"
    height: "44px"
  chip-filter-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sq}"
    padding: "0 16px"
    height: "44px"
  pip:
    backgroundColor: "{colors.raise-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 6px"
    height: "24px"
---

# Design System: StudyQuest

## Overview

**Creative North Star: "The Collector's Table"**

StudyQuest is a collection, not a dashboard. A flashcard set *is* a card, a quiz *is* a card, and what a student accumulates over a term is a collection they can see. So the interface is not a grid of widgets reporting on study — it is warm stock dealt onto a warm table, printed with a frame, an inset keyline, a lit bevel where the light lands on the top edge, and a shadow with a real offset because the card is lying on something. Nothing here is glass and nothing here glows.

The world exists to refuse two specific things. The first is the gamified card-grid every study app ships: confetti, mascots, badge walls, colour applied for excitement. The second is the monochrome product-tool clone this interface used to be: a grey sidebar, hero-metric tiles, colour as decoration. The escape from both is the same single idea — **colour is rarity, and rarity is mastery**. Slate for untouched, mint for started, aqua for going well, coral for due, amber for mastered. A hue on this surface is always a claim about what a student has earned, which makes the palette semantic rather than pretty, and that is the difference between a design system and a set of nice colours.

Density is generous but not airy: this is used by a fifteen-year-old at a kitchen table at eight in the evening and on a phone between classes, so ground is warm and light by default, text is real-world sized, and the one thing a screen wants you to do is set large and left before anything reports on how you are doing. Dark mode is the same table late at night — warm dark stock, never blue-black slate, with the printed frame doing the work that white stock does in daylight.

**Key Characteristics:**
- Two-value ground: a warm table, and warm stock lying on it. Never pure white, never neutral grey, R > G > B all the way down in both themes.
- Rarity is the palette. Five hues, one meaning each, derived from mastery by one function.
- Printed depth, not glass: cut edge, inset keyline, lit bevel, offset warm shadow.
- Foil is the only material effect, and it appears only where a student earned it.
- Archivo struck (headings, buttons, every number); Schibsted Grotesk read (everything else).
- Figures are measurement: tabular lining numerals, so a ticking value never nudges the layout.

## Colors

A warm, printed palette on two grounds, in which every hue is a rank rather than a decoration.

### Primary

- **Rarity Aqua** (`rare`): The interactive colour and the third rarity step at once. Every control reads it through the `accent` alias, so the product's whole interactive hue can move in one line without touching a component. Vivid and unmistakably not blue. `rare-fill` is the darkened variant that carries white label text at AA on buttons, chips and the due-count badge; `rare-ink` is the variant for aqua *text* on stock.
- **Struck Amber** (`legendary`): Top rarity and the currency, deliberately the same colour — a mastered set and a Study Coin are the same claim about earned work. Appears as the coin balance, the coin button, the coin meter fill, and the legendary frame. Nothing else may take it.

### Secondary

- **Rarity Mint** (`uncommon`): Started, and correct. Second rarity step, and the marking colour for a right answer (`good` is an alias onto it).
- **Rarity Coral** (`epic`): Fourth rarity step — strong mastery — and, separately, the tone for *due* and *urgent*: the streak flame, the due-card headline, the "needs you" alert. Coral rather than amber on a streak is a deliberate distinction: amber means Study Coins, and a streak is a run of days rather than a balance.
- **Rarity Slate** (`common`): Untouched. The absence of a claim. A common card takes no frame colour at all — the component passes `undefined` rather than a slate frame, so "no colour" is itself the first rank.

### Tertiary

- **Marking Red** (`bad`): Wrong answers, destructive actions, field errors. Distinct from coral: coral means *attend to this*, red means *this is incorrect or irreversible*. Use `bad-ink` for red text on stock.
- **Warning Ochre** (`warn`): The rare caution note that is neither wrong nor urgent.

### Neutral

- **Warm Table** (`table`, `table-deep`): The ground everything is dealt on. The page background, the sticky header's translucent base, and the ground the phone tab bar sits over.
- **Warm Stock** (`card`, `card-2`, `card-3`): The material a card is printed on. `card` is the frame's face; `card-2` and `card-3` are the hover and nested steps.
- **Printed Ink** (`ink`, `ink-2`, `ink-3`): Warm near-black for headings and figures, then two muted steps for body copy and meta text. Never `#000` — printed ink never is. `ink-3` is pinned in the dark theme specifically because it clears AA on `card-2`, the busiest ground meta text ever sits on.
- **Frame Line and Bevel** (`line`, `line-strong`, `bevel`, `raise` 1–3): The cut edge, the inset keyline, the lit top edge, and the three tint steps used for pip grounds, hover washes and hairline dividers.

### Named Rules

**The Rarity Rule.** Colour means mastery and nothing else. Rarity is never assigned by hand for effect — it is derived by `rarityFor(percent)` (≥90 legendary, ≥65 epic, ≥40 rare, >0 uncommon, else common), and flashcard sets derive it through `setRarity(cardCount, dueCount)`, which is deliberately conservative: a set with no due cards stays common, because a bare zero cannot tell "mastered" from "never opened" and rarity is not allowed to make a claim the data does not support. Ten surfaces already call these two functions. A new screen that needs a rank calls them too; it does not invent a scale.

**The Amber Rule.** Amber is Study Coins and legendary mastery. A figure gets gold only when it is literally coins. A streak, a score, a card count and a timer do not.

**The Ink Variant Rule.** When a rarity hue becomes *text*, use its `-ink` variant, never the plain hue. Plain coral measures 3.01:1 on the table — it clears large-text AA by a hundredth and fails everywhere else. The `-ink` variants exist for exactly this and there is one for every step.

**The Two-Value Ground Rule.** There are two grounds: the table and the stock on it. Both are warm in both themes (R > G > B), the light theme never reaches white, and the dark theme is warm dark brown-black, never blue-black slate. A neutral grey anywhere in the ground turns the whole product back into a form.

**The Hue-Is-Never-The-Only-Signal Rule.** No state is announced by colour alone. Inline links carry a permanent underline (`.link`), rarity is always accompanied by the count or label that produced it, locked features carry a hatch texture as well as reduced saturation, and marking states carry words. The audience includes younger teenagers and phone-first readers; every text and control combination clears WCAG AA in both themes.

## Typography

**Display Font:** Archivo (variable width axis, with `ui-sans-serif`, `system-ui` fallback)
**Body Font:** Schibsted Grotesk (with `ui-sans-serif`, `system-ui` fallback)

**Character:** Archivo is *struck* — a grotesque with real width in its stems, so a card's title block and its stat pips read as printed rather than set, and its width axis lets a long title tighten without a second family. Schibsted Grotesk is *read* — warm, current, and not one of the faces every generated interface arrives wearing. The pairing is deliberately not Inter, Geist, or Space Grotesk.

### Hierarchy

- **Display** (Archivo 700, 30→38px page titles, 34→44px on the dashboard's decision line, line-height 1.03–1.05, tracking −0.028 to −0.032em): One per screen. The page's own name, or the single decision the student is here to make.
- **Headline** (Archivo 700, 19px, tracking −0.02em): Section openers within a page — "Today", "Pick up where you left off", "More to explore".
- **Title** (Archivo 600–700, 15–17px, tracking −0.015em): Card titles, panel headers, list-row titles.
- **Body** (Schibsted Grotesk 400, 13.5–15.5px, line-height 1.625): Everything a student actually reads. Prose is capped by measure rather than by container — around 62ch in list rows, `max-w-xl`/`max-w-2xl` under a heading.
- **Label** (Schibsted Grotesk 600, 12–13px, tracking −0.005em): Stat labels, badge text, meta rows. One uppercase variant exists and only one: navigation group headers at 12px / 0.1em tracking in `ink-3`.
- **Numeral** (`.num` — Archivo 650–700, tabular lining figures, tracking −0.01 to −0.03em): Anything that is a coin, a timer, a score, a count or a date-adjacent measure.

### Named Rules

**The Struck-and-Read Rule.** Archivo carries anything struck — headings, card titles, button labels, and every number. Schibsted Grotesk carries anything read. A body paragraph never takes the display face and a figure never takes the body face.

**The Measurement Rule.** Figures are measurement. Any coin, timer, score or count takes `.num`, which sets the display face with tabular lining figures so a value that ticks never nudges the layout around it. This applies inside meta rows and badges too, not only to large totals.

**The Pip-and-Total Rule.** Small readings are struck pips — the counter printed on a card's corner (24px tall, pill, `raise-2` ground, 1px inset keyline, 12px Archivo at 650). Large numerals are reserved for the four totals in `StatStrip`. This split is load-bearing: seven label-plus-big-number cells stacked back to back is the hero-metric page scaffold this product refuses, and the pip is what lets a section report three readings without becoming a second metrics grid.

**The No-Kicker Rule.** A heading carries its own weight. No small-caps or uppercase label sits above a page or section heading as a kicker, and no heading is introduced by a rule-plus-label device. (The uppercase navigation group headers in the sidebar are not kickers — they name a group of links, not the heading below them.)

## Layout

The shell is a fixed 16rem (256px) sticky rail on `card` stock with a `line` right border at `lg` and above, a 4rem sticky header on translucent table ground, and a content column centred at `max-w-6xl` (72rem). Page padding ramps 16px → 24px → 36px across `sm` and `lg`, with 28 units (112px) of bottom padding below `lg` to clear the phone navigation bar.

Below `lg` the rail is replaced, not merely hidden: a fixed bottom bar of five cells — the four most-opened routes plus a "More" trigger — over a right-hand drawer carrying the complete navigation, so no route is ever a dead end on a phone. The bar reserves `env(safe-area-inset-bottom)`.

Spacing is a 4px rhythm. The recurring steps are 16px between grid items, 20px inside tiles, 24px inside full panels, and 24/32/36px between sections of a page. Content grids are `sm:grid-cols-2` for the hand of cards and `lg:grid-cols-4` for the stat strip; the dashboard's collection-plus-rail split is `xl:grid-cols-[minmax(0,1fr)_19rem]`. Breakpoints are Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).

**The Next-Action-First Rule.** The first viewport puts the decision — what to study now — set large on stock at the left, with its action button beside it. Summaries, totals and history come after it, never above it.

## Elevation & Depth

Depth here is **printing, not glass**. A card is a physical object lying on a table, so its depth is built from four things at once: a 1px cut edge in `line`, an inset keyline 3px in from that edge, a lit bevel along the top (`inset 0 1px 0 0` in `bevel`), and a shadow with a real vertical offset and a warm tint (`rgb(72 52 30)`) because the ground is warm. There is no zero-offset halo anywhere in the system, and no coloured glow on a resting surface.

Blur appears in exactly two roles. The first is **foil**, the system's only material effect. The second is backdrop blur on sticky chrome only — the header, the phone tab bar and the drawer scrim, each over a translucent table ground so content stays legible while it passes underneath. Content surfaces are never blurred.

### Shadow Vocabulary

- **Stock** (`box-shadow: 0 1px 1px rgb(72 52 30 / 0.05), 0 3px 8px -2px rgb(72 52 30 / 0.10)` plus the bevel inset): Every card at rest.
- **Lift** (`0 2px 3px rgb(72 52 30 / 0.07), 0 10px 22px -6px rgb(72 52 30 / 0.16), 0 26px 48px -22px rgb(72 52 30 / 0.18)`): A card picked up — the hover state of any linked card, paired with `translateY(-3px)` and a strengthened cut edge.
- **Struck token** (`inset 0 1px 0 0 rgb(255 255 255 / 0.28)` over a short coloured drop): Buttons. The inset highlight is the lit top edge of a pressed token; the coloured drop is tinted to the button's own fill.
- **Pressed inset** (`inset 0 1px 2px rgb(23 23 26 / 0.05)`): Form fields and checkboxes, which are recessed into the stock rather than raised off it.

In the dark theme the shadow stack inverts its logic: the lit bevel becomes a faint warm-white inset and the drop becomes a deep black, because on dark stock the frame does the separating that white stock does in daylight.

### Named Rules

**The Earned-Stock Rule.** Card stock is what the product's *real* material sits on. A feature that is not built yet does not get a frame: the Arena sits on a hairline directly on the table as a row of hatched chips, because giving an unbuilt feature the same printed card as a set the student has actually studied is a quiet door claiming to be furniture.

**The Earned-Foil Rule.** `.foil` — a slow holographic sweep masked to the frame — is the system's one material effect, and it is never decoration. It appears only at `legendary`: a mastered set, a mastered quiz, a maxed multiplier, a coin toast. Adding foil to a surface that was not earned spends the only currency the visual system has.

**The Real-Offset Rule.** Every shadow has a vertical offset and a soft blur. No zero-offset halos, no hard offset shadows, no coloured glows at rest. Warm shadow on warm ground; a neutral or blue-grey shadow reads as a screenshot pasted onto the table.

## Shapes

One corner family, inherited from card stock. Card frames are 16px (`sq-card`), controls and inputs 12px (`sq`), small controls and nested tiles 8px (`sq-sm`), and large feature surfaces 18px (`sq-lg`). Badges, pips, meters and coin counters are full pills (999px). The empty state is the only dashed edge in the system: a 2px dashed `line` at card radius, saying "a card belongs here and has not been dealt", which is a different message from a card that failed to load.

The frame is the signature geometry. Every `.card`/`.panel` carries an `::after` keyline inset 3px from the cut edge at `calc(radius - 3px)`, at half opacity — that inset line is what makes the surface read as a printed frame rather than a div with a border. `.card-plain` opts the keyline out where a card holds a full-bleed divided strip or list.

**The Frame-Carries-Rarity Rule.** Rarity is printed into the frame itself: the cut edge takes a 50% mix of the rarity hue into `line`, and the inset keyline takes a 32% mix at full opacity. It is never a coloured stripe, rail or bar on any edge of a card. A coloured side stripe above 1px is the single most recognisable tell of a generated interface, and it is not how a real card works either — on a trading card the frame *is* the rarity. (The one legitimate coloured rail in the product is the 3px brand rail beside the active navigation row. That is a position marker telling you where you are, not a status encoding on a card, and it is the only exception.)

## Components

### Buttons

- **Shape:** Softly squared (12px, `rounded-sq`). Three heights: 36px `sm`, 44px `md`, 52px `lg`, at 13 / 14.5 / 15.5px Archivo semibold with −0.008em tracking.
- **Primary:** The signature brushed sheen (`.brand`, a 178° gradient from `brand-from` to `brand-to`) with white label, a lit inset top edge and an aqua-tinted drop. It is the only clickable thing carrying the sheen — that is what makes the main action unmistakable without being the loudest object in view.
- **Hover / Focus / Press:** Hover brightens 7% and deepens the drop; press translates down 1px; focus takes the global 2px accent outline at 2px offset. All transitions run 200ms on `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Secondary:** Stock face, `line` border, bevel inset — a card-stock button. The default partner to a primary.
- **Outline / Ghost:** Transparent with a strong cut edge, and text-only with a `raise-2` hover wash. For toolbars and tertiary actions.
- **Danger:** Solid marking red with white label and a red-tinted drop.
- **Coin:** Struck amber (`.coin-gradient`, light → amber → deep) with near-black label. Reserved for actions that are literally about coins.
- **Icon button:** 36px square, 8px radius, ghost treatment, and a required `label` prop that becomes both the accessible name and the tooltip.

**The One Primary Rule.** One primary button in view at a time. Anything competing for the same attention is secondary or ghost.

### Chips

- **Filter chip:** 44px tall, 12px radius, stock face with a `line` border and muted label; the active state lifts onto solid accent with `accent-ink` text and a short aqua drop shadow — shaped like the selected divider tab in a binder rather than a pill. Carries `aria-pressed`.
- **Tag:** Deliberately neutral (`raise-2` ground, muted 12px text, 6px radius) so a subject label never competes with a badge that means something.

### Cards / Containers

- **Corner Style:** 16px (`sq-card`), with the inset keyline at 13px.
- **Background:** Warm stock (`card`); `raise` for the recessed variants (empty states, note boxes).
- **Shadow Strategy:** Stock at rest, Lift on hover for linked cards — see Elevation & Depth.
- **Border:** 1px cut edge in `line`, strengthening to `line-strong` on hover; tinted by rarity when the card carries a rank.
- **Internal Padding:** 24px for a full panel, 20px for a tile in a grid, 0 with `card-plain` when the card hosts a divided strip.
- **Rarity:** Passed as a `rarity` prop that sets a `--rarity` custom property; `common` is passed as `undefined` so an untouched card takes no colour at all.

### Inputs / Fields

- **Style:** 44px tall, 12px radius, stock face with a `line` border and a pressed inset shadow, 15px body text.
- **Focus:** A 3px filled ring in `accent-wash` plus an accent border — a filled ring rather than a border swap, so it stays visible against a busy panel.
- **Labels:** Always above the field, 13.5px semibold in `ink`. There are no placeholder-as-label controls: a placeholder disappears exactly when the reader most needs to know what the field was for.
- **Error / Hint:** Error replaces hint below the field, 13px medium in `bad`; hint is 12px in `ink-3`.
- **Checkbox / Radio:** 20px struck tokens with a 1.5px strong cut edge and a pressed inset; the mark is a `::before` grown from `scale(0)` on `:checked` with a slight overshoot easing, painted in `accent-ink` so it takes the theme.

### Navigation

- **Rail:** 16rem, stock ground, rows at 12px radius with 18px Phosphor icons and 14px medium labels. The active row takes a 12% accent wash, `ink` text, an accent icon, and a 3px brushed rail on its left edge — the rail is what tells you where you are before you have read a label. Locked rows are `ink-3` with a padlock.
- **Header:** 4rem, sticky, translucent table ground with backdrop blur. Coins and the coin timer sit together in one bordered instrument because they are one idea — what you have and when the next one lands. The streak sits apart in coral, because it is a different kind of thing and one you can lose.
- **Tabs:** Segmented, link-driven so the selection lives in the URL. Active takes the brushed sheen rather than a tint, because a tint at that size is ambiguous next to a hover state.
- **Mobile:** Bottom bar of five 56px cells with 20px icons and 11px labels, plus a full-height right drawer at 19rem.

**The Icon Weight Rule.** Every glyph is Phosphor at one of two weights, and the split is a rule rather than a preference: **bold** for anything you navigate with or act on, **fill** for anything you *have* or have earned — coins, streak, crown, trophy, the Arena padlock. Solid glyphs read as objects; outlined glyphs read as actions, which is the distinction that matters in a product where you collect things.

### Feedback

- **Badge:** Pill, 1px border, 12% tinted ground and an `-ink` label at the matching rarity step. Neutral badges use `raise-2` and muted text.
- **Meter:** 7px pill track on `raise-2` with a pressed inset; the fill is a `scaleX` transform rather than an animated width, so a moving bar composites instead of relaying out. Accent by default, struck-amber gradient for coins, mint for study time.
- **Alert:** 8% tinted ground, 25% border, and the tone carried in the heading colour. Never a thick coloured bar down one edge — at any real weight that device is the loudest thing on the page for the least information.
- **Empty state:** Dashed card-radius edge on `raise`, a stock-framed icon tile, a title, one sentence, and one way to start.
- **Skeleton:** Shaped like the thing it stands in for, never a lone circle, with a `raise → raise-3 → raise` shimmer that collapses to a flat tint under reduced motion.
- **Locked:** Desaturated to 25% at 60% opacity *plus* a −45° hatch over the frame, so "not built yet" is a texture and not only a dimming.

### The Rarity Frame (signature)

The product's one irreducible component: a card whose cut edge and inset keyline carry the rarity its content earned, with foil at the top step. It is what makes a library of sets read as a collection at a glance, and it is the reason a student can see progress across a whole page without reading a single number. Any new surface that displays a set, a quiz, a result or a streak uses it and derives its rank from `rarityFor` / `setRarity`.

### Motion

Five authored animations and one easing curve. `deal` (0.5s) is the entrance — a card arriving from slightly away and slightly turned before it settles; `rise` (0.42s) is the quieter fade-and-lift for panels and drawers; `coin-pop` (0.45s) marks a coin actually landing; `shimmer` (1.5s, linear, infinite) is skeleton only; `foil-sweep` (4.5s) is slow enough to read as material rather than animation. State transitions are 200–240ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Under `prefers-reduced-motion` everything collapses to 0.01ms, shimmer becomes a flat tint, foil is removed entirely, and card hover lift is cancelled.

## Do's and Don'ts

### Do:

- **Do** derive rarity from `rarityFor(percent)` or `setRarity(cardCount, dueCount)` and pass it to `Panel`/`PanelLink`. Ten surfaces already do; a new screen that needs a rank calls the same function rather than inventing a scale.
- **Do** pass `undefined` rather than `"common"` when a card has earned no rank. An untouched card takes no frame colour, and that absence is the first rank.
- **Do** use the `-ink` variant whenever a rarity hue becomes text (`epic-ink`, `coin-ink`, `rare-ink`). The plain hues are frame and fill colours.
- **Do** put `.num` on every coin, timer, score and count, including inside badges and meta rows.
- **Do** open a section with a real heading in Archivo. If a section needs a label to explain its heading, the heading is wrong.
- **Do** keep large numerals to the four totals in `StatStrip`; give any other reading a struck pip with a meter under it.
- **Do** give unbuilt features a hairline on the table, not card stock.
- **Do** read the interactive colour through `accent` (or the legacy `violet`/`cyan` aliases) rather than naming `rare` directly in a control, so the accent stays movable in one line.
- **Do** write button shadow utilities out in full. Tailwind scans source text, so a class name assembled by template interpolation is a class name it never generates.

### Don't:

- **Don't** put a coloured stripe, rail or bar on a card edge to signal status. Rarity goes into the cut edge and the inset keyline. The only coloured rail in the product is the active-navigation position marker.
- **Don't** use amber for anything that is not Study Coins or legendary mastery. A streak is coral; a score is ink.
- **Don't** apply foil to anything the student has not earned. It is the system's one material effect and it means "legendary".
- **Don't** introduce a neutral grey or a blue-black into either ground. Both themes are warm (R > G > B), light never reaches white, dark never reaches slate.
- **Don't** stack label-plus-large-number cells into a second metrics grid on a page that already has `StatStrip`.
- **Don't** put a kicker, eyebrow, or small-caps label above a page or section heading.
- **Don't** use a zero-offset halo, a hard offset shadow, or a coloured glow on a resting surface. Every shadow has a real offset and a warm tint.
- **Don't** blur a content surface. Backdrop blur belongs to sticky chrome — header, phone tab bar, drawer scrim — and nowhere else.
- **Don't** signal a state with hue alone: links keep their underline, locked items keep their hatch, rarity keeps the count that produced it.
- **Don't** assign colour by hashing a string (subject, title, id) to a hue. Decorative per-item colour directly contradicts the Rarity Rule; `accentFor` in `lib/utils.ts` is a vestige of the previous system and is not part of this one.
- **Don't** add new tokens under the legacy alias names (`violet`, `cyan`, `lime`, `rose`, `amber`, `panel`). They exist so ~174 files re-theme from one file; read them, don't extend them.
- **Don't** use a placeholder as a label, or ship an icon button without a `label`.
