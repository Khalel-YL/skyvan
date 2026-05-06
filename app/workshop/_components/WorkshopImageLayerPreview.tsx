"use client";

import { useMemo, useState } from "react";

import type { WorkshopRenderLayer, WorkshopRenderPlan } from "../_lib/workshop-render-contract";

type WorkshopImageLayerPreviewProps = {
  plan: WorkshopRenderPlan;
  enabled?: boolean;
  className?: string;
};

function getLayerKey(layer: WorkshopRenderLayer, index: number) {
  return [
    layer.id || "katman",
    layer.modelId,
    layer.productId,
    layer.cameraView,
    layer.zIndexLayer,
    layer.sourceUrl,
    layer.fallbackUrl ?? "",
    index,
  ].join(":");
}

export default function WorkshopImageLayerPreview({
  plan,
  enabled = true,
  className = "",
}: WorkshopImageLayerPreviewProps) {
  const [fallbackLayerKeys, setFallbackLayerKeys] = useState<Record<string, boolean>>({});
  const [failedLayerKeys, setFailedLayerKeys] = useState<Record<string, boolean>>({});

  const imageLayers = useMemo(
    () =>
      plan.orderedLayers
        .filter(
          (layer) =>
            layer.renderMode === "image-layer" &&
            layer.canRenderInPreview &&
            Boolean(layer.sourceUrl),
        )
        .sort((left, right) => {
          const zIndexDiff = left.zIndexLayer - right.zIndexLayer;
          if (zIndexDiff !== 0) return zIndexDiff;

          return left.id.localeCompare(right.id, "tr");
        }),
    [plan.orderedLayers],
  );

  if (!enabled || !plan.canRenderPreview || imageLayers.length === 0) {
    return null;
  }

  const imageLayerItems = imageLayers.map((layer, index) => ({
    layer,
    layerKey: getLayerKey(layer, index),
  }));
  const visibleLayerItems = imageLayerItems.filter(
    (item) => !failedLayerKeys[item.layerKey],
  );
  const failedLayerCount = imageLayerItems.length - visibleLayerItems.length;

  return (
    <div
      className={`pointer-events-none absolute left-5 bottom-16 z-[9] w-56 rounded-[0.85rem] border border-white/8 bg-black/30 p-2 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-medium tracking-[0.14em] text-blue-200">
          Katman önizleme
        </span>
        <span className="rounded-full border border-white/6 bg-white/[0.04] px-1.5 py-0.5 text-[7px] text-zinc-400">
          {visibleLayerItems.length} katman
        </span>
      </div>
      <p className="mt-1 truncate text-[7px] text-zinc-500">
        Görsel katmanlar deneniyor. Tam 2.5D render sonraki sprintte.
      </p>
      <div className="relative mt-2 h-24 overflow-hidden rounded-[0.65rem] border border-white/6 bg-white/[0.025]">
        {visibleLayerItems.map(({ layer, layerKey }, index) => {
          const isUsingFallback = Boolean(fallbackLayerKeys[layerKey]);
          const src = isUsingFallback && layer.fallbackUrl ? layer.fallbackUrl : layer.sourceUrl;

          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={layerKey}
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              style={{ zIndex: index + 1 }}
              onError={() => {
                if (!isUsingFallback && layer.fallbackUrl) {
                  setFallbackLayerKeys((current) => ({
                    ...current,
                    [layerKey]: true,
                  }));
                  return;
                }

                setFailedLayerKeys((current) => ({
                  ...current,
                  [layerKey]: true,
                }));
              }}
            />
          );
        })}
      </div>
      {failedLayerCount > 0 ? (
        <p className="mt-1 text-[7px] text-amber-200">
          Yüklenemeyen katman: {failedLayerCount}
        </p>
      ) : null}
    </div>
  );
}
