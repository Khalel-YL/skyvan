import Link from "next/link";
import type { ReactNode } from "react";

import { inArray, sql } from "drizzle-orm";

import { getAiKnowledgeReadiness } from "@/app/lib/admin/governance";
import { getDbOrThrow } from "@/db/db";
import {
  aiDocumentChunks,
  aiKnowledgeDocuments,
  productDocuments,
} from "@/db/schema";

import { DeleteProductDialog } from "./DeleteProductDialog";
import { EditProductDrawer } from "./EditProductDrawer";
import { formatMetric, formatMoney, formatWatts } from "./mappers";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { CategoryOption, ProductListItem, ProductStatus } from "./types";

type DocumentCounts = {
  total: number;
  draft: number;
  active: number;
  archived: number;
};

type KnowledgeCounts = {
  total: number;
  completed: number;
  ready: number;
  blocked: number;
};

type SourceBindingCounts = {
  total: number;
  active: number;
  draft: number;
  archived: number;
};

type SourceBindingQuality = {
  activeTotal: number;
  targetedActive: number;
  broadActive: number;
};

type ReadinessMeta = {
  label: string;
  tone: string;
  detail: string;
};

function isLegacyAlignedToDraft(note: ProductListItem["lifecycleNote"]) {
  return (
    note === "legacy_active_downgraded" ||
    note === "legacy_active_aligned_to_draft"
  );
}

function getDisplayProductStatus(product: ProductListItem): ProductStatus {
  if (isLegacyAlignedToDraft(product.lifecycleNote)) {
    return "draft";
  }

  return product.status;
}

async function getDocumentCountsByProductIds(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, DocumentCounts>();
  }

  const db = getDbOrThrow();

  const rows = await db
    .select({
      productId: productDocuments.productId,
      total: sql<number>`count(*)::int`,
      draft: sql<number>`
        sum(
          case
            when ${productDocuments.status} = 'draft' then 1
            else 0
          end
        )::int
      `,
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
        draft: Number(row.draft ?? 0),
        active: Number(row.active ?? 0),
        archived: Number(row.archived ?? 0),
      },
    ]),
  );
}

async function getKnowledgeCountsByProductIds(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, KnowledgeCounts>();
  }

  const db = getDbOrThrow();

  const documents = await db
    .select({
      id: aiKnowledgeDocuments.id,
      productId: aiKnowledgeDocuments.productId,
      docType: aiKnowledgeDocuments.docType,
      parsingStatus: aiKnowledgeDocuments.parsingStatus,
      title: aiKnowledgeDocuments.title,
      s3Key: aiKnowledgeDocuments.s3Key,
    })
    .from(aiKnowledgeDocuments)
    .where(inArray(aiKnowledgeDocuments.productId, productIds));

  if (!documents.length) {
    return new Map<string, KnowledgeCounts>();
  }

  const chunkRows = await db
    .select({
      documentId: aiDocumentChunks.documentId,
      chunkCount: sql<number>`count(*)::int`,
    })
    .from(aiDocumentChunks)
    .where(
      inArray(
        aiDocumentChunks.documentId,
        documents.map((document) => document.id),
      ),
    )
    .groupBy(aiDocumentChunks.documentId);

  const chunkMap = new Map(
    chunkRows.map((row) => [row.documentId, Number(row.chunkCount ?? 0)]),
  );

  const knowledgeByProductId = new Map<string, KnowledgeCounts>();

  for (const document of documents) {
    if (!document.productId) {
      continue;
    }

    const current = knowledgeByProductId.get(document.productId) ?? {
      total: 0,
      completed: 0,
      ready: 0,
      blocked: 0,
    };

    current.total += 1;

    if (document.parsingStatus === "completed") {
      current.completed += 1;
    }

    const readiness = getAiKnowledgeReadiness({
      docType: document.docType,
      productId: document.productId,
      parsingStatus: document.parsingStatus,
      title: document.title,
      s3Key: document.s3Key,
      chunkCount: chunkMap.get(document.id) ?? 0,
    });

    if (readiness.approvedForAi) {
      current.ready += 1;
    } else {
      current.blocked += 1;
    }

    knowledgeByProductId.set(document.productId, current);
  }

  return knowledgeByProductId;
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

