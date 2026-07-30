import { and, eq, inArray, ne, sql } from "drizzle-orm";

import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import {
  compatibilityRules,
  models,
  packages,
  products,
  ruleConditions,
  scenarioMappings,
} from "@/db/schema";

import type { RuleConditionType, RuleFieldName, RuleSeverity, RuleType } from "./types";
import type { ParsedRuleCondition, ParsedRuleInput } from "./validation";

export type RuleMutationMode = "created" | "updated";

type RuleAuditState = {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: number;
  message: string | null;
  conditions: ParsedRuleCondition[];
};

type RuleRecord = Omit<RuleAuditState, "conditions">;

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

export class RuleMutationError extends Error {
  constructor(
    message: string,
    public readonly code = "rule-mutation-failed",
    public readonly fieldErrors: Partial<Record<RuleFieldName, string>> = {},
  ) {
    super(message);
    this.name = "RuleMutationError";
  }
}

export class RuleNoopMutation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleNoopMutation";
  }
}

const ruleReturningFields = {
  id: compatibilityRules.id,
  sourceProductId: compatibilityRules.sourceProductId,
  targetProductId: compatibilityRules.targetProductId,
  ruleType: compatibilityRules.ruleType,
  severity: compatibilityRules.severity,
  priority: compatibilityRules.priority,
  message: compatibilityRules.message,
};

function toRuleRecord(row: RuleRecord): RuleRecord {
  return {
    id: row.id,
    sourceProductId: row.sourceProductId,
    targetProductId: row.targetProductId,
    ruleType: row.ruleType,
    severity: row.severity,
    priority: row.priority,
    message: row.message,
  };
}

function sortConditions(conditions: ParsedRuleCondition[]) {
  return [...conditions].sort((left, right) => {
    const typeCompare = left.conditionType.localeCompare(right.conditionType, "tr");

    if (typeCompare !== 0) {
      return typeCompare;
    }

    return left.targetId.localeCompare(right.targetId, "tr");
  });
}

function toRuleAuditState(
  row: RuleRecord,
  conditions: ParsedRuleCondition[],
): RuleAuditState {
  return {
    ...toRuleRecord(row),
    conditions: sortConditions(conditions),
  };
}

function serializeConditions(conditions: ParsedRuleCondition[]) {
  if (conditions.length === 0) {
    return "__global__";
  }

  return sortConditions(conditions)
    .map((condition) => `${condition.conditionType}:${condition.targetId}`)
    .join("|");
}

function hasRuleChanged(previous: RuleAuditState, next: RuleAuditState) {
  return (
    previous.sourceProductId !== next.sourceProductId ||
    previous.targetProductId !== next.targetProductId ||
    previous.ruleType !== next.ruleType ||
    previous.severity !== next.severity ||
    previous.priority !== next.priority ||
    previous.message !== next.message ||
    serializeConditions(previous.conditions) !== serializeConditions(next.conditions)
  );
}

async function acquireMutationLock(tx: TransactionClient, lockKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
}

function getLogicalRuleLockKey(input: {
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
}) {
  return [
    "rule-key",
    input.sourceProductId,
    input.targetProductId,
    input.ruleType,
  ].join(":");
}

async function acquireSortedLocks(tx: TransactionClient, lockKeys: string[]) {
  const uniqueSortedKeys = Array.from(new Set(lockKeys)).sort((left, right) =>
    left.localeCompare(right),
  );

  for (const lockKey of uniqueSortedKeys) {
    await acquireMutationLock(tx, lockKey);
  }
}

function hasSameLogicalRuleKey(left: RuleAuditState, right: RuleAuditState) {
  return (
    left.sourceProductId === right.sourceProductId &&
    left.targetProductId === right.targetProductId &&
    left.ruleType === right.ruleType
  );
}

async function findRuleById(
  tx: TransactionClient,
  id: string,
): Promise<RuleAuditState | null> {
  const ruleRows = await tx
    .select(ruleReturningFields)
    .from(compatibilityRules)
    .where(eq(compatibilityRules.id, id))
    .limit(1);

  const rule = ruleRows[0] ?? null;

  if (!rule) {
    return null;
  }

  const conditionRows = await tx
    .select({
      conditionType: ruleConditions.conditionType,
      targetId: ruleConditions.targetId,
    })
    .from(ruleConditions)
    .where(eq(ruleConditions.ruleId, id));

  return toRuleAuditState(rule, conditionRows);
}

