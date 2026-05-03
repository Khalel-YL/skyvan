"use client";

import { useMemo, useState } from "react";
import {
  X,
  Box,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  ShieldAlert,
  Tag,
  UploadCloud,
  Video,
} from "lucide-react";

import { saveMedia } from "./actions";
import { type MediaType, mediaTypeLabels, normalizeTags } from "./media-types";

function toneClasses(tone: "success" | "error" | "info") {
  if (tone === "success") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "error") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-100";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

export default function AddMediaDrawer({
  disabled = false,
  noticeMessage,
  noticeTone = "info",
}: {
  disabled?: boolean;
  noticeMessage?: string | null;
  noticeTone?: "success" | "error" | "info";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const previewTags = useMemo(() => normalizeTags(tags), [tags]);
  const previewUrl =
    mediaType === "image"
      ? thumbnailUrl || url
      : mediaType === "video"
        ? posterUrl || thumbnailUrl
        : thumbnailUrl || posterUrl;

  const typeOptions: Array<{
    type: MediaType;
    icon: typeof ImageIcon;
    helper: string;
  }> = [
    {
      type: "image",
      icon: ImageIcon,
      helper: "Public sayfa ve blok görselleri",
    },
    {
      type: "video",
      icon: Video,
      helper: "YouTube, Shorts veya direkt video",
    },
    {
      type: "model3d",
      icon: Box,
      helper: "Viewer entegrasyonuna hazır 3D varlık",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_18px_60px_rgba(255,255,255,0.08)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        Medya Ekle
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 p-3 backdrop-blur-sm sm:p-5">
          <button
            type="button"
            aria-label="Medya ekleme panelini kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <section className="relative flex h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  Yeni medya kaydı
                  <UploadCloud className="h-5 w-5 text-zinc-300" />
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  Görsel, video veya 3D varlığı gerçek URL ve editoryal
                  metadata ile kaydet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                aria-label="Paneli kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {noticeMessage ? (
                <div className={`mb-5 rounded-2xl border p-4 text-sm ${toneClasses(noticeTone)}`}>
                  {noticeMessage}
                </div>
              ) : null}

              {disabled ? (
                <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Medya kaydı oluşturmak için veritabanı bağlantısı gerekir.
                </div>
              ) : null}

              <form action={saveMedia} onSubmit={() => setLoading(true)} className="space-y-5">
                <input type="hidden" name="mediaType" value={mediaType} />

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Medya tipi
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {typeOptions.map((option) => {
                      const Icon = option.icon;
                      const active = mediaType === option.type;

                      return (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => setMediaType(option.type)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                              : "border-zinc-800 bg-black/35 text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <Icon className="h-4 w-4" />
                            {active ? <Check className="h-4 w-4" /> : null}
                          </span>
                          <span className="mt-3 block text-sm font-semibold">
                            {mediaTypeLabels[option.type]}
                          </span>
                          <span
                            className={`mt-1 block text-xs leading-5 ${
                              active ? "text-zinc-600" : "text-zinc-500"
                            }`}
                          >
                            {option.helper}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Önizleme
                  </label>

                  {previewUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Admin media records store external URLs only; no Next image loader is configured for arbitrary sources. */}
                      <img
                        src={previewUrl}
                        alt="Medya önizleme"
                        className="aspect-[16/9] max-h-56 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] max-h-56 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-black text-zinc-600">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <ImageIcon className="h-8 w-8 opacity-60" />
                        <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                          URL girildiğinde önizleme görünür
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {mediaType === "image"
                      ? "Görsel URL"
                      : mediaType === "video"
                        ? "Video URL"
                        : "3D model URL"}
                  </label>
                  {mediaType === "video" ? (
                    <p className="text-xs leading-5 text-zinc-500">
                      YouTube, Shorts veya direkt mp4/webm video bağlantısı ekleyebilirsin.
                    </p>
                  ) : null}

                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      name={mediaType === "model3d" ? "modelUrl" : "url"}
                      value={mediaType === "model3d" ? modelUrl : url}
                      onChange={(event) =>
                        mediaType === "model3d"
                          ? setModelUrl(event.target.value)
                          : setUrl(event.target.value)
                      }
                      disabled={disabled || loading}
                      required
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-zinc-800 bg-black py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {mediaType === "image" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Thumbnail URL
                    </label>
                    <input
                      name="thumbnailUrl"
                      value={thumbnailUrl}
                      onChange={(event) => setThumbnailUrl(event.target.value)}
                      disabled={disabled || loading}
                      placeholder="Opsiyonel"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                ) : null}

                {mediaType === "video" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Poster görseli URL (opsiyonel)
                    </label>
                    <p className="text-xs leading-5 text-zinc-500">
                      YouTube bağlantılarında poster otomatik denenir.
                    </p>
                    <input
                      name="posterUrl"
                      value={posterUrl}
                      onChange={(event) => setPosterUrl(event.target.value)}
                      disabled={disabled || loading}
                      placeholder="Video sahnesi için önerilir"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                ) : null}

                {mediaType === "model3d" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Önizleme görseli URL
                    </label>
                    <input
                      name="thumbnailUrl"
                      value={thumbnailUrl}
                      onChange={(event) => setThumbnailUrl(event.target.value)}
                      disabled={disabled || loading}
                      required
                      placeholder="3D varlık için preview görseli"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                ) : null}

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Başlık
                  </label>
                  <input
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={disabled || loading}
                    required
                    placeholder="Örn. Mutfak Modülü Ön Görünüm"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    disabled={disabled || loading}
                    rows={3}
                    placeholder="Opsiyonel kısa kullanım notu"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {mediaType === "image" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Alt text
                    </label>
                    <input
                      name="altText"
                      disabled={disabled || loading}
                      required
                      placeholder="Görsel erişilebilirlik açıklaması"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Kullanım alanı
                    </span>
                    <select
                      name="usageScope"
                      disabled={disabled || loading}
                      className="skyvan-select w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                      defaultValue="general"
                    >
                      <option value="general">Genel</option>
                      <option value="public">Public</option>
                      <option value="admin">Admin</option>
                      <option value="workshop">Workshop</option>
                      <option value="product">Ürün</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 self-end rounded-2xl border border-zinc-800 bg-black/35 px-4 py-3 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      value="true"
                      disabled={disabled || loading}
                      className="h-4 w-4 accent-zinc-100"
                    />
                    Öne çıkar
                  </label>
                </div>

                <div className="space-y-3 rounded-2xl border border-zinc-800 bg-black/35 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-zinc-900 p-2 text-amber-400">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Etiketleme notu</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        Etiketler en az bir adet olmalı ve editoryal olarak açık,
                        tekrar kullanılabilir ifadeler içermeli.
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-3">
                    <Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      name="tags"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                      disabled={disabled || loading}
                      required
                      placeholder="Örn. mutfak, ic-mekan, premium"
                      className="w-full rounded-2xl border border-zinc-800 bg-black/40 py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {previewTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {previewTags.map((tag) => (
                        <span
                          key={tag}
                          className="max-w-full break-all rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={disabled || loading}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Kaydediliyor..." : "Medya Kaydını Oluştur"}
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
