"use client";

import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const activeTheme = mounted ? theme : "system";
  const activeOption = themeOptions.find((option) => option.value === activeTheme) ?? themeOptions[0];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  function focusOption(index: number) {
    options.current[(index + themeOptions.length) % themeOptions.length]?.focus();
  }

  return <div className="sv-theme-control" ref={root} onKeyDown={(event) => {
    if (open && event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
  }}>
    <button
      ref={trigger}
      type="button"
      className="sv-theme-trigger"
      aria-label={`${locale === "tr" ? "Görünüm" : "Appearance"}: ${activeOption.labels[locale]}`}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setOpen(true);
          window.requestAnimationFrame(() => focusOption(themeOptions.findIndex((item) => item.value === activeTheme)));
        }
      }}
    >
      <ActiveIcon size={16} aria-hidden="true" />
      <span>{activeOption.labels[locale]}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    {open ? <div id={menuId} role="menu" aria-label={locale === "tr" ? "Görünüm seçimi" : "Appearance choice"} className="sv-theme-menu">
      {themeOptions.map((option, index) => {
        const Icon = option.icon;
        const active = activeTheme === option.value;
        return <button
          key={option.value}
          ref={(node) => { options.current[index] = node; }}
          type="button"
          role="menuitemradio"
          aria-checked={active}
          className={active ? "is-active" : ""}
          onClick={() => {
            setTheme(option.value);
            setOpen(false);
            trigger.current?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); focusOption(index + 1); }
            if (event.key === "ArrowUp") { event.preventDefault(); focusOption(index - 1); }
            if (event.key === "Home") { event.preventDefault(); focusOption(0); }
            if (event.key === "End") { event.preventDefault(); focusOption(themeOptions.length - 1); }
          }}
        ><Icon size={16} aria-hidden="true" /><span>{option.labels[locale]}</span></button>;
      })}
    </div> : null}
  </div>;
}
