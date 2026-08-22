"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** The user's preference, which may be `"system"`. */
  theme: Theme;
  /** What is actually applied to `<html>` right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** Flip between light and dark, resolving `"system"` first. */
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export const DEFAULT_THEME_STORAGE_KEY = "upchaar-theme";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(storageKey: string): Theme | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return isTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Preference used before anything is stored. Defaults to `"system"`. */
  defaultTheme?: Theme;
  /** localStorage key. Keep it identical across the three apps. */
  storageKey?: string;
}

/**
 * Class-based dark mode without `next-themes`. Toggles `.dark` on
 * `document.documentElement` and persists the choice in localStorage.
 *
 * Pair it with `<ThemeScript />` in the document `<head>` to avoid a flash of
 * the wrong theme on first paint.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = DEFAULT_THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(
    defaultTheme === "dark" ? "dark" : "light",
  );

  // Hydration-safe: read the stored preference only on the client.
  React.useEffect(() => {
    const stored = readStoredTheme(storageKey);
    if (stored !== null) setThemeState(stored);
  }, [storageKey]);

  React.useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const next: ResolvedTheme = theme === "system" ? systemTheme() : theme;
      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      root.dataset["theme"] = next;
      setResolvedTheme(next);
    };

    apply();

    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [theme]);

  // Keep tabs in sync.
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      if (isTheme(event.newValue)) setThemeState(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        /* private mode / storage disabled — the in-memory value still applies */
      }
      setThemeState(next);
    },
    [storageKey],
  );

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Read the theme. Throws if used outside `<ThemeProvider>`. */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used inside a <ThemeProvider>");
  }
  return context;
}

/** Read the theme without requiring a provider — returns `null` if absent. */
export function useOptionalTheme(): ThemeContextValue | null {
  return React.useContext(ThemeContext);
}

export interface ThemeScriptProps {
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * Renders the tiny synchronous script that applies the stored theme before the
 * first paint. Put it inside `<head>` in the root layout.
 */
export function ThemeScript({
  defaultTheme = "system",
  storageKey = DEFAULT_THEME_STORAGE_KEY,
}: ThemeScriptProps) {
  const source =
    "(function(){try{" +
    "var k=" +
    JSON.stringify(storageKey) +
    ";var d=" +
    JSON.stringify(defaultTheme) +
    ";var s=localStorage.getItem(k);" +
    "var t=(s==='light'||s==='dark'||s==='system')?s:d;" +
    "var r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;" +
    "var e=document.documentElement;" +
    "e.classList.toggle('dark',r==='dark');e.style.colorScheme=r;e.dataset.theme=r;" +
    "}catch(_){}})();";

  return (
    <script
      // Static, developer-authored source with no interpolated user input.
      dangerouslySetInnerHTML={{ __html: source }}
      suppressHydrationWarning
    />
  );
}
