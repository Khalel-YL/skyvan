import { sql } from "drizzle-orm";
import AddCategoryDrawer from "./AddCategoryDrawer";
import { CategoryFilters } from "./CategoryFilters";
import { CategoriesList } from "./CategoriesList";
import { CategoriesSummary } from "./CategoriesSummary";
import { createCategorySeeds } from "./actions";
import { db } from "@/db/db";
import { categories, products } from "@/db/schema";
import type { CategoryListItem, CategoryStatus } from "./types";

type CategoriesPageProps = {
  searchParams?: Promise<{
    saved?: string;
    deleted?: string;
    archived?: string;
    seeded?: string;
    synced?: string;
    categoryAction?: string;
    categoryCode?: string;
    q?: string;
    status?: string;
  }>;
};

type CategoryProductStats = {
  total: number;
  active: number;
  archived: number;
};

async function getCategoriesSafely(): Promise<CategoryListItem[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        status: categories.status,
        sortOrder: categories.sortOrder,
      })
      .from(categories);

    return rows.sort((a, b) => {
      const order: Record<CategoryStatus, number> = {
        active: 0,
        draft: 1,
        archived: 2,
      };

      const statusDiff = order[a.status] - order[b.status];
      if (statusDiff !== 0) return statusDiff;

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "tr");
    });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return [];
  }
}

async function getCategoryProductStats(): Promise<
  Record<string, CategoryProductStats>
> {
  if (!db) {
    return {};
  }

  try {
    const rows = await db
      .select({
        categoryId: products.categoryId,
        total: sql<number>`count(*)::int`,
        active: sql<number>`
          sum(
            case
              when ${products.status} = 'active' then 1
              else 0
            end
          )::int
        `,
        archived: sql<number>`
          sum(
            case
              when ${products.status} = 'archived' then 1
              else 0
            end
          )::int
        `,
      })
      .from(products)
      .groupBy(products.categoryId);

    return Object.fromEntries(
      rows.map((row) => [
        row.categoryId,
        {
          total: Number(row.total ?? 0),
          active: Number(row.active ?? 0),
          archived: Number(row.archived ?? 0),
        },
      ])
    );
  } catch (error) {
    console.error("Category product stats fetch error:", error);
    return {};
  }
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);

  const [allCategories, productStatsByCategoryId] = await Promise.all([
    getCategoriesSafely(),
    getCategoryProductStats(),
  ]);

  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter =
    params.status === "active" ||
    params.status === "draft" ||
    params.status === "archived"
      ? params.status
      : "all";

  const filteredCategories = allCategories.filter((category) => {
    const matchesQuery = query
      ? category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query)
      : true;

    const matchesStatus =
      statusFilter === "all" ? true : category.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const stats = filteredCategories.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "active") acc.active += 1;
      if (item.status === "draft") acc.draft += 1;
      if (item.status === "archived") acc.archived += 1;
      return acc;
    },
    {
      total: 0,
      active: 0,
      draft: 0,
      archived: 0,
    }
  );

  const categoryErrorMessage =
    params.categoryAction === "error"
      ? params.categoryCode === "invalid-id"
        ? "Geçersiz kategori işlemi isteği alındı."
        : params.categoryCode === "missing-category"
          ? "Silinmek istenen kategori bulunamadı."
        : params.categoryCode === "delete-failed"
          ? "Kategori kaldırma işlemi tamamlanamadı."
        : params.categoryCode === "audit-actor-failed"
          ? "Audit kullanıcısı çözülemediği için çekirdek kategori seti oluşturulamadı."
        : params.categoryCode === "seed-failed"
            ? "Çekirdek kategori seti senkronize edilirken beklenmeyen bir hata oluştu."
            : "Kategori işlemi sırasında beklenmeyen bir hata oluştu."
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Kategori Omurgası
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Kategori Yönetimi
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
              Ürünlerin workshop, kural motoru ve ilerideki AI katmanıyla uyumlu kategori omurgasını yönet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {databaseReady ? (
            <form action={createCategorySeeds}>
              <button
                type="submit"
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Çekirdek Seti Senkronize Et
              </button>
            </form>
          ) : null}

          <AddCategoryDrawer disabled={!databaseReady} />
        </div>
      </div>

      {params.saved ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Kategori kaydı başarıyla işlendi.
        </div>
      ) : null}

      {params.deleted ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Kategori kaydı silindi.
        </div>
      ) : null}

      {params.archived ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Kategori doğrudan silinemediği için arşive alındı.
        </div>
      ) : null}

      {params.seeded ? (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
          {params.seeded === "0"
            ? "Çekirdek kategori seti zaten mevcut."
            : `${params.seeded} adet çekirdek kategori eklendi.`}
          {params.synced ? ` ${params.synced} kategori güncellendi.` : ""}
        </div>
      ) : null}

      {!params.seeded && params.synced ? (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
          {params.synced} kategori karavan omurgasına göre güncellendi.
        </div>
      ) : null}

      {categoryErrorMessage ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {categoryErrorMessage}
        </div>
      ) : null}

      {!databaseReady ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
          Veritabanı yapılandırılmadığı için kayıt işlemleri pasif durumda.
        </div>
      ) : null}

      <CategoriesSummary
        total={stats.total}
        active={stats.active}
        draft={stats.draft}
        archived={stats.archived}
        currentStatus={statusFilter}
      />

      <CategoryFilters />

      {filteredCategories.length === 0 && allCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
          <h3 className="text-lg font-semibold text-zinc-100">
            Henüz kategori tanımlı değil
          </h3>
            <p className="mt-2 text-sm text-zinc-500">
            Çekirdek kategori setini senkronize ederek hızlı başlangıç yapabilirsin.
            </p>

          {databaseReady ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <form action={createCategorySeeds}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Çekirdek Seti Senkronize Et
                </button>
              </form>

              <AddCategoryDrawer disabled={!databaseReady} />
            </div>
          ) : null}
        </div>
      ) : (
        <CategoriesList
          categories={filteredCategories}
          databaseReady={databaseReady}
          productStatsByCategoryId={productStatsByCategoryId}
        />
      )}
    </div>
  );
}
