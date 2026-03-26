import { asc } from "drizzle-orm";

import { db } from "@/db/db";
import { compatibilityRules, products } from "@/db/schema";

import AddRuleDrawer from "./AddRuleDrawer";
import { RuleFilters } from "./RuleFilters";
import { RulesList } from "./RulesList";
import { RulesSummary } from "./RulesSummary";
import type {
  AvailableProductOption,
  RuleListItem,
  RuleSeverity,
  RuleType,
} from "./types";

type RulesPageProps = {
  searchParams?: Promise<{
    q?: string;
    ruleType?: string;
    severity?: string;
    saved?: string;
    created?: string;
    updated?: string;
    ruleAction?: string;
    ruleCode?: string;
  }>;
};

async function getProductsSafely(): Promise<AvailableProductOption[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        status: products.status,
      })
      .from(products)
      .orderBy(asc(products.name));

    return rows;
  } catch (error) {
    console.error("Rules products fetch error:", error);
    return [];
  }
}

async function getRulesSafely(
  productMap: Map<string, AvailableProductOption>,
): Promise<RuleListItem[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: compatibilityRules.id,
        sourceProductId: compatibilityRules.sourceProductId,
        targetProductId: compatibilityRules.targetProductId,
        ruleType: compatibilityRules.ruleType,
        severity: compatibilityRules.severity,
        priority: compatibilityRules.priority,
        message: compatibilityRules.message,
        createdAt: compatibilityRules.createdAt,
      })
      .from(compatibilityRules);

    return rows
      .map((row) => {
        const source = productMap.get(row.sourceProductId);
        const target = productMap.get(row.targetProductId);

        return {
          id: row.id,
          sourceProductId: row.sourceProductId,
          targetProductId: row.targetProductId,
          sourceProductLabel: source?.name ?? row.sourceProductId,
          sourceProductSlug: source?.slug ?? "unknown",
          targetProductLabel: target?.name ?? row.targetProductId,
          targetProductSlug: target?.slug ?? "unknown",
          ruleType: row.ruleType as RuleType,
          severity: row.severity as RuleSeverity,
          priority: row.priority,
          message: row.message,
          createdAt: row.createdAt,
        };
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        return a.sourceProductLabel.localeCompare(b.sourceProductLabel, "tr");
      });
  } catch (error) {
    console.error("Rules fetch error:", error);
    return [];
  }
}

function getFlashMessage(params: Awaited<RulesPageProps["searchParams"]>) {
  if (params?.saved && params?.created) {
    return "Kural kaydı oluşturuldu.";
  }

  if (params?.saved && params?.updated) {
    return "Kural kaydı güncellendi.";
  }

  if (params?.ruleAction === "deleted") {
    return "Kural kaydı kaldırıldı.";
  }

  if (params?.ruleAction === "error") {
    switch (params.ruleCode) {
      case "invalid-id":
        return "Geçersiz kural işlemi isteği alındı.";
      case "delete-failed":
        return "Kural kaldırılırken beklenmeyen bir hata oluştu.";
      default:
        return "Kural işlemi sırasında beklenmeyen bir hata oluştu.";
    }
  }

  return null;
}

function normalizeRuleType(value?: string) {
  if (
    value === "requires" ||
    value === "excludes" ||
    value === "recommends"
  ) {
    return value;
  }

  return "all";
}

function normalizeSeverity(value?: string) {
  if (value === "hard_block" || value === "soft_warning") {
    return value;
  }

  return "all";
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);

  const allProducts = await getProductsSafely();
  const availableProducts = allProducts.filter(
    (product) => product.status !== "archived",
  );

  const productMap = new Map(allProducts.map((product) => [product.id, product]));
  const allRules = await getRulesSafely(productMap);

  const query = (params.q ?? "").trim().toLowerCase();
  const ruleTypeFilter = normalizeRuleType(params.ruleType);
  const severityFilter = normalizeSeverity(params.severity);

  const filteredRules = allRules.filter((rule) => {
    const matchesQuery = query
      ? rule.sourceProductLabel.toLowerCase().includes(query) ||
        rule.sourceProductSlug.toLowerCase().includes(query) ||
        rule.targetProductLabel.toLowerCase().includes(query) ||
        rule.targetProductSlug.toLowerCase().includes(query) ||
        (rule.message ?? "").toLowerCase().includes(query)
      : true;

    const matchesRuleType =
      ruleTypeFilter === "all" ? true : rule.ruleType === ruleTypeFilter;

    const matchesSeverity =
      severityFilter === "all" ? true : rule.severity === severityFilter;

    return matchesQuery && matchesRuleType && matchesSeverity;
  });

  const stats = filteredRules.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.ruleType === "requires") acc.requiresCount += 1;
      if (item.ruleType === "excludes") acc.excludesCount += 1;
      if (item.ruleType === "recommends") acc.recommendsCount += 1;
      return acc;
    },
    {
      total: 0,
      requiresCount: 0,
      excludesCount: 0,
      recommendsCount: 0,
    },
  );

  const flashMessage = getFlashMessage(params);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Rules
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Kural Motoru
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
              Ürünler arası requires, excludes ve recommends kurallarını kompakt
              ve operasyonel biçimde yönet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AddRuleDrawer
            availableProducts={availableProducts}
            disabled={!databaseReady}
          />
        </div>
      </div>

      {!databaseReady ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
          Veritabanı yapılandırılmadığı için kayıt işlemleri pasif durumda.
        </div>
      ) : null}

      {flashMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {flashMessage}
        </div>
      ) : null}

      <RulesSummary
        total={stats.total}
        requiresCount={stats.requiresCount}
        excludesCount={stats.excludesCount}
        recommendsCount={stats.recommendsCount}
      />

      <RuleFilters
        query={params.q ?? ""}
        ruleType={ruleTypeFilter}
        severity={severityFilter}
      />

      <RulesList
        rules={filteredRules}
        availableProducts={availableProducts}
        databaseReady={databaseReady}
      />
    </div>
  );
}