import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Layers3,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type {
  AvailableProductOption,
  RuleConditionItem,
  RuleSuggestionConfidence,
  RuleSuggestionItem,
  RuleSuggestionSourceSummary,
} from "./types";

type RuleSuggestionLabProps = {
  availableProducts: AvailableProductOption[];
  selectedSourceProductId: string;
  selectedSourceLabel: string | null;
  suggestions: RuleSuggestionItem[];
  sourceSummary: RuleSuggestionSourceSummary | null;
};

function confidenceBadgeClass(confidence: RuleSuggestionConfidence) {
  switch (confidence) {
    case "high":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "medium":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "low":
    default:
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }
}

function confidenceLabel(confidence: RuleSuggestionConfidence) {
  switch (confidence) {
    case "high":
      return "Yüksek güven";
    case "medium":
      return "Orta güven";
    case "low":
    default:
      return "Düşük güven";
  }
}

function ruleTypeLabel(value: RuleSuggestionItem["ruleType"]) {
  switch (value) {
    case "requires":
      return "Zorunlu";
    case "excludes":
      return "Engeller";
    case "recommends":
      return "Önerir";
    default:
      return value;
  }
}

function severityLabel(value: RuleSuggestionItem["severity"]) {
  switch (value) {
    case "hard_block":
      return "Sert blok";
    case "soft_warning":
      return "Yumuşak uyarı";
    default:
      return value;
  }
}

function evidenceKindLabel(kind: RuleSuggestionItem["evidence"][number]["kind"]) {
  switch (kind) {
    case "document":
      return "Belge";
    case "scenario":
      return "Senaryo";
    case "power":
      return "Güç";
    case "spec":
      return "Spec";
    case "keyword":
      return "Anahtar";
    case "chunk":
      return "AI Chunk";
    default:
      return kind;
  }
}

function serializeConditions(conditions: RuleConditionItem[]) {
  return conditions
    .map((condition) => `${condition.conditionType}:${condition.targetId}`)
    .join("|");
}

function buildDraftHref(suggestion: RuleSuggestionItem) {
  const params = new URLSearchParams();

  params.set("draftOpen", "1");
  params.set("draftSourceProductId", suggestion.sourceProductId);
  params.set("draftTargetProductId", suggestion.targetProductId);
  params.set("draftRuleType", suggestion.ruleType);
  params.set("draftSeverity", suggestion.severity);
  params.set("draftPriority", String(suggestion.priority));
  params.set("draftMessage", suggestion.message);

  if (suggestion.conditions.length > 0) {
    params.set("draftConditions", serializeConditions(suggestion.conditions));
  }

  return `/admin/rules?${params.toString()}`;
}

function summaryLine(sourceSummary: RuleSuggestionSourceSummary | null) {
  if (!sourceSummary) {
    return "Kaynak ürün seçildiğinde parse edilmiş AI belge özeti burada görünür.";
  }

  return `${sourceSummary.documentCount} belge · ${sourceSummary.completedDocumentCount} tamamlanan analiz · ${sourceSummary.chunkCount} parça`;
}

export default function RuleSuggestionLab({
  availableProducts,
  selectedSourceProductId,
  selectedSourceLabel,
  suggestions,
  sourceSummary,
}: RuleSuggestionLabProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-300">
          <Bot className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Öneri Laboratuvarı
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">
            AI-ready öneri laboratuvarı
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Belge, teknik özellik, senaryo ve analiz edilmiş AI parça sinyallerinden
            kontrollü öneriler üretir. Öneriler otomatik kaydolmaz; sadece
            form ön dolumu olarak açılır.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form
          method="get"
          action="/admin/rules"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-100">
              Öneri üretilecek kaynak ürün
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Bir kaynak ürün seç. Sistem, mevcut kuralları da dikkate alarak yeni
            potansiyel ilişki adaylarını listeler.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              name="suggestSourceProductId"
              defaultValue={selectedSourceProductId}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
            >
              <option value="">Kaynak ürün seç</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.slug}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
            >
              Analiz et
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-100">Kaynak özeti</p>
          </div>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            {selectedSourceLabel
              ? `${selectedSourceLabel} için veri yoğunluğu özeti`
              : "Henüz kaynak ürün seçilmedi"}
          </p>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
            <div className="text-sm text-zinc-100">
              {selectedSourceLabel ?? "Kaynak ürün bekleniyor"}
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              {summaryLine(sourceSummary)}
            </div>
          </div>
        </div>
      </div>

      {!selectedSourceProductId ? (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300">
          Öneri üretmek için önce bir kaynak ürün seç.
        </div>
      ) : suggestions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            <div>
              <p className="text-sm font-semibold">
                Kayıtlanabilir güçlü öneri bulunamadı
              </p>
              <p className="mt-1 text-xs leading-5 opacity-90">
                Bu her zaman kötü bir durum değildir. Seçili kaynak ürün için
                mevcut belge/spec/senaryo sinyalleri yeterli eşleşme üretmedi.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {suggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {suggestion.sourceProductLabel} → {suggestion.targetProductLabel}
                    </h3>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${confidenceBadgeClass(
                        suggestion.confidence,
                      )}`}
                    >
                      {confidenceLabel(suggestion.confidence)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    {suggestion.reason}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-950/80 p-2 text-zinc-300">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200">
                  Tip: {ruleTypeLabel(suggestion.ruleType)}
                </span>
                <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200">
                  Şiddet: {severityLabel(suggestion.severity)}
                </span>
                <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200">
                  Öncelik: {suggestion.priority}
                </span>
                <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200">
                  Hedef: {suggestion.targetProductSlug}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm leading-6 text-zinc-300">
                {suggestion.message}
              </div>

              {suggestion.conditions.length > 0 ? (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Koşullar
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.conditions.map((condition) => (
                      <span
                        key={`${suggestion.id}-${condition.conditionType}-${condition.targetId}`}
                        className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100"
                      >
                        {condition.conditionType}: {condition.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Kanıt sinyalleri
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.evidence.map((item, index) => (
                    <span
                      key={`${suggestion.id}-evidence-${index}`}
                      className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                    >
                      {evidenceKindLabel(item.kind)} · {item.label}
                    </span>
                  ))}
                </div>
              </div>

              {suggestion.evidenceExcerpts.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sky-100">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                      AI evidence excerpts
                    </span>
                  </div>

                  <div className="space-y-3">
                    {suggestion.evidenceExcerpts.map((excerpt) => (
                      <div
                        key={`${suggestion.id}-${excerpt.documentId}-${excerpt.chunkIndex}`}
                        className="rounded-2xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="text-xs font-medium text-sky-100">
                          {excerpt.documentTitle}
                          {excerpt.pageNumber !== null
                            ? ` · Sayfa ${excerpt.pageNumber}`
                            : ""}
                          {` · Skor ${excerpt.matchScore}`}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-sky-50/90">
                          {excerpt.excerpt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {suggestion.caution ? (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-200" />
                    <p className="text-xs leading-5 text-amber-100">
                      {suggestion.caution}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <Link
                  href={buildDraftHref(suggestion)}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
                >
                  Taslak olarak aç
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
