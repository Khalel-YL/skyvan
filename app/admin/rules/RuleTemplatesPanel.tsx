import AddRuleDrawer from "./AddRuleDrawer";
import AddRuleTemplateDrawer from "./AddRuleTemplateDrawer";
import { archiveRuleTemplate, restoreRuleTemplate } from "./template-actions";
import type {
  AvailableProductOption,
  RuleConditionCatalog,
  RuleDraftPrefill,
  RuleTemplateListItem,
  RuleTemplateStatus,
} from "./types";

type RuleTemplatesPanelProps = {
  templates: RuleTemplateListItem[];
  availableProducts: AvailableProductOption[];
  conditionCatalog: RuleConditionCatalog;
  databaseReady: boolean;
};

type StarterTemplateSeed = {
  id: string;
  title: string;
  description: string;
  tone: "warning" | "info" | "success";
  prefill: {
    title: string;
    slug: string;
    description: string;
    sourceHint: string;
    targetHint: string;
    defaultRuleType: "requires" | "excludes" | "recommends";
    defaultSeverity: "hard_block" | "soft_warning";
    defaultPriority: string;
    defaultMessage: string;
    status: "active" | "draft";
    sortOrder: string;
  };
};

function toneCardClass(tone: StarterTemplateSeed["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "warning":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "info":
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
  }
}

function statusBadgeClass(status: RuleTemplateStatus) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "draft":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "archived":
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }
}

function statusLabel(status: RuleTemplateStatus) {
  switch (status) {
    case "active":
      return "Aktif";
    case "draft":
      return "Taslak";
    case "archived":
    default:
      return "Arşiv";
  }
}

