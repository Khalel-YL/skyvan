"use client";

import { useMemo, useState } from "react";
import { saveModel } from "./actions";
import type { ModelListItem, ModelStatus } from "./types";

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
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700";

export default function AddModelDrawer({
  initialData,
  disabled = false,
}: AddModelDrawerProps) {
  const isEdit = Boolean(initialData);
  const defaults = useMemo(() => toFormValues(initialData), [initialData]);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ModelStatus>(defaults.status);

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

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus(defaults.status);
          setIsOpen(true);
        }}
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
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Kapat
              </button>
            </div>

            <form action={saveModel} className="space-y-6 p-6">
              {isEdit ? <input type="hidden" name="id" value={defaults.id} /> : null}
              <input type="hidden" name="status" value={status} />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Model kodu"
                  hint="Örnek: VIC-MPPT-150/70 veya DUCATO-L4H3"
                >
                  <input
                    name="slug"
                    defaultValue={defaults.slug}
                    className={inputClassName}
                    placeholder="VIC-MPPT-150/70"
                  />
                </Field>

                <Field
                  label="Durum"
                  hint="Model yaşam döngüsünü kontrollü şekilde yönet."
                >
                  <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
                    <button
                      type="button"
                      onClick={() => setStatus("draft")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        status === "draft"
                          ? "border-zinc-600 bg-zinc-100 text-zinc-900"
                          : "bg-transparent text-zinc-300 hover:text-zinc-100"
                      }`}
                    >
                      Taslak
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("active")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        status === "active"
                          ? "border-zinc-600 bg-zinc-100 text-zinc-900"
                          : "bg-transparent text-zinc-300 hover:text-zinc-100"
                      }`}
                    >
                      Aktif
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("archived")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        status === "archived"
                          ? "border-zinc-600 bg-zinc-100 text-zinc-900"
                          : "bg-transparent text-zinc-300 hover:text-zinc-100"
                      }`}
                    >
                      Arşiv
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Boş ağırlık (kg)"
                  hint="Şasi boş ağırlığı."
                >
                  <input
                    name="baseWeightKg"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={defaults.baseWeightKg}
                    className={inputClassName}
                    placeholder="0"
                  />
                </Field>

                <Field
                  label="Max yük (kg)"
                  hint="Taşıma kapasitesi."
                >
                  <input
                    name="maxPayloadKg"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={defaults.maxPayloadKg}
                    className={inputClassName}
                    placeholder="0"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="Dingil mesafesi (mm)"
                  hint="Wheelbase"
                >
                  <input
                    name="wheelbaseMm"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={defaults.wheelbaseMm}
                    className={inputClassName}
                    placeholder="0"
                  />
                </Field>

                <Field
                  label="Tavan boyu (mm)"
                  hint="Opsiyonel"
                >
                  <input
                    name="roofLengthMm"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={defaults.roofLengthMm}
                    className={inputClassName}
                    placeholder="0"
                  />
                </Field>

                <Field
                  label="Tavan genişliği (mm)"
                  hint="Opsiyonel"
                >
                  <input
                    name="roofWidthMm"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={defaults.roofWidthMm}
                    className={inputClassName}
                    placeholder="0"
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
                Bu batch’te model omurgasını sade tutuyoruz. Gövde tipi,
                drivetrain, yakıt ve homologasyon alanlarını sonraki kontrollü
                aşamada açacağız.
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
                >
                  {isEdit ? "Modeli Güncelle" : "Modeli Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}