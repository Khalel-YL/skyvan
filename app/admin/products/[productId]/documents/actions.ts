"use server";

import { and, asc, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDbOrThrow } from "@/db/db";
import { categories, productDocuments, products } from "@/db/schema";
import {
  archiveProductDocumentSchema,
  createProductDocumentSchema,
  productDocumentFiltersSchema,
  restoreProductDocumentSchema,
  updateProductDocumentSchema,
} from "./schema";
import {
  buildDocumentDuplicateKey,
  emptyToNull,
  normalizeDocumentUrl,
  stringIntegerToNumber,
} from "./lib";
import type {
  ProductDocumentActionState,
  ProductDocumentFilters,
  ProductDocumentListItem,
  ProductDocumentsPageProduct,
} from "./types";

const uuidSchema = z.string().uuid();

function db() {
  return getDbOrThrow();
}

function isValidUuid(value: string) {
  return uuidSchema.safeParse(value).success;
}

function buildErrorState(
  message: string,
  errors?: Record<string, string[]>
): ProductDocumentActionState {
  return {
    ok: false,
    message,
    errors,
  };
}

function isPgUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

async function getProductBase(productId: string) {
  if (!isValidUuid(productId)) {
    return null;
  }

  const [row] = await db()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      status: products.status,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, productId))
    .limit(1);

  return row ?? null;
}

export async function getProductDocumentsPageProduct(
  productId: string
): Promise<ProductDocumentsPageProduct | null> {
  const row = await getProductBase(productId);

  if (!row) {
    return null;
  }

  return row satisfies ProductDocumentsPageProduct;
}

export async function getProductDocuments(
  productId: string,
  filtersInput?: Partial<ProductDocumentFilters>
): Promise<ProductDocumentListItem[]> {
  if (!isValidUuid(productId)) {
    return [];
  }

  const filters = productDocumentFiltersSchema.parse({
    status: filtersInput?.status ?? "active",
  });

  const whereClauses = [eq(productDocuments.productId, productId)];

  if (filters.status !== "all") {
    whereClauses.push(eq(productDocuments.status, filters.status));
  }

  const rows = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
      type: productDocuments.type,
      title: productDocuments.title,
      url: productDocuments.url,
      note: productDocuments.note,
      sortOrder: productDocuments.sortOrder,
      status: productDocuments.status,
      createdAt: productDocuments.createdAt,
      updatedAt: productDocuments.updatedAt,
    })
    .from(productDocuments)
    .where(and(...whereClauses))
    .orderBy(
      asc(productDocuments.sortOrder),
      desc(productDocuments.updatedAt),
      asc(productDocuments.title)
    );

  return rows as ProductDocumentListItem[];
}

