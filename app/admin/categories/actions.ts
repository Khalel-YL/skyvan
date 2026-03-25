"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { categories } from "@/db/schema";

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

export async function saveCategory(formData: FormData) {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  const id = getTrimmed(formData, "id");
  const name = getTrimmed(formData, "name");
  const slug = normalizeSlug(getTrimmed(formData, "slug") || name);
  const icon = getTrimmed(formData, "icon") || "folder";
  const status = normalizeStatus(getTrimmed(formData, "status"));
  const sortOrder = parseInteger(getTrimmed(formData, "sortOrder"), 0);

  if (!name) {
    throw new Error("Kategori adı zorunludur.");
  }

  if (!slug) {
    throw new Error("Kategori slug değeri zorunludur.");
  }

  if (slug.length < 2) {
    throw new Error("Kategori slug değeri en az 2 karakter olmalıdır.");
  }

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing[0] && existing[0].id !== id) {
    throw new Error("Bu kategori slug değeri zaten kullanılıyor.");
  }

  if (id) {
    await db
      .update(categories)
      .set({
        name,
        slug,
        icon,
        status,
        sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  } else {
    await db.insert(categories).values({
      id: uuidv4(),
      name,
      slug,
      icon,
      status,
      sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidateCategories();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string) {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  if (!id) {
    throw new Error("Geçersiz kategori kimliği.");
  }

  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidateCategories();
    redirect("/admin/categories?deleted=1");
  } catch (error) {
    console.error("Category hard delete failed, archive fallback applied:", error);

    await db
      .update(categories)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));

    revalidateCategories();
    redirect("/admin/categories?archived=1");
  }
}

export async function createCategorySeeds() {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

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