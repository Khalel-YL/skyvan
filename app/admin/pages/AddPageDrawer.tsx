"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe, Sparkles, Wand2, X } from "lucide-react";

import { savePage, type PageFormState } from "./actions";

type DrawerPageRecord = {
  id: string;
  entityId: string;
  locale: string;
  title: string;
  slug: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  contentJson?: unknown;
};

const initialState: PageFormState = {
  ok: false,
  message: "",
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

function normalizeLocale(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/[^a-z-]/g, "")
    .slice(0, 10);
}

function createDefaultEditorValue(params?: {
  title?: string;
  description?: string;
  locale?: string;
}) {
  const title = params?.title?.trim() || "";
  const description = params?.description?.trim() || "";
  const locale = normalizeLocale(params?.locale || "tr") || "tr";
  const localeLabel = locale.toUpperCase();

  return JSON.stringify(
    {
      blocks: [
        {
          type: "hero",
          heading: title || "Yeni sayfa",
          subtext: `Skyvan ${localeLabel} public sayfası`,
          body:
            description ||
            "Bu sayfa Skyvan yönetim panelinden yönetilir. İçerik yapısı hero, anlatım, öne çıkanlar ve çağrı bloklarıyla kontrollü şekilde yayınlanır.",
          ctaLabel: "İletişime geç",
          ctaHref: "/",
        },
        {
          type: "text",
          heading: "İçerik özeti",
          body:
            "Bu alan public sayfanın ana anlatım bölümüdür. Marka dili, sayfa amacı ve kullanıcıya verilmek istenen net mesaj burada yer almalıdır.",
        },
        {
          type: "feature-list",
          heading: "Öne çıkanlar",
          items: [
            "Admin panelden yönetilir",
            "Public route üzerinden yayınlanır",
            "SEO alanları ayrı kontrol edilir",
            "Locale varyant akışına uygundur",
          ],
        },
        {
          type: "stats",
          heading: "Hızlı bakış",
          stats: [
            { label: "Yayın tipi", value: "Public page" },
            { label: "İçerik modeli", value: "Block-based" },
            { label: "Locale", value: localeLabel },
          ],
        },
        {
          type: "cta",
          heading: "Sonraki adım",
          body:
            "Bu sayfayı daha güçlü hale getirmek için blok içeriklerini gerçek kullanım metinleriyle doldur ve SEO başlıklarını sayfa amacıyla hizala.",
          ctaLabel: "Ana sayfaya dön",
          ctaHref: "/",
        },
      ],
    },
    null,
    2,
  );
}

function getEditorValueFromContentJson(contentJson: unknown) {
  if (!contentJson || typeof contentJson !== "object" || Array.isArray(contentJson)) {
    return createDefaultEditorValue();
  }

  const raw = contentJson as Record<string, unknown>;
  const blocks = Array.isArray(raw.blocks) ? raw.blocks : [];

  if (blocks.length === 0) {
    return createDefaultEditorValue();
  }

  return JSON.stringify({ blocks }, null, 2);
}

