"use client";

import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type MediaLabLocale = "tr" | "en";
type StageId = "route" | "living" | "risk" | "ai" | "production" | "approval";
type MediaMode = "still" | "sequence" | "loop-video" | "frame-360" | "hotspot-overlay";

type AssetHints = {
  still?: string;
  sequence?: string;
  loopVideo?: string;
  frame360?: string;
  hotspot?: string;
};

type MediaStage = {
  id: StageId;
  title: string;
  shortTitle: string;
  eyebrow: string;
  body: string;
  hotspotLabel: string;
  mediaMode: MediaMode;
  assetHints: AssetHints;
};

const mediaLabContent = {
  tr: {
    action: "Keşfet",
    previous: "Önceki aşama",
    next: "Sonraki aşama",
    stages: [
      {
        id: "route",
        title: "Rota",
        shortTitle: "Rota",
        eyebrow: "Hareket niyeti",
        body: "Yol çizgisi aracın üstünde belirir; karar ritmi okur.",
        hotspotLabel: "Rota hattı",
        mediaMode: "sequence",
        assetHints: {
          still: "/media-lab/route/still.webp",
          sequence: "/media-lab/route/frames",
          hotspot: "route-path-highlight",
        },
      },
      {
        id: "living",
        title: "Yaşam",
        shortTitle: "Yaşam",
        eyebrow: "İç düzen",
        body: "Kabin, alışkanlıklar için sakin bir yaşam bölgesi olur.",
        hotspotLabel: "Yaşam modülü",
        mediaMode: "hotspot-overlay",
        assetHints: {
          still: "/media-lab/living/still.webp",
          hotspot: "living-zone-glow",
        },
      },
      {
        id: "risk",
        title: "Teknik risk",
        shortTitle: "Risk",
        eyebrow: "Erken görünürlük",
        body: "Ağırlık, enerji ve su sınırları erken işaretlenir.",
        hotspotLabel: "Risk işareti",
        mediaMode: "still",
        assetHints: {
          still: "/media-lab/risk/cutaway.webp",
          hotspot: "risk-marker-pulse",
        },
      },
      {
        id: "ai",
        title: "Skyvan AI",
        shortTitle: "AI",
        eyebrow: "Bağlam çekirdeği",
        body: "Skyvan AI bağlamı görünür kılar; karar vermez.",
        hotspotLabel: "Bağlam halkası",
        mediaMode: "frame-360",
        assetHints: {
          frame360: "/media-lab/ai/orbit",
          hotspot: "context-core-ring",
        },
      },
      {
        id: "production",
        title: "Üretim hazırlığı",
        shortTitle: "Üretim",
        eyebrow: "Hizalama",
        body: "Netleşen katmanlar üretim öncesi okunur düzene yaklaşır.",
        hotspotLabel: "Hazırlık aksı",
        mediaMode: "loop-video",
        assetHints: {
          loopVideo: "/media-lab/production/alignment-loop.mp4",
          hotspot: "readiness-alignment",
        },
      },
      {
        id: "approval",
        title: "İnsan onayı",
        shortTitle: "Onay",
        eyebrow: "Final sakinliği",
        body: "Son katmanda yön hazırdır; onay insanda kalır.",
        hotspotLabel: "Onay katmanı",
        mediaMode: "hotspot-overlay",
        assetHints: {
          still: "/media-lab/approval/still.webp",
          hotspot: "human-approval-seal",
        },
      },
    ],
  },
  en: {
    action: "Explore",
    previous: "Previous stage",
    next: "Next stage",
    stages: [
      {
        id: "route",
        title: "Route",
        shortTitle: "Route",
        eyebrow: "Motion intent",
        body: "A travel line appears; the decision reads the rhythm ahead.",
        hotspotLabel: "Route path",
        mediaMode: "sequence",
        assetHints: {
          still: "/media-lab/route/still.webp",
          sequence: "/media-lab/route/frames",
          hotspot: "route-path-highlight",
        },
      },
      {
        id: "living",
        title: "Living",
        shortTitle: "Living",
        eyebrow: "Interior order",
        body: "The cabin becomes a calm living zone for daily habits.",
        hotspotLabel: "Living module",
        mediaMode: "hotspot-overlay",
        assetHints: {
          still: "/media-lab/living/still.webp",
          hotspot: "living-zone-glow",
        },
      },
      {
        id: "risk",
        title: "Technical risk",
        shortTitle: "Risk",
        eyebrow: "Early visibility",
        body: "Weight, energy, and water boundaries are marked early.",
        hotspotLabel: "Risk marker",
        mediaMode: "still",
        assetHints: {
          still: "/media-lab/risk/cutaway.webp",
          hotspot: "risk-marker-pulse",
        },
      },
      {
        id: "ai",
        title: "Skyvan AI",
        shortTitle: "AI",
        eyebrow: "Context core",
        body: "Skyvan AI makes context visible; it does not decide.",
        hotspotLabel: "Context ring",
        mediaMode: "frame-360",
        assetHints: {
          frame360: "/media-lab/ai/orbit",
          hotspot: "context-core-ring",
        },
      },
      {
        id: "production",
        title: "Production readiness",
        shortTitle: "Production",
        eyebrow: "Alignment",
        body: "Clarified layers move toward readable pre-production order.",
        hotspotLabel: "Readiness axis",
        mediaMode: "loop-video",
        assetHints: {
          loopVideo: "/media-lab/production/alignment-loop.mp4",
          hotspot: "readiness-alignment",
        },
      },
      {
        id: "approval",
        title: "Human approval",
        shortTitle: "Approval",
        eyebrow: "Final calm",
        body: "In the final layer, direction is prepared; approval remains human.",
        hotspotLabel: "Approval layer",
        mediaMode: "hotspot-overlay",
        assetHints: {
          still: "/media-lab/approval/still.webp",
          hotspot: "human-approval-seal",
        },
      },
    ],
  },
} satisfies Record<
  MediaLabLocale,
  {
    action: string;
    previous: string;
    next: string;
    stages: MediaStage[];
  }
