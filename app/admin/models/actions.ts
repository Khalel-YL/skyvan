"use server";

import { db } from "@/db/db";
import { models } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function saveModel(formData: FormData) {
  const id = formData.get("id") as string;
  const slug = formData.get("slug") as string;
  const baseWeightKg = formData.get("baseWeightKg") as string || "0";
  const maxPayloadKg = formData.get("maxPayloadKg") as string || "0";
  const wheelbaseMm = formData.get("wheelbaseMm") as string || "0";
  const roofLengthMm = formData.get("roofLengthMm") as string || "0";
  const roofWidthMm = formData.get("roofWidthMm") as string || "0";
  const status = formData.get("status") as "draft" | "active" | "archived";

  try {
    if (id) {
      // GÜNCELLEME MODU
      await db.update(models).set({
        slug,
        baseWeightKg,
        maxPayloadKg,
        wheelbaseMm: parseInt(wheelbaseMm),
        roofLengthMm: parseInt(roofLengthMm),
        roofWidthMm: parseInt(roofWidthMm),
        status,
        updatedAt: new Date()
      }).where(eq(models.id, id));
    } else {
      // YENİ EKLEME MODU
      await db.insert(models).values({
        id: uuidv4(),
        slug,
        baseWeightKg,
        maxPayloadKg,
        wheelbaseMm: parseInt(wheelbaseMm),
        roofLengthMm: parseInt(roofLengthMm),
        roofWidthMm: parseInt(roofWidthMm),
        status
      });
    }
    revalidatePath("/admin/models");
  } catch (error) {
    console.error("Model Kayıt Hatası:", error);
    throw new Error("Veritabanı reddetti.");
  }
  redirect("/admin/models");
}

export async function deleteModel(id: string) {
  try {
    await db.delete(models).where(eq(models.id, id));
    revalidatePath("/admin/models");
  } catch (error) {
    throw new Error("Model silinemedi. Başka bir tabloya (örn. Paketlere) bağlı olabilir.");
  }
}