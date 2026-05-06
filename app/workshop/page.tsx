import { and, eq, ne } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { categories, models, products } from "@/db/schema";
import ConfiguratorClient from "@/app/workshop/ConfiguratorClient";
import { getLayerFromCategory } from "@/app/workshop/focusTargets";
import {
  buildWorkshopAssetReadinessSummary,
  getWorkshopAssetsForModel,
  type WorkshopAssetLayerMetadata,
} from "@/app/workshop/_lib/workshop-assets";

function sanitizeWorkshopAssetLayers(
  assets: Awaited<ReturnType<typeof getWorkshopAssetsForModel>>,
): WorkshopAssetLayerMetadata[] {
  return assets.map((asset) => ({
    id: asset.id,
    productId: asset.productId,
    modelId: asset.modelId,
    cameraView: asset.cameraView,
    zIndexLayer: asset.zIndexLayer,
    referenceKind: asset.referenceKind,
    assetUrl: asset.assetUrl,
    fallbackUrl: asset.fallbackUrl,
  }));
}

export default async function DesignPage() {
  const db = getDbOrThrow();

  // Hem ürünleri hem araçları tek sayfada çekiyoruz (Hızlı SPA mantığı)
  const dbProductRows = await db
    .select({
      id: products.id,
      title: products.name,
      name: products.name,
      sku: products.sku,
      weightKg: products.weightKg,
      basePrice: products.basePrice,
      productType: products.productType,
      productSubType: products.productSubType,
      workshopEffect: products.workshopEffect,
      workshopVisibility: products.workshopVisibility,
      targetLayer: products.targetLayer,
      meshKey: products.meshKey,
      materialKey: products.materialKey,
      technicalSpecs: products.technicalSpecs,
      categoryId: products.categoryId,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.status, "active"),
        ne(products.workshopVisibility, "ai_package_only"),
      ),
    );
  const dbProducts = dbProductRows.map((product) => ({
    ...product,
    targetLayer: product.targetLayer ?? getLayerFromCategory(product.categorySlug),
  }));

  const dbModels = await db
    .select()
    .from(models)
    .where(eq(models.status, "active"));

  const workshopAssetEntries = await Promise.all(
    dbModels.map(async (model) => {
      const assets = await getWorkshopAssetsForModel(model.id);

      return [
        model.id,
        {
          readiness: buildWorkshopAssetReadinessSummary(assets),
          layers: sanitizeWorkshopAssetLayers(assets),
        },
      ] as const;
    }),
  );
  const workshopAssetReadinessByModel = Object.fromEntries(
    workshopAssetEntries.map(([modelId, entry]) => [modelId, entry.readiness] as const),
  );
  const workshopAssetsByModel = Object.fromEntries(
    workshopAssetEntries.map(([modelId, entry]) => [modelId, entry.layers] as const),
  );

  return (
    <main className="bg-[#050505] min-h-screen">
      <ConfiguratorClient
        dbProducts={dbProducts}
        dbModels={dbModels}
        workshopAssetReadinessByModel={workshopAssetReadinessByModel}
        workshopAssetsByModel={workshopAssetsByModel}
      />
    </main>
  );
}
