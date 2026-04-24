export type RuleType = "requires" | "excludes" | "recommends";
export type RuleSeverity = "hard_block" | "soft_warning";
export type RuleConditionType = "model" | "package" | "scenario";
export type RuleScopeKind = "global" | "conditional";

export type AvailableProductOption = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "archived";
};

export type RuleConditionOption = {
  id: string;
  label: string;
  description?: string;
};

export type RuleConditionCatalog = {
  modelOptions: RuleConditionOption[];
  packageOptions: RuleConditionOption[];
  scenarioOptions: RuleConditionOption[];
};

export type RuleConditionItem = {
  conditionType: RuleConditionType;
  targetId: string;
  label: string;
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
  conditions: RuleConditionItem[];
  hasConditions: boolean;
  scopeKind: RuleScopeKind;
  conditionCount: number;
};

export type RuleFormValues = {
  id?: string;
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: string;
  message: string;
  conditions: RuleConditionItem[];
};

export type RuleDraftPrefill = {
  sourceProductId: string;
  targetProductId: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: string;
  message: string;
  conditions: RuleConditionItem[];
};

export type RuleSuggestionConfidence = "high" | "medium" | "low";
export type RuleSuggestionEvidenceKind =
  | "document"
  | "scenario"
  | "power"
  | "spec"
  | "keyword"
  | "chunk";

export type RuleSuggestionEvidenceItem = {
  kind: RuleSuggestionEvidenceKind;
  label: string;
};

export type RuleSuggestionExcerptItem = {
  documentId: string;
  documentTitle: string;
  docType: string;
  pageNumber: number | null;
  chunkIndex: number;
  excerpt: string;
  matchScore: number;
};

export type RuleSuggestionSourceSummary = {
  documentCount: number;
  completedDocumentCount: number;
  chunkCount: number;
};

export type RuleSuggestionItem = {
  id: string;
  sourceProductId: string;
  sourceProductLabel: string;
  targetProductId: string;
  targetProductLabel: string;
  targetProductSlug: string;
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: number;
  message: string;
  reason: string;
  confidence: RuleSuggestionConfidence;
  conditions: RuleConditionItem[];
  evidence: RuleSuggestionEvidenceItem[];
  evidenceExcerpts: RuleSuggestionExcerptItem[];
  caution: string | null;
};

export type RuleFieldName =
  | "sourceProductId"
  | "targetProductId"
  | "ruleType"
  | "severity"
  | "priority"
  | "message"
  | "conditions";

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

export type RuleTemplateStatus = "draft" | "active" | "archived";

export type RuleTemplateListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sourceHint: string | null;
  targetHint: string | null;
  defaultRuleType: RuleType;
  defaultSeverity: RuleSeverity;
  defaultPriority: number;
  defaultMessage: string;
  status: RuleTemplateStatus;
  sortOrder: number;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export type RuleTemplateFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  sourceHint: string;
  targetHint: string;
  defaultRuleType: RuleType;
  defaultSeverity: RuleSeverity;
  defaultPriority: string;
  defaultMessage: string;
  status: Exclude<RuleTemplateStatus, "archived">;
  sortOrder: string;
};

export type RuleTemplateFieldName =
  | "title"
  | "slug"
  | "description"
  | "sourceHint"
  | "targetHint"
  | "defaultRuleType"
  | "defaultSeverity"
  | "defaultPriority"
  | "defaultMessage"
  | "status"
  | "sortOrder";

export type RuleTemplateFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<RuleTemplateFieldName, string>>;
};

export const initialRuleTemplateFormState: RuleTemplateFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
