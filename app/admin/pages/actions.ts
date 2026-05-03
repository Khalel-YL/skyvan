"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
  writeStrictPublishRevisionInTransaction,
} from "@/app/lib/admin/audit";
import {
  getPagePublishBlockers,
  getPagePublishTransition,
} from "@/app/lib/admin/governance";

import {
  type PageContentBlock,
  validatePageBlocks,
} from "./_lib/page-blocks";

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
  content?: string;
  items?: string[];
  stats?: Array<{
    label: string;
    value: string;
  }>;
  ctaLabel?: string;
  ctaHref?: string;
  media?: {
    mediaId: string;
    mediaType: "image" | "video" | "model3d";
    title: string;
    url: string;
    previewUrl?: string;
    embedUrl?: string;
    provider?: "direct" | "youtube" | "vimeo" | "external";
    altText?: string;
  };
};

type PageContentJson = {
  isPublished: boolean;
  blocks: PageBlock[];
};

type PageRecord = {
  id: string;
  entityId: string;
  title: string;
  slug: string | null;
  locale: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  contentJson: unknown;
};

type PageSubmitIntent = "draft" | "publish" | "keep-published" | "unpublish";

const PAGE_ENTITY_TYPE = "page";

const ALLOWED_BLOCK_TYPES = new Set<PageBlockType>([
  "hero",
  "text",
  "feature-list",
  "stats",
  "cta",
]);
const ALLOWED_MEDIA_TYPES = new Set(["image", "video", "model3d"]);
const ALLOWED_MEDIA_PROVIDERS = new Set(["direct", "youtube", "vimeo", "external"]);

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSubmitIntent(formData: FormData) {
  const intents = formData
    .getAll("submitIntent")
    .map((value) => String(value ?? "").trim());

  if (intents.includes("publish")) {
    return "publish";
  }

  if (intents.includes("unpublish")) {
    return "unpublish";
  }

  if (intents.includes("keep-published")) {
    return "keep-published";
  }

  return "draft";
}

function getNextPublishState(params: {
  submitIntent: PageSubmitIntent;
  previousIsPublished: boolean;
}) {
  if (params.submitIntent === "publish") {
    return true;
  }

  if (params.submitIntent === "unpublish") {
    return false;
  }

  if (params.submitIntent === "keep-published") {
    return params.previousIsPublished;
  }

  return params.previousIsPublished ? true : false;
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error);

  if (message.includes("No transactions support in neon-http driver")) {
    return "Veritabanı sürücüsü transaction wrapper desteklemediği için kayıt tamamlanamadı. Pages write path Neon HTTP uyumlu çalışmalıdır.";
  }

  if (message.toLowerCase().includes("duplicate key")) {
    return "Bu kayıt veritabanında benzersiz bir alanla çakışıyor. Slug, locale veya sayfa varyantını kontrol et.";
  }

  if (message.toLowerCase().includes("database_url")) {
    return "Veritabanı bağlantısı yapılandırılamadığı için kayıt yapılamadı.";
  }

  if (message.toLowerCase().includes("invalid input syntax for type uuid")) {
    return "Kayıt kimliği UUID formatında olmadığı için veritabanı yazımı durduruldu.";
  }

  if (message.toLowerCase().includes("violates foreign key constraint")) {
    return "Audit veya içerik kaydı ilişkili kullanıcı/veri kaydıyla eşleşmediği için yazım durduruldu.";
  }

  if (message.toLowerCase().includes("violates not-null constraint")) {
    return "Zorunlu bir veritabanı alanı boş kaldığı için kayıt yapılamadı.";
  }

  if (message.toLowerCase().includes("fetch failed")) {
    return "Veritabanı bağlantısına ulaşılamadığı için kayıt tamamlanamadı.";
  }

  return "Beklenmeyen bir kayıt hatası oluştu. Sunucu loglarında güvenli tanı bilgisi üretildi.";
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

