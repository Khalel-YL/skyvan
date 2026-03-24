import Link from "next/link";
import {
  Archive,
  Edit,
  FolderTree,
  Layers3,
  Palette,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import AddCategoryDrawer from "./AddCategoryDrawer";
import DeleteCategoryButton from "./DeleteCategoryButton";
import { createCategorySeeds } from "./actions";
import { db } from "@/db/db";
import { categories } from "@/db/schema";

type CategoryStatus = "draft" | "active" | "archived";

type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: CategoryStatus;
  sortOrder: number;
};

type CategoriesPageProps = {
  searchParams?: Promise<{
    edit?: string;
    saved?: string;
    deleted?: string;
    archived?: string;
    seeded?: string;
    q?: string;
    status?: string;
  }>;
};

async function getCategoriesSafely(): Promise<CategoryListItem[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db.select().from(categories);

    return (rows as CategoryListItem[]).sort((a, b) => {
      const order = { active: 0, draft: 1, archived: 2 } as const;
      const statusDiff = order[a.status] - order[b.status];

      if (statusDiff !== 0) {
        return statusDiff;
      }

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

function statusLabel(status: CategoryStatus) {
  switch (status) {
    case "active":
      return "Aktif";
    case "archived":
      return "Arşiv";
    default:
      return "Taslak";
  }
}

function statusClass(status: CategoryStatus) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "archived":
      return "border-white/10 bg-white/5 text-neutral-300";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);
  const allCategories = await getCategoriesSafely();

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

  const editData =
    params.edit && params.edit !== "new"
      ? allCategories.find((item) => item.id === params.edit) ?? null
      : null;

  const stats = {
    total: allCategories.length,
    active: allCategories.filter((item) => item.status === "active").length,
    draft: allCategories.filter((item) => item.status === "draft").length,
    archived: allCategories.filter((item) => item.status === "archived").length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Admin / Categories
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Ürün Kategorileri
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-400">
              Categories katmanı artık products omurgasına geçmeye hazır hale
              geliyor. Bu batch’te seed, archive fallback ve parent-ready yapı
              dili ekleniyor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {databaseReady ? (
              <form action={createCategorySeeds}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" />
                  Seed Oluştur
                </button>
              </form>
            ) : null}

            {databaseReady ? (
              <Link
                href="/admin/categories?edit=new"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Yeni Kategori
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {params.saved ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Kategori kaydı başarıyla işlendi.
        </div>
      ) : null}

      {params.deleted ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Kategori kaydı silindi.
        </div>
      ) : null}

      {params.archived ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-200">
          Kategori doğrudan silinemediği için arşive alındı.
        </div>
      ) : null}

      {params.seeded ? (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          {params.seeded === "0"
            ? "Seed kategoriler zaten mevcut."
            : `${params.seeded} adet çekirdek kategori eklendi.`}
        </div>
      ) : null}

      {!databaseReady ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
          Veritabanı yapılandırılmadığı için kayıt işlemleri pasif durumda.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-neutral-400">Toplam Kategori</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-neutral-400">Aktif</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-neutral-400">Taslak</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {stats.draft}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-neutral-400">Arşiv</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {stats.archived}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold text-white">
              Categories / Batch 2
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Seed
              </p>
              <p className="mt-3 text-sm font-medium text-white">
                Hazır
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Archive fallback
              </p>
              <p className="mt-3 text-sm font-medium text-white">
                Aktif
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Parent-ready
              </p>
              <p className="mt-3 text-sm font-medium text-white">
                Schema next
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <form className="grid gap-4 md:grid-cols-[1.2fr_220px_auto]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-neutral-200">
                Kategori ara
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="ör. electrical"
                  className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-12 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/20"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-neutral-200">
                Durum
              </span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="skyvan-select w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="draft">Taslak</option>
                <option value="archived">Arşiv</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
              >
                Filtrele
              </button>
            </div>
          </form>
        </div>
      </div>

      {params.edit ? (
        <AddCategoryDrawer
          initialData={params.edit === "new" ? null : editData}
          disabled={!databaseReady}
        />
      ) : null}

      {filteredCategories.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
          <h3 className="text-lg font-semibold text-white">
            Görüntülenecek kategori bulunamadı
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            {allCategories.length === 0
              ? "Henüz kategori tanımlı değil. Seed oluşturarak hızlı başlangıç yapabilirsin."
              : "Arama veya durum filtresine göre eşleşen kategori çıkmadı."}
          </p>

          {databaseReady ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <form action={createCategorySeeds}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" />
                  Seed Oluştur
                </button>
              </form>

              <Link
                href="/admin/categories?edit=new"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Yeni Kategori Aç
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-5 py-4 font-semibold">Kategori</th>
                  <th className="px-5 py-4 font-semibold">Slug</th>
                  <th className="px-5 py-4 font-semibold">Icon</th>
                  <th className="px-5 py-4 font-semibold">Sıra</th>
                  <th className="px-5 py-4 font-semibold">Durum</th>
                  <th className="px-5 py-4 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-white/5 transition hover:bg-white/[0.02] last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white/5 p-2">
                          <FolderTree className="h-4 w-4 text-neutral-300" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white">
                            {category.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {category.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-neutral-300">
                      {category.slug}
                    </td>

                    <td className="px-5 py-4 text-sm text-neutral-300">
                      <div className="inline-flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-neutral-500" />
                        {category.icon || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-neutral-300">
                      <div className="inline-flex items-center gap-2">
                        <Layers3 className="h-3.5 w-3.5 text-neutral-500" />
                        {category.sortOrder}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                          category.status,
                        )}`}
                      >
                        {statusLabel(category.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/categories?edit=${category.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Düzenle
                        </Link>

                        {category.status === "archived" ? (
                          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-neutral-300">
                            <Archive className="h-3.5 w-3.5" />
                            Arşivde
                          </span>
                        ) : (
                          <DeleteCategoryButton
                            id={category.id}
                            name={category.name}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}