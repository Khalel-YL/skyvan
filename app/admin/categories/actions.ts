"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { categories, products } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import {
  initialCategoryFormState,
  type CategoryFieldName,
  type CategoryFormState,
} from "./types";

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: "draft" | "active" | "archived";
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type SeedCategory = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  legacySlugs: string[];
  legacyNames: string[];
};

type CategorySyncCode =
  | "audit-actor-failed"
  | "duplicate-slug"
  | "sync-failed";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class CategorySyncError extends Error {
  categoryCode: CategorySyncCode;
  dbCode?: string;
  detail?: string;
  constraint?: string;

  constructor(
    categoryCode: CategorySyncCode,
    message: string,
    options?: {
      dbCode?: string;
      detail?: string;
      constraint?: string;
    },
  ) {
    super(message);
    this.name = "CategorySyncError";
    this.categoryCode = categoryCode;
    this.dbCode = options?.dbCode;
    this.detail = options?.detail;
    this.constraint = options?.constraint;
  }
}

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logCategoryActionError(action: string, id: string | null, error: unknown) {
  console.error(`categories/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getCategorySaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Yinelenen kategori kaydı veya benzersiz slug çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "İlişkili kayıt doğrulanamadığı için kategori işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Geçersiz kategori kimliği nedeniyle işlem durduruldu.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle kategori kaydı tamamlanamadı.";
  }

  return "Kategori kaydı işlenirken beklenmeyen bir hata oluştu.";
}

function getCategoryMutationCode(error: unknown, fallback: string) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("invalid input syntax for type uuid")) {
    return "invalid-id";
  }

  if (
    message.includes("violates foreign key constraint") ||
    message.includes("still referenced") ||
    message.includes("restrict")
  ) {
    return "dependency-blocked";
  }

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "duplicate-slug";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  return fallback;
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStatus(value: string): "draft" | "active" | "archived" {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "draft";
}

function parseInteger(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function revalidateCategories() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
}

function buildCategoriesRedirectUrl(
  params: Record<string, string | number | undefined | null>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/categories?${query}` : "/admin/categories";
}

function createFieldError(
  field: CategoryFieldName,
  message: string,
): CategoryFormState {
  return {
    ...initialCategoryFormState,
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
  };
}

function createGenericError(message: string): CategoryFormState {
  return {
    ...initialCategoryFormState,
    status: "error",
    message,
  };
}

const seedCategories: SeedCategory[] = [
  {
    name: "Mutfak",
    slug: "kitchen",
    icon: "chef-hat",
    sortOrder: 10,
    legacySlugs: ["kitchen", "mutfak", "mutfak-donanimi"],
    legacyNames: ["Kitchen", "Mutfak Donanımı"],
  },
  {
    name: "Yatak",
    slug: "bed",
    icon: "bed",
    sortOrder: 20,
    legacySlugs: ["bed", "yatak", "uyku-alani", "sleeping"],
    legacyNames: ["Bed", "Sleeping", "Uyku Alanı"],
  },
  {
    name: "Depolama",
    slug: "storage",
    icon: "archive",
    sortOrder: 30,
    legacySlugs: ["storage", "depolama", "mobilya-depolama", "furniture", "windows"],
    legacyNames: ["Storage", "Furniture", "Mobilya ve Depolama"],
  },
  {
    name: "Oturma",
    slug: "seat",
    icon: "armchair",
    sortOrder: 40,
    legacySlugs: ["seat", "oturma", "oturma-alani", "seating"],
    legacyNames: ["Seat", "Seating", "Oturma Alanı"],
  },
  {
    name: "Masa",
    slug: "table",
    icon: "table",
    sortOrder: 50,
    legacySlugs: ["table", "masa"],
    legacyNames: ["Table"],
  },
  {
    name: "Banyo",
    slug: "bathroom",
    icon: "bath",
    sortOrder: 60,
    legacySlugs: ["bathroom", "banyo", "banyo-wc"],
    legacyNames: ["Bathroom", "Banyo ve WC"],
  },
  {
    name: "Elektrik",
    slug: "electrical",
    icon: "bolt",
    sortOrder: 70,
    legacySlugs: [
      "electrical",
      "elektrik",
      "elektrik-enerji",
      "electric",
      "electrical-mode",
      "electrical-mod",
    ],
    legacyNames: ["Electrical", "Elektrik ve Enerji"],
  },
  {
    name: "Su & Tesisat",
    slug: "plumbing",
    icon: "droplet",
    sortOrder: 80,
    legacySlugs: ["plumbing", "su-sistemi", "water"],
    legacyNames: ["Water", "Su Sistemi"],
  },
  {
    name: "Isıtma & Klima",
    slug: "climate",
    icon: "thermometer",
    sortOrder: 90,
    legacySlugs: [
      "climate",
      "isitma-klima",
      "heating-cooling",
      "pencere-havalandirma",
    ],
    legacyNames: ["Climate", "Isıtma ve Klima", "Isıtma & Klima"],
  },
];

function getCategorySyncErrorDetails(error: unknown) {
  if (error instanceof CategorySyncError) {
    return {
      categoryCode: error.categoryCode,
      dbCode: error.dbCode,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint,
    };
  }

  if (error instanceof AuditActorBindingError) {
    return {
      categoryCode: "audit-actor-failed" as const,
      dbCode: undefined,
      message: error.message,
      detail: undefined,
      constraint: undefined,
    };
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    detail?: unknown;
    constraint?: unknown;
  };

  const dbCode = typeof candidate?.code === "string" ? candidate.code : undefined;
  const message =
    typeof candidate?.message === "string"
      ? candidate.message
      : "Kategori senkronizasyonunda beklenmeyen hata.";
  const detail =
    typeof candidate?.detail === "string" ? candidate.detail : undefined;
  const constraint =
    typeof candidate?.constraint === "string" ? candidate.constraint : undefined;
  const duplicateSlugDetected =
    dbCode === "23505" ||
    constraint?.includes("slug") ||
    message.toLowerCase().includes("duplicate");

  return {
    categoryCode: duplicateSlugDetected
      ? ("duplicate-slug" as const)
      : ("sync-failed" as const),
    dbCode,
    message,
    detail,
    constraint,
  };
}

function logCategorySyncError(error: unknown) {
  const details = getCategorySyncErrorDetails(error);

  console.error("createCategorySeeds error", {
    categoryCode: details.categoryCode,
    dbCode: details.dbCode,
    message: details.message,
    detail: details.detail,
    constraint: details.constraint,
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });

  return details.categoryCode;
}

async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      status: categories.status,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return (rows[0] as CategoryRecord | undefined) ?? null;
}

