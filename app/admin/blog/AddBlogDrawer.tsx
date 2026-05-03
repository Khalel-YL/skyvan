"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  PenTool,
  ShieldAlert,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import { saveBlogPost } from "./actions";

type BlogContentJson = {
  slug?: string;
  coverImage?: string;
  content?: string;
  isPublished?: boolean;
};

type BlogEditorItem = {
  id: string;
  title: string;
  slug: string | null;
  contentJson: unknown;
};

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseContentJson(value: unknown): BlogContentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;

  return {
    slug: typeof raw.slug === "string" ? raw.slug : "",
    coverImage: typeof raw.coverImage === "string" ? raw.coverImage : "",
    content: typeof raw.content === "string" ? raw.content : "",
    isPublished: raw.isPublished === true,
  };
}

function createDraftTemplate(title: string) {
  const safeTitle = title.trim() || "Yeni Skyvan İçeriği";

  return [
    `# ${safeTitle}`,
    "",
    "## Giriş",
    "Bu bölümde konunun neden önemli olduğunu ve kullanıcıya ne fayda sağladığını kısa ve net anlat.",
    "",
    "## Teknik Çerçeve",
    "- Kullanılan sistem veya ürün grubu",
    "- Dikkat edilmesi gereken teknik sınırlar",
    "- Uyum veya entegrasyon notları",
    "",
    "## Operasyonel Notlar",
    "Gerçek kullanım senaryosu, bakım konusu veya karar verirken önemli olan noktaları ekle.",
    "",
    "## Sonuç",
    "Okuyucuyu net bir sonuç ve sonraki adımla bırak.",
  ].join("\n");
}

export default function AddBlogDrawer({
  initialData,
  errorMessage,
  disabled = false,
}: {
  initialData?: BlogEditorItem | null;
  errorMessage?: string | null;
  disabled?: boolean;
}) {
  const isEdit = Boolean(initialData);
  const parsedContent = useMemo(
    () => parseContentJson(initialData?.contentJson),
    [initialData],
  );
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(parsedContent.slug || initialData?.slug || "");
  const [coverImage, setCoverImage] = useState(parsedContent.coverImage || "");
  const [content, setContent] = useState(parsedContent.content || "");
  const [isPublished, setIsPublished] = useState(
    isEdit ? parsedContent.isPublished === true : false,
  );

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(Math.ceil(wordCount / 200), 1);
  const readinessIssues = [
    !title.trim() ? "Başlık eksik" : null,
    !slug.trim() ? "Slug eksik" : null,
    content.trim().length < 120 ? "İçerik kısa" : null,
    !coverImage.trim() ? "Kapak görseli yok" : null,
  ].filter(Boolean) as string[];

  function insertTemplate() {
    setContent((current) => current || createDraftTemplate(title));
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!isEdit) {
      setSlug(normalizeSlug(value));
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between border-b border-zinc-800 px-8 py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Blog / Editör
          </p>
          <h2 className="mt-2 flex items-center gap-3 text-xl font-semibold">
            <PenTool className="h-5 w-5 text-amber-500" />
            {isEdit ? "Makaleyi Düzenle" : "Yeni İçerik"}
          </h2>
        </div>

        <Link
          href="/admin/blog"
          className="rounded-full border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {disabled ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Blog kayıt işlemi için veritabanı bağlantısı gerekir. Admin şu an sadece
            görünür modda çalışıyor.
          </div>
        ) : null}

        <form
          action={saveBlogPost}
          onSubmit={() => setLoading(true)}
          className="space-y-6"
        >
          {isEdit ? <input type="hidden" name="id" value={initialData?.id} /> : null}

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Başlık
            </label>
            <input
              name="title"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              disabled={disabled || loading}
              placeholder="Örn. Karavanda Kış Kullanımı İçin Teknik Hazırlık"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-3xl font-black text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Slug
              </label>
              <input
                name="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={disabled || loading}
                placeholder="karavanda-kis-kullanimi"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-mono text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Okuma
              </label>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                {readTime} dk / {wordCount} kelime
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Kapak Görseli
            </label>

            {coverImage ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Kapak görseli"
                  className="h-40 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 text-zinc-600">
                <div className="flex flex-col items-center gap-3 text-center">
                  <ImageIcon className="h-7 w-7" />
                  <span className="text-xs uppercase tracking-[0.2em]">
                    Kapak görseli eklenmedi
                  </span>
                </div>
              </div>
            )}

            <input
              name="coverImage"
              value={coverImage}
              onChange={(event) => setCoverImage(event.target.value)}
              disabled={disabled || loading}
              placeholder="https://... veya medya kütüphanesinden URL"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  İçerik Editörü
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Bu fazda AI yazar kapalı. İçerik doğrudan editoryal olarak girilir.
                </p>
              </div>

              <button
                type="button"
                onClick={insertTemplate}
                disabled={disabled || loading}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <WandSparkles className="h-3.5 w-3.5 text-amber-500" />
                Şablon Ekle
              </button>
            </div>

            <textarea
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={disabled || loading}
              placeholder="Makale gövdesini Markdown formatında yaz..."
              className="min-h-[320px] w-full resize-none bg-transparent px-4 py-4 text-sm leading-7 text-zinc-200 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Yayın Hazırlığı
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {readinessIssues.length === 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                      <FileText className="h-3.5 w-3.5" />
                      İçerik yapısı dengeli görünüyor
                    </span>
                  ) : (
                    readinessIssues.map((issue) => (
                      <span
                        key={issue}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {issue}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPublished((current) => !current)}
                disabled={disabled || loading}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isPublished
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <Globe className="h-4 w-4" />
                {isPublished ? "Yayına alınacak" : "Taslak kalacak"}
              </button>
            </div>

            <input type="hidden" name="isPublished" value={String(isPublished)} />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-2">
            <Link
              href="/admin/blog"
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
            >
              Vazgeç
            </Link>

            <button
              type="submit"
              disabled={disabled || loading}
              className="rounded-full border border-zinc-200 bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Kaydediliyor..."
                : isEdit
                  ? "Makaleyi Güncelle"
                  : "Makaleyi Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
