import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { categories, models, products } from "@/db/schema";
import ConfiguratorClient from "@/app/workshop/ConfiguratorClient";

export default async function DesignPage() {
  const db = getDbOrThrow();

  // Hem ürünleri hem araçları tek sayfada çekiyoruz (Hızlı SPA mantığı)
  const dbProducts = await db
    .select({
      id: products.id,
      title: products.name,
      name: products.name,
      sku: products.sku,
      weightKg: products.weightKg,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "active"));
  const dbModels = await db
    .select()
    .from(models)
    .where(eq(models.status, "active"));

  return (
    <main className="bg-[#050505] min-h-screen">
      <ConfiguratorClient dbProducts={dbProducts} dbModels={dbModels} />
    </main>
  );
}
