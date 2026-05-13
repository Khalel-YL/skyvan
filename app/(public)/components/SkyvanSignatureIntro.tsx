"use client";

import { useEffect, useState } from "react";

import { BrandLogo } from "./BrandLogo";
import { usePublicTheme } from "./ThemeProvider";

const INTRO_STORAGE_KEY = "skyvan-signature-intro-seen";
const INTRO_DURATION_MS = 1960;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function prefersLightTheme() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

export function SkyvanSignatureIntro() {
  const [visible, setVisible] = useState(false);
  const { mounted, theme } = usePublicTheme();
  const themeTone =
    mounted && (theme === "light" || (theme === "system" && prefersLightTheme()))
      ? "light"
      : "dark";

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "1") {
        return;
      }

      window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // Storage can fail in private or restricted contexts; the homepage must remain usable.
    }

    const revealTimer = window.setTimeout(() => setVisible(true), 0);
    const hideTimer = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="skyvan-signature-intro fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#050505] text-white"
      data-signature-theme={themeTone}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.16),transparent_19rem),linear-gradient(120deg,transparent,rgba(255,255,255,0.05),transparent)]" />
      <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-current opacity-10" />
      <div className="skyvan-signature-line absolute left-1/2 top-1/2 h-px w-[min(34rem,82vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-70" />
      <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current opacity-[0.055] blur-3xl" />

      <div className="skyvan-signature-mark relative flex flex-col items-center gap-6">
        <span className="skyvan-signature-sweep absolute inset-y-[-1.5rem] left-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-current to-transparent opacity-0" />
        <BrandLogo
          variant="logo"
          tone={themeTone === "light" ? "light" : "dark"}
          size="hero"
          priority
          className="relative w-[min(29rem,82vw)]"
          showTextFallback={false}
        />
        <span className="h-px w-36 rounded-full bg-current opacity-18" />
      </div>
    </div>
  );
}
