"use server";

import { db } from "@/db/db";
import { products, localizedContent, categories, productSpecs } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// 1. EKLEME MOTORU (CREATE)
// ─────────────────────────────────────────────────────────────
export async function createPermanentProduct(formData: FormData) {
  const title = formData.get("title") as string;
  const sku = formData.get("sku") as string;
  const price = formData.get("price") as string || "0";
  const weight = formData.get("weight") as string || "0";
  const imageUrl = formData.get("imageUrl") as string || "";
  const datasheetUrl = formData.get("datasheetUrl") as string || "";
  const specsData = formData.get("specsData") as string;

  try {
    let defaultCategory = await db.query.categories.findFirst({ where: eq(categories.slug, "genel") });
    if (!defaultCategory) {
      const [newCategory] = await db.insert(categories).values({ slug: "genel", sortOrder: 1 }).returning();
      defaultCategory = newCategory;
    }

    const productId = uuidv4();

    await db.insert(products).values({
      id: productId, categoryId: defaultCategory.id, sku, basePrice: price, weightKg: weight, imageUrl, datasheetUrl, status: "active",
    });

    await db.insert(localizedContent).values({
      id: uuidv4(), entityId: productId, entityType: "product", locale: "tr", title, contentJson: { showPrice: true },
    });

    if (specsData) {
      const parsedSpecs = JSON.parse(specsData);
      const validSpecs = parsedSpecs.filter((s: any) => s.key && s.value);
      if (validSpecs.length > 0) {
        const specInserts = validSpecs.map((s: any) => ({
          id: uuidv4(), productId: productId, specKey: s.key.toUpperCase(), specValue: s.value, unit: s.unit || "",
        }));
        await db.insert(productSpecs).values(specInserts);
      }
    }

    revalidatePath("/workshop"); revalidatePath("/admin/products");
  } catch (error) { throw new Error("Kayıt Hatası"); }
  redirect("/admin/products");
}

// ─────────────────────────────────────────────────────────────
// 2. GÜNCELLEME MOTORU (UPDATE) - YENİ!
// ─────────────────────────────────────────────────────────────
export async function updatePermanentProduct(formData: FormData) {
  const id = formData.get("id") as string; // Güncellenecek ürünün ID'si
  const title = formData.get("title") as string;
  const sku = formData.get("sku") as string;
  const price = formData.get("price") as string || "0";
  const weight = formData.get("weight") as string || "0";
  const imageUrl = formData.get("imageUrl") as string || "";
  const datasheetUrl = formData.get("datasheetUrl") as string || "";
  const specsData = formData.get("specsData") as string;

  try {
    // Ana tabloyu güncelle
    await db.update(products).set({
      sku, basePrice: price, weightKg: weight, imageUrl, datasheetUrl
    }).where(eq(products.id, id));

    // İsmi güncelle
    await db.update(localizedContent).set({ title }).where(eq(localizedContent.entityId, id));

    // Spesifikasyonları güncelle (Önce eskileri sil, sonra yenileri yaz)
    if (specsData) {
      await db.delete(productSpecs).where(eq(productSpecs.productId, id));
      const parsedSpecs = JSON.parse(specsData);
      const validSpecs = parsedSpecs.filter((s: any) => s.key && s.value);
      if (validSpecs.length > 0) {
        const specInserts = validSpecs.map((s: any) => ({
          id: uuidv4(), productId: id, specKey: s.key.toUpperCase(), specValue: s.value, unit: s.unit || "",
        }));
        await db.insert(productSpecs).values(specInserts);
      }
    }

    revalidatePath("/workshop"); revalidatePath("/admin/products");
  } catch (error) { throw new Error("Güncelleme Hatası"); }
  
  // İşlem bitince URL'deki '?edit=' kısmını temizle
  redirect("/admin/products"); 
}

// ─────────────────────────────────────────────────────────────
// 3. SİLME VE GÖRÜNÜRLÜK MOTORLARI (DELETE & TOGGLE)
// ─────────────────────────────────────────────────────────────
export async function deleteProduct(productId: string) {
  try {
    await db.delete(productSpecs).where(eq(productSpecs.productId, productId));
    await db.delete(localizedContent).where(eq(localizedContent.entityId, productId));
    await db.delete(products).where(eq(products.id, productId));
    revalidatePath("/admin/products"); revalidatePath("/workshop");
  } catch (error) { throw new Error("Silme hatası"); }
}

export async function togglePriceVisibility(productId: string, currentStatus: boolean) {
  try {
    const content = await db.query.localizedContent.findFirst({ where: eq(localizedContent.entityId, productId) });
    if (content) {
        const currentJson = (content.contentJson as any) || {};
        await db.update(localizedContent)
          .set({ contentJson: { ...currentJson, showPrice: !currentStatus } })
          .where(eq(localizedContent.entityId, productId));
        revalidatePath("/admin/products"); revalidatePath("/workshop");
    }
  } catch (error) { throw new Error("Ayar hatası"); }
}