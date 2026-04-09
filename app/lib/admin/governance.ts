import "server-only";

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type DatasheetParsingStatus = "pending" | "processing" | "completed" | "failed";
export type PagePublishTransition = "publish" | "rollback";

type TruthyValue = "1" | "true" | "yes" | "on";

const TRUTHY_VALUES = new Set<TruthyValue>(["1", "true", "yes", "on"]);
const COMPLETED_DATASET_STATUS: DatasheetParsingStatus = "completed";
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
      "Completed state sınırına dokunan belge geçişleri governance kilidi altındadır. " +
        "Bu geçiş için SKYVAN_ALLOW_MANUAL_AI_READY_STATUS=true gerekir.",
    );
  }

  if (input.parsingStatus === COMPLETED_DATASET_STATUS) {
    if (!input.title.trim()) {
      blockers.push("Completed olacak belge için başlık zorunludur.");
    }

    if (!input.s3Key.trim()) {
      blockers.push("Completed olacak belge için storage anahtarı zorunludur.");
    }

    if (input.docType !== "rulebook" && !input.productId.trim()) {
      blockers.push(
        "Rulebook dışındaki completed belgeler bir ürüne bağlanmalıdır.",
      );
    }
  }

  return blockers;
}

export function getAiKnowledgeReadiness(input: {
  docType?: string;
  productId?: string | null;
  parsingStatus: DatasheetParsingStatus;
  title: string;
  s3Key: string;
  chunkCount: number;
}) {
  const blockers: string[] = [];

  if (input.parsingStatus !== COMPLETED_DATASET_STATUS) {
    blockers.push("Belge henüz completed seviyesinde değil.");
  }

  if (!input.title.trim()) {
    blockers.push("Belge başlığı eksik.");
  }

  if (!input.s3Key.trim()) {
    blockers.push("Belge storage anahtarı eksik.");
  }

  if (input.docType && input.docType !== "rulebook" && !String(input.productId ?? "").trim()) {
    blockers.push("Rulebook dışındaki bilgi kayıtları bir ürüne bağlanmalıdır.");
  }

  if (input.chunkCount <= 0) {
    blockers.push("Belge chunk üretmemiş.");
  }

  return {
    approvedForAi: blockers.length === 0,
    blockers,
  };
}
