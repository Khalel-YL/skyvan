import Link from "next/link";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import {
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";

import AddPageDrawer from "./AddPageDrawer";
import { deletePage, repairPageSlug } from "./actions";

type SearchParamsInput =
  | Promise<{
      q?: string;
      locale?: string;
      publish?: string;
      edit?: string;
      entityId?: string;
      seedLocale?: string;
      seedTitle?: string;
    }>
  | {
      q?: string;
      locale?: string;
      publish?: string;
      edit?: string;
      entityId?: string;
      seedLocale?: string;
      seedTitle?: string;
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
  return parsed.isPublished !== false;
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

  const whereConditions = [eq(localizedContent.entityType, "page")];

  if (locale) {
    whereConditions.push(eq(localizedContent.locale, locale));
  }

  if (q) {
    whereConditions.push(
      or(
        ilike(localizedContent.title, `%${q}%`),
        ilike(localizedContent.slug, `%${q}%`),
        ilike(localizedContent.description, `%${q}%`),
        ilike(localizedContent.seoTitle, `%${q}%`),
        ilike(localizedContent.seoDescription, `%${q}%`),
      )!,
    );
  }

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
    .where(and(...whereConditions))
    .orderBy(
      asc(localizedContent.entityId),
      asc(localizedContent.locale),
      asc(localizedContent.title),
    );

  const filteredRows = rows.filter((row) => {
    const published = isPublished(row.contentJson);

    if (publish === "published") return published;
    if (publish === "draft") return !published;

    return true;
  });

  const grouped = filteredRows.reduce<
    Array<{
      entityId: string;
      baseTitle: string;
      locales: typeof filteredRows;
    }>
  >((acc, row) => {
    const found = acc.find((item) => item.entityId === row.entityId);

    if (found) {
      found.locales.push(row);
      return acc;
    }

    acc.push({
      entityId: row.entityId,
      baseTitle: row.title,
      locales: [row],
    });

    return acc;
  }, []);

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
          slug: seedTitle ? normalizeSlugText(seedTitle) : "",
          description: "",
          seoTitle: "",
          seoDescription: "",
          isPublished: true,
          contentJsonText: seedTitle
            ? JSON.stringify(
                {
                  blocks: [
                    {
                      type: "hero",
                      heading: seedTitle,
                      subtext: "Skyvan",
                      body: "Yeni locale varyantı için başlangıç içeriği.",
                    },
                  ],
                },
                null,
                2,
              )
            : "",
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Admin · Pages
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white">Pages</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Public site içerikleri, çoklu dil kayıtları ve SEO metinleri burada
              yönetilir. Bu ekran yalnızca `localized_content` içindeki `page`
              kayıtlarına odaklanır.
            </p>
          </div>

          <Link
            href="/admin/pages?edit=new"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Yeni sayfa
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Toplam
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {metrics.total}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Yayında
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {metrics.published}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Taslak
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {metrics.draft}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Locale
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {metrics.locales}
            </div>
          </div>
        </div>
      </section>

      {editId ? <AddPageDrawer initialData={initialData} /> : null}

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Kayıt listesi</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Locale, slug ve yayın durumuna göre filtrele.
            </p>
          </div>

          <form className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Başlık, slug, SEO..."
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-zinc-600"
              />
            </div>

            <input
              type="text"
              name="locale"
              defaultValue={locale}
              placeholder="Locale"
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
            />

            <select
              name="publish"
              defaultValue={publish}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600"
            >
              <option value="all">Tüm yayın durumları</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
            </select>

            <button
              type="submit"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Filtrele
            </button>

            <Link
              href="/admin/pages"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </form>
        </div>

        {grouped.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-5 py-10 text-center">
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
          <div className="mt-6 space-y-4">
            {grouped.map((group) => (
              <div
                key={group.entityId}
                className="overflow-hidden rounded-2xl border border-zinc-800"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {group.baseTitle}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Aynı sayfanın locale varyantları birlikte gösterilir.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                      <Globe className="h-3.5 w-3.5" />
                      {group.locales.length} locale
                    </div>

                    <Link
                      href={`/admin/pages?edit=new&entityId=${encodeURIComponent(
                        group.entityId,
                      )}&seedLocale=en&seedTitle=${encodeURIComponent(group.baseTitle)}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                    >
                      <Languages className="h-3.5 w-3.5" />
                      Locale ekle
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800 text-sm">
                    <thead className="bg-zinc-950">
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                        <th className="px-4 py-3">Sayfa</th>
                        <th className="px-4 py-3">Locale</th>
                        <th className="px-4 py-3">Slug</th>
                        <th className="px-4 py-3">SEO</th>
                        <th className="px-4 py-3">Yayın</th>
                        <th className="px-4 py-3">İçerik</th>
                        <th className="px-4 py-3 text-right">İşlem</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                      {group.locales.map((row) => {
                        const published = isPublished(row.contentJson);
                        const blocksCount = countBlocks(row.contentJson);
                        const hasSeo = Boolean(
                          row.seoTitle?.trim() || row.seoDescription?.trim(),
                        );
                        const safeSlug = getSafeSlug(row.slug, row.title);
                        const missingSlug = !String(row.slug ?? "").trim();

                        return (
                          <tr key={row.id} className="align-top">
                            <td className="px-4 py-4">
                              <div className="font-medium text-white">{row.title}</div>
                              <div className="mt-1 text-xs text-zinc-500">
                                {row.description?.trim() || "Açıklama yok"}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                                <Globe className="h-3.5 w-3.5" />
                                {row.locale}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-mono text-xs text-zinc-300">
                                /{safeSlug || "-"}
                              </div>

                              {missingSlug ? (
                                <form
                                  action={repairPageSlug.bind(null, row.id, row.title)}
                                  className="mt-2"
                                >
                                  <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl border border-amber-900/60 bg-amber-950/40 px-3 py-1.5 text-[11px] text-amber-200 transition hover:border-amber-800 hover:bg-amber-950/60"
                                  >
                                    <Wrench className="h-3.5 w-3.5" />
                                    Slug onar
                                  </button>
                                </form>
                              ) : null}
                            </td>

                            <td className="px-4 py-4">
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

                            <td className="px-4 py-4">
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

                            <td className="px-4 py-4 text-xs text-zinc-400">
                              {blocksCount > 0
                                ? `${blocksCount} blok`
                                : "Yapı tanımlı değil"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`/admin/pages/preview/${row.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
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
                                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  Düzenle
                                </Link>

                                <form action={deletePage.bind(null, row.id)}>
                                  <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-200 transition hover:border-red-800 hover:bg-red-950/60"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Sil
                                  </button>
                                </form>
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
