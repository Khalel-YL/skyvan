import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/db";
import {
  aiDocumentChunks,
  aiKnowledgeDocuments,
  categories,
  compatibilityRules,
  models,
  packages,
  productDocuments,
  products,
  productSpecs,
  ruleConditions,
  scenarioMappings,
} from "@/db/schema";

import AddRuleDrawer from "./AddRuleDrawer";
import RuleOpsHealthPanel from "./RuleOpsHealthPanel";
import { RuleFilters } from "./RuleFilters";
import RuleSuggestionLab from "./RuleSuggestionLab";
import { RulesList } from "./RulesList";
import RulesStarterTemplates from "./RulesStarterTemplates";
import { RulesSummary } from "./RulesSummary";
import type {
  AvailableProductOption,
  RuleConditionCatalog,
  RuleConditionItem,
  RuleConditionOption,
  RuleConditionType,
  RuleDraftPrefill,
  RuleListItem,
  RuleScopeKind,
  RuleSeverity,
  RuleSuggestionConfidence,
  RuleSuggestionEvidenceItem,
  RuleSuggestionExcerptItem,
  RuleSuggestionItem,
  RuleSuggestionSourceSummary,
  RuleType,
} from "./types";

type RulesPageProps = {
  searchParams?: Promise<{
    q?: string;
    ruleType?: string;
    severity?: string;
    scope?: string;
    saved?: string;
    created?: string;
    updated?: string;
    ruleAction?: string;
    ruleCode?: string;
    suggestSourceProductId?: string;
    draftOpen?: string;
    draftSourceProductId?: string;
    draftTargetProductId?: string;
    draftRuleType?: string;
    draftSeverity?: string;
    draftPriority?: string;
    draftMessage?: string;
    draftConditions?: string;
  }>;
};

type ConditionLookups = {
  catalog: RuleConditionCatalog;
  labels: Record<RuleConditionType, Map<string, string>>;
};

type ProductDocumentSignal = {
  type: string;
  title: string;
  note: string | null;
};

type ProductSpecSignal = {
  specKey: string;
  specValue: number;
  unit: string | null;
};

type ProductScenarioSignal = {
  slug: string;
  suitabilityScore: number;
};

type ProductKnowledgeItem = AvailableProductOption & {
  categoryName: string;
  powerDrawWatts: number;
  powerSupplyWatts: number;
  shortDescription: string | null;
  description: string | null;
  documents: ProductDocumentSignal[];
  specs: ProductSpecSignal[];
  scenarios: ProductScenarioSignal[];
  keywordCorpus: string;
};

type SourceAiChunkItem = {
  documentId: string;
  documentTitle: string;
  docType: string;
  chunkIndex: number;
  pageNumber: number | null;
  contentText: string;
  contentTextLower: string;
};

type SourceAiEvidence = {
  summary: RuleSuggestionSourceSummary;
  chunks: SourceAiChunkItem[];
};

const PROVIDER_KEYWORDS = [
  "inverter",
  "charger",
  "power",
  "battery",
  "akü",
  "aku",
  "alternator",
  "regulator",
  "converter",
  "mppt",
  "dc-dc",
  "dcdc",
];

const LOAD_KEYWORDS = [
  "clima",
  "air",
  "klima",
  "fridge",
  "buzdolabı",
  "heater",
  "ısıtıcı",
  "isitici",
  "fan",
  "pump",
  "pompa",
  "light",
  "led",
  "socket",
  "coffee",
  "induction",
  "ocak",
];

const TECHNICAL_MATCH_KEYWORDS = [
  "volt",
  "voltage",
  "watt",
  "power",
  "inverter",
  "battery",
  "akü",
  "aku",
  "charger",
  "current",
  "amp",
  "dc",
  "ac",
  "fuse",
  "sigorta",
  "installation",
  "mounting",
];

const VOLTAGE_SPEC_ALIASES = [
  "voltage",
  "volt",
  "nominal_voltage",
  "system_voltage",
  "input_voltage",
  "output_voltage",
  "operating_voltage",
];

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLooseText(...values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function getKeywordHits(text: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => {
    return text.includes(keyword) ? count + 1 : count;
  }, 0);
}

function getConditionFallbackLabel(
  conditionType: RuleConditionType,
  targetId: string,
) {
  switch (conditionType) {
    case "model":
      return `Model · ${targetId}`;
    case "package":
      return `Paket · ${targetId}`;
    case "scenario":
      return `Senaryo · ${targetId}`;
    default:
      return targetId;
  }
}

function extractSpecValue(
  specs: ProductSpecSignal[],
  aliases: string[],
): number | null {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());

  const matches = specs
    .filter((spec) => {
      const normalizedKey = spec.specKey
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      return normalizedAliases.some((alias) => normalizedKey.includes(alias));
    })
    .map((spec) => spec.specValue)
    .filter((value) => Number.isFinite(value));

  if (matches.length === 0) {
    return null;
  }

  return Math.max(...matches);
}

function getDocumentCoverageScore(documents: ProductDocumentSignal[]) {
  return unique(
    documents
      .map((document) => document.type.toLowerCase().trim())
      .filter(Boolean),
  ).length;
}

