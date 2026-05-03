"use client";

import { Sparkles } from "lucide-react";

type PageSeoPanelProps = {
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onGenerate: () => void;
};

export function PageSeoPanel({
  title,
  slug,
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onGenerate,
}: PageSeoPanelProps) {
  const displayTitle = seoTitle.trim() || title.trim() || "Skyvan";
  const displayDescription =
    seoDescription.trim() || "SEO açıklaması arama sonucunda burada görünecek.";
  const url = `https://skyvan.com.tr/${slug.trim() || "sayfa"}`;
  const descriptionLength = seoDescription.trim().length;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">SEO</h3>
          <p className="mt-1 text-xs text-zinc-500">Google benzeri snippet ile yayın öncesi kontrol.</p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          <Sparkles className="h-4 w-4" />
          SEO öner
        </button>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs text-zinc-400">SEO başlığı</span>
          <input
            name="seoTitle"
            value={seoTitle}
            onChange={(event) => onSeoTitleChange(event.target.value)}
            placeholder="Arama motoru başlığı"
            className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
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
            rows={4}
            placeholder="Arama motoru açıklaması"
            className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
          />
          <span className={`text-[11px] ${descriptionLength > 170 ? "text-amber-300" : "text-zinc-500"}`}>
            {descriptionLength} / 170
          </span>
        </label>

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="text-xs text-emerald-300">{url}</div>
          <div className="mt-1 text-lg leading-6 text-sky-300">{displayTitle}</div>
          <div className="mt-1 text-sm leading-6 text-zinc-400">{displayDescription}</div>
        </div>
      </div>
    </section>
  );
}
