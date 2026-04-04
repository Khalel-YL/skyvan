"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { updateProductSourceBinding } from "./actions";
import type {
  ManufacturerSourceBindingOption,
  ProductSourceBindingActionState,
  ProductSourceBindingListItem,
} from "./types";

type Props = {
  binding: ProductSourceBindingListItem;
  sourceOptions: ManufacturerSourceBindingOption[];
};

const initialState: ProductSourceBindingActionState = {
  ok: false,
  message: "",
};

export function EditProductSourceBindingDrawer({
  binding,
  sourceOptions,
}: Props) {
  const [state, formAction] = useActionState(
    updateProductSourceBinding,
    initialState,
  );

  const dialogId = `edit-product-source-binding-dialog-${binding.id}`;

  useEffect(() => {
    if (!state.ok) return;

    const dialog = document.getElementById(dialogId) as HTMLDialogElement | null;
    dialog?.close();
  }, [dialogId, state.ok]);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          (
            document.getElementById(dialogId) as HTMLDialogElement | null
          )?.showModal()
        }
        className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-200 transition hover:bg-zinc-800"
      >
        Düzenle
      </button>

      <dialog
        id={dialogId}
        className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/70"
      >
        <form action={formAction} className="rounded-2xl bg-zinc-950 p-6">
          <input type="hidden" name="id" value={binding.id} />
          <input type="hidden" name="productId" value={binding.productId} />

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Binding Düzenle
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Kaynak bağının path, not, öncelik ve durum alanlarını güncelle.
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800"
              onClick={() =>
                (
                  document.getElementById(dialogId) as HTMLDialogElement | null
                )?.close()
              }
            >
              Kapat
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Kaynak
              </label>

              <select
                name="manufacturerSourceRegistryId"
                defaultValue={binding.manufacturerSourceRegistryId}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
              >
                {sourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.manufacturerName} • {option.domain}
                  </option>
                ))}
              </select>

              <FieldError
                errors={state.errors}
                name="manufacturerSourceRegistryId"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Path Hint
              </label>

              <input
                name="pathHint"
                defaultValue={binding.pathHint}
                placeholder="/downloads /products/solar /manuals"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />

              <FieldError errors={state.errors} name="pathHint" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Öncelik
              </label>

              <input
                name="priority"
                type="number"
                min={0}
                max={9999}
                defaultValue={binding.priority}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
              />

              <FieldError errors={state.errors} name="priority" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Durum
              </label>

              <select
                name="status"
                defaultValue={binding.status}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-700"
              >
                <option value="active">Aktif</option>
                <option value="draft">Taslak</option>
                <option value="archived">Arşiv</option>
              </select>

              <FieldError errors={state.errors} name="status" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Bağ Notu
              </label>

              <textarea
                name="bindingNotes"
                rows={4}
                defaultValue={binding.bindingNotes ?? ""}
                placeholder="Örn: Bu kaynak sadece Victron inverter PDF ve teknik sayfaları için izlenecek."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />

              <FieldError errors={state.errors} name="bindingNotes" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p
              className={`text-sm ${state.ok ? "text-green-400" : "text-red-400"}`}
            >
              {state.message}
            </p>

            <SubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const fieldErrors = errors?.[name];

  if (!fieldErrors?.length) {
    return null;
  }

  return <p className="mt-1 text-xs text-red-400">{fieldErrors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
    </button>
  );
}