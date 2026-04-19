import Link from "next/link";
import {
  getProductAiDecisionSignal,
  getProductGroundedExplanation,
} from "@/app/lib/admin/governance";
import { AddProductDocumentDrawer } from "./AddProductDocumentDrawer";
import { DEFAULT_PRODUCT_DOCUMENT_FILTERS } from "./constants";
import { ProductDocumentsSummary } from "./ProductDocumentsSummary";
import { ProductDocumentsTable } from "./ProductDocumentsTable";
import { buildProductDocumentsSummary } from "./lib";
import { productDocumentFiltersSchema } from "./schema";
import {
  getProductDocuments,
  getProductDocumentsPageProduct,
} from "./actions";

type PageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ status?: string }>;
};

function getProductStatusLabel(status: "draft" | "active" | "archived") {
  switch (status) {
    case "draft":
      return "Taslak";
    case "active":
      return "Aktif";
    case "archived":
      return "Arşiv";
    default:
      return status;
  }
}

function getProductStatusClasses(status: "draft" | "active" | "archived") {
  switch (status) {
    case "active":
      return "border-green-800 bg-green-950 text-green-300";
    case "archived":
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
    case "draft":
      return "border-amber-800 bg-amber-950 text-amber-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

export default async function ProductDocumentsPage({
  params,
  searchParams,
}: PageProps) {
  const { productId } = await params;
  const resolvedSearchParams = await searchParams;

  const filtersResult = productDocumentFiltersSchema.safeParse({
    status:
      resolvedSearchParams.status ??
      DEFAULT_PRODUCT_DOCUMENT_FILTERS.status,
  });

  const filters = filtersResult.success
    ? filtersResult.data
    : { ...DEFAULT_PRODUCT_DOCUMENT_FILTERS };

  const product = await getProductDocumentsPageProduct(productId);

  if (!product) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          ← Ürünlere dön
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100">
          Ürün bulunamadı
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          Geçerli bir ürün seçip tekrar deneyin.
        </p>
      </div>
    );
  }

  const [documents, groundedExplanation, decisionSignal] = await Promise.all([
    getProductDocuments(productId, filters),
    getProductGroundedExplanation({ productId }),
    getProductAiDecisionSignal({ productId }),
  ]);
  const summary = buildProductDocumentsSummary(documents);

  const statusHref = (status: "all" | "active" | "archived") =>
    `/admin/products/${productId}/documents?status=${status}`;

  const activeFilterClass = (status: "all" | "active" | "archived") =>
    filters.status === status
      ? "border-zinc-600 bg-zinc-100 text-zinc-900"
      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100";

  const emptyState =
    filters.status === "archived"
      ? {
          title: "Arşivde belge bulunamadı",
          description: "Bu ürün için arşivlenmiş belge kaydı yok.",
        }
      : filters.status === "all"
      ? {
          title: "Belge bulunamadı",
          description: "Bu ürün için henüz belge kaydı yok.",
        }
      : {
          title: "Aktif belge bulunamadı",
          description:
            "Bu ürün için aktif durumda belge kaydı yok. Arşiv filtresini de kontrol edin.",
        };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            ← Ürünlere dön
          </Link>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Ürün Belgeleri
            </h1>

            <p className="mt-1 text-sm text-zinc-300">
              {product.name}
              {product.sku ? (
                <span className="text-zinc-500"> · {product.sku}</span>
              ) : null}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                {product.categoryName}
              </span>

              <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                {product.slug}
              </span>

              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getProductStatusClasses(
                  product.status
                )}`}
              >
                {getProductStatusLabel(product.status)}
              </span>

              <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
                Toplam {summary.total} belge
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <Link
              href={statusHref("active")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeFilterClass(
                "active"
              )}`}
            >
              Aktif
            </Link>
            <Link
              href={statusHref("archived")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeFilterClass(
                "archived"
              )}`}
            >
              Arşiv
            </Link>
            <Link
              href={statusHref("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeFilterClass(
                "all"
              )}`}
            >
              Tümü
            </Link>
          </div>

          <AddProductDocumentDrawer
            productId={product.id}
            productName={product.name}
          />
        </div>
      </div>

      <ProductDocumentsSummary
        summary={summary}
        groundedExplanation={groundedExplanation}
        decisionSignal={decisionSignal}
      />

      <ProductDocumentsTable
        documents={documents}
        emptyTitle={emptyState.title}
        emptyDescription={emptyState.description}
      />
    </div>
  );
}
