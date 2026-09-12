/**
 * Navigation model.
 *
 * `locked: true` marks the future game features. They appear in the UI so the
 * shape of the product is visible, but they have no functionality behind them
 * and every route renders the same "coming soon" screen. Nothing in the app
 * reads a locked entry for anything except rendering it.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "cards" | "quiz" | "feedback" | "community" | "calendar" | "flame" | "sword" | "shield" | "character" | "trophy" | "rank";
  locked?: boolean;
  badge?: string;
}

export interface NavSection {
  title: string | null;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    title: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/flashcards", label: "Flashcards", icon: "cards" },
      { href: "/quizzes", label: "Quizzes", icon: "quiz" },
      { href: "/test-feedback", label: "Test feedback", icon: "feedback" },
      { href: "/communities", label: "Communities", icon: "community" },
    ],
  },
  {
    title: "Daily",
    items: [
      { href: "/daily", label: "Daily quiz", icon: "calendar" },
      { href: "/streak", label: "Streak", icon: "flame" },
    ],
  },
  {
    title: "Arena",
    items: [
      { href: "/arena", label: "Study 1v1", icon: "sword" },
      { href: "/character", label: "Your Character", icon: "character" },
      { href: "/leaderboard", label: "Leaderboard", icon: "trophy" },
      { href: "/rank", label: "Rank", icon: "rank" },
      /* Not in scope. The rules for a team-vs-team community battle were never
         specified, and inventing them would be worse than the honest hatch. */
      { href: "/arena/wars", label: "Community Wars", icon: "shield", locked: true },
    ],
  },
];

/** Every locked route, for the shared "coming soon" screen. */
export const LOCKED_ROUTES = NAV.flatMap((s) => s.items)
  .filter((i) => i.locked)
  .map((i) => i.href);
