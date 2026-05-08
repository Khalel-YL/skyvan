import "server-only";

import { asc, count, desc, eq, inArray } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import {
  aiDocumentChunks,
  aiKnowledgeDocuments,
  compatibilityRules,
  products,
  ruleConditions,
} from "@/db/schema";

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type DatasheetParsingStatus = "pending" | "processing" | "completed" | "failed";
export type AiKnowledgeApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "revoked";
export type PagePublishTransition = "publish" | "rollback";
export type AiKnowledgeUsageRecord = {
  id: string;
  productId: string | null;
  title: string;
  docType: string;
  parsingStatus: DatasheetParsingStatus;
  approvalStatus: AiKnowledgeApprovalStatus;
  s3Key: string;
  createdAt: Date;
  updatedAt: Date;
  chunkCount: number;
  hasMissingProductReference: boolean;
  readiness: ReturnType<typeof getAiKnowledgeReadiness>;
};
export type AiGroundedChunkRecord = {
  id: string;
  documentId: string;
  productId: string | null;
  title: string;
  docType: string;
  chunkIndex: number;
  contentText: string;
  pageNumber: number | null;
  tokenCount: number;
};
export type AiEvidenceTextQuality = {
  readable: boolean;
  reason: string | null;
  metrics: {
    length: number;
    replacementRatio: number;
    controlRatio: number;
    alphaRatio: number;
    wordCount: number;
    hasPdfHeader: boolean;
  };
};
export type ProductGroundedExplanation = {
  available: boolean;
  note: string;
  preview: string | null;
  eligibleKnowledgeCount: number;
  groundedChunkCount: number;
  contributingDocTypes: string[];
  coverageLabel: string | null;
  readinessReason: string;
  approvalStatusCounts: Record<AiKnowledgeApprovalStatus, number>;
  ruleAlignmentStatus: "rule-aligned" | "rule-signal-missing" | "rule-review-needed" | null;
  ruleAlignmentReason: string | null;
  sourceRuleCount: number;
  ruleConflictCount: number;
};
export type ProductAiDecisionSignal = {
  status: "ready" | "warning" | "blocker";
  reason: string;
  groundedAvailable: boolean;
  coverageLabel: string | null;
  ruleAlignmentStatus: ProductGroundedExplanation["ruleAlignmentStatus"];
  ruleConflictCount: number;
};
export type ProductWorkshopAiDecisionContext = {
  productId: string;
  status: ProductAiDecisionSignal["status"];
  reason: string;
  groundedAvailable: boolean;
  coverageLabel: ProductAiDecisionSignal["coverageLabel"];
  ruleAlignmentStatus: ProductAiDecisionSignal["ruleAlignmentStatus"];
  ruleConflictCount: ProductAiDecisionSignal["ruleConflictCount"];
};
export type ProductSelectionAiDecisionAggregate = {
  status: ProductAiDecisionSignal["status"];
  reason: string;
  totalProducts: number;
  readyCount: number;
  warningCount: number;
  blockerCount: number;
};
export type ProductSelectionAiDecisionBundle = {
  aggregate: ProductSelectionAiDecisionAggregate;
  products: ProductWorkshopAiDecisionContext[];
};

type TruthyValue = "1" | "true" | "yes" | "on";

const TRUTHY_VALUES = new Set<TruthyValue>(["1", "true", "yes", "on"]);
const COMPLETED_DATASET_STATUS: DatasheetParsingStatus = "completed";
const APPROVAL_STATUSES: AiKnowledgeApprovalStatus[] = [
  "pending_review",
  "approved",
  "rejected",
  "revoked",
];
const AI_TEXT_QUALITY_CANDIDATE_CAP = 50;
const TURKISH_LATIN_ALPHA_PATTERN = /[a-zA-ZçğıöşüÇĞİÖŞÜ]/g;
const TURKISH_LATIN_WORD_PATTERN = /[a-zA-ZçğıöşüÇĞİÖŞÜ]{2,}/g;

