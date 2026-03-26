import Link from "next/link";
import { inArray, sql } from "drizzle-orm";
import { getDbOrThrow } from "@/db/db";
import { productDocuments } from "@/db/schema";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { EditProductDrawer } from "./EditProductDrawer";
import { formatMetric, formatMoney, formatWatts } from "./mappers";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { CategoryOption, ProductListItem } from "./types";

type DocumentCounts = {
  total: number;
  active: number;
  archived: number;
};

async function getDocumentCountsByProductIds(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, DocumentCounts>();
  }

  const db = getDbOrThrow();

  const rows = await db
    .select({
      productId: productDocuments.productId,
      total: sql<number>`count(*)::int`,
      active: sql<number>`
        sum(
          case
            when ${productDocuments.status} = 'active' then 1
            else 0
          end
        )::int
      `,
      archived: sql<number>`
        sum(
          case
            when ${productDocuments.status} = 'archived' then 1
            else 0
          end
        )::int
      `,
    })
    .from(productDocuments)
    .where(inArray(productDocuments.productId, productIds))
    .groupBy(productDocuments.productId);

  return new Map<string, DocumentCounts>(
    rows.map((row) => [
      row.productId,
      {
        total: Number(row.total ?? 0),
        active: Number(row.active ?? 0),
        archived: Number(row.archived ?? 0),
      },
    ])
  );
}

function InfoChip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 ${className}`}
    >
      {children}
    </span>
  );
}

function DocumentCountsInline({
  total,
  active,
  archived,
}: DocumentCounts) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <span
        className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
        title={`Toplam belge: ${total}`}
      >
        T {total}
      </span>

      {active > 0 ? (
        <span
          className="inline-flex items-center rounded-full border border-green-800 bg-green-950 px-2 py-0.5 text-[11px] font-medium text-green-300"
          title={`Aktif belge: ${active}`}
        >
          A {active}
        </span>
      ) : null}

      {archived > 0 ? (
        <span
          className="inline-flex items-center rounded-full border border-amber-800 bg-amber-950 px-2 py-0.5 text-[11px] font-medium text-amber-300"
          title={`Arşiv belge: ${archived}`}
        >
          R {archived}
        </span>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-100">{value}</div>
      {subValue ? (
        <div className="mt-1 text-xs text-zinc-500">{subValue}</div>
      ) : null}
    </div>
  );
}

export async function ProductsTable({
  products,
  categories,
}: {
  products: ProductListItem[];
  categories: CategoryOption[];
}) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 text-center">
        <h3 className="text-lg font-semibold text-zinc-100">Ürün bulunamadı</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Filtreleri temizleyin ya da yeni ürün ekleyin.
        </p>
      </div>
    );
  }

  const documentCountsByProductId = await getDocumentCountsByProductIds(
    products.map((product) => product.id)
  );

  return (
    <div className="space-y-4">
      {products.map((product) => {
        const documentCounts = documentCountsByProductId.get(product.id) ?? {
          total: 0,
          active: 0,
          archived: 0,
        };

        return (
          <div
            key={product.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold leading-7 text-zinc-100">
                    {product.name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <InfoChip>{product.categoryName}</InfoChip>
                    <InfoChip>{product.slug}</InfoChip>
                    <InfoChip>{product.sku}</InfoChip>
                    <ProductStatusBadge status={product.status} />
                  </div>
                </div>

                {product.shortDescription ? (
                  <p className="max-w-3xl text-sm leading-6 text-zinc-400">
                    {product.shortDescription}
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Fiyat"
                    value={formatMoney(product.basePrice)}
                  />

                  <MetricCard
                    label="Ağırlık"
                    value={formatMetric(product.weightKg, "kg")}
                  />

                  <MetricCard
                    label="Güç Tüketimi"
                    value={formatWatts(product.powerDrawWatts)}
                    subValue={formatWatts(product.powerSupplyWatts)}
                  />

                  <MetricCard
                    label="Güncelleme"
                    value={new Date(product.updatedAt).toLocaleDateString(
                      "tr-TR"
                    )}
                    subValue={new Date(product.updatedAt).toLocaleTimeString(
                      "tr-TR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )}
                  />
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col items-stretch gap-3 xl:w-[260px] xl:items-end">
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Link
                    href={`/admin/products/${product.id}/documents`}
                    className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                  >
                    Belgeler
                  </Link>

                  <EditProductDrawer product={product} categories={categories} />

                  <DeleteProductDialog
                    productId={product.id}
                    productName={product.name}
                  />
                </div>

                <DocumentCountsInline
                  total={documentCounts.total}
                  active={documentCounts.active}
                  archived={documentCounts.archived}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}