async function getSourceBindingQualityByProductIds(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, SourceBindingQuality>();
  }

  const db = getDbOrThrow();

  const productIdsSql = sql.join(
    productIds.map((id) => sql`${id}`),
    sql`, `,
  );

  const result = await db.execute(sql`
    select
      product_id,
      sum(case when status = 'active' then 1 else 0 end)::int as active_total,
      sum(
        case
          when status = 'active'
            and path_hint is not null
            and btrim(path_hint) <> ''
          then 1
          else 0
        end
      )::int as targeted_active,
      sum(
        case
          when status = 'active'
            and (
              path_hint is null
              or btrim(path_hint) = ''
            )
          then 1
          else 0
        end
      )::int as broad_active
    from product_source_bindings
    where product_id in (${productIdsSql})
    group by product_id
  `);

  type Row = {
    product_id: string;
    active_total: number | string | null;
    targeted_active: number | string | null;
    broad_active: number | string | null;
  };

  const rows = result.rows as Row[];

  return new Map<string, SourceBindingQuality>(
    rows.map((row) => [
      row.product_id,
      {
        activeTotal: Number(row.active_total ?? 0),
        targetedActive: Number(row.targeted_active ?? 0),
        broadActive: Number(row.broad_active ?? 0),
      },
    ]),
  );
}

function getReadinessScore(
  documentCounts: DocumentCounts,
  knowledgeCounts: KnowledgeCounts,
) {
  let score = 0;

  if (documentCounts.active > 0) {
    score += 50;
  } else if (documentCounts.draft > 0) {
    score += 25;
  }

  if (knowledgeCounts.ready > 0) {
    score += 50;
    return score;
  }

  if (knowledgeCounts.total > 0) {
    score += 25;
    return score;
  }

  return score;
}

function getReadinessMeta(
  documentCounts: DocumentCounts,
  knowledgeCounts: KnowledgeCounts,
): ReadinessMeta {
  const score = getReadinessScore(documentCounts, knowledgeCounts);

  if (score === 100) {
    return {
      label: "AI Hazır",
      tone: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300",
      detail: "Aktif belge ve AI-ready knowledge kaydı hizalı.",
    };
  }

  if (knowledgeCounts.ready > 0 && documentCounts.active === 0) {
    return {
      label: "Belge Pasif",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail: "AI-ready knowledge var ancak aktif ürün belgesi görünmüyor.",
    };
  }

  if (knowledgeCounts.total > 0) {
    return {
      label: "AI Bloklu",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail:
        documentCounts.active > 0
          ? "Knowledge kaydı var ama AI-ready şartlarını henüz sağlamıyor."
          : "Knowledge kaydı var ancak AI-ready seviyesine ulaşmamış.",
    };
  }

  if (documentCounts.active > 0) {
    return {
      label: "İşleme Eksik",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail: "Aktif belge var ancak knowledge / chunk hazır değil.",
    };
  }

  if (documentCounts.draft > 0) {
    return {
      label: "Belge Taslakta",
      tone: "border-amber-900/60 bg-amber-950/30 text-amber-300",
      detail: "Belge var ama henüz aktif akışa alınmamış.",
    };
  }

  return {
    label: "Hazırlık Eksik",
    tone: "border-red-900/60 bg-red-950/30 text-red-300",
    detail: "AI için kullanılabilir belge / knowledge sinyali yok.",
  };
}

function getReadinessPriority(
  meta: ReadinessMeta,
  score: number,
) {
  if (score === 0) return 0;
  if (meta.label === "Hazırlık Eksik") return 1;
  if (meta.label === "Belge Taslakta") return 2;
  if (meta.label === "İşleme Eksik") return 3;
  if (meta.label === "AI Bloklu") return 4;
  if (meta.label === "Belge Pasif") return 5;
  if (score === 100) return 6;
  return 5;
}

function formatShortId(value: string) {
  if (!value) return "-";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
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
  meta,
}: {
  meta: ReadinessMeta;
}) {
  return <InfoChip className={meta.tone}>{meta.label}</InfoChip>;
}

