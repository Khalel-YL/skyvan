import type { VisualMeshLayer } from "./meshMap";

export const CATEGORY_TO_LAYER_MAP: Record<string, VisualMeshLayer | null> = {
  kitchen: "kitchen",
  bed: "bed",
  storage: "storage",
  seat: "seat",
  table: "table",
  bathroom: "bathroom",
  electrical: null,
  plumbing: null,
  climate: null,
};

export function getLayerFromCategory(categorySlug?: string | null): VisualMeshLayer | null {
  if (!categorySlug) {
    return null;
  }

  const normalized = categorySlug.toLowerCase().trim();

  return CATEGORY_TO_LAYER_MAP[normalized] ?? null;
}

export type FocusTargetId = VisualMeshLayer;

export const focusTargets: Record<FocusTargetId, { layer: VisualMeshLayer }> = {
  bed: { layer: "bed" },
  kitchen: { layer: "kitchen" },
  storage: { layer: "storage" },
  bathroom: { layer: "bathroom" },
  seat: { layer: "seat" },
  table: { layer: "table" },
};
