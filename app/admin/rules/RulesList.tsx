import AddRuleDrawer from "./AddRuleDrawer";
import DeleteRuleButton from "./DeleteRuleButton";
import type {
  AvailableProductOption,
  RuleConditionCatalog,
  RuleListItem,
} from "./types";

type RulesListProps = {
  rules: RuleListItem[];
  availableProducts: AvailableProductOption[];
  conditionCatalog: RuleConditionCatalog;
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

function scopeBadgeClass(scopeKind: RuleListItem["scopeKind"]) {
  switch (scopeKind) {
    case "conditional":
      return "border-violet-500/30 bg-violet-500/10 text-violet-100";
    case "global":
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
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

function scopeLabel(scopeKind: RuleListItem["scopeKind"]) {
  switch (scopeKind) {
    case "conditional":
      return "Koşullu";
    case "global":
    default:
      return "Global";
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
  conditionCatalog,
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
      {rules.map((rule) => (
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

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${scopeBadgeClass(
                    rule.scopeKind,
                  )}`}
                >
                  {scopeLabel(rule.scopeKind)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {chip(`Kaynak ${rule.sourceProductSlug}`)}
                {chip(`Hedef ${rule.targetProductSlug}`)}
                {chip(`Öncelik ${rule.priority}`)}
                {chip(`Oluşturulma ${formatDate(rule.createdAt)}`)}
                {chip(`Koşul ${rule.conditionCount}`)}
              </div>

              {rule.message ? (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-6 text-zinc-300">
                  {rule.message}
                </div>
              ) : null}

              {rule.hasConditions ? (
                <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/80">
                    Condition Scope
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {rule.conditions.map((condition) => (
                      <span
                        key={`${rule.id}-${condition.conditionType}-${condition.targetId}`}
                        className="inline-flex rounded-full border border-violet-400/20 bg-black/20 px-2.5 py-1 text-[11px] text-violet-100"
                      >
                        {condition.conditionType}: {condition.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-400">
                  Bu kayıt global scope ile çalışır. Ek model / paket / senaryo koşulu yok.
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 xl:justify-end">
              <AddRuleDrawer
                initialData={rule}
                availableProducts={availableProducts}
                conditionCatalog={conditionCatalog}
                disabled={!databaseReady}
              />
              <DeleteRuleButton id={rule.id} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}