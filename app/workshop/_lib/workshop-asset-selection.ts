export type WorkshopAssetReferenceKind = "image" | "model3d" | "video" | "link";

export type WorkshopAssetLayerMetadata = {
  id: string;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
  referenceKind: WorkshopAssetReferenceKind;
};

export type WorkshopAssetReadinessSummary = {
  totalAssets: number;
  imageCount: number;
  model3dCount: number;
  videoCount: number;
  linkCount: number;
  cameraViews: string[];
  productCount: number;
  layerCount: number;
  hasAnyAssets: boolean;
  hasImageLayers: boolean;
  selectedProductAssetCount: number;
  productAssetCounts: Record<string, number>;
};

export type WorkshopLayerSelectionSummary = {
  cameraView: string;
  availableCameraViews: string[];
  selectedProductIds: string[];
  selectedLayerCount: number;
  selectedImageLayerCount: number;
  selectedModel3dCount: number;
  selectedVideoCount: number;
  selectedLinkCount: number;
  missingProductIds: string[];
  matchedProductIds: string[];
  orderedLayers: WorkshopAssetLayerMetadata[];
  canRenderPreview: boolean;
  readinessLabel: string;
};

function sortCameraViews(cameraViews: string[]) {
  return Array.from(new Set(cameraViews.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, "tr"),
  );
}

function sortWorkshopLayerMetadata(assets: WorkshopAssetLayerMetadata[]) {
  return [...assets].sort((left, right) => {
    const zIndexDiff = left.zIndexLayer - right.zIndexLayer;
    if (zIndexDiff !== 0) return zIndexDiff;

    const cameraDiff = left.cameraView.localeCompare(right.cameraView, "tr");
    if (cameraDiff !== 0) return cameraDiff;

    const productDiff = left.productId.localeCompare(right.productId, "tr");
    if (productDiff !== 0) return productDiff;

    return left.id.localeCompare(right.id, "tr");
  });
}

export function getDefaultWorkshopCameraView(assets: WorkshopAssetLayerMetadata[]) {
  const availableCameraViews = sortCameraViews(assets.map((asset) => asset.cameraView));

  return availableCameraViews.includes("isometric")
    ? "isometric"
    : availableCameraViews[0] ?? "";
}

export function buildWorkshopLayerSelection(input: {
  assets: WorkshopAssetLayerMetadata[];
  selectedProductIds: string[];
  cameraView?: string;
}): WorkshopLayerSelectionSummary {
  const selectedProductIds = Array.from(new Set(input.selectedProductIds.filter(Boolean)));
  const selectedProductIdSet = new Set(selectedProductIds);
  const availableCameraViews = sortCameraViews(input.assets.map((asset) => asset.cameraView));
  const cameraView = input.cameraView?.trim() ?? "";
  const cameraScopedAssets = cameraView
    ? input.assets.filter((asset) => asset.cameraView === cameraView)
    : input.assets;
  const orderedLayers = sortWorkshopLayerMetadata(
    cameraScopedAssets.filter((asset) => selectedProductIdSet.has(asset.productId)),
  );
  const matchedProductIds = Array.from(
    new Set(orderedLayers.map((asset) => asset.productId)),
  ).sort((left, right) => left.localeCompare(right, "tr"));
  const matchedProductIdSet = new Set(matchedProductIds);
  const missingProductIds = selectedProductIds
    .filter((productId) => !matchedProductIdSet.has(productId))
    .sort((left, right) => left.localeCompare(right, "tr"));
  const selectedImageLayerCount = orderedLayers.filter(
    (asset) => asset.referenceKind === "image",
  ).length;
  const selectedModel3dCount = orderedLayers.filter(
    (asset) => asset.referenceKind === "model3d",
  ).length;
  const selectedVideoCount = orderedLayers.filter(
    (asset) => asset.referenceKind === "video",
  ).length;
  const selectedLinkCount = orderedLayers.filter(
    (asset) => asset.referenceKind === "link",
  ).length;
  const canRenderPreview = selectedProductIds.length > 0 && selectedImageLayerCount > 0;

  const readinessLabel = (() => {
    if (selectedProductIds.length === 0) {
      return "Seçili ürünler için görsel katman bekleniyor.";
    }

    if (cameraView && orderedLayers.length === 0) {
      return "Bu kamera görünümünde katman bulunamadı.";
    }

    if (selectedImageLayerCount === 0) {
      return "Seçili ürünler için görsel katman bekleniyor.";
    }

    return canRenderPreview
      ? "Görsel katman planı hazır."
      : "2.5D render sonraki sprintte bağlanacak.";
  })();

  return {
    cameraView,
    availableCameraViews,
    selectedProductIds,
    selectedLayerCount: orderedLayers.length,
    selectedImageLayerCount,
    selectedModel3dCount,
    selectedVideoCount,
    selectedLinkCount,
    missingProductIds,
    matchedProductIds,
    orderedLayers,
    canRenderPreview,
    readinessLabel,
  };
}
