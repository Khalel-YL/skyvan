import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

import type {
  AvailableProductOption,
  RuleConditionItem,
  RuleDraftPrefill,
  RuleSeverity,
  RuleType,
} from "./types";

type StarterTemplateKnowledgeProduct = AvailableProductOption & {
  categoryName: string;
  powerDrawWatts: number;
  powerSupplyWatts: number;
  shortDescription: string | null;
  description: string | null;
  documents: Array<{
    type: string;
    title: string;
    note: string | null;
  }>;
  specs: Array<{
    specKey: string;
    specValue: number;
    unit: string | null;
  }>;
  scenarios: Array<{
    slug: string;
    suitabilityScore: number;
  }>;
};

type StarterTemplate = {
  id: string;
  title: string;
  description: string;
  sourceKeywords: string[];
  targetKeywords: string[];
  ruleType: RuleType;
  severity: RuleSeverity;
  priority: string;
  message: string;
  sourceHint: string;
  targetHint: string;
  conditions?: RuleConditionItem[];
};

type TemplateMatchItem = {
  template: StarterTemplate;
  sourceProduct: StarterTemplateKnowledgeProduct;
  targetProduct: StarterTemplateKnowledgeProduct;
  score: number;
  reasons: string[];
};

type RulesStarterTemplatesProps = {
  productsKnowledge?: StarterTemplateKnowledgeProduct[];
};

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "solar-to-mppt",
    title: "Solar → MPPT",
    description:
      "Solar panel ya da PV tarafı için uygun MPPT / solar charger eşleşmesini hızlı açar.",
    sourceKeywords: ["solar", "panel", "pv", "güneş", "gunes"],
    targetKeywords: ["mppt", "solar charger", "regulator", "regülatör", "regulator"],
    ruleType: "requires",
    severity: "soft_warning",
    priority: "18",
    message:
      "Solar üretim hattı için uygun MPPT / solar charger eşleşmesi teknik doğrulamayla birlikte önerilir.",
    sourceHint: "Solar panel / PV / güneş üretimi",
    targetHint: "MPPT / solar charger / regulator",
  },
  {
    id: "inverter-to-battery",
    title: "Inverter → Akü",
    description:
      "İnverter seçimi için akü tarafında destek ihtiyacını hızlıca kural olarak açar.",
    sourceKeywords: ["inverter", "invertor"],
    targetKeywords: ["battery", "akü", "aku", "lithium", "lifepo4", "agm", "gel"],
    ruleType: "requires",
    severity: "soft_warning",
    priority: "16",
    message:
      "İnverter seçimi, uygun akü kapasitesi ve sistem voltajı ile birlikte teknik olarak doğrulanmalıdır.",
    sourceHint: "İnverter",
    targetHint: "Akü / battery",
  },
  {
    id: "charger-to-battery",
    title: "Şarj Sistemi → Akü",
    description:
      "Şarj cihazı, DC-DC ya da charger yapılarından akü tarafına destek kuralı açar.",
    sourceKeywords: ["charger", "dc-dc", "dcdc", "şarj", "sarj", "alternator"],
    targetKeywords: ["battery", "akü", "aku", "lifepo4", "agm", "gel"],
    ruleType: "requires",
    severity: "soft_warning",
    priority: "17",
    message:
      "Şarj sistemi seçimi, akü kimyası ve sistem voltajı ile birlikte değerlendirilmelidir.",
    sourceHint: "Charger / DC-DC / şarj sistemi",
    targetHint: "Akü / battery",
  },
  {
    id: "battery-to-bms",
    title: "Akü → BMS / İzleme",
    description:
      "Akü ürünleri için BMS, monitor veya battery management tarafında öneri açar.",
    sourceKeywords: ["battery", "akü", "aku", "lifepo4", "agm", "gel"],
    targetKeywords: ["bms", "monitor", "shunt", "battery monitor", "izleme"],
    ruleType: "recommends",
    severity: "soft_warning",
    priority: "28",
    message:
      "Akü hattında izleme / BMS katmanı sistem sağlığı ve operasyon görünürlüğü için önerilir.",
    sourceHint: "Akü / battery",
    targetHint: "BMS / monitor / shunt",
  },
  {
    id: "aircon-to-inverter",
    title: "Klima → İnverter",
    description:
      "Yüksek çekişli klima benzeri ürünlerde inverter gereksinimini hızlı açar.",
    sourceKeywords: ["air", "clima", "klima", "ac"],
    targetKeywords: ["inverter", "invertor"],
    ruleType: "requires",
    severity: "hard_block",
    priority: "12",
    message:
      "Klima gibi yüksek çekişli yükler için uygun inverter olmadan seçim finalize edilmemelidir.",
    sourceHint: "Klima / yüksek çekişli AC yük",
    targetHint: "İnverter",
  },
  {
    id: "water-pump-to-fuse",
    title: "Pompa → Koruma / Sigorta",
    description:
      "Pompa ve benzeri teknik ekipmanlarda koruma hattını görünür başlatır.",
    sourceKeywords: ["pump", "pompa", "water"],
    targetKeywords: ["fuse", "sigorta", "protection", "breaker"],
    ruleType: "recommends",
    severity: "soft_warning",
    priority: "34",
    message:
      "Pompa ve benzeri ekipmanlar için uygun sigorta / koruma hattı önerilir.",
    sourceHint: "Pompa / water system",
    targetHint: "Sigorta / protection / breaker",
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKeywordScore(text: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => {
    return text.includes(normalizeText(keyword)) ? score + 1 : score;
  }, 0);
}

