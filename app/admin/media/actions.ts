"use server";

import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function saveMedia(formData: FormData) {
  const imageUrl = formData.get("imageUrl") as string;
  const fileName = formData.get("fileName") as string;
  const aiTags = formData.get("aiTags") as string;

  const contentJson = {
    url: imageUrl,
    tags: aiTags.split(",").map(t => t.trim()),
    uploadDate: new Date().toISOString(),
  };

  try {
    await db.insert(localizedContent).values({
      id: uuidv4(),
      entityId: uuidv4(), // Benzersiz ID
      entityType: "media",
      locale: "tr",
      title: fileName,
      contentJson
    });
    
    revalidatePath("/admin/media");
  } catch (error) {
    console.error("Medya Kayıt Hatası:", error);
    throw new Error("Görsel mühürlenemedi.");
  }
}

export async function deleteMedia(id: string) {
  try {
    await db.delete(localizedContent).where(eq(localizedContent.id, id));
    revalidatePath("/admin/media");
  } catch (error) {
    throw new Error("Görsel silinemedi.");
  }
}