function buildScenarioConditions(sharedScenarioSlugs: string[]): RuleConditionItem[] {
  return sharedScenarioSlugs.slice(0, 2).map((slug) => ({
    conditionType: "scenario" as const,
    targetId: slug,
    label: slug,
  }));
}

function buildConfidence(score: number): RuleSuggestionConfidence {
  if (score >= 34) {
    return "high";
  }

  if (score >= 24) {
    return "medium";
  }

  return "low";
}

function parseRuleType(value?: string): RuleType | null {
  if (
    value === "requires" ||
    value === "excludes" ||
    value === "recommends"
  ) {
    return value;
  }

  return null;
}

function parseSeverity(value?: string): RuleSeverity | null {
  if (value === "hard_block" || value === "soft_warning") {
    return value;
  }

  return null;
}

function parseDraftConditions(value?: string) {
  if (!value) {
    return [] as Array<{
      conditionType: RuleConditionType;
      targetId: string;
    }>;
  }

  return value
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawType, ...targetParts] = entry.split(":");
      const targetId = targetParts.join(":").trim();

      if (
        (rawType !== "model" &&
          rawType !== "package" &&
          rawType !== "scenario") ||
        !targetId
      ) {
        return null;
      }

      return {
        conditionType: rawType as RuleConditionType,
        targetId,
      };
    })
    .filter(
      (
        value,
      ): value is { conditionType: RuleConditionType; targetId: string } =>
        Boolean(value),
    );
}

function normalizeRuleType(value?: string) {
  if (
    value === "requires" ||
    value === "excludes" ||
    value === "recommends"
  ) {
    return value;
  }

  return "all";
}

function normalizeSeverity(value?: string) {
  if (value === "hard_block" || value === "soft_warning") {
    return value;
  }

  return "all";
}

function normalizeScope(value?: string) {
  if (value === "global" || value === "conditional") {
    return value;
  }

  return "all";
}

function getFlashMessage(params: Awaited<RulesPageProps["searchParams"]>) {
  if (params?.saved && params?.created) {
    return "Kural kaydı oluşturuldu.";
  }

  if (params?.saved && params?.updated) {
    return "Kural kaydı güncellendi.";
  }

  if (params?.ruleAction === "deleted") {
    return "Kural kaydı kaldırıldı.";
  }

  if (params?.ruleAction === "error") {
    switch (params.ruleCode) {
      case "invalid-id":
        return "Geçersiz kural işlemi isteği alındı.";
      case "delete-failed":
        return "Kural kaldırılırken beklenmeyen bir hata oluştu.";
      default:
        return "Kural işlemi sırasında beklenmeyen bir hata oluştu.";
    }
  }

  return null;
}

function getTopDensity(
  rules: RuleListItem[],
  key: "sourceProductLabel" | "targetProductLabel",
) {
  const counts = new Map<string, number>();

  for (const rule of rules) {
    const label = rule[key];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  let winnerLabel: string | null = null;
  let winnerCount = 0;

  for (const [label, count] of counts.entries()) {
    if (count > winnerCount) {
      winnerLabel = label;
      winnerCount = count;
      continue;
    }

    if (
      count === winnerCount &&
      winnerLabel &&
      label.localeCompare(winnerLabel, "tr") < 0
    ) {
      winnerLabel = label;
    }
  }

  return {
    label: winnerLabel,
    count: winnerCount,
  };
}

function tokenizeForMatch(...values: Array<string | null | undefined>) {
  const combined = values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü]+/gi, " ");

  return unique(
    combined
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function buildExcerpt(text: string, tokens: string[]) {
  const lower = text.toLowerCase();
  const firstMatchedToken = tokens.find((token) => lower.includes(token));

  if (!firstMatchedToken) {
    return text.length > 220 ? `${text.slice(0, 220)}…` : text;
  }

  const position = lower.indexOf(firstMatchedToken);
  const start = Math.max(0, position - 80);
  const end = Math.min(text.length, position + 180);
  const excerpt = text.slice(start, end).trim();

  if (start > 0 && end < text.length) {
    return `…${excerpt}…`;
  }

  if (start > 0) {
    return `…${excerpt}`;
  }

  if (end < text.length) {
    return `${excerpt}…`;
  }

  return excerpt;
}

function getTopEvidenceExcerpts(
  chunks: SourceAiChunkItem[],
  target: ProductKnowledgeItem,
): RuleSuggestionExcerptItem[] {
  if (chunks.length === 0) {
    return [];
  }

  const targetTokens = tokenizeForMatch(
    target.name,
    target.slug,
    target.categoryName,
    target.shortDescription,
    target.description,
  );

  const ranked = chunks
    .map((chunk) => {
      let matchScore = 0;

      for (const token of targetTokens) {
        if (chunk.contentTextLower.includes(token)) {
          matchScore += token.length > 5 ? 3 : 2;
        }
      }

      for (const keyword of TECHNICAL_MATCH_KEYWORDS) {
        if (chunk.contentTextLower.includes(keyword)) {
          matchScore += 1;
        }
      }

      return {
        chunk,
        matchScore,
      };
    })
    .filter((item) => item.matchScore >= 3)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 2)
    .map(({ chunk, matchScore }) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      docType: chunk.docType,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      excerpt: buildExcerpt(chunk.contentText, targetTokens),
      matchScore,
    }));

  return ranked;
}