function getProductField(
  role: "source" | "target",
): "sourceProductId" | "targetProductId" {
  return role === "source" ? "sourceProductId" : "targetProductId";
}

function getProductMissingMessage(role: "source" | "target") {
  return role === "source" ? "Kaynak ürün bulunamadı." : "Hedef ürün bulunamadı.";
}

function getProductInvalidMessage(role: "source" | "target") {
  return role === "source"
    ? "Kaynak ürün Kural Motoru kullanımına uygun değil."
    : "Hedef ürün Kural Motoru kullanımına uygun değil.";
}

async function assertRuleProductExists(
  tx: TransactionClient,
  productId: string,
  role: "source" | "target",
) {
  const rows = await tx
    .select({
      id: products.id,
      status: products.status,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  const product = rows[0] ?? null;
  const field = getProductField(role);

  if (!product) {
    throw new RuleMutationError(
      getProductMissingMessage(role),
      `${role}-product-not-found`,
      { [field]: getProductMissingMessage(role) },
    );
  }

  if (product.status === "archived") {
    throw new RuleMutationError(
      getProductInvalidMessage(role),
      `${role}-product-archived`,
      { [field]: getProductInvalidMessage(role) },
    );
  }
}

async function assertConditionTargetExists(
  tx: TransactionClient,
  condition: ParsedRuleCondition,
) {
  switch (condition.conditionType) {
    case "model": {
      const rows = await tx
        .select({ id: models.id })
        .from(models)
        .where(eq(models.id, condition.targetId))
        .limit(1);

      if (!rows[0]) {
        throw new RuleMutationError(
          "Model koşulu için seçilen kayıt bulunamadı.",
          "condition-target-not-found",
          { conditions: "Model koşulu için seçilen kayıt bulunamadı." },
        );
      }

      return;
    }

    case "package": {
      const rows = await tx
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.id, condition.targetId))
        .limit(1);

      if (!rows[0]) {
        throw new RuleMutationError(
          "Paket koşulu için seçilen kayıt bulunamadı.",
          "condition-target-not-found",
          { conditions: "Paket koşulu için seçilen kayıt bulunamadı." },
        );
      }

      return;
    }

    case "scenario": {
      const rows = await tx
        .select({ scenarioSlug: scenarioMappings.scenarioSlug })
        .from(scenarioMappings)
        .where(eq(scenarioMappings.scenarioSlug, condition.targetId))
        .limit(1);

      if (!rows[0]) {
        throw new RuleMutationError(
          "Senaryo koşulu için seçilen kayıt bulunamadı.",
          "condition-target-not-found",
          { conditions: "Senaryo koşulu için seçilen kayıt bulunamadı." },
        );
      }
    }
  }
}

async function assertDependenciesExist(tx: TransactionClient, input: ParsedRuleInput) {
  await assertRuleProductExists(tx, input.sourceProductId, "source");
  await assertRuleProductExists(tx, input.targetProductId, "target");

  for (const condition of input.conditions) {
    await assertConditionTargetExists(tx, condition);
  }
}

