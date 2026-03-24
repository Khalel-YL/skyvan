"use server";

import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function saveBlogPost(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const coverImage = formData.get("coverImage") as string;
  const content = formData.get("content") as string;
  const isPublished = formData.get("isPublished") === "on";

  const contentJson = {
    slug,
    coverImage,
    content,
    isPublished,
    readTime: Math.ceil(content.split(" ").length / 200) || 1,
    publishDate: new Date().toISOString()
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
        entityId: uuidv4(), 
        entityType: "blog",
        locale: "tr",
        title,
        contentJson
      });
    }
  } catch (error: any) {
    throw new Error(`Makale Mühürlenemedi: ${error.message}`);
  }
  
  // Takılmayı çözen kilit nokta: Başarılı olunca ana sayfaya zorla yönlendir
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  try {
    await db.delete(localizedContent).where(eq(localizedContent.id, id));
    revalidatePath("/admin/blog");
  } catch (error) {
    throw new Error("Makale silinemedi.");
  }
}