import type {
  AvailableProductOption,
  RuleConditionItem,
  RuleSuggestionConfidence,
  RuleSuggestionEvidenceItem,
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
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "low":
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function evidenceBadgeClass(kind: RuleSuggestionEvidenceItem["kind"]) {
  switch (kind) {
    case "document":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100";
    case "scenario":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "power":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "spec":
      return "border-violet-500/30 bg-violet-500/10 text-violet-100";
    case "keyword":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
    case "chunk":
      return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function conditionBadgeClass(type: RuleConditionItem["conditionType"]) {
  switch (type) {
    case "model":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
    case "package":
      return "border-violet-500/30 bg-violet-500/10 text-violet-100";
    case "scenario":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function serializeConditions(conditions: RuleConditionItem[]) {
  return conditions
    .map((condition) => `${condition.conditionType}:${condition.targetId}`)
    .join("|");
}

export function RuleSuggestionLab({
  availableProducts,
  selectedSourceProductId,
  selectedSourceLabel,
  suggestions,
  sourceSummary,
}: RuleSuggestionLabProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Rules · Belge Zekâsı
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
              AI-Ready Kural Öneri Laboratuvarı
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
              Mevcut belgeler, senaryo eşleşmeleri, sayısal spec sinyalleri ve
              varsa AI knowledge chunk kanıtı üzerinden taslak öneri üretir.
              Kayıt otomatik yapılmaz; öneri drawer’a taslak olarak açılır.
            </p>
          </div>
        </div>

        <form action="/admin/rules" className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <label
              htmlFor="suggestSourceProductId"
              className="text-sm font-medium text-zinc-200"
            >
              Kaynak ürün seç
            </label>
            <select
              id="suggestSourceProductId"
              name="suggestSourceProductId"
              defaultValue={selectedSourceProductId}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-700"
            >
              <option value="">Ürün seç</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.slug}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
            >
              Öneri Üret
            </button>

            <a
              href="/admin/rules"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              Temizle
            </a>
          </div>
        </form>

        {!selectedSourceProductId ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-8 text-sm text-zinc-500">
            Bir kaynak ürün seçildiğinde sistem aktif belge sinyalleri, spec alanları,
            senaryo eşleşmeleri ve varsa AI knowledge chunk’larından öneri üretir.
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-8">
            <h3 className="text-base font-semibold text-zinc-100">
              Gösterilecek güçlü öneri bulunamadı
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              {selectedSourceLabel ?? "Seçilen ürün"} için yeterli kalite eşiğini geçen
              öneri oluşmadı. Bu genelde düşük belge/spec sinyali, zayıf kanıt veya
              mevcut kuralların hattı zaten kapsaması anlamına gelir. Bu durumda
              manuel rule ekleme daha doğru olur.
            </p>
          </div>
        ) : (
          <>
            {sourceSummary ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Kaynak Belge
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-100">
                    {sourceSummary.documentCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Parse Tamamlanan
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-100">
                    {sourceSummary.completedDocumentCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Kullanılabilir Chunk
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-100">
                    {sourceSummary.chunkCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Gösterilen Öneri
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-zinc-100">
                    {suggestions.length}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
                          {suggestion.sourceProductLabel} → {suggestion.targetProductLabel}
                        </h3>

                        <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {suggestion.ruleType}
                        </span>

                        <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {suggestion.severity}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${confidenceBadgeClass(
                            suggestion.confidence,
                          )}`}
                        >
                          {suggestion.confidence === "high"
                            ? "Yüksek güven"
                            : suggestion.confidence === "medium"
                              ? "Orta güven"
                              : "Düşük güven"}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-zinc-300">
                        {suggestion.reason}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {suggestion.evidence.map((item, index) => (
                          <span
                            key={`${suggestion.id}-evidence-${index}`}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${evidenceBadgeClass(
                              item.kind,
                            )}`}
                          >
                            {item.label}
                          </span>
                        ))}
                      </div>

                      {suggestion.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {suggestion.conditions.map((condition) => (
                            <span
                              key={`${suggestion.id}-${condition.conditionType}-${condition.targetId}`}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${conditionBadgeClass(
                                condition.conditionType,
                              )}`}
                            >
                              {condition.conditionType} · {condition.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          Bu öneri global taslak olarak açılır.
                        </p>
                      )}

                      {suggestion.evidenceExcerpts.length > 0 ? (
                        <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                            Belge Kanıtı
                          </div>

                          <div className="space-y-2">
                            {suggestion.evidenceExcerpts.map((excerpt, index) => (
                              <div
                                key={`${suggestion.id}-excerpt-${index}`}
                                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100">
                                    {excerpt.docType}
                                  </span>

                                  <span className="text-xs text-zinc-400">
                                    {excerpt.documentTitle}
                                  </span>

                                  {excerpt.pageNumber !== null ? (
                                    <span className="text-xs text-zinc-500">
                                      Sayfa {excerpt.pageNumber}
                                    </span>
                                  ) : null}

                                  <span className="text-xs text-zinc-500">
                                    Chunk #{excerpt.chunkIndex}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm leading-6 text-zinc-300">
                                  {excerpt.excerpt}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {suggestion.caution ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-100">
                          {suggestion.caution}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-start justify-end">
                      <form action="/admin/rules" method="get" className="space-y-2">
                        <input
                          type="hidden"
                          name="suggestSourceProductId"
                          value={selectedSourceProductId}
                        />
                        <input type="hidden" name="draftOpen" value="1" />
                        <input
                          type="hidden"
                          name="draftSourceProductId"
                          value={suggestion.sourceProductId}
                        />
                        <input
                          type="hidden"
                          name="draftTargetProductId"
                          value={suggestion.targetProductId}
                        />
                        <input
                          type="hidden"
                          name="draftRuleType"
                          value={suggestion.ruleType}
                        />
                        <input
                          type="hidden"
                          name="draftSeverity"
                          value={suggestion.severity}
                        />
                        <input
                          type="hidden"
                          name="draftPriority"
                          value={String(suggestion.priority)}
                        />
                        <input
                          type="hidden"
                          name="draftMessage"
                          value={suggestion.message}
                        />
                        <input
                          type="hidden"
                          name="draftConditions"
                          value={serializeConditions(suggestion.conditions)}
                        />

                        <button
                          type="submit"
                          className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
                        >
                          Taslağı Aç
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RuleSuggestionLab;