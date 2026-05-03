"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { saveRule } from "./actions";
import {
  initialRuleFormState,
  type AvailableProductOption,
  type RuleConditionCatalog,
  type RuleConditionItem,
  type RuleConditionType,
  type RuleDraftPrefill,
  type RuleFormState,
  type RuleListItem,
  type RuleSeverity,
  type RuleType,
} from "./types";

type AddRuleDrawerProps = {
  initialData?: RuleListItem | null;
  availableProducts: AvailableProductOption[];
  conditionCatalog: RuleConditionCatalog;
  disabled?: boolean;
  prefillDraft?: RuleDraftPrefill | null;
  forceOpen?: boolean;
  triggerLabel?: string;
};

function toFormValues(
  initialData?: RuleListItem | null,
  prefillDraft?: RuleDraftPrefill | null,
) {
  if (initialData) {
    return {
      id: initialData.id,
      sourceProductId: initialData.sourceProductId,
      targetProductId: initialData.targetProductId,
      ruleType: initialData.ruleType,
      severity: initialData.severity,
      priority: String(initialData.priority),
      message: initialData.message ?? "",
      conditions: initialData.conditions ?? [],
    };
  }

  return {
    id: "",
    sourceProductId: prefillDraft?.sourceProductId ?? "",
    targetProductId: prefillDraft?.targetProductId ?? "",
    ruleType: (prefillDraft?.ruleType ?? "requires") as RuleType,
    severity: (prefillDraft?.severity ?? "hard_block") as RuleSeverity,
    priority: String(prefillDraft?.priority ?? "10"),
    message: prefillDraft?.message ?? "",
    conditions: prefillDraft?.conditions ?? [],
  };
}

