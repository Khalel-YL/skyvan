import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Link2, Search, ShieldCheck } from "lucide-react";

import { db } from "@/db/db";
import { models, products, visualAssets2d } from "@/db/schema";

import AddWorkshopAssetDrawer from "./AddWorkshopAssetDrawer";
import { WorkshopAssetsList } from "./WorkshopAssetsList";
import type { WorkshopAssetListItem, WorkshopAssetOption } from "./types";

type WorkshopAssetsPageProps = {
  searchParams?: Promise<{
    q?: string;
    productId?: string;
    modelId?: string;
    cameraView?: string;
    fallbackState?: string;
    minLayer?: string;
    maxLayer?: string;
    assetAction?: string;
    assetCode?: string;
    mode?: string;
  }>;
};

type RawWorkshopAssetRow = {
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

function getFlashMessage(
  params: Awaited<NonNullable<WorkshopAssetsPageProps["searchParams"]>>,
): { tone: "success" | "error"; message: string } | null {
  if (params.assetAction === "saved") {
    return {
      tone: "success",
      message:
        params.mode === "updated"
          ? "Workshop varlığı güncellendi."
          : "Workshop varlığı oluşturuldu.",
    };
  }

  if (params.assetAction === "deleted") {
    return {
      tone: "success",
      message: "Workshop varlığı silindi.",
    };
  }

  if (params.assetAction === "error") {
    switch (params.assetCode) {
      case "invalid-id":
        return { tone: "error", message: "Geçersiz kayıt kimliği nedeniyle işlem durduruldu." };
      case "not-found":
        return { tone: "error", message: "Workshop varlığı bulunamadı." };
      case "hotspot-in-use":
        return {
          tone: "error",
          message:
            "Bu varlık hotspot eşleşmeleri tarafından kullanılıyor; önce eşleşmeleri kaldır.",
        };
      case "audit-actor-required":
        return {
          tone: "error",
          message: "İz kaydı/admin aktörü doğrulanamadığı için işlem durduruldu.",
        };
      case "audit-write-failed":
        return {
          tone: "error",
          message:
            "Workshop varlığı silindi ancak iz kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        };
      case "relation-blocked":
        return {
          tone: "error",
          message: "İlişkili kayıt nedeniyle işlem engellendi.",
        };
      case "db-write-failed":
        return {
          tone: "error",
          message: "Veritabanı yazım hatası nedeniyle işlem tamamlanamadı.",
        };
      default:
        return {
          tone: "error",
          message: "Workshop varlığı işlemi sırasında beklenmeyen bir hata oluştu.",
        };
    }
  }

  return null;
}

function toneClassName(tone: "success" | "error") {
  return tone === "success"
    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
    : "border-rose-500/25 bg-rose-500/10 text-rose-100";
}

function getProductLabel(row: {
  productName: string | null;
  productSlug: string | null;
  productSku: string | null;
  productId: string;
}) {
  if (row.productName) {
    return row.productSku ? `${row.productName} · ${row.productSku}` : row.productName;
  }

  if (row.productSlug) {
    return row.productSlug;
  }

  return `Ürün ${row.productId.slice(0, 8)}`;
}

function getModelLabel(row: { modelSlug: string | null; modelId: string }) {
  return row.modelSlug ? formatModelLabel(row.modelSlug) : `Model ${row.modelId.slice(0, 8)}`;
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

function statChip(label: string, value: number) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function parseLayerFilter(value?: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

async function getWorkshopAssetsSafely() {
  if (!db) {
    return [] satisfies WorkshopAssetListItem[];
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
      .orderBy(
        asc(products.name),
        asc(products.slug),
        asc(models.slug),
        asc(visualAssets2d.cameraView),
        asc(visualAssets2d.zIndexLayer),
      )) as RawWorkshopAssetRow[];

    return rows
      .map((row) => ({
        id: row.id,
        productId: row.productId,
        productLabel:
          row.productName || row.productSlug
            ? getProductLabel(row)
            : "Ürün kaydı bulunamadı",
        productSlug: row.productSlug,
        productMissing: !row.productName && !row.productSlug,
        modelId: row.modelId,
        modelLabel: row.modelSlug ? getModelLabel(row) : "Model kaydı bulunamadı",
        modelSlug: row.modelSlug,
        modelMissing: !row.modelSlug,
        cameraView: row.cameraView,
        zIndexLayer: row.zIndexLayer,
        assetUrl: row.assetUrl,
        fallbackUrl: row.fallbackUrl,
      }))
      .sort((left, right) => {
        const productDiff = left.productLabel.localeCompare(right.productLabel, "tr");
        if (productDiff !== 0) return productDiff;

        const modelDiff = (left.modelSlug ?? left.modelLabel).localeCompare(
          right.modelSlug ?? right.modelLabel,
          "tr",
        );
        if (modelDiff !== 0) return modelDiff;

        const cameraDiff = left.cameraView.localeCompare(right.cameraView, "tr");
        if (cameraDiff !== 0) return cameraDiff;

        return left.zIndexLayer - right.zIndexLayer;
      });
  } catch (error) {
    console.error("Workshop assets fetch error:", error);
    return [] satisfies WorkshopAssetListItem[];
  }
}

async function getProductOptionsSafely() {
  if (!db) {
    return [] satisfies WorkshopAssetOption[];
  }

  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
      })
      .from(products)
      .orderBy(asc(products.name));

    return rows.map((product) => ({
      id: product.id,
      label: product.sku ? `${product.name} · ${product.sku}` : product.name,
      slug: product.slug,
    }));
  } catch (error) {
    console.error("Workshop asset product options error:", error);
    return [] satisfies WorkshopAssetOption[];
  }
}

