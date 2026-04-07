"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";

export type PageFormState = {
  ok: boolean;
  message: string;
  values?: {
    id?: string;
    entityId?: string;
    locale?: string;
    title?: string;
    slug?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    content?: string;
    isPublished?: boolean;
  };
  errors?: {
    locale?: string;
    title?: string;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    content?: string;
    form?: string;
  };
};

type PageBlockType = "hero" | "text" | "feature-list" | "stats" | "cta";

type PageBlock = {
  type: PageBlockType;
  heading?: string;
  subtext?: string;
  body?: string;
  items?: string[];
  stats?: Array<{
    label: string;
    value: string;
  }>;
  ctaLabel?: string;
  ctaHref?: string;
};

type PageContentJson = {
  isPublished: boolean;
  blocks: PageBlock[];
};

const PAGE_ENTITY_TYPE = "page";
const ALLOWED_BLOCK_TYPES = new Set<PageBlockType>([
  "hero",
  "text",
  "feature-list",
  "stats",
  "cta",
]);

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeLocale(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/[^a-z-]/g, "")
    .slice(0, 10);
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

function safeJsonParse(value: string) {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 8);

  return items.length > 0 ? items : undefined;
}

function normalizeStats(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const stats = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const label = String(raw.label ?? "").trim();
      const statValue = String(raw.value ?? "").trim();

      if (!label || !statValue) {
        return null;
      }

      return { label, value: statValue };
    })
    .filter(Boolean)
    .slice(0, 6) as Array<{ label: string; value: string }>;

  return stats.length > 0 ? stats : undefined;
}

function sanitizeBlock(value: unknown): PageBlock | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const rawType = String(raw.type ?? "text").trim().toLowerCase();
  const type = ALLOWED_BLOCK_TYPES.has(rawType as PageBlockType)
    ? (rawType as PageBlockType)
    : "text";

  const block: PageBlock = { type };

  if (isNonEmptyString(raw.heading)) {
    block.heading = raw.heading.trim();
  }

  if (isNonEmptyString(raw.subtext)) {
    block.subtext = raw.subtext.trim();
  }

  if (isNonEmptyString(raw.body)) {
    block.body = raw.body.trim();
  }

  const items = normalizeItems(raw.items);
  if (items) {
    block.items = items;
  }

  const stats = normalizeStats(raw.stats);
  if (stats) {
    block.stats = stats;
  }

  if (isNonEmptyString(raw.ctaLabel)) {
    block.ctaLabel = raw.ctaLabel.trim();
  }

  if (isNonEmptyString(raw.ctaHref)) {
    block.ctaHref = raw.ctaHref.trim();
  }

  return block;
}

function createDefaultBlocks(
  title: string,
  description: string,
  locale: string,
): PageBlock[] {
  const localeLabel = locale.toUpperCase();
  const safeTitle = title || "Yeni sayfa";
  const safeDescription =
    description ||
    "Bu sayfa Skyvan yönetim panelinden yönetilir. İçerik yapısı hero, anlatım, öne çıkanlar ve çağrı bloklarıyla kontrollü şekilde yayınlanır.";

  return [
    {
      type: "hero",
      heading: safeTitle,
      subtext: `Skyvan ${localeLabel} public sayfası`,
      body: safeDescription,
      ctaLabel: "İletişime geç",
      ctaHref: "/",
    },
    {
      type: "text",
      heading: "İçerik özeti",
      body:
        "Bu alan public sayfanın ana anlatım bölümüdür. Marka dili, sayfa amacı ve kullanıcıya verilmek istenen net mesaj burada yer almalıdır.",
    },
    {
      type: "feature-list",
      heading: "Öne çıkanlar",
      items: [
        "Admin panelden yönetilir",
        "Public route üzerinden yayınlanır",
        "SEO alanları ayrı kontrol edilir",
        "Locale varyant akışına uygundur",
      ],
    },
    {
      type: "stats",
      heading: "Hızlı bakış",
      stats: [
        { label: "Yayın tipi", value: "Public page" },
        { label: "İçerik modeli", value: "Block-based" },
        { label: "Locale", value: localeLabel },
      ],
    },
    {
      type: "cta",
      heading: "Sonraki adım",
      body:
        "Bu sayfayı daha güçlü hale getirmek için blok içeriklerini gerçek kullanım metinleriyle doldur ve SEO başlıklarını sayfa amacıyla hizala.",
      ctaLabel: "Ana sayfaya dön",
      ctaHref: "/",
    },
  ];
}

function normalizeContentJson(params: {
  rawValue: string;
  title: string;
  description: string;
  locale: string;
  isPublished: boolean;
}): { contentJson: PageContentJson; error?: string } {
  const parsed = safeJsonParse(params.rawValue);

  if (params.rawValue.trim() && !parsed) {
    return {
      contentJson: {
        isPublished: params.isPublished,
        blocks: createDefaultBlocks(
          params.title,
          params.description,
          params.locale,
        ),
      },
      error: "İçerik JSON alanı geçerli bir JSON değil.",
    };
  }

  const rawObject =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  const rawBlocks = Array.isArray(rawObject.blocks) ? rawObject.blocks : [];
  const blocks = rawBlocks.map(sanitizeBlock).filter(Boolean) as PageBlock[];

  return {
    contentJson: {
      isPublished: params.isPublished,
      blocks:
        blocks.length > 0
          ? blocks
          : createDefaultBlocks(
              params.title,
              params.description,
              params.locale,
            ),
    },
  };
}

