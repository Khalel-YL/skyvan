"use server";

import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function savePage(formData: FormData) {
  const id = formData.get("id") as string;
  const slug = formData.get("slug") as string; // Artık entityId olarak değil, düz slug alıyoruz
  const title = formData.get("title") as string;
  const metaDescription = formData.get("metaDescription") as string;
  const isPublished = formData.get("isPublished") === "on";

  // Slug'ı JSON'ın kalbine mühürlüyoruz (Veritabanı buraya karışamaz)
  const contentJson = {
    slug,
    metaDescription,
    isPublished,
    blocks: [
      { type: "hero", heading: title, subtext: "SkyVan Karavan" }
    ]
  };

  try {
    if (id) {
      await db.update(localizedContent).set({
        title,
        contentJson
      }).where(eq(localizedContent.id, id));
    } else {
      await db.insert(localizedContent).values({
        id: uuidv4(),
        entityId: uuidv4(), // Veritabanı UUID istiyorsa ona sahte bir UUID veriyoruz!
        entityType: "page",
        locale: "tr",
        title,
        contentJson
      });
    }
    revalidatePath("/admin/pages");
  } catch (error: any) {
    console.error("Sayfa Kayıt Hatası:", error);
    // Gerçek hatayı ekrana basıyoruz ki bir daha olursa görelim
    throw new Error(`Kayıt Başarısız: ${error.message}`); 
  }
  redirect("/admin/pages");
}

export async function deletePage(id: string) {
  try {
    await db.delete(localizedContent).where(eq(localizedContent.id, id));
    revalidatePath("/admin/pages");
  } catch (error) {
    throw new Error("Sayfa silinemedi.");
  }
}