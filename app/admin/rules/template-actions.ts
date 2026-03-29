"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { ruleTemplates } from "@/db/schema";

import {
  initialRuleTemplateFormState,
  type RuleTemplateFieldName,
  type RuleTemplateFormState,
  type RuleSeverity,
  type RuleTemplateStatus,
  type RuleType,
} from "./types";

function getDatabase() {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  return db;
}

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function buildTemplatesRedirectUrl(
  params: Record<string, string | number | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/rules?${query}` : "/admin/rules";
}

function createFieldError(
  field: RuleTemplateFieldName,
  message: string,
): RuleTemplateFormState {
  return {
    ...initialRuleTemplateFormState,
    status: "error",
    message,
    fieldErrors: { [field]: message },
  };
}

function createGenericError(message: string): RuleTemplateFormState {
  return {
    ...initialRuleTemplateFormState,
    status: "error",
    message,
  };
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseRuleType(value: string): RuleType | null {
  if (value === "requires" || value === "excludes" || value === "recommends") {
    return value;
  }

  return null;
}

function parseSeverity(value: string): RuleSeverity | null {
  if (value === "hard_block" || value === "soft_warning") {
    return value;
  }

  return null;
}

function parseTemplateStatus(value: string): Exclude<RuleTemplateStatus, "archived"> | null {
  if (value === "draft" || value === "active") {
    return value;
  }

  return null;
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function ensureTemplateExists(id: string) {
  const database = getDatabase();

  const rows = await database
    .select({ id: ruleTemplates.id })
    .from(ruleTemplates)
    .where(eq(ruleTemplates.id, id))
    .limit(1);

  return rows.length > 0;
}

async function ensureTemplateSlugAvailable(slug: string, excludeId?: string) {
  const database = getDatabase();

  const filters = [eq(ruleTemplates.slug, slug)];
  if (excludeId) {
    filters.push(ne(ruleTemplates.id, excludeId));
  }

  const rows = await database
    .select({ id: ruleTemplates.id })
    .from(ruleTemplates)
    .where(and(...filters))
    .limit(1);

  return rows.length === 0;
}

export async function saveRuleTemplate(
  _previousState: RuleTemplateFormState,
  formData: FormData,
): Promise<RuleTemplateFormState> {
  try {
    const database = getDatabase();

    const id = getTrimmed(formData, "id");
    const title = getTrimmed(formData, "title");
    const rawSlug = getTrimmed(formData, "slug");
    const description = getTrimmed(formData, "description");
    const sourceHint = getTrimmed(formData, "sourceHint");
    const targetHint = getTrimmed(formData, "targetHint");
    const defaultRuleType = parseRuleType(getTrimmed(formData, "defaultRuleType"));
    const defaultSeverity = parseSeverity(getTrimmed(formData, "defaultSeverity"));
    const defaultPriority = parseInteger(getTrimmed(formData, "defaultPriority"));
    const defaultMessage = getTrimmed(formData, "defaultMessage");
    const status = parseTemplateStatus(getTrimmed(formData, "status"));
    const sortOrder = parseInteger(getTrimmed(formData, "sortOrder"));

    if (!title) {
      return createFieldError("title", "Şablon başlığı zorunludur.");
    }

    if (title.length > 120) {
      return createFieldError("title", "Şablon başlığı en fazla 120 karakter olabilir.");
    }

    const slug = normalizeSlug(rawSlug || title);

    if (!slug) {
      return createFieldError("slug", "Geçerli bir slug üretilemedi.");
    }

    if (slug.length > 140) {
      return createFieldError("slug", "Slug en fazla 140 karakter olabilir.");
    }

    if (!(await ensureTemplateSlugAvailable(slug, id || undefined))) {
      return createFieldError("slug", "Bu slug zaten kullanılıyor.");
    }

    if (!defaultRuleType) {
      return createFieldError("defaultRuleType", "Varsayılan kural tipi zorunludur.");
    }

    if (!defaultSeverity) {
      return createFieldError("defaultSeverity", "Varsayılan şiddet zorunludur.");
    }

    if (defaultPriority === null) {
      return createFieldError("defaultPriority", "Varsayılan öncelik sayısal olmalıdır.");
    }

    if (defaultPriority < 1 || defaultPriority > 100) {
      return createFieldError("defaultPriority", "Varsayılan öncelik 1 ile 100 arasında olmalıdır.");
    }

    if (!defaultMessage) {
      return createFieldError("defaultMessage", "Varsayılan mesaj zorunludur.");
    }

    if (defaultMessage.length > 600) {
      return createFieldError("defaultMessage", "Varsayılan mesaj en fazla 600 karakter olabilir.");
    }

    if (!status) {
      return createFieldError("status", "Durum zorunludur.");
    }

    if (sortOrder === null) {
      return createFieldError("sortOrder", "Sıralama sayısal olmalıdır.");
    }

    if (sortOrder < 0 || sortOrder > 999) {
      return createFieldError("sortOrder", "Sıralama 0 ile 999 arasında olmalıdır.");
    }

    if (description.length > 300) {
      return createFieldError("description", "Açıklama en fazla 300 karakter olabilir.");
    }

    if (sourceHint.length > 250) {
      return createFieldError("sourceHint", "Kaynak ipucu en fazla 250 karakter olabilir.");
    }

    if (targetHint.length > 250) {
      return createFieldError("targetHint", "Hedef ipucu en fazla 250 karakter olabilir.");
    }

    if (id && !(await ensureTemplateExists(id))) {
      return createGenericError("Düzenlenecek şablon bulunamadı.");
    }

    if (id) {
      await database
        .update(ruleTemplates)
        .set({
          title,
          slug,
          description: description || null,
          sourceHint: sourceHint || null,
          targetHint: targetHint || null,
          defaultRuleType,
          defaultSeverity,
          defaultPriority,
          defaultMessage,
          status,
          sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(ruleTemplates.id, id));
    } else {
      await database.insert(ruleTemplates).values({
        id: uuidv4(),
        title,
        slug,
        description: description || null,
        sourceHint: sourceHint || null,
        targetHint: targetHint || null,
        defaultRuleType,
        defaultSeverity,
        defaultPriority,
        defaultMessage,
        status,
        sortOrder,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/rules");

    redirect(
      buildTemplatesRedirectUrl({
        templateAction: id ? "updated" : "created",
      }),
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === "error"
    ) {
      return error as RuleTemplateFormState;
    }

    console.error("saveRuleTemplate error:", error);
    return createGenericError("Şablon kaydı işlenirken beklenmeyen bir hata oluştu.");
  }
}

export async function archiveRuleTemplate(formData: FormData) {
  const database = getDatabase();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildTemplatesRedirectUrl({
        templateAction: "error",
        templateCode: "invalid-id",
      }),
    );
  }

  try {
    await database
      .update(ruleTemplates)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(ruleTemplates.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/rules");
  } catch (error) {
    console.error("archiveRuleTemplate error:", error);
    redirect(
      buildTemplatesRedirectUrl({
        templateAction: "error",
        templateCode: "archive-failed",
      }),
    );
  }

  redirect(
    buildTemplatesRedirectUrl({
      templateAction: "archived",
    }),
  );
}

export async function restoreRuleTemplate(formData: FormData) {
  const database = getDatabase();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildTemplatesRedirectUrl({
        templateAction: "error",
        templateCode: "invalid-id",
      }),
    );
  }

  try {
    await database
      .update(ruleTemplates)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(ruleTemplates.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/rules");
  } catch (error) {
    console.error("restoreRuleTemplate error:", error);
    redirect(
      buildTemplatesRedirectUrl({
        templateAction: "error",
        templateCode: "restore-failed",
      }),
    );
  }

  redirect(
    buildTemplatesRedirectUrl({
      templateAction: "restored",
    }),
  );
}