function serializeConditionSignature(conditions: RuleConditionItem[]) {
  if (conditions.length === 0) {
    return "__global__";
  }

  return conditions
    .map((condition) => `${condition.conditionType}:${condition.targetId}`)
    .sort((a, b) => a.localeCompare(b, "tr"))
    .join("|");
}

function isStrongSuggestion(item: RuleSuggestionItem & { score: number }) {
  const hasChunkEvidence = item.evidence.some(
    (evidence) => evidence.kind === "chunk",
  );
  const hasScenarioCondition = item.conditions.some(
    (condition) => condition.conditionType === "scenario",
  );

  return item.score >= 24 || hasChunkEvidence || hasScenarioCondition;
}

async function getConditionLookupsSafely(): Promise<ConditionLookups> {
  const emptyCatalog: RuleConditionCatalog = {
    modelOptions: [],
    packageOptions: [],
    scenarioOptions: [],
  };

  if (!db) {
    return {
      catalog: emptyCatalog,
      labels: {
        model: new Map(),
        package: new Map(),
        scenario: new Map(),
      },
    };
  }

  try {
    const [modelRows, packageRows, scenarioRows] = await Promise.all([
      db
        .select({
          id: models.id,
          slug: models.slug,
          status: models.status,
        })
        .from(models)
        .orderBy(asc(models.slug)),
      db
        .select({
          id: packages.id,
          name: packages.name,
          slug: packages.slug,
          modelId: packages.modelId,
        })
        .from(packages)
        .orderBy(asc(packages.name), asc(packages.slug)),
      db
        .select({
          scenarioSlug: scenarioMappings.scenarioSlug,
        })
        .from(scenarioMappings)
        .orderBy(asc(scenarioMappings.scenarioSlug)),
    ]);

    const modelOptions: RuleConditionOption[] = modelRows.map((item) => ({
      id: item.id,
      label: item.slug,
      description: item.status === "archived" ? "Arşiv model" : "Model",
    }));

    const modelLabelMap = new Map(
      modelOptions.map((option) => [option.id, option.label]),
    );

    const packageOptions: RuleConditionOption[] = packageRows.map((item) => {
      const modelLabel = item.modelId ? modelLabelMap.get(item.modelId) : null;

      return {
        id: item.id,
        label: modelLabel
          ? `${item.name} · ${item.slug} · ${modelLabel}`
          : `${item.name} · ${item.slug}`,
        description: modelLabel ? `Model: ${modelLabel}` : "Paket",
      };
    });

    const seenScenarioSlugs = new Set<string>();
    const scenarioOptions: RuleConditionOption[] = [];

    for (const row of scenarioRows) {
      const slug = row.scenarioSlug.trim();

      if (!slug || seenScenarioSlugs.has(slug)) {
        continue;
      }

      seenScenarioSlugs.add(slug);
      scenarioOptions.push({
        id: slug,
        label: slug,
        description: "Senaryo",
      });
    }

    return {
      catalog: {
        modelOptions,
        packageOptions,
        scenarioOptions,
      },
      labels: {
        model: new Map(modelOptions.map((option) => [option.id, option.label])),
        package: new Map(
          packageOptions.map((option) => [option.id, option.label]),
        ),
        scenario: new Map(
          scenarioOptions.map((option) => [option.id, option.label]),
        ),
      },
    };
  } catch (error) {
    console.error("Rules condition lookups fetch error:", error);

    return {
      catalog: emptyCatalog,
      labels: {
        model: new Map(),
        package: new Map(),
        scenario: new Map(),
      },
    };
  }
}

