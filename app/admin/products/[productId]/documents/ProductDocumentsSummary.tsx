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
      return "Teknik datasheet";
    case "manual":
      return "Kılavuz";
    case "rulebook":
      return "Kural kitabı";
    default:
      return value;
  }
}

function getRuleAlignmentLabel(
  value: ProductGroundedExplanation["ruleAlignmentStatus"],
) {
  switch (value) {
    case "rule-aligned":
      return "Kural hizalı";
    case "rule-signal-missing":
      return "Kural sinyali eksik";
    case "rule-review-needed":
      return "Kural incelemesi gerekli";
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

function getSafeOperationalStatus(input: {
  groundedExplanation: ProductGroundedExplanation;
  decisionSignal: ProductAiDecisionSignal;
}) {
  if (!input.groundedExplanation.available) {
    return "AI açıklaması güvenli özet modunda gösterilir. Ham belge metni bu yüzeyde gösterilmez.";
  }

  if (input.groundedExplanation.ruleAlignmentStatus === "rule-signal-missing") {
    return "Kural sinyali eksik olduğu için karar sinyali uyarıda. Ham belge metni bu yüzeyde gösterilmez.";
  }

  if (input.decisionSignal.status === "ready") {
    return "Kullanıma hazır bilgi ve kaynak parçası mevcut. Ham belge metni bu yüzeyde gösterilmez.";
  }

  return "AI açıklaması güvenli özet modunda gösterilir. Ham belge metni bu yüzeyde gösterilmez.";
}

function statChip(label: string, value: string | number) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function statusPill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function neutralPill(label: string) {
  return (
    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
      {label}
    </span>
  );
}

export function ProductDocumentsSummary({
  summary,
  groundedExplanation,
  decisionSignal,
}: Props) {
  const ruleAlignmentLabel = groundedExplanation.ruleAlignmentStatus
    ? getRuleAlignmentLabel(groundedExplanation.ruleAlignmentStatus)
    : null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {statChip("Toplam belge", summary.total)}
        {statChip("Aktif", summary.active)}
        {statChip("Arşiv", summary.archived)}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Belge sağlığı
          </div>
          <div className="mt-2">
            {summary.completeRequiredSet
              ? statusPill({
                  label: "Çekirdek set tamam",
                  className: "border-green-800 bg-green-950 text-green-300",
                })
              : statusPill({
                  label: "Eksik çekirdek belge",
                  className: "border-amber-800 bg-amber-950 text-amber-300",
                })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            AI karar sinyali
          </div>
          <div className="mt-2">
            {statusPill({
              label: getDecisionSignalLabel(decisionSignal.status),
              className: getDecisionSignalClassName(decisionSignal.status),
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              AI Kaynak Açıklaması
            </div>
            <p className="mt-2 text-sm leading-5 text-zinc-300">
              {getSafeOperationalStatus({ groundedExplanation, decisionSignal })}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
            {groundedExplanation.available
              ? statusPill({
                  label: "Kaynaklı bilgi hazır",
                  className: "border-emerald-800 bg-emerald-950 text-emerald-300",
                })
              : statusPill({
                  label: "Kaynaklı bilgi hazır değil",
                  className: "border-amber-800 bg-amber-950 text-amber-300",
                })}
            {ruleAlignmentLabel && groundedExplanation.ruleAlignmentStatus
              ? statusPill({
                  label: ruleAlignmentLabel,
                  className: getRuleAlignmentClassName(
                    groundedExplanation.ruleAlignmentStatus,
                  ),
                })
              : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {neutralPill(`Bilgi ${groundedExplanation.eligibleKnowledgeCount}`)}
          {neutralPill(`Parça ${groundedExplanation.groundedChunkCount}`)}
          {groundedExplanation.coverageLabel
            ? neutralPill(groundedExplanation.coverageLabel)
            : null}
          {groundedExplanation.sourceRuleCount > 0
            ? neutralPill(`Kural ${groundedExplanation.sourceRuleCount}`)
            : null}
          {groundedExplanation.ruleConflictCount > 0
            ? statusPill({
                label: `Çakışma ${groundedExplanation.ruleConflictCount}`,
                className: "border-rose-800 bg-rose-950 text-rose-300",
              })
            : null}
          {groundedExplanation.contributingDocTypes.map((docType) => (
            <span
              key={docType}
              className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
            >
              {getGroundedDocTypeLabel(docType)}
            </span>
          ))}
          {!summary.completeRequiredSet
            ? summary.missingRequiredTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex rounded-full border border-amber-800 bg-amber-950 px-2.5 py-1 text-xs text-amber-300"
                >
                  Eksik {getProductDocumentTypeLabel(type)}
                </span>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
