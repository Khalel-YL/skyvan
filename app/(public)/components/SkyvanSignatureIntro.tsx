"use client";

import { useEffect, useState } from "react";

import { BrandLogo } from "./BrandLogo";

const INTRO_STORAGE_KEY = "skyvan-signature-intro-seen";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function SkyvanSignatureIntro() {
  const [visible, setVisible] = useState(false);

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
    const hideTimer = window.setTimeout(() => setVisible(false), 1120);

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
      aria-hidden="true"
    >
      <div className="absolute inset-x-[18%] top-1/2 h-px -translate-y-1/2 bg-white/10" />
      <div className="skyvan-signature-line absolute left-1/2 top-1/2 h-px w-[min(23rem,72vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.055] blur-2xl" />

      <div className="skyvan-signature-mark relative flex flex-col items-center gap-5">
        <BrandLogo
          variant="logo"
          tone="dark"
          size="hero"
          priority
          className="w-[min(21rem,70vw)]"
          showTextFallback={false}
        />
        <span className="h-px w-24 rounded-full bg-white/18" />
      </div>
    </div>
  );
}