export function getAiEvidenceTextQuality(text: string): AiEvidenceTextQuality {
  const normalizedText = String(text ?? "");
  const length = normalizedText.length;
  const hasPdfHeader = normalizedText.slice(0, 120).includes("%PDF-");
  const replacementCount = (normalizedText.match(/\uFFFD/g) ?? []).length;
  let controlCount = 0;

  for (const character of normalizedText) {
    const code = character.charCodeAt(0);
    const isNormalWhitespace = character === "\n" || character === "\r" || character === "\t";

    if (!isNormalWhitespace && ((code >= 0 && code <= 31) || code === 127)) {
      controlCount += 1;
    }
  }

  const alphaCount = (normalizedText.match(TURKISH_LATIN_ALPHA_PATTERN) ?? [])
    .length;
  const wordCount = (normalizedText.match(TURKISH_LATIN_WORD_PATTERN) ?? [])
    .length;
  const replacementRatio = length > 0 ? replacementCount / length : 0;
  const controlRatio = length > 0 ? controlCount / length : 0;
  const alphaRatio = length > 0 ? alphaCount / length : 0;
  let reason: string | null = null;

  if (hasPdfHeader) {
    reason = "PDF ikili verisi metin olarak görünüyor.";
  } else if (replacementRatio > 0.02) {
    reason = "Metin çok fazla bozuk karakter içeriyor.";
  } else if (controlRatio > 0.05) {
    reason = "Metin çok fazla kontrol karakteri içeriyor.";
  } else if (length > 0 && alphaRatio < 0.2) {
    reason = "Metin okunabilir harf oranı düşük.";
  } else if (wordCount < 20 && alphaRatio < 0.35) {
    reason = "Metin okunabilir kelime üretmiyor.";
  }

  return {
    readable: reason === null,
    reason,
    metrics: {
      length,
      replacementRatio,
      controlRatio,
      alphaRatio,
      wordCount,
      hasPdfHeader,
    },
  };
}

export function isReadableAiEvidenceText(text: string) {
  return getAiEvidenceTextQuality(text).readable;
}
const CRITICAL_OFFER_STATUSES = new Set<OfferStatus>([
  "accepted",
  "rejected",
  "expired",
]);

const GOVERNANCE_ENV = {
  auditActorId: "SKYVAN_ADMIN_AUDIT_USER_ID",
  allowCriticalOfferStatusTransitions: "SKYVAN_ALLOW_CRITICAL_OFFER_STATUS_CHANGE",
  allowDirectPublishWithoutSeo: "SKYVAN_ALLOW_DIRECT_PUBLISH_WITHOUT_SEO",
  allowManualAiReadyStatus: "SKYVAN_ALLOW_MANUAL_AI_READY_STATUS",
} as const;

function readBooleanEnv(name: string, fallback = false) {
  const rawValue = String(process.env[name] ?? "")
    .trim()
    .toLowerCase();

  if (!rawValue) {
    return fallback;
  }

  return TRUTHY_VALUES.has(rawValue as TruthyValue);
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeGroundedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildGroundedPreviewFromChunks(chunks: AiGroundedChunkRecord[]) {
  const parts: string[] = [];

  for (const chunk of chunks) {
    const sentences = normalizeGroundedText(chunk.contentText)
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 24);

    for (const sentence of sentences) {
      if (parts.length >= 2) {
        break;
      }

      parts.push(sentence);
    }

    if (parts.length >= 2) {
      break;
    }
  }

  if (!parts.length) {
    return null;
  }

  const preview = parts.join(" ");

  return preview.length <= 280 ? preview : `${preview.slice(0, 277)}...`;
}

function getGroundedCoverageLabel(input: {
  eligibleKnowledgeCount: number;
  groundedChunkCount: number;
}) {
  if (input.groundedChunkCount >= 4 && input.eligibleKnowledgeCount >= 2) {
    return "Güçlü kapsam";
  }

  if (input.groundedChunkCount >= 2) {
    return "Temel kapsam";
  }

  return "Dar kapsam";
}

