"use server";

import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export async function saveOffer(formData: FormData) {
  const id = formData.get("id") as string;
  const leadName = formData.get("leadName") as string;
  const caravanModel = formData.get("caravanModel") as string;
  const price = formData.get("price") as string;
  const status = formData.get("status") as string; // pending, negotiating, won

  const contentJson = {
    leadName,
    caravanModel,
    price: Number(price) || 0,
    status: status || "pending",
    updatedAt: new Date().toISOString()
  };

  try {
    if (id && id !== "undefined" && id !== "") {
      await db.update(localizedContent).set({ title: `${leadName} - ${caravanModel}`, contentJson }).where(eq(localizedContent.id, id));
    } else {
      await db.insert(localizedContent).values({
        id: uuidv4(),
        entityId: uuidv4(),
        entityType: "offer",
        locale: "tr",
        title: `${leadName} - ${caravanModel}`,
        contentJson
      });
    }
  } catch (error) {
    console.error("Teklif Kayıt Hatası:", error);
  }

  revalidatePath("/admin/offers");
  redirect("/admin/offers");
}

export async function deleteOffer(id: string) {
  try {
    await db.delete(localizedContent).where(eq(localizedContent.id, id));
    revalidatePath("/admin/offers");
  } catch (error) {
    console.error("Teklif Silme Hatası:", error);
  }
}