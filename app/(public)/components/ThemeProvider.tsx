"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type PublicThemeChoice = "system" | "light" | "dark";

type PublicThemeContextValue = {
  theme: PublicThemeChoice;
  mounted: boolean;
  setTheme: (theme: PublicThemeChoice) => void;
};

const STORAGE_KEY = "skyvan-public-theme";
const PublicThemeContext = createContext<PublicThemeContextValue | null>(null);

function readStoredTheme(): PublicThemeChoice {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PublicThemeChoice>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setThemeState(readStoredTheme());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const value = useMemo<PublicThemeContextValue>(
    () => ({
      theme,
      mounted,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        try {
          window.localStorage.setItem(STORAGE_KEY, nextTheme);
        } catch {
          // The in-memory choice still applies when browser storage is unavailable.
        }
      },
    }),
    [mounted, theme],
  );

  return (
    <PublicThemeContext.Provider value={value}>
      <div className="public-site sv-public min-h-screen" data-public-theme={theme}>
        {children}
      </div>
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const context = useContext(PublicThemeContext);

  if (!context) {
    throw new Error("usePublicTheme must be used inside ThemeProvider");
  }

  return context;
}
