"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { categories } from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  status: "draft" | "active" | "archived";
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeStatus(value: string): "draft" | "active" | "archived" {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "draft";
}

function parseInteger(value: string, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function revalidateCategories() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
}

const seedCategories = [
  { name: "Electrical", slug: "electrical", icon: "bolt", sortOrder: 10 },
  { name: "Water", slug: "water", icon: "droplet", sortOrder: 20 },
  { name: "Furniture", slug: "furniture", icon: "sofa", sortOrder: 30 },
  { name: "Kitchen", slug: "kitchen", icon: "chef-hat", sortOrder: 40 },
  { name: "Bathroom", slug: "bathroom", icon: "bath", sortOrder: 50 },
  { name: "Windows", slug: "windows", icon: "square", sortOrder: 60 },
  { name: "Seating", slug: "seating", icon: "armchair", sortOrder: 70 },
  { name: "Sleeping", slug: "sleeping", icon: "bed", sortOrder: 80 },
];

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

async function writeCategoryAudit(input: {
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: "category",
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("category audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("category audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

export async function saveCategory(formData: FormData) {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const name = getTrimmed(formData, "name");
  const slug = normalizeSlug(getTrimmed(formData, "slug") || name);
  const icon = getTrimmed(formData, "icon") || "folder";
  const status = normalizeStatus(getTrimmed(formData, "status"));
  const sortOrder = parseInteger(getTrimmed(formData, "sortOrder"), 0);
  const existingCategory = id ? await getCategoryById(id) : null;

  if (!name) {
    throw new Error("Kategori adı zorunludur.");
  }

  if (!slug) {
    throw new Error("Kategori slug değeri zorunludur.");
  }

  if (slug.length < 2) {
    throw new Error("Kategori slug değeri en az 2 karakter olmalıdır.");
  }

  if (id && !existingCategory) {
    throw new Error("Güncellenecek kategori kaydı bulunamadı.");
  }

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing[0] && existing[0].id !== id) {
    throw new Error("Bu kategori slug değeri zaten kullanılıyor.");
  }

  if (id && existingCategory) {
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

    const updatedCategory = (updatedRows[0] as CategoryRecord | undefined) ?? null;

    if (!updatedCategory) {
      throw new Error("Kategori kaydı işlem sırasında güncellenemedi.");
    }

    await writeCategoryAudit({
      entityId: updatedCategory.id,
      action: "update",
      previousState: existingCategory,
      newState: updatedCategory,
    });
  } else {
    const insertedRows = await db
      .insert(categories)
      .values({
        id: uuidv4(),
        name,
        slug,
        icon,
        status,
        sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
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

    const insertedCategory = (insertedRows[0] as CategoryRecord | undefined) ?? null;

    if (!insertedCategory) {
      throw new Error("Kategori kaydı oluşturulamadı.");
    }

    await writeCategoryAudit({
      entityId: insertedCategory.id,
      action: "create",
      newState: insertedCategory,
    });
  }

  revalidateCategories();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string) {
  const db = getDbOrThrow();

  if (!id) {
    throw new Error("Geçersiz kategori kimliği.");
  }

  const existingCategory = await getCategoryById(id);

  if (!existingCategory) {
    revalidateCategories();
    redirect("/admin/categories?deleted=1");
  }

  try {
    const deletedRows = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({
        id: categories.id,
      });

    if (deletedRows.length === 0) {
      revalidateCategories();
      redirect("/admin/categories?deleted=1");
    }

    await writeCategoryAudit({
      entityId: existingCategory.id,
      action: "delete",
      previousState: existingCategory,
    });

    revalidateCategories();
    redirect("/admin/categories?deleted=1");
  } catch (error) {
    console.error("Category hard delete failed, archive fallback applied:", error);

    const archivedRows = await db
      .update(categories)
      .set({
        status: "archived",
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

    const archivedCategory = (archivedRows[0] as CategoryRecord | undefined) ?? null;

    if (archivedCategory) {
      await writeCategoryAudit({
        entityId: archivedCategory.id,
        action: "update",
        previousState: existingCategory,
        newState: archivedCategory,
      });

      revalidateCategories();
      redirect("/admin/categories?archived=1");
    }

    revalidateCategories();
    redirect("/admin/categories?deleted=1");
  }
}

export async function createCategorySeeds() {
  const db = getDbOrThrow();

  const existing = await db
    .select({
      slug: categories.slug,
    })
    .from(categories);

  const existingSlugs = new Set(existing.map((item) => item.slug));

  const missing = seedCategories.filter((item) => !existingSlugs.has(item.slug));

  if (missing.length === 0) {
    redirect("/admin/categories?seeded=0");
  }

  const now = new Date();

  await db.insert(categories).values(
    missing.map((item) => ({
      id: uuidv4(),
      name: item.name,
      slug: item.slug,
      icon: item.icon,
      status: "active" as const,
      sortOrder: item.sortOrder,
      createdAt: now,
      updatedAt: now,
    })),
  );

  revalidateCategories();
  redirect(`/admin/categories?seeded=${missing.length}`);
}