async function getProductsKnowledgeSafely(): Promise<ProductKnowledgeItem[]> {
  if (!db) {
    return [];
  }

  try {
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        status: products.status,
        categoryName: categories.name,
        powerDrawWatts: products.powerDrawWatts,
        powerSupplyWatts: products.powerSupplyWatts,
        shortDescription: products.shortDescription,
        description: products.description,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.name));

    const productIds = productRows.map((row) => row.id);

    const [documentRows, specRows, scenarioRows] =
      productIds.length > 0
        ? await Promise.all([
            db
              .select({
                productId: productDocuments.productId,
                type: productDocuments.type,
                title: productDocuments.title,
                note: productDocuments.note,
              })
              .from(productDocuments)
              .where(inArray(productDocuments.productId, productIds)),
            db
              .select({
                productId: productSpecs.productId,
                specKey: productSpecs.specKey,
                specValue: productSpecs.specValue,
                unit: productSpecs.unit,
              })
              .from(productSpecs)
              .where(inArray(productSpecs.productId, productIds)),
            db
              .select({
                productId: scenarioMappings.productId,
                scenarioSlug: scenarioMappings.scenarioSlug,
                suitabilityScore: scenarioMappings.suitabilityScore,
              })
              .from(scenarioMappings)
              .where(inArray(scenarioMappings.productId, productIds)),
          ])
        : [[], [], []];

    const docsByProductId = new Map<string, ProductDocumentSignal[]>();
    const specsByProductId = new Map<string, ProductSpecSignal[]>();
    const scenariosByProductId = new Map<string, ProductScenarioSignal[]>();

    for (const row of documentRows) {
      const current = docsByProductId.get(row.productId) ?? [];
      current.push({
        type: row.type,
        title: row.title,
        note: row.note,
      });
      docsByProductId.set(row.productId, current);
    }

    for (const row of specRows) {
      const current = specsByProductId.get(row.productId) ?? [];
      current.push({
        specKey: row.specKey,
        specValue: safeNumber(row.specValue),
        unit: row.unit,
      });
      specsByProductId.set(row.productId, current);
    }

    for (const row of scenarioRows) {
      const current = scenariosByProductId.get(row.productId) ?? [];
      current.push({
        slug: row.scenarioSlug,
        suitabilityScore: row.suitabilityScore,
      });
      scenariosByProductId.set(row.productId, current);
    }

    return productRows.map((row) => {
      const documents = docsByProductId.get(row.id) ?? [];
      const specs = specsByProductId.get(row.id) ?? [];
      const scenarios = scenariosByProductId.get(row.id) ?? [];

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        categoryName: row.categoryName,
        powerDrawWatts: safeNumber(row.powerDrawWatts),
        powerSupplyWatts: safeNumber(row.powerSupplyWatts),
        shortDescription: row.shortDescription,
        description: row.description,
        documents,
        specs,
        scenarios,
        keywordCorpus: normalizeLooseText(
          row.name,
          row.slug,
          row.categoryName,
          row.shortDescription,
          row.description,
          ...documents.flatMap((document) => [
            document.type,
            document.title,
            document.note ?? "",
          ]),
        ),
      };
    });
  } catch (error) {
    console.error("Rules product knowledge fetch error:", error);
    return [];
  }
}

async function getSourceAiEvidenceSafely(
  sourceProductId: string,
): Promise<SourceAiEvidence | null> {
  if (!db || !sourceProductId) {
    return null;
  }

  try {
    const documents = await db
      .select({
        id: aiKnowledgeDocuments.id,
        title: aiKnowledgeDocuments.title,
        docType: aiKnowledgeDocuments.docType,
        parsingStatus: aiKnowledgeDocuments.parsingStatus,
      })
      .from(aiKnowledgeDocuments)
      .where(eq(aiKnowledgeDocuments.productId, sourceProductId));

    if (documents.length === 0) {
      return {
        summary: {
          documentCount: 0,
          completedDocumentCount: 0,
          chunkCount: 0,
        },
        chunks: [],
      };
    }

    const completedDocuments = documents.filter(
      (document) => document.parsingStatus === "completed",
    );

    const completedDocumentIds = completedDocuments.map((document) => document.id);

    const chunkRows =
      completedDocumentIds.length > 0
        ? await db
            .select({
              documentId: aiDocumentChunks.documentId,
              chunkIndex: aiDocumentChunks.chunkIndex,
              contentText: aiDocumentChunks.contentText,
              pageNumber: aiDocumentChunks.pageNumber,
            })
            .from(aiDocumentChunks)
            .where(inArray(aiDocumentChunks.documentId, completedDocumentIds))
        : [];

    const documentMap = new Map(
      completedDocuments.map((document) => [document.id, document]),
    );

    const chunks: SourceAiChunkItem[] = [];

    for (const chunk of chunkRows) {
      const document = documentMap.get(chunk.documentId);

      if (!document) {
        continue;
      }

      chunks.push({
        documentId: chunk.documentId,
        documentTitle: document.title,
        docType: document.docType,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber ?? null,
        contentText: chunk.contentText,
        contentTextLower: chunk.contentText.toLowerCase(),
      });
    }

    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    return {
      summary: {
        documentCount: documents.length,
        completedDocumentCount: completedDocuments.length,
        chunkCount: chunks.length,
      },
      chunks: chunks.slice(0, 600),
    };
  } catch (error) {
    console.error("Rules AI evidence fetch error:", error);
    return null;
  }
}

async function getRulesSafely(
  productMap: Map<string, AvailableProductOption>,
  conditionLookups: ConditionLookups["labels"],
): Promise<RuleListItem[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
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
      .from(compatibilityRules);

    const ruleIds = rows.map((row) => row.id);

    const conditionRows =
      ruleIds.length > 0
        ? await db
            .select({
              ruleId: ruleConditions.ruleId,
              conditionType: ruleConditions.conditionType,
              targetId: ruleConditions.targetId,
            })
            .from(ruleConditions)
            .where(inArray(ruleConditions.ruleId, ruleIds))
        : [];

    const conditionsByRuleId = new Map<string, RuleConditionItem[]>();

    for (const row of conditionRows) {
      const conditionType = row.conditionType as RuleConditionType;
      const label =
        conditionLookups[conditionType].get(row.targetId) ??
        getConditionFallbackLabel(conditionType, row.targetId);

      const current = conditionsByRuleId.get(row.ruleId) ?? [];
      current.push({
        conditionType,
        targetId: row.targetId,
        label,
      });
      conditionsByRuleId.set(row.ruleId, current);
    }

    for (const list of conditionsByRuleId.values()) {
      list.sort((a, b) => {
        if (a.conditionType !== b.conditionType) {
          return a.conditionType.localeCompare(b.conditionType, "tr");
        }

        return a.label.localeCompare(b.label, "tr");
      });
    }

    return rows
      .map((row) => {
        const source = productMap.get(row.sourceProductId);
        const target = productMap.get(row.targetProductId);
        const conditions = conditionsByRuleId.get(row.id) ?? [];
        const scopeKind: RuleScopeKind =
          conditions.length > 0 ? "conditional" : "global";

        return {
          id: row.id,
          sourceProductId: row.sourceProductId,
          targetProductId: row.targetProductId,
          sourceProductLabel: source?.name ?? row.sourceProductId,
          sourceProductSlug: source?.slug ?? "unknown",
          targetProductLabel: target?.name ?? row.targetProductId,
          targetProductSlug: target?.slug ?? "unknown",
          ruleType: row.ruleType as RuleType,
          severity: row.severity as RuleSeverity,
          priority: row.priority,
          message: row.message,
          createdAt: row.createdAt,
          conditions,
          hasConditions: conditions.length > 0,
          scopeKind,
          conditionCount: conditions.length,
        };
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        if (a.scopeKind !== b.scopeKind) {
          return a.scopeKind === "global" ? -1 : 1;
        }

        return a.sourceProductLabel.localeCompare(b.sourceProductLabel, "tr");
      });
  } catch (error) {
    console.error("Rules fetch error:", error);
    return [];
  }
}

