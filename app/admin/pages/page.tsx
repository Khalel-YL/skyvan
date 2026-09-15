import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  Plus,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import {
  getMediaPreviewUrl,
  getMediaPrimaryUrl,
  normalizeMediaContent,
} from "@/app/admin/media/media-types";

import AddPageDrawer from "./AddPageDrawer";
import DeletePageButton from "./DeletePageButton";
import type { PageMediaPickerAsset } from "./_components/PageMediaPicker";
import { isAboutEditorialPage, ABOUT_EDITORIAL_SECTION_IDS } from "@/app/lib/public-editorial-cms";

import { repairPageSlug } from "./actions";

type SearchParamsInput =
  | Promise<{
      q?: string;
      locale?: string;
      publish?: string;
      edit?: string;
      entityId?: string;
      seedLocale?: string;
      seedTitle?: string;
      seedSlug?: string;
      pageAction?: string;
      pageCode?: string;
    }>
  | {
      q?: string;
      locale?: string;
      publish?: string;
      edit?: string;
      entityId?: string;
      seedLocale?: string;
      seedTitle?: string;
      seedSlug?: string;
      pageAction?: string;
      pageCode?: string;
    }
  | undefined;

type Props = {
  searchParams?: SearchParamsInput;
};

type PageContentJson = {
  isPublished?: boolean;
  blocks?: Array<{
    type?: string;
    heading?: string;
    subtext?: string;
    body?: string;
  }>;
};

type MediaPickerRow = {
  id: string;
  title: string | null;
  contentJson: unknown;
};

const SUPPORTED_PAGE_LOCALES = ["tr", "en"] as const;

function getMissingPageLocales(rows: Array<{ locale: string }>) {
  return SUPPORTED_PAGE_LOCALES.filter(
    (supportedLocale) => !rows.some((row) => row.locale === supportedLocale),
  );
}

function getFirstMissingPageLocale(rows: Array<{ locale: string }>) {
  return getMissingPageLocales(rows)[0] ?? "en";
}

function normalizePublishFilter(value: string) {
  if (value === "published" || value === "draft") {
    return value;
  }
  return "all";
}

function parseContentJson(value: unknown): PageContentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as PageContentJson;
}

function isPublished(contentJson: unknown) {
  const parsed = parseContentJson(contentJson);
  return parsed.isPublished === true;
}

function countBlocks(contentJson: unknown) {
  const parsed = parseContentJson(contentJson);
  return Array.isArray(parsed.blocks) ? parsed.blocks.length : 0;
}

