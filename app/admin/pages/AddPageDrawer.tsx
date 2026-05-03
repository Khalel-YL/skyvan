"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { savePage, type PageFormState } from "./actions";
import { PageAiCopilot } from "./_components/PageAiCopilot";
import { PageBlockEditor } from "./_components/PageBlockEditor";
import { PageLivePreview } from "./_components/PageLivePreview";
import { PagePublishPanel } from "./_components/PagePublishPanel";
import { PageSeoPanel } from "./_components/PageSeoPanel";
import {
  type PageContentBlock,
  createDefaultPageBlocks,
  normalizePageContentJson,
  serializePageContentJson,
  validatePageBlocks,
} from "./_lib/page-blocks";

type PageSubmitIntent = "draft" | "publish" | "keep-published" | "unpublish";

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
  const submitIntentInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initialData?.id);

  const defaultLocale = normalizeLocale(seedLocale || initialData?.locale || "tr") || "tr";
  const defaultTitle = seedTitle || initialData?.title || "";
  const defaultDescription = initialData?.description || "";
  const defaultSeoTitle = initialData?.seoTitle || "";
  const defaultSeoDescription = initialData?.seoDescription || "";
  const defaultSlug = initialData?.slug || normalizeSlug(defaultTitle);

  const defaultContent = initialData?.contentJson
    ? normalizePageContentJson(initialData.contentJson, {
        title: defaultTitle,
        description: defaultDescription,
        locale: defaultLocale,
      })
    : {
        isPublished: false,
        blocks: createDefaultPageBlocks({
          title: defaultTitle,
          description: defaultDescription,
          locale: defaultLocale,
        }),
      };

  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [locale, setLocale] = useState(defaultLocale);
  const [description, setDescription] = useState(defaultDescription);
  const [seoTitle, setSeoTitle] = useState(defaultSeoTitle);
  const [seoDescription, setSeoDescription] = useState(defaultSeoDescription);
  const [blocks, setBlocks] = useState<PageContentBlock[]>(defaultContent.blocks);
  const [isPublished] = useState(defaultContent.isPublished);
  const [submitIntent, setSubmitIntent] = useState<PageSubmitIntent>("draft");

  const validation = validatePageBlocks({
    title,
    slug,
    seoTitle,
    seoDescription,
    blocks,
  });
  const serializedContent = serializePageContentJson({
    isPublished,
    blocks,
  });

  const closeDrawer = useCallback(() => {
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
  }, [onClose, pathname, router, searchParams]);

  const handleIntentChange = useCallback((intent: PageSubmitIntent) => {
    setSubmitIntent(intent);

    if (submitIntentInputRef.current) {
      submitIntentInputRef.current.value = intent;
    }
  }, []);

  useEffect(() => {
    if (state.ok) {
      closeDrawer();
    }
  }, [closeDrawer, state.ok]);

  function handleGenerateSeo() {
    const safeTitle = title.trim() || "Skyvan sayfası";
    const generatedTitle = `${safeTitle} | Skyvan`.slice(0, 90).trim();
    const generatedDescription = `${safeTitle} hakkında Skyvan yaklaşımı, karar bağlamı ve üretim hazırlığı bilgilerini keşfedin.`
      .slice(0, 170)
      .trim();

    setSeoTitle(generatedTitle);
    setSeoDescription(generatedDescription);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-[96rem] flex-col border-l border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Admin / Pages
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {isEdit ? "Sayfayı düzenle" : "Yeni page oluştur"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Structured blocks, SEO, preview ve publish kontrolü tek yüzeyde.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-2xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            aria-label="Editörü kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={formAction}
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
          onSubmit={(event) => {
            const submitter = event.nativeEvent.submitter;

            if (
              submitter instanceof HTMLButtonElement &&
              submitter.name === "submitIntent"
            ) {
              handleIntentChange(submitter.value as PageSubmitIntent);
            }
          }}
        >
          <input type="hidden" name="id" value={initialData?.id ?? ""} />
          <input type="hidden" name="entityId" value={initialData?.entityId ?? seedEntityId ?? ""} />
          <input type="hidden" name="content" value={serializedContent} />
          <input
            ref={submitIntentInputRef}
            type="hidden"
            name="submitIntent"
            value={submitIntent}
            readOnly
          />

          <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="grid min-w-0 gap-5">
              <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Temel bilgiler</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Başlık, slug ve locale public kimliği oluşturur.
                    </p>
                  </div>
                  <span className="rounded-full border border-zinc-800 px-3 py-1 text-[11px] text-zinc-400">
                    {isEdit ? "Edit" : "Create"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs text-zinc-400">Locale</span>
                    <input
                      name="locale"
                      value={locale}
                      onChange={(event) => setLocale(normalizeLocale(event.target.value))}
                      placeholder="tr"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                    />
                    {state.errors?.locale ? <p className="text-xs text-rose-400">{state.errors.locale}</p> : null}
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs text-zinc-400">Başlık</span>
                    <input
                      name="title"
                      value={title}
                      onChange={(event) => {
                        const nextTitle = event.target.value;
                        setTitle(nextTitle);

                        if (!isEdit) {
                          setSlug(normalizeSlug(nextTitle));
                        }
                      }}
                      placeholder="Örn. Premium Karavan Dönüşümü"
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition focus:border-zinc-600"
                    />
                    {state.errors?.title ? <p className="text-xs text-rose-400">{state.errors.title}</p> : null}
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
                    {state.errors?.slug ? <p className="text-xs text-rose-400">{state.errors.slug}</p> : null}
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

              <PageSeoPanel
                title={title}
                slug={slug}
                seoTitle={seoTitle}
                seoDescription={seoDescription}
                onSeoTitleChange={setSeoTitle}
                onSeoDescriptionChange={setSeoDescription}
                onGenerate={handleGenerateSeo}
              />

              {state.errors?.seoTitle ? <p className="text-xs text-rose-400">{state.errors.seoTitle}</p> : null}
              {state.errors?.seoDescription ? <p className="text-xs text-rose-400">{state.errors.seoDescription}</p> : null}

              <PageBlockEditor blocks={blocks} onChange={setBlocks} />
              {state.errors?.content ? <p className="text-xs text-rose-400">{state.errors.content}</p> : null}
            </div>

            <aside className="grid h-max gap-5 xl:sticky xl:top-5">
              <PagePublishPanel
                isPublished={isPublished}
                blockers={validation.blockers}
                warnings={validation.warnings}
                pending={isPending}
                isEdit={isEdit}
                onIntentChange={handleIntentChange}
              />

              <div className="flex items-center justify-between gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
                <span>
                  <span className="block text-sm font-semibold text-white">Mevcut durum</span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    Yayındaki sayfada normal kaydetme yayın durumunu korur. Taslağa almak ayrı ve uyarılı bir aksiyondur.
                  </span>
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs ${isPublished ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-amber-500/25 bg-amber-500/10 text-amber-200"}`}>
                  {isPublished ? "Published" : "Draft"}
                </span>
              </div>

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

              <PageLivePreview
                title={title}
                description={description}
                locale={locale}
                slug={slug}
                blocks={blocks}
              />

              <PageAiCopilot
                title={title}
                description={description}
                seoTitle={seoTitle}
                seoDescription={seoDescription}
                onInsertHero={(block) => setBlocks((current) => [block, ...current])}
                onApplySeo={(seo) => {
                  setSeoTitle(seo.seoTitle);
                  setSeoDescription(seo.seoDescription);
                }}
                onApplyStructure={setBlocks}
              />
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
