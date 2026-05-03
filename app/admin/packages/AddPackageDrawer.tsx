"use client";

import { useActionState, useMemo, useState } from "react";

import { savePackage } from "./actions";
import { normalizePackageSlug } from "./package-slug";
import {
  initialPackageFormState,
  type AvailableModelOption,
  type PackageFormState,
  type PackageListItem,
} from "./types";

type AddPackageDrawerProps = {
  initialData?: PackageListItem | null;
  availableModels: AvailableModelOption[];
  disabled?: boolean;
};

function toFormValues(initialData?: PackageListItem | null) {
  return {
    id: initialData?.id ?? "",
    modelId: initialData?.modelId ?? "",
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    tierLevel: String(initialData?.tierLevel ?? 0),
    isDefault: Boolean(initialData?.isDefault),
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

function PackageDrawerForm({
  defaults,
  isEdit,
  availableModels,
  onCancel,
}: {
  defaults: ReturnType<typeof toFormValues>;
  isEdit: boolean;
  availableModels: AvailableModelOption[];
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<PackageFormState, FormData>(
    savePackage,
    initialPackageFormState,
  );
  const [slugInput, setSlugInput] = useState(defaults.slug);
  const [isDefault, setIsDefault] = useState(defaults.isDefault);

  const normalizedSlug = useMemo(
    () => normalizePackageSlug(slugInput),
    [slugInput],
  );

  return (
    <form action={formAction} className="space-y-6 p-6">
      {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="isDefault" value={String(isDefault)} />

      {state.message ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Paket adı"
          hint="Operasyon ekranında görünen yönetim adı."
          error={state.fieldErrors.name}
        >
          <input
            name="name"
            defaultValue={defaults.name}
            className={inputClassName}
            placeholder="Adventure Plus"
            aria-invalid={Boolean(state.fieldErrors.name)}
          />
        </Field>

        <Field
          label="Model"
          hint="Paket belirli bir model için geçerliyse seç; genel paketler boş kalabilir."
          error={state.fieldErrors.modelId}
        >
          <select
            name="modelId"
            defaultValue={defaults.modelId}
            className={inputClassName}
            aria-invalid={Boolean(state.fieldErrors.modelId)}
          >
            <option value="">Bağımsız paket</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.slug}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Paket kodu"
          hint="Slug çakışmasında güvenli öneri üretilir."
          error={state.fieldErrors.slug}
        >
          <div className="space-y-2">
            <input
              name="slug"
              value={slugInput}
              onChange={(event) => setSlugInput(event.target.value)}
              className={inputClassName}
              placeholder="adventure-plus"
              aria-invalid={Boolean(state.fieldErrors.slug)}
            />

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1">
                Sistem kodu: {normalizedSlug || "—"}
              </span>
            </div>

            {state.suggestedSlug ? (
              <button
                type="button"
                onClick={() => setSlugInput(state.suggestedSlug ?? "")}
                className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white"
              >
                Öneriyi uygula: {state.suggestedSlug}
              </button>
            ) : null}
          </div>
        </Field>

        <Field
          label="Seviye"
          hint="0 taban, daha yüksek sayı daha üst paket seviyesi."
          error={state.fieldErrors.tierLevel}
        >
          <input
            name="tierLevel"
            type="number"
            min="0"
            max="20"
            step="1"
            defaultValue={defaults.tierLevel}
            className={inputClassName}
            placeholder="0"
            aria-invalid={Boolean(state.fieldErrors.tierLevel)}
          />
        </Field>
      </div>

      <Field
        label="Varsayılan paket"
        hint="Aynı model veya bağımsız kapsam içinde tek varsayılan paket bırakılır."
        error={state.fieldErrors.isDefault}
      >
        <button
          type="button"
          onClick={() => setIsDefault((current) => !current)}
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium transition ${
            isDefault
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
          }`}
        >
          {isDefault ? "Varsayılan: Açık" : "Varsayılan: Kapalı"}
        </button>
      </Field>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        Varsayılan paket, aynı model veya genel kapsam içindeki öneriyi belirler.
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
              ? "Paketi Güncelle"
              : "Paketi Kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AddPackageDrawer({
  initialData,
  availableModels,
  disabled = false,
}: AddPackageDrawerProps) {
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
        {isEdit ? "Düzenle" : "Paket Ekle"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Paket Omurgası
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {isEdit ? "Paket Düzenle" : "Yeni Paket"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Model bazlı veya bağımsız paketleri kompakt şekilde yönet.
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

            <PackageDrawerForm
              key={`${defaults.id || "new"}-${formKey}`}
              defaults={defaults}
              isEdit={isEdit}
              availableModels={availableModels}
              onCancel={closeDrawer}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
