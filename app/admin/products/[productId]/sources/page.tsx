import Link from "next/link";
import type { ReactNode } from "react";

import {
  getManufacturerSourceBindingOptions,
  getProductSourceBindings,
  getProductSourceBindingsPageProduct,
} from "./actions";
import { AddProductSourceBindingDrawer } from "./AddProductSourceBindingDrawer";
import { ProductSourceBindingFilters } from "./ProductSourceBindingFilters";
import { ProductSourceBindingsTable } from "./ProductSourceBindingsTable";
import type { ProductSourceBindingFilterStatus } from "./types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Params = Promise<{
  productId: string;
}>;

type PageProps = {
  params: Params;
  searchParams: SearchParams;
};

function getSingleValue(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function normalizeStatus(value: string): ProductSourceBindingFilterStatus {
  if (
    value === "all" ||
    value === "draft" ||
    value === "active" ||
    value === "archived"
  ) {
    return value;
  }

  return "active";
}

function getProductStatusLabel(status: "draft" | "active" | "archived") {
  if (status === "archived") return "Arşiv Ürün";
  if (status === "draft") return "Taslak Ürün";
  return "Aktif Ürün";
}

function getProductStatusTone(status: "draft" | "active" | "archived") {
  if (status === "archived") {
    return "border-zinc-800 bg-zinc-900 text-zinc-300";
  }

  if (status === "draft") {
    return "border-amber-900/60 bg-amber-950/40 text-amber-300";
  }

  return "border-emerald-900/60 bg-emerald-950/40 text-emerald-300";
}

export default async function ProductSourceBindingsPage({
  params,
  searchParams,
}: PageProps) {
  const { productId } = await params;
  const resolvedSearchParams = await searchParams;

  const q = getSingleValue(resolvedSearchParams.q).trim();
  const status = normalizeStatus(
    getSingleValue(resolvedSearchParams.status, "active"),
  );

  const basePath = `/admin/products/${productId}/sources`;

  const [product, sourceOptions, allBindings, filteredBindings] =
    await Promise.all([
      getProductSourceBindingsPageProduct(productId),
      getManufacturerSourceBindingOptions(),
      getProductSourceBindings(productId, {
        q: "",
        status: "all",
      }),
      getProductSourceBindings(productId, {
        q,
        status,
      }),
    ]);

  if (!product) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <h1 className="text-2xl font-semibold text-white">Ürün bulunamadı</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Geçerli ürün kaydı bulunamadığı için source binding ekranı açılamadı.
        </p>

        <div className="mt-6">
          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
          >
            Products’a Dön
          </Link>
        </div>
      </div>
    );
  }

  const totalCount = allBindings.length;
  const activeCount = allBindings.filter((item) => item.status === "active").length;
  const draftCount = allBindings.filter((item) => item.status === "draft").length;
  const archivedCount = allBindings.filter(
    (item) => item.status === "archived",
  ).length;

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className="inline-flex h-10 items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Products
            </Link>

            <Link
              href={`/admin/products/${product.id}/documents`}
              className="inline-flex h-10 items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Belgeler
            </Link>

            <Link
              href="/admin/manufacturer-sources"
              className="inline-flex h-10 items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Manufacturer Sources
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Product Source Bindings
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Ürün ile manufacturer source registry arasındaki bağları burada yönet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <InfoChip>{product.name}</InfoChip>
            <InfoChip>{product.categoryName}</InfoChip>
            <InfoChip>{product.sku}</InfoChip>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm ${getProductStatusTone(
                product.status,
              )}`}
            >
              {getProductStatusLabel(product.status)}
            </span>
          </div>
        </div>

        <AddProductSourceBindingDrawer
          productId={product.id}
          sourceOptions={sourceOptions}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Toplam Bağ" value={String(totalCount)} />
        <SummaryCard label="Aktif" value={String(activeCount)} />
        <SummaryCard label="Taslak" value={String(draftCount)} />
        <SummaryCard label="Arşiv" value={String(archivedCount)} />
      </div>

      <ProductSourceBindingFilters basePath={basePath} q={q} status={status} />

      <ProductSourceBindingsTable
        bindings={filteredBindings}
        sourceOptions={sourceOptions}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function InfoChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-300">
      {children}
    </span>
  );
}