function buildDraftPrefill(
  params: Awaited<RulesPageProps["searchParams"]>,
  conditionLookups: ConditionLookups["labels"],
): RuleDraftPrefill | null {
  const sourceProductId = params?.draftSourceProductId?.trim() ?? "";
  const targetProductId = params?.draftTargetProductId?.trim() ?? "";
  const ruleType = parseRuleType(params?.draftRuleType);
  const severity = parseSeverity(params?.draftSeverity);

  if (!sourceProductId || !targetProductId || !ruleType || !severity) {
    return null;
  }

  const rawPriority = (params?.draftPriority ?? "").trim();
  const parsedPriority = Number.parseInt(rawPriority, 10);
  const priority = Number.isNaN(parsedPriority) ? "10" : String(parsedPriority);

  const parsedConditions = parseDraftConditions(params?.draftConditions).map(
    (condition) => ({
      conditionType: condition.conditionType,
      targetId: condition.targetId,
      label:
        conditionLookups[condition.conditionType].get(condition.targetId) ??
        getConditionFallbackLabel(condition.conditionType, condition.targetId),
    }),
  );

  return {
    sourceProductId,
    targetProductId,
    ruleType,
    severity,
    priority,
    message: params?.draftMessage ?? "",
    conditions: parsedConditions,
  };
}