function normalizeSlugText(value: string) {
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

function getSafeSlug(slug: string | null, title: string) {
  const clean = String(slug ?? "").trim();
  if (clean) return clean;
  return normalizeSlugText(title);
}

function getPageEntityGroupKey(entityId: string) {
  return `entity:${entityId}`;
}

function getPageSlugGroupKey(slug: string | null) {
  const canonicalSlug = normalizeSlugText(String(slug ?? ""));
  return canonicalSlug ? `slug:${canonicalSlug}` : null;
}

function getPageLocaleRank(locale: string) {
  const index = SUPPORTED_PAGE_LOCALES.indexOf(
    locale as (typeof SUPPORTED_PAGE_LOCALES)[number],
  );

  return index === -1 ? SUPPORTED_PAGE_LOCALES.length : index;
}

function comparePageRows(
  left: { locale: string; title: string; id: string },
  right: { locale: string; title: string; id: string },
) {
  return (
    getPageLocaleRank(left.locale) - getPageLocaleRank(right.locale) ||
    left.title.localeCompare(right.title, "tr") ||
    left.id.localeCompare(right.id)
  );
}

function getPreferredPageRow<
  T extends { locale: string; title: string; id: string },
>(rows: T[]) {
  return [...rows].sort(comparePageRows)[0] ?? null;
}

function buildPageGroups<
  T extends {
    id: string;
    entityId: string;
    locale: string;
    title: string;
    slug: string | null;
  },
>(rows: T[], filteredRows: T[]) {
  const parent = new Map<string, string>();

  const ensureNode = (key: string) => {
    if (!parent.has(key)) {
      parent.set(key, key);
    }
  };

  const findRoot = (key: string): string => {
    const parentKey = parent.get(key);

    if (!parentKey || parentKey === key) {
      return key;
    }

    const root = findRoot(parentKey);
    parent.set(key, root);
    return root;
  };

  const unionNodes = (left: string, right: string) => {
    const leftRoot = findRoot(left);
    const rightRoot = findRoot(right);

    if (leftRoot !== rightRoot) {
      parent.set(rightRoot, leftRoot);
    }
  };

  for (const row of rows) {
    const entityKey = getPageEntityGroupKey(row.entityId);
    ensureNode(entityKey);

    const slugKey = getPageSlugGroupKey(row.slug);

    if (slugKey) {
      ensureNode(slugKey);
      unionNodes(entityKey, slugKey);
    }
  }

  const allRowsByGroup = new Map<string, T[]>();
  const filteredRowsByGroup = new Map<string, T[]>();

  for (const row of rows) {
    const groupKey = findRoot(getPageEntityGroupKey(row.entityId));
    const groupRows = allRowsByGroup.get(groupKey) ?? [];
    groupRows.push(row);
    allRowsByGroup.set(groupKey, groupRows);
  }

  for (const row of filteredRows) {
    const groupKey = findRoot(getPageEntityGroupKey(row.entityId));
    const groupRows = filteredRowsByGroup.get(groupKey) ?? [];
    groupRows.push(row);
    filteredRowsByGroup.set(groupKey, groupRows);
  }

  return Array.from(allRowsByGroup.entries())
    .map(([groupKey, allLocales]) => {
      const sortedAllLocales = [...allLocales].sort(comparePageRows);
      const preferred = getPreferredPageRow(sortedAllLocales);

      return {
        groupKey,
        entityId: preferred?.entityId ?? sortedAllLocales[0]?.entityId ?? "",
        baseTitle: preferred?.title ?? sortedAllLocales[0]?.title ?? "",
        allLocales: sortedAllLocales,
        locales: (filteredRowsByGroup.get(groupKey) ?? []).sort(comparePageRows),
      };
    })
    .filter((group) => group.locales.length > 0);
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function matchesPageQuery(
  row: {
    title: string;
    slug: string | null;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  },
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return [
    row.title,
    row.slug,
    row.description,
    row.seoTitle,
    row.seoDescription,
  ].some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

function getPageFeedback(action: string, code: string) {
  if (action === "deleted") {
    return { tone: "success" as const, message: "Taslak sayfa silindi." };
  }

  if (action === "slug-repaired") {
    return {
      tone: "success" as const,
      message: "Eksik slug sayfa başlığından güvenli şekilde oluşturuldu.",
    };
  }

  if (action !== "error") {
    return null;
  }

  const messages: Record<string, string> = {
    "invalid-id": "İşlem için geçerli bir sayfa kimliği gerekli.",
    "missing-page": "Sayfa kaydı bulunamadı. Listeyi yenileyip tekrar dene.",
    "published-protected": "Yayındaki sayfa silinemez. Önce yayından kaldır.",
    "delete-failed": "Sayfa silinemedi. Audit ve veritabanı durumunu kontrol et.",
    "repair-failed": "Slug onarılamadı. Başlık ve kayıt durumunu kontrol et.",
    "slug-conflict": "Oluşturulacak slug aynı locale içinde zaten kullanılıyor.",
    "audit-actor-required": "İşlem için doğrulanmış admin audit oturumu gerekli.",
  };

  return {
    tone: "error" as const,
    message: messages[code] ?? "Pages işlemi tamamlanamadı.",
  };
}

function StatChip({
  label,
  value,
  className = "border-zinc-800 bg-zinc-950",
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${className}`}>
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </span>
  );
}

export default async function PagesPage({ searchParams }: Props) {
  const db = getDbOrThrow();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const q = String(resolvedSearchParams?.q ?? "").trim();
  const locale = String(resolvedSearchParams?.locale ?? "").trim().toLowerCase();
  const publish = normalizePublishFilter(
    String(resolvedSearchParams?.publish ?? "all"),
  );
  const editId = String(resolvedSearchParams?.edit ?? "").trim();
  const seedEntityId = String(resolvedSearchParams?.entityId ?? "").trim();
  const seedLocale = String(resolvedSearchParams?.seedLocale ?? "").trim();
  const seedTitle = String(resolvedSearchParams?.seedTitle ?? "").trim();
  const seedSlug = String(resolvedSearchParams?.seedSlug ?? "").trim();
  const pageAction = String(resolvedSearchParams?.pageAction ?? "").trim();
  const pageCode = String(resolvedSearchParams?.pageCode ?? "").trim();

  const rows = await db
    .select({
      id: localizedContent.id,
      entityId: localizedContent.entityId,
      locale: localizedContent.locale,
      title: localizedContent.title,
      slug: localizedContent.slug,
      description: localizedContent.description,
      seoTitle: localizedContent.seoTitle,
      seoDescription: localizedContent.seoDescription,
      contentJson: localizedContent.contentJson,
    })
    .from(localizedContent)
    .where(eq(localizedContent.entityType, "page"))
    .orderBy(
      asc(localizedContent.entityId),
      asc(localizedContent.locale),
      asc(localizedContent.title),
    );

  const mediaRows = editId
    ? ((await db
        .select({
          id: localizedContent.id,
          title: localizedContent.title,
          contentJson: localizedContent.contentJson,
        })
        .from(localizedContent)
        .where(eq(localizedContent.entityType, "media"))) as MediaPickerRow[])
    : [];
  const mediaAssets = mediaRows.reduce<PageMediaPickerAsset[]>((acc, media) => {
      const content = normalizeMediaContent(media.contentJson, media.title || "");
      const url = getMediaPrimaryUrl(content);

      if (!url || content.usageScope !== "public") {
        return acc;
      }

      acc.push({
        mediaId: media.id,
        mediaType: content.mediaType,
        title: content.title || media.title || "Adsız medya",
        url,
        previewUrl: getMediaPreviewUrl(content) || undefined,
        embedUrl: content.embedUrl,
        provider: content.provider,
        altText: content.altText,
        tags: content.tags,
      });

      return acc;
    }, []);

  const filteredRows = rows.filter((row) => {
    if (locale && row.locale.toLowerCase() !== locale) {
      return false;
    }

    if (!matchesPageQuery(row, q)) {
      return false;
    }

    const published = isPublished(row.contentJson);

    if (publish === "published") return published;
    if (publish === "draft") return !published;

    return true;
  });

  const grouped = buildPageGroups(rows, filteredRows);

  const editingExisting =
    filteredRows.find((row) => row.id === editId) ??
    rows.find((row) => row.id === editId) ??
    null;

  const seededNewVariant =
    editId === "new" && seedEntityId
      ? {
          id: "",
          entityId: seedEntityId,
          locale: seedLocale || "en",
          title: seedTitle || "",
          slug: seedSlug || (seedTitle ? normalizeSlugText(seedTitle) : ""),
          description: "",
          seoTitle: "",
          seoDescription: "",
          contentJson: {
            isPublished: false,
            blocks: seedTitle
              ? [
                  {
                    type: "hero",
                    heading: seedTitle,
                    subtext: "Skyvan",
                    body: "Yeni locale varyantı için başlangıç içeriği.",
                  },
                ]
              : [],
          },
        }
      : null;

  const initialData = editingExisting
    ? {
        id: editingExisting.id,
        entityId: editingExisting.entityId,
        locale: editingExisting.locale,
        title: editingExisting.title,
        slug: editingExisting.slug ?? "",
        description: editingExisting.description,
        seoTitle: editingExisting.seoTitle,
        seoDescription: editingExisting.seoDescription,
        contentJson: editingExisting.contentJson,
      }
    : seededNewVariant;

  const metrics = {
    total: rows.length,
    published: rows.filter((row) => isPublished(row.contentJson)).length,
    draft: rows.filter((row) => !isPublished(row.contentJson)).length,
    locales: new Set(rows.map((row) => row.locale)).size,
  };
  const availableLocales = Array.from(new Set(rows.map((row) => row.locale))).sort();
  const localeCoverage = Array.from(
    new Set([...SUPPORTED_PAGE_LOCALES, ...availableLocales]),
  ).map((value) => ({
    locale: value,
    count: rows.filter((row) => row.locale === value).length,
  }));
  const visibleMissingLocaleGroups = grouped.filter(
    (group) => getMissingPageLocales(group.allLocales).length > 0,
  ).length;
  const feedback = getPageFeedback(pageAction, pageCode);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
            Admin · Pages
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
              <FileText className="h-5 w-5 text-amber-400" />
              Pages
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-zinc-400">
              Public sayfaları, locale varyantlarını, blokları ve yayın hazırlığını tek merkezden yönet.
            </p>
          </div>
        </div>

        <Link
          href="/admin/pages?edit=new"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          Yeni sayfa
        </Link>
      </div>

      {feedback ? (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/20 bg-rose-500/10 text-rose-200"
          }`}
          role="status"
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatChip label="Toplam" value={metrics.total} />
        <StatChip label="Yayında" value={metrics.published} className="border-sky-800 bg-sky-950/50" />
        <StatChip label="Taslak" value={metrics.draft} />
        <StatChip label="Locale" value={metrics.locales} />
        {localeCoverage.map((item) => (
          <StatChip
            key={item.locale}
            label={item.locale.toUpperCase()}
            value={item.count}
            className={item.count === 0 ? "border-amber-500/25 bg-amber-500/10" : "border-zinc-800 bg-zinc-900"}
          />
        ))}
        {visibleMissingLocaleGroups > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
            <Languages className="h-3.5 w-3.5" />
            {visibleMissingLocaleGroups} sayfada locale eksik
          </span>
        ) : null}
      </div>

      {editId ? (
        <AddPageDrawer initialData={initialData} mediaAssets={mediaAssets} />
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Kayıt listesi</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Locale, slug ve yayın durumunu hızlıca tara.
            </p>
          </div>

          <form className="grid w-full gap-2 sm:grid-cols-[minmax(12rem,1fr)_7rem_10rem_auto_auto] lg:w-auto">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Başlık, slug, SEO"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-zinc-600"
              />
            </div>

            <select
              name="locale"
              defaultValue={locale}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-zinc-600"
            >
              <option value="">Tüm locale</option>
              {localeCoverage.map((item) => (
                <option key={item.locale} value={item.locale}>
                  {item.locale.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              name="publish"
              defaultValue={publish}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-zinc-600"
            >
              <option value="all">Tüm yayın durumları</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
            </select>

            <button
              type="submit"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Filtrele
            </button>

            <Link
              href="/admin/pages"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </form>
        </div>

        {grouped.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-medium text-white">
              Kayıt bulunamadı
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Filtreyi temizleyip tekrar dene ya da yeni bir page kaydı oluştur.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {grouped.map((group) => (
              <div
                key={group.groupKey}
                className="overflow-hidden rounded-2xl border border-zinc-800"
              >
                <div className="flex flex-col gap-2 border-b border-zinc-800 bg-zinc-950/90 px-3 py-2.5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {group.baseTitle}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">Locale varyantları birlikte gösterilir.</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                      <Globe className="h-3.5 w-3.5" />
                      {group.allLocales.length} locale
                    </div>
                    {getMissingPageLocales(group.allLocales).map((missingLocale) => (
                        <span
                          key={missingLocale}
                          className="inline-flex items-center rounded-full border border-amber-900/60 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-200"
                        >
                          {missingLocale} eksik
                        </span>
                      ))}

                    {getMissingPageLocales(group.allLocales).length > 0 ? (
                      <Link
                        href={`/admin/pages?edit=new&entityId=${encodeURIComponent(
                          group.entityId,
                        )}&seedLocale=${getFirstMissingPageLocale(group.allLocales)}&seedTitle=${encodeURIComponent(group.baseTitle)}&seedSlug=${encodeURIComponent(
                          getSafeSlug(group.allLocales[0]?.slug ?? null, group.baseTitle),
                        )}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                      >
                        <Languages className="h-3.5 w-3.5" />
                        Locale ekle
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800 text-sm">
                    <thead className="bg-zinc-950">
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                        <th className="px-3 py-2.5">Sayfa</th>
                        <th className="px-3 py-2.5">Locale</th>
                        <th className="px-3 py-2.5">Slug</th>
                        <th className="px-3 py-2.5">SEO</th>
                        <th className="px-3 py-2.5">Yayın</th>
                        <th className="px-3 py-2.5">İçerik</th>
                        <th className="px-3 py-2.5 text-right">İşlem</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {group.locales.map((row) => {
                        const published = isPublished(row.contentJson);
                        const blocksCount = countBlocks(row.contentJson);
                        const hasSeo = Boolean(
                          row.seoTitle?.trim() && row.seoDescription?.trim(),
                        );
                        const safeSlug = getSafeSlug(row.slug, row.title);
                        const missingSlug = !String(row.slug ?? "").trim();
                        const curatedSectionCount = isAboutEditorialPage(row.locale, safeSlug)
                          ? ABOUT_EDITORIAL_SECTION_IDS.length
                          : 0;

                        return (
                          <tr key={row.id} className="align-top">
                            <td className="px-3 py-3">
                              <div className="font-medium text-white">{row.title}</div>
                              <div className="mt-1 max-w-[22rem] truncate text-xs text-zinc-500">
                                {row.description?.trim() || "Açıklama yok"}
                              </div>
                            </td>

                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300">
                                <Globe className="h-3.5 w-3.5" />
                                {row.locale}
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              <div className="font-mono text-xs text-zinc-300">
                                /{safeSlug || "-"}
                              </div>

                              {missingSlug ? (
                                <form
                                    action={repairPageSlug.bind(null, row.id, row.slug ?? "")}
                                  className="mt-2"
                                >
                                  <button
                                    type="submit"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-900/60 bg-amber-950/40 px-2.5 py-1.5 text-[11px] text-amber-200 transition hover:border-amber-800 hover:bg-amber-950/60"
                                  >
                                    <Wrench className="h-3.5 w-3.5" />
                                    Slug onar
                                  </button>
                                </form>
                              ) : null}
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                                  hasSeo
                                    ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-200"
                                    : "border-amber-900/60 bg-amber-950/40 text-amber-200"
                                }`}
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                {hasSeo ? "Hazır" : "Eksik"}
                              </span>
                            </td>

                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                                  published
                                    ? "border-sky-900/60 bg-sky-950/40 text-sky-200"
                                    : "border-zinc-800 bg-zinc-950 text-zinc-300"
                                }`}
                              >
                                {published ? "Yayında" : "Taslak"}
                              </span>
                            </td>

                            <td className="px-3 py-3 text-xs text-zinc-400">
                              {curatedSectionCount > 0
                                ? `${blocksCount} CMS + ${curatedSectionCount} küratörlü bölüm`
                                : blocksCount > 0
                                  ? `${blocksCount} blok`
                                  : "Yapı tanımlı değil"}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`/admin/pages/preview/${row.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Önizle
                                </a>

                                <Link
                                  href={`/admin/pages?edit=${row.id}${
                                    q ? `&q=${encodeURIComponent(q)}` : ""
                                  }${
                                    locale
                                      ? `&locale=${encodeURIComponent(locale)}`
                                      : ""
                                  }${
                                    publish !== "all"
                                      ? `&publish=${encodeURIComponent(publish)}`
                                      : ""
                                  }`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  Düzenle
                                </Link>

                                <DeletePageButton id={row.id} title={row.title} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