function ruleTypeLabel(value: RuleTemplateListItem["defaultRuleType"]) {
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

function severityLabel(value: RuleTemplateListItem["defaultSeverity"]) {
  switch (value) {
    case "hard_block":
      return "Sert blok";
    case "soft_warning":
      return "Yumuşak uyarı";
    default:
      return value;
  }
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ç", "c");
}

function buildKeywordList(value: string | null | undefined) {
  return normalizeText(value)
    .split(/[;,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchProductByHint(
  products: AvailableProductOption[],
  hint: string | null | undefined,
  excludeId?: string,
) {
  const keywords = buildKeywordList(hint);

  if (keywords.length === 0) {
    return null;
  }

  return (
    products.find((product) => {
      if (excludeId && product.id === excludeId) {
        return false;
      }

      const haystack = normalizeText(`${product.name} ${product.slug}`);
      return keywords.some((keyword) => haystack.includes(keyword));
    }) ?? null
  );
}

function buildRuleDraftFromTemplate(
  template: RuleTemplateListItem,
  availableProducts: AvailableProductOption[],
): RuleDraftPrefill {
  const sourceProduct = matchProductByHint(availableProducts, template.sourceHint);
  const targetProduct = matchProductByHint(
    availableProducts,
    template.targetHint,
    sourceProduct?.id,
  );

  return {
    sourceProductId: sourceProduct?.id ?? "",
    targetProductId: targetProduct?.id ?? "",
    ruleType: template.defaultRuleType,
    severity: template.defaultSeverity,
    priority: String(template.defaultPriority),
    message: template.defaultMessage,
    conditions: [],
  };
}

const starterTemplateSeeds: StarterTemplateSeed[] = [
  {
    id: "seed-template-solar-mppt",
    title: "Solar → MPPT şablonu",
    description:
      "Solar panel seçildiğinde MPPT / solar charge controller tarafını zorunlu açmak için başlangıç şablonu.",
    tone: "warning",
    prefill: {
      title: "Solar → MPPT şablonu",
      slug: "solar-mppt-template",
      description:
        "Solar panel ile MPPT / solar charge controller arasındaki çekirdek bağımlılığı hızlandırır.",
      sourceHint: "solar, panel, pv, gunes",
      targetHint: "mppt, solar controller, charge controller",
      defaultRuleType: "requires",
      defaultSeverity: "hard_block",
      defaultPriority: "10",
      defaultMessage:
        "Solar panel ürünlerinde MPPT / solar charge controller zorunluluğu için hazır şablon.",
      status: "active",
      sortOrder: "10",
    },
  },
  {
    id: "seed-template-inverter-battery",
    title: "Inverter → akü şablonu",
    description:
      "İnverter seçimlerinde akü bağımlılığını hızla standardize etmek için başlangıç şablonu.",
    tone: "warning",
    prefill: {
      title: "Inverter → akü şablonu",
      slug: "inverter-battery-template",
      description:
        "İnverter ile akü arasındaki çekirdek teknik bağımlılığı standardize eder.",
      sourceHint: "inverter, multiplus, converter",
      targetHint: "battery, aku, akü, batarya, lifepo4, lithium",
      defaultRuleType: "requires",
      defaultSeverity: "hard_block",
      defaultPriority: "10",
      defaultMessage:
        "Inverter ürünlerinde uygun akü zorunluluğu için hazır şablon.",
      status: "active",
      sortOrder: "20",
    },
  },
  {
    id: "seed-template-charger-battery",
    title: "Şarj sistemi → akü şablonu",
    description:
      "DC-DC / charger ürünlerinde akü bağımlılığını açık hale getirmek için başlangıç şablonu.",
    tone: "info",
    prefill: {
      title: "Şarj sistemi → akü şablonu",
      slug: "charger-battery-template",
      description:
        "Şarj sistemleri için akü bağımlılığını tekrar kullanılabilir biçimde tanımlar.",
      sourceHint: "charger, sarj, şarj, dcdc, dc-dc",
      targetHint: "battery, aku, akü, batarya, lifepo4, lithium",
      defaultRuleType: "requires",
      defaultSeverity: "hard_block",
      defaultPriority: "15",
      defaultMessage:
        "Şarj sistemi ürünlerinde akü zorunluluğu için hazır şablon.",
      status: "active",
      sortOrder: "30",
    },
  },
  {
    id: "seed-template-battery-monitor",
    title: "Akü → BMS/izleme şablonu",
    description:
      "Akü ürünlerinde BMS veya monitor önerisini güvenli başlangıç olarak açmak için şablon.",
    tone: "success",
    prefill: {
      title: "Akü → BMS/izleme şablonu",
      slug: "battery-monitor-template",
      description:
        "Akü ürünlerinde BMS / monitor önerisini tekrar kullanılabilir biçimde sunar.",
      sourceHint: "battery, aku, akü, batarya, lifepo4, lithium",
      targetHint: "bms, monitor, shunt, battery monitor",
      defaultRuleType: "recommends",
      defaultSeverity: "soft_warning",
      defaultPriority: "35",
      defaultMessage:
        "Akü ürünlerinde BMS / monitor önerisi için hazır şablon.",
      status: "active",
      sortOrder: "40",
    },
  },
];

export default function RuleTemplatesPanel({
  templates,
  availableProducts,
  conditionCatalog,
  databaseReady,
}: RuleTemplatesPanelProps) {
  const activeAndDraftTemplates = templates.filter(
    (template) => template.status !== "archived",
  );
  const archivedTemplates = templates.filter(
    (template) => template.status === "archived",
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Rules · Templates
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">
                Yönetilebilir şablon katmanı
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                Sabit 4 kart yerine admin içinde yönetilen, tekrar kullanılabilir
                rule template kayıtları. Şablonlar rule drawer’a prefill olarak
                uygulanır; doğrudan rule kaydı üretmez.
              </p>
            </div>
          </div>

          <AddRuleTemplateDrawer
            disabled={!databaseReady}
            triggerLabel="Şablon ekle"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Hazır template seed'leri
            </div>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">
              İlk template kayıtlarını hızlı üret
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Bu kartlar rule değil, template oluşturur. Sonra template’i istediğin
              kadar tekrar kullanırsın.
            </p>
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs text-zinc-300">
            {starterTemplateSeeds.length} seed
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {starterTemplateSeeds.map((seed) => (
            <article
              key={seed.id}
              className={`rounded-2xl border p-4 ${toneCardClass(seed.tone)}`}
            >
              <h4 className="text-sm font-semibold">{seed.title}</h4>
              <p className="mt-2 text-xs leading-5 opacity-90">
                {seed.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-zinc-700 bg-black/20 px-2.5 py-1 text-[11px] text-zinc-100">
                  Tip: {ruleTypeLabel(seed.prefill.defaultRuleType)}
                </span>
                <span className="inline-flex rounded-full border border-zinc-700 bg-black/20 px-2.5 py-1 text-[11px] text-zinc-100">
                  Şiddet: {severityLabel(seed.prefill.defaultSeverity)}
                </span>
                <span className="inline-flex rounded-full border border-zinc-700 bg-black/20 px-2.5 py-1 text-[11px] text-zinc-100">
                  Sıra: {seed.prefill.sortOrder}
                </span>
              </div>

              <div className="mt-4">
                <AddRuleTemplateDrawer
                  disabled={!databaseReady}
                  prefill={seed.prefill}
                  triggerLabel="Template seed aç"
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Kayıtlı template'ler
            </div>
            <h3 className="mt-2 text-lg font-semibold text-zinc-100">
              Şablonları uygula, düzenle ve yaşam döngüsünü yönet
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Aktif ve taslak şablonlar rule drawer’a prefill gider. Arşivlenen
              şablonlar korunur ama operasyonda pasif kalır.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1">
              Aktif/Taslak {activeAndDraftTemplates.length}
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1">
              Arşiv {archivedTemplates.length}
            </span>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Henüz kayıtlı rule template yok. Önce yukarıdaki seed kartlarından biriyle
            başlamak en güvenli yol.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {templates.map((template) => {
              const prefillDraft = buildRuleDraftFromTemplate(
                template,
                availableProducts,
              );

              const sourcePreview = prefillDraft.sourceProductId
                ? availableProducts.find(
                    (product) => product.id === prefillDraft.sourceProductId,
                  )?.name ?? "Kaynak eşleşti"
                : "Kaynak elle seçilecek";

              const targetPreview = prefillDraft.targetProductId
                ? availableProducts.find(
                    (product) => product.id === prefillDraft.targetProductId,
                  )?.name ?? "Hedef eşleşti"
                : "Hedef elle seçilecek";

              return (
                <article
                  key={template.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-100">
                          {template.title}
                        </h4>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${statusBadgeClass(
                            template.status,
                          )}`}
                        >
                          {statusLabel(template.status)}
                        </span>

                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                          {template.slug}
                        </span>
                      </div>

                      {template.description ? (
                        <p className="mt-2 text-xs leading-5 text-zinc-400">
                          {template.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                          Tip: {ruleTypeLabel(template.defaultRuleType)}
                        </span>
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                          Şiddet: {severityLabel(template.defaultSeverity)}
                        </span>
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                          Öncelik: {template.defaultPriority}
                        </span>
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                          Sıra: {template.sortOrder}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 lg:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Kaynak ipucu
                          </p>
                          <p className="mt-1 text-xs text-zinc-300">
                            {template.sourceHint || "Tanımlı değil"}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Eşleşme: {sourcePreview}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Hedef ipucu
                          </p>
                          <p className="mt-1 text-xs text-zinc-300">
                            {template.targetHint || "Tanımlı değil"}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Eşleşme: {targetPreview}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Varsayılan mesaj
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-300">
                          {template.defaultMessage}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 xl:w-[280px] xl:justify-end">
                      {template.status !== "archived" ? (
                        <AddRuleDrawer
                          availableProducts={availableProducts}
                          conditionCatalog={conditionCatalog}
                          disabled={!databaseReady}
                          prefillDraft={prefillDraft}
                          triggerLabel="Rule'a uygula"
                        />
                      ) : null}

                      <AddRuleTemplateDrawer
                        initialData={template}
                        disabled={!databaseReady}
                        triggerLabel="Düzenle"
                      />

                      {template.status === "archived" ? (
                        <form action={restoreRuleTemplate}>
                          <input type="hidden" name="id" value={template.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                          >
                            Restore
                          </button>
                        </form>
                      ) : (
                        <form action={archiveRuleTemplate}>
                          <input type="hidden" name="id" value={template.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                          >
                            Arşivle
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