function getApprovalStatusCounts(records: AiKnowledgeUsageRecord[]) {
  const counts: Record<AiKnowledgeApprovalStatus, number> = {
    pending_review: 0,
    approved: 0,
    rejected: 0,
    revoked: 0,
  };

  for (const record of records) {
    if (APPROVAL_STATUSES.includes(record.approvalStatus)) {
      counts[record.approvalStatus] += 1;
    } else {
      counts.pending_review += 1;
    }
  }

  return counts;
}

async function getProductRuleAlignment(input: { productId: string }) {
  const db = getDbOrThrow();

  const sourceRules = await db
    .select({
      id: compatibilityRules.id,
      targetProductId: compatibilityRules.targetProductId,
      ruleType: compatibilityRules.ruleType,
      severity: compatibilityRules.severity,
    })
    .from(compatibilityRules)
    .where(eq(compatibilityRules.sourceProductId, input.productId));

  if (!sourceRules.length) {
    return {
      ruleAlignmentStatus: "rule-signal-missing" as const,
      ruleAlignmentReason: "Grounded bilgi var, ancak bu ürün için kaynak rule sinyali görünmüyor.",
      sourceRuleCount: 0,
      ruleConflictCount: 0,
    };
  }

  const conditionRows = await db
    .select({
      ruleId: ruleConditions.ruleId,
    })
    .from(ruleConditions)
    .where(
      inArray(
        ruleConditions.ruleId,
        sourceRules.map((rule) => rule.id),
      ),
    );

  const conditionalRuleIds = new Set(conditionRows.map((row) => row.ruleId));
  const pairMap = new Map<
    string,
    {
      totalCount: number;
      hasGlobal: boolean;
      hasConditional: boolean;
    }
  >();

  for (const rule of sourceRules) {
    const current =
      pairMap.get(rule.targetProductId) ?? {
        totalCount: 0,
        hasGlobal: false,
        hasConditional: false,
      };

    current.totalCount += 1;
    if (conditionalRuleIds.has(rule.id)) {
      current.hasConditional = true;
    } else {
      current.hasGlobal = true;
    }

    pairMap.set(rule.targetProductId, current);
  }

  const conflictingPairs = Array.from(pairMap.values()).filter(
    (item) => item.totalCount > 1,
  );

  if (conflictingPairs.length > 0) {
    const hasMixedScopeConflict = conflictingPairs.some(
      (item) => item.hasGlobal && item.hasConditional,
    );

    return {
      ruleAlignmentStatus: "rule-review-needed" as const,
      ruleAlignmentReason: hasMixedScopeConflict
        ? "Aynı hedef için global ve koşullu rule birlikte görünüyor."
        : "Aynı hedef ürün için birden fazla kaynak rule kaydı görünüyor.",
      sourceRuleCount: sourceRules.length,
      ruleConflictCount: conflictingPairs.length,
    };
  }

  return {
    ruleAlignmentStatus: "rule-aligned" as const,
    ruleAlignmentReason: "Grounded açıklama mevcut ve ürün için kaynak rule sinyali görünür.",
    sourceRuleCount: sourceRules.length,
    ruleConflictCount: 0,
  };
}

export function getGovernanceRuntime() {
  const auditActorId = String(process.env[GOVERNANCE_ENV.auditActorId] ?? "").trim();

  return {
    auditActorId,
    hasAuditActor: Boolean(auditActorId),
    allowCriticalOfferStatusTransitions: readBooleanEnv(
      GOVERNANCE_ENV.allowCriticalOfferStatusTransitions,
      false,
    ),
    allowDirectPublishWithoutSeo: readBooleanEnv(
      GOVERNANCE_ENV.allowDirectPublishWithoutSeo,
      false,
    ),
    allowManualAiReadyStatus: readBooleanEnv(
      GOVERNANCE_ENV.allowManualAiReadyStatus,
      false,
    ),
  };
}

export function isCriticalOfferStatus(status: OfferStatus) {
  return CRITICAL_OFFER_STATUSES.has(status);
}

