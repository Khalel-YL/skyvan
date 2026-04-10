"use client";

import { useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Link as LinkIcon,
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
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState("");
  const previewTags = useMemo(() => normalizePreviewTags(tags), [tags]);

  return (
    <div className="h-screen min-w-[420px] overflow-y-auto border-l border-white/5 bg-[#0a0a0a] p-8 text-white">
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          Yeni Görsel Yükle
          <UploadCloud className="h-5 w-5 text-blue-500" />
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Medya kayıtları gerçek URL, dosya adı ve etiketlerle yönetilir. Bu fazda
          otomatik Vision/AI etiketleme yoktur.
        </p>
      </div>

      {noticeMessage ? (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${toneClasses(noticeTone)}`}>
          {noticeMessage}
        </div>
      ) : null}

      {disabled ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Medya kaydı oluşturmak için veritabanı bağlantısı gerekir.
        </div>
      ) : null}

      <form action={saveMedia} onSubmit={() => setLoading(true)} className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Önizleme
          </label>

          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <img
                src={imageUrl}
                alt="Medya önizleme"
                className="h-52 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#050505] text-zinc-600">
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
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-4 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Dosya Adı
          </label>
          <input
            name="fileName"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            disabled={disabled || loading}
            required
            placeholder="Örn. Mutfak Modülü Ön Görünüm"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-zinc-900 p-2 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Etiketleme notu</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Etiketler en az bir adet olmalı ve editoryal olarak açık, tekrar
                kullanılabilir ifadeler içermeli.
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
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
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
  );
}
