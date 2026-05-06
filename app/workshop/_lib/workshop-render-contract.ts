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
  canRenderPreviewLabel: "Uygun" | "Bekliyor";
  modeCounts: Record<WorkshopRenderMode, number>;
  layerSummaries: WorkshopRenderLayerDiagnostic[];
  extraLayerCount: number;
};

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
  const orderedLayers = [...input.orderedLayers]
    .sort((left, right) => {
      const zIndexDiff = left.zIndexLayer - right.zIndexLayer;
      if (zIndexDiff !== 0) return zIndexDiff;

      return left.id.localeCompare(right.id, "tr");
    })
    .map((layer) => {
      const renderMode = getRenderMode(layer.referenceKind);

      return {
        id: layer.id,
        productId: layer.productId,
        modelId: layer.modelId,
        cameraView: layer.cameraView,
        zIndexLayer: layer.zIndexLayer,
        referenceKind: layer.referenceKind,
        sourceUrl: layer.assetUrl,
        fallbackUrl: layer.fallbackUrl,
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
    selectedProductCount: new Set(input.selectedProductIds.filter(Boolean)).size,
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
  const modeCounts = plan.orderedLayers.reduce(
    (counts, layer) => ({
      ...counts,
      [layer.renderMode]: counts[layer.renderMode] + 1,
    }),
    {
      "image-layer": 0,
      "model3d-reference": 0,
      "video-reference": 0,
      "link-reference": 0,
    } satisfies Record<WorkshopRenderMode, number>,
  );
  const layerSummaries = plan.orderedLayers.slice(0, 3).map((layer) => ({
    zIndexLayer: layer.zIndexLayer,
    renderMode: layer.renderMode,
    renderModeLabel: getRenderModeLabel(layer.renderMode),
    cameraView: layer.cameraView,
  }));

  return {
    statusLabel: plan.statusLabel,
    note: plan.note,
    cameraView: plan.cameraView || "Bekliyor",
    layerCount: plan.layerCount,
    imageLayerCount: plan.imageLayerCount,
    nonRenderableReferenceCount: plan.nonRenderableReferenceCount,
    missingProductCount: plan.missingProductIds.length,
    canRenderPreviewLabel: plan.canRenderPreview ? "Uygun" : "Bekliyor",
    modeCounts,
    layerSummaries,
    extraLayerCount: Math.max(plan.orderedLayers.length - layerSummaries.length, 0),
  };
}
