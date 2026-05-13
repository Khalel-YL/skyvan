"use server";

import { getDbOrThrow } from "@/db/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type LeadStatus = typeof leads.$inferInsert.status;

// Lead tablosundaki durumu güncelleyerek teklifi bir sonraki aşamaya taşır
export async function moveOfferStage(id: string, newStage: string) {
  try {
    const db = getDbOrThrow();

    await db.update(leads).set({
      status: newStage as LeadStatus,
    }).where(eq(leads.id, id));
    
    revalidatePath("/admin/offers");
    revalidatePath("/admin/leads"); // Lead sayfasını da tazeler
  } catch {
    throw new Error("Teklif aşaması güncellenemedi.");
  }
}
