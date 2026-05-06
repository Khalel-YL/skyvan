import type {
  WorkshopAssetLayerMetadata,
  WorkshopAssetReferenceKind,
} from "./workshop-asset-selection";

export type WorkshopRenderMode =
  | "image-layer"
  | "model3d-reference"
  | "video-reference"
  | "link-reference";

export type WorkshopRenderPlanStatus = "empty" | "missing" | "ready" | "blocked";

export type WorkshopRenderLayer = {
  id: string;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
  referenceKind: WorkshopAssetReferenceKind;
  sourceUrl: string;
  fallbackUrl: string | null;
  renderMode: WorkshopRenderMode;
  canRenderInPreview: boolean;
};

export type WorkshopRenderPlan = {
  modelId: string | null;
  cameraView: string;
  layerCount: number;
  imageLayerCount: number;
  nonRenderableReferenceCount: number;
  missingProductIds: string[];
  orderedLayers: WorkshopRenderLayer[];
  canRenderPreview: boolean;
  status: WorkshopRenderPlanStatus;
  statusLabel: string;
  note: string;
};

export type WorkshopRenderLayerDiagnostic = {
  zIndexLayer: number;
  renderMode: WorkshopRenderMode;
  renderModeLabel: string;
  cameraView: string;
};

export type WorkshopRenderDiagnostics = {
  statusLabel: string;
  note: string;
  cameraView: string;
  layerCount: number;
  imageLayerCount: number;
  nonRenderableReferenceCount: number;
  missingProductCount: number;
  incompleteLayerCount: number;
  duplicateLayerCount: number;
  canRenderPreviewLabel: "Uygun" | "Bekliyor";
  modeCounts: Record<WorkshopRenderMode, number>;
  layerSummaries: WorkshopRenderLayerDiagnostic[];
  extraLayerCount: number;
};

const DEFAULT_MODE_COUNTS = {
  "image-layer": 0,
  "model3d-reference": 0,
  "video-reference": 0,
  "link-reference": 0,
} satisfies Record<WorkshopRenderMode, number>;

function getSafeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeZIndex(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getSafeReferenceKind(value: unknown): WorkshopAssetReferenceKind {
  if (value === "image" || value === "model3d" || value === "video" || value === "link") {
    return value;
  }

  return "link";
}

function getRenderMode(referenceKind: WorkshopAssetReferenceKind): WorkshopRenderMode {
  if (referenceKind === "image") {
    return "image-layer";
  }

  if (referenceKind === "model3d") {
    return "model3d-reference";
  }

  if (referenceKind === "video") {
    return "video-reference";
  }

  return "link-reference";
}

function getRenderPlanStatus(input: {
  selectedProductCount: number;
  imageLayerCount: number;
  nonRenderableReferenceCount: number;
  missingProductCount: number;
}): WorkshopRenderPlanStatus {
  if (
    input.selectedProductCount === 0 ||
    input.imageLayerCount + input.nonRenderableReferenceCount === 0
  ) {
    return "empty";
  }

  if (input.imageLayerCount === 0 && input.nonRenderableReferenceCount > 0) {
    return "blocked";
  }

  if (input.missingProductCount > 0) {
    return "missing";
  }

  return "ready";
}

function getRenderModeLabel(renderMode: WorkshopRenderMode) {
  if (renderMode === "image-layer") {
    return "Image katman";
  }

  if (renderMode === "model3d-reference") {
    return "GLB referans";
  }

  if (renderMode === "video-reference") {
    return "Video referans";
  }

  return "Link referans";
}

function getLayerDiagnosticKey(layer: Pick<WorkshopRenderLayer, "productId" | "modelId" | "cameraView" | "zIndexLayer" | "renderMode">) {
  return [
    layer.productId || "urun-bekliyor",
    layer.modelId || "model-bekliyor",
    layer.cameraView || "kamera-bekliyor",
    layer.zIndexLayer,
    layer.renderMode,
  ].join(":");
}

function isIncompleteRenderLayer(
  layer: Pick<WorkshopRenderLayer, "id" | "productId" | "modelId" | "cameraView">,
) {
  return !layer.id || !layer.productId || !layer.modelId || !layer.cameraView;
}

function getRenderPlanCopy(status: WorkshopRenderPlanStatus) {
  if (status === "ready") {
    return {
      statusLabel: "Önizleme için katman planı hazır.",
      note: "Gerçek 2.5D çizim sonraki sprintte.",
    };
  }

  if (status === "missing") {
    return {
      statusLabel: "Seçili ürünlerin görsel katmanı eksik.",
      note: "Eksik katmanlar tamamlanınca plan doğrudan render girdisine dönüşecek.",
    };
  }

  if (status === "blocked") {
    return {
      statusLabel: "Bu kayıtlar görsel önizleme yerine referans olarak bekliyor.",
      note: "GLB, video ve link kayıtları sonraki renderer bağında ele alınacak.",
    };
  }

  return {
    statusLabel: "Görsel plan bekleniyor.",
    note: "Gerçek 2.5D çizim sonraki sprintte.",
  };
}

export function buildWorkshopRenderPlan(input: {
  modelId: string | null;
  cameraView: string;
  selectedProductIds: string[];
  orderedLayers: WorkshopAssetLayerMetadata[];
  missingProductIds: string[];
}): WorkshopRenderPlan {
  const safeSelectedProductIds = Array.from(
    new Set((input.selectedProductIds ?? []).map(getSafeString).filter(Boolean)),
  );
  const safeInputLayers = Array.isArray(input.orderedLayers) ? input.orderedLayers : [];
  const orderedLayers = [...safeInputLayers]
    .sort((left, right) => {
      const zIndexDiff = getSafeZIndex(left.zIndexLayer) - getSafeZIndex(right.zIndexLayer);
      if (zIndexDiff !== 0) return zIndexDiff;

      return getSafeString(left.id).localeCompare(getSafeString(right.id), "tr");
    })
    .map((layer) => {
      const referenceKind = getSafeReferenceKind(layer.referenceKind);
      const renderMode = getRenderMode(referenceKind);

      return {
        id: getSafeString(layer.id),
        productId: getSafeString(layer.productId),
        modelId: getSafeString(layer.modelId),
        cameraView: getSafeString(layer.cameraView),
        zIndexLayer: getSafeZIndex(layer.zIndexLayer),
        referenceKind,
        sourceUrl: getSafeString(layer.assetUrl),
        fallbackUrl: getSafeString(layer.fallbackUrl) || null,
        renderMode,
        canRenderInPreview: renderMode === "image-layer",
      } satisfies WorkshopRenderLayer;
    });
  const imageLayerCount = orderedLayers.filter((layer) => layer.canRenderInPreview).length;
  const nonRenderableReferenceCount = orderedLayers.length - imageLayerCount;
  const missingProductIds = Array.from(new Set(input.missingProductIds.filter(Boolean))).sort(
    (left, right) => left.localeCompare(right, "tr"),
  );
  const canRenderPreview = imageLayerCount > 0;
  const status = getRenderPlanStatus({
    selectedProductCount: safeSelectedProductIds.length,
    imageLayerCount,
    nonRenderableReferenceCount,
    missingProductCount: missingProductIds.length,
  });
  const copy = getRenderPlanCopy(status);

  return {
    modelId: input.modelId,
    cameraView: input.cameraView,
    layerCount: orderedLayers.length,
    imageLayerCount,
    nonRenderableReferenceCount,
    missingProductIds,
    orderedLayers,
    canRenderPreview,
    status,
    statusLabel: copy.statusLabel,
    note: copy.note,
  };
}

export function buildWorkshopRenderDiagnostics(
  plan: WorkshopRenderPlan,
): WorkshopRenderDiagnostics {
  const orderedLayers = Array.isArray(plan.orderedLayers) ? plan.orderedLayers : [];
  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();
  const modeCounts = orderedLayers.reduce((counts, layer) => {
    const renderMode = getRenderMode(getSafeReferenceKind(layer.referenceKind));
    const diagnosticKey = getLayerDiagnosticKey({
      productId: getSafeString(layer.productId),
      modelId: getSafeString(layer.modelId),
      cameraView: getSafeString(layer.cameraView),
      zIndexLayer: getSafeZIndex(layer.zIndexLayer),
      renderMode,
    });

    if (seenKeys.has(diagnosticKey)) {
      duplicateKeys.add(diagnosticKey);
    }
    seenKeys.add(diagnosticKey);

    return {
      ...counts,
      [renderMode]: counts[renderMode] + 1,
    };
  }, DEFAULT_MODE_COUNTS);
  const layerSummaries = orderedLayers.slice(0, 3).map((layer) => ({
    zIndexLayer: layer.zIndexLayer,
    renderMode: layer.renderMode,
    renderModeLabel: getRenderModeLabel(layer.renderMode),
    cameraView: layer.cameraView || "Bekliyor",
  }));
  const incompleteLayerCount = orderedLayers.filter(isIncompleteRenderLayer).length;

  return {
    statusLabel: plan.statusLabel,
    note: plan.note,
    cameraView: plan.cameraView || "Bekliyor",
    layerCount: orderedLayers.length,
    imageLayerCount: modeCounts["image-layer"],
    nonRenderableReferenceCount:
      modeCounts["model3d-reference"] +
      modeCounts["video-reference"] +
      modeCounts["link-reference"],
    missingProductCount: Array.isArray(plan.missingProductIds)
      ? plan.missingProductIds.filter(Boolean).length
      : 0,
    incompleteLayerCount,
    duplicateLayerCount: duplicateKeys.size,
    canRenderPreviewLabel: plan.canRenderPreview ? "Uygun" : "Bekliyor",
    modeCounts,
    layerSummaries,
    extraLayerCount: Math.max(orderedLayers.length - layerSummaries.length, 0),
  };
}
