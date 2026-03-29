"use client";

import { type ReactNode, useActionState, useMemo, useState } from "react";

import { saveRuleTemplate } from "./template-actions";
import {
  initialRuleTemplateFormState,
  type RuleSeverity,
  type RuleTemplateFormState,
  type RuleTemplateListItem,
  type RuleType,
} from "./types";

type RuleTemplatePrefill = {
  title?: string;
  slug?: string;
  description?: string;
  sourceHint?: string;
  targetHint?: string;
  defaultRuleType?: RuleType;
  defaultSeverity?: RuleSeverity;
  defaultPriority?: string;
  defaultMessage?: string;
  status?: "draft" | "active";
  sortOrder?: string;
};

type AddRuleTemplateDrawerProps = {
  initialData?: RuleTemplateListItem | null;
  prefill?: RuleTemplatePrefill | null;
  disabled?: boolean;
  triggerLabel?: string;
};

function toFormValues(
  initialData?: RuleTemplateListItem | null,
  prefill?: RuleTemplatePrefill | null,
) {
  if (initialData) {
    return {
      id: initialData.id,
      title: initialData.title,
      slug: initialData.slug,
      description: initialData.description ?? "",
      sourceHint: initialData.sourceHint ?? "",
      targetHint: initialData.targetHint ?? "",
      defaultRuleType: initialData.defaultRuleType,
      defaultSeverity: initialData.defaultSeverity,
      defaultPriority: String(initialData.defaultPriority),
      defaultMessage: initialData.defaultMessage,
      status: initialData.status === "archived" ? "draft" : initialData.status,
      sortOrder: String(initialData.sortOrder),
    };
  }

  return {
    id: "",
    title: prefill?.title ?? "",
    slug: prefill?.slug ?? "",
    description: prefill?.description ?? "",
    sourceHint: prefill?.sourceHint ?? "",
    targetHint: prefill?.targetHint ?? "",
    defaultRuleType: prefill?.defaultRuleType ?? "requires",
    defaultSeverity: prefill?.defaultSeverity ?? "hard_block",
    defaultPriority: prefill?.defaultPriority ?? "10",
    defaultMessage: prefill?.defaultMessage ?? "",
    status: prefill?.status ?? "active",
    sortOrder: prefill?.sortOrder ?? "0",
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
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      </div>

      {children}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
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

function RuleTemplateDrawerForm({
  defaults,
  isEdit,
  onCancel,
}: {
  defaults: ReturnType<typeof toFormValues>;
  isEdit: boolean;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    saveRuleTemplate,
    initialRuleTemplateFormState,
  );

  const [defaultRuleType, setDefaultRuleType] = useState(defaults.defaultRuleType);
  const [defaultSeverity, setDefaultSeverity] = useState(defaults.defaultSeverity);

  return (
    <form action={formAction} className="space-y-5 p-6">
      {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="defaultRuleType" value={defaultRuleType} />
      <input type="hidden" name="defaultSeverity" value={defaultSeverity} />

      {state.message ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Şablon başlığı" error={state.fieldErrors.title}>
          <input
            type="text"
            name="title"
            defaultValue={defaults.title}
            disabled={isPending}
            placeholder="Solar → MPPT şablonu"
            className={inputClassName}
          />
        </Field>

        <Field
          label="Slug"
          hint="Boş bırakılırsa başlıktan üretilir"
          error={state.fieldErrors.slug}
        >
          <input
            type="text"
            name="slug"
            defaultValue={defaults.slug}
            disabled={isPending}
            placeholder="solar-mppt-template"
            className={inputClassName}
          />
        </Field>
      </div>

      <Field
        label="Kısa açıklama"
        hint="Kart üzerinde görünür"
        error={state.fieldErrors.description}
      >
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults.description}
          disabled={isPending}
          placeholder="Bu şablon neyi hızlandırıyor?"
          className={`${inputClassName} resize-none`}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Kaynak ipucu"
          hint="Virgülle anahtar kelimeler"
          error={state.fieldErrors.sourceHint}
        >
          <input
            type="text"
            name="sourceHint"
            defaultValue={defaults.sourceHint}
            disabled={isPending}
            placeholder="solar, panel, pv, gunes"
            className={inputClassName}
          />
        </Field>

        <Field
          label="Hedef ipucu"
          hint="Virgülle anahtar kelimeler"
          error={state.fieldErrors.targetHint}
        >
          <input
            type="text"
            name="targetHint"
            defaultValue={defaults.targetHint}
            disabled={isPending}
            placeholder="mppt, charge controller"
            className={inputClassName}
          />
        </Field>
      </div>

      <Field
        label="Varsayılan kural tipi"
        error={state.fieldErrors.defaultRuleType}
      >
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setDefaultRuleType("requires")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
              defaultRuleType === "requires",
            )}`}
          >
            Zorunlu
          </button>
          <button
            type="button"
            onClick={() => setDefaultRuleType("excludes")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
              defaultRuleType === "excludes",
            )}`}
          >
            Engeller
          </button>
          <button
            type="button"
            onClick={() => setDefaultRuleType("recommends")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
              defaultRuleType === "recommends",
            )}`}
          >
            Önerir
          </button>
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Varsayılan şiddet"
          error={state.fieldErrors.defaultSeverity}
        >
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setDefaultSeverity("hard_block")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                defaultSeverity === "hard_block",
              )}`}
            >
              Sert blok
            </button>
            <button
              type="button"
              onClick={() => setDefaultSeverity("soft_warning")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedClass(
                defaultSeverity === "soft_warning",
              )}`}
            >
              Yumuşak uyarı
            </button>
          </div>
        </Field>

        <Field
          label="Durum"
          error={state.fieldErrors.status}
        >
          <select
            name="status"
            defaultValue={defaults.status}
            disabled={isPending}
            className={inputClassName}
          >
            <option value="active">Aktif</option>
            <option value="draft">Taslak</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Varsayılan öncelik"
          hint="1 en yüksek"
          error={state.fieldErrors.defaultPriority}
        >
          <input
            type="number"
            name="defaultPriority"
            min={1}
            max={100}
            defaultValue={defaults.defaultPriority}
            disabled={isPending}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Sıralama"
          hint="Kart sırası"
          error={state.fieldErrors.sortOrder}
        >
          <input
            type="number"
            name="sortOrder"
            min={0}
            max={999}
            defaultValue={defaults.sortOrder}
            disabled={isPending}
            className={inputClassName}
          />
        </Field>
      </div>

      <Field
        label="Varsayılan mesaj"
        hint="Rule drawer içine prefill gider"
        error={state.fieldErrors.defaultMessage}
      >
        <textarea
          name="defaultMessage"
          rows={4}
          defaultValue={defaults.defaultMessage}
          disabled={isPending}
          placeholder="Bu şablon açıldığında önerilecek varsayılan açıklama."
          className={`${inputClassName} resize-none`}
        />
      </Field>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        Bu modül gerçek rule kaydı üretmez. Önce tekrar kullanılabilir şablonu
        kaydeder; ardından istenen şablon rule drawer’a uygulanır.
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
          {isPending ? "Kaydediliyor..." : isEdit ? "Şablonu güncelle" : "Şablonu kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AddRuleTemplateDrawer({
  initialData,
  prefill,
  disabled = false,
  triggerLabel,
}: AddRuleTemplateDrawerProps) {
  const isEdit = Boolean(initialData);
  const defaults = useMemo(() => toFormValues(initialData, prefill), [initialData, prefill]);
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
        {triggerLabel ?? (isEdit ? "Şablonu düzenle" : "Şablon ekle")}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Rules · Templates
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {isEdit ? "Şablon düzenle" : "Yeni şablon"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Tekrar kullanılabilir rule başlangıç kartlarını yönet.
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

            <RuleTemplateDrawerForm
              key={`${defaults.id || "new"}-${formKey}`}
              defaults={defaults}
              isEdit={isEdit}
              onCancel={closeDrawer}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
