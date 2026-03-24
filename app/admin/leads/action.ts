"use server";

import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function saveLead(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const budget = formData.get("budget") as string;
  const notes = formData.get("notes") as string;

  const contentJson = {
    phone,
    notes,
    budget: Number(budget) || 0,
    status: "hot",
    updatedAt: new Date().toISOString()
  };

  try {
    if (id && id !== "undefined" && id !== "") {
      await db.update(localizedContent).set({ title: name, contentJson }).where(eq(localizedContent.id, id));
    } else {
      await db.insert(localizedContent).values({
        id: uuidv4(),
        entityId: uuidv4(),
        entityType: "lead",
        locale: "tr",
        title: name,
        contentJson
      });
    }
  } catch (error) {
    console.error("Lead Kayıt Hatası:", error);
  }

  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}

export async function deleteLead(id: string) {
  try {
    await db.delete(localizedContent).where(eq(localizedContent.id, id));
    revalidatePath("/admin/leads");
  } catch (error) {
    console.error("Lead Silme Hatası:", error);
  }
}