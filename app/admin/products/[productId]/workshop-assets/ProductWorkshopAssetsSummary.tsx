import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowUpRight, ImageIcon, Layers3 } from "lucide-react";

import { db } from "@/db/db";
import { models, visualAssets2d } from "@/db/schema";

type ProductWorkshopAssetRow = {
  id: string;
  modelId: string;
  modelSlug: string | null;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
};

const VISIBLE_ASSET_LIMIT = 8;

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

function getModelLabel(asset: ProductWorkshopAssetRow) {
  return asset.modelSlug ? formatModelLabel(asset.modelSlug) : "Model kaydı bulunamadı";
}

function getWorkshopAssetsHref(productId: string, modelId?: string) {
  const search = new URLSearchParams({ productId });

  if (modelId) {
    search.set("modelId", modelId);
  }

  return `/admin/workshop-assets?${search.toString()}`;
}

function isImageLikeAsset(value: string) {
  const pathname = (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })().toLowerCase();

  return /\.(png|jpe?g|webp|svg)$/i.test(pathname);
}

function shortenMiddle(value: string, maxLength = 58) {
  if (value.length <= maxLength) {
    return value;
  }

  const head = Math.max(14, Math.floor(maxLength * 0.58));
  const tail = Math.max(8, maxLength - head - 3);

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function statChip(label: string, value: string | number) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function AssetPreview({ assetUrl }: { assetUrl: string }) {
  if (!isImageLikeAsset(assetUrl)) {
    return (
      <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-2 text-center text-[10px] font-medium leading-3 text-zinc-500">
        Varlık bağlantısı
      </div>
    );
  }

  return (
    <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- Admin Workshop asset summary renders external or storage-path preview references. */}
      <img src={assetUrl} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

async function getProductWorkshopAssets(productId: string) {
  if (!db) {
    return [] satisfies ProductWorkshopAssetRow[];
  }

  try {
    return (await db
      .select({
        id: visualAssets2d.id,
        modelId: visualAssets2d.modelId,
        modelSlug: models.slug,
        cameraView: visualAssets2d.cameraView,
        zIndexLayer: visualAssets2d.zIndexLayer,
        assetUrl: visualAssets2d.assetUrl,
        fallbackUrl: visualAssets2d.fallbackUrl,
      })
      .from(visualAssets2d)
      .leftJoin(models, eq(visualAssets2d.modelId, models.id))
      .where(eq(visualAssets2d.productId, productId))
      .orderBy(asc(models.slug), asc(visualAssets2d.cameraView), asc(visualAssets2d.zIndexLayer))) as ProductWorkshopAssetRow[];
  } catch (error) {
    console.error("Product workshop assets summary error:", {
      productIdPresent: Boolean(productId),
      errorName: error instanceof Error ? error.name : "Error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return [] satisfies ProductWorkshopAssetRow[];
  }
}

export async function ProductWorkshopAssetsSummary({
  productId,
}: {
  productId: string;
}) {
  const assets = await getProductWorkshopAssets(productId);
  const visibleAssets = assets.slice(0, VISIBLE_ASSET_LIMIT);
  const hiddenCount = Math.max(0, assets.length - VISIBLE_ASSET_LIMIT);
  const modelCount = new Set(assets.map((asset) => asset.modelId)).size;
  const cameraCount = new Set(assets.map((asset) => asset.cameraView)).size;
  const missingFallbackCount = assets.filter((asset) => !asset.fallbackUrl).length;
  const layerValues = assets.map((asset) => asset.zIndexLayer);
  const layerRange =
    layerValues.length > 0
      ? `${Math.min(...layerValues)}-${Math.max(...layerValues)}`
      : "-";
  const registryHref = getWorkshopAssetsHref(productId);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <Layers3 className="h-4 w-4" />
            Ürün ilişkisi
          </div>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">
            Workshop Varlıkları
          </h2>
          <p className="mt-1 text-sm leading-5 text-zinc-400">
            Bu ürüne bağlı model ve 2.5D görsel katmanlarını izleyin.
          </p>
        </div>

        <Link
          href={registryHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
        >
          Workshop Varlıklarına Git
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {statChip("Toplam varlık", assets.length)}
        {statChip("Model sayısı", modelCount)}
        {statChip("Kamera görünümü", cameraCount)}
        {statChip("Eksik yedek", missingFallbackCount)}
        {statChip("Katman aralığı", layerRange)}
      </div>

      {assets.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-5">
          <h3 className="text-sm font-semibold text-zinc-100">
            Bu ürüne bağlı Workshop varlığı yok.
          </h3>
          <p className="mt-1 text-sm leading-5 text-zinc-400">
            Varlık eklemek için Workshop Varlıkları panelini kullan.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {visibleAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <AssetPreview assetUrl={asset.assetUrl} />

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      {getModelLabel(asset)}
                    </span>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300">
                      {asset.cameraView}
                    </span>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300">
                      Katman {asset.zIndexLayer}
                    </span>
                  </div>

                  <div className="grid gap-1 text-xs text-zinc-500">
                    <div className="flex min-w-0 items-center gap-2">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                      <span className="shrink-0 text-zinc-600">Varlık</span>
                      <span title={asset.assetUrl} className="min-w-0 truncate text-zinc-300">
                        {shortenMiddle(asset.assetUrl)}
                      </span>
                    </div>
                    {asset.fallbackUrl ? (
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-[44px] shrink-0 text-zinc-600">Yedek</span>
                        <span title={asset.fallbackUrl} className="min-w-0 truncate">
                          {shortenMiddle(asset.fallbackUrl)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <Link
                href={getWorkshopAssetsHref(productId, asset.modelId)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Filtrele
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}

          {hiddenCount > 0 ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
              <span>+{hiddenCount} varlık daha</span>
              <Link href={registryHref} className="font-medium text-zinc-200 hover:text-white">
                Tüm bağlı varlıkları aç
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
