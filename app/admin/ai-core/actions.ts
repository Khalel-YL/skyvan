"use server";

import {
  generateAiExplanation,
  type AiEvidenceItem,
  type AiProviderName,
} from "@/app/lib/ai/provider";
import { AuditActorBindingError, requireStrictAuditActor } from "@/app/lib/admin/audit";
import { getAiGroundedChunkRecords } from "@/app/lib/admin/governance";

export type AdminAiCoreExplanationProbeResult = {
  ok: boolean;
  message: string;
  output: string | null;
  provider: AiProviderName;
  modelId: string | null;
  evidenceCount: number;
};

export async function generateAdminAiCoreExplanationProbe(): Promise<AdminAiCoreExplanationProbeResult> {
  try {
    await requireStrictAuditActor();

    const evidenceRows = await getAiGroundedChunkRecords({ limit: 5 });

    const evidence: AiEvidenceItem[] = evidenceRows.map((row) => ({
      documentId: row.documentId,
      chunkId: row.id,
      title: row.title,
      docType: row.docType,
      pageNumber: row.pageNumber,
      chunkIndex: row.chunkIndex,
      tokenCount: row.tokenCount,
    }));

    if (!evidence.length) {
      return {
        ok: false,
        message: "Onaylı kaynak yetersiz.",
        output: null,
        provider: "disabled",
        modelId: null,
        evidenceCount: 0,
      };
    }

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