>;

export function MediaLabPage({ locale }: { locale: MediaLabLocale }) {
  const page = mediaLabContent[locale];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = page.stages[activeIndex];

  const assetSummary = useMemo(
    () => Object.values(activeStage.assetHints).filter(Boolean).join(" · "),
    [activeStage],
  );

  function moveStage(direction: 1 | -1) {
    setActiveIndex((current) => (current + direction + page.stages.length) % page.stages.length);
  }

  return (
    <section className="min-h-[calc(100svh-4rem)] overflow-x-clip bg-[var(--public-bg)] text-[var(--public-text)]">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-7xl flex-col px-4 pb-7 pt-4 sm:px-5 md:px-8 lg:pb-8">
        <div className="flex h-12 items-center justify-between border-b border-[var(--public-border)] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)]">
          <span>Skyvan Media Lab</span>
          <span>{page.action}</span>
        </div>

        <div className="relative grid flex-1 min-h-0 gap-5 py-5 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-center lg:gap-8 lg:py-7">
          <div className="pointer-events-none absolute left-0 top-1/2 z-20 hidden -translate-x-[calc(100%+1rem)] -translate-y-1/2 flex-col gap-2 xl:flex">
            <StageMoveButton label={page.previous} onClick={() => moveStage(-1)}>
              <ChevronUp className="h-4 w-4" />
            </StageMoveButton>
            <StageMoveButton label={page.next} onClick={() => moveStage(1)}>
              <ChevronDown className="h-4 w-4" />
            </StageMoveButton>
          </div>

          <div className="order-2 min-w-0 lg:order-1" data-feature-rail>
            <div className="grid gap-2">
              {page.stages.map((stage, index) => {
                const isActive = activeIndex === index;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`group w-full min-w-0 rounded-[1.35rem] border text-left transition duration-300 motion-reduce:transition-none ${
                      isActive
                        ? "border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] px-3.5 py-3 shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
                        : "min-h-11 border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-[var(--public-muted)] hover:border-[var(--public-border-strong)] hover:text-[var(--public-text)]"
                    }`}
                    aria-pressed={isActive}
                    data-stage-pill={stage.id}
                  >
                    <span className="flex min-w-0 items-start gap-2.5">
                      <span
                        className="mt-[0.0625rem] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--public-border)] bg-[var(--public-bg)]/55"
                        data-stage-indicator
                      >
                        {isActive ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold tracking-tight">
                          {stage.shortTitle}
                        </span>
                        {isActive && (
                          <span className="mt-2.5 block">
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)]">
                              {stage.eyebrow}
                            </span>
                            <span className="mt-1.5 block text-[13px]/[1.35rem] text-[var(--public-muted)]">
                              {stage.body}
                            </span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="order-1 min-h-[23rem] min-w-0 lg:order-2 lg:min-h-[34rem]">
            <MediaScene stage={activeStage} assetSummary={assetSummary} />
          </div>
        </div>

        <div className="flex justify-center gap-2 pb-1 lg:hidden">
          <StageMoveButton label={page.previous} onClick={() => moveStage(-1)}>
            <ChevronUp className="h-4 w-4" />
          </StageMoveButton>
          <StageMoveButton label={page.next} onClick={() => moveStage(1)}>
            <ChevronDown className="h-4 w-4" />
          </StageMoveButton>
        </div>
      </div>
    </section>
  );
}

function StageMoveButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--public-border)] bg-[var(--public-surface-strong)] text-[var(--public-text)] shadow-[0_12px_36px_rgba(0,0,0,0.14)] transition hover:border-[var(--public-border-strong)] hover:bg-[var(--public-text)] hover:text-[var(--public-bg)]"
    >
      {children}
    </button>
  );
}

