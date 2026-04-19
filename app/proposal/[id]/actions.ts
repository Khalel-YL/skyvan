"use server";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function signCaravanProposal(id: string, finalPrice: number, selectedExtras: string[]) {
  try {
    const db = getDbOrThrow();

    // 1. Veritabanından mevcut teklifi bul
    const offerData = await db.select().from(localizedContent).where(eq(localizedContent.id, id));
    if (!offerData || offerData.length === 0) throw new Error("Teklif bulunamadı");

    const currentContent = offerData[0].contentJson as any;

    // 2. İçeriği güncelle (Artık SIGNED / İmzalandı durumuna geçiyor)
    const updatedContent = {
      ...currentContent,
      status: "SIGNED",
      finalPrice: finalPrice,
      selectedExtras: selectedExtras,
      signedAt: new Date().toISOString(),
    };

    // 3. Veritabanına yeni durumu MÜHÜRLE
    await db.update(localizedContent)
      .set({ contentJson: updatedContent })
      .where(eq(localizedContent.id, id));

    // 4. WhatsApp / SMS Bildirim Sinyali (Buraya ileride Twilio/Netgsm API bağlayacağız)
    // Şu anlık terminale VIP bir mesaj düşürüyoruz!
    console.log(`\n======================================================`);
    console.log(`🚀 YENİ SATIŞ KAPATILDI! (SkyVan OS)`);
    console.log(`👤 Müşteri: ${currentContent.leadName}`);
    console.log(`💰 Toplam Tutar: ₺${finalPrice.toLocaleString()}`);
    console.log(`🛠️ Seçilen Ekstralar: ${selectedExtras.join(", ") || "Yok"}`);
    console.log(`======================================================\n`);

    // 5. Sayfanın önbelleğini temizle ve yeni halini göster
    revalidatePath(`/proposal/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("İmza hatası:", error);
    return { success: false };
  }
}
