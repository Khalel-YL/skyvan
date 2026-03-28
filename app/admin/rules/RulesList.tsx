import AddRuleDrawer from "./AddRuleDrawer";
import DeleteRuleButton from "./DeleteRuleButton";
import type {
  AvailableProductOption,
  RuleConditionCatalog,
  RuleConditionItem,
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
    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
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

function conditionBadgeClass(conditionType: RuleConditionItem["conditionType"]) {
  switch (conditionType) {
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

function conditionPrefix(conditionType: RuleConditionItem["conditionType"]) {
  switch (conditionType) {
    case "model":
      return "Model";
    case "package":
      return "Paket";
    case "scenario":
      return "Senaryo";
    default:
      return "Koşul";
  }
}

export function RulesList({
  rules,
  availableProducts,
  conditionCatalog,
  databaseReady,
}: RulesListProps) {
  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-zinc-100">
          Kayıt bulunamadı
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Filtre sonucu eşleşen kural yok. Yeni kural ekleyebilir ya da filtreleri
          temizleyebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
                  {rule.sourceProductLabel} → {rule.targetProductLabel}
                </h3>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${ruleTypeBadgeClass(
                    rule.ruleType,
                  )}`}
                >
                  {rule.ruleType}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityBadgeClass(
                    rule.severity,
                  )}`}
                >
                  {rule.severity}
                </span>

                <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  {rule.hasConditions ? "Koşullu" : "Global"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {chip(`Kaynak ${rule.sourceProductSlug}`)}
                {chip(`Hedef ${rule.targetProductSlug}`)}
                {chip(`Öncelik ${rule.priority}`)}
              </div>

              {rule.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {rule.conditions.map((condition) => (
                    <span
                      key={`${rule.id}-${condition.conditionType}-${condition.targetId}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${conditionBadgeClass(
                        condition.conditionType,
                      )}`}
                    >
                      {conditionPrefix(condition.conditionType)} · {condition.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  Bu kayıt global çalışır. Model / paket / senaryo koşulu yok.
                </p>
              )}

              {rule.message ? (
                <p className="max-w-3xl text-sm leading-6 text-zinc-400">
                  {rule.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <AddRuleDrawer
                initialData={rule}
                availableProducts={availableProducts}
                conditionCatalog={conditionCatalog}
                disabled={!databaseReady}
              />
              <DeleteRuleButton id={rule.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}