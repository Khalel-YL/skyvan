"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Cpu, Factory, ShieldCheck, UserCheck } from "lucide-react";

type ExperienceLocale = "tr" | "en";

type ExperienceStep = {
  title: string;
  eyebrow: string;
  body: string;
  signals: string[];
};

const content = {
  tr: {
    intro: "Bir karavan kararı böyle başlar.",
    kicker: "Skyvan deneyim prototipi",
    lead: "Bir rota fikri, yaşam alışkanlığı ve teknik sınırlar birlikte okununca üretime hazırlanabilir bir karara dönüşür.",
    visualTitle: "Karar hazırlık sistemi",
    visualSubtitle: "Bağlamdan üretim netliğine",
    disclaimer: "Bu sistem karar vermez",
    steps: [
      {
        title: "Rota",
        eyebrow: "01 / Başlangıç",
        body: "Yolculuğun ritmi, iklimi ve kullanım süresi kararın ilk bağlamını kurar.",
        signals: ["Rota profili", "Mevsim", "Süre"],
      },
      {
        title: "Yaşam",
        eyebrow: "02 / Kullanım",
        body: "Günlük alışkanlıklar, depolama ihtiyacı ve konfor beklentisi yaşam düzenine çevrilir.",
        signals: ["Uyku", "Mutfak", "Depolama"],
      },
      {
        title: "Teknik risk",
        eyebrow: "03 / Görünürlük",
        body: "Belirsiz teknik başlıklar karar verilmeden önce ayrıştırılır ve görünür hale gelir.",
        signals: ["Ağırlık", "Enerji", "Su"],
      },
      {
        title: "Skyvan AI",
        eyebrow: "04 / Bağlam",
        body: "AI bir sohbet aracı değildir; eksik bağlamı ve risk işaretlerini daha okunur hale getirir.",
        signals: ["Eksik bağlam görünür hale gelir", "Riskler işaretlenir"],
      },
      {
        title: "Üretim hazırlığı",
        eyebrow: "05 / Netlik",
        body: "Netleşen karar başlıkları üretim öncesi hazırlık düzenine taşınır.",
        signals: ["Kapsam", "Öncelik", "Hazırlık"],
      },
      {
        title: "İnsan onayı",
        eyebrow: "06 / Kontrol",
        body: "Final yön, teknik disiplin ve insan onayıyla belirlenir.",
        signals: ["Onay", "Kontrol", "Güven"],
      },
    ],
  },
  en: {
    intro: "A caravan decision starts like this.",
    kicker: "Skyvan experience prototype",
    lead: "A route idea becomes production-ready when usage habits, living needs, and technical boundaries are read together.",
    visualTitle: "Decision preparation system",
    visualSubtitle: "From context to production clarity",
    disclaimer: "This system does not decide",
    steps: [
      {
        title: "Route",
        eyebrow: "01 / Start",
        body: "Travel rhythm, climate, and duration create the first decision context.",
        signals: ["Route profile", "Season", "Duration"],
      },
      {
        title: "Living",
        eyebrow: "02 / Usage",
        body: "Daily habits, storage needs, and comfort expectations become a living layout.",
        signals: ["Sleep", "Kitchen", "Storage"],
      },
      {
        title: "Technical risk",
        eyebrow: "03 / Visibility",
        body: "Unclear technical topics are separated and surfaced before a decision is made.",
        signals: ["Weight", "Energy", "Water"],
      },
      {
        title: "Skyvan AI",
        eyebrow: "04 / Context",
        body: "AI is not a chat tool; it makes missing context and risk signals easier to read.",
        signals: ["Missing context becomes visible", "Risks are surfaced"],
      },
      {
        title: "Production readiness",
        eyebrow: "05 / Clarity",
        body: "Clarified decisions move into a preparation layer before production.",
        signals: ["Scope", "Priority", "Preparation"],
      },
      {
        title: "Human approval",
        eyebrow: "06 / Control",
        body: "The final direction stays grounded in technical discipline and human approval.",
        signals: ["Approval", "Control", "Trust"],
      },
    ],
  },
} satisfies Record<ExperienceLocale, {
  intro: string;
  kicker: string;
  lead: string;
  visualTitle: string;
  visualSubtitle: string;
  disclaimer: string;
  steps: ExperienceStep[];
}>;

