"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import {
  compatibilityRules,
  models,
  packages,
  products,
  ruleConditions,
  scenarioMappings,
} from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";
import {
  initialRuleFormState,
  type RuleConditionType,
  type RuleFieldName,
  type RuleFormState,
  type RuleScopeKind,
  type RuleSeverity,
  type RuleType,
} from "./types";

type ParsedCondition = {
  conditionType: RuleConditionType;
  targetId: string;
};

type RuleRecord = {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: number;
  message: string | null;
  createdAt: Date | string | null;
};

type RuleAuditState = RuleRecord & {
  conditions: ParsedCondition[];
  scopeKind: RuleScopeKind;
  conditionCount: number;
  conditionSignature: string;
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
  | {
      kind: "pair_rule_type_taken";
      ruleId: string;
    }
  | null;

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

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
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

function normalizeConditionsForAudit(conditions: ParsedCondition[]) {
  return [...conditions].sort((left, right) => {
    const typeCompare = left.conditionType.localeCompare(right.conditionType, "tr");

    if (typeCompare !== 0) {
      return typeCompare;
    }

    return left.targetId.localeCompare(right.targetId, "tr");
  });
}

async function ensureProductExists(productId: string) {
  const database = getDbOrThrow();
  const rows = await database
    .select({
      id: products.id,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return rows.length > 0;
}

async function ensureConditionTargetExists(
  conditionType: RuleConditionType,
  targetId: string,
) {
  const database = getDbOrThrow();

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

async function getRuleStateById(id: string): Promise<RuleAuditState | null> {
  const database = getDbOrThrow();

  const ruleRows = await database
    .select({
      id: compatibilityRules.id,
      sourceProductId: compatibilityRules.sourceProductId,
      targetProductId: compatibilityRules.targetProductId,
      ruleType: compatibilityRules.ruleType,
      severity: compatibilityRules.severity,
      priority: compatibilityRules.priority,
      message: compatibilityRules.message,
      createdAt: compatibilityRules.createdAt,
    })
    .from(compatibilityRules)
    .where(eq(compatibilityRules.id, id))
    .limit(1);

  const rule = (ruleRows[0] as RuleRecord | undefined) ?? null;

  if (!rule) {
    return null;
  }

  const conditionRows = await database
    .select({
      conditionType: ruleConditions.conditionType,
      targetId: ruleConditions.targetId,
    })
    .from(ruleConditions)
    .where(eq(ruleConditions.ruleId, id));

  const conditions = normalizeConditionsForAudit(
    conditionRows.map((row) => ({
      conditionType: row.conditionType as RuleConditionType,
      targetId: row.targetId,
    })),
  );

  return {
    ...rule,
    conditions,
    scopeKind: conditions.length > 0 ? "conditional" : "global",
    conditionCount: conditions.length,
    conditionSignature: serializeConditions(conditions),
  };
}

async function writeRuleAudit(input: {
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: "rule",
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("rule audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("rule audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

async function findRuleConflict(
  sourceProductId: string,
  targetProductId: string,
  ruleType: RuleType,
  conditions: ParsedCondition[],
  excludeId?: string,
): Promise<RuleConflict> {
  const database = getDbOrThrow();

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

  return {
    kind: "pair_rule_type_taken",
    ruleId: candidateRules[0].id,
  };
}

export async function saveRule(
  _previousState: RuleFormState,
  formData: FormData,
): Promise<RuleFormState> {
  try {
    const database = getDbOrThrow();
    const id = getTrimmed(formData, "id");
    const sourceProductId = getTrimmed(formData, "sourceProductId");
    const targetProductId = getTrimmed(formData, "targetProductId");
    const ruleType = parseRuleType(getTrimmed(formData, "ruleType"));
    const severity = parseSeverity(getTrimmed(formData, "severity"));
    const priority = parsePriority(getTrimmed(formData, "priority"));
    const message = getTrimmed(formData, "message");
    const parsedConditions = parseConditions(formData);
    const existingRule = id ? await getRuleStateById(id) : null;

    if ("status" in parsedConditions) {
      return parsedConditions;
    }

    if (!sourceProductId) {
      return createFieldError("sourceProductId", "Kaynak ürün zorunludur.");
    }

    if (!targetProductId) {
      return createFieldError("targetProductId", "Hedef ürün zorunludur.");
    }

    const [sourceExists, targetExists] = await Promise.all([
      ensureProductExists(sourceProductId),
      ensureProductExists(targetProductId),
    ]);

    if (!sourceExists) {
      return createFieldError("sourceProductId", "Kaynak ürün bulunamadı.");
    }

    if (!targetExists) {
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

    if (id && !existingRule) {
      return createGenericError("Düzenlenecek kural kaydı bulunamadı.");
    }

    for (const condition of parsedConditions) {
      const targetExistsForCondition = await ensureConditionTargetExists(
        condition.conditionType,
        condition.targetId,
      );

      if (!targetExistsForCondition) {
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

    if (conflict?.kind === "pair_rule_type_taken") {
      return createFieldError(
        "conditions",
        "Bu ürün çifti ve kural tipi için tek bir kayıt tutulabilir. Mevcut kaydı düzenle veya kaldır.",
      );
    }

    const ruleId = id || uuidv4();
    let mutationError: RuleFormState | null = null;

    await database.transaction(async (tx) => {
      if (id) {
        const updatedRows = await tx
          .update(compatibilityRules)
          .set({
            sourceProductId,
            targetProductId,
            ruleType,
            severity,
            priority,
            message: message || null,
          })
          .where(eq(compatibilityRules.id, ruleId))
          .returning({
            id: compatibilityRules.id,
          });

        if (updatedRows.length === 0) {
          mutationError = createGenericError(
            "Kural kaydı işlem sırasında güncellenemedi.",
          );
          return;
        }

        await tx.delete(ruleConditions).where(eq(ruleConditions.ruleId, ruleId));
      } else {
        const insertedRows = await tx
          .insert(compatibilityRules)
          .values({
            id: ruleId,
            sourceProductId,
            targetProductId,
            ruleType,
            severity,
            priority,
            message: message || null,
          })
          .returning({
            id: compatibilityRules.id,
          });

        if (insertedRows.length === 0) {
          mutationError = createGenericError("Kural kaydı oluşturulamadı.");
          return;
        }
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

    if (mutationError) {
      return mutationError;
    }

    const savedRule = await getRuleStateById(ruleId);

    if (!savedRule) {
      return createGenericError("Kural kaydı işlem sonrası doğrulanamadı.");
    }

    await writeRuleAudit({
      entityId: savedRule.id,
      action: id ? "update" : "create",
      previousState: existingRule ?? undefined,
      newState: savedRule,
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
    if (isNextRedirectError(error)) {
      throw error;
    }

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
  const database = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildRulesRedirectUrl({
        ruleAction: "error",
        ruleCode: "invalid-id",
      }),
    );
  }

  const existingRule = await getRuleStateById(id);

  if (!existingRule) {
    redirect(
      buildRulesRedirectUrl({
        ruleAction: "error",
        ruleCode: "invalid-id",
      }),
    );
  }

  try {
    const deletedRows = await database
      .delete(compatibilityRules)
      .where(eq(compatibilityRules.id, id))
      .returning({
        id: compatibilityRules.id,
      });

    if (deletedRows.length === 0) {
      redirect(
        buildRulesRedirectUrl({
          ruleAction: "error",
          ruleCode: "delete-failed",
        }),
      );
    }

    await writeRuleAudit({
      entityId: existingRule.id,
      action: "delete",
      previousState: existingRule,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/rules");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

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