function buildRuleSuggestions(
  source: ProductKnowledgeItem,
  productsKnowledge: ProductKnowledgeItem[],
  existingDirectionalPairKeys: Set<string>,
  sourceAiEvidence: SourceAiEvidence | null,
): RuleSuggestionItem[] {
  const sourceDocScore = getDocumentCoverageScore(source.documents);
  const sourceVoltage = extractSpecValue(source.specs, VOLTAGE_SPEC_ALIASES);
  const sourceLoadSignal =
    Number(source.powerDrawWatts > 0) +
    getKeywordHits(source.keywordCorpus, LOAD_KEYWORDS);

  const sourceHasSignals =
    source.documents.length > 0 ||
    source.specs.length > 0 ||
    source.scenarios.length > 0 ||
    source.powerDrawWatts > 0 ||
    source.powerSupplyWatts > 0;

  if (!sourceHasSignals) {
    return [];
  }

  const results: Array<RuleSuggestionItem & { score: number }> = [];

  for (const target of productsKnowledge) {
    if (target.id === source.id) {
      continue;
    }

    if (target.status === "archived") {
      continue;
    }

    if (existingDirectionalPairKeys.has(`${source.id}::${target.id}`)) {
      continue;
    }

    const targetDocScore = getDocumentCoverageScore(target.documents);
    const targetVoltage = extractSpecValue(target.specs, VOLTAGE_SPEC_ALIASES);
    const targetProviderSignal =
      Number(target.powerSupplyWatts > 0) +
      getKeywordHits(target.keywordCorpus, PROVIDER_KEYWORDS);

    const sharedScenarios = source.scenarios
      .map((scenario) => scenario.slug)
      .filter((slug) => target.scenarios.some((item) => item.slug === slug));

    const sameVoltage =
      sourceVoltage !== null &&
      targetVoltage !== null &&
      Math.abs(sourceVoltage - targetVoltage) <= 0.75;

    const sharedScenarioConditions = buildScenarioConditions(sharedScenarios);
    const evidenceExcerpts = sourceAiEvidence
      ? getTopEvidenceExcerpts(sourceAiEvidence.chunks, target)
      : [];
    const evidenceChunkBonus = evidenceExcerpts.reduce(
      (sum, item) => sum + Math.min(item.matchScore, 6),
      0,
    );
    const caution =
      evidenceExcerpts.length > 0
        ? "Bu öneri mevcut sinyal skorlamasına ek olarak AI parse edilmiş belge chunk’larıyla desteklendi. Kaydetmeden önce teknik kontrol önerilir."
        : "Bu öneri belge başlığı/notu, spec alanları ve senaryo sinyallerinden üretildi. Kaydetmeden önce teknik kontrol önerilir.";

    let bestCandidate: (RuleSuggestionItem & { score: number }) | null = null;

    if (sharedScenarios.length > 0 && sourceDocScore + targetDocScore >= 2) {
      let score =
        18 +
        sharedScenarios.length * 5 +
        sourceDocScore +
        targetDocScore +
        evidenceChunkBonus;

      const evidence: RuleSuggestionEvidenceItem[] = [
        {
          kind: "scenario",
          label: `Ortak senaryo ${sharedScenarios.slice(0, 2).join(", ")}`,
        },
        {
          kind: "document",
          label: `Kaynak belge tipi ${sourceDocScore}`,
        },
        {
          kind: "document",
          label: `Hedef belge tipi ${targetDocScore}`,
        },
      ];

      if (sameVoltage && sourceVoltage !== null) {
        score += 3;
        evidence.push({
          kind: "spec",
          label: `Voltaj hizası ${formatNumber(sourceVoltage)}V`,
        });
      }

      if (evidenceExcerpts.length > 0) {
        evidence.push({
          kind: "chunk",
          label: `AI kanıt chunk ${evidenceExcerpts.length}`,
        });
      }

      bestCandidate = {
        id: `${source.id}-${target.id}-scenario`,
        sourceProductId: source.id,
        sourceProductLabel: source.name,
        targetProductId: target.id,
        targetProductLabel: target.name,
        targetProductSlug: target.slug,
        ruleType: "recommends",
        severity: "soft_warning",
        priority: 40,
        message: `${source.name} ile ${target.name}, ortak kullanım senaryolarında birlikte önerilebilir.`,
        reason:
          "Senaryo eşleşmesi ve belge kapsaması bu ikili için kontrollü bir öneri ilişkisini destekliyor.",
        confidence: buildConfidence(score),
        conditions: sharedScenarioConditions,
        evidence,
        evidenceExcerpts,
        caution,
        score,
      };
    }

    if (
      sourceLoadSignal >= 1 &&
      targetProviderSignal >= 2 &&
      source.powerDrawWatts > 0 &&
      target.powerSupplyWatts > 0 &&
      target.powerSupplyWatts >= source.powerDrawWatts * 1.2
    ) {
      let score =
        26 +
        Math.min(targetProviderSignal, 4) * 2 +
        Math.min(sourceDocScore + targetDocScore, 4) +
        evidenceChunkBonus;

      const evidence: RuleSuggestionEvidenceItem[] = [
        {
          kind: "power",
          label: `Çekiş ${formatNumber(source.powerDrawWatts)}W`,
        },
        {
          kind: "power",
          label: `Besleme ${formatNumber(target.powerSupplyWatts)}W`,
        },
        {
          kind: "keyword",
          label: `Güç sağlayıcı sinyali ${targetProviderSignal}`,
        },
      ];

      if (sameVoltage && sourceVoltage !== null) {
        score += 6;
        evidence.push({
          kind: "spec",
          label: `Voltaj hizası ${formatNumber(sourceVoltage)}V`,
        });
      }

      if (sharedScenarios.length > 0) {
        score += Math.min(sharedScenarios.length * 2, 4);
        evidence.push({
          kind: "scenario",
          label: `Ortak senaryo ${sharedScenarios.slice(0, 2).join(", ")}`,
        });
      }

      if (evidenceExcerpts.length > 0) {
        evidence.push({
          kind: "chunk",
          label: `AI kanıt chunk ${evidenceExcerpts.length}`,
        });
      }

      const powerCandidate: RuleSuggestionItem & { score: number } = {
        id: `${source.id}-${target.id}-power`,
        sourceProductId: source.id,
        sourceProductLabel: source.name,
        targetProductId: target.id,
        targetProductLabel: target.name,
        targetProductSlug: target.slug,
        ruleType: "requires",
        severity: "soft_warning",
        priority: 18,
        message: `${source.name} için ${target.name}, güç ve belge sinyalleri güçlü bir destek eşleşmesi veriyor.`,
        reason:
          "Kaynak ürünün güç çekişi ile hedef ürünün besleme kapasitesi arasında anlamlı bir destek marjı oluşuyor.",
        confidence: buildConfidence(score),
        conditions: sharedScenarios.length > 0 ? sharedScenarioConditions : [],
        evidence,
        evidenceExcerpts,
        caution,
        score,
      };

      if (!bestCandidate || powerCandidate.score > bestCandidate.score) {
        bestCandidate = powerCandidate;
      }
    }

    if (
      !bestCandidate &&
      sameVoltage &&
      sourceDocScore >= 1 &&
      targetDocScore >= 1
    ) {
      const score = 20 + sourceDocScore + targetDocScore + evidenceChunkBonus;

      const evidence: RuleSuggestionEvidenceItem[] = [
        {
          kind: "spec",
          label: `Voltaj hizası ${formatNumber(sourceVoltage ?? 0)}V`,
        },
        {
          kind: "document",
          label: `Belge kapsaması ${sourceDocScore + targetDocScore}`,
        },
      ];

      if (evidenceExcerpts.length > 0) {
        evidence.push({
          kind: "chunk",
          label: `AI kanıt chunk ${evidenceExcerpts.length}`,
        });
      }

      bestCandidate = {
        id: `${source.id}-${target.id}-spec`,
        sourceProductId: source.id,
        sourceProductLabel: source.name,
        targetProductId: target.id,
        targetProductLabel: target.name,
        targetProductSlug: target.slug,
        ruleType: "recommends",
        severity: "soft_warning",
        priority: 48,
        message: `${source.name} ile ${target.name}, voltaj/spec hizası nedeniyle teknik incelemeye değer bir eşleşme gösteriyor.`,
        reason:
          "Belge ve spec sinyalleri bu ikiliyi manuel inceleme için öne çıkarıyor.",
        confidence: buildConfidence(score),
        conditions: [],
        evidence,
        evidenceExcerpts,
        caution,
        score,
      };
    }

    if (bestCandidate) {
      results.push(bestCandidate);
    }
  }

  const deduped = new Map<string, RuleSuggestionItem & { score: number }>();

  for (const item of results) {
    const key = [
      item.targetProductId,
      item.ruleType,
      serializeConditionSignature(item.conditions),
    ].join("::");

    const existing = deduped.get(key);

    if (!existing || item.score > existing.score) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values())
    .filter(isStrongSuggestion)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.targetProductLabel.localeCompare(b.targetProductLabel, "tr");
    })
    .slice(0, 6)
    .map(({ score: _score, ...item }) => item);
}

