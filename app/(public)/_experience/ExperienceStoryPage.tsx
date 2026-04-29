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
        title: "Önce rota belirir.",
        line: "Yolculuğun ritmi kararın ilk yüzeyini çizer.",
      },
      {
        key: "living",
        title: "Sonra yaşam düzeni şekillenir.",
        line: "Günlük alışkanlıklar soyut fikirden kullanılabilir düzene dönüşür.",
      },
      {
        key: "risk",
        title: "Risk erken görünür olur.",
        line: "Ağırlık, enerji ve su gibi sınırlar karar verilmeden önce işaretlenir.",
      },
      {
        key: "ai",
        title: "Skyvan AI bağlamı görünür kılar; karar vermez.",
        line: "Eksik bilgi ve hazırlık sınırları sohbet olmadan, girdi istemeden okunur.",
      },
      {
        key: "production",
        title: "Hazırlık üretim diline yaklaşır.",
        line: "Netleşen karar başlıkları kontrollü bir üretim öncesi düzene taşınır.",
      },
      {
        key: "approval",
        title: "Son söz insan onayıyla kalır.",
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
        title: "First, the route appears.",
        line: "The rhythm of travel draws the first surface of the decision.",
      },
      {
        key: "living",
        title: "Then living takes shape.",
        line: "Daily habits move from abstract idea into a usable layout.",
      },
      {
        key: "risk",
        title: "Risk becomes visible early.",
        line: "Weight, energy, and water boundaries are surfaced before a decision is made.",
      },
      {
        key: "ai",
        title: "Skyvan AI makes context visible; it does not decide.",
        line: "Missing inputs and preparation boundaries are read without chat, prompts, or user input.",
      },
      {
        key: "production",
        title: "Preparation moves toward production language.",
        line: "Clarified decisions become a controlled pre-production structure.",
      },
      {
        key: "approval",
        title: "Final approval stays human-led.",
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
        <div className="sticky top-0 flex min-h-svh items-center overflow-hidden px-5 py-10 md:px-8">
          <div
            className={`pointer-events-none absolute inset-0 transition duration-1000 motion-reduce:transition-none ${getSceneAtmosphere(page.scenes[activeStep]?.key)}`}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--public-bg)] to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--public-bg)] to-transparent" />

          <div className="relative mx-auto flex h-[calc(100svh-5rem)] w-full max-w-7xl flex-col items-center justify-center gap-8">
            <DecisionVessel activeKey={page.scenes[activeStep]?.key ?? "route"} />

            <div className="min-h-[11rem] w-full max-w-5xl text-center md:min-h-[13rem]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--public-muted)]">
                {String(activeStep + 1).padStart(2, "0")} / {String(page.scenes.length).padStart(2, "0")}
              </p>
              <div className="relative mt-5">
                {page.scenes.map((scene, index) => (
                  <div
                    key={scene.key}
                    className={`transition duration-700 ease-out motion-reduce:transition-none ${
                      activeStep === index
                        ? "relative translate-y-0 opacity-100"
                        : "pointer-events-none absolute inset-x-0 top-0 translate-y-5 opacity-0"
                    }`}
                  >
                    <h2 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.03] tracking-tight text-[var(--public-text)] md:text-7xl">
                      {scene.title}
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                      {scene.line}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2" aria-hidden="true">
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
      className={`relative aspect-[1.78] w-full max-w-[62rem] transition duration-1000 ease-out motion-reduce:transition-none ${getVesselTransform(activeKey)}`}
    >
      <div className="absolute inset-x-[4%] top-[8%] bottom-[3%] rounded-[999px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.2),transparent_42%)] blur-3xl" />

      <div className="absolute inset-x-[3%] top-[20%] bottom-[16%] rounded-[5rem] border border-[var(--public-border-strong)] bg-[linear-gradient(145deg,var(--public-surface-strong),var(--public-surface)_58%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-48px_90px_rgba(0,0,0,0.12),0_40px_130px_rgba(0,0,0,0.22)] md:rounded-[7rem]" />
      <div className="absolute right-[5%] top-[24%] h-[50%] w-[22%] rounded-r-[5rem] border border-l-0 border-[var(--public-border)] bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_58%)] md:rounded-r-[7rem]" />
      <div className="absolute left-[13%] right-[22%] top-[34%] h-[23%] rounded-[999px] border border-[var(--public-border)] bg-[var(--public-bg)]/38" />
      <div className="absolute left-[20%] right-[30%] top-[46%] h-px bg-[var(--public-border-strong)]" />
      <div className="absolute bottom-[15%] left-[24%] h-[6%] w-[10%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)]" />
      <div className="absolute bottom-[15%] right-[24%] h-[6%] w-[10%] rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)]" />

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
    return "scale-[0.95] -translate-y-1";
  }

  if (activeKey === "ai") {
    return "scale-[1.03]";
  }

  if (activeKey === "approval") {
    return "scale-[0.98] translate-y-1";
  }

  return "scale-100";
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