export default function AddPageDrawer({
  open = true,
  onClose,
  initialData,
  seedLocale,
  seedTitle,
  seedEntityId,
}: {
  open?: boolean;
  onClose?: () => void;
  initialData?: DrawerPageRecord | null;
  seedLocale?: string;
  seedTitle?: string;
  seedEntityId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, formAction, isPending] = useActionState(savePage, initialState);
  const isEdit = Boolean(initialData?.id);

  const defaultLocale = seedLocale || initialData?.locale || "tr";
  const defaultTitle = seedTitle || initialData?.title || "";
  const defaultDescription = initialData?.description || "";
  const defaultSeoTitle = initialData?.seoTitle || "";
  const defaultSeoDescription = initialData?.seoDescription || "";
  const defaultSlug = initialData?.slug || normalizeSlug(defaultTitle);

  const defaultContent = useMemo(() => {
    if (initialData?.contentJson) {
      return getEditorValueFromContentJson(initialData.contentJson);
    }

    return createDefaultEditorValue({
      title: defaultTitle,
      description: defaultDescription,
      locale: defaultLocale,
    });
  }, [defaultDescription, defaultLocale, defaultTitle, initialData?.contentJson]);

  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [locale, setLocale] = useState(defaultLocale);
  const [description, setDescription] = useState(defaultDescription);
  const [seoTitle, setSeoTitle] = useState(defaultSeoTitle);
  const [seoDescription, setSeoDescription] = useState(defaultSeoDescription);
  const [content, setContent] = useState(defaultContent);
  const [isPublished, setIsPublished] = useState<boolean>(() => {
    const rawContent = initialData?.contentJson;

    if (rawContent && typeof rawContent === "object" && !Array.isArray(rawContent)) {
      const published = (rawContent as { isPublished?: boolean }).isPublished;
      if (typeof published === "boolean") {
        return published;
      }
    }

    return true;
  });

  function closeDrawer() {
    if (onClose) {
      onClose();
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("edit");
    nextParams.delete("entityId");
    nextParams.delete("seedLocale");
    nextParams.delete("seedTitle");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(defaultTitle);
    setSlug(defaultSlug);
    setLocale(defaultLocale);
    setDescription(defaultDescription);
    setSeoTitle(defaultSeoTitle);
    setSeoDescription(defaultSeoDescription);
    setContent(defaultContent);
    setIsPublished(() => {
      const rawContent = initialData?.contentJson;

      if (rawContent && typeof rawContent === "object" && !Array.isArray(rawContent)) {
        const published = (rawContent as { isPublished?: boolean }).isPublished;
        if (typeof published === "boolean") {
          return published;
        }
      }

      return true;
    });
  }, [
    defaultContent,
    defaultDescription,
    defaultLocale,
    defaultSeoDescription,
    defaultSeoTitle,
    defaultSlug,
    defaultTitle,
    initialData?.contentJson,
    open,
  ]);

  useEffect(() => {
    if (!isEdit) {
      setSlug(normalizeSlug(title));
    }
  }, [isEdit, title]);

  useEffect(() => {
    if (state.ok) {
      closeDrawer();
    }
  }, [state.ok]);

  function handleGenerateSeo() {
    const safeTitle = title.trim() || "Skyvan sayfası";
    const safeDescription =
      description.trim() ||
      "Skyvan tarafından yönetilen public içerik sayfası.";

    const generatedTitle =
      safeTitle.length > 60 ? safeTitle.slice(0, 60).trim() : safeTitle;

    const generatedDescription = `${safeTitle} hakkında içerik, öne çıkanlar ve sayfa detaylarını keşfedin. ${safeDescription}`
      .slice(0, 160)
      .trim();

    setSeoTitle(generatedTitle);
    setSeoDescription(generatedDescription);
  }

  function handleRegenerateContent() {
    setContent(
      createDefaultEditorValue({
        title,
        description,
        locale,
      }),
    );
  }

  if (!open) {
    return null;
  }

  const seoDescriptionLength = seoDescription.trim().length;
  const seoDescriptionTone =
    seoDescriptionLength === 0
      ? "Henüz boş"
      : seoDescriptionLength < 90
        ? "Biraz kısa"
        : seoDescriptionLength <= 160
          ? "İyi aralık"
          : "Fazla uzun";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
      <div className="h-full w-full max-w-3xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Admin / Pages
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {isEdit ? "Sayfayı düzenle" : "Yeni page oluştur"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Public rendering için içerik, SEO ve locale varyantını tek yerden yönet.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-2xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-6 px-6 py-6">
          <input type="hidden" name="id" value={initialData?.id ?? ""} />
          <input
            type="hidden"
            name="entityId"
            value={initialData?.entityId ?? seedEntityId ?? ""}
          />

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Temel bilgiler</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Başlık, slug ve locale bu page’in public kimliğini oluşturur.
                </p>
              </div>

              <div className="rounded-full border border-zinc-800 px-3 py-1 text-[11px] text-zinc-400">
                {isEdit ? "Edit" : "Create"}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs text-zinc-400">Locale</span>
                <input
                  name="locale"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value)}
                  placeholder="tr"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                />
                {state.errors?.locale ? (
                  <p className="text-xs text-rose-400">{state.errors.locale}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-xs text-zinc-400">Başlık</span>
                <input
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Örn. Premium Karavan Dönüşümü"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                />
                {state.errors?.title ? (
                  <p className="text-xs text-rose-400">{state.errors.title}</p>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-xs text-zinc-400">Slug</span>
                <input
                  name="slug"
                  value={slug}
                  onChange={(event) => setSlug(normalizeSlug(event.target.value))}
                  placeholder="premium-karavan-donusumu"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 font-mono text-sm outline-none transition focus:border-zinc-600"
                />
                {state.errors?.slug ? (
                  <p className="text-xs text-rose-400">{state.errors.slug}</p>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-xs text-zinc-400">Açıklama</span>
                <textarea
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Sayfanın kısa açıklaması"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">SEO</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Bu alan public metadata üretiminde kullanılır.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateSeo}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                SEO taslağı üret
              </button>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-xs text-zinc-400">SEO başlığı</span>
                <input
                  name="seoTitle"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder="Arama motoru başlığı"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                />
                <div className="text-[11px] text-zinc-500">{seoTitle.length} / 90</div>
                {state.errors?.seoTitle ? (
                  <p className="text-xs text-rose-400">{state.errors.seoTitle}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-xs text-zinc-400">SEO açıklaması</span>
                <textarea
                  name="seoDescription"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  rows={4}
                  placeholder="Arama motoru açıklaması"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{seoDescriptionTone}</span>
                  <span>{seoDescriptionLength} / 170</span>
                </div>
                {state.errors?.seoDescription ? (
                  <p className="text-xs text-rose-400">{state.errors.seoDescription}</p>
                ) : null}
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">İçerik blokları</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  JSON editörü üzerinden hero, text, feature-list, stats ve cta bloklarını yönet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegenerateContent}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                <Wand2 className="h-4 w-4" />
                Taslağı yenile
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-zinc-800 bg-black/60 p-4 text-xs text-zinc-400">
              <div className="font-medium text-zinc-200">Desteklenen blok tipleri</div>
              <div className="mt-2">hero, text, feature-list, stats, cta</div>
            </div>

            <textarea
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={24}
              className="min-h-[420px] w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 font-mono text-sm outline-none transition focus:border-zinc-600"
            />

            {state.errors?.content ? (
              <p className="mt-2 text-xs text-rose-400">{state.errors.content}</p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-zinc-800 p-2 text-zinc-300">
                  <Globe className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white">Yayın durumu</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Kapalıysa public route 404 davranışı verir.
                  </p>
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                  className="sr-only"
                />
                <span className="text-xs text-zinc-400">
                  {isPublished ? "Yayında" : "Taslak"}
                </span>
                <span
                  className={`relative h-6 w-11 rounded-full transition ${
                    isPublished ? "bg-white" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-black transition ${
                      isPublished ? "left-6" : "left-1"
                    }`}
                  />
                </span>
              </label>
            </div>
          </section>

          {state.message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                state.ok
                  ? "border-emerald-900 bg-emerald-950/40 text-emerald-300"
                  : "border-rose-900 bg-rose-950/40 text-rose-300"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          {state.errors?.form ? (
            <div className="rounded-2xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
              {state.errors.form}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Kapat
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Kaydediliyor..."
                : isEdit
                  ? "Değişiklikleri kaydet"
                  : "Sayfayı oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}