async function findPageBySlugAndLocale(params: {
  slug: string;
  locale: string;
  excludeId?: string;
}) {
  const db = getDbOrThrow();

  const whereBase = and(
    eq(localizedContent.entityType, PAGE_ENTITY_TYPE),
    eq(localizedContent.slug, params.slug),
    eq(localizedContent.locale, params.locale),
  );

  const rows = params.excludeId
    ? await db
        .select({ id: localizedContent.id })
        .from(localizedContent)
        .where(and(whereBase, ne(localizedContent.id, params.excludeId)))
        .limit(1)
    : await db
        .select({ id: localizedContent.id })
        .from(localizedContent)
        .where(whereBase)
        .limit(1);

  return rows[0] ?? null;
}

async function findPageById(id: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: localizedContent.id,
      title: localizedContent.title,
      slug: localizedContent.slug,
      locale: localizedContent.locale,
    })
    .from(localizedContent)
    .where(
      and(
        eq(localizedContent.entityType, PAGE_ENTITY_TYPE),
        eq(localizedContent.id, id),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function savePage(
  prevState: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const entityIdInput = getTrimmed(formData, "entityId");
  const locale = normalizeLocale(getTrimmed(formData, "locale") || "tr");
  const title = getTrimmed(formData, "title");
  const slug = normalizeSlug(getTrimmed(formData, "slug"));
  const description = getTrimmed(formData, "description");
  const seoTitle = getTrimmed(formData, "seoTitle");
  const seoDescription = getTrimmed(formData, "seoDescription");
  const content = String(formData.get("content") ?? "");
  const isPublished = formData.get("isPublished") === "on";

  const values = {
    id,
    entityId: entityIdInput,
    locale,
    title,
    slug,
    description,
    seoTitle,
    seoDescription,
    content,
    isPublished,
  };

  const errors: NonNullable<PageFormState["errors"]> = {};

  if (!locale) {
    errors.locale = "Locale zorunludur.";
  }

  if (!title) {
    errors.title = "Başlık zorunludur.";
  }

  if (!slug) {
    errors.slug = "Slug zorunludur.";
  }

  if (seoTitle.length > 90) {
    errors.seoTitle = "SEO başlığı 90 karakteri geçmemelidir.";
  }

  if (seoDescription.length > 170) {
    errors.seoDescription = "SEO açıklaması 170 karakteri geçmemelidir.";
  }

  const normalizedContent = normalizeContentJson({
    rawValue: content,
    title,
    description,
    locale,
    isPublished,
  });

  if (normalizedContent.error) {
    errors.content = normalizedContent.error;
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form alanlarını kontrol et.",
      values,
      errors,
    };
  }

  const existingSlug = await findPageBySlugAndLocale({
    slug,
    locale,
    excludeId: id || undefined,
  });

  if (existingSlug) {
    return {
      ok: false,
      message: "Aynı locale içinde bu slug zaten kullanılıyor.",
      values,
      errors: {
        slug: "Bu locale için slug zaten kullanılıyor.",
      },
    };
  }

  try {
    if (id) {
      await db
        .update(localizedContent)
        .set({
          locale,
          title,
          slug,
          description: description || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          contentJson: normalizedContent.contentJson,
        })
        .where(eq(localizedContent.id, id));
    } else {
      await db.insert(localizedContent).values({
        id: uuidv4(),
        entityType: PAGE_ENTITY_TYPE,
        entityId: entityIdInput || uuidv4(),
        locale,
        title,
        slug,
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        contentJson: normalizedContent.contentJson,
      });
    }

    revalidatePath("/admin/pages");
    revalidatePath(`/pages/${slug}`);
  } catch (error) {
    console.error("savePage error", error);

    return {
      ok: false,
      message: "Sayfa kaydedilemedi.",
      values,
      errors: {
        form: "Beklenmeyen bir kayıt hatası oluştu.",
      },
    };
  }

  return {
    ok: true,
    message: id ? "Sayfa güncellendi." : "Sayfa oluşturuldu.",
    values,
  };
}

export async function deletePage(id: string, _formData: FormData) {
  const db = getDbOrThrow();

  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    throw new Error("Silinecek sayfa kimliği bulunamadı.");
  }

  const page = await findPageById(normalizedId);

  await db.delete(localizedContent).where(eq(localizedContent.id, normalizedId));

  revalidatePath("/admin/pages");

  if (page?.slug) {
    revalidatePath(`/pages/${normalizeSlug(page.slug)}`);
  }
}

export async function repairPageSlug(
  id: string,
  _currentSlug: string | undefined,
  _formData: FormData,
) {
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    throw new Error("Slug onarımı için sayfa kimliği bulunamadı.");
  }

  const page = await findPageById(normalizedId);

  if (!page) {
    throw new Error("Slug onarımı için sayfa bulunamadı.");
  }

  const nextSlug = normalizeSlug(page.title);

  if (!nextSlug) {
    throw new Error("Başlıktan geçerli slug üretilemedi.");
  }

  const collision = await findPageBySlugAndLocale({
    slug: nextSlug,
    locale: page.locale,
    excludeId: page.id,
  });

  if (collision) {
    throw new Error("Üretilen slug aynı locale içinde zaten kullanılıyor.");
  }

  await getDbOrThrow()
    .update(localizedContent)
    .set({
      slug: nextSlug,
    })
    .where(eq(localizedContent.id, page.id));

  revalidatePath("/admin/pages");
  revalidatePath(`/pages/${nextSlug}`);
}