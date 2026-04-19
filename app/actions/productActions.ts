"use server";

import { getDbOrThrow } from "../../db/db";
import { products, categories, localizedContent } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  try {
    const database = getDbOrThrow();
    const name = String(formData.get("name") ?? "").trim();
    const sku = String(formData.get("sku") ?? "").trim();
    const weight = parseFloat(formData.get("weight") as string) || 0;
    const price = parseFloat(formData.get("price") as string) || 0;
    const showPrice = formData.get("showPrice") === "on";
    const slug =
      sku
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "urun";

    let categoryId = "";
    const existingCategories = await database.select().from(categories).limit(1);

    if (existingCategories.length > 0) {
      categoryId = existingCategories[0].id;
    } else {
      const [newCat] = await database.insert(categories).values({
        name: "Genel Kategori",
        slug: "genel-kategori",
        status: "active",
        sortOrder: 1,
      }).returning();
      categoryId = newCat.id;
    }

    const [newProduct] = await database.insert(products).values({
      name,
      slug,
      sku,
      categoryId,
      weightKg: weight.toString(),
      basePrice: price.toString(),
      status: "active",
    }).returning();

    await database.insert(localizedContent).values({
      entityType: "product",
      entityId: newProduct.id,
      locale: "tr",
      title: name,
      slug: sku,
      contentJson: { showPrice },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Kayıt Hatası:", error);
    return { success: false, error: "Sunucu hatası oluştu." };
  }
}