function buildProductCorpus(product: StarterTemplateKnowledgeProduct) {
  return normalizeText(
    [
      product.name,
      product.slug,
      product.categoryName,
      product.shortDescription ?? "",
      product.description ?? "",
      ...product.documents.flatMap((document) => [
        document.type,
        document.title,
        document.note ?? "",
      ]),
      ...product.specs.flatMap((spec) => [spec.specKey, spec.unit ?? ""]),
      ...product.scenarios.map((scenario) => scenario.slug),
    ].join(" "),
  );
}

function serializeConditions(conditions: RuleConditionItem[]) {
  return conditions
    .map((condition) => `${condition.conditionType}:${condition.targetId}`)
    .join("|");
}

function buildDraftHref(prefill: RuleDraftPrefill) {
  const params = new URLSearchParams();

  params.set("draftOpen", "1");
  params.set("draftSourceProductId", prefill.sourceProductId);
  params.set("draftTargetProductId", prefill.targetProductId);
  params.set("draftRuleType", prefill.ruleType);
  params.set("draftSeverity", prefill.severity);
  params.set("draftPriority", prefill.priority);
  params.set("draftMessage", prefill.message);

  if (prefill.conditions.length > 0) {
    params.set("draftConditions", serializeConditions(prefill.conditions));
  }

  return `/admin/rules?${params.toString()}`;
}

