"use server";

import { and, asc, desc, eq, ilike, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDbOrThrow } from "@/db/db";
import { categories, products } from "@/db/schema";

import {
  createProductSchema,
  productFiltersSchema,
  updateProductSchema,
} from "./schema";
import {
  emptyToNull,
  normalizeSku,
  normalizeSlug,
  stringNumberToDbNumeric,
} from "./mappers";
import type {
  CategoryOption,
  ProductActionState,
  ProductFilters,
  ProductListItem,
} from "./types";

function db() {
  return getDbOrThrow();
}

export async function getProductCategories(): Promise<CategoryOption[]> {
  const rows = await db()
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      status: categories.status,
    })
    .from(categories)
    .orderBy(asc(categories.name));

  return rows;
}

export async function getProducts(filtersInput?: Partial<ProductFilters>) {
  const filters = productFiltersSchema.parse({
    q: filtersInput?.q ?? "",
    status: filtersInput?.status ?? "all",
    categoryId: filtersInput?.categoryId ?? "all",
  });

  const whereClauses = [];

  if (filters.q) {
    whereClauses.push(
      or(
        ilike(products.name, `%${filters.q}%`),
        ilike(products.slug, `%${filters.q}%`),
        ilike(products.sku, `%${filters.q}%`),
        ilike(products.shortDescription, `%${filters.q}%`)
      )
    );
  }

  if (filters.status !== "all") {
    whereClauses.push(eq(products.status, filters.status));
  }

  if (filters.categoryId !== "all") {
    whereClauses.push(eq(products.categoryId, filters.categoryId));
  }

  const rows = await db()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      categoryId: products.categoryId,
      categoryName: categories.name,
      shortDescription: products.shortDescription,
      description: products.description,
      imageUrl: products.imageUrl,
      datasheetUrl: products.datasheetUrl,
      basePrice: products.basePrice,
      weightKg: products.weightKg,
      powerDrawWatts: products.powerDrawWatts,
      powerSupplyWatts: products.powerSupplyWatts,
      status: products.status,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClauses.length ? and(...whereClauses) : undefined)
    .orderBy(desc(products.updatedAt), asc(products.name));

  return rows satisfies ProductListItem[];
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    datasheetUrl: formData.get("datasheetUrl"),
    basePrice: formData.get("basePrice"),
    weightKg: formData.get("weightKg"),
    powerDrawWatts: formData.get("powerDrawWatts"),
    powerSupplyWatts: formData.get("powerSupplyWatts"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Form doğrulaması başarısız.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const normalizedSlug = normalizeSlug((data.slug || data.name).trim());
  const normalizedSku = normalizeSku(data.sku.trim());

  const [category] = await db()
    .select({
      id: categories.id,
      status: categories.status,
    })
    .from(categories)
    .where(eq(categories.id, data.categoryId))
    .limit(1);

  if (!category) {
    return {
      ok: false,
      message: "Seçilen kategori bulunamadı.",
    };
  }

  if (category.status !== "active") {
    return {
      ok: false,
      message: "Yalnızca aktif kategoriye ürün eklenebilir.",
    };
  }

  const [slugConflict] = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, normalizedSlug))
    .limit(1);

  if (slugConflict) {
    return {
      ok: false,
      message: "Bu slug zaten kullanılıyor.",
      errors: { slug: ["Bu slug zaten kullanılıyor."] },
    };
  }

  const [skuConflict] = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, normalizedSku))
    .limit(1);

  if (skuConflict) {
    return {
      ok: false,
      message: "Bu SKU zaten kullanılıyor.",
      errors: { sku: ["Bu SKU zaten kullanılıyor."] },
    };
  }

  await db().insert(products).values({
    name: data.name.trim(),
    slug: normalizedSlug,
    sku: normalizedSku,
    categoryId: data.categoryId,
    materialId: null,
    shortDescription: emptyToNull(data.shortDescription),
    description: emptyToNull(data.description),
    imageUrl: emptyToNull(data.imageUrl),
    datasheetUrl: emptyToNull(data.datasheetUrl),
    basePrice: stringNumberToDbNumeric(data.basePrice) ?? "0.00",
    weightKg: stringNumberToDbNumeric(data.weightKg) ?? "0.000",
    powerDrawWatts: stringNumberToDbNumeric(data.powerDrawWatts) ?? "0.00",
    powerSupplyWatts: stringNumberToDbNumeric(data.powerSupplyWatts) ?? "0.00",
    status: data.status,
    updatedAt: new Date(),
  });

  revalidatePath("/admin/products");

  return {
    ok: true,
    message: "Ürün başarıyla oluşturuldu.",
  };
}

