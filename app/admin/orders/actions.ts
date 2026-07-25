"use server";

import { revalidatePath } from "next/cache";
import {
  AuditActorBindingError,
  requireStrictAuditActor,
} from "@/app/lib/admin/audit";

import {
  OrderMutationError,
  OrderNoopMutation,
  saveOrderInTransaction,
  saveProductionUpdateInTransaction,
} from "./transactions";
import {
  parseOrderFormData,
  parseProductionUpdateFormData,
  type OrderFormErrors,
  type OrderFormValues,
  type ProductionUpdateFormErrors,
  type ProductionUpdateFormValues,
} from "./validation";

export type { ProductionStatus } from "./validation";

export type OrderFormState = {
  ok: boolean;
  message: string;
  values?: OrderFormValues;
  errors?: OrderFormErrors;
};

export type ProductionUpdateFormState = {
  ok: boolean;
  message: string;
  values?: ProductionUpdateFormValues;
  errors?: ProductionUpdateFormErrors;
};

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getOrderSaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı bağlantısı nedeniyle sipariş kaydı tamamlanamadı.";
  }

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "VIN veya benzersiz sipariş alanı çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("foreign key")) {
    return "Teklif bağı işlem sırasında değiştiği için sipariş işlemi tamamlanamadı.";
  }

  return "Sipariş kaydı sırasında beklenmeyen bir hata oluştu.";
}

function getProductionUpdateFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı bağlantısı nedeniyle üretim güncellemesi tamamlanamadı.";
  }

  if (message.includes("foreign key")) {
    return "Sipariş bağı işlem sırasında değiştiği için üretim güncellemesi tamamlanamadı.";
  }

  return "Üretim güncellemesi kaydedilemedi.";
}

function logOrderActionError(action: string, id: string | null, error: unknown) {
  console.error(`admin/orders/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: error instanceof Error ? error.name : "Error",
    errorMessage: getSafeErrorMessage(error),
  });
}

export async function saveOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = parseOrderFormData(formData);

  if (!parsed.ok) {
    return {
      ok: false,
      message: parsed.message,
      values: parsed.values,
      errors: parsed.errors,
    };
  }

  try {
    const auditActor = await requireStrictAuditActor();
    const result = await saveOrderInTransaction(parsed.input, auditActor);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${result.id}`);
    revalidatePath("/admin/offers");

    return {
      ok: true,
      message: parsed.input.id ? "Sipariş güncellendi." : "Sipariş oluşturuldu.",
      values: parsed.input.id
        ? result.values
        : {
            id: "",
            offerId: "",
            productionStatus: "pending",
            estimatedDeliveryDate: "",
            vinNumber: "",
          },
      errors: {},
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Sipariş kaydı güvenli şekilde tamamlanamadı.",
        values: parsed.input.values,
        errors: {
          form: "Admin audit oturumu doğrulanamadığı için sipariş işlemi durduruldu.",
        },
      };
    }

    if (error instanceof OrderNoopMutation) {
      return {
        ok: false,
        message: error.message,
        values: parsed.input.values,
        errors: {
          form: "Değişiklik yapılmadığı için audit kaydı üretilmedi.",
        },
      };
    }

    if (error instanceof OrderMutationError) {
      return {
        ok: false,
        message: error.message,
        values: parsed.input.values,
        errors: error.errors,
      };
    }

    logOrderActionError("saveOrder", parsed.input.id || null, error);

    return {
      ok: false,
      message: getOrderSaveFailureMessage(error),
      values: parsed.input.values,
      errors: {
        form: "Kayıt tamamlanamadı. Teklif bağı, VIN benzersizliği, tarih alanı ve audit yazımı tekrar kontrol edilmeli.",
      },
    };
  }
}

export async function saveProductionUpdate(
  _prevState: ProductionUpdateFormState,
  formData: FormData,
): Promise<ProductionUpdateFormState> {
  const parsed = parseProductionUpdateFormData(formData);

  if (!parsed.ok) {
    return {
      ok: false,
      message: parsed.message,
      values: parsed.values,
      errors: parsed.errors,
    };
  }

  try {
    const auditActor = await requireStrictAuditActor();
    const orderId = await saveProductionUpdateInTransaction(parsed.input, auditActor);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return {
      ok: true,
      message: "Üretim güncellemesi eklendi.",
      values: {
        orderId: parsed.input.orderId,
        stage: parsed.input.stage,
        description: "",
        imageUrl: "",
      },
      errors: {},
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Üretim güncellemesi güvenli şekilde tamamlanamadı.",
        values: parsed.input.values,
        errors: {
          form: "Admin audit oturumu doğrulanamadığı için üretim güncellemesi durduruldu.",
        },
      };
    }

    if (error instanceof OrderMutationError) {
      return {
        ok: false,
        message: error.message,
        values: parsed.input.values,
        errors: error.errors,
      };
    }

    logOrderActionError("saveProductionUpdate", parsed.input.orderId, error);

    return {
      ok: false,
      message: getProductionUpdateFailureMessage(error),
      values: parsed.input.values,
      errors: {
        form: "Kayıt tamamlanamadı. Sipariş bağı, üretim aşaması ve audit yazımı tekrar kontrol edilmeli.",
      },
    };
  }
}