export function getOfferMutationBlocker(input: {
  previousStatus?: OfferStatus | null;
  nextStatus: OfferStatus;
}) {
  const runtime = getGovernanceRuntime();
  const previousStatus = input.previousStatus ?? null;
  const touchesCriticalStatus =
    previousStatus !== input.nextStatus &&
    (isCriticalOfferStatus(input.nextStatus) ||
      (previousStatus !== null && isCriticalOfferStatus(previousStatus)));

  if (touchesCriticalStatus && !runtime.allowCriticalOfferStatusTransitions) {
    return (
      "Kritik teklif durum geçişleri (accepted / rejected / expired) governance kilidi altındadır. " +
      "Bu geçiş için SKYVAN_ALLOW_CRITICAL_OFFER_STATUS_CHANGE=true gerekir."
    );
  }

  return null;
}

export function getPagePublishBlockers(input: {
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  hasBlocks: boolean;
  isPublished: boolean;
}) {
  if (!input.isPublished) {
    return [];
  }

  const runtime = getGovernanceRuntime();
  const blockers: string[] = [];

  if (!input.title.trim()) {
    blockers.push("Yayına çıkacak page için başlık zorunludur.");
  }

  if (!input.slug.trim()) {
    blockers.push("Yayına çıkacak page için slug zorunludur.");
  }

  if (!input.hasBlocks) {
    blockers.push("Yayına çıkacak page en az bir içerik bloğu içermelidir.");
  }

  if (!runtime.allowDirectPublishWithoutSeo) {
    if (!input.seoTitle.trim()) {
      blockers.push("Yayına çıkacak page için SEO başlığı zorunludur.");
    }

    if (!input.seoDescription.trim()) {
      blockers.push("Yayına çıkacak page için SEO açıklaması zorunludur.");
    }
  }

  return blockers;
}

export function getPagePublishTransition(input: {
  previousIsPublished: boolean;
  nextIsPublished: boolean;
}): PagePublishTransition | null {
  if (!input.previousIsPublished && input.nextIsPublished) {
    return "publish";
  }

  if (input.previousIsPublished && !input.nextIsPublished) {
    return "rollback";
  }

  return null;
}

export function getMediaGuardrailBlockers(input: {
  imageUrl: string;
  fileName: string;
  tags: string[];
}) {
  const blockers: string[] = [];

  if (!input.fileName.trim()) {
    blockers.push("Medya kaydı için dosya adı zorunludur.");
  }

  if (!input.imageUrl.trim()) {
    blockers.push("Medya kaydı için görsel URL zorunludur.");
  } else if (!isSafeHttpUrl(input.imageUrl)) {
    blockers.push("Medya URL yalnızca http / https olmalıdır.");
  }

  if (input.tags.length === 0) {
    blockers.push("Medya kaydı en az bir etiket içermelidir.");
  }

  return blockers;
}

export function getDatasheetGuardrailBlockers(input: {
  title: string;
  productId: string;
  docType: string;
  parsingStatus: DatasheetParsingStatus;
  previousParsingStatus?: DatasheetParsingStatus | null;
  s3Key: string;
}) {
  const blockers: string[] = [];
  const runtime = getGovernanceRuntime();
  const previousParsingStatus = input.previousParsingStatus ?? null;
  const touchesCompletedBoundary =
    previousParsingStatus !== input.parsingStatus &&
    (input.parsingStatus === COMPLETED_DATASET_STATUS ||
      previousParsingStatus === COMPLETED_DATASET_STATUS);

  if (touchesCompletedBoundary && !runtime.allowManualAiReadyStatus) {
    blockers.push(
      "Tamamlandı sınırına dokunan belge geçişleri yönetişim kilidi altındadır. " +
        "Bu geçiş için SKYVAN_ALLOW_MANUAL_AI_READY_STATUS=true gerekir.",
    );
  }

  if (input.parsingStatus === COMPLETED_DATASET_STATUS) {
    if (!input.title.trim()) {
      blockers.push("Tamamlandı olacak belge için başlık zorunludur.");
    }

    if (!input.s3Key.trim()) {
      blockers.push("Tamamlandı olacak belge için depolama anahtarı zorunludur.");
    }

    if (input.docType !== "rulebook" && !input.productId.trim()) {
      blockers.push(
        "Kural kitabı dışındaki tamamlanmış belgeler bir ürüne bağlanmalıdır.",
      );
    }
  }

  return blockers;
}