function sanitizeMedia(value: unknown): PageBlock["media"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const mediaId = String(raw.mediaId ?? "").trim();
  const mediaType = String(raw.mediaType ?? "").trim().toLowerCase();
  const title = String(raw.title ?? "").trim();
  const url = String(raw.url ?? "").trim();

  if (
    !isUuid(mediaId) ||
    !ALLOWED_MEDIA_TYPES.has(mediaType) ||
    !title ||
    !isSafeHttpUrl(url)
  ) {
    return undefined;
  }

  const previewUrl = String(raw.previewUrl ?? "").trim();
  const embedUrl = String(raw.embedUrl ?? "").trim();
  const provider = String(raw.provider ?? "").trim().toLowerCase();
  const altText = String(raw.altText ?? "").trim();

  return {
    mediaId,
    mediaType: mediaType as "image" | "video" | "model3d",
    title,
    url,
    previewUrl: previewUrl && isSafeHttpUrl(previewUrl) ? previewUrl : undefined,
    embedUrl: embedUrl && isSafeHttpUrl(embedUrl) ? embedUrl : undefined,
    provider: ALLOWED_MEDIA_PROVIDERS.has(provider)
      ? (provider as "direct" | "youtube" | "vimeo" | "external")
      : undefined,
    altText: altText || undefined,
  };
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

  if (isNonEmptyString(raw.content)) {
    block.content = raw.content.trim();
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

  const media = sanitizeMedia(raw.media);
  if (media) {
    block.media = media;
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
    "Bu sayfa Skyvan yönetim panelinden yönetilir.\nİçerik yapısı hero, anlatım, öne çıkanlar ve çağrı bloklarıyla kontrollü şekilde yayınlanır.";

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
        "Bu alan public sayfanın ana anlatım bölümüdür.\n" +
        "Marka dili, sayfa amacı ve kullanıcıya verilmek istenen net mesaj burada yer almalıdır.",
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
}): { contentJson: PageContentJson; hasUserBlocks: boolean; error?: string } {
  const parsed = safeJsonParse(params.rawValue);

  if (params.rawValue.trim() && !parsed) {
    return {
      contentJson: {
        isPublished: params.isPublished,
        blocks: createDefaultBlocks(params.title, params.description, params.locale),
      },
      hasUserBlocks: false,
      error: "İçerik JSON alanı geçerli bir JSON değil.",
    };
  }

  const rawObject =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  const rawBlocks = Array.isArray(rawObject.blocks) ? rawObject.blocks : [];
  const blocks = rawBlocks.map(sanitizeBlock).filter(Boolean) as PageBlock[];
  const hasUserBlocks = blocks.length > 0;

  return {
    contentJson: {
      isPublished: params.isPublished,
      blocks,
    },
    hasUserBlocks,
  };
}

function isPagePublishedContent(value: unknown) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { isPublished?: boolean }).isPublished === true,
  );
}

function buildPageRevisionName(params: {
  title: string;
  slug: string;
  locale: string;
  transition: "publish" | "rollback";
}) {
  const baseName = normalizeSlug(params.title) || normalizeSlug(params.slug) || "page";
  return `${baseName}:${params.locale}:${params.transition}:${new Date().toISOString()}`;
}

function revalidatePagePath(slug: string | null | undefined) {
  const normalizedSlug = normalizeSlug(String(slug ?? ""));

  if (!normalizedSlug) {
    return;
  }

  revalidatePath(`/pages/${normalizedSlug}`);
}

function revalidateLocalizedPagePaths(locale: string, slug: string | null | undefined) {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedSlug = normalizeSlug(String(slug ?? ""));

  revalidatePath("/tr");
  revalidatePath("/en");

  if (normalizedLocale && normalizedSlug) {
    revalidatePath(`/${normalizedLocale}/${normalizedSlug}`);
  }
}

function buildPageAuditState(
  page: PageRecord,
  meta?: {
    publishTransition?: "publish" | "rollback" | null;
    revisionName?: string | null;
  },
) {
  return {
    ...page,
    __meta: {
      publishState: isPagePublishedContent(page.contentJson) ? "published" : "draft",
      ...(meta?.publishTransition ? { publishTransition: meta.publishTransition } : {}),
      ...(meta?.revisionName ? { revisionName: meta.revisionName } : {}),
    },
  };
}

function buildPagesRedirectUrl(
  params: Record<string, string | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();

  return query ? `/admin/pages?${query}` : "/admin/pages";
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

async function findPageById(id: string): Promise<PageRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: localizedContent.id,
      entityId: localizedContent.entityId,
      title: localizedContent.title,
      slug: localizedContent.slug,
      locale: localizedContent.locale,
      description: localizedContent.description,
      seoTitle: localizedContent.seoTitle,
      seoDescription: localizedContent.seoDescription,
      contentJson: localizedContent.contentJson,
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

async function writePageAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "page",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

async function writePageRevision(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  revisionName: string;
  status: "published" | "rolled_back";
}) {
  await writeStrictPublishRevisionInTransaction(input.database, {
    revisionName: input.revisionName,
    status: input.status,
    actor: input.actor,
  });
}

