import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { products, models } from "@/db/schema";
import ConfiguratorClient from "@/app/workshop/ConfiguratorClient";

export default async function DesignPage() {
  const db = getDbOrThrow();

  // Hem ürünleri hem araçları tek sayfada çekiyoruz (Hızlı SPA mantığı)
  const dbProducts = await db
    .select()
    .from(products)
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
