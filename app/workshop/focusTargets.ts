import type { VisualMeshLayer } from "./meshMap";

export const CATEGORY_TO_LAYER_MAP: Record<string, VisualMeshLayer | null> = {
  mutfak: "kitchen",
  kitchen: "kitchen",

  banyo: "bathroom",
  bathroom: "bathroom",

  oturma: "seat",
  seat: "seat",

  yatak: "bed",
  bed: "bed",

  depolama: "storage",
  storage: "storage",

  masa: "table",
  table: "table",

  electrical: null,
  "electrical mod": null,
};

export function getLayerFromCategory(categoryName?: string | null): VisualMeshLayer | null {
  if (!categoryName) {
    return null;
  }

  const normalized = categoryName.toLowerCase().trim();

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