async function hasCategoryDependencies(id: string) {
  const db = getDbOrThrow();

  const [productRows, childRows] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.categoryId, id))
      .limit(1),
    db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, id))
      .limit(1),
  ]);

  return productRows.length > 0 || childRows.length > 0;
}

async function writeCategoryAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "category",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

export async function saveCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const name = getTrimmed(formData, "name");
  const slug = normalizeSlug(getTrimmed(formData, "slug") || name);
  const icon = getTrimmed(formData, "icon") || "folder";
  const status = normalizeStatus(getTrimmed(formData, "status"));
  const sortOrder = parseInteger(getTrimmed(formData, "sortOrder"));

  if (id && !isUuid(id)) {
    return createGenericError("Geçersiz kategori kimliği nedeniyle işlem durduruldu.");
  }

  const existingCategory = id ? await getCategoryById(id) : null;

  if (!name) {
    return createFieldError("name", "Kategori adı zorunludur.");
  }

  if (!slug) {
    return createFieldError("slug", "Kategori slug değeri zorunludur.");
  }

  if (slug.length < 2) {
    return createFieldError(
      "slug",
      "Kategori slug değeri en az 2 karakter olmalıdır.",
    );
  }

  if (sortOrder === null) {
    return createFieldError("sortOrder", "Sıra sayısal olmalıdır.");
  }

  if (sortOrder < 0) {
    return createFieldError("sortOrder", "Sıra negatif olamaz.");
  }

  if (id && !existingCategory) {
    return createGenericError("Güncellenecek kategori kaydı bulunamadı.");
  }

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing[0] && existing[0].id !== id) {
    return createFieldError("slug", "Bu kategori slug değeri zaten kullanılıyor.");
  }

  try {
    const auditActor = await requireStrictAuditActor();

    if (id && existingCategory) {
      let updatedCategory: CategoryRecord | null = null;

      const updatedRows = await db
        .update(categories)
        .set({
          name,
          slug,
          icon,
          status,
          sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          status: categories.status,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        });

      updatedCategory = (updatedRows[0] as CategoryRecord | undefined) ?? null;

      if (!updatedCategory) {
        return createGenericError("Kategori kaydı işlem sırasında güncellenemedi.");
      }

      try {
        await writeCategoryAudit({
          database: db,
          actor: auditActor,
          entityId: updatedCategory.id,
          action: "update",
          previousState: existingCategory,
          newState: updatedCategory,
        });
      } catch (error) {
        logCategoryActionError("saveCategory audit update", id, error);
        return createGenericError(
          "Kategori kaydı güncellendi ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        );
      }
    } else {
      let insertedCategory: CategoryRecord | null = null;
      const now = new Date();

      const insertedRows = await db
        .insert(categories)
        .values({
          id: uuidv4(),
          name,
          slug,
          icon,
          status,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          status: categories.status,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        });

      insertedCategory = (insertedRows[0] as CategoryRecord | undefined) ?? null;

      if (!insertedCategory) {
        return createGenericError("Kategori kaydı oluşturulamadı.");
      }

      try {
        await writeCategoryAudit({
          database: db,
          actor: auditActor,
          entityId: insertedCategory.id,
          action: "create",
          newState: insertedCategory,
        });
      } catch (error) {
        logCategoryActionError("saveCategory audit create", insertedCategory.id, error);
        return createGenericError(
          "Kategori kaydı oluşturuldu ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        );
      }
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      return createGenericError(
        "Oturum audit kullanıcısı çözülemediği için kategori kaydı güvenli şekilde tamamlanamadı.",
      );
    }

    logCategoryActionError("saveCategory", id || null, error);
    return createGenericError(getCategorySaveFailureMessage(error));
  }

  revalidateCategories();
  redirect(buildCategoriesRedirectUrl({ saved: 1 }));
}

export async function deleteCategory(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId || !isUuid(normalizedId)) {
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode: "invalid-id",
      }),
    );
  }

  const existingCategory = await getCategoryById(normalizedId);

  if (!existingCategory) {
    revalidateCategories();
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode: "missing-category",
      }),
    );
  }

  let auditActor: StrictAuditActor;

  try {
    auditActor = await requireStrictAuditActor();
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      revalidateCategories();
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "delete-failed",
        }),
      );
    }

    throw error;
  }

  let deleteFallbackCode = "delete-failed";

  try {
    let deletedCount = 0;
    const hasDependencies = await hasCategoryDependencies(normalizedId);

    if (!hasDependencies) {
      const deletedRows = await db
        .delete(categories)
        .where(eq(categories.id, normalizedId))
        .returning({
          id: categories.id,
        });

      deletedCount = deletedRows.length;

      if (deletedCount > 0) {
        try {
          await writeCategoryAudit({
            database: db,
            actor: auditActor,
            entityId: existingCategory.id,
            action: "delete",
            previousState: existingCategory,
          });
        } catch (error) {
          logCategoryActionError("deleteCategory audit delete", normalizedId, error);
          redirect(
            buildCategoriesRedirectUrl({
              categoryAction: "error",
              categoryCode: "audit-write-failed",
            }),
          );
        }
      }
    }

    if (!hasDependencies && deletedCount === 0) {
      revalidateCategories();
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "delete-failed",
        }),
      );
    }

    revalidateCategories();
    redirect(buildCategoriesRedirectUrl({ deleted: 1 }));
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    deleteFallbackCode = getCategoryMutationCode(error, "delete-failed");
    logCategoryActionError("deleteCategory hard delete", normalizedId, error);
  }

  try {
    let archivedCategory: CategoryRecord | null = null;

    const archivedRows = await db
      .update(categories)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(categories.id, normalizedId))
      .returning({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        status: categories.status,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    archivedCategory = (archivedRows[0] as CategoryRecord | undefined) ?? null;

    if (!archivedCategory) {
      revalidateCategories();
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "delete-failed",
        }),
      );
    }

    try {
      await writeCategoryAudit({
        database: db,
        actor: auditActor,
        entityId: archivedCategory.id,
        action: "update",
        previousState: existingCategory,
        newState: archivedCategory,
      });
    } catch (error) {
      logCategoryActionError("deleteCategory audit archive", normalizedId, error);
      revalidateCategories();
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "audit-write-failed",
        }),
      );
    }

    if (archivedCategory) {
      revalidateCategories();
      redirect(buildCategoriesRedirectUrl({ archived: 1 }));
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    deleteFallbackCode = getCategoryMutationCode(error, "delete-failed");
    logCategoryActionError("deleteCategory archive fallback", normalizedId, error);
  }

  revalidateCategories();
  redirect(
    buildCategoriesRedirectUrl({
      categoryAction: "error",
      categoryCode: deleteFallbackCode,
    }),
  );
}

