"use client";

import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";

type PageSeoPanelProps = {
  title: string;
  slug: string;
  locale: string;
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onGenerate: () => void;
};

function ControlledDetails({
  defaultOpen,
  className,
  children,
}: {
  defaultOpen: boolean;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={className}
    >
      {children}
    </details>
  );
}

export function PageSeoPanel({
  title,
  slug,
  locale,
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onGenerate,
}: PageSeoPanelProps) {
  const displayTitle = seoTitle.trim() || title.trim() || "Skyvan";
  const displayDescription =
    seoDescription.trim() || "SEO açıklaması arama sonucunda burada görünecek.";
  const safeLocale = locale.trim().toLowerCase() || "tr";
  const url = `https://skyvan.com.tr/${safeLocale}/${slug.trim() || "sayfa"}`;
  const descriptionLength = seoDescription.trim().length;
  const seoReady = Boolean(seoTitle.trim() && seoDescription.trim());

  return (
    <ControlledDetails
      className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
      defaultOpen={!seoTitle.trim() && !seoDescription.trim()}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <h3 className="text-sm font-semibold text-white">SEO</h3>
          <p className="mt-1 text-xs text-zinc-500">Meta alanları ve yayın öncesi snippet kontrolü.</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] ${seoReady ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-amber-500/25 bg-amber-500/10 text-amber-200"}`}>
          {seoReady ? "Hazır" : "Eksik"}
        </span>
      </summary>

      <div className="mt-3 border-t border-zinc-800/80 pt-3">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <Sparkles className="h-4 w-4" />
            SEO öner
          </button>
        </div>

      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-xs text-zinc-400">SEO başlığı</span>
          <input
            name="seoTitle"
            value={seoTitle}
            onChange={(event) => onSeoTitleChange(event.target.value)}
            placeholder="Arama motoru başlığı"
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm outline-none transition focus:border-zinc-600"
          />
          <span className={`text-[11px] ${seoTitle.length > 90 ? "text-amber-300" : "text-zinc-500"}`}>
            {seoTitle.length} / 90
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-xs text-zinc-400">SEO açıklaması</span>
          <textarea
            name="seoDescription"
            value={seoDescription}
            onChange={(event) => onSeoDescriptionChange(event.target.value)}
            rows={3}
            placeholder="Arama motoru açıklaması"
            className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm outline-none transition focus:border-zinc-600"
          />
          <span className={`text-[11px] ${descriptionLength > 170 ? "text-amber-300" : "text-zinc-500"}`}>
            {descriptionLength} / 170
          </span>
        </label>

        <div className="rounded-xl border border-zinc-800 bg-black p-3">
          <div className="text-xs text-emerald-300">{url}</div>
          <div className="mt-1 text-lg leading-6 text-sky-300">{displayTitle}</div>
          <div className="mt-1 text-sm leading-6 text-zinc-400">{displayDescription}</div>
        </div>
      </div>
      </div>
    </ControlledDetails>
  );
}