async function findRuleConflict(
  tx: TransactionClient,
  input: {
    sourceProductId: string;
    targetProductId: string;
    ruleType: RuleType;
    conditions: ParsedRuleCondition[];
    excludeId?: string;
  },
): Promise<RuleConflict> {
  const filters = [
    eq(compatibilityRules.sourceProductId, input.sourceProductId),
    eq(compatibilityRules.targetProductId, input.targetProductId),
    eq(compatibilityRules.ruleType, input.ruleType),
  ];

  if (input.excludeId) {
    filters.push(ne(compatibilityRules.id, input.excludeId));
  }

  const candidateRules = await tx
    .select({ id: compatibilityRules.id })
    .from(compatibilityRules)
    .where(and(...filters));

  if (candidateRules.length === 0) {
    return null;
  }

  const candidateIds = candidateRules.map((item) => item.id);
  const candidateConditionRows = await tx
    .select({
      ruleId: ruleConditions.ruleId,
      conditionType: ruleConditions.conditionType,
      targetId: ruleConditions.targetId,
    })
    .from(ruleConditions)
    .where(inArray(ruleConditions.ruleId, candidateIds));

  const groupedConditions = new Map<string, ParsedRuleCondition[]>();

  for (const row of candidateConditionRows) {
    const current = groupedConditions.get(row.ruleId) ?? [];
    current.push({
      conditionType: row.conditionType as RuleConditionType,
      targetId: row.targetId,
    });
    groupedConditions.set(row.ruleId, current);
  }

  const currentSignature = serializeConditions(input.conditions);
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

function assertNoRuleConflict(conflict: RuleConflict) {
  if (conflict?.kind === "exact_duplicate") {
    throw new RuleMutationError(
      "Aynı kaynak, hedef, kural tipi ve koşul imzasına sahip kayıt zaten mevcut.",
      "duplicate-rule",
      {
        conditions:
          "Aynı kaynak, hedef, kural tipi ve koşul imzasına sahip kayıt zaten mevcut.",
      },
    );
  }

  if (conflict?.kind === "global_blocked_by_conditional") {
    throw new RuleMutationError(
      "Bu ürün çifti için koşullu kurallar varken aynı hatta global kayıt açılamaz. Var olan conditional kayıtları düzenle veya kaldır.",
      "duplicate-rule",
      {
        conditions:
          "Bu ürün çifti için koşullu kurallar varken aynı hatta global kayıt açılamaz. Var olan conditional kayıtları düzenle veya kaldır.",
      },
    );
  }

  if (conflict?.kind === "conditional_blocked_by_global") {
    throw new RuleMutationError(
      "Bu ürün çifti için zaten global bir kural var. Önce global kaydı düzenle ya da kaldır.",
      "duplicate-rule",
      {
        conditions:
          "Bu ürün çifti için zaten global bir kural var. Önce global kaydı düzenle ya da kaldır.",
      },
    );
  }

  if (conflict?.kind === "pair_rule_type_taken") {
    throw new RuleMutationError(
      "Bu ürün çifti ve kural tipi için tek bir kayıt tutulabilir. Mevcut kaydı düzenle veya kaldır.",
      "duplicate-rule",
      {
        conditions:
          "Bu ürün çifti ve kural tipi için tek bir kayıt tutulabilir. Mevcut kaydı düzenle veya kaldır.",
      },
    );
  }
}

async function insertConditions(
  tx: TransactionClient,
  ruleId: string,
  conditions: ParsedRuleCondition[],
) {
  if (conditions.length === 0) {
    return;
  }

  await tx.insert(ruleConditions).values(
    conditions.map((condition) => ({
      ruleId,
      conditionType: condition.conditionType,
      targetId: condition.targetId,
    })),
  );
}

function buildNextRuleState(id: string, input: ParsedRuleInput): RuleAuditState {
  return {
    id,
    sourceProductId: input.sourceProductId,
    targetProductId: input.targetProductId,
    ruleType: input.ruleType,
    severity: input.severity,
    priority: input.priority,
    message: input.message,
    conditions: input.conditions,
  };
}

export async function createRuleInTransaction(
  input: ParsedRuleInput,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, getLogicalRuleLockKey(input));
    await assertDependenciesExist(tx, input);

    const conflict = await findRuleConflict(tx, input);
    assertNoRuleConflict(conflict);

    const insertedRows = await tx
      .insert(compatibilityRules)
      .values({
        sourceProductId: input.sourceProductId,
        targetProductId: input.targetProductId,
        ruleType: input.ruleType,
        severity: input.severity,
        priority: input.priority,
        message: input.message,
      })
      .returning(ruleReturningFields);

    const insertedRule = insertedRows[0] ?? null;

    if (!insertedRule) {
      throw new RuleMutationError(
        "Kural kaydı oluşturulamadı.",
        "create-failed",
      );
    }

    await insertConditions(tx, insertedRule.id, input.conditions);

    const savedRule = await findRuleById(tx, insertedRule.id);

    if (!savedRule) {
      throw new RuleMutationError(
        "Kural kaydı işlem sonrası doğrulanamadı.",
        "create-verify-failed",
      );
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "rule",
      entityId: savedRule.id,
      action: "create",
      newState: savedRule,
      actor,
    });

    return {
      mode: "created" as RuleMutationMode,
      rule: savedRule,
    };
  });
}

