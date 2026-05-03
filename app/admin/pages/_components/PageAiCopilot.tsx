"use client";

import { Wand2 } from "lucide-react";

import type { PageContentBlock } from "../_lib/page-blocks";

type PageAiCopilotProps = {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  onInsertHero: (block: PageContentBlock) => void;
  onApplySeo: (seo: { seoTitle: string; seoDescription: string }) => void;
  onApplyStructure: (blocks: PageContentBlock[]) => void;
};

export function PageAiCopilot({
  title,
  description,
  seoTitle,
  seoDescription,
  onInsertHero,
  onApplySeo,
  onApplyStructure,
}: PageAiCopilotProps) {
  const safeTitle = title.trim() || "Skyvan sayfası";
  const safeDescription =
    description.trim() || "Skyvan yönetim panelinden hazırlanan kontrollü public içerik.";
  const heroSuggestion: PageContentBlock = {
    type: "hero",
    heading: safeTitle,
    subtext: "Skyvan karar sistemi",
    body: safeDescription,
    ctaLabel: "İletişime geç",
    ctaHref: "/tr/proje-baslat",
  };
  const seoSuggestion = {
    seoTitle: (seoTitle.trim() || `${safeTitle} | Skyvan`).slice(0, 90),
    seoDescription: (
      seoDescription.trim() ||
      `${safeTitle} hakkında Skyvan yaklaşımı, karar bağlamı ve üretim hazırlığı bilgilerini keşfedin.`
    ).slice(0, 170),
  };
  const structureSuggestion: PageContentBlock[] = [
    heroSuggestion,
    {
      type: "text",
      heading: "Karar bağlamı",
      body: "Bu bölüm sayfanın ana anlatımını, hedef kullanıcıyı ve Skyvan'ın nasıl değer ürettiğini açıklar.",
    },
    {
      type: "feature-list",
      heading: "Öne çıkanlar",
      items: ["Rota ve kullanım senaryosu", "Teknik hazırlık", "İnsan onayı"],
    },
    {
      type: "cta",
      heading: "Sonraki adım",
      ctaLabel: "Proje Başlat",
      ctaHref: "/tr/proje-baslat",
    },
  ];

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-black p-2 text-zinc-300">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Copilot</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Deterministik öneri panelidir. API çağrısı yapmaz, DB yazmaz, publish etmez.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <div className="text-sm font-medium text-white">Hero draft</div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{heroSuggestion.heading}</p>
          <button
            type="button"
            onClick={() => onInsertHero(heroSuggestion)}
            className="mt-3 rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white"
          >
            Insert suggestion
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <div className="text-sm font-medium text-white">SEO rewrite</div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{seoSuggestion.seoTitle}</p>
          <button
            type="button"
            onClick={() => onApplySeo(seoSuggestion)}
            className="mt-3 rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white"
          >
            Insert suggestion
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <div className="text-sm font-medium text-white">Suggested structure</div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Hero, context text, feature list, and CTA blocks.
          </p>
          <button
            type="button"
            onClick={() => onApplyStructure(structureSuggestion)}
            className="mt-3 rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white"
          >
            Insert suggestion
          </button>
        </div>
      </div>
    </section>
  );
}
