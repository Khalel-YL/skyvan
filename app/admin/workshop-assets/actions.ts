"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { hotspotMappings, models, products, visualAssets2d } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

import {
  createFieldError,
  createGenericError,
  getTrimmed,
  isSafeAssetReference,
  isUuid,
  parseLayerOrder,
} from "./validation";
import type { WorkshopAssetFormState } from "./types";

type WorkshopAssetRecord = {
  id: string;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
};

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logWorkshopAssetActionError(action: string, id: string | null, error: unknown) {
  console.error(`workshop-assets/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getWorkshopAssetFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Yinelenen Workshop varlığı veya benzersiz alan çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "İlişkili ürün veya model doğrulanamadığı için Workshop varlığı işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Geçersiz kayıt kimliği nedeniyle Workshop varlığı işlemi durduruldu.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle Workshop varlığı kaydı tamamlanamadı.";
  }

  return "Workshop varlığı işlenirken beklenmeyen bir hata oluştu.";
}

function getDeleteCode(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("invalid input syntax for type uuid")) {
    return "invalid-id";
  }

  if (
    message.includes("violates foreign key constraint") ||
    message.includes("still referenced") ||
    message.includes("restrict")
  ) {
    return "relation-blocked";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  return "delete-failed";
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function buildWorkshopAssetsRedirectUrl(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/workshop-assets?${query}` : "/admin/workshop-assets";
}

async function writeWorkshopAssetAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "workshop_asset",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

async function findWorkshopAssetById(id: string): Promise<WorkshopAssetRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: visualAssets2d.id,
      productId: visualAssets2d.productId,
      modelId: visualAssets2d.modelId,
      cameraView: visualAssets2d.cameraView,
      zIndexLayer: visualAssets2d.zIndexLayer,
      assetUrl: visualAssets2d.assetUrl,
      fallbackUrl: visualAssets2d.fallbackUrl,
    })
    .from(visualAssets2d)
    .where(eq(visualAssets2d.id, id))
    .limit(1);

  return (rows[0] as WorkshopAssetRecord | undefined) ?? null;
}

async function productExists(id: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return rows.length > 0;
}

async function modelExists(id: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.id, id))
    .limit(1);

  return rows.length > 0;
}

