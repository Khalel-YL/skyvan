"use client";

import { Wand2 } from "lucide-react";

import type { PageContentBlock } from "../_lib/page-blocks";

type PageAiCopilotProps = {
  title: string;
  description: string;
  locale: string;
  seoTitle: string;
  seoDescription: string;
  onInsertHero: (block: PageContentBlock) => void;
  onApplySeo: (seo: { seoTitle: string; seoDescription: string }) => void;
  onApplyStructure: (blocks: PageContentBlock[]) => void;
};

export function PageAiCopilot({
  title,
  description,
  locale,
  seoTitle,
  seoDescription,
  onInsertHero,
  onApplySeo,
  onApplyStructure,
}: PageAiCopilotProps) {
  const isEnglish = locale.trim().toLowerCase().startsWith("en");
  const publicLocale = isEnglish ? "en" : "tr";
  const safeTitle = title.trim() || (isEnglish ? "Skyvan page" : "Skyvan sayfası");
  const safeDescription =
    description.trim() ||
    (isEnglish
      ? "Controlled public content prepared in the Skyvan admin panel."
      : "Skyvan yönetim panelinden hazırlanan kontrollü public içerik.");
  const heroSuggestion: PageContentBlock = {
    type: "hero",
    heading: safeTitle,
    subtext: isEnglish ? "Skyvan decision system" : "Skyvan karar sistemi",
    body: safeDescription,
    ctaLabel: isEnglish ? "Contact us" : "İletişime geç",
    ctaHref: `/${publicLocale}/iletisim`,
  };
  const seoSuggestion = {
    seoTitle: (seoTitle.trim() || `${safeTitle} | Skyvan`).slice(0, 90),
    seoDescription: (
      seoDescription.trim() ||
      (isEnglish
        ? `${safeTitle}: Skyvan's approach, decision context and production-readiness notes.`
        : `${safeTitle} hakkında Skyvan yaklaşımı, karar bağlamı ve üretim hazırlığı bilgilerini keşfedin.`)
    ).slice(0, 170),
  };
  const structureSuggestion: PageContentBlock[] = [
    heroSuggestion,
    {
      type: "text",
      heading: isEnglish ? "Decision context" : "Karar bağlamı",
      body: isEnglish
        ? "This section explains the page narrative, intended audience and how Skyvan creates value."
        : "Bu bölüm sayfanın ana anlatımını, hedef kullanıcıyı ve Skyvan'ın nasıl değer ürettiğini açıklar.",
    },
    {
      type: "feature-list",
      heading: isEnglish ? "Highlights" : "Öne çıkanlar",
      items: isEnglish
        ? ["Route and use case", "Technical readiness", "Human approval"]
        : ["Rota ve kullanım senaryosu", "Teknik hazırlık", "İnsan onayı"],
    },
    {
      type: "cta",
      heading: isEnglish ? "Next step" : "Sonraki adım",
      ctaLabel: isEnglish ? "Start a project" : "Proje Başlat",
      ctaHref: `/${publicLocale}/proje-baslat`,
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
