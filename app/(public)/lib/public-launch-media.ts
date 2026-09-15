import type { PublicBlockMedia, PublicSemanticMediaRole } from "./launch-content";
import { getSafePublicMedia } from "./public-media-surface";
import {
  skyvanMediaCatalog,
  type SkyvanMediaCatalogKey,
} from "@/app/lib/skyvan-media-catalog";

function catalogAsset(key: SkyvanMediaCatalogKey) {
  const asset = skyvanMediaCatalog[key];

  return {
    src: asset.path,
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
  } as const;
}

export const publicLaunchAssets = {
  "exterior-light": catalogAsset("exterior-landscape"),
  "exterior-dark": catalogAsset("hero-studio"),
  "exterior-landscape": catalogAsset("exterior-landscape"),
  lounge: catalogAsset("interior-first-view"),
  // The existing alcove room image remains the accurate room study. The new
  // `alcove-layers` asset is an explanatory infographic and is exposed below
  // as a separate visual instead of being substituted into the room gallery.
  alcove: {
    src: "/images/skyvan/concepts/alcove.webp",
    width: 1672,
    height: 941,
    alt: {
      tr: "Skyvan alkovenli karavanın kabin üstü yatak bölümünün konsept tasarımı.",
      en: "Skyvan concept sleeping area above the motorhome cab.",
    },
  },
  toilet: catalogAsset("toilet-separate"),
  shower: catalogAsset("shower-separate"),
  "interior-first-view": catalogAsset("interior-first-view"),
  "kitchen-transition": catalogAsset("kitchen-transition"),
  "lounge-table": catalogAsset("lounge-table"),
  "lounge-bed": catalogAsset("lounge-bed"),
  "water-clean-service": catalogAsset("water-clean-service"),
  "water-grey-service": catalogAsset("water-grey-service"),
  "electrical-rear-service": catalogAsset("electrical-rear-service"),
  "electrical-cabinet": catalogAsset("electrical-cabinet"),
  "roof-equipment": catalogAsset("roof-equipment"),
  "control-centre": catalogAsset("control-centre-concept"),
  "boiler-service": catalogAsset("boiler-service"),
  "alcove-layers": catalogAsset("alcove-layers"),
  "ufuk-day": {
    ...catalogAsset("lounge-table"),
    modelId: "ufuk",
    scene: "day",
    pairId: "ufuk-lounge-conversion-v2",
  },
  "ufuk-conversion": {
    src: "/images/skyvan/models-v2/ufuk-conversion.webp",
    width: 1536,
    height: 1024,
    modelId: "ufuk",
    scene: "conversion",
    pairId: "ufuk-lounge-conversion-v2",
    alt: {
      tr: "Ufuk: kısmen alçaltılmış masa, görünen teleskopik ayak ve açılan yatak destekleri.",
      en: "Ufuk concept: partially lowered table, visible telescopic pedestal and extending bed supports.",
    },
  },
  "ufuk-night": {
    ...catalogAsset("lounge-bed"),
    modelId: "ufuk",
    scene: "night",
    pairId: "ufuk-lounge-conversion-v2",
  },
  "engineering-automation": {
    ...catalogAsset("control-centre-concept"),
  },
  "engineering-connectors": {
    ...catalogAsset("water-clean-service"),
  },
  "engineering-roof": {
    ...catalogAsset("roof-equipment"),
  },
} as const;

export type PublicLaunchAssetId = keyof typeof publicLaunchAssets;
export type PublicLaunchMediaRole = PublicSemanticMediaRole;

type ApprovedCmsLaunchMedia = {
  role: PublicLaunchMediaRole;
  mediaId: string;
  url: string;
  modelId?: string;
  pairId?: string;
};

// URL safety is necessary but not semantic approval. Keep this empty until a
// public editor explicitly approves an exact CMS identity for a role/model.
const approvedCmsLaunchMedia: readonly ApprovedCmsLaunchMedia[] = [];

export function getApprovedCmsLaunchMedia(
  candidate: PublicBlockMedia | null | undefined,
  request: { role: PublicLaunchMediaRole; modelId?: string; pairId?: string },
) {
  const safeMedia = getSafePublicMedia(candidate ?? undefined);
  if (!safeMedia) {
    return null;
  }

  const approval = approvedCmsLaunchMedia.find(
    (item) =>
      item.role === request.role &&
      item.mediaId === safeMedia.mediaId &&
      item.url === safeMedia.url &&
      item.modelId === request.modelId &&
      item.pairId === request.pairId,
  );

  return approval ? safeMedia : null;
}
