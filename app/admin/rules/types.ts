export type RuleType = "requires" | "excludes" | "recommends";
export type RuleSeverity = "hard_block" | "soft_warning";

export type AvailableProductOption = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "archived";
};

export type RuleListItem = {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  sourceProductLabel: string;
  sourceProductSlug: string;
  targetProductLabel: string;
  targetProductSlug: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: number;
  message: string | null;
  createdAt: Date | string | null;
};

export type RuleFormValues = {
  id?: string;
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: string;
  message: string;
};

export type RuleFieldName =
  | "sourceProductId"
  | "targetProductId"
  | "ruleType"
  | "severity"
  | "priority"
  | "message";

export type RuleFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<RuleFieldName, string>>;
};

export const initialRuleFormState: RuleFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};