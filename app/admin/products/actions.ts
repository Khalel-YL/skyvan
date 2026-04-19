"use server";

import { and, asc, count, desc, eq, ilike, inArray, ne, or, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getAiKnowledgeReadiness } from "@/app/lib/admin/governance";
import { getDbOrThrow } from "@/db/db";
import {
  aiDocumentChunks,
  aiKnowledgeDocuments,
  categories,
  products,
} from "@/db/schema";
import { writeAdminAudit } from "@/app/lib/admin/audit";

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
  ProductStatus,
} from "./types";

function db() {
  return getDbOrThrow();
}

type DatasheetParsingStatus = "pending" | "processing" | "completed" | "failed";

type ProductAuditState = {
  id: string;
  categoryId: string;
  materialId: string | null;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  datasheetUrl: string | null;
  basePrice: string | number | null;
  weightKg: string | number | null;
  powerDrawWatts: string | number | null;
  powerSupplyWatts: string | number | null;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

const productAuditSelection = {
  id: products.id,
  categoryId: products.categoryId,
  materialId: products.materialId,
  name: products.name,
  slug: products.slug,
  sku: products.sku,
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
};

function revalidateProductPaths(productId?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/admin/datasheets");

  if (!productId) {
    return;
  }

  revalidatePath(`/admin/products/${productId}/documents`);
  revalidatePath(`/admin/products/${productId}/sources`);
}

async function getAiReadyKnowledgeProductIds(productIds: string[]) {
  const normalizedProductIds = Array.from(
    new Set(productIds.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );

  if (!normalizedProductIds.length) {
    return new Set<string>();
  }

  const knowledgeRows = await db()
    .select({
      id: aiKnowledgeDocuments.id,
      docType: aiKnowledgeDocuments.docType,
      productId: aiKnowledgeDocuments.productId,
      parsingStatus: aiKnowledgeDocuments.parsingStatus,
      title: aiKnowledgeDocuments.title,
      s3Key: aiKnowledgeDocuments.s3Key,
    })
    .from(aiKnowledgeDocuments)
    .where(inArray(aiKnowledgeDocuments.productId, normalizedProductIds));

  if (!knowledgeRows.length) {
    return new Set<string>();
  }

  const chunkRows = await db()
    .select({
      documentId: aiDocumentChunks.documentId,
      chunkCount: count(),
    })
    .from(aiDocumentChunks)
    .where(
      inArray(
        aiDocumentChunks.documentId,
        knowledgeRows.map((row) => row.id),
      ),
    )
    .groupBy(aiDocumentChunks.documentId);

  const chunkMap = new Map(
    chunkRows.map((row) => [row.documentId, Number(row.chunkCount ?? 0)]),
  );

  const readyProductIds = new Set<string>();

  for (const row of knowledgeRows) {
    if (!row.productId || readyProductIds.has(row.productId)) {
      continue;
    }

    const readiness = getAiKnowledgeReadiness({
      docType: row.docType,
      productId: row.productId,
      parsingStatus: row.parsingStatus as DatasheetParsingStatus,
      title: row.title,
      s3Key: row.s3Key,
      chunkCount: chunkMap.get(row.id) ?? 0,
    });

    if (readiness.approvedForAi) {
      readyProductIds.add(row.productId);
    }
  }

  return readyProductIds;
}

async function hasAiReadyKnowledgeForProduct(productId: string) {
  return (await getAiReadyKnowledgeProductIds([productId])).has(productId);
}

export async function alignLegacyActiveProducts(productIds: string[]) {
  const normalizedProductIds = Array.from(
    new Set(productIds.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );

  if (!normalizedProductIds.length) {
    return new Set<string>();
  }

  const activeRows = await db()
    .select(productAuditSelection)
    .from(products)
    .where(
      and(
        eq(products.status, "active"),
        inArray(products.id, normalizedProductIds),
      ),
    );

  if (!activeRows.length) {
    return new Set<string>();
  }

  const readyProductIds = await getAiReadyKnowledgeProductIds(
    activeRows.map((row) => row.id),
  );

  const misalignedRows = activeRows.filter((row) => !readyProductIds.has(row.id));

  if (!misalignedRows.length) {
    return new Set<string>();
  }

  const updatedRows = await db()
    .update(products)
    .set({
      status: "draft",
      updatedAt: new Date(),
    })
    .where(inArray(products.id, misalignedRows.map((row) => row.id)))
    .returning(productAuditSelection);

  const updatedById = new Map(
    updatedRows.map((row) => [row.id, row as ProductAuditState]),
  );
  const alignedProductIds = new Set<string>();

  for (const previousState of misalignedRows) {
    const nextState = updatedById.get(previousState.id);

    if (!nextState) {
      continue;
    }

    alignedProductIds.add(nextState.id);

    await writeProductAudit({
      entityId: nextState.id,
      action: "update",
      previousState,
      newState: nextState,
    });
  }

  return alignedProductIds;
}

async function getProductActivationError(params: {
  productId?: string;
  previousStatus?: ProductStatus | null;
  nextStatus: ProductStatus;
}) {
  if (params.nextStatus !== "active") {
    return null;
  }

  if (!params.productId) {
    return "Yeni ürün doğrudan aktif açılamaz. Önce ürün kaydını oluşturup AI-ready bilgi hazırlığını tamamlayın.";
  }

  if (params.previousStatus === "active") {
    return null;
  }

  const hasReadyKnowledge = await hasAiReadyKnowledgeForProduct(params.productId);

  if (hasReadyKnowledge) {
    return null;
  }

  return "Ürün aktif statüye alınamaz. Önce ürüne bağlı belgeyi işleyip AI-ready knowledge kaydı oluşturun.";
}

async function getProductAuditStateById(
  productId: string
): Promise<ProductAuditState | null> {
  const [row] = await db()
    .select(productAuditSelection)
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return (row as ProductAuditState | undefined) ?? null;
}

async function writeProductAudit(input: {
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeAdminAudit({
    entityType: "product",
    logLabel: "product",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
  });
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

  const whereClauses: SQL<unknown>[] = [];

  if (filters.q) {
    const searchClause = or(
      ilike(products.name, `%${filters.q}%`),
      ilike(products.slug, `%${filters.q}%`),
      ilike(products.sku, `%${filters.q}%`),
      ilike(products.shortDescription, `%${filters.q}%`)
    );

    if (searchClause) {
      whereClauses.push(searchClause);
    }
  }

  if (filters.status !== "all") {
    whereClauses.push(eq(products.status, filters.status));
  }

  if (filters.categoryId !== "all") {
    whereClauses.push(eq(products.categoryId, filters.categoryId));
  }

  const queryRows = async () =>
    db()
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

  let rows = await queryRows();
  const alignedProductIds = await alignLegacyActiveProducts(
    rows
      .filter((row) => row.status === "active")
      .map((row) => row.id),
  );

  if (alignedProductIds.size > 0) {
    rows = await queryRows();
  }

  return rows.map((row) => ({
    ...row,
    lifecycleNote: alignedProductIds.has(row.id)
      ? "legacy_active_downgraded"
      : null,
  })) satisfies ProductListItem[];
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

  const activationError = await getProductActivationError({
    nextStatus: data.status,
  });

  if (activationError) {
    return {
      ok: false,
      message: activationError,
      errors: { status: [activationError] },
    };
  }

  const createdRows = await db()
    .insert(products)
    .values({
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
    })
    .returning(productAuditSelection);

  const createdProduct = (createdRows[0] as ProductAuditState | undefined) ?? null;

  if (!createdProduct) {
    return {
      ok: false,
      message: "Ürün oluşturulurken beklenmeyen bir hata oluştu.",
    };
  }

  await writeProductAudit({
    entityId: createdProduct.id,
    action: "create",
    newState: createdProduct,
  });

  revalidateProductPaths(createdProduct.id);

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

  const current = await getProductAuditStateById(data.id);

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

  const activationError = await getProductActivationError({
    productId: current.id,
    previousStatus: current.status,
    nextStatus: data.status,
  });

  if (activationError) {
    return {
      ok: false,
      message: activationError,
      errors: { status: [activationError] },
    };
  }

  const updatedRows = await db()
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
    .where(eq(products.id, data.id))
    .returning(productAuditSelection);

  const updatedProduct = (updatedRows[0] as ProductAuditState | undefined) ?? null;

  if (!updatedProduct) {
    return {
      ok: false,
      message: "Ürün güncellenirken beklenmeyen bir hata oluştu.",
    };
  }

  await writeProductAudit({
    entityId: updatedProduct.id,
    action: "update",
    previousState: current,
    newState: updatedProduct,
  });

  revalidateProductPaths(updatedProduct.id);

  return {
    ok: true,
    message: "Ürün başarıyla güncellendi.",
  };
}

export async function archiveProduct(productId: string): Promise<ProductActionState> {
  const current = await getProductAuditStateById(productId);

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

  const archivedRows = await db()
    .update(products)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))
    .returning(productAuditSelection);

  const archivedProduct = (archivedRows[0] as ProductAuditState | undefined) ?? null;

  if (!archivedProduct) {
    return {
      ok: false,
      message: "Ürün arşivlenirken beklenmeyen bir hata oluştu.",
    };
  }

  await writeProductAudit({
    entityId: archivedProduct.id,
    action: "update",
    previousState: current,
    newState: archivedProduct,
  });

  revalidateProductPaths(archivedProduct.id);

  return {
    ok: true,
    message: "Ürün arşive alındı.",
  };
}

export async function restoreProduct(productId: string): Promise<ProductActionState> {
  const current = await getProductAuditStateById(productId);

  if (!current) {
    return {
      ok: false,
      message: "Geri alınacak ürün bulunamadı.",
    };
  }

  if (current.status !== "archived") {
    return {
      ok: true,
      message: "Ürün zaten aktif akışta.",
    };
  }

  const restoredRows = await db()
    .update(products)
    .set({
      status: "draft",
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))
    .returning(productAuditSelection);

  const restoredProduct = (restoredRows[0] as ProductAuditState | undefined) ?? null;

  if (!restoredProduct) {
    return {
      ok: false,
      message: "Ürün geri alınırken beklenmeyen bir hata oluştu.",
    };
  }

  await writeProductAudit({
    entityId: restoredProduct.id,
    action: "update",
    previousState: current,
    newState: restoredProduct,
  });

  revalidateProductPaths(restoredProduct.id);

  return {
    ok: true,
    message: "Ürün taslak duruma geri alındı.",
  };
}
