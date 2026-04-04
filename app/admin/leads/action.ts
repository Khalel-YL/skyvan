"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { leads } from "@/db/schema";
import type { LeadFormState, LeadStatus } from "./types";

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeOptional(value: string) {
  return value.length > 0 ? value : null;
}

function normalizeLeadStatus(value: string): LeadStatus {
  if (
    value === "new" ||
    value === "contacted" ||
    value === "qualified" ||
    value === "converted" ||
    value === "lost"
  ) {
    return value;
  }

  return "new";
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function saveLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const buildVersionId = getTrimmed(formData, "buildVersionId");
  const fullName = getTrimmed(formData, "fullName");
  const email = getTrimmed(formData, "email");
  const phoneNumber = getTrimmed(formData, "phoneNumber");
  const whatsappOptIn = String(formData.get("whatsappOptIn") ?? "") === "on";
  const status = normalizeLeadStatus(getTrimmed(formData, "status"));

  const values: LeadFormState["values"] = {
    id,
    buildVersionId,
    fullName,
    email,
    phoneNumber,
    whatsappOptIn,
    status,
  };

  const errors: NonNullable<LeadFormState["errors"]> = {};

  if (!buildVersionId) {
    errors.buildVersionId = "Build versiyonu seçmelisin.";
  }

  if (!fullName) {
    errors.fullName = "Ad soyad zorunludur.";
  }

  if (email && !isValidEmail(email)) {
    errors.email = "Geçerli bir e-posta gir.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form eksik veya hatalı.",
      values,
      errors,
    };
  }

  try {
    if (id) {
      await db
        .update(leads)
        .set({
          buildVersionId,
          fullName,
          email: normalizeOptional(email),
          phoneNumber: normalizeOptional(phoneNumber),
          whatsappOptIn,
          status,
        })
        .where(eq(leads.id, id));
    } else {
      await db.insert(leads).values({
        buildVersionId,
        fullName,
        email: normalizeOptional(email),
        phoneNumber: normalizeOptional(phoneNumber),
        whatsappOptIn,
        status,
      });
    }

    revalidatePath("/admin/leads");

    return {
      ok: true,
      message: id ? "Lead güncellendi." : "Lead oluşturuldu.",
    };
  } catch (error) {
    console.error("saveLead error", error);

    return {
      ok: false,
      message: "Lead kaydı sırasında beklenmeyen bir hata oluştu.",
      values,
    };
  }
}

export async function deleteLead(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    return;
  }

  try {
    await db.delete(leads).where(eq(leads.id, normalizedId));
    revalidatePath("/admin/leads");
  } catch (error) {
    console.error("deleteLead error", error);
  }
}