export function getAiKnowledgeReadiness(input: {
  docType?: string;
  productId?: string | null;
  parsingStatus: DatasheetParsingStatus;
  approvalStatus: AiKnowledgeApprovalStatus;
  title: string;
  s3Key: string;
  chunkCount: number;
}) {
  const technicalBlockers: string[] = [];
  const approvalBlockers: string[] = [];

  if (input.parsingStatus !== COMPLETED_DATASET_STATUS) {
    technicalBlockers.push("Belge henüz tamamlandı seviyesinde değil.");
  }

  if (!input.title.trim()) {
    technicalBlockers.push("Belge başlığı eksik.");
  }

  if (!input.s3Key.trim()) {
    technicalBlockers.push("Belge depo anahtarı eksik.");
  }

  if (input.docType && input.docType !== "rulebook" && !String(input.productId ?? "").trim()) {
    technicalBlockers.push(
      "Kural kitabı dışındaki bilgi kayıtları bir ürüne bağlanmalıdır.",
    );
  }

  if (input.chunkCount <= 0) {
    technicalBlockers.push("Belge chunk üretmemiş.");
  }

  if (input.approvalStatus !== "approved") {
    approvalBlockers.push("İnsan onayı bekleniyor.");
  }

  const technicallyReady = technicalBlockers.length === 0;
  const approvedForAi = technicallyReady && approvalBlockers.length === 0;

  return {
    technicallyReady,
    technicalBlockers,
    approvalStatus: input.approvalStatus,
    approvalBlockers,
    approvedForAi,
    blockers: [...technicalBlockers, ...approvalBlockers],
  };
}

export async function getAiUsageKnowledgeRecords(input?: {
  productId?: string | null;
}): Promise<AiKnowledgeUsageRecord[]> {
  const db = getDbOrThrow();
  const normalizedProductId = String(input?.productId ?? "").trim();

  const documents = normalizedProductId
    ? await db
        .select({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          approvalStatus: aiKnowledgeDocuments.approvalStatus,
          s3Key: aiKnowledgeDocuments.s3Key,
          createdAt: aiKnowledgeDocuments.createdAt,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        })
        .from(aiKnowledgeDocuments)
        .where(eq(aiKnowledgeDocuments.productId, normalizedProductId))
        .orderBy(
          desc(aiKnowledgeDocuments.updatedAt),
          desc(aiKnowledgeDocuments.createdAt),
        )
    : await db
        .select({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          approvalStatus: aiKnowledgeDocuments.approvalStatus,
          s3Key: aiKnowledgeDocuments.s3Key,
          createdAt: aiKnowledgeDocuments.createdAt,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        })
        .from(aiKnowledgeDocuments)
        .orderBy(
          desc(aiKnowledgeDocuments.updatedAt),
          desc(aiKnowledgeDocuments.createdAt),
        );

  if (!documents.length) {
    return [];
  }

  const [chunkRows, productRows] = await Promise.all([
    db
      .select({
        documentId: aiDocumentChunks.documentId,
        chunkCount: count(),
      })
      .from(aiDocumentChunks)
      .where(
        inArray(
          aiDocumentChunks.documentId,
          documents.map((document) => document.id),
        ),
      )
      .groupBy(aiDocumentChunks.documentId),
    db.select({ id: products.id }).from(products),
  ]);

  const chunkMap = new Map(
    chunkRows.map((row) => [row.documentId, Number(row.chunkCount ?? 0)]),
  );
  const productIdSet = new Set(productRows.map((row) => row.id));

  return documents.map((document) => {
    const chunkCount = chunkMap.get(document.id) ?? 0;
    const requiresProductLink = document.docType !== "rulebook";
    const hasResolvedProductReference = document.productId
      ? productIdSet.has(document.productId)
      : false;
    const hasMissingProductReference =
      requiresProductLink && !hasResolvedProductReference;
    const readiness = getAiKnowledgeReadiness({
      docType: document.docType,
      productId: hasResolvedProductReference ? document.productId : null,
      parsingStatus: document.parsingStatus,
      approvalStatus: document.approvalStatus as AiKnowledgeApprovalStatus,
      title: document.title,
      s3Key: document.s3Key,
      chunkCount,
    });

    return {
      ...document,
      parsingStatus: document.parsingStatus as DatasheetParsingStatus,
      approvalStatus: document.approvalStatus as AiKnowledgeApprovalStatus,
      chunkCount,
      hasMissingProductReference,
      readiness,
    };
  });
}