async function getModelOptionsSafely() {
  if (!db) {
    return [] satisfies WorkshopAssetOption[];
  }

  try {
    const rows = await db
      .select({
        id: models.id,
        slug: models.slug,
      })
      .from(models)
      .orderBy(asc(models.slug));

    return rows.map((model) => ({
      id: model.id,
      label: formatModelLabel(model.slug),
      slug: model.slug,
    }));
  } catch (error) {
    console.error("Workshop asset model options error:", error);
    return [] satisfies WorkshopAssetOption[];
  }
}

export default async function WorkshopAssetsPage({
  searchParams,
}: WorkshopAssetsPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);
  const [allAssets, productOptions, modelOptions] = await Promise.all([
    getWorkshopAssetsSafely(),
    getProductOptionsSafely(),
    getModelOptionsSafely(),
  ]);

  const query = (params.q ?? "").trim().toLowerCase();
  const productId = (params.productId ?? "").trim();
  const modelId = (params.modelId ?? "").trim();
  const cameraView = (params.cameraView ?? "").trim();
  const fallbackState =
    params.fallbackState === "present" || params.fallbackState === "missing"
      ? params.fallbackState
      : "all";
  const minLayer = parseLayerFilter(params.minLayer);
  const maxLayer = parseLayerFilter(params.maxLayer);

  const cameraViewOptions = Array.from(
    new Set(allAssets.map((asset) => asset.cameraView).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "tr"));

  const filteredAssets = allAssets.filter((asset) => {
    const matchesQuery = query
      ? [
          asset.assetUrl,
          asset.fallbackUrl ?? "",
          asset.cameraView,
          asset.productLabel,
          asset.productSlug ?? "",
          asset.modelLabel,
          asset.modelSlug ?? "",
        ].some((value) => value.toLowerCase().includes(query))
      : true;

    const matchesProduct = productId ? asset.productId === productId : true;
    const matchesModel = modelId ? asset.modelId === modelId : true;
    const matchesCamera = cameraView ? asset.cameraView === cameraView : true;
    const matchesFallback =
      fallbackState === "present"
        ? Boolean(asset.fallbackUrl)
        : fallbackState === "missing"
          ? !asset.fallbackUrl
          : true;
    const matchesMinLayer = minLayer === null ? true : asset.zIndexLayer >= minLayer;
    const matchesMaxLayer = maxLayer === null ? true : asset.zIndexLayer <= maxLayer;

    return (
      matchesQuery &&
      matchesProduct &&
      matchesModel &&
      matchesCamera &&
      matchesFallback &&
      matchesMinLayer &&
      matchesMaxLayer
    );
  });

  const stats = {
    total: allAssets.length,
    productCount: new Set(allAssets.map((asset) => asset.productId)).size,
    modelCount: new Set(allAssets.map((asset) => asset.modelId)).size,
    cameraCount: cameraViewOptions.length,
    missingFallbackCount: allAssets.filter((asset) => !asset.fallbackUrl).length,
  };
  const flashMessage = getFlashMessage(params);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            ADMIN · WORKSHOP VARLIKLARI
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              Workshop Varlıkları
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-zinc-400">
              Ürün, model ve 2.5D katman görsellerini ayrı bir kayıt omurgasında yönet.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <AddWorkshopAssetDrawer
            productOptions={productOptions}
            modelOptions={modelOptions}
            disabled={!databaseReady}
          />
        </div>
      </div>

      {flashMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${toneClassName(flashMessage.tone)}`}
        >
          {flashMessage.message}
        </div>
      ) : null}

      {!databaseReady ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Veritabanı çevrimdışı olduğu için Workshop varlıkları yalnızca güvenli boş modda görünüyor.
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {statChip("Toplam varlık", stats.total)}
        {statChip("Ürün sayısı", stats.productCount)}
        {statChip("Model sayısı", stats.modelCount)}
        {statChip("Kamera görünümü", stats.cameraCount)}
        {statChip("Eksik yedek", stats.missingFallbackCount)}
      </div>

      <form
        action="/admin/workshop-assets"
        className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3"
      >
        <div className="grid gap-2 lg:grid-cols-[minmax(180px,1.35fr)_minmax(150px,1fr)_minmax(150px,1fr)_minmax(140px,0.8fr)] lg:items-end">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Arama</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                name="q"
                defaultValue={query}
                placeholder="URL, görünüm, ürün veya model ara"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Ürün</span>
            <select
              name="productId"
              defaultValue={productId}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            >
              <option value="">Tüm ürünler</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Model</span>
            <select
              name="modelId"
              defaultValue={modelId}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            >
              <option value="">Tüm modeller</option>
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Kamera görünümü</span>
            <select
              name="cameraView"
              defaultValue={cameraView}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            >
              <option value="">Tüm görünümler</option>
              {cameraViewOptions.map((view) => (
                <option key={view} value={view}>
                  {view}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-[minmax(150px,0.8fr)_120px_120px_auto] md:items-end">
          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Yedek durumu</span>
            <select
              name="fallbackState"
              defaultValue={fallbackState}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            >
              <option value="all">Tümü</option>
              <option value="present">Yedeği olan</option>
              <option value="missing">Yedeği eksik</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Min katman</span>
            <input
              name="minLayer"
              type="number"
              step="1"
              defaultValue={minLayer ?? ""}
              placeholder="Min"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-zinc-500">Max katman</span>
            <input
              name="maxLayer"
              type="number"
              step="1"
              defaultValue={maxLayer ?? ""}
              placeholder="Max"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
            >
              <Search className="h-4 w-4" />
              Uygula
            </button>
            <Link
              href="/admin/workshop-assets"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          İz kaydı zorunlu
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1">
          <Link2 className="h-3.5 w-3.5" />
          Medya kütüphanesinden ayrı
        </span>
      </div>

      <WorkshopAssetsList
        assets={filteredAssets}
        productOptions={productOptions}
        modelOptions={modelOptions}
        databaseReady={databaseReady}
      />
    </div>
  );
}
