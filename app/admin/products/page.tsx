import { AddProductDrawer } from "./AddProductDrawer";
import { getProductCategories, getProducts } from "./actions";
import { ProductFilters } from "./ProductFilters";
import { ProductsSummary } from "./ProductsSummary";
import { ProductsTable } from "./ProductsTable";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  categoryId?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = typeof params?.q === "string" ? params.q : "";
  const status = typeof params?.status === "string" ? params.status : "all";
  const categoryId =
    typeof params?.categoryId === "string" ? params.categoryId : "all";

  const normalizedStatus =
    status === "draft" ||
    status === "active" ||
    status === "archived" ||
    status === "all"
      ? status
      : "all";

  const [categories, productRows] = await Promise.all([
    getProductCategories(),
    getProducts({
      q,
      status: normalizedStatus,
      categoryId,
    }),
  ]);

  const summary = productRows.reduce(
    (acc, product) => {
      acc.total += 1;

      if (product.status === "active") acc.active += 1;
      if (product.status === "draft") acc.draft += 1;
      if (product.status === "archived") acc.archived += 1;

      return acc;
    },
    {
      total: 0,
      active: 0,
      draft: 0,
      archived: 0,
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Products
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              Ürün Yönetimi
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Ürün kayıtlarını yönet, filtrele, belge bağlantılarını takip et ve
              aktif / arşiv yaşam döngüsünü tek merkezden kontrol et.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <AddProductDrawer categories={categories} />
        </div>
      </div>

      <ProductsSummary
        total={summary.total}
        active={summary.active}
        draft={summary.draft}
        archived={summary.archived}
        currentStatus={normalizedStatus}
      />

      <ProductFilters categories={categories} />

      <ProductsTable products={productRows} categories={categories} />
    </div>
  );
}