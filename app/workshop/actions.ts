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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class WorkshopActionError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
  ) {
    super(message);
    this.name = "WorkshopActionError";
  }
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getDbErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : null;
}

function isUniqueViolation(error: unknown) {
  return getDbErrorCode(error) === "23505";
}

function logWorkshopActionError(
  action: string,
  error: unknown,
  meta: { stage: string; productCount?: number; hasShortCode?: boolean },
) {
  console.error(`workshop/${action} write error`, {
    action,
    stage: meta.stage,
    productCount: meta.productCount,
    hasShortCode: meta.hasShortCode,
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

export async function saveEngineeringBuild(
  data: SaveEngineeringBuildInput,
): Promise<SaveEngineeringBuildResult> {
  let writeStage = "prepare";
  let shortCode = "";
  let selectedProductIds: string[] = [];

  try {
    const db = getDbOrThrow();

    if (!isUuid(data.vehicleId)) {
      throw new WorkshopActionError("Geçersiz kayıt bilgisi.", "validation");
    }

    const productEntries = data.cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const hasInvalidProduct = productEntries.some(
      (entry) =>
        !isUuid(entry.productId) ||
        !Number.isInteger(entry.quantity) ||
        entry.quantity < 1,
    );

    if (hasInvalidProduct) {
      throw new WorkshopActionError("Geçersiz kayıt bilgisi.", "validation");
    }

    if (!Number.isFinite(data.stats.weight) || !Number.isFinite(data.totalPrice)) {
      throw new WorkshopActionError("Geçersiz kayıt bilgisi.", "validation");
    }

    selectedProductIds = productEntries.map((item) => item.productId);

    writeStage = "package";
    // 1. "Özel Mühendislik" paketi var mı kontrol et, yoksa aynı model için oluştur.
    const existingPackages = await db
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
      throw new WorkshopActionError(
        "Seçim kaydı tamamlanamadı. Lütfen tekrar deneyin.",
        writeStage,
      );
    }

    let newBuild: typeof builds.$inferSelect | null = null;

    writeStage = "build";
    // 2. Ana Proje Kaydı
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidateShortCode = `SV-${Math.floor(100000 + Math.random() * 900000)}`;
      const existingBuilds = await db
        .select({ id: builds.id })
        .from(builds)
        .where(eq(builds.shortCode, candidateShortCode))
        .limit(1);

      if (existingBuilds[0]) {
        continue;
      }

      try {
        const insertedBuilds = await db
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
        if (isUniqueViolation(buildInsertError)) {
          continue;
        }

        throw buildInsertError;
      }
    }

    if (!newBuild || !shortCode) {
      throw new WorkshopActionError(
        "Seçim kaydı tamamlanamadı. Lütfen tekrar deneyin.",
        writeStage,
      );
    }

    writeStage = "version";
    // 3. Versiyon Kaydı
    const insertedVersions = await db
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
      throw new WorkshopActionError(
        "Seçim kaydı tamamlanamadı. Lütfen tekrar deneyin.",
        writeStage,
      );
    }

    writeStage = "build-current-version";
    await db
      .update(builds)
      .set({
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(builds.id, newBuild.id));

    writeStage = "selected-products";
    // 4. Ürün Kaydı
    if (productEntries.length > 0) {
      await db.insert(buildSelectedProducts).values(
        productEntries.map((item) => ({
          buildVersionId: newVersion.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      );
    }

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
    logWorkshopActionError("saveEngineeringBuild", error, {
      stage: error instanceof WorkshopActionError ? error.stage : writeStage,
      productCount: selectedProductIds.length,
      hasShortCode: Boolean(shortCode),
    });

    if (error instanceof WorkshopActionError) {
      return { success: false, error: error.message };
    }

    if (writeStage === "selected-products") {
      return {
        success: false,
        error: "Seçili ürünler kaydedilirken beklenmeyen bir hata oluştu.",
      };
    }

    return {
      success: false,
      error: "Workshop kaydı güncellenirken beklenmeyen bir hata oluştu.",
    };
  }
}
