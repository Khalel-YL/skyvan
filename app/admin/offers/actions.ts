"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { offers } from "@/db/schema";

export type OfferStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

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

export async function saveOffer(formData: FormData) {
  const db = getDbOrThrow();

  const id = String(formData.get("id") ?? "").trim();
  const leadId = String(formData.get("leadId") ?? "").trim();
  const offerReference = String(formData.get("offerReference") ?? "").trim();
  const validUntilRaw = String(formData.get("validUntil") ?? "").trim();
  const totalAmountRaw = String(formData.get("totalAmount") ?? "").trim();

  const status = normalizeStatus(
    String(formData.get("status") ?? "").trim(),
  );

  if (!leadId || !offerReference) {
    throw new Error("Lead ve referans zorunlu");
  }

  const validUntil = validUntilRaw
    ? new Date(validUntilRaw)
    : new Date();

  // 🔥 CRITICAL FIX (string'e çeviriyoruz)
  const totalAmount = totalAmountRaw || "0";

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
}

export async function deleteOffer(id: string) {
  const db = getDbOrThrow();

  await db.delete(offers).where(eq(offers.id, id));
  revalidatePath("/admin/offers");
}