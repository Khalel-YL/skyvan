"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { compatibilityRules, products } from "@/db/schema";

import {
  initialRuleFormState,
  type RuleFieldName,
  type RuleFormState,
  type RuleSeverity,
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

function buildRulesRedirectUrl(
  params: Record<string, string | number | undefined>,
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
  field: RuleFieldName,
  message: string,
): RuleFormState {
  return {
    ...initialRuleFormState,
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
  };
}

function createGenericError(message: string): RuleFormState {
  return {
    ...initialRuleFormState,
    status: "error",
    message,
  };
}

function parseRuleType(value: string): RuleType | null {
  if (
    value === "requires" ||
    value === "excludes" ||
    value === "recommends"
  ) {
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

function parsePriority(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function ensureProductExists(productId: string) {
  const database = getDatabase();

  const rows = await database
    .select({
      id: products.id,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return rows.length > 0;
}

async function findDuplicateRule(
  sourceProductId: string,
  targetProductId: string,
  ruleType: RuleType,
  excludeId?: string,
) {
  const database = getDatabase();

  const conditions = [
    eq(compatibilityRules.sourceProductId, sourceProductId),
    eq(compatibilityRules.targetProductId, targetProductId),
    eq(compatibilityRules.ruleType, ruleType),
  ];

  if (excludeId) {
    conditions.push(ne(compatibilityRules.id, excludeId));
  }

  const rows = await database
    .select({
      id: compatibilityRules.id,
    })
    .from(compatibilityRules)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

export async function saveRule(
  _previousState: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  try {
    const database = getDatabase();

    const id = getTrimmed(formData, "id");
    const sourceProductId = getTrimmed(formData, "sourceProductId");
    const targetProductId = getTrimmed(formData, "targetProductId");
    const ruleType = parseRuleType(getTrimmed(formData, "ruleType"));
    const severity = parseSeverity(getTrimmed(formData, "severity"));
    const priority = parsePriority(getTrimmed(formData, "priority"));
    const message = getTrimmed(formData, "message");

    if (!sourceProductId) {
      return createFieldError("sourceProductId", "Kaynak ürün zorunludur.");
    }

    if (!targetProductId) {
      return createFieldError("targetProductId", "Hedef ürün zorunludur.");
    }

    if (!(await ensureProductExists(sourceProductId))) {
      return createFieldError("sourceProductId", "Kaynak ürün bulunamadı.");
    }

    if (!(await ensureProductExists(targetProductId))) {
      return createFieldError("targetProductId", "Hedef ürün bulunamadı.");
    }

    if (sourceProductId === targetProductId) {
      return createFieldError(
        "targetProductId",
        "Kaynak ve hedef ürün aynı olamaz.",
      );
    }

    if (!ruleType) {
      return createFieldError("ruleType", "Kural tipi zorunludur.");
    }

    if (!severity) {
      return createFieldError("severity", "Şiddet tipi zorunludur.");
    }

    if (priority === null) {
      return createFieldError("priority", "Öncelik sayısal olmalıdır.");
    }

    if (priority < 1 || priority > 100) {
      return createFieldError(
        "priority",
        "Öncelik 1 ile 100 arasında olmalıdır.",
      );
    }

    if (message.length > 600) {
      return createFieldError(
        "message",
        "Açıklama en fazla 600 karakter olabilir.",
      );
    }

    const duplicate = await findDuplicateRule(
      sourceProductId,
      targetProductId,
      ruleType,
      id || undefined,
    );

    if (duplicate) {
      return createFieldError(
        "targetProductId",
        "Aynı kaynak, hedef ve kural tipi kombinasyonu zaten mevcut.",
      );
    }

    if (id) {
      await database
        .update(compatibilityRules)
        .set({
          sourceProductId,
          targetProductId,
          ruleType,
          severity,
          priority,
          message: message || null,
        })
        .where(eq(compatibilityRules.id, id));

      revalidatePath("/admin");
      revalidatePath("/admin/rules");

      redirect(
        buildRulesRedirectUrl({
          saved: 1,
          updated: 1,
        }),
      );
    }

    await database.insert(compatibilityRules).values({
      id: uuidv4(),
      sourceProductId,
      targetProductId,
      ruleType,
      severity,
      priority,
      message: message || null,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/rules");

    redirect(
      buildRulesRedirectUrl({
        saved: 1,
        created: 1,
      }),
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === "error"
    ) {
      return error as RuleFormState;
    }

    console.error("saveRule error:", error);
    return createGenericError("Kural kaydı işlenirken beklenmeyen bir hata oluştu.");
  }
}

export async function deleteRule(formData: FormData) {
  const database = getDatabase();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildRulesRedirectUrl({
        ruleAction: "error",
        ruleCode: "invalid-id",
      }),
    );
  }

  try {
    await database.delete(compatibilityRules).where(eq(compatibilityRules.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/rules");
  } catch (error) {
    console.error("deleteRule error:", error);

    redirect(
      buildRulesRedirectUrl({
        ruleAction: "error",
        ruleCode: "delete-failed",
      }),
    );
  }

  redirect(
    buildRulesRedirectUrl({
      ruleAction: "deleted",
    }),
  );
}