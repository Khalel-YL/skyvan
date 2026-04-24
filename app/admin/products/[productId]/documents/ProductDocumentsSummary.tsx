import { getProductDocumentTypeLabel } from "./lib";
import type { ProductDocumentsSummary as ProductDocumentsSummaryType } from "./types";
import type {
  ProductAiDecisionSignal,
  ProductGroundedExplanation,
} from "@/app/lib/admin/governance";

type Props = {
  summary: ProductDocumentsSummaryType;
  groundedExplanation: ProductGroundedExplanation;
  decisionSignal: ProductAiDecisionSignal;
};

function getGroundedDocTypeLabel(value: string) {
  switch (value) {
    case "datasheet":
      return "Datasheet";
    case "manual":
      return "Kılavuz";
    case "rulebook":
      return "Kural";
    default:
      return value;
  }
}

function getRuleAlignmentLabel(
  value: ProductGroundedExplanation["ruleAlignmentStatus"],
) {
  switch (value) {
    case "rule-aligned":
      return "Rule hizalı";
    case "rule-signal-missing":
      return "Rule sinyali eksik";
    case "rule-review-needed":
      return "Rule review gerekli";
    default:
      return null;
  }
}

function getRuleAlignmentClassName(
  value: ProductGroundedExplanation["ruleAlignmentStatus"],
) {
  switch (value) {
    case "rule-aligned":
      return "border-emerald-800 bg-emerald-950 text-emerald-300";
    case "rule-signal-missing":
      return "border-amber-800 bg-amber-950 text-amber-300";
    case "rule-review-needed":
      return "border-rose-800 bg-rose-950 text-rose-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function getDecisionSignalLabel(value: ProductAiDecisionSignal["status"]) {
  switch (value) {
    case "ready":
      return "Hazır";
    case "warning":
      return "Uyarı";
    case "blocker":
      return "Blokaj";
    default:
      return value;
  }
}

function getDecisionSignalClassName(value: ProductAiDecisionSignal["status"]) {
  switch (value) {
    case "ready":
      return "border-emerald-800 bg-emerald-950 text-emerald-300";
    case "warning":
      return "border-amber-800 bg-amber-950 text-amber-300";
    case "blocker":
      return "border-rose-800 bg-rose-950 text-rose-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

export function ProductDocumentsSummary({
  summary,
  groundedExplanation,
  decisionSignal,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Toplam Belge
        </div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">
          {summary.total}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Aktif
        </div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">
          {summary.active}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Arşiv
        </div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">
          {summary.archived}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Belge Sağlığı
        </div>

        <div className="mt-2">
          {summary.completeRequiredSet ? (
            <div className="inline-flex rounded-full border border-green-800 bg-green-950 px-2.5 py-1 text-xs font-medium text-green-300">
              Çekirdek belge seti tamam
            </div>
          ) : (
            <div className="inline-flex rounded-full border border-amber-800 bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-300">
              Eksik çekirdek belge var
            </div>
          )}
        </div>

        {!summary.completeRequiredSet ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.missingRequiredTypes.map((type) => (
              <span
                key={type}
                className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
              >
                {getProductDocumentTypeLabel(type)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Grounded AI Açıklama
        </div>

        <div className="mt-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getDecisionSignalClassName(
              decisionSignal.status,
            )}`}
          >
            AI Karar Sinyali · {getDecisionSignalLabel(decisionSignal.status)}
          </span>
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          {decisionSignal.reason}
        </div>

        <div className="mt-3">
          {groundedExplanation.available ? (
            <div className="inline-flex rounded-full border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-300">
              Kullanıma hazır
            </div>
          ) : (
            <div className="inline-flex rounded-full border border-amber-800 bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-300">
              Hazır değil
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          {groundedExplanation.readinessReason}
        </div>

        {groundedExplanation.ruleAlignmentStatus ? (
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRuleAlignmentClassName(
                groundedExplanation.ruleAlignmentStatus,
              )}`}
            >
              {getRuleAlignmentLabel(groundedExplanation.ruleAlignmentStatus)}
            </span>
          </div>
        ) : null}

        <div className="mt-3 text-sm leading-6 text-zinc-400">
          {groundedExplanation.preview ?? groundedExplanation.note}
        </div>

        {groundedExplanation.ruleAlignmentReason ? (
          <div className="mt-3 text-xs leading-5 text-zinc-500">
            {groundedExplanation.ruleAlignmentReason}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            Knowledge {groundedExplanation.eligibleKnowledgeCount}
          </span>
          <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            Chunk {groundedExplanation.groundedChunkCount}
          </span>
          {groundedExplanation.coverageLabel ? (
            <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
              {groundedExplanation.coverageLabel}
            </span>
          ) : null}
          {groundedExplanation.sourceRuleCount > 0 ? (
            <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
              Rule {groundedExplanation.sourceRuleCount}
            </span>
          ) : null}
          {groundedExplanation.ruleConflictCount > 0 ? (
            <span className="inline-flex rounded-full border border-rose-800 bg-rose-950 px-2.5 py-1 text-xs text-rose-300">
              Çakışma {groundedExplanation.ruleConflictCount}
            </span>
          ) : null}
          {groundedExplanation.contributingDocTypes.map((docType) => (
            <span
              key={docType}
              className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
            >
              {getGroundedDocTypeLabel(docType)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
