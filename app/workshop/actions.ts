"use server";

import { db } from "@/db/db";
import { builds, buildVersions, buildSelectedProducts, packages } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function saveEngineeringBuild(data: {
  vehicleId: string;
  cart: any[];
  stats: any;
  totalPrice: number;
}) {
  try {
    // 1. "Özel Mühendislik" paketi var mı kontrol et, yoksa sadece 'slug' ile oluştur
    let defaultPackage = await db.query.packages.findFirst({
        where: (p, { eq }) => eq(p.slug, "custom-engineering")
    });

    if (!defaultPackage) {
        const [newPkg] = await db.insert(packages).values({
            slug: "custom-engineering",
            name: "Özel Tasarım", // Eğer şemada 'name' yoksa burayı sil
            modelId: data.vehicleId, // Eğer şemada 'modelId' yoksa burayı sil
        } as any).returning();
        defaultPackage = newPkg;
    }

    const shortCode = `SV-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Ana Proje Kaydı
    const [newBuild] = await db.insert(builds).values({
      shortCode: shortCode,
      sessionId: uuidv4(),
      modelId: data.vehicleId,
    }).returning();

    // 3. Versiyon Kaydı
    const [newVersion] = await db.insert(buildVersions).values({
      buildId: newBuild.id,
      packageId: defaultPackage.id,
      versionNumber: 1,
      totalWeightKg: data.stats.weight.toString(),
      totalPrice: data.totalPrice.toString(),
      stateSnapshot: data.stats,
    }).returning();

    // 4. Ürün Kaydı
    const productEntries = data.cart.map((item) => ({
      buildVersionId: newVersion.id,
      productId: item.product.id,
      quantity: item.quantity,
    }));

    if (productEntries.length > 0) {
      await db.insert(buildSelectedProducts).values(productEntries);
    }

    revalidatePath("/admin/siparisler");
    return { success: true, shortCode: shortCode };

  } catch (error) {
    console.error("VERİTABANI_YAZMA_HATASI:", error);
    return { success: false, error: "Kaydetme sırasında bir hata oluştu." };
  }
}