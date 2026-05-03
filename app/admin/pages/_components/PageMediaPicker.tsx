"use client";

import { useMemo, useState } from "react";
import { Box, Check, Film, Image as ImageIcon, Search, X } from "lucide-react";

import type { PageBlockMedia } from "../_lib/page-blocks";

export type PageMediaPickerAsset = PageBlockMedia & {
  tags: string[];
};

type MediaFilter = "all" | PageBlockMedia["mediaType"];

const filters: Array<{ key: MediaFilter; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "image", label: "Görsel" },
  { key: "video", label: "Video" },
  { key: "model3d", label: "3D" },
];

function getTypeLabel(type: PageBlockMedia["mediaType"]) {
  if (type === "video") return "Video";
  if (type === "model3d") return "3D";
  return "Görsel";
}

function TypeIcon({
  type,
  className,
}: {
  type: PageBlockMedia["mediaType"];
  className?: string;
}) {
  if (type === "video") {
    return <Film className={className} />;
  }

  if (type === "model3d") {
    return <Box className={className} />;
  }

  return <ImageIcon className={className} />;
}

export function PageMediaPicker({
  mediaAssets,
  selected,
  onSelect,
  onRemove,
}: {
  mediaAssets: PageMediaPickerAsset[];
  selected?: PageBlockMedia;
  onSelect: (media: PageBlockMedia) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [query, setQuery] = useState("");

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return mediaAssets.filter((asset) => {
      if (filter !== "all" && asset.mediaType !== filter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [asset.title, asset.url, asset.previewUrl || "", ...asset.tags]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(normalizedQuery);
    });
  }, [filter, mediaAssets, query]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Medya bağlantısı
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Blok görselini Medya Kütüphanesi kayıtlarından seç.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-2xl border border-zinc-700 bg-black px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-500"
        >
          {selected ? "Medyayı değiştir" : "Medya seç"}
        </button>
      </div>

      {selected ? (
        <div className="mt-3 grid gap-3 rounded-2xl border border-zinc-800 bg-black/40 p-3 md:grid-cols-[5.5rem_minmax(0,1fr)_auto] md:items-center">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            {selected.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Admin media picker displays external media library URLs.
              <img
                src={selected.previewUrl}
                alt={selected.altText || selected.title}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-zinc-600">
                {selected ? (
                  <TypeIcon type={selected.mediaType} className="h-6 w-6" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300">
                {getTypeLabel(selected.mediaType)}
              </span>
              {selected.provider ? (
                <span className="rounded-full border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500">
                  {selected.provider}
                </span>
              ) : null}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-white">{selected.title}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{selected.url}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-rose-200 transition hover:border-rose-500/40 hover:bg-rose-500/10"
          >
            Medyayı kaldır
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Medya seç</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Hero bloğuna bağlanacak gerçek medya kaydını seç.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-zinc-800 p-3 text-zinc-400 hover:text-white"
                aria-label="Medya seçiciyi kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-zinc-800 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                        filter === item.key
                          ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                          : "border-zinc-800 bg-black text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full lg:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Başlık, URL veya etiket ara"
                    className="w-full rounded-2xl border border-zinc-800 bg-black py-3 pl-11 pr-4 text-sm outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              {mediaAssets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
                  Henüz medya kaydı yok. Önce Medya Kütüphanesi’nden kayıt oluştur.
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
                  Bu filtre için medya bulunamadı.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAssets.map((asset) => {
                    const active = selected?.mediaId === asset.mediaId;

                    return (
                      <button
                        key={asset.mediaId}
                        type="button"
                        onClick={() => {
                          onSelect({
                            mediaId: asset.mediaId,
                            mediaType: asset.mediaType,
                            title: asset.title,
                            url: asset.url,
                            previewUrl: asset.previewUrl,
                            embedUrl: asset.embedUrl,
                            provider: asset.provider,
                            altText: asset.altText,
                          });
                          setOpen(false);
                        }}
                        className={`rounded-2xl border p-3 text-left transition ${
                          active
                            ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                            : "border-zinc-800 bg-black/35 text-zinc-300 hover:border-zinc-600"
                        }`}
                      >
                        <div className="overflow-hidden rounded-xl border border-black/10 bg-zinc-950">
                          {asset.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- Admin media picker displays external media library URLs.
                            <img
                              src={asset.previewUrl}
                              alt={asset.altText || asset.title}
                              className="aspect-[16/9] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[16/9] items-center justify-center text-zinc-600">
                              <TypeIcon type={asset.mediaType} className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] ${
                              active
                                ? "border-zinc-300 text-zinc-700"
                                : "border-zinc-800 text-zinc-400"
                            }`}
                          >
                            {getTypeLabel(asset.mediaType)}
                          </span>
                          {active ? <Check className="h-4 w-4" /> : null}
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold">{asset.title}</p>
                        <p className={`mt-1 truncate text-xs ${active ? "text-zinc-600" : "text-zinc-500"}`}>
                          {asset.url}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
