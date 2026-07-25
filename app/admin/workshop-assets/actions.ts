"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AuditActorBindingError,
  requireStrictAuditActor,
} from "@/app/lib/admin/audit";

import {
  deleteWorkshopAssetInTransaction,
  saveWorkshopAssetInTransaction,
  WorkshopAssetMutationError,
  WorkshopAssetNoopMutation,
} from "./transactions";
import type { WorkshopAssetFormState, WorkshopAssetFormValues } from "./types";
import {
  createGenericError,
  getTrimmed,
  isUuid,
  parseWorkshopAssetFormData,
} from "./validation";

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
  if (error instanceof WorkshopAssetMutationError) {
    return error.code;
  }

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

function getActorFailureState(values?: WorkshopAssetFormValues) {
  return createGenericError(
    "Admin audit oturumu doğrulanamadı. Lütfen tekrar giriş yapıp işlemi yeniden deneyin.",
    values,
  );
}

export async function saveWorkshopAsset(
  _previousState: WorkshopAssetFormState,
  formData: FormData,
): Promise<WorkshopAssetFormState> {
  const parsed = parseWorkshopAssetFormData(formData);
  let redirectUrl: string | null = null;

  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const auditActor = await requireStrictAuditActor();
    const result = await saveWorkshopAssetInTransaction(parsed.input, auditActor);

    revalidatePath("/admin");
    revalidatePath("/admin/workshop-assets");

    redirectUrl = buildWorkshopAssetsRedirectUrl({
      assetAction: "saved",
      mode: result.mode,
    });
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return getActorFailureState(parsed.input.values);
    }

    if (error instanceof WorkshopAssetNoopMutation) {
      return createGenericError(error.message, parsed.input.values);
    }

    if (error instanceof WorkshopAssetMutationError) {
      return createGenericError(
        error.message,
        parsed.input.values,
        error.fieldErrors,
      );
    }

    logWorkshopAssetActionError("save", parsed.input.id, error);
    return createGenericError(
      getWorkshopAssetFailureMessage(error),
      parsed.input.values,
    );
  }

  redirect(redirectUrl ?? "/admin/workshop-assets");
}

export async function deleteWorkshopAsset(formData: FormData) {
  const id = getTrimmed(formData, "id");

  if (!id || !isUuid(id)) {
    redirect(
      buildWorkshopAssetsRedirectUrl({
        assetAction: "error",
        assetCode: "invalid-id",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();

    await deleteWorkshopAssetInTransaction(id, auditActor);

    revalidatePath("/admin");
    revalidatePath("/admin/workshop-assets");
  } catch (error) {
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
