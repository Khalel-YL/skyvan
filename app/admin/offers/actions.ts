"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { leads, offers } from "@/db/schema";

type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

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

function parseDateInput(value: string): Date | null {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeAmount(value: string): string | null {
  if (!value) return null;

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed.toFixed(2);
}

export async function saveOffer(
  _prevState: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const leadId = getTrimmed(formData, "leadId");
  const offerReference = getTrimmed(formData, "offerReference");
  const validUntilInput = getTrimmed(formData, "validUntil");
  const totalAmountInput = getTrimmed(formData, "totalAmount");
  const status = normalizeStatus(getTrimmed(formData, "status"));

  const values: OfferFormState["values"] = {
    id,
    leadId,
    offerReference,
    validUntil: validUntilInput,
    totalAmount: totalAmountInput,
    status,
  };

  const errors: NonNullable<OfferFormState["errors"]> = {};

  if (!leadId) {
    errors.leadId = "Lead seçmelisin.";
  }

  if (!offerReference) {
    errors.offerReference = "Teklif referansı zorunludur.";
  }

  const parsedValidUntil = parseDateInput(validUntilInput);
  if (!parsedValidUntil) {
    errors.validUntil = "Geçerli bir tarih gir.";
  }

  const parsedTotalAmount = normalizeAmount(totalAmountInput);
  if (!parsedTotalAmount) {
    errors.totalAmount = "Geçerli bir tutar gir.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values,
      errors,
    };
  }

  const validUntil = parsedValidUntil as Date;
  const totalAmount = parsedTotalAmount as string;

  const leadExists = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (leadExists.length === 0) {
    return {
      ok: false,
      message: "Seçilen lead bulunamadı.",
      values,
      errors: {
        form: "Offer kaydı yalnızca mevcut bir lead kaydına bağlanabilir.",
      },
    };
  }

  try {
    if (id) {
      await db
        .update(offers)
        .set({
          leadId,
          offerReference,
          validUntil,
          totalAmount,
          status,
        })
        .where(eq(offers.id, id));
    } else {
      await db.insert(offers).values({
        leadId,
        offerReference,
        validUntil,
        totalAmount,
        status,
      });
    }

    revalidatePath("/admin/offers");

    return {
      ok: true,
      message: id ? "Teklif güncellendi." : "Teklif oluşturuldu.",
    };
  } catch (error) {
    console.error("saveOffer error:", error);

    return {
      ok: false,
      message: "Teklif kaydı sırasında beklenmeyen bir hata oluştu.",
      values,
      errors: {
        form: "Offer reference benzersiz olmalı ve lead bağı geçerli olmalı.",
      },
    };
  }
}

export async function deleteOffer(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) return;

  await db.delete(offers).where(eq(offers.id, normalizedId));
  revalidatePath("/admin/offers");
}