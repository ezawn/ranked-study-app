"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { skeletonForPath } from "@/components/ui/route-skeletons";

/**
 * Instant feedback on navigation.
 *
 * `loading.tsx` alone cannot do this. Next only swaps in a route's loading
 * boundary once the client knows that boundary exists, and it learns that from
 * the prefetch — which `next dev` disables outright and which production only
 * runs after a link has been in the viewport. Every page here is
 * `force-dynamic`, so with no prefetch in hand the router waits for the
 * server before it can render anything at all.
 *
 * WHY THIS IS SPLIT INTO THREE PIECES. The obvious shape — one component
 * holding the pending state that renders either the skeleton or `children` —
 * does not work, and the failure is subtle. `children` is the route content,
 * and the moment the router starts navigating, that subtree suspends. A
 * component cannot commit a state change while the subtree it renders is
 * suspended, so the skeleton sat waiting for exactly the server response it
 * was supposed to be covering: the pause was still there, just harder to
 * explain.
 *
 * So nothing that reacts to the pending state may have the route content
 * underneath it:
 *
 *   NavigationProvider  owns the state, and passes `children` straight
 *                       through untouched — same element, so React bails out
 *                       of re-rendering the suspended subtree entirely.
 *   PendingSkeleton     has no children of its own, so it commits the instant
 *                       the state changes.
 *   [data-route-area]   hides the stale page in CSS, so React never has to
 *                       reconcile it to get it off the screen.
 *
 * Nothing here changes what is fetched or when. It only stops the interface
 * from pretending it did not hear you.
 */

interface NavigationValue {
  /** Announce a navigation the router is about to perform. */
  start: (href: string) => void;
  /** Where we are heading, or null when settled. */
  pendingHref: string | null;
  /**
   * The path the interface should present as current: the destination while a
   * navigation is in flight, otherwise the real one. Nav highlights read this
   * so the selected item moves under the reader's finger rather than a beat
   * later, when the server finally answers.
   */
  activePath: string;
}

const Ctx = createContext<NavigationValue | null>(null);

function useNavigation(): NavigationValue {
  const value = useContext(Ctx);
  // The provider wraps the whole signed-in shell. Outside it — the auth
  // pages — these hooks degrade to plain behaviour rather than throwing.
  return value ?? { start: () => {}, pendingHref: null, activePath: "" };
}

/** For nav highlights: the destination while navigating, else the real path. */
export function useActivePath(fallback: string): string {
  const { activePath } = useNavigation();
  return activePath || fallback;
}

/**
 * `router.push` with the pending state attached.
 *
 * Use this instead of `useRouter().push` anywhere a control navigates after
 * doing work. The button's own spinner covers the work; this covers the gap
 * between the work finishing and the next page arriving, which on a dynamic
 * route is the longer half.
 */
export function useNavigate() {
  const router = useRouter();
  const { start } = useNavigation();
  return useCallback(
    (href: string) => {
      start(href);
      router.push(href);
    },
    [router, start],
  );
}

/** A safety net: if a navigation is abandoned, don't strand the reader. */
const MAX_PENDING_MS = 12_000;

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * The DOM work below has to land before the browser paints, or the outgoing
 * page and its skeleton both show for a frame. But React warns when
 * `useLayoutEffect` is called during server rendering, so the choice is made
 * once at module scope — the hook order stays constant, which is what
 * actually matters.
 */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The in-app destination a click is about to navigate to, or `null` if this
 * click is not one the router will handle.
 *
 * Separated out and exported because the interesting part of this feature is
 * the set of clicks it must keep its hands off — a middle-click, a
 * cmd-click, a download, a new tab, an external link — and that list is
 * worth being able to test directly.
 */
export function destinationFor(event: MouseEvent, here: string): string | null {
  // Anything the browser has its own plans for, or that something upstream
  // already handled, is not ours.
  if (event.defaultPrevented) return null;
  if (event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor) return null;

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  // Only same-origin, absolute in-app paths. Leaves out external links,
  // `mailto:`, `#anchor` and anything the router will not own.
  const raw = anchor.getAttribute("href");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;

  const [path, query = ""] = raw.split("#")[0].split("?");
  const href = query ? `${path}?${query}` : path;

  return href === here ? null : href; // clicking where you already are
}

/**
 * Watches for the navigation actually landing.
 *
 * Isolated into its own component behind its own boundary because
 * `useSearchParams` opts whatever reads it out of static rendering. Confining
 * it to a leaf that renders nothing keeps that cost off the shell.
 */
function RouteWatcher({ onSettle }: { onSettle: (path: string) => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    onSettle(search ? `${pathname}?${search}` : pathname);
  }, [pathname, search, onSettle]);

  return null;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [settledPath, setSettledPath] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSettle = useCallback((path: string) => {
    setSettledPath(path);
    setPendingHref(null);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback((href: string) => {
    setPendingHref(href);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPendingHref(null), MAX_PENDING_MS);
  }, []);

  /*
   * One listener rather than a prop on several hundred links. Every in-app
   * destination is a plain anchor by the time it reaches the DOM — `Link`,
   * `ButtonLink`, `PanelLink`, the tiles, the sidebar — so reading the click
   * catches all of them and cannot drift out of sync the way a hand-applied
   * prop would.
   *
   * CAPTURE PHASE, and that is the whole trick. Next's `Link` calls
   * `preventDefault()` in its own click handler before taking over the
   * navigation, and React's handlers sit closer to the target than `document`
   * does. A bubble listener here therefore runs *after* Next has already
   * marked the event handled, sees `defaultPrevented`, and correctly decides
   * the click is not its business — so nothing ever lit up, and what looked
   * like a slow skeleton was really Next's own `loading.tsx` arriving once the
   * server answered. Capture runs `document` first, before any of that.
   *
   * A click is a discrete event, so the update below is urgent and commits
   * ahead of the router's transition rather than queueing behind it.
   */
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const href = destinationFor(event, window.location.pathname + window.location.search);
      if (href) start(href);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const activePath = (pendingHref ?? settledPath).split("?")[0];

  return (
    <Ctx.Provider value={{ start, pendingHref, activePath }}>
      <Suspense fallback={null}>
        <RouteWatcher onSettle={onSettle} />
      </Suspense>
      {children}
    </Ctx.Provider>
  );
}

/**
 * The skeleton for wherever we are heading.
 *
 * Renders as a sibling of the route content rather than in place of it. It
 * holds no children of its own, so a state change here commits immediately
 * however deeply the outgoing page is suspended — which is the whole point.
 * The stale page is taken off screen by CSS in `globals.css`, keyed off the
 * presence of this element.
 */
export function PendingSkeleton() {
  const { pendingHref } = useNavigation();
  const ref = useRef<HTMLDivElement | null>(null);

  /*
   * Marks the route area so the stylesheet can take the outgoing page off
   * screen. Done imperatively on the parent rather than with `:has()` so the
   * rule needs no modern selector support, and in a layout effect so it lands
   * before the browser paints — the skeleton and the disappearance of the old
   * page happen in the same frame, never one after the other.
   */
  useBeforePaint(() => {
    if (!pendingHref) return;
    const area = ref.current?.parentElement;
    if (!area) return;
    area.setAttribute("data-navigating", "");
    return () => area.removeAttribute("data-navigating");
  }, [pendingHref]);

  if (!pendingHref) return <div ref={ref} hidden />;

  return (
    <div ref={ref} data-pending-skeleton="" key={pendingHref}>
      {skeletonForPath(pendingHref.split("?")[0])}
    </div>
  );
}
