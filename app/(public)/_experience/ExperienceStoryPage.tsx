"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ExperienceLocale = "tr" | "en";
type SceneKey = "route" | "living" | "risk" | "ai" | "production" | "approval";

type ExperienceScene = {
  key: SceneKey;
  title: string;
  line: string;
};

const content = {
  tr: {
    kicker: "Skyvan deneyim prototipi",
    opening: "Karavan kararı, yalnızca bir seçim değildir.",
    lead: "Rota, yaşam, risk ve üretim hazırlığı aynı anda görünür olduğunda karar sakinleşir.",
    scenes: [
      {
        key: "route",
        title: "Rota",
        line: "Yolculuğun ritmi kararın ilk yüzeyini çizer.",
      },
      {
        key: "living",
        title: "Yaşam",
        line: "Günlük alışkanlıklar soyut fikirden kullanılabilir düzene dönüşür.",
      },
      {
        key: "risk",
        title: "Teknik risk",
        line: "Ağırlık, enerji ve su gibi sınırlar karar verilmeden önce işaretlenir.",
      },
      {
        key: "ai",
        title: "Skyvan AI",
        line: "Skyvan AI bağlamı görünür kılar; karar vermez.",
      },
      {
        key: "production",
        title: "Üretim hazırlığı",
        line: "Netleşen karar başlıkları kontrollü bir üretim öncesi düzene taşınır.",
      },
      {
        key: "approval",
        title: "İnsan onayı",
        line: "Skyvan yönü hazırlar; final karar güven ve teknik disiplinle verilir.",
      },
    ],
  },
  en: {
    kicker: "Skyvan experience prototype",
    opening: "A caravan decision is not just a choice.",
    lead: "When route, living, risk, and production readiness become visible together, the decision becomes calmer.",
    scenes: [
      {
        key: "route",
        title: "Route",
        line: "The rhythm of travel draws the first surface of the decision.",
      },
      {
        key: "living",
        title: "Living",
        line: "Daily habits move from abstract idea into a usable layout.",
      },
      {
        key: "risk",
        title: "Technical risk",
        line: "Weight, energy, and water boundaries are surfaced before a decision is made.",
      },
      {
        key: "ai",
        title: "Skyvan AI",
        line: "Skyvan AI makes context visible; it does not decide.",
      },
      {
        key: "production",
        title: "Production readiness",
        line: "Clarified decisions become a controlled pre-production structure.",
      },
      {
        key: "approval",
        title: "Human approval",
        line: "Skyvan prepares direction; the final decision stays grounded in trust and technical discipline.",
      },
    ],
  },
} satisfies Record<
  ExperienceLocale,
  {
    kicker: string;
    opening: string;
    lead: string;
    scenes: ExperienceScene[];
  }
>;

