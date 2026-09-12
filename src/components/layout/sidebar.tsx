"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useActivePath } from "@/components/layout/route-transition";
import { useEffect, useState, type ReactNode } from "react";

import { NAV, type NavItem, type NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { PRODUCT_NAME } from "@/lib/brand";
import {
  CalendarIcon,
  CardsIcon,
  ChevronRightIcon,
  CharacterIcon,
  CommunityIcon,
  FeedbackIcon,
  FlameIcon,
  HomeIcon,
  LockIcon,
  MenuIcon,
  QuizIcon,
  RankIcon,
  SettingsIcon,
  ShieldIcon,
  SparkIcon,
  SwordIcon,
  TrophyIcon,
  XIcon,
} from "@/components/icons";

const ICONS: Record<NavItem["icon"], (p: { size?: number; className?: string }) => ReactNode> = {
  home: HomeIcon,
  cards: CardsIcon,
  quiz: QuizIcon,
  feedback: FeedbackIcon,
  community: CommunityIcon,
  calendar: CalendarIcon,
  flame: FlameIcon,
  sword: SwordIcon,
  shield: ShieldIcon,
  character: CharacterIcon,
  trophy: TrophyIcon,
  rank: RankIcon,
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/* ==========================================================================
   Wordmark
   ========================================================================== */

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2.5", className)}>
      <span className="brand flex h-9 w-9 items-center justify-center rounded-sq text-accent-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.25),0_4px_12px_-4px_rgb(23_23_26/0.45)]">
        <SparkIcon size={18} />
      </span>
      <span className="font-display text-[17px] font-bold tracking-[-0.03em] text-bright">
        {PRODUCT_NAME}
      </span>
    </Link>
  );
}

/* ==========================================================================
   A single nav row, shared by the rail and the drawer
   ========================================================================== */

