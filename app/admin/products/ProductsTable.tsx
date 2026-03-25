import { DeleteProductDialog } from "./DeleteProductDialog";
import { EditProductDrawer } from "./EditProductDrawer";
import { formatMetric, formatMoney, formatWatts } from "./mappers";
import { ProductStatusBadge } from "./ProductStatusBadge";
import type { CategoryOption, ProductListItem } from "./types";

export function ProductsTable({
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

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Ağırlık</th>
              <th className="px-4 py-3">Güç</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Güncelleme</th>
              <th className="px-4 py-3 text-right">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-900">
            {products.map((product) => (
              <tr key={product.id} className="align-top transition hover:bg-zinc-900/60">
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-100">{product.name}</div>
                    <div className="text-xs text-zinc-500">
                      {product.slug} · {product.sku}
                    </div>
                    {product.shortDescription ? (
                      <p className="max-w-md text-sm text-zinc-400">
                        {product.shortDescription}
                      </p>
                    ) : null}
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-zinc-300">
                  {product.categoryName}
                </td>

                <td className="px-4 py-4 text-sm text-zinc-300">
                  {formatMoney(product.basePrice)}
                </td>

                <td className="px-4 py-4 text-sm text-zinc-300">
                  {formatMetric(product.weightKg, "kg")}
                </td>

                <td className="px-4 py-4 text-sm text-zinc-300">
                  <div>{formatWatts(product.powerDrawWatts)}</div>
                  <div className="text-xs text-zinc-500">
                    {formatWatts(product.powerSupplyWatts)}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <ProductStatusBadge status={product.status} />
                </td>

                <td className="px-4 py-4 text-sm text-zinc-400">
                  {new Date(product.updatedAt).toLocaleString("tr-TR")}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <EditProductDrawer product={product} categories={categories} />
                    <DeleteProductDialog
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}