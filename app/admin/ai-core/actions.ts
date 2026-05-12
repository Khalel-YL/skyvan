"use server";

import {
  generateAiExplanation,
  type AiEvidenceItem,
  type AiProviderName,
} from "@/app/lib/ai/provider";
import { AuditActorBindingError, requireStrictAuditActor } from "@/app/lib/admin/audit";
import { getAiGroundedChunkRecords } from "@/app/lib/admin/governance";

const MAX_EVIDENCE_CHUNKS = 5;
const MAX_EVIDENCE_CANDIDATE_CHUNKS = 20;
const MAX_EXCERPT_CHARACTERS = 600;
const MAX_TOTAL_EXCERPT_CHARACTERS = 2_500;
const REQUIRED_OUTPUT_SECTIONS = [
  "Teknik değerlendirme",
  "Kaynak dayanağı",
  "Sınır",
] as const;
const AI_OUTPUT_BOUNDARY_TEXT =
  "Onaylı kaynaklarda yer almayan bilgiler yorumlanmadı. Bu metin resmi kılavuzun yerine geçmez.";

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

type GroundedEvidenceRow = Awaited<
  ReturnType<typeof getAiGroundedChunkRecords>
>[number];

const TECHNICAL_EVIDENCE_TERMS = [
  "inverter",
  "smart solar",
  "battery",
  "batteries",
  "pv",
  "solar",
  "ac",
  "dc",
  "installation",
  "install",
  "operation",
  "configuration",
  "settings",
  "safety",
  "warning",
  "specification",
  "technical data",
  "troubleshooting",
  "protection",
  "voltage",
  "current",
  "power",
  "charge",
  "charger",
  "mppt",
  "akü",
  "batarya",
  "güneş",
  "kurulum",
  "montaj",
  "çalışma",
  "ayar",
  "güvenlik",
  "uyarı",
  "teknik",
  "özellik",
  "koruma",
  "gerilim",
  "akım",
  "güç",
  "şarj",
  "arıza",
];

function scoreEvidenceRow(row: GroundedEvidenceRow) {
  const haystack = `${row.title} ${row.contentText}`.toLocaleLowerCase("tr-TR");

  return TECHNICAL_EVIDENCE_TERMS.reduce(
    (score, term) => score + (haystack.includes(term) ? 1 : 0),
    0,
  );
}

function selectRelevantEvidenceRows(rows: GroundedEvidenceRow[]) {
  return [...rows]
    .map((row, index) => ({
      row,
      index,
      score: scoreEvidenceRow(row),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    })
    .slice(0, MAX_EVIDENCE_CHUNKS)
    .map((item) => item.row);
}

function getSourceTitles(evidence: AiEvidenceItem[]) {
  return Array.from(
    new Set(evidence.map((item) => item.title.trim()).filter(Boolean)),
  );
}

function hasSection(value: string, section: (typeof REQUIRED_OUTPUT_SECTIONS)[number]) {
  return new RegExp(`(^|\\n)\\s*${section}\\s*:`, "i").test(value);
}

function ensureBulletLines(values: string[]) {
  if (!values.length) {
    return "- Kaynak başlığı belirtilmedi.";
  }

  return values.map((value) => `- ${value}`).join("\n");
}

function normalizeAiCoreOutput(output: string | null, evidence: AiEvidenceItem[]) {
  const trimmedOutput = output?.trim();

  if (!trimmedOutput) {
    return null;
  }

  const hasAllSections = REQUIRED_OUTPUT_SECTIONS.every((section) =>
    hasSection(trimmedOutput, section),
  );

  if (hasAllSections) {
    return trimmedOutput;
  }

  const sections: string[] = [];

  if (hasSection(trimmedOutput, "Teknik değerlendirme")) {
    sections.push(trimmedOutput);
  } else {
    sections.push(`Teknik değerlendirme:\n${trimmedOutput}`);
  }

  if (!hasSection(trimmedOutput, "Kaynak dayanağı")) {
    sections.push(`Kaynak dayanağı:\n${ensureBulletLines(getSourceTitles(evidence))}`);
  }

  if (!hasSection(trimmedOutput, "Sınır")) {
    sections.push(`Sınır:\n- ${AI_OUTPUT_BOUNDARY_TEXT}`);
  }

  return sections.join("\n\n");
}

export async function generateAdminAiCoreExplanationProbe(): Promise<AdminAiCoreExplanationProbeResult> {
  try {
    await requireStrictAuditActor();

    const evidenceRows = await getAiGroundedChunkRecords({
      limit: MAX_EVIDENCE_CANDIDATE_CHUNKS,
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
    const selectedEvidenceRows = selectRelevantEvidenceRows(evidenceRows);

    const evidence: AiEvidenceItem[] = selectedEvidenceRows.map((row) => ({
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
      purpose:
        "Admin AI Core için onaylı kaynaklardan kısa teknik değerlendirme",
      locale: "tr",
      evidence,
      maxOutputCharacters: 700,
    });

    return {
      ...result,
      output: normalizeAiCoreOutput(result.output, evidence),
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