const sceneLayerLabels = {
  tr: ["Rota yolu", "Yaşam modülü", "Risk işareti", "AI bağlam çekirdeği", "Üretim hattı", "İnsan onayı"],
  en: ["Route path", "Living module", "Risk marker", "AI context core", "Production line", "Human approval"],
} satisfies Record<ExperienceLocale, string[]>;

export function ExperienceStoryPage({ locale }: { locale: ExperienceLocale }) {
  const page = content[locale];
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          const nextStep = Number(visibleEntry.target.getAttribute("data-step-index"));

          if (Number.isInteger(nextStep)) {
            setActiveStep(nextStep);
          }
        }
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    const stepNodes = stepRefs.current.filter((node): node is HTMLDivElement => node !== null);

    for (const node of stepNodes) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-x-clip bg-[var(--public-bg)] text-[var(--public-text)]">
      <section className="flex min-h-[72vh] items-center px-5 py-24 text-center md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-muted)]">
            {page.kicker}
          </p>
          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-[var(--public-text)] sm:text-6xl md:text-7xl">
            {page.intro}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
            {page.lead}
          </p>
        </div>
      </section>

      <section className="px-5 pb-24 md:px-8 md:pb-32">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)] lg:gap-16">
          <div className="order-2 lg:order-1">
            {page.steps.map((step, index) => (
              <div
                key={step.title}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                data-step-index={index}
                className={`min-h-[58vh] border-l py-12 pl-6 transition duration-500 ease-out motion-reduce:transition-none md:pl-8 lg:flex lg:flex-col lg:justify-center ${
                  activeStep === index
                    ? "translate-x-0 border-[var(--public-border-strong)] opacity-100"
                    : "translate-x-1 border-[var(--public-border)] opacity-45"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)]">
                  {step.eyebrow}
                </p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-[var(--public-text)] md:text-6xl">
                  {step.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-[var(--public-muted)] md:text-lg">
                  {step.body}
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {step.signals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface)]/55 px-3 py-1 text-xs text-[var(--public-muted)]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-28">
              <div className="relative overflow-hidden rounded-[2.6rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-4 shadow-[0_34px_110px_rgba(0,0,0,0.18)] md:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.09),transparent_48%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.075] [background-image:linear-gradient(var(--public-border)_1px,transparent_1px),linear-gradient(90deg,var(--public-border)_1px,transparent_1px)] [background-size:32px_32px]" />

                <div className="relative min-h-[34rem] rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-bg)]/48 p-5 md:min-h-[43rem] md:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--public-muted)]">
                        {page.visualSubtitle}
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--public-text)] md:text-3xl">
                        {page.visualTitle}
                      </h2>
                    </div>
                    <p className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--public-muted)]">
                      {page.disclaimer}
                    </p>
                  </div>

                  <div
                    data-experience-scene
                    className="relative mt-12 aspect-[0.88] min-h-[24rem] md:mt-14 md:aspect-[1.08]"
                  >
                    <div className="absolute inset-x-[7%] top-[12%] bottom-[9%] rounded-[4rem] border border-[var(--public-border-strong)] bg-[linear-gradient(145deg,var(--public-surface-strong),transparent_68%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-30px_70px_rgba(0,0,0,0.08),0_34px_90px_rgba(0,0,0,0.16)]" />
                    <div className="absolute left-[12%] right-[12%] top-[25%] h-[44%] rounded-[999px] border border-[var(--public-border)] bg-[var(--public-surface)]/42 blur-[0.2px]" />
                    <div className="absolute left-[17%] right-[17%] top-[38%] h-px bg-[var(--public-border)]" />
                    <div className="absolute bottom-[15%] left-[24%] h-3 w-3 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
                    <div className="absolute bottom-[15%] right-[24%] h-3 w-3 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />

                    <SceneLayer
                      active={activeStep === 0}
                      revealed={activeStep >= 0}
                      className="left-[13%] top-[25%] w-[45%] rotate-[-8deg]"
                      label={sceneLayerLabels[locale][0]}
                    >
                      <div className="relative h-20">
                        <div className="absolute left-0 top-9 h-1 w-full rounded-full bg-[var(--public-text)]/70" />
                        <div className="absolute left-0 top-7 h-5 w-5 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
                        <div className="absolute right-0 top-7 h-5 w-5 rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]" />
                      </div>
                    </SceneLayer>

                    <SceneLayer
                      active={activeStep === 1}
                      revealed={activeStep >= 1}
                      className="left-[31%] top-[35%] w-[34%]"
                      label={sceneLayerLabels[locale][1]}
                    >
                      <div className="grid h-28 grid-cols-2 gap-2 rounded-[1.5rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                        <span className="rounded-2xl bg-[var(--public-bg)]/55" />
                        <span className="rounded-2xl bg-[var(--public-bg)]/35" />
                        <span className="col-span-2 rounded-2xl bg-[var(--public-bg)]/45" />
                      </div>
                    </SceneLayer>

                    <SceneLayer
                      active={activeStep === 2}
                      revealed={activeStep >= 2}
                      className="right-[17%] top-[27%] w-[24%]"
                      label={sceneLayerLabels[locale][2]}
                    >
                      <div className="flex h-24 items-center justify-center rounded-[1.4rem] border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]/90">
                        <ShieldCheck className="h-9 w-9 text-[var(--public-text)]" />
                      </div>
                    </SceneLayer>

                    <SceneLayer
                      active={activeStep === 3}
                      revealed={activeStep >= 3}
                      className="left-[38%] top-[47%] w-[25%]"
                      label={sceneLayerLabels[locale][3]}
                    >
                      <div className="relative flex aspect-square items-center justify-center rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] shadow-[0_0_50px_rgba(255,255,255,0.12)]">
                        <div className="absolute inset-3 rounded-full border border-[var(--public-border)]" />
                        <Cpu className="h-8 w-8 text-[var(--public-text)]" />
                      </div>
                    </SceneLayer>

                    <SceneLayer
                      active={activeStep === 4}
                      revealed={activeStep >= 4}
                      className="right-[8%] bottom-[24%] w-[42%]"
                      label={sceneLayerLabels[locale][4]}
                    >
                      <div className="relative h-20">
                        <div className="absolute left-0 top-9 h-1 w-full rounded-full bg-[var(--public-text)]/70" />
                        <Factory className="absolute right-0 top-0 h-9 w-9 text-[var(--public-text)]" />
                      </div>
                    </SceneLayer>

                    <SceneLayer
                      active={activeStep === 5}
                      revealed={activeStep >= 5}
                      className="left-[17%] bottom-[14%] w-[25%]"
                      label={sceneLayerLabels[locale][5]}
                    >
                      <div className="flex aspect-square items-center justify-center rounded-full border border-[var(--public-border-strong)] bg-[var(--public-surface-strong)]">
                        <UserCheck className="h-9 w-9 text-[var(--public-text)]" />
                      </div>
                    </SceneLayer>

                    <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-4 py-2 text-xs font-semibold text-[var(--public-muted)]">
                      <span>{String(activeStep + 1).padStart(2, "0")}</span>
                      <span className="h-px w-8 bg-[var(--public-border)]" />
                      <span>{page.steps[activeStep]?.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SceneLayer({
  active,
  revealed,
  className,
  label,
  children,
}: {
  active: boolean;
  revealed: boolean;
  className: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute transition duration-500 ease-out motion-reduce:transition-none ${className} ${
        revealed ? "opacity-100" : "opacity-20"
      } ${active ? "scale-105 drop-shadow-[0_0_26px_rgba(255,255,255,0.18)]" : "scale-100"}`}
    >
      <div
        className={`transition duration-500 ease-out motion-reduce:transition-none ${
          active ? "brightness-110" : "brightness-90"
        }`}
      >
        {children}
      </div>
      <p
        className={`mt-3 w-max max-w-[12rem] rounded-full border px-3 py-1 text-xs font-semibold transition duration-500 ease-out motion-reduce:transition-none ${
          active
            ? "border-[var(--public-border-strong)] bg-[var(--public-surface-strong)] text-[var(--public-text)] opacity-100"
            : "border-[var(--public-border)] bg-[var(--public-surface)] text-[var(--public-muted)] opacity-0"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