export async function savePage(
  _prevState: PageFormState,
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
  const submitIntent = getSubmitIntent(formData);
  const hasValidId = !id || isUuid(id);
  const previousPage = id && hasValidId ? await findPageById(id) : null;
  const previousIsPublished = isPagePublishedContent(previousPage?.contentJson);
  const isPublished = getNextPublishState({
    submitIntent,
    previousIsPublished,
  });

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

  if (id && hasValidId && !previousPage) {
    return {
      ok: false,
      message: "Güncellenecek page kaydı bulunamadı.",
      values,
      errors: {
        form: "Page kaydı artık mevcut değil. Listeyi yenileyip tekrar dene.",
      },
    };
  }

  if (id && !isUuid(id)) {
    errors.form = "Güncellenecek page ID değeri UUID formatında değil.";
  }

  if (entityIdInput && !isUuid(entityIdInput)) {
    errors.form = "Page entity ID değeri UUID formatında değil.";
  }

  if (!locale) {
    errors.locale = "Locale zorunludur.";
  }

  if (!title) {
    errors.title = "Başlık zorunludur.";
  }

  if (isPublished && !slug) {
    errors.slug = "Publish için slug zorunludur.";
  }

  if (isPublished && seoTitle.length > 90) {
    errors.seoTitle = "SEO başlığı 90 karakteri geçmemelidir.";
  }

  if (isPublished && seoDescription.length > 170) {
    errors.seoDescription = "SEO açıklaması 170 karakteri geçmemelidir.";
  }

  const normalizedContent = normalizeContentJson({
    rawValue: content,
    title,
    description,
    locale,
    isPublished,
  });
  normalizedContent.contentJson.isPublished = isPublished;

  if (normalizedContent.error) {
    errors.content = normalizedContent.error;
  }

  if (!isPublished && !normalizedContent.hasUserBlocks) {
    errors.content = "Taslak kaydetmek için en az bir içerik bloğu ekle.";
  }

  if (isPublished) {
    const structuredValidation = validatePageBlocks({
      title,
      slug,
      seoTitle,
      seoDescription,
      blocks: normalizedContent.contentJson.blocks as PageContentBlock[],
    });
    const publishBlockers = getPagePublishBlockers({
      title,
      slug,
      seoTitle,
      seoDescription,
      hasBlocks: normalizedContent.hasUserBlocks,
      isPublished: true,
    });
    const blockBlockers = structuredValidation.blockers.filter(
      (blocker) =>
        blocker.includes("#") || blocker.includes("content block"),
    );
    const blockers = [...publishBlockers, ...blockBlockers];

    if (blockers.length > 0) {
      return {
        ok: false,
        message: "Publish blocker nedeniyle sayfa kaydedilemedi.",
        values,
        errors: {
          ...errors,
          form: blockers.join(" "),
        },
      };
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form alanlarını kontrol et.",
      values,
      errors,
    };
  }

  const existingSlug = slug
    ? await findPageBySlugAndLocale({
        slug,
        locale,
        excludeId: id || undefined,
      })
    : null;

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
    const auditActor = await requireStrictAuditActor();
    const previousSlug = previousPage?.slug ?? "";

    if (id && previousPage) {
      let updatedPage: PageRecord | null = null;
      let updatedPageSlug: string | null = null;
      let publishTransition: "publish" | "rollback" | null = null;
      let revisionName: string | null = null;

      const updatedRows = await db
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
        .where(
          and(
            eq(localizedContent.entityType, PAGE_ENTITY_TYPE),
            eq(localizedContent.id, id),
          ),
        )
        .returning({
          id: localizedContent.id,
          entityId: localizedContent.entityId,
          title: localizedContent.title,
          slug: localizedContent.slug,
          locale: localizedContent.locale,
          description: localizedContent.description,
          seoTitle: localizedContent.seoTitle,
          seoDescription: localizedContent.seoDescription,
          contentJson: localizedContent.contentJson,
        });

      updatedPage = updatedRows[0] ?? null;

      if (updatedPage) {
        const nextUpdatedPage = updatedPage;
        updatedPageSlug = nextUpdatedPage.slug;
        const nextIsPublished = isPagePublishedContent(nextUpdatedPage.contentJson);
        publishTransition = getPagePublishTransition({
          previousIsPublished,
          nextIsPublished,
        });
        revisionName = publishTransition
          ? buildPageRevisionName({
              title: nextUpdatedPage.title,
              slug: nextUpdatedPage.slug ?? slug,
              locale: nextUpdatedPage.locale,
              transition: publishTransition,
            })
          : null;

        await writePageAudit({
          database: db,
          actor: auditActor,
          entityId: nextUpdatedPage.id,
          action: "update",
          previousState: buildPageAuditState(previousPage),
          newState: buildPageAuditState(nextUpdatedPage, {
            publishTransition,
            revisionName,
          }),
        });

        if (publishTransition && revisionName) {
          await writePageRevision({
            database: db,
            actor: auditActor,
            revisionName,
            status: publishTransition === "publish" ? "published" : "rolled_back",
          });
        }
      }

      if (!updatedPage) {
        return {
          ok: false,
          message: "Sayfa güncellenemedi.",
          values,
          errors: {
            form: "Page kaydı işlem sırasında bulunamadı. Listeyi yenileyip tekrar dene.",
          },
        };
      }

      revalidatePath("/admin/pages");
      revalidatePagePath(updatedPageSlug);
      revalidateLocalizedPagePaths(locale, updatedPageSlug);

      if (
        previousSlug &&
        normalizeSlug(previousSlug) !== normalizeSlug(updatedPageSlug ?? "")
      ) {
        revalidatePagePath(previousSlug);
        revalidateLocalizedPagePaths(previousPage.locale, previousSlug);
      }
    } else {
      let insertedPage: PageRecord | null = null;
      let insertedPageSlug: string | null = null;
      let publishTransition: "publish" | "rollback" | null = null;
      let revisionName: string | null = null;

      const insertedRows = await db
        .insert(localizedContent)
        .values({
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
        })
        .returning({
          id: localizedContent.id,
          entityId: localizedContent.entityId,
          title: localizedContent.title,
          slug: localizedContent.slug,
          locale: localizedContent.locale,
          description: localizedContent.description,
          seoTitle: localizedContent.seoTitle,
          seoDescription: localizedContent.seoDescription,
          contentJson: localizedContent.contentJson,
        });

      insertedPage = insertedRows[0] ?? null;

      if (insertedPage) {
        const nextInsertedPage = insertedPage;
        insertedPageSlug = nextInsertedPage.slug;
        publishTransition = getPagePublishTransition({
          previousIsPublished: false,
          nextIsPublished: isPagePublishedContent(nextInsertedPage.contentJson),
        });
        revisionName = publishTransition
          ? buildPageRevisionName({
              title: nextInsertedPage.title,
              slug: nextInsertedPage.slug ?? slug,
              locale: nextInsertedPage.locale,
              transition: publishTransition,
            })
          : null;

        await writePageAudit({
          database: db,
          actor: auditActor,
          entityId: nextInsertedPage.id,
          action: "create",
          newState: buildPageAuditState(nextInsertedPage, {
            publishTransition,
            revisionName,
          }),
        });

        if (publishTransition && revisionName) {
          await writePageRevision({
            database: db,
            actor: auditActor,
            revisionName,
            status: "published",
          });
        }
      }

      if (!insertedPage) {
        return {
          ok: false,
          message: "Sayfa oluşturulamadı.",
          values,
          errors: {
            form: "Page kaydı oluşturulurken beklenmeyen bir hata oluştu.",
          },
        };
      }

      revalidatePath("/admin/pages");
      revalidatePagePath(insertedPageSlug);
      revalidateLocalizedPagePaths(locale, insertedPageSlug);
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Sayfa kaydedilemedi.",
        values,
        errors: {
          form: "Session-bound audit actor çözülemediği için page kaydı güvenli şekilde tamamlanamadı.",
        },
      };
    }

    console.error("savePage error", {
      operation: id ? "update" : "create",
      submitIntent,
      locale,
      slug,
      hasContent: content.trim().length > 0,
      blockCount: normalizedContent.contentJson.blocks.length,
      errorName: getSafeErrorName(error),
      errorMessage: getSafeErrorMessage(error),
    });

    return {
      ok: false,
      message: "Sayfa kaydedilemedi.",
      values,
      errors: {
        form: getSaveFailureMessage(error),
      },
    };
  }

  return {
    ok: true,
    message: id
      ? isPublished
        ? submitIntent === "keep-published"
          ? "Yayındaki sayfa güncellendi."
          : "Sayfa yayınlandı."
        : "Sayfa taslak olarak güncellendi."
      : isPublished
        ? "Sayfa oluşturuldu ve yayınlandı."
        : "Sayfa taslak olarak oluşturuldu.",
    values,
  };
}