function ReadinessPanel({
  documentCounts,
  knowledgeCounts,
  sourceBindingCounts,
  sourceBindingQuality,
  meta,
  score,
}: {
  documentCounts: DocumentCounts;
  knowledgeCounts: KnowledgeCounts;
  sourceBindingCounts: SourceBindingCounts;
  sourceBindingQuality: SourceBindingQuality;
  meta: ReadinessMeta;
  score: number;
}) {
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
          ...(documentCounts.draft > 0
            ? [{ text: `D ${documentCounts.draft}`, tone: "text-amber-300" }]
            : []),
          ...(documentCounts.active > 0
            ? [{ text: `A ${documentCounts.active}`, tone: "text-emerald-300" }]
            : []),
          ...(documentCounts.archived > 0
            ? [{ text: `R ${documentCounts.archived}` }]
            : []),
        ]}
      />

      <InlineCountsSection
        label="AI Knowledge"
        items={[
          { text: `T ${knowledgeCounts.total}` },
          ...(knowledgeCounts.ready > 0
            ? [{ text: `Hazır ${knowledgeCounts.ready}`, tone: "text-emerald-300" }]
            : []),
          ...(knowledgeCounts.completed > 0
            ? [{ text: `Completed ${knowledgeCounts.completed}` }]
            : []),
          ...(knowledgeCounts.blocked > 0
            ? [{ text: `Bloklu ${knowledgeCounts.blocked}`, tone: "text-amber-300" }]
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

      {sourceBindingCounts.active > 0 ? (
        <InlineCountsSection
          label="Binding Kalitesi"
          items={[
            ...(sourceBindingQuality.targetedActive > 0
              ? [
                  {
                    text: `Hedefli ${sourceBindingQuality.targetedActive}`,
                    tone: "text-emerald-300",
                  },
                ]
              : []),
            ...(sourceBindingQuality.broadActive > 0
              ? [
                  {
                    text: `Geniş ${sourceBindingQuality.broadActive}`,
                    tone: "text-amber-300",
                  },
                ]
              : []),
          ]}
        />
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

  const productIds = products.map((product) => product.id);

  const [
    documentCountsByProductId,
    knowledgeCountsByProductId,
    sourceBindingCountsByProductId,
    sourceBindingQualityByProductId,
  ] = await Promise.all([
    getDocumentCountsByProductIds(productIds),
    getKnowledgeCountsByProductIds(productIds),
    getSourceBindingCountsByProductIds(productIds),
    getSourceBindingQualityByProductIds(productIds),
  ]);

  const enrichedProducts = products
    .map((product) => {
      const documentCounts = documentCountsByProductId.get(product.id) ?? {
        total: 0,
        draft: 0,
        active: 0,
        archived: 0,
      };

      const knowledgeCounts = knowledgeCountsByProductId.get(product.id) ?? {
        total: 0,
        completed: 0,
        ready: 0,
        blocked: 0,
      };

      const sourceBindingCounts = sourceBindingCountsByProductId.get(
        product.id,
      ) ?? {
        total: 0,
        active: 0,
        draft: 0,
        archived: 0,
      };

      const sourceBindingQuality = sourceBindingQualityByProductId.get(
        product.id,
      ) ?? {
        activeTotal: 0,
        targetedActive: 0,
        broadActive: 0,
      };

      const score = getReadinessScore(documentCounts, knowledgeCounts);

      const meta = getReadinessMeta(documentCounts, knowledgeCounts);

      return {
        product,
        documentCounts,
        knowledgeCounts,
        sourceBindingCounts,
        sourceBindingQuality,
        score,
        meta,
        priority: getReadinessPriority(meta, score),
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return (
        new Date(b.product.updatedAt).getTime() -
        new Date(a.product.updatedAt).getTime()
      );
    });

  return (
    <div className="grid gap-4">
      {enrichedProducts.map(
        ({
          product,
          documentCounts,
          knowledgeCounts,
          sourceBindingCounts,
          sourceBindingQuality,
          score,
          meta,
        }) => {
          const displayStatus = getDisplayProductStatus(product);
          const displayProduct =
            displayStatus === product.status
              ? product
              : { ...product, status: displayStatus };
          const documentsNeedAttention = documentCounts.active === 0;
          const bindingsNeedAttention =
            sourceBindingCounts.active === 0 ||
            sourceBindingQuality.broadActive > 0;

          const documentsButtonClass = documentsNeedAttention
            ? "border-amber-900/60 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100";

          const bindingsButtonClass = bindingsNeedAttention
            ? "border-amber-900/60 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100";

          return (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 xl:flex-row xl:items-start xl:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                    <ProductStatusBadge status={displayStatus} />
                    <ReadinessBadge meta={meta} />
                    {isLegacyAlignedToDraft(product.lifecycleNote) ? (
                      <InfoChip className="border-amber-900/60 bg-amber-950/30 text-amber-300">
                        Legacy aktif taslağa alındı
                      </InfoChip>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <InfoChip className="border-zinc-700 text-zinc-100">
                      {product.categoryName}
                    </InfoChip>

                    {product.sku ? <InfoChip>{product.sku}</InfoChip> : null}

                    <InfoChip className="text-zinc-500">
                      {formatShortId(product.slug)}
                    </InfoChip>
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
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${documentsButtonClass}`}
                  >
                    Belgeler
                  </Link>

                  <Link
                    href={`/admin/products/${product.id}/sources`}
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${bindingsButtonClass}`}
                  >
                    Kaynak Bağları
                  </Link>

                  <EditProductDrawer product={displayProduct} categories={categories} />

                  <DeleteProductDialog
                    productId={product.id}
                    productName={product.name}
                    productStatus={displayStatus}
                  />
                </div>

                <ReadinessPanel
                  documentCounts={documentCounts}
                  knowledgeCounts={knowledgeCounts}
                  sourceBindingCounts={sourceBindingCounts}
                  sourceBindingQuality={sourceBindingQuality}
                  meta={meta}
                  score={score}
                />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
