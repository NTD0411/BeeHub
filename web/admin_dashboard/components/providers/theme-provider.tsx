"use client";

import * as React from "react";

/* ── Types ───────────────────────────────────────────────────────────────── */

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  /** The resolved theme actually applied to the DOM ("light" | "dark") */
  resolvedTheme: "light" | "dark";
  /** The stored preference — may be "system" */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/* ── Context ─────────────────────────────────────────────────────────────── */

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "unimove-admin-theme";

/* ── Inline script injected into <head> — prevents FOUC ─────────────────── */

const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("unimove-admin-theme");var r=s;if(!r||r==="system"){r=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(r==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/* ── Provider ────────────────────────────────────────────────────────────── */

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default preference if nothing is stored. Defaults to "system". */
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  // Initialise from localStorage on mount (single source of truth)
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = stored ?? defaultTheme;
    setThemeState(initial);
    const r = resolveTheme(initial);
    setResolvedTheme(r);
    applyTheme(r);
  }, [defaultTheme]);

  // React to system preference changes when theme is "system"
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const r = getSystemTheme();
        setResolvedTheme(r);
        applyTheme(r);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
    const r = resolveTheme(next);
    setResolvedTheme(r);
    applyTheme(r);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/* ── No-FOUC script tag for <head> ───────────────────────────────────────── */

/**
 * Render inside your root `<head>` to prevent flash of unstyled content.
 *
 * ```tsx
 * // app/layout.tsx
 * import { ThemeScript } from "@/components/providers/theme-provider";
 * ...
 * export default function RootLayout({ children }) {
 *   return (
 *     <html suppressHydrationWarning>
 *       <head>
 *         <ThemeScript />
 *       </head>
 *       <body>...</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ThemeScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
      suppressHydrationWarning
    />
  );
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return ctx;
}
