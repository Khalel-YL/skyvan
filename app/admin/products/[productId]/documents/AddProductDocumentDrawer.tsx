"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProductDocument } from "./actions";
import { PRODUCT_DOCUMENT_TYPE_OPTIONS } from "./constants";
import type { ProductDocumentActionState } from "./types";

const initialState: ProductDocumentActionState = {
  ok: false,
  message: "",
};

function fieldError(
  errors: ProductDocumentActionState["errors"],
  key: string
) {
  return errors?.[key]?.[0];
}

export function AddProductDocumentDrawer({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFormKey((current) => current + 1);
          setIsOpen(true);
        }}
        className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white"
      >
        Belge Ekle
      </button>

      {isOpen ? (
        <ProductDocumentForm
          key={formKey}
          productId={productId}
          productName={productName}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}

function ProductDocumentForm({
  productId,
  productName,
  onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createProductDocument,
    initialState,
  );
  const values = state.values;
  const errors = state.fieldErrors ?? state.errors;
  const valuesKey = JSON.stringify(values ?? {});

  useEffect(() => {
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state.ok]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Product Documents
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  Yeni belge ekle
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{productName}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Kapat
              </button>
            </div>

            <form key={valuesKey} action={formAction} className="space-y-6 p-6">
              <input type="hidden" name="productId" value={productId} />

              {state.message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    state.ok
                      ? "border-green-800 bg-green-950 text-green-300"
                      : "border-red-900 bg-red-950 text-red-300"
                  }`}
                >
                  {state.message}
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Belge tipi
                  </label>
                  <select
                    name="type"
                    defaultValue={values?.type ?? PRODUCT_DOCUMENT_TYPE_OPTIONS[0].value}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  >
                    {PRODUCT_DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldError(errors, "type") ? (
                    <p className="text-xs text-red-400">
                      {fieldError(errors, "type")}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    Sıra
                  </label>
                  <input
                    name="sortOrder"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={values?.sortOrder ?? "0"}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                    placeholder="0"
                  />
                  {fieldError(errors, "sortOrder") ? (
                    <p className="text-xs text-red-400">
                      {fieldError(errors, "sortOrder")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Belge başlığı
                </label>
                <input
                  name="title"
                  type="text"
                  defaultValue={values?.title ?? ""}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  placeholder="Victron SmartSolar MPPT 150/70 Datasheet"
                />
                {fieldError(errors, "title") ? (
                  <p className="text-xs text-red-400">
                    {fieldError(errors, "title")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Belge linki
                </label>
                <input
                  name="url"
                  type="text"
                  defaultValue={values?.url ?? ""}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  placeholder="https://..."
                />
                <p className="text-xs text-zinc-500">
                  Başına http/https yazmasan bile sistem normalize eder.
                </p>
                {fieldError(errors, "url") ? (
                  <p className="text-xs text-red-400">
                    {fieldError(errors, "url")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Not
                </label>
                <textarea
                  name="note"
                  rows={4}
                  defaultValue={values?.note ?? ""}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  placeholder="Opsiyonel kısa açıklama, sürüm bilgisi veya teknik not..."
                />
                {fieldError(errors, "note") ? (
                  <p className="text-xs text-red-400">
                    {fieldError(errors, "note")}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Kaydediliyor..." : "Belgeyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}
