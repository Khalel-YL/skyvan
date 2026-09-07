import Image from "next/image";
import type { PublicBlockMedia } from "../lib/launch-content";
import {
  getApprovedCmsLaunchMedia,
  publicLaunchAssets,
  type PublicLaunchAssetId,
  type PublicLaunchMediaRole,
} from "../lib/public-launch-media";
import { PublicMediaSurface } from "./PublicMediaSurface";

export function PublicConceptMedia({ name, alt, className = "", sizes = "(max-width: 767px) 100vw, 60vw", priority = false, media, mediaRole }: {
  name: PublicLaunchAssetId; alt: string; className?: string; sizes?: string; priority?: boolean; media?: PublicBlockMedia | null;
  mediaRole?: { role: PublicLaunchMediaRole; modelId?: string; pairId?: string };
}): React.JSX.Element {
  const asset = publicLaunchAssets[name];
  const approvedMedia = mediaRole ? getApprovedCmsLaunchMedia(media, mediaRole) : null;
  const fallback = <Image src={asset.src} alt={alt} fill sizes={sizes} priority={priority} />;
  return <div className={`sv-image ${className}`}>{approvedMedia ? <PublicMediaSurface key={approvedMedia.url} media={approvedMedia} fallback={fallback} /> : fallback}</div>;
}

export function PublicVehicleMedia({ alt, media }: { alt: string; media?: PublicBlockMedia | null }): React.JSX.Element {
  return <div className="sv-vehicle-media"><PublicConceptMedia name="exterior-light" alt={alt} className="sv-in-light" sizes="100vw" priority media={media} mediaRole={{ role: "launch.hero" }} /><PublicConceptMedia name="exterior-dark" alt={alt} className="sv-in-dark" sizes="100vw" priority media={media} mediaRole={{ role: "launch.hero" }} /></div>;
}
