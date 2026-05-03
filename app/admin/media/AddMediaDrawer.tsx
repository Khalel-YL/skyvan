"use client";

import { useMemo, useState } from "react";
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  ShieldAlert,
  Tag,
  UploadCloud,
} from "lucide-react";

import { saveMedia } from "./actions";

function normalizePreviewTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

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
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState("");
  const previewTags = useMemo(() => normalizePreviewTags(tags), [tags]);

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
                  Gerçek URL, dosya adı ve editoryal etiketlerle yeni medya
                  referansı oluştur.
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
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Önizleme
                  </label>

                  {imageUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Admin media records store external URLs only; no Next image loader is configured for arbitrary sources. */}
                      <img
                        src={imageUrl}
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
                    Görsel URL
                  </label>

                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      name="imageUrl"
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      disabled={disabled || loading}
                      required
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-zinc-800 bg-black py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Dosya adı
                  </label>
                  <input
                    name="fileName"
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    disabled={disabled || loading}
                    required
                    placeholder="Örn. Mutfak Modülü Ön Görünüm"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  />
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
                      name="aiTags"
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
