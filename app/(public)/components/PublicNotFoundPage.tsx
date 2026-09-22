"use client";

import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";
import { usePathname } from "next/navigation";

import { getLocaleFromPathname, getLocalizedPath, type PublicLocale } from "../lib/public-routing";

const copy: Record<PublicLocale, {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
}> = {
  tr: {
    eyebrow: "404 / SKYVAN",
    title: "Bu sayfa yol üzerinde değil.",
    body: "Aradığınız içerik yayında değil, taşınmış olabilir veya adresi eksik yazılmış olabilir.",
    action: "Ana sayfaya dön",
  },
  en: {
    eyebrow: "404 / SKYVAN",
    title: "This page is not on the route.",
    body: "The content may be unpublished, moved, or the address may be incomplete.",
    action: "Return home",
  },
};

export function PublicNotFoundPage({ forcedLocale }: { forcedLocale?: PublicLocale } = {}) {
  const pathname = usePathname() ?? "";
  const locale = forcedLocale ?? getLocaleFromPathname(pathname);
  const text = copy[locale];

  return (
    <section className="sv-public-not-found" aria-labelledby="public-not-found-title">
      <div className="sv-container sv-public-not-found-inner">
        <div className="sv-public-not-found-mark" aria-hidden="true">
          <FileWarning size={26} strokeWidth={1.4} />
        </div>
        <p className="sv-eyebrow">{text.eyebrow}</p>
        <h1 id="public-not-found-title">{text.title}</h1>
        <p className="sv-public-not-found-body">{text.body}</p>
        <Link className="sv-button" href={getLocalizedPath(locale)}>
          <ArrowLeft size={15} aria-hidden="true" />
          {text.action}
        </Link>
      </div>
    </section>
  );
}
