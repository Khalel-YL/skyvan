"use client";

import { useActionState, useMemo, useState } from "react";

import { saveRule } from "./actions";
import {
  initialRuleFormState,
  type AvailableProductOption,
  type RuleFormState,
  type RuleListItem,
  type RuleSeverity,
  type RuleType,
} from "./types";

type AddRuleDrawerProps = {
  initialData?: RuleListItem | null;
  availableProducts: AvailableProductOption[];
  disabled?: boolean;
};

function toFormValues(initialData?: RuleListItem | null) {
  return {
    id: initialData?.id ?? "",
    sourceProductId: initialData?.sourceProductId ?? "",
    targetProductId: initialData?.targetProductId ?? "",
    ruleType: (initialData?.ruleType ?? "requires") as RuleType,
    severity: (initialData?.severity ?? "hard_block") as RuleSeverity,
    priority: String(initialData?.priority ?? 10),
    message: initialData?.message ?? "",
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

function RuleDrawerForm({
  defaults,
  isEdit,
  availableProducts,
  onCancel,
}: {
  defaults: ReturnType<typeof toFormValues>;
  isEdit: boolean;
  availableProducts: AvailableProductOption[];
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<RuleFormState, FormData>(
    saveRule,
    initialRuleFormState,
  );
  const [ruleType, setRuleType] = useState<RuleType>(defaults.ruleType);
  const [severity, setSeverity] = useState<RuleSeverity>(defaults.severity);

  return (
    <form action={formAction} className="space-y-6 p-6">
      {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="ruleType" value={ruleType} />
      <input type="hidden" name="severity" value={severity} />

      {state.message ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
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

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        Bu batch’te yalnızca ürünler arası temel uyumluluk kuralı açılıyor.
        ruleConditions builder katmanı sonraki mini-batch’e bırakılıyor.
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
  disabled = false,
}: AddRuleDrawerProps) {
  const isEdit = Boolean(initialData);
  const defaults = useMemo(() => toFormValues(initialData), [initialData]);
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

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
        {isEdit ? "Düzenle" : "Kural Ekle"}
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
              onCancel={closeDrawer}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}