export async function deletePage(id: string, formData: FormData) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();
  void formData;

  if (!normalizedId) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "invalid-id",
      }),
    );
  }

  const page = await findPageById(normalizedId);

  if (!page) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "missing-page",
      }),
    );
  }

  const existingPage = page;

  if (isPagePublishedContent(existingPage.contentJson)) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "published-protected",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();
    const deletedRows = await db
      .delete(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, PAGE_ENTITY_TYPE),
          eq(localizedContent.id, normalizedId),
        ),
      )
      .returning({
        id: localizedContent.id,
      });

    const deletedCount = deletedRows.length;

    if (deletedCount > 0) {
      await writePageAudit({
        database: db,
        actor: auditActor,
        entityId: existingPage.id,
        action: "delete",
        previousState: buildPageAuditState(existingPage),
      });
    }

    if (deletedCount === 0) {
      redirect(
        buildPagesRedirectUrl({
          pageAction: "error",
          pageCode: "delete-failed",
        }),
      );
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      redirect(
        buildPagesRedirectUrl({
          pageAction: "error",
          pageCode: "audit-actor-required",
        }),
      );
    }

    console.error("deletePage error", {
      id: normalizedId,
      errorName: getSafeErrorName(error),
      errorMessage: getSafeErrorMessage(error),
    });

    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "delete-failed",
      }),
    );
  }

  revalidatePath("/admin/pages");
  revalidatePagePath(existingPage.slug);
  redirect(
    buildPagesRedirectUrl({
      pageAction: "deleted",
    }),
  );
}

