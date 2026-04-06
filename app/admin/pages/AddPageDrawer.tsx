"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Globe,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { savePage, type PageFormState } from "./actions";

type PageRecord = {
  id: string;
  entityId: string;
  locale: string;
  title: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  contentJsonText: string;
};

type Props = {
  initialData: PageRecord | null;
};

const initialState: PageFormState = {
  ok: false,
  message: "",
  values: {
    id: "",
    entityId: "",
    locale: "tr",
    title: "",
    slug: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    contentJson: "",
    isPublished: true,
  },
  errors: {},
};

function normalizeSlug(value: string) {
  return value
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
    .replace(/^-|-$/g, "");
}

function buildDefaultContentJson(title: string) {
  return JSON.stringify(
    {
      blocks: [
        {
          type: "hero",
          heading: title || "Yeni sayfa",
          subtext: "Skyvan",
          body: "Bu alan ilk içerik omurgası için başlangıç bloğudur.",
        },
      ],
    },
    null,
    2,
  );
}

function getValue(
  state: PageFormState,
  initialData: PageRecord | null,
  key: keyof PageFormState["values"],
) {
  const stateValue = state.values?.[key];

  if (typeof stateValue !== "undefined" && stateValue !== "") {
    return stateValue;
  }

  if (key === "isPublished") {
    if (typeof stateValue === "boolean") return stateValue;
    return initialData?.isPublished ?? true;
  }

  if (initialData) {
    if (key === "description") return initialData.description ?? "";
    if (key === "seoTitle") return initialData.seoTitle ?? "";
    if (key === "seoDescription") return initialData.seoDescription ?? "";
    if (key === "contentJson") return initialData.contentJsonText ?? "";
    return (initialData as unknown as Record<string, string>)[key] ?? "";
  }

  if (key === "locale") return "tr";
  if (key === "contentJson") return "";

  return "";
}

