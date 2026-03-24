"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { models } from "@/db/schema";

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeStatus(value: string): "draft" | "active" | "archived" {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "draft";
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function requireInteger(
  value: string,
  label: string,
  min: number,
  max: number,
) {
  const parsed = parseInteger(value);

  if (parsed === null) {
    throw new Error(`${label} sayısal olmalıdır.`);
  }

  if (parsed < min || parsed > max) {
    throw new Error(`${label} ${min} ile ${max} arasında olmalıdır.`);
  }

  return parsed;
}

function optionalInteger(value: string, min: number, max: number) {
  if (!value) {
    return null;
  }

  const parsed = parseInteger(value);

  if (parsed === null) {
    throw new Error("Opsiyonel sayısal alanlardan biri hatalı.");
  }

  if (parsed < min || parsed > max) {
    throw new Error(`Opsiyonel alan ${min} ile ${max} arasında olmalıdır.`);
  }

  return parsed;
}

export async function saveModel(formData: FormData) {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  const id = getTrimmed(formData, "id");
  const slug = normalizeSlug(getTrimmed(formData, "slug"));
  const status = normalizeStatus(getTrimmed(formData, "status"));

  if (!slug) {
    throw new Error("Model kodu zorunludur.");
  }

  if (slug.length < 3) {
    throw new Error("Model kodu en az 3 karakter olmalıdır.");
  }

  if (slug.length > 80) {
    throw new Error("Model kodu en fazla 80 karakter olabilir.");
  }

  const baseWeightKg = requireInteger(
    getTrimmed(formData, "baseWeightKg"),
    "Boş ağırlık",
    500,
    10000,
  );

  const maxPayloadKg = requireInteger(
    getTrimmed(formData, "maxPayloadKg"),
    "Maksimum yük",
    100,
    10000,
  );

  const wheelbaseMm = requireInteger(
    getTrimmed(formData, "wheelbaseMm"),
    "Dingil mesafesi",
    1800,
    6000,
  );

  const roofLengthMm = optionalInteger(
    getTrimmed(formData, "roofLengthMm"),
    1000,
    10000,
  );

  const roofWidthMm = optionalInteger(
    getTrimmed(formData, "roofWidthMm"),
    500,
    4000,
  );

  if (maxPayloadKg < 200) {
    throw new Error("Maksimum yük kapasitesi gerçek dönüşüm senaryosu için çok düşük.");
  }

  const existing = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.slug, slug))
    .limit(1);

  if (existing[0] && existing[0].id !== id) {
    throw new Error("Bu model kodu zaten kullanılıyor.");
  }

  if (id) {
    await db
      .update(models)
      .set({
        slug,
        baseWeightKg: String(baseWeightKg),
        maxPayloadKg: String(maxPayloadKg),
        wheelbaseMm,
        roofLengthMm,
        roofWidthMm,
        status,
        updatedAt: new Date(),
      })
      .where(eq(models.id, id));
  } else {
    await db.insert(models).values({
      id: uuidv4(),
      slug,
      baseWeightKg: String(baseWeightKg),
      maxPayloadKg: String(maxPayloadKg),
      wheelbaseMm,
      roofLengthMm,
      roofWidthMm,
      status,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/models");
  redirect("/admin/models?saved=1");
}

export async function deleteModel(id: string) {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  if (!id) {
    throw new Error("Geçersiz model kimliği.");
  }

  await db.delete(models).where(eq(models.id, id));

  revalidatePath("/admin");
  revalidatePath("/admin/models");
  redirect("/admin/models?deleted=1");
}