export async function repairPageSlug(
  id: string,
  currentSlug: string | undefined,
  formData: FormData,
) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();
  void currentSlug;
  void formData;

  if (!normalizedId) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "invalid-id",
      }),
    );
  }

  const page = await findPageById(normalizedId);

  if (!page) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "missing-page",
      }),
    );
  }

  const existingPage = page;
  const nextSlug = normalizeSlug(existingPage.title);

  if (!nextSlug) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "repair-failed",
      }),
    );
  }

  const collision = await findPageBySlugAndLocale({
    slug: nextSlug,
    locale: existingPage.locale,
    excludeId: existingPage.id,
  });

  if (collision) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "slug-conflict",
      }),
    );
  }

  let updatedPage: PageRecord | null = null;
  let updatedPageSlug: string | null = null;

  try {
    const auditActor = await requireStrictAuditActor();

    const updatedRows = await db
      .update(localizedContent)
      .set({
        slug: nextSlug,
      })
      .where(
        and(
          eq(localizedContent.entityType, PAGE_ENTITY_TYPE),
          eq(localizedContent.id, existingPage.id),
        ),
      )
      .returning({
        id: localizedContent.id,
        entityId: localizedContent.entityId,
        title: localizedContent.title,
        slug: localizedContent.slug,
        locale: localizedContent.locale,
        description: localizedContent.description,
        seoTitle: localizedContent.seoTitle,
        seoDescription: localizedContent.seoDescription,
        contentJson: localizedContent.contentJson,
      });

    updatedPage = updatedRows[0] ?? null;

    if (updatedPage) {
      const nextUpdatedPage = updatedPage;
      updatedPageSlug = nextUpdatedPage.slug;
      await writePageAudit({
        database: db,
        actor: auditActor,
        entityId: nextUpdatedPage.id,
        action: "update",
        previousState: buildPageAuditState(existingPage),
        newState: buildPageAuditState(nextUpdatedPage),
      });
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      redirect(
        buildPagesRedirectUrl({
          pageAction: "error",
          pageCode: "audit-actor-required",
        }),
      );
    }

    console.error("repairPageSlug error", {
      id: normalizedId,
      nextSlug,
      errorName: getSafeErrorName(error),
      errorMessage: getSafeErrorMessage(error),
    });

    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "repair-failed",
      }),
    );
  }

  if (!updatedPage) {
    redirect(
      buildPagesRedirectUrl({
        pageAction: "error",
        pageCode: "repair-failed",
      }),
    );
  }

  revalidatePath("/admin/pages");
  revalidatePagePath(existingPage.slug);
  revalidatePagePath(updatedPageSlug);
  redirect(
    buildPagesRedirectUrl({
      pageAction: "slug-repaired",
    }),
  );
}
