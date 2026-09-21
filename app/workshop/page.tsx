import { and, eq, inArray, ne } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { categories, models, productDocuments, productSpecs, products } from "@/db/schema";
import ConfiguratorClient from "@/app/workshop/ConfiguratorClient";
import { getLayerFromCategory } from "@/app/workshop/focusTargets";
import {
  buildWorkshopAssetReadinessSummary,
  getWorkshopAssetsForModel,
  type WorkshopAssetLayerMetadata,
} from "@/app/workshop/_lib/workshop-assets";

// The interactive configurator reads live catalogue data. It must be rendered
// at request time rather than queried while the application is being built.
export const dynamic = "force-dynamic";

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
      shortDescription: products.shortDescription,
      description: products.description,
      powerDrawWatts: products.powerDrawWatts,
      powerSupplyWatts: products.powerSupplyWatts,
      datasheetUrl: products.datasheetUrl,
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
  const productIds = dbProductRows.map((product) => product.id);
  const documentRows = productIds.length
    ? await db
        .select({
          productId: productDocuments.productId,
          type: productDocuments.type,
          title: productDocuments.title,
          url: productDocuments.url,
          note: productDocuments.note,
          sortOrder: productDocuments.sortOrder,
          status: productDocuments.status,
        })
        .from(productDocuments)
        .where(
          and(
            inArray(productDocuments.productId, productIds),
            eq(productDocuments.status, "active"),
          ),
        )
    : [];
  const specRows = productIds.length
    ? await db
        .select({
          productId: productSpecs.productId,
          specKey: productSpecs.specKey,
          specValue: productSpecs.specValue,
          unit: productSpecs.unit,
        })
        .from(productSpecs)
        .where(inArray(productSpecs.productId, productIds))
    : [];
  const documentsByProductId = new Map<string, typeof documentRows>();
  const specsByProductId = new Map<string, typeof specRows>();

  documentRows.forEach((document) => {
    const current = documentsByProductId.get(document.productId) ?? [];
    current.push(document);
    documentsByProductId.set(document.productId, current);
  });

  specRows.forEach((spec) => {
    const current = specsByProductId.get(spec.productId) ?? [];
    current.push(spec);
    specsByProductId.set(spec.productId, current);
  });

  const dbProducts = dbProductRows.map((product) => ({
    ...product,
    productDocuments: documentsByProductId.get(product.id) ?? [],
    productSpecs: specsByProductId.get(product.id) ?? [],
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
