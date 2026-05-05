import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/db";
import { models, products, visualAssets2d } from "@/db/schema";

export type WorkshopAssetReferenceKind = "image" | "model3d" | "video" | "link";

export type WorkshopVisualAsset = {
  id: string;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
  productLabel: string | null;
  productSlug: string | null;
  modelLabel: string | null;
  modelSlug: string | null;
  referenceKind: WorkshopAssetReferenceKind;
};

export type WorkshopAssetCameraGroup = {
  cameraView: string;
  layers: WorkshopVisualAsset[];
};

export type GroupedWorkshopAssets = {
  productId: string;
  productLabel: string;
  cameraViews: string[];
  assets: WorkshopVisualAsset[];
  layerGroups: WorkshopAssetCameraGroup[];
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

type WorkshopAssetRow = {
  id: string;
  productId: string;
  productName: string | null;
  productSlug: string | null;
  productSku: string | null;
  modelId: string;
  modelSlug: string | null;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logWorkshopAssetReadError(action: string, error: unknown, count?: number) {
  console.error(`workshop-assets/${action} read error`, {
    action,
    count,
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function titleCaseSlugPart(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const upper = part.toUpperCase();

      if (/^[A-Z]{2,}$/.test(upper)) {
        return upper;
      }

      return `${part.slice(0, 1).toLocaleUpperCase("tr-TR")}${part.slice(1)}`;
    })
    .join(" ");
}

function formatModelLabel(slug: string) {
  const normalized = slug.trim();
  const variantMatch = normalized.match(/-(l\d+h?\d+|l\d+m\d+)$/i);

  if (!variantMatch) {
    return titleCaseSlugPart(normalized);
  }

  const variant = variantMatch[1].toUpperCase();
  const base = normalized.slice(0, -variantMatch[0].length);
  const classSuffix = base.endsWith("-class") ? " Sınıfı" : "";
  const readableBase = titleCaseSlugPart(base.replace(/-class$/, ""));

  return `${readableBase}${classSuffix} · ${variant}`;
}

function getProductLabel(row: WorkshopAssetRow) {
  if (row.productName) {
    return row.productSku ? `${row.productName} · ${row.productSku}` : row.productName;
  }

  return row.productSlug ?? null;
}

export function getWorkshopAssetReferenceKind(value: string): WorkshopAssetReferenceKind {
  const pathname = (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })().toLowerCase();

  if (/\.(png|jpe?g|webp|svg)$/i.test(pathname)) {
    return "image";
  }

  if (/\.(glb|gltf)$/i.test(pathname)) {
    return "model3d";
  }

  if (/\.(mp4|webm|mov|m4v)$/i.test(pathname)) {
    return "video";
  }

  return "link";
}

function mapWorkshopAssetRow(row: WorkshopAssetRow): WorkshopVisualAsset {
  return {
    id: row.id,
    productId: row.productId,
    modelId: row.modelId,
    cameraView: row.cameraView,
    zIndexLayer: row.zIndexLayer,
    assetUrl: row.assetUrl,
    fallbackUrl: row.fallbackUrl,
    productLabel: getProductLabel(row),
    productSlug: row.productSlug,
    modelLabel: row.modelSlug ? formatModelLabel(row.modelSlug) : null,
    modelSlug: row.modelSlug,
    referenceKind: getWorkshopAssetReferenceKind(row.assetUrl),
  };
}

function sortWorkshopAssets(assets: WorkshopVisualAsset[]) {
  return [...assets].sort((left, right) => {
    const productDiff = (left.productLabel ?? left.productSlug ?? left.productId).localeCompare(
      right.productLabel ?? right.productSlug ?? right.productId,
      "tr",
    );
    if (productDiff !== 0) return productDiff;

    const modelDiff = (left.modelSlug ?? left.modelLabel ?? left.modelId).localeCompare(
      right.modelSlug ?? right.modelLabel ?? right.modelId,
      "tr",
    );
    if (modelDiff !== 0) return modelDiff;

    const cameraDiff = left.cameraView.localeCompare(right.cameraView, "tr");
    if (cameraDiff !== 0) return cameraDiff;

    return left.zIndexLayer - right.zIndexLayer;
  });
}

async function readWorkshopAssets(params: {
  modelId: string;
  productIds?: string[];
  cameraView?: string;
}) {
  if (!db) {
    return [] satisfies WorkshopVisualAsset[];
  }

  if (!isUuid(params.modelId)) {
    return [] satisfies WorkshopVisualAsset[];
  }

  const productIds = Array.from(
    new Set((params.productIds ?? []).filter((id) => isUuid(id))),
  );

  if (params.productIds && productIds.length === 0) {
    return [] satisfies WorkshopVisualAsset[];
  }

  const cameraView = params.cameraView?.trim();
  const conditions = [eq(visualAssets2d.modelId, params.modelId)];

  if (productIds.length > 0) {
    conditions.push(inArray(visualAssets2d.productId, productIds));
  }

  if (cameraView) {
    conditions.push(eq(visualAssets2d.cameraView, cameraView));
  }

  try {
    const rows = (await db
      .select({
        id: visualAssets2d.id,
        productId: visualAssets2d.productId,
        productName: products.name,
        productSlug: products.slug,
        productSku: products.sku,
        modelId: visualAssets2d.modelId,
        modelSlug: models.slug,
        cameraView: visualAssets2d.cameraView,
        zIndexLayer: visualAssets2d.zIndexLayer,
        assetUrl: visualAssets2d.assetUrl,
        fallbackUrl: visualAssets2d.fallbackUrl,
      })
      .from(visualAssets2d)
      .leftJoin(products, eq(visualAssets2d.productId, products.id))
      .leftJoin(models, eq(visualAssets2d.modelId, models.id))
      .where(and(...conditions))
      .orderBy(
        asc(products.name),
        asc(products.slug),
        asc(models.slug),
        asc(visualAssets2d.cameraView),
        asc(visualAssets2d.zIndexLayer),
      )) as WorkshopAssetRow[];

    return sortWorkshopAssets(rows.map(mapWorkshopAssetRow));
  } catch (error) {
    logWorkshopAssetReadError("read", error, productIds.length);
    return [] satisfies WorkshopVisualAsset[];
  }
}

export async function getWorkshopAssetsForModel(modelId: string) {
  return readWorkshopAssets({ modelId });
}

export async function getWorkshopAssetsForProducts(params: {
  modelId: string;
  productIds: string[];
  cameraView?: string;
}) {
  return readWorkshopAssets(params);
}

export async function getAvailableCameraViewsForModel(modelId: string) {
  const assets = await getWorkshopAssetsForModel(modelId);

  return Array.from(new Set(assets.map((asset) => asset.cameraView))).sort((left, right) =>
    left.localeCompare(right, "tr"),
  );
}

export function filterWorkshopAssetsBySelection(
  assets: WorkshopVisualAsset[],
  selectedProductIds: string[],
) {
  const selectedIds = new Set(selectedProductIds);

  return sortWorkshopAssets(assets.filter((asset) => selectedIds.has(asset.productId)));
}

export function selectWorkshopAssetsForCamera(
  assets: WorkshopVisualAsset[],
  cameraView: string,
) {
  const normalizedCameraView = cameraView.trim();

  if (!normalizedCameraView) {
    return sortWorkshopAssets(assets);
  }

  return sortWorkshopAssets(
    assets.filter((asset) => asset.cameraView === normalizedCameraView),
  );
}

export function groupWorkshopAssetsByCamera(
  assets: WorkshopVisualAsset[],
): WorkshopAssetCameraGroup[] {
  const grouped = new Map<string, WorkshopVisualAsset[]>();

  for (const asset of assets) {
    const current = grouped.get(asset.cameraView) ?? [];
    current.push(asset);
    grouped.set(asset.cameraView, current);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right, "tr"))
    .map(([cameraView, layers]) => ({
      cameraView,
      layers: [...layers].sort((left, right) => left.zIndexLayer - right.zIndexLayer),
    }));
}

export function groupWorkshopAssetsByProduct(
  assets: WorkshopVisualAsset[],
): GroupedWorkshopAssets[] {
  const grouped = new Map<string, WorkshopVisualAsset[]>();

  for (const asset of assets) {
    const current = grouped.get(asset.productId) ?? [];
    current.push(asset);
    grouped.set(asset.productId, current);
  }

  return Array.from(grouped.entries())
    .map(([productId, productAssets]) => {
      const sortedAssets = sortWorkshopAssets(productAssets);
      const firstAsset = sortedAssets[0];

      return {
        productId,
        productLabel: firstAsset?.productLabel ?? firstAsset?.productSlug ?? productId,
        cameraViews: Array.from(new Set(sortedAssets.map((asset) => asset.cameraView))).sort(
          (left, right) => left.localeCompare(right, "tr"),
        ),
        assets: sortedAssets,
        layerGroups: groupWorkshopAssetsByCamera(sortedAssets),
      };
    })
    .sort((left, right) => left.productLabel.localeCompare(right.productLabel, "tr"));
}

export function buildWorkshopAssetIndex(assets: WorkshopVisualAsset[]) {
  return {
    assets: sortWorkshopAssets(assets),
    byProduct: groupWorkshopAssetsByProduct(assets),
    cameraViews: Array.from(new Set(assets.map((asset) => asset.cameraView))).sort(
      (left, right) => left.localeCompare(right, "tr"),
    ),
    referenceCounts: assets.reduce(
      (acc, asset) => {
        acc[asset.referenceKind] += 1;
        return acc;
      },
      {
        image: 0,
        model3d: 0,
        video: 0,
        link: 0,
      } satisfies Record<WorkshopAssetReferenceKind, number>,
    ),
  };
}

export function buildWorkshopAssetReadinessSummary(
  assets: WorkshopVisualAsset[],
  selectedProductIds: string[] = [],
): WorkshopAssetReadinessSummary {
  const productAssetCounts: Record<string, number> = {};

  for (const asset of assets) {
    productAssetCounts[asset.productId] = (productAssetCounts[asset.productId] ?? 0) + 1;
  }

  const selectedProductIdSet = new Set(selectedProductIds);
  const selectedProductAssetCount = Object.entries(productAssetCounts).reduce(
    (count, [productId, assetCount]) =>
      selectedProductIdSet.has(productId) ? count + assetCount : count,
    0,
  );
  const referenceCounts = assets.reduce(
    (acc, asset) => {
      acc[asset.referenceKind] += 1;
      return acc;
    },
    {
      image: 0,
      model3d: 0,
      video: 0,
      link: 0,
    } satisfies Record<WorkshopAssetReferenceKind, number>,
  );

  return {
    totalAssets: assets.length,
    imageCount: referenceCounts.image,
    model3dCount: referenceCounts.model3d,
    videoCount: referenceCounts.video,
    linkCount: referenceCounts.link,
    cameraViews: Array.from(new Set(assets.map((asset) => asset.cameraView))).sort(
      (left, right) => left.localeCompare(right, "tr"),
    ),
    productCount: Object.keys(productAssetCounts).length,
    layerCount: assets.length,
    hasAnyAssets: assets.length > 0,
    hasImageLayers: referenceCounts.image > 0,
    selectedProductAssetCount,
    productAssetCounts,
  };
}

// Generic/model-neutral Workshop assets require a future schema decision; W4 keeps model-bound reads only.