export async function createProductDocument(
  _prevState: ProductDocumentActionState,
  formData: FormData
): Promise<ProductDocumentActionState> {
  const parsed = createProductDocumentSchema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return buildErrorState(
      "Belge oluşturulamadı. Form alanlarını kontrol edin.",
      parsed.error.flatten().fieldErrors
    );
  }

  const data = parsed.data;
  const normalizedUrl = normalizeDocumentUrl(data.url);

  if (!normalizedUrl) {
    return buildErrorState("Belge linki geçersiz.", {
      url: ["Geçerli bir belge linki girin."],
    });
  }

  const product = await getProductBase(data.productId);

  if (!product) {
    return buildErrorState("Belge eklenecek ürün bulunamadı.");
  }

  const [duplicate] = await db()
    .select({
      id: productDocuments.id,
    })
    .from(productDocuments)
    .where(
      and(
        eq(productDocuments.productId, data.productId),
        eq(productDocuments.type, data.type),
        eq(productDocuments.url, normalizedUrl)
      )
    )
    .limit(1);

  if (duplicate) {
    return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
      url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
    });
  }

  try {
    await db().insert(productDocuments).values({
      productId: data.productId,
      type: data.type,
      title: data.title.trim(),
      url: normalizedUrl,
      note: emptyToNull(data.note),
      sortOrder: stringIntegerToNumber(data.sortOrder) ?? 0,
      status: "active",
      updatedAt: new Date(),
    });
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
        url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
      });
    }

    return buildErrorState("Belge kaydı sırasında beklenmeyen bir hata oluştu.");
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${data.productId}/documents`);

  return {
    ok: true,
    message: "Belge başarıyla eklendi.",
  };
}

export async function updateProductDocument(
  _prevState: ProductDocumentActionState,
  formData: FormData
): Promise<ProductDocumentActionState> {
  const parsed = updateProductDocumentSchema.safeParse({
    id: formData.get("id"),
    productId: formData.get("productId"),
    type: formData.get("type"),
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return buildErrorState(
      "Belge güncellenemedi. Form alanlarını kontrol edin.",
      parsed.error.flatten().fieldErrors
    );
  }

  const data = parsed.data;
  const normalizedUrl = normalizeDocumentUrl(data.url);

  if (!normalizedUrl) {
    return buildErrorState("Belge linki geçersiz.", {
      url: ["Geçerli bir belge linki girin."],
    });
  }

  const [current] = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
    })
    .from(productDocuments)
    .where(eq(productDocuments.id, data.id))
    .limit(1);

  if (!current || current.productId !== data.productId) {
    return buildErrorState("Güncellenecek belge bulunamadı.");
  }

  const currentDuplicateKey = buildDocumentDuplicateKey(data.type, normalizedUrl);

  const duplicateRows = await db()
    .select({
      id: productDocuments.id,
      type: productDocuments.type,
      url: productDocuments.url,
    })
    .from(productDocuments)
    .where(
      and(
        eq(productDocuments.productId, data.productId),
        ne(productDocuments.id, data.id)
      )
    );

  const hasDuplicate = duplicateRows.some((row) => {
    const duplicateKey = buildDocumentDuplicateKey(
      row.type as typeof data.type,
      row.url
    );

    return duplicateKey === currentDuplicateKey;
  });

  if (hasDuplicate) {
    return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
      url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
    });
  }

  try {
    await db()
      .update(productDocuments)
      .set({
        type: data.type,
        title: data.title.trim(),
        url: normalizedUrl,
        note: emptyToNull(data.note),
        sortOrder: stringIntegerToNumber(data.sortOrder) ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(productDocuments.id, data.id));
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return buildErrorState("Aynı tipte ve aynı linkte belge zaten mevcut.", {
        url: ["Bu ürün için aynı tipte aynı belge zaten kayıtlı."],
      });
    }

    return buildErrorState(
      "Belge güncellenirken beklenmeyen bir hata oluştu."
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${data.productId}/documents`);

  return {
    ok: true,
    message: "Belge başarıyla güncellendi.",
  };
}

export async function archiveProductDocument(
  documentId: string,
  productId: string
): Promise<ProductDocumentActionState> {
  const parsed = archiveProductDocumentSchema.safeParse({
    id: documentId,
    productId,
  });

  if (!parsed.success) {
    return buildErrorState("Belge arşivleme isteği geçersiz.");
  }

  const [current] = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
      status: productDocuments.status,
    })
    .from(productDocuments)
    .where(eq(productDocuments.id, documentId))
    .limit(1);

  if (!current || current.productId !== productId) {
    return buildErrorState("Arşivlenecek belge bulunamadı.");
  }

  if (current.status === "archived") {
    return {
      ok: true,
      message: "Belge zaten arşivde.",
    };
  }

  await db()
    .update(productDocuments)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(productDocuments.id, documentId));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/documents`);

  return {
    ok: true,
    message: "Belge arşive alındı.",
  };
}

export async function restoreProductDocument(
  documentId: string,
  productId: string
): Promise<ProductDocumentActionState> {
  const parsed = restoreProductDocumentSchema.safeParse({
    id: documentId,
    productId,
  });

  if (!parsed.success) {
    return buildErrorState("Belge geri alma isteği geçersiz.");
  }

  const [current] = await db()
    .select({
      id: productDocuments.id,
      productId: productDocuments.productId,
      status: productDocuments.status,
    })
    .from(productDocuments)
    .where(eq(productDocuments.id, documentId))
    .limit(1);

  if (!current || current.productId !== productId) {
    return buildErrorState("Geri alınacak belge bulunamadı.");
  }

  if (current.status === "active") {
    return {
      ok: true,
      message: "Belge zaten aktif.",
    };
  }

  await db()
    .update(productDocuments)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(productDocuments.id, documentId));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/documents`);

  return {
    ok: true,
    message: "Belge yeniden aktifleştirildi.",
  };
}