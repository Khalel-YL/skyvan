"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { PublicLocale } from "../lib/public-routing";

type StageId = "route" | "living" | "risk" | "ai" | "production" | "approval";
type MediaMode = "system-object";

type DecisionStage = {
  id: StageId;
  title: string;
  eyebrow: string;
  body: string;
};

type DecisionPreviewContent = {
  title: string;
  subtitle: string;
  mediaMode: MediaMode;
  assetHints: {
    fallbackObject: string;
    activeLayers: StageId[];
  };
  stages: DecisionStage[];
};

const previewContent = {
  tr: {
    title: "Skyvan kararı tek ekranda netleştirir.",
    subtitle:
      "Rota, yaşam, teknik risk, AI bağlamı, üretim hazırlığı ve insan onayı aynı karar omurgasında görünür olur.",
    mediaMode: "system-object",
    assetHints: {
      fallbackObject: "css-skyvan-decision-object",
      activeLayers: ["route", "living", "risk", "ai", "production", "approval"],
    },
    stages: [
      {
        id: "route",
        title: "Rota",
        eyebrow: "Yol niyeti",
        body: "Rota ritmi kararın ilk bağlamını kurar.",
      },
      {
        id: "living",
        title: "Yaşam",
        eyebrow: "Günlük düzen",
        body: "Kullanım alışkanlığı iç düzene bağlanır.",
      },
      {
        id: "risk",
        title: "Teknik risk",
        eyebrow: "Erken görünürlük",
        body: "Ağırlık, enerji ve su sınırları işaretlenir.",
      },
      {
        id: "ai",
        title: "Skyvan AI",
        eyebrow: "Bağlam katmanı",
        body: "Skyvan AI bağlamı görünür kılar; karar vermez.",
      },
      {
        id: "production",
        title: "Üretim hazırlığı",
        eyebrow: "Hazırlık aksı",
        body: "Netleşen karar üretim diline yaklaşır.",
      },
      {
        id: "approval",
        title: "İnsan onayı",
        eyebrow: "Final sınırı",
        body: "Son karar insan onayıyla kalır.",
      },
    ],
  },
  en: {
    title: "Skyvan clarifies the decision in one system view.",
    subtitle:
      "Route, living, technical risk, AI context, production readiness, and human approval become visible in one decision structure.",
    mediaMode: "system-object",
    assetHints: {
      fallbackObject: "css-skyvan-decision-object",
      activeLayers: ["route", "living", "risk", "ai", "production", "approval"],
    },
    stages: [
      {
        id: "route",
        title: "Route",
        eyebrow: "Travel intent",
        body: "Route rhythm sets the first decision context.",
      },
      {
        id: "living",
        title: "Living",
        eyebrow: "Daily order",
        body: "Usage habits connect to interior order.",
      },
      {
        id: "risk",
        title: "Technical risk",
        eyebrow: "Early visibility",
        body: "Weight, energy, and water limits are marked.",
      },
      {
        id: "ai",
        title: "Skyvan AI",
        eyebrow: "Context layer",
        body: "Skyvan AI makes context visible; it does not decide.",
      },
      {
        id: "production",
        title: "Production readiness",
        eyebrow: "Readiness axis",
        body: "A clarified decision moves toward production language.",
      },
      {
        id: "approval",
        title: "Human approval",
        eyebrow: "Final boundary",
        body: "Final approval remains human-led.",
      },
    ],
  },
} satisfies Record<PublicLocale, DecisionPreviewContent>;

