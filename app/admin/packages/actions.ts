"use server";

import { db } from "@/db/db";
import { packages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function savePackage(formData: FormData) {
  const id = formData.get("id") as string;
  const modelId = formData.get("modelId") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const tierLevel = parseInt(formData.get("tierLevel") as string || "0");
  const isDefault = formData.get("isDefault") === "on";

  try {
    if (id) {
      await db.update(packages).set({
        modelId, name, slug, tierLevel, isDefault
      }).where(eq(packages.id, id));
    } else {
      await db.insert(packages).values({
        id: uuidv4(),
        modelId, name, slug, tierLevel, isDefault
      });
    }

    revalidatePath("/admin/packages");
    revalidatePath("/workshop");

  } catch (error) {
    console.error("Paket Kayıt Hatası:", error);
    // Hata fırlatıyoruz ki kullanıcı ekranda görebilsin
    throw new Error("Veritabanı kaydı başarısız.");
  }

  redirect("/admin/packages");
}

export async function deletePackage(id: string) {
  try {
    await db.delete(packages).where(eq(packages.id, id));
    revalidatePath("/admin/packages");
    revalidatePath("/workshop");
  } catch (error) {
    console.error("Silme Hatası:", error);
    throw new Error("Bu paket silinemedi.");
  }
}