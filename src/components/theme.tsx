"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Light and dark.
 *
 * The class goes on <html> and the choice is remembered per device. The
 * initial class is set by a blocking script in the document head (see
 * `themeScript` below) so the page never paints the wrong theme first and
 * then corrects itself.
 *
 * Light is the default. The product is a study tool first, and most revision
 * happens in daylight, so nobody should land on a dark interface purely
 * because their laptop happens to be set that way. "system" remains a valid
 * stored value for anyone who sets it deliberately.
 */

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sq-theme";

/**
 * Runs before first paint. Deliberately terse and dependency-free: it is
 * inlined into the document head as a string.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Read the stored choice once mounted. The head script has already put the
  // right class on <html>, so this is only syncing React's copy of the state.
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
    setThemeState(stored);
    setResolved(apply(stored));
  }, []);

  // Follow the OS while the choice is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolved(apply(next));
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing. The choice still applies for this session.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  // Never throw for a display concern.
  return { theme: "light", resolved: "light", setTheme: () => {} };
}

/** Header control. Shows where you are now, switches to the other one. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const next = resolved === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-sq text-muted",
        "transition-colors hover:bg-raise-2 hover:text-bright",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      {/* Until mounted, render the moon so the markup matches the server. */}
      {mounted && resolved === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
    </button>
  );
}
