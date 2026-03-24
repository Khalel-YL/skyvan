"use server";

import { db } from "@/db/db";
import { aiKnowledgeDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function saveDatasheet(formData: FormData) {
  const id = formData.get("id") as string;
  const productId = formData.get("productId") as string;
  const title = formData.get("title") as string;
  const docType = formData.get("docType") as "datasheet" | "manual" | "rulebook";
  const s3Key = formData.get("s3Key") as string;

  try {
    if (id) {
      await db.update(aiKnowledgeDocuments).set({
        productId: productId || null,
        title,
        docType,
        s3Key,
        updatedAt: new Date()
      }).where(eq(aiKnowledgeDocuments.id, id));
    } else {
      await db.insert(aiKnowledgeDocuments).values({
        id: uuidv4(),
        productId: productId || null,
        title,
        docType,
        s3Key,
        parsingStatus: "pending"
      });
    }
    revalidatePath("/admin/datasheets");
  } catch (error) {
    console.error("Doküman Kayıt Hatası:", error);
    throw new Error("Veritabanı kaydı başarısız.");
  }
  redirect("/admin/datasheets");
}

export async function deleteDatasheet(id: string) {
  try {
    await db.delete(aiKnowledgeDocuments).where(eq(aiKnowledgeDocuments.id, id));
    revalidatePath("/admin/datasheets");
  } catch (error) {
    console.error("Silme Hatası:", error);
    throw new Error("Doküman silinemedi.");
  }
}