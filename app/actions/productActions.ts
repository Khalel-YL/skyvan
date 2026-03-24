"use server";

import { db } from "../../db/db";
import { products, categories, localizedContent } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const weight = parseFloat(formData.get("weight") as string) || 0;
    const price = parseFloat(formData.get("price") as string) || 0;
    const showPrice = formData.get("showPrice") === "on"; // Yeni fiyat gösterme izni

    let categoryId = "";
    const existingCategories = await db.select().from(categories).limit(1);

    if (existingCategories.length > 0) {
      categoryId = existingCategories[0].id;
    } else {
      const [newCat] = await db.insert(categories).values({
        slug: "genel-kategori",
        sortOrder: 1,
      }).returning();
      categoryId = newCat.id;
    }

    const [newProduct] = await db.insert(products).values({
      sku: sku,
      categoryId: categoryId,
      weightKg: weight.toString(),
      basePrice: price.toString(),
      status: "active",
    }).returning();

    await db.insert(localizedContent).values({
      entityType: "product",
      entityId: newProduct.id,
      locale: "tr",
      title: name,
      slug: sku,
      // FİYAT İZNİNİ JSON OLARAK SAKLIYORUZ
      contentJson: { showPrice: showPrice } 
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Kayıt Hatası:", error);
    return { success: false, error: "Sunucu hatası oluştu." };
  }
}