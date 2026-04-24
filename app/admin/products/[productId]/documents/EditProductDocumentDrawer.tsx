"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProductDocument } from "./actions";
import { PRODUCT_DOCUMENT_TYPE_OPTIONS } from "./constants";
import type {
  ProductDocumentActionState,
  ProductDocumentListItem,
} from "./types";

const initialState: ProductDocumentActionState = {
  ok: false,
  message: "",
};

function getFieldError(
  errors: ProductDocumentActionState["errors"],
  key: string
) {
  return errors?.[key]?.[0];
}

function getStatusLabel(status: ProductDocumentListItem["status"]) {
  switch (status) {
    case "draft":
      return "Taslak";
    case "active":
      return "Aktif";
    case "archived":
      return "Arşiv";
    default:
      return status;
  }
}

export function EditProductDocumentDrawer({
  document,
}: {
  document: ProductDocumentListItem;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductDocumentActionState>(initialState);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProductDocument(initialState, formData);
      setState(result);

      if (result.ok) {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState(initialState);
          setIsOpen(true);
        }}
        className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
      >
        Düzenle
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Product Documents
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
                  Belgeyi düzenle
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{document.title}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Kapat
              </button>
            </div>

            <form action={handleSubmit} className="space-y-6 p-6">
              <input type="hidden" name="id" value={document.id} />
              <input type="hidden" name="productId" value={document.productId} />

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
                    defaultValue={document.type}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  >
                    {PRODUCT_DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {getFieldError(state.errors, "type") ? (
                    <p className="text-xs text-red-400">
                      {getFieldError(state.errors, "type")}
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
                    defaultValue={String(document.sortOrder)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  />
                  {getFieldError(state.errors, "sortOrder") ? (
                    <p className="text-xs text-red-400">
                      {getFieldError(state.errors, "sortOrder")}
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
                  defaultValue={document.title}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                />
                {getFieldError(state.errors, "title") ? (
                  <p className="text-xs text-red-400">
                    {getFieldError(state.errors, "title")}
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
                  defaultValue={document.url}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                />
                {getFieldError(state.errors, "url") ? (
                  <p className="text-xs text-red-400">
                    {getFieldError(state.errors, "url")}
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
                  defaultValue={document.note ?? ""}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                />
                {getFieldError(state.errors, "note") ? (
                  <p className="text-xs text-red-400">
                    {getFieldError(state.errors, "note")}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
                Mevcut durum:{" "}
                <span className="font-medium text-zinc-200">
                  {getStatusLabel(document.status)}
                </span>
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
                  disabled={isPending}
                  className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