function MediaScene({ stage, assetSummary }: { stage: MediaStage; assetSummary: string }) {
  return (
    <div
      className="relative h-full min-h-[23rem] overflow-hidden rounded-[2.2rem] lg:min-h-[34rem]"
      data-media-scene
      data-media-mode={stage.mediaMode}
      data-asset-hints={assetSummary}
    >
      <div className={`absolute inset-0 transition duration-700 motion-reduce:transition-none ${sceneAtmosphere(stage.id)}`} />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[var(--public-bg)]/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--public-bg)]/70 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center px-2 sm:px-4 lg:justify-end lg:px-0">
        <SkyvanMediaObject activeId={stage.id} />
      </div>

      <div className="pointer-events-none absolute left-5 top-5 max-w-[12rem] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--public-muted)] sm:left-7 sm:top-7">
        {stage.hotspotLabel}
      </div>
    </div>
  );
}

function SkyvanMediaObject({ activeId }: { activeId: StageId }) {
  return (
    <div
      className={`relative aspect-[1.78] w-[min(112%,54rem)] max-w-none transition duration-700 motion-reduce:transition-none lg:translate-x-[2%] ${objectTurn(activeId)}`}
      data-media-object
    >
      <div className="absolute inset-x-[5%] top-[16%] bottom-[7%] rounded-[999px] bg-[radial-gradient(circle_at_52%_48%,color-mix(in_srgb,var(--public-text)_13%,transparent),transparent_46%)] blur-3xl" />

      <div className="absolute inset-x-[4%] top-[24%] bottom-[18%] rounded-[4.2rem] border border-[color-mix(in_srgb,var(--public-border-strong)_72%,var(--public-text)_28%)] bg-[linear-gradient(145deg,var(--public-surface-strong),var(--public-surface)_56%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-44px_80px_rgba(0,0,0,0.13),0_38px_120px_rgba(0,0,0,0.2)] md:rounded-[6rem]" />
      <div className="absolute right-[6%] top-[28%] h-[45%] w-[22%] rounded-r-[4.2rem] border border-l-0 border-[color-mix(in_srgb,var(--public-border)_72%,var(--public-text)_28%)] bg-[linear-gradient(120deg,color-mix(in_srgb,var(--public-text)_10%,transparent),transparent_60%)] md:rounded-r-[6rem]" />
      <div className="absolute left-[14%] right-[24%] top-[38%] h-[20%] rounded-[999px] border border-[color-mix(in_srgb,var(--public-border)_72%,var(--public-text)_28%)] bg-[var(--public-bg)]/36" />
      <div className="absolute bottom-[17%] left-[25%] h-[6%] w-[10%] rounded-full border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[var(--public-surface-strong)]" />
      <div className="absolute bottom-[17%] right-[25%] h-[6%] w-[10%] rounded-full border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[var(--public-surface-strong)]" />

      <MediaLayer active={activeId === "route"} className="left-[12%] top-[29%] h-[23%] w-[45%]">
        <span className="absolute left-0 top-[54%] h-[4%] w-[82%] origin-left rotate-[-7deg] rounded-full bg-[var(--public-text)]/72" />
        <span className="absolute left-0 top-[43%] h-[18%] w-[8%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
        <span className="absolute right-[11%] top-[30%] h-[18%] w-[8%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
      </MediaLayer>

      <MediaLayer active={activeId === "living"} className="left-[34%] top-[36%] h-[26%] w-[29%]">
        <span className="absolute inset-0 rounded-[1.8rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/88 shadow-[0_0_44px_color-mix(in_srgb,var(--public-text)_16%,transparent)]" />
        <span className="absolute left-[13%] top-[17%] h-[28%] w-[31%] rounded-2xl bg-[var(--public-bg)]/58" />
        <span className="absolute right-[13%] top-[17%] h-[28%] w-[31%] rounded-2xl bg-[var(--public-bg)]/38" />
        <span className="absolute inset-x-[13%] bottom-[16%] h-[24%] rounded-2xl bg-[var(--public-bg)]/46" />
      </MediaLayer>

      <MediaLayer active={activeId === "risk"} className="right-[21%] top-[29%] h-[20%] w-[15%]">
        <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/90 shadow-[0_0_54px_color-mix(in_srgb,var(--public-text)_18%,transparent)]" />
        <span className="absolute left-1/2 top-[21%] h-[38%] w-px -translate-x-1/2 rounded-full bg-[var(--public-text)]" />
        <span className="absolute bottom-[22%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--public-text)]" />
      </MediaLayer>

      <MediaLayer active={activeId === "ai"} className="left-[44%] top-[48%] h-[25%] w-[15%]">
        <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[radial-gradient(circle,var(--public-surface-strong),transparent_66%)] shadow-[0_0_62px_color-mix(in_srgb,var(--public-text)_22%,transparent)]" />
        <span className="absolute inset-[17%] rounded-full border border-[var(--public-border)]" />
        <span className="absolute inset-[39%] rounded-full bg-[var(--public-text)]" />
      </MediaLayer>

      <MediaLayer active={activeId === "production"} className="right-[8%] top-[58%] h-[17%] w-[37%]">
        <span className="absolute left-0 top-1/2 h-[5%] w-full -translate-y-1/2 rounded-full bg-[var(--public-text)]/74" />
        <span className="absolute right-0 top-[18%] h-[64%] w-[20%] rounded-[1.2rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/88" />
        <span className="absolute right-[6%] top-[33%] h-[10%] w-[8%] rounded-full bg-[var(--public-bg)]/62" />
      </MediaLayer>

      <MediaLayer active={activeId === "approval"} className="left-[18%] top-[59%] h-[18%] w-[13%]">
        <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/92 shadow-[0_0_46px_color-mix(in_srgb,var(--public-text)_18%,transparent)]" />
        <span className="absolute left-[31%] top-[48%] h-[6%] w-[17%] rotate-45 rounded-full bg-[var(--public-text)]" />
        <span className="absolute left-[43%] top-[43%] h-[6%] w-[34%] -rotate-45 rounded-full bg-[var(--public-text)]" />
      </MediaLayer>
    </div>
  );
}

