"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validate as validateUuid } from "uuid";

import {
  AuditActorBindingError,
  requireStrictAuditActor,
} from "@/app/lib/admin/audit";
import type { OfferStatus } from "@/app/lib/admin/governance";

import {
  deleteOfferInTransaction,
  OfferMutationError,
  OfferNoopMutation,
  saveOfferInTransaction,
} from "./transactions";
import {
  getTodayInput,
  parseOfferFormData,
  type OfferFormErrors,
  type OfferFormValues,
} from "./validation";

export type OfferFormState = {
  ok: boolean;
  message: string;
  values?: OfferFormValues;
  errors?: OfferFormErrors;
};

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logOfferActionError(action: string, id: string | null, error: unknown) {
  console.error(`admin/offers/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getOfferSaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Yinelenen teklif referansı veya benzersiz alan çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("foreign key")) {
    return "Geçersiz lead veya build version bağı nedeniyle teklif işlemi tamamlanamadı.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı bağlantısı nedeniyle teklif kaydı tamamlanamadı.";
  }

  return "Teklif kaydı sırasında beklenmeyen bir hata oluştu.";
}

function buildOffersRedirectUrl(
  params: Record<string, string | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();

  return query ? `/admin/offers?${query}` : "/admin/offers";
}

function getDeleteRedirectCode(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  if (message.includes("order") || message.includes("sipariş")) {
    return "order-dependency-blocked";
  }

  if (message.includes("governance") || message.includes("kritik teklif")) {
    return "critical-delete-blocked";
  }

  return "delete-failed";
}

export async function saveOffer(
  _prevState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const parsed = parseOfferFormData(formData);

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
    const result = await saveOfferInTransaction(parsed.input, auditActor);

    revalidatePath("/admin/offers");
    revalidatePath("/admin/leads");

    return {
      ok: true,
      message: parsed.input.id
        ? "Teklif güncellendi."
        : `${result.offerReference} teklifi oluşturuldu.`,
      values: {
        id: "",
        leadId: "",
        offerReference: "",
        validUntil: getTodayInput(),
        totalAmount: "",
        status: "draft" satisfies OfferStatus,
      },
      errors: {},
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Teklif kaydı güvenli şekilde tamamlanamadı.",
        values: parsed.input.values,
        errors: {
          form: "Admin audit oturumu doğrulanamadığı için teklif işlemi durduruldu.",
        },
      };
    }

    if (error instanceof OfferNoopMutation) {
      return {
        ok: false,
        message: error.message,
        values: parsed.input.values,
        errors: {
          form: "Değişiklik yapılmadığı için audit kaydı üretilmedi.",
        },
      };
    }

    if (error instanceof OfferMutationError) {
      return {
        ok: false,
        message: error.message,
        values: parsed.input.values,
        errors: error.errors,
      };
    }

    logOfferActionError("saveOffer", parsed.input.id || null, error);

    return {
      ok: false,
      message: getOfferSaveFailureMessage(error),
      values: parsed.input.values,
      errors: {
        form: "Kayıt tamamlanamadı. Referans benzersizliği, lead bağı, build version bağı ve audit yazımı tekrar kontrol edilmeli.",
      },
    };
  }
}

export async function deleteOffer(id: string) {
  const normalizedId = String(id ?? "").trim();
  let redirectUrl = buildOffersRedirectUrl({
    offerAction: "deleted",
  });

  if (!normalizedId || !validateUuid(normalizedId)) {
    redirect(
      buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: "invalid-id",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();

    await deleteOfferInTransaction(normalizedId, auditActor);

    revalidatePath("/admin/offers");
    revalidatePath("/admin/leads");
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      redirectUrl = buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: "audit-actor-required",
      });
    } else if (error instanceof OfferMutationError) {
      redirectUrl = buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: getDeleteRedirectCode(error),
        offerMessage: error.errors?.form ?? error.message,
      });
    } else {
      logOfferActionError("deleteOffer", normalizedId, error);
      redirectUrl = buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: getDeleteRedirectCode(error),
      });
    }
  }

  redirect(redirectUrl);
}
