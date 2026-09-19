"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import {
  publicLaunchAssets,
  type PublicLaunchAssetId,
} from "../lib/public-launch-media";
import type { PublicLocale } from "../lib/public-routing";

type HeroScene = {
  asset: PublicLaunchAssetId;
  label: Record<PublicLocale, string>;
  alt: Record<PublicLocale, string>;
  motion: "push-right" | "push-left" | "rise" | "settle";
};

const heroScenes: readonly HeroScene[] = [
  {
    asset: "exterior-dark",
    label: { tr: "Dış görünüş", en: "Exterior" },
    motion: "push-right",
    alt: {
      tr: "Skyvan amblemli antrasit alkovenli karavanın stüdyo dış görünüşü.",
      en: "Studio exterior view of an anthracite Skyvan overcab motorhome.",
    },
  },
  {
    asset: "interior-first-view",
    label: { tr: "İç yaşam", en: "Living space" },
    motion: "settle",
    alt: {
      tr: "U oturum, mutfak, alkoven ve ön görüş ilişkisini gösteren Skyvan iç mekânı.",
      en: "Skyvan interior showing the U lounge, galley, overcab bed and forward view.",
    },
  },
  {
    asset: "lounge-table",
    label: { tr: "Günlük dönüşüm", en: "Daily transformation" },
    motion: "rise",
    alt: {
      tr: "Skyvan U oturumunda yükseltilmiş elektrikli masa ve yaşam alanı konsepti.",
      en: "Skyvan U lounge concept with a raised electric table and living space.",
    },
  },
  {
    asset: "electrical-rear-service",
    label: { tr: "Mühendislik", en: "Engineering" },
    motion: "push-left",
    alt: {
      tr: "Skyvan arka elektrik servis bölmesinde inverter, MPPT ve akü yerleşimi konsepti.",
      en: "Skyvan rear electrical service concept with inverter, MPPT and battery layout.",
    },
  },
];

export function PublicHeroSequence({ locale }: { locale: PublicLocale }): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroScenes.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [paused]);

  const activeScene = heroScenes[activeIndex];

  return (
    <div
      className="sv-hero-sequence"
      role="region"
      aria-label={locale === "tr" ? "Skyvan görsel hikâyesi" : "Skyvan visual story"}
    >
      <div className="sv-hero-sequence-scenes">
        {heroScenes.map((scene, index) => {
          const asset = publicLaunchAssets[scene.asset];

          return (
            <div
              className={`sv-hero-sequence-slide ${index === activeIndex ? "is-active" : ""} ${paused ? "is-paused" : ""}`}
              key={scene.asset}
              data-motion={scene.motion}
              aria-hidden={index !== activeIndex}
            >
              <Image
                src={asset.src}
                alt={index === activeIndex ? scene.alt[locale] : ""}
                fill
                sizes="100vw"
                priority={index === 0}
                quality={88}
              />
            </div>
          );
        })}
      </div>

      <div className="sv-hero-sequence-caption" aria-live="polite">
        <span>{locale === "tr" ? "Sahne" : "Scene"} {String(activeIndex + 1).padStart(2, "0")} / {String(heroScenes.length).padStart(2, "0")}</span>
        <strong>{activeScene.label[locale]}</strong>
      </div>

      <div className="sv-hero-sequence-controls">
        <div className="sv-hero-sequence-progress" role="group" aria-label={locale === "tr" ? "Sahneler" : "Scenes"}>
          {heroScenes.map((scene, index) => (
            <button
              type="button"
              aria-pressed={index === activeIndex}
              aria-label={`${String(index + 1).padStart(2, "0")} — ${scene.label[locale]}`}
              className={`sv-hero-sequence-progress-item ${index === activeIndex ? "is-active" : ""} ${paused ? "is-paused" : ""}`}
              key={scene.asset}
              onClick={() => setActiveIndex(index)}
            >
              <span aria-hidden="true" />
              <span>{scene.label[locale]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="sv-hero-sequence-toggle"
          aria-label={paused ? (locale === "tr" ? "Görsel akışı oynat" : "Play visual sequence") : (locale === "tr" ? "Görsel akışını durdur" : "Pause visual sequence")}
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
