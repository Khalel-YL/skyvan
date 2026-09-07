import type { PublicBlockMedia } from "./launch-content";
import { getSafePublicMedia } from "./public-media-surface";

export const publicLaunchAssets = {
  "exterior-light": { src: "/images/skyvan/concepts/exterior-light.webp", width: 1672, height: 941 },
  "exterior-dark": { src: "/images/skyvan/concepts/exterior-dark.webp", width: 1672, height: 941 },
  "exterior-landscape": { src: "/images/skyvan/concepts/exterior-landscape.webp", width: 1672, height: 941 },
  lounge: { src: "/images/skyvan/concepts/lounge.webp", width: 1672, height: 941 },
  alcove: { src: "/images/skyvan/concepts/alcove.webp", width: 1672, height: 941 },
  toilet: { src: "/images/skyvan/concepts/toilet.webp", width: 1122, height: 1402 },
  shower: { src: "/images/skyvan/concepts/shower.webp", width: 1122, height: 1402 },
  "ufuk-day": {
    src: "/images/skyvan/models-v2/ufuk-day.webp",
    width: 1536,
    height: 1024,
    modelId: "ufuk",
    scene: "day",
    pairId: "ufuk-lounge-conversion-v2",
    alt: {
      tr: "Ufuk: U oturum, yükseltilmiş masa ve zemine bağlı teleskopik ayak; gündüz görünümü.",
      en: "Ufuk concept: U lounge, raised table and floor-mounted telescopic pedestal in day mode.",
    },
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
    src: "/images/skyvan/models-v2/ufuk-night.webp",
    width: 1536,
    height: 1024,
    modelId: "ufuk",
    scene: "night",
    pairId: "ufuk-lounge-conversion-v2",
    alt: {
      tr: "Ufuk: aynı U oturumun yatağa dönüşmüş hali; masa ayağı yatak altında bağlı kalıyor.",
      en: "Ufuk concept: the same U lounge converted for sleep, with the pedestal retained beneath the bed.",
    },
  },
  "engineering-automation": {
    src: "/images/skyvan/models-v2/engineering-automation.webp",
    width: 1536,
    height: 1024,
    alt: {
      tr: "Karavan girişinde küçük kontrol ekranı ve fiziksel anahtarlar için arayüz konsepti.",
      en: "Interface concept for a small entry-area control screen and physical switches.",
    },
  },
  "engineering-connectors": {
    src: "/images/skyvan/models-v2/engineering-connectors.webp",
    width: 1536,
    height: 1024,
    alt: {
      tr: "Kompakt su dağıtım başlığı, bağlantı bilezikleri, vanalar ve sabitleme klipsleri detayı.",
      en: "Detail study of a compact water manifold, connector collars, valves and retaining clips.",
    },
  },
  "engineering-roof": {
    src: "/images/skyvan/models-v2/engineering-roof.webp",
    width: 1672,
    height: 941,
    alt: {
      tr: "Skyvan gövde konseptinin düz tavanında dört panel ve açık bırakılmış tavan açıklıkları.",
      en: "Four-panel arrangement study on a Skyvan body concept, with roof openings left clear.",
    },
  },
} as const;

export type PublicLaunchAssetId = keyof typeof publicLaunchAssets;
export type PublicLaunchMediaRole =
  | "launch.hero"
  | "launch.engineering"
  | "editorial.about.hero"
  | "editorial.living.hero"
  | "editorial.engineering.hero"
  | "editorial.system.hero"
  | "editorial.process.hero"
  | "editorial.production.hero";

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