export function HomeDecisionSystemPreview({ locale }: { locale: PublicLocale }) {
  const content = previewContent[locale];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = content.stages[activeIndex];
  const assetSummary = useMemo(
    () => [content.assetHints.fallbackObject, ...content.assetHints.activeLayers].join(" · "),
    [content],
  );

  return (
    <section
      className="public-reveal overflow-x-clip border-y border-[var(--public-border)] bg-[var(--public-bg-soft)] px-5 py-14 md:px-8 md:py-20"
      data-home-decision-preview
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.43fr_0.57fr] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)]">
            {locale === "tr" ? "Karar sistemi" : "Decision system"}
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.04] tracking-tight text-[var(--public-text)] md:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--public-muted)] md:text-base md:leading-8">
            {content.subtitle}
          </p>
        </div>

        <DecisionObject
          activeId={activeStage.id}
          mediaMode={content.mediaMode}
          assetSummary={assetSummary}
        />

        <div className="min-w-0 lg:col-span-2">
          <div className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3" data-home-stage-rail>
            {content.stages.map((stage, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  className={`group min-w-0 rounded-[1.25rem] border text-left transition duration-300 motion-reduce:transition-none ${
                    isActive
                      ? "border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] px-3.5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.1)]"
                      : "min-h-11 border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-[var(--public-muted)] hover:border-[var(--public-border-strong)] hover:text-[var(--public-text)]"
                  }`}
                  data-home-stage-pill={stage.id}
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-[0.0625rem] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--public-border)] bg-[var(--public-bg)]/55">
                      {isActive ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tracking-tight text-[var(--public-text)]">
                        {stage.title}
                      </span>
                      {isActive ? (
                        <span className="mt-2 block">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)]">
                            {stage.eyebrow}
                          </span>
                          <span className="mt-1.5 block text-[13px]/[1.35rem] text-[var(--public-muted)]">
                            {stage.body}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionObject({
  activeId,
  mediaMode,
  assetSummary,
}: {
  activeId: StageId;
  mediaMode: MediaMode;
  assetSummary: string;
}) {
  return (
    <div
      className="relative min-h-[19rem] min-w-0 overflow-hidden rounded-[1.75rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-4 sm:min-h-[23rem] sm:p-5 lg:min-h-[26rem]"
      data-home-decision-object
      data-media-mode={mediaMode}
      data-asset-hints={assetSummary}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_57%_44%,color-mix(in_srgb,var(--public-text)_11%,transparent),transparent_36%),linear-gradient(180deg,var(--public-surface),var(--public-bg-soft))]" />
      <div className="absolute inset-x-8 bottom-8 h-20 rounded-[100%] bg-black/15 blur-3xl" />

      <div className="relative flex h-full min-h-[17rem] items-center justify-center sm:min-h-[21rem] lg:min-h-[24rem]">
        <div className={`relative aspect-[1.78] w-[min(100%,43rem)] transition duration-700 motion-reduce:transition-none ${objectTransform(activeId)}`}>
          <div className="absolute inset-x-[5%] top-[12%] bottom-[3%] rounded-[999px] bg-[radial-gradient(circle_at_52%_47%,color-mix(in_srgb,var(--public-text)_13%,transparent),transparent_45%)] blur-3xl" />

          <div className="absolute inset-x-[4%] top-[25%] bottom-[18%] rounded-[3.2rem] border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[linear-gradient(145deg,var(--public-surface-strong),var(--public-surface)_58%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-32px_66px_rgba(0,0,0,0.11),0_28px_80px_rgba(0,0,0,0.18)] md:rounded-[5rem]" />
          <div className="absolute right-[6%] top-[29%] h-[44%] w-[21%] rounded-r-[3.2rem] border border-l-0 border-[color-mix(in_srgb,var(--public-border)_72%,var(--public-text)_28%)] bg-[linear-gradient(120deg,color-mix(in_srgb,var(--public-text)_9%,transparent),transparent_58%)] md:rounded-r-[5rem]" />
          <div className="absolute left-[14%] right-[24%] top-[39%] h-[19%] rounded-[999px] border border-[color-mix(in_srgb,var(--public-border)_72%,var(--public-text)_28%)] bg-[var(--public-bg)]/34" />
          <div className="absolute bottom-[17%] left-[25%] h-[6%] w-[10%] rounded-full border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[var(--public-surface-strong)]" />
          <div className="absolute bottom-[17%] right-[25%] h-[6%] w-[10%] rounded-full border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[var(--public-surface-strong)]" />

          <DecisionLayer active={activeId === "route"} className="left-[12%] top-[31%] h-[22%] w-[43%]">
            <span className="absolute left-0 top-[53%] h-[4%] w-[80%] origin-left rotate-[-7deg] rounded-full bg-[var(--public-text)]/72" />
            <span className="absolute left-0 top-[42%] h-[18%] w-[9%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
            <span className="absolute right-[13%] top-[30%] h-[18%] w-[9%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
          </DecisionLayer>

          <DecisionLayer active={activeId === "living"} className="left-[34%] top-[38%] h-[24%] w-[28%]">
            <span className="absolute inset-0 rounded-[1.5rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/88" />
            <span className="absolute left-[13%] top-[17%] h-[28%] w-[30%] rounded-xl bg-[var(--public-bg)]/58" />
            <span className="absolute right-[13%] top-[17%] h-[28%] w-[30%] rounded-xl bg-[var(--public-bg)]/38" />
            <span className="absolute inset-x-[13%] bottom-[16%] h-[24%] rounded-xl bg-[var(--public-bg)]/46" />
          </DecisionLayer>

          <DecisionLayer active={activeId === "risk"} className="right-[22%] top-[31%] h-[18%] w-[14%]">
            <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/90" />
            <span className="absolute left-1/2 top-[21%] h-[38%] w-px -translate-x-1/2 rounded-full bg-[var(--public-text)]" />
            <span className="absolute bottom-[22%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--public-text)]" />
          </DecisionLayer>

          <DecisionLayer active={activeId === "ai"} className="left-[44%] top-[49%] h-[23%] w-[14%]">
            <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[radial-gradient(circle,var(--public-surface-strong),transparent_66%)]" />
            <span className="absolute inset-[18%] rounded-full border border-[var(--public-border)]" />
            <span className="absolute inset-[39%] rounded-full bg-[var(--public-text)]" />
          </DecisionLayer>

          <DecisionLayer active={activeId === "production"} className="right-[8%] top-[59%] h-[16%] w-[36%]">
            <span className="absolute left-0 top-1/2 h-[5%] w-full -translate-y-1/2 rounded-full bg-[var(--public-text)]/74" />
            <span className="absolute right-0 top-[18%] h-[64%] w-[20%] rounded-[1rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/88" />
            <span className="absolute right-[6%] top-[33%] h-[10%] w-[8%] rounded-full bg-[var(--public-bg)]/62" />
          </DecisionLayer>

          <DecisionLayer active={activeId === "approval"} className="left-[18%] top-[60%] h-[17%] w-[12%]">
            <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/92" />
            <span className="absolute left-[31%] top-[48%] h-[6%] w-[17%] rotate-45 rounded-full bg-[var(--public-text)]" />
            <span className="absolute left-[43%] top-[43%] h-[6%] w-[34%] -rotate-45 rounded-full bg-[var(--public-text)]" />
          </DecisionLayer>
        </div>
      </div>
    </div>
  );
}

function DecisionLayer({
  active,
  className,
  children,
}: {
  active: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute transition duration-700 ease-out motion-reduce:transition-none ${className} ${
        active
          ? "scale-110 opacity-100 drop-shadow-[0_0_34px_color-mix(in_srgb,var(--public-text)_24%,transparent)]"
          : "scale-100 opacity-[0.32]"
      }`}
    >
      {children}
    </div>
  );
}

function objectTransform(activeId: StageId) {
  if (activeId === "route") {
    return "scale-[0.94] rotate-[-1deg]";
  }

  if (activeId === "ai") {
    return "scale-[0.99]";
  }

  if (activeId === "approval") {
    return "scale-[0.95] translate-y-1";
  }

  return "scale-[0.96]";
}
