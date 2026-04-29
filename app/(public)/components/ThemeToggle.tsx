"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { type PublicThemeChoice, usePublicTheme } from "./ThemeProvider";

const themeOptions: Array<{
  value: PublicThemeChoice;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle() {
  const { mounted, theme, setTheme } = usePublicTheme();
  const activeTheme = mounted ? theme : "system";

  return (
    <div className="inline-flex rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] p-1">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = activeTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
              active
                ? "bg-[var(--public-accent)] text-[var(--public-accent-text)]"
                : "text-[var(--public-muted)] hover:bg-[var(--public-subtle)] hover:text-[var(--public-text)]"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
