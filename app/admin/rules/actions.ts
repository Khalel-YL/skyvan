"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import {
  compatibilityRules,
  models,
  packages,
  products,
  ruleConditions,
  scenarioMappings,
} from "@/db/schema";
import {
  initialRuleFormState,
  type RuleConditionType,
  type RuleFieldName,
  type RuleFormState,
  type RuleSeverity,
  type RuleType,
} from "./types";

type ParsedCondition = {
  conditionType: RuleConditionType;
  targetId: string;
};

type RuleConflict =
  | {
      kind: "exact_duplicate";
      ruleId: string;
    }
  | {
      kind: "global_blocked_by_conditional";
      ruleId: string;
    }
  | {
      kind: "conditional_blocked_by_global";
      ruleId: string;
    }
  | null;

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
  params: Record<string, string | number | undefined | null>,
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

function parseConditionType(value: string): RuleConditionType | null {
  if (value === "model" || value === "package" || value === "scenario") {
    return value;
  }

  return null;
}

function parsePriority(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseConditions(formData: FormData): ParsedCondition[] | RuleFormState {
  const rawConditionTypes = formData
    .getAll("conditionType")
    .map((value) => String(value).trim());
  const rawConditionTargetIds = formData
    .getAll("conditionTargetId")
    .map((value) => String(value).trim());

  if (rawConditionTypes.length !== rawConditionTargetIds.length) {
    return createFieldError(
      "conditions",
      "Koşul verisi bozuldu. Formu yenileyip tekrar dene.",
    );
  }

  const conditions: ParsedCondition[] = [];
  const uniqueKeys = new Set<string>();

  for (let index = 0; index < rawConditionTypes.length; index += 1) {
    const rawType = rawConditionTypes[index];
    const targetId = rawConditionTargetIds[index];

    if (!rawType && !targetId) {
      continue;
    }

    if (!rawType || !targetId) {
      return createFieldError(
        "conditions",
        "Eksik koşul kaydı var. Lütfen koşul satırlarını kontrol et.",
      );
    }

    const conditionType = parseConditionType(rawType);

    if (!conditionType) {
      return createFieldError(
        "conditions",
        "Geçersiz koşul tipi gönderildi.",
      );
    }

    const uniqueKey = `${conditionType}:${targetId}`;

    if (uniqueKeys.has(uniqueKey)) {
      return createFieldError(
        "conditions",
        "Aynı koşul bir kayıtta yalnızca bir kez kullanılabilir.",
      );
    }

    uniqueKeys.add(uniqueKey);
    conditions.push({
      conditionType,
      targetId,
    });
  }

  if (conditions.length > 12) {
    return createFieldError(
      "conditions",
      "Bir kural için en fazla 12 koşul tanımlanabilir.",
    );
  }

  return conditions;
}

function serializeConditions(conditions: ParsedCondition[]) {
  if (conditions.length === 0) {
    return "__global__";
  }

  return conditions
    .map((condition) => `${condition.conditionType}:${condition.targetId}`)
    .sort((a, b) => a.localeCompare(b, "tr"))
    .join("|");
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

async function ensureRuleExists(id: string) {
  const database = getDatabase();
  const rows = await database
    .select({
      id: compatibilityRules.id,
    })
    .from(compatibilityRules)
    .where(eq(compatibilityRules.id, id))
    .limit(1);

  return rows.length > 0;
}

async function ensureConditionTargetExists(
  conditionType: RuleConditionType,
  targetId: string,
) {
  const database = getDatabase();

  switch (conditionType) {
    case "model": {
      const rows = await database
        .select({
          id: models.id,
        })
        .from(models)
        .where(eq(models.id, targetId))
        .limit(1);

      return rows.length > 0;
    }

    case "package": {
      const rows = await database
        .select({
          id: packages.id,
        })
        .from(packages)
        .where(eq(packages.id, targetId))
        .limit(1);

      return rows.length > 0;
    }

    case "scenario": {
      const rows = await database
        .select({
          scenarioSlug: scenarioMappings.scenarioSlug,
        })
        .from(scenarioMappings)
        .where(eq(scenarioMappings.scenarioSlug, targetId))
        .limit(1);

      return rows.length > 0;
    }

    default:
      return false;
  }
}

async function findRuleConflict(
  sourceProductId: string,
  targetProductId: string,
  ruleType: RuleType,
  conditions: ParsedCondition[],
  excludeId?: string,
): Promise<RuleConflict> {
  const database = getDatabase();

  const filters = [
    eq(compatibilityRules.sourceProductId, sourceProductId),
    eq(compatibilityRules.targetProductId, targetProductId),
    eq(compatibilityRules.ruleType, ruleType),
  ];

  if (excludeId) {
    filters.push(ne(compatibilityRules.id, excludeId));
  }

  const candidateRules = await database
    .select({
      id: compatibilityRules.id,
    })
    .from(compatibilityRules)
    .where(and(...filters));

  if (candidateRules.length === 0) {
    return null;
  }

  const candidateIds = candidateRules.map((item) => item.id);

  const candidateConditionRows =
    candidateIds.length > 0
      ? await database
          .select({
            ruleId: ruleConditions.ruleId,
            conditionType: ruleConditions.conditionType,
            targetId: ruleConditions.targetId,
          })
          .from(ruleConditions)
          .where(inArray(ruleConditions.ruleId, candidateIds))
      : [];

  const groupedConditions = new Map<string, ParsedCondition[]>();

  for (const row of candidateConditionRows) {
    const current = groupedConditions.get(row.ruleId) ?? [];
    current.push({
      conditionType: row.conditionType as RuleConditionType,
      targetId: row.targetId,
    });
    groupedConditions.set(row.ruleId, current);
  }

  const currentSignature = serializeConditions(conditions);
  const isCurrentGlobal = currentSignature === "__global__";

  for (const candidate of candidateRules) {
    const candidateSignature = serializeConditions(
      groupedConditions.get(candidate.id) ?? [],
    );
    const isCandidateGlobal = candidateSignature === "__global__";

    if (candidateSignature === currentSignature) {
      return {
        kind: "exact_duplicate",
        ruleId: candidate.id,
      };
    }

    if (isCurrentGlobal && !isCandidateGlobal) {
      return {
        kind: "global_blocked_by_conditional",
        ruleId: candidate.id,
      };
    }

    if (!isCurrentGlobal && isCandidateGlobal) {
      return {
        kind: "conditional_blocked_by_global",
        ruleId: candidate.id,
      };
    }
  }

  return null;
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
    const parsedConditions = parseConditions(formData);

    if ("status" in parsedConditions) {
      return parsedConditions;
    }

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

    if (id && !(await ensureRuleExists(id))) {
      return createGenericError("Düzenlenecek kural kaydı bulunamadı.");
    }

    for (const condition of parsedConditions) {
      const targetExists = await ensureConditionTargetExists(
        condition.conditionType,
        condition.targetId,
      );

      if (!targetExists) {
        return createFieldError(
          "conditions",
          `${condition.conditionType} koşulu için seçilen kayıt bulunamadı.`,
        );
      }
    }

    const conflict = await findRuleConflict(
      sourceProductId,
      targetProductId,
      ruleType,
      parsedConditions,
      id || undefined,
    );

    if (conflict?.kind === "exact_duplicate") {
      return createFieldError(
        "conditions",
        "Aynı kaynak, hedef, kural tipi ve koşul imzasına sahip kayıt zaten mevcut.",
      );
    }

    if (conflict?.kind === "global_blocked_by_conditional") {
      return createFieldError(
        "conditions",
        "Bu ürün çifti için koşullu kurallar varken aynı hatta global kayıt açılamaz. Var olan conditional kayıtları düzenle veya kaldır.",
      );
    }

    if (conflict?.kind === "conditional_blocked_by_global") {
      return createFieldError(
        "conditions",
        "Bu ürün çifti için zaten global bir kural var. Önce global kaydı düzenle ya da kaldır.",
      );
    }

    await database.transaction(async (tx) => {
      const ruleId = id || uuidv4();

      if (id) {
        await tx
          .update(compatibilityRules)
          .set({
            sourceProductId,
            targetProductId,
            ruleType,
            severity,
            priority,
            message: message || null,
          })
          .where(eq(compatibilityRules.id, ruleId));

        await tx.delete(ruleConditions).where(eq(ruleConditions.ruleId, ruleId));
      } else {
        await tx.insert(compatibilityRules).values({
          id: ruleId,
          sourceProductId,
          targetProductId,
          ruleType,
          severity,
          priority,
          message: message || null,
        });
      }

      if (parsedConditions.length > 0) {
        await tx.insert(ruleConditions).values(
          parsedConditions.map((condition) => ({
            id: uuidv4(),
            ruleId,
            conditionType: condition.conditionType,
            targetId: condition.targetId,
          })),
        );
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/rules");

    redirect(
      buildRulesRedirectUrl({
        saved: 1,
        [id ? "updated" : "created"]: 1,
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