export async function updateProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    datasheetUrl: formData.get("datasheetUrl"),
    basePrice: formData.get("basePrice"),
    weightKg: formData.get("weightKg"),
    powerDrawWatts: formData.get("powerDrawWatts"),
    powerSupplyWatts: formData.get("powerSupplyWatts"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Form doğrulaması başarısız.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const normalizedSlug = normalizeSlug((data.slug || data.name).trim());
  const normalizedSku = normalizeSku(data.sku.trim());

  const [current] = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, data.id))
    .limit(1);

  if (!current) {
    return {
      ok: false,
      message: "Güncellenecek ürün bulunamadı.",
    };
  }

  const [category] = await db()
    .select({
      id: categories.id,
      status: categories.status,
    })
    .from(categories)
    .where(eq(categories.id, data.categoryId))
    .limit(1);

  if (!category) {
    return {
      ok: false,
      message: "Seçilen kategori bulunamadı.",
    };
  }

  if (category.status !== "active") {
    return {
      ok: false,
      message: "Ürün yalnızca aktif kategoriye bağlanabilir.",
    };
  }

  const [slugConflict] = await db()
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, normalizedSlug), ne(products.id, data.id)))
    .limit(1);

  if (slugConflict) {
    return {
      ok: false,
      message: "Bu slug başka bir üründe kullanılıyor.",
      errors: { slug: ["Bu slug başka bir üründe kullanılıyor."] },
    };
  }

  const [skuConflict] = await db()
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.sku, normalizedSku), ne(products.id, data.id)))
    .limit(1);

  if (skuConflict) {
    return {
      ok: false,
      message: "Bu SKU başka bir üründe kullanılıyor.",
      errors: { sku: ["Bu SKU başka bir üründe kullanılıyor."] },
    };
  }

  await db()
    .update(products)
    .set({
      name: data.name.trim(),
      slug: normalizedSlug,
      sku: normalizedSku,
      categoryId: data.categoryId,
      shortDescription: emptyToNull(data.shortDescription),
      description: emptyToNull(data.description),
      imageUrl: emptyToNull(data.imageUrl),
      datasheetUrl: emptyToNull(data.datasheetUrl),
      basePrice: stringNumberToDbNumeric(data.basePrice) ?? "0.00",
      weightKg: stringNumberToDbNumeric(data.weightKg) ?? "0.000",
      powerDrawWatts: stringNumberToDbNumeric(data.powerDrawWatts) ?? "0.00",
      powerSupplyWatts: stringNumberToDbNumeric(data.powerSupplyWatts) ?? "0.00",
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(products.id, data.id));

  revalidatePath("/admin/products");

  return {
    ok: true,
    message: "Ürün başarıyla güncellendi.",
  };
}

export async function archiveProduct(productId: string): Promise<ProductActionState> {
  const [current] = await db()
    .select({
      id: products.id,
      status: products.status,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!current) {
    return {
      ok: false,
      message: "Arşivlenecek ürün bulunamadı.",
    };
  }

  if (current.status === "archived") {
    return {
      ok: true,
      message: "Ürün zaten arşivde.",
    };
  }

  await db()
    .update(products)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  revalidatePath("/admin/products");

  return {
    ok: true,
    message: "Ürün arşive alındı.",
  };
}