export async function getAiGroundedChunkRecords(input?: {
  productId?: string | null;
  limit?: number;
}): Promise<AiGroundedChunkRecord[]> {
  const db = getDbOrThrow();
  const usageRecords = await getAiUsageKnowledgeRecords({
    productId: input?.productId ?? null,
  });

  const eligibleDocumentIds = usageRecords
    .filter((record) => record.readiness.approvedForAi)
    .map((record) => record.id);

  if (!eligibleDocumentIds.length) {
    return [];
  }

  const normalizedLimit =
    typeof input?.limit === "number" && input.limit > 0 ? input.limit : null;
  const candidateLimit = normalizedLimit
    ? Math.min(Math.max(normalizedLimit * 4, 20), AI_TEXT_QUALITY_CANDIDATE_CAP)
    : AI_TEXT_QUALITY_CANDIDATE_CAP;

  const rows = await db
    .select({
      id: aiDocumentChunks.id,
      documentId: aiDocumentChunks.documentId,
      productId: aiKnowledgeDocuments.productId,
      title: aiKnowledgeDocuments.title,
      docType: aiKnowledgeDocuments.docType,
      chunkIndex: aiDocumentChunks.chunkIndex,
      contentText: aiDocumentChunks.contentText,
      pageNumber: aiDocumentChunks.pageNumber,
      tokenCount: aiDocumentChunks.tokenCount,
    })
    .from(aiDocumentChunks)
    .innerJoin(
      aiKnowledgeDocuments,
      eq(aiDocumentChunks.documentId, aiKnowledgeDocuments.id),
    )
    .where(inArray(aiDocumentChunks.documentId, eligibleDocumentIds))
    .orderBy(
      desc(aiKnowledgeDocuments.updatedAt),
      asc(aiDocumentChunks.documentId),
      asc(aiDocumentChunks.chunkIndex),
    )
    .limit(candidateLimit);

  const readableRows = rows.filter((row) =>
    isReadableAiEvidenceText(row.contentText),
  );

  return normalizedLimit ? readableRows.slice(0, normalizedLimit) : readableRows;
}