export async function updateRuleInTransaction(
  input: ParsedRuleInput & { id: string },
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `rule:${input.id}`);

    const lockedRule = await findRuleById(tx, input.id);

    if (!lockedRule) {
      throw new RuleMutationError(
        "Düzenlenecek kural kaydı bulunamadı.",
        "not-found",
      );
    }

    await acquireSortedLocks(tx, [
      getLogicalRuleLockKey(lockedRule),
      getLogicalRuleLockKey(input),
    ]);

    const existingRule = await findRuleById(tx, input.id);

    if (!existingRule) {
      throw new RuleMutationError(
        "Düzenlenecek kural kaydı bulunamadı.",
        "not-found",
      );
    }

    if (!hasSameLogicalRuleKey(lockedRule, existingRule)) {
      throw new RuleMutationError(
        "Kural kaydı başka bir işlem tarafından değiştirildi. Listeyi yenileyip tekrar deneyin.",
        "concurrent-rule-change",
      );
    }

    await assertDependenciesExist(tx, input);

    const conflict = await findRuleConflict(tx, {
      ...input,
      excludeId: input.id,
    });
    assertNoRuleConflict(conflict);

    const nextState = buildNextRuleState(input.id, input);

    if (!hasRuleChanged(existingRule, nextState)) {
      throw new RuleNoopMutation("Kural üzerinde kaydedilecek değişiklik yok.");
    }

    const updatedRows = await tx
      .update(compatibilityRules)
      .set({
        sourceProductId: input.sourceProductId,
        targetProductId: input.targetProductId,
        ruleType: input.ruleType,
        severity: input.severity,
        priority: input.priority,
        message: input.message,
      })
      .where(eq(compatibilityRules.id, input.id))
      .returning(ruleReturningFields);

    const updatedRule = updatedRows[0] ?? null;

    if (!updatedRule) {
      throw new RuleMutationError(
        "Kural kaydı işlem sırasında güncellenemedi.",
        "update-failed",
      );
    }

    await tx.delete(ruleConditions).where(eq(ruleConditions.ruleId, input.id));
    await insertConditions(tx, input.id, input.conditions);

    const savedRule = await findRuleById(tx, input.id);

    if (!savedRule) {
      throw new RuleMutationError(
        "Kural kaydı işlem sonrası doğrulanamadı.",
        "update-verify-failed",
      );
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "rule",
      entityId: savedRule.id,
      action: "update",
      previousState: existingRule,
      newState: savedRule,
      actor,
    });

    return {
      mode: "updated" as RuleMutationMode,
      rule: savedRule,
    };
  });
}

export async function deleteRuleInTransaction(
  id: string,
  actor: StrictAuditActor,
) {
  return runDatabaseTransaction(async (tx) => {
    await acquireMutationLock(tx, `rule:${id}`);

    const lockedRule = await findRuleById(tx, id);

    if (!lockedRule) {
      throw new RuleMutationError("Kural kaydı bulunamadı.", "not-found");
    }

    await acquireMutationLock(tx, getLogicalRuleLockKey(lockedRule));

    const existingRule = await findRuleById(tx, id);

    if (!existingRule) {
      throw new RuleMutationError("Kural kaydı bulunamadı.", "not-found");
    }

    if (!hasSameLogicalRuleKey(lockedRule, existingRule)) {
      throw new RuleMutationError(
        "Kural kaydı başka bir işlem tarafından değiştirildi. Listeyi yenileyip tekrar deneyin.",
        "concurrent-rule-change",
      );
    }

    const deletedRows = await tx
      .delete(compatibilityRules)
      .where(eq(compatibilityRules.id, id))
      .returning({ id: compatibilityRules.id });

    if (deletedRows.length === 0) {
      throw new RuleMutationError("Kural kaydı kaldırılamadı.", "delete-failed");
    }

    const remainingConditionRows = await tx
      .select({ id: ruleConditions.id })
      .from(ruleConditions)
      .where(eq(ruleConditions.ruleId, id))
      .limit(1);

    if (remainingConditionRows.length > 0) {
      throw new RuleMutationError(
        "Kural koşulları doğrulanamadığı için kaldırma işlemi durduruldu.",
        "condition-cascade-failed",
      );
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "rule",
      entityId: existingRule.id,
      action: "delete",
      previousState: existingRule,
      actor,
    });

    return {
      rule: existingRule,
    };
  });
}
