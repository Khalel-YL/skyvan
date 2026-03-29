type ConflictPreviewItem = {
  pairLabel: string;
  totalCount: number;
  hasGlobal: boolean;
  hasConditional: boolean;
  ruleTypes: string[];
  severities: string[];
};

type RuleOpsHealthPanelProps = {
  totalProducts: number;
  coveredProductCount: number;
  uncoveredProductNames: string[];
  sourceReadyProductCount: number;
  sourceReadyUnruledCount: number;
  pendingSuggestionCount: number;
  highConfidenceSuggestionCount: number;
  globalRuleCount: number;
  conditionalRuleCount: number;
  conflictPreview: ConflictPreviewItem[];
};

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-2 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

function buildOpsMessage({
  totalProducts,
  sourceReadyProductCount,
  sourceReadyUnruledCount,
  pendingSuggestionCount,
  conflictCount,
}: {
  totalProducts: number;
  sourceReadyProductCount: number;
  sourceReadyUnruledCount: number;
  pendingSuggestionCount: number;
  conflictCount: number;
}) {
  if (totalProducts === 0) {
    return "Aktif ürün görünmüyor. Rules modülünün gerçek gücü için önce ürünleri, ardından belge/spec ilişkilerini doldurmak gerekir.";
  }

  if (sourceReadyProductCount === 0) {
    return "Aktif ürünler var ama rule üretimini besleyecek belge/spec/senaryo/güç sinyali henüz yok. Sonraki doğru iş, ürün veri kalitesini artırmak.";
  }

  if (sourceReadyUnruledCount > 0) {
    return "Veri hazır ama kuralsız ürünler var. Öncelik bu ürünler için hızlı rule başlangıçları açmak olmalı.";
  }

  if (conflictCount > 0) {
    return "Aynı ürün çiftinde birden fazla kayıt görüldü. Özellikle global ve koşullu kayıtlar birlikte varsa operasyonel olarak gözden geçirilmelidir.";
  }

  if (pendingSuggestionCount > 0) {
    return "Suggestion kuyruğunda değerlendirilebilir adaylar var. Rules modülü artık veri temelli genişlemeye hazır.";
  }

  return "Rules omurgası stabil görünüyor. Bu modül Admin içinde kapanış seviyesine yaklaştı.";
}

function ruleTypeLabel(value: string) {
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

function severityLabel(value: string) {
  switch (value) {
    case "hard_block":
      return "Sert blok";
    case "soft_warning":
      return "Yumuşak uyarı";
    default:
      return value;
  }
}

export default function RuleOpsHealthPanel({
  totalProducts,
  coveredProductCount,
  uncoveredProductNames,
  sourceReadyProductCount,
  sourceReadyUnruledCount,
  pendingSuggestionCount,
  highConfidenceSuggestionCount,
  globalRuleCount,
  conditionalRuleCount,
  conflictPreview,
}: RuleOpsHealthPanelProps) {
  const previewUncovered = uncoveredProductNames.slice(0, 6);
  const opsMessage = buildOpsMessage({
    totalProducts,
    sourceReadyProductCount,
    sourceReadyUnruledCount,
    pendingSuggestionCount,
    conflictCount: conflictPreview.length,
  });

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Rules Ops
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-100">
          Kapsam ve operasyon sağlığı
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Rules ekranının gerçekten bitebilmesi için yalnızca kural kaydı değil,
          kapsama, veri hazırlığı, öneri kuyruğu ve çakışma görünürlüğü de
          operasyonel olarak izlenmeli.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Kapsanan Ürün"
          value={coveredProductCount}
          hint={`Toplam aktif ürün: ${totalProducts}`}
        />
        <MetricCard
          label="Rule-Ready Ürün"
          value={sourceReadyProductCount}
          hint="Belge / spec / senaryo / güç sinyali taşıyan ürünler"
        />
        <MetricCard
          label="Bekleyen Öneri"
          value={pendingSuggestionCount}
          hint="Seçili kaynak bazlı üretilebilen suggestion adayı"
        />
        <MetricCard
          label="Güçlü Öneri"
          value={highConfidenceSuggestionCount}
          hint="Yüksek güvenli suggestion adedi"
        />
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Operasyon yorumu</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{opsMessage}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Kapsam boşluğu operasyon listesi
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Rule kapsamı olmayan ürünler burada görünür. Bu alan boşaldıkça
                Rules modülü daha tamamlanmış hale gelir.
              </p>
            </div>

            <div className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
              {uncoveredProductNames.length} açık
            </div>
          </div>

          {previewUncovered.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Aktif ürünler içinde henüz görünen rule kapsam boşluğu yok.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {previewUncovered.map((name) => (
                <span
                  key={name}
                  className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100"
                >
                  {name}
                </span>
              ))}
            </div>
          )}

          {uncoveredProductNames.length > previewUncovered.length ? (
            <p className="mt-3 text-xs text-zinc-500">
              +{uncoveredProductNames.length - previewUncovered.length} ek ürün daha var.
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">
            Kural kompozisyon özeti
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
              <span className="text-sm text-zinc-300">Global kayıtlar</span>
              <span className="text-sm font-semibold text-zinc-100">
                {globalRuleCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
              <span className="text-sm text-zinc-300">Koşullu kayıtlar</span>
              <span className="text-sm font-semibold text-zinc-100">
                {conditionalRuleCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3">
              <span className="text-sm text-zinc-300">
                Veri var ama kaynak rule yok
              </span>
              <span className="text-sm font-semibold text-zinc-100">
                {sourceReadyUnruledCount}
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Hedefimiz yalnızca sayı büyütmek değil; veri destekli ve kontrollü
            rule omurgası kurmak.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Conflict preview
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Aynı source → target çifti için birden fazla kayıt varsa burada
              görünür. Özellikle global + koşullu birlikteyse operasyonel dikkat gerekir.
            </p>
          </div>

          <div className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
            {conflictPreview.length} çift
          </div>
        </div>

        {conflictPreview.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Şu an görünür bir source → target çakışması bulunmuyor.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {conflictPreview.map((item) => (
              <div
                key={item.pairLabel}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-amber-100">
                      {item.pairLabel}
                    </div>
                    <div className="mt-1 text-xs text-amber-50/80">
                      Toplam kayıt: {item.totalCount}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.hasGlobal ? (
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200">
                          Global var
                        </span>
                      ) : null}

                      {item.hasConditional ? (
                        <span className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100">
                          Koşullu var
                        </span>
                      ) : null}

                      {item.ruleTypes.map((ruleType) => (
                        <span
                          key={`${item.pairLabel}-${ruleType}`}
                          className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                        >
                          {ruleTypeLabel(ruleType)}
                        </span>
                      ))}

                      {item.severities.map((severity) => (
                        <span
                          key={`${item.pairLabel}-${severity}`}
                          className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                        >
                          {severityLabel(severity)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300">
                    {item.hasGlobal && item.hasConditional
                      ? "Global + koşullu birlikte"
                      : "Aynı çiftte çoklu kayıt"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}