function MediaLayer({
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
        active ? "scale-110 opacity-100" : "scale-100 opacity-[0.34]"
      }`}
    >
      {children}
    </div>
  );
}

function objectTurn(activeId: StageId) {
  if (activeId === "route") {
    return "scale-[0.92] rotate-[-1deg]";
  }

  if (activeId === "ai") {
    return "scale-[0.98]";
  }

  if (activeId === "approval") {
    return "scale-[0.93] translate-y-1";
  }

  return "scale-[0.94]";
}

function sceneAtmosphere(activeId: StageId) {
  if (activeId === "ai") {
    return "bg-[radial-gradient(circle_at_58%_47%,color-mix(in_srgb,var(--public-text)_13%,transparent),transparent_36%),radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--public-text)_5%,transparent),transparent_34%)]";
  }

  if (activeId === "risk") {
    return "bg-[radial-gradient(circle_at_63%_39%,color-mix(in_srgb,var(--public-text)_11%,transparent),transparent_30%),radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--public-text)_5%,transparent),transparent_34%)]";
  }

  if (activeId === "approval") {
    return "bg-[radial-gradient(circle_at_52%_48%,color-mix(in_srgb,var(--public-text)_14%,transparent),transparent_36%),radial-gradient(circle_at_50%_100%,color-mix(in_srgb,var(--public-text)_6%,transparent),transparent_34%)]";
  }

  return "bg-[radial-gradient(circle_at_56%_46%,color-mix(in_srgb,var(--public-text)_10%,transparent),transparent_37%),linear-gradient(180deg,var(--public-bg),var(--public-bg-soft))]";
}
