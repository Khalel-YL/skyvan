"use client";

import { useActionState, useMemo, useState } from "react";

import { saveModel } from "./actions";
import { normalizeModelSlug } from "./slug";
import {
  initialModelFormState,
  type ModelFormState,
  type ModelListItem,
  type ModelStatus,
} from "./types";

type AddModelDrawerProps = {
  initialData?: ModelListItem | null;
  disabled?: boolean;
};

function toFormValues(initialData?: ModelListItem | null) {
  return {
    id: initialData?.id ?? "",
    slug: initialData?.slug ?? "",
    baseWeightKg: String(initialData?.baseWeightKg ?? ""),
    maxPayloadKg: String(initialData?.maxPayloadKg ?? ""),
    wheelbaseMm: String(initialData?.wheelbaseMm ?? ""),
    roofLengthMm: String(initialData?.roofLengthMm ?? ""),
    roofWidthMm: String(initialData?.roofWidthMm ?? ""),
    status: (initialData?.status ?? "draft") as ModelStatus,
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

function segmentedStatusClass(active: boolean) {
  return active
    ? "border-zinc-600 bg-zinc-100 text-zinc-900"
    : "bg-transparent text-zinc-300 hover:text-zinc-100";
}

function ModelDrawerForm({
  defaults,
  isEdit,
  onCancel,
}: {
  defaults: ReturnType<typeof toFormValues>;
  isEdit: boolean;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ModelFormState, FormData>(
    saveModel,
    initialModelFormState,
  );
  const [status, setStatus] = useState<ModelStatus>(defaults.status);
  const [slugInput, setSlugInput] = useState(defaults.slug);

  const normalizedSlug = useMemo(() => normalizeModelSlug(slugInput), [slugInput]);

  return (
    <form action={formAction} className="space-y-6 p-6">
      {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="status" value={status} />

      {state.message ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Model kodu"
          hint="Örnek: DUCATO-L4H3 veya TRANSIT-L3H3. Kod kayıt sırasında standartlaştırılır."
          error={state.fieldErrors.slug}
        >
          <div className="space-y-2">
            <input
              name="slug"
              value={slugInput}
              onChange={(event) => setSlugInput(event.target.value)}
              className={inputClassName}
              placeholder="DUCATO-L4H3"
              aria-invalid={Boolean(state.fieldErrors.slug)}
            />

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1">
                Sistem kodu: {normalizedSlug || "—"}
              </span>

              {!isEdit ? (
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1">
                  Çakışmada otomatik ek: -2 / -3
                </span>
              ) : null}
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
          label="Durum"
          hint="Model yaşam döngüsünü kontrollü şekilde yönet."
          error={state.fieldErrors.status}
        >
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setStatus("draft")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedStatusClass(
                status === "draft",
              )}`}
            >
              Taslak
            </button>

            <button
              type="button"
              onClick={() => setStatus("active")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedStatusClass(
                status === "active",
              )}`}
            >
              Aktif
            </button>

            <button
              type="button"
              onClick={() => setStatus("archived")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${segmentedStatusClass(
                status === "archived",
              )}`}
            >
              Arşiv
            </button>
          </div>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Boş ağırlık (kg)"
          hint="Şasi boş ağırlığı. Ondalık değer desteklenir."
          error={state.fieldErrors.baseWeightKg}
        >
          <input
            name="baseWeightKg"
            type="number"
            min="500"
            max="10000"
            step="0.01"
            defaultValue={defaults.baseWeightKg}
            className={inputClassName}
            placeholder="3500"
            aria-invalid={Boolean(state.fieldErrors.baseWeightKg)}
          />
        </Field>

        <Field
          label="Max yük (kg)"
          hint="Taşıma kapasitesi. Ondalık değer desteklenir."
          error={state.fieldErrors.maxPayloadKg}
        >
          <input
            name="maxPayloadKg"
            type="number"
            min="100"
            max="10000"
            step="0.01"
            defaultValue={defaults.maxPayloadKg}
            className={inputClassName}
            placeholder="1450"
            aria-invalid={Boolean(state.fieldErrors.maxPayloadKg)}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="Dingil mesafesi (mm)"
          hint="Ön ve arka aks arası mesafe."
          error={state.fieldErrors.wheelbaseMm}
        >
          <input
            name="wheelbaseMm"
            type="number"
            min="1800"
            max="6000"
            step="1"
            defaultValue={defaults.wheelbaseMm}
            className={inputClassName}
            placeholder="4035"
            aria-invalid={Boolean(state.fieldErrors.wheelbaseMm)}
          />
        </Field>

        <Field
          label="Tavan boyu (mm)"
          hint="Opsiyonel"
          error={state.fieldErrors.roofLengthMm}
        >
          <input
            name="roofLengthMm"
            type="number"
            min="1000"
            max="10000"
            step="1"
            defaultValue={defaults.roofLengthMm}
            className={inputClassName}
            placeholder="3705"
            aria-invalid={Boolean(state.fieldErrors.roofLengthMm)}
          />
        </Field>

        <Field
          label="Tavan genişliği (mm)"
          hint="Opsiyonel"
          error={state.fieldErrors.roofWidthMm}
        >
          <input
            name="roofWidthMm"
            type="number"
            min="500"
            max="4000"
            step="1"
            defaultValue={defaults.roofWidthMm}
            className={inputClassName}
            placeholder="1870"
            aria-invalid={Boolean(state.fieldErrors.roofWidthMm)}
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
        Yeni kayıtta aynı kod varsa sistem sonraki güvenli varyantı önerir.
        Düzenlemede kod kontrolü bilinçli olarak sende kalır.
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
              ? "Modeli Güncelle"
              : "Modeli Kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AddModelDrawer({
  initialData,
  disabled = false,
}: AddModelDrawerProps) {
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
        {isEdit ? "Düzenle" : "Model Ekle"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Models
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  {isEdit ? "Model Düzenle" : "Yeni Araç Modeli"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Şasi, taşıma kapasitesi ve görünür yüzey ölçülerini sade ve
                  kontrollü şekilde yönet.
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

            <ModelDrawerForm
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
