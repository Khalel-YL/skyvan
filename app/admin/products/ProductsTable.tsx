import Link from "next/link";
import type { ReactNode } from "react";

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

type SourceBindingCounts = {
  total: number;
  active: number;
  draft: number;
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
    ]),
  );
}

async function getSourceBindingCountsByProductIds(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, SourceBindingCounts>();
  }

  const db = getDbOrThrow();

  const productIdsSql = sql.join(
    productIds.map((id) => sql`${id}`),
    sql`, `,
  );

  const result = await db.execute(sql`
    select
      product_id,
      count(*)::int as total,
      sum(case when status = 'active' then 1 else 0 end)::int as active,
      sum(case when status = 'draft' then 1 else 0 end)::int as draft,
      sum(case when status = 'archived' then 1 else 0 end)::int as archived
    from product_source_bindings
    where product_id in (${productIdsSql})
    group by product_id
  `);

  type Row = {
    product_id: string;
    total: number | string | null;
    active: number | string | null;
    draft: number | string | null;
    archived: number | string | null;
  };

  const rows = result.rows as Row[];

  return new Map<string, SourceBindingCounts>(
    rows.map((row) => [
      row.product_id,
      {
        total: Number(row.total ?? 0),
        active: Number(row.active ?? 0),
        draft: Number(row.draft ?? 0),
        archived: Number(row.archived ?? 0),
      },
    ]),
  );
}

function getReadinessScore(
  documentCounts: DocumentCounts,
  sourceBindingCounts: SourceBindingCounts,
) {
  let score = 0;

  if (documentCounts.active > 0) {
    score += 50;
  }

  if (sourceBindingCounts.active > 0) {
    score += 50;
  }

  return score;
}

function getReadinessMeta(
  documentCounts: DocumentCounts,
  sourceBindingCounts: SourceBindingCounts,
) {
  const score = getReadinessScore(documentCounts, sourceBindingCounts);

  if (score === 100) {
    return {
      label: "AI Hazır",
      tone: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300",
      detail: "Aktif belge ve aktif binding mevcut.",
    };
  }

  if (documentCounts.active > 0 && sourceBindingCounts.active === 0) {
    return {
      label: "Binding Eksik",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail: "Belge var ama aktif source binding yok.",
    };
  }

  if (documentCounts.active === 0 && sourceBindingCounts.active > 0) {
    return {
      label: "Belge Eksik",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail: "Binding var ama aktif belge yok.",
    };
  }

  return {
    label: "Hazırlık Eksik",
    tone: "border-red-900/60 bg-red-950/30 text-red-300",
    detail: "Aktif belge ve aktif binding henüz yok.",
  };
}

function InfoChip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 ${className}`}
    >
      {children}
    </span>
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-zinc-100">{value}</p>
      {subValue ? <p className="mt-1 text-xs text-zinc-500">{subValue}</p> : null}
    </div>
  );
}

function InlineCountsSection({
  label,
  items,
}: {
  label: string;
  items: Array<{ text: string; tone?: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {items.map((item) => (
        <InfoChip key={item.text} className={item.tone ?? ""}>
          {item.text}
        </InfoChip>
      ))}
    </div>
  );
}

function ReadinessBadge({
  documentCounts,
  sourceBindingCounts,
}: {
  documentCounts: DocumentCounts;
  sourceBindingCounts: SourceBindingCounts;
}) {
  const meta = getReadinessMeta(documentCounts, sourceBindingCounts);

  return <InfoChip className={meta.tone}>{meta.label}</InfoChip>;
}

function ReadinessPanel({
  documentCounts,
  sourceBindingCounts,
}: {
  documentCounts: DocumentCounts;
  sourceBindingCounts: SourceBindingCounts;
}) {
  const score = getReadinessScore(documentCounts, sourceBindingCounts);
  const meta = getReadinessMeta(documentCounts, sourceBindingCounts);

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Hazırlık Sinyali
          </p>
          <p className="mt-1 text-sm text-zinc-400">{meta.detail}</p>
        </div>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${meta.tone}`}
        >
          %{score}
        </span>
      </div>

      <InlineCountsSection
        label="Belgeler"
        items={[
          { text: `T ${documentCounts.total}` },
          ...(documentCounts.active > 0
            ? [{ text: `A ${documentCounts.active}`, tone: "text-emerald-300" }]
            : []),
          ...(documentCounts.archived > 0
            ? [{ text: `R ${documentCounts.archived}` }]
            : []),
        ]}
      />

      <InlineCountsSection
        label="Kaynak Bağları"
        items={[
          { text: `T ${sourceBindingCounts.total}` },
          ...(sourceBindingCounts.active > 0
            ? [{ text: `A ${sourceBindingCounts.active}`, tone: "text-emerald-300" }]
            : []),
          ...(sourceBindingCounts.draft > 0
            ? [{ text: `D ${sourceBindingCounts.draft}`, tone: "text-amber-300" }]
            : []),
          ...(sourceBindingCounts.archived > 0
            ? [{ text: `R ${sourceBindingCounts.archived}` }]
            : []),
        ]}
      />
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

  const productIds = products.map((product) => product.id);

  const [documentCountsByProductId, sourceBindingCountsByProductId] =
    await Promise.all([
      getDocumentCountsByProductIds(productIds),
      getSourceBindingCountsByProductIds(productIds),
    ]);

  return (
    <div className="grid gap-4">
      {products.map((product) => {
        const documentCounts = documentCountsByProductId.get(product.id) ?? {
          total: 0,
          active: 0,
          archived: 0,
        };

        const sourceBindingCounts = sourceBindingCountsByProductId.get(
          product.id,
        ) ?? {
          total: 0,
          active: 0,
          draft: 0,
          archived: 0,
        };

        return (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 xl:flex-row xl:items-start xl:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                  <ProductStatusBadge status={product.status} />
                  <ReadinessBadge
                    documentCounts={documentCounts}
                    sourceBindingCounts={sourceBindingCounts}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <InfoChip>{product.categoryName}</InfoChip>
                  <InfoChip>{product.slug}</InfoChip>
                  <InfoChip>{product.sku}</InfoChip>
                </div>
              </div>

              {product.shortDescription ? (
                <p className="max-w-3xl text-sm leading-6 text-zinc-400">
                  {product.shortDescription}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Fiyat" value={formatMoney(product.basePrice)} />
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
                  value={new Date(product.updatedAt).toLocaleDateString("tr-TR")}
                  subValue={new Date(product.updatedAt).toLocaleTimeString(
                    "tr-TR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    },
                  )}
                />
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col items-stretch gap-3 xl:w-[360px] xl:items-end">
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Link
                  href={`/admin/products/${product.id}/documents`}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Belgeler
                </Link>

                <Link
                  href={`/admin/products/${product.id}/sources`}
                  className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Kaynak Bağları
                </Link>

                <EditProductDrawer product={product} categories={categories} />

                <DeleteProductDialog
                  productId={product.id}
                  productName={product.name}
                />
              </div>

              <ReadinessPanel
                documentCounts={documentCounts}
                sourceBindingCounts={sourceBindingCounts}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}