import { AddProductDrawer } from "./AddProductDrawer";
import { getProductCategories, getProducts } from "./actions";
import { ProductFilters } from "./ProductFilters";
import { ProductsTable } from "./ProductsTable";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams: SearchParams;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = typeof params?.q === "string" ? params.q : "";
  const status = typeof params?.status === "string" ? params.status : "all";
  const categoryId =
    typeof params?.categoryId === "string" ? params.categoryId : "all";

  const [categories, productRows] = await Promise.all([
    getProductCategories(),
    getProducts({
      q,
      status: status as "all" | "draft" | "active" | "archived",
      categoryId,
    }),
  ]);

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Products</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ürün ana kayıtlarını burada yönet.
          </p>
        </div>

        <AddProductDrawer categories={categories} />
      </div>

      <ProductFilters categories={categories} />

      <ProductsTable products={productRows} categories={categories} />
    </div>
  );
}