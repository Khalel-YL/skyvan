"use client";

import { useState, type ReactNode } from "react";
import type { PublicBlockMedia } from "../lib/launch-content";
import { getSafePublicMedia } from "../lib/public-media-surface";

type PublicMediaSurfaceProps = {
  media: PublicBlockMedia | null | undefined;
  className?: string;
  visualClassName?: string;
  fallback?: ReactNode;
};

export function PublicMediaSurface({
  media,
  className = "",
  visualClassName = "",
  fallback = null,
}: PublicMediaSurfaceProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const safeMedia = getSafePublicMedia(media ?? undefined);

  if (!safeMedia || failedUrl === safeMedia.url) {
    return fallback;
  }

  const imageUrl = safeMedia.previewUrl || safeMedia.url;

  if (safeMedia.mediaType === "image") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Public media can be admin-managed external URLs. */}
        <img
          src={imageUrl}
          alt={safeMedia.altText || safeMedia.title}
          onError={() => setFailedUrl(safeMedia.url)}
          className={`h-full w-full object-cover ${visualClassName}`}
        />
      </div>
    );
  }

  if (safeMedia.mediaType === "video" && safeMedia.provider === "direct") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        <video
          className={`h-full w-full object-cover ${visualClassName}`}
          poster={safeMedia.previewUrl}
          onError={() => setFailedUrl(safeMedia.url)}
          muted
          playsInline
          loop
          preload="metadata"
          aria-label={safeMedia.title}
        >
          <source src={safeMedia.url} />
        </video>
      </div>
    );
  }

  if (safeMedia.previewUrl) {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Public media previews can be admin-managed external URLs. */}
        <img
          src={safeMedia.previewUrl}
          alt={safeMedia.altText || safeMedia.title}
          onError={() => setFailedUrl(safeMedia.url)}
          className={`h-full w-full object-cover ${visualClassName}`}
        />
      </div>
    );
  }

  return fallback;
}
