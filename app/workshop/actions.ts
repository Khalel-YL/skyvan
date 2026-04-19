"use server";

import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
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
    const db = getDbOrThrow();

    // 1. "Özel Mühendislik" paketi var mı kontrol et, yoksa sadece 'slug' ile oluştur
    const existingPackages = await db
      .select()
      .from(packages)
      .where(eq(packages.slug, "custom-engineering"))
      .limit(1);

    let defaultPackage = existingPackages[0] ?? null;

    if (!defaultPackage) {
        const insertedPackages = await db
          .insert(packages)
          .values({
            slug: "custom-engineering",
            name: "Özel Tasarım",
            modelId: data.vehicleId,
          })
          .returning();

        defaultPackage = insertedPackages[0] ?? null;
    }

    if (!defaultPackage) {
      throw new Error("Varsayılan paket oluşturulamadı.");
    }

    const shortCode = `SV-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Ana Proje Kaydı
    const insertedBuilds = await db.insert(builds).values({
      shortCode: shortCode,
      sessionId: uuidv4(),
      modelId: data.vehicleId,
    }).returning();
    const newBuild = insertedBuilds[0];

    if (!newBuild) {
      throw new Error("Proje kaydı oluşturulamadı.");
    }

    // 3. Versiyon Kaydı
    const insertedVersions = await db.insert(buildVersions).values({
      buildId: newBuild.id,
      packageId: defaultPackage.id,
      versionNumber: 1,
      totalWeightKg: data.stats.weight.toString(),
      totalPrice: data.totalPrice.toString(),
      stateSnapshot: data.stats,
    }).returning();
    const newVersion = insertedVersions[0];

    if (!newVersion) {
      throw new Error("Versiyon kaydı oluşturulamadı.");
    }

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
