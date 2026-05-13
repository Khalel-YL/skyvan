import type { PublicBlockMedia } from "../lib/launch-content";
import { getSafePublicMedia } from "../lib/public-media-surface";

type PublicMediaSurfaceProps = {
  media: PublicBlockMedia | null | undefined;
  className?: string;
  visualClassName?: string;
};

export function PublicMediaSurface({
  media,
  className = "",
  visualClassName = "",
}: PublicMediaSurfaceProps) {
  const safeMedia = getSafePublicMedia(media ?? undefined);

  if (!safeMedia) {
    return null;
  }

  const imageUrl = safeMedia.previewUrl || safeMedia.url;

  if (safeMedia.mediaType === "image") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Public media can be admin-managed external URLs. */}
        <img
          src={imageUrl}
          alt={safeMedia.altText}
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
          alt={safeMedia.altText}
          className={`h-full w-full object-cover ${visualClassName}`}
        />
      </div>
    );
  }

  return null;
}
