import { Box, Film, ImageIcon, Layers3, Link2 } from "lucide-react";

import AddWorkshopAssetDrawer from "./AddWorkshopAssetDrawer";
import DeleteWorkshopAssetButton from "./DeleteWorkshopAssetButton";
import type { WorkshopAssetListItem, WorkshopAssetOption } from "./types";
import { getAssetReferenceKind, shortenMiddle } from "./validation";

type WorkshopAssetsListProps = {
  assets: WorkshopAssetListItem[];
  productOptions: WorkshopAssetOption[];
  modelOptions: WorkshopAssetOption[];
  databaseReady: boolean;
};

function chip(
  label: string,
  tone: "neutral" | "warning" | "success" | "info" = "neutral",
  title?: string,
) {
  const toneClassName =
    tone === "warning"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
      : tone === "success"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
        : tone === "info"
          ? "border-sky-500/25 bg-sky-500/10 text-sky-200"
          : "border-zinc-800 bg-zinc-900 text-zinc-300";

  return (
    <span
      title={title}
      className={`inline-flex max-w-full rounded-full border px-2 py-0.5 text-xs ${toneClassName}`}
    >
      {label}
    </span>
  );
}

function AssetPreview({ assetUrl }: { assetUrl: string }) {
  const referenceKind = getAssetReferenceKind(assetUrl);

  if (referenceKind === "image") {
    return (
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element -- Workshop registry stores external or storage-path preview references. */}
        <img src={assetUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  const placeholder =
    referenceKind === "model3d"
      ? { label: "3D varlık bağlantısı", icon: Box }
      : referenceKind === "video"
        ? { label: "Video varlık bağlantısı", icon: Film }
        : { label: "Varlık bağlantısı", icon: Link2 };
  const Icon = placeholder.icon;

  return (
    <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-1.5 text-center text-[9px] font-medium leading-3 text-zinc-500">
      <Icon className="h-3.5 w-3.5" />
      <span>{placeholder.label}</span>
    </div>
  );
}

export function WorkshopAssetsList({
  assets,
  productOptions,
  modelOptions,
  databaseReady,
}: WorkshopAssetsListProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-10 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
          <Layers3 className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-100">
          Henüz Workshop varlığı yok.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
          İlk varlığı ekleyerek ürün ve model bazlı görsel katman omurgasını başlat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 transition hover:border-zinc-700"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <AssetPreview assetUrl={asset.assetUrl} />

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-sm font-semibold text-zinc-100">
                    {asset.productLabel}
                  </h3>
                  <span className="text-xs text-zinc-600">/</span>
                  <span className="break-words text-sm font-medium text-zinc-300">
                    {asset.modelLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {chip(
                    getAssetReferenceKind(asset.assetUrl) === "image"
                      ? "Görsel"
                      : getAssetReferenceKind(asset.assetUrl) === "model3d"
                        ? "3D bağlantı"
                        : getAssetReferenceKind(asset.assetUrl) === "video"
                          ? "Video bağlantı"
                          : "Bağlantı",
                    "info",
                  )}
                  {chip(`Görünüm ${asset.cameraView}`, "neutral", asset.cameraView)}
                  {chip(`Katman ${asset.zIndexLayer}`)}
                  {asset.fallbackUrl
                    ? chip("Yedek var", "success")
                    : chip("Yedek eksik", "warning")}
                  {asset.productMissing ? chip("Ürün kaydı bulunamadı", "warning") : null}
                  {asset.modelMissing ? chip("Model kaydı bulunamadı", "warning") : null}
                </div>

                <div className="grid gap-1 text-xs text-zinc-500">
                  <div className="flex min-w-0 items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    <span className="shrink-0 text-zinc-600">Varlık</span>
                    <span title={asset.assetUrl} className="min-w-0 truncate text-zinc-300">
                      {shortenMiddle(asset.assetUrl, 72)}
                    </span>
                  </div>
                  {asset.fallbackUrl ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-[46px] shrink-0 text-zinc-600">Yedek</span>
                      <span title={asset.fallbackUrl} className="min-w-0 truncate">
                        {shortenMiddle(asset.fallbackUrl, 72)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
              <AddWorkshopAssetDrawer
                initialData={asset}
                productOptions={productOptions}
                modelOptions={modelOptions}
                disabled={!databaseReady}
                compact
              />
              <DeleteWorkshopAssetButton id={asset.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
