"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRef } from "react";

import type { PublicLocale } from "../lib/public-routing";
import { type PublicThemeChoice, usePublicTheme } from "./ThemeProvider";

const themeOptions: Array<{
  value: PublicThemeChoice;
  labels: Record<PublicLocale, string>;
  icon: typeof Monitor;
}> = [
  { value: "system", labels: { tr: "Sistem", en: "System" }, icon: Monitor },
  { value: "light", labels: { tr: "Açık", en: "Light" }, icon: Sun },
  { value: "dark", labels: { tr: "Koyu", en: "Dark" }, icon: Moon },
];

export function ThemeToggle({ locale }: { locale: PublicLocale }) {
  const { mounted, theme, setTheme } = usePublicTheme();
  const activeTheme = mounted ? theme : "system";
  const options = useRef<Array<HTMLButtonElement | null>>([]);

  function selectOption(index: number) {
    const option = themeOptions[(index + themeOptions.length) % themeOptions.length];
    setTheme(option.value);
    options.current[(index + themeOptions.length) % themeOptions.length]?.focus();
  }

  return <div
    className="sv-theme-control"
    role="radiogroup"
    aria-label={locale === "tr" ? "Görünüm seçimi" : "Appearance choice"}
  >
    {themeOptions.map((option, index) => {
      const Icon = option.icon;
      const active = activeTheme === option.value;
      return <button
        key={option.value}
        ref={(node) => { options.current[index] = node; }}
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={option.labels[locale]}
        title={option.labels[locale]}
        tabIndex={active ? 0 : -1}
        className={active ? "is-active" : ""}
        onClick={() => setTheme(option.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            selectOption(index + 1);
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            selectOption(index - 1);
          }
          if (event.key === "Home") {
            event.preventDefault();
            selectOption(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            selectOption(themeOptions.length - 1);
          }
        }}
      >
        <Icon size={15} aria-hidden="true" />
      </button>;
    })}
  </div>;
}
