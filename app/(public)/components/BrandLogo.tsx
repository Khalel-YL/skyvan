"use client";

import Image from "next/image";
import { useState } from "react";

type BrandLogoVariant = "emblem" | "logo";
type BrandLogoTone = "dark" | "light" | "auto";
type BrandLogoSize = "sm" | "md" | "lg" | "hero" | "headerEmblem" | "footer";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  tone?: BrandLogoTone;
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  showTextFallback?: boolean;
};

const DARK_BACKGROUND_ASSET_TONE: Exclude<BrandLogoTone, "auto"> = "dark";
const LIGHT_BACKGROUND_ASSET_TONE: Exclude<BrandLogoTone, "auto"> = "light";

const sizeMap: Record<
  BrandLogoSize,
  Record<BrandLogoVariant, { width: number; height: number; className: string }>
> = {
  sm: {
    emblem: { width: 32, height: 32, className: "h-8 w-8" },
    logo: { width: 128, height: 28, className: "h-7 w-32" },
  },

  headerEmblem: {
    emblem: {
      width: 64,
      height: 64,
      className: "h-10 w-10 md:h-12 md:w-12",
    },
    logo: {
      width: 168,
      height: 38,
      className: "h-8 w-[8.25rem] md:h-9 md:w-[10rem]",
    },
  },

  md: {
    emblem: { width: 40, height: 40, className: "h-10 w-10" },
    logo: { width: 176, height: 40, className: "h-10 w-44" },
  },

  lg: {
    emblem: { width: 56, height: 56, className: "h-14 w-14" },
    logo: { width: 240, height: 54, className: "h-14 w-60" },
  },

  hero: {
    emblem: { width: 96, height: 96, className: "h-24 w-24" },
    logo: { width: 448, height: 96, className: "h-24 w-full max-w-md" },
  },

  footer: {
    emblem: {
      width: 96,
      height: 96,
      className: "h-24 w-24",
    },
    logo: {
      width: 900,
      height: 260,
      className: "h-28 w-full max-w-[22rem] md:h-32 md:w-[24rem] md:max-w-none",
    },
  },
};

function getAssetPath(
  variant: BrandLogoVariant,
  tone: Exclude<BrandLogoTone, "auto">,
  size: BrandLogoSize,
) {
  if (size === "headerEmblem" && variant === "emblem") {
    return `/brand/web/header-emblem-${tone}.png`;
  }

  if (size === "footer" && variant === "logo") {
    return `/brand/web/footer-logo-${tone}.png`;
  }

  return `/brand/${variant}/${variant}-${tone}.svg`;
}

function getFallbackClass(variant: BrandLogoVariant, size: BrandLogoSize) {
  if (variant === "emblem") {
    return size === "sm" ? "text-[10px]" : size === "hero" ? "text-sm" : "text-xs";
  }

  return size === "sm" ? "text-xs" : size === "hero" ? "text-xl" : "text-base";
}

export function BrandLogo({
  variant = "emblem",
  tone = "auto",
  size = "md",
  className = "",
  priority = false,
  showTextFallback = true,
}: BrandLogoProps) {
  const [failedAssets, setFailedAssets] = useState<Record<string, boolean>>({});
  const config = sizeMap[size][variant];
  const fallbackText = variant === "emblem" ? "SV" : "Skyvan";
  const fallbackClass = getFallbackClass(variant, size);

  const renderImage = (
    assetTone: Exclude<BrandLogoTone, "auto">,
    visibilityClass = "",
  ) => {
    const src = getAssetPath(variant, assetTone, size);

    if (failedAssets[src]) {
      return null;
    }

    return (
      <Image
        src={src}
        alt="Skyvan"
        width={config.width}
        height={config.height}
        priority={priority}
        onError={() =>
          setFailedAssets((current) => ({
            ...current,
            [src]: true,
          }))
        }
        className={`${config.className} max-w-full object-contain ${visibilityClass}`}
      />
    );
  };

  const shouldShowFallback =
    showTextFallback &&
    (tone === "auto"
      ? failedAssets[getAssetPath(variant, DARK_BACKGROUND_ASSET_TONE, size)] &&
        failedAssets[getAssetPath(variant, LIGHT_BACKGROUND_ASSET_TONE, size)]
      : failedAssets[getAssetPath(variant, tone, size)]);

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center justify-center overflow-visible ${className}`}
    >
      {tone === "auto" ? (
        <span className="brand-logo-auto inline-grid max-w-full items-center justify-center overflow-visible">
          {renderImage(
            LIGHT_BACKGROUND_ASSET_TONE,
            "brand-logo-light-background col-start-1 row-start-1",
          )}
          {renderImage(
            DARK_BACKGROUND_ASSET_TONE,
            "brand-logo-dark-background col-start-1 row-start-1",
          )}
        </span>
      ) : (
        renderImage(tone)
      )}

      {shouldShowFallback ? (
        <span className={`font-semibold tracking-tight text-[var(--public-text)] ${fallbackClass}`}>
          {fallbackText}
        </span>
      ) : null}
    </span>
  );
}