export async function getProductGroundedExplanation(input: {
  productId: string;
}): Promise<ProductGroundedExplanation> {
  const usageRecords = await getAiUsageKnowledgeRecords({
    productId: input.productId,
  });

  const eligibleRecords = usageRecords.filter(
    (record) => record.readiness.approvedForAi,
  );

  if (!usageRecords.length) {
    return {
      available: false,
      note: "Bu ürün için kaynaklı AI açıklaması henüz hazır değil.",
      preview: null,
      eligibleKnowledgeCount: 0,
      groundedChunkCount: 0,
      contributingDocTypes: [],
      coverageLabel: null,
      readinessReason: "Bilgi yok",
      approvalStatusCounts: getApprovalStatusCounts(usageRecords),
      ruleAlignmentStatus: null,
      ruleAlignmentReason: null,
      sourceRuleCount: 0,
      ruleConflictCount: 0,
    };
  }

  if (!eligibleRecords.length) {
    const hasQueue = usageRecords.some(
      (record) =>
        record.parsingStatus === "pending" || record.parsingStatus === "processing",
    );
    const hasFailure = usageRecords.some(
      (record) => record.parsingStatus === "failed",
    );

    return {
      available: false,
      note: hasQueue
        ? "Bilgi eşlemesi var, ancak kaynaklı AI açıklaması için manuel işleme henüz tamamlanmadı."
        : hasFailure
          ? "Bilgi kayıtları hatalı olduğu için kaynaklı AI açıklaması üretilemiyor."
          : "Bilgi kayıtları var, ancak insan onayı veya teknik hazırlık kaynaklı kullanım için yeterli değil.",
      preview: null,
      eligibleKnowledgeCount: 0,
      groundedChunkCount: 0,
      contributingDocTypes: [],
      coverageLabel: null,
      readinessReason: hasQueue
        ? "Manuel işleme bekliyor"
        : hasFailure
          ? "Hatalı bilgi"
          : "İnsan onayı bekleniyor",
      approvalStatusCounts: getApprovalStatusCounts(usageRecords),
      ruleAlignmentStatus: null,
      ruleAlignmentReason: null,
      sourceRuleCount: 0,
      ruleConflictCount: 0,
    };
  }

  const groundedChunks = await getAiGroundedChunkRecords({
    productId: input.productId,
    limit: 4,
  });

  if (!groundedChunks.length) {
    return {
      available: false,
      note: "Onaylı bilgi bulundu, ancak okunabilir kaynak parçası henüz görünmüyor.",
      preview: null,
      eligibleKnowledgeCount: eligibleRecords.length,
      groundedChunkCount: 0,
      contributingDocTypes: Array.from(
        new Set(eligibleRecords.map((record) => record.docType)),
      ),
      coverageLabel: null,
      readinessReason: "Kaynak parçası yok",
      approvalStatusCounts: getApprovalStatusCounts(usageRecords),
      ruleAlignmentStatus: null,
      ruleAlignmentReason: null,
      sourceRuleCount: 0,
      ruleConflictCount: 0,
    };
  }

  const contributingDocTypes = Array.from(
    new Set(eligibleRecords.map((record) => record.docType)),
  );
  const coverageLabel = getGroundedCoverageLabel({
    eligibleKnowledgeCount: eligibleRecords.length,
    groundedChunkCount: groundedChunks.length,
  });
  const ruleAlignment = await getProductRuleAlignment({
    productId: input.productId,
  });

  return {
    available: true,
    note: "Onaylı bilgi ve kaynak parçası hazır.",
    preview: buildGroundedPreviewFromChunks(groundedChunks),
    eligibleKnowledgeCount: eligibleRecords.length,
    groundedChunkCount: groundedChunks.length,
    contributingDocTypes,
    coverageLabel,
    readinessReason: "Onaylı bilgi ve kaynak parçası hazır",
    approvalStatusCounts: getApprovalStatusCounts(usageRecords),
    ruleAlignmentStatus: ruleAlignment.ruleAlignmentStatus,
    ruleAlignmentReason: ruleAlignment.ruleAlignmentReason,
    sourceRuleCount: ruleAlignment.sourceRuleCount,
    ruleConflictCount: ruleAlignment.ruleConflictCount,
  };
}

export function getProductAiDecisionSignalFromGroundedExplanation(
  explanation: ProductGroundedExplanation,
): ProductAiDecisionSignal {
  if (!explanation.available) {
    return {
      status: "blocker",
      reason: explanation.readinessReason,
      groundedAvailable: false,
      coverageLabel: explanation.coverageLabel,
      ruleAlignmentStatus: explanation.ruleAlignmentStatus,
      ruleConflictCount: explanation.ruleConflictCount,
    };
  }

  if (
    explanation.ruleAlignmentStatus === "rule-review-needed" ||
    explanation.ruleConflictCount > 0
  ) {
    return {
      status: "blocker",
      reason: explanation.ruleAlignmentReason ?? "Rule review gerekli",
      groundedAvailable: true,
      coverageLabel: explanation.coverageLabel,
      ruleAlignmentStatus: explanation.ruleAlignmentStatus,
      ruleConflictCount: explanation.ruleConflictCount,
    };
  }

  if (
    explanation.ruleAlignmentStatus === "rule-signal-missing" ||
    explanation.coverageLabel === "Dar kapsam"
  ) {
    return {
      status: "warning",
      reason:
        explanation.ruleAlignmentStatus === "rule-signal-missing"
          ? explanation.ruleAlignmentReason ?? "Rule sinyali eksik"
          : "Kaynak kapsamı şu anda dar görünüyor.",
      groundedAvailable: true,
      coverageLabel: explanation.coverageLabel,
      ruleAlignmentStatus: explanation.ruleAlignmentStatus,
      ruleConflictCount: explanation.ruleConflictCount,
    };
  }

  return {
    status: "ready",
    reason: "Onaylı bilgi ve rule sinyali birlikte hazır.",
    groundedAvailable: true,
    coverageLabel: explanation.coverageLabel,
    ruleAlignmentStatus: explanation.ruleAlignmentStatus,
    ruleConflictCount: explanation.ruleConflictCount,
  };
}