function buildTemplateMatches(
  productsKnowledge: StarterTemplateKnowledgeProduct[] = [],
): TemplateMatchItem[] {
  const products = productsKnowledge.filter((product) => product.status !== "archived");
  const matches: TemplateMatchItem[] = [];

  for (const template of STARTER_TEMPLATES) {
    for (const sourceProduct of products) {
      const sourceCorpus = buildProductCorpus(sourceProduct);
      const sourceKeywordScore = getKeywordScore(
        sourceCorpus,
        template.sourceKeywords,
      );

      if (sourceKeywordScore === 0) {
        continue;
      }

      for (const targetProduct of products) {
        if (targetProduct.id === sourceProduct.id) {
          continue;
        }

        const targetCorpus = buildProductCorpus(targetProduct);
        const targetKeywordScore = getKeywordScore(
          targetCorpus,
          template.targetKeywords,
        );

        if (targetKeywordScore === 0) {
          continue;
        }

        let score = sourceKeywordScore * 12 + targetKeywordScore * 10;
        const reasons: string[] = [];

        if (sourceProduct.categoryName) {
          score += 2;
          reasons.push(`Kaynak kategori: ${sourceProduct.categoryName}`);
        }

        if (targetProduct.categoryName) {
          score += 2;
          reasons.push(`Hedef kategori: ${targetProduct.categoryName}`);
        }

        if (sourceProduct.documents.length > 0) {
          score += Math.min(sourceProduct.documents.length, 3);
          reasons.push(`Kaynak belge: ${sourceProduct.documents.length}`);
        }

        if (targetProduct.documents.length > 0) {
          score += Math.min(targetProduct.documents.length, 3);
          reasons.push(`Hedef belge: ${targetProduct.documents.length}`);
        }

        if (sourceProduct.specs.length > 0) {
          score += Math.min(sourceProduct.specs.length, 3);
          reasons.push(`Kaynak spec: ${sourceProduct.specs.length}`);
        }

        if (targetProduct.specs.length > 0) {
          score += Math.min(targetProduct.specs.length, 3);
          reasons.push(`Hedef spec: ${targetProduct.specs.length}`);
        }

        if (sourceProduct.scenarios.length > 0 && targetProduct.scenarios.length > 0) {
          const sharedScenarioCount = sourceProduct.scenarios.filter((scenario) =>
            targetProduct.scenarios.some(
              (targetScenario) => targetScenario.slug === scenario.slug,
            ),
          ).length;

          if (sharedScenarioCount > 0) {
            score += sharedScenarioCount * 4;
            reasons.push(`Ortak senaryo: ${sharedScenarioCount}`);
          }
        }

        if (sourceProduct.powerDrawWatts > 0) {
          score += 2;
          reasons.push("Kaynak güç çekişi var");
        }

        if (targetProduct.powerSupplyWatts > 0) {
          score += 2;
          reasons.push("Hedef güç beslemesi var");
        }

        matches.push({
          template,
          sourceProduct,
          targetProduct,
          score,
          reasons,
        });
      }
    }
  }

  const deduped = new Map<string, TemplateMatchItem>();

  for (const item of matches) {
    const key = `${item.template.id}::${item.sourceProduct.id}::${item.targetProduct.id}`;
    const current = deduped.get(key);

    if (!current || item.score > current.score) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function buildPrefill(match: TemplateMatchItem): RuleDraftPrefill {
  return {
    sourceProductId: match.sourceProduct.id,
    targetProductId: match.targetProduct.id,
    ruleType: match.template.ruleType,
    severity: match.template.severity,
    priority: match.template.priority,
    message: match.template.message,
    conditions: match.template.conditions ?? [],
  };
}

function badgeClass(
  value: RuleType | RuleSeverity,
  kind: "ruleType" | "severity",
) {
  if (kind === "ruleType") {
    switch (value) {
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

  switch (value) {
    case "hard_block":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100";
    case "soft_warning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function ruleTypeLabel(value: RuleType) {
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

function severityLabel(value: RuleSeverity) {
  switch (value) {
    case "hard_block":
      return "Sert blok";
    case "soft_warning":
      return "Yumuşak uyarı";
    default:
      return value;
  }
}

function buildFallbackHref(template: StarterTemplate) {
  const prefill: RuleDraftPrefill = {
    sourceProductId: "",
    targetProductId: "",
    ruleType: template.ruleType,
    severity: template.severity,
    priority: template.priority,
    message: template.message,
    conditions: template.conditions ?? [],
  };

  return buildDraftHref(prefill);
}

export default function RulesStarterTemplates({
  productsKnowledge = [],
}: RulesStarterTemplatesProps) {
  const matches = buildTemplateMatches(productsKnowledge);
  const showFallbackTemplates = matches.length === 0;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-violet-500/10 p-2 text-violet-300">
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Rules Templates Lite
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">
            Hazır şablonlar ve hızlı rule açılışı
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Bu panel ürün adı, kategori, açıklama, belge, spec, senaryo ve güç
            sinyalini birlikte kullanarak hızlı başlangıç önerileri üretir.
          </p>
        </div>
      </div>

      {showFallbackTemplates ? (
        <>
          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300">
            Güçlü template eşleşmesi bulunamadı. Bu hata değildir; ürün verileri
            zenginleştikçe panel daha güçlü sonuç verecek. Bu arada aşağıdaki
            çekirdek şablonlarla hızlı başlangıç yapabilirsin.
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {STARTER_TEMPLATES.slice(0, 6).map((template) => (
              <article
                key={template.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {template.title}
                      </h3>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-400">
                      {template.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/80 p-2 text-zinc-300">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(
                      template.ruleType,
                      "ruleType",
                    )}`}
                  >
                    {ruleTypeLabel(template.ruleType)}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(
                      template.severity,
                      "severity",
                    )}`}
                  >
                    {severityLabel(template.severity)}
                  </span>

                  <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                    Öncelik {template.priority}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Başlangıç ipucu
                  </div>
                  <div className="mt-2 text-sm text-zinc-100">
                    Kaynak: {template.sourceHint}
                  </div>
                  <div className="mt-1 text-sm text-zinc-100">
                    Hedef: {template.targetHint}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm leading-6 text-zinc-300">
                  {template.message}
                </div>

                <div className="mt-4">
                  <Link
                    href={buildFallbackHref(template)}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
                  >
                    Taslak olarak aç
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {matches.map((match) => {
            const prefill = buildPrefill(match);

            return (
              <article
                key={`${match.template.id}-${match.sourceProduct.id}-${match.targetProduct.id}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {match.template.title}
                      </h3>

                      <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                        Skor {match.score}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-zinc-400">
                      {match.template.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-950/80 p-2 text-zinc-300">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(
                      match.template.ruleType,
                      "ruleType",
                    )}`}
                  >
                    {ruleTypeLabel(match.template.ruleType)}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(
                      match.template.severity,
                      "severity",
                    )}`}
                  >
                    {severityLabel(match.template.severity)}
                  </span>

                  <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                    Öncelik {match.template.priority}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Önerilen eşleşme
                  </div>
                  <div className="mt-2 text-sm text-zinc-100">
                    {match.sourceProduct.name} → {match.targetProduct.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {match.sourceProduct.slug} → {match.targetProduct.slug}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {match.reasons.slice(0, 5).map((reason) => (
                    <span
                      key={`${match.template.id}-${match.sourceProduct.id}-${match.targetProduct.id}-${reason}`}
                      className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-sm leading-6 text-zinc-300">
                  {match.template.message}
                </div>

                <div className="mt-4">
                  <Link
                    href={buildDraftHref(prefill)}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
                  >
                    Taslak olarak aç
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}