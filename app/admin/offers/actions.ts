"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { leads, offers } from "@/db/schema";
import {
  getOfferMutationBlocker,
  type OfferStatus,
} from "@/app/lib/admin/governance";
import {
  AuditActorBindingError,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

export type OfferFormState = {
  ok: boolean;
  message: string;
  values?: {
    id?: string;
    leadId?: string;
    offerReference?: string;
    validUntil?: string;
    totalAmount?: string;
    status?: OfferStatus;
  };
  errors?: {
    leadId?: string;
    offerReference?: string;
    validUntil?: string;
    totalAmount?: string;
    form?: string;
  };
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

function logOfferActionError(action: string, id: string | null, error: unknown) {
  console.error(`admin/offers/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function getOfferSaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Yinelenen teklif referansı veya benzersiz alan çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "Geçersiz lead / müşteri kaydı nedeniyle teklif işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Geçersiz teklif kimliği nedeniyle işlem durduruldu.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle teklif kaydı tamamlanamadı.";
  }

  return "Teklif kaydı sırasında beklenmeyen bir hata oluştu.";
}

function getOfferDeleteFailureCode(error: unknown) {
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

function normalizeStatus(value: string): OfferStatus {
  if (
    value === "draft" ||
    value === "sent" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "expired"
  ) {
    return value;
  }

  return "draft";
}

function getTodayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeAmount(value: string): string | null {
  if (!value) return null;

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed.toFixed(2);
}

function isNewFormatOfferReference(value: string) {
  return /^OFF-\d{4}-\d{4,}$/.test(value);
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

async function generateOfferReference() {
  const db = getDbOrThrow();
  const year = new Date().getFullYear();

  const latestRows = await db
    .select({
      offerReference: offers.offerReference,
    })
    .from(offers)
    .orderBy(desc(offers.createdAt))
    .limit(50);

  let maxSequence = 0;

  for (const row of latestRows) {
    const match = row.offerReference.match(/^OFF-(\d{4})-(\d{4,})$/);

    if (!match) continue;
    if (Number(match[1]) !== year) continue;

    const sequence = Number(match[2]);

    if (!Number.isNaN(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return `OFF-${year}-${String(maxSequence + 1).padStart(4, "0")}`;
}

export async function saveOffer(
  _prevState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const leadId = getTrimmed(formData, "leadId");
  const rawOfferReferenceInput = getTrimmed(formData, "offerReference");
  const validUntilInput = getTrimmed(formData, "validUntil") || getTodayInput();
  const totalAmountInput = getTrimmed(formData, "totalAmount");
  const status = normalizeStatus(getTrimmed(formData, "status"));

  if (id && !isUuid(id)) {
    return {
      ok: false,
      message: "Geçersiz teklif kimliği.",
      values: {
        id,
        leadId,
        offerReference: rawOfferReferenceInput,
        validUntil: validUntilInput,
        totalAmount: totalAmountInput,
        status,
      },
      errors: {
        form: "Teklif kimliği UUID formatında olmadığı için işlem durduruldu.",
      },
    };
  }

  if (leadId && !isUuid(leadId)) {
    return {
      ok: false,
      message: "Geçersiz lead / müşteri kaydı.",
      values: {
        id,
        leadId,
        offerReference: rawOfferReferenceInput,
        validUntil: validUntilInput,
        totalAmount: totalAmountInput,
        status,
      },
      errors: {
        leadId: "Lead kimliği geçersiz.",
      },
    };
  }

  const existingOfferRows = id
    ? await db
        .select({
          id: offers.id,
          leadId: offers.leadId,
          offerReference: offers.offerReference,
          validUntil: offers.validUntil,
          totalAmount: offers.totalAmount,
          status: offers.status,
        })
        .from(offers)
        .where(eq(offers.id, id))
        .limit(1)
    : [];

  const existingOffer = existingOfferRows[0] ?? null;

  let offerReference = "";

  if (!rawOfferReferenceInput) {
    offerReference = existingOffer?.offerReference ?? (await generateOfferReference());
  } else if (
    existingOffer &&
    rawOfferReferenceInput.toLowerCase() === existingOffer.offerReference.toLowerCase()
  ) {
    offerReference = existingOffer.offerReference;
  } else {
    offerReference = rawOfferReferenceInput.toUpperCase();
  }

  const values: OfferFormState["values"] = {
    id,
    leadId,
    offerReference,
    validUntil: validUntilInput,
    totalAmount: totalAmountInput,
    status,
  };

  const errors: NonNullable<OfferFormState["errors"]> = {};

  if (id && !existingOffer) {
    return {
      ok: false,
      message: "Güncellenecek teklif kaydı bulunamadı.",
      values,
      errors: {
        form: "Teklif kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
      },
    };
  }

  if (!leadId) {
    errors.leadId = "Lead seçmelisin.";
  }

  if (!offerReference) {
    errors.offerReference = "Teklif referansı zorunludur.";
  } else {
    const isExistingLegacyReference =
      existingOffer !== null && offerReference === existingOffer.offerReference;

    if (!isNewFormatOfferReference(offerReference) && !isExistingLegacyReference) {
      errors.offerReference = "Referans formatı OFF-YYYY-0001 şeklinde olmalıdır.";
    }
  }

  const parsedValidUntil = parseDateInput(validUntilInput);

  if (!parsedValidUntil) {
    errors.validUntil = "Geçerli bir tarih gir.";
  }

  const parsedTotalAmount = normalizeAmount(totalAmountInput);

  if (!parsedTotalAmount) {
    errors.totalAmount = "Geçerli bir tutar gir.";
  }

  const offerStatusBlocker = getOfferMutationBlocker({
    previousStatus: existingOffer?.status ?? null,
    nextStatus: status,
  });

  if (offerStatusBlocker) {
    errors.form = offerStatusBlocker;
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values,
      errors,
    };
  }

  const leadRows = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (leadRows.length === 0) {
    return {
      ok: false,
      message: "Seçilen lead bulunamadı.",
      values,
      errors: {
        form: "Teklif yalnızca mevcut bir lead kaydına bağlanabilir.",
      },
    };
  }

  const conflictingReferenceRows = await db
    .select({ id: offers.id })
    .from(offers)
    .where(eq(offers.offerReference, offerReference))
    .limit(1);

  if (conflictingReferenceRows.length > 0 && conflictingReferenceRows[0].id !== id) {
    return {
      ok: false,
      message: "Teklif referansı zaten kullanımda.",
      values,
      errors: {
        offerReference: "Bu teklif referansı zaten kayıtlı.",
      },
    };
  }

  try {
    const auditActor = await requireStrictAuditActor();

    if (id && existingOffer) {
      let updatedId = "";

      const updatedRows = await db
        .update(offers)
        .set({
          leadId,
          offerReference,
          validUntil: parsedValidUntil as Date,
          totalAmount: parsedTotalAmount as string,
          status,
        })
        .where(eq(offers.id, id))
        .returning({
          id: offers.id,
        });

      updatedId = updatedRows[0]?.id ?? "";

      if (!updatedId) {
        return {
          ok: false,
          message: "Teklif güncellenemedi.",
          values,
          errors: {
            form: "Teklif kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
          },
        };
      }

      try {
        await writeStrictAuditLogInTransaction(db, {
          entityType: "offer",
          entityId: updatedId,
          action: "update",
          previousState: existingOffer,
          newState: {
            leadId,
            offerReference,
            validUntil: parsedValidUntil,
            totalAmount: parsedTotalAmount,
            status,
          },
          actor: auditActor,
        });
      } catch (error) {
        logOfferActionError("saveOffer audit update", id, error);
        return {
          ok: false,
          message: "Audit kaydı yazılamadı.",
          values,
          errors: {
            form: "Teklif güncellendi ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
          },
        };
      }
    } else {
      let insertedId = "";

      const insertedRows = await db
        .insert(offers)
        .values({
          leadId,
          offerReference,
          validUntil: parsedValidUntil as Date,
          totalAmount: parsedTotalAmount as string,
          status,
        })
        .returning({
          id: offers.id,
        });

      insertedId = insertedRows[0]?.id ?? "";

      if (!insertedId) {
        return {
          ok: false,
          message: "Teklif oluşturulamadı.",
          values,
          errors: {
            form: "Teklif kaydı oluşturulurken beklenmeyen bir hata oluştu.",
          },
        };
      }

      try {
        await writeStrictAuditLogInTransaction(db, {
          entityType: "offer",
          entityId: insertedId,
          action: "create",
          newState: {
            leadId,
            offerReference,
            validUntil: parsedValidUntil,
            totalAmount: parsedTotalAmount,
            status,
          },
          actor: auditActor,
        });
      } catch (error) {
        logOfferActionError("saveOffer audit create", insertedId, error);
        return {
          ok: false,
          message: "Audit kaydı yazılamadı.",
          values,
          errors: {
            form: "Teklif oluşturuldu ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
          },
        };
      }
    }

    revalidatePath("/admin/offers");
    revalidatePath("/admin/leads");

    return {
      ok: true,
      message: id ? "Teklif güncellendi." : "Teklif oluşturuldu.",
      values: {
        id: "",
        leadId: "",
        offerReference: "",
        validUntil: getTodayInput(),
        totalAmount: "",
        status: "draft",
      },
      errors: {},
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Teklif kaydı güvenli şekilde tamamlanamadı.",
        values,
        errors: {
          form: "Session-bound audit actor çözülemediği için teklif mutation işlemi fail-closed durduruldu.",
        },
      };
    }

    logOfferActionError("saveOffer", id || null, error);

    return {
      ok: false,
      message: getOfferSaveFailureMessage(error),
      values,
      errors: {
        form: "Kayıt tamamlanamadı. Referans benzersizliği ve lead bağı tekrar kontrol edilmeli.",
      },
    };
  }
}

export async function deleteOffer(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId || !isUuid(normalizedId)) {
    redirect(
      buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: "invalid-id",
      }),
    );
  }

  const existingRows = await db
    .select({
      id: offers.id,
      leadId: offers.leadId,
      offerReference: offers.offerReference,
      validUntil: offers.validUntil,
      totalAmount: offers.totalAmount,
      status: offers.status,
    })
    .from(offers)
    .where(eq(offers.id, normalizedId))
    .limit(1);

  const existingOffer = existingRows[0] ?? null;

  if (!existingOffer) {
    redirect(
      buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: "missing-offer",
      }),
    );
  }

  const deleteBlocker = getOfferMutationBlocker({
    previousStatus: existingOffer.status,
    nextStatus: "draft",
  });

  if (deleteBlocker) {
    redirect(
      buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: "critical-delete-blocked",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();
    let deletedCount = 0;

    const deletedRows = await db
      .delete(offers)
      .where(eq(offers.id, normalizedId))
      .returning({
        id: offers.id,
      });

    deletedCount = deletedRows.length;

    if (deletedCount === 0) {
      redirect(
        buildOffersRedirectUrl({
          offerAction: "error",
          offerCode: "delete-failed",
        }),
      );
    }

    try {
      await writeStrictAuditLogInTransaction(db, {
        entityType: "offer",
        entityId: existingOffer.id,
        action: "delete",
        previousState: existingOffer,
        actor: auditActor,
      });
    } catch (error) {
      logOfferActionError("deleteOffer audit", normalizedId, error);
      redirect(
        buildOffersRedirectUrl({
          offerAction: "error",
          offerCode: "audit-write-failed",
        }),
      );
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildOffersRedirectUrl({
          offerAction: "error",
          offerCode: "audit-actor-required",
        }),
      );
    }

    logOfferActionError("deleteOffer", normalizedId, error);

    redirect(
      buildOffersRedirectUrl({
        offerAction: "error",
        offerCode: getOfferDeleteFailureCode(error),
      }),
    );
  }

  revalidatePath("/admin/offers");
  revalidatePath("/admin/leads");
  redirect(
    buildOffersRedirectUrl({
      offerAction: "deleted",
    }),
  );
}
