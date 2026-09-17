import type { PublicLocale } from "../lib/public-routing";
import {
  publicLaunchAssets,
  type PublicLaunchAssetId,
} from "../lib/public-launch-media";
import { BrandLogo } from "./BrandLogo";
import { PublicConceptMedia } from "./PublicConceptMedia";

type EngineeringAssetId = Extract<
  PublicLaunchAssetId,
  | "engineering-insulation-service"
  | "engineering-solar-panel"
  | "engineering-solar-cable"
  | "engineering-solar-combiner"
  | "engineering-marine-cable"
  | "engineering-water-filter"
  | "engineering-water-pump"
  | "engineering-water-manifold"
>;

export type EngineeringVisualCard = {
  asset: EngineeringAssetId;
  title: { tr: string; en: string };
  summary: { tr: string; en: string };
};

function getAssetAlt(assetId: EngineeringAssetId, locale: PublicLocale): string {
  const asset = publicLaunchAssets[assetId];
  return "alt" in asset ? String(asset.alt[locale]) : "";
}

export function PublicEngineeringVisualRail({
  cards,
  locale,
}: {
  cards: readonly EngineeringVisualCard[];
  locale: PublicLocale;
}): React.JSX.Element | null {
  if (cards.length === 0) return null;

  const isTurkish = locale === "tr";
  const count = String(cards.length).padStart(2, "0");

  return (
    <div
      className={`sv-engineering-visual-rail sv-engineering-visual-rail-${Math.min(cards.length, 3)}`}
      role="group"
      aria-label={isTurkish ? "Mühendislik teknik görselleri" : "Engineering technical visuals"}
    >
      <div className="sv-engineering-visual-rail-head">
        <p className="sv-eyebrow">{isTurkish ? "Teknik detay" : "Technical detail"}</p>
        <span>{isTurkish ? `Skyvan mühendislik / ${count} çalışma` : `Skyvan engineering / ${count} studies`}</span>
      </div>
      <div className="sv-engineering-visual-grid">
        {cards.map((card, index) => (
          <figure className={`sv-engineering-visual-card ${index === 0 ? "is-featured" : ""}`} key={card.asset}>
            <div className="sv-engineering-visual-frame">
              <PublicConceptMedia
                name={card.asset}
                alt={getAssetAlt(card.asset, locale)}
                className="sv-engineering-visual-media sv-image-contain"
                sizes={cards.length === 1 ? "(max-width: 767px) 90vw, 62vw" : "(max-width: 767px) 90vw, 42vw"}
              />
              <span className="sv-engineering-visual-watermark" aria-hidden="true">
                <BrandLogo variant="emblem" tone="light" size="sm" showTextFallback={false} />
              </span>
              <span className="sv-engineering-visual-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <figcaption>
              <div>
                <span className="sv-engineering-visual-label">{isTurkish ? "Konsept çalışma" : "Concept study"}</span>
                <h3>{card.title[locale]}</h3>
              </div>
              <p>{card.summary[locale]}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="sv-engineering-visual-note">
        {isTurkish
          ? "Konsept görselleri açıklama içindir; ölçü, ürün seçimi veya montaj onayı yerine geçmez."
          : "Concept visuals explain the approach; they are not dimensions, product selections or installation approvals."}
      </p>
    </div>
  );
}