async function findDuplicateAsset(input: {
  id?: string;
  productId: string;
  modelId: string;
  cameraView: string;
  zIndexLayer: number;
}) {
  const db = getDbOrThrow();
  const conditions = [
    eq(visualAssets2d.productId, input.productId),
    eq(visualAssets2d.modelId, input.modelId),
    eq(visualAssets2d.cameraView, input.cameraView),
    eq(visualAssets2d.zIndexLayer, input.zIndexLayer),
  ];

  if (input.id) {
    conditions.push(ne(visualAssets2d.id, input.id));
  }

  const rows = await db
    .select({ id: visualAssets2d.id })
    .from(visualAssets2d)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

export async function saveWorkshopAsset(
  _previousState: WorkshopAssetFormState,
  formData: FormData,
): Promise<WorkshopAssetFormState> {
  try {
    const db = getDbOrThrow();
    const id = getTrimmed(formData, "id");
    const productId = getTrimmed(formData, "productId");
    const modelId = getTrimmed(formData, "modelId");
    const cameraView = getTrimmed(formData, "cameraView");
    const zIndexLayer = parseLayerOrder(getTrimmed(formData, "zIndexLayer"));
    const assetUrl = getTrimmed(formData, "assetUrl");
    const fallbackUrl = getTrimmed(formData, "fallbackUrl");

    if (id && !isUuid(id)) {
      return createGenericError("Geçersiz kayıt kimliği nedeniyle işlem durduruldu.");
    }

    if (!productId || !isUuid(productId)) {
      return createFieldError("productId", "Geçerli bir ürün seçilmelidir.");
    }

    if (!modelId || !isUuid(modelId)) {
      return createFieldError("modelId", "Geçerli bir araç modeli seçilmelidir.");
    }

    if (!cameraView) {
      return createFieldError("cameraView", "Kamera görünümü zorunludur.");
    }

    if (cameraView.length > 80) {
      return createFieldError("cameraView", "Kamera görünümü en fazla 80 karakter olabilir.");
    }

    if (zIndexLayer === null) {
      return createFieldError("zIndexLayer", "Katman sırası tam sayı olmalıdır.");
    }

    if (zIndexLayer < -1000 || zIndexLayer > 1000) {
      return createFieldError("zIndexLayer", "Katman sırası -1000 ile 1000 arasında olmalıdır.");
    }

    if (!assetUrl) {
      return createFieldError("assetUrl", "Varlık URL zorunludur.");
    }

    if (!isSafeAssetReference(assetUrl)) {
      return createFieldError(
        "assetUrl",
        "Varlık URL güvenli http/https adresi veya güvenli depo yolu olmalıdır.",
      );
    }

    if (fallbackUrl && !isSafeAssetReference(fallbackUrl)) {
      return createFieldError(
        "fallbackUrl",
        "Yedek URL güvenli http/https adresi veya güvenli depo yolu olmalıdır.",
      );
    }

    const existingAsset = id ? await findWorkshopAssetById(id) : null;

    if (id && !existingAsset) {
      return createGenericError("Güncellenecek Workshop varlığı bulunamadı.");
    }

    if (!(await productExists(productId))) {
      return createFieldError("productId", "Seçilen ürün kaydı bulunamadı.");
    }

    if (!(await modelExists(modelId))) {
      return createFieldError("modelId", "Seçilen model kaydı bulunamadı.");
    }

    const duplicate = await findDuplicateAsset({
      id: id || undefined,
      productId,
      modelId,
      cameraView,
      zIndexLayer,
    });

    if (duplicate) {
      return createGenericError(
        "Aynı ürün, model, kamera görünümü ve katman sırası için bir Workshop varlığı zaten mevcut.",
      );
    }

    const auditActor = await requireStrictAuditActor();

    if (id && existingAsset) {
      const updatedRows = await db
        .update(visualAssets2d)
        .set({
          productId,
          modelId,
          cameraView,
          zIndexLayer,
          assetUrl,
          fallbackUrl: fallbackUrl || null,
        })
        .where(eq(visualAssets2d.id, id))
        .returning({
          id: visualAssets2d.id,
          productId: visualAssets2d.productId,
          modelId: visualAssets2d.modelId,
          cameraView: visualAssets2d.cameraView,
          zIndexLayer: visualAssets2d.zIndexLayer,
          assetUrl: visualAssets2d.assetUrl,
          fallbackUrl: visualAssets2d.fallbackUrl,
        });

      const updatedAsset = (updatedRows[0] as WorkshopAssetRecord | undefined) ?? null;

      if (!updatedAsset) {
        return createGenericError("Workshop varlığı güncellenemedi.");
      }

      try {
        await writeWorkshopAssetAudit({
          database: db,
          actor: auditActor,
          entityId: updatedAsset.id,
          action: "update",
          previousState: existingAsset,
          newState: updatedAsset,
        });
      } catch (error) {
        logWorkshopAssetActionError("save audit update", id, error);
      return createGenericError(
        "Workshop varlığı güncellendi ancak iz kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
      );
      }
    } else {
      const insertedRows = await db
        .insert(visualAssets2d)
        .values({
          id: uuidv4(),
          productId,
          modelId,
          cameraView,
          zIndexLayer,
          assetUrl,
          fallbackUrl: fallbackUrl || null,
        })
        .returning({
          id: visualAssets2d.id,
          productId: visualAssets2d.productId,
          modelId: visualAssets2d.modelId,
          cameraView: visualAssets2d.cameraView,
          zIndexLayer: visualAssets2d.zIndexLayer,
          assetUrl: visualAssets2d.assetUrl,
          fallbackUrl: visualAssets2d.fallbackUrl,
        });

      const insertedAsset = (insertedRows[0] as WorkshopAssetRecord | undefined) ?? null;

      if (!insertedAsset) {
        return createGenericError("Workshop varlığı oluşturulamadı.");
      }

      try {
        await writeWorkshopAssetAudit({
          database: db,
          actor: auditActor,
          entityId: insertedAsset.id,
          action: "create",
          newState: insertedAsset,
        });
      } catch (error) {
        logWorkshopAssetActionError("save audit create", insertedAsset.id, error);
      return createGenericError(
        "Workshop varlığı oluşturuldu ancak iz kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
      );
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/workshop-assets");

    redirect(
      buildWorkshopAssetsRedirectUrl({
        assetAction: "saved",
        mode: id ? "updated" : "created",
      }),
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      return createGenericError(
        "Oturuma bağlı iz kaydı aktörü çözülemediği için Workshop varlığı güvenli şekilde tamamlanamadı.",
      );
    }

    logWorkshopAssetActionError("save", null, error);
    return createGenericError(getWorkshopAssetFailureMessage(error));
  }
}

export async function deleteWorkshopAsset(formData: FormData) {
  const db = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id || !isUuid(id)) {
    redirect(
      buildWorkshopAssetsRedirectUrl({
        assetAction: "error",
        assetCode: "invalid-id",
      }),
    );
  }

  const existingAsset = await findWorkshopAssetById(id);

  if (!existingAsset) {
    redirect(
      buildWorkshopAssetsRedirectUrl({
        assetAction: "error",
        assetCode: "not-found",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();
    const hotspotUsage = await db
      .select({ id: hotspotMappings.id })
      .from(hotspotMappings)
      .where(eq(hotspotMappings.assetId, id))
      .limit(1);

    if (hotspotUsage.length > 0) {
      redirect(
        buildWorkshopAssetsRedirectUrl({
          assetAction: "error",
          assetCode: "hotspot-in-use",
        }),
      );
    }

    const deletedRows = await db
      .delete(visualAssets2d)
      .where(eq(visualAssets2d.id, id))
      .returning({ id: visualAssets2d.id });

    if (deletedRows.length === 0) {
      redirect(
        buildWorkshopAssetsRedirectUrl({
          assetAction: "error",
          assetCode: "not-found",
        }),
      );
    }

    try {
      await writeWorkshopAssetAudit({
        database: db,
        actor: auditActor,
        entityId: existingAsset.id,
        action: "delete",
        previousState: existingAsset,
      });
    } catch (error) {
      logWorkshopAssetActionError("delete audit", id, error);
      redirect(
        buildWorkshopAssetsRedirectUrl({
          assetAction: "error",
          assetCode: "audit-write-failed",
        }),
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/workshop-assets");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildWorkshopAssetsRedirectUrl({
          assetAction: "error",
          assetCode: "audit-actor-required",
        }),
      );
    }

    logWorkshopAssetActionError("delete", id, error);
    redirect(
      buildWorkshopAssetsRedirectUrl({
        assetAction: "error",
        assetCode: getDeleteCode(error),
      }),
    );
  }

  redirect(
    buildWorkshopAssetsRedirectUrl({
      assetAction: "deleted",
    }),
  );
}