function NavRow({
  item,
  active,
  streak,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  streak: number;
  onNavigate?: () => void;
}) {
  const Icon = ICONS[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-disabled={item.locked}
      className={cn(
        "group relative flex items-center gap-3 rounded-sq px-3 py-2.5 text-sm font-medium",
        "transition-colors duration-200",
        active ? "bg-accent/12 text-bright" : "text-muted hover:bg-raise-2 hover:text-bright",
        /* Inactive before you hover it, not only once you do. */
        item.locked && "text-faint opacity-70 hover:opacity-100 hover:text-muted",
      )}
    >
      {/* The rail is what tells you where you are at a glance, before you have
          read a single label. */}
      {active ? (
        <span
          aria-hidden
          className="brand absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
        />
      ) : null}

      <span className={cn(active && "text-accent", item.locked && "opacity-50")}>
        <Icon size={18} />
      </span>

      <span className="flex-1 truncate">{item.label}</span>

      {item.locked ? (
        <LockIcon size={12} className="shrink-0 text-faint" />
      ) : item.href === "/streak" && streak > 0 ? (
        /* Coral, not amber. Amber means Study Coins and nothing else, and a
           streak is a run of days rather than a balance. */
        <span className="num flex shrink-0 items-center gap-0.5 rounded-full bg-epic/12 px-1.5 py-0.5 text-[12px] font-semibold text-epic-ink">
          <FlameIcon size={10} />
          {streak}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * A section of the navigation whose items are all unbuilt.
 *
 * Collapsed by default. Six locked rows plus a separate explanatory card was
 * most of the rail's height spent on things you cannot use yet, and it stated
 * "the Arena is coming" three times over. Closed, it is one quiet line; open,
 * every route is still there and still reachable, so nothing was taken away —
 * it just stopped competing with the navigation that works.
 */
function LockedSection({
  section,
  pathname,
  streak,
  onNavigate,
}: {
  section: NavSection;
  pathname: string;
  streak: number;
  onNavigate?: () => void;
}) {
  const holdsCurrent = section.items.some((i) => isActive(pathname, i.href));
  const [open, setOpen] = useState(holdsCurrent);

  // If a locked route becomes the current page, open so the highlight is visible.
  useEffect(() => {
    if (holdsCurrent) setOpen(true);
  }, [holdsCurrent]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-sq px-3 py-2 transition-colors duration-200",
          "text-[12px] font-semibold uppercase tracking-[0.1em] text-faint",
          "hover:bg-raise-2 hover:text-muted",
        )}
      >
        <LockIcon size={11} className="shrink-0 opacity-70" />
        <span className="flex-1 text-left">{section.title}</span>
        <span className="text-[11px] font-medium normal-case tracking-normal opacity-80">
          {open ? "Hide" : "Soon"}
        </span>
        <ChevronRightIcon
          size={12}
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-90")}
        />
      </button>

      {open ? (
        <div className="mt-1">
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavRow
                  item={item}
                  active={isActive(pathname, item.href)}
                  streak={streak}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 px-3 text-xs leading-relaxed text-faint">
            Characters, gear, ranks and 1v1 battles are being built. Bank Study Coins now —
            you&apos;ll spend them there.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function NavSections({ streak, onNavigate }: { streak: number; onNavigate?: () => void }) {
  /* The destination while a navigation is in flight, the real path otherwise.
     `usePathname` only moves once the server has answered, which left the
     highlight sitting on the item you just left. */
  const pathname = useActivePath(usePathname());

  return (
    <>
      {NAV.map((section) => {
        const allLocked = section.items.every((i) => i.locked);

        if (allLocked && section.title) {
          return (
            <LockedSection
              key={section.title}
              section={section}
              pathname={pathname}
              streak={streak}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <div key={section.title ?? "main"}>
            {section.title ? (
              <div className="mb-1 px-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-faint">
                {section.title}
              </div>
            ) : null}

            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavRow
                    item={item}
                    active={isActive(pathname, item.href)}
                    streak={streak}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

/* ==========================================================================
   Desktop rail
   ========================================================================== */

export function Sidebar({ streak }: { streak: number }) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Wordmark className="px-3" />
      <NavSections streak={streak} />
    </nav>
  );
}

/* ==========================================================================
   Phone navigation

   The app had none below the large breakpoint: the rail was simply hidden and
   nothing replaced it, which left every page except the dashboard unreachable
   on a phone. This is a bottom bar for the four things people open most, plus
   a drawer holding the complete navigation so nothing is ever a dead end.
   ========================================================================== */

const BAR: Array<{ href: string; label: string; icon: NavItem["icon"] }> = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/flashcards", label: "Cards", icon: "cards" },
  { href: "/quizzes", label: "Quizzes", icon: "quiz" },
  { href: "/daily", label: "Daily", icon: "calendar" },
];

export function MobileNav({ streak }: { streak: number }) {
  const pathname = useActivePath(usePathname());
  const [open, setOpen] = useState(false);

  // Close on route change, so tapping a drawer link does not leave it hanging.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes, and the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <nav
        aria-label="Main"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 backdrop-blur-xl lg:hidden",
          // Keeps the bar clear of the home indicator on a modern phone.
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <ul className="grid grid-cols-5">
          {BAR.map((tab) => {
            const Icon = ICONS[tab.icon];
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                    "transition-colors",
                    active ? "text-accent" : "text-faint hover:text-muted",
                  )}
                >
                  <Icon size={20} />
                  {tab.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className="flex h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-faint transition-colors hover:text-muted"
            >
              <MenuIcon size={20} />
              More
            </button>
          </li>
        </ul>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 right-0 flex w-[19rem] max-w-[86vw] animate-rise flex-col gap-5 overflow-y-auto border-l border-line bg-bg px-4 py-5"
          >
            <div className="flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-sq text-muted transition-colors hover:bg-raise-2 hover:text-bright"
              >
                <XIcon size={17} />
              </button>
            </div>

            <NavSections streak={streak} onNavigate={() => setOpen(false)} />

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-sq px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-raise-2 hover:text-bright"
            >
              <SettingsIcon size={18} />
              Settings
            </Link>

          </div>
        </div>
      ) : null}
    </>
  );
}