export default function AddPageDrawer({ initialData }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(savePage, initialState);

  const [titleDraft, setTitleDraft] = useState(initialData?.title ?? "");
  const [slugDraft, setSlugDraft] = useState(initialData?.slug ?? "");
  const [localeDraft, setLocaleDraft] = useState(initialData?.locale ?? "tr");
  const [contentDraft, setContentDraft] = useState(
    initialData?.contentJsonText ?? "",
  );
  const [seoDraft, setSeoDraft] = useState(initialData?.seoDescription ?? "");
  const [isSlugTouched, setIsSlugTouched] = useState(Boolean(initialData?.slug));
  const isEdit = Boolean(initialData?.id);

  useEffect(() => {
    if (!isSlugTouched) {
      setSlugDraft(normalizeSlug(titleDraft));
    }
  }, [isSlugTouched, titleDraft]);

  useEffect(() => {
    if (!contentDraft.trim() && titleDraft.trim()) {
      setContentDraft(buildDefaultContentJson(titleDraft));
    }
  }, [contentDraft, titleDraft]);

  useEffect(() => {
    if (state.ok) {
      router.replace("/admin/pages");
      router.refresh();
    }
  }, [router, state.ok]);

  useEffect(() => {
    if (state.values?.locale) {
      setLocaleDraft(String(state.values.locale));
    }
  }, [state.values]);

  const currentValues = useMemo(
    () => ({
      id: String(getValue(state, initialData, "id")),
      entityId: String(getValue(state, initialData, "entityId")),
      locale: localeDraft,
      title: String(getValue(state, initialData, "title")) || titleDraft,
      slug: String(getValue(state, initialData, "slug")) || slugDraft,
      description: String(getValue(state, initialData, "description")),
      seoTitle: String(getValue(state, initialData, "seoTitle")),
      seoDescription:
        String(getValue(state, initialData, "seoDescription")) || seoDraft,
      contentJson:
        String(getValue(state, initialData, "contentJson")) || contentDraft,
      isPublished: Boolean(getValue(state, initialData, "isPublished")),
    }),
    [contentDraft, initialData, localeDraft, seoDraft, slugDraft, state, titleDraft],
  );

  const seoLength = currentValues.seoDescription.length;
  const seoTone =
    seoLength === 0
      ? "text-zinc-500"
      : seoLength < 90
        ? "text-amber-300"
        : seoLength <= 160
          ? "text-emerald-300"
          : "text-red-300";

  const previewUrl = currentValues.id
    ? `/admin/pages/preview/${currentValues.id}`
    : "";

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            Admin · Pages
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {isEdit ? "Sayfa düzenle" : "Yeni sayfa oluştur"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Pages modülü `localized_content` tablosunun page kayıtlarını yönetir.
            Aynı sayfanın locale varyantları aynı `entityId` altında tutulur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEdit ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
              Önizleme
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => {
              router.replace("/admin/pages");
              router.refresh();
            }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            aria-label="Düzenlemeyi kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={currentValues.id} />
        <input type="hidden" name="entityId" value={currentValues.entityId} />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-zinc-200">
              Sayfa başlığı
            </span>
            <input
              name="title"
              value={currentValues.title}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Örn. Hakkımızda"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
            />
            {state.errors?.title ? (
              <p className="text-xs text-red-300">{state.errors.title}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-200">Locale</span>
            <input
              name="locale"
              value={currentValues.locale}
              onChange={(event) => setLocaleDraft(event.target.value)}
              placeholder="tr"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
            />
            {state.errors?.locale ? (
              <p className="text-xs text-red-300">{state.errors.locale}</p>
            ) : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-zinc-200">Slug</span>
            <input
              name="slug"
              value={currentValues.slug}
              onChange={(event) => {
                setIsSlugTouched(true);
                setSlugDraft(normalizeSlug(event.target.value));
              }}
              placeholder="hakkimizda"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-zinc-600"
            />
            {state.errors?.slug ? (
              <p className="text-xs text-red-300">{state.errors.slug}</p>
            ) : null}
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-zinc-200">Yayın</div>
              <div className="mt-1 text-xs text-zinc-500">
                Kapalıysa taslak davranır.
              </div>
            </div>

            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={currentValues.isPublished}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-white"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-200">Açıklama</span>
          <textarea
            name="description"
            defaultValue={currentValues.description}
            rows={3}
            placeholder="Sayfanın kısa açıklaması"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-zinc-200">SEO başlığı</span>
            <input
              name="seoTitle"
              defaultValue={currentValues.seoTitle}
              placeholder="Arama sonuçlarında görünecek başlık"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
            />
          </label>

          <label className="space-y-2">
            <span className="flex items-center justify-between text-sm font-medium text-zinc-200">
              <span>SEO açıklaması</span>
              <span className={`text-xs ${seoTone}`}>{seoLength} / 160</span>
            </span>
            <textarea
              name="seoDescription"
              value={currentValues.seoDescription}
              onChange={(event) => setSeoDraft(event.target.value)}
              rows={3}
              placeholder="Arama motoru açıklaması"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            <FileText className="h-4 w-4" />
            İçerik JSON
          </span>
          <textarea
            name="contentJson"
            value={currentValues.contentJson}
            onChange={(event) => setContentDraft(event.target.value)}
            rows={12}
            placeholder='{"blocks":[{"type":"hero","heading":"Başlık","subtext":"Skyvan"}]}'
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs text-white outline-none transition focus:border-zinc-600"
          />
          {state.errors?.contentJson ? (
            <p className="text-xs text-red-300">{state.errors.contentJson}</p>
          ) : (
            <p className="text-xs text-zinc-500">
              İlk aşamada içerik yapısı basit JSON olarak tutulur. Sonraki aşamada
              blok editörü açılabilir.
            </p>
          )}
        </label>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              <Globe className="h-4 w-4" />
              Locale
            </div>
            <div className="mt-3 text-sm text-white">{currentValues.locale || "-"}</div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              <Search className="h-4 w-4" />
              Slug önizleme
            </div>
            <div className="mt-3 break-all font-mono text-sm text-white">
              /{currentValues.slug || "-"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              <Sparkles className="h-4 w-4" />
              Durum
            </div>
            <div className="mt-3 text-sm text-white">
              {currentValues.isPublished ? "Yayında" : "Taslak"}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              <ExternalLink className="h-4 w-4" />
              Test
            </div>
            <div className="mt-3 text-sm text-white">
              {isEdit ? "Önizleme hazır" : "Kayıttan sonra açılır"}
            </div>
          </div>
        </div>

        {state.errors?.form ? (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {state.errors.form}
          </div>
        ) : null}

        {state.message ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              state.ok
                ? "border border-emerald-900/60 bg-emerald-950/40 text-emerald-200"
                : "border border-zinc-800 bg-zinc-950 text-zinc-300"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-zinc-900 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-zinc-500">
            Pages modülü bu batch’te locale varyantları ve preview akışıyla
            güçlendiriliyor.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                router.replace("/admin/pages");
                router.refresh();
              }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Wand2 className="h-4 w-4 animate-pulse" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  {isEdit ? "Sayfayı güncelle" : "Sayfayı oluştur"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}