import AddRuleDrawer from "./AddRuleDrawer";
import DeleteRuleButton from "./DeleteRuleButton";
import type { AvailableProductOption, RuleListItem } from "./types";

type RulesListProps = {
  rules: RuleListItem[];
  availableProducts: AvailableProductOption[];
  databaseReady: boolean;
};

function chip(label: string) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-[11px] text-zinc-300">
      {label}
    </span>
  );
}

function ruleTypeBadgeClass(ruleType: RuleListItem["ruleType"]) {
  switch (ruleType) {
    case "requires":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100";
    case "excludes":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    case "recommends":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function severityBadgeClass(severity: RuleListItem["severity"]) {
  switch (severity) {
    case "hard_block":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    case "soft_warning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function productStatusBadgeClass(
  status: RuleListItem["sourceProductStatus"] | RuleListItem["targetProductStatus"],
) {
  switch (status) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "draft":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100";
    case "archived":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "missing":
    default:
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  }
}

function ruleTypeLabel(ruleType: RuleListItem["ruleType"]) {
  switch (ruleType) {
    case "requires":
      return "Zorunlu";
    case "excludes":
      return "Engeller";
    case "recommends":
      return "Önerir";
    default:
      return ruleType;
  }
}

function severityLabel(severity: RuleListItem["severity"]) {
  switch (severity) {
    case "hard_block":
      return "Sert blok";
    case "soft_warning":
      return "Yumuşak uyarı";
    default:
      return severity;
  }
}

function productStatusLabel(
  status: RuleListItem["sourceProductStatus"] | RuleListItem["targetProductStatus"],
) {
  switch (status) {
    case "active":
      return "Aktif";
    case "draft":
      return "Taslak";
    case "archived":
      return "Arşiv";
    case "missing":
    default:
      return "Eksik";
  }
}

function formatDate(value: RuleListItem["createdAt"]) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function RulesList({
  rules,
  availableProducts,
  databaseReady,
}: RulesListProps) {
  if (rules.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
        <h3 className="text-lg font-semibold text-zinc-100">Kayıt bulunamadı</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Filtre sonucu eşleşen kural yok. Yeni kural ekleyebilir ya da filtreleri
          temizleyebilirsin.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {rules.map((rule) => {
        const hasMissingReference =
          rule.sourceProductStatus === "missing" ||
          rule.targetProductStatus === "missing";

        const hasArchivedReference =
          rule.sourceProductStatus === "archived" ||
          rule.targetProductStatus === "archived";

        return (
          <article
            key={rule.id}
            className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-zinc-100">
                    {rule.sourceProductLabel} → {rule.targetProductLabel}
                  </h3>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${ruleTypeBadgeClass(
                      rule.ruleType,
                    )}`}
                  >
                    {ruleTypeLabel(rule.ruleType)}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${severityBadgeClass(
                      rule.severity,
                    )}`}
                  >
                    {severityLabel(rule.severity)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {chip(`Kaynak ${rule.sourceProductSlug}`)}
                  {chip(`Hedef ${rule.targetProductSlug}`)}
                  {chip(`Öncelik ${rule.priority}`)}
                  {chip(`Oluşturulma ${formatDate(rule.createdAt)}`)}

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${productStatusBadgeClass(
                      rule.sourceProductStatus,
                    )}`}
                  >
                    Kaynak {productStatusLabel(rule.sourceProductStatus)}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${productStatusBadgeClass(
                      rule.targetProductStatus,
                    )}`}
                  >
                    Hedef {productStatusLabel(rule.targetProductStatus)}
                  </span>
                </div>

                {rule.message ? (
                  <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-6 text-zinc-300">
                    {rule.message}
                  </div>
                ) : null}

                {hasMissingReference ? (
                  <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    Bu kural eksik ürün referansı taşıyor. Kaynak veya hedef ürün kaydı
                    artık bulunamıyor.
                  </div>
                ) : null}

                {!hasMissingReference && hasArchivedReference ? (
                  <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    Bu kural arşivlenmiş ürün referansı içeriyor. Üretim etkisini ayrıca
                    kontrol etmek doğru olur.
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2 xl:justify-end">
                <AddRuleDrawer
                  initialData={rule}
                  availableProducts={availableProducts}
                  disabled={!databaseReady}
                />
                <DeleteRuleButton id={rule.id} />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}