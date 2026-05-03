import type { ReactNode } from "react";
import AddCategoryDrawer from "./AddCategoryDrawer";
import DeleteCategoryButton from "./DeleteCategoryButton";
import type { CategoryListItem } from "./types";

type CategoryProductStats = {
  total: number;
  active: number;
  archived: number;
};

function statusLabel(status: CategoryListItem["status"]) {
  switch (status) {
    case "active":
      return "Aktif";
    case "archived":
      return "Arşiv";
    default:
      return "Taslak";
  }
}

function statusClass(status: CategoryListItem["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "archived":
      return "border-white/10 bg-white/5 text-neutral-300";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
}

function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300 ${className}`}
    >
      {children}
    </span>
  );
}

export function CategoriesList({
  categories,
  databaseReady,
  productStatsByCategoryId,
}: {
  categories: CategoryListItem[];
  databaseReady: boolean;
  productStatsByCategoryId: Record<string, CategoryProductStats>;
}) {
  if (!categories.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
        <h3 className="text-lg font-semibold text-zinc-100">
          Görüntülenecek kategori bulunamadı
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Arama veya durum filtresine göre eşleşen kategori çıkmadı.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const stats = productStatsByCategoryId[category.id] ?? {
          total: 0,
          active: 0,
          archived: 0,
        };

        return (
          <div
            key={category.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="break-words text-base font-semibold text-zinc-100">
                    {category.name}
                  </h3>

                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(
                      category.status
                    )}`}
                  >
                    {statusLabel(category.status)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip className="break-all">Kod {category.slug}</Chip>
                  <Chip>İkon {category.icon || "Yok"}</Chip>
                  <Chip>Sıra {category.sortOrder}</Chip>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Chip className="border-zinc-700 bg-zinc-900 text-zinc-300">
                    Ürün {stats.total}
                  </Chip>

                  {stats.active > 0 ? (
                    <Chip className="border-emerald-800 bg-emerald-950/50 text-emerald-300">
                      Aktif {stats.active}
                    </Chip>
                  ) : null}

                  {stats.archived > 0 ? (
                    <Chip className="border-amber-800 bg-amber-950/40 text-amber-300">
                      Arşiv {stats.archived}
                    </Chip>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <AddCategoryDrawer
                  initialData={category}
                  disabled={!databaseReady}
                />

                {category.status === "archived" ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-neutral-300">
                    Arşivde
                  </span>
                ) : (
                  <DeleteCategoryButton id={category.id} name={category.name} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