function Field({
  label,
  hint,
  children,
  error,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700";

function segmentedClass(active: boolean) {
  return active
    ? "border-zinc-600 bg-zinc-100 text-zinc-900"
    : "border-transparent bg-transparent text-zinc-300 hover:text-zinc-100";
}

function conditionTypeLabel(type: RuleConditionType) {
  switch (type) {
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

function conditionBadgeClass(type: RuleConditionType) {
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

function getInitialConditionType(
  conditionCatalog: RuleConditionCatalog,
): RuleConditionType {
  if (conditionCatalog.modelOptions.length > 0) {
    return "model";
  }

  if (conditionCatalog.packageOptions.length > 0) {
    return "package";
  }

  if (conditionCatalog.scenarioOptions.length > 0) {
    return "scenario";
  }

  return "model";
}

function RuleDrawerForm({
  defaults,
  isEdit,
  availableProducts,
  conditionCatalog,
  onCancel,
}: {
  defaults: ReturnType<typeof toFormValues>;
  isEdit: boolean;
  availableProducts: AvailableProductOption[];
  conditionCatalog: RuleConditionCatalog;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<RuleFormState, FormData>(
    saveRule,
    initialRuleFormState,
  );
  const [ruleType, setRuleType] = useState<RuleType>(defaults.ruleType);
  const [severity, setSeverity] = useState<RuleSeverity>(defaults.severity);
  const [conditions, setConditions] = useState<RuleConditionItem[]>(
    defaults.conditions,
  );
  const [pendingConditionType, setPendingConditionType] =
    useState<RuleConditionType>(() => getInitialConditionType(conditionCatalog));
  const [pendingTargetId, setPendingTargetId] = useState("");

  const optionGroups = useMemo(
    () => ({
      model: conditionCatalog.modelOptions,
      package: conditionCatalog.packageOptions,
      scenario: conditionCatalog.scenarioOptions,
    }),
    [conditionCatalog],
  );

  const currentOptions = optionGroups[pendingConditionType];

  useEffect(() => {
    if (currentOptions.some((option) => option.id === pendingTargetId)) {
      return;
    }

    // Existing drawer state is synchronized to the currently selected condition group.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingTargetId(currentOptions[0]?.id ?? "");
  }, [currentOptions, pendingTargetId]);

  function addCondition() {
    const option = currentOptions.find((item) => item.id === pendingTargetId);

    if (!option) {
      return;
    }

    const alreadyExists = conditions.some(
      (condition) =>
        condition.conditionType === pendingConditionType &&
        condition.targetId === option.id,
    );

    if (alreadyExists) {
      return;
    }

    setConditions((current) => [
      ...current,
      {
        conditionType: pendingConditionType,
        targetId: option.id,
        label: option.label,
      },
    ]);
  }

  function removeCondition(index: number) {
    setConditions((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const hasConditionOptions = currentOptions.length > 0;

  return (
    <form action={formAction} className="space-y-6 p-6">
      {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="ruleType" value={ruleType} />
      <input type="hidden" name="severity" value={severity} />

      {conditions.map((condition, index) => (
        <div
          key={`${condition.conditionType}-${condition.targetId}-${index}`}
          className="hidden"
        >
          <input type="hidden" name="conditionType" value={condition.conditionType} />
          <input type="hidden" name="conditionTargetId" value={condition.targetId} />
        </div>
      ))}

      {state.message ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </div>
      ) : null}

      {!isEdit && defaults.sourceProductId && defaults.targetProductId ? (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Bu form bir öneri taslağından dolduruldu. Kaydetmeden önce mesajı,
          severity alanını ve scope koşullarını kontrol et.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Kaynak ürün"
          hint="Kuralın çıktığı ana ürün."
          error={state.fieldErrors.sourceProductId}
        >
          <select
            name="sourceProductId"
            defaultValue={defaults.sourceProductId}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.sourceProductId)}
          >
            <option value="">Ürün seç</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.slug}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Hedef ürün"
          hint="Kuralın etkilediği ikinci ürün."
          error={state.fieldErrors.targetProductId}
        >
          <select
            name="targetProductId"
            defaultValue={defaults.targetProductId}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.targetProductId)}
          >
            <option value="">Ürün seç</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.slug}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Kural tipi"
          hint="Uyumluluk davranışı."
          error={state.fieldErrors.ruleType}
        >
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setRuleType("requires")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                ruleType === "requires",
              )}`}
            >
              Requires
            </button>
            <button
              type="button"
              onClick={() => setRuleType("excludes")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                ruleType === "excludes",
              )}`}
            >
              Excludes
            </button>
            <button
              type="button"
              onClick={() => setRuleType("recommends")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                ruleType === "recommends",
              )}`}
            >
              Recommends
            </button>
          </div>
        </Field>

        <Field
          label="Şiddet"
          hint="Hard block veya soft warning."
          error={state.fieldErrors.severity}
        >
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setSeverity("hard_block")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                severity === "hard_block",
              )}`}
            >
              Hard Block
            </button>
            <button
              type="button"
              onClick={() => setSeverity("soft_warning")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                severity === "soft_warning",
              )}`}
            >
              Soft Warning
            </button>
          </div>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Field
          label="Öncelik"
          hint="Daha düşük sayı daha yüksek öncelik."
          error={state.fieldErrors.priority}
        >
          <input
            name="priority"
            type="number"
            min="1"
            max="100"
            step="1"
            defaultValue={defaults.priority}
            className={inputClassName}
            placeholder="10"
            aria-invalid={Boolean(state.fieldErrors.priority)}
          />
        </Field>

        <Field
          label="Açıklama"
          hint="Müşteri / admin uyarı metni. Opsiyonel."
          error={state.fieldErrors.message}
        >
          <textarea
            name="message"
            defaultValue={defaults.message}
            rows={4}
            className={`${inputClassName} min-h-[110px] resize-y`}
            placeholder="Örn: 220V klima seçimi için en az 3000W inverter gerekir."
            aria-invalid={Boolean(state.fieldErrors.message)}
          />
        </Field>
      </div>

      <Field
        label="Koşul kapsamı"
        hint="Koşul eklersen kural yalnızca ilgili model / paket / senaryo bağlamında çalışır. Boş bırakılırsa global uygulanır."
        error={state.fieldErrors.conditions}
      >
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
            <select
              value={pendingConditionType}
              onChange={(event) =>
                setPendingConditionType(event.target.value as RuleConditionType)
              }
              className={inputClassName}
            >
              <option value="model">Model</option>
              <option value="package">Paket</option>
              <option value="scenario">Senaryo</option>
            </select>

            <select
              value={pendingTargetId}
              onChange={(event) => setPendingTargetId(event.target.value)}
              className={inputClassName}
              disabled={!hasConditionOptions}
            >
              {hasConditionOptions ? null : (
                <option value="">Seçilebilir kayıt yok</option>
              )}

              {currentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={addCondition}
              disabled={!hasConditionOptions || !pendingTargetId}
              className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Koşul Ekle
            </button>
          </div>

          {!hasConditionOptions ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-500">
              Seçilen kapsam tipi için henüz kullanılabilir kayıt bulunamadı.
            </div>
          ) : null}

          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {conditions.map((condition, index) => (
                <div
                  key={`${condition.conditionType}-${condition.targetId}-${index}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${conditionBadgeClass(
                    condition.conditionType,
                  )}`}
                >
                  <span>
                    {conditionTypeLabel(condition.conditionType)} · {condition.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] transition hover:border-white/30"
                  >
                    Kaldır
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-500">
              Koşul eklenmedi. Bu kayıt global çalışacak.
            </div>
          )}
        </div>
      </Field>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        Drawer manuel kullanım için de, öneri taslağını düzenlemek için de aynı
        akışı kullanır. Böylece AI/doküman önerisi nihai kararı otomatik vermez;
        admin onay katmanı korunur.
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Vazgeç
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending
            ? "Kaydediliyor..."
            : isEdit
              ? "Kuralı Güncelle"
              : "Kuralı Kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AddRuleDrawer({
  initialData,
  availableProducts,
  conditionCatalog,
  disabled = false,
  prefillDraft = null,
  forceOpen = false,
  triggerLabel,
}: AddRuleDrawerProps) {
  const isEdit = Boolean(initialData);
  const defaults = useMemo(
    () => toFormValues(initialData, prefillDraft),
    [initialData, prefillDraft],
  );
  const [isOpen, setIsOpen] = useState(Boolean(forceOpen));
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      // Existing deep-link behavior opens a fresh drawer instance from query params.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormKey((current) => current + 1);
      setIsOpen(true);
    }
  }, [forceOpen]);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-500"
      >
        Veritabanı hazır değil
      </button>
    );
  }

  function openDrawer() {
    setFormKey((current) => current + 1);
    setIsOpen(true);
  }

  function closeDrawer() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
      >
        {triggerLabel ?? (isEdit ? "Düzenle" : "Kural Ekle")}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Rules
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {isEdit ? "Kural Düzenle" : "Yeni Kural"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Ürünler arası requires / excludes / recommends ilişkilerini yönet.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Kapat
              </button>
            </div>

            <RuleDrawerForm
              key={`${defaults.id || "new"}-${formKey}`}
              defaults={defaults}
              isEdit={isEdit}
              availableProducts={availableProducts}
              conditionCatalog={conditionCatalog}
              onCancel={closeDrawer}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
