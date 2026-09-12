import type { Metadata, Viewport } from "next";
import { Archivo, Schibsted_Grotesk } from "next/font/google";

import { PRODUCT_NAME } from "@/lib/brand";
import { ThemeProvider, themeScript } from "@/components/theme";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

/**
 * Two faces.
 *
 *   Archivo — headings, card titles, and every number. A grotesque with real
 *             width in its stems: it looks struck rather than set, which is
 *             what a card's title block and its stat pips both want. Its
 *             variable width axis lets a card title tighten without a second
 *             family. Numbers use it too, with tabular figures, because coins
 *             and timers are measurement and a ticking clock must not nudge
 *             the layout.
 *   Schibsted Grotesk — every word you actually read. Warm, current, and not
 *             one of the faces every generated interface arrives wearing.
 *
 * Space Grotesk and Geist were the previous pair. Both sit on the detector's
 * overused list, which is the whole reason a student would find this
 * interface familiar before they had ever seen it.
 */

const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display-face",
  axes: ["wdth"],
  display: "swap",
});

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME} — study like it's a game`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description:
    "Smart flashcards, AI-marked quizzes and test feedback for GCSE through university. Earn Study Coins for the work you actually do.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ebe1" },
    { media: "(prefers-color-scheme: dark)", color: "#16130f" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the theme class before first paint so the page never flashes
            the wrong one. Has to be inline and blocking to do that. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        {/* The direction contract. An HTML comment rather than a JSX one so it
            survives into the built markup and can be audited there. */}
        <div
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: StudyQuest is a collection, not a dashboard. Refuses both the gamified
  card-grid every study app ships and the monochrome Linear clone this was.
OWN-WORLD: Warm stock on a warm table. Printed frames with an inset keyline and
  a lit bevel; rarity IS the palette (slate, mint, aqua, coral, amber) and
  colour means mastery, never decoration. Foil only where a student earned it.
  Archivo struck; Schibsted Grotesk read.
STORY: A student sees what to study now, what it pays, and what they have built.
FIRST VIEWPORT: Next action set large on stock, left. The day's readings as
  struck pips. The due queue as a hand of cards whose frames carry the rarity
  their mastery earned — a coloured rail was the first draft, the craft floor
  refuses a coloured side stripe above 1px, and the detector named that stripe
  the most recognisable tell of a generated interface; the colour therefore
  moved into the frame and its inset keyline, which is also what a printed
  card actually does. Coin balance in amber, top right.
FORM: Card frames — candidate 1 of 7, top-ranked, locked by the user over the
  roll's assignment; seed f2d16265.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying
  its provenance.
-->`,
          }}
        />
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
