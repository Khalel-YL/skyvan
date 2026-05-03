"use client";

import { useMemo, useState } from "react";
import {
  Box,
  CheckCircle2,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Link2,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
} from "lucide-react";

import DeleteMediaButton from "./DeleteMediaButton";
import {
  type MediaAsset,
  type MediaType,
  mediaTypeLabels,
  usageScopeLabels,
} from "./media-types";

type MediaFilter = "all" | MediaType | "featured";

const filters: Array<{ key: MediaFilter; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "image", label: "Görsel" },
  { key: "video", label: "Video" },
  { key: "model3d", label: "3D" },
  { key: "featured", label: "Öne çıkan" },
];

function getTypeIcon(type: MediaType) {
  if (type === "video") {
    return Film;
  }

  if (type === "model3d") {
    return Box;
  }

  return ImageIcon;
}

function getPreview(asset: MediaAsset) {
  if (asset.content.mediaType === "video") {
    if (asset.content.provider === "youtube" && asset.content.embedUrl) {
      return (
        <iframe
          src={asset.content.embedUrl}
          title={asset.title}
          className="h-full min-h-[34rem] w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      );
    }

    if (asset.content.provider === "external") {
      return (
        <div className="relative flex h-full min-h-[34rem] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.15),transparent_26rem),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 text-center">
          {asset.previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Admin media records store external URLs only; no Next image loader is configured for arbitrary sources. */}
              <img
                src={asset.previewUrl}
                alt={asset.content.altText || asset.title}
                className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm"
              />
              <div className="absolute inset-0 bg-black/55" />
            </>
          ) : null}
          <div className="relative max-w-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-zinc-700 bg-black/50 text-zinc-100">
              <Film className="h-9 w-9" />
            </div>
            <p className="mt-6 text-lg font-semibold text-white">Harici video bağlantısı</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Bu kaynak yerleşik oynatıcı olarak çözümlenemedi. Bağlantı güvenli
              şekilde ayrı sekmede açılır.
            </p>
            <a
              href={asset.primaryUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
            >
              Video bağlantısını aç
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      );
    }

    return (
      <video
        className="h-full min-h-[34rem] w-full object-cover"
        controls
        poster={asset.content.posterUrl || asset.content.thumbnailUrl}
        preload="metadata"
      >
        <source src={asset.primaryUrl} />
      </video>
    );
  }

  if (asset.content.mediaType === "model3d") {
    return (
      <div className="relative flex h-full min-h-[34rem] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.16),transparent_28rem),linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] p-6 text-center">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3rem] border border-zinc-700/70 bg-white/[0.035] shadow-[0_0_80px_rgba(255,255,255,0.08)]" />
        <div className="absolute left-[18%] top-[18%] h-24 w-24 rounded-3xl border border-zinc-800 bg-black/30" />
        <div className="absolute bottom-[16%] right-[16%] h-32 w-32 rounded-[2rem] border border-zinc-700/70 bg-white/[0.04]" />
        <div className="relative max-w-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-zinc-600 bg-black/50 text-zinc-100 shadow-[0_0_70px_rgba(255,255,255,0.12)]">
            <Box className="h-11 w-11" />
          </div>
          <p className="mt-6 text-lg font-semibold text-white">3D önizleme altyapısı hazır.</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Viewer entegrasyonu sonraki fazda bağlanacak.
          </p>
          {asset.previewUrl ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element -- Admin media records store external URLs only; no Next image loader is configured for arbitrary sources. */}
              <img
                src={asset.previewUrl}
                alt={asset.content.altText || asset.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!asset.previewUrl) {
    return (
      <div className="flex h-full min-h-[34rem] items-center justify-center bg-zinc-950 text-zinc-700">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em]">
            Önizleme yok
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Admin media records store external URLs only; no Next image loader is configured for arbitrary sources.
    <img
      src={asset.previewUrl}
      alt={asset.content.altText || asset.title}
      className="h-full min-h-[34rem] w-full object-cover"
    />
  );
}

export default function MediaAssetStage({ assets }: { assets: MediaAsset[] }) {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(assets[0]?.id ?? "");

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return assets.filter((asset) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "featured" ? asset.content.isFeatured : asset.content.mediaType === filter);

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        asset.title,
        asset.primaryUrl,
        asset.content.description || "",
        ...asset.content.tags,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(normalizedQuery);
    });
  }, [assets, filter, query]);

  const selectedAsset =
    filteredAssets.find((asset) => asset.id === selectedId) ?? filteredAssets[0] ?? assets[0];

  if (assets.length === 0) {
    return (
      <section className="rounded-[2rem] border border-zinc-800 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_26rem),rgba(9,9,11,0.78)] p-5">
        <div className="flex min-h-[38rem] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-zinc-800 px-6 text-center text-zinc-500">
          <ImageIcon className="h-14 w-14 opacity-35" />
          <p className="mt-5 text-sm font-bold uppercase tracking-widest">
            Henüz medya varlığı yok
          </p>
          <p className="mt-3 max-w-md text-sm leading-6">
            Medya Ekle aksiyonu ile ilk gerçek görsel, video veya 3D referansı oluştur.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-[radial-gradient(circle_at_64%_0%,rgba(255,255,255,0.12),transparent_30rem),rgba(9,9,11,0.82)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.36)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Seçili varlık sahnesi
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">Asset Stage</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Medya seçimi solda kalır; büyük sahne varlığın üretim ve public kullanım
            hissini taşır.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const active = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-zinc-300 bg-zinc-100 text-zinc-950 shadow-[0_0_32px_rgba(255,255,255,0.12)]"
                      : "border-zinc-800 bg-black/35 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Başlık, URL veya etiket ara"
              className="w-full rounded-2xl border border-zinc-800 bg-black py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="min-w-0 rounded-[1.5rem] border border-zinc-800 bg-black/30 p-2 xl:max-h-[52rem] xl:overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              Bu filtre için medya bulunamadı.
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const active = selectedAsset?.id === asset.id;
              const Icon = getTypeIcon(asset.content.mediaType);

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  className={`relative grid w-full grid-cols-[5.4rem_minmax(0,1fr)] gap-3 overflow-hidden rounded-[1.25rem] border p-3 text-left transition ${
                    active
                      ? "border-zinc-300/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.11),rgba(255,255,255,0.045))] text-zinc-100 shadow-[0_0_42px_rgba(255,255,255,0.08)]"
                      : "border-transparent bg-transparent text-zinc-400 hover:bg-white/[0.035] hover:text-zinc-200"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-4 h-12 w-1 rounded-r-full bg-zinc-100 shadow-[0_0_22px_rgba(255,255,255,0.45)]" />
                  ) : null}
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-zinc-950">
                    {asset.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- Admin media records store external URLs only; no Next image loader is configured for arbitrary sources.
                      <img
                        src={asset.previewUrl}
                        alt={asset.content.altText || asset.title}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center text-zinc-600">
                        <Icon className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{asset.title}</p>
                      {asset.content.isFeatured ? (
                        <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
                      ) : null}
                    </div>
                    <p
                      className={`mt-1 truncate text-xs ${
                        active ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      {asset.primaryUrl || "URL yok"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
                          active
                            ? "border-zinc-600 bg-black/35 text-zinc-200"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {mediaTypeLabels[asset.content.mediaType]}
                      </span>
                      {asset.content.tags.slice(0, 2).map((tag) => (
                        <span
                          key={`${asset.id}-${tag}`}
                          className={`max-w-24 truncate rounded-full border px-2 py-1 text-[11px] ${
                            active
                              ? "border-zinc-600 bg-black/35 text-zinc-200"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.content.tags.length > 2 ? (
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${
                            active
                              ? "border-zinc-600 bg-black/35 text-zinc-200"
                              : "border-zinc-800 bg-zinc-950 text-zinc-500"
                          }`}
                        >
                          +{asset.content.tags.length - 2}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedAsset ? (
          <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="relative min-h-[36rem] overflow-hidden bg-zinc-950 2xl:min-h-[42rem]">
              {getPreview(selectedAsset)}
            </div>

            <div className="grid gap-5 border-t border-zinc-800 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent)] p-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                    {mediaTypeLabels[selectedAsset.content.mediaType]}
                  </span>
                  {selectedAsset.content.isFeatured ? (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                      Öne çıkan
                    </span>
                  ) : null}
                  {selectedAsset.hasValidUrl ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      URL doğrulandı
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                      <ShieldAlert className="h-3 w-3" />
                      URL kontrol edilmeli
                    </span>
                  )}
                </div>

                <h3 className="mt-4 break-words text-2xl font-semibold text-white">
                  {selectedAsset.title}
                </h3>
                {selectedAsset.content.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                    {selectedAsset.content.description}
                  </p>
                ) : null}

                <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    <Link2 className="h-3.5 w-3.5" />
                    Kaynak URL
                  </p>
                  <p className="mt-2 truncate text-xs text-zinc-400" title={selectedAsset.primaryUrl}>
                    {selectedAsset.primaryUrl || "URL bilgisi yok"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedAsset.content.tags.length > 0 ? (
                    selectedAsset.content.tags.map((tag) => (
                      <span
                        key={`${selectedAsset.id}-${tag}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-[11px] text-zinc-300"
                      >
                        <Tag className="h-3 w-3 shrink-0 text-amber-500" />
                        <span className="max-w-44 truncate">{tag}</span>
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] text-zinc-500">
                      Etiket yok
                    </span>
                  )}
                </div>
              </div>

              <aside className="space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Kullanım alanı
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {usageScopeLabels[selectedAsset.content.usageScope || "general"]}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Kullanım / Bağlantı
                  </p>
                  {selectedAsset.usageLabels.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {selectedAsset.usageLabels.map((label) => (
                        <p
                          key={label}
                          className="rounded-xl border border-zinc-800 bg-black/35 px-3 py-2 text-xs text-zinc-300"
                        >
                          {label}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Kullanım takibi sonraki fazda bağlanacak. Bu kayda referans
                      veren içerik şu an bulunamadı.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedAsset.hasValidUrl ? (
                    <a
                      href={selectedAsset.primaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 transition hover:border-zinc-700 hover:text-white"
                    >
                      Aç
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <DeleteMediaButton mediaId={selectedAsset.id} />
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