export async function getProductAiDecisionSignal(input: {
  productId: string;
}): Promise<ProductAiDecisionSignal> {
  const explanation = await getProductGroundedExplanation({
    productId: input.productId,
  });

  return getProductAiDecisionSignalFromGroundedExplanation(explanation);
}

export async function getProductWorkshopAiDecisionContext(input: {
  productId: string;
}): Promise<ProductWorkshopAiDecisionContext> {
  const explanation = await getProductGroundedExplanation({
    productId: input.productId,
  });
  const decisionSignal =
    getProductAiDecisionSignalFromGroundedExplanation(explanation);

  return {
    productId: input.productId,
    status: decisionSignal.status,
    reason: decisionSignal.reason,
    groundedAvailable: decisionSignal.groundedAvailable,
    coverageLabel: decisionSignal.coverageLabel,
    ruleAlignmentStatus: decisionSignal.ruleAlignmentStatus,
    ruleConflictCount: decisionSignal.ruleConflictCount,
  };
}

export async function getProductWorkshopAiDecisionContexts(input: {
  productIds: string[];
}): Promise<ProductWorkshopAiDecisionContext[]> {
  const normalizedProductIds = Array.from(
    new Set(
      input.productIds
        .map((productId) => String(productId ?? "").trim())
        .filter(Boolean),
    ),
  );

  if (!normalizedProductIds.length) {
    return [];
  }

  return Promise.all(
    normalizedProductIds.map((productId) =>
      getProductWorkshopAiDecisionContext({ productId }),
    ),
  );
}

export async function getProductSelectionAiDecisionAggregate(input: {
  productIds: string[];
}): Promise<ProductSelectionAiDecisionAggregate> {
  const contexts = await getProductWorkshopAiDecisionContexts({
    productIds: input.productIds,
  });

  const readyCount = contexts.filter((item) => item.status === "ready").length;
  const warningCount = contexts.filter((item) => item.status === "warning").length;
  const blockerCount = contexts.filter((item) => item.status === "blocker").length;
  const totalProducts = contexts.length;

  if (totalProducts === 0) {
    return {
      status: "warning",
      reason: "Ürün seçimi yapılmadı.",
      totalProducts: 0,
      readyCount: 0,
      warningCount: 0,
      blockerCount: 0,
    };
  }

  if (blockerCount > 0) {
    return {
      status: "blocker",
      reason: "Seçimde blokaj oluşturan ürünler var.",
      totalProducts,
      readyCount,
      warningCount,
      blockerCount,
    };
  }

  if (warningCount > 0) {
    return {
      status: "warning",
      reason: "Seçimde dikkat gerektiren ürünler var.",
      totalProducts,
      readyCount,
      warningCount,
      blockerCount,
    };
  }

  return {
    status: "ready",
    reason: "Seçimdeki tüm ürünler AI açısından hazır.",
    totalProducts,
    readyCount,
    warningCount,
    blockerCount,
  };
}

export async function getProductSelectionAiDecisionBundle(input: {
  productIds: string[];
}): Promise<ProductSelectionAiDecisionBundle> {
  const [aggregate, products] = await Promise.all([
    getProductSelectionAiDecisionAggregate({ productIds: input.productIds }),
    getProductWorkshopAiDecisionContexts({ productIds: input.productIds }),
  ]);

  return {
    aggregate,
    products,
  };
}
