import "server-only";

export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type DatasheetParsingStatus = "pending" | "processing" | "completed" | "failed";

type TruthyValue = "1" | "true" | "yes" | "on";

const TRUTHY_VALUES = new Set<TruthyValue>(["1", "true", "yes", "on"]);

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
  const auditActorId = String(process.env.SKYVAN_ADMIN_AUDIT_USER_ID ?? "").trim();

  return {
    auditActorId,
    hasAuditActor: Boolean(auditActorId),
    allowCriticalOfferStatusTransitions: readBooleanEnv(
      "SKYVAN_ALLOW_CRITICAL_OFFER_STATUS_CHANGE",
      false,
    ),
    allowDirectPublishWithoutSeo: readBooleanEnv(
      "SKYVAN_ALLOW_DIRECT_PUBLISH_WITHOUT_SEO",
      false,
    ),
    allowManualAiReadyStatus: readBooleanEnv(
      "SKYVAN_ALLOW_MANUAL_AI_READY_STATUS",
      false,
    ),
  };
}

export function isCriticalOfferStatus(status: OfferStatus) {
  return status === "accepted" || status === "rejected" || status === "expired";
}

export function getOfferMutationBlocker(status: OfferStatus) {
  const runtime = getGovernanceRuntime();

  if (isCriticalOfferStatus(status) && !runtime.allowCriticalOfferStatusTransitions) {
    return (
      "Kritik teklif durumları (accepted / rejected / expired) governance kilidi altındadır. " +
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
  s3Key: string;
}) {
  const blockers: string[] = [];
  const runtime = getGovernanceRuntime();

  if (input.parsingStatus === "completed") {
    if (!runtime.allowManualAiReadyStatus) {
      blockers.push(
        "Belgeyi doğrudan completed durumuna almak governance kilidi altındadır. " +
          "Bu geçiş için SKYVAN_ALLOW_MANUAL_AI_READY_STATUS=true gerekir.",
      );
    }

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
  parsingStatus: DatasheetParsingStatus;
  title: string;
  s3Key: string;
  chunkCount: number;
}) {
  const blockers: string[] = [];

  if (input.parsingStatus !== "completed") {
    blockers.push("Belge henüz completed seviyesinde değil.");
  }

  if (!input.title.trim()) {
    blockers.push("Belge başlığı eksik.");
  }

  if (!input.s3Key.trim()) {
    blockers.push("Belge storage anahtarı eksik.");
  }

  if (input.chunkCount <= 0) {
    blockers.push("Belge chunk üretmemiş.");
  }

  return {
    approvedForAi: blockers.length === 0,
    blockers,
  };
}