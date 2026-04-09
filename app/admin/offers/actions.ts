"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { leads, offers } from "@/db/schema";
import {
  getOfferMutationBlocker,
  type OfferStatus,
} from "@/app/lib/admin/governance";
import { writeAuditLog } from "@/app/lib/admin/audit";

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

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
    if (id && existingOffer) {
      await db
        .update(offers)
        .set({
          leadId,
          offerReference,
          validUntil: parsedValidUntil as Date,
          totalAmount: parsedTotalAmount as string,
          status,
        })
        .where(eq(offers.id, id));

      await writeAuditLog({
        entityType: "offer",
        entityId: id,
        action: "update",
        previousState: existingOffer,
        newState: {
          leadId,
          offerReference,
          validUntil: parsedValidUntil,
          totalAmount: parsedTotalAmount,
          status,
        },
      });
    } else {
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

      const insertedId = insertedRows[0]?.id ?? "";

      if (insertedId) {
        await writeAuditLog({
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
        });
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
    console.error("saveOffer error:", error);

    return {
      ok: false,
      message: "Teklif kaydı sırasında beklenmeyen bir hata oluştu.",
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

  if (!normalizedId) {
    return;
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

  await db.delete(offers).where(eq(offers.id, normalizedId));

  if (existingOffer) {
    await writeAuditLog({
      entityType: "offer",
      entityId: existingOffer.id,
      action: "delete",
      previousState: existingOffer,
    });
  }

  revalidatePath("/admin/offers");
  revalidatePath("/admin/leads");
}