type ConflictPreviewItem = {
  pairLabel: string;
  totalCount: number;
  hasGlobal: boolean;
  hasConditional: boolean;
  ruleTypes: string[];
  severities: string[];
};

function buildConflictPreview(rules: RuleListItem[]): ConflictPreviewItem[] {
  const pairMap = new Map<
    string,
    {
      pairLabel: string;
      totalCount: number;
      hasGlobal: boolean;
      hasConditional: boolean;
      ruleTypes: Set<string>;
      severities: Set<string>;
    }
  >();

  for (const rule of rules) {
    const key = `${rule.sourceProductId}::${rule.targetProductId}`;
    const pairLabel = `${rule.sourceProductLabel} → ${rule.targetProductLabel}`;
    const current =
      pairMap.get(key) ??
      {
        pairLabel,
        totalCount: 0,
        hasGlobal: false,
        hasConditional: false,
        ruleTypes: new Set<string>(),
        severities: new Set<string>(),
      };

    current.totalCount += 1;
    current.hasGlobal = current.hasGlobal || rule.scopeKind === "global";
    current.hasConditional =
      current.hasConditional || rule.scopeKind === "conditional";
    current.ruleTypes.add(rule.ruleType);
    current.severities.add(rule.severity);

    pairMap.set(key, current);
  }

  return Array.from(pairMap.values())
    .filter((item) => item.totalCount > 1)
    .map((item) => ({
      pairLabel: item.pairLabel,
      totalCount: item.totalCount,
      hasGlobal: item.hasGlobal,
      hasConditional: item.hasConditional,
      ruleTypes: Array.from(item.ruleTypes.values()).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
      severities: Array.from(item.severities.values()).sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }

      if (a.hasGlobal !== b.hasGlobal) {
        return a.hasGlobal ? -1 : 1;
      }

      return a.pairLabel.localeCompare(b.pairLabel, "tr");
    })
    .slice(0, 6);
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);

  const [conditionLookups, productsKnowledge] = await Promise.all([
    getConditionLookupsSafely(),
    getProductsKnowledgeSafely(),
  ]);

  const activeProductsKnowledge = productsKnowledge.filter(
    (product) => product.status !== "archived",
  );

  const availableProducts = activeProductsKnowledge.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
  }));

  const productMap = new Map(
    availableProducts.map((product) => [product.id, product]),
  );

  const allRules = await getRulesSafely(productMap, conditionLookups.labels);

  const draftPrefill = buildDraftPrefill(params, conditionLookups.labels);

  const query = (params.q ?? "").trim().toLowerCase();
  const ruleTypeFilter = normalizeRuleType(params.ruleType);
  const severityFilter = normalizeSeverity(params.severity);
  const scopeFilter = normalizeScope(params.scope);

  const filteredRules = allRules.filter((rule) => {
    const matchesQuery = query
      ? rule.sourceProductLabel.toLowerCase().includes(query) ||
        rule.sourceProductSlug.toLowerCase().includes(query) ||
        rule.targetProductLabel.toLowerCase().includes(query) ||
        rule.targetProductSlug.toLowerCase().includes(query) ||
        (rule.message ?? "").toLowerCase().includes(query) ||
        rule.conditions.some((condition) =>
          condition.label.toLowerCase().includes(query),
        )
      : true;

    const matchesRuleType =
      ruleTypeFilter === "all" ? true : rule.ruleType === ruleTypeFilter;

    const matchesSeverity =
      severityFilter === "all" ? true : rule.severity === severityFilter;

    const matchesScope =
      scopeFilter === "all"
        ? true
        : scopeFilter === "conditional"
          ? rule.scopeKind === "conditional"
          : rule.scopeKind === "global";

    return matchesQuery && matchesRuleType && matchesSeverity && matchesScope;
  });

  const stats = filteredRules.reduce(
    (acc, item) => {
      acc.total += 1;

      if (item.ruleType === "requires") acc.requiresCount += 1;
      if (item.ruleType === "excludes") acc.excludesCount += 1;
      if (item.ruleType === "recommends") acc.recommendsCount += 1;
      if (item.scopeKind === "global") acc.globalCount += 1;
      if (item.scopeKind === "conditional") acc.conditionalCount += 1;

      return acc;
    },
    {
      total: 0,
      requiresCount: 0,
      excludesCount: 0,
      recommendsCount: 0,
      globalCount: 0,
      conditionalCount: 0,
    },
  );

  const suggestionSourceProductId = params.suggestSourceProductId?.trim() ?? "";
  const suggestionSource =
    activeProductsKnowledge.find((product) => product.id === suggestionSourceProductId) ??
    null;

  const sourceAiEvidence = suggestionSource
    ? await getSourceAiEvidenceSafely(suggestionSource.id)
    : null;

  const existingDirectionalPairKeys = new Set(
    allRules.map((rule) => `${rule.sourceProductId}::${rule.targetProductId}`),
  );

  const suggestions: RuleSuggestionItem[] = suggestionSource
    ? buildRuleSuggestions(
        suggestionSource,
        activeProductsKnowledge,
        existingDirectionalPairKeys,
        sourceAiEvidence,
      )
    : [];

  const topSource = getTopDensity(filteredRules, "sourceProductLabel");
  const topTarget = getTopDensity(filteredRules, "targetProductLabel");
  const flashMessage = getFlashMessage(params);

  const productsWithRules = new Set<string>();
  for (const rule of allRules) {
    productsWithRules.add(rule.sourceProductId);
    productsWithRules.add(rule.targetProductId);
  }

  const uncoveredProducts = activeProductsKnowledge.filter(
    (product) => !productsWithRules.has(product.id),
  );

  const sourceReadyProducts = activeProductsKnowledge.filter(
    (product) =>
      product.documents.length > 0 ||
      product.specs.length > 0 ||
      product.scenarios.length > 0 ||
      product.powerDrawWatts > 0 ||
      product.powerSupplyWatts > 0,
  );

  const productsWithSourceRules = new Set(
    allRules.map((rule) => rule.sourceProductId),
  );

  const sourceReadyUnruledCount = sourceReadyProducts.filter(
    (product) => !productsWithSourceRules.has(product.id),
  ).length;

  const highConfidenceSuggestionCount = suggestions.filter(
    (item) => item.confidence === "high",
  ).length;

  const conflictPreview = buildConflictPreview(allRules);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Rules
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Kural Motoru
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
              Ürünler arası requires, excludes ve recommends kurallarını kompakt
              ve operasyonel biçimde yönet.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Suggestion lab yalnızca yeterli sinyal ve/veya kanıt üreten
              önerileri gösterir. Öneriler doğrudan kaydolmaz; drawer içinde
              admin onayıyla finalize edilir.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AddRuleDrawer
            availableProducts={availableProducts}
            conditionCatalog={conditionLookups.catalog}
            disabled={!databaseReady}
            prefillDraft={draftPrefill}
            forceOpen={Boolean(draftPrefill && params.draftOpen === "1")}
          />
        </div>
      </div>

      {!databaseReady ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
          Veritabanı yapılandırılmadığı için kayıt işlemleri pasif durumda.
        </div>
      ) : null}

      {flashMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {flashMessage}
        </div>
      ) : null}

      <RulesStarterTemplates productsKnowledge={activeProductsKnowledge} />

      <RuleSuggestionLab
        availableProducts={availableProducts}
        selectedSourceProductId={suggestionSourceProductId}
        selectedSourceLabel={suggestionSource?.name ?? null}
        suggestions={suggestions}
        sourceSummary={sourceAiEvidence?.summary ?? null}
      />

      <RulesSummary
        total={stats.total}
        requiresCount={stats.requiresCount}
        excludesCount={stats.excludesCount}
        recommendsCount={stats.recommendsCount}
        globalCount={stats.globalCount}
        conditionalCount={stats.conditionalCount}
        topSourceLabel={topSource.label}
        topSourceCount={topSource.count}
        topTargetLabel={topTarget.label}
        topTargetCount={topTarget.count}
      />

      <RuleOpsHealthPanel
        totalProducts={activeProductsKnowledge.length}
        coveredProductCount={activeProductsKnowledge.length - uncoveredProducts.length}
        uncoveredProductNames={uncoveredProducts.map((product) => product.name)}
        sourceReadyProductCount={sourceReadyProducts.length}
        sourceReadyUnruledCount={sourceReadyUnruledCount}
        pendingSuggestionCount={suggestions.length}
        highConfidenceSuggestionCount={highConfidenceSuggestionCount}
        globalRuleCount={stats.globalCount}
        conditionalRuleCount={stats.conditionalCount}
        conflictPreview={conflictPreview}
      />

      <RuleFilters
        query={params.q ?? ""}
        ruleType={ruleTypeFilter}
        severity={severityFilter}
        scope={scopeFilter}
      />

      <RulesList
        rules={filteredRules}
        availableProducts={availableProducts}
        conditionCatalog={conditionLookups.catalog}
        databaseReady={databaseReady}
      />
    </div>
  );
}