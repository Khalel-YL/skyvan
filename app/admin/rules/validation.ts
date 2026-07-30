import { validate as validateUuid } from "uuid";

import {
  initialRuleFormState,
  type RuleConditionType,
  type RuleFieldName,
  type RuleFormState,
  type RuleSeverity,
  type RuleType,
} from "./types";

export type ParsedRuleCondition = {
  conditionType: RuleConditionType;
  targetId: string;
};

export type ParsedRuleInput = {
  id: string | null;
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: number;
  message: string | null;
  conditions: ParsedRuleCondition[];
};

type RuleValidationResult =
  | { ok: true; input: ParsedRuleInput }
  | { ok: false; state: RuleFormState };

export function isUuid(value: string) {
  return validateUuid(value);
}

export function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function createFieldError(
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

export function createGenericError(message: string): RuleFormState {
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
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function canonicalizeUuid(value: string) {
  return value.toLowerCase();
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

function parseConditions(formData: FormData) {
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

  const conditions: ParsedRuleCondition[] = [];
  const uniqueKeys = new Set<string>();

  for (let index = 0; index < rawConditionTypes.length; index += 1) {
    const rawType = rawConditionTypes[index];
    const rawTargetId = rawConditionTargetIds[index];

    if (!rawType && !rawTargetId) {
      continue;
    }

    if (!rawType || !rawTargetId) {
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

    const targetId =
      conditionType === "model" || conditionType === "package"
        ? canonicalizeUuid(rawTargetId)
        : rawTargetId;

    if (
      (conditionType === "model" || conditionType === "package") &&
      !isUuid(rawTargetId)
    ) {
      return createFieldError(
        "conditions",
        `${conditionType} koşulu için seçilen kayıt kimliği geçersiz.`,
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

  return sortConditions(conditions);
}

export function parseRuleFormData(formData: FormData): RuleValidationResult {
  const id = getTrimmed(formData, "id");
  const sourceProductId = getTrimmed(formData, "sourceProductId");
  const targetProductId = getTrimmed(formData, "targetProductId");
  const ruleType = parseRuleType(getTrimmed(formData, "ruleType"));
  const severity = parseSeverity(getTrimmed(formData, "severity"));
  const priority = parsePriority(getTrimmed(formData, "priority"));
  const message = getTrimmed(formData, "message");
  const parsedConditions = parseConditions(formData);

  if ("status" in parsedConditions) {
    return {
      ok: false,
      state: parsedConditions,
    };
  }

  if (id && !isUuid(id)) {
    return {
      ok: false,
      state: createGenericError(
        "Geçersiz kayıt kimliği nedeniyle kural işlemi durduruldu.",
      ),
    };
  }

  if (!sourceProductId) {
    return {
      ok: false,
      state: createFieldError("sourceProductId", "Kaynak ürün zorunludur."),
    };
  }

  if (!targetProductId) {
    return {
      ok: false,
      state: createFieldError("targetProductId", "Hedef ürün zorunludur."),
    };
  }

  if (!isUuid(sourceProductId)) {
    return {
      ok: false,
      state: createFieldError("sourceProductId", "Kaynak ürün kimliği geçersiz."),
    };
  }

  if (!isUuid(targetProductId)) {
    return {
      ok: false,
      state: createFieldError("targetProductId", "Hedef ürün kimliği geçersiz."),
    };
  }

  if (sourceProductId.toLowerCase() === targetProductId.toLowerCase()) {
    return {
      ok: false,
      state: createFieldError(
        "targetProductId",
        "Kaynak ve hedef ürün aynı olamaz.",
      ),
    };
  }

  if (!ruleType) {
    return {
      ok: false,
      state: createFieldError("ruleType", "Kural tipi zorunludur."),
    };
  }

  if (!severity) {
    return {
      ok: false,
      state: createFieldError("severity", "Şiddet tipi zorunludur."),
    };
  }

  if (priority === null) {
    return {
      ok: false,
      state: createFieldError("priority", "Öncelik sayısal olmalıdır."),
    };
  }

  if (priority < 1 || priority > 100) {
    return {
      ok: false,
      state: createFieldError(
        "priority",
        "Öncelik 1 ile 100 arasında olmalıdır.",
      ),
    };
  }

  if (message.length > 600) {
    return {
      ok: false,
      state: createFieldError(
        "message",
        "Açıklama en fazla 600 karakter olabilir.",
      ),
    };
  }

  return {
    ok: true,
    input: {
      id: id ? canonicalizeUuid(id) : null,
      sourceProductId: canonicalizeUuid(sourceProductId),
      targetProductId: canonicalizeUuid(targetProductId),
      ruleType,
      severity,
      priority,
      message: message || null,
      conditions: parsedConditions,
    },
  };
}
