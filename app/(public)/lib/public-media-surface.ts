import type { PublicBlock, PublicBlockMedia, PublicPageContent } from "./launch-content";

export const publicMediaSlotNames = [
  "homepage.hero.background",
  "homepage.hero.poster",
  "homepage.orbit.surface",
  "homepage.visualTrust.media",
  "homepage.workshop.preview",
  "homepage.finalCta.background",
  "experience.hero.media",
  "experience.route.media",
  "mediaLab.featured.media",
  "mediaLab.gallery.preview",
] as const;

export type PublicMediaSlotName = (typeof publicMediaSlotNames)[number];
export type PublicMediaSurfaceMap = Partial<Record<PublicMediaSlotName, PublicBlockMedia>>;

const publicMediaSlots = new Set<PublicMediaSlotName>(publicMediaSlotNames);
const supportedMediaTypes = new Set<PublicBlockMedia["mediaType"]>([
  "image",
  "video",
  "model3d",
]);
const supportedProviders = new Set<NonNullable<PublicBlockMedia["provider"]>>([
  "direct",
  "youtube",
  "vimeo",
  "external",
]);

function isSafeHttpUrl(value: string | undefined) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isPublicMediaSlotName(value: string): value is PublicMediaSlotName {
  return publicMediaSlots.has(value as PublicMediaSlotName);
}

export function getSafePublicMedia(media: PublicBlockMedia | undefined) {
  if (!media || !supportedMediaTypes.has(media.mediaType) || !isSafeHttpUrl(media.url)) {
    return null;
  }

  if (media.provider && !supportedProviders.has(media.provider)) {
    return null;
  }

  return {
    ...media,
    title: media.title.trim() || "Skyvan",
    altText: media.altText?.trim() || media.title.trim() || "Skyvan",
    previewUrl: isSafeHttpUrl(media.previewUrl) ? media.previewUrl : undefined,
    embedUrl: isSafeHttpUrl(media.embedUrl) ? media.embedUrl : undefined,
    surfaceSlot:
      media.surfaceSlot && isPublicMediaSlotName(media.surfaceSlot)
        ? media.surfaceSlot
        : undefined,
  };
}

function getBlockMedia(block: PublicBlock) {
  return block.type === "hero" ? getSafePublicMedia(block.media) : null;
}

export function resolvePublicMediaSurfaces(page: PublicPageContent): PublicMediaSurfaceMap {
  const surfaces: PublicMediaSurfaceMap = {};
  for (const block of page.blocks) {
    const media = getBlockMedia(block);

    if (media?.surfaceSlot) {
      surfaces[media.surfaceSlot] = media;
    }
  }

  const heroBlock = page.blocks.find((block) => block.type === "hero");
  const heroMedia = heroBlock?.type === "hero" ? getSafePublicMedia(heroBlock.media) : null;

  if (heroMedia) {
    if (page.slug === "") {
      surfaces["homepage.hero.poster"] ??= heroMedia;
      surfaces["homepage.hero.background"] ??= heroMedia;
      surfaces["homepage.orbit.surface"] ??= heroMedia;
    } else if (page.slug.includes("deneyim") || page.slug.includes("experience")) {
      surfaces["experience.hero.media"] ??= heroMedia;
      surfaces["experience.route.media"] ??= heroMedia;
    } else if (page.slug.includes("medya-lab") || page.slug.includes("media-lab")) {
      surfaces["mediaLab.featured.media"] ??= heroMedia;
    }
  }

  for (const block of page.blocks) {
    const media = getBlockMedia(block);

    if (!media) {
      continue;
    }

    if (page.slug === "") {
      surfaces["homepage.hero.poster"] ??= media;
    }
  }

  return surfaces;
}

export function getPublicMediaForSlot(
  surfaces: PublicMediaSurfaceMap,
  slotName: PublicMediaSlotName,
) {
  return getSafePublicMedia(surfaces[slotName]);
}
