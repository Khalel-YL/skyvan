export type MediaType = "image" | "video" | "model3d";
export type MediaUsageScope = "public" | "admin" | "workshop" | "product" | "general";
export type MediaProvider = "direct" | "youtube" | "vimeo" | "external";

export type MediaContentJson = {
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  modelUrl?: string;
  title?: string;
  description?: string;
  altText?: string;
  tags: string[];
  focusPoint?: { x: number; y: number };
  isFeatured?: boolean;
  usageScope?: MediaUsageScope;
  provider?: MediaProvider;
  embedUrl?: string;
  uploadDate?: string;
};

export type MediaAsset = {
  id: string;
  title: string;
  locale: string;
  content: MediaContentJson;
  previewUrl: string;
  primaryUrl: string;
  hasValidUrl: boolean;
  usageLabels: string[];
};

const mediaTypes = new Set<MediaType>(["image", "video", "model3d"]);
const providers = new Set<MediaProvider>(["direct", "youtube", "vimeo", "external"]);
const usageScopes = new Set<MediaUsageScope>([
  "public",
  "admin",
  "workshop",
  "product",
  "general",
]);

export const mediaTypeLabels: Record<MediaType, string> = {
  image: "Görsel",
  video: "Video",
  model3d: "3D",
};

export const usageScopeLabels: Record<MediaUsageScope, string> = {
  public: "Public",
  admin: "Admin",
  workshop: "Workshop",
  product: "Ürün",
  general: "Genel",
};

export function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function detectDirectVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    return [".mp4", ".webm", ".mov", ".m4v", ".ogv"].some((extension) =>
      pathname.endsWith(extension),
    );
  } catch {
    return false;
  }
}

export function detectModelFileExtension(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    if (pathname.endsWith(".glb")) {
      return "GLB";
    }

    if (pathname.endsWith(".gltf")) {
      return "GLTF";
    }

    return null;
  } catch {
    return null;
  }
}

export function detectModel3dUrl(url: string) {
  return Boolean(detectModelFileExtension(url));
}

export function extractYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(hostname)) {
      return null;
    }

    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v") || null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if ((parts[0] === "shorts" || parts[0] === "embed") && parts[1]) {
      return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

export function detectYouTubeUrl(url: string) {
  return Boolean(extractYouTubeVideoId(url));
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function extractVimeoVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : null;
    }

    if (hostname !== "vimeo.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = [...parts].reverse().find((part) => /^\d+$/.test(part));

    return id || null;
  } catch {
    return null;
  }
}

export function detectVimeoUrl(url: string) {
  return Boolean(extractVimeoVideoId(url));
}

export function getVimeoEmbedUrl(videoId: string) {
  return `https://player.vimeo.com/video/${videoId}`;
}

export function classifyVideoProvider(url: string): MediaProvider {
  if (detectYouTubeUrl(url)) {
    return "youtube";
  }

  if (detectVimeoUrl(url)) {
    return "vimeo";
  }

  if (detectDirectVideoUrl(url)) {
    return "direct";
  }

  return "external";
}

export function normalizeTags(value: string) {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const tag of value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const key = tag.toLocaleLowerCase("tr-TR");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(tag);
  }

  return tags.slice(0, 12);
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function optionalString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function normalizeMediaType(value: unknown): MediaType {
  const raw = cleanString(value).toLowerCase();
  return mediaTypes.has(raw as MediaType) ? (raw as MediaType) : "image";
}

function normalizeUsageScope(value: unknown): MediaUsageScope {
  const raw = cleanString(value).toLowerCase();
  return usageScopes.has(raw as MediaUsageScope) ? (raw as MediaUsageScope) : "general";
}

function normalizeProvider(value: unknown, url: string): MediaProvider | undefined {
  const raw = cleanString(value).toLowerCase();

  if (providers.has(raw as MediaProvider)) {
    return raw as MediaProvider;
  }

  if (!url) {
    return undefined;
  }

  return classifyVideoProvider(url);
}

function normalizeFocusPoint(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const x = Number(raw.x);
  const y = Number(raw.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return undefined;
  }

  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
}

export function normalizeMediaContent(value: unknown, fallbackTitle = ""): MediaContentJson {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const mediaType = normalizeMediaType(raw.mediaType);
  const modelUrl = optionalString(raw.modelUrl);
  const url = cleanString(raw.url || modelUrl);
  const provider = mediaType === "video" ? normalizeProvider(raw.provider, url) : undefined;
  const youtubeId = provider === "youtube" ? extractYouTubeVideoId(url) : null;
  const vimeoId = provider === "vimeo" ? extractVimeoVideoId(url) : null;
  const embedUrl =
    provider === "youtube"
      ? optionalString(raw.embedUrl) || (youtubeId ? getYouTubeEmbedUrl(youtubeId) : undefined)
      : provider === "vimeo"
        ? optionalString(raw.embedUrl) || (vimeoId ? getVimeoEmbedUrl(vimeoId) : undefined)
      : optionalString(raw.embedUrl);
  const youtubeThumbnail = youtubeId ? getYouTubeThumbnailUrl(youtubeId) : undefined;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => cleanString(tag)).filter(Boolean).slice(0, 12)
    : [];

  return {
    mediaType,
    url,
    thumbnailUrl: optionalString(raw.thumbnailUrl) || youtubeThumbnail,
    posterUrl: optionalString(raw.posterUrl) || youtubeThumbnail,
    modelUrl,
    title: optionalString(raw.title) || optionalString(fallbackTitle),
    description: optionalString(raw.description),
    altText: optionalString(raw.altText),
    tags,
    focusPoint: normalizeFocusPoint(raw.focusPoint),
    isFeatured: raw.isFeatured === true,
    usageScope: normalizeUsageScope(raw.usageScope),
    provider,
    embedUrl,
    uploadDate: optionalString(raw.uploadDate),
  };
}

export function getMediaPrimaryUrl(content: MediaContentJson) {
  return content.mediaType === "model3d" ? content.modelUrl || content.url : content.url;
}

export function getMediaPreviewUrl(content: MediaContentJson) {
  if (content.mediaType === "image") {
    return content.thumbnailUrl || content.url;
  }

  if (content.mediaType === "video") {
    return content.posterUrl || content.thumbnailUrl || "";
  }

  return content.thumbnailUrl || content.posterUrl || "";
}