export async function createCategorySeeds() {
  const db = getDbOrThrow();

  try {
    const auditActor = await requireStrictAuditActor();
    const insertedRows: CategoryRecord[] = [];
    const updatedRows: CategoryRecord[] = [];

    for (const item of seedCategories) {
      const [existingCategory] = (await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          status: categories.status,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)
        .where(eq(categories.slug, item.slug))
        .limit(1)) as CategoryRecord[];
      const now = new Date();

      const upsertedRows = (await db
        .insert(categories)
        .values({
          id: uuidv4(),
          name: item.name,
          slug: item.slug,
          icon: item.icon,
          status: "active" as const,
          sortOrder: item.sortOrder,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: categories.slug,
          set: {
            name: item.name,
            icon: item.icon,
            status: "active",
            sortOrder: item.sortOrder,
            updatedAt: now,
          },
        })
        .returning({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          status: categories.status,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })) as CategoryRecord[];

      const upsertedCategory = upsertedRows[0];

      if (!upsertedCategory) {
        throw new CategorySyncError(
          "sync-failed",
          `Kategori seed upsert sonucu boş döndü: ${item.slug}`,
        );
      }

      if (existingCategory) {
        updatedRows.push(upsertedCategory);

        await writeCategoryAudit({
          database: db,
          actor: auditActor,
          entityId: upsertedCategory.id,
          action: "update",
          previousState: existingCategory,
          newState: upsertedCategory,
        });
        continue;
      }

      insertedRows.push(upsertedCategory);

      await writeCategoryAudit({
        database: db,
        actor: auditActor,
        entityId: upsertedCategory.id,
        action: "create",
        newState: upsertedCategory,
      });
    }

    revalidateCategories();
    redirect(
      buildCategoriesRedirectUrl({
        seeded: insertedRows.length,
        synced: updatedRows.length,
      }),
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("createCategorySeeds full failure", error);

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "audit-actor-failed",
        }),
      );
    }

    const categoryCode = logCategorySyncError(error);
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode,
      }),
    );
  }
}
