"use client";

import { useState } from "react";
import { Moon, PanelsTopLeft, Sun } from "lucide-react";
import type { PublicLaunchCopy } from "../lib/public-launch-copy";
import { publicLaunchAssets, type PublicLaunchAssetId } from "../lib/public-launch-media";
import type { PublicLocale } from "../lib/public-routing";
import { PublicConceptMedia } from "./PublicConceptMedia";

type LivingState = "day" | "conversion" | "night";

export function PublicLivingGallery({ copy, concept, locale, editorial = false }: { copy: PublicLaunchCopy["product"]; concept: string; locale: PublicLocale; editorial?: boolean }): React.JSX.Element {
  const [state, setState] = useState<LivingState>("day");
  const states: Array<{
    id: LivingState;
    asset: Extract<PublicLaunchAssetId, "ufuk-day" | "ufuk-conversion" | "ufuk-night">;
    label: string;
    description: string;
    icon: typeof Sun;
  }> = [
    { id: "day", asset: "ufuk-day", label: copy.day, description: copy.dayBody, icon: Sun },
    { id: "conversion", asset: "ufuk-conversion", label: copy.conversion, description: copy.conversionBody, icon: PanelsTopLeft },
    { id: "night", asset: "ufuk-night", label: copy.night, description: copy.nightBody, icon: Moon },
  ];
  const selected = states.find((item) => item.id === state) ?? states[0];
  const asset = publicLaunchAssets[selected.asset];
  const editorialAlt = locale === "tr"
    ? `Skyvan oturum ve dönüşüm konsept çalışması, ${selected.label.toLocaleLowerCase("tr-TR")} görünümü.`
    : `Skyvan seating and conversion concept study in ${selected.label.toLowerCase()} mode.`;

  return <div className="sv-living-gallery">
    <figure>
      <PublicConceptMedia name={selected.asset} alt={editorial ? editorialAlt : asset.alt[locale]} className="sv-lounge-frame" sizes="(max-width: 767px) 100vw, 92vw" />
      <figcaption className="sv-gallery-caption">
        <div role="group" aria-label={editorial ? locale === "tr" ? "Yaşam alanı konsept durumu" : "Living-space concept state" : copy.galleryLabel} className="sv-layout-switch">
          {states.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} type="button" aria-pressed={state === item.id} onClick={() => setState(item.id)}><Icon size={16} aria-hidden="true" />{item.label}</button>;
          })}
        </div>
        <span className="sv-concept-label">{editorial ? locale === "tr" ? "Skyvan konsept çalışması" : "Skyvan concept study" : `${copy.model} · ${concept}`}</span>
      </figcaption>
    </figure>
    <p className="sv-gallery-description" aria-live="polite">{selected.description}</p>
    {editorial ? <p className="sv-living-validation">{locale === "tr" ? "Yerleşim ve uygulanabilirlik araç bağlamında doğrulanır." : "Layout and feasibility are validated in the context of the vehicle."}</p> : <div className="sv-space-gallery">{copy.spaces.map((space) => <figure key={space.image}><PublicConceptMedia name={space.image} alt={space.alt} className="sv-space-image" sizes="(max-width: 767px) 90vw, 30vw" /><figcaption><h3>{space.title}</h3><p>{space.body}</p><span className="sv-concept-label">{concept}</span></figcaption></figure>)}</div>}
  </div>;
}

export function PublicLivingConceptStudies({ copy, locale, images }: { copy: PublicLaunchCopy["product"]; locale: PublicLocale; images: Array<"alcove" | "toilet" | "shower"> }): React.JSX.Element {
  const studies = copy.spaces.filter((space) => images.includes(space.image));
  return <div className={`sv-living-studies ${studies.length === 1 ? "sv-living-studies-single" : ""}`}>
    <div className="sv-living-studies-grid">{studies.map((study) => <figure key={study.image}>
      <PublicConceptMedia name={study.image} alt={study.alt} className="sv-living-study-image" sizes={studies.length === 1 ? "(max-width: 767px) 90vw, 52vw" : "(max-width: 767px) 90vw, 26vw"} />
      <figcaption><h3>{study.title}</h3><p>{study.body}</p><span className="sv-concept-label">{locale === "tr" ? "Skyvan konsept çalışması" : "Skyvan concept study"}</span></figcaption>
    </figure>)}</div>
    <p className="sv-living-validation">{locale === "tr" ? "Yerleşim ve uygulanabilirlik araç bağlamında doğrulanır." : "Layout and feasibility are validated in the context of the vehicle."}</p>
  </div>;
}