export function ExperienceStoryPage({ locale }: { locale: ExperienceLocale }) {
  const page = content[locale];
  const [activeStep, setActiveStep] = useState(0);
  const sceneRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const nextStep = Number(visibleEntry.target.getAttribute("data-scene-index"));

        if (Number.isInteger(nextStep)) {
          setActiveStep(nextStep);
        }
      },
      {
        rootMargin: "-42% 0px -42% 0px",
        threshold: [0.15, 0.35, 0.6],
      },
    );

    const sceneNodes = sceneRefs.current.filter((node): node is HTMLDivElement => node !== null);

    for (const node of sceneNodes) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <main className="overflow-x-clip bg-[var(--public-bg)] text-[var(--public-text)]">
      <section className="flex min-h-svh items-center justify-center px-5 py-24 text-center md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--public-muted)]">
            {page.kicker}
          </p>
          <h1 className="mx-auto mt-9 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight text-[var(--public-text)] sm:text-6xl md:text-8xl">
            {page.opening}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
            {page.lead}
          </p>
        </div>
      </section>

      <section className="relative">
        <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center overflow-hidden px-4 py-3 sm:px-5 sm:py-5 md:px-8">
          <div
            className={`pointer-events-none absolute inset-0 transition duration-1000 motion-reduce:transition-none ${getSceneAtmosphere(page.scenes[activeStep]?.key)}`}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--public-bg)] to-transparent md:h-28" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--public-bg)] to-transparent md:h-28" />

          <div className="relative mx-auto grid h-full w-full max-w-7xl grid-rows-[minmax(11rem,1fr)_auto] items-center gap-3 pb-8 sm:grid-rows-[minmax(14rem,1fr)_auto] sm:gap-5 sm:pb-10 md:gap-6">
            <div className="flex min-h-0 items-end justify-center sm:items-center">
              <DecisionVessel activeKey={page.scenes[activeStep]?.key ?? "route"} />
            </div>

            <div className="min-h-[9.25rem] w-full min-w-0 text-center sm:min-h-[10.5rem] md:min-h-[12rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--public-muted)] sm:text-xs sm:tracking-[0.28em]">
                {String(activeStep + 1).padStart(2, "0")} / {String(page.scenes.length).padStart(2, "0")}
              </p>
              <div className="relative mt-3 sm:mt-5">
                {page.scenes.map((scene, index) => (
                  <div
                    key={scene.key}
                    className={`transition duration-700 ease-out motion-reduce:transition-none ${
                      activeStep === index
                        ? "relative translate-y-0 opacity-100"
                        : "pointer-events-none absolute inset-x-0 top-0 translate-y-5 opacity-0"
                    }`}
                  >
                    <h2 className="mx-auto max-w-4xl text-3xl font-semibold leading-[1.05] tracking-tight text-[var(--public-text)] sm:text-4xl md:text-5xl lg:text-6xl">
                      {scene.title}
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--public-muted)] sm:mt-4 sm:text-base sm:leading-7 md:text-lg md:leading-8">
                      {scene.line}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="absolute bottom-[max(0.875rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-2"
              aria-hidden="true"
              data-experience-progress
            >
              {page.scenes.map((scene, index) => (
                <span
                  key={scene.key}
                  className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                    activeStep === index
                      ? "w-10 bg-[var(--public-text)]"
                      : "w-1.5 bg-[var(--public-border-strong)]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10" aria-hidden="true">
          {page.scenes.map((scene, index) => (
            <div
              key={scene.key}
              ref={(node) => {
                sceneRefs.current[index] = node;
              }}
              data-scene-index={index}
              className="h-svh"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function DecisionVessel({ activeKey }: { activeKey: SceneKey }) {
  return (
    <div
      data-experience-scene
      className={`relative aspect-[1.78] w-[min(100%,52rem)] max-h-[42svh] transition duration-1000 ease-out motion-reduce:transition-none ${getVesselTransform(activeKey)}`}
    >
      <div className="absolute inset-x-[4%] top-[10%] bottom-[2%] rounded-[999px] bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--public-text)_13%,transparent),transparent_42%)] blur-3xl" />

      <div className="absolute inset-x-[4%] top-[22%] bottom-[17%] rounded-[4rem] border border-[color-mix(in_srgb,var(--public-border-strong)_78%,var(--public-text)_22%)] bg-[linear-gradient(145deg,var(--public-surface-strong),var(--public-surface)_58%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-42px_78px_rgba(0,0,0,0.12),0_34px_110px_rgba(0,0,0,0.2)] md:rounded-[6rem]" />
      <div className="absolute right-[6%] top-[26%] h-[47%] w-[21%] rounded-r-[4rem] border border-l-0 border-[color-mix(in_srgb,var(--public-border)_72%,var(--public-text)_28%)] bg-[linear-gradient(120deg,color-mix(in_srgb,var(--public-text)_9%,transparent),transparent_58%)] md:rounded-r-[6rem]" />
      <div className="absolute left-[14%] right-[23%] top-[36%] h-[21%] rounded-[999px] border border-[color-mix(in_srgb,var(--public-border)_72%,var(--public-text)_28%)] bg-[var(--public-bg)]/38" />
      <div className="absolute left-[21%] right-[31%] top-[47%] h-px bg-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)]" />
      <div className="absolute bottom-[16%] left-[25%] h-[6%] w-[10%] rounded-full border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[var(--public-surface-strong)] shadow-[0_10px_26px_rgba(0,0,0,0.14)]" />
      <div className="absolute bottom-[16%] right-[25%] h-[6%] w-[10%] rounded-full border border-[color-mix(in_srgb,var(--public-border-strong)_74%,var(--public-text)_26%)] bg-[var(--public-surface-strong)] shadow-[0_10px_26px_rgba(0,0,0,0.14)]" />

      <VesselLayer active={activeKey === "route"} revealed={true} className="left-[12%] top-[28%] h-[22%] w-[43%]">
        <span className="absolute left-0 top-[52%] h-[4%] w-[78%] origin-left rotate-[-7deg] rounded-full bg-[var(--public-text)]/70" />
        <span className="absolute left-0 top-[42%] h-[18%] w-[9%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
        <span className="absolute right-[14%] top-[29%] h-[18%] w-[9%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
      </VesselLayer>

      <VesselLayer active={activeKey === "living"} revealed={activeKey !== "route"} className="left-[34%] top-[35%] h-[25%] w-[28%]">
        <span className="absolute inset-0 rounded-[2rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/86" />
        <span className="absolute left-[13%] top-[17%] h-[28%] w-[30%] rounded-2xl bg-[var(--public-bg)]/58" />
        <span className="absolute right-[13%] top-[17%] h-[28%] w-[30%] rounded-2xl bg-[var(--public-bg)]/38" />
        <span className="absolute inset-x-[13%] bottom-[16%] h-[24%] rounded-2xl bg-[var(--public-bg)]/46" />
      </VesselLayer>

      <VesselLayer active={activeKey === "risk"} revealed={["risk", "ai", "production", "approval"].includes(activeKey)} className="right-[22%] top-[29%] h-[19%] w-[14%]">
        <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/88" />
        <span className="absolute left-1/2 top-[21%] h-[38%] w-px -translate-x-1/2 rounded-full bg-[var(--public-text)]" />
        <span className="absolute bottom-[22%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--public-text)]" />
      </VesselLayer>

      <VesselLayer active={activeKey === "ai"} revealed={["ai", "production", "approval"].includes(activeKey)} className="left-[44%] top-[48%] h-[24%] w-[14%]">
        <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[radial-gradient(circle,var(--public-surface-strong),transparent_66%)]" />
        <span className="absolute inset-[18%] rounded-full border border-[var(--public-border)]" />
        <span className="absolute inset-[39%] rounded-full bg-[var(--public-text)]" />
      </VesselLayer>

      <VesselLayer active={activeKey === "production"} revealed={["production", "approval"].includes(activeKey)} className="right-[8%] top-[57%] h-[17%] w-[36%]">
        <span className="absolute left-0 top-1/2 h-[5%] w-full -translate-y-1/2 rounded-full bg-[var(--public-text)]/72" />
        <span className="absolute right-0 top-[18%] h-[64%] w-[20%] rounded-[1.2rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/86" />
        <span className="absolute right-[6%] top-[33%] h-[10%] w-[8%] rounded-full bg-[var(--public-bg)]/60" />
      </VesselLayer>

      <VesselLayer active={activeKey === "approval"} revealed={activeKey === "approval"} className="left-[18%] top-[58%] h-[18%] w-[12%]">
        <span className="absolute inset-0 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/92" />
        <span className="absolute left-[31%] top-[48%] h-[6%] w-[17%] rotate-45 rounded-full bg-[var(--public-text)]" />
        <span className="absolute left-[43%] top-[43%] h-[6%] w-[34%] -rotate-45 rounded-full bg-[var(--public-text)]" />
      </VesselLayer>
    </div>
  );
}

function VesselLayer({
  active,
  revealed,
  className,
  children,
}: {
  active: boolean;
  revealed: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute transition duration-1000 ease-out motion-reduce:transition-none ${className} ${
        revealed ? "opacity-100" : "opacity-0"
      } ${active ? "scale-110 drop-shadow-[0_0_42px_rgba(255,255,255,0.22)]" : "scale-100 opacity-55"}`}
    >
      {children}
    </div>
  );
}

function getVesselTransform(activeKey: SceneKey) {
  if (activeKey === "route") {
    return "scale-[0.91] translate-y-2";
  }

  if (activeKey === "ai") {
    return "scale-[0.97] translate-y-1";
  }

  if (activeKey === "approval") {
    return "scale-[0.94] translate-y-2";
  }

  return "scale-[0.94] translate-y-1";
}

function getSceneAtmosphere(activeKey: SceneKey | undefined) {
  if (activeKey === "ai") {
    return "bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_50%_88%,rgba(255,255,255,0.07),transparent_32%)]";
  }

  if (activeKey === "risk") {
    return "bg-[radial-gradient(circle_at_58%_40%,rgba(255,255,255,0.13),transparent_30%),radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.06),transparent_36%)]";
  }

  if (activeKey === "approval") {
    return "bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.18),transparent_36%),radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.08),transparent_36%)]";
  }

  return "bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_50%_95%,rgba(255,255,255,0.06),transparent_38%)]";
}
