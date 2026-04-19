"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import {
  getProductSelectionAiDecisionBundle,
  type ProductSelectionAiDecisionBundle,
} from "@/app/lib/admin/governance";
import { getDbOrThrow } from "@/db/db";
import { builds, buildVersions, buildSelectedProducts, packages } from "@/db/schema";

type WorkshopCartItem = {
  product: {
    id: string;
  };
  quantity: number;
};

type WorkshopStats = {
  weight: number;
};

type SaveEngineeringBuildInput = {
  vehicleId: string;
  cart: WorkshopCartItem[];
  stats: WorkshopStats;
  totalPrice: number;
};

type SaveEngineeringBuildResult =
  | {
      success: true;
      shortCode: string;
      aiDecisionBundle: ProductSelectionAiDecisionBundle | null;
    }
  | {
      success: false;
      error: string;
    };

export async function saveEngineeringBuild(
  data: SaveEngineeringBuildInput,
): Promise<SaveEngineeringBuildResult> {
  try {
    const db = getDbOrThrow();
    const selectedProductIds = data.cart.map((item) => item.product.id);
    let shortCode = "";

    await db.transaction(async (tx) => {
      // 1. "Özel Mühendislik" paketi var mı kontrol et, yoksa aynı model için oluştur
      const existingPackages = await tx
        .select()
        .from(packages)
        .where(
          and(
            eq(packages.slug, "custom-engineering"),
            eq(packages.modelId, data.vehicleId),
          ),
        )
        .limit(1);

      let defaultPackage = existingPackages[0] ?? null;

      if (!defaultPackage) {
        const insertedPackages = await tx
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

      let newBuild: typeof builds.$inferSelect | null = null;

      // 2. Ana Proje Kaydı
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidateShortCode = `SV-${Math.floor(100000 + Math.random() * 900000)}`;
        const existingBuilds = await tx
          .select({ id: builds.id })
          .from(builds)
          .where(eq(builds.shortCode, candidateShortCode))
          .limit(1);

        if (existingBuilds[0]) {
          continue;
        }

        try {
          const insertedBuilds = await tx
            .insert(builds)
            .values({
              shortCode: candidateShortCode,
              sessionId: uuidv4(),
              modelId: data.vehicleId,
            })
            .returning();

          newBuild = insertedBuilds[0] ?? null;

          if (newBuild) {
            shortCode = candidateShortCode;
            break;
          }
        } catch (buildInsertError) {
          const isUniqueViolation =
            typeof buildInsertError === "object" &&
            buildInsertError !== null &&
            "code" in buildInsertError &&
            (buildInsertError as { code?: string }).code === "23505";

          if (isUniqueViolation) {
            continue;
          }

          throw buildInsertError;
        }
      }

      if (!newBuild || !shortCode) {
        throw new Error("Benzersiz proje kodu üretilemedi.");
      }

      // 3. Versiyon Kaydı
      const insertedVersions = await tx
        .insert(buildVersions)
        .values({
          buildId: newBuild.id,
          packageId: defaultPackage.id,
          versionNumber: 1,
          totalWeightKg: data.stats.weight.toString(),
          totalPrice: data.totalPrice.toString(),
          stateSnapshot: data.stats,
        })
        .returning();
      const newVersion = insertedVersions[0];

      if (!newVersion) {
        throw new Error("Versiyon kaydı oluşturulamadı.");
      }

      await tx
        .update(builds)
        .set({
          currentVersionId: newVersion.id,
          updatedAt: new Date(),
        })
        .where(eq(builds.id, newBuild.id));

      // 4. Ürün Kaydı
      const productEntries = data.cart.map((item) => ({
        buildVersionId: newVersion.id,
        productId: item.product.id,
        quantity: item.quantity,
      }));

      if (productEntries.length > 0) {
        await tx.insert(buildSelectedProducts).values(productEntries);
      }
    });

    let aiDecisionBundle: ProductSelectionAiDecisionBundle | null = null;

    try {
      aiDecisionBundle = await getProductSelectionAiDecisionBundle({
        productIds: selectedProductIds,
      });
    } catch (bundleError) {
      console.error("WORKSHOP_AI_DECISION_BUNDLE_HATASI:", bundleError);
    }

    revalidatePath("/admin/siparisler");
    return {
      success: true,
      shortCode,
      aiDecisionBundle,
    };
  } catch (error) {
    console.error("VERİTABANI_YAZMA_HATASI:", error);
    return { success: false, error: "Kaydetme sırasında bir hata oluştu." };
  }
}
