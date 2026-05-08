"use server";

import {
  generateAiExplanation,
  type AiEvidenceItem,
  type AiProviderName,
} from "@/app/lib/ai/provider";
import { AuditActorBindingError, requireStrictAuditActor } from "@/app/lib/admin/audit";
import { getAiGroundedChunkRecords } from "@/app/lib/admin/governance";

const MAX_EVIDENCE_CHUNKS = 5;
const MAX_EXCERPT_CHARACTERS = 600;
const MAX_TOTAL_EXCERPT_CHARACTERS = 2_500;

export type AdminAiCoreExplanationProbeResult = {
  ok: boolean;
  message: string;
  output: string | null;
  provider: AiProviderName;
  modelId: string | null;
  evidenceCount: number;
};

function normalizeExcerpt(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getBoundedExcerpt(value: string, remainingCharacters: number) {
  if (remainingCharacters <= 0) {
    return undefined;
  }

  const normalized = normalizeExcerpt(value);
  const maxLength = Math.min(MAX_EXCERPT_CHARACTERS, remainingCharacters);

  if (!normalized) {
    return undefined;
  }

  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(maxLength - 1, 0)).trim()}…`
    : normalized;
}

export async function generateAdminAiCoreExplanationProbe(): Promise<AdminAiCoreExplanationProbeResult> {
  try {
    await requireStrictAuditActor();

    const evidenceRows = await getAiGroundedChunkRecords({
      limit: MAX_EVIDENCE_CHUNKS,
    });

    if (!evidenceRows.length) {
      return {
        ok: false,
        message: "Onaylı kaynak metni okunabilir değil.",
        output: null,
        provider: "disabled",
        modelId: null,
        evidenceCount: 0,
      };
    }

    let usedExcerptCharacters = 0;

    const evidence: AiEvidenceItem[] = evidenceRows.map((row) => ({
      documentId: row.documentId,
      chunkId: row.id,
      title: row.title,
      docType: row.docType,
      pageNumber: row.pageNumber,
      chunkIndex: row.chunkIndex,
      tokenCount: row.tokenCount,
      excerpt: (() => {
        const excerpt = getBoundedExcerpt(
          row.contentText,
          MAX_TOTAL_EXCERPT_CHARACTERS - usedExcerptCharacters,
        );

        if (excerpt) {
          usedExcerptCharacters += excerpt.length;
        }

        return excerpt;
      })(),
    }));

    const result = await generateAiExplanation({
      purpose: "admin-ai-core-governance-probe",
      locale: "tr",
      evidence,
      maxOutputCharacters: 700,
    });

    return {
      ...result,
      evidenceCount: evidence.length,
    };
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        ok: false,
        message: "Yetkili admin aktörü doğrulanamadı.",
        output: null,
        provider: "disabled",
        modelId: null,
        evidenceCount: 0,
      };
    }

    return {
      ok: false,
      message: "AI açıklaması şu anda üretilemedi.",
      output: null,
      provider: "disabled",
      modelId: null,
      evidenceCount: 0